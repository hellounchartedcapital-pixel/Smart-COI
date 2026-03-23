/* ──────────────────────────────────────────────────────────────
   HeroDashboard — Static preview of the redesigned dashboard
   for the SmartCOI landing page. Purely visual, zero interactivity.
   ────────────────────────────────────────────────────────────── */

export function HeroDashboard() {
  return (
    <div className="relative mx-auto w-full max-w-6xl">
      {/* Glow effect behind the dashboard */}
      <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-[#73E2A7]/20 via-[#4CC78A]/10 to-transparent blur-2xl" />

      {/* Browser frame — cropped on mobile to show top portion only */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/10 max-h-[320px] sm:max-h-[480px] md:max-h-none">
        {/* macOS-style title bar */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50/80 px-4 py-2.5">
          <div className="flex gap-1.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[#FF5F57]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#FEBC2E]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[#28C840]" />
          </div>
          <div className="mx-auto rounded-md bg-white/80 border border-slate-200/60 px-4 sm:px-12 py-1 text-[10px] sm:text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
            app.smartcoi.io/dashboard
          </div>
        </div>

        {/* Dashboard layout: sidebar + main */}
        <div className="flex min-h-[360px] sm:min-h-[480px] md:min-h-[520px]">
          {/* Sidebar */}
          <Sidebar />

          {/* Main content area */}
          <div className="flex-1 overflow-hidden bg-[#f9fafb]">
            {/* Sticky header */}
            <div className="flex h-11 items-center border-b border-slate-100 bg-white/90 px-5">
              <p className="text-[12px] font-semibold text-slate-900">Dashboard</p>
            </div>

            {/* Scrollable body */}
            <div className="p-4 sm:p-5">
              {/* Greeting + Upload button */}
              <div className="mb-5 flex items-end justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-900 sm:text-base">Hello, Sarah</h3>
                  <p className="text-[10px] text-slate-400 sm:text-[11px]">Here&apos;s what&apos;s going on with your portfolio today.</p>
                </div>
                <div className="hidden sm:block">
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white">
                    <UploadIcon />
                    Upload COI
                  </span>
                </div>
              </div>

              {/* Two-column grid */}
              <div className="grid gap-4 lg:grid-cols-[1fr_240px] xl:grid-cols-[1fr_280px]">
                {/* Left column */}
                <div className="space-y-4">
                  {/* Portfolio Health */}
                  <HealthCard />

                  {/* Action Queue */}
                  <ActionQueue />
                </div>

                {/* Right sidebar */}
                <div className="hidden space-y-3 lg:block">
                  <PortfolioOverviewCard />
                  <RecentActivityCard />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom fade on mobile when cropped */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-white to-transparent md:hidden" />
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Sidebar
   ────────────────────────────────────────────────────────────── */

function Sidebar() {
  return (
    <div className="hidden w-[200px] flex-shrink-0 flex-col border-r border-slate-100 bg-white md:flex" style={{ boxShadow: '1px 0 0 0 rgba(0,0,0,0.04)' }}>
      {/* Logo + org */}
      <div className="flex items-center gap-2.5 px-4 py-4">
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
          <span className="text-[10px] font-bold text-emerald-700">S</span>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[12px] font-bold text-slate-900 tracking-tight">SmartCOI</p>
          <p className="truncate text-[9px] text-slate-400">Westfield Properties</p>
        </div>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-2.5 pt-1 space-y-4">
        <NavGroup label="OVERVIEW">
          <NavItem icon={<DashboardIcon />} label="Dashboard" active />
        </NavGroup>
        <NavGroup label="COMPLIANCE">
          <NavItem icon={<BuildingIcon />} label="Properties" />
          <NavItem icon={<FileCheckIcon />} label="Templates" />
          <NavItem icon={<BellSmIcon />} label="Notifications" />
        </NavGroup>
        <NavGroup label="ACCOUNT">
          <NavItem icon={<SettingsIcon />} label="Settings" />
          <NavItem icon={<CreditCardIcon />} label="Billing" />
        </NavGroup>
      </nav>

      {/* User info */}
      <div className="border-t border-slate-100 p-2.5">
        <div className="flex items-center gap-2 px-2 py-1.5">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-[8px] font-bold text-emerald-700">
            SC
          </div>
          <div className="min-w-0">
            <p className="truncate text-[10px] font-medium text-slate-900">Sarah Chen</p>
            <p className="truncate text-[8px] text-slate-400">sarah@westfield.com</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function NavGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1.5 px-2.5 text-[8px] font-semibold uppercase tracking-[0.08em] text-slate-400">
        {label}
      </p>
      <div className="space-y-0.5">{children}</div>
    </div>
  );
}

function NavItem({ icon, label, active = false }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <div
      className={`relative flex h-8 items-center gap-2 rounded-lg px-2.5 text-[11px] font-medium ${
        active
          ? 'bg-emerald-50 text-emerald-700'
          : 'text-slate-500'
      }`}
    >
      {active && (
        <span className="absolute left-0 top-1.5 bottom-1.5 w-[2px] rounded-full bg-emerald-500" />
      )}
      <span className={active ? 'text-emerald-600' : 'text-slate-400'}>{icon}</span>
      {label}
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Portfolio Health Card
   ────────────────────────────────────────────────────────────── */

function HealthCard() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-2xl font-bold tracking-tight text-emerald-600 sm:text-3xl">87%</span>
        <span className="text-[11px] font-medium text-emerald-600 sm:text-xs">Compliant</span>
      </div>
      <p className="mt-0.5 text-[10px] text-slate-400">
        Across 3 properties, 31 vendors, 8 tenants
      </p>
      {/* Status pills */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <StatusPill dot="bg-emerald-500" label="Compliant" count={24} bg="bg-emerald-50" text="text-emerald-700" />
        <StatusPill dot="bg-amber-500" label="Expiring Soon" count={3} bg="bg-amber-50" text="text-amber-700" />
        <StatusPill dot="bg-red-600" label="Expired" count={1} bg="bg-red-50" text="text-red-700" />
        <StatusPill dot="bg-red-500" label="Non-Compliant" count={2} bg="bg-red-50" text="text-red-700" />
        <StatusPill dot="bg-slate-400" label="Pending" count={1} bg="bg-slate-50" text="text-slate-600" />
      </div>
    </div>
  );
}

function StatusPill({ dot, label, count, bg, text }: { dot: string; label: string; count: number; bg: string; text: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-medium ${bg} ${text}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {label} {count}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Action Queue
   ────────────────────────────────────────────────────────────── */

function ActionQueue() {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white">
      {/* Header */}
      <div className="px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-50">
            <AlertIcon />
          </div>
          <p className="text-[11px] font-semibold text-slate-900 sm:text-xs">Needs Your Attention</p>
          <span className="inline-flex h-4.5 min-w-[18px] items-center justify-center rounded-full bg-slate-100 px-1.5 text-[9px] font-semibold text-slate-500">
            5
          </span>
        </div>
      </div>

      {/* Rows */}
      <ActionRow
        dot="bg-amber-500"
        name="Pacific Coast Janitorial Services"
        property="Westfield Tower"
        desc="Expires Apr 2, 2026"
        badge="EXPIRING"
        badgeBg="bg-amber-50"
        badgeText="text-amber-700"
        badgeDot="bg-amber-500"
      />
      <ActionRow
        dot="bg-red-600"
        name="Summit Mechanical HVAC"
        property="Harbor View Plaza"
        desc="Expired Mar 10, 2026"
        badge="EXPIRED"
        badgeBg="bg-red-50"
        badgeText="text-red-700"
        badgeDot="bg-red-600"
      />
      <ActionRow
        dot="bg-red-500"
        name="Greenline Landscaping Co."
        property="Parkside Commons"
        desc="Missing: General Liability"
        badge="NON-COMPLIANT"
        badgeBg="bg-red-50"
        badgeText="text-red-700"
        badgeDot="bg-red-500"
      />
      <ActionRow
        dot="bg-slate-400"
        name="Atlas Fire Protection Inc."
        property="Westfield Tower"
        desc="Pending verification"
        badge="PENDING"
        badgeBg="bg-slate-50"
        badgeText="text-slate-600"
        badgeDot="bg-slate-400"
      />
      <ActionRow
        dot="bg-amber-500"
        name="Brightway Electrical LLC"
        property="Harbor View Plaza"
        desc="Expires Apr 15, 2026"
        badge="EXPIRING"
        badgeBg="bg-amber-50"
        badgeText="text-amber-700"
        badgeDot="bg-amber-500"
        isLast
      />
      {/* Show all link */}
      <div className="border-t border-slate-100 px-4 py-2 text-center">
        <span className="text-[9px] font-medium text-emerald-600">Show all 14 items</span>
      </div>
    </div>
  );
}

function ActionRow({
  dot,
  name,
  property,
  desc,
  badge,
  badgeBg,
  badgeText,
  badgeDot,
  isLast = false,
}: {
  dot: string;
  name: string;
  property: string;
  desc: string;
  badge: string;
  badgeBg: string;
  badgeText: string;
  badgeDot: string;
  isLast?: boolean;
}) {
  return (
    <div className={`flex items-center gap-3 px-4 py-3 ${!isLast ? 'border-b border-slate-100' : ''}`}>
      {/* Status dot */}
      <div className={`h-2 w-2 flex-shrink-0 rounded-full ${dot}`} />

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <p className="truncate text-[11px] font-medium text-slate-900">{name}</p>
          <span className={`inline-flex items-center gap-1 rounded-full px-1.5 py-px text-[8px] font-semibold uppercase tracking-wide ${badgeBg} ${badgeText}`}>
            <span className={`h-1 w-1 rounded-full ${badgeDot}`} />
            {badge}
          </span>
        </div>
        <p className="mt-0.5 text-[9px] text-slate-400">
          {property} &middot; {desc}
        </p>
      </div>

      {/* Action buttons */}
      <div className="hidden shrink-0 gap-1 sm:flex">
        <MiniBtn label="Request COI" icon={<MailSmIcon />} />
        <MiniBtn label="Upload COI" icon={<UploadSmIcon />} />
      </div>
    </div>
  );
}

function MiniBtn({ label, icon }: { label: string; icon?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[8px] font-medium text-slate-500">
      {icon}
      {label}
    </span>
  );
}

/* ──────────────────────────────────────────────────────────────
   Right Sidebar Cards
   ────────────────────────────────────────────────────────────── */

function SidebarCard({ title, icon, children, action }: { title: string; icon: React.ReactNode; children: React.ReactNode; action?: string }) {
  return (
    <div className="rounded-xl border border-slate-200/60 bg-white p-3.5">
      <div className="flex items-center justify-between mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-50">
            {icon}
          </div>
          <p className="text-[10px] font-semibold text-slate-900">{title}</p>
        </div>
        {action && (
          <span className="text-[9px] font-medium text-emerald-600">{action} &rsaquo;</span>
        )}
      </div>
      {children}
    </div>
  );
}

function PortfolioOverviewCard() {
  return (
    <SidebarCard title="Portfolio Overview" icon={<BuildingSmIcon />}>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-lg font-bold text-slate-900">3</p>
          <p className="text-[8px] text-slate-500">Properties</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">31</p>
          <p className="text-[8px] text-slate-500">Vendors</p>
        </div>
        <div>
          <p className="text-lg font-bold text-slate-900">8</p>
          <p className="text-[8px] text-slate-500">Tenants</p>
        </div>
      </div>
    </SidebarCard>
  );
}


function RecentActivityCard() {
  return (
    <SidebarCard title="Recent Activity" icon={<TrendingSmIcon />}>
      <div className="space-y-0">
        <ActivityRow
          icon={<UploadTinyIcon />}
          text="COI uploaded for Pacific Coast Janitorial"
          time="2h ago"
        />
        <ActivityRow
          icon={<ShieldTinyIcon />}
          text="Compliance calculated: compliant"
          time="3h ago"
        />
        <ActivityRow
          icon={<BellTinyIcon />}
          text="Reminder sent to Summit Mechanical"
          time="5h ago"
        />
        <ActivityRow
          icon={<PlusTinyIcon />}
          text="Vendor Atlas Fire Protection added"
          time="1d ago"
          isLast
        />
      </div>
      <span className="mt-2 inline-flex items-center gap-0.5 text-[9px] font-medium text-emerald-600">
        View all activity &rsaquo;
      </span>
    </SidebarCard>
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
    <div className="flex gap-2 py-1.5">
      <div className="relative flex flex-col items-center">
        <div className="flex h-5 w-5 items-center justify-center rounded-md bg-slate-50">
          {icon}
        </div>
        {!isLast && <div className="mt-0.5 w-px flex-1 bg-slate-100" />}
      </div>
      <div className="min-w-0 flex-1 pb-0.5">
        <p className="text-[9px] leading-snug text-slate-600">{text}</p>
        <p className="text-[8px] text-slate-400">{time}</p>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────────────────────
   Inline SVG Icons (zero dependencies)
   ────────────────────────────────────────────────────────────── */

const navIconCls = 'h-3.5 w-3.5';
const cardIconCls = 'h-3 w-3 text-slate-400';
const tinyIconCls = 'h-2.5 w-2.5 text-slate-400';

/* ── Nav Icons ── */

function DashboardIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  );
}

function BuildingIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}

function FileCheckIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <path d="M9 15l2 2 4-4" />
    </svg>
  );
}

function BellSmIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </svg>
  );
}

function CreditCardIcon() {
  return (
    <svg className={navIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  );
}

/* ── Card header icons ── */

function BuildingSmIcon() {
  return (
    <svg className={cardIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" />
      <path d="M9 22v-4h6v4" />
      <path d="M8 6h.01M16 6h.01M12 6h.01M8 10h.01M16 10h.01M12 10h.01M8 14h.01M16 14h.01M12 14h.01" />
    </svg>
  );
}


function TrendingSmIcon() {
  return (
    <svg className={cardIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
      <polyline points="17 6 23 6 23 12" />
    </svg>
  );
}

/* ── Action row icons ── */

function AlertIcon() {
  return (
    <svg className="h-3 w-3 text-amber-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function MailSmIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M22 7l-10 7L2 7" />
    </svg>
  );
}

function UploadSmIcon() {
  return (
    <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

/* ── Tiny activity icons ── */

function UploadTinyIcon() {
  return (
    <svg className={tinyIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16,16 12,12 8,16" />
      <line x1="12" y1="12" x2="12" y2="21" />
      <path d="M20.39 18.39A5 5 0 0018 9h-1.26A8 8 0 103 16.3" />
    </svg>
  );
}

function ShieldTinyIcon() {
  return (
    <svg className={tinyIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      <polyline points="9,12 11,14 15,10" />
    </svg>
  );
}

function BellTinyIcon() {
  return (
    <svg className={tinyIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 01-3.46 0" />
    </svg>
  );
}

function PlusTinyIcon() {
  return (
    <svg className={tinyIconCls} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  );
}
