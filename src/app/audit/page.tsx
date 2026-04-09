import type { Metadata } from 'next';
import Link from 'next/link';
import { Navbar } from '@/components/landing/navbar';
import { Footer } from '@/components/landing/footer';
import {
  ShieldCheck,
  Upload,
  Search,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Users,
  Building2,
  HardHat,
  Briefcase,
  ArrowRight,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'COI Compliance Audit Service | SmartCOI',
  description:
    'Get a complete COI compliance audit delivered in 48 hours. We analyze every certificate and deliver a detailed report showing coverage gaps, expirations, and compliance issues. $299 one-time.',
  alternates: {
    canonical: 'https://smartcoi.io/audit',
  },
  openGraph: {
    title: 'COI Compliance Audit Service | SmartCOI',
    description:
      'Get a complete COI compliance audit delivered in 48 hours. We analyze every certificate and deliver a detailed report showing coverage gaps, expirations, and compliance issues. $299 one-time.',
    type: 'website',
    url: 'https://smartcoi.io/audit',
  },
};

const STRIPE_LINK = 'https://buy.stripe.com/00weVf3TwfSkbUocpmaZi00';

const steps = [
  {
    number: '01',
    title: 'Pay & Submit',
    description:
      'Purchase your audit and send us your COI files via email or secure upload. Any format works — PDFs, scans, even photos.',
    icon: Upload,
  },
  {
    number: '02',
    title: 'We Analyze Everything',
    description:
      'Our AI-powered platform extracts and verifies every certificate against industry-standard requirements. A compliance expert reviews the results.',
    icon: Search,
  },
  {
    number: '03',
    title: 'Get Your Report',
    description:
      'Receive a branded PDF compliance report within 48 hours showing every vendor\u2019s status, coverage gaps, expired policies, and recommended actions.',
    icon: FileText,
  },
];

const reportItems = [
  { text: 'Compliance status for every vendor/contractor', icon: CheckCircle2 },
  { text: 'Coverage gap analysis (GL, auto, workers comp, umbrella)', icon: AlertTriangle },
  { text: 'Expired and expiring policy alerts', icon: Clock },
  { text: 'Missing additional insured endorsements', icon: ShieldCheck },
  { text: 'Certificate holder verification', icon: FileText },
  { text: 'Prioritized action items ranked by risk', icon: ArrowRight },
];

const audiences = [
  {
    text: 'Property managers tracking vendor insurance across multiple properties',
    icon: Building2,
  },
  {
    text: 'General contractors managing subcontractor compliance',
    icon: HardHat,
  },
  {
    text: 'Operations teams responsible for vendor risk management',
    icon: Users,
  },
  {
    text: 'Any company that knows their COI tracking is a mess but doesn\u2019t have time to fix it',
    icon: Briefcase,
  },
];

export default function AuditPage() {
  return (
    <>
      <Navbar />
      <main className="pt-24 pb-0">
        {/* Hero */}
        <section className="bg-white pb-20 pt-16 sm:pb-28 sm:pt-20">
          <div className="mx-auto max-w-3xl px-6 text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#4CC78A]">
              Compliance Audit Service
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
              Get a Complete COI Compliance Audit in 48 Hours
            </h1>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-500">
              Send us your certificates of insurance. We&apos;ll analyze every one and deliver a
              detailed compliance report showing exactly where you&apos;re exposed — coverage gaps,
              expired policies, missing endorsements, and non-compliant vendors.
            </p>
            <div className="mt-10">
              <a
                href={STRIPE_LINK}
                className="inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 transition-colors hover:bg-[#4CC78A]"
              >
                Get Your Audit — $299
              </a>
              <p className="mt-4 text-sm text-slate-400">
                One-time fee. No subscription required. Report delivered within 48 hours.
              </p>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="bg-[#FAFAFA] py-20 sm:py-28">
          <div className="mx-auto max-w-5xl px-6">
            <h2 className="text-center text-3xl font-bold text-slate-950 sm:text-4xl">
              How It Works
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
              Three simple steps to a fully audited portfolio.
            </p>
            <div className="mt-16 grid gap-10 sm:grid-cols-3">
              {steps.map((step) => (
                <div key={step.number} className="text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#73E2A7]/15">
                    <step.icon className="h-6 w-6 text-[#4CC78A]" />
                  </div>
                  <p className="mt-5 text-xs font-semibold uppercase tracking-widest text-[#4CC78A]">
                    Step {step.number}
                  </p>
                  <h3 className="mt-2 text-lg font-semibold text-slate-950">{step.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's In Your Report */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold text-slate-950 sm:text-4xl">
              What&apos;s In Your Report
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-center text-lg text-slate-500">
              A comprehensive compliance assessment of your entire vendor portfolio.
            </p>
            <div className="mt-12 grid gap-4 sm:grid-cols-2">
              {reportItems.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-3 rounded-xl border border-slate-200/80 bg-white p-4"
                >
                  <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4CC78A]" />
                  <span className="text-sm text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Who This Is For */}
        <section className="bg-[#FAFAFA] py-20 sm:py-28">
          <div className="mx-auto max-w-3xl px-6">
            <h2 className="text-center text-3xl font-bold text-slate-950 sm:text-4xl">
              Who This Is For
            </h2>
            <div className="mt-12 space-y-4">
              {audiences.map((item) => (
                <div
                  key={item.text}
                  className="flex items-start gap-4 rounded-xl border border-slate-200/80 bg-white p-5"
                >
                  <item.icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#4CC78A]" />
                  <span className="text-base text-slate-700">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section className="bg-white py-20 sm:py-28">
          <div className="mx-auto max-w-xl px-6 text-center">
            <p className="text-6xl font-bold text-slate-950">$299</p>
            <p className="mt-4 text-lg font-medium text-slate-700">
              Complete compliance audit of your entire vendor portfolio
            </p>
            <div className="mx-auto mt-8 max-w-sm space-y-3 text-left">
              {[
                'One-time fee — no subscription, no hidden costs',
                'Delivered as a branded PDF report within 48 hours',
                'Includes up to 50 certificates. Need more? Contact us.',
              ].map((line) => (
                <div key={line} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#4CC78A]" />
                  <span className="text-sm text-slate-600">{line}</span>
                </div>
              ))}
            </div>
            <div className="mt-10">
              <a
                href={STRIPE_LINK}
                className="inline-flex h-12 items-center rounded-xl bg-[#73E2A7] px-8 text-sm font-bold text-slate-950 transition-colors hover:bg-[#4CC78A]"
              >
                Get Your Audit Now
              </a>
            </div>
            <p className="mt-4 text-sm text-slate-400">
              Questions? Email{' '}
              <a
                href="mailto:tony@smartcoi.io"
                className="text-slate-500 underline transition-colors hover:text-slate-700"
              >
                tony@smartcoi.io
              </a>
            </p>
          </div>
        </section>

        {/* Trust / Credibility */}
        <section className="bg-[#FAFAFA] py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <div className="relative mx-auto max-w-xl rounded-2xl border border-slate-200/60 bg-white px-8 py-8 shadow-sm">
              <div className="absolute left-0 top-6 bottom-6 w-[3px] rounded-full bg-[#73E2A7]" />
              <p className="text-base leading-relaxed text-slate-600 italic">
                &ldquo;I spent years chasing down expired certificates, digging through emails, and
                fighting with outdated software. Every property manager I talked to had the same
                frustrations. So I built SmartCOI — a simple, affordable way to put insurance
                compliance on autopilot.&rdquo;
              </p>
              <div className="mt-5 flex items-center justify-center gap-3">
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

        {/* Soft SaaS Upsell */}
        <section className="border-t border-slate-200 bg-white py-16 sm:py-20">
          <div className="mx-auto max-w-2xl px-6 text-center">
            <p className="text-lg font-semibold text-slate-950">
              Want continuous monitoring instead of a one-time snapshot?
            </p>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-relaxed text-slate-500">
              SmartCOI tracks your compliance automatically — real-time alerts, vendor self-service
              portal, and AI-powered extraction. Starting at $79/month.
            </p>
            <Link
              href="/"
              className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-[#4CC78A] transition-colors hover:text-[#3aae72]"
            >
              Learn More
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
