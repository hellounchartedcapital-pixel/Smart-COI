import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs Certificial: Honest Comparison (2026)',
  description:
    'SmartCOI vs Certificial for COI compliance tracking. Compare pricing, AI extraction, self-serve setup, and which fits mid-market property managers.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-certificial',
  },
  openGraph: {
    title: 'SmartCOI vs Certificial: Honest Comparison (2026)',
    description:
      'SmartCOI vs Certificial for COI compliance tracking. Compare pricing, AI extraction, self-serve setup, and which fits mid-market property managers.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-certificial',
  },
};

export default function SmartCOIvsCertificialPage() {
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
            SmartCOI vs Certificial
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            Certificial takes a different approach to COI compliance — they connect directly to
            insurance carriers for real-time policy verification and fraud detection. SmartCOI
            focuses on AI-powered extraction and compliance tracking built specifically for
            property managers. Here&apos;s how they compare.
          </p>
        </section>

        {/* Above-fold CTA */}
        <section className="mx-auto mt-8 max-w-4xl px-6 text-center">
          <Link
            href="/signup"
            className="inline-flex h-11 items-center rounded-xl bg-[#4CC78A] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3BB87A]"
          >
            Try SmartCOI Free for 14 Days
          </Link>
          <p className="mt-2 text-xs text-slate-400">No credit card required</p>
        </section>

        {/* Comparison Table */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <div className="overflow-hidden rounded-2xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">Feature</th>
                  <th className="px-6 py-4 text-left font-semibold text-[#4CC78A]">SmartCOI</th>
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">Certificial</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Verification method', smart: 'AI extraction from certificate PDFs', comp: 'Real-time carrier integrations' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'No public pricing' },
                  { feature: 'Setup complexity', smart: 'Self-serve, minutes', comp: 'Carrier integration setup required' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Industry focus', smart: 'Commercial real estate', comp: 'Multi-industry' },
                  { feature: 'Fraud detection', smart: 'AI checks for inconsistencies', comp: 'Real-time carrier verification' },
                  { feature: 'Bulk upload', smart: '50 COIs at once, instant results', comp: 'Workflow-based process' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Digital certificate sharing' },
                  { feature: 'Time to compliance', smart: 'Minutes after upload', comp: 'Depends on carrier connections' },
                  { feature: 'Target market', smart: 'Mid-market property managers', comp: 'Enterprises needing carrier-level verification' },
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
              <strong className="text-slate-950">Simpler, faster implementation.</strong> SmartCOI
              works with the COI PDFs you already have. Upload them, and AI extracts everything in
              seconds. Certificial&apos;s carrier integration model requires setup with insurance
              carriers and agents, which adds implementation complexity and time.
            </p>
            <p>
              <strong className="text-slate-950">Works with any certificate immediately.</strong> SmartCOI
              extracts data from any standard ACORD certificate PDF. You don&apos;t need your vendors&apos;
              insurance agents to be connected to a specific platform — just upload the certificate you
              already received.
            </p>
            <p>
              <strong className="text-slate-950">Right-sized for property managers.</strong> Most
              mid-market property managers need to track that vendors and tenants have valid insurance
              with adequate limits. SmartCOI delivers exactly that. Certificial&apos;s carrier-level
              verification is powerful but may be more than most property managers need.
            </p>
            <p>
              <strong className="text-slate-950">Transparent, published pricing.</strong> SmartCOI&apos;s
              pricing is on the website: $79, $149, or $249 per month. No surprise costs, no sales
              conversations required.
            </p>
            <p>
              <strong className="text-slate-950">CRE-specific compliance logic.</strong> Templates,
              vendor categories, and compliance rules are all designed for commercial real estate
              workflows — not generalized across industries.
            </p>
          </div>
        </section>

        {/* Certificial Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where Certificial Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Real-time carrier verification.</strong> Certificial
              connects directly to insurance carriers, meaning policy data is verified at the source.
              This eliminates the possibility of outdated or altered certificates — a level of
              verification that PDF-based extraction cannot match.
            </p>
            <p>
              <strong className="text-slate-950">Strong fraud detection.</strong> Because data comes
              directly from carriers, Certificial can detect fraudulent or altered certificates with
              higher confidence than any PDF-based system.
            </p>
            <p>
              <strong className="text-slate-950">Continuous monitoring.</strong> Certificial can
              automatically detect mid-term policy cancellations and changes because of their
              carrier connections. This provides ongoing compliance assurance beyond point-in-time
              certificate checks.
            </p>
            <p>
              <strong className="text-slate-950">Digital-first certificate sharing.</strong> Their
              platform enables a paperless workflow where insurance data flows digitally between
              carriers, agents, and certificate holders without PDF generation.
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
              <strong className="text-slate-950">Choose SmartCOI</strong> if you&apos;re a property
              manager who needs fast, reliable compliance tracking from the COI PDFs vendors already
              send you. No complex integrations, no waiting for carrier connections — just upload
              and go.
            </p>
            <p>
              <strong className="text-slate-950">Choose Certificial</strong> if you need carrier-level
              real-time verification, fraud detection is a top priority, and you&apos;re willing to
              invest in the implementation complexity of carrier integrations.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/features/compliance-automation" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Automated Compliance Checking
            </Link>
            <Link href="/blog/what-is-additional-insured-commercial-real-estate" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Additional Insured in Commercial Real Estate
            </Link>
            <Link href="/compare/smartcoi-vs-trustlayer" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs TrustLayer
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
              No carrier integrations needed. Upload certificates and get compliance results in minutes.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 shadow-lg shadow-[#73E2A7]/20 transition-all hover:bg-[#4CC78A]"
            >
              Start Your Free Trial
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
