'use client';

import { useEffect, useMemo, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getTerminology, type Terminology } from '@/lib/constants/terminology';
import type { Industry } from '@/types';

/**
 * React hook that returns industry-specific terminology for the current org.
 *
 * Fetches the org's industry from the user profile → organizations table,
 * then returns the memoized terminology object.
 */
export function useTerminology(): { terminology: Terminology; loading: boolean } {
  const [industry, setIndustry] = useState<Industry | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function loadIndustry() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('users')
        .select('organization_id')
        .eq('id', user.id)
        .single();

      if (!profile?.organization_id) {
        setLoading(false);
        return;
      }

      const { data: org } = await supabase
        .from('organizations')
        .select('industry')
        .eq('id', profile.organization_id)
        .single();

      setIndustry((org?.industry as Industry) ?? null);
      setLoading(false);
    }

    loadIndustry();
  }, []);

  const terminology = useMemo(() => getTerminology(industry), [industry]);

  return { terminology, loading };
}
