import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { FAQSection } from '@/components/landing/faq-section';
import { ComparisonTable } from '@/components/landing/comparison-table';
import { ReportPreviewMockup } from '@/components/landing/report-preview-mockup';
import { PricingTiers } from '@/components/landing/pricing-tiers';
import {
  Building2,
  HardHat,
  Truck,
  Hospital,
  Factory,
  Hotel,
  Store,
  Briefcase,
  Upload,
  Search,
  Bell,
  Shield,
  Users,
  Layers,
  FileText,
  Sparkles,
  Activity,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SmartCOI — Upload COIs, Get a Free Compliance Report in Minutes',
  description:
    'Upload your certificates of insurance and SmartCOI analyzes every coverage, expiration, endorsement, and additional insured. Your first compliance report is free — no credit card required.',
  alternates: {
    canonical: 'https://smartcoi.io',
  },
  openGraph: {
    title: 'SmartCOI — Upload COIs, Get a Free Compliance Report in Minutes',
    description:
      'Upload your certificates of insurance and SmartCOI analyzes every coverage, expiration, endorsement, and additional insured. Your first compliance report is free — no credit card required.',
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
        'AI-powered certificate of insurance compliance tracking. Free first report, then monitor continuously.',
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
    },
  ],
};

// ============================================================================
// Industry data
// ============================================================================

const INDUSTRIES = [
  { icon: Building2, name: 'Property Management', desc: 'Track vendor and tenant COIs across your portfolio', href: '/for/property-management-companies' },
  { icon: HardHat, name: 'Construction', desc: 'Verify subcontractor insurance before they step on site', href: '/for/construction' },
  { icon: Truck, name: 'Logistics', desc: 'Ensure every carrier meets your coverage requirements', href: '/for/logistics' },
  { icon: Hospital, name: 'Healthcare', desc: 'Manage vendor insurance compliance across facilities', href: '/for/healthcare' },
  { icon: Factory, name: 'Manufacturing', desc: 'Track supplier insurance and reduce supply chain risk', href: '/for/manufacturing' },
  { icon: Hotel, name: 'Hospitality', desc: 'Keep vendor compliance current across properties', href: '/for/hospitality' },
  { icon: Store, name: 'Retail', desc: 'Verify vendor insurance from delivery to renovation', href: '/for/retail' },
  { icon: Briefcase, name: 'Other', desc: 'Any business that tracks third-party insurance', href: '/signup' },
];

const FEATURES = [
  { icon: Search, title: 'AI-Powered Extraction', desc: 'Upload a PDF, get structured data in seconds. No manual data entry.' },
  { icon: Shield, title: 'Compliance Monitoring', desc: 'Set coverage requirements by type. See gaps instantly when a certificate falls short.' },
  { icon: Bell, title: 'Expiration Alerts', desc: 'Automated notifications at 60, 30, and 14 days before a coverage lapse.' },
  { icon: Users, title: 'Self-Service Portal', desc: 'Third parties upload renewed COIs directly through a link. No email chains.' },
  { icon: Layers, title: 'Industry Templates', desc: 'Pre-built coverage requirements for your industry. Customize as needed.' },
  { icon: Upload, title: 'Bulk Upload', desc: 'Onboard your entire roster in minutes. Drop 50 PDFs and let the AI do the rest.' },
];

// ============================================================================
// Page
// ============================================================================

export default function LandingPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      <main>
        {/* ================================================================ */}
        {/* HERO                                                             */}
        {/* ================================================================ */}
        <section className="relative overflow-hidden bg-white pt-32 pb-16 sm:pt-40 sm:pb-20">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center">
              <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-[#D1FADF] bg-[#E8FAF0] px-4 py-1.5 text-xs font-semibold text-[#065F46]">
                <Sparkles className="h-3.5 w-3.5" />
                First compliance report is free — no credit card
              </div>
              <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
                Upload Your COIs. See Your Compliance Gaps in Minutes.
              </h1>
              <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6B7280] sm:text-xl">
                AI analyzes every certificate — coverage limits, expirations, additional insured,
                endorsements — and delivers a detailed compliance report.{' '}
                <span className="text-[#111827] font-medium">Free for your first report.</span>
              </p>
              <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Link
                  href="/signup"
                  className="inline-flex items-center rounded-lg bg-[#73E2A7] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#4CC78A]"
                >
                  Upload Your COIs Free
                </Link>
                <Link
                  href="/#how-it-works"
                  className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-8 py-3.5 text-base font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
                >
                  See How It Works
                </Link>
              </div>
              <p className="mt-4 text-sm text-[#9CA3AF]">
                No credit card. No limits on the first report. Report ready in minutes.
              </p>
            </div>

            {/* Report preview mockup */}
            <div className="mt-16 sm:mt-20">
              <ReportPreviewMockup />
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* SOCIAL PROOF BAR                                                 */}
        {/* ================================================================ */}
        <section className="border-y border-[#F3F4F6] bg-[#FAFAFA] py-6">
          <div className="mx-auto max-w-[1200px] px-6">
            <p className="text-center text-sm font-medium text-[#6B7280]">
              Trusted by property managers, general contractors, logistics companies, and healthcare organizations
            </p>
          </div>
        </section>

        {/* ================================================================ */}
        {/* INDUSTRIES                                                       */}
        {/* ================================================================ */}
        <section className="bg-white py-24 sm:py-32" id="features">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
                Built for your industry
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
                SmartCOI adapts to how your industry works — from terminology to compliance templates.
              </p>
            </div>
            <div className="mt-16 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {INDUSTRIES.map((ind) => (
                <Link
                  key={ind.name}
                  href={ind.href}
                  className="rounded-xl border border-[#E5E7EB] bg-white p-6 transition-colors hover:border-[#D1D5DB]"
                >
                  <ind.icon className="h-6 w-6 text-[#9CA3AF]" strokeWidth={1.5} />
                  <h3 className="mt-4 text-sm font-semibold text-[#111827]">{ind.name}</h3>
                  <p className="mt-1 text-sm text-[#6B7280]">{ind.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* HOW IT WORKS                                                     */}
        {/* ================================================================ */}
        <section className="bg-[#FAFAFA] py-24 sm:py-32" id="how-it-works">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
                How it works
              </h2>
              <p className="mx-auto mt-4 max-w-2xl text-lg text-[#6B7280]">
                From a pile of PDFs to a full compliance report — in minutes.
              </p>
            </div>

            <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {/* Step 1 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8FAF0] text-base font-bold text-[#065F46]">
                    1
                  </div>
                  <Upload className="h-5 w-5 text-[#73E2A7]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#111827]">
                  Upload your certificates
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
                  Drag and drop any number of COIs — ACORD 25, ACORD 28, scans, photos. One file or
                  fifty. Any format, any quantity.
                </p>
              </div>

              {/* Step 2 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8FAF0] text-base font-bold text-[#065F46]">
                    2
                  </div>
                  <Sparkles className="h-5 w-5 text-[#73E2A7]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#111827]">
                  AI analyzes everything
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
                  Our AI infers vendor types, extracts coverages and limits, verifies additional
                  insured and endorsements, and flags every compliance gap.
                </p>
              </div>

              {/* Step 3 */}
              <div className="rounded-2xl border border-[#E5E7EB] bg-white p-8">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#E8FAF0] text-base font-bold text-[#065F46]">
                    3
                  </div>
                  <FileText className="h-5 w-5 text-[#73E2A7]" strokeWidth={1.75} />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-[#111827]">
                  Get your report
                </h3>
                <p className="mt-2 text-[15px] leading-relaxed text-[#6B7280]">
                  A full compliance breakdown — score, vendor-by-vendor gaps, dollar risk exposure,
                  and prioritized action items. Download as PDF or share.
                </p>
              </div>
            </div>

            {/* Step 4 — lighter / optional */}
            <div className="mt-6 rounded-2xl border border-dashed border-[#E5E7EB] bg-white/60 p-8 sm:p-10">
              <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#F3F4F6] text-base font-bold text-[#6B7280]">
                    4
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#374151]">
                        Activate monitoring when you&apos;re ready
                      </h3>
                      <Activity className="h-4 w-4 text-[#9CA3AF]" strokeWidth={1.75} />
                    </div>
                    <p className="mt-1 max-w-xl text-sm leading-relaxed text-[#6B7280]">
                      Once you&apos;ve seen your first report, upgrade for continuous tracking,
                      expiration alerts, vendor portal, and automated renewal requests.
                    </p>
                  </div>
                </div>
                <Link
                  href="/#pricing"
                  className="text-sm font-medium text-[#4CC78A] transition-colors hover:text-[#3aae72]"
                >
                  See monitoring plans &rarr;
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FEATURES                                                         */}
        {/* ================================================================ */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
                Everything you need to track COI compliance
              </h2>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <div key={f.title} className="rounded-xl border border-[#E5E7EB] bg-white p-6">
                  <f.icon className="h-6 w-6 text-[#73E2A7]" strokeWidth={1.5} />
                  <h3 className="mt-4 text-base font-semibold text-[#111827]">{f.title}</h3>
                  <p className="mt-2 text-sm text-[#6B7280] leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* COMPARISON TABLE                                                 */}
        {/* ================================================================ */}
        <ComparisonTable />

        {/* ================================================================ */}
        {/* PRICING                                                          */}
        {/* ================================================================ */}
        <PricingTiers />

        {/* ================================================================ */}
        {/* FAQ                                                              */}
        {/* ================================================================ */}
        <FAQSection />

        {/* ================================================================ */}
        {/* FOUNDER CREDIBILITY                                              */}
        {/* ================================================================ */}
        <section className="bg-[#FAFAFA] py-20 sm:py-24">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div className="relative mx-auto max-w-xl rounded-2xl border border-slate-200/60 bg-white px-8 py-10 shadow-sm">
              <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-[#73E2A7]" />
              <p className="text-base leading-relaxed text-slate-600 italic">
                &ldquo;I spent years chasing down expired certificates, digging through emails, and
                fighting with outdated software. Every operator I talked to had the same
                frustrations. So I built SmartCOI — upload your COIs, see your exposure in minutes,
                and only pay when you&apos;re ready to put compliance on autopilot.&rdquo;
              </p>
              <div className="mt-6 flex items-center justify-center gap-3">
                <div className="h-px w-6 bg-slate-200" />
                <p className="text-sm font-medium text-slate-500">
                  Tony
                  <span className="mx-1.5 text-slate-300">&middot;</span>
                  <span className="font-normal text-slate-400">
                    Property Manager &amp; Founder of SmartCOI
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FINAL CTA                                                        */}
        {/* ================================================================ */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
              Your first compliance report is on us.
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B7280]">
              Upload your COIs, get a full compliance breakdown in minutes. No credit card. No
              limits on the first report.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-[#73E2A7] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#4CC78A]"
              >
                Upload Your COIs Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
