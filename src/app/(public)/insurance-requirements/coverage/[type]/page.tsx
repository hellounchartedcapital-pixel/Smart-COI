import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { getCoverageGuide, getAllCoverageGuideSlugs, coverageGuides } from '@/lib/pseo/coverage-guides';

interface PageProps {
  params: Promise<{ type: string }>;
}

export function generateStaticParams() {
  return getAllCoverageGuideSlugs().map((slug) => ({ type: slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { type } = await params;
  const guide = getCoverageGuide(type);
  if (!guide) return {};

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    alternates: {
      canonical: `https://smartcoi.io/insurance-requirements/coverage/${guide.slug}`,
    },
    openGraph: {
      title: guide.metaTitle,
      description: guide.metaDescription,
      type: 'article',
      url: `https://smartcoi.io/insurance-requirements/coverage/${guide.slug}`,
    },
  };
}

export default async function CoverageGuidePage({ params }: PageProps) {
  const { type } = await params;
  const guide = getCoverageGuide(type);
  if (!guide) notFound();

  const relatedGuides = coverageGuides.filter((g) => guide.relatedSlugs.includes(g.slug));

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    author: { '@type': 'Organization', name: 'SmartCOI' },
    publisher: { '@type': 'Organization', name: 'SmartCOI', url: 'https://smartcoi.io' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="bg-white pt-24 pb-20">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-3xl px-6 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-[#6B7280]">
            <li>
              <Link href="/insurance-requirements" className="hover:text-[#111827]">
                Insurance Requirements
              </Link>
            </li>
            <li>/</li>
            <li className="text-[#111827] font-medium">Coverage Guide</li>
          </ol>
        </nav>

        {/* Title */}
        <header className="mx-auto max-w-3xl px-6">
          <h1 className="text-3xl font-bold text-[#111827] sm:text-4xl leading-tight">
            {guide.title}
          </h1>
          <p className="mt-4 text-lg text-[#6B7280]">
            {guide.metaDescription}
          </p>
        </header>

        {/* Table of contents */}
        <nav className="mx-auto max-w-3xl px-6 mt-10">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-6">
            <p className="text-sm font-semibold text-[#111827] mb-3">In this guide</p>
            <ul className="space-y-2">
              {guide.sections.map((s, i) => (
                <li key={i}>
                  <a
                    href={`#section-${i}`}
                    className="text-sm text-[#6B7280] hover:text-[#4CC78A] transition-colors"
                  >
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </nav>

        {/* Content sections */}
        <article className="mx-auto max-w-3xl px-6 mt-12">
          {guide.sections.map((section, i) => (
            <section key={i} id={`section-${i}`} className="mb-12">
              <h2 className="text-2xl font-bold text-[#111827] mb-4">
                {section.heading}
              </h2>
              <div className="prose-smartcoi">
                {section.content.split('\n\n').map((paragraph, pi) => {
                  // Handle bold markdown-style text
                  if (paragraph.startsWith('**') && paragraph.includes(':**')) {
                    // It's a definition/label paragraph
                    const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                    return (
                      <p key={pi} className="text-base text-[#374151] leading-relaxed mb-5">
                        {parts.map((part, partIdx) =>
                          partIdx % 2 === 1 ? (
                            <strong key={partIdx} className="text-[#111827] font-semibold">{part}</strong>
                          ) : (
                            <span key={partIdx}>{part}</span>
                          )
                        )}
                      </p>
                    );
                  }
                  // Regular paragraph with potential bold text
                  const parts = paragraph.split(/\*\*(.*?)\*\*/g);
                  return (
                    <p key={pi} className="text-base text-[#374151] leading-relaxed mb-5">
                      {parts.map((part, partIdx) =>
                        partIdx % 2 === 1 ? (
                          <strong key={partIdx} className="text-[#111827] font-semibold">{part}</strong>
                        ) : (
                          <span key={partIdx}>{part}</span>
                        )
                      )}
                    </p>
                  );
                })}
              </div>
            </section>
          ))}
        </article>

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 mt-8">
          <div className="rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] p-8 text-center">
            <h2 className="text-xl font-bold text-[#111827]">
              Track compliance automatically with SmartCOI
            </h2>
            <p className="mt-2 text-sm text-[#6B7280]">
              Upload certificates, verify coverage, and get alerts before policies expire.
            </p>
            <div className="mt-6">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-[#73E2A7] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#4CC78A]"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        </section>

        {/* Related guides */}
        {relatedGuides.length > 0 && (
          <section className="mx-auto max-w-3xl px-6 mt-16">
            <h2 className="text-xl font-bold text-[#111827] mb-6">Related Coverage Guides</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {relatedGuides.map((g) => (
                <Link
                  key={g.slug}
                  href={`/insurance-requirements/coverage/${g.slug}`}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-5 hover:border-[#D1D5DB] transition"
                >
                  <h3 className="text-sm font-semibold text-[#111827]">{g.title.split(':')[0]}</h3>
                  <p className="mt-1 text-xs text-[#6B7280] line-clamp-2">{g.metaDescription.slice(0, 100)}...</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </>
  );
}
