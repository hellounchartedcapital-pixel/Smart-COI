import { createClient } from '@/lib/supabase/client';

// ============================================================================
// Constants
// ============================================================================

const LAST_ACTIVE_KEY = 'smartcoi-last-active-at';
const REMEMBER_ME_KEY = 'smartcoi-remember-me';
const LOGIN_TIME_KEY = 'smartcoi-login-time';
const THROTTLE_INTERVAL_MS = 60_000; // 1 minute

/** Session timeout for "remember me" mode (30 days in ms). */
const REMEMBER_ME_TIMEOUT_MS = 30 * 24 * 60 * 60 * 1000;

/** Session timeout for standard mode (8 hours in ms). */
const STANDARD_TIMEOUT_MS = 8 * 60 * 60 * 1000;

/** Absolute max session age — force logout regardless of activity (30 days). */
const ABSOLUTE_MAX_SESSION_MS = 30 * 24 * 60 * 60 * 1000;

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
// Session checks
// ============================================================================

export type SessionStatus =
  | { valid: true }
  | { valid: false; reason: 'expired' | 'absolute_expired' };

/**
 * Check whether the current session is still valid based on inactivity.
 *
 * - If "remember me" is enabled, the inactivity timeout is 30 days.
 * - Otherwise the inactivity timeout is 8 hours.
 * - If last_active_at is missing or > 30 days ago, the session is always expired.
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

  // Absolute 30-day expiration regardless of remember-me setting
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
    return localStorage.getItem(REMEMBER_ME_KEY) !== 'false';
  } catch {
    return true; // default to remembered
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
 * Clear all session-related localStorage keys.
 */
export function clearSessionState(): void {
  try {
    localStorage.removeItem(LAST_ACTIVE_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
    localStorage.removeItem(LOGIN_TIME_KEY);
  } catch {
    // ignore
  }
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
