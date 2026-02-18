export function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-5xl">
      {/* Glow effect behind the dashboard */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#73E2A7]/20 via-[#4CC78A]/10 to-transparent blur-2xl" />

      {/* Dashboard mock */}
      <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-3">
          <div className="flex gap-1.5">
            <div className="h-3 w-3 rounded-full bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-300" />
            <div className="h-3 w-3 rounded-full bg-slate-300" />
          </div>
          <div className="mx-auto rounded-md bg-slate-100 px-16 py-1 text-xs text-slate-400">
            app.smartcoi.com/dashboard
          </div>
        </div>

        {/* Dashboard content */}
        <div className="p-4 sm:p-6">
          {/* Page title */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 sm:text-lg">Portfolio Overview</h3>
              <p className="text-[11px] text-slate-400 sm:text-xs">Updated just now</p>
            </div>
            <div className="hidden items-center gap-2 sm:flex">
              <div className="rounded-lg bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-500">
                Last 30 days
              </div>
            </div>
          </div>

          {/* Stat cards */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard label="Properties" value="12" icon="building" />
            <StatCard label="Tracked Entities" value="142" icon="users" />
            <StatCard label="Compliance Rate" value="87%" icon="donut" accent="text-[#4CC78A]" />
            <StatCard label="Expiring in 30 Days" value="16" icon="clock" accent="text-amber-500" />
          </div>

          {/* Two-column layout: compliance bar + priority queue */}
          <div className="grid gap-4 lg:grid-cols-5">
            {/* Compliance Breakdown */}
            <div className="rounded-lg border border-slate-200 p-4 lg:col-span-2">
              <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">
                Compliance Status
              </p>

              {/* Segmented horizontal bar */}
              <div className="mb-3 flex h-5 overflow-hidden rounded-full">
                <div className="bg-emerald-400" style={{ width: '58%' }} />
                <div className="bg-amber-400" style={{ width: '11%' }} />
                <div className="bg-red-400" style={{ width: '6%' }} />
                <div className="bg-red-700" style={{ width: '4%' }} />
                <div className="bg-slate-300" style={{ width: '14%' }} />
                <div className="bg-blue-400" style={{ width: '7%' }} />
              </div>

              {/* Legend */}
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <LegendItem color="bg-emerald-400" label="Compliant" count={82} />
                <LegendItem color="bg-amber-400" label="Expiring Soon" count={16} />
                <LegendItem color="bg-red-400" label="Non-Compliant" count={8} />
                <LegendItem color="bg-red-700" label="Expired" count={6} />
                <LegendItem color="bg-slate-300" label="Pending" count={20} />
                <LegendItem color="bg-blue-400" label="Under Review" count={10} />
              </div>
            </div>

            {/* Priority Action Queue */}
            <div className="rounded-lg border border-slate-200 p-4 lg:col-span-3">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Priority Actions
                </p>
                <span className="rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-bold text-red-600">
                  4 items
                </span>
              </div>

              <div className="space-y-2">
                <ActionItem
                  borderColor="border-l-red-500"
                  entity="Metro Electric LLC"
                  property="200 Oak Avenue"
                  badge="Expired"
                  badgeColor="bg-red-50 text-red-600"
                  action="Send Follow-Up"
                />
                <ActionItem
                  borderColor="border-l-red-400"
                  entity="SafeGuard Security"
                  property="100 Main Street"
                  badge="Gap Found"
                  badgeColor="bg-red-50 text-red-600"
                  action="Review COI"
                />
                <ActionItem
                  borderColor="border-l-amber-400"
                  entity="CleanPro Services"
                  property="350 Pine Boulevard"
                  badge="Expires in 12 days"
                  badgeColor="bg-amber-50 text-amber-700"
                  action="Notify Vendor"
                />
                <ActionItem
                  borderColor="border-l-blue-400"
                  entity="Skyline HVAC Inc."
                  property="200 Oak Avenue"
                  badge="Under Review"
                  badgeColor="bg-blue-50 text-blue-600"
                  action="Review COI"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon,
  accent = 'text-slate-950',
}: {
  label: string;
  value: string;
  icon: 'building' | 'users' | 'donut' | 'clock';
  accent?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-3 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-medium uppercase tracking-wider text-slate-400 sm:text-[11px]">
          {label}
        </p>
        <StatIcon type={icon} />
      </div>
      <p className={`mt-1.5 text-xl font-bold sm:text-2xl ${accent}`}>{value}</p>
    </div>
  );
}

function StatIcon({ type }: { type: 'building' | 'users' | 'donut' | 'clock' }) {
  const cls = 'h-4 w-4 text-slate-300';
  switch (type) {
    case 'building':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
          <path d="M9 22v-4h6v4" />
          <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
        </svg>
      );
    case 'users':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 00-3-3.87" />
          <path d="M16 3.13a4 4 0 010 7.75" />
        </svg>
      );
    case 'donut':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" strokeWidth="2">
          <circle cx="12" cy="12" r="9" stroke="#e2e8f0" />
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke="#4CC78A"
            strokeDasharray="56.55"
            strokeDashoffset="7.35"
            strokeLinecap="round"
            transform="rotate(-90 12 12)"
          />
        </svg>
      );
    case 'clock':
      return (
        <svg className={cls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <polyline points="12 6 12 12 16 14" />
        </svg>
      );
  }
}

function LegendItem({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2">
      <div className={`h-2.5 w-2.5 rounded-sm ${color}`} />
      <span className="text-[11px] text-slate-500">{label}</span>
      <span className="ml-auto text-[11px] font-semibold text-slate-700">{count}</span>
    </div>
  );
}

function ActionItem({
  borderColor,
  entity,
  property,
  badge,
  badgeColor,
  action,
}: {
  borderColor: string;
  entity: string;
  property: string;
  badge: string;
  badgeColor: string;
  action: string;
}) {
  return (
    <div className={`flex items-center gap-3 rounded-lg border border-slate-100 border-l-[3px] ${borderColor} bg-white py-2.5 pr-3 pl-3 transition-colors hover:bg-slate-50`}>
      <div className="min-w-0 flex-1">
        <p className="truncate text-xs font-semibold text-slate-800 sm:text-sm">{entity}</p>
        <p className="truncate text-[10px] text-slate-400 sm:text-[11px]">{property}</p>
      </div>
      <span className={`hidden whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold sm:inline-flex ${badgeColor}`}>
        {badge}
      </span>
      <button className="whitespace-nowrap rounded-md bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 sm:text-[11px]">
        {action}
      </button>
    </div>
  );
}
