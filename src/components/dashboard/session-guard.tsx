'use client';

import { useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import {
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

  const runSessionCheck = useCallback(() => {
    const status = checkSession();
    if (!status.valid) {
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
    // Record initial activity on mount
    updateLastActive();

    function handleActivity() {
      updateLastActive();
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
