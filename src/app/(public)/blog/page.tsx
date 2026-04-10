import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { getAllPosts } from '@/lib/blog';

export const metadata: Metadata = {
  title: 'COI Compliance & Insurance Tracking Blog',
  description:
    'Practical guides on COI compliance, vendor insurance tracking, and risk management. Written by the SmartCOI team.',
  alternates: {
    canonical: 'https://smartcoi.io/blog',
  },
  openGraph: {
    title: 'COI Compliance & Insurance Tracking Blog',
    description:
      'Practical guides on COI compliance, vendor insurance tracking, and risk management. Written by the SmartCOI team.',
    type: 'website',
    url: 'https://smartcoi.io/blog',
  },
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <>
      <Navbar />
      <main className="mx-auto max-w-3xl px-6 pb-20 pt-32">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          Blog
        </h1>
        <p className="mt-2 text-muted-foreground">
          Insights on COI compliance, insurance tracking, and vendor
          management best practices.
        </p>

        {posts.length === 0 ? (
          <p className="mt-12 text-center text-muted-foreground">
            No posts yet. Check back soon!
          </p>
        ) : (
          <div className="mt-10 space-y-8">
            {posts.map((post) => (
              <article key={post.slug} className="group">
                <Link href={`/blog/${post.slug}`} className="block">
                  <time className="text-xs text-muted-foreground">
                    {new Date(post.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </time>
                  <h2 className="mt-1 text-lg font-semibold text-foreground group-hover:text-brand-dark transition-colors">
                    {post.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground leading-relaxed">
                    {post.description}
                  </p>
                  <span className="mt-2 inline-block text-sm font-medium text-brand-dark">
                    Read more &rarr;
                  </span>
                </Link>
              </article>
            ))}
          </div>
        )}
        {/* Related Resources */}
        <section className="mt-16 border-t border-slate-200 pt-8">
          <h2 className="text-lg font-bold text-foreground">Explore More</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <Link
              href="/features/coi-tracking"
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#4CC78A]/30 hover:bg-[#4CC78A]/5"
            >
              <p className="text-sm font-semibold text-foreground">COI Tracking Features</p>
              <p className="mt-1 text-xs text-muted-foreground">See how SmartCOI automates certificate tracking</p>
            </Link>
            <Link
              href="/compare"
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#4CC78A]/30 hover:bg-[#4CC78A]/5"
            >
              <p className="text-sm font-semibold text-foreground">Compare Solutions</p>
              <p className="mt-1 text-xs text-muted-foreground">See how SmartCOI stacks up against alternatives</p>
            </Link>
            <Link
              href="/insurance-requirements"
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#4CC78A]/30 hover:bg-[#4CC78A]/5"
            >
              <p className="text-sm font-semibold text-foreground">Insurance Requirements by Property Type</p>
              <p className="mt-1 text-xs text-muted-foreground">Coverage guides for every commercial property type</p>
            </Link>
            <Link
              href="/for/property-management-companies"
              className="rounded-lg border border-slate-200 p-4 transition-colors hover:border-[#4CC78A]/30 hover:bg-[#4CC78A]/5"
            >
              <p className="text-sm font-semibold text-foreground">For Property Management Companies</p>
              <p className="mt-1 text-xs text-muted-foreground">Portfolio-wide compliance automation</p>
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
