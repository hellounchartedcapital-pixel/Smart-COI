import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry, CoveredEntityType, ComplianceStatus } from '@/types';

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
      .select('id, name, entity_type, entity_category, compliance_status, contact_email, property_id, properties(name)')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null)
      .order('name'),
  ]);

  const industry = (org?.industry as Industry) ?? null;
  const terms = getTerminology(industry);
  const allEntities = entities ?? [];

  // Status counts
  const statusCounts: Record<string, number> = {};
  for (const e of allEntities) {
    statusCounts[e.compliance_status] = (statusCounts[e.compliance_status] || 0) + 1;
  }

  // Entity type groups
  const entityTypes = [...new Set(allEntities.map((e) => e.entity_type))];

  const entityLabel = terms.hasTenants
    ? `${terms.entityPlural} & ${terms.tenantPlural}`
    : terms.entityPlural;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">{entityLabel}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {allEntities.length} {allEntities.length === 1 ? 'entity' : 'entities'} total
          </p>
        </div>
      </div>

      {allEntities.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No {terms.entityPlural.toLowerCase()} yet. Add your first from the dashboard.
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-100">
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Type</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">{terms.location}</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-500">Contact</th>
                </tr>
              </thead>
              <tbody>
                {allEntities.map((entity) => {
                  const propertyName = (entity as Record<string, unknown>).properties
                    ? ((entity as Record<string, unknown>).properties as Record<string, unknown>)?.name as string
                    : null;
                  return (
                    <tr key={entity.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                      <td className="px-4 py-3">
                        <a
                          href={`/dashboard/entities/${entity.id}`}
                          className="font-medium text-foreground hover:text-emerald-700 hover:underline"
                        >
                          {entity.name}
                        </a>
                      </td>
                      <td className="px-4 py-3 capitalize text-slate-600">{entity.entity_type}</td>
                      <td className="px-4 py-3 text-slate-500">{propertyName ?? '—'}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={entity.compliance_status as ComplianceStatus} />
                      </td>
                      <td className="px-4 py-3 text-slate-500">{entity.contact_email ?? '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: ComplianceStatus }) {
  const colors: Record<string, string> = {
    compliant: 'bg-emerald-100 text-emerald-800',
    non_compliant: 'bg-red-100 text-red-800',
    expiring_soon: 'bg-amber-100 text-amber-800',
    expired: 'bg-red-100 text-red-800',
    pending: 'bg-slate-100 text-slate-600',
    under_review: 'bg-blue-100 text-blue-800',
  };

  const labels: Record<string, string> = {
    compliant: 'Compliant',
    non_compliant: 'Non-Compliant',
    expiring_soon: 'Expiring Soon',
    expired: 'Expired',
    pending: 'Pending',
    under_review: 'Under Review',
  };

  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap ${colors[status] ?? colors.pending}`}>
      {labels[status] ?? status}
    </span>
  );
}
