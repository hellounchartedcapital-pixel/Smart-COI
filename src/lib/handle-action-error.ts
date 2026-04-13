import { toast } from 'sonner';
import { isPlanInactiveError, PLAN_INACTIVE_TAG } from '@/lib/plan-status';
import { FEATURE_LOCKED_TAG, isFeatureLockedError } from '@/lib/plan-features';

/**
 * Shared error handler for client-side action catch blocks.
 *
 * If the error is a plan-gated error it opens the upgrade modal;
 * if it's a tier-locked feature error it shows an upgrade toast
 * that links to billing; otherwise it shows a regular toast.
 */
export function handleActionError(
  err: unknown,
  fallbackMessage: string,
  showUpgradeModal?: (msg?: string) => void,
) {
  const message = err instanceof Error ? err.message : fallbackMessage;
  if (showUpgradeModal && isPlanInactiveError(message)) {
    // Strip the machine-readable tag so the modal shows a clean message
    const displayMessage = message.replace(PLAN_INACTIVE_TAG, '').trim();
    showUpgradeModal(displayMessage);
  } else if (isFeatureLockedError(message)) {
    const displayMessage = message.replace(FEATURE_LOCKED_TAG, '').trim();
    showFeatureUpgradeToast(displayMessage);
  } else {
    toast.error(message);
  }
}

/**
 * Check a server action result for an `{ error }` return value.
 *
 * Server actions that guard with `requireActivePlan()` or
 * `checkFeatureAccess()` return `{ error: string }` instead of throwing so
 * the error message (including the tag) survives Next.js serialisation.
 *
 * Returns `true` if the result contained an error (already handled).
 */
export function handleActionResult(
  result: unknown,
  fallbackMessage: string,
  showUpgradeModal?: (msg?: string) => void,
): boolean {
  if (
    result &&
    typeof result === 'object' &&
    'error' in result &&
    typeof (result as { error: unknown }).error === 'string'
  ) {
    const message = (result as { error: string }).error;
    if (showUpgradeModal && isPlanInactiveError(message)) {
      const displayMessage = message.replace(PLAN_INACTIVE_TAG, '').trim();
      showUpgradeModal(displayMessage);
    } else if (isFeatureLockedError(message)) {
      const displayMessage = message.replace(FEATURE_LOCKED_TAG, '').trim();
      showFeatureUpgradeToast(displayMessage);
    } else {
      toast.error(message || fallbackMessage);
    }
    return true;
  }
  return false;
}

/**
 * Show a toast for a tier-gated feature with an "Upgrade" action button
 * that takes the user straight to billing.
 */
function showFeatureUpgradeToast(message: string) {
  toast(message, {
    description: 'Upgrade your plan to unlock this feature.',
    action: {
      label: 'Upgrade',
      onClick: () => {
        if (typeof window !== 'undefined') {
          window.location.href = '/dashboard/settings/billing';
        }
      },
    },
  });
}
