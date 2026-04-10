import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Free COI Compliance Assessment | SmartCOI',
  description:
    'Get a free compliance assessment of your vendor certificates of insurance. We\'ll identify coverage gaps, expired policies, and missing endorsements. No cost, no commitment.',
  alternates: {
    canonical: 'https://smartcoi.io/free-assessment',
  },
  openGraph: {
    title: 'Free COI Compliance Assessment | SmartCOI',
    description:
      'Get a free compliance assessment of your vendor certificates of insurance. We\'ll identify coverage gaps, expired policies, and missing endorsements. No cost, no commitment.',
    type: 'website',
    url: 'https://smartcoi.io/free-assessment',
  },
};

export default function FreeAssessmentLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
