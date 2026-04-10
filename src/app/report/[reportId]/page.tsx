import type { Metadata } from 'next';
import { ReportClient } from './report-client';

export const metadata: Metadata = {
  title: 'Compliance Report — SmartCOI',
  description: 'Your COI compliance report with coverage gaps, risk exposure, and recommended actions.',
};

export default function ReportPage() {
  return <ReportClient />;
}
