import Link from 'next/link';
import { AnimateIn } from './animate-in';
import { ScrollLink } from './scroll-link';
import { HeroDashboard } from './hero-dashboard';

function IconArrowRight({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12,5 19,12 12,19" />
    </svg>
  );
}

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

export function HeroSection() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 sm:pt-40 sm:pb-28">
      {/* Subtle grid pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M60 0H0v60\' stroke=\'%23000\' stroke-width=\'0.5\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-48 right-0 h-[600px] w-[600px] rounded-full bg-[#73E2A7]/10 blur-3xl" />
        <div className="absolute top-40 -left-32 h-[400px] w-[400px] rounded-full bg-[#73E2A7]/5 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-3xl text-center">
          <AnimateIn>
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#73E2A7]/30 bg-[#73E2A7]/5 px-4 py-1.5">
              <div className="h-1.5 w-1.5 rounded-full bg-[#73E2A7] animate-pulse" />
              <span className="text-xs font-medium text-[#4CC78A]">AI-Powered Compliance Tracking</span>
            </div>
          </AnimateIn>

          <AnimateIn delay={50}>
            <h1 className="text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl lg:text-6xl">
              COI Compliance on{' '}
              <span className="text-gradient-primary">Autopilot</span>
            </h1>
          </AnimateIn>

          <AnimateIn delay={150}>
            <p className="mt-6 text-lg leading-relaxed text-slate-500 sm:text-xl">
              AI-powered COI tracking that extracts, verifies, and monitors
              compliance across your entire portfolio.
            </p>
          </AnimateIn>

          <AnimateIn delay={250}>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center rounded-xl bg-brand px-8 text-sm font-semibold text-slate-950 shadow-lg shadow-brand/20 transition-all hover:bg-brand-dark hover:shadow-xl hover:shadow-brand/30 hover:-translate-y-0.5"
              >
                Upload 50 COIs Free
                <IconArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
              <ScrollLink
                href="#how-it-works"
                className="inline-flex h-12 items-center rounded-xl border border-slate-200 bg-white px-8 text-sm font-semibold text-slate-700 transition-all hover:bg-slate-50 hover:border-slate-300"
              >
                See How It Works
              </ScrollLink>
            </div>
          </AnimateIn>

          {/* Trust bar */}
          <AnimateIn delay={300}>
            <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row sm:justify-center sm:gap-5">
              {[
                'Built for property managers, GCs, logistics teams, and more',
                'No credit card required',
                'Set up in 5 minutes',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-1.5">
                  <IconCheck className="h-3.5 w-3.5 flex-shrink-0 text-[#4CC78A]" />
                  <span className="text-[13px] text-slate-400">{item}</span>
                </div>
              ))}
            </div>
          </AnimateIn>
        </div>

        {/* Stat badges */}
        <AnimateIn delay={350}>
          <div className="mx-auto mt-10 flex max-w-md items-center justify-center gap-3 sm:mt-12 sm:max-w-none sm:gap-4">
            {[
              { value: '10 min', label: 'to onboard 50 COIs' },
              { value: '99%+', label: 'extraction accuracy' },
              { value: '20+ hrs', label: 'saved per month' },
            ].map((stat) => (
              <div
                key={stat.value}
                className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm sm:gap-2.5 sm:px-4 sm:py-2"
              >
                <span className="text-sm font-bold text-[#4CC78A] sm:text-base">
                  {stat.value}
                </span>
                <span className="text-[11px] leading-tight text-slate-500 sm:text-xs">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </AnimateIn>

        {/* Hero dashboard visual */}
        <AnimateIn delay={400} className="mt-10 sm:mt-14">
          <div className="md:block">
            <HeroDashboard />
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
