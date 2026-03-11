'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { createOrgAfterSignup } from '@/lib/actions/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SignUpPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  // Email confirmation state
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [confirmedEmail, setConfirmedEmail] = useState('');
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);

  async function handleGoogleSignUp() {
    setError(null);
    setGoogleLoading(true);
    try {
      const supabase = createClient();
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (oauthError) {
        setError(oauthError.message);
        setGoogleLoading(false);
      }
    } catch {
      setError('Failed to start Google sign-in.');
      setGoogleLoading(false);
    }
  }

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      // 1. Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (!authData.user) {
        setError('Sign up failed. Please try again.');
        setLoading(false);
        return;
      }

      // 2. Check if email confirmation is required
      //    When confirmation is needed, authData.session will be null
      if (!authData.session) {
        // Email confirmation required — show the confirmation screen
        // Org/profile creation will happen in the auth callback after confirmation
        setConfirmedEmail(email);
        setConfirmationSent(true);
        setLoading(false);
        return;
      }

      // 3. Session established (auto-confirm enabled) — create org now
      try {
        await createOrgAfterSignup(authData.user.id, email, fullName);
      } catch (setupErr) {
        console.error('Org setup error:', setupErr);
        setError('Account created but failed to set up organization. Please try logging in or contact support.');
        setLoading(false);
        return;
      }

      // 4. Redirect to onboarding setup
      router.push('/setup');
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  async function handleResendConfirmation() {
    setResending(true);
    setResendSuccess(false);
    setError(null);
    try {
      const supabase = createClient();
      const { error: resendError } = await supabase.auth.resend({
        type: 'signup',
        email: confirmedEmail,
        options: {
          emailRedirectTo: `${window.location.origin}/api/auth/callback`,
        },
      });
      if (resendError) {
        setError(resendError.message);
      } else {
        setResendSuccess(true);
      }
    } catch {
      setError('Failed to resend confirmation email.');
    } finally {
      setResending(false);
    }
  }

  // ---- Confirmation sent screen ----
  if (confirmationSent) {
    return (
      <>
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo-icon.svg" alt="SmartCOI" className="h-9 w-9" />
          <span className="text-lg font-bold text-foreground">SmartCOI</span>
        </div>

        <div className="space-y-6">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100">
              <svg
                className="h-7 w-7 text-emerald-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="2" y="4" width="20" height="16" rx="2" />
                <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">
              Check your email
            </h2>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              We&apos;ve sent a confirmation link to{' '}
              <span className="font-medium text-foreground">{confirmedEmail}</span>.
              <br />
              Click the link to activate your account and get started.
            </p>
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          {resendSuccess && (
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Confirmation email resent. Check your inbox.
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
            <p className="text-xs text-muted-foreground leading-relaxed">
              Didn&apos;t receive it? Check your spam folder, or{' '}
              <button
                onClick={handleResendConfirmation}
                disabled={resending}
                className="font-medium text-emerald-600 hover:text-emerald-700 underline underline-offset-2 disabled:opacity-50"
              >
                {resending ? 'Resending...' : 'click here to resend'}
              </button>
              .
            </p>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Wrong email?{' '}
            <button
              onClick={() => {
                setConfirmationSent(false);
                setResendSuccess(false);
              }}
              className="font-medium text-foreground underline-offset-4 hover:underline"
            >
              Go back
            </button>
          </p>
        </div>
      </>
    );
  }

  // ---- Signup form ----
  return (
    <>
      {/* Mobile logo */}
      <div className="mb-8 flex items-center gap-3 lg:hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo-icon.svg" alt="SmartCOI" className="h-9 w-9" />
        <span className="text-lg font-bold text-foreground">SmartCOI</span>
      </div>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Create your account
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Get started with SmartCOI in seconds.
          </p>
        </div>

        {/* Google OAuth */}
        <Button
          type="button"
          variant="outline"
          className="w-full font-semibold"
          disabled={googleLoading || loading}
          onClick={handleGoogleSignUp}
        >
          <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          {googleLoading ? 'Redirecting...' : 'Continue with Google'}
        </Button>

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-200" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">or</span>
          </div>
        </div>

        <form onSubmit={handleSignUp} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Full name</Label>
            <Input
              id="fullName"
              type="text"
              placeholder="Jane Smith"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              autoComplete="name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Re-enter your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            className="w-full font-semibold"
            disabled={loading || googleLoading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{' '}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Sign in
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          <Link href="/terms" className="underline-offset-2 hover:underline">Terms of Service</Link>
          {' '}&middot;{' '}
          <Link href="/privacy" className="underline-offset-2 hover:underline">Privacy Policy</Link>
        </p>
      </div>
    </>
  );
}
