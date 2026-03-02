import { AnimateIn } from './animate-in';

function IconCheck({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20,6 9,17 4,12" />
    </svg>
  );
}

const bullets = [
  {
    title: 'Upload 50 COIs in minutes, not hours',
    description: 'Drag and drop your entire folder of PDFs. SmartCOI processes them all in parallel.',
  },
  {
    title: 'AI extracts everything automatically',
    description: 'Vendor names, coverage types, policy limits, expiration dates, and named insureds — extracted from every certificate.',
  },
  {
    title: 'Fuzzy matching links certificates to vendors',
    description: 'SmartCOI intelligently matches certificates to existing vendors or creates new ones when no match is found.',
  },
  {
    title: 'Full compliance picture in one session',
    description: 'Go from a folder of PDFs to a fully populated, compliance-checked portfolio. No manual data entry.',
  },
];

export function BulkUploadSection() {
  return (
    <section className="py-20 sm:py-28 bg-slate-950">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          {/* Content */}
          <div>
            <AnimateIn>
              <p className="text-sm font-semibold uppercase tracking-widest text-[#73E2A7]">
                What Sets Us Apart
              </p>
              <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
                Instant Onboarding with Bulk Upload
              </h2>
              <p className="mt-4 text-lg text-slate-400">
                Most compliance tools require manual data entry for every vendor and certificate.
                SmartCOI doesn&apos;t.
              </p>
            </AnimateIn>

            <div className="mt-8 space-y-5">
              {bullets.map((bullet, i) => (
                <AnimateIn key={bullet.title} delay={100 + i * 80}>
                  <div className="flex gap-4">
                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#73E2A7]/15 mt-0.5">
                      <IconCheck className="h-3.5 w-3.5 text-[#73E2A7]" />
                    </div>
                    <div>
                      <p className="font-semibold text-white">{bullet.title}</p>
                      <p className="mt-1 text-sm text-slate-400">{bullet.description}</p>
                    </div>
                  </div>
                </AnimateIn>
              ))}
            </div>
          </div>

          {/* Visual */}
          <AnimateIn delay={200}>
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              {/* Upload zone */}
              <div className="mb-5 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] p-6 text-center">
                <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-[#73E2A7]/10">
                  <svg className="h-6 w-6 text-[#73E2A7]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="16,16 12,12 8,16" />
                    <line x1="12" y1="12" x2="12" y2="21" />
                    <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-slate-300">Drop your COI files here</p>
                <p className="mt-1 text-xs text-slate-500">PDF files &middot; Up to 50 at once</p>
              </div>

              {/* Processing visualization */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                  <span>Processing 47 of 50 certificates...</span>
                  <span className="font-medium text-[#73E2A7]">94%</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#4CC78A] to-[#73E2A7]" style={{ width: '94%' }} />
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { name: 'Acme Cleaning Services', status: 'New vendor created', isNew: true },
                    { name: 'Pacific Electric Co', status: 'Matched to existing vendor', isNew: false },
                    { name: 'Mesa Landscaping LLC', status: 'Matched to existing vendor', isNew: false },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-3 rounded-lg bg-white/5 px-3 py-2.5">
                      <div className="h-2 w-2 rounded-full bg-[#73E2A7]" />
                      <span className="text-sm text-slate-300 flex-1 truncate">{item.name}</span>
                      <span className="text-[10px] text-slate-500 shrink-0">
                        {item.isNew && <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-blue-400" />}
                        {item.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimateIn>
        </div>
      </div>
    </section>
  );
}
