import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs CertFocus: COI Tracking Comparison',
  description:
    'CertFocus is a managed compliance service with enterprise pricing. SmartCOI offers fully automated AI extraction at self-serve pricing from $79/mo. See the full comparison.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-certfocus',
  },
  openGraph: {
    title: 'SmartCOI vs CertFocus: COI Tracking Comparison',
    description:
      'CertFocus is a managed compliance service with enterprise pricing. SmartCOI offers fully automated AI extraction at self-serve pricing from $79/mo. See the full comparison.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-certfocus',
  },
};

export default function SmartCOIvsCertFocusPage() {
  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 text-center">
          <Link href="/compare" className="text-sm text-slate-500 hover:text-slate-700">
            &larr; All Comparisons
          </Link>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            SmartCOI vs CertFocus
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            CertFocus, part of Vertikal RMS, offers a full-service managed compliance model where
            their team handles certificate collection and review for you. SmartCOI takes a
            different approach: fully automated AI extraction at self-serve pricing. Here&apos;s
            how the two models compare.
          </p>
        </section>

        {/* Comparison Table */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">Feature</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#4CC78A]">SmartCOI</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">CertFocus</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Service model', smart: 'Self-serve software + AI', comp: 'Managed service with human review' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'Enterprise pricing, contact required' },
                  { feature: 'Setup', smart: 'Self-serve, minutes', comp: 'Implementation with dedicated team' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Data extraction', smart: 'AI-powered, instant', comp: 'Human review team' },
                  { feature: 'Speed', smart: 'Seconds per certificate', comp: 'Depends on review queue' },
                  { feature: 'Industry focus', smart: 'Commercial real estate', comp: 'Multi-industry (part of Vertikal RMS)' },
                  { feature: 'Vendor follow-up', smart: 'Automated email notifications', comp: 'Managed by CertFocus team' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Available' },
                  { feature: 'Target market', smart: 'Mid-market property managers', comp: 'Enterprise, managed service buyers' },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="px-6 py-3 font-medium text-slate-950">{row.feature}</td>
                    <td className="px-6 py-3 text-slate-600">{row.smart}</td>
                    <td className="px-6 py-3 text-slate-600">{row.comp}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* SmartCOI Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where SmartCOI Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Instant results, no waiting.</strong> SmartCOI&apos;s
              AI extracts data from certificate PDFs in seconds. Upload 50 COIs and get a compliance
              dashboard immediately. CertFocus uses human reviewers, which means turnaround depends
              on their team&apos;s availability and review queue.
            </p>
            <p>
              <strong className="text-slate-950">Self-serve pricing that makes sense for mid-market.</strong> At
              $79-$249/mo, SmartCOI is priced for independent and mid-market property managers.
              CertFocus&apos;s managed service model comes with enterprise pricing that can be
              difficult to justify for smaller portfolios.
            </p>
            <p>
              <strong className="text-slate-950">You stay in control.</strong> SmartCOI puts the
              tools directly in your hands — you upload, you review, you manage. Some property
              managers prefer controlling their compliance workflow rather than outsourcing it to a
              managed service.
            </p>
            <p>
              <strong className="text-slate-950">No managed service overhead.</strong> Managed services
              require coordination — sharing access, communicating requirements, reviewing their work.
              SmartCOI eliminates that overhead entirely with AI automation you control.
            </p>
            <p>
              <strong className="text-slate-950">Purpose-built for CRE.</strong> SmartCOI&apos;s
              compliance templates, vendor categories, and tenant tracking are designed specifically
              for commercial real estate workflows.
            </p>
          </div>
        </section>

        {/* CertFocus Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where CertFocus Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Hands-off compliance management.</strong> CertFocus&apos;s
              managed service model means their team handles certificate collection, review, and
              follow-up on your behalf. For organizations that want to fully outsource compliance
              operations, this white-glove approach removes the work entirely from your plate.
            </p>
            <p>
              <strong className="text-slate-950">Human review accuracy.</strong> Trained insurance
              professionals review every certificate, which can catch nuances and edge cases that
              automated systems might miss. For organizations where compliance accuracy is
              mission-critical, human review adds a layer of confidence.
            </p>
            <p>
              <strong className="text-slate-950">Part of Vertikal RMS ecosystem.</strong> CertFocus
              is part of the Vertikal RMS family of risk management solutions. For organizations
              already using Vertikal products, CertFocus integrates naturally into that ecosystem.
            </p>
            <p>
              <strong className="text-slate-950">Vendor collection management.</strong> CertFocus
              doesn&apos;t just verify certificates — they actively chase vendors for updated
              documents, handle follow-up communications, and manage the collection process end-to-end.
            </p>
          </div>
        </section>

        {/* Bottom Line */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            The Bottom Line
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Choose SmartCOI</strong> if you want fast, automated
              COI compliance at transparent pricing. SmartCOI is ideal for property managers who want
              control over their compliance workflow without the cost and coordination of a managed
              service.
            </p>
            <p>
              <strong className="text-slate-950">Choose CertFocus</strong> if you want to fully
              outsource compliance management to a team of professionals, have the budget for
              enterprise-level managed services, and prefer a hands-off approach.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/features/coi-tracking" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI COI Tracking Features
            </Link>
            <Link href="/blog/coi-expiration-tracking-best-practices" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              COI Expiration Tracking Best Practices
            </Link>
            <Link href="/compare/smartcoi-vs-jones" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs Jones
            </Link>
            <Link href="/ai-coi-extraction" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              AI COI Extraction
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-6 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14 sm:px-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Try SmartCOI Free for 14 Days
            </h2>
            <p className="mt-4 text-slate-400">
              AI-powered compliance at self-serve pricing. No managed service needed.
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
