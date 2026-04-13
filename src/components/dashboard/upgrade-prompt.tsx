'use client';

import Link from 'next/link';
import { Check, Sparkles } from 'lucide-react';
import type { UpgradePromptCopy } from '@/lib/plan-features';

/**
 * Inline upgrade prompt card — rendered when a user tries to access a
 * feature above their plan.
 *
 * Used both as a full-page replacement (dashboard gate for Free users) and
 * as an inline block inside feature pages (e.g., "Lease extraction is part
 * of Automate").
 */
export function UpgradePrompt({
  copy,
  variant = 'card',
}: {
  copy: UpgradePromptCopy;
  variant?: 'card' | 'page';
}) {
  const isPage = variant === 'page';

  return (
    <div
      className={
        isPage
          ? 'flex min-h-[60vh] items-center justify-center px-6 py-12'
          : 'px-6 py-8'
      }
    >
      <div className="w-full max-w-xl">
        <div className="rounded-2xl border border-[#D1FADF] bg-white p-8 shadow-[0_8px_30px_-8px_rgba(115,226,167,0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8FAF0]">
              <Sparkles className="h-4 w-4 text-[#065F46]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#065F46]">
              {copy.targetPlanLabel} tier
            </span>
          </div>

          <h2 className="mt-5 text-2xl font-bold text-slate-900">{copy.title}</h2>
          <p className="mt-3 text-[15px] leading-relaxed text-slate-600">
            {copy.description}
          </p>

          <ul className="mt-6 space-y-2.5 text-sm text-slate-700">
            {copy.valueBullets.map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#4CC78A]"
                  strokeWidth={2.5}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-7 flex flex-col gap-2.5 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#73E2A7] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4CC78A]"
            >
              {copy.ctaLabel}
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
            >
              Compare plans
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Full-page dashboard gate for Free users
// ---------------------------------------------------------------------------

/**
 * A Free-tier user lands on any /dashboard route — show this full-page
 * upgrade prompt that explains Monitor, lets them jump to billing, or view
 * their existing free report.
 */
export function FreeTierDashboardGate({ reportId }: { reportId?: string | null }) {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-6 py-12">
      <div className="w-full max-w-2xl">
        <div className="rounded-2xl border border-[#D1FADF] bg-white p-10 shadow-[0_8px_30px_-8px_rgba(115,226,167,0.25)]">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#E8FAF0]">
              <Sparkles className="h-4 w-4 text-[#065F46]" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#065F46]">
              You&apos;re on the Free plan
            </span>
          </div>

          <h1 className="mt-5 text-3xl font-bold text-slate-900">
            Your free report is ready.
            <br />
            Ready to keep compliance on autopilot?
          </h1>
          <p className="mt-4 text-[15px] leading-relaxed text-slate-600">
            Upgrade to <span className="font-semibold text-slate-900">Monitor</span> to
            unlock the full dashboard — continuous compliance tracking, expiration alerts,
            and portfolio health at a glance. Starting at $63/mo billed annually.
          </p>

          <ul className="mt-7 grid gap-2.5 text-sm text-slate-700 sm:grid-cols-2">
            {[
              'Full dashboard & portfolio health',
              'Continuous compliance monitoring',
              'Expiration alerts (60/30/14 days)',
              'Track up to 50 certificates',
              'AI extraction for every upload',
              'Cancel anytime',
            ].map((b) => (
              <li key={b} className="flex items-start gap-2.5">
                <Check
                  className="mt-0.5 h-4 w-4 shrink-0 text-[#4CC78A]"
                  strokeWidth={2.5}
                />
                <span>{b}</span>
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <Link
              href="/dashboard/settings/billing"
              className="inline-flex h-11 items-center justify-center rounded-lg bg-[#73E2A7] px-6 text-sm font-semibold text-white transition-colors hover:bg-[#4CC78A]"
            >
              Upgrade to Monitor
            </Link>
            {reportId && (
              <Link
                href={`/report/${reportId}`}
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-200 bg-white px-6 text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
              >
                View my free report
              </Link>
            )}
          </div>

          <p className="mt-6 text-xs text-slate-400">
            Your data is safe. When you upgrade, it all carries over instantly.
          </p>
        </div>
      </div>
    </div>
  );
}
