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
  const vendorIds = (vendors ?? []).map((v) => v.id);
  const tenantIds = (tenants ?? []).map((t) => t.id);

  const [{ data: vendorCerts }, { data: tenantCerts }] = await Promise.all([
    vendorIds.length > 0
      ? supabase
          .from('certificates')
          .select('vendor_id, extracted_coverages(expiration_date)')
          .in('vendor_id', vendorIds)
          .order('uploaded_at', { ascending: false })
      : Promise.resolve({ data: [] as { vendor_id: string; extracted_coverages: { expiration_date: string | null }[] }[] }),
    tenantIds.length > 0
      ? supabase
          .from('certificates')
          .select('tenant_id, extracted_coverages(expiration_date)')
          .in('tenant_id', tenantIds)
          .order('uploaded_at', { ascending: false })
      : Promise.resolve({ data: [] as { tenant_id: string; extracted_coverages: { expiration_date: string | null }[] }[] }),
  ]);

  // Map entity_id -> latest expiration date (latest cert, then max expiration across coverages)
  const vendorLatestExpiration = new Map<string, string>();
  for (const c of vendorCerts ?? []) {
    if (c.vendor_id && !vendorLatestExpiration.has(c.vendor_id)) {
      const coverages = (c as { vendor_id: string; extracted_coverages: { expiration_date: string | null }[] }).extracted_coverages ?? [];
      const dates = coverages.map((cov) => cov.expiration_date).filter(Boolean) as string[];
      if (dates.length > 0) {
        dates.sort();
        vendorLatestExpiration.set(c.vendor_id, dates[dates.length - 1]);
      }
    }
  }
  const tenantLatestExpiration = new Map<string, string>();
  for (const c of tenantCerts ?? []) {
    if (c.tenant_id && !tenantLatestExpiration.has(c.tenant_id)) {
      const coverages = (c as { tenant_id: string; extracted_coverages: { expiration_date: string | null }[] }).extracted_coverages ?? [];
      const dates = coverages.map((cov) => cov.expiration_date).filter(Boolean) as string[];
      if (dates.length > 0) {
        dates.sort();
        tenantLatestExpiration.set(c.tenant_id, dates[dates.length - 1]);
      }
    }
  }

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
