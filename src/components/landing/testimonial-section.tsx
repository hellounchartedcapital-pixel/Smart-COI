import { AnimateIn } from './animate-in';

export function TestimonialSection() {
  return (
    <section className="bg-slate-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-3xl">
            {/* Section label */}
            <p className="mb-8 text-center text-xs font-semibold uppercase tracking-widest text-[#4CC78A]">
              Built by a property manager, for property managers
            </p>

            {/* Founder quote — personal statement style */}
            <div className="relative rounded-2xl border border-slate-200/60 bg-white px-8 py-10 shadow-sm sm:px-12 sm:py-12">
              {/* Emerald accent bar */}
              <div className="absolute left-0 top-8 bottom-8 w-[3px] rounded-full bg-[#73E2A7]" />

              <p className="text-lg leading-relaxed text-slate-600 sm:text-xl sm:leading-relaxed">
                I spent years chasing down expired certificates, digging through emails,
                and fighting with outdated, inefficient software that was never built for
                how property managers actually work. Every property manager I talked to had
                the same frustrations&mdash;and the existing tools were either too expensive,
                too complex, or built for people who don&apos;t actually manage properties.
                So I built SmartCOI&mdash;a simple, affordable way to put insurance
                compliance on autopilot.
              </p>

              {/* Attribution */}
              <div className="mt-8 flex items-center gap-3">
                <div className="h-px w-8 bg-slate-200" />
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
        </AnimateIn>
      </div>
    </section>
  );
}
