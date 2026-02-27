import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { TemplateEditorClient } from '@/components/templates/template-editor-client';
import type { RequirementTemplate, TemplateCoverageRequirement } from '@/types';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function TemplateEditorPage({ params }: Props) {
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

  // Fetch template — allow system defaults or templates owned by this org
  const { data: template } = await supabase
    .from('requirement_templates')
    .select('*')
    .eq('id', id)
    .or(`is_system_default.eq.true,organization_id.eq.${orgId}`)
    .single();

  if (!template) notFound();

  // Fetch requirements, usage counts, and property IDs in parallel
  const [
    { data: requirements },
    { count: vendorCount },
    { count: tenantCount },
    { data: vendorProps },
    { data: tenantProps },
  ] = await Promise.all([
    supabase
      .from('template_coverage_requirements')
      .select('*')
      .eq('template_id', id)
      .order('created_at'),
    supabase
      .from('vendors')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('template_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('vendors')
      .select('property_id')
      .eq('template_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
    supabase
      .from('tenants')
      .select('property_id')
      .eq('template_id', id)
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
  ]);

  const propertyIds = new Set([
    ...(vendorProps ?? []).map((v) => v.property_id).filter(Boolean),
    ...(tenantProps ?? []).map((t) => t.property_id).filter(Boolean),
  ]);

  return (
    <TemplateEditorClient
      template={template as RequirementTemplate}
      requirements={(requirements ?? []) as TemplateCoverageRequirement[]}
      usageCount={{
        vendors: vendorCount ?? 0,
        tenants: tenantCount ?? 0,
        totalEntities: (vendorCount ?? 0) + (tenantCount ?? 0),
        properties: propertyIds.size,
      }}
    />
  );
}
