import { createClient } from '@/lib/supabase/server';
import { getTerminology, type Terminology } from '@/lib/constants/terminology';
import type { Industry } from '@/types';

/**
 * Server-side helper to get terminology for a given org.
 * Use in server components, server actions, and email templates.
 */
export async function getServerTerminology(orgId: string): Promise<Terminology> {
  const supabase = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('industry')
    .eq('id', orgId)
    .single();

  return getTerminology((org?.industry as Industry) ?? null);
}
