'use server';

import { createServiceClient } from '@/lib/supabase/service';
import { createClient } from '@/lib/supabase/server';

// ============================================================================
// Take daily compliance snapshots for all organizations
// Called from the cron job
// ============================================================================

export async function takeComplianceSnapshots(): Promise<number> {
  const supabase = createServiceClient();
  let count = 0;

  // Get all org IDs
  const { data: orgs } = await supabase
    .from('organizations')
    .select('id');

  if (!orgs || orgs.length === 0) return 0;

  const today = new Date().toISOString().slice(0, 10);

  for (const org of orgs) {
    // Check if snapshot already taken today
    const { data: existing } = await supabase
      .from('compliance_snapshots')
      .select('id')
      .eq('organization_id', org.id)
      .eq('snapshot_date', today)
      .limit(1)
      .single();

    if (existing) continue;

    // Count vendor/tenant statuses
    const [vendorsRes, tenantsRes] = await Promise.all([
      supabase
        .from('vendors')
        .select('compliance_status')
        .eq('organization_id', org.id)
        .is('deleted_at', null)
        .is('archived_at', null),
      supabase
        .from('tenants')
        .select('compliance_status')
        .eq('organization_id', org.id)
        .is('deleted_at', null)
        .is('archived_at', null),
    ]);

    const all = [...(vendorsRes.data ?? []), ...(tenantsRes.data ?? [])];
    const total = all.length;
    if (total === 0) continue;

    const compliant = all.filter((e) => e.compliance_status === 'compliant').length;
    const withCert = all.filter((e) => e.compliance_status !== 'pending').length;
    const complianceRate = withCert > 0 ? Math.round((compliant / withCert) * 100) : 0;

    const nonCompliant = all.filter((e) => e.compliance_status === 'non_compliant').length;
    const expired = all.filter((e) => e.compliance_status === 'expired').length;
    const expiringSoon = all.filter((e) => e.compliance_status === 'expiring_soon').length;
    const pending = all.filter((e) => e.compliance_status === 'pending').length;

    await supabase.from('compliance_snapshots').insert({
      organization_id: org.id,
      snapshot_date: today,
      compliance_rate: complianceRate,
      total_entities: total,
      compliant_count: compliant,
      non_compliant_count: nonCompliant,
      expired_count: expired,
      expiring_soon_count: expiringSoon,
      pending_count: pending,
    });

    count++;
  }

  return count;
}

// ============================================================================
// Get compliance trend data for the last 30 days
// ============================================================================

export interface ComplianceTrendPoint {
  date: string;
  rate: number;
}

export async function getComplianceTrend(): Promise<ComplianceTrendPoint[]> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) return [];

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: snapshots } = await supabase
    .from('compliance_snapshots')
    .select('snapshot_date, compliance_rate')
    .eq('organization_id', profile.organization_id)
    .gte('snapshot_date', thirtyDaysAgo.toISOString().slice(0, 10))
    .order('snapshot_date', { ascending: true });

  return (snapshots ?? []).map((s) => ({
    date: s.snapshot_date,
    rate: s.compliance_rate,
  }));
}
