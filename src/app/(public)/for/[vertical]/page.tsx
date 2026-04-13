import Link from 'next/link';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { verticals } from '@/lib/verticals';

export function generateStaticParams() {
  return verticals.map((v) => ({ vertical: v.slug }));
}

interface PageProps {
  params: Promise<{ vertical: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { vertical } = await params;
  const v = verticals.find((v) => v.slug === vertical);
  if (!v) return {};

  const title = `${v.headline} | SmartCOI`;
  const url = `https://smartcoi.io/for/${v.slug}`;

  return {
    title,
    description: v.metaDescription,
    alternates: { canonical: url },
    openGraph: { title, description: v.metaDescription, type: 'website', url },
  };
}

export default async function VerticalPage({ params }: PageProps) {
  const { vertical } = await params;
  const v = verticals.find((v) => v.slug === vertical);
  if (!v) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: v.headline,
    description: v.metaDescription,
    url: `https://smartcoi.io/for/${v.slug}`,
    provider: {
      '@type': 'Organization',
      name: 'SmartCOI',
      url: 'https://smartcoi.io',
    },
  };

  return (
    <>
      <Navbar />

      <main className="pt-24 pb-20">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Hero */}
        <section className="mx-auto max-w-4xl px-6 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            For {v.name}
          </p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            {v.headline}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">
            {v.description}
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 shadow-lg shadow-[#73E2A7]/20 transition-all hover:bg-[#4CC78A]"
          >
            Upload Your COIs Free
          </Link>
        </section>

        {/* Pain Points */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            The Compliance Challenges You Know Too Well
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {v.painPoints.map((p) => (
              <div key={p.title} className="rounded-2xl border border-slate-200 bg-white p-6">
                <h3 className="text-lg font-bold text-slate-950">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-500">{p.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Solutions */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            How SmartCOI Solves It
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {v.solutions.map((s) => (
              <div key={s.title} className="rounded-2xl border border-[#73E2A7]/20 bg-[#73E2A7]/5 p-6">
                <h3 className="text-lg font-bold text-slate-950">{s.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">{s.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typical Vendors */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            Typical Vendors You&apos;re Tracking
          </h2>
          <p className="mt-3 text-base text-slate-500">
            {v.name.toLowerCase().includes('hoa') ? 'HOA' : v.name} managers commonly track COIs for these vendor types:
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {v.vendors.map((vendor) => (
              <div key={vendor} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
                <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-[#73E2A7]/10">
                  <svg className="h-3.5 w-3.5 text-[#4CC78A]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20,6 9,17 4,12" />
                  </svg>
                </div>
                <span className="text-sm text-slate-700">{vendor}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
            What {v.name} Teams Are Saying
          </h2>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {v.testimonials.map((t) => (
              <div key={t.name} className="rounded-2xl border border-slate-200 bg-white p-6">
                <p className="text-sm leading-relaxed text-slate-600 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="mt-4 border-t border-slate-100 pt-4">
                  <p className="text-sm font-semibold text-slate-950">{t.name}</p>
                  <p className="text-xs text-slate-500">{t.title}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pricing */}
        <section className="mx-auto mt-20 max-w-4xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-950 sm:text-3xl">
            Simple, Transparent Pricing
          </h2>
          <p className="mt-3 text-center text-base text-slate-500">
            14-day free trial, no credit card required. All tiers include all features.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-3">
            {[
              { name: 'Starter', price: '$79', limit: 'Up to 50 certificates' },
              { name: 'Growth', price: '$149', limit: 'Up to 150 certificates' },
              { name: 'Professional', price: '$249', limit: 'Unlimited + priority support' },
            ].map((tier) => (
              <div key={tier.name} className="rounded-2xl border border-slate-200 bg-white p-6 text-center">
                <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">{tier.name}</p>
                <p className="mt-2 text-4xl font-bold text-slate-950">{tier.price}<span className="text-lg font-normal text-slate-400">/mo</span></p>
                <p className="mt-2 text-sm text-slate-500">{tier.limit}</p>
                <Link
                  href="/signup"
                  className="mt-6 inline-flex h-10 w-full items-center justify-center rounded-lg bg-[#73E2A7] text-sm font-bold text-slate-950 transition-all hover:bg-[#4CC78A]"
                >
                  Upload Your COIs Free
                </Link>
              </div>
            ))}
          </div>
        </section>

        {/* Related Resources */}
        <section className="mx-auto mt-16 max-w-4xl px-6">
          <h2 className="text-xl font-bold text-slate-950">Related Resources</h2>
          <div className="mt-4 flex flex-col gap-3">
            {v.insuranceRequirementsSlug && (
              <Link
                href={`/insurance-requirements/${v.insuranceRequirementsSlug}`}
                className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
              >
                {v.name} Insurance Requirements
              </Link>
            )}
            <Link href="/blog/vendor-onboarding-checklist-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Vendor Onboarding Checklist for Property Managers
            </Link>
            <Link href="/features/coi-tracking" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              COI Tracking Features
            </Link>
            <Link href="/blog/coi-compliance-guide-property-managers" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              The Complete Guide to COI Compliance
            </Link>
            <Link href="/compare" className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline">
              Compare COI Tracking Solutions
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto mt-20 max-w-4xl px-6 text-center">
          <div className="rounded-2xl bg-slate-950 px-8 py-14 sm:px-14">
            <h2 className="text-2xl font-bold text-white sm:text-3xl">
              Ready to Automate COI Compliance?
            </h2>
            <p className="mt-4 text-slate-400">
              Join teams who spend minutes — not hours — on insurance compliance.
              14-day free trial, no credit card required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 shadow-lg shadow-[#73E2A7]/20 transition-all hover:bg-[#4CC78A]"
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
