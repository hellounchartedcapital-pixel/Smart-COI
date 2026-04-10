/**
 * Concurrent queue for bulk COI upload processing.
 *
 * Processes items in parallel with a configurable concurrency limit,
 * per-item error isolation, and 429 rate-limit backoff.
 */

export type ItemStatus = 'pending' | 'processing' | 'complete' | 'failed';

export interface QueueItem<T> {
  data: T;
  status: ItemStatus;
  error?: string;
  attempts: number;
}

export interface ConcurrentQueueOptions<T, R> {
  /** Array of items to process */
  items: T[];
  /** Maximum number of items to process simultaneously (default: 5) */
  concurrency?: number;
  /** The async function that processes a single item */
  processFn: (item: T, signal: AbortSignal) => Promise<R>;
  /**
   * Called whenever an item's status changes.
   * Receives the item index, new status, error message (if failed),
   * and the result (if complete).
   */
  onStatusChange: (
    index: number,
    status: ItemStatus,
    error?: string,
    result?: R
  ) => void;
  /** Optional AbortSignal to cancel all remaining work */
  signal?: AbortSignal;
  /** Maximum retry attempts for 429 rate-limit errors (default: 3) */
  maxRetries?: number;
}

/**
 * Returns true if the error message indicates a 429 rate-limit response,
 * either from the client-side fetch layer or from the server error body.
 */
function isRateLimitError(errorMessage: string): boolean {
  return (
    errorMessage.includes('429') ||
    errorMessage.toLowerCase().includes('rate limit') ||
    errorMessage.toLowerCase().includes('too many requests') ||
    errorMessage.toLowerCase().includes('ai service is busy')
  );
}

/**
 * Processes an array of items through an async function with bounded
 * concurrency. Each item is processed independently — a failure in one
 * item does not affect others.
 *
 * Rate-limit errors (HTTP 429) trigger exponential backoff retries on
 * the individual item (up to `maxRetries` times) without blocking the
 * rest of the pool.
 */
export async function processConcurrentQueue<T, R>(
  options: ConcurrentQueueOptions<T, R>
): Promise<QueueItem<R>[]> {
  const {
    items,
    concurrency = 5,
    processFn,
    onStatusChange,
    signal,
    maxRetries = 3,
  } = options;

  // Backoff schedule in ms for 429 retries: 4s, 8s, 16s
  const BACKOFF_MS = [4_000, 8_000, 16_000];

  // Initialize result tracking
  const results: QueueItem<R>[] = items.map((data) => ({
    data: data as unknown as R,
    status: 'pending' as ItemStatus,
    error: undefined,
    attempts: 0,
  }));

  // Build a queue of indices to process
  const queue: number[] = items.map((_, i) => i);
  let queueIndex = 0;

  async function processItem(index: number): Promise<void> {
    if (signal?.aborted) return;

    results[index].status = 'processing';
    onStatusChange(index, 'processing');

    let lastError = '';

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (signal?.aborted) return;

      // On retry attempts for 429, wait with exponential backoff
      if (attempt > 0) {
        const backoffMs = BACKOFF_MS[Math.min(attempt - 1, BACKOFF_MS.length - 1)];
        console.log(
          `[concurrent-queue] Item ${index}: 429 retry ${attempt}/${maxRetries}, waiting ${backoffMs}ms`
        );
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        if (signal?.aborted) return;
      }

      try {
        results[index].attempts = attempt + 1;
        const result = await processFn(items[index], signal ?? new AbortController().signal);
        results[index].status = 'complete';
        results[index].data = result;
        results[index].error = undefined;
        onStatusChange(index, 'complete', undefined, result);
        return;
      } catch (err) {
        lastError = err instanceof Error ? err.message : 'Processing failed';

        // Only retry on 429 rate-limit errors
        if (isRateLimitError(lastError) && attempt < maxRetries) {
          continue;
        }

        // Non-retryable error or retries exhausted — mark as failed
        break;
      }
    }

    results[index].status = 'failed';
    results[index].error = lastError;
    onStatusChange(index, 'failed', lastError);
  }

  // Worker function: pulls items from the shared queue until exhausted
  async function worker(): Promise<void> {
    while (true) {
      if (signal?.aborted) return;

      const idx = queueIndex;
      if (idx >= queue.length) return;
      queueIndex++;

      await processItem(queue[idx]);
    }
  }

  // Launch `concurrency` workers in parallel
  const workers: Promise<void>[] = [];
  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(worker());
  }

  await Promise.all(workers);

  return results;
}
