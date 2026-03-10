'use client';

import posthog from 'posthog-js';
import { PostHogProvider as PHProvider, usePostHog } from 'posthog-js/react';
import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

/**
 * Initialize PostHog once (idempotent).
 * Only runs in the browser and only when the env var is set.
 */
function initPostHog() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST;
  if (!key || typeof window === 'undefined') return;

  if (!posthog.__loaded) {
    posthog.init(key, {
      api_host: host || 'https://us.i.posthog.com',
      capture_pageview: false, // handled by PageviewTracker below
      capture_pageleave: true,
      autocapture: true,
      respect_dnt: true,
    });
  }
}

/**
 * Track pageviews on route changes (App Router compatible).
 */
function PageviewTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ph = usePostHog();

  useEffect(() => {
    if (pathname && ph) {
      let url = window.origin + pathname;
      const search = searchParams.toString();
      if (search) url += '?' + search;
      ph.capture('$pageview', { $current_url: url });
    }
  }, [pathname, searchParams, ph]);

  return null;
}

/**
 * PostHog analytics provider — wraps children with the PostHog context.
 * Only initializes when NEXT_PUBLIC_POSTHOG_KEY is set.
 *
 * Props:
 *  - userEmail / userName: identify the authenticated user in PostHog
 */
export function PostHogProvider({
  children,
  userEmail,
  userName,
}: {
  children: React.ReactNode;
  userEmail?: string;
  userName?: string;
}) {
  useEffect(() => {
    initPostHog();
  }, []);

  // Identify the user once PostHog is loaded
  useEffect(() => {
    if (userEmail && posthog.__loaded) {
      posthog.identify(userEmail, {
        email: userEmail,
        name: userName || undefined,
      });
    }
  }, [userEmail, userName]);

  if (!process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    return <>{children}</>;
  }

  return (
    <PHProvider client={posthog}>
      <PageviewTracker />
      {children}
    </PHProvider>
  );
}
