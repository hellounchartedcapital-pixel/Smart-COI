'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  Pencil,
  X,
  UserPlus,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import type {
  Certificate,
  ComplianceResult,
  ComplianceStatus,
  EntityComplianceResult,
  ExtractedCoverage,
  ExtractedEntity,
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
  employers_liability: 'Employers\' Liability',
  umbrella_excess_liability: 'Umbrella / Excess Liability',
  professional_liability_eo: 'Professional Liability (E&O)',
  property_inland_marine: 'Property / Inland Marine',
  cyber_liability: 'Cyber Liability',
  pollution_liability: 'Pollution Liability',
  liquor_liability: 'Liquor Liability',
  umbrella_excess: 'Umbrella / Excess',
  professional_liability: 'Professional Liability',
  property_insurance: 'Property Insurance',
  builders_risk: 'Builders Risk',
  other: 'Other',
};

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatLimitType(type: string | null | undefined): string {
  if (!type) return '';
  return type.replace(/_/g, ' ');
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
  contactPhone?: string | null;
  complianceStatus: ComplianceStatus;
  certificates: (Certificate & { compliance_results?: ComplianceResult[] })[];
  extractedCoverages: ExtractedCoverage[];
  extractedEntities?: ExtractedEntity[];
  complianceResults: ComplianceResult[];
  entityResults: EntityComplianceResult[];
  propertyEntities: PropertyEntity[];
  templateRequirements: TemplateCoverageRequirement[];
  notifications: Notification[];
  hasCertificate: boolean;
  onEditContact?: () => void;
}

// ---------------------------------------------------------------------------
// Overall status badge
// ---------------------------------------------------------------------------
function OverallStatusBadge({ status }: { status: ComplianceStatus }) {
  const config: Record<string, { label: string; className: string }> = {
    compliant: {
      label: 'Compliant',
      className: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    },
    non_compliant: {
      label: 'Non-Compliant',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    expired: {
      label: 'Expired',
      className: 'bg-red-100 text-red-800 border-red-300',
    },
    expiring_soon: {
      label: 'Expiring Soon',
      className: 'bg-amber-100 text-amber-800 border-amber-300',
    },
    pending: {
      label: 'Pending',
      className: 'bg-slate-100 text-slate-700 border-slate-300',
    },
    under_review: {
      label: 'Processing',
      className: 'bg-blue-100 text-blue-800 border-blue-300',
    },
  };
  const c = config[status] ?? config.pending;
  return (
    <div className={`inline-flex items-center rounded-lg border px-4 py-2 text-sm font-semibold ${c.className}`}>
      {c.label}
    </div>
  );
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
  contactPhone,
  complianceStatus,
  certificates,
  extractedCoverages,
  extractedEntities,
  complianceResults,
  entityResults,
  propertyEntities,
  templateRequirements,
  notifications,
  hasCertificate,
  onEditContact,
}: CompliancePanelProps) {
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Latest certificate
  const latestCert = certificates
    .slice()
    .sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime())[0];

  // Follow-up status
  const now = new Date();
  const lastNotification = notifications
    .filter((n) => n.status === 'sent')
    .sort(
      (a, b) =>
        new Date(b.sent_date ?? b.created_at).getTime() -
        new Date(a.sent_date ?? a.created_at).getTime()
    )[0];
  const nextScheduled = notifications.find((n) => n.status === 'scheduled');

  // Check for expired coverages
  const hasExpiredCoverage = extractedCoverages.some((c) => {
    if (!c.expiration_date) return false;
    return new Date(c.expiration_date) < now;
  });

  // Determine which coverages are required but not extracted (additional coverages)
  const requiredCoverageTypes = new Set(templateRequirements.map((r) => r.coverage_type));
  const additionalCoverages = extractedCoverages.filter(
    (c) => !requiredCoverageTypes.has(c.coverage_type)
  );

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* Header with status badge and edit button */}
      <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
        <OverallStatusBadge status={complianceStatus} />
        {hasCertificate && (
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

      <div className="flex-1 space-y-5 p-5 overflow-y-auto">
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

        {/* Contact information section */}
        {hasCertificate && (
          <div className="space-y-2">
            {(contactName || contactEmail || contactPhone) ? (
              <div className="rounded-lg border border-slate-200 bg-white px-4 py-3 space-y-1.5">
                {contactName && (
                  <div className="flex items-center gap-2 text-sm">
                    <User className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-foreground">{contactName}</span>
                  </div>
                )}
                {contactEmail && (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-3.5 w-3.5 text-slate-400" />
                    <a href={`mailto:${contactEmail}`} className="text-brand-dark hover:underline">
                      {contactEmail}
                    </a>
                  </div>
                )}
                {contactPhone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3.5 w-3.5 text-slate-400" />
                    <span className="text-foreground">{contactPhone}</span>
                  </div>
                )}
              </div>
            ) : (
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
          </div>
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

        {/* Section 1: Coverage Requirements checklist */}
        {hasCertificate && templateRequirements.length > 0 && (
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Coverage Requirements
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {templateRequirements.map((req) => {
                const result = complianceResults.find(
                  (r) => r.coverage_requirement_id === req.id
                );
                const coverage = extractedCoverages.find(
                  (c) => c.coverage_type === req.coverage_type
                );
                const isMet = result?.status === 'met';
                const statusIcon = isMet ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                );

                return (
                  <div key={req.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">{statusIcon}</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {COVERAGE_LABELS[req.coverage_type] ?? req.coverage_type}
                        </p>
                        <div className="mt-1 grid gap-0.5 text-xs">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground shrink-0">Required:</span>
                            <span className="text-foreground">
                              {formatCurrency(req.minimum_limit)}
                              {req.limit_type && ` ${formatLimitType(req.limit_type)}`}
                            </span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground shrink-0">Extracted:</span>
                            <span className={isMet ? 'text-emerald-700' : 'text-red-600'}>
                              {coverage
                                ? `${formatCurrency(coverage.limit_amount)}${coverage.limit_type ? ` ${formatLimitType(coverage.limit_type)}` : ''}`
                                : 'Not found on certificate'}
                            </span>
                          </div>
                        </div>
                        {result?.gap_description && (
                          <p className="mt-1 text-xs text-red-600">
                            {result.gap_description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Section 2: Certificate Details */}
        {hasCertificate && (
          <div className="rounded-lg border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-4 py-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Certificate Details
              </h3>
            </div>
            <div className="divide-y divide-slate-100">
              {/* Certificate Holder & Additional Insured — render all property entities */}
              {propertyEntities.map((pe) => {
                const result = entityResults.find(
                  (er) => er.property_entity_id === pe.id
                );
                const isMet = result?.status === 'found';
                const isFuzzy = result?.match_details != null;
                const label = pe.entity_type === 'certificate_holder'
                  ? 'Certificate Holder'
                  : 'Additional Insured';
                const matchedEntity = result?.extracted_entity_id
                  ? extractedEntities?.find((e) => e.id === result.extracted_entity_id)
                  : null;
                // Fallback: find by type
                const displayEntity = matchedEntity
                  ?? extractedEntities?.find((e) => e.entity_type === pe.entity_type);

                return (
                  <div key={pe.id} className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {isMet ? (
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{label}</p>
                          {isMet && isFuzzy && (
                            <span className="text-[10px] text-muted-foreground">
                              Matched (fuzzy)
                            </span>
                          )}
                        </div>
                        <div className="mt-1 grid gap-0.5 text-xs">
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground shrink-0">Required:</span>
                            <span className="text-foreground">{pe.entity_name}</span>
                          </div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-muted-foreground shrink-0">Extracted:</span>
                            <span className={isMet ? 'text-emerald-700' : 'text-red-600'}>
                              {displayEntity?.entity_name ?? 'Not found on certificate'}
                            </span>
                          </div>
                          {result?.match_details && (
                            <p className="text-[10px] text-muted-foreground italic">
                              {result.match_details}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Show placeholder if no property entities configured */}
              {propertyEntities.length === 0 && (
                <>
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Certificate Holder</p>
                        <p className="mt-1 text-xs text-muted-foreground">Not configured</p>
                      </div>
                    </div>
                  </div>
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Additional Insured</p>
                        <p className="mt-1 text-xs text-muted-foreground">Not configured</p>
                      </div>
                    </div>
                  </div>
                </>
              )}

              {/* Expiration */}
              {(() => {
                // Find earliest expiration date across all coverages
                const earliestExpiration = extractedCoverages
                  .filter((c) => c.expiration_date)
                  .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())[0];
                const isExpired = hasExpiredCoverage;

                return (
                  <div className="px-4 py-3">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5">
                        {earliestExpiration ? (
                          isExpired ? (
                            <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                          ) : (
                            <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          )
                        ) : (
                          <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">Expiration</p>
                        {earliestExpiration ? (
                          <p className="mt-1 text-xs">
                            {isExpired ? (
                              <>
                                <span className="text-red-600">
                                  Expired {formatDate(earliestExpiration.expiration_date!)}
                                </span>
                              </>
                            ) : (
                              <>
                                <span className="text-foreground">
                                  Expires {formatDate(earliestExpiration.expiration_date!)}
                                </span>
                                <span className="ml-1.5 text-emerald-700 font-medium">
                                  — Current
                                </span>
                              </>
                            )}
                          </p>
                        ) : (
                          <p className="mt-1 text-xs text-muted-foreground">
                            No expiration date found
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Additional coverages (not required by template) */}
        {hasCertificate && additionalCoverages.length > 0 && (
          <AdditionalCoveragesSection coverages={additionalCoverages} />
        )}

        {/* No compliance template assigned */}
        {hasCertificate && templateRequirements.length === 0 && (
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
                  certificate detail page
                </Link>
                , where you can modify coverage details, entity names, and save changes.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Additional Coverages (collapsed section)
// ---------------------------------------------------------------------------
function AdditionalCoveragesSection({ coverages }: { coverages: ExtractedCoverage[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        <span className="text-xs font-medium text-muted-foreground flex-1">
          Additional coverages ({coverages.length}) — not required by template
        </span>
        {open ? (
          <ChevronDown className="h-4 w-4 text-slate-400" />
        ) : (
          <ChevronRight className="h-4 w-4 text-slate-400" />
        )}
      </button>
      {open && (
        <div className="border-t border-slate-200 bg-white px-4 py-2 space-y-2 rounded-b-lg">
          {coverages.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-1.5">
              <span className="text-sm text-foreground">
                {COVERAGE_LABELS[c.coverage_type] ?? c.coverage_type}
              </span>
              <span className="text-xs text-muted-foreground">
                {formatCurrency(c.limit_amount)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
