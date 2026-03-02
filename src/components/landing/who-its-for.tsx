import { AnimateIn } from './animate-in';

function IconBuilding({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function IconTrendingUp({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
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

const personas = [
  {
    icon: <IconBuilding className="h-7 w-7" />,
    title: 'Property Managers',
    description:
      'Stop chasing vendors for updated COIs. SmartCOI automates collection, verification, and follow-up so you can focus on managing properties.',
  },
  {
    icon: <IconTrendingUp className="h-7 w-7" />,
    title: 'Asset Managers',
    description:
      'Get portfolio-wide visibility into compliance risk. Know which properties and vendors are exposed — without digging through spreadsheets.',
  },
  {
    icon: <IconShieldCheck className="h-7 w-7" />,
    title: 'Building Owners',
    description:
      'Protect your investment with automated insurance compliance tracking across all tenants and vendors.',
  },
];

export function WhoItsFor() {
  return (
    <section id="who-its-for" className="scroll-mt-20 py-20 sm:py-28">
      <div className="mx-auto max-w-7xl px-6">
        <AnimateIn>
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
              Who It&apos;s For
            </p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-slate-950 sm:text-4xl">
              Built for Commercial Real Estate Teams
            </h2>
            <p className="mt-4 text-lg text-slate-500">
              Whether you manage 5 properties or 50, SmartCOI scales with your portfolio.
            </p>
          </div>
        </AnimateIn>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {personas.map((persona, i) => (
            <AnimateIn key={persona.title} delay={i * 120}>
              <div className="group relative h-full rounded-2xl border border-slate-200 bg-white p-8 transition-all hover:shadow-lg hover:border-[#73E2A7]/30">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#73E2A7]/10 text-[#4CC78A] transition-colors group-hover:bg-[#73E2A7]/15">
                  {persona.icon}
                </div>
                <h3 className="mt-5 text-xl font-bold text-slate-950">
                  {persona.title}
                </h3>
                <p className="mt-3 leading-relaxed text-slate-500">
                  {persona.description}
                </p>
              </div>
            </AnimateIn>
          ))}
        </div>
      </div>
    </section>
  );
}
