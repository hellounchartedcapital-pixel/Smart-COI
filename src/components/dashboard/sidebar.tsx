'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  FileCheck,
  Bell,
  Settings,
  CreditCard,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
  Menu,
  X,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/lib/auth';

const COLLAPSED_KEY = 'smartcoi-sidebar-collapsed';

/* ------------------------------------------------------------------ */
/* Nav items grouped by section (Remote.com-inspired grouping)        */
/* ------------------------------------------------------------------ */

interface NavItem {
  label: string;
  href: string;
  icon: typeof LayoutDashboard;
  tutorialId: string | null;
}

interface NavGroup {
  title: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tutorialId: null },
    ],
  },
  {
    title: 'COMPLIANCE',
    items: [
      { label: 'Properties', href: '/dashboard/properties', icon: Building2, tutorialId: 'nav-properties' },
      { label: 'Templates', href: '/dashboard/templates', icon: FileCheck, tutorialId: 'nav-templates' },
      { label: 'Notifications', href: '/dashboard/notifications', icon: Bell, tutorialId: 'nav-notifications' },
    ],
  },
  {
    title: 'ACCOUNT',
    items: [
      { label: 'Settings', href: '/dashboard/settings', icon: Settings, tutorialId: null },
      { label: 'Billing', href: '/dashboard/settings/billing', icon: CreditCard, tutorialId: null },
    ],
  },
];

// Flat list for backward-compatible getPageTitle
const navItems = navGroups.flatMap((g) => g.items);

function getPageTitle(pathname: string): string {
  const sorted = [...navItems].sort((a, b) => b.href.length - a.href.length);
  const match = sorted.find(
    (item) =>
      pathname === item.href ||
      (item.href !== '/dashboard' && pathname.startsWith(item.href + '/'))
  );
  return match?.label ?? 'Dashboard';
}

/* ------------------------------------------------------------------ */
/* Trial indicator (mini progress bar in sidebar)                     */
/* ------------------------------------------------------------------ */

interface TrialIndicatorProps {
  trialDaysLeft: number | null;
  plan: string;
  collapsed: boolean;
}

function TrialIndicator({ trialDaysLeft, plan, collapsed }: TrialIndicatorProps) {
  if (plan !== 'trial' || trialDaysLeft === null) return null;
  const totalDays = 14;
  const daysUsed = totalDays - trialDaysLeft;
  const progress = Math.min(100, Math.round((daysUsed / totalDays) * 100));

  if (collapsed) {
    return (
      <div className="px-2 py-3 hidden md:block" title={`${trialDaysLeft} days left in trial`}>
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-3 my-3 rounded-xl border border-emerald-100 bg-emerald-50/50 px-3 py-3">
      <p className="text-[11px] font-semibold text-emerald-800">Free trial</p>
      <p className="mt-0.5 text-[11px] text-emerald-600">
        {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
      </p>
      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-emerald-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Link
        href="/dashboard/settings/billing"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
      >
        Upgrade now
        <ChevronRight className="h-3 w-3" />
      </Link>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* DashboardShell                                                      */
/* ------------------------------------------------------------------ */

interface DashboardShellProps {
  userName: string | null;
  userEmail: string;
  orgName: string;
  trialDaysLeft?: number | null;
  plan?: string;
  topBanner?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  userName,
  userEmail,
  orgName,
  trialDaysLeft = null,
  plan = '',
  topBanner,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored === 'true') setCollapsed(true);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const pageTitle = getPageTitle(pathname);

  // Initials for user avatar
  const initials = userName
    ? userName
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : userEmail[0]?.toUpperCase() ?? 'U';

  return (
    <>
      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed top-0 left-0 z-50 flex h-full flex-col bg-white transition-all duration-200 ease-in-out',
          // Subtle right shadow instead of hard border
          'shadow-[1px_0_0_0_rgba(0,0,0,0.06)]',
          'md:relative md:z-auto',
          mobileOpen
            ? 'w-64 translate-x-0'
            : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[68px]' : 'md:w-[260px]'
        )}
      >
        {/* Logo & org */}
        <div className={cn(
          'flex items-center gap-3 px-5 py-5',
          collapsed ? 'md:justify-center md:px-0' : ''
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.svg"
            alt="SmartCOI"
            className="h-8 w-8 flex-shrink-0"
          />
          <div
            className={cn(
              'min-w-0 transition-opacity duration-200',
              collapsed ? 'md:hidden' : ''
            )}
          >
            <p className="truncate text-[15px] font-bold text-slate-900 tracking-tight">
              SmartCOI
            </p>
            <p className="truncate text-[11px] text-slate-400 mt-0.5">{orgName}</p>
          </div>

          {/* Mobile close button */}
          <button
            onClick={() => setMobileOpen(false)}
            className="ml-auto rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 md:hidden"
            aria-label="Close menu"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Navigation groups */}
        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-2">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={cn(gi > 0 ? 'mt-6' : '')} {...(group.title === 'COMPLIANCE' ? { 'data-tour': 'sidebar-nav' } : {})}>
              {/* Group label */}
              <div
                className={cn(
                  'mb-2 px-3 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400',
                  collapsed ? 'md:hidden' : ''
                )}
              >
                {group.title}
              </div>

              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const matches =
                    pathname === item.href ||
                    (item.href !== '/dashboard' &&
                      pathname.startsWith(item.href + '/'));
                  const hasMoreSpecificMatch = matches && navItems.some(
                    (other) =>
                      other.href !== item.href &&
                      other.href.startsWith(item.href + '/') &&
                      (pathname === other.href || pathname.startsWith(other.href + '/'))
                  );
                  const isActive = matches && !hasMoreSpecificMatch;
                  const Icon = item.icon;

                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        data-tour={item.tutorialId ?? undefined}
                        className={cn(
                          'group relative flex h-10 items-center gap-3 rounded-lg text-[13px] font-medium transition-colors',
                          collapsed ? 'md:justify-center md:px-0' : 'px-3',
                          isActive
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-emerald-500" />
                        )}
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] flex-shrink-0',
                            isActive
                              ? 'text-emerald-600'
                              : 'text-slate-400 group-hover:text-slate-500'
                          )}
                          strokeWidth={isActive ? 2 : 1.75}
                        />
                        <span
                          className={cn(
                            'transition-opacity duration-200',
                            collapsed ? 'md:hidden' : ''
                          )}
                        >
                          {item.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Trial indicator */}
        <TrialIndicator trialDaysLeft={trialDaysLeft ?? null} plan={plan ?? ''} collapsed={collapsed} />

        {/* Bottom section — user info + sign out */}
        <div className="border-t border-slate-100 p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              collapsed ? 'md:justify-center md:px-0' : ''
            )}
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-[11px] font-bold text-emerald-700">
              {initials}
            </div>
            <div
              className={cn(
                'min-w-0 flex-1 transition-opacity duration-200',
                collapsed ? 'md:hidden' : ''
              )}
            >
              <p className="truncate text-[13px] font-medium text-slate-900">
                {userName ?? 'User'}
              </p>
              <p className="truncate text-[11px] text-slate-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className={cn(
              'mt-1 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-slate-500 transition-colors hover:bg-slate-50 hover:text-slate-700',
              collapsed && 'md:justify-center md:px-0'
            )}
            title={collapsed ? 'Sign out' : undefined}
          >
            <LogOut className="h-4 w-4 flex-shrink-0" />
            <span
              className={cn(
                'transition-opacity duration-200',
                collapsed ? 'md:hidden' : ''
              )}
            >
              Sign out
            </span>
          </button>
        </div>

        {/* Desktop collapse toggle */}
        <div className="hidden border-t border-slate-100 md:block">
          <button
            onClick={toggleCollapsed}
            className="flex h-10 w-full items-center justify-center text-slate-400 transition-colors hover:bg-slate-50 hover:text-slate-500"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main area (header + content) */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-slate-100 bg-white/90 px-6 backdrop-blur-sm md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="mr-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-50 md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-[15px] font-semibold text-slate-900">{pageTitle}</h1>
        </header>

        {/* Trial / plan banner */}
        {topBanner}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-slate-50/50 p-6 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
