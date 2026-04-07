import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

/**
 * Entity detail page — redirects to the legacy vendor/tenant detail pages
 * for now. This ensures the new /dashboard/entities/:id route works while
 * we transition the detail views in a follow-up prompt.
 *
 * TODO: Replace with a unified entity detail component that reads from
 * the entities table directly, with industry-aware terminology.
 */
export default async function EntityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Look up the entity to determine its type
  const { data: entity } = await supabase
    .from('entities')
    .select('id, entity_type')
    .eq('id', id)
    .single();

  if (!entity) redirect('/dashboard/entities');

  // Redirect to legacy detail page based on entity type
  const legacyType = entity.entity_type === 'tenant' ? 'tenants' : 'vendors';
  redirect(`/dashboard/${legacyType}/${id}`);
}
