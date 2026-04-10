'use client';

import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  XCircle,
  HelpCircle,
  ArrowRight,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// ============================================================================
// Types (matching GET /api/reports/compliance response shape)
// ============================================================================

interface ReportSummary {
  totalEntities: number;
  compliantCount: number;
  nonCompliantCount: number;
  complianceScore: number;
  totalGaps: number;
  totalExposure: number;
  expiredCount: number;
  expiringIn30Days: number;
  needsSetupCount: number;
  underReviewCount: number;
  missingEndorsementCount: number;
}

interface ReportIssue {
  entityId: string;
  entityName: string;
  type: string;
  severity: 'critical' | 'warning';
  description: string;
}

interface VendorCoverage {
  coverageType: string;
  coverageTypeLabel: string;
  carrierName: string | null;
  policyNumber: string | null;
  limitAmount: number | null;
  limitType: string | null;
  effectiveDate: string | null;
  expirationDate: string | null;
  isExpired: boolean;
}

interface VendorRequirement {
  coverageType: string;
  coverageTypeLabel: string;
  minimumLimit: number | null;
  limitType: string | null;
  requiresAdditionalInsured: boolean;
  requiresWaiverOfSubrogation: boolean;
  status: 'met' | 'not_met' | 'missing' | 'not_required';
  gapDescription: string | null;
  dollarGap: number | null;
}

interface VendorGap {
  coverageType: string;
  coverageTypeLabel: string;
  gapType: string;
  requiredLimit: number | null;
  foundLimit: number | null;
  dollarGap: number | null;
  description: string;
}

interface VendorBreakdown {
  entityId: string;
  entityName: string;
  entityType: string;
  inferredVendorType: string | null;
  inferredVendorTypeLabel: string | null;
  vendorTypeNeedsReview: boolean;
  complianceStatus: string;
  totalExposure: number;
  coveragesOnFile: VendorCoverage[];
  requirements: VendorRequirement[];
  gaps: VendorGap[];
}

interface CoverageBreakdownItem {
  coverageType: string;
  coverageTypeLabel: string;
  entityCount: number;
  totalExposure: number;
  missingCount: number;
  insufficientCount: number;
  endorsementGapCount: number;
}

interface RecommendedAction {
  entityId: string;
  entityName: string;
  entityType: string;
  propertyName: string | null;
  severity: 'critical' | 'warning' | 'info';
  totalExposure: number;
  action: string;
  topGaps: string[];
}

interface NeedsReviewItem {
  entityId: string;
  entityName: string;
  inferredVendorType: string | null;
  inferredVendorTypeLabel: string | null;
}

interface ComplianceReport {
  generatedAt: string;
  organizationName: string;
  summary: ReportSummary;
  issues: ReportIssue[];
  vendors: VendorBreakdown[];
  coverageBreakdown: CoverageBreakdownItem[];
  recommendedActions: RecommendedAction[];
  needsReview: NeedsReviewItem[];
}

// ============================================================================
// Helpers
// ============================================================================

function formatDollars(amount: number): string {
  if (amount >= 1_000_000) {
    return `$${(amount / 1_000_000).toFixed(1)}M`;
  }
  if (amount >= 1_000) {
    return `$${(amount / 1_000).toFixed(0)}K`;
  }
  return `$${amount.toLocaleString()}`;
}

function formatFullDollars(amount: number): string {
  return `$${amount.toLocaleString()}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function scoreColor(score: number): { ring: string; text: string; bg: string } {
  if (score >= 80) return { ring: '#059669', text: 'text-emerald-700', bg: 'bg-emerald-50' };
  if (score >= 50) return { ring: '#d97706', text: 'text-amber-700', bg: 'bg-amber-50' };
  return { ring: '#dc2626', text: 'text-red-700', bg: 'bg-red-50' };
}

function statusConfig(status: string) {
  switch (status) {
    case 'compliant':
      return { label: 'Compliant', className: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
    case 'non_compliant':
      return { label: 'Non-Compliant', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'expired':
      return { label: 'Expired', className: 'bg-red-100 text-red-800 border-red-200' };
    case 'expiring_soon':
      return { label: 'Expiring Soon', className: 'bg-amber-100 text-amber-800 border-amber-200' };
    case 'needs_setup':
      return { label: 'Needs Setup', className: 'bg-purple-100 text-purple-800 border-purple-200' };
    case 'under_review':
      return { label: 'Under Review', className: 'bg-blue-100 text-blue-800 border-blue-200' };
    default:
      return { label: 'Pending', className: 'bg-slate-100 text-slate-800 border-slate-200' };
  }
}

// ============================================================================
// SVG Donut Chart
// ============================================================================

function DonutChart({ score, size = 180 }: { score: number; size?: number }) {
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const colors = scoreColor(score);

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={strokeWidth}
      />
      {/* Score ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={colors.ring}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        strokeLinecap="round"
        className="transition-all duration-1000 ease-out"
      />
      {/* Center text */}
      <text
        x={size / 2}
        y={size / 2}
        textAnchor="middle"
        dominantBaseline="central"
        className="transform rotate-90 origin-center fill-slate-900"
        style={{ fontSize: size * 0.22, fontWeight: 700 }}
      >
        {score}%
      </text>
    </svg>
  );
}

// ============================================================================
// Loading skeleton
// ============================================================================

function ReportSkeleton() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="space-y-3 mb-10">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-5 w-48" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
          <Skeleton className="h-52 rounded-2xl" />
        </div>
        <Skeleton className="h-40 rounded-2xl mb-6" />
        <Skeleton className="h-40 rounded-2xl mb-6" />
        <div className="space-y-4">
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
          <Skeleton className="h-24 rounded-2xl" />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Vendor detail expansion row
// ============================================================================

function VendorCard({ vendor }: { vendor: VendorBreakdown }) {
  const [expanded, setExpanded] = useState(false);
  const status = statusConfig(vendor.complianceStatus);
  const hasGaps = vendor.gaps.length > 0;

  return (
    <Card className={`transition-shadow ${hasGaps ? 'hover:shadow-md' : ''}`}>
      <button
        className="w-full text-left p-5 flex items-center gap-4"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-shrink-0">
          {expanded ? (
            <ChevronDown className="h-5 w-5 text-slate-400" />
          ) : (
            <ChevronRight className="h-5 w-5 text-slate-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-slate-900 truncate">
              {vendor.entityName}
            </span>
            {vendor.inferredVendorTypeLabel && !vendor.vendorTypeNeedsReview ? (
              <Badge variant="secondary">{vendor.inferredVendorTypeLabel}</Badge>
            ) : (
              <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                <HelpCircle className="h-3 w-3 mr-1" />
                Unclassified
              </Badge>
            )}
          </div>
          {hasGaps && (
            <p className="text-sm text-slate-500 mt-0.5">
              {vendor.gaps.length} gap{vendor.gaps.length !== 1 ? 's' : ''}
              {vendor.totalExposure > 0 && (
                <span className="text-red-600 font-medium">
                  {' '}&mdash; {formatFullDollars(vendor.totalExposure)} exposure
                </span>
              )}
            </p>
          )}
        </div>

        <Badge className={status.className}>{status.label}</Badge>
      </button>

      {expanded && (
        <CardContent className="pt-0 px-5 pb-5">
          <div className="border-t border-slate-100 pt-4 space-y-5">
            {/* Coverages on file */}
            {vendor.coveragesOnFile.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Coverages on File
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Coverage</th>
                        <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Carrier</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Limit</th>
                        <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Expires</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.coveragesOnFile.map((cov, i) => (
                        <tr key={i} className="border-b border-slate-50">
                          <td className="py-2 pr-4 font-medium text-slate-900">
                            {cov.coverageTypeLabel}
                          </td>
                          <td className="py-2 pr-4 text-slate-600">
                            {cov.carrierName ?? '—'}
                          </td>
                          <td className="py-2 pr-4 text-right text-slate-900 font-mono text-xs">
                            {cov.limitAmount != null
                              ? formatFullDollars(cov.limitAmount)
                              : cov.limitType === 'statutory'
                                ? 'Statutory'
                                : '—'}
                          </td>
                          <td className={`py-2 text-right text-xs whitespace-nowrap ${cov.isExpired ? 'text-red-600 font-semibold' : 'text-slate-600'}`}>
                            {cov.expirationDate
                              ? (cov.isExpired ? 'Expired ' : '') + formatDate(cov.expirationDate)
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Requirements vs actual */}
            {vendor.requirements.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
                  Requirements
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Coverage</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Required</th>
                        <th className="text-center py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Status</th>
                        <th className="text-left py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Gap</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vendor.requirements.map((req, i) => {
                        const isGap = req.status === 'not_met' || req.status === 'missing';
                        return (
                          <tr key={i} className={`border-b border-slate-50 ${isGap ? 'bg-red-50/50' : ''}`}>
                            <td className="py-2 pr-4 font-medium text-slate-900">
                              {req.coverageTypeLabel}
                              {req.requiresAdditionalInsured && (
                                <span className="ml-1 text-xs text-slate-400" title="Requires Additional Insured">+AI</span>
                              )}
                              {req.requiresWaiverOfSubrogation && (
                                <span className="ml-1 text-xs text-slate-400" title="Requires Waiver of Subrogation">+WoS</span>
                              )}
                            </td>
                            <td className="py-2 pr-4 text-right font-mono text-xs text-slate-700">
                              {req.minimumLimit != null
                                ? formatFullDollars(req.minimumLimit)
                                : req.limitType === 'statutory'
                                  ? 'Statutory'
                                  : '—'}
                            </td>
                            <td className="py-2 pr-4 text-center">
                              {req.status === 'met' && (
                                <CheckCircle2 className="h-4 w-4 text-emerald-600 inline" />
                              )}
                              {req.status === 'not_met' && (
                                <XCircle className="h-4 w-4 text-red-600 inline" />
                              )}
                              {req.status === 'missing' && (
                                <ShieldX className="h-4 w-4 text-red-600 inline" />
                              )}
                              {req.status === 'not_required' && (
                                <span className="text-xs text-slate-400">N/A</span>
                              )}
                            </td>
                            <td className="py-2 text-xs">
                              {isGap ? (
                                <span className="text-red-700">{req.gapDescription ?? 'Requirement not met'}</span>
                              ) : (
                                <span className="text-slate-400">—</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* No coverages or requirements */}
            {vendor.coveragesOnFile.length === 0 && vendor.requirements.length === 0 && (
              <p className="text-sm text-slate-500 italic">
                No certificate on file and no requirements configured.
              </p>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// Main report component
// ============================================================================

export function ReportClient() {
  const [report, setReport] = useState<ComplianceReport | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchReport() {
      try {
        const res = await fetch('/api/reports/compliance');
        if (!res.ok) {
          if (res.status === 401) {
            setError('Please log in to view your compliance report.');
          } else {
            setError('Failed to load compliance report. Please try again.');
          }
          return;
        }
        const data = await res.json();
        setReport(data);
      } catch {
        setError('Failed to load compliance report. Please check your connection.');
      } finally {
        setLoading(false);
      }
    }
    fetchReport();
  }, []);

  if (loading) return <ReportSkeleton />;

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center">
            <ShieldAlert className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Unable to Load Report
            </h2>
            <p className="text-sm text-slate-600 mb-4">{error}</p>
            <Button asChild>
              <Link href="/login">Log In</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!report) return null;

  const { summary, issues, vendors, recommendedActions, needsReview, coverageBreakdown } = report;
  const criticalIssues = issues.filter((i) => i.severity === 'critical');
  const warningIssues = issues.filter((i) => i.severity === 'warning');
  const colors = scoreColor(summary.complianceScore);
  const generatedDate = new Date(report.generatedAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-5xl mx-auto px-6 py-10 sm:py-14">

        {/* ---- Header ---- */}
        <div className="mb-10">
          <div className="flex items-center gap-2 mb-1">
            <ShieldCheck className="h-5 w-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-700">SmartCOI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-1">
            Compliance Report
          </h1>
          <p className="text-sm text-slate-500">
            {report.organizationName} &middot; Generated {generatedDate}
          </p>
        </div>

        {/* ---- Hero: Score + Stats ---- */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-10">
          {/* Compliance score donut */}
          <Card className={`flex flex-col items-center justify-center p-6 ${colors.bg}`}>
            <DonutChart score={summary.complianceScore} />
            <p className={`text-sm font-semibold mt-3 ${colors.text}`}>
              Compliance Score
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              {summary.compliantCount} of {summary.totalEntities} vendor{summary.totalEntities !== 1 ? 's' : ''} compliant
            </p>
          </Card>

          {/* Total gaps */}
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-2 mb-1">
              <ShieldX className="h-6 w-6 text-red-500" />
            </div>
            <p className="text-4xl font-bold text-red-700">{summary.totalGaps}</p>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Compliance Gaps
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
              {summary.expiredCount > 0 && (
                <span className="text-red-600">{summary.expiredCount} expired</span>
              )}
              {summary.expiringIn30Days > 0 && (
                <span className="text-amber-600">{summary.expiringIn30Days} expiring soon</span>
              )}
              {summary.missingEndorsementCount > 0 && (
                <span>{summary.missingEndorsementCount} missing endorsements</span>
              )}
            </div>
          </Card>

          {/* Dollar exposure */}
          <Card className="flex flex-col items-center justify-center p-6">
            <div className="flex items-center gap-2 mb-1">
              <AlertTriangle className="h-6 w-6 text-red-500" />
            </div>
            <p className={`text-4xl font-bold ${summary.totalExposure > 0 ? 'text-red-700' : 'text-emerald-700'}`}>
              {summary.totalExposure > 0 ? formatDollars(summary.totalExposure) : '$0'}
            </p>
            <p className="text-sm font-semibold text-slate-700 mt-1">
              Estimated Exposure
            </p>
            <p className="text-xs text-slate-500 mt-0.5">
              Total coverage shortfall across all vendors
            </p>
          </Card>
        </div>

        {/* ---- Section 1: Critical Issues ---- */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            Critical Issues
          </h2>
          {criticalIssues.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">
                No critical issues found. All policies are active and required coverages are on file.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {criticalIssues.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3"
                >
                  <ShieldX className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-red-900">
                      {issue.entityName}
                    </p>
                    <p className="text-sm text-red-700 mt-0.5">
                      {issue.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- Section 2: Warnings ---- */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
            Warnings
          </h2>
          {warningIssues.length === 0 ? (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-emerald-600 flex-shrink-0" />
              <p className="text-sm text-emerald-800 font-medium">
                No warnings. All limits meet requirements and nothing is expiring soon.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {warningIssues.map((issue, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3"
                >
                  <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-amber-900">
                      {issue.entityName}
                    </p>
                    <p className="text-sm text-amber-800 mt-0.5">
                      {issue.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ---- Section 3: Vendor-by-Vendor Breakdown ---- */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-slate-600" />
            Vendor Breakdown
          </h2>
          {vendors.length === 0 ? (
            <p className="text-sm text-slate-500">No vendors to display.</p>
          ) : (
            <div className="space-y-3">
              {vendors.map((vendor) => (
                <VendorCard key={vendor.entityId} vendor={vendor} />
              ))}
            </div>
          )}
        </section>

        {/* ---- Section 4: Recommended Actions ---- */}
        {recommendedActions.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-slate-600" />
              Recommended Actions
            </h2>
            <Card>
              <CardContent className="p-5">
                <ol className="space-y-4">
                  {recommendedActions.map((action, i) => (
                    <li key={action.entityId} className="flex items-start gap-3">
                      <span
                        className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold text-white ${
                          action.severity === 'critical'
                            ? 'bg-red-600'
                            : action.severity === 'warning'
                              ? 'bg-amber-500'
                              : 'bg-slate-400'
                        }`}
                      >
                        {i + 1}
                      </span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {action.entityName}
                          {action.totalExposure > 0 && (
                            <span className="ml-2 text-red-600 font-normal">
                              {formatFullDollars(action.totalExposure)} at risk
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-slate-700 mt-0.5">
                          {action.action}
                        </p>
                        {action.topGaps.length > 0 && (
                          <ul className="mt-1 space-y-0.5">
                            {action.topGaps.map((gap, j) => (
                              <li
                                key={j}
                                className="text-xs text-slate-500 pl-3 relative before:content-['•'] before:absolute before:left-0 before:text-slate-400"
                              >
                                {gap}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </li>
                  ))}
                </ol>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ---- Section 5: Summary Stats ---- */}
        <section className="mb-8">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Summary</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-slate-900">{summary.totalEntities}</p>
              <p className="text-xs text-slate-500 mt-0.5">Total Vendors</p>
            </Card>
            <Card className="p-4 text-center">
              <p className={`text-2xl font-bold ${colors.text}`}>{summary.complianceScore}%</p>
              <p className="text-xs text-slate-500 mt-0.5">Compliant</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-red-700">{summary.expiredCount}</p>
              <p className="text-xs text-slate-500 mt-0.5">Expired</p>
            </Card>
            <Card className="p-4 text-center">
              <p className="text-2xl font-bold text-amber-600">{summary.expiringIn30Days}</p>
              <p className="text-xs text-slate-500 mt-0.5">Expiring in 30d</p>
            </Card>
          </div>

          {/* Coverage breakdown table */}
          {coverageBreakdown.length > 0 && (
            <Card className="mt-4">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Issue Breakdown by Coverage Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Coverage Type</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Vendors Affected</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Missing</th>
                        <th className="text-right py-2 pr-4 text-xs font-medium text-slate-500 uppercase tracking-wider">Insufficient</th>
                        <th className="text-right py-2 text-xs font-medium text-slate-500 uppercase tracking-wider">Exposure</th>
                      </tr>
                    </thead>
                    <tbody>
                      {coverageBreakdown.map((cb) => (
                        <tr key={cb.coverageType} className="border-b border-slate-50">
                          <td className="py-2 pr-4 font-medium text-slate-900">{cb.coverageTypeLabel}</td>
                          <td className="py-2 pr-4 text-right text-slate-700">{cb.entityCount}</td>
                          <td className="py-2 pr-4 text-right text-red-600 font-medium">{cb.missingCount || '—'}</td>
                          <td className="py-2 pr-4 text-right text-amber-600 font-medium">{cb.insufficientCount || '—'}</td>
                          <td className="py-2 text-right text-red-700 font-mono text-xs font-medium">
                            {cb.totalExposure > 0 ? formatFullDollars(cb.totalExposure) : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </section>

        {/* ---- Section 6: Vendors We Couldn't Classify ---- */}
        {needsReview.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-bold text-slate-900 mb-3 flex items-center gap-2">
              <HelpCircle className="h-5 w-5 text-amber-600" />
              Vendors We Couldn&apos;t Classify
            </h2>
            <Card>
              <CardContent className="p-5">
                <p className="text-sm text-slate-600 mb-3">
                  These vendors were assigned a type automatically, but our AI wasn&apos;t
                  confident in the classification. Review and correct if needed from
                  your dashboard.
                </p>
                <div className="space-y-2">
                  {needsReview.map((item) => (
                    <div
                      key={item.entityId}
                      className="flex items-center justify-between py-2 px-3 rounded-lg bg-amber-50 border border-amber-100"
                    >
                      <div className="flex items-center gap-2">
                        <HelpCircle className="h-4 w-4 text-amber-500" />
                        <span className="text-sm font-medium text-slate-900">
                          {item.entityName}
                        </span>
                      </div>
                      <Badge className="bg-amber-100 text-amber-800 border-amber-200">
                        {item.inferredVendorTypeLabel ?? 'Unknown'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* ---- Upgrade CTA ---- */}
        <section className="mt-12 mb-6">
          <Card className="border-slate-200 bg-white">
            <CardContent className="p-8 sm:p-10 text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock className="h-5 w-5 text-slate-500" />
              </div>
              <p className="text-sm text-slate-700 max-w-xl mx-auto mb-2">
                This report is accurate as of {generatedDate}. Certificates
                expire, vendors change, and new compliance gaps can appear at any
                time.
              </p>
              <p className="text-sm text-slate-600 max-w-xl mx-auto mb-6">
                Activate monitoring to get alerts the moment something changes
                &mdash; your data is already set up.
              </p>
              <Button asChild size="lg" className="bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href="/#pricing">
                  Start Monitoring &mdash; $79/month
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <div className="mt-3">
                <Link
                  href="/#pricing"
                  className="text-sm text-slate-500 hover:text-slate-700 underline underline-offset-2"
                >
                  See all plans
                </Link>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
