import { PostHog } from 'posthog-node';

let posthogClient: PostHog | null = null;

/**
 * Get a server-side PostHog client (singleton).
 * Returns null if NEXT_PUBLIC_POSTHOG_KEY is not set.
 */
export function getPostHogServer(): PostHog | null {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(key, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com',
      flushAt: 1,
      flushInterval: 0,
    });
  }

  return posthogClient;
}

/**
 * Capture a server-side event. No-op if PostHog is not configured.
 */
export function captureServerEvent(
  distinctId: string,
  event: string,
  properties?: Record<string, unknown>
) {
  const client = getPostHogServer();
  if (!client) return;
  client.capture({ distinctId, event, properties });
}
