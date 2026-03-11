import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs SmartCompliance: COI Tracking Comparison',
  description:
    'SmartCompliance is a broad enterprise compliance platform with weeks-long implementation. SmartCOI is purpose-built for property managers with self-serve onboarding in minutes.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-smartcompliance',
  },
  openGraph: {
    title: 'SmartCOI vs SmartCompliance: COI Tracking Comparison',
    description:
      'SmartCompliance is a broad enterprise compliance platform with weeks-long implementation. SmartCOI is purpose-built for property managers with self-serve onboarding in minutes.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-smartcompliance',
  },
};

export default function SmartCOIvsSmartCompliancePage() {
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
            SmartCOI vs SmartCompliance
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            SmartCompliance is a broad enterprise compliance platform serving large organizations
            across multiple industries. SmartCOI is purpose-built for mid-market property managers
            who want to start tracking COI compliance in minutes, not weeks. Here&apos;s how they
            compare.
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">SmartCompliance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Industry focus', smart: 'Commercial real estate', comp: 'Multi-industry enterprise compliance' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', comp: 'Enterprise pricing, contact required' },
                  { feature: 'Implementation', smart: 'Self-serve, minutes', comp: 'Weeks-long enterprise onboarding' },
                  { feature: 'Free trial', smart: '14 days, no card required', comp: 'Demo only' },
                  { feature: 'Data extraction', smart: 'AI-powered, instant', comp: 'Automated processing' },
                  { feature: 'Compliance scope', smart: 'COI compliance for CRE', comp: 'Broad compliance management' },
                  { feature: 'Bulk upload', smart: '50 COIs at once', comp: 'Batch processing available' },
                  { feature: 'Learning curve', smart: 'Minimal — intuitive interface', comp: 'Training typically required' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', comp: 'Available' },
                  { feature: 'Target market', smart: 'Mid-market property managers', comp: 'Large enterprises, multi-industry' },
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
              <strong className="text-slate-950">Minutes to value, not weeks.</strong> SmartCOI&apos;s
              self-serve onboarding means you can sign up, create your organization, upload COIs, and
              have a compliance dashboard running in minutes. SmartCompliance&apos;s enterprise
              implementation typically takes weeks with dedicated onboarding support, configuration,
              and training.
            </p>
            <p>
              <strong className="text-slate-950">Purpose-built simplicity for CRE.</strong> SmartCOI
              does one thing exceptionally well: COI compliance tracking for property managers. Every
              feature is designed for CRE workflows. SmartCompliance is a broad compliance platform
              that serves multiple industries and compliance types — which means more complexity for
              users who only need COI tracking.
            </p>
            <p>
              <strong className="text-slate-950">Transparent, affordable pricing.</strong> Three
              published tiers starting at $79/mo. No enterprise sales process, no custom quotes, no
              annual minimums. SmartCompliance uses enterprise pricing that requires a sales conversation.
            </p>
            <p>
              <strong className="text-slate-950">No training required.</strong> SmartCOI&apos;s
              interface is intuitive enough that property managers start using it without training.
              Enterprise platforms typically require onboarding sessions and ongoing training to use
              effectively.
            </p>
            <p>
              <strong className="text-slate-950">AI extraction built for COIs.</strong> SmartCOI&apos;s
              AI is specifically trained on certificate of insurance documents — ACORD forms, coverage
              types, limits, and named insureds common in commercial real estate.
            </p>
          </div>
        </section>

        {/* SmartCompliance Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where SmartCompliance Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">Broad compliance capabilities.</strong> SmartCompliance
              goes beyond COI tracking to handle multiple compliance types across different industries.
              If your organization needs a single platform for all compliance management, their broader
              scope may be valuable.
            </p>
            <p>
              <strong className="text-slate-950">Enterprise-grade infrastructure.</strong> For large
              organizations with complex requirements — advanced role-based access, custom workflows,
              detailed audit trails, and enterprise security — SmartCompliance&apos;s platform is built
              for that scale.
            </p>
            <p>
              <strong className="text-slate-950">Dedicated implementation support.</strong> SmartCompliance
              provides hands-on onboarding with dedicated teams. For organizations that want guided
              setup and customized configuration, this white-glove approach can be valuable.
            </p>
            <p>
              <strong className="text-slate-950">Multi-industry experience.</strong> Their platform
              serves healthcare, construction, energy, and real estate. This breadth means more
              pre-built compliance templates across industries.
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
              manager who needs focused COI compliance tracking that works in minutes, not a broad
              enterprise compliance platform that takes weeks to implement.
            </p>
            <p>
              <strong className="text-slate-950">Choose SmartCompliance</strong> if you&apos;re a large
              enterprise needing multi-industry compliance management with dedicated implementation
              support and have the budget and timeline for an enterprise rollout.
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
              Self-serve setup in minutes, not weeks. No enterprise sales process required.
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
