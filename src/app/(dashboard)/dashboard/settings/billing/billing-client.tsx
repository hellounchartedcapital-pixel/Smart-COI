'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import {
  CreditCard,
  AlertTriangle,
  Check,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createCheckoutSession, createPortalSession, resetTrial } from '@/lib/actions/billing';
import { PRICE_IDS, normalizePlan, type Plan } from '@/lib/stripe-prices';
import { planLabel } from '@/lib/plan-features';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BillingClientProps {
  plan: string;
  trialEndsAt: string | null;
  hasSubscription: boolean;
  paymentFailed: boolean;
}

type BillingInterval = 'monthly' | 'annual';

interface TierDef {
  key: Plan;
  name: string;
  monthly: number;
  annual: number;
  monthlyPriceId: string;
  annualPriceId: string;
  popular?: boolean;
  features: string[];
}

const TIERS: TierDef[] = [
  {
    key: 'monitor',
    name: 'Monitor',
    monthly: 79,
    annual: 63,
    monthlyPriceId: PRICE_IDS.MONITOR_MONTHLY,
    annualPriceId: PRICE_IDS.MONITOR_ANNUAL,
    features: [
      'Up to 50 certificates monitored',
      'Continuous compliance tracking',
      'Full dashboard & portfolio health',
      'Expiration alerts (60/30/14 days)',
      'AI extraction for every upload',
      'Compliance templates',
    ],
  },
  {
    key: 'automate',
    name: 'Automate',
    monthly: 149,
    annual: 119,
    monthlyPriceId: PRICE_IDS.AUTOMATE_MONTHLY,
    annualPriceId: PRICE_IDS.AUTOMATE_ANNUAL,
    popular: true,
    features: [
      'Up to 150 certificates monitored',
      'Self-service vendor portal',
      'Automated renewal follow-ups',
      'Lease-based requirement extraction',
      'Custom requirement overrides',
      'Everything in Monitor',
    ],
  },
  {
    key: 'full_platform',
    name: 'Full Platform',
    monthly: 249,
    annual: 199,
    monthlyPriceId: PRICE_IDS.FULL_PLATFORM_MONTHLY,
    annualPriceId: PRICE_IDS.FULL_PLATFORM_ANNUAL,
    features: [
      'Unlimited certificates',
      'Custom templates from scratch',
      'Bulk operations & team workflows',
      'Priority support',
      'Compliance audit PDF reports',
      'Everything in Automate',
    ],
  },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BillingClient({
  plan,
  trialEndsAt,
  hasSubscription,
  paymentFailed,
}: BillingClientProps) {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState<string | null>(null);
  const [interval, setInterval] = useState<BillingInterval>('annual');

  const normalized = normalizePlan(plan);
  const isTrialOrCanceled =
    normalized === 'trial' || normalized === 'canceled' || normalized === 'free';
  const showPlanCards = isTrialOrCanceled || !hasSubscription;

  const planDisplayName = planLabel(normalized);

  const trialEndsDate = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const [clientNow, setClientNow] = useState<number | null>(null);
  useEffect(() => { setClientNow(Date.now()); }, []);

  const isTrialExpired = trialEndsAt && clientNow ? clientNow >= new Date(trialEndsAt).getTime() : false;
  const trialDaysRemaining = trialEndsAt && clientNow
    ? Math.max(0, Math.ceil((new Date(trialEndsAt).getTime() - clientNow) / (1000 * 60 * 60 * 24)))
    : null;

  // ---- Handlers ----

  async function handleSubscribe(priceId: string) {
    if (!priceId) {
      toast.error("This tier isn't configured yet — please try again later.");
      return;
    }
    setLoading(priceId);
    try {
      const { url } = await createCheckoutSession(priceId);
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to start checkout');
      setLoading(null);
    }
  }

  async function handleResetTrial() {
    setLoading('reset');
    try {
      const { trialEndsAt: newTrialEnd } = await resetTrial();
      toast.success(`Trial reset! New end date: ${new Date(newTrialEnd).toLocaleDateString()}`);
      window.location.reload();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reset trial');
      setLoading(null);
    }
  }

  async function handleManageSubscription() {
    setLoading('portal');
    try {
      const { url } = await createPortalSession();
      window.location.href = url;
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to open billing portal');
      setLoading(null);
    }
  }

  // Show toasts for success/canceled query params, and auto-start checkout
  // when the user arrives with ?price_id=... (from signup → billing deep link)
  // or with a pending price_id stashed in sessionStorage by the signup flow.
  const autoCheckoutStarted = useRef(false);
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      toast.success('Subscription activated!');
    }
    if (searchParams.get('canceled') === 'true') {
      toast.info('Checkout canceled — no charges were made.');
    }

    if (autoCheckoutStarted.current) return;

    let deepLinkPriceId = searchParams.get('price_id');
    if (!deepLinkPriceId) {
      try {
        deepLinkPriceId = sessionStorage.getItem('smartcoi-pending-price-id');
      } catch {
        deepLinkPriceId = null;
      }
    }

    if (
      deepLinkPriceId &&
      !hasSubscription &&
      normalized !== 'canceled'
    ) {
      autoCheckoutStarted.current = true;
      // Consume the pending price ID so refreshing the billing page doesn't
      // retrigger checkout.
      try {
        sessionStorage.removeItem('smartcoi-pending-price-id');
      } catch {
        // ignore
      }
      handleSubscribe(deepLinkPriceId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const isAnnual = interval === 'annual';

  function priceIdForTier(tier: TierDef): string {
    return isAnnual ? tier.annualPriceId : tier.monthlyPriceId;
  }

  function savingsLabel(tier: TierDef): string | null {
    if (!isAnnual) return null;
    const annualTotal = tier.annual * 12;
    const monthlyTotal = tier.monthly * 12;
    const savings = monthlyTotal - annualTotal;
    return `Save $${savings}/year`;
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your subscription and billing details.
        </p>
      </div>

      {/* Payment failed warning */}
      {paymentFailed && (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-red-600" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">
              Your last payment failed. Please update your payment method to avoid service
              interruption.
            </p>
          </div>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleManageSubscription}
            disabled={loading === 'portal'}
          >
            Update Payment Method
          </Button>
        </div>
      )}

      {/* Current plan card */}
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50">
            <CreditCard className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-semibold text-foreground">Current Plan</h2>
            <p className="mt-1 text-lg font-bold text-foreground">{planDisplayName}</p>
            {normalized === 'trial' && trialEndsDate && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                {isTrialExpired ? 'Expired on' : `${trialDaysRemaining} days remaining — ends`}{' '}
                <span className="font-medium text-foreground">{trialEndsDate}</span>
              </p>
            )}
            {normalized === 'free' && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                You&apos;ve got your free compliance report. Upgrade to Monitor to track
                compliance continuously.
              </p>
            )}
            {normalized === 'canceled' && (
              <p className="mt-0.5 text-sm text-muted-foreground">
                Your subscription has been canceled. Your data is safe — resubscribe anytime.
              </p>
            )}
          </div>
          {hasSubscription && normalized !== 'canceled' && (
            <Button
              variant="outline"
              onClick={handleManageSubscription}
              disabled={loading === 'portal'}
            >
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              {loading === 'portal' ? 'Opening...' : 'Manage Subscription'}
            </Button>
          )}
        </div>
      </div>

      {/* Plan cards — shown on free, trial, canceled, or no subscription */}
      {showPlanCards && (
        <>
          {/* Interval toggle */}
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium transition-colors duration-200 ${!isAnnual ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Monthly
            </span>
            <button
              onClick={() => setInterval((i) => (i === 'monthly' ? 'annual' : 'monthly'))}
              className={`relative inline-flex h-7 w-[52px] flex-shrink-0 cursor-pointer items-center rounded-full transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 ${
                isAnnual ? 'bg-brand' : 'bg-slate-300'
              }`}
              role="switch"
              aria-checked={isAnnual}
              aria-label="Toggle annual billing"
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow-md ring-0 transition-transform duration-300 ${
                  isAnnual ? 'translate-x-[27px]' : 'translate-x-[3px]'
                }`}
              />
            </button>
            <span
              className={`text-sm font-medium transition-colors duration-200 ${isAnnual ? 'text-slate-900' : 'text-slate-400'}`}
            >
              Annual
            </span>
            {isAnnual && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                Save 20%
              </span>
            )}
          </div>

          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map((tier) => {
              const priceId = priceIdForTier(tier);
              const price = isAnnual ? tier.annual : tier.monthly;
              return (
                <PlanCard
                  key={tier.key}
                  name={tier.name}
                  price={`$${price}`}
                  per="/mo"
                  billedLabel={isAnnual ? 'billed annually' : null}
                  savings={savingsLabel(tier)}
                  popular={tier.popular}
                  features={tier.features}
                  isCurrent={normalized === tier.key}
                  configured={Boolean(priceId)}
                  loading={loading === priceId}
                  onSubscribe={() => handleSubscribe(priceId)}
                />
              );
            })}
          </div>

          <p className="text-center text-xs text-muted-foreground">
            Cancel anytime. Annual plans save 20%. Month-to-month available on monthly billing.
          </p>
        </>
      )}

      {/* Debug: Reset Trial (dev only) */}
      {process.env.NODE_ENV !== 'production' && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Debug
          </p>
          <p className="mt-1 text-xs text-slate-500">
            plan: <code className="font-mono text-slate-700">{plan}</code>{' '}
            &middot; normalized:{' '}
            <code className="font-mono text-slate-700">{normalized}</code>{' '}
            &middot; trial_ends_at:{' '}
            <code className="font-mono text-slate-700">{trialEndsAt ?? 'null'}</code>
          </p>
          <button
            onClick={handleResetTrial}
            disabled={loading === 'reset'}
            className="mt-2 rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-100 disabled:opacity-50"
          >
            {loading === 'reset' ? 'Resetting...' : 'Reset Trial (14 days)'}
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// PlanCard
// ---------------------------------------------------------------------------

function PlanCard({
  name,
  price,
  per,
  billedLabel,
  savings,
  features,
  popular,
  isCurrent,
  configured,
  loading,
  onSubscribe,
}: {
  name: string;
  price: string;
  per: string;
  billedLabel?: string | null;
  savings?: string | null;
  features: string[];
  popular?: boolean;
  isCurrent: boolean;
  configured: boolean;
  loading: boolean;
  onSubscribe: () => void;
}) {
  return (
    <div
      className={`relative flex flex-col rounded-xl border p-6 ${
        popular
          ? 'border-brand shadow-lg shadow-brand/10'
          : 'border-slate-200'
      } bg-white`}
    >
      {popular && (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-brand-dark px-3 py-0.5 text-xs font-bold text-white">
          Most Popular
        </span>
      )}

      <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">{name}</p>
      <div className="mt-2 flex items-baseline gap-1">
        <span className="text-4xl font-black tracking-tight text-slate-950 transition-all duration-300">{price}</span>
        <span className="text-sm text-slate-500">{per}</span>
      </div>
      {(billedLabel || savings) && (
        <div className="mt-1 flex flex-wrap items-center gap-2">
          {billedLabel && (
            <span className="text-xs text-slate-500">{billedLabel}</span>
          )}
          {savings && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {savings}
            </span>
          )}
        </div>
      )}

      <ul className="mt-6 flex-1 space-y-3">
        {features.map((feat) => (
          <li key={feat} className="flex items-start gap-2.5 text-sm text-slate-600">
            <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
            {feat}
          </li>
        ))}
      </ul>

      {isCurrent ? (
        <div className="mt-6 flex h-10 w-full items-center justify-center rounded-lg border border-emerald-200 bg-emerald-50 text-sm font-medium text-emerald-700">
          Current Plan
        </div>
      ) : (
        <button
          onClick={onSubscribe}
          disabled={loading || !configured}
          className={`mt-6 flex h-10 w-full items-center justify-center rounded-lg text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            popular
              ? 'bg-brand-dark text-white shadow-sm hover:bg-[#3BB87A]'
              : 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
          }`}
        >
          {loading ? (
            <Sparkles className="h-4 w-4 animate-pulse" />
          ) : !configured ? (
            'Coming Soon'
          ) : (
            'Subscribe'
          )}
        </button>
      )}
    </div>
  );
}
