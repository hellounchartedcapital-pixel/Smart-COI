'use client';

import { useState, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';
import { sendManualFollowUp } from '@/lib/actions/notifications';
import { useUpgradeModal } from '@/components/dashboard/upgrade-modal';
import { handleActionError, handleActionResult } from '@/lib/handle-action-error';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatTimeAgo, formatDate } from '@/lib/utils';
import { UploadCOIDialog } from '@/components/dashboard/upload-coi-dialog';
import { DashboardTutorial, useTutorial } from '@/components/dashboard/dashboard-tutorial';
import {
  ShieldCheck,
  Upload,
  Mail,
  CheckCircle2,
  FileCheck,
  Bell,
  ArrowRight,
  User,
  X,
  RefreshCw,
  Sparkles,
  CalendarClock,
  Building2,
  Plus,
  ChevronRight,
  AlertCircle,
  Clock,
  TrendingUp,
} from 'lucide-react';
import type {
  DashboardStats,
  StatusDistribution,
  ActionItem,
  PropertyOverview,
  ActivityEntry,
} from '@/app/(dashboard)/dashboard/page';
import type { ActivityAction } from '@/types';

// ============================================================================
// Props
// ============================================================================

interface UploadDialogEntity {
  id: string;
  company_name: string;
  property_id: string | null;
}

interface UploadDialogProperty {
  id: string;
  name: string;
}

interface DashboardClientProps {
  stats: DashboardStats;
  statusDistribution: StatusDistribution;
  actionItems: ActionItem[];
  propertyOverviews: PropertyOverview[];
  activity: ActivityEntry[];
  notificationsSentThisMonth: number;
  propertyList: UploadDialogProperty[];
  vendorList: UploadDialogEntity[];
  tenantList: UploadDialogEntity[];
  showAssignBanner?: boolean;
}

// ============================================================================
// Status configuration
// ============================================================================

const STATUS_CONFIG: Record<
  keyof StatusDistribution,
  { label: string; color: string; bgColor: string; borderColor: string; pillBg: string; pillText: string; dotColor: string }
> = {
  compliant: {
    label: 'Compliant',
    color: 'text-emerald-700',
    bgColor: 'bg-status-compliant',
    borderColor: 'border-l-status-compliant',
    pillBg: 'bg-emerald-50 hover:bg-emerald-100',
    pillText: 'text-emerald-700',
    dotColor: 'bg-emerald-500',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'text-amber-700',
    bgColor: 'bg-status-expiring',
    borderColor: 'border-l-status-expiring',
    pillBg: 'bg-amber-50 hover:bg-amber-100',
    pillText: 'text-amber-700',
    dotColor: 'bg-amber-500',
  },
  non_compliant: {
    label: 'Non-Compliant',
    color: 'text-red-600',
    bgColor: 'bg-status-non-compliant',
    borderColor: 'border-l-status-non-compliant',
    pillBg: 'bg-red-50 hover:bg-red-100',
    pillText: 'text-red-700',
    dotColor: 'bg-red-500',
  },
  expired: {
    label: 'Expired',
    color: 'text-red-700',
    bgColor: 'bg-status-expired',
    borderColor: 'border-l-status-expired',
    pillBg: 'bg-red-50 hover:bg-red-100',
    pillText: 'text-red-700',
    dotColor: 'bg-red-600',
  },
  pending: {
    label: 'Pending',
    color: 'text-slate-500',
    bgColor: 'bg-status-pending',
    borderColor: 'border-l-status-pending',
    pillBg: 'bg-slate-50 hover:bg-slate-100',
    pillText: 'text-slate-600',
    dotColor: 'bg-slate-400',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-600',
    bgColor: 'bg-status-under-review',
    borderColor: 'border-l-status-under-review',
    pillBg: 'bg-blue-50 hover:bg-blue-100',
    pillText: 'text-blue-600',
    dotColor: 'bg-blue-500',
  },
};

const ACTIVITY_ICONS: Record<ActivityAction, typeof Upload> = {
  coi_uploaded: Upload,
  portal_upload_received: Upload,
  coi_processed: Sparkles,
  coi_review_confirmed: CheckCircle2,
  compliance_checked: CheckCircle2,
  notification_sent: Bell,
  status_changed: RefreshCw,
  template_updated: FileCheck,
  vendor_created: User,
  tenant_created: User,
};

// ============================================================================
// Filter type for stat pills
// ============================================================================

type PillFilter = keyof StatusDistribution | null;

// ============================================================================
// Main component
// ============================================================================

export function DashboardClient({
  stats,
  statusDistribution,
  actionItems,
  propertyOverviews,
  activity,
  notificationsSentThisMonth,
  propertyList,
  vendorList,
  tenantList,
  showAssignBanner,
}: DashboardClientProps) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  const [pillFilter, setPillFilter] = useState<PillFilter>(null);
  const { showTutorial, startTutorial, closeTutorial } = useTutorial();

  const filteredActionItems = useMemo(() => {
    if (!pillFilter) return actionItems;
    return actionItems.filter((item) => item.status === pillFilter);
  }, [actionItems, pillFilter]);

  const rateColor =
    stats.complianceRate == null
      ? 'text-slate-400'
      : stats.complianceRate >= 80
        ? 'text-emerald-600'
        : stats.complianceRate >= 60
          ? 'text-amber-600'
          : 'text-red-600';

  const thisMonthStats = useMemo(() => {
    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const monthStartTime = monthStart.getTime();

    let coisUploaded = 0;
    let vendorsAdded = 0;
    let portalUploads = 0;

    for (const entry of activity) {
      if (new Date(entry.created_at).getTime() < monthStartTime) continue;
      if (entry.action === 'coi_uploaded') coisUploaded++;
      if (entry.action === 'vendor_created') vendorsAdded++;
      if (entry.action === 'portal_upload_received') portalUploads++;
    }

    return { coisUploaded, vendorsAdded, portalUploads };
  }, [activity]);

  const upcomingExpirations = useMemo(() => {
    return actionItems
      .filter(
        (item) =>
          item.status === 'expiring_soon' &&
          item.daysUntilExpiration != null &&
          item.daysUntilExpiration <= 30
      )
      .sort((a, b) => (a.daysUntilExpiration ?? 0) - (b.daysUntilExpiration ?? 0))
      .slice(0, 5);
  }, [actionItems]);

  const handlePillClick = (status: keyof StatusDistribution) => {
    setPillFilter(pillFilter === status ? null : status);
  };

  return (
    <div className="space-y-8">
      <DashboardTutorial active={showTutorial} onClose={closeTutorial} />

      {/* Assign requirements banner */}
      {showAssignBanner && !bannerDismissed && (
        <div className="flex items-center justify-between rounded-xl border border-amber-200 bg-amber-50 px-5 py-3.5">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              Assign requirements to see your compliance results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/vendors"
              className="inline-flex items-center gap-1 rounded-lg bg-amber-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 transition-colors"
            >
              Assign now <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="rounded-lg p-1 text-amber-500 hover:text-amber-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Greeting + Actions ---- */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between" data-tutorial="dashboard-overview">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">
            Hello{stats.propertyCount > 0 ? '' : ' there'}
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Here&apos;s what&apos;s going on with your portfolio today.
          </p>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" size="sm" onClick={startTutorial} className="text-xs text-slate-500 hover:text-slate-700">
            Take a Tour
          </Button>
          <Button onClick={() => setUploadOpen(true)} data-tutorial="upload-coi" className="rounded-lg">
            <Upload className="mr-2 h-4 w-4" />
            Upload COI
          </Button>
        </div>
      </div>

      <UploadCOIDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        properties={propertyList}
        vendors={vendorList}
        tenants={tenantList}
      />

      {/* ---- Two-column layout ---- */}
      <div className="grid items-start gap-8 lg:grid-cols-[1fr_360px]">
        {/* Left column: Action items + Properties */}
        <div className="space-y-8">
          {/* Portfolio Health Summary */}
          <div className="rounded-2xl border border-slate-200/60 bg-white p-6" data-tour="health-pills">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-5">
                <div>
                  <div className="flex items-baseline gap-2">
                    <span className={`text-4xl font-bold tracking-tight ${rateColor}`}>
                      {stats.complianceRate != null ? `${stats.complianceRate}%` : '—'}
                    </span>
                    <span className={`text-base font-medium ${rateColor}`}>Compliant</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">
                    Across {stats.propertyCount} {stats.propertyCount === 1 ? 'property' : 'properties'},{' '}
                    {stats.vendorCount} {stats.vendorCount === 1 ? 'vendor' : 'vendors'},{' '}
                    {stats.tenantCount} {stats.tenantCount === 1 ? 'tenant' : 'tenants'}
                  </p>
                </div>
              </div>
            </div>

            {/* Status filter pills */}
            <div className="mt-5 flex flex-wrap gap-2">
              {(
                ['compliant', 'expiring_soon', 'expired', 'non_compliant', 'pending'] as const
              ).map((status) => {
                const config = STATUS_CONFIG[status];
                const count = statusDistribution[status];
                const isActive = pillFilter === status;
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => handlePillClick(status)}
                    className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all ${
                      isActive
                        ? `${config.pillBg} ${config.pillText} ring-2 ring-offset-1 ring-current`
                        : `${config.pillBg} ${config.pillText}`
                    }`}
                  >
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${config.dotColor}`}
                    />
                    {config.label} {count}
                  </button>
                );
              })}
              {pillFilter && (
                <button
                  type="button"
                  onClick={() => setPillFilter(null)}
                  className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50"
                >
                  <X className="h-3 w-3" />
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Action Queue — "Things to do" */}
          <ActionQueue
            items={filteredActionItems}
            totalCount={actionItems.length}
            pillFilter={pillFilter}
          />

          {/* Properties Grid */}
          <PropertiesSection properties={propertyOverviews} />
        </div>

        {/* Right sidebar: Summary cards + Activity + Stats + Expirations */}
        <div className="space-y-6" data-tour="portfolio-snapshot">
          {/* Portfolio Overview Card */}
          <SummaryCard
            title="Portfolio Overview"
            icon={Building2}
          >
            <div className="grid grid-cols-3 gap-4">
              <SummaryStatBlock label="Properties" value={stats.propertyCount} />
              <SummaryStatBlock label="Vendors" value={stats.vendorCount} />
              <SummaryStatBlock label="Tenants" value={stats.tenantCount} />
            </div>
          </SummaryCard>

          {/* Compliance Score Card */}
          <SummaryCard
            title="Compliance Score"
            icon={ShieldCheck}
          >
            <div className="flex items-center gap-4">
              <div className={`text-3xl font-bold tracking-tight ${rateColor}`}>
                {stats.complianceRate != null ? `${stats.complianceRate}%` : '—'}
              </div>
              <div className="flex-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full bg-emerald-500 transition-all"
                    style={{ width: `${stats.complianceRate ?? 0}%` }}
                  />
                </div>
              </div>
            </div>
          </SummaryCard>

          {/* Expiring Soon Card */}
          <SummaryCard
            title="Expiring Soon"
            icon={Clock}
            action={
              stats.expiringSoonCount > 0
                ? { label: 'View All', onClick: () => handlePillClick('expiring_soon') }
                : undefined
            }
          >
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{stats.expiringSoonCount}</span>
              <span className="text-sm text-slate-500">in next 30 days</span>
            </div>
          </SummaryCard>

          {/* Activity Feed */}
          <ActivitySidebar entries={activity} />

          {/* Quick Stats */}
          <QuickStatsCard
            coisUploaded={thisMonthStats.coisUploaded}
            remindersSent={notificationsSentThisMonth}
            vendorsAdded={thisMonthStats.vendorsAdded}
            portalUploads={thisMonthStats.portalUploads}
          />

          {/* Upcoming Expirations */}
          <UpcomingExpirations
            items={upcomingExpirations}
            onFilterExpiring={() => setPillFilter('expiring_soon')}
          />
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Summary Card wrapper (right sidebar)
// ============================================================================

function SummaryCard({
  title,
  icon: Icon,
  action,
  children,
}: {
  title: string;
  icon: typeof Building2;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
            <Icon className="h-4 w-4 text-slate-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            {action.label}
            <ChevronRight className="h-3 w-3" />
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function SummaryStatBlock({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="mt-0.5 text-[11px] text-slate-500">{label}</p>
    </div>
  );
}

// ============================================================================
// Properties Grid
// ============================================================================

function PropertiesSection({ properties }: { properties: PropertyOverview[] }) {
  return (
    <div data-tutorial="properties-section">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-slate-900">
          Properties
        </h2>
        <Link
          href="/dashboard/properties"
          className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          View All
          <ChevronRight className="h-3 w-3" />
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {properties.map((p) => (
          <PropertyCard key={p.id} property={p} />
        ))}
        <AddPropertyCard />
      </div>
    </div>
  );
}

function PropertyCard({ property }: { property: PropertyOverview }) {
  const total = property.total;
  const withCert = total - property.pending;
  const complianceRate =
    withCert > 0 ? Math.round((property.compliant / withCert) * 100) : null;

  const segments: { key: keyof StatusDistribution; count: number }[] = (
    ['compliant', 'expiring_soon', 'non_compliant', 'expired', 'pending', 'under_review'] as const
  )
    .map((key) => ({ key, count: property[key] }))
    .filter((s) => s.count > 0);

  let urgentIssue: string | null = null;
  if (property.expired > 0) {
    urgentIssue = `${property.expired} expired`;
  } else if (property.non_compliant > 0) {
    urgentIssue = `${property.non_compliant} non-compliant`;
  } else if (property.expiring_soon > 0) {
    urgentIssue = `${property.expiring_soon} expiring soon`;
  } else if (total > 0 && property.compliant === withCert && withCert > 0) {
    urgentIssue = 'All compliant';
  }

  const urgentColor =
    property.expired > 0
      ? 'text-red-600'
      : property.non_compliant > 0
        ? 'text-red-600'
        : property.expiring_soon > 0
          ? 'text-amber-600'
          : 'text-emerald-600';

  return (
    <Link href={`/dashboard/properties/${property.id}`} className="group block">
      <div className="rounded-2xl border border-slate-200/60 bg-white p-5 transition-all hover:shadow-md hover:border-slate-200">
        <div className="flex items-start justify-between">
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-slate-900 group-hover:text-emerald-700 transition-colors">
              {property.name}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {property.vendorCount} {property.vendorCount === 1 ? 'vendor' : 'vendors'} &middot;{' '}
              {property.tenantCount} {property.tenantCount === 1 ? 'tenant' : 'tenants'}
            </p>
          </div>
          {complianceRate != null && (
            <span
              className={`text-sm font-bold ${
                complianceRate >= 80
                  ? 'text-emerald-600'
                  : complianceRate >= 60
                    ? 'text-amber-600'
                    : 'text-red-600'
              }`}
            >
              {complianceRate}%
            </span>
          )}
        </div>

        {total > 0 ? (
          <>
            <div className="mt-4 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
              {segments.map((seg) => (
                <div
                  key={seg.key}
                  className={`${STATUS_CONFIG[seg.key].bgColor}`}
                  style={{ width: `${(seg.count / total) * 100}%` }}
                />
              ))}
            </div>
            {urgentIssue && (
              <p className={`mt-2.5 text-xs font-medium ${urgentColor}`}>
                {urgentIssue}
              </p>
            )}
          </>
        ) : (
          <p className="mt-4 text-xs text-slate-400">No entities yet</p>
        )}
      </div>
    </Link>
  );
}

function AddPropertyCard() {
  return (
    <Link href="/dashboard/properties" className="group block">
      <div className="flex h-full min-h-[120px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white p-5 transition-all hover:border-emerald-300 hover:bg-emerald-50/30">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 group-hover:bg-emerald-100/50 transition-colors">
          <Plus className="h-5 w-5 text-slate-400 group-hover:text-emerald-600" />
        </div>
        <p className="mt-2.5 text-xs font-medium text-slate-500 group-hover:text-emerald-700">
          Add Property
        </p>
      </div>
    </Link>
  );
}

// ============================================================================
// Action Queue — "Things to do" (Remote.com inspired)
// ============================================================================

function ActionQueue({
  items,
  totalCount,
  pillFilter,
}: {
  items: ActionItem[];
  totalCount: number;
  pillFilter: PillFilter;
}) {
  const [showAll, setShowAll] = useState(false);
  const displayItems = showAll ? items : items.slice(0, 10);
  const hasMore = items.length > 10;

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white" data-tutorial="action-queue">
      <div className="px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
            </div>
            <h2 className="text-base font-semibold text-slate-900">
              Needs Your Attention
            </h2>
            {items.length > 0 && (
              <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-slate-100 px-2 text-[11px] font-semibold text-slate-600">
                {items.length}
                {pillFilter && totalCount !== items.length && ` / ${totalCount}`}
              </span>
            )}
          </div>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center px-6 pb-8 pt-4 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
            <CheckCircle2 className="h-7 w-7 text-emerald-600" />
          </div>
          <p className="mt-4 text-sm font-semibold text-slate-900">All caught up!</p>
          <p className="mt-1 text-xs text-slate-500">
            {pillFilter
              ? `No ${STATUS_CONFIG[pillFilter].label.toLowerCase()} items.`
              : 'Your portfolio is fully compliant.'}
          </p>
        </div>
      ) : (
        <div>
          {displayItems.map((item, i) => (
            <ActionItemRow key={`${item.entityType}-${item.id}`} item={item} isLast={i === displayItems.length - 1} isFirst={i === 0} />
          ))}
          {hasMore && (
            <div className="border-t border-slate-100 px-6 py-3 text-center">
              <button
                type="button"
                onClick={() => setShowAll(!showAll)}
                className="text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                {showAll ? 'Show less' : `Show all ${items.length} items`}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function ActionItemRow({ item, isLast, isFirst = false }: { item: ActionItem; isLast: boolean; isFirst?: boolean }) {
  const config = STATUS_CONFIG[item.status as keyof StatusDistribution] ?? STATUS_CONFIG.pending;
  const [sending, setSending] = useState(false);
  const { showUpgradeModal } = useUpgradeModal();
  const router = useRouter();

  const handleRequestCOI = useCallback(async () => {
    setSending(true);
    try {
      const result = await sendManualFollowUp(item.entityType as 'vendor' | 'tenant', item.id);
      if (handleActionResult(result, 'Failed to send follow-up', showUpgradeModal)) return;
      toast.success(`Follow-up sent to ${item.name}`);
    } catch (err) {
      handleActionError(err, 'Failed to send follow-up', showUpgradeModal);
    } finally {
      setSending(false);
    }
  }, [item.entityType, item.id, item.name, showUpgradeModal]);

  const handleUploadCOI = useCallback(() => {
    const param = item.entityType === 'vendor' ? 'vendorId' : 'tenantId';
    router.push(`/dashboard/certificates/upload?${param}=${item.id}`);
  }, [item.entityType, item.id, router]);

  let description = '';
  switch (item.status) {
    case 'expired':
      description = item.earliestExpiration
        ? `Expired ${formatDate(item.earliestExpiration)}`
        : 'Certificate expired';
      break;
    case 'non_compliant':
      description = item.gapCount > 0
        ? `Missing: ${item.gapCount} coverage gap${item.gapCount !== 1 ? 's' : ''}`
        : 'Non-compliant';
      break;
    case 'expiring_soon':
      description = item.earliestExpiration
        ? `Expires ${formatDate(item.earliestExpiration)}`
        : 'Expiring soon';
      break;
    case 'pending':
      description = 'No COI on file';
      break;
    case 'under_review':
      description = 'COI processing';
      break;
    default:
      description = item.status;
  }

  const showRequestCOI = item.status !== 'pending' && item.contactEmail;
  const displayName = item.name.length > 40 ? item.name.slice(0, 40) + '...' : item.name;

  return (
    <div
      className={`flex items-center gap-4 px-6 py-4 transition-colors hover:bg-slate-50/80 ${
        !isLast ? 'border-b border-slate-100' : ''
      }`}
    >
      {/* Status dot */}
      <div className={`h-2.5 w-2.5 flex-shrink-0 rounded-full ${config.dotColor}`} />

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-medium text-slate-900" title={item.name}>
            {displayName}
          </p>
          <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${config.pillBg} ${config.pillText}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${config.dotColor}`} />
            {config.label}
          </span>
        </div>
        <p className="mt-0.5 text-xs text-slate-500">
          {item.propertyName && <>{item.propertyName} &middot; </>}
          {description}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5" {...(isFirst ? { 'data-tour': 'row-actions' } : {})}>
        {showRequestCOI && (
          <Button
            size="sm"
            variant="ghost"
            className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
            disabled={sending}
            onClick={handleRequestCOI}
          >
            <Mail className="mr-1.5 h-3.5 w-3.5" />
            {sending ? '...' : 'Request COI'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-8 px-2.5 text-xs text-slate-600 hover:text-slate-900"
          onClick={handleUploadCOI}
        >
          <Upload className="mr-1.5 h-3.5 w-3.5" />
          Upload COI
        </Button>
      </div>
    </div>
  );
}

// ============================================================================
// Activity Feed (right sidebar)
// ============================================================================

function ActivitySidebar({ entries }: { entries: ActivityEntry[] }) {
  const visibleEntries = entries.slice(0, 8);

  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5" data-tutorial="activity-feed">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
          <TrendingUp className="h-4 w-4 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">Recent Activity</h3>
      </div>

      {entries.length === 0 ? (
        <p className="text-xs text-slate-500">No activity yet.</p>
      ) : (
        <>
          <div className="space-y-0">
            {visibleEntries.map((entry, i) => {
              const Icon = ACTIVITY_ICONS[entry.action] ?? FileCheck;
              return (
                <div key={entry.id} className="flex gap-3 py-2.5">
                  <div className="relative flex flex-col items-center">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-slate-50">
                      <Icon className="h-3.5 w-3.5 text-slate-400" />
                    </div>
                    {i < visibleEntries.length - 1 && (
                      <div className="mt-1 w-px flex-1 bg-slate-100" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1 pb-1">
                    <p className="text-xs leading-snug text-slate-700">
                      {entry.description}
                    </p>
                    <p className="mt-0.5 text-[10px] text-slate-400">
                      {formatTimeAgo(entry.created_at)}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
          <Link
            href="/dashboard/notifications"
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View all activity
            <ChevronRight className="h-3 w-3" />
          </Link>
        </>
      )}
    </div>
  );
}

// ============================================================================
// Quick Stats Card — "This Month"
// ============================================================================

function QuickStatsCard({
  coisUploaded,
  remindersSent,
  vendorsAdded,
  portalUploads,
}: {
  coisUploaded: number;
  remindersSent: number;
  vendorsAdded: number;
  portalUploads: number;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50">
          <Sparkles className="h-4 w-4 text-slate-500" />
        </div>
        <h3 className="text-sm font-semibold text-slate-900">This Month</h3>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <QuickStat icon={Upload} label="COIs Uploaded" value={coisUploaded} />
        <QuickStat icon={Bell} label="Reminders Sent" value={remindersSent} />
        <QuickStat icon={User} label="Vendors Added" value={vendorsAdded} />
        <QuickStat icon={Building2} label="Portal Uploads" value={portalUploads} />
      </div>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Upload;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl bg-slate-50/80 p-3.5">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-slate-400" />
        <span className="text-[10px] font-medium text-slate-500">{label}</span>
      </div>
      <p className="mt-1.5 text-xl font-bold text-slate-900">{value}</p>
    </div>
  );
}

// ============================================================================
// Upcoming Expirations
// ============================================================================

function UpcomingExpirations({
  items,
  onFilterExpiring,
}: {
  items: ActionItem[];
  onFilterExpiring: () => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/60 bg-white p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50">
            <CalendarClock className="h-4 w-4 text-amber-500" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900">Expiring in 30 Days</h3>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-xs text-slate-500">
          No expirations in the next 30 days
        </p>
      ) : (
        <>
          <div className="space-y-1">
            {items.map((item) => (
              <Link
                key={`${item.entityType}-${item.id}`}
                href={`/dashboard/${item.entityType}s/${item.id}`}
                className="block rounded-xl p-3 transition-colors hover:bg-slate-50"
              >
                <div className="flex items-center justify-between">
                  <p className="truncate text-xs font-medium text-slate-900" title={item.name}>
                    {item.name.length > 40 ? item.name.slice(0, 40) + '...' : item.name}
                  </p>
                  <span className="shrink-0 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-600">
                    {item.daysUntilExpiration}d
                  </span>
                </div>
                <p className="mt-0.5 text-[10px] text-slate-400">
                  {item.propertyName && <>{item.propertyName} &middot; </>}
                  {item.earliestExpiration && formatDate(item.earliestExpiration)}
                </p>
              </Link>
            ))}
          </div>
          <button
            type="button"
            onClick={onFilterExpiring}
            className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
          >
            View all
            <ChevronRight className="h-3 w-3" />
          </button>
        </>
      )}
    </div>
  );
}
