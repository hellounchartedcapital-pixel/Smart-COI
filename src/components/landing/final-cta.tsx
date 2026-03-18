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

export function FinalCTA() {
  return (
    <section className="relative overflow-hidden py-20 sm:py-28">
      {/* Gradient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#4CC78A] via-[#73E2A7] to-[#A8EEC8]" />
      {/* Pattern overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.04]" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M60 0H0v60\' stroke=\'%23000\' stroke-width=\'0.5\'/%3E%3C/g%3E%3C/svg%3E")' }} />

      <div className="relative mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl lg:text-5xl">
              Ready to Put Insurance Compliance on Autopilot?
            </h2>
            <p className="mt-6 text-lg text-slate-800/80">
              See your compliance dashboard in minutes — no credit card required.
            </p>
            <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
              <Link
                href="/signup"
                className="group inline-flex h-12 items-center rounded-xl bg-slate-950 px-8 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition-all hover:bg-slate-800 hover:-translate-y-0.5"
              >
                Start Your Free Trial
                <IconArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>
            <p className="mt-5 text-sm text-slate-800/60">
              14-day free trial &middot; Full access to all features
            </p>
            <p className="mt-1.5 text-sm text-slate-800/50">
              No credit card required &middot; Set up in under 5 minutes
            </p>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
