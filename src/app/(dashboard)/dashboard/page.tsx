import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import type { ComplianceStatus, ActivityAction } from '@/types';

// ============================================================================
// Types for aggregated dashboard data
// ============================================================================

export interface DashboardStats {
  propertyCount: number;
  vendorCount: number;
  tenantCount: number;
  entityCount: number;
  complianceRate: number | null; // null = no confirmed certificates yet
  expiringSoonCount: number;
  trialDaysLeft: number | null; // null = not on trial
}

export interface StatusDistribution {
  compliant: number;
  non_compliant: number;
  expiring_soon: number;
  expired: number;
  pending: number;
  under_review: number;
  needs_setup: number;
}

export interface ActionItem {
  id: string;
  name: string;
  propertyName: string | null;
  entityType: 'vendor' | 'tenant';
  status: ComplianceStatus;
  gapCount: number;
  gapDetails: string[];
  earliestExpiration: string | null;
  daysUntilExpiration: number | null;
  daysSinceExpired: number | null;
  hasCertificate: boolean;
  contactEmail: string | null;
}

export interface PropertyOverview {
  id: string;
  name: string;
  propertyType: string;
  vendorCount: number;
  tenantCount: number;
  compliant: number;
  expiring_soon: number;
  non_compliant: number;
  expired: number;
  pending: number;
  under_review: number;
  needs_setup: number;
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

  // Parallel-fetch everything we need — using unified entities table
  const [propertiesRes, entitiesRes, activityRes, orgRes, templatesRes] = await Promise.all([
    supabase
      .from('properties')
      .select('id, name, property_type')
      .eq('organization_id', orgId)
      .order('name'),
    supabase
      .from('entities')
      .select('id, name, entity_type, property_id, compliance_status, contact_email, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('activity_log')
      .select('id, action, description, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('organizations')
      .select('plan, trial_ends_at, industry')
      .eq('id', orgId)
      .single(),
    supabase
      .from('requirement_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('name'),
  ]);

  const properties = propertiesRes.data ?? [];
  const rawEntities = entitiesRes.data ?? [];
  const templates = templatesRes.data ?? [];
  const activity = (activityRes.data ?? []) as ActivityEntry[];

  // ---- Unified entity list (mapped to dashboard shape) ----
  interface Entity {
    id: string;
    name: string;
    propertyId: string | null;
    propertyName: string | null;
    status: ComplianceStatus;
    type: 'vendor' | 'tenant';
    contactEmail: string | null;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEntities: Entity[] = rawEntities.map((e: any) => ({
    id: e.id,
    name: e.name,
    propertyId: e.property_id,
    propertyName: e.properties?.name ?? null,
    status: e.compliance_status as ComplianceStatus,
    // Map entity_type to legacy 'vendor' | 'tenant' for backward compat with dashboard UI
    type: (e.entity_type === 'tenant' ? 'tenant' : 'vendor') as 'vendor' | 'tenant',
    contactEmail: e.contact_email ?? null,
  }));

  // ---- Status counts ----
  const statusCounts: StatusDistribution = {
    compliant: 0,
    non_compliant: 0,
    expiring_soon: 0,
    expired: 0,
    pending: 0,
    under_review: 0,
    needs_setup: 0,
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

  // Compute trial days remaining
  const org = orgRes.data;
  let trialDaysLeft: number | null = null;
  if (org?.plan === 'trial' && org.trial_ends_at) {
    const msLeft = new Date(org.trial_ends_at).getTime() - Date.now();
    trialDaysLeft = Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
  }

  // Derive vendor/tenant counts from the unified entities list
  const vendors = allEntities.filter((e) => e.type === 'vendor');
  const tenants = allEntities.filter((e) => e.type === 'tenant');

  const stats: DashboardStats = {
    propertyCount: properties.length,
    vendorCount: vendors.length,
    tenantCount: tenants.length,
    entityCount: allEntities.length,
    complianceRate,
    expiringSoonCount: statusCounts.expiring_soon,
    trialDaysLeft,
  };

  // ---- Fetch active waivers to exclude from action queue ----
  const { data: activeWaivers } = await supabase
    .from('compliance_waivers')
    .select('entity_id, vendor_id, tenant_id')
    .eq('organization_id', orgId)
    .is('revoked_at', null)
    .gt('expires_at', new Date().toISOString());

  const waivedEntityIds = new Set<string>();
  for (const w of activeWaivers ?? []) {
    if (w.entity_id) waivedEntityIds.add(w.entity_id);
    else if (w.vendor_id) waivedEntityIds.add(w.vendor_id);
    else if (w.tenant_id) waivedEntityIds.add(w.tenant_id);
  }

  // ---- Action items: entities that aren't compliant and not waived ----
  const needsAttention = allEntities.filter(
    (e) => e.status !== 'compliant' && !waivedEntityIds.has(e.id)
  );

  const vendorIds = needsAttention.filter((e) => e.type === 'vendor').map((e) => e.id);
  const tenantIds = needsAttention.filter((e) => e.type === 'tenant').map((e) => e.id);

  // Fetch certificates for action-item entities — check ALL 3 ID columns (entity_id, vendor_id, tenant_id)
  const allEntityIds = [...vendorIds, ...tenantIds];
  const certQueries = [];
  if (allEntityIds.length > 0) {
    // Use OR filter to find certificates linked via any of the 3 ID columns
    certQueries.push(
      supabase
        .from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, processing_status')
        .or(allEntityIds.map(id => `entity_id.eq.${id},vendor_id.eq.${id},tenant_id.eq.${id}`).join(','))
        .order('uploaded_at', { ascending: false })
    );
  }
  const certResults = await Promise.all(certQueries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCerts = certResults.flatMap((r) => r.data ?? []) as any[];

  // Map entityId → cert info (extracted or review_confirmed both count as having compliance data)
  // Deduplicate: a cert might match on entity_id AND vendor_id for the same entity
  const entityCertMap = new Map<string, { hasCert: boolean; certId: string | null }>();
  for (const cert of allCerts) {
    const eid = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
    if (!eid) continue;
    const existing = entityCertMap.get(eid);
    const hasCompliance = cert.processing_status === 'extracted' || cert.processing_status === 'review_confirmed';
    if (!existing) {
      entityCertMap.set(eid, {
        hasCert: true,
        certId: hasCompliance ? cert.id : null,
      });
    } else {
      if (hasCompliance && !existing.certId) existing.certId = cert.id;
    }
  }

  // Gap counts + expirations from certs with compliance data
  const certsWithCompliance = [...entityCertMap.values()]
    .filter((v) => v.certId)
    .map((v) => v.certId!);

  const gapMap = new Map<string, number>();
  const gapDetailsMap = new Map<string, string[]>();
  const expirationMap = new Map<string, string | null>();

  if (certsWithCompliance.length > 0) {
    const [compResultsRes, entityGapsRes, covRes] = await Promise.all([
      supabase
        .from('compliance_results')
        .select('certificate_id, status, gap_description')
        .in('certificate_id', certsWithCompliance)
        .in('status', ['not_met', 'missing']),
      supabase
        .from('entity_compliance_results')
        .select('certificate_id, status')
        .in('certificate_id', certsWithCompliance)
        .in('status', ['missing', 'partial_match']),
      supabase
        .from('extracted_coverages')
        .select('certificate_id, expiration_date')
        .in('certificate_id', certsWithCompliance)
        .not('expiration_date', 'is', null)
        .order('expiration_date', { ascending: true }),
    ]);

    const gapsByCert = new Map<string, number>();
    const gapDescsByCert = new Map<string, string[]>();
    for (const r of compResultsRes.data ?? []) {
      gapsByCert.set(r.certificate_id, (gapsByCert.get(r.certificate_id) ?? 0) + 1);
      if (r.gap_description) {
        const descs = gapDescsByCert.get(r.certificate_id) ?? [];
        descs.push(r.gap_description);
        gapDescsByCert.set(r.certificate_id, descs);
      }
    }
    for (const r of entityGapsRes.data ?? []) {
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
        gapDetailsMap.set(eid, gapDescsByCert.get(info.certId) ?? []);
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
      gapDetails: gapDetailsMap.get(e.id) ?? [],
      earliestExpiration: earliestExp,
      daysUntilExpiration,
      daysSinceExpired,
      hasCertificate: certInfo?.hasCert ?? false,
      contactEmail: e.contactEmail,
    };
  });

  // Sort by urgency
  const statusOrder: Record<ComplianceStatus, number> = {
    expired: 0,
    non_compliant: 1,
    expiring_soon: 2,
    needs_setup: 3,
    under_review: 4,
    pending: 5,
    compliant: 6,
  };
  actionItems.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);

  // ---- Property overviews ----
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const propertyOverviews: PropertyOverview[] = properties.map((p: any) => {
    const propEntities = allEntities.filter((e) => e.propertyId === p.id);
    return {
      id: p.id,
      name: p.name,
      propertyType: p.property_type ?? 'other',
      vendorCount: propEntities.filter((e) => e.type === 'vendor').length,
      tenantCount: propEntities.filter((e) => e.type === 'tenant').length,
      compliant: propEntities.filter((e) => e.status === 'compliant').length,
      expiring_soon: propEntities.filter((e) => e.status === 'expiring_soon').length,
      non_compliant: propEntities.filter((e) => e.status === 'non_compliant').length,
      expired: propEntities.filter((e) => e.status === 'expired').length,
      pending: propEntities.filter((e) => e.status === 'pending').length,
      under_review: propEntities.filter((e) => e.status === 'under_review').length,
      needs_setup: propEntities.filter((e) => e.status === 'needs_setup').length,
      total: propEntities.length,
    };
  });

  // For the upload dialog, provide flat property/vendor/tenant lists
  const propertyList = properties.map((p) => ({ id: p.id, name: p.name, property_type: p.property_type ?? 'other' }));
  const vendorList = vendors.map((v) => ({
    id: v.id,
    company_name: v.name,
    property_id: v.propertyId,
  }));
  const tenantList = tenants.map((t) => ({
    id: t.id,
    company_name: t.name,
    property_id: t.propertyId,
  }));

  return {
    stats,
    statusDistribution: statusCounts,
    actionItems,
    propertyOverviews,
    activity,
    industry: (org?.industry as string) ?? null,
    propertyList,
    vendorList,
    tenantList,
    templates,
  };
}

// ============================================================================
// Page
// ============================================================================

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, full_name')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) redirect('/login');

  const data = await getDashboardData(profile.organization_id);
  const params = await searchParams;
  const showAssignBanner = params.assign_pending === '1';
  const firstName = profile.full_name?.split(' ')[0] ?? null;

  return <DashboardClient {...data} showAssignBanner={showAssignBanner} firstName={firstName} />;
}
