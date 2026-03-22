import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs PINS: COI Tracking Comparison',
  description:
    'PINS serves property management as one of six verticals with volume-based pricing. SmartCOI is built exclusively for property managers. See the full comparison.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-pins',
  },
  openGraph: {
    title: 'SmartCOI vs PINS: COI Tracking Comparison',
    description:
      'PINS serves property management as one of six verticals with volume-based pricing. SmartCOI is built exclusively for property managers. See the full comparison.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-pins',
  },
};

export default function SmartCOIvsPINSPage() {
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
            SmartCOI vs PINS
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            PINS (PINS Advantage) is a compliance management platform that serves property management
            as one of six industry verticals alongside construction, transportation, healthcare,
            energy, and manufacturing. SmartCOI is built exclusively for commercial property managers.
            Here&apos;s what that difference means in practice.
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">PINS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Industry focus', smart: 'Exclusively property management', comp: 'Six verticals (PM is one)' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'Volume-based, contact required' },
                  { feature: 'Setup', smart: 'Self-serve, minutes', comp: 'Implementation + onboarding' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Data extraction', smart: 'AI-powered, instant results', comp: 'Automated processing' },
                  { feature: 'Procore integration', smart: 'Not available', comp: 'Available' },
                  { feature: 'Compliance templates', smart: 'CRE-specific defaults', comp: 'Multi-industry templates' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Available' },
                  { feature: 'Bulk upload', smart: '50 COIs at once', comp: 'Batch processing' },
                  { feature: 'Target market', smart: 'Mid-market property managers', comp: 'Enterprises across six industries' },
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
              <strong className="text-slate-950">100% focused on property management.</strong> SmartCOI
              doesn&apos;t serve construction, transportation, healthcare, energy, or manufacturing. Every
              product decision, feature, and default is optimized for property managers tracking vendor
              and tenant COI compliance. PINS serves property management as one of six verticals, which
              means the product has to balance needs across all of them.
            </p>
            <p>
              <strong className="text-slate-950">Simple, predictable pricing.</strong> Three published
              tiers based on certificate volume — $79, $149, $249. No volume-based pricing that changes
              as you grow, no custom quotes, no sales conversations. You know what you&apos;ll pay
              before you sign up.
            </p>
            <p>
              <strong className="text-slate-950">Self-serve from sign-up to compliance.</strong> Create
              an account, upload your COIs, and see compliance results in minutes. No demo, no
              implementation period, no training sessions.
            </p>
            <p>
              <strong className="text-slate-950">CRE-native compliance logic.</strong> Templates,
              coverage requirements, and vendor categories reflect how property managers actually
              think about insurance compliance — not how construction GCs or healthcare administrators
              do.
            </p>
            <p>
              <strong className="text-slate-950">Tenant compliance built in.</strong> Property managers
              need to track tenant insurance requirements alongside vendor COIs. SmartCOI handles both
              natively.
            </p>
          </div>
        </section>

        {/* PINS Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where PINS Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Multi-industry platform.</strong> If your organization
              manages compliance across property management, construction, and other verticals, PINS
              offers a single platform that covers all of them. That consolidation can be valuable for
              diversified companies.
            </p>
            <p>
              <strong className="text-slate-950">Procore integration.</strong> PINS integrates with
              Procore, which is valuable for organizations that have both construction and property
              management operations running on Procore.
            </p>
            <p>
              <strong className="text-slate-950">Established industry presence.</strong> PINS has been
              serving multiple industries for years, with a track record and established processes
              across their six verticals.
            </p>
            <p>
              <strong className="text-slate-950">Volume-based pricing at scale.</strong> For very large
              organizations processing thousands of certificates, PINS&apos;s volume-based pricing
              model may offer better per-certificate economics at high volume.
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
              management firm that wants a tool built exclusively for your industry. No features
              designed for construction GCs or healthcare administrators — just CRE compliance
              tracking that works in minutes.
            </p>
            <p>
              <strong className="text-slate-950">Choose PINS</strong> if you&apos;re a large,
              diversified organization that needs compliance management across multiple industries
              and values having a single platform for all verticals.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/for/multifamily" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI for Multifamily Properties
            </Link>
            <Link href="/blog/how-to-set-insurance-requirements-commercial-real-estate" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              How to Set Insurance Requirements
            </Link>
            <Link href="/compare/smartcoi-vs-smartcompliance" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs SmartCompliance
            </Link>
            <Link href="/features/coi-tracking" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI COI Tracking Features
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
              Purpose-built for property managers. No compromise, no complexity.
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
