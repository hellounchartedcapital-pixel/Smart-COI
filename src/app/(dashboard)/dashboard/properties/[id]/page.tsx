import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { PropertyDetailClient } from '@/components/properties/property-detail-client';
import type { Vendor, Tenant, RequirementTemplate } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function PropertyDetailPage({ params }: Props) {
  const { id } = await params;
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
  const orgId = profile.organization_id;

  // Fetch property
  const { data: property, error: propError } = await supabase
    .from('properties')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (propError || !property) notFound();

  // Fetch entities, vendors, tenants, archived, and templates in parallel
  const [
    { data: entities },
    { data: vendors },
    { data: tenants },
    { data: archivedVendors },
    { data: archivedTenants },
    { data: templates },
  ] = await Promise.all([
    supabase
      .from('property_entities')
      .select('*')
      .eq('property_id', id)
      .order('entity_type')
      .order('entity_name'),
    supabase
      .from('vendors')
      .select('*, template:requirement_templates(id, name)')
      .eq('property_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('company_name'),
    supabase
      .from('tenants')
      .select('*, template:requirement_templates(id, name)')
      .eq('property_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('company_name'),
    supabase
      .from('vendors')
      .select('*, template:requirement_templates(id, name)')
      .eq('property_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .not('archived_at', 'is', null)
      .order('company_name'),
    supabase
      .from('tenants')
      .select('*, template:requirement_templates(id, name)')
      .eq('property_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .not('archived_at', 'is', null)
      .order('company_name'),
    supabase
      .from('requirement_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('category')
      .order('name'),
  ]);

  // Batch fetch latest COI expiration dates for all vendors and tenants
  // Use OR filter to check entity_id, vendor_id, AND tenant_id so we find certs linked via any column
  const vendorIds = (vendors ?? []).map((v) => v.id);
  const tenantIds = (tenants ?? []).map((t) => t.id);
  const allIds = [...vendorIds, ...tenantIds];

  type CertWithCov = { entity_id: string | null; vendor_id: string | null; tenant_id: string | null; extracted_coverages: { expiration_date: string | null }[] };
  let allPropertyCerts: CertWithCov[] = [];
  if (allIds.length > 0) {
    const { data } = await supabase
      .from('certificates')
      .select('entity_id, vendor_id, tenant_id, extracted_coverages(expiration_date)')
      .or(allIds.map(id => `entity_id.eq.${id},vendor_id.eq.${id},tenant_id.eq.${id}`).join(','))
      .order('uploaded_at', { ascending: false });
    allPropertyCerts = (data ?? []) as CertWithCov[];
  }

  // Map entity_id -> latest expiration date (latest cert, then max expiration across coverages)
  const entityLatestExpiration = new Map<string, string>();
  for (const c of allPropertyCerts) {
    const eid = c.entity_id ?? c.vendor_id ?? c.tenant_id;
    if (!eid || entityLatestExpiration.has(eid)) continue;
    const coverages = c.extracted_coverages ?? [];
    const dates = coverages.map((cov) => cov.expiration_date).filter(Boolean) as string[];
    if (dates.length > 0) {
      dates.sort();
      entityLatestExpiration.set(eid, dates[dates.length - 1]);
    }
  }
  const vendorLatestExpiration = entityLatestExpiration;
  const tenantLatestExpiration = entityLatestExpiration;

  const vendorList = (vendors ?? []).map((v) => ({
    ...v,
    coi_expiration_date: vendorLatestExpiration.get(v.id) ?? null,
  })) as (Vendor & { template?: RequirementTemplate | null; coi_expiration_date?: string | null })[];

  const tenantList = (tenants ?? []).map((t) => ({
    ...t,
    coi_expiration_date: tenantLatestExpiration.get(t.id) ?? null,
  })) as (Tenant & { template?: RequirementTemplate | null; coi_expiration_date?: string | null })[];

  return (
    <PropertyDetailClient
      property={property}
      entities={entities ?? []}
      vendors={vendorList}
      tenants={tenantList}
      archivedVendors={(archivedVendors ?? []) as (Vendor & { template?: RequirementTemplate | null })[]}
      archivedTenants={(archivedTenants ?? []) as (Tenant & { template?: RequirementTemplate | null })[]}
      templates={(templates ?? []) as RequirementTemplate[]}
    />
  );
}
