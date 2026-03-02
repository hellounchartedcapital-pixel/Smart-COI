import { AnimateIn } from './animate-in';

const stats = [
  { value: '10 min', label: 'To onboard 50 COIs', sublabel: 'Bulk upload + AI extraction' },
  { value: '99%+', label: 'Extraction accuracy', sublabel: 'AI-powered data extraction' },
  { value: '20+ hrs', label: 'Saved per month', sublabel: 'vs. manual COI tracking' },
  { value: 'Real-time', label: 'Compliance visibility', sublabel: 'Across your entire portfolio' },
];

export function StatsBar() {
  return (
    <section className="border-y border-slate-100 bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 lg:grid-cols-4 lg:gap-12">
          {stats.map((stat, i) => (
            <AnimateIn key={stat.label} delay={i * 100}>
              <div className="text-center">
                <p className="text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
                  {stat.value}
                </p>
                <p className="mt-2 text-sm font-semibold text-slate-700">
                  {stat.label}
                </p>
                <p className="mt-0.5 text-xs text-slate-400">
                  {stat.sublabel}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
