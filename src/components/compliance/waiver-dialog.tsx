'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ShieldOff, X } from 'lucide-react';
import { grantWaiver, revokeWaiver, type ComplianceWaiver } from '@/lib/actions/waivers';
import { formatDate } from '@/lib/utils';

// ============================================================================
// Grant Waiver Dialog
// ============================================================================

interface GrantWaiverDialogProps {
  open: boolean;
  onClose: () => void;
  entityType: 'vendor' | 'tenant';
  entityId: string;
  entityName: string;
}

export function GrantWaiverDialog({
  open,
  onClose,
  entityType,
  entityId,
  entityName,
}: GrantWaiverDialogProps) {
  const [reason, setReason] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  // Default to 90 days from now
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() + 90);
  const minDate = new Date().toISOString().slice(0, 10);

  const handleSubmit = async () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for the waiver');
      return;
    }
    if (!expiresAt) {
      toast.error('Please select a waiver expiration date');
      return;
    }

    setSubmitting(true);
    const result = await grantWaiver(entityType, entityId, reason.trim(), expiresAt);
    setSubmitting(false);

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success(`Waiver granted for ${entityName}`);
      setReason('');
      setExpiresAt('');
      onClose();
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/30" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-2xl bg-white shadow-xl" onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50">
                <ShieldOff className="h-5 w-5 text-amber-600" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900">Grant Compliance Waiver</h2>
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            <p className="text-sm text-slate-500">
              Granting a waiver for <span className="font-medium text-slate-700">{entityName}</span> will
              temporarily mark them as &quot;Waived&quot; and remove them from the action queue until the waiver expires.
            </p>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Reason for waiver <span className="text-red-500">*</span>
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Vendor is renewing policy, new certificate expected next week"
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Waiver expires on <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                min={minDate}
                className="w-full rounded-lg border border-slate-300 px-3.5 py-2.5 text-sm text-slate-900 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <p className="mt-1 text-xs text-slate-400">
                When the waiver expires, the {entityType} will revert to their actual compliance status.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 border-t border-slate-200 px-6 py-4">
            <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmit}
              disabled={submitting || !reason.trim() || !expiresAt}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {submitting ? 'Granting...' : 'Grant Waiver'}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

// ============================================================================
// Waiver Badge (shown next to entity name when waived)
// ============================================================================

export function WaiverBadge({ waiver, onRevoke }: { waiver: ComplianceWaiver; onRevoke?: () => void }) {
  const [revoking, setRevoking] = useState(false);

  const handleRevoke = async () => {
    setRevoking(true);
    const result = await revokeWaiver(waiver.id);
    setRevoking(false);

    if ('error' in result) {
      toast.error(result.error);
    } else {
      toast.success('Waiver revoked');
      onRevoke?.();
    }
  };

  return (
    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <ShieldOff className="h-4 w-4 text-amber-600 shrink-0" />
          <div>
            <p className="text-xs font-semibold text-amber-800">Compliance Waived</p>
            <p className="text-xs text-amber-600 mt-0.5">{waiver.reason}</p>
            <p className="text-[10px] text-amber-500 mt-0.5">
              Expires {formatDate(waiver.expires_at)}
            </p>
          </div>
        </div>
        {onRevoke && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-[10px] text-amber-700 hover:text-amber-900 hover:bg-amber-100"
            onClick={handleRevoke}
            disabled={revoking}
          >
            {revoking ? '...' : 'Revoke'}
          </Button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Waiver History Section
// ============================================================================

export function WaiverHistory({ waivers }: { waivers: ComplianceWaiver[] }) {
  if (waivers.length === 0) return null;

  return (
    <div className="rounded-lg border border-slate-200 bg-white">
      <div className="border-b border-slate-100 px-4 py-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Waiver History
        </h3>
      </div>
      <div className="divide-y divide-slate-100">
        {waivers.map((w) => {
          const isActive = !w.revoked_at && new Date(w.expires_at) > new Date();
          const isExpired = !w.revoked_at && new Date(w.expires_at) <= new Date();

          return (
            <div key={w.id} className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    isActive
                      ? 'bg-amber-50 text-amber-700'
                      : isExpired
                        ? 'bg-slate-50 text-slate-500'
                        : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  {isActive ? 'Active' : isExpired ? 'Expired' : 'Revoked'}
                </span>
                <span className="text-[10px] text-slate-400">
                  Granted {formatDate(w.granted_at)}
                </span>
              </div>
              <p className="mt-1 text-xs text-slate-600">{w.reason}</p>
              <p className="mt-0.5 text-[10px] text-slate-400">
                Expires {formatDate(w.expires_at)}
                {w.revoked_at && ` · Revoked ${formatDate(w.revoked_at)}`}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
