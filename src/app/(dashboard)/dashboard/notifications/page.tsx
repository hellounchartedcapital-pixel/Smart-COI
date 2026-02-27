import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { NotificationsClient } from '@/components/notifications/notifications-client';
import type { Notification } from '@/types';

export default async function NotificationsPage() {
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

  // Fetch all notifications for this org (most recent first)
  const { data: notifs } = await supabase
    .from('notifications')
    .select('*')
    .eq('organization_id', orgId)
    .order('scheduled_date', { ascending: false })
    .limit(200);

  const notifications = (notifs ?? []) as Notification[];

  // Fetch entity names in bulk for display
  const vendorIds = [...new Set(notifications.filter((n) => n.vendor_id).map((n) => n.vendor_id!))];
  const tenantIds = [...new Set(notifications.filter((n) => n.tenant_id).map((n) => n.tenant_id!))];

  const entityNameMap: Record<string, string> = {};

  // Fetch vendor and tenant names in parallel
  const [{ data: vendorNames }, { data: tenantNames }] = await Promise.all([
    vendorIds.length > 0
      ? supabase.from('vendors').select('id, company_name').in('id', vendorIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
    tenantIds.length > 0
      ? supabase.from('tenants').select('id, company_name').in('id', tenantIds)
      : Promise.resolve({ data: [] as { id: string; company_name: string }[] }),
  ]);

  for (const v of vendorNames ?? []) entityNameMap[v.id] = v.company_name;
  for (const t of tenantNames ?? []) entityNameMap[t.id] = t.company_name;

  return (
    <NotificationsClient
      notifications={notifications}
      entityNameMap={entityNameMap}
    />
  );
}
