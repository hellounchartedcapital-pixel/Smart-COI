import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import {
  propertyTypes,
  coverageTypes,
  getPropertyType,
  getCoverageType,
} from '@/lib/pseo';

interface PageProps {
  params: Promise<{ property: string; coverage: string }>;
}

export function generateStaticParams() {
  const params: { property: string; coverage: string }[] = [];
  for (const pt of propertyTypes) {
    for (const ct of coverageTypes) {
      params.push({ property: pt.slug, coverage: ct.slug });
    }
  }
  return params;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { property, coverage } = await params;
  const pt = getPropertyType(property);
  const ct = getCoverageType(coverage);
  if (!pt || !ct) return {};

  const title = `${ct.name} Requirements for ${pt.plural} | SmartCOI`;
  const description = `${ct.name} insurance requirements for ${pt.plural.toLowerCase()}. Learn minimum coverage limits, compliance best practices, and how SmartCOI automates COI tracking for property managers.`;

  return {
    title,
    description,
    robots: { index: false, follow: true },
    alternates: {
      canonical: `https://smartcoi.io/insurance-requirements/${pt.slug}/${ct.slug}`,
    },
    openGraph: {
      title,
      description,
      type: 'article',
      url: `https://smartcoi.io/insurance-requirements/${pt.slug}/${ct.slug}`,
    },
  };
}

export default async function NicheInsurancePage({ params }: PageProps) {
  const { property, coverage } = await params;
  const pt = getPropertyType(property);
  const ct = getCoverageType(coverage);

  if (!pt || !ct) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${ct.name} Requirements for ${pt.plural}`,
    description: ct.description,
    author: { '@type': 'Organization', name: 'SmartCOI' },
    publisher: { '@type': 'Organization', name: 'SmartCOI' },
  };

  // Related pages: same property, different coverages
  const relatedCoverages = coverageTypes.filter((c) => c.slug !== ct.slug);
  // Related pages: same coverage, different properties
  const relatedProperties = propertyTypes.filter((p) => p.slug !== pt.slug).slice(0, 4);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-4xl px-6 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-slate-500">
            <li>
              <Link href="/insurance-requirements" className="hover:text-slate-700">
                Insurance Requirements
              </Link>
            </li>
            <li>/</li>
            <li>
              <Link
                href={`/insurance-requirements/${pt.slug}`}
                className="hover:text-slate-700"
              >
                {pt.plural}
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">{ct.name}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            {ct.abbreviation} Coverage
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {ct.name} Requirements for {pt.plural}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500 max-w-2xl mx-auto">
            {ct.description} Here&apos;s what property managers need to know about {ct.name.toLowerCase()} coverage
            for {pt.plural.toLowerCase()}.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/signup"
              className="rounded-lg bg-[#4CC78A] px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3db577] transition"
            >
              Upload 50 COIs Free
            </Link>
            <Link
              href="/coi-tracking-software"
              className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition"
            >
              Learn more &rarr;
            </Link>
          </div>
        </section>

        {/* Why this coverage matters */}
        <section className="mx-auto max-w-4xl px-6 mt-20">
          <h2 className="text-2xl font-bold text-slate-900">
            Why {ct.name} Matters for {pt.plural}
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">{ct.importance}</p>
          <div className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold text-slate-700">Typical Minimum Limits</p>
            <p className="mt-1 text-lg font-bold text-slate-900">{ct.typicalLimits}</p>
          </div>
        </section>

        {/* Property context */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-2xl font-bold text-slate-900">
            About {pt.plural}
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">{pt.description}</p>

          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Common Vendors
              </h3>
              <ul className="mt-3 space-y-2">
                {pt.vendorExamples.map((v) => (
                  <li key={v} className="flex items-center gap-2 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#4CC78A]" />
                    <span className="capitalize">{v}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 p-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Common Tenants
              </h3>
              <ul className="mt-3 space-y-2">
                {pt.tenantExamples.map((t) => (
                  <li key={t} className="flex items-center gap-2 text-slate-700">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    <span className="capitalize">{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Compliance checklist */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-2xl font-bold text-slate-900">
            {ct.name} Compliance Checklist for {pt.name} Managers
          </h2>
          <div className="mt-6 space-y-4">
            {[
              `Require all vendors and tenants to provide a certificate of insurance showing active ${ct.name.toLowerCase()} coverage before they begin work or occupy space.`,
              `Verify that the ${ct.abbreviation} policy lists your property or management company as an Additional Insured (where applicable).`,
              `Confirm coverage limits meet or exceed your minimum requirements (typically ${ct.typicalLimits}).`,
              `Set up expiration tracking to receive alerts 30, 60, and 90 days before policies lapse.`,
              `Automate follow-up notifications so non-compliant vendors and tenants receive reminders without manual effort.`,
              `Maintain an auditable compliance history for each vendor and tenant in case of claims or disputes.`,
            ].map((item, i) => (
              <div key={i} className="flex gap-3">
                <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#4CC78A]/10 text-[#4CC78A] text-sm font-bold">
                  {i + 1}
                </div>
                <p className="text-slate-600 leading-relaxed">{item}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How SmartCOI helps */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-2xl font-bold text-slate-900">
            How SmartCOI Automates {ct.name} Tracking
          </h2>
          <p className="mt-4 text-slate-600 leading-relaxed">
            SmartCOI eliminates manual COI tracking for {pt.plural.toLowerCase()}. Upload certificates,
            and our AI instantly extracts {ct.name.toLowerCase()} details — coverage limits, effective dates,
            additional insureds, and more. Non-compliant vendors and tenants are flagged automatically,
            and follow-up emails go out without you lifting a finger.
          </p>
          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            {[
              {
                title: 'AI Extraction',
                desc: `Upload a COI and SmartCOI extracts ${ct.abbreviation} limits, dates, and named insureds in seconds.`,
              },
              {
                title: 'Compliance Engine',
                desc: `Set your ${ct.name.toLowerCase()} requirements once. SmartCOI checks every certificate against them automatically.`,
              },
              {
                title: 'Auto Follow-Up',
                desc: 'Non-compliant or expiring policies trigger automatic email reminders to vendors and tenants.',
              },
            ].map((feature) => (
              <div key={feature.title} className="rounded-lg border border-slate-200 p-5">
                <h3 className="font-semibold text-slate-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-slate-500">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 mt-20 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14">
            <h2 className="text-3xl font-bold text-white">
              Stop chasing COIs. Start tracking compliance.
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              SmartCOI automates {ct.name.toLowerCase()} tracking for {pt.plural.toLowerCase()} — from upload to compliance verification to renewal reminders. Try it free.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-lg bg-[#4CC78A] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3db577] transition"
            >
              Upload 50 COIs Free
            </Link>
          </div>
        </section>

        {/* Related blog content */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-xl font-bold text-slate-900">Related Resources</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link href={`/insurance-requirements/${pt.slug}`} className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              All Insurance Requirements for {pt.plural}
            </Link>
            <Link href="/blog/how-to-set-insurance-requirements-commercial-real-estate" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              How to Set Vendor & Tenant Insurance Requirements
            </Link>
            <Link href="/blog/coi-compliance-guide-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Complete Guide to COI Compliance
            </Link>
          </div>
        </section>

        {/* Internal links — related coverages for this property type */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-xl font-bold text-slate-900">
            Other Insurance Requirements for {pt.plural}
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {relatedCoverages.map((c) => (
              <Link
                key={c.slug}
                href={`/insurance-requirements/${pt.slug}/${c.slug}`}
                className="rounded-lg border border-slate-200 p-4 hover:border-[#4CC78A] hover:bg-slate-50 transition"
              >
                <p className="font-semibold text-slate-900">{c.name}</p>
                <p className="mt-1 text-sm text-slate-500">{c.abbreviation} coverage</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Internal links — same coverage, different properties */}
        <section className="mx-auto max-w-4xl px-6 mt-12 mb-8">
          <h2 className="text-xl font-bold text-slate-900">
            {ct.name} for Other Property Types
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {relatedProperties.map((p) => (
              <Link
                key={p.slug}
                href={`/insurance-requirements/${p.slug}/${ct.slug}`}
                className="rounded-lg border border-slate-200 p-4 hover:border-[#4CC78A] hover:bg-slate-50 transition"
              >
                <p className="font-semibold text-slate-900">{p.plural}</p>
                <p className="mt-1 text-sm text-slate-500">
                  {ct.abbreviation} requirements &rarr;
                </p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
