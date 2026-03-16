import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AddPropertyButton } from '@/components/properties/add-property-button';
import type { PropertyType } from '@/types';

const PROPERTY_TYPE_LABELS: Record<PropertyType, string> = {
  office: 'Office',
  retail: 'Retail',
  industrial: 'Industrial',
  mixed_use: 'Mixed-Use',
  multifamily: 'Multifamily',
  other: 'Other',
};

interface PropertyWithCounts {
  id: string;
  name: string;
  address: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  property_type: PropertyType;
  vendor_count: number;
  tenant_count: number;
  vendor_compliant: number;
  vendor_expiring: number;
  vendor_non_compliant: number;
  tenant_compliant: number;
  tenant_expiring: number;
  tenant_non_compliant: number;
  // Combined status counts for the compliance mini-bar
  status_compliant: number;
  status_expiring: number;
  status_non_compliant: number;
  status_expired: number;
  status_pending: number;
  status_under_review: number;
}

const BAR_COLORS: Record<string, string> = {
  status_compliant: 'bg-status-compliant',
  status_expiring: 'bg-status-expiring',
  status_non_compliant: 'bg-status-non-compliant',
  status_expired: 'bg-status-expired',
  status_pending: 'bg-status-pending',
  status_under_review: 'bg-status-under-review',
};

function formatAddress(p: PropertyWithCounts): string | null {
  const parts = [p.address, p.city, p.state ? `${p.state} ${p.zip ?? ''}`.trim() : p.zip]
    .filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function ComplianceSummary({
  label,
  total,
  compliant,
  expiring,
  nonCompliant,
}: {
  label: string;
  total: number;
  compliant: number;
  expiring: number;
  nonCompliant: number;
}) {
  if (total === 0) {
    return (
      <span className="text-xs text-slate-400">No {label} yet</span>
    );
  }

  const issues = [];
  if (nonCompliant > 0) issues.push(`${nonCompliant} non-compliant`);
  if (expiring > 0) issues.push(`${expiring} expiring`);

  return (
    <span className="text-xs text-slate-600">
      {compliant} of {total} {label} compliant
      {issues.length > 0 && (
        <span className="text-slate-400"> ({issues.join(', ')})</span>
      )}
    </span>
  );
}

export default async function PropertiesPage() {
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

  // Fetch properties, default entities, and all vendor/tenant statuses in parallel
  const [{ data: defaultEntities }, { data: properties }] = await Promise.all([
    supabase
      .from('organization_default_entities')
      .select('id, entity_name, entity_address, entity_type')
      .eq('organization_id', orgId),
    supabase
      .from('properties')
      .select('id, name, address, city, state, zip, property_type, created_at')
      .eq('organization_id', orgId)
      .order('created_at', { ascending: false }),
  ]);

  // Batch fetch all vendor/tenant compliance statuses in 2 queries (not per-property)
  const propertyIds = (properties ?? []).map((p) => p.id);

  const [{ data: allVendors }, { data: allTenants }] = propertyIds.length > 0
    ? await Promise.all([
        supabase
          .from('vendors')
          .select('property_id, compliance_status')
          .in('property_id', propertyIds)
          .is('deleted_at', null)
          .is('archived_at', null),
        supabase
          .from('tenants')
          .select('property_id, compliance_status')
          .in('property_id', propertyIds)
          .is('deleted_at', null)
          .is('archived_at', null),
      ])
    : [{ data: [] }, { data: [] }];

  // Group by property_id in memory
  const vendorsByProp = new Map<string, { compliance_status: string }[]>();
  const tenantsByProp = new Map<string, { compliance_status: string }[]>();
  for (const v of allVendors ?? []) {
    const list = vendorsByProp.get(v.property_id) ?? [];
    list.push(v);
    vendorsByProp.set(v.property_id, list);
  }
  for (const t of allTenants ?? []) {
    const list = tenantsByProp.get(t.property_id) ?? [];
    list.push(t);
    tenantsByProp.set(t.property_id, list);
  }

  const propertyList: PropertyWithCounts[] = (properties ?? []).map((prop) => {
    const vList = vendorsByProp.get(prop.id) ?? [];
    const tList = tenantsByProp.get(prop.id) ?? [];
    const all = [...vList, ...tList];
    const countStatus = (status: string) =>
      all.filter((e) => e.compliance_status === status).length;

    return {
      ...prop,
      vendor_count: vList.length,
      tenant_count: tList.length,
      vendor_compliant: vList.filter((v) => v.compliance_status === 'compliant').length,
      vendor_expiring: vList.filter((v) => v.compliance_status === 'expiring_soon').length,
      vendor_non_compliant: vList.filter(
        (v) => v.compliance_status === 'non_compliant' || v.compliance_status === 'expired'
      ).length,
      tenant_compliant: tList.filter((t) => t.compliance_status === 'compliant').length,
      tenant_expiring: tList.filter((t) => t.compliance_status === 'expiring_soon').length,
      tenant_non_compliant: tList.filter(
        (t) => t.compliance_status === 'non_compliant' || t.compliance_status === 'expired'
      ).length,
      status_compliant: countStatus('compliant'),
      status_expiring: countStatus('expiring_soon'),
      status_non_compliant: countStatus('non_compliant'),
      status_expired: countStatus('expired'),
      status_pending: countStatus('pending'),
      status_under_review: countStatus('under_review'),
    };
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
            Properties
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Manage your properties and track compliance.
          </p>
        </div>
        <AddPropertyButton
          defaultEntities={defaultEntities ?? []}
          orgId={orgId}
        />
      </div>

      {/* Property cards or empty state */}
      {propertyList.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <svg
                className="h-7 w-7 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                />
              </svg>
            </div>
            <p className="text-sm font-medium text-foreground">
              No properties yet
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Add your first property to start tracking compliance.
            </p>
            <div className="mt-6">
              <AddPropertyButton
                defaultEntities={defaultEntities ?? []}
                orgId={orgId}
                variant="default"
              />
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {propertyList.map((prop) => {
            const addr = formatAddress(prop);
            return (
              <Link
                key={prop.id}
                href={`/dashboard/properties/${prop.id}`}
                className="group"
              >
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="text-base font-semibold text-foreground group-hover:text-brand-dark">
                        {prop.name}
                      </h3>
                      <Badge
                        variant="secondary"
                        className="shrink-0 text-[10px]"
                      >
                        {PROPERTY_TYPE_LABELS[prop.property_type]}
                      </Badge>
                    </div>

                    {addr && (
                      <p className="mt-1 text-xs text-muted-foreground">
                        {addr}
                      </p>
                    )}

                    <div className="mt-4 border-t border-slate-100 pt-3">
                      {(() => {
                        const total = prop.vendor_count + prop.tenant_count;
                        const segments = [
                          { key: 'status_compliant', count: prop.status_compliant },
                          { key: 'status_expiring', count: prop.status_expiring },
                          { key: 'status_non_compliant', count: prop.status_non_compliant },
                          { key: 'status_expired', count: prop.status_expired },
                          { key: 'status_pending', count: prop.status_pending },
                          { key: 'status_under_review', count: prop.status_under_review },
                        ].filter((s) => s.count > 0);

                        return total > 0 ? (
                          <div className="mb-2 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
                            {segments.map((seg) => (
                              <div
                                key={seg.key}
                                className={BAR_COLORS[seg.key]}
                                style={{ width: `${(seg.count / total) * 100}%` }}
                              />
                            ))}
                          </div>
                        ) : null;
                      })()}
                      <div className="space-y-1">
                        <ComplianceSummary
                          label="vendors"
                          total={prop.vendor_count}
                          compliant={prop.vendor_compliant}
                          expiring={prop.vendor_expiring}
                          nonCompliant={prop.vendor_non_compliant}
                        />
                        <br />
                        <ComplianceSummary
                          label="tenants"
                          total={prop.tenant_count}
                          compliant={prop.tenant_compliant}
                          expiring={prop.tenant_expiring}
                          nonCompliant={prop.tenant_non_compliant}
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
