'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  Clock,
  UserPlus,
  Mail,
} from 'lucide-react';
import { quickConfirmCertificate } from '@/lib/actions/certificates';
import { toast } from 'sonner';
import { formatDate } from '@/lib/utils';
import type {
  Certificate,
  ComplianceResult,
  EntityComplianceResult,
  ExtractedCoverage,
  PropertyEntity,
  TemplateCoverageRequirement,
  Notification,
} from '@/types';

// ---------------------------------------------------------------------------
// Coverage type labels
// ---------------------------------------------------------------------------
const COVERAGE_LABELS: Record<string, string> = {
  general_liability: 'General Liability',
  automobile_liability: 'Automobile Liability',
  workers_compensation: 'Workers\' Compensation',
  umbrella_excess: 'Umbrella / Excess',
  professional_liability: 'Professional Liability',
  property_insurance: 'Property Insurance',
  cyber_liability: 'Cyber Liability',
  pollution_liability: 'Pollution Liability',
  builders_risk: 'Builders Risk',
  other: 'Other',
};

function formatCurrency(amount: number | null): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------
interface CompliancePanelProps {
  entityType: 'vendor' | 'tenant';
  entityId: string;
  entityName: string;
  contactEmail: string | null;
  contactName: string | null;
  certificates: (Certificate & { compliance_results?: ComplianceResult[] })[];
  extractedCoverages: ExtractedCoverage[];
  complianceResults: ComplianceResult[];
  entityResults: EntityComplianceResult[];
  propertyEntities: PropertyEntity[];
  templateRequirements: TemplateCoverageRequirement[];
  notifications: Notification[];
  hasCertificate: boolean;
  onEditContact?: () => void;
}

// ---------------------------------------------------------------------------
// Compliance Panel Component
// ---------------------------------------------------------------------------
export function CompliancePanel({
  entityType,
  entityId,
  entityName,
  contactEmail,
  contactName,
  certificates,
  extractedCoverages,
  complianceResults,
  entityResults,
  propertyEntities,
  templateRequirements,
  notifications,
  hasCertificate,
  onEditContact,
}: CompliancePanelProps) {
  const router = useRouter();
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);

  // Latest certificate
  const latestCert = certificates
    .slice()
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];
  const pendingReview =
    latestCert?.processing_status === 'extracted' && !latestCert.reviewed_at;
  const isConfirmed = latestCert?.processing_status === 'review_confirmed';

  // Group compliance results by status
  const compliantResults = complianceResults.filter((r) => r.status === 'met');
  const nonCompliantResults = complianceResults.filter(
    (r) => r.status === 'not_met' || r.status === 'missing'
  );

  // Expiring soon coverages
  const now = new Date();
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const expiringSoonCoverages = extractedCoverages.filter((c) => {
    if (!c.expiration_date) return false;
    const expDate = new Date(c.expiration_date);
    return expDate > now && expDate <= thirtyDaysFromNow;
  });

  // Follow-up status
  const lastNotification = notifications
    .filter((n) => n.status === 'sent')
    .sort(
      (a, b) =>
        new Date(b.sent_date ?? b.created_at).getTime() -
        new Date(a.sent_date ?? a.created_at).getTime()
    )[0];
  const nextScheduled = notifications.find((n) => n.status === 'scheduled');

  async function handleMarkAsReviewed() {
    if (!latestCert) return;
    setConfirming(true);
    try {
      await quickConfirmCertificate(latestCert.id);
      toast.success('Certificate marked as reviewed');
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to confirm certificate');
    } finally {
      setConfirming(false);
    }
  }

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <h2 className="text-lg font-semibold text-foreground">Compliance</h2>
        {hasCertificate && isConfirmed && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditDrawerOpen(true)}
          >
            <Pencil className="mr-1.5 h-3.5 w-3.5" />
            Edit Info
          </Button>
        )}
      </div>

      <div className="flex-1 space-y-4 p-5 overflow-y-auto">
        {/* No certificate state */}
        {!hasCertificate && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No certificate uploaded yet.
            </p>
            <Button size="sm" className="mt-3" asChild>
              <Link href={`/dashboard/certificates/upload?${entityType}Id=${entityId}`}>
                Upload COI
              </Link>
            </Button>
          </div>
        )}

        {/* Pending review — show Mark as Reviewed button */}
        {pendingReview && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <p className="text-sm font-medium text-blue-800">
                  Awaiting review
                </p>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={handleMarkAsReviewed}
                disabled={confirming}
                className="text-xs"
              >
                {confirming ? 'Confirming...' : 'Mark as Reviewed'}
              </Button>
            </div>
          </div>
        )}

        {/* Contact prompt if missing */}
        {!contactEmail && hasCertificate && (
          <button
            type="button"
            onClick={onEditContact}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-left transition-colors hover:bg-slate-100"
          >
            <UserPlus className="h-4 w-4 text-slate-400" />
            <span className="text-sm text-muted-foreground">
              No contact on file — add to enable automatic reminders
            </span>
            <span className="ml-auto text-brand text-sm font-medium">&rarr;</span>
          </button>
        )}

        {/* Follow-up status */}
        {contactEmail && hasCertificate && (lastNotification || nextScheduled) && (
          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2.5">
            <Mail className="h-4 w-4 text-slate-400" />
            <p className="text-xs text-muted-foreground">
              {lastNotification && (
                <>
                  Reminder sent{' '}
                  {Math.max(
                    0,
                    Math.round(
                      (now.getTime() -
                        new Date(
                          lastNotification.sent_date ?? lastNotification.created_at
                        ).getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{' '}
                  days ago
                </>
              )}
              {lastNotification && nextScheduled && ' · '}
              {nextScheduled && (
                <>
                  Next reminder in{' '}
                  {Math.max(
                    0,
                    Math.round(
                      (new Date(nextScheduled.scheduled_date).getTime() -
                        now.getTime()) /
                        (1000 * 60 * 60 * 24)
                    )
                  )}{' '}
                  days
                </>
              )}
            </p>
          </div>
        )}

        {/* Compliance results */}
        {hasCertificate && complianceResults.length > 0 && (
          <div className="space-y-2">
            {/* Non-compliant items — expanded by default */}
            {nonCompliantResults.length > 0 && (
              <ComplianceGroup
                icon={<XCircle className="h-4 w-4 text-red-500" />}
                label="Non-Compliant"
                count={nonCompliantResults.length}
                variant="red"
                defaultOpen
                items={nonCompliantResults}
                extractedCoverages={extractedCoverages}
                templateRequirements={templateRequirements}
              />
            )}

            {/* Expiring soon items */}
            {expiringSoonCoverages.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                  <span className="text-sm font-medium text-amber-800">
                    Expiring Soon ({expiringSoonCoverages.length})
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {expiringSoonCoverages.map((c) => (
                    <div
                      key={c.id}
                      className="flex items-center justify-between text-xs text-amber-700"
                    >
                      <span>
                        {COVERAGE_LABELS[c.coverage_type] ?? c.coverage_type}
                      </span>
                      <span>Expires {formatDate(c.expiration_date!)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Compliant items — collapsed by default */}
            {compliantResults.length > 0 && (
              <ComplianceGroup
                icon={<CheckCircle2 className="h-4 w-4 text-emerald-500" />}
                label="Compliant"
                count={compliantResults.length}
                variant="green"
                defaultOpen={false}
                items={compliantResults}
                extractedCoverages={extractedCoverages}
                templateRequirements={templateRequirements}
              />
            )}

            {/* Entity compliance */}
            {entityResults.length > 0 && (
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                  Named Insured Requirements
                </h4>
                <div className="space-y-1.5">
                  {entityResults.map((er) => {
                    const pe = propertyEntities.find((p) => p.id === er.property_entity_id);
                    const statusIcon =
                      er.status === 'found' ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : er.status === 'partial_match' ? (
                        <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-red-500" />
                      );
                    return (
                      <div key={er.id} className="flex items-center gap-2 text-sm">
                        {statusIcon}
                        <span className="text-foreground">
                          {pe?.entity_name ?? 'Unknown'}
                        </span>
                        <Badge
                          variant="outline"
                          className="text-[10px] capitalize"
                        >
                          {pe?.entity_type?.replace('_', ' ') ?? ''}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {/* No compliance results but has certificate */}
        {hasCertificate && complianceResults.length === 0 && !pendingReview && (
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
            <p className="text-sm text-muted-foreground">
              No compliance template assigned. Assign a template to see compliance results.
            </p>
          </div>
        )}
      </div>

      {/* Edit Info slide-over drawer */}
      {editDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setEditDrawerOpen(false)}
          />
          <div className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-slate-200 bg-white shadow-xl overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <h3 className="text-lg font-semibold text-foreground">
                Edit Extraction Data
              </h3>
              <button
                type="button"
                onClick={() => setEditDrawerOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 text-sm text-muted-foreground">
              <p>
                To edit extracted data, go to the{' '}
                <Link
                  href={`/dashboard/certificates/${latestCert?.id}/review`}
                  className="text-brand font-medium hover:underline"
                >
                  full certificate review page
                </Link>
                , where you can modify coverage details, entity names, and confirm changes.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Compliance Group (collapsible section)
// ---------------------------------------------------------------------------
interface ComplianceGroupProps {
  icon: React.ReactNode;
  label: string;
  count: number;
  variant: 'red' | 'green';
  defaultOpen: boolean;
  items: ComplianceResult[];
  extractedCoverages: ExtractedCoverage[];
  templateRequirements: TemplateCoverageRequirement[];
}

function ComplianceGroup({
  icon,
  label,
  count,
  variant,
  defaultOpen,
  items,
  extractedCoverages,
  templateRequirements,
}: ComplianceGroupProps) {
  const [open, setOpen] = useState(defaultOpen);

  const borderColor =
    variant === 'red' ? 'border-red-200' : 'border-emerald-200';
  const bgColor = variant === 'red' ? 'bg-red-50' : 'bg-emerald-50';
  const textColor = variant === 'red' ? 'text-red-800' : 'text-emerald-800';

  return (
    <div className={`rounded-lg border ${borderColor} ${bgColor}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex w-full items-center gap-2 px-4 py-3 text-left`}
      >
        {icon}
        <span className={`text-sm font-medium ${textColor} flex-1`}>
          {label} ({count})
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-2 space-y-2 rounded-b-lg">
          {items.map((item) => {
            const req = templateRequirements.find(
              (r) => r.id === item.coverage_requirement_id
            );
            const coverage = extractedCoverages.find(
              (c) => c.coverage_type === req?.coverage_type
            );
            return (
              <div key={item.id} className="py-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">
                    {COVERAGE_LABELS[req?.coverage_type ?? ''] ??
                      req?.coverage_type ??
                      'Unknown'}
                  </span>
                  {coverage && (
                    <span className="text-xs text-muted-foreground">
                      {formatCurrency(coverage.limit_amount)}
                    </span>
                  )}
                </div>
                {item.gap_description && (
                  <p className="text-xs text-red-600 mt-0.5">
                    {item.gap_description}
                  </p>
                )}
                {req && item.status === 'met' && (
                  <p className="text-xs text-emerald-600 mt-0.5">
                    Required: {formatCurrency(req.minimum_limit)} — Met
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
