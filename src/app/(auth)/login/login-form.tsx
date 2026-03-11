'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  setRememberMe,
  getRememberMe,
  setLoginTime,
  updateLastActive,
  setSessionCookie,
} from '@/lib/session';

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get('next') ?? '/dashboard';
  const sessionMessage = searchParams.get('message');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMeState] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Hydrate remember-me preference from localStorage
  useEffect(() => {
    setRememberMeState(getRememberMe());
  }, []);

  async function handleGoogleLogin() {
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

  async function handleForgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setForgotLoading(true);
    try {
      const supabase = createClient();
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        forgotEmail,
        { redirectTo: `${window.location.origin}/api/auth/callback?type=recovery` }
      );
      if (resetError) {
        setError(resetError.message);
      } else {
        setForgotSuccess(true);
      }
    } catch {
      setError('Failed to send reset email.');
    } finally {
      setForgotLoading(false);
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const supabase = createClient();

      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        if (authError.message === 'Invalid login credentials') {
          setError('Invalid email or password. Please try again.');
        } else {
          setError(authError.message);
        }
        setLoading(false);
        return;
      }

      // Store session preferences and set the server-readable session cookie
      setRememberMe(rememberMe);
      setSessionCookie(rememberMe);
      setLoginTime();
      updateLastActive();

      // If no explicit `next` was given, check onboarding status to route new
      // users to /setup instead of /dashboard
      let destination = next;
      if (!searchParams.get('next')) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            const { data: profile } = await supabase
              .from('users')
              .select('organization_id')
              .eq('id', authUser.id)
              .single();

            if (profile?.organization_id) {
              const { data: org } = await supabase
                .from('organizations')
                .select('settings')
                .eq('id', profile.organization_id)
                .single();

              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              if (!(org?.settings as any)?.onboarding_completed) {
                destination = '/setup';
              }
            } else {
              // No org yet — definitely needs onboarding
              destination = '/setup';
            }
          }
        } catch {
          // If check fails, fall through to default destination
        }
      }

      router.push(destination);
      router.refresh();
    } catch {
      setError('An unexpected error occurred. Please try again.');
      setLoading(false);
    }
  }

  // Forgot password mode
  if (forgotMode) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            Reset your password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        {forgotSuccess ? (
          <div className="space-y-4">
            <div className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              Check your email for a password reset link.
            </div>
            <button
              type="button"
              onClick={() => { setForgotMode(false); setForgotSuccess(false); setError(null); }}
              className="text-sm font-medium text-foreground underline-offset-4 hover:underline"
            >
              Back to sign in
            </button>
          </div>
        ) : (
          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="forgotEmail">Email</Label>
              <Input
                id="forgotEmail"
                type="email"
                placeholder="you@company.com"
                value={forgotEmail}
                onChange={(e) => setForgotEmail(e.target.value)}
                required
                autoComplete="email"
                autoFocus
              />
            </div>

            {error && (
              <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full font-semibold" disabled={forgotLoading}>
              {forgotLoading ? 'Sending...' : 'Send reset link'}
            </Button>

            <button
              type="button"
              onClick={() => { setForgotMode(false); setError(null); }}
              className="w-full text-center text-sm text-muted-foreground hover:text-foreground"
            >
              Back to sign in
            </button>
          </form>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">
          Welcome back
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Sign in to your SmartCOI account.
        </p>
      </div>

      {sessionMessage && (
        <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          {sessionMessage}
        </div>
      )}

      {/* Google OAuth */}
      <Button
        type="button"
        variant="outline"
        className="w-full font-semibold"
        disabled={googleLoading || loading}
        onClick={handleGoogleLogin}
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

      <form onSubmit={handleLogin} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <button
              type="button"
              onClick={() => { setForgotMode(true); setForgotEmail(email); setError(null); }}
              className="text-xs font-medium text-emerald-600 hover:text-emerald-700"
            >
              Forgot password?
            </button>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            id="rememberMe"
            type="checkbox"
            checked={rememberMe}
            onChange={(e) => setRememberMeState(e.target.checked)}
            className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
          />
          <Label htmlFor="rememberMe" className="text-sm font-normal text-muted-foreground cursor-pointer">
            Remember me for 7 days
          </Label>
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
          {loading ? 'Signing in\u2026' : 'Sign in'}
        </Button>
      </form>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link
          href="/signup"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
