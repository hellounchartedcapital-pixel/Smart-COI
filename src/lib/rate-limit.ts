/**
 * Simple in-memory rate limiter for server-side use.
 * Tracks request counts per key (typically IP address) within a sliding window.
 *
 * Note: This resets on server restart and is per-instance (not shared across
 * Vercel serverless functions). It provides basic protection against automated
 * scanning but is not a substitute for infrastructure-level rate limiting.
 */

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const store = new Map<string, RateLimitEntry>();

// Periodically clean up expired entries to prevent memory leaks
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  for (const [key, entry] of store) {
    if (entry.resetAt <= now) store.delete(key);
  }
}

/**
 * Check if a request should be rate limited.
 *
 * @param key - Unique identifier (e.g., IP address)
 * @param limit - Max requests allowed in the window
 * @param windowMs - Time window in milliseconds (default: 60s)
 * @returns `{ limited: false }` if allowed, `{ limited: true, retryAfterMs }` if blocked
 */
export function checkRateLimit(
  key: string,
  limit: number,
  windowMs = 60_000,
): { limited: false } | { limited: true; retryAfterMs: number } {
  cleanup();

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { limited: false };
  }

  entry.count++;
  if (entry.count > limit) {
    return { limited: true, retryAfterMs: entry.resetAt - now };
  }

  return { limited: false };
}
