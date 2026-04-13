import {
  AlertTriangle,
  ShieldAlert,
  ShieldCheck,
  XCircle,
  Clock,
  FileText,
} from 'lucide-react';

/**
 * Static, styled mockup of a SmartCOI compliance report.
 *
 * Mirrors the look and feel of the real report at /report/[reportId] but is
 * rendered server-side with hand-picked sample data — used on the landing
 * page to show prospective customers what they'll get for their first
 * free report.
 */
export function ReportPreviewMockup() {
  const complianceScore = 67;
  const totalExposure = '$2.4M';
  const totalGaps = 14;
  const expiredCount = 3;

  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Soft emerald glow backdrop */}
      <div
        aria-hidden="true"
        className="absolute -inset-8 -z-10 bg-gradient-to-b from-[#E8FAF0] via-transparent to-transparent blur-3xl"
      />

      {/* Browser chrome */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-[0_20px_60px_-15px_rgba(15,23,42,0.18)]">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="ml-4 flex flex-1 items-center justify-center">
            <div className="flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1 text-[11px] text-slate-500">
              <span className="text-[#4CC78A]">●</span>
              smartcoi.io/report/compliance
            </div>
          </div>
        </div>

        {/* Report body */}
        <div className="px-6 pb-8 pt-6 sm:px-10 sm:pt-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-[#4CC78A]">
                Compliance Report
              </p>
              <h3 className="mt-1 text-xl font-bold text-slate-900 sm:text-2xl">
                Acme Property Group
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                Generated just now · 42 entities · 38 certificates analyzed
              </p>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#E8FAF0] px-3 py-1.5 text-xs font-semibold text-[#065F46]">
              <FileText className="h-3.5 w-3.5" />
              Live Preview
            </div>
          </div>

          {/* Hero stats: score + exposure */}
          <div className="mt-6 grid gap-6 lg:grid-cols-[auto_1fr]">
            {/* Donut score */}
            <div className="flex items-center justify-center lg:justify-start">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#F1F5F9"
                    strokeWidth="12"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#F59E0B"
                    strokeWidth="12"
                    strokeLinecap="round"
                    strokeDasharray={`${(complianceScore / 100) * 326.7} 326.7`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-3xl font-bold text-slate-900">{complianceScore}%</div>
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                    Compliant
                  </div>
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <AlertTriangle className="h-3 w-3" />
                  Exposure
                </div>
                <div className="mt-2 text-xl font-bold text-rose-600">{totalExposure}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">estimated risk</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <ShieldAlert className="h-3 w-3" />
                  Gaps
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900">{totalGaps}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">across 9 vendors</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <XCircle className="h-3 w-3" />
                  Expired
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900">{expiredCount}</div>
                <div className="mt-0.5 text-[11px] text-slate-400">policies lapsed</div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  <Clock className="h-3 w-3" />
                  Expiring
                </div>
                <div className="mt-2 text-xl font-bold text-slate-900">6</div>
                <div className="mt-0.5 text-[11px] text-slate-400">within 30 days</div>
              </div>
            </div>
          </div>

          {/* Critical issues */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-rose-500" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Critical Issues
              </p>
            </div>
            <div className="space-y-2">
              {[
                {
                  name: 'Delta Mechanical LLC',
                  desc: 'General Liability policy expired 14 days ago',
                },
                {
                  name: 'Apex Roofing Co.',
                  desc: 'Missing Workers\u2019 Compensation — $1M required',
                },
                {
                  name: 'Kastle Security Services',
                  desc: 'GL limit $500K on file, $1M required — $500K gap',
                },
              ].map((item) => (
                <div
                  key={item.name}
                  className="flex items-start gap-3 rounded-lg border border-rose-100 bg-rose-50/50 px-4 py-3"
                >
                  <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-rose-500" strokeWidth={2} />
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.name}</p>
                    <p className="mt-0.5 text-xs text-slate-600">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Vendor breakdown */}
          <div className="mt-8">
            <div className="mb-3 flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-[#73E2A7]" />
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vendor Breakdown
              </p>
            </div>
            <div className="overflow-hidden rounded-lg border border-slate-100">
              <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-slate-100 bg-slate-50/60 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                <span>Vendor</span>
                <span className="hidden sm:block">Type</span>
                <span>Status</span>
              </div>
              {[
                { name: 'Blue Mesa Electric', type: 'Electrician', status: 'compliant' },
                { name: 'Elite Janitorial Inc.', type: 'Cleaning', status: 'compliant' },
                { name: 'Delta Mechanical LLC', type: 'HVAC', status: 'expired' },
                { name: 'Apex Roofing Co.', type: 'Roofing', status: 'non_compliant' },
                { name: 'GreenLeaf Landscaping', type: 'Landscaper', status: 'expiring' },
              ].map((v, i) => (
                <div
                  key={v.name}
                  className={`grid grid-cols-[1fr_auto_auto] items-center gap-4 px-4 py-2.5 text-sm ${
                    i < 4 ? 'border-b border-slate-100' : ''
                  }`}
                >
                  <span className="font-medium text-slate-900">{v.name}</span>
                  <span className="hidden text-xs text-slate-500 sm:block">{v.type}</span>
                  <StatusPill status={v.status} />
                </div>
              ))}
            </div>
          </div>

          {/* Faded continuation hint */}
          <div className="mt-6 flex items-center justify-center">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <div className="h-px w-12 bg-slate-200" />
              Full report includes 42 vendors, action items, and PDF export
              <div className="h-px w-12 bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const config = {
    compliant: {
      label: 'Compliant',
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: ShieldCheck,
    },
    non_compliant: {
      label: 'Non-compliant',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: ShieldAlert,
    },
    expired: {
      label: 'Expired',
      className: 'bg-rose-50 text-rose-700 border-rose-200',
      icon: XCircle,
    },
    expiring: {
      label: 'Expiring soon',
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: Clock,
    },
  }[status] || {
    label: status,
    className: 'bg-slate-50 text-slate-600 border-slate-200',
    icon: ShieldCheck,
  };

  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold ${config.className}`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}
