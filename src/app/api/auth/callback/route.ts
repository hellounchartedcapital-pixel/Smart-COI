import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createServiceClient } from '@/lib/supabase/service';
import { SESSION_COOKIE_NAME } from '@/lib/session';
import { captureServerEvent } from '@/lib/posthog-server';

/** Default session cookie max-age for new signups (24 hours). */
const DEFAULT_SESSION_MAX_AGE = 24 * 60 * 60;

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type');

  if (!code && !tokenHash) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // ---------------------------------------------------------------------------
  // Create a Supabase client that captures auth cookies onto the final response.
  //
  // `createClient()` from `@/lib/supabase/server` uses `cookies()` from
  // next/headers, which writes into the *implicit* response. Route Handlers
  // that return their own `NextResponse.redirect()` bypass that implicit
  // response, so the Supabase auth tokens (access_token, refresh_token) are
  // lost — the browser never receives them. On the next request the middleware
  // sees `smartcoi-session` but Supabase has no auth tokens → getUser() returns
  // null → redirect to /login with "session expired".
  //
  // Instead we capture every cookie Supabase wants to set and replay them onto
  // whatever redirect response we eventually return.
  // ---------------------------------------------------------------------------

  const pendingCookies: { name: string; value: string; options: Record<string, unknown> }[] = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach((cookie) => pendingCookies.push(cookie));
        },
      },
    }
  );

  // Handle both PKCE (code) and token-hash (email link) flows
  if (code) {
    const { error: codeError } = await supabase.auth.exchangeCodeForSession(code);
    if (codeError) {
      console.error('Auth callback: code exchange failed', codeError.message);
      return NextResponse.redirect(`${origin}/login`);
    }
  } else if (tokenHash) {
    const { error: verifyError } = await supabase.auth.verifyOtp({
      token_hash: tokenHash,
      type: (type as 'signup' | 'recovery' | 'email') || 'signup',
    });
    if (verifyError) {
      console.error('Auth callback: OTP verify failed', verifyError.message);
      return NextResponse.redirect(`${origin}/login`);
    }
  }

  /** Create a redirect response with all Supabase auth cookies + the session cookie. */
  function redirectWithSession(destination: string) {
    const res = NextResponse.redirect(destination);

    // Replay Supabase auth cookies (access token, refresh token, etc.)
    for (const { name, value, options } of pendingCookies) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      res.cookies.set(name, value, options as any);
    }

    // Set our own session marker cookie
    res.cookies.set(SESSION_COOKIE_NAME, '1', {
      path: '/',
      maxAge: DEFAULT_SESSION_MAX_AGE,
      sameSite: 'lax',
      secure: new URL(destination).protocol === 'https:',
    });

    return res;
  }

  // Password recovery — redirect to reset password page
  if (type === 'recovery') {
    return redirectWithSession(`${origin}/reset-password`);
  }

  // Session is now established — determine where to send the user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login`);
  }

  // Use service client to check/create profile (avoids RLS chicken-and-egg)
  const service = createServiceClient();

  // Check if user profile exists
  const { data: profile } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (!profile?.organization_id) {
    // Profile doesn't exist yet — create org + profile now
    // (handles the case where signup created the auth user but org/profile
    // creation was deferred because email confirmation was required)
    try {
      // Re-check to guard against race conditions (e.g., user double-clicks
      // confirmation link, triggering two concurrent callbacks)
      const { data: recheck } = await service
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (recheck?.organization_id) {
        // Another callback already created the profile — skip to redirect
        return redirectWithSession(`${origin}/setup`);
      }

      const rawName = String(user.user_metadata?.full_name ?? '');
      // Sanitize: strip HTML tags and truncate to 100 characters
      const fullName = rawName.replace(/<[^>]*>/g, '').trim().slice(0, 100);
      const email = user.email ?? '';

      const trialEndsAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
      const { data: org, error: orgError } = await service
        .from('organizations')
        .insert({
          name: `${fullName}'s Organization`,
          plan: 'trial',
          trial_ends_at: trialEndsAt,
        })
        .select('id')
        .single();

      if (orgError) throw orgError;

      const { error: profileError } = await service
        .from('users')
        .insert({
          id: user.id,
          organization_id: org.id,
          email,
          full_name: fullName,
          role: 'manager',
        });

      // If profile insert fails due to unique constraint (race condition),
      // another callback already created the profile — that's OK
      if (profileError && !profileError.message?.includes('duplicate key')) {
        throw profileError;
      }

      // Send welcome email only if we actually created the profile
      if (!profileError) {
        captureServerEvent(email, 'signup_completed');
        sendWelcomeEmail(email, fullName).catch((err) =>
          console.error('Welcome email failed:', err)
        );
      }
    } catch (err) {
      console.error('Auth callback: org/profile creation failed', err);
      // Still redirect to setup — it will retry org creation
    }

    return redirectWithSession(`${origin}/setup`);
  }

  // Profile exists — check if onboarding is completed
  const { data: org } = await service
    .from('organizations')
    .select('settings')
    .eq('id', profile.organization_id)
    .single();

  const onboardingCompleted = org?.settings?.onboarding_completed === true;

  return redirectWithSession(
    `${origin}${onboardingCompleted ? '/dashboard' : '/setup'}`
  );
}

/**
 * Send welcome email via the existing email sender.
 * Imported dynamically to keep the route handler lean.
 */
async function sendWelcomeEmail(email: string, fullName: string) {
  const { sendNotificationEmail } = await import('@/lib/notifications/email-sender');
  const { welcomeEmail } = await import('@/lib/notifications/email-templates');

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'https://smartcoi.io';
  const template = welcomeEmail({ user_name: fullName, setup_link: `${appUrl}/setup` });

  await sendNotificationEmail(email, template.subject, template.html);
}
