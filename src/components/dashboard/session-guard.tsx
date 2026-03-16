'use client';

import { useEffect, useCallback, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
  initSessionIfNeeded,
  updateLastActive,
  checkSession,
  signOutWithSessionExpiry,
} from '@/lib/session';

/**
 * SessionGuard — renders nothing visible.
 *
 * 1. On mount and every route change, checks if the session has expired
 *    based on last-activity timestamps. If expired, signs out the user
 *    with a redirect to /login?message=...
 *
 * 2. Tracks user activity (clicks, keydowns, navigation) and updates
 *    `last_active_at` in localStorage, throttled to once per minute.
 */
export function SessionGuard() {
  const pathname = usePathname();

  // Track whether we are in the process of signing out to prevent
  // activity tracking from re-setting timestamps after clearSessionState().
  const signingOut = useRef(false);

  const runSessionCheck = useCallback(() => {
    if (signingOut.current) return;
    // Seed localStorage for sessions established via server-side redirects
    // (Google OAuth, password reset) where the login form was bypassed.
    initSessionIfNeeded();
    const status = checkSession();
    if (!status.valid) {
      signingOut.current = true;
      const message =
        status.reason === 'absolute_expired'
          ? 'Your session expired for security. Please log in again.'
          : 'Your session expired due to inactivity. Please log in again.';
      signOutWithSessionExpiry(message).catch(() => {
        // Fallback: redirect even if sign-out fails
        window.location.href = '/login?message=' + encodeURIComponent(message);
      });
    }
  }, []);

  // Check session on mount and on every route change
  useEffect(() => {
    runSessionCheck();
  }, [pathname, runSessionCheck]);

  // Track user activity — throttled updates via updateLastActive()
  useEffect(() => {
    // Only start tracking after confirming the session is valid
    if (signingOut.current) return;
    updateLastActive();

    function handleActivity() {
      if (!signingOut.current) updateLastActive();
    }

    window.addEventListener('click', handleActivity, { passive: true });
    window.addEventListener('keydown', handleActivity, { passive: true });
    window.addEventListener('scroll', handleActivity, { passive: true });

    return () => {
      window.removeEventListener('click', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      window.removeEventListener('scroll', handleActivity);
    };
  }, []);

  // Periodic check every 60 seconds while the tab is active
  useEffect(() => {
    const interval = setInterval(() => {
      runSessionCheck();
    }, 60_000);
    return () => clearInterval(interval);
  }, [runSessionCheck]);

  return null;
}
