import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';

export const metadata: Metadata = {
  title: 'SmartCOI vs myCOI: Which COI Tracker Is Better?',
  description:
    'myCOI targets large enterprises with custom pricing. SmartCOI offers the same features at transparent rates starting at $79/mo. See the full breakdown.',
  alternates: {
    canonical: 'https://smartcoi.io/compare/smartcoi-vs-mycoi',
  },
  openGraph: {
    title: 'SmartCOI vs myCOI: Which COI Tracker Is Better?',
    description:
      'myCOI targets large enterprises with custom pricing. SmartCOI offers the same features at transparent rates starting at $79/mo. See the full breakdown.',
    type: 'website',
    url: 'https://smartcoi.io/compare/smartcoi-vs-mycoi',
  },
};

export default function SmartCOIvsMyCOIPage() {
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
            SmartCOI vs myCOI
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            myCOI (recently rebranded as illumend) is one of the longest-running COI tracking
            platforms, founded in 2009. They serve large enterprises across multiple industries
            with a team of insurance professionals. SmartCOI is purpose-built for mid-market
            commercial real estate. Here&apos;s an honest comparison.
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
                  <th className="px-6 py-4 text-left font-semibold text-slate-950">myCOI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { feature: 'Minimum requirements', smart: 'No minimums', mycoi: '200+ certificates required' },
                  { feature: 'Pricing', smart: 'Published tiers ($79/$149/$249)', mycoi: 'Complex multi-factor, sales required' },
                  { feature: 'Setup', smart: 'Self-serve, minutes', mycoi: 'Sales call + implementation period' },
                  { feature: 'Free trial', smart: '14 days, no card required', mycoi: 'Demo only' },
                  { feature: 'Data extraction', smart: 'AI-powered, seconds', mycoi: 'AI + human review team' },
                  { feature: 'Bulk upload', smart: '50 COIs at once, instant results', mycoi: 'Manual onboarding process' },
                  { feature: 'Industry focus', smart: 'Commercial real estate', mycoi: 'Multi-industry (CRE, construction, gov, utilities)' },
                  { feature: 'PMS integrations', smart: 'Not currently available', mycoi: 'Procore, MRI, Sage, Viewpoint, CMiC' },
                  { feature: 'Vendor portal', smart: 'Self-service upload links', mycoi: 'Available' },
                  { feature: 'Target market', smart: 'Mid-market property managers', mycoi: 'Enterprise, 200+ certificates' },
                ].map((row) => (
                  <tr key={row.feature}>
                    <td className="px-6 py-3 font-medium text-slate-950">{row.feature}</td>
                    <td className="px-6 py-3 text-slate-600">{row.smart}</td>
                    <td className="px-6 py-3 text-slate-600">{row.mycoi}</td>
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
              <strong className="text-slate-950">No minimums — built for firms of any size.</strong> myCOI
              requires a minimum of 200 incoming certificates, which prices out many mid-market property
              management firms. SmartCOI works whether you manage 5 properties or 50. You shouldn&apos;t
              need to hit an arbitrary threshold just to track insurance compliance.
            </p>
            <p>
              <strong className="text-slate-950">Transparent, simple pricing.</strong> SmartCOI publishes
              clear per-certificate tiers: Starter at $79/month, Growth at $149/month, Professional
              at $249/month. You know what you&apos;ll pay before you talk to anyone. myCOI uses
              multi-factor pricing that depends on certificate volume, features, and other variables —
              you won&apos;t know the cost until you go through a sales process.
            </p>
            <p>
              <strong className="text-slate-950">Self-serve from day one.</strong> Sign up, upload your
              COIs, and get compliance results immediately. No mandatory sales calls, no lengthy
              onboarding, no waiting for an implementation team. myCOI&apos;s sales-led process
              means weeks between &quot;I&apos;m interested&quot; and &quot;I&apos;m using the
              software.&quot;
            </p>
            <p>
              <strong className="text-slate-950">Purpose-built for commercial real estate.</strong> SmartCOI
              is designed specifically for property managers tracking vendor and tenant COIs. Every feature,
              workflow, and default is optimized for CRE. myCOI serves construction, government, utilities,
              and manufacturing alongside real estate — a generalist approach that means the product
              isn&apos;t tailored to any single industry&apos;s needs.
            </p>
            <p>
              <strong className="text-slate-950">Bulk upload with instant AI extraction.</strong> Upload
              50 COIs at once and get a fully populated, compliance-checked dashboard in minutes. SmartCOI&apos;s
              AI extracts vendor names, coverage types, limits, and expiration dates from every certificate
              simultaneously. myCOI&apos;s traditional approach involves more manual setup and a longer
              time to full compliance visibility.
            </p>
            <p>
              <strong className="text-slate-950">Modern, lightweight experience.</strong> SmartCOI is a
              modern application built for speed and simplicity. myCOI is a 15-year-old platform that
              recently bolted on AI features with their &quot;Lumie&quot; assistant. There&apos;s a
              difference between AI-native and AI-added.
            </p>
          </div>
        </section>

        {/* myCOI Advantages */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Where myCOI Excels
          </h2>
          <div className="mt-6 space-y-4 text-base leading-relaxed text-slate-600">
            <p>
              <strong className="text-slate-950">15+ years of industry experience.</strong> myCOI
              has been in the COI tracking space since 2009. That longevity means deep insurance
              domain expertise, established processes, and a track record with enterprise clients.
              For organizations that value proven vendors with long histories, myCOI has the edge.
            </p>
            <p>
              <strong className="text-slate-950">Larger integration ecosystem.</strong> myCOI
              integrates with Procore, MRI Software, Sage, Viewpoint Vista, and CMiC. For
              organizations that need COI data flowing directly into construction or property
              management platforms, myCOI&apos;s integration library is more extensive today.
            </p>
            <p>
              <strong className="text-slate-950">Insurance professionals on staff.</strong> myCOI
              employs a team of insurance professionals who manually review certificates alongside
              their AI. For complex certificates or edge cases where human judgment matters,
              having trained insurance reviewers adds a layer of confidence.
            </p>
            <p>
              <strong className="text-slate-950">Established enterprise customer base.</strong> myCOI
              serves large organizations including JLL-sized enterprise clients. Their vendor network
              and customer base are larger, which can matter for organizations that value ecosystem
              scale.
            </p>
            <p>
              <strong className="text-slate-950">Multi-industry support.</strong> If your organization
              tracks COIs across real estate, construction, government, and utilities, myCOI&apos;s
              generalist approach covers all of those verticals in a single platform.
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
              <strong className="text-slate-950">Choose SmartCOI</strong> if you are a mid-market
              commercial real estate firm that wants to get started immediately with transparent
              pricing, no minimums, and instant AI-powered extraction. SmartCOI is built for property
              managers who want a modern, right-sized tool — not an enterprise platform they have to
              grow into.
            </p>
            <p>
              <strong className="text-slate-950">Choose myCOI</strong> if you are a large enterprise
              with 200+ certificates, need deep integrations with Procore, Sage, or Viewpoint, want
              human insurance professionals reviewing your certificates, or track COIs across multiple
              industries beyond real estate.
            </p>
          </div>
        </section>

        {/* Related Content */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/alternatives/mycoi" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              myCOI Alternatives for COI Tracking
            </Link>
            <Link href="/features/compliance-automation" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Automated Compliance Checking
            </Link>
            <Link href="/blog/cost-of-not-tracking-vendor-insurance" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Hidden Cost of Skipping Vendor COI Tracking
            </Link>
            <Link href="/compare/smartcoi-vs-trustlayer" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              SmartCOI vs TrustLayer
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
              No minimums, no sales call, no credit card. See the difference yourself.
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
