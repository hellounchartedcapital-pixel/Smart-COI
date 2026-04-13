import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { propertyTypes, coverageTypes } from '@/lib/pseo';

export const metadata: Metadata = {
  title: 'Insurance Requirements by Property Type | SmartCOI',
  description:
    'Explore COI and insurance requirements for every commercial property type. Coverage guides for office buildings, retail centers, warehouses, multifamily, and more.',
  alternates: {
    canonical: 'https://smartcoi.io/insurance-requirements',
  },
  openGraph: {
    title: 'Insurance Requirements by Property Type | SmartCOI',
    description:
      'Explore COI and insurance requirements for every commercial property type. Coverage guides for office buildings, retail centers, warehouses, multifamily, and more.',
    type: 'website',
    url: 'https://smartcoi.io/insurance-requirements',
  },
};

export default function InsuranceRequirementsIndex() {
  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20">
        <section className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            Insurance Requirements
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            COI Requirements by Property Type
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500 max-w-2xl mx-auto">
            Every commercial property type has unique insurance requirements for vendors and tenants.
            Explore coverage guides tailored to your portfolio.
          </p>
        </section>

        {/* Property type cards */}
        <section className="mx-auto max-w-5xl px-6 mt-16">
          <div className="grid gap-8 sm:grid-cols-2">
            {propertyTypes.map((pt) => (
              <div key={pt.slug} className="rounded-xl border border-slate-200 p-6">
                <Link href={`/insurance-requirements/${pt.slug}`}>
                  <h2 className="text-xl font-bold text-slate-900 hover:text-[#4CC78A] transition">
                    {pt.plural}
                  </h2>
                </Link>
                <p className="mt-2 text-sm text-slate-500">{pt.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {coverageTypes.map((ct) => (
                    <Link
                      key={ct.slug}
                      href={`/insurance-requirements/${pt.slug}/${ct.slug}`}
                      className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600 hover:border-[#4CC78A] hover:text-[#4CC78A] transition"
                    >
                      {ct.abbreviation}
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Coverage type overview */}
        <section className="mx-auto max-w-4xl px-6 mt-20">
          <h2 className="text-2xl font-bold text-slate-900 text-center">Coverage Types</h2>
          <p className="mt-4 text-center text-slate-500 max-w-xl mx-auto">
            Understanding the key insurance coverages required for commercial property compliance.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coverageTypes.map((ct) => (
              <div key={ct.slug} className="rounded-lg border border-slate-200 p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4CC78A]">
                  {ct.abbreviation}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900">{ct.name}</h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-3">{ct.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Related Resources */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-xl font-bold text-slate-900">Related Resources</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/blog/how-to-set-insurance-requirements-commercial-real-estate" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              How to Set Vendor & Tenant Insurance Requirements
            </Link>
            <Link href="/blog/coi-compliance-guide-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Complete Guide to COI Compliance
            </Link>
            <Link href="/blog/what-is-additional-insured-commercial-real-estate" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Additional Insured in Commercial Real Estate
            </Link>
            <Link href="/features/compliance-automation" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Automated Compliance Checking
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 mt-20 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14">
            <h2 className="text-3xl font-bold text-white">
              Automate COI compliance for your portfolio
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              SmartCOI tracks insurance requirements across every property type — from upload to
              compliance verification to renewal reminders. Try it free.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-lg bg-[#4CC78A] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3db577] transition"
            >
              Upload Your COIs Free
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
