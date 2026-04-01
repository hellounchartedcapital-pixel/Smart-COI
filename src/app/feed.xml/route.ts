import { getAllPosts } from '@/lib/blog';

const SITE_URL = 'https://smartcoi.io';

export async function GET() {
  const posts = getAllPosts();

  // Pinned money pages at the top
  const pinnedItems = [
    {
      title: 'Best COI Tracking Software for Property Managers (2026)',
      description: 'Compare the top COI tracking software for commercial property managers. AI extraction, automated compliance, vendor portals, and transparent pricing.',
      link: `${SITE_URL}/coi-tracking-software`,
      pubDate: new Date('2026-03-01').toUTCString(),
      guid: `${SITE_URL}/coi-tracking-software`,
    },
    {
      title: 'Certificate of Insurance Tracking Software | SmartCOI',
      description: 'Automate certificate of insurance tracking with AI extraction and instant compliance checks. Built for commercial property managers.',
      link: `${SITE_URL}/certificate-of-insurance-tracking`,
      pubDate: new Date('2026-03-01').toUTCString(),
      guid: `${SITE_URL}/certificate-of-insurance-tracking`,
    },
    {
      title: 'Best COI Management Software for 2026 (Compared)',
      description: 'Compare the top COI management software for property managers. Pricing, AI features, onboarding, and honest pros and cons for each platform.',
      link: `${SITE_URL}/blog/best-coi-management-software`,
      pubDate: new Date('2026-04-01').toUTCString(),
      guid: `${SITE_URL}/blog/best-coi-management-software`,
    },
  ];

  // Blog posts
  const blogItems = posts.map((post) => ({
    title: post.title,
    description: post.description,
    link: `${SITE_URL}/blog/${post.slug}`,
    pubDate: new Date(post.date).toUTCString(),
    guid: `${SITE_URL}/blog/${post.slug}`,
  }));

  const allItems = [...pinnedItems, ...blogItems];

  const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>SmartCOI Blog — COI Compliance for Property Managers</title>
    <link>${SITE_URL}/blog</link>
    <description>Guides, comparisons, and best practices for certificate of insurance tracking and compliance automation.</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${SITE_URL}/feed.xml" rel="self" type="application/rss+xml" />
${allItems
  .map(
    (item) => `    <item>
      <title><![CDATA[${item.title}]]></title>
      <description><![CDATA[${item.description}]]></description>
      <link>${item.link}</link>
      <guid isPermaLink="true">${item.guid}</guid>
      <pubDate>${item.pubDate}</pubDate>
    </item>`
  )
  .join('\n')}
  </channel>
</rss>`;

  return new Response(rss, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600, s-maxage=3600',
    },
  });
}
