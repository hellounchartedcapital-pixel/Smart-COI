// ---------------------------------------------------------------------------
// Plan status helpers — shared between server actions and client components
// ---------------------------------------------------------------------------

export type PlanReason = 'active' | 'trial_expired' | 'canceled' | 'payment_failed';

export interface PlanStatus {
  isActive: boolean;
  reason: PlanReason;
}

/**
 * Determine whether an org has an active (usable) plan.
 *
 * Active if:
 *   - plan is starter, growth, or professional AND payment not failed
 *   - plan is trial AND trial_ends_at is in the future
 *
 * Inactive if:
 *   - plan is trial AND trial_ends_at is in the past or null
 *   - plan is canceled
 *   - paid plan with payment_failed flag set
 */
export function getActivePlanStatus(org: {
  plan: string;
  trial_ends_at: string | null;
  payment_failed?: boolean;
}): PlanStatus {
  const { plan, trial_ends_at, payment_failed } = org;

  if (plan === 'canceled') {
    return { isActive: false, reason: 'canceled' };
  }

  if (plan === 'trial') {
    const isValid =
      trial_ends_at != null && new Date(trial_ends_at) > new Date();
    return isValid
      ? { isActive: true, reason: 'active' }
      : { isActive: false, reason: 'trial_expired' };
  }

  // Paid plan with failed payment — restrict access
  if (payment_failed) {
    return { isActive: false, reason: 'payment_failed' };
  }

  // starter, growth, professional, or any paid plan
  return { isActive: true, reason: 'active' };
}

/**
 * Machine-readable tag embedded in error messages thrown by plan-gated server
 * actions.  The client checks for this tag (not a human-readable prefix) so
 * that detection is resilient to copy changes.
 */
export const PLAN_INACTIVE_TAG = '[PLAN_INACTIVE]';

/** @deprecated Use PLAN_INACTIVE_TAG instead */
export const PLAN_INACTIVE_PREFIX = PLAN_INACTIVE_TAG;

/** Check whether an error message is a plan-gated error (for client-side use) */
export function isPlanInactiveError(message: string): boolean {
  return message.includes(PLAN_INACTIVE_TAG);
}
