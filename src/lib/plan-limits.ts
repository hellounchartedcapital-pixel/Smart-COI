import { createServiceClient } from '@/lib/supabase/service';
import { getActivePlanStatus } from '@/lib/plan-status';
import { normalizePlan } from '@/lib/stripe-prices';

// ---------------------------------------------------------------------------
// Plan limits (Apr 2026 freemium repositioning)
//
//   free           — no monitoring, no entities. Can upload COIs for the
//                    free report but the dashboard is gated.
//   monitor        — up to 50 certificates monitored continuously
//   automate       — up to 150 certificates monitored
//   full_platform  — unlimited certificates (10k cap to prevent runaway costs)
//   trial          — same as monitor for evaluation
// ---------------------------------------------------------------------------

export interface PlanLimits {
  maxVendorsTenants: number;
  maxExtractionsPerMonth: number;
}

const PLAN_LIMITS: Record<string, PlanLimits> = {
  // Modern plan names
  free: { maxVendorsTenants: 0, maxExtractionsPerMonth: 100 },
  monitor: { maxVendorsTenants: 50, maxExtractionsPerMonth: 50 },
  automate: { maxVendorsTenants: 150, maxExtractionsPerMonth: 150 },
  full_platform: { maxVendorsTenants: 10000, maxExtractionsPerMonth: 10000 },
  // Trial mirrors the old "starter with 50 COIs" experience
  trial: { maxVendorsTenants: 50, maxExtractionsPerMonth: 50 },
  // Legacy plan names — same limits as their modern equivalents
  starter: { maxVendorsTenants: 50, maxExtractionsPerMonth: 50 },
  growth: { maxVendorsTenants: 150, maxExtractionsPerMonth: 150 },
  professional: { maxVendorsTenants: 10000, maxExtractionsPerMonth: 10000 },
  canceled: { maxVendorsTenants: 0, maxExtractionsPerMonth: 0 },
};

/** Get the limits for a plan. Unknown plans get Free-tier limits. */
export function getOrgLimits(plan: string): PlanLimits {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.free;
}

// ---------------------------------------------------------------------------
// Upgrade messaging — points Free users to Monitor, Monitor users to Automate,
// Automate users to Full Platform.
// ---------------------------------------------------------------------------

function upgradeSuggestion(plan: string, currentLimit: number): string {
  const normalized = normalizePlan(plan);
  if (normalized === 'free' || normalized === 'trial') {
    return ` Upgrade to Monitor for continuous tracking of up to 50 certificates.`;
  }
  if (normalized === 'monitor') {
    return ` Upgrade to Automate for up to 150 certificates and the vendor portal.`;
  }
  if (normalized === 'automate') {
    return ` Upgrade to Full Platform for unlimited certificates and priority support.`;
  }
  return ` You're on the highest tier (${currentLimit} limit).`;
}

// ---------------------------------------------------------------------------
// Enforcement helpers — call these before creating vendors/tenants or
// extracting COIs. They return { allowed: true } or { allowed: false, error }.
// ---------------------------------------------------------------------------

export async function checkVendorTenantLimit(
  orgId: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('plan, trial_ends_at, payment_failed')
    .eq('id', orgId)
    .single();

  const plan = org?.plan ?? 'trial';
  const limits = getOrgLimits(plan);

  // Check plan is active (catches canceled, expired trial, and payment failures)
  const planStatus = getActivePlanStatus(org ?? { plan, trial_ends_at: null });
  if (!planStatus.isActive) {
    const messages: Record<string, string> = {
      canceled:
        'Your subscription has been canceled. Please resubscribe to add vendors or tenants.',
      trial_expired:
        'Your free trial has expired. Subscribe to add vendors or tenants.',
      payment_failed:
        'Your last payment failed. Please update your payment method to add vendors or tenants.',
    };
    return {
      allowed: false,
      error:
        messages[planStatus.reason] ??
        'Your plan is inactive. Please subscribe to continue.',
    };
  }

  // Free tier has no monitored entities at all
  if (normalizePlan(plan) === 'free') {
    return {
      allowed: false,
      error:
        "Your free report doesn't include continuous monitoring. Upgrade to Monitor to track vendors and tenants on an ongoing basis.",
    };
  }

  // Count active (non-deleted) vendors + tenants
  const { count: vendorCount } = await supabase
    .from('vendors')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  const { count: tenantCount } = await supabase
    .from('tenants')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  const total = (vendorCount ?? 0) + (tenantCount ?? 0);

  if (total >= limits.maxVendorsTenants) {
    return {
      allowed: false,
      error: `You've reached the vendor/tenant limit for your plan (${limits.maxVendorsTenants}).${upgradeSuggestion(plan, limits.maxVendorsTenants)}`,
    };
  }

  return { allowed: true };
}

export async function checkExtractionLimit(
  orgId: string,
): Promise<{ allowed: true } | { allowed: false; error: string }> {
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = org?.plan ?? 'trial';
  const limits = getOrgLimits(plan);

  if (plan === 'canceled') {
    return {
      allowed: false,
      error:
        'Your subscription has been canceled. Please resubscribe to extract COIs.',
    };
  }

  // Count extractions this calendar month.
  // Intentionally excludes failed extractions (processing_status='failed') so users
  // aren't penalized for AI/API failures they can't control. Retries of failed
  // files create new certificate records, but the failed ones don't count.
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .neq('processing_status', 'failed')
    .gte('uploaded_at', startOfMonth);

  if ((count ?? 0) >= limits.maxExtractionsPerMonth) {
    return {
      allowed: false,
      error: `You've reached the monthly extraction limit for your plan (${limits.maxExtractionsPerMonth}).${upgradeSuggestion(plan, limits.maxExtractionsPerMonth)}`,
    };
  }

  return { allowed: true };
}

/**
 * Check how many extractions remain this month. Used by bulk upload to
 * show the user how many files they can process in one batch.
 */
export async function getRemainingExtractions(
  orgId: string,
): Promise<{ remaining: number; limit: number; used: number }> {
  const supabase = createServiceClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('plan')
    .eq('id', orgId)
    .single();

  const plan = org?.plan ?? 'trial';
  const limits = getOrgLimits(plan);

  if (plan === 'canceled') {
    return { remaining: 0, limit: 0, used: 0 };
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const { count } = await supabase
    .from('certificates')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .neq('processing_status', 'failed')
    .gte('uploaded_at', startOfMonth);

  const used = count ?? 0;
  const remaining = Math.max(0, limits.maxExtractionsPerMonth - used);

  return { remaining, limit: limits.maxExtractionsPerMonth, used };
}
