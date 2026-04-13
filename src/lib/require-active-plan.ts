'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getActivePlanStatus, PLAN_INACTIVE_TAG } from '@/lib/plan-status';
import { canAccessFeature, planLabel, type Feature } from '@/lib/plan-features';
import { normalizePlan } from '@/lib/stripe-prices';

/**
 * Guard for server actions — throws if the caller's org does not have an
 * active plan.  Returns the authenticated user ID and org ID on success so
 * the caller doesn't need to re-fetch them.
 *
 * Uses the **service role** client for all DB lookups so that RLS policies
 * can never silently block the org/plan query (which would surface as
 * "Organization not found" instead of the correct plan-gated error).
 *
 * @param actionLabel – human-readable phrase appended to the error, e.g.
 *   "Subscribe to add vendors and tenants."
 */
export async function requireActivePlan(
  actionLabel: string,
): Promise<{ userId: string; orgId: string }> {
  /* ---- authenticate via the cookie-based (anon) client ---- */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  /* ---- all DB reads go through the service role client ---- */
  const service = createServiceClient();

  const { data: profile, error: profileError } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    console.error('[requireActivePlan] profile lookup failed:', profileError);
    throw new Error('No organization found');
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .select('plan, trial_ends_at, payment_failed')
    .eq('id', profile.organization_id)
    .single();

  if (orgError || !org) {
    console.error('[requireActivePlan] org lookup failed:', orgError);
    throw new Error('Organization not found');
  }

  const status = getActivePlanStatus(org);
  if (!status.isActive) {
    throw new Error(`${PLAN_INACTIVE_TAG} ${actionLabel}`);
  }

  return { userId: user.id, orgId: profile.organization_id };
}

/**
 * Non-throwing variant of `requireActivePlan`.
 *
 * Returns `{ userId, orgId }` on success, or `{ error: string }` when the
 * plan is inactive.  Server actions should use this so that the
 * `[PLAN_INACTIVE]` tag survives Next.js error serialisation (thrown errors
 * have their message stripped in production).
 *
 * Auth/org-lookup failures still throw — those are genuine bugs, not
 * user-facing plan gates.
 */
export async function checkActivePlan(
  actionLabel: string,
): Promise<{ userId: string; orgId: string } | { error: string }> {
  /* ---- authenticate via the cookie-based (anon) client ---- */
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  /* ---- all DB reads go through the service role client ---- */
  const service = createServiceClient();

  const { data: profile, error: profileError } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    console.error('[checkActivePlan] profile lookup failed:', profileError);
    throw new Error('No organization found');
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .select('plan, trial_ends_at, payment_failed')
    .eq('id', profile.organization_id)
    .single();

  if (orgError || !org) {
    console.error('[checkActivePlan] org lookup failed:', orgError);
    throw new Error('Organization not found');
  }

  const status = getActivePlanStatus(org);
  if (!status.isActive) {
    return { error: `${PLAN_INACTIVE_TAG} ${actionLabel}` };
  }

  return { userId: user.id, orgId: profile.organization_id };
}

/**
 * Feature-gate helper for server actions / route handlers.
 *
 * Returns `{ userId, orgId, plan }` when the caller's plan entitles them
 * to the requested feature, or `{ error }` when it doesn't. The error
 * message is tagged so clients can detect plan-gated errors and surface
 * an upgrade prompt.
 *
 * Use from a server action like:
 *   const check = await checkFeatureAccess('vendor_portal');
 *   if ('error' in check) return check;
 *   const { orgId } = check;
 */
export async function checkFeatureAccess(
  feature: Feature,
): Promise<{ userId: string; orgId: string; plan: string } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Not authenticated');

  const service = createServiceClient();

  const { data: profile, error: profileError } = await service
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single();

  if (profileError || !profile?.organization_id) {
    throw new Error('No organization found');
  }

  const { data: org, error: orgError } = await service
    .from('organizations')
    .select('plan, trial_ends_at, payment_failed')
    .eq('id', profile.organization_id)
    .single();

  if (orgError || !org) {
    throw new Error('Organization not found');
  }

  // Active plan check first — expired trials, canceled, and payment
  // failures all block regardless of tier.
  const status = getActivePlanStatus(org);
  if (!status.isActive) {
    return { error: `${PLAN_INACTIVE_TAG} Your plan is inactive. Please subscribe to continue.` };
  }

  // Feature gate — normalize the plan name and check capability.
  const plan = normalizePlan(org.plan);
  if (!canAccessFeature(plan, feature)) {
    // We don't embed PLAN_INACTIVE_TAG because the plan IS active — this is
    // a tier-gate, not a subscription-gate. Client code should check for
    // the "[FEATURE_LOCKED]" prefix instead and show an inline upgrade
    // prompt rather than the "subscription expired" modal. The tag itself
    // lives in plan-features.ts so it can be imported by client code
    // without pulling in the `'use server'` file.
    return {
      error: `[FEATURE_LOCKED] This feature requires the ${featureMinPlanLabel(feature)} plan or higher.`,
    };
  }

  return { userId: user.id, orgId: profile.organization_id, plan };
}

function featureMinPlanLabel(feature: Feature): string {
  // Manual mapping to keep this file free of a cyclic import with plan-features.
  // The labels must stay in sync with the matrix in plan-features.ts.
  const automateFeatures: Feature[] = [
    'vendor_portal',
    'auto_follow_ups',
    'lease_extraction',
    'custom_requirement_overrides',
  ];
  const fullPlatformFeatures: Feature[] = [
    'custom_templates_from_scratch',
    'bulk_operations',
    'team_workflows',
    'priority_support',
  ];
  if (fullPlatformFeatures.includes(feature)) return planLabel('full_platform');
  if (automateFeatures.includes(feature)) return planLabel('automate');
  return planLabel('monitor');
}
