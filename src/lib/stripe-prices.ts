// ---------------------------------------------------------------------------
// Stripe price ID constants — safe to import from both client and server code.
// Separated from stripe.ts to avoid bundling the stripe SDK in client bundles.
// ---------------------------------------------------------------------------

export const PRICE_IDS = {
  STARTER_MONTHLY: 'price_1T2eRbRh0kGUpK61cWh96vX9',
  STARTER_ANNUAL: 'price_1T2eSgRh0kGUpK61aZXysIVl',
  // TODO: Replace placeholders with real Stripe price IDs after creating Growth products
  GROWTH_MONTHLY: 'price_growth_monthly_placeholder',
  GROWTH_ANNUAL: 'price_growth_annual_placeholder',
  PROFESSIONAL_MONTHLY: 'price_1T2eTCRh0kGUpK61eMGPwWC0',
  PROFESSIONAL_ANNUAL: 'price_1T2eTbRh0kGUpK61wNBir2OT',
} as const;

export type PriceId = (typeof PRICE_IDS)[keyof typeof PRICE_IDS];

const priceIdToPlan: Record<string, string> = {
  [PRICE_IDS.STARTER_MONTHLY]: 'starter',
  [PRICE_IDS.STARTER_ANNUAL]: 'starter',
  [PRICE_IDS.GROWTH_MONTHLY]: 'growth',
  [PRICE_IDS.GROWTH_ANNUAL]: 'growth',
  [PRICE_IDS.PROFESSIONAL_MONTHLY]: 'professional',
  [PRICE_IDS.PROFESSIONAL_ANNUAL]: 'professional',
};

/** Map a Stripe price ID to a SmartCOI plan name. Returns null for unknown prices. */
export function planForPriceId(priceId: string): string | null {
  return priceIdToPlan[priceId] ?? null;
}
