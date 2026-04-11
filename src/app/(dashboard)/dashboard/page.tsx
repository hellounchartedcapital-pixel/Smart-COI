import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardClient } from '@/components/dashboard/dashboard-client';
import { evaluateEntityCompliance } from '@/lib/compliance/evaluate-inline';
import type { ComplianceStatus, ActivityAction, ExtractedCoverage, TemplateCoverageRequirement } from '@/types';

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
      .select('id, name, entity_type, entity_category, property_id, compliance_status, template_id, contact_email, properties(name)')
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawEntities = (entitiesRes.data ?? []) as any[];
  const templates = templatesRes.data ?? [];
  const activity = (activityRes.data ?? []) as ActivityEntry[];

  // ---- Fetch certificates, coverages, and template requirements for inline evaluation ----
  const entityIds = rawEntities.map((e: { id: string }) => e.id);

  // Find latest certificate per entity (include 'processing' for batch pipeline compat)
  let entityCertMap = new Map<string, { id: string }>();
  if (entityIds.length > 0) {
    const [ec, vc, tc] = await Promise.all([
      supabase.from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
        .in('entity_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase.from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
        .in('vendor_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
      supabase.from('certificates')
        .select('id, entity_id, vendor_id, tenant_id, uploaded_at')
        .in('tenant_id', entityIds)
        .in('processing_status', ['processing', 'extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false }),
    ]);

    const allCerts = [...(ec.data ?? []), ...(vc.data ?? []), ...(tc.data ?? [])];
    entityCertMap = new Map();
    for (const cert of allCerts) {
      const eid = cert.entity_id ?? cert.vendor_id ?? cert.tenant_id;
      if (eid && !entityCertMap.has(eid)) {
        entityCertMap.set(eid, { id: cert.id });
      }
    }
  }

  const certIds = [...new Set([...entityCertMap.values()].map((c) => c.id))];
  const templateIds = [...new Set(rawEntities.map((e: { template_id: string | null }) => e.template_id).filter((id: string | null): id is string => id != null))];

  // Fetch coverages and template requirements
  const [coveragesRes, requirementsRes] = await Promise.all([
    certIds.length > 0
      ? supabase.from('extracted_coverages')
          .select('id, certificate_id, coverage_type, carrier_name, policy_number, limit_amount, limit_type, effective_date, expiration_date, additional_insured_listed, additional_insured_entities, waiver_of_subrogation, confidence_flag, raw_extracted_text, created_at')
          .in('certificate_id', certIds)
      : Promise.resolve({ data: [] as ExtractedCoverage[] }),
    templateIds.length > 0
      ? supabase.from('template_coverage_requirements')
          .select('*')
          .in('template_id', templateIds)
      : Promise.resolve({ data: [] as TemplateCoverageRequirement[] }),
  ]);

  const coveragesByCert = new Map<string, ExtractedCoverage[]>();
  for (const ec of (coveragesRes.data ?? []) as ExtractedCoverage[]) {
    const list = coveragesByCert.get(ec.certificate_id) ?? [];
    list.push(ec);
    coveragesByCert.set(ec.certificate_id, list);
  }

  const requirementsByTemplate = new Map<string, TemplateCoverageRequirement[]>();
  for (const req of (requirementsRes.data ?? []) as TemplateCoverageRequirement[]) {
    const list = requirementsByTemplate.get(req.template_id) ?? [];
    list.push(req);
    requirementsByTemplate.set(req.template_id, list);
  }

  // ---- Build unified entity list with INLINE compliance evaluation ----
  interface Entity {
    id: string;
    name: string;
    propertyId: string | null;
    propertyName: string | null;
    status: ComplianceStatus;
    type: 'vendor' | 'tenant';
    contactEmail: string | null;
    gapCount: number;
    gapDetails: string[];
    earliestExpiration: string | null;
    hasCertificate: boolean;
  }

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const allEntities: Entity[] = rawEntities.map((e: Record<string, unknown>) => {
    const cert = entityCertMap.get(e.id as string);
    const coverages = cert ? (coveragesByCert.get(cert.id) ?? []) : [];
    const templateReqs = e.template_id
      ? (requirementsByTemplate.get(e.template_id as string) ?? [])
      : [];

    // Inline evaluation
    const evaluation = evaluateEntityCompliance(templateReqs, coverages);

    // Earliest non-expired expiration date
    let earliestExpiration: string | null = null;
    for (const cov of coverages) {
      if (cov.expiration_date) {
        const exp = new Date(cov.expiration_date + 'T00:00:00');
        if (exp >= now) {
          if (!earliestExpiration || cov.expiration_date < earliestExpiration) {
            earliestExpiration = cov.expiration_date;
          }
        }
      }
    }

    const props = e.properties as { name?: string } | null;

    return {
      id: e.id as string,
      name: e.name as string,
      propertyId: (e.property_id as string | null) ?? null,
      propertyName: props?.name ?? null,
      status: evaluation.complianceStatus,
      type: (e.entity_type === 'tenant' ? 'tenant' : 'vendor') as 'vendor' | 'tenant',
      contactEmail: (e.contact_email as string | null) ?? null,
      gapCount: evaluation.gapCount,
      gapDetails: evaluation.gapDescriptions,
      earliestExpiration,
      hasCertificate: !!cert,
    };
  });

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

  const evaluableCount = allEntities.length - statusCounts.needs_setup;
  const complianceRate =
    evaluableCount > 0
      ? Math.round((statusCounts.compliant / evaluableCount) * 100)
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
    (e) => e.status !== 'compliant' && e.status !== 'expiring_soon' && !waivedEntityIds.has(e.id)
  );

  const actionItems: ActionItem[] = needsAttention.map((e) => {
    let daysUntilExpiration: number | null = null;
    let daysSinceExpired: number | null = null;
    if (e.earliestExpiration) {
      const expDate = new Date(e.earliestExpiration + 'T00:00:00');
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
      gapCount: e.gapCount,
      gapDetails: e.gapDetails,
      earliestExpiration: e.earliestExpiration,
      daysUntilExpiration,
      daysSinceExpired,
      hasCertificate: e.hasCertificate,
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
