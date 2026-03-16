import Link from 'next/link';
import { AnimateIn } from './animate-in';

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

function IconGlobe({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z" />
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

/* ─── Features Data ─── */

const features = [
  {
    icon: <IconUpload className="h-6 w-6" />,
    title: 'Bulk COI Upload',
    description: 'Upload your entire portfolio of certificates at once. Our AI processes them all in parallel and builds your vendor roster automatically.',
    href: '/features/coi-tracking',
  },
  {
    icon: <IconCpu className="h-6 w-6" />,
    title: 'AI-Powered Extraction',
    description: 'AI reads every COI and extracts coverage types, limits, dates, carriers, and named insureds — no manual data entry.',
    href: '/ai-coi-extraction',
  },
  {
    icon: <IconClipboard className="h-6 w-6" />,
    title: 'Compliance Templates',
    description: 'Define vendor and tenant insurance requirements using built-in templates with standard coverage types and minimum limits.',
    href: '/features/compliance-automation',
  },
  {
    icon: <IconGlobe className="h-6 w-6" />,
    title: 'Self-Service Portal',
    description: 'Vendors and tenants upload certificates directly through a branded portal. No login required — just a secure link.',
    href: '/features/vendor-management',
  },
  {
    icon: <IconBell className="h-6 w-6" />,
    title: 'Automated Notifications',
    description: 'Configurable expiration warnings and follow-up reminders. Non-compliant entities get notified automatically with escalating urgency.',
    href: '/features/coi-tracking',
  },
  {
    icon: <IconBarChart className="h-6 w-6" />,
    title: 'Real-Time Dashboard',
    description: 'See compliance health across every property at a glance. Track status, identify gaps, and prioritize follow-ups from one view.',
    href: '/features/coi-tracking',
  },
];

/* ─── Component ─── */

export function FeaturesGrid() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              Features
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Everything You Need to Stay Compliant
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Purpose-built for commercial property managers who need reliable,
              automated COI tracking.
            </p>
          </div>
        </AnimateIn>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feat, i) => (
            <AnimateIn key={feat.title} delay={i * 80}>
              <Link href={feat.href} className="group block rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:shadow-lg hover:border-[#73E2A7]/30 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#73E2A7]/10 text-[#4CC78A] transition-colors group-hover:bg-[#73E2A7]/15">
                  {feat.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950">{feat.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500">{feat.description}</p>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
