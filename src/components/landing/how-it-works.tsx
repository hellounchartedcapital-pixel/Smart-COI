'use client';

import { useState } from 'react';
import { AnimateIn } from './animate-in';
import { cn } from '@/lib/utils';

/* ─── Icons ─── */

function IconUpload({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function IconCpu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
      <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
      <line x1="20" y1="9" x2="23" y2="9" /><line x1="20" y1="14" x2="23" y2="14" />
      <line x1="1" y1="9" x2="4" y2="9" /><line x1="1" y1="14" x2="4" y2="14" />
    </svg>
  );
}

function IconClipboard({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 4h2a2 2 0 012 2v14a2 2 0 01-2 2H6a2 2 0 01-2-2V6a2 2 0 012-2h2" />
      <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
    </svg>
  );
}

function IconShieldCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9,12 11,14 15,10" />
    </svg>
  );
}

function IconBell({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function IconBarChart({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  );
}

/* ─── Step Data ─── */

const steps = [
  {
    icon: <IconUpload className="h-6 w-6" />,
    title: 'Upload COIs',
    shortTitle: 'Upload',
    description: 'Bulk upload PDFs or have vendors and tenants submit directly through the self-service portal. No manual data entry required.',
    visual: (
      <div className="space-y-2.5">
        {[
          { name: 'acme-cleaning-coi.pdf', status: 'Uploaded', color: 'bg-[#73E2A7]' },
          { name: 'pacific-electric-coi.pdf', status: 'Uploaded', color: 'bg-[#73E2A7]' },
          { name: 'mesa-landscaping-coi.pdf', status: 'Processing...', color: 'bg-blue-400 animate-pulse' },
          { name: 'vendor-d-certificate.pdf', status: 'Queued', color: 'bg-slate-300' },
        ].map((file) => (
          <div key={file.name} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', file.color)} />
            <span className="text-sm text-slate-700 truncate">{file.name}</span>
            <span className="ml-auto text-xs text-slate-400 shrink-0">{file.status}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconCpu className="h-6 w-6" />,
    title: 'AI Extracts Data',
    shortTitle: 'Extract',
    description: 'AI reads every certificate and pulls coverage types, policy limits, expiration dates, carrier names, and named insureds — automatically.',
    visual: (
      <div className="rounded-lg border border-slate-100 bg-white p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-[#4CC78A] mb-4">
          <div className="h-2 w-2 rounded-full bg-[#73E2A7]" />
          Extraction complete — 12 fields found
        </div>
        <div className="space-y-3">
          {[
            { field: 'Insured', value: 'Acme Cleaning Services LLC' },
            { field: 'General Liability', value: '$1,000,000 / $2,000,000' },
            { field: 'Workers\' Comp', value: '$500,000 / $500,000' },
            { field: 'Auto Liability', value: '$1,000,000 CSL' },
            { field: 'Expiration', value: '03/15/2027' },
            { field: 'Additional Insured', value: 'Westfield Tower LLC' },
          ].map((item) => (
            <div key={item.field} className="flex items-start justify-between gap-4">
              <span className="text-xs font-medium text-slate-400 shrink-0 w-32">{item.field}</span>
              <span className="text-sm text-slate-700 text-right">{item.value}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <IconClipboard className="h-6 w-6" />,
    title: 'Set Requirements',
    shortTitle: 'Configure',
    description: 'Define insurance requirements per property using built-in templates. Set coverage types, minimum limits, and additional insured requirements for vendors and tenants.',
    visual: (
      <div className="rounded-lg border border-slate-100 bg-white p-5">
        <p className="text-xs font-semibold text-slate-900 mb-3">Vendor — Standard Risk Template</p>
        <div className="space-y-2.5">
          {[
            { coverage: 'Commercial General Liability', limit: '$1M / $2M', required: true },
            { coverage: 'Workers\' Compensation', limit: 'Statutory', required: true },
            { coverage: 'Commercial Auto', limit: '$1M CSL', required: true },
            { coverage: 'Umbrella / Excess', limit: '$2M', required: false },
          ].map((req) => (
            <div key={req.coverage} className="flex items-center gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
              <div className={cn('h-4 w-4 rounded border-2 flex items-center justify-center shrink-0', req.required ? 'border-[#73E2A7] bg-[#73E2A7]' : 'border-slate-300')}>
                {req.required && (
                  <svg className="h-2.5 w-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20,6 9,17 4,12" /></svg>
                )}
              </div>
              <span className="text-sm text-slate-700 flex-1">{req.coverage}</span>
              <span className="text-xs text-slate-400">{req.limit}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <IconShieldCheck className="h-6 w-6" />,
    title: 'Automatic Compliance Check',
    shortTitle: 'Check',
    description: 'SmartCOI checks every certificate against your specific requirements and flags gaps — coverage shortfalls, missing policies, and expired certificates.',
    visual: (
      <div className="rounded-lg border border-slate-100 bg-white p-5">
        <p className="text-xs font-semibold text-slate-900 mb-3">Compliance Results — Acme Cleaning</p>
        <div className="space-y-2">
          {[
            { coverage: 'General Liability', status: 'Met', statusColor: 'text-[#4CC78A]', bgColor: 'bg-[#73E2A7]/10' },
            { coverage: 'Workers\' Comp', status: 'Gap — below minimum', statusColor: 'text-red-500', bgColor: 'bg-red-50' },
            { coverage: 'Commercial Auto', status: 'Met', statusColor: 'text-[#4CC78A]', bgColor: 'bg-[#73E2A7]/10' },
            { coverage: 'Additional Insured', status: 'Met', statusColor: 'text-[#4CC78A]', bgColor: 'bg-[#73E2A7]/10' },
          ].map((item) => (
            <div key={item.coverage} className={cn('flex items-center justify-between rounded-lg px-4 py-2.5', item.bgColor)}>
              <span className="text-sm text-slate-700">{item.coverage}</span>
              <span className={cn('text-xs font-semibold', item.statusColor)}>{item.status}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    icon: <IconBell className="h-6 w-6" />,
    title: 'Automated Follow-Up',
    shortTitle: 'Notify',
    description: 'Non-compliant vendors and tenants get notified automatically with clear instructions on what needs to be fixed. Configurable escalation schedules ensure nothing falls through the cracks.',
    visual: (
      <div className="space-y-3">
        {[
          { label: '30 days before expiry', color: 'bg-amber-400', tag: 'First notice', sent: 'Sent' },
          { label: '14 days before expiry', color: 'bg-orange-400', tag: 'Reminder', sent: 'Sent' },
          { label: '7 days before expiry', color: 'bg-red-400', tag: 'Urgent', sent: 'Scheduled' },
          { label: 'Coverage gap detected', color: 'bg-red-500', tag: 'Immediate', sent: 'Sent' },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 rounded-lg border border-slate-100 bg-white px-4 py-3">
            <div className={cn('h-2.5 w-2.5 rounded-full shrink-0', item.color)} />
            <div className="flex-1 min-w-0">
              <span className="text-sm text-slate-700">{item.label}</span>
            </div>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">{item.tag}</span>
            <span className="text-xs text-slate-400 shrink-0">{item.sent}</span>
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: <IconBarChart className="h-6 w-6" />,
    title: 'Stay Compliant',
    shortTitle: 'Monitor',
    description: 'Your dashboard shows real-time compliance status across your entire portfolio. Know exactly who\u2019s compliant, who\u2019s expiring, and who needs attention.',
    visual: (
      <div className="rounded-lg border border-slate-100 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-semibold text-slate-900">Portfolio Compliance</p>
          <span className="text-2xl font-extrabold text-[#4CC78A]">92%</span>
        </div>
        <div className="mb-4 flex h-3 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="bg-[#73E2A7]" style={{ width: '92%' }} />
          <div className="bg-amber-400" style={{ width: '5%' }} />
          <div className="bg-red-400" style={{ width: '3%' }} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Compliant', count: 135, color: 'bg-[#73E2A7]' },
            { label: 'Expiring', count: 7, color: 'bg-amber-400' },
            { label: 'Gaps', count: 5, color: 'bg-red-400' },
          ].map((item) => (
            <div key={item.label} className="rounded-lg bg-slate-50 p-3 text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <div className={cn('h-2 w-2 rounded-full', item.color)} />
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">{item.count}</p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
];

/* ─── Component ─── */

export function HowItWorks() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section id="how-it-works" className="scroll-mt-20 bg-slate-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              How It Works
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              From Upload to Compliant in Minutes
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Six simple steps to fully automated compliance tracking.
            </p>
          </div>
        </AnimateIn>

        {/* Desktop stepper navigation */}
        <AnimateIn delay={100}>
          <div className="mt-12 hidden sm:block">
            <div className="relative flex items-center justify-between">
              {/* Connecting line */}
              <div className="absolute top-5 left-5 right-5 h-px bg-slate-200" />
              <div
                className="absolute top-5 left-5 h-px bg-[#73E2A7] transition-all duration-500"
                style={{ width: `${(activeStep / (steps.length - 1)) * (100 - (10 / steps.length))}%` }}
              />

              {steps.map((step, i) => (
                <button
                  key={step.title}
                  onClick={() => setActiveStep(i)}
                  className="relative z-10 flex flex-col items-center gap-2 group"
                >
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300',
                      i <= activeStep
                        ? 'border-[#73E2A7] bg-[#73E2A7] text-white'
                        : 'border-slate-200 bg-white text-slate-400 group-hover:border-[#73E2A7]/40'
                    )}
                  >
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <span
                    className={cn(
                      'text-xs font-medium transition-colors',
                      i === activeStep ? 'text-slate-900' : 'text-slate-400 group-hover:text-slate-600'
                    )}
                  >
                    {step.shortTitle}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </AnimateIn>

        {/* Desktop content area */}
        <AnimateIn delay={200}>
          <div className="mt-10 hidden sm:block">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start">
              <div className="lg:sticky lg:top-24">
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#73E2A7]/10 text-[#4CC78A]">
                    {steps[activeStep].icon}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-[#4CC78A]">Step {activeStep + 1} of {steps.length}</p>
                    <h3 className="text-xl font-bold text-slate-950">{steps[activeStep].title}</h3>
                  </div>
                </div>
                <p className="text-base leading-relaxed text-slate-500">
                  {steps[activeStep].description}
                </p>
              </div>

              <div
                key={activeStep}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-5 sm:p-6 animate-in fade-in duration-300"
              >
                {steps[activeStep].visual}
              </div>
            </div>
          </div>
        </AnimateIn>

        {/* Mobile: vertical list */}
        <div className="mt-10 space-y-6 sm:hidden">
          {steps.map((step, i) => (
            <AnimateIn key={step.title} delay={i * 80}>
              <div className="rounded-2xl border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#73E2A7] text-white">
                    <span className="text-sm font-bold">{i + 1}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-950">{step.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-slate-500 mb-4">
                  {step.description}
                </p>
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
                  {step.visual}
                </div>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
