import type { Metadata } from 'next';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { HeroSection } from '@/components/landing/hero-section';
import { HowItWorks } from '@/components/landing/how-it-works';
import { WhoItsFor } from '@/components/landing/who-its-for';
import { BulkUploadSection } from '@/components/landing/bulk-upload-section';
import { StatsBar } from '@/components/landing/stats-bar';
import { FeaturesGrid } from '@/components/landing/features-grid';
import { TestimonialSection } from '@/components/landing/testimonial-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { ResourcesSection } from '@/components/landing/resources-section';
import { FAQSection } from '@/components/landing/faq-section';
import { FinalCTA } from '@/components/landing/final-cta';

export const metadata: Metadata = {
  title: 'SmartCOI: AI-Powered COI Tracking for Property Managers',
  description:
    'Automate certificate of insurance compliance across your portfolio. AI extracts data from COI PDFs, checks compliance, and sends follow-ups automatically.',
  alternates: {
    canonical: 'https://smartcoi.io',
  },
  openGraph: {
    title: 'SmartCOI: AI-Powered COI Tracking for Property Managers',
    description:
      'Automate certificate of insurance compliance across your portfolio. AI extracts data from COI PDFs, checks compliance, and sends follow-ups automatically.',
    type: 'website',
    url: 'https://smartcoi.io',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      name: 'SmartCOI',
      url: 'https://smartcoi.io',
      logo: 'https://smartcoi.io/logo-icon.svg',
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'support@smartcoi.io',
        contactType: 'customer support',
      },
    },
    {
      '@type': 'SoftwareApplication',
      name: 'SmartCOI',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'AI-powered certificate of insurance compliance tracking for commercial property managers.',
      offers: {
        '@type': 'Offer',
        price: '79',
        priceCurrency: 'USD',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'How does the 14-day free trial work?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Sign up with just your email — no credit card required. You get full access to all features on the Starter plan for 14 days. Upload certificates, set up compliance templates, and see your dashboard populate in real time. If you decide SmartCOI is right for you, choose a plan before your trial ends. If not, your account simply deactivates — no charges, no hassle.',
          },
        },
        {
          '@type': 'Question',
          name: 'What file formats do you accept?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SmartCOI accepts PDF files — the standard format for certificates of insurance. You can upload individual files or drag and drop up to 50 PDFs at once using our bulk upload feature.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can vendors and tenants upload their own COIs?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Every account includes a self-service portal where vendors and tenants can upload certificates directly through a secure link — no login or account creation required on their end. You can include the portal link in your onboarding emails or compliance notices.',
          },
        },
        {
          '@type': 'Question',
          name: 'What happens if I reach my certificate limit?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "You'll get a notification when you're approaching your plan's limit. You can upgrade to a higher tier at any time — your data and settings carry over instantly. If you're on a trial, the 50-certificate limit gives you plenty of room to evaluate the platform.",
          },
        },
        {
          '@type': 'Question',
          name: 'How accurate is the AI extraction?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "SmartCOI's AI is trained specifically on ACORD certificate formats and achieves 99%+ accuracy on standard fields including coverage types, policy limits, expiration dates, carrier names, and named insureds. Every extraction is visible for review, so you always have final say.",
          },
        },
        {
          '@type': 'Question',
          name: 'Can I import data from my current system?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'If you\'re currently tracking COIs in spreadsheets or another tool, the fastest way to migrate is our bulk upload feature — simply upload all your existing certificate PDFs and SmartCOI will extract the data and build your vendor roster automatically. No manual data entry or CSV mapping required.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is my data secure?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. SmartCOI uses industry-standard encryption for data in transit and at rest, runs on secure cloud infrastructure, and follows best practices for authentication and access control. Your certificate data is never shared with third parties.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can I cancel anytime?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. There are no long-term contracts. Monthly plans can be canceled at any time. Annual plans are billed upfront for the year but you can cancel renewal at any time. If you cancel, you retain access through the end of your billing period.',
          },
        },
      ],
    },
  ],
};

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main>
        <HeroSection />
        <HowItWorks />
        <WhoItsFor />
        <BulkUploadSection />
        <StatsBar />
        <FeaturesGrid />
        <TestimonialSection />
        <PricingSection />
        <FAQSection />
        <ResourcesSection />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
