'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AnimateIn } from './animate-in';

/* ─── Icons (inline to keep the component self-contained) ─── */

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

/* ─── Types ─── */

type BillingInterval = 'monthly' | 'annual';

/* ─── Component ─── */

export function PricingSection() {
  const [interval, setInterval] = useState<BillingInterval>('annual');
  const isAnnual = interval === 'annual';

  const starterPrice = isAnnual ? 63 : 79;
  const growthPrice = isAnnual ? 119 : 149;
  const proPrice = isAnnual ? 199 : 249;

  return (
    <section
      id="pricing"
      className="scroll-mt-20 border-t border-slate-100 bg-slate-50/50 py-20 sm:py-28"
    >
      <div className="mx-auto max-w-7xl px-6">
        {/* Header */}
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              Pricing
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Simple, Transparent Pricing
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Start small and scale as your portfolio grows. Every plan includes a 14-day
              free trial — no credit card required.
            </p>
          </div>
        </AnimateIn>

        {/* Value anchor */}
        <AnimateIn delay={30}>
          <div className="mx-auto mt-8 max-w-2xl text-center">
            <p className="text-base leading-relaxed text-slate-500 sm:text-[17px]">
              Manual COI tracking costs teams 15–20 hours per month — chasing
              certificates, checking expirations, and following up with vendors. That&apos;s
              over{' '}<span className="font-semibold text-slate-700">$600/month in labor alone</span> — before
              counting the risk of a single uninsured incident that could cost $500,000 or
              more. SmartCOI starts at <span className="font-semibold text-emerald-700">$63/month</span>.
            </p>
          </div>
        </AnimateIn>

        {/* Monthly / Annual toggle */}
        <AnimateIn delay={50}>
          <div className="mt-10 flex items-center justify-center gap-3">
            <span
              className={`text-sm font-medium transition-colors duration-200 ${
                !isAnnual ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Monthly
            </span>

            <button
              onClick={() =>
                setInterval((i) => (i === 'monthly' ? 'annual' : 'monthly'))
              }
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
              className={`text-sm font-medium transition-colors duration-200 ${
                isAnnual ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              Annual
            </span>

            {isAnnual && (
              <span className="ml-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 animate-in fade-in duration-300">
                Save 20%
              </span>
            )}
          </div>
        </AnimateIn>

        {/* Plan cards */}
        <div className="mx-auto mt-10 grid max-w-5xl gap-8 lg:grid-cols-3">
          {/* ── Starter ── */}
          <AnimateIn delay={100}>
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Starter
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  key={starterPrice}
                  className="text-5xl font-black tracking-tight text-slate-950 transition-all duration-300"
                >
                  ${starterPrice}
                </span>
                <span className="text-lg text-slate-500">/mo</span>
              </div>
              {isAnnual && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">billed annually</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Save $192/year
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Up to 50 certificates
              </p>
              <p className="mt-1 text-xs text-slate-400">
                $1.26 per certificate/month
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Ideal for 1–2 properties
              </p>

              <ul className="mt-8 flex-1 space-y-4">
                {[
                  'Unlimited properties',
                  'AI-powered COI extraction',
                  'Compliance templates',
                  'Self-service vendor/tenant portal',
                  'Automated notifications & follow-up',
                  'Real-time dashboard & reporting',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4CC78A]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Start Free Trial
              </Link>
            </div>
          </AnimateIn>

          {/* ── Growth — Most Popular ── */}
          <AnimateIn delay={200}>
            <div className="relative flex h-full flex-col overflow-hidden rounded-2xl border-2 border-brand bg-white p-8 shadow-xl shadow-brand/10 lg:-mt-4 lg:mb-[-1rem]">
              <div className="absolute top-0 right-0 rounded-bl-xl bg-brand-dark px-4 py-1.5 text-xs font-bold text-white">
                Most Popular
              </div>

              <p className="text-sm font-semibold uppercase tracking-wider text-brand-dark">
                Growth
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  key={growthPrice}
                  className="text-5xl font-black tracking-tight text-slate-950 transition-all duration-300"
                >
                  ${growthPrice}
                </span>
                <span className="text-lg text-slate-500">/mo</span>
              </div>
              {isAnnual && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">billed annually</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Save $360/year
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Up to 150 certificates
              </p>
              <p className="mt-1 text-xs text-slate-400">
                $0.79 per certificate/month
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Ideal for 3–5 properties
              </p>

              <ul className="mt-8 flex-1 space-y-4">
                {[
                  'Unlimited properties',
                  'AI-powered COI extraction',
                  'Compliance templates',
                  'Self-service vendor/tenant portal',
                  'Automated notifications & follow-up',
                  'Real-time dashboard & reporting',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4CC78A]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl bg-brand-dark text-sm font-semibold text-white shadow-lg shadow-brand-dark/20 transition-all hover:bg-[#3BB87A] hover:shadow-xl hover:shadow-brand-dark/30"
              >
                Start Free Trial
              </Link>
            </div>
          </AnimateIn>

          {/* ── Professional ── */}
          <AnimateIn delay={300}>
            <div className="flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-lg">
              <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                Professional
              </p>
              <div className="mt-3 flex items-baseline gap-1">
                <span
                  key={proPrice}
                  className="text-5xl font-black tracking-tight text-slate-950 transition-all duration-300"
                >
                  ${proPrice}
                </span>
                <span className="text-lg text-slate-500">/mo</span>
              </div>
              {isAnnual && (
                <div className="mt-1.5 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-slate-500">billed annually</span>
                  <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
                    Save $600/year
                  </span>
                </div>
              )}
              <p className="mt-2 text-sm text-slate-500">
                Unlimited certificates + priority support
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Unlimited — best value at scale
              </p>
              <p className="mt-1 text-xs font-medium text-slate-400">
                Ideal for 6+ properties or growing portfolios
              </p>

              <ul className="mt-8 flex-1 space-y-4">
                {[
                  'Unlimited properties',
                  'AI-powered COI extraction',
                  'Compliance templates',
                  'Self-service vendor/tenant portal',
                  'Automated notifications & follow-up',
                  'Real-time dashboard & reporting',
                  'Priority support',
                ].map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-3 text-sm text-slate-600"
                  >
                    <IconCheck className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4CC78A]" />
                    {item}
                  </li>
                ))}
              </ul>

              <Link
                href="/signup"
                className="mt-8 flex h-12 w-full items-center justify-center rounded-xl border border-slate-200 bg-white text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Start Free Trial
              </Link>
            </div>
          </AnimateIn>
        </div>

        {/* Early adopter note */}
        <AnimateIn delay={380}>
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-2.5">
            <span className="rounded-md bg-emerald-50 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-emerald-600">
              Early Adopter
            </span>
            <span className="text-sm text-slate-400">
              Lock in these rates before our public launch
            </span>
          </div>
        </AnimateIn>

        {/* Footer notes */}
        <div className="mt-4 space-y-2 text-center">
          <AnimateIn delay={400}>
            <p className="text-sm text-slate-500">
              All plans include a 14-day free trial. No credit card required.
            </p>
          </AnimateIn>
          <AnimateIn delay={450}>
            <p className="text-sm text-slate-400">
              Need help choosing?{' '}
              <Link
                href="/compare"
                className="text-emerald-600 underline underline-offset-2 hover:text-emerald-700"
              >
                See how SmartCOI compares
              </Link>
            </p>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
