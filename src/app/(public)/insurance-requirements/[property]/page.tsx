import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { propertyTypes, coverageTypes, getPropertyType } from '@/lib/pseo';

interface PageProps {
  params: Promise<{ property: string }>;
}

export function generateStaticParams() {
  return propertyTypes.map((pt) => ({ property: pt.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { property } = await params;
  const pt = getPropertyType(property);
  if (!pt) return {};

  const title = `Insurance Requirements for ${pt.plural} | SmartCOI`;
  const description = `Complete guide to COI and insurance requirements for ${pt.plural.toLowerCase()}. Covers general liability, workers' comp, commercial auto, and more.`;

  return {
    title,
    description,
    alternates: {
      canonical: `https://smartcoi.io/insurance-requirements/${pt.slug}`,
    },
    openGraph: { title, description, type: 'website', url: `https://smartcoi.io/insurance-requirements/${pt.slug}` },
  };
}

export default async function PropertyInsuranceHubPage({ params }: PageProps) {
  const { property } = await params;
  const pt = getPropertyType(property);
  if (!pt) notFound();

  const otherProperties = propertyTypes.filter((p) => p.slug !== pt.slug);

  return (
    <>
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
            <li className="text-slate-900 font-medium">{pt.plural}</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            {pt.name} Insurance
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Insurance Requirements for {pt.plural}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500 max-w-2xl mx-auto">
            {pt.description} Explore coverage-specific requirements below.
          </p>
        </section>

        {/* Coverage cards */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <h2 className="text-2xl font-bold text-slate-900">Coverage Requirements</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {coverageTypes.map((ct) => (
              <Link
                key={ct.slug}
                href={`/insurance-requirements/${pt.slug}/${ct.slug}`}
                className="group rounded-lg border border-slate-200 p-5 hover:border-[#4CC78A] hover:shadow-sm transition"
              >
                <p className="text-xs font-semibold uppercase tracking-wider text-[#4CC78A]">
                  {ct.abbreviation}
                </p>
                <h3 className="mt-1 font-semibold text-slate-900 group-hover:text-[#4CC78A] transition">
                  {ct.name}
                </h3>
                <p className="mt-2 text-sm text-slate-500 line-clamp-2">{ct.description}</p>
                <p className="mt-3 text-xs text-slate-400">Typical: {ct.typicalLimits}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Vendor & Tenant context */}
        <section className="mx-auto max-w-4xl px-6 mt-16">
          <div className="grid gap-6 sm:grid-cols-2">
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

        {/* CTA */}
        <section className="mx-auto max-w-4xl px-6 mt-20 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14">
            <h2 className="text-3xl font-bold text-white">
              Automate insurance tracking for your {pt.plural.toLowerCase()}
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              SmartCOI handles COI collection, AI-powered extraction, compliance checks, and
              automated follow-ups. Start free — no credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-lg bg-[#4CC78A] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3db577] transition"
            >
              Upload 50 COIs Free
            </Link>
          </div>
        </section>

        {/* Other property types */}
        <section className="mx-auto max-w-4xl px-6 mt-16 mb-8">
          <h2 className="text-xl font-bold text-slate-900">Other Property Types</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {otherProperties.map((p) => (
              <Link
                key={p.slug}
                href={`/insurance-requirements/${p.slug}`}
                className="rounded-lg border border-slate-200 p-4 hover:border-[#4CC78A] hover:bg-slate-50 transition"
              >
                <p className="font-semibold text-slate-900">{p.plural}</p>
                <p className="mt-1 text-sm text-slate-500 line-clamp-1">{p.description}</p>
              </Link>
            ))}
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
