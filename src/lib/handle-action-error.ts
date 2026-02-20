import { toast } from 'sonner';
import { isPlanInactiveError, PLAN_INACTIVE_TAG } from '@/lib/plan-status';

/**
 * Shared error handler for client-side action catch blocks.
 *
 * If the error is a plan-gated error it opens the upgrade modal;
 * otherwise it shows a regular toast.
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
  } else {
    toast.error(message);
  }
}

/**
 * Check a server action result for an `{ error }` return value.
 *
 * Server actions that guard with `requireActivePlan()` return
 * `{ error: string }` instead of throwing so the error message
 * (including the [PLAN_INACTIVE] tag) survives Next.js serialisation.
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
    } else {
      toast.error(message);
    }
    return true;
  }
  return false;
}
