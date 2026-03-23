'use server';

import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { ComplianceStatus, CoverageType } from '@/types';

// ============================================================================
// Types
// ============================================================================

export interface ReportEntity {
  id: string;
  name: string;
  type: 'vendor' | 'tenant';
  propertyName: string;
  complianceStatus: ComplianceStatus;
  glLimit: string;
  wcLimit: string;
  autoLimit: string;
  umbrellaLimit: string;
  expirationDate: string;
  gaps: string[];
}

export interface ReportProperty {
  id: string;
  name: string;
  address: string | null;
  entities: ReportEntity[];
}

export interface ComplianceReportData {
  organizationName: string;
  generatedAt: string;
  totalProperties: number;
  totalVendors: number;
  totalTenants: number;
  overallComplianceRate: number | null;
  statusBreakdown: {
    compliant: number;
    expiring_soon: number;
    expired: number;
    non_compliant: number;
    pending: number;
  };
  properties: ReportProperty[];
}

// ============================================================================
// Fetch report data
// ============================================================================

export async function getComplianceReportData(): Promise<ComplianceReportData> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) throw new Error('No organization');
  const orgId = profile.organization_id;

  // Fetch org name, properties, vendors, tenants in parallel
  const [orgRes, propsRes, vendorsRes, tenantsRes] = await Promise.all([
    supabase.from('organizations').select('name').eq('id', orgId).single(),
    supabase.from('properties').select('id, name, address, city, state, zip').eq('organization_id', orgId).order('name'),
    supabase
      .from('vendors')
      .select('id, company_name, property_id, compliance_status, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('tenants')
      .select('id, company_name, property_id, compliance_status, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
  ]);

  const orgName = orgRes.data?.name ?? 'Organization';
  const properties = propsRes.data ?? [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const vendors = (vendorsRes.data ?? []) as any[];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const tenants = (tenantsRes.data ?? []) as any[];

  // Build unified entity list
  const allEntities = [
    ...vendors.map((v) => ({
      id: v.id,
      name: v.company_name,
      type: 'vendor' as const,
      propertyId: v.property_id,
      propertyName: v.properties?.name ?? 'Unassigned',
      status: v.compliance_status as ComplianceStatus,
    })),
    ...tenants.map((t) => ({
      id: t.id,
      name: t.company_name,
      type: 'tenant' as const,
      propertyId: t.property_id,
      propertyName: t.properties?.name ?? 'Unassigned',
      status: t.compliance_status as ComplianceStatus,
    })),
  ];

  // Status counts
  const statusBreakdown = { compliant: 0, expiring_soon: 0, expired: 0, non_compliant: 0, pending: 0 };
  for (const e of allEntities) {
    if (e.status in statusBreakdown) {
      statusBreakdown[e.status as keyof typeof statusBreakdown]++;
    }
  }

  const withCert = allEntities.filter((e) => e.status !== 'pending').length;
  const overallComplianceRate =
    withCert > 0 ? Math.round((statusBreakdown.compliant / withCert) * 100) : null;

  // Fetch latest certificates for all entities to get coverages and gaps
  const vendorIds = vendors.map((v) => v.id);
  const tenantIds = tenants.map((t) => t.id);

  const certQueries = [];
  if (vendorIds.length > 0) {
    certQueries.push(
      supabase
        .from('certificates')
        .select('id, vendor_id, tenant_id')
        .in('vendor_id', vendorIds)
        .in('processing_status', ['extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false })
    );
  }
  if (tenantIds.length > 0) {
    certQueries.push(
      supabase
        .from('certificates')
        .select('id, vendor_id, tenant_id')
        .in('tenant_id', tenantIds)
        .in('processing_status', ['extracted', 'review_confirmed'])
        .order('uploaded_at', { ascending: false })
    );
  }

  const certResults = await Promise.all(certQueries);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allCerts = certResults.flatMap((r) => r.data ?? []) as any[];

  // Map entity -> latest cert
  const entityCertMap = new Map<string, string>();
  for (const cert of allCerts) {
    const eid = cert.vendor_id ?? cert.tenant_id;
    if (eid && !entityCertMap.has(eid)) {
      entityCertMap.set(eid, cert.id);
    }
  }

  // Fetch coverages, compliance results for all certs
  const certIds = [...new Set(entityCertMap.values())];
  let coveragesMap = new Map<string, { coverage_type: CoverageType; limit_amount: number | null; expiration_date: string | null }[]>();
  let gapsMap = new Map<string, string[]>();

  if (certIds.length > 0) {
    const [covsRes, gapsRes] = await Promise.all([
      supabase
        .from('extracted_coverages')
        .select('certificate_id, coverage_type, limit_amount, expiration_date')
        .in('certificate_id', certIds),
      supabase
        .from('compliance_results')
        .select('certificate_id, gap_description, status')
        .in('certificate_id', certIds)
        .in('status', ['not_met', 'missing']),
    ]);

    // Group coverages by cert
    for (const c of covsRes.data ?? []) {
      const list = coveragesMap.get(c.certificate_id) ?? [];
      list.push(c as { coverage_type: CoverageType; limit_amount: number | null; expiration_date: string | null });
      coveragesMap.set(c.certificate_id, list);
    }

    // Group gaps by cert
    for (const g of gapsRes.data ?? []) {
      if (g.gap_description) {
        const list = gapsMap.get(g.certificate_id) ?? [];
        list.push(g.gap_description);
        gapsMap.set(g.certificate_id, list);
      }
    }
  }

  // Helper to get a coverage limit for a specific type
  function getCoverageLimit(certId: string | undefined, type: CoverageType): string {
    if (!certId) return '—';
    const covs = coveragesMap.get(certId) ?? [];
    const match = covs.find((c) => c.coverage_type === type);
    if (!match || match.limit_amount == null) return '—';
    return formatCurrency(match.limit_amount);
  }

  function getEarliestExpiration(certId: string | undefined): string {
    if (!certId) return '—';
    const covs = coveragesMap.get(certId) ?? [];
    const dates = covs.map((c) => c.expiration_date).filter(Boolean) as string[];
    if (dates.length === 0) return '—';
    dates.sort();
    return formatDate(dates[0]);
  }

  // Build report entities
  const reportEntities: ReportEntity[] = allEntities.map((e) => {
    const certId = entityCertMap.get(e.id);
    return {
      id: e.id,
      name: e.name,
      type: e.type,
      propertyName: e.propertyName,
      complianceStatus: e.status,
      glLimit: getCoverageLimit(certId, 'general_liability'),
      wcLimit: getCoverageLimit(certId, 'workers_compensation'),
      autoLimit: getCoverageLimit(certId, 'automobile_liability'),
      umbrellaLimit: getCoverageLimit(certId, 'umbrella_excess_liability'),
      expirationDate: getEarliestExpiration(certId),
      gaps: certId ? (gapsMap.get(certId) ?? []) : e.status === 'pending' ? ['No COI on file'] : [],
    };
  });

  // Group by property
  const reportProperties: ReportProperty[] = properties.map((p) => {
    const addr = [p.address, p.city, p.state, p.zip].filter(Boolean).join(', ');
    return {
      id: p.id,
      name: p.name,
      address: addr || null,
      entities: reportEntities.filter((e) => {
        // Match by property name since we don't have propertyId in reportEntities directly
        const entity = allEntities.find((ae) => ae.id === e.id);
        return entity?.propertyId === p.id;
      }),
    };
  });

  // Add unassigned entities
  const unassigned = reportEntities.filter((e) => {
    const entity = allEntities.find((ae) => ae.id === e.id);
    return !entity?.propertyId || !properties.find((p) => p.id === entity.propertyId);
  });
  if (unassigned.length > 0) {
    reportProperties.push({
      id: 'unassigned',
      name: 'Unassigned',
      address: null,
      entities: unassigned,
    });
  }

  return {
    organizationName: orgName,
    generatedAt: new Date().toISOString(),
    totalProperties: properties.length,
    totalVendors: vendors.length,
    totalTenants: tenants.length,
    overallComplianceRate,
    statusBreakdown,
    properties: reportProperties,
  };
}

// ============================================================================
// Generate CSV content
// ============================================================================

export async function generateComplianceCSV(): Promise<string> {
  const data = await getComplianceReportData();

  const headers = [
    'Property',
    'Vendor/Tenant Name',
    'Type',
    'Compliance Status',
    'GL Limit',
    'WC Limit',
    'Auto Limit',
    'Umbrella Limit',
    'Expiration Date',
    'Gaps/Notes',
  ];

  const rows: string[][] = [];
  for (const prop of data.properties) {
    for (const entity of prop.entities) {
      rows.push([
        prop.name,
        entity.name,
        entity.type === 'vendor' ? 'Vendor' : 'Tenant',
        entity.complianceStatus.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
        entity.glLimit,
        entity.wcLimit,
        entity.autoLimit,
        entity.umbrellaLimit,
        entity.expirationDate,
        entity.gaps.join('; '),
      ]);
    }
  }

  const escapeCsv = (val: string) => {
    if (val.includes(',') || val.includes('"') || val.includes('\n')) {
      return `"${val.replace(/"/g, '""')}"`;
    }
    return val;
  };

  const csvLines = [
    headers.map(escapeCsv).join(','),
    ...rows.map((row) => row.map(escapeCsv).join(',')),
  ];

  return csvLines.join('\n');
}
