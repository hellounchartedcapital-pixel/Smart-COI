// ---------------------------------------------------------------------------
// Stripe price ID configuration — safe to import from both client and server.
// Separated from stripe.ts to avoid bundling the Stripe SDK into client bundles.
//
// Price IDs come from env vars so the Stripe products can be managed in the
// dashboard without shipping new code. Client-safe by using NEXT_PUBLIC_ prefix.
//
// Plan naming (Apr 2026 freemium repositioning):
//   - free           — no Stripe price, free tier with one report
//   - monitor        — $79/mo continuous monitoring (was "starter")
//   - automate       — $149/mo automation + portal (was "growth")
//   - full_platform  — $249/mo unlimited (was "professional")
// ---------------------------------------------------------------------------

export type Plan =
  | 'free'
  | 'monitor'
  | 'automate'
  | 'full_platform'
  // Legacy plan names — retained so existing org rows still resolve correctly.
  // The billing flow maps legacy plans onto their modern equivalents for
  // limits and feature gates.
  | 'trial'
  | 'starter'
  | 'growth'
  | 'professional'
  | 'canceled';

/**
 * Env-driven Stripe price IDs. Empty string sentinels mean "not configured
 * yet" — the checkout action validates non-empty before calling Stripe.
 */
export const PRICE_IDS = {
  // New tier names (Apr 2026)
  MONITOR_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONITOR_MONTHLY ?? '',
  MONITOR_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_MONITOR_ANNUAL ?? '',
  AUTOMATE_MONTHLY: process.env.NEXT_PUBLIC_STRIPE_PRICE_AUTOMATE_MONTHLY ?? '',
  AUTOMATE_ANNUAL: process.env.NEXT_PUBLIC_STRIPE_PRICE_AUTOMATE_ANNUAL ?? '',
  FULL_PLATFORM_MONTHLY:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_PLATFORM_MONTHLY ?? '',
  FULL_PLATFORM_ANNUAL:
    process.env.NEXT_PUBLIC_STRIPE_PRICE_FULL_PLATFORM_ANNUAL ?? '',
} as const;

export type PriceIdKey = keyof typeof PRICE_IDS;

/**
 * Map a Stripe price ID to the SmartCOI plan name. Because price IDs are
 * env-driven, the map is constructed at call time rather than at module load
 * so that tests and local dev can override env vars between imports.
 */
export function planForPriceId(priceId: string): Plan | null {
  if (!priceId) return null;
  const map: Record<string, Plan> = {
    [PRICE_IDS.MONITOR_MONTHLY]: 'monitor',
    [PRICE_IDS.MONITOR_ANNUAL]: 'monitor',
    [PRICE_IDS.AUTOMATE_MONTHLY]: 'automate',
    [PRICE_IDS.AUTOMATE_ANNUAL]: 'automate',
    [PRICE_IDS.FULL_PLATFORM_MONTHLY]: 'full_platform',
    [PRICE_IDS.FULL_PLATFORM_ANNUAL]: 'full_platform',
  };
  // Guard against an unconfigured env var collapsing several entries to "".
  delete map[''];
  return map[priceId] ?? null;
}

/** List of valid configured price IDs, used by the checkout action for validation. */
export function getConfiguredPriceIds(): string[] {
  return Object.values(PRICE_IDS).filter((id): id is string => Boolean(id));
}

// ---------------------------------------------------------------------------
// Legacy plan normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a plan value read from the DB to a modern plan name.
 * - `trial`          → free   (trial users get the same "free report" gating)
 * - `starter`        → monitor
 * - `growth`         → automate
 * - `professional`   → full_platform
 * - Everything else is returned unchanged.
 *
 * This is a READ-ONLY mapping — we never rewrite the DB value. Legacy orgs
 * keep their old plan string until the next subscription event updates it
 * naturally via the Stripe webhook.
 */
export function normalizePlan(plan: string | null | undefined): Plan {
  switch (plan) {
    case 'starter':
      return 'monitor';
    case 'growth':
      return 'automate';
    case 'professional':
      return 'full_platform';
    case 'trial':
      return 'trial';
    case 'canceled':
      return 'canceled';
    case 'free':
    case 'monitor':
    case 'automate':
    case 'full_platform':
      return plan;
    default:
      return 'free';
  }
}
