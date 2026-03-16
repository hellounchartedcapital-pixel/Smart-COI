import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Best Jones Alternatives for Property Managers (2025)',
  description:
    'Looking for a Jones alternative? Compare the best COI tracking options for property managers who need simpler setup, transparent pricing, and faster time to value.',
  alternates: {
    canonical: 'https://smartcoi.io/alternatives/jones',
  },
  openGraph: {
    title: 'Best Jones Alternatives for Property Managers (2025)',
    description:
      'Looking for a Jones alternative? Compare the best COI tracking options for property managers who need simpler setup, transparent pricing, and faster time to value.',
    type: 'website',
    url: 'https://smartcoi.io/alternatives/jones',
  },
};

const alternatives = [
  {
    name: 'SmartCOI',
    badge: 'Best for Mid-Market PMs',
    description:
      'Purpose-built for commercial real estate property managers. AI-powered extraction, transparent pricing from $79/mo, and self-serve onboarding. No sales call needed — start tracking compliance in minutes.',
    pros: [
      'Built specifically for property managers',
      'Transparent pricing ($79/$149/$249)',
      'Self-serve setup in minutes',
      'AI-powered bulk upload (50 COIs at once)',
      '14-day free trial, no credit card',
    ],
    cons: [
      'No PMS integrations (Yardi, MRI) yet',
      'Newer platform, smaller customer base',
    ],
  },
  {
    name: 'myCOI (illumend)',
    badge: 'Best for Large Enterprises',
    description:
      'Long-running COI tracking platform with insurance professionals on staff. Strong multi-industry coverage and integration ecosystem. Best for large enterprises with 200+ certificates.',
    pros: [
      '15+ years in the market',
      'Integration ecosystem (Procore, MRI, Sage)',
      'Insurance professionals on staff',
    ],
    cons: [
      '200-certificate minimum',
      'Complex multi-factor pricing',
      'Sales-led process',
    ],
  },
  {
    name: 'TrustLayer',
    badge: 'Best for Automation at Scale',
    description:
      'Modern compliance platform with strong automation and real-time verification. Well-funded and fast-growing. Best for larger organizations that want enterprise-grade automation.',
    pros: [
      'Strong automation engine',
      'Real-time verification workflows',
      'Significant venture backing and growth',
    ],
    cons: [
      'No public pricing, demo required',
      'Targets 50+ vendor companies',
      'Not CRE-specific',
    ],
  },
  {
    name: 'BCS',
    badge: 'Best for Full-Service',
    description:
      'Full-service compliance management with human review. BCS handles collection, review, and follow-up. Best for organizations that want to fully outsource compliance operations.',
    pros: [
      'Human review for accuracy',
      'Full-service certificate management',
      'Long track record (20+ years)',
    ],
    cons: [
      'Higher cost than self-serve options',
      'Slower turnaround time',
      'Less control over the process',
    ],
  },
];

export default function JonesAlternativesPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            Alternatives
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Best Jones Alternatives for Property Managers
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            Jones is a well-known name in COI compliance for commercial real estate. But their
            enterprise pricing, sales-led process, and complex implementation can be a tough fit
            for independent and mid-market property management firms. If you&apos;ve been quoted
            Jones pricing and experienced sticker shock — or simply want a faster path to
            compliance — here are the best alternatives.
          </p>
        </section>

        {/* The Problem with Jones */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Why Property Managers Look for Jones Alternatives
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Enterprise pricing that doesn&apos;t fit mid-market budgets.</strong> Jones
              targets large property management companies and REITs. Their pricing reflects that
              enterprise focus, which can make the platform cost-prohibitive for firms managing
              5-50 properties.
            </p>
            <p>
              <strong className="text-slate-950">Sales-led process slows you down.</strong> You
              can&apos;t sign up and start using Jones today. The process involves demos, proposals,
              and implementation — weeks or months between interest and usage.
            </p>
            <p>
              <strong className="text-slate-950">Implementation complexity.</strong> Jones&apos;s
              deep PMS integrations (MRI, Yardi) are powerful but add implementation time and cost.
              If you don&apos;t use those PMS platforms, you&apos;re paying for integration
              capability you don&apos;t need.
            </p>
            <p>
              <strong className="text-slate-950">Feature overhead.</strong> Jones serves large
              enterprises with complex organizational structures. For a firm managing a dozen
              properties, many of those enterprise features add complexity without value.
            </p>
          </div>
        </section>

        {/* Alternatives */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Top Jones Alternatives Compared
          </h2>
          <div className="mt-8 space-y-6">
            {alternatives.map((alt) => (
              <div key={alt.name} className="rounded-2xl border border-slate-200 bg-white p-8">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <span className="inline-block rounded-full bg-[#73E2A7]/10 px-3 py-1 text-xs font-semibold text-[#4CC78A]">
                      {alt.badge}
                    </span>
                    <h3 className="mt-3 text-xl font-bold text-slate-950">{alt.name}</h3>
                  </div>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{alt.description}</p>
                <div className="mt-6 grid gap-6 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-[#4CC78A]">Pros</p>
                    <ul className="mt-2 space-y-1">
                      {alt.pros.map((pro) => (
                        <li key={pro} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1 text-[#4CC78A]">+</span> {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Cons</p>
                    <ul className="mt-2 space-y-1">
                      {alt.cons.map((con) => (
                        <li key={con} className="flex items-start gap-2 text-sm text-slate-600">
                          <span className="mt-1 text-slate-400">−</span> {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Comparison Table */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Quick Comparison
          </h2>
          <div className="mt-8 overflow-x-auto">
            <div className="overflow-hidden rounded-2xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">Feature</th>
                    <th className="px-4 py-4 text-left font-semibold text-[#4CC78A]">SmartCOI</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">myCOI</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">TrustLayer</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">BCS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feature: 'Pricing', a: 'From $79/mo', b: 'Enterprise', c: 'Enterprise', d: 'Enterprise' },
                    { feature: 'Setup time', a: 'Minutes', b: 'Weeks', c: 'Weeks', d: 'Weeks' },
                    { feature: 'Free trial', a: '14 days', b: 'Demo only', c: 'Demo only', d: 'Demo only' },
                    { feature: 'CRE-specific', a: 'Yes', b: 'Multi-industry', c: 'Multi-industry', d: 'Multi-industry' },
                    { feature: 'AI extraction', a: 'Yes', b: 'AI + human', c: 'Automated', d: 'OCR + human' },
                    { feature: 'PMS integrations', a: 'Not yet', b: 'Procore, MRI', c: 'Various', d: 'Limited' },
                    { feature: 'Minimum', a: 'None', b: '200 certs', c: '50+ vendors', d: 'Varies' },
                  ].map((row) => (
                    <tr key={row.feature}>
                      <td className="px-4 py-3 font-medium text-slate-950">{row.feature}</td>
                      <td className="px-4 py-3 text-slate-600">{row.a}</td>
                      <td className="px-4 py-3 text-slate-600">{row.b}</td>
                      <td className="px-4 py-3 text-slate-600">{row.c}</td>
                      <td className="px-4 py-3 text-slate-600">{row.d}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Verdict */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Our Recommendation
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              If Jones&apos;s pricing and sales process are what drove you to look elsewhere,{' '}
              <strong className="text-slate-950">SmartCOI is the most direct alternative</strong>.
              It&apos;s built for the same CRE use case at a fraction of the cost, with self-serve
              onboarding that gets you compliant in minutes instead of months.
            </p>
            <p>
              If you need Jones-level PMS integrations but want a different vendor, consider{' '}
              <strong className="text-slate-950">myCOI</strong> (though their minimums may be an
              issue). If you want a completely hands-off approach, consider{' '}
              <strong className="text-slate-950">BCS</strong> for full-service managed compliance.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/compare/smartcoi-vs-jones" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs Jones: Detailed Comparison
            </Link>
            <Link href="/features/vendor-management" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Vendor Management Features
            </Link>
            <Link href="/blog/cost-of-not-tracking-vendor-insurance" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Hidden Cost of Skipping Vendor COI Tracking
            </Link>
            <Link href="/compare" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Compare All COI Tracking Solutions
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-6 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14 sm:px-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Try SmartCOI Free
            </h2>
            <p className="mt-4 text-slate-400">
              No enterprise pricing. No sales call. No credit card.
              CRE compliance tracking from $79/mo.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 shadow-lg shadow-[#73E2A7]/20 transition-all hover:bg-[#4CC78A]"
            >
              Upload 50 COIs Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
