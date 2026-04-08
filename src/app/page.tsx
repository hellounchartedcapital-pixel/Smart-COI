import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import { FAQSection } from '@/components/landing/faq-section';
import { ComparisonTable } from '@/components/landing/comparison-table';
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
  Check,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'SmartCOI — AI-Powered COI Tracking & Compliance',
  description:
    'Automate certificate of insurance tracking with AI. Upload COIs, verify compliance, and get expiration alerts. Built for property management, construction, logistics, healthcare, and more.',
  alternates: {
    canonical: 'https://smartcoi.io',
  },
  openGraph: {
    title: 'SmartCOI — AI-Powered COI Tracking & Compliance',
    description:
      'Automate certificate of insurance tracking with AI. Upload COIs, verify compliance, and get expiration alerts. Built for property management, construction, logistics, healthcare, and more.',
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
        'AI-powered certificate of insurance compliance tracking for any industry.',
      offers: {
        '@type': 'Offer',
        price: '79',
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

const PLANS = [
  { name: 'Starter', monthly: 79, annual: 63, certs: 'Up to 50', highlight: false },
  { name: 'Growth', monthly: 149, annual: 119, certs: 'Up to 150', highlight: true },
  { name: 'Professional', monthly: 249, annual: 199, certs: 'Unlimited', highlight: false },
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
        <section className="relative overflow-hidden bg-white pt-32 pb-20 sm:pt-40 sm:pb-28">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <h1 className="mx-auto max-w-3xl text-4xl font-bold tracking-tight text-[#111827] sm:text-5xl lg:text-[56px] lg:leading-[1.1]">
              AI-Powered COI Tracking for Every Industry
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-[#6B7280] sm:text-xl">
              Upload certificates of insurance, let AI extract the data, track compliance automatically,
              and get alerted before coverage lapses.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-[#73E2A7] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#4CC78A]"
              >
                Start Free Trial
              </Link>
              <Link
                href="/#how-it-works"
                className="inline-flex items-center rounded-lg border border-[#E5E7EB] bg-white px-8 py-3.5 text-base font-medium text-[#374151] transition-colors hover:bg-[#F9FAFB]"
              >
                See How It Works
              </Link>
            </div>
            <p className="mt-4 text-sm text-[#9CA3AF]">
              14-day free trial. No credit card required.
            </p>
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
                Three steps to automated compliance.
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-3">
              {[
                {
                  step: '1',
                  title: 'Upload',
                  desc: 'Drop your COIs — one at a time or in bulk. Our AI reads ACORD 25 forms instantly.',
                },
                {
                  step: '2',
                  title: 'Track',
                  desc: 'AI extracts coverages, limits, dates, and named insureds. See compliance status at a glance.',
                },
                {
                  step: '3',
                  title: 'Stay Compliant',
                  desc: 'Get alerts before certificates expire. Send renewal requests automatically.',
                },
              ].map((s) => (
                <div key={s.step} className="text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E8FAF0] text-lg font-bold text-[#111827]">
                    {s.step}
                  </div>
                  <h3 className="mt-5 text-lg font-semibold text-[#111827]">{s.title}</h3>
                  <p className="mt-2 text-[15px] text-[#6B7280]">{s.desc}</p>
                </div>
              ))}
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
        <section className="bg-[#FAFAFA] py-24 sm:py-32" id="pricing">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
                Simple, transparent pricing
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B7280]">
                All plans include all features. 14-day free trial, no credit card required.
              </p>
            </div>
            <div className="mt-16 grid gap-6 sm:grid-cols-3 max-w-4xl mx-auto">
              {PLANS.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl border bg-white p-8 ${
                    plan.highlight ? 'border-[#73E2A7] ring-1 ring-[#73E2A7]' : 'border-[#E5E7EB]'
                  }`}
                >
                  {plan.highlight && (
                    <span className="inline-block rounded-full bg-[#E8FAF0] px-3 py-1 text-xs font-medium text-[#065F46] mb-4">
                      Most Popular
                    </span>
                  )}
                  <h3 className="text-lg font-semibold text-[#111827]">{plan.name}</h3>
                  <div className="mt-3">
                    <span className="text-4xl font-bold text-[#111827]">${plan.annual}</span>
                    <span className="text-[#6B7280]">/mo</span>
                  </div>
                  <p className="mt-1 text-sm text-[#9CA3AF]">
                    ${plan.monthly}/mo billed monthly
                  </p>
                  <ul className="mt-6 space-y-3 text-sm text-[#374151]">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#73E2A7]" />
                      {plan.certs} certificates
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#73E2A7]" />
                      All features included
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-[#73E2A7]" />
                      14-day free trial
                    </li>
                    {plan.name === 'Professional' && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-[#73E2A7]" />
                        Priority support
                      </li>
                    )}
                  </ul>
                  <Link
                    href="/signup"
                    className={`mt-8 block w-full rounded-lg py-3 text-center text-sm font-semibold transition-colors ${
                      plan.highlight
                        ? 'bg-[#73E2A7] text-white hover:bg-[#4CC78A]'
                        : 'border border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F9FAFB]'
                    }`}
                  >
                    Start Free Trial
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ================================================================ */}
        {/* FAQ                                                              */}
        {/* ================================================================ */}
        <FAQSection />

        {/* ================================================================ */}
        {/* FINAL CTA                                                        */}
        {/* ================================================================ */}
        <section className="bg-white py-24 sm:py-32">
          <div className="mx-auto max-w-[1200px] px-6 text-center">
            <h2 className="text-3xl font-bold text-[#111827] sm:text-4xl">
              Ready to automate your COI compliance?
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-[#6B7280]">
              Start your 14-day free trial. No credit card required.
            </p>
            <div className="mt-8">
              <Link
                href="/signup"
                className="inline-flex items-center rounded-lg bg-[#73E2A7] px-8 py-3.5 text-base font-semibold text-white transition-colors hover:bg-[#4CC78A]"
              >
                Get Started Free
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
