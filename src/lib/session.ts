import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Constants
// ============================================================================

const LAST_ACTIVE_KEY = 'smartcoi-last-active-at';
const REMEMBER_ME_KEY = 'smartcoi-remember-me';
const LOGIN_TIME_KEY = 'smartcoi-login-time';
const THROTTLE_INTERVAL_MS = 60_000; // 1 minute

/** Cookie name used as a server-readable session marker. */
export const SESSION_COOKIE_NAME = 'smartcoi-session';

/** Session timeout for standard mode (24 hours in ms). */
const STANDARD_TIMEOUT_MS = 24 * 60 * 60 * 1000;

/** Session timeout for "remember me" mode (7 days in ms). */
const REMEMBER_ME_TIMEOUT_MS = 7 * 24 * 60 * 60 * 1000;

/** Absolute max session age — force logout regardless of activity (7 days). */
const ABSOLUTE_MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000;

/** Standard session max-age in seconds (for cookie). */
const STANDARD_COOKIE_MAX_AGE = 24 * 60 * 60; // 24 hours

/** Remember-me session max-age in seconds (for cookie). */
const REMEMBER_ME_COOKIE_MAX_AGE = 7 * 24 * 60 * 60; // 7 days

// ============================================================================
// Session cookie — server-readable marker for middleware
// ============================================================================

/**
 * Set the session cookie after login. The cookie auto-expires based on
 * the remember-me preference, allowing middleware to detect expired sessions
 * without relying on client-side localStorage.
 */
export function setSessionCookie(rememberMe: boolean): void {
  const maxAge = rememberMe ? REMEMBER_ME_COOKIE_MAX_AGE : STANDARD_COOKIE_MAX_AGE;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${SESSION_COOKIE_NAME}=1; path=/; max-age=${maxAge}; SameSite=Lax${secure}`;
}

/**
 * Clear the session cookie (on sign-out or session expiry).
 */
export function clearSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE_NAME}=; path=/; max-age=0; SameSite=Lax`;
}

// ============================================================================
// Activity tracking
// ============================================================================

let lastUpdateTime = 0;

/**
 * Update the last-active timestamp in localStorage.
 * Throttled to at most once per minute to avoid performance issues.
 */
export function updateLastActive(): void {
  const now = Date.now();
  if (now - lastUpdateTime < THROTTLE_INTERVAL_MS) return;
  lastUpdateTime = now;
  try {
    localStorage.setItem(LAST_ACTIVE_KEY, String(now));
  } catch {
    // localStorage may be unavailable (private browsing, quota exceeded)
  }
}

// ============================================================================
// Session initialization (OAuth / server-side redirect flows)
// ============================================================================

/**
 * Seed localStorage session state when it's missing but the session cookie
 * exists. This happens after OAuth redirects (Google login) and password-reset
 * flows where the server sets the session cookie but client-side localStorage
 * is never initialized (the login form is bypassed entirely).
 *
 * Call this before the first `checkSession()` to prevent false expiration.
 */
export function initSessionIfNeeded(): void {
  try {
    const hasSessionCookie = document.cookie
      .split('; ')
      .some((c) => c.startsWith(`${SESSION_COOKIE_NAME}=`));

    if (hasSessionCookie && !localStorage.getItem(LAST_ACTIVE_KEY)) {
      const now = String(Date.now());
      localStorage.setItem(LAST_ACTIVE_KEY, now);
      localStorage.setItem(LOGIN_TIME_KEY, new Date().toISOString());
      // Default to standard 24h timeout for OAuth sessions (no remember-me
      // checkbox in the OAuth flow). Don't overwrite if already set.
      if (!localStorage.getItem(REMEMBER_ME_KEY)) {
        localStorage.setItem(REMEMBER_ME_KEY, 'false');
      }
    }
  } catch {
    // localStorage may be unavailable
  }
}

// ============================================================================
// Session checks
// ============================================================================

export type SessionStatus =
  | { valid: true }
  | { valid: false; reason: 'expired' | 'absolute_expired' };

/**
 * Check whether the current session is still valid based on inactivity.
 *
 * - If "remember me" is enabled, the inactivity timeout is 7 days.
 * - Otherwise the inactivity timeout is 24 hours.
 * - If last_active_at is missing or > 7 days ago, the session is always expired.
 */
export function checkSession(): SessionStatus {
  const lastActiveStr = localStorage.getItem(LAST_ACTIVE_KEY);

  // No activity timestamp at all — treat as absolute expiration
  if (!lastActiveStr) {
    return { valid: false, reason: 'absolute_expired' };
  }

  const lastActive = Number(lastActiveStr);
  if (isNaN(lastActive)) {
    return { valid: false, reason: 'absolute_expired' };
  }

  const elapsed = Date.now() - lastActive;

  // Absolute 7-day expiration regardless of remember-me setting
  if (elapsed > ABSOLUTE_MAX_SESSION_MS) {
    return { valid: false, reason: 'absolute_expired' };
  }

  // Inactivity-based timeout
  const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  const timeout = rememberMe ? REMEMBER_ME_TIMEOUT_MS : STANDARD_TIMEOUT_MS;

  if (elapsed > timeout) {
    return { valid: false, reason: 'expired' };
  }

  return { valid: true };
}

// ============================================================================
// Remember me preference
// ============================================================================

export function setRememberMe(value: boolean): void {
  try {
    localStorage.setItem(REMEMBER_ME_KEY, String(value));
  } catch {
    // ignore
  }
}

export function getRememberMe(): boolean {
  try {
    return localStorage.getItem(REMEMBER_ME_KEY) === 'true';
  } catch {
    return false;
  }
}

// ============================================================================
// Login time tracking
// ============================================================================

export function setLoginTime(): void {
  try {
    localStorage.setItem(LOGIN_TIME_KEY, new Date().toISOString());
  } catch {
    // ignore
  }
}

export function getLoginTime(): string | null {
  try {
    return localStorage.getItem(LOGIN_TIME_KEY);
  } catch {
    return null;
  }
}

// ============================================================================
// Session cleanup & sign out
// ============================================================================

/**
 * Clear all session-related localStorage keys and the session cookie.
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
  } catch {
    // ignore
  }
  clearSessionCookie();
}

/**
 * Sign out the current user, clear session state, and redirect to login
 * with an optional message.
 */
export async function signOutWithSessionExpiry(
  message?: string
): Promise<void> {
  clearSessionState();
  const supabase = createClient();
  await supabase.auth.signOut();
  const url = new URL('/login', window.location.origin);
  if (message) {
    url.searchParams.set('message', message);
  }
  window.location.href = url.toString();
}

/**
 * Sign out from all devices (global sign out).
 */
export async function signOutAllDevices(): Promise<void> {
  clearSessionState();
  const supabase = createClient();
  await supabase.auth.signOut({ scope: 'global' });
  window.location.href = '/login';
}
