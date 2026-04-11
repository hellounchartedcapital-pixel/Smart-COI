import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTerminology } from '@/lib/constants/terminology';
import { evaluateEntityCompliance } from '@/lib/compliance/evaluate-inline';
import { VENDOR_TYPE_LABELS, type VendorType } from '@/lib/constants/vendor-requirements';
import type { Industry, ComplianceStatus, ExtractedCoverage, TemplateCoverageRequirement } from '@/types';

// ============================================================================
// Server component — entities list page
// ============================================================================

export default async function EntitiesPage() {
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

  // Fetch org industry + entities in parallel
  const [{ data: org }, { data: entities }] = await Promise.all([
    supabase.from('organizations').select('industry').eq('id', orgId).single(),
    supabase
      .from('entities')
      .select('id, name, entity_type, entity_category, compliance_status, template_id, contact_email, property_id, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('name'),
  ]);

  const industry = (org?.industry as Industry) ?? null;
  const terms = getTerminology(industry);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const allEntities = (entities ?? []) as any[];

  // ---- Inline compliance evaluation (same as dashboard + report API) ----
  const entityIds = allEntities.map((e: { id: string }) => e.id);

  // Find latest certificate per entity
  let entityCertMap = new Map<string, string>();
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
        entityCertMap.set(eid, cert.id);
      }
    }
  }

  const certIds = [...new Set(entityCertMap.values())];
  const templateIds = [...new Set(allEntities.map((e: { template_id: string | null }) => e.template_id).filter((id: string | null): id is string => id != null))];

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

  // Build derived status for each entity
  interface DerivedEntity {
    id: string;
    name: string;
    entityType: string;
    entityCategory: string | null;
    propertyName: string | null;
    contactEmail: string | null;
    derivedStatus: ComplianceStatus;
  }

  const derivedEntities: DerivedEntity[] = allEntities.map((e: Record<string, unknown>) => {
    const certId = entityCertMap.get(e.id as string);
    const coverages = certId ? (coveragesByCert.get(certId) ?? []) : [];
    const templateReqs = e.template_id
      ? (requirementsByTemplate.get(e.template_id as string) ?? [])
      : [];

    const evaluation = evaluateEntityCompliance(templateReqs, coverages);

    const props = e.properties as { name?: string } | null;

    return {
      id: e.id as string,
      name: e.name as string,
      entityType: e.entity_type as string,
      entityCategory: (e.entity_category as string | null) ?? null,
      propertyName: props?.name ?? null,
      contactEmail: (e.contact_email as string | null) ?? null,
      derivedStatus: evaluation.complianceStatus,
    };
  });

  // Status counts from derived data
  const statusCounts: Record<string, number> = {};
  for (const e of derivedEntities) {
    statusCounts[e.derivedStatus] = (statusCounts[e.derivedStatus] || 0) + 1;
  }

  const entityLabel = terms.hasTenants
    ? `${terms.entityPlural} & ${terms.tenantPlural}`
    : terms.entityPlural;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[30px] font-bold text-[#111827]">{entityLabel}</h1>
          <p className="mt-1 text-[13px] text-[#6B7280]">
            {derivedEntities.length} {derivedEntities.length === 1 ? 'entity' : 'entities'} total
          </p>
        </div>
      </div>

      {derivedEntities.length === 0 ? (
        <div className="rounded-xl border border-[#E5E7EB] bg-white py-20 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#F3F4F6]">
            <svg className="h-6 w-6 text-[#9CA3AF]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-[#111827]">No {terms.entityPlural.toLowerCase()} yet</p>
          <p className="mt-1 text-[13px] text-[#6B7280]">Upload a COI from the dashboard to get started.</p>
        </div>
      ) : (
        <div className="rounded-xl border border-[#E5E7EB] bg-white overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#E5E7EB]">
                  <th className="bg-[#F9FAFB] px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[#6B7280]">Name</th>
                  <th className="bg-[#F9FAFB] px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[#6B7280]">Type</th>
                  <th className="bg-[#F9FAFB] px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[#6B7280]">{terms.location}</th>
                  <th className="bg-[#F9FAFB] px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[#6B7280]">Status</th>
                  <th className="bg-[#F9FAFB] px-5 py-3 text-left text-xs font-medium uppercase tracking-[0.05em] text-[#6B7280]">Contact</th>
                </tr>
              </thead>
              <tbody>
                {derivedEntities.map((entity) => (
                  <tr key={entity.id} className="border-b border-[#F3F4F6] last:border-0 hover:bg-[#F9FAFB] transition-colors">
                    <td className="px-5 py-3.5">
                      <a
                        href={`/dashboard/entities/${entity.id}`}
                        className="font-medium text-[#111827] hover:text-brand-dark"
                      >
                        {entity.name}
                      </a>
                    </td>
                    <td className="px-5 py-3.5">
                      <VendorTypeBadge
                        entityType={entity.entityType}
                        entityCategory={entity.entityCategory}
                      />
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{entity.propertyName ?? '—'}</td>
                    <td className="px-5 py-3.5">
                      <StatusBadge status={entity.derivedStatus} />
                    </td>
                    <td className="px-5 py-3.5 text-[#6B7280]">{entity.contactEmail ?? '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function VendorTypeBadge({ entityType, entityCategory }: { entityType: string; entityCategory: string | null }) {
  if (entityCategory && entityCategory in VENDOR_TYPE_LABELS) {
    const label = VENDOR_TYPE_LABELS[entityCategory as VendorType];
    return (
      <span className="inline-flex items-center rounded-full bg-[#F3F4F6] px-2.5 py-0.5 text-xs font-medium text-[#374151]">
        {label}
      </span>
    );
  }

  // Fallback to entity_type
  return (
    <span className="capitalize text-[#374151]">{entityType}</span>
  );
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  const colors: Record<string, string> = {
    compliant: 'bg-[#E8FAF0] text-[#065F46]',
    non_compliant: 'bg-[#FEF2F2] text-[#991B1B]',
    expiring_soon: 'bg-[#FFFBEB] text-[#92400E]',
    expired: 'bg-[#FEF2F2] text-[#991B1B]',
    pending: 'bg-[#F3F4F6] text-[#6B7280]',
    under_review: 'bg-[#EFF6FF] text-[#1E40AF]',
    needs_setup: 'bg-[#F5F3FF] text-[#6D28D9]',
  };

  const labels: Record<string, string> = {
    compliant: 'Compliant',
    non_compliant: 'Non-Compliant',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    pending: 'Pending',
    under_review: 'Under Review',
    needs_setup: 'Needs Setup',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium whitespace-nowrap ${colors[status] ?? colors.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}
