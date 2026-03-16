import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs TrustLayer: COI Tracking Comparison',
  description:
    'TrustLayer targets enterprises with 50+ vendors and requires a demo. SmartCOI offers self-serve onboarding and transparent pricing from $79/mo. See the full comparison.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-trustlayer',
  },
  openGraph: {
    title: 'SmartCOI vs TrustLayer: COI Tracking Comparison',
    description:
      'TrustLayer targets enterprises with 50+ vendors and requires a demo. SmartCOI offers self-serve onboarding and transparent pricing from $79/mo. See the full comparison.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-trustlayer',
  },
};

export default function SmartCOIvsTrustLayerPage() {
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
            SmartCOI vs TrustLayer
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            TrustLayer is a well-funded compliance verification platform serving enterprises across
            construction, real estate, logistics, and other industries. They emphasize real-time
            verification and broad industry coverage. SmartCOI is purpose-built for mid-market
            property managers who want to get started without a sales call. Here&apos;s an honest
            breakdown.
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">TrustLayer</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'No public pricing, demo required' },
                  { feature: 'Setup', smart: 'Self-serve, minutes', comp: 'Demo + implementation period' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Target market', smart: 'Mid-market property managers', comp: 'Enterprise, 50+ vendor companies' },
                  { feature: 'Industry focus', smart: 'Commercial real estate', comp: 'Multi-industry (construction, logistics, CRE)' },
                  { feature: 'Data extraction', smart: 'AI-powered, seconds', comp: 'Automated verification engine' },
                  { feature: 'Bulk upload', smart: '50 COIs at once, instant results', comp: 'Workflow-based onboarding' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Available with automated reminders' },
                  { feature: 'Compliance templates', smart: 'CRE-specific defaults', comp: 'Customizable across industries' },
                  { feature: 'Sales process', smart: 'None — sign up and start', comp: 'Required demo with sales team' },
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
              <strong className="text-slate-950">Self-serve from day one.</strong> SmartCOI lets you
              sign up, upload COIs, and get compliance results in minutes — no demo, no sales call,
              no waiting for an implementation team. TrustLayer requires a demo and sales conversation
              before you can access the product.
            </p>
            <p>
              <strong className="text-slate-950">Transparent pricing you can budget for.</strong> SmartCOI
              publishes three clear tiers: $79, $149, and $249 per month. You know what you&apos;ll pay
              before you create an account. TrustLayer does not publish pricing — you&apos;ll need to go
              through a sales process to learn the cost.
            </p>
            <p>
              <strong className="text-slate-950">Purpose-built for property managers.</strong> Every
              feature in SmartCOI — from compliance templates to vendor categorization to tenant tracking —
              is designed specifically for commercial real estate workflows. TrustLayer serves construction,
              logistics, facility management, and real estate, meaning the product is built to generalize
              across industries rather than optimize for one.
            </p>
            <p>
              <strong className="text-slate-950">Right-sized for mid-market firms.</strong> SmartCOI
              works whether you manage 5 properties or 50. TrustLayer targets organizations with 50+
              vendor companies, which can make their platform and pricing overkill for smaller property
              management firms.
            </p>
            <p>
              <strong className="text-slate-950">Instant AI extraction at scale.</strong> Upload 50
              certificates at once and get a fully populated compliance dashboard in minutes. No waiting
              for workflows to process or vendors to respond through a portal.
            </p>
          </div>
        </section>

        {/* TrustLayer Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where TrustLayer Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Broad industry coverage.</strong> TrustLayer serves
              construction, logistics, facility management, and real estate. If your organization tracks
              compliance across multiple industries, their generalist approach covers more ground.
            </p>
            <p>
              <strong className="text-slate-950">Real-time verification workflows.</strong> TrustLayer
              emphasizes automated verification with continuous monitoring and real-time status updates.
              Their workflow engine is built for complex, multi-party compliance scenarios.
            </p>
            <p>
              <strong className="text-slate-950">Enterprise-grade features.</strong> For large
              organizations with hundreds of vendors across multiple business units, TrustLayer&apos;s
              enterprise features — advanced reporting, role-based access, and configurable workflows —
              may better suit complex organizational structures.
            </p>
            <p>
              <strong className="text-slate-950">Significant venture backing.</strong> TrustLayer has
              raised substantial funding, which translates into a larger engineering team and faster
              feature development across their platform.
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
              <strong className="text-slate-950">Choose SmartCOI</strong> if you&apos;re a mid-market
              property management firm that wants transparent pricing, instant self-serve setup, and a
              platform designed specifically for CRE compliance. No sales calls, no enterprise complexity.
            </p>
            <p>
              <strong className="text-slate-950">Choose TrustLayer</strong> if you&apos;re a large
              enterprise with 50+ vendor companies across multiple industries, need complex workflow
              automation, and have the budget for a sales-led enterprise solution.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/features/vendor-management" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Vendor Management Features
            </Link>
            <Link href="/blog/vendor-onboarding-checklist-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Vendor Onboarding Checklist
            </Link>
            <Link href="/compare/smartcoi-vs-certificial" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs Certificial
            </Link>
            <Link href="/blog/coi-compliance-guide-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Complete Guide to COI Compliance
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
              No demo required, no sales call, no credit card. Start tracking compliance today.
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
