'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { CheckCircle2, Loader2, Mail, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BatchStatus {
  batchId: string;
  status: 'queued' | 'processing' | 'complete' | 'failed';
  totalCerts: number;
  completedCount: number;
  failedCount: number;
  startedAt: string;
  completedAt: string | null;
}

interface BatchProgressTrackerProps {
  batchId: string;
  totalCerts: number;
  /** Called when the batch completes — parent can redirect to report or next step */
  onComplete: (status: BatchStatus) => void;
  /** Called when user decides to leave and get emailed instead */
  onDismiss?: () => void;
}

const POLL_INTERVAL_MS = 4_000; // Poll every 4 seconds
const LONG_WAIT_THRESHOLD_MS = 2 * 60 * 1_000; // 2 minutes

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BatchProgressTracker({
  batchId,
  totalCerts,
  onComplete,
  onDismiss,
}: BatchProgressTrackerProps) {
  const [status, setStatus] = useState<BatchStatus | null>(null);
  const [showEmailPrompt, setShowEmailPrompt] = useState(false);
  const [pollError, setPollError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef(Date.now());

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`/api/certificates/batch-status?batchId=${batchId}`);
      if (!res.ok) {
        setPollError('Failed to fetch status');
        return;
      }
      setPollError(null);
      const data: BatchStatus = await res.json();
      setStatus(data);

      // Check if processing is done
      if (data.status === 'complete' || data.status === 'failed') {
        // Stop polling
        if (pollRef.current) {
          clearInterval(pollRef.current);
          pollRef.current = null;
        }
        onComplete(data);
      }

      // Show email prompt after 2 min of waiting
      if (
        !showEmailPrompt &&
        Date.now() - startTimeRef.current > LONG_WAIT_THRESHOLD_MS &&
        data.status === 'processing'
      ) {
        setShowEmailPrompt(true);
      }
    } catch {
      setPollError('Network error — retrying...');
    }
  }, [batchId, onComplete, showEmailPrompt]);

  // Start polling on mount
  useEffect(() => {
    // Initial fetch immediately
    fetchStatus();

    // Start interval
    pollRef.current = setInterval(fetchStatus, POLL_INTERVAL_MS);

    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [fetchStatus]);

  // On unmount or page unload, mark client as inactive so server sends email
  useEffect(() => {
    const markInactive = () => {
      // Use sendBeacon for reliable delivery during page unload
      const body = JSON.stringify({ batchId, clientActive: false });
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/certificates/batch-status', new Blob([body], { type: 'application/json' }));
      } else {
        fetch('/api/certificates/batch-status', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body,
          keepalive: true,
        }).catch(() => {});
      }
    };

    window.addEventListener('beforeunload', markInactive);

    return () => {
      window.removeEventListener('beforeunload', markInactive);
      // When component unmounts (navigate away), also mark inactive
      markInactive();
    };
  }, [batchId]);

  // ---- Derived values ----
  const completed = status?.completedCount ?? 0;
  const failed = status?.failedCount ?? 0;
  const finished = completed + failed;
  const progressPercent = totalCerts > 0 ? (finished / totalCerts) * 100 : 0;
  const isDone = status?.status === 'complete' || status?.status === 'failed';

  // ETA calculation
  const estimatedTimeRemaining = (() => {
    if (isDone || finished === 0) return null;
    const elapsed = Date.now() - startTimeRef.current;
    const avgPerFile = elapsed / finished;
    const remaining = totalCerts - finished;
    const remainMs = avgPerFile * remaining;
    const mins = Math.ceil(remainMs / 60_000);
    if (mins <= 1) return 'less than a minute';
    return `~${mins} minute${mins !== 1 ? 's' : ''}`;
  })();

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {isDone
            ? `Processing complete — ${completed} of ${totalCerts} extracted`
            : `Processing ${finished} of ${totalCerts} certificates...`}
        </span>
        {!isDone && estimatedTimeRemaining && (
          <span className="text-muted-foreground">{estimatedTimeRemaining} remaining</span>
        )}
      </div>

      {/* Progress bar */}
      <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${Math.min(progressPercent, 100)}%` }}
        />
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        {completed > 0 && (
          <span className="flex items-center gap-1 text-emerald-600">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {completed} extracted
          </span>
        )}
        {failed > 0 && (
          <span className="flex items-center gap-1 text-red-500">
            <AlertTriangle className="h-3.5 w-3.5" />
            {failed} failed
          </span>
        )}
        {!isDone && finished < totalCerts && (
          <span className="flex items-center gap-1">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            {totalCerts - finished} remaining
          </span>
        )}
      </div>

      {/* Poll error */}
      {pollError && (
        <p className="text-xs text-amber-600 italic">{pollError}</p>
      )}

      {/* Long wait prompt */}
      {showEmailPrompt && !isDone && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                This is taking a bit — we&apos;ll email you when it&apos;s ready
              </p>
              <p className="mt-1 text-xs text-blue-700">
                You can safely close this page. We&apos;ll send you an email with your compliance
                report as soon as processing finishes.
              </p>
              {onDismiss && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-2 text-xs"
                  onClick={onDismiss}
                >
                  Got it — email me when it&apos;s done
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
