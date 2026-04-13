// ---------------------------------------------------------------------------
// Plan features — feature-gating utilities shared by server and client code.
//
// Plan matrix (Apr 2026 freemium repositioning):
//
//   free           → one free compliance report, no dashboard access
//   monitor        → dashboard, continuous monitoring, expiration alerts
//   automate       → + vendor portal, auto follow-ups, lease extraction,
//                     custom requirement overrides
//   full_platform  → + custom templates from scratch, bulk operations,
//                     team workflows, priority support
//
// Legacy plans (starter/growth/professional/trial) are normalized into the
// new names via `normalizePlan()` in stripe-prices.ts.
// ---------------------------------------------------------------------------

import { normalizePlan, type Plan } from '@/lib/stripe-prices';

/**
 * Machine-readable tag embedded in error messages thrown by tier-gated
 * server actions. Client code checks for this prefix (not human copy)
 * when deciding whether to show the feature upgrade prompt.
 */
export const FEATURE_LOCKED_TAG = '[FEATURE_LOCKED]';

/** Detect a tier-gated error message from a server action. */
export function isFeatureLockedError(message: string): boolean {
  return message.includes(FEATURE_LOCKED_TAG);
}

export type Feature =
  // Core dashboard access — gate for Free users
  | 'dashboard_access'
  | 'continuous_monitoring'
  | 'expiration_alerts'
  // Automate tier
  | 'vendor_portal'
  | 'auto_follow_ups'
  | 'lease_extraction'
  | 'custom_requirement_overrides'
  // Full Platform tier
  | 'custom_templates_from_scratch'
  | 'bulk_operations'
  | 'team_workflows'
  | 'priority_support';

// Plan rank (higher = more features). Used for "at least this tier" checks.
const PLAN_RANK: Record<Plan, number> = {
  canceled: -1,
  free: 0,
  trial: 1, // trial gets the same access as monitor so users can evaluate paid features
  monitor: 1,
  starter: 1, // legacy alias
  automate: 2,
  growth: 2, // legacy alias
  full_platform: 3,
  professional: 3, // legacy alias
};

/** Minimum plan required to use each feature. */
const FEATURE_MIN_PLAN: Record<Feature, Plan> = {
  // Monitor tier and above
  dashboard_access: 'monitor',
  continuous_monitoring: 'monitor',
  expiration_alerts: 'monitor',
  // Automate tier and above
  vendor_portal: 'automate',
  auto_follow_ups: 'automate',
  lease_extraction: 'automate',
  custom_requirement_overrides: 'automate',
  // Full Platform only
  custom_templates_from_scratch: 'full_platform',
  bulk_operations: 'full_platform',
  team_workflows: 'full_platform',
  priority_support: 'full_platform',
};

/**
 * Check whether a plan has access to a given feature.
 *
 * Accepts any plan string (legacy or modern) and normalizes internally.
 * Trial users get the same feature access as Monitor users so they can
 * evaluate the product; trial expiration is enforced separately by
 * `getActivePlanStatus()`.
 */
export function canAccessFeature(plan: string | null | undefined, feature: Feature): boolean {
  const normalized = normalizePlan(plan);
  const userRank = PLAN_RANK[normalized] ?? 0;
  const requiredRank = PLAN_RANK[FEATURE_MIN_PLAN[feature]] ?? 0;
  return userRank >= requiredRank;
}

/** Convenience: is this plan at least Monitor tier (i.e. has dashboard access)? */
export function hasDashboardAccess(plan: string | null | undefined): boolean {
  return canAccessFeature(plan, 'dashboard_access');
}

/** Convenience: is this a Free-tier plan (no dashboard, report-only)? */
export function isFreeTier(plan: string | null | undefined): boolean {
  return normalizePlan(plan) === 'free';
}

// ---------------------------------------------------------------------------
// Human-readable upgrade prompt copy
// ---------------------------------------------------------------------------

export interface UpgradePromptCopy {
  title: string;
  description: string;
  valueBullets: string[];
  targetPlan: Plan;
  targetPlanLabel: string;
  ctaLabel: string;
}

/**
 * Copy for the upgrade modal/prompt shown when a user tries to access a
 * feature above their current plan. The copy focuses on what the feature
 * does, not just "please upgrade".
 */
export function getUpgradePromptCopy(feature: Feature): UpgradePromptCopy {
  const targetPlan = FEATURE_MIN_PLAN[feature];
  const targetPlanLabel = planLabel(targetPlan);
  const ctaLabel = `Upgrade to ${targetPlanLabel}`;

  switch (feature) {
    case 'dashboard_access':
    case 'continuous_monitoring':
    case 'expiration_alerts':
      return {
        title: `Unlock the ${targetPlanLabel} dashboard`,
        description:
          "You've got your first compliance report. Monitor keeps it up to date — as certificates expire, vendors change, and new ones come on board.",
        valueBullets: [
          'Full dashboard with portfolio health at a glance',
          'Continuous compliance tracking as COIs come in',
          'Expiration alerts 60, 30, and 14 days before a lapse',
          'Up to 50 certificates monitored',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'vendor_portal':
      return {
        title: 'Let vendors upload their own COIs',
        description:
          'Send vendors a self-service link — no login required. They upload renewals directly, and SmartCOI extracts and verifies compliance automatically.',
        valueBullets: [
          'Secure upload link for each vendor/tenant',
          'Automatic extraction and compliance check on upload',
          'Email notification when a new COI arrives',
          'Works without an account on their end',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'auto_follow_ups':
      return {
        title: 'Automate renewal follow-ups',
        description:
          "Stop chasing expiring certificates. Automate sends renewal reminders to vendors on your schedule — so you don't have to.",
        valueBullets: [
          'Scheduled follow-ups at 60/30/14 days before expiration',
          'Custom message templates per industry',
          'Tracks delivery and vendor responses',
          'Pauses automatically when a renewal arrives',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'lease_extraction':
      return {
        title: 'Extract requirements from your leases',
        description:
          'Upload a lease PDF and SmartCOI pulls the insurance requirements into a compliance template — coverage types, limits, endorsements, and entity names.',
        valueBullets: [
          'AI reads insurance clauses from any lease PDF',
          'Saves extracted requirements as a reusable template',
          'Pre-fills additional insured and certificate holder',
          'Cuts template setup from 20 minutes to 30 seconds',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'custom_requirement_overrides':
      return {
        title: 'Override requirements per vendor',
        description:
          'Tweak coverage limits, endorsements, and conditions on a vendor-by-vendor basis without creating separate templates for every exception.',
        valueBullets: [
          'Per-vendor requirement overrides',
          'Waiver tracking with audit trail',
          'Condition-based requirement swaps',
          'Inherits from org template with overrides layered on top',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'custom_templates_from_scratch':
      return {
        title: 'Build compliance templates from scratch',
        description:
          'Create fully custom requirement templates — any combination of coverages, limits, endorsements, and entity names — for specialized compliance programs.',
        valueBullets: [
          'Unlimited custom templates',
          'Any coverage type, any limit structure',
          'Conditional requirements (e.g. work type, project value)',
          'Duplicate and version templates for compliance audits',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'bulk_operations':
      return {
        title: 'Bulk operations for large portfolios',
        description:
          "When you've got hundreds of vendors, you need to move fast. Bulk archive, reassign templates, send portal links, and recheck compliance across your entire roster at once.",
        valueBullets: [
          'Bulk archive, delete, and restore entities',
          'Bulk template reassignment',
          'Bulk portal link generation and email',
          'Bulk compliance recheck after template changes',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'team_workflows':
      return {
        title: 'Collaborate with your team',
        description:
          "Invite teammates, assign vendors, and split the compliance workload. Keep an audit trail of who did what so you're always review-ready.",
        valueBullets: [
          'Invite unlimited team members',
          'Role-based access (admin, reviewer, viewer)',
          'Assign vendors to reviewers',
          'Team-wide activity log',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };

    case 'priority_support':
      return {
        title: 'Priority support when you need it',
        description:
          "Jump the queue and get help from a compliance specialist — not a generic support rep. Same-day response during business hours.",
        valueBullets: [
          'Same-day response on business days',
          'Direct access to compliance specialists',
          'Help with template setup and vendor onboarding',
          'Quarterly compliance review calls',
        ],
        targetPlan,
        targetPlanLabel,
        ctaLabel,
      };
  }
}

/** Human-readable plan name for display. */
export function planLabel(plan: Plan): string {
  switch (plan) {
    case 'free':
      return 'Free';
    case 'trial':
      return 'Free Trial';
    case 'monitor':
    case 'starter':
      return 'Monitor';
    case 'automate':
    case 'growth':
      return 'Automate';
    case 'full_platform':
    case 'professional':
      return 'Full Platform';
    case 'canceled':
      return 'Canceled';
  }
}
