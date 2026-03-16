import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'Best myCOI Alternatives for Property Managers (2025)',
  description:
    'Looking for a myCOI alternative? Compare the best COI tracking options for property managers — including simpler setup, transparent pricing, and CRE-specific features.',
  alternates: {
    canonical: 'https://smartcoi.io/alternatives/mycoi',
  },
  openGraph: {
    title: 'Best myCOI Alternatives for Property Managers (2025)',
    description:
      'Looking for a myCOI alternative? Compare the best COI tracking options for property managers — including simpler setup, transparent pricing, and CRE-specific features.',
    type: 'website',
    url: 'https://smartcoi.io/alternatives/mycoi',
  },
};

const alternatives = [
  {
    name: 'SmartCOI',
    badge: 'Best for Property Managers',
    description:
      'Purpose-built for commercial real estate. AI-powered extraction, self-serve onboarding in minutes, and transparent pricing starting at $79/mo. Tracks both vendor and tenant COIs with CRE-specific compliance templates.',
    pros: [
      'Built specifically for property managers',
      'Self-serve setup in minutes, no sales call',
      'Transparent pricing ($79/$149/$249)',
      'AI extraction — upload 50 COIs at once',
      '14-day free trial, no credit card',
    ],
    cons: [
      'No Procore or PMS integrations (yet)',
      'Newer platform without enterprise track record',
    ],
  },
  {
    name: 'Jones',
    badge: 'Best for Enterprise PMS Users',
    description:
      'Strong enterprise platform with deep integrations into property management software like MRI and Yardi. Best for large organizations that need COI data flowing into existing PMS workflows.',
    pros: [
      'Deep PMS integrations (MRI, Yardi)',
      'Enterprise-grade features and reporting',
      'Managed service option available',
    ],
    cons: [
      'Enterprise pricing — not transparent',
      'Sales-led process, longer time to value',
      'Overkill for mid-market firms',
    ],
  },
  {
    name: 'BCS',
    badge: 'Best for Hands-Off Compliance',
    description:
      'Full-service compliance management with human review. BCS collects, reviews, and manages certificates on your behalf. Best for organizations that want to fully outsource compliance operations.',
    pros: [
      'Human review by insurance professionals',
      'Full-service collection and management',
      '20+ year track record',
    ],
    cons: [
      'Slower turnaround (human review queue)',
      'Higher cost — managed service pricing',
      'Less control over your compliance workflow',
    ],
  },
  {
    name: 'CertFocus',
    badge: 'Best for Managed Service',
    description:
      'Part of Vertikal RMS, CertFocus offers a managed compliance model similar to BCS. Their team handles certificate collection, review, and vendor follow-up on your behalf.',
    pros: [
      'Hands-off managed compliance',
      'Vendor collection and follow-up included',
      'Part of larger risk management ecosystem',
    ],
    cons: [
      'Enterprise pricing, no public rates',
      'Turnaround depends on review team capacity',
      'Not CRE-specific — serves multiple industries',
    ],
  },
];

export default function MyCOIAlternativesPage() {
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
            Best myCOI Alternatives for Property Managers
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            myCOI (recently rebranded as illumend) has been in the COI tracking space since 2009.
            But their 200-certificate minimum, opaque pricing, and sales-led process make them a
            tough fit for many mid-market property management firms. If you&apos;ve demoed myCOI
            and found it too complex, too expensive, or simply not right-sized for your needs,
            here are the best alternatives worth evaluating.
          </p>
        </section>

        {/* The Problem with myCOI */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Why Property Managers Look for myCOI Alternatives
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">200-certificate minimum.</strong> myCOI requires a
              minimum of 200 incoming certificates, which immediately eliminates many small and
              mid-market property management firms.
            </p>
            <p>
              <strong className="text-slate-950">Complex, opaque pricing.</strong> myCOI uses
              multi-factor pricing that depends on certificate volume, feature set, and other
              variables. You won&apos;t know the cost until you go through a full sales process.
            </p>
            <p>
              <strong className="text-slate-950">Enterprise-first design.</strong> myCOI serves
              construction, government, utilities, and manufacturing alongside real estate. The
              product is built for enterprise breadth, not CRE depth.
            </p>
            <p>
              <strong className="text-slate-950">Slow time to value.</strong> Between the demo,
              sales negotiation, implementation, and training, it can take weeks or months from
              &quot;I&apos;m interested&quot; to &quot;I&apos;m using the software.&quot;
            </p>
          </div>
        </section>

        {/* Alternatives */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Top myCOI Alternatives Compared
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
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">Jones</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">BCS</th>
                    <th className="px-4 py-4 text-left font-semibold text-slate-950">CertFocus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {[
                    { feature: 'Pricing', a: 'From $79/mo', b: 'Enterprise', c: 'Enterprise', d: 'Enterprise' },
                    { feature: 'Setup', a: 'Self-serve', b: 'Sales-led', c: 'Sales-led', d: 'Sales-led' },
                    { feature: 'Free trial', a: '14 days', b: 'Demo only', c: 'Demo only', d: 'Demo only' },
                    { feature: 'CRE-specific', a: 'Yes', b: 'Partial', c: 'No', d: 'No' },
                    { feature: 'AI extraction', a: 'Yes', b: 'Yes', c: 'OCR + human', d: 'Human review' },
                    { feature: 'Tenant tracking', a: 'Built-in', b: 'Available', c: 'Limited', d: 'Limited' },
                    { feature: 'Minimum requirement', a: 'None', b: 'Varies', c: 'Varies', d: 'Varies' },
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
              If you&apos;re a mid-market property management firm that found myCOI too complex,
              too expensive, or simply not tailored to your CRE workflows,{' '}
              <strong className="text-slate-950">SmartCOI is the most direct alternative</strong>.
              It&apos;s the only platform built exclusively for property managers, with transparent
              pricing and self-serve onboarding.
            </p>
            <p>
              If you need deep PMS integrations (Yardi, MRI), consider{' '}
              <strong className="text-slate-950">Jones</strong>. If you want to fully outsource
              compliance operations, consider{' '}
              <strong className="text-slate-950">BCS</strong> or{' '}
              <strong className="text-slate-950">CertFocus</strong>.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/compare/smartcoi-vs-mycoi" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs myCOI: Detailed Comparison
            </Link>
            <Link href="/features/compliance-automation" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Automated Compliance Checking
            </Link>
            <Link href="/blog/coi-compliance-guide-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Complete Guide to COI Compliance
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
              No 200-certificate minimum. No sales call. No credit card.
              Start tracking compliance in minutes.
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
