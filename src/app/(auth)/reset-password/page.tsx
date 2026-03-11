'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) {
        setError(updateError.message);
        return;
      }
      router.push('/dashboard');
      router.refresh();
    } catch {
      setError('Failed to update password.');
    } finally {
      setLoading(false);
    }
  }

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
            Set a new password
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose a new password for your SmartCOI account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="password">New password</Label>
            <Input
              id="password"
              type="password"
              placeholder="At least 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="new-password"
              autoFocus
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirm new password</Label>
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

          <Button type="submit" className="w-full font-semibold" disabled={loading}>
            {loading ? 'Updating...' : 'Update password'}
          </Button>
        </form>
      </div>
    </>
  );
}
