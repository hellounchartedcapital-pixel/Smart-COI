import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import type { ComplianceStatus, ActivityAction } from '@/types';

// ============================================================================
// Types for aggregated dashboard data
// ============================================================================

export interface DashboardStats {
  propertyCount: number;
  entityCount: number;
  complianceRate: number | null; // null = no confirmed certificates yet
  expiringSoonCount: number;
}

export interface StatusDistribution {
  compliant: number;
  non_compliant: number;
  expiring_soon: number;
  expired: number;
  pending: number;
  under_review: number;
}

export interface ActionItem {
  id: string;
  name: string;
  propertyName: string | null;
  entityType: 'vendor' | 'tenant';
  status: ComplianceStatus;
  gapCount: number;
  earliestExpiration: string | null;
  daysUntilExpiration: number | null;
  daysSinceExpired: number | null;
  hasCertificate: boolean;
  hasUnreviewedCert: boolean;
}

export interface PropertyOverview {
  id: string;
  name: string;
  compliant: number;
  expiring_soon: number;
  non_compliant: number;
  expired: number;
  pending: number;
  under_review: number;
  total: number;
}

export interface ActivityEntry {
  id: string;
  action: ActivityAction;
  description: string;
  created_at: string;
}

// ============================================================================
// Server-side data fetching
// ============================================================================

async function getDashboardData(orgId: string) {
  const supabase = await createClient();

  // Parallel-fetch everything we need
  const [propertiesRes, vendorsRes, tenantsRes, activityRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name')
      .eq('organization_id', orgId)
      .order('name'),
    supabase
      .from('vendors')
      .select('id, company_name, property_id, compliance_status, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null),
    supabase
      .from('tenants')
      .select('id, company_name, property_id, compliance_status, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null),
    supabase
      .from('activity_log')
      .select('id, action, description, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  const properties = propertiesRes.data ?? [];
  const vendors = vendorsRes.data ?? [];
  const tenants = tenantsRes.data ?? [];
  const activity = (activityRes.data ?? []) as ActivityEntry[];

  // ---- Unified entity list ----
  interface Entity {
    id: string;
    name: string;
    propertyId: string | null;
    propertyName: string | null;
    status: ComplianceStatus;
    type: 'vendor' | 'tenant';
  }

  const allEntities: Entity[] = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...vendors.map((v: any) => ({
      id: v.id,
      name: v.company_name,
      propertyId: v.property_id,
      propertyName: v.properties?.name ?? null,
      status: v.compliance_status as ComplianceStatus,
      type: 'vendor' as const,
    })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...tenants.map((t: any) => ({
      id: t.id,
      name: t.company_name,
      propertyId: t.property_id,
      propertyName: t.properties?.name ?? null,
      status: t.compliance_status as ComplianceStatus,
      type: 'tenant' as const,
    })),
  ];

  // ---- Status counts ----
  const statusCounts: StatusDistribution = {
    compliant: 0,
    non_compliant: 0,
    expiring_soon: 0,
    expired: 0,
    pending: 0,
    under_review: 0,
  };
  for (const e of allEntities) {
    if (e.status in statusCounts) {
      statusCounts[e.status as keyof StatusDistribution]++;
    }
  }

  const withCertificate = allEntities.filter((e) => e.status !== 'pending').length;
  const complianceRate =
    withCertificate > 0
      ? Math.round((statusCounts.compliant / withCertificate) * 100)
      : null;

  const stats: DashboardStats = {
    propertyCount: properties.length,
    entityCount: allEntities.length,
    complianceRate,
    expiringSoonCount: statusCounts.expiring_soon,
  };

  // ---- Action items: entities that aren't compliant ----
  const needsAttention = allEntities.filter((e) => e.status !== 'compliant');

  const vendorIds = needsAttention.filter((e) => e.type === 'vendor').map((e) => e.id);
  const tenantIds = needsAttention.filter((e) => e.type === 'tenant').map((e) => e.id);

  // Fetch certificates for action-item entities
  const certQueries = [];
  if (vendorIds.length > 0) {
    certQueries.push(
      supabase
        .from('certificates')
        .select('id, vendor_id, tenant_id, processing_status')
        .in('vendor_id', vendorIds)
        .order('uploaded_at', { ascending: false })
    );
  }
  if (tenantIds.length > 0) {
    certQueries.push(
      supabase
        .from('certificates')
        .select('id, vendor_id, tenant_id, processing_status')
        .in('tenant_id', tenantIds)
        .order('uploaded_at', { ascending: false })
    );
  }
  const certResults = await Promise.all(certQueries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCerts = certResults.flatMap((r) => r.data ?? []) as any[];

  // Map entityId → cert info
  const entityCertMap = new Map<
    string,
    { hasCert: boolean; hasUnreviewed: boolean; certId: string | null }
  >();
  for (const cert of allCerts) {
    const eid = cert.vendor_id ?? cert.tenant_id;
    if (!eid) continue;
    const existing = entityCertMap.get(eid);
    if (!existing) {
      entityCertMap.set(eid, {
        hasCert: true,
        hasUnreviewed: cert.processing_status === 'extracted',
        certId: cert.processing_status === 'review_confirmed' ? cert.id : null,
      });
    } else {
      if (cert.processing_status === 'extracted') existing.hasUnreviewed = true;
      if (cert.processing_status === 'review_confirmed' && !existing.certId)
        existing.certId = cert.id;
    }
  }

  // Gap counts + expirations from confirmed certs
  const confirmedCertIds = [...entityCertMap.values()]
    .filter((v) => v.certId)
    .map((v) => v.certId!);

  const gapMap = new Map<string, number>();
  const expirationMap = new Map<string, string | null>();

  if (confirmedCertIds.length > 0) {
    const [compResultsRes, covRes] = await Promise.all([
      supabase
        .from('compliance_results')
        .select('certificate_id, status')
        .in('certificate_id', confirmedCertIds)
        .in('status', ['not_met', 'missing']),
      supabase
        .from('extracted_coverages')
        .select('certificate_id, expiration_date')
        .in('certificate_id', confirmedCertIds)
        .not('expiration_date', 'is', null)
        .order('expiration_date', { ascending: true }),
    ]);

    const gapsByCert = new Map<string, number>();
    for (const r of compResultsRes.data ?? []) {
      gapsByCert.set(r.certificate_id, (gapsByCert.get(r.certificate_id) ?? 0) + 1);
    }

    const expByCert = new Map<string, string>();
    for (const c of covRes.data ?? []) {
      if (c.expiration_date && !expByCert.has(c.certificate_id)) {
        expByCert.set(c.certificate_id, c.expiration_date);
      }
    }

    for (const [eid, info] of entityCertMap.entries()) {
      if (info.certId) {
        gapMap.set(eid, gapsByCert.get(info.certId) ?? 0);
        expirationMap.set(eid, expByCert.get(info.certId) ?? null);
      }
    }
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const actionItems: ActionItem[] = needsAttention.map((e) => {
    const certInfo = entityCertMap.get(e.id);
    const earliestExp = expirationMap.get(e.id) ?? null;
    let daysUntilExpiration: number | null = null;
    let daysSinceExpired: number | null = null;
    if (earliestExp) {
      const expDate = new Date(earliestExp + 'T00:00:00');
      const diff = Math.ceil((expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      if (diff >= 0) daysUntilExpiration = diff;
      else daysSinceExpired = Math.abs(diff);
    }
    return {
      id: e.id,
      name: e.name,
      propertyName: e.propertyName,
      entityType: e.type,
      status: e.status,
      gapCount: gapMap.get(e.id) ?? 0,
      earliestExpiration: earliestExp,
      daysUntilExpiration,
      daysSinceExpired,
      hasCertificate: certInfo?.hasCert ?? false,
      hasUnreviewedCert: certInfo?.hasUnreviewed ?? false,
    };
  });

  // Sort by urgency
  const statusOrder: Record<ComplianceStatus, number> = {
    expired: 0,
    non_compliant: 1,
    expiring_soon: 2,
    under_review: 3,
    pending: 4,
    compliant: 5,
  };
  actionItems.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  // ---- Property overviews ----
  const propertyOverviews: PropertyOverview[] = properties.map((p) => {
    const propEntities = allEntities.filter((e) => e.propertyId === p.id);
    return {
      id: p.id,
      name: p.name,
      compliant: propEntities.filter((e) => e.status === 'compliant').length,
      expiring_soon: propEntities.filter((e) => e.status === 'expiring_soon').length,
      non_compliant: propEntities.filter((e) => e.status === 'non_compliant').length,
      expired: propEntities.filter((e) => e.status === 'expired').length,
      pending: propEntities.filter((e) => e.status === 'pending').length,
      under_review: propEntities.filter((e) => e.status === 'under_review').length,
      total: propEntities.length,
    };
  });

  return {
    stats,
    statusDistribution: statusCounts,
    actionItems,
    propertyOverviews,
    activity,
  };
}

// ============================================================================
// Page
// ============================================================================

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) redirect('/login');

  const data = await getDashboardData(profile.organization_id);

  return <DashboardClient {...data} />;
}
