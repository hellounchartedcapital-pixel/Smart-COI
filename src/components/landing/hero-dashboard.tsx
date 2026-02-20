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
          {/* Page header */}
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900 sm:text-base">
                Overview
              </h3>
              <p className="text-[10px] text-slate-400 sm:text-[11px]">
                Compliance snapshot across all properties
              </p>
            </div>
            <div className="hidden items-center gap-1.5 sm:flex">
              <div className="flex items-center gap-1 rounded-lg bg-slate-900 px-3 py-1.5 text-[10px] font-medium text-white">
                <UploadIcon />
                Upload COI
              </div>
            </div>
          </div>

          {/* ── Stat cards ── */}
          <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              label="Properties"
              value="8"
              icon={<BuildingIcon />}
            />
            <StatCard
              label="Tracked Entities"
              value="147"
              sub="Vendors &amp; Tenants"
              icon={<UsersIcon />}
            />
            <StatCard
              label="Compliance Rate"
              value="87%"
              icon={<DonutIcon />}
            />
            <StatCard
              label="Expiring in 30 Days"
              value="12"
              valueColor="text-amber-600"
              icon={<ClockIcon />}
            />
          </div>

          {/* ── Compliance Overview Bar ── */}
          <div className="mb-5 rounded-lg border border-slate-200 p-3 sm:p-4">
            <p className="mb-2.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500 sm:text-xs">
              Compliance Overview
            </p>
            <div className="mb-2.5 flex h-3.5 w-full overflow-hidden rounded-full bg-slate-100 sm:h-4">
              <div className="bg-status-compliant" style={{ width: '87%' }} />
              <div className="bg-status-expiring" style={{ width: '8%' }} />
              <div className="bg-status-non-compliant" style={{ width: '3%' }} />
              <div className="bg-status-expired" style={{ width: '2%' }} />
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-1 sm:gap-x-5">
              <LegendDot color="bg-status-compliant" label="Compliant" count={128} />
              <LegendDot color="bg-status-expiring" label="Expiring Soon" count={12} />
              <LegendDot color="bg-status-non-compliant" label="Non-Compliant" count={4} />
              <LegendDot color="bg-status-expired" label="Expired" count={3} />
            </div>
          </div>

          {/* ── Main content: Action Queue + Activity Sidebar ── */}
          <div className="grid gap-4 xl:grid-cols-[1fr_260px]">
            <div className="space-y-4">
              {/* Needs Attention */}
              <div className="rounded-lg border border-slate-200 p-3 sm:p-4">
                <div className="mb-2.5 flex items-center gap-2">
                  <p className="text-[11px] font-semibold text-slate-900 sm:text-xs">
                    Needs Attention
                  </p>
                  <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-medium text-slate-500">
                    3
                  </span>
                </div>
                <div className="space-y-1.5">
                  {/* Acme Cleaning — Expired */}
                  <ActionRow
                    borderColor="border-l-red-800"
                    name="Acme Cleaning"
                    property="Westfield Tower"
                    badge="Expired"
                    badgeClass="bg-red-500 text-white"
                    description="Certificate expired on Jan 15, 2026"
                  />
                  {/* Pacific Electric — Non-Compliant */}
                  <ActionRow
                    borderColor="border-l-red-500"
                    name="Pacific Electric"
                    property="Harbor Point"
                    badge="Non-Compliant"
                    badgeClass="bg-red-100 text-red-800"
                    description="2 coverage gaps"
                  />
                  {/* Mesa Landscaping — Expiring Soon */}
                  <ActionRow
                    borderColor="border-l-amber-400"
                    name="Mesa Landscaping"
                    property="Parkview Commons"
                    badge="Expiring Soon"
                    badgeClass="bg-amber-100 text-amber-800"
                    description="Expires in 8 days"
                  />
                </div>
              </div>

              {/* Properties */}
              <div className="rounded-lg border border-slate-200 p-3 sm:p-4">
                <p className="mb-2.5 text-[11px] font-semibold text-slate-900 sm:text-xs">
                  Properties
                </p>
                <div className="grid gap-2.5 sm:grid-cols-3">
                  <PropertyMini name="Westfield Tower" compliant={12} total={14} />
                  <PropertyMini name="Harbor Point" compliant={8} total={9} />
                  <PropertyMini name="Parkview Commons" compliant={5} total={6} />
                </div>
              </div>
            </div>

            {/* Recent Activity sidebar */}
            <div className="hidden rounded-lg border border-slate-200 p-3 xl:block sm:p-4">
              <p className="mb-2.5 text-[11px] font-semibold text-slate-900 sm:text-xs">
                Recent Activity
              </p>
              <div className="space-y-0">
                <ActivityRow
                  icon={<UploadSmIcon />}
                  text="COI uploaded for Acme Cleaning"
                  time="Today"
                />
                <ActivityRow
                  icon={<ShieldIcon />}
                  text="Compliance calculated compliant"
                  time="Today"
                />
                <ActivityRow
                  icon={<BellIcon />}
                  text="Manual follow-up sent to Pacific Electric"
                  time="Today"
                />
                <ActivityRow
                  icon={<PlusIcon />}
                  text="Vendor Pacific Electric added"
                  time="Today"
                />
                <ActivityRow
                  icon={<FileIcon />}
                  text="COI processed for Mesa Landscaping"
                  time="Today"
                  isLast
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Sub-components
   ──────────────────────────────────────── */

function StatCard({
  label,
  value,
  icon,
  sub,
  valueColor = 'text-slate-950',
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  sub?: string;
  valueColor?: string;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-white p-2.5 shadow-sm sm:p-3">
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 sm:h-9 sm:w-9">
          {icon}
        </div>
        <div className="min-w-0">
          <p className="text-[9px] text-slate-400 sm:text-[10px]">{label}</p>
          <p className={`text-lg font-bold leading-tight sm:text-xl ${valueColor}`}>
            {value}
          </p>
          {sub && (
            <p
              className="text-[8px] text-slate-400 sm:text-[9px]"
              dangerouslySetInnerHTML={{ __html: sub }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function LegendDot({
  color,
  label,
  count,
}: {
  color: string;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={`h-2 w-2 rounded-full ${color}`} />
      <span className="text-[10px] text-slate-500">{label}</span>
      <span className="text-[10px] font-semibold text-slate-700">{count}</span>
    </div>
  );
}

function ActionRow({
  borderColor,
  name,
  property,
  badge,
  badgeClass,
  description,
}: {
  borderColor: string;
  name: string;
  property: string;
  badge: string;
  badgeClass: string;
  description: string;
}) {
  return (
    <div
      className={`flex items-center gap-2.5 rounded-lg border border-slate-100 border-l-[3px] ${borderColor} bg-white p-2 sm:p-2.5`}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-medium text-slate-900 sm:text-xs">
            {name}
          </p>
          <span
            className={`shrink-0 rounded px-1.5 py-px text-[9px] font-semibold leading-tight ${badgeClass}`}
          >
            {badge}
          </span>
        </div>
        <p className="text-[9px] text-slate-400 sm:text-[10px]">
          {property} &middot; {description}
        </p>
      </div>
      <div className="hidden shrink-0 gap-1 sm:flex">
        <MiniBtn label="Upload" />
        <MiniBtn label="View" />
        <MiniBtn label="Follow-up" />
      </div>
    </div>
  );
}

function MiniBtn({ label }: { label: string }) {
  return (
    <span className="rounded bg-slate-50 px-1.5 py-0.5 text-[9px] font-medium text-slate-500 ring-1 ring-slate-200">
      {label}
    </span>
  );
}

function PropertyMini({
  name,
  compliant,
  total,
}: {
  name: string;
  compliant: number;
  total: number;
}) {
  const pct = (compliant / total) * 100;
  return (
    <div className="rounded-lg border border-slate-100 p-2.5">
      <p className="truncate text-[11px] font-medium text-slate-900">{name}</p>
      <div className="mt-1.5 flex h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div className="bg-status-compliant rounded-full" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-1 text-[9px] text-slate-400">
        {compliant} of {total} compliant
      </p>
    </div>
  );
}

function ActivityRow({
  icon,
  text,
  time,
  isLast = false,
}: {
  icon: React.ReactNode;
  text: string;
  time: string;
  isLast?: boolean;
}) {
  return (
    <div className="flex gap-2.5 py-1.5">
      <div className="relative flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-100">
          {icon}
        </div>
        {!isLast && <div className="mt-0.5 w-px flex-1 bg-slate-200" />}
      </div>
      <div className="min-w-0 flex-1 pb-0.5">
        <p className="text-[10px] leading-snug text-slate-700">{text}</p>
        <p className="text-[9px] text-slate-400">{time}</p>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────
   Inline SVG icons (kept tiny, zero deps)
   ──────────────────────────────────────── */

const iconCls = 'h-4 w-4 text-slate-400';
const smIconCls = 'h-2.5 w-2.5 text-slate-500';

function BuildingIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function UsersIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 00-3-3.87" />
      <path d="M16 3.13a4 4 0 010 7.75" />
    </svg>
  );
}

function DonutIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 36 36" fill="none">
      <circle cx="18" cy="18" r="14" stroke="#e2e8f0" strokeWidth="3" />
      <circle
        cx="18"
        cy="18"
        r="14"
        stroke="#4CC78A"
        strokeWidth="3"
        strokeDasharray={`${0.87 * 87.96} 87.96`}
        strokeLinecap="round"
        transform="rotate(-90 18 18)"
      />
      <text x="18" y="20" textAnchor="middle" className="fill-slate-700 text-[8px] font-bold">
        87%
      </text>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg className={iconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="mr-0.5 h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function UploadSmIcon() {
  return (
    <svg className={smIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg className={smIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9,12 11,14 15,10" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className={smIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg className={smIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className={smIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <polyline points="9,15 12,12 15,15" />
    </svg>
  );
}
