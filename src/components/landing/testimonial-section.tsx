import { AnimateIn } from './animate-in';

export function TestimonialSection() {
  return (
    <section className="bg-slate-50/50 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-3xl text-center">
            {/* Quote mark */}
            <div className="mb-6 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[#73E2A7]/10">
              <svg className="h-6 w-6 text-[#73E2A7]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>

            <blockquote className="text-2xl font-bold leading-snug text-slate-950 sm:text-3xl">
              &ldquo;We were spending 10+ hours a week chasing COIs. SmartCOI cut that to minutes.&rdquo;
            </blockquote>

            <div className="mt-8 flex flex-col items-center gap-3">
              {/* Placeholder for company logo */}
              <div className="flex h-8 items-center rounded bg-slate-100 px-4">
                <span className="text-sm font-semibold tracking-tight text-slate-300">Company Logo</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-700">
                  Property Manager
                </p>
                <p className="text-xs text-slate-400">
                  Commercial Property Management
                </p>
              </div>
            </div>
          </div>
        </AnimateIn>
      </div>
    </section>
  );
}
