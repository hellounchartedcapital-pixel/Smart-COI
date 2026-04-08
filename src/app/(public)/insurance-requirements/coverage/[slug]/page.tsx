import { notFound } from 'next/navigation';
import Link from 'next/link';
import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { coverageGuides, getCoverageGuide } from '@/lib/pseo/coverage-guides';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export function generateStaticParams() {
  return coverageGuides.map((g) => ({ slug: g.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const guide = getCoverageGuide(slug);
  if (!guide) return {};

  return {
    title: guide.title,
    description: guide.metaDescription,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `https://smartcoi.io/insurance-requirements/coverage/${guide.slug}`,
    },
    openGraph: {
      title: guide.title,
      description: guide.metaDescription,
      type: 'article',
      url: `https://smartcoi.io/insurance-requirements/coverage/${guide.slug}`,
    },
  };
}

/** Render markdown-style content: paragraphs, bold, tables, and bullet lists */
function RenderContent({ content }: { content: string }) {
  const blocks = content.split('\n\n');

  return (
    <>
      {blocks.map((block, i) => {
        const trimmed = block.trim();

        // Table block
        if (trimmed.startsWith('|')) {
          const rows = trimmed.split('\n').filter((r) => r.trim().length > 0);
          const headerRow = rows[0];
          // Skip separator row (row with |---|)
          const dataRows = rows.slice(2);
          const parseRow = (row: string) =>
            row
              .split('|')
              .filter((c) => c.trim().length > 0)
              .map((c) => c.trim());
          const headers = parseRow(headerRow);

          return (
            <div key={i} className="mt-6 overflow-x-auto">
              <table className="w-full text-sm border-collapse border border-slate-200">
                <thead>
                  <tr className="bg-[#F9FAFB]">
                    {headers.map((h, hi) => (
                      <th
                        key={hi}
                        className="border border-slate-200 px-4 py-3 text-left font-semibold text-slate-900"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {dataRows.map((row, ri) => {
                    const cells = parseRow(row);
                    return (
                      <tr key={ri} className={ri % 2 === 1 ? 'bg-slate-50' : ''}>
                        {cells.map((cell, ci) => (
                          <td
                            key={ci}
                            className="border border-slate-200 px-4 py-3 text-gray-700"
                          >
                            {cell}
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          );
        }

        // Bullet list block
        if (trimmed.startsWith('- ')) {
          const items = trimmed.split('\n').map((line) => line.replace(/^- /, ''));
          return (
            <ul key={i} className="mt-4 space-y-2 list-disc list-inside text-base leading-relaxed text-gray-700">
              {items.map((item, li) => (
                <li key={li}>
                  <InlineFormatted text={item} />
                </li>
              ))}
            </ul>
          );
        }

        // Bold heading-style paragraph (starts with **)
        if (trimmed.startsWith('**') && trimmed.indexOf('**', 2) > 2) {
          const closingIdx = trimmed.indexOf('**', 2);
          const boldText = trimmed.slice(2, closingIdx);
          const rest = trimmed.slice(closingIdx + 2);

          return (
            <div key={i} className="mt-6">
              <h3 className="text-lg font-semibold text-slate-900">{boldText}</h3>
              {rest.trim() && (
                <p className="mt-2 text-base leading-relaxed text-gray-700">
                  <InlineFormatted text={rest.trim()} />
                </p>
              )}
            </div>
          );
        }

        // Regular paragraph
        return (
          <p key={i} className="mt-4 text-base leading-relaxed text-gray-700">
            <InlineFormatted text={trimmed} />
          </p>
        );
      })}
    </>
  );
}

/** Render inline bold (**text**) within a string */
function InlineFormatted({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={i} className="font-semibold text-slate-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={i}>{part}</span>;
      })}
    </>
  );
}

export default async function CoverageGuidePage({ params }: PageProps) {
  const { slug } = await params;
  const guide = getCoverageGuide(slug);
  if (!guide) notFound();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.headline,
    description: guide.metaDescription,
    author: { '@type': 'Organization', name: 'SmartCOI' },
    publisher: { '@type': 'Organization', name: 'SmartCOI' },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main className="pt-24 pb-20">
        {/* Breadcrumb */}
        <nav className="mx-auto max-w-3xl px-6 mb-8" aria-label="Breadcrumb">
          <ol className="flex items-center gap-2 text-sm text-slate-500">
            <li>
              <Link href="/insurance-requirements" className="hover:text-slate-700">
                Insurance Requirements
              </Link>
            </li>
            <li>/</li>
            <li className="text-slate-900 font-medium">Coverage Guide</li>
          </ol>
        </nav>

        {/* Hero */}
        <section className="mx-auto max-w-3xl px-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
            Coverage Guide
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
            {guide.headline}
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-500">{guide.intro}</p>
        </section>

        {/* Table of Contents */}
        <nav className="mx-auto max-w-3xl px-6 mt-12">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-6">
            <p className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              In This Guide
            </p>
            <ol className="mt-3 space-y-2">
              {guide.sections.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] transition"
                  >
                    {i + 1}. {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </div>
        </nav>

        {/* Content Sections */}
        {guide.sections.map((section) => (
          <section key={section.id} id={section.id} className="mx-auto max-w-3xl px-6 mt-16">
            <h2 className="text-2xl font-bold text-slate-900">{section.title}</h2>
            <RenderContent content={section.content} />
          </section>
        ))}

        {/* CTA */}
        <section className="mx-auto max-w-3xl px-6 mt-20">
          <div className="rounded-2xl bg-slate-950 px-8 py-14 text-center">
            <h2 className="text-3xl font-bold text-white">
              Track general liability compliance automatically
            </h2>
            <p className="mt-4 text-slate-400 max-w-xl mx-auto">
              Upload a COI and see coverage gaps in seconds. SmartCOI extracts limits,
              endorsements, and additional insured status with AI — no manual review required.
            </p>
            <Link
              href="/signup"
              className="mt-8 inline-flex rounded-lg bg-[#4CC78A] px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-[#3db577] transition"
            >
              Start Free Trial
            </Link>
          </div>
        </section>

        {/* Related Coverage Guides */}
        <section className="mx-auto max-w-3xl px-6 mt-16">
          <h2 className="text-xl font-bold text-slate-900">Related Coverage Guides</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {guide.relatedGuides.map((related) => (
              <Link
                key={related.slug}
                href={`/insurance-requirements/coverage/${related.slug}`}
                className="rounded-lg border border-slate-200 p-4 hover:border-[#4CC78A] hover:bg-slate-50 transition"
              >
                <p className="font-semibold text-slate-900">{related.name}</p>
                <p className="mt-1 text-sm text-slate-500">Coverage guide →</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Internal Links */}
        <section className="mx-auto max-w-3xl px-6 mt-16 mb-8">
          <h2 className="text-xl font-bold text-slate-900">Related Resources</h2>
          <div className="mt-4 flex flex-col gap-3">
            <Link
              href="/insurance-requirements"
              className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
            >
              Insurance Requirements by Property Type
            </Link>
            <Link
              href="/blog/how-to-set-insurance-requirements-commercial-real-estate"
              className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
            >
              How to Set Vendor & Tenant Insurance Requirements
            </Link>
            <Link
              href="/blog/coi-compliance-guide-property-managers"
              className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
            >
              The Complete Guide to COI Compliance
            </Link>
            <Link
              href="/blog/additional-insured-endorsements-explained"
              className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
            >
              Additional Insured Endorsements Explained
            </Link>
            <Link
              href="/pricing"
              className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
            >
              SmartCOI Pricing
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
