import { notFound, redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { VendorDetailClient } from '@/components/compliance/vendor-detail-client';
import type {
  Vendor,
  Property,
  RequirementTemplate,
  TemplateCoverageRequirement,
  ExtractedCoverage,
  ComplianceResult,
  EntityComplianceResult,
  PropertyEntity,
  Certificate,
  Notification,
} from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function VendorDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  // Auth check
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

  // Fetch vendor — try legacy table first, fall back to entities table
  let v: Vendor;
  const { data: vendor } = await supabase
    .from('vendors')
    .select('*')
    .eq('id', id)
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .single();

  if (vendor) {
    v = vendor as Vendor;
  } else {
    // Entity may only exist in unified entities table (created via entity creation wizard)
    const { data: entity } = await supabase
      .from('entities')
      .select('*')
      .eq('id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .single();
    if (!entity) notFound();
    // Map Entity fields to Vendor shape for the client component
    v = {
      id: entity.id,
      property_id: entity.property_id,
      organization_id: entity.organization_id,
      company_name: entity.name,
      contact_name: entity.contact_name,
      contact_email: entity.contact_email,
      contact_phone: entity.contact_phone,
      vendor_type: entity.entity_category,
      template_id: entity.template_id,
      compliance_status: entity.compliance_status,
      notifications_paused: entity.notifications_paused,
      created_at: entity.created_at,
      updated_at: entity.updated_at,
      deleted_at: entity.deleted_at,
      archived_at: entity.archived_at,
    } as Vendor;
  }

  // Fetch property
  let property: Property | null = null;
  if (v.property_id) {
    const { data: prop } = await supabase
      .from('properties')
      .select('*')
      .eq('id', v.property_id)
      .single();
    property = prop as Property | null;
  }

  // Fetch assigned template with coverage requirements
  let template: RequirementTemplate | null = null;
  let templateRequirements: TemplateCoverageRequirement[] = [];
  if (v.template_id) {
    const { data: tpl } = await supabase
      .from('requirement_templates')
      .select('*')
      .eq('id', v.template_id)
      .single();
    template = tpl as RequirementTemplate | null;

    if (template) {
      const { data: reqs } = await supabase
        .from('template_coverage_requirements')
        .select('*')
        .eq('template_id', template.id)
        .order('coverage_type');
      templateRequirements = (reqs ?? []) as TemplateCoverageRequirement[];
    }
  }

  // Fetch most recent certificate — check entity_id and legacy vendor_id
  let extractedCoverages: ExtractedCoverage[] = [];
  let complianceResults: ComplianceResult[] = [];
  let entityResults: EntityComplianceResult[] = [];
  let hasCertificate = false;

  let latestCert: { id: string } | null = null;
  const { data: confirmedCert } = await supabase
    .from('certificates')
    .select('id')
    .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
    .eq('organization_id', orgId)
    .in('processing_status', ['extracted', 'review_confirmed'])
    .order('uploaded_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (confirmedCert) {
    latestCert = confirmedCert;
  } else {
    const { data: extractedCert } = await supabase
      .from('certificates')
      .select('id')
      .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
      .eq('organization_id', orgId)
      .eq('processing_status', 'extracted')
      .order('uploaded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    latestCert = extractedCert;
  }

  if (latestCert) {
    hasCertificate = true;

    const { data: coverages } = await supabase
      .from('extracted_coverages')
      .select('*')
      .eq('certificate_id', latestCert.id);
    extractedCoverages = (coverages ?? []) as ExtractedCoverage[];

    const { data: results } = await supabase
      .from('compliance_results')
      .select('*')
      .eq('certificate_id', latestCert.id);
    complianceResults = (results ?? []) as ComplianceResult[];

    const { data: entResults } = await supabase
      .from('entity_compliance_results')
      .select('*')
      .eq('certificate_id', latestCert.id);
    entityResults = (entResults ?? []) as EntityComplianceResult[];
  }

  // If no cert found above, check if any cert exists at all
  if (!hasCertificate) {
    const { count } = await supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .or(`entity_id.eq.${id},vendor_id.eq.${id}`);
    if ((count ?? 0) > 0) hasCertificate = true;
  }

  // Fetch property entities
  let propertyEntities: PropertyEntity[] = [];
  if (v.property_id) {
    const { data: entities } = await supabase
      .from('property_entities')
      .select('*')
      .eq('property_id', v.property_id)
      .order('entity_type')
      .order('entity_name');
    propertyEntities = (entities ?? []) as PropertyEntity[];
  }

  // Fetch all certificates for this vendor
  const { data: allCerts } = await supabase
    .from('certificates')
    .select('*, compliance_results(*)')
    .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
    .eq('organization_id', orgId)
    .order('uploaded_at', { ascending: false });
  const certificates = (allCerts ?? []) as (Certificate & { compliance_results?: ComplianceResult[] })[];

  // Fetch notifications
  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
    .eq('organization_id', orgId)
    .order('scheduled_date', { ascending: false });
  const notifications = (notifs ?? []) as Notification[];

  // Fetch org templates and waivers in parallel
  const [{ data: orgTemplates }, { data: activeWaiverData }, { data: waiverHistoryData }] = await Promise.all([
    supabase
      .from('requirement_templates')
      .select('*')
      .eq('organization_id', orgId)
      .order('category')
      .order('name'),
    supabase
      .from('compliance_waivers')
      .select('*')
      .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
      .eq('organization_id', orgId)
      .is('revoked_at', null)
      .gt('expires_at', new Date().toISOString())
      .order('created_at', { ascending: false })
      .limit(1)
      .single(),
    supabase
      .from('compliance_waivers')
      .select('*')
      .or(`entity_id.eq.${id},vendor_id.eq.${id}`)
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
  ]);

  return (
    <VendorDetailClient
      vendor={v}
      property={property}
      template={template}
      templateRequirements={templateRequirements}
      extractedCoverages={extractedCoverages}
      complianceResults={complianceResults}
      entityResults={entityResults}
      propertyEntities={propertyEntities}
      certificates={certificates}
      notifications={notifications}
      orgTemplates={(orgTemplates ?? []) as RequirementTemplate[]}
      hasCertificate={hasCertificate}
      activeWaiver={activeWaiverData ?? null}
      waiverHistory={waiverHistoryData ?? []}
    />
  );
}
