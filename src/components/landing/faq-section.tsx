'use client';

import { useState, useCallback } from 'react';
import { AnimateIn } from './animate-in';

/* ─── FAQ Data ─── */

const FAQS = [
  {
    q: 'How does the 14-day free trial work?',
    a: 'Sign up with just your email — no credit card required. You get full access to all features on the Starter plan for 14 days. Upload certificates, set up compliance templates, and see your dashboard populate in real time. If you decide SmartCOI is right for you, choose a plan before your trial ends. If not, your account simply deactivates — no charges, no hassle.',
  },
  {
    q: 'What file formats do you accept?',
    a: 'SmartCOI accepts PDF files — the standard format for certificates of insurance. You can upload individual files or drag and drop up to 50 PDFs at once using our bulk upload feature.',
  },
  {
    q: 'Can vendors and tenants upload their own COIs?',
    a: 'Yes. Every account includes a self-service portal where vendors and tenants can upload certificates directly through a secure link — no login or account creation required on their end. You can include the portal link in your onboarding emails or compliance notices.',
  },
  {
    q: 'What happens if I reach my certificate limit?',
    a: "You'll get a notification when you're approaching your plan's limit. You can upgrade to a higher tier at any time — your data and settings carry over instantly. If you're on a trial, the 50-certificate limit gives you plenty of room to evaluate the platform.",
  },
  {
    q: 'How accurate is the AI extraction?',
    a: "SmartCOI's AI is trained specifically on ACORD certificate formats and achieves 99%+ accuracy on standard fields including coverage types, policy limits, expiration dates, carrier names, named insureds, and endorsements (CG 20 10, CG 20 37, Waiver of Subrogation). Every extraction is visible for review, so you always have final say.",
  },
  {
    q: 'Can I import data from my current system?',
    a: 'If you\'re currently tracking COIs in spreadsheets or another tool, the fastest way to migrate is our bulk upload feature — simply upload all your existing certificate PDFs and SmartCOI will extract the data and build your vendor roster automatically. No manual data entry or CSV mapping required.',
  },
  {
    q: 'Is my data secure?',
    a: 'Yes. SmartCOI uses industry-standard encryption for data in transit and at rest, runs on secure cloud infrastructure, and follows best practices for authentication and access control. Your certificate data is never shared with third parties.',
  },
  {
    q: 'Can I cancel anytime?',
    a: 'Yes. There are no long-term contracts. Monthly plans can be canceled at any time. Annual plans are billed upfront for the year but you can cancel renewal at any time. If you cancel, you retain access through the end of your billing period.',
  },
];

/* ─── Chevron Icon ─── */

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      className={`h-4 w-4 flex-shrink-0 text-emerald-500 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

/* ─── Component ─── */

export function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = useCallback((index: number) => {
    setOpenIndex((prev) => (prev === index ? null : index));
  }, []);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              FAQ
            </p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Frequently Asked Questions
            </h2>
          </div>
        </AnimateIn>

        <AnimateIn delay={100}>
          <div className="mx-auto mt-12 max-w-3xl divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQS.map((faq, i) => {
              const isOpen = openIndex === i;
              return (
                <div key={i}>
                  <button
                    type="button"
                    onClick={() => toggle(i)}
                    className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors hover:bg-slate-50/50"
                    aria-expanded={isOpen}
                  >
                    <span className="text-sm font-semibold text-slate-900 sm:text-[15px]">
                      {faq.q}
                    </span>
                    <ChevronIcon open={isOpen} />
                  </button>
                  <div
                    className={`grid transition-all duration-200 ease-in-out ${
                      isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <p className="px-6 pb-5 text-sm leading-relaxed text-slate-500">
                        {faq.a}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
