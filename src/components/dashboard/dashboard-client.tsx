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
  { label: string; color: string; bgColor: string; borderColor: string; pillBg: string; pillText: string }
> = {
  compliant: {
    label: 'Compliant',
    color: 'text-emerald-700',
    bgColor: 'bg-status-compliant',
    borderColor: 'border-l-status-compliant',
    pillBg: 'bg-emerald-100 hover:bg-emerald-200',
    pillText: 'text-emerald-700',
  },
  expiring_soon: {
    label: 'Expiring Soon',
    color: 'text-amber-700',
    bgColor: 'bg-status-expiring',
    borderColor: 'border-l-status-expiring',
    pillBg: 'bg-amber-100 hover:bg-amber-200',
    pillText: 'text-amber-700',
  },
  non_compliant: {
    label: 'Non-Compliant',
    color: 'text-red-600',
    bgColor: 'bg-status-non-compliant',
    borderColor: 'border-l-status-non-compliant',
    pillBg: 'bg-red-100 hover:bg-red-200',
    pillText: 'text-red-700',
  },
  expired: {
    label: 'Expired',
    color: 'text-red-700',
    bgColor: 'bg-status-expired',
    borderColor: 'border-l-status-expired',
    pillBg: 'bg-red-100 hover:bg-red-200',
    pillText: 'text-red-700',
  },
  pending: {
    label: 'Pending',
    color: 'text-slate-500',
    bgColor: 'bg-status-pending',
    borderColor: 'border-l-status-pending',
    pillBg: 'bg-slate-100 hover:bg-slate-200',
    pillText: 'text-slate-600',
  },
  under_review: {
    label: 'Under Review',
    color: 'text-blue-600',
    bgColor: 'bg-status-under-review',
    borderColor: 'border-l-status-under-review',
    pillBg: 'bg-blue-100 hover:bg-blue-200',
    pillText: 'text-blue-600',
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

  // Filter action items by selected pill
  const filteredActionItems = useMemo(() => {
    if (!pillFilter) return actionItems;
    return actionItems.filter((item) => item.status === pillFilter);
  }, [actionItems, pillFilter]);

  // Compliance rate color
  const rateColor =
    stats.complianceRate == null
      ? 'text-slate-400'
      : stats.complianceRate >= 80
        ? 'text-emerald-600'
        : stats.complianceRate >= 60
          ? 'text-amber-600'
          : 'text-red-600';

  // "This Month" stats from activity log
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

  // Upcoming expirations (next 30 days) from action items
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
    <div className="space-y-6">
      <DashboardTutorial active={showTutorial} onClose={closeTutorial} />

      {/* Assign requirements banner */}
      {showAssignBanner && !bannerDismissed && (
        <div className="flex items-center justify-between rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-5 w-5 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              Assign requirements to see your compliance results
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/vendors"
              className="inline-flex items-center gap-1 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
            >
              Assign now <ArrowRight className="h-3 w-3" />
            </Link>
            <button
              onClick={() => setBannerDismissed(true)}
              className="rounded p-1 text-amber-500 hover:text-amber-700"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---- Section 1: Portfolio Health Bar ---- */}
      <div className="rounded-xl border bg-white p-5 md:p-6" data-tutorial="dashboard-overview">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          {/* Left: Compliance rate + subtitle */}
          <div className="flex items-center gap-4">
            <div>
              <div className="flex items-baseline gap-2">
                <span className={`text-4xl font-bold tracking-tight ${rateColor}`}>
                  {stats.complianceRate != null ? `${stats.complianceRate}%` : '—'}
                </span>
                <span className={`text-lg font-semibold ${rateColor}`}>Compliant</span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                Across {stats.propertyCount} {stats.propertyCount === 1 ? 'property' : 'properties'},{' '}
                {stats.vendorCount} {stats.vendorCount === 1 ? 'vendor' : 'vendors'},{' '}
                {stats.tenantCount} {stats.tenantCount === 1 ? 'tenant' : 'tenants'}
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={startTutorial} className="text-xs text-muted-foreground">
              Take a Tour
            </Button>
            <Button onClick={() => setUploadOpen(true)} data-tutorial="upload-coi">
              <Upload className="mr-2 h-4 w-4" />
              Upload COI
            </Button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="mt-4 flex flex-wrap gap-2">
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
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                  isActive
                    ? `${config.pillBg} ${config.pillText} ring-2 ring-offset-1 ring-current`
                    : `${config.pillBg} ${config.pillText}`
                }`}
              >
                <span
                  className={`inline-block h-2 w-2 rounded-full ${config.bgColor}`}
                />
                {config.label} {count}
              </button>
            );
          })}
          {pillFilter && (
            <button
              type="button"
              onClick={() => setPillFilter(null)}
              className="inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-xs text-muted-foreground hover:bg-slate-100"
            >
              <X className="h-3 w-3" />
              Clear
            </button>
          )}
        </div>
      </div>

      <UploadCOIDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        properties={propertyList}
        vendors={vendorList}
        tenants={tenantList}
      />

      {/* ---- Section 2: Two-column layout ---- */}
      <div className="grid items-start gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column: Properties + Action Queue */}
        <div className="space-y-6">
          <PropertiesSection properties={propertyOverviews} />
          <ActionQueue
            items={filteredActionItems}
            totalCount={actionItems.length}
            pillFilter={pillFilter}
          />
        </div>

        {/* Right sidebar: Activity + Quick Stats + Upcoming Expirations */}
        <div className="space-y-6">
          <ActivitySidebar entries={activity} />
          <QuickStatsCard
            coisUploaded={thisMonthStats.coisUploaded}
            remindersSent={notificationsSentThisMonth}
            vendorsAdded={thisMonthStats.vendorsAdded}
            portalUploads={thisMonthStats.portalUploads}
          />
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
// Properties Grid
// ============================================================================

function PropertiesSection({ properties }: { properties: PropertyOverview[] }) {
  return (
    <div data-tutorial="properties-section">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-foreground">
          Properties
        </h2>
        <Link
          href="/dashboard/properties"
          className="text-xs font-medium text-primary hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
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

  // Build mini compliance bar segments
  const segments: { key: keyof StatusDistribution; count: number }[] = (
    ['compliant', 'expiring_soon', 'non_compliant', 'expired', 'pending', 'under_review'] as const
  )
    .map((key) => ({ key, count: property[key] }))
    .filter((s) => s.count > 0);

  // Most urgent issue
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
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-foreground group-hover:text-primary">
                {property.name}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
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
              <div className="mt-3 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                {segments.map((seg) => (
                  <div
                    key={seg.key}
                    className={`${STATUS_CONFIG[seg.key].bgColor}`}
                    style={{ width: `${(seg.count / total) * 100}%` }}
                  />
                ))}
              </div>
              {urgentIssue && (
                <p className={`mt-2 text-xs font-medium ${urgentColor}`}>
                  {urgentIssue}
                </p>
              )}
            </>
          ) : (
            <p className="mt-3 text-xs text-slate-400">No entities yet</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function AddPropertyCard() {
  return (
    <Link href="/dashboard/properties" className="group block">
      <Card className="h-full border-dashed transition-shadow hover:shadow-md">
        <CardContent className="flex h-full min-h-[100px] flex-col items-center justify-center p-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 group-hover:bg-primary/10">
            <Plus className="h-4 w-4 text-slate-400 group-hover:text-primary" />
          </div>
          <p className="mt-2 text-xs font-medium text-muted-foreground group-hover:text-primary">
            Add Property
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}

// ============================================================================
// Action Queue
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
    <Card data-tutorial="action-queue">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              Needs Your Attention
            </h2>
            {items.length > 0 && (
              <Badge variant="secondary" className="text-[10px]">
                {items.length}
                {pillFilter && totalCount !== items.length && ` of ${totalCount}`}
              </Badge>
            )}
          </div>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-col items-center py-10 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100">
              <CheckCircle2 className="h-6 w-6 text-emerald-600" />
            </div>
            <p className="mt-3 text-sm font-medium text-foreground">All caught up!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {pillFilter
                ? `No ${STATUS_CONFIG[pillFilter].label.toLowerCase()} items.`
                : 'Your portfolio is fully compliant.'}
            </p>
          </div>
        ) : (
          <div className="mt-3 space-y-1.5">
            {displayItems.map((item) => (
              <ActionItemRow key={`${item.entityType}-${item.id}`} item={item} />
            ))}
            {hasMore && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowAll(!showAll)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  {showAll ? 'Show less' : `Show all ${items.length} items`}
                </button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ActionItemRow({ item }: { item: ActionItem }) {
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
      className={`flex items-center gap-3 rounded-lg border border-l-4 ${config.borderColor} bg-white p-3`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${config.color}`}
          >
            {config.label}
          </Badge>
          <p className="truncate text-sm font-medium text-foreground" title={item.name}>
            {displayName}
          </p>
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {item.propertyName && <>{item.propertyName} &middot; </>}
          {description}
        </p>
      </div>
      <div className="flex shrink-0 gap-1.5">
        {showRequestCOI && (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2 text-xs"
            disabled={sending}
            onClick={handleRequestCOI}
          >
            <Mail className="mr-1 h-3 w-3" />
            {sending ? '...' : 'Request COI'}
          </Button>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="h-7 px-2 text-xs"
          onClick={handleUploadCOI}
        >
          <Upload className="mr-1 h-3 w-3" />
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
    <Card className="h-fit" data-tutorial="activity-feed">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Recent Activity</h2>

        {entries.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">No activity yet.</p>
        ) : (
          <>
            <div className="mt-3 space-y-0">
              {visibleEntries.map((entry, i) => {
                const Icon = ACTIVITY_ICONS[entry.action] ?? FileCheck;
                return (
                  <div key={entry.id} className="flex gap-3 py-2.5">
                    <div className="relative flex flex-col items-center">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100">
                        <Icon className="h-3 w-3 text-slate-500" />
                      </div>
                      {i < visibleEntries.length - 1 && (
                        <div className="mt-1 w-px flex-1 bg-slate-200" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1 pb-1">
                      <p className="text-xs leading-snug text-foreground">
                        {entry.description}
                      </p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground">
                        {formatTimeAgo(entry.created_at)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
            <Link
              href="/dashboard/notifications"
              className="mt-3 block text-center text-xs font-medium text-primary hover:underline"
            >
              View all activity
            </Link>
          </>
        )}
      </CardContent>
    </Card>
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
    <Card className="h-fit">
      <CardContent className="p-5">
        <h2 className="text-sm font-semibold text-foreground">This Month</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <QuickStat icon={Upload} label="COIs Uploaded" value={coisUploaded} />
          <QuickStat icon={Bell} label="Reminders Sent" value={remindersSent} />
          <QuickStat icon={User} label="Vendors Added" value={vendorsAdded} />
          <QuickStat icon={Building2} label="Portal Uploads" value={portalUploads} />
        </div>
      </CardContent>
    </Card>
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
    <div className="rounded-lg bg-slate-50 p-3">
      <div className="flex items-center gap-1.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[10px] text-muted-foreground">{label}</span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground">{value}</p>
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
    <Card className="h-fit">
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">Expiring in Next 30 Days</h2>
          <CalendarClock className="h-4 w-4 text-muted-foreground" />
        </div>

        {items.length === 0 ? (
          <p className="mt-3 text-xs text-muted-foreground">
            No expirations in the next 30 days
          </p>
        ) : (
          <>
            <div className="mt-3 space-y-2">
              {items.map((item) => (
                <Link
                  key={`${item.entityType}-${item.id}`}
                  href={`/dashboard/${item.entityType}s/${item.id}`}
                  className="block rounded-lg p-2 transition-colors hover:bg-slate-50"
                >
                  <div className="flex items-center justify-between">
                    <p className="truncate text-xs font-medium text-foreground" title={item.name}>
                      {item.name.length > 40 ? item.name.slice(0, 40) + '...' : item.name}
                    </p>
                    <span className="shrink-0 text-[10px] font-semibold text-amber-600">
                      {item.daysUntilExpiration}d
                    </span>
                  </div>
                  <p className="mt-0.5 text-[10px] text-muted-foreground">
                    {item.propertyName && <>{item.propertyName} &middot; </>}
                    {item.earliestExpiration && formatDate(item.earliestExpiration)}
                  </p>
                </Link>
              ))}
            </div>
            <button
              type="button"
              onClick={onFilterExpiring}
              className="mt-3 block w-full text-center text-xs font-medium text-primary hover:underline"
            >
              View all
            </button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
