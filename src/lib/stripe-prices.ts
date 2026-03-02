// ---------------------------------------------------------------------------
// Stripe price ID constants — safe to import from both client and server code.
// Separated from stripe.ts to avoid bundling the stripe SDK in client bundles.
// ---------------------------------------------------------------------------

export const PRICE_IDS = {
  STARTER_MONTHLY: 'price_1T6fqkRh0kGUpK61AOPtMIXZ',
  STARTER_ANNUAL: 'price_1T6fr3Rh0kGUpK61vS2NEQTh',
  GROWTH_MONTHLY: 'price_1T6fpGRh0kGUpK61Mk69npV8',
  GROWTH_ANNUAL: 'price_1T6fphRh0kGUpK61xsDtyXPs',
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
