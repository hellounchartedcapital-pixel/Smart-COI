'use client';

import { Check, Minus } from 'lucide-react';

const COMPARISONS = [
  {
    feature: 'Setup time',
    smartcoi: 'Under 10 minutes',
    typical: '2-4 week implementation',
  },
  {
    feature: 'Time to first compliance result',
    smartcoi: 'Seconds (AI extraction)',
    typical: '24-48 hours (manual review queue)',
  },
  {
    feature: 'Pricing',
    smartcoi: 'Flat rate from $79/mo',
    typical: 'Per-vendor pricing ($6-80/vendor/year)',
  },
  {
    feature: 'Free trial',
    smartcoi: '14 days, no credit card',
    typical: '"Schedule a demo"',
  },
  {
    feature: 'Vendor/entity portal fees',
    smartcoi: 'Free, no login required',
    typical: 'Often charges vendors to upload',
  },
  {
    feature: 'All features included',
    smartcoi: 'Every plan',
    typical: 'Gated behind premium tiers',
  },
  {
    feature: 'Contract required',
    smartcoi: 'Month-to-month available',
    typical: 'Annual contracts typical',
  },
];

export function ComparisonTable() {
  return (
    <section className="bg-[#FAFAFA] py-24 sm:py-32">
      <div className="mx-auto max-w-[1200px] px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
            Why teams switch to SmartCOI
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
            Simple pricing, instant results, no long-term contracts.
          </p>
        </div>

        {/* Desktop table */}
        <div className="mt-16 hidden md:block">
          <div className="overflow-hidden rounded-xl border border-[#E5E7EB] bg-white">
            {/* Header */}
            <div className="grid grid-cols-[1fr_1fr_1fr] border-b border-[#E5E7EB]">
              <div className="p-5" />
              <div className="border-l border-[#E5E7EB] bg-[#E8FAF0] p-5 text-center">
                <span className="text-sm font-bold text-[#065F46]">SmartCOI</span>
              </div>
              <div className="border-l border-[#E5E7EB] bg-[#F9FAFB] p-5 text-center">
                <span className="text-sm font-medium text-[#6B7280]">Typical COI Platform</span>
              </div>
            </div>

            {/* Rows */}
            {COMPARISONS.map((row, i) => (
              <div
                key={row.feature}
                className={`grid grid-cols-[1fr_1fr_1fr] ${
                  i < COMPARISONS.length - 1 ? 'border-b border-[#F3F4F6]' : ''
                }`}
              >
                <div className="flex items-center p-5">
                  <span className="text-sm font-medium text-[#374151]">{row.feature}</span>
                </div>
                <div className="flex items-center gap-2.5 border-l border-[#F3F4F6] bg-[#FAFFF5] p-5">
                  <Check className="h-4 w-4 shrink-0 text-[#73E2A7]" />
                  <span className="text-sm text-[#111827]">{row.smartcoi}</span>
                </div>
                <div className="flex items-center gap-2.5 border-l border-[#F3F4F6] p-5">
                  <Minus className="h-4 w-4 shrink-0 text-[#D1D5DB]" />
                  <span className="text-sm text-[#6B7280]">{row.typical}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Mobile stacked cards */}
        <div className="mt-16 space-y-4 md:hidden">
          {COMPARISONS.map((row) => (
            <div
              key={row.feature}
              className="rounded-xl border border-[#E5E7EB] bg-white p-5"
            >
              <p className="text-sm font-medium text-[#374151]">{row.feature}</p>
              <div className="mt-3 flex items-start gap-2.5">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#73E2A7]" />
                <div>
                  <span className="text-xs font-medium text-[#065F46]">SmartCOI</span>
                  <p className="text-sm text-[#111827]">{row.smartcoi}</p>
                </div>
              </div>
              <div className="mt-2.5 flex items-start gap-2.5">
                <Minus className="mt-0.5 h-4 w-4 shrink-0 text-[#D1D5DB]" />
                <div>
                  <span className="text-xs font-medium text-[#9CA3AF]">Typical Platform</span>
                  <p className="text-sm text-[#6B7280]">{row.typical}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
