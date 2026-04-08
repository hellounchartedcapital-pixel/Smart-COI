import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MDXRemote } from 'next-mdx-remote/rsc';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { getAllPosts, getPostBySlug } from '@/lib/blog';
import { BlogCTA } from '@/components/landing/blog-cta';

/** Static map of related resource links per blog post slug. */
const relatedResources: Record<string, { href: string; label: string }[]> = {
  'acord-25-certificate-explained': [
    { href: '/features/coi-tracking', label: 'COI Tracking Features' },
    { href: '/blog/coi-compliance-guide-property-managers', label: 'The Complete Guide to COI Compliance' },
    { href: '/compare/smartcoi-vs-spreadsheets', label: 'Software vs Spreadsheets for COI Tracking' },
  ],
  'vendor-onboarding-checklist-property-managers': [
    { href: '/features/vendor-management', label: 'Vendor Management Features' },
    { href: '/blog/cost-of-not-tracking-vendor-insurance', label: 'The Hidden Cost of Skipping Vendor COI Tracking' },
    { href: '/for/property-management-companies', label: 'SmartCOI for Property Management Companies' },
  ],
  'waiver-of-subrogation-property-managers': [
    { href: '/blog/what-is-additional-insured-commercial-real-estate', label: 'What Is Additional Insured in Commercial Real Estate?' },
    { href: '/features/compliance-automation', label: 'Automated Compliance Checking' },
    { href: '/insurance-requirements', label: 'Insurance Requirements by Property Type' },
  ],
  'coi-expiration-tracking-best-practices': [
    { href: '/features/coi-tracking', label: 'COI Tracking Features' },
    { href: '/blog/building-coi-compliance-policy-property-management', label: 'Building a COI Compliance Policy' },
    { href: '/compare/smartcoi-vs-mycoi', label: 'SmartCOI vs myCOI' },
  ],
  'cost-of-not-tracking-vendor-insurance': [
    { href: '/features/vendor-management', label: 'Vendor Management Features' },
    { href: '/blog/vendor-onboarding-checklist-property-managers', label: 'Vendor Onboarding Checklist for Property Managers' },
    { href: '/compare/smartcoi-vs-jones', label: 'SmartCOI vs Jones' },
  ],
  'coi-compliance-guide-property-managers': [
    { href: '/features/compliance-automation', label: 'Automated Compliance Checking' },
    { href: '/blog/how-to-set-insurance-requirements-commercial-real-estate', label: 'How to Set Insurance Requirements' },
    { href: '/blog/building-coi-compliance-policy-property-management', label: 'Building a COI Compliance Policy' },
  ],
  'what-is-additional-insured-commercial-real-estate': [
    { href: '/blog/waiver-of-subrogation-property-managers', label: 'Waiver of Subrogation for Property Managers' },
    { href: '/features/compliance-automation', label: 'Automated Compliance Checking' },
    { href: '/blog/coi-compliance-guide-property-managers', label: 'The Complete Guide to COI Compliance' },
  ],
  'how-to-set-insurance-requirements-commercial-real-estate': [
    { href: '/insurance-requirements', label: 'Insurance Requirements by Property Type' },
    { href: '/blog/coi-compliance-guide-property-managers', label: 'The Complete Guide to COI Compliance' },
    { href: '/features/compliance-automation', label: 'Automated Compliance Checking' },
  ],
  'building-coi-compliance-policy-property-management': [
    { href: '/blog/coi-compliance-guide-property-managers', label: 'The Complete Guide to COI Compliance' },
    { href: '/blog/vendor-onboarding-checklist-property-managers', label: 'Vendor Onboarding Checklist' },
    { href: '/features/vendor-management', label: 'Vendor Management Features' },
  ],
  'acord-28-evidence-of-property-insurance': [
    { href: '/blog/acord-25-certificate-explained', label: 'ACORD 25 Certificate of Insurance Guide' },
    { href: '/blog/what-is-additional-insured-commercial-real-estate', label: 'What Is Additional Insured?' },
    { href: '/features/compliance-automation', label: 'Automated Compliance Checking' },
  ],
  'coi-tracking-software-vs-spreadsheets': [
    { href: '/compare/smartcoi-vs-spreadsheets', label: 'SmartCOI vs Spreadsheets' },
    { href: '/blog/cost-of-not-tracking-vendor-insurance', label: 'The Hidden Cost of Skipping Vendor COI Tracking' },
    { href: '/features/coi-tracking', label: 'COI Tracking Features' },
  ],
  'best-coi-management-software': [
    { href: '/coi-tracking-software', label: 'COI Tracking Software Features' },
    { href: '/compare', label: 'Compare All COI Tracking Platforms' },
    { href: '/blog/coi-compliance-guide-property-managers', label: 'The Complete Guide to COI Compliance' },
  ],
};

/** FAQ structured data (JSON-LD) per blog post slug. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const faqData: Record<string, any> = {
  'acord-25-certificate-explained': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the difference between an ACORD 25 and an ACORD 28?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The ACORD 25 is a certificate of liability insurance covering general liability, auto liability, umbrella, and workers\' compensation. The ACORD 28 is evidence of commercial property insurance covering the building and its contents. You\'d request an ACORD 25 from a vendor or contractor and an ACORD 28 from a tenant or for your own property coverage.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does an ACORD 25 certificate guarantee coverage?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. An ACORD 25 is a snapshot showing coverage existed when the certificate was issued. It does not modify, extend, or guarantee the underlying insurance policy. Coverage can be cancelled or changed after the certificate is issued without the certificate holder being notified, unless specific endorsements require notice of cancellation.',
        },
      },
      {
        '@type': 'Question',
        name: 'How often should ACORD 25 certificates be updated?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Certificates should be renewed annually at minimum, aligned with the underlying policy renewal dates. Best practice is to request updated certificates 30 days before expiration and track compliance continuously rather than relying on annual spot-checks.',
        },
      },
      {
        '@type': 'Question',
        name: 'Who issues an ACORD 25 certificate?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'ACORD 25 certificates are issued by licensed insurance agents and brokers — not by the insured party. If a vendor sends you a certificate they created themselves, it should be considered unreliable. Always verify that the producer listed on the certificate is a legitimate, licensed agent or broker.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does "additional insured" mean on an ACORD 25?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Additional insured status means your organization is added to the vendor\'s liability policy, giving you coverage under their policy for claims arising from their work. On the ACORD 25, this is indicated by a checkbox in the CGL section and endorsement language in the description section. The actual protection comes from the endorsement (such as CG 20 10 or CG 20 37), not from the checkbox alone.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can an ACORD 25 be forged?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes. Because the ACORD 25 template is freely available, fraudulent certificates can be created with basic PDF editing tools. This is why verifying that certificates come from licensed producers — and cross-checking policy details with the carrier when in doubt — is important for any compliance program.',
        },
      },
    ],
  },
  'best-coi-management-software': {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the best COI management software?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The best COI management software depends on your portfolio size. For mid-market property managers who want self-serve onboarding and transparent pricing, SmartCOI is purpose-built. For enterprises needing real-time policy verification, Certificial is the leader. For teams on Yardi or MRI, Jones offers the tightest integration.',
        },
      },
      {
        '@type': 'Question',
        name: 'How much does COI tracking software cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pricing ranges from free (spreadsheets) to enterprise pricing (contact sales). SmartCOI starts at $63/month with transparent, published pricing and a 14-day free trial.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can COI management software read PDF certificates automatically?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Some platforms use AI or OCR to extract data from certificate PDFs. SmartCOI uses AI trained on ACORD certificate formats to extract coverage types, limits, dates, and named entities automatically.',
        },
      },
      {
        '@type': 'Question',
        name: "What's the difference between COI tracking and COI management?",
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'COI tracking focuses on monitoring expiration dates and collecting certificates. COI management is broader — it includes compliance checking against requirements, automated follow-ups, and audit reporting.',
        },
      },
    ],
  },
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: {
      canonical: `https://smartcoi.io/blog/${post.slug}`,
    },
    openGraph: {
      title: post.title,
      description: post.description,
      type: 'article',
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  const allPosts = getAllPosts();
  const otherPosts = allPosts.filter((p) => p.slug !== slug).slice(0, 3);
  const resources = relatedResources[slug] ?? [];

  // FAQ structured data for specific posts
  const faqJsonLd = faqData[slug] ?? null;

  return (
    <>
      <Navbar />
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32">
        <Link
          href="/blog"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          &larr; Back to Blog
        </Link>

        <article className="mt-6">
          <header>
            <time className="text-xs text-muted-foreground">
              {new Date(post.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </time>
            <h1 className="mt-2 text-3xl font-bold tracking-tight text-foreground">
              {post.title}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              By {post.author}
            </p>
          </header>

          <div className="prose-section mt-10">
            <MDXRemote source={post.content} components={{ BlogCTA }} />
          </div>
        </article>

        {/* Bottom-of-post CTA */}
        <div className="mt-12 rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white px-8 py-8 text-center sm:px-12">
          <h3 className="text-xl font-bold text-slate-900">
            Ready to automate your COI compliance?
          </h3>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-600">
            SmartCOI handles certificate collection, AI-powered data extraction,
            and real-time compliance monitoring — so you don&apos;t have to.
          </p>
          <Link
            href="/signup"
            className="mt-5 inline-flex h-11 items-center rounded-xl bg-[#4CC78A] px-7 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#3BB87A]"
          >
            Start Your Free Trial
          </Link>
          <p className="mt-3 text-xs text-slate-400">
            14-day free trial &middot; No credit card required
          </p>
        </div>

        {/* Related Resources */}
        {resources.length > 0 && (
          <section className="mt-12 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-foreground">Related Resources</h2>
            <div className="mt-4 flex flex-col gap-3">
              {resources.map((r) => (
                <Link
                  key={r.href}
                  href={r.href}
                  className="text-sm font-medium text-[#4CC78A] hover:text-[#3aae72] underline"
                >
                  {r.label}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* More from the Blog */}
        {otherPosts.length > 0 && (
          <section className="mt-10 border-t border-slate-200 pt-8">
            <h2 className="text-lg font-bold text-foreground">More from the Blog</h2>
            <div className="mt-4 space-y-4">
              {otherPosts.map((p) => (
                <Link key={p.slug} href={`/blog/${p.slug}`} className="block group">
                  <p className="text-sm font-semibold text-foreground group-hover:text-[#4CC78A] transition-colors">
                    {p.title}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">
                    {p.description}
                  </p>
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
