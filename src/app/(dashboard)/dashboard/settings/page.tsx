import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { SettingsClient } from '@/components/settings/settings-client';
import type { Industry, OrganizationDefaultEntity, OrganizationSettings } from '@/types';

export default async function SettingsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('users')
    .select('organization_id, full_name, email')
    .eq('id', user.id)
    .single();
  if (!profile?.organization_id) redirect('/login');

  const orgId = profile.organization_id;

  // Fetch org info and default entities in parallel
  const [{ data: org }, { data: defaultEntities }] = await Promise.all([
    supabase
      .from('organizations')
      .select('name, industry, settings')
      .eq('id', orgId)
      .single(),
    supabase
      .from('organization_default_entities')
      .select('*')
      .eq('organization_id', orgId)
      .order('entity_type')
      .order('created_at'),
  ]);

  return (
    <SettingsClient
      orgName={org?.name ?? ''}
      orgIndustry={(org?.industry as Industry) ?? null}
      orgSettings={(org?.settings ?? {}) as OrganizationSettings}
      pmName={profile.full_name ?? ''}
      pmEmail={profile.email}
      defaultEntities={(defaultEntities ?? []) as OrganizationDefaultEntity[]}
      userEmail={user.email ?? profile.email}
      lastSignIn={user.last_sign_in_at ?? null}
    />
  );
}
