import { createClient } from '@/lib/supabase/client';
import { clearSessionState } from '@/lib/session';

/**
 * Sign out the current user and redirect to the landing page.
 * Use this from any client component that needs logout functionality.
 */
export async function signOut() {
  clearSessionState();
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.href = '/';
}
