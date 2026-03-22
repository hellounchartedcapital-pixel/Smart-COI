import Link from 'next/link';

export function BlogCTA() {
  return (
    <div className="not-prose my-10 rounded-xl border border-emerald-200 bg-emerald-50/60 px-6 py-6 sm:px-8">
      <p className="text-base font-semibold text-slate-900">
        Tired of tracking COIs manually?
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-slate-600">
        SmartCOI automates certificate collection, AI extraction, and compliance
        checks across your entire portfolio. Start your 14-day free trial — no
        credit card required.
      </p>
      <Link
        href="/signup"
        className="mt-4 inline-flex h-9 items-center rounded-lg bg-[#4CC78A] px-5 text-sm font-semibold text-white transition-colors hover:bg-[#3BB87A]"
      >
        Try SmartCOI Free
      </Link>
    </div>
  );
}
