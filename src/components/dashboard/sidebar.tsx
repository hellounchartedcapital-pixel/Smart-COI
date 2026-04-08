'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Users,
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
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry } from '@/types';

const COLLAPSED_KEY = 'smartcoi-sidebar-collapsed';

/* ------------------------------------------------------------------ */
/* Nav items grouped by section                                       */
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

function buildNavGroups(industry: Industry | null): NavGroup[] {
  const terms = getTerminology(industry);
  const entityLabel = terms.hasTenants
    ? `${terms.entityPlural} & ${terms.tenantPlural}`
    : terms.entityPlural;

  return [
    {
      title: 'OVERVIEW',
      items: [
        { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, tutorialId: null },
      ],
    },
    {
      title: 'COMPLIANCE',
      items: [
        { label: terms.locationPlural, href: '/dashboard/properties', icon: Building2, tutorialId: 'nav-properties' },
        { label: entityLabel, href: '/dashboard/entities', icon: Users, tutorialId: 'nav-entities' },
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
}

function getPageTitle(pathname: string, industry: Industry | null): string {
  const groups = buildNavGroups(industry);
  const items = groups.flatMap((g) => g.items);
  const sorted = [...items].sort((a, b) => b.href.length - a.href.length);
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
    <div className="mx-3 my-3 rounded-lg border border-[#E5E7EB] bg-white px-3 py-3">
      <p className="text-[11px] font-medium text-[#111827]">Free trial</p>
      <p className="mt-0.5 text-[11px] text-[#6B7280]">
        {trialDaysLeft} {trialDaysLeft === 1 ? 'day' : 'days'} left
      </p>
      <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-[#F3F4F6]">
        <div
          className="h-full rounded-full bg-brand transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <Link
        href="/dashboard/settings/billing"
        className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark hover:text-[#111827]"
      >
        Upgrade
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
  industry?: Industry | null;
  trialDaysLeft?: number | null;
  plan?: string;
  topBanner?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardShell({
  userName,
  userEmail,
  orgName,
  industry = null,
  trialDaysLeft = null,
  plan = '',
  topBanner,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navGroups = buildNavGroups(industry);
  const navItems = navGroups.flatMap((g) => g.items);

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

  const pageTitle = getPageTitle(pathname, industry);

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
          'fixed top-0 left-0 z-50 flex h-full flex-col bg-[#FAFAFA] transition-all duration-200 ease-in-out',
          'border-r border-[#E5E7EB]',
          'md:relative md:z-auto',
          mobileOpen
            ? 'w-60 translate-x-0'
            : '-translate-x-full md:translate-x-0',
          collapsed ? 'md:w-[68px]' : 'md:w-[240px]'
        )}
      >
        {/* Logo & org */}
        <div className={cn(
          'flex items-center gap-3 px-4 py-5',
          collapsed ? 'md:justify-center md:px-0' : ''
        )}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo-icon.svg"
            alt="SmartCOI"
            className="h-7 w-7 flex-shrink-0"
          />
          <div
            className={cn(
              'min-w-0 transition-opacity duration-200',
              collapsed ? 'md:hidden' : ''
            )}
          >
            <p className="truncate text-sm font-bold text-[#111827] tracking-tight">
              SmartCOI
            </p>
            <p className="truncate text-[11px] text-[#9CA3AF] mt-0.5">{orgName}</p>
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
        <nav className="flex-1 overflow-y-auto px-3 pb-4 pt-1">
          {navGroups.map((group, gi) => (
            <div key={group.title} className={cn(gi > 0 ? 'mt-5' : '')} {...(group.title === 'COMPLIANCE' ? { 'data-tour': 'sidebar-nav' } : {})}>
              {/* Group label */}
              <div
                className={cn(
                  'mb-1.5 px-3 text-[11px] font-medium uppercase tracking-[0.05em] text-[#9CA3AF]',
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
                          'group relative flex h-9 items-center gap-3 rounded-lg text-sm transition-colors',
                          collapsed ? 'md:justify-center md:px-0' : 'px-3',
                          isActive
                            ? 'bg-[#E8FAF0] font-semibold text-[#111827]'
                            : 'font-medium text-[#374151] hover:bg-[#F3F4F6] hover:text-[#111827]'
                        )}
                        title={collapsed ? item.label : undefined}
                      >
                        {/* Active indicator bar */}
                        {isActive && (
                          <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-brand" />
                        )}
                        <Icon
                          className={cn(
                            'h-[18px] w-[18px] flex-shrink-0',
                            isActive
                              ? 'text-brand-dark'
                              : 'text-[#9CA3AF] group-hover:text-[#6B7280]'
                          )}
                          strokeWidth={1.75}
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
        <div className="border-t border-[#E5E7EB] p-3">
          <div
            className={cn(
              'flex items-center gap-3 rounded-lg px-2 py-2',
              collapsed ? 'md:justify-center md:px-0' : ''
            )}
          >
            {/* Avatar */}
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#E8FAF0] text-[11px] font-semibold text-brand-dark">
              {initials}
            </div>
            <div
              className={cn(
                'min-w-0 flex-1 transition-opacity duration-200',
                collapsed ? 'md:hidden' : ''
              )}
            >
              <p className="truncate text-[13px] font-medium text-[#111827]">
                {userName ?? 'User'}
              </p>
              <p className="truncate text-[11px] text-[#9CA3AF]">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={() => signOut()}
            className={cn(
              'mt-1 flex h-9 w-full items-center gap-3 rounded-lg px-3 text-[13px] font-medium text-[#6B7280] transition-colors hover:bg-[#F3F4F6] hover:text-[#111827]',
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
        <div className="hidden border-t border-[#E5E7EB] md:block">
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
        <header className="sticky top-0 z-20 flex h-14 items-center border-b border-[#F3F4F6] bg-white px-6 md:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="mr-3 rounded-lg p-1.5 text-[#9CA3AF] hover:bg-[#F3F4F6] md:hidden"
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="text-sm font-semibold text-[#111827]">{pageTitle}</h1>
        </header>

        {/* Trial / plan banner */}
        {topBanner}

        {/* Scrollable content */}
        <main className="flex-1 overflow-y-auto bg-white p-6 md:p-8">
          {children}
        </main>
      </div>
    </>
  );
}
