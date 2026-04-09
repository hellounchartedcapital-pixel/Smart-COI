'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  CheckCircle2,
  XCircle,
  ChevronDown,
  ChevronRight,
  AlertTriangle,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatCoverageType, coverageTypeMatchScore } from '@/lib/coverage-utils';
import type {
  Certificate,
  ComplianceResult,
  EndorsementRecord,
  EndorsementVerification,
  EntityComplianceResult,
  ExtractedCoverage,
  PropertyEntity,
  TemplateCoverageRequirement,
} from '@/types';

function formatCurrency(amount: number | null | undefined): string {
  if (!amount) return '\u2014';
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

const LIMIT_TYPE_SUFFIXES: Record<string, string> = {
  per_occurrence: 'per occurrence',
  aggregate: 'aggregate',
};

function getCoverageDisplayName(coverageType: string, limitType: string | null | undefined): string {
  const base = formatCoverageType(coverageType);
  const suffix = limitType ? LIMIT_TYPE_SUFFIXES[limitType] : null;
  return suffix ? `${base} (${suffix})` : base;
}

// ============================================================================
// Info tooltip — CSS-only hover tooltip
// ============================================================================

function InfoTooltip({ text }: { text: string }) {
  return (
    <span className="relative inline-flex items-center ml-1 group/tip">
      <Info className="h-3.5 w-3.5 text-slate-400 cursor-help" />
      <span className="pointer-events-none absolute left-1/2 bottom-full mb-1.5 -translate-x-1/2 w-[250px] rounded-md bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600 shadow-lg ring-1 ring-slate-200 opacity-0 transition-opacity duration-150 delay-200 group-hover/tip:opacity-100 group-hover/tip:pointer-events-auto z-50">
        {text}
      </span>
    </span>
  );
}

// ============================================================================
// Coverage requirement tooltip descriptions
// ============================================================================

function getCoverageTooltip(coverageType: string, limitType: string | null | undefined): string | null {
  if (coverageType === 'general_liability') {
    if (limitType === 'aggregate') {
      return 'The maximum total amount the insurer will pay for all claims during the policy period.';
    }
    return 'The maximum amount the insurer will pay for a single claim or incident.';
  }
  const tooltips: Record<string, string> = {
    automobile_liability: 'Covers liability for bodily injury and property damage arising from the use of vehicles.',
    workers_compensation: 'Covers employee injuries and illnesses that occur on the job. Statutory means state-required minimum limits.',
    employers_liability: "Covers employer liability for employee injuries beyond what Workers' Compensation covers.",
    umbrella_excess_liability: 'Provides additional coverage above the limits of underlying policies like GL and Auto.',
  };
  return tooltips[coverageType] ?? null;
}

// ============================================================================
// Endorsement verification helpers
// ============================================================================

interface EndorsementItem {
  label: string;
  verification: EndorsementVerification;
  detail: string;
  hint: string | null;
}

function getEndorsementVerification(
  endorsements: EndorsementRecord[] | null | undefined,
  indicatedOnCert: boolean,
  endorsementTypes: string[],
): { verification: EndorsementVerification; matchedEndorsement: EndorsementRecord | null } {
  if (!indicatedOnCert) {
    return { verification: 'indicated', matchedEndorsement: null };
  }

  const records = endorsements ?? [];
  const hasAnyEndorsements = records.length > 0;

  // Find a matching endorsement
  const matched = records.find(
    (e) => e.found && endorsementTypes.some((t) => e.type.toLowerCase().includes(t.toLowerCase()))
  );

  if (matched) {
    return { verification: 'verified', matchedEndorsement: matched };
  }

  // Multi-page upload (has endorsement data) but no matching endorsement found
  if (hasAnyEndorsements) {
    return { verification: 'warning', matchedEndorsement: null };
  }

  // Single-page upload — just indicated
  return { verification: 'indicated', matchedEndorsement: null };
}

function buildEndorsementItems(
  extractedCoverages: ExtractedCoverage[],
  endorsements: EndorsementRecord[] | null | undefined,
  hasAdditionalInsuredEntityRows: boolean,
): EndorsementItem[] {
  const items: EndorsementItem[] = [];

  // Only show standalone Additional Insured endorsement row if there are
  // no property entity rows of type additional_insured (to avoid duplicates).
  // When property entity rows exist, the endorsement status is overlaid on those rows.
  const hasAdditionalInsured = extractedCoverages.some((c) => c.additional_insured_listed);
  if (hasAdditionalInsured && !hasAdditionalInsuredEntityRows) {
    const { verification, matchedEndorsement } = getEndorsementVerification(
      endorsements,
      true,
      ['CG 20 10', 'CG 20 37', 'CG 20 26', 'Additional Insured'],
    );
    items.push({
      label: 'Additional Insured',
      verification,
      detail: verification === 'verified' && matchedEndorsement
        ? `Verified \u2014 ${matchedEndorsement.form_number ?? matchedEndorsement.type} endorsement attached`
        : verification === 'warning'
          ? 'Indicated on certificate but endorsement not attached'
          : 'Found on certificate',
      hint: verification === 'indicated' ? 'Upload endorsement pages for full verification' : null,
    });
  }

  // Check if any coverage has waiver of subrogation
  const hasWaiverOfSub = extractedCoverages.some((c) => c.waiver_of_subrogation);
  if (hasWaiverOfSub) {
    const { verification, matchedEndorsement } = getEndorsementVerification(
      endorsements,
      true,
      ['Waiver of Subrogation', 'CG 24 04'],
    );
    items.push({
      label: 'Waiver of Subrogation',
      verification,
      detail: verification === 'verified' && matchedEndorsement
        ? `Verified \u2014 ${matchedEndorsement.form_number ?? matchedEndorsement.type} endorsement attached`
        : verification === 'warning'
          ? 'Indicated on certificate but endorsement not attached'
          : 'Found on certificate',
      hint: verification === 'indicated' ? 'Upload endorsement pages for full verification' : null,
    });
  }

  // Check for Primary and Non-Contributory
  const hasPrimaryNC = endorsements?.some(
    (e) => e.found && e.type.toLowerCase().includes('primary')
  );
  if (hasPrimaryNC) {
    const matched = endorsements!.find(
      (e) => e.found && e.type.toLowerCase().includes('primary')
    );
    items.push({
      label: 'Primary & Non-Contributory',
      verification: 'verified',
      detail: `Verified \u2014 ${matched?.form_number ?? 'Primary and Non-Contributory'} endorsement attached`,
      hint: null,
    });
  }

  return items;
}

/** Get the endorsement verification status for Additional Insured, used to overlay on entity rows */
function getAdditionalInsuredEndorsementStatus(
  extractedCoverages: ExtractedCoverage[],
  endorsements: EndorsementRecord[] | null | undefined,
): { verification: EndorsementVerification; matchedEndorsement: EndorsementRecord | null } | null {
  const hasAdditionalInsured = extractedCoverages.some((c) => c.additional_insured_listed);
  if (!hasAdditionalInsured) return null;
  return getEndorsementVerification(
    endorsements,
    true,
    ['CG 20 10', 'CG 20 37', 'CG 20 26', 'Additional Insured'],
  );
}

// ============================================================================
// Main component
// ============================================================================

interface CompactComplianceViewProps {
  entityType: 'vendor' | 'tenant';
  entityId: string;
  hasCertificate: boolean;
  templateRequirements: TemplateCoverageRequirement[];
  complianceResults: ComplianceResult[];
  extractedCoverages: ExtractedCoverage[];
  entityResults: EntityComplianceResult[];
  propertyEntities: PropertyEntity[];
  latestCert?: Certificate & { compliance_results?: ComplianceResult[] };
}

export function CompactComplianceView({
  entityType,
  entityId,
  hasCertificate,
  templateRequirements,
  complianceResults,
  extractedCoverages,
  entityResults,
  propertyEntities,
  latestCert,
}: CompactComplianceViewProps) {
  const [hasExpiredCoverage, setHasExpiredCoverage] = useState(false);
  useEffect(() => {
    const now = new Date();
    setHasExpiredCoverage(
      extractedCoverages.some((c) => {
        if (!c.expiration_date) return false;
        return new Date(c.expiration_date) < now;
      })
    );
  }, [extractedCoverages]);

  const additionalCoverages = extractedCoverages.filter(
    (c) => !templateRequirements.some(
      (r) => coverageTypeMatchScore(r.coverage_type, c.coverage_type) >= 0.7
    )
  );

  const hasAdditionalInsuredEntityRows = propertyEntities.some(
    (pe) => pe.entity_type === 'additional_insured'
  );
  const endorsementItems = hasCertificate
    ? buildEndorsementItems(extractedCoverages, latestCert?.endorsement_data, hasAdditionalInsuredEntityRows)
    : [];
  const aiEndorsementStatus = hasCertificate
    ? getAdditionalInsuredEndorsementStatus(extractedCoverages, latestCert?.endorsement_data)
    : null;

  if (!hasCertificate) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-sm text-muted-foreground">
          No certificate uploaded yet.
        </p>
        <Button size="sm" className="mt-3 bg-emerald-600 hover:bg-emerald-700" asChild>
          <Link href={`/dashboard/certificates/upload?${entityType}Id=${entityId}`}>
            Upload COI
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Coverage Requirements */}
      {templateRequirements.length > 0 && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Coverage Requirements
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {templateRequirements.map((req) => {
              const result = complianceResults.find(
                (r) => r.coverage_requirement_id === req.id
              );
              // Match by coverage_type (fuzzy) AND limit_type — same logic as compliance engine
              const coverage = extractedCoverages.find(
                (c) =>
                  coverageTypeMatchScore(req.coverage_type, c.coverage_type) >= 0.7 &&
                  (req.limit_type == null || c.limit_type === req.limit_type)
              );
              const isMet = result?.status === 'met';

              return (
                <div key={req.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  {isMet ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground inline-flex items-center">
                        {getCoverageDisplayName(req.coverage_type, req.limit_type)}
                        {getCoverageTooltip(req.coverage_type, req.limit_type) && (
                          <InfoTooltip text={getCoverageTooltip(req.coverage_type, req.limit_type)!} />
                        )}
                      </span>
                      <span className="shrink-0 inline-flex items-baseline gap-1.5 text-xs">
                        {coverage ? (
                          <>
                            <span className={isMet ? 'text-emerald-700 font-medium' : 'text-red-600 font-medium'}>
                              {formatCurrency(coverage.limit_amount)}
                            </span>
                            <span className="text-muted-foreground">/</span>
                            <span className="text-muted-foreground">
                              {formatCurrency(req.minimum_limit)} req
                            </span>
                          </>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatCurrency(req.minimum_limit)} req
                          </span>
                        )}
                      </span>
                    </div>
                    {!coverage && (
                      <p className="mt-0.5 text-xs text-red-600">Not found on certificate</p>
                    )}
                    {result?.gap_description && (
                      <p className="mt-0.5 text-xs text-amber-700">
                        {result.gap_description}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Certificate Details: Entity checks + endorsements */}
      {(propertyEntities.length > 0 || hasExpiredCoverage || extractedCoverages.length > 0) && (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              Certificate Details
            </h3>
          </div>
          <div className="divide-y divide-slate-50">
            {/* Certificate Holder & Additional Insured */}
            {propertyEntities.map((pe) => {
              const result = entityResults.find(
                (er) => er.property_entity_id === pe.id
              );
              const isMet = result?.status === 'found';
              const isFuzzy = result?.match_details != null;
              const label = pe.entity_type === 'certificate_holder'
                ? 'Certificate Holder'
                : 'Additional Insured';

              // For additional_insured entities, overlay endorsement verification
              const showEndorsement = pe.entity_type === 'additional_insured' && isMet && aiEndorsementStatus;
              const isVerified = showEndorsement && aiEndorsementStatus?.verification === 'verified';
              const isWarning = showEndorsement && aiEndorsementStatus?.verification === 'warning';

              return (
                <div key={pe.id} className="flex items-start gap-2.5 px-4 py-2.5">
                  {isMet ? (
                    isVerified ? (
                      <div className="relative shrink-0 mt-0.5">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                        <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-600" />
                      </div>
                    ) : isWarning ? (
                      <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {label}
                        {isMet && isFuzzy && !showEndorsement && (
                          <span className="ml-1.5 text-[10px] text-muted-foreground font-normal">
                            (fuzzy match)
                          </span>
                        )}
                        {isVerified && (
                          <span className="ml-1.5 inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
                            Verified
                          </span>
                        )}
                      </span>
                      <span className="text-xs text-muted-foreground shrink-0">
                        Required: {pe.entity_name}
                      </span>
                    </div>
                    {isMet ? (
                      isVerified && aiEndorsementStatus?.matchedEndorsement ? (
                        <span className="text-xs text-emerald-700 inline-flex items-center">
                          Verified — {aiEndorsementStatus.matchedEndorsement.form_number ?? aiEndorsementStatus.matchedEndorsement.type} endorsement attached
                          <InfoTooltip text="Verified means the actual endorsement document was found in the uploaded certificate pages, confirming this coverage provision is legally in place." />
                        </span>
                      ) : isWarning ? (
                        <span className="text-xs text-amber-700 inline-flex items-center">
                          Found on certificate — endorsement not attached
                          <InfoTooltip text="This item is indicated on the ACORD 25 form but no endorsement document was attached to confirm it. Upload the full certificate packet including endorsement pages for full verification." />
                        </span>
                      ) : (
                        <span className="text-xs text-emerald-700 inline-flex items-center">
                          Found on certificate
                          {pe.entity_type === 'certificate_holder' ? (
                            <InfoTooltip text="This entity was matched in the certificate holder section of the ACORD 25 form." />
                          ) : showEndorsement && aiEndorsementStatus?.verification === 'indicated' ? (
                            <InfoTooltip text="This item is indicated on the ACORD 25 form but no endorsement document was attached to confirm it. Upload the full certificate packet including endorsement pages for full verification." />
                          ) : (
                            <InfoTooltip text="This entity was matched in the certificate holder section of the ACORD 25 form." />
                          )}
                        </span>
                      )
                    ) : (
                      <span className="text-xs text-red-600">Not found on certificate</span>
                    )}
                    {result?.match_details && (
                      <p className="text-[10px] text-muted-foreground italic">
                        {result.match_details}
                      </p>
                    )}
                    {isMet && showEndorsement && aiEndorsementStatus?.verification === 'indicated' && (
                      <p className="text-[10px] text-muted-foreground mt-0.5">Upload endorsement pages for full verification</p>
                    )}
                  </div>
                </div>
              );
            })}
            {propertyEntities.length === 0 && (
              <>
                <div className="flex items-start gap-2.5 px-4 py-2.5">
                  <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Certificate Holder</span>
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5 px-4 py-2.5">
                  <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-foreground">Additional Insured</span>
                    <p className="text-xs text-muted-foreground">Not configured</p>
                  </div>
                </div>
              </>
            )}

            {/* Endorsement verification items */}
            {endorsementItems.map((item) => (
              <EndorsementRow key={item.label} item={item} />
            ))}

            {/* Expiration */}
            {(() => {
              const earliestExpiration = extractedCoverages
                .filter((c) => c.expiration_date)
                .sort((a, b) => new Date(a.expiration_date!).getTime() - new Date(b.expiration_date!).getTime())[0];

              return (
                <div className="flex items-start gap-2.5 px-4 py-2.5">
                  {earliestExpiration ? (
                    hasExpiredCoverage ? (
                      <XCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    )
                  ) : (
                    <div className="h-4 w-4 rounded-full bg-slate-200 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <span className="text-sm font-medium text-foreground">Expiration</span>
                    {earliestExpiration ? (
                      <p className="text-xs inline-flex items-center">
                        {hasExpiredCoverage ? (
                          <span className="text-red-600 inline-flex items-center">
                            Expired {formatDate(earliestExpiration.expiration_date!)}
                            <InfoTooltip text="This certificate has expired. Request an updated certificate from the vendor." />
                          </span>
                        ) : (
                          <span className="inline-flex items-center">
                            <span className="text-foreground">
                              Expires {formatDate(earliestExpiration.expiration_date!)}
                            </span>
                            <span className="ml-1.5 text-emerald-700 font-medium">
                              — Current
                            </span>
                            <InfoTooltip text="This certificate's expiration date has not passed." />
                          </span>
                        )}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">No expiration date found</p>
                    )}
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      )}

      {/* Additional coverages (not required by template) */}
      {additionalCoverages.length > 0 && (
        <AdditionalCoveragesSection coverages={additionalCoverages} />
      )}

      {/* No compliance template assigned */}
      {templateRequirements.length === 0 && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-center">
          <p className="text-sm text-muted-foreground">
            No compliance template assigned. Assign a template to see compliance results.
          </p>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// Endorsement row — 3-state display
// ============================================================================

function EndorsementRow({ item }: { item: EndorsementItem }) {
  if (item.verification === 'verified') {
    return (
      <div className="flex items-start gap-2.5 px-4 py-2.5">
        <div className="relative shrink-0 mt-0.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          <ShieldCheck className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-medium text-foreground">{item.label}</span>
            <span className="inline-flex items-center rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20">
              Verified
            </span>
          </div>
          <span className="text-xs text-emerald-700 inline-flex items-center">
            {item.detail}
            <InfoTooltip text="Verified means the actual endorsement document was found in the uploaded certificate pages, confirming this coverage provision is legally in place." />
          </span>
        </div>
      </div>
    );
  }

  if (item.verification === 'warning') {
    return (
      <div className="flex items-start gap-2.5 px-4 py-2.5">
        <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <span className="text-sm font-medium text-foreground">{item.label}</span>
          <p className="text-xs text-amber-700 inline-flex items-center">
            {item.detail}
            <InfoTooltip text="This item is indicated on the ACORD 25 form but no endorsement document was attached to confirm it. Upload the full certificate packet including endorsement pages for full verification." />
          </p>
        </div>
      </div>
    );
  }

  // State 1: "Indicated" — green check with soft hint
  return (
    <div className="flex items-start gap-2.5 px-4 py-2.5">
      <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <span className="text-sm font-medium text-foreground">{item.label}</span>
        <p className="text-xs text-emerald-700 inline-flex items-center">
          {item.detail}
          <InfoTooltip text="This item is indicated on the ACORD 25 form but no endorsement document was attached to confirm it. Upload the full certificate packet including endorsement pages for full verification." />
        </p>
        {item.hint && (
          <p className="text-[10px] text-muted-foreground mt-0.5">{item.hint}</p>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Additional coverages (collapsible)
// ============================================================================

function AdditionalCoveragesSection({ coverages }: { coverages: ExtractedCoverage[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
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
        <div className="border-t border-slate-200 bg-white px-4 py-2 space-y-1 rounded-b-lg">
          {coverages.map((c) => (
            <div key={c.id} className="flex items-center justify-between py-1">
              <span className="text-sm text-foreground">
                {formatCoverageType(c.coverage_type)}
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
