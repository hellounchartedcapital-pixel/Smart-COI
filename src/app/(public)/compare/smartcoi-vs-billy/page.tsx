import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs Billy: COI Tracking Comparison',
  description:
    'Billy is built for general contractors with deep Procore integration. SmartCOI is built for property managers with CRE-specific compliance. See the full comparison.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-billy',
  },
  openGraph: {
    title: 'SmartCOI vs Billy: COI Tracking Comparison',
    description:
      'Billy is built for general contractors with deep Procore integration. SmartCOI is built for property managers with CRE-specific compliance. See the full comparison.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-billy',
  },
};

export default function SmartCOIvsBillyPage() {
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
            SmartCOI vs Billy
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            Billy is a COI tracking platform built for the construction industry, with deep
            Procore integration and workflows designed for general contractors managing
            subcontractor compliance. SmartCOI is purpose-built for commercial property
            managers. These are genuinely different products for different use cases.
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">Billy</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Built for', smart: 'Property managers (CRE)', comp: 'General contractors (construction)' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'No public pricing' },
                  { feature: 'Procore integration', smart: 'Not available', comp: 'Deep, native integration' },
                  { feature: 'Compliance focus', smart: 'Vendor & tenant COI compliance for CRE', comp: 'Subcontractor compliance for construction' },
                  { feature: 'Setup', smart: 'Self-serve, minutes', comp: 'Demo + onboarding' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Tenant tracking', smart: 'Built-in tenant compliance', comp: 'Not applicable (construction focus)' },
                  { feature: 'Property management', smart: 'Multi-property dashboard', comp: 'Project-based structure' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Subcontractor portal' },
                  { feature: 'Bulk upload', smart: '50 COIs at once, instant AI extraction', comp: 'Workflow-based collection' },
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
              <strong className="text-slate-950">Built specifically for property managers.</strong> SmartCOI
              is designed for property management workflows: tracking vendor and tenant COIs across
              properties, managing compliance templates for CRE requirements, and handling the specific
              coverage types property managers need. Billy is designed for GCs managing subcontractors
              on construction projects — a fundamentally different workflow.
            </p>
            <p>
              <strong className="text-slate-950">Tenant compliance tracking.</strong> Property managers
              need to track tenant insurance alongside vendor insurance. SmartCOI has built-in tenant
              compliance with its own templates and workflows. Billy doesn&apos;t address tenant
              insurance because construction GCs don&apos;t have tenants.
            </p>
            <p>
              <strong className="text-slate-950">Property-centric organization.</strong> SmartCOI
              organizes compliance by property, which is how property managers think about their
              portfolio. Billy uses a project-based structure designed for construction jobs.
            </p>
            <p>
              <strong className="text-slate-950">Self-serve with transparent pricing.</strong> Sign up
              at $79/mo, upload your COIs, and you&apos;re running. No demo required, no sales process,
              no implementation period.
            </p>
            <p>
              <strong className="text-slate-950">CRE-specific compliance templates.</strong> Default
              templates are pre-configured for the coverage types and limits property managers typically
              require — general liability, workers&apos; comp, commercial auto, and umbrella for vendors,
              plus renters insurance and liability for tenants.
            </p>
          </div>
        </section>

        {/* Billy Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where Billy Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Deep Procore integration.</strong> Billy has a native
              integration with Procore, the dominant construction project management platform. If your
              organization runs on Procore, Billy&apos;s integration means COI data flows directly
              into your existing project workflows.
            </p>
            <p>
              <strong className="text-slate-950">Construction-specific workflows.</strong> Billy
              understands construction compliance — bid phase requirements, project-specific insurance
              thresholds, subcontractor tiers, and the unique regulatory requirements of construction
              projects.
            </p>
            <p>
              <strong className="text-slate-950">GC-oriented features.</strong> Features like
              subcontractor prequalification, project-level compliance views, and construction-specific
              coverage requirements are purpose-built for general contractors.
            </p>
            <p>
              <strong className="text-slate-950">Construction industry expertise.</strong> Billy&apos;s
              team and product are focused exclusively on construction compliance, which means deeper
              domain knowledge for that specific industry.
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
              <strong className="text-slate-950">Choose SmartCOI</strong> if you&apos;re a commercial
              property manager tracking vendor and tenant insurance compliance across your portfolio.
              SmartCOI is built for your workflow, not adapted from a construction tool.
            </p>
            <p>
              <strong className="text-slate-950">Choose Billy</strong> if you&apos;re a general
              contractor or construction firm managing subcontractor compliance, especially if you
              use Procore as your project management platform.
            </p>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-6 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14 sm:px-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Try SmartCOI Free for 14 Days
            </h2>
            <p className="mt-4 text-slate-400">
              Built for property managers, not general contractors. See the difference.
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
