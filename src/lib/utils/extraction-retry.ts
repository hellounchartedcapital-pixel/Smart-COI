/**
 * Route-level retry wrapper for COI extraction.
 *
 * This layer retries extraction failures that are NOT rate-limit errors
 * (those are already handled by extraction.ts and concurrent-queue.ts).
 * It covers: malformed PDFs, parse errors, timeouts, storage issues, etc.
 */

/** Backoff schedule: 2s, 4s, 8s */
const RETRY_BACKOFF_MS = [2_000, 4_000, 8_000];
const MAX_RETRIES = 3;

/**
 * Returns true for 429 rate-limit errors that should NOT be retried
 * at this layer (they're handled by the lower-level retry layers).
 */
function isRateLimitError(message: string): boolean {
  const lower = message.toLowerCase();
  return (
    lower.includes('429') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('ai service is busy')
  );
}

export interface ExtractionAttemptResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  attempts: number;
}

/**
 * Wraps an extraction function with automatic retries for non-rate-limit failures.
 *
 * - Rate-limit errors (429) are passed through immediately — they're handled
 *   by extraction.ts (Anthropic API retries) and concurrent-queue.ts (queue-level retries).
 * - All other errors (malformed PDF, parse failures, timeouts, storage errors)
 *   are retried up to MAX_RETRIES times with exponential backoff.
 *
 * @param fn - The extraction function to retry
 * @param onAttempt - Called before each attempt with the attempt number (0-based)
 */
export async function withExtractionRetry<T>(
  fn: () => Promise<T>,
  onAttempt?: (attempt: number, error?: string) => Promise<void>,
): Promise<ExtractionAttemptResult<T>> {
  let lastError = '';

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    // Backoff before retry attempts (not before the first attempt)
    if (attempt > 0) {
      const backoffMs = RETRY_BACKOFF_MS[Math.min(attempt - 1, RETRY_BACKOFF_MS.length - 1)];
      console.log(`[extraction-retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1}, waiting ${backoffMs}ms`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }

    if (onAttempt) {
      await onAttempt(attempt, attempt > 0 ? lastError : undefined);
    }

    try {
      const data = await fn();
      return { success: true, data, attempts: attempt + 1 };
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'Extraction failed';

      // Don't retry rate-limit errors — let the lower layers handle them
      if (isRateLimitError(lastError)) {
        return { success: false, error: lastError, attempts: attempt + 1 };
      }

      console.warn(
        `[extraction-retry] Attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${lastError}`
      );

      // If we've exhausted retries, fall through to the final return
      if (attempt >= MAX_RETRIES) {
        break;
      }
    }
  }

  return { success: false, error: lastError, attempts: MAX_RETRIES + 1 };
}
