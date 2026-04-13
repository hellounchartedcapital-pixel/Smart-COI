'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Check } from 'lucide-react';

interface Plan {
  name: string;
  tagline: string;
  monthly: number;
  annual: number;
  isFree?: boolean;
  highlight?: boolean;
  highlightLabel?: string;
  ctaLabel: string;
  features: string[];
}

const PLANS: Plan[] = [
  {
    name: 'Free',
    tagline: 'Your first compliance report',
    monthly: 0,
    annual: 0,
    isFree: true,
    ctaLabel: 'Upload Your COIs Free',
    features: [
      'One full compliance report',
      'Upload unlimited COIs',
      'AI extraction & vendor type inference',
      'Full report with gaps, exposure & action items',
      'PDF export',
      'No credit card required',
    ],
  },
  {
    name: 'Monitor',
    tagline: 'Continuous compliance tracking',
    monthly: 79,
    annual: 63,
    highlight: true,
    highlightLabel: 'Most Popular',
    ctaLabel: 'Start Monitoring',
    features: [
      'Up to 50 certificates monitored',
      'Continuous compliance tracking',
      'Expiration alerts (60/30/14 days)',
      'Dashboard & portfolio health',
      'Self-service vendor portal',
      'Everything in Free',
    ],
  },
  {
    name: 'Automate',
    tagline: 'Hands-off renewal workflow',
    monthly: 149,
    annual: 119,
    ctaLabel: 'Start Automating',
    features: [
      'Up to 150 certificates monitored',
      'Automated renewal requests',
      'Bulk operations & templates',
      'Custom requirement templates',
      'Lease-based requirement extraction',
      'Everything in Monitor',
    ],
  },
  {
    name: 'Full Platform',
    tagline: 'Unlimited + priority support',
    monthly: 249,
    annual: 199,
    ctaLabel: 'Get Full Access',
    features: [
      'Unlimited certificates',
      'Priority support',
      'Advanced analytics & exports',
      'Compliance audit PDF reports',
      'Risk quantification engine',
      'Everything in Automate',
    ],
  },
];

export function PricingTiers() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('annual');

  return (
    <section className="bg-[#FAFAFA] py-24 sm:py-32" id="pricing">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-[#D1FADF] bg-[#E8FAF0] px-4 py-1.5 text-xs font-semibold text-[#065F46]">
            Your first report is free — no limits, no credit card
          </div>
          <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
            Start free. Upgrade when you&apos;re ready to monitor.
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
            Manual compliance tracking costs ~15 hours/month and leaves gaps. SmartCOI does it in
            minutes.
          </p>

          {/* Billing toggle */}
          <div className="mt-8 inline-flex items-center rounded-full border border-[#E5E7EB] bg-white p-1">
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                billing === 'monthly' ? 'bg-[#111827] text-white' : 'text-[#6B7280]'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBilling('annual')}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                billing === 'annual' ? 'bg-[#111827] text-white' : 'text-[#6B7280]'
              }`}
            >
              Annual
              <span
                className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                  billing === 'annual'
                    ? 'bg-[#73E2A7] text-[#065F46]'
                    : 'bg-[#E8FAF0] text-[#065F46]'
                }`}
              >
                -20%
              </span>
            </button>
          </div>
        </div>

        {/* Plans grid */}
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => {
            const price = billing === 'annual' ? plan.annual : plan.monthly;
            return (
              <div
                key={plan.name}
                className={`relative flex flex-col rounded-2xl border bg-white p-6 ${
                  plan.highlight
                    ? 'border-[#73E2A7] shadow-[0_8px_30px_-8px_rgba(115,226,167,0.35)] ring-1 ring-[#73E2A7]'
                    : 'border-[#E5E7EB]'
                }`}
              >
                {plan.highlight && plan.highlightLabel && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center rounded-full bg-[#73E2A7] px-3 py-1 text-[11px] font-semibold text-[#065F46]">
                      {plan.highlightLabel}
                    </span>
                  </div>
                )}

                <div>
                  <h3 className="text-lg font-bold text-[#111827]">{plan.name}</h3>
                  <p className="mt-1 text-xs text-[#6B7280]">{plan.tagline}</p>
                </div>

                <div className="mt-5">
                  {plan.isFree ? (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-[#111827]">$0</span>
                      </div>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        One-time report · no card required
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold text-[#111827]">${price}</span>
                        <span className="text-sm text-[#6B7280]">/mo</span>
                      </div>
                      <p className="mt-1 text-xs text-[#9CA3AF]">
                        {billing === 'annual'
                          ? `Billed annually · $${plan.monthly}/mo monthly`
                          : `Billed monthly · save 20% with annual`}
                      </p>
                    </>
                  )}
                </div>

                <ul className="mt-6 flex-1 space-y-2.5 text-sm text-[#374151]">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-[#73E2A7]"
                        strokeWidth={2.5}
                      />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  href="/signup"
                  className={`mt-6 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                    plan.highlight
                      ? 'bg-[#73E2A7] text-white hover:bg-[#4CC78A]'
                      : plan.isFree
                        ? 'bg-[#111827] text-white hover:bg-[#1F2937]'
                        : 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                  }`}
                >
                  {plan.ctaLabel}
                </Link>
              </div>
            );
          })}
        </div>

        <p className="mx-auto mt-10 max-w-xl text-center text-xs text-[#9CA3AF]">
          All paid plans include every feature. Cancel anytime. Month-to-month available on monthly
          billing.
        </p>
      </div>
    </section>
  );
}
