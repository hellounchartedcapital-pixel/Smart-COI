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
import { FinalCTA } from '@/components/landing/final-cta';

export const metadata: Metadata = {
  title: 'SmartCOI — AI-Powered COI Compliance Tracking for Property Managers',
  description:
    'Automate certificate of insurance tracking for your commercial properties. AI-powered compliance checking, automated follow-ups, and portfolio-wide visibility.',
  alternates: {
    canonical: 'https://smartcoi.io',
  },
  openGraph: {
    title: 'SmartCOI — AI-Powered COI Compliance Tracking for Property Managers',
    description:
      'Automate certificate of insurance tracking for your commercial properties. AI-powered compliance checking, automated follow-ups, and portfolio-wide visibility.',
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
          name: 'What is COI compliance tracking?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'COI compliance tracking is the process of collecting, reviewing, and monitoring Certificates of Insurance from vendors and tenants to ensure they carry the insurance coverage required by their contracts or leases.',
          },
        },
        {
          '@type': 'Question',
          name: 'How does SmartCOI extract data from insurance certificates?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SmartCOI uses AI to read uploaded COI PDFs and extract structured data including coverage types, policy limits, expiration dates, carrier names, and entity information — typically in under 30 seconds.',
          },
        },
        {
          '@type': 'Question',
          name: 'Can vendors upload their own certificates?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. SmartCOI provides a self-service upload portal where vendors and tenants can upload their certificates directly. The AI extracts and checks the data automatically, and property managers are notified only when review is needed.',
          },
        },
        {
          '@type': 'Question',
          name: 'What happens when a certificate expires?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'SmartCOI automatically tracks expiration dates and sends configurable notifications to vendors/tenants before their certificates expire, with escalating follow-ups if they remain non-compliant.',
          },
        },
        {
          '@type': 'Question',
          name: 'Is there a free trial?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Yes. Upload up to 50 COIs free and see your compliance dashboard in minutes — no credit card required. All plans include a 14-day free trial with full access to every feature.',
          },
        },
        {
          '@type': 'Question',
          name: 'Does SmartCOI replace my insurance broker or legal counsel?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'No. SmartCOI is a compliance tracking tool that assists property managers with data extraction and monitoring. It does not provide legal, insurance, or compliance advice. Users should always review extracted data and consult professionals for compliance decisions.',
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
        <ResourcesSection />
        <FinalCTA />
      </main>

      <Footer />
    </>
  );
}
