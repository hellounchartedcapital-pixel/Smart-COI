import Link from 'next/link';
import { AnimateIn } from './animate-in';

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  );
}

function IconFileText({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  );
}

function IconBookOpen({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z" />
      <path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z" />
    </svg>
  );
}

function IconGitCompare({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="18" r="3" />
      <circle cx="6" cy="6" r="3" />
      <path d="M6 21V9a9 9 0 009 9" />
      <path d="M18 3v12" />
    </svg>
  );
}

const resources = [
  {
    icon: <IconBookOpen className="h-6 w-6" />,
    title: 'COI Compliance Guide',
    description: 'The complete guide to certificate of insurance compliance for commercial property managers.',
    href: '/blog/coi-compliance-guide-property-managers',
  },
  {
    icon: <IconFileText className="h-6 w-6" />,
    title: 'SmartCOI Blog',
    description: 'Insights on COI tracking, compliance automation, and property management best practices.',
    href: '/blog',
  },
  {
    icon: <IconGitCompare className="h-6 w-6" />,
    title: 'Compare Solutions',
    description: 'See how SmartCOI stacks up against spreadsheets, BCS, Jones, and other tracking tools.',
    href: '/compare',
  },
];

export function ResourcesSection() {
  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              Resources
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Learn More About COI Compliance
            </h2>
          </div>
        </AnimateIn>

        <div className="mt-12 grid gap-6 sm:grid-cols-3">
          {resources.map((resource, i) => (
            <AnimateIn key={resource.title} delay={i * 100}>
              <Link
                href={resource.href}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-7 transition-all hover:shadow-lg hover:border-[#73E2A7]/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-500 transition-colors group-hover:bg-[#73E2A7]/10 group-hover:text-[#4CC78A]">
                  {resource.icon}
                </div>
                <h3 className="mt-4 text-lg font-bold text-slate-950 group-hover:text-[#4CC78A] transition-colors">
                  {resource.title}
                </h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-slate-500">
                  {resource.description}
                </p>
                <div className="mt-4 flex items-center gap-1 text-sm font-medium text-[#4CC78A]">
                  Read more
                  <IconArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
