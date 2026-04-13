'use client';

import { usePathname } from 'next/navigation';
import { FreeTierDashboardGate } from './upgrade-prompt';
import { hasDashboardAccess, isFreeTier } from '@/lib/plan-features';

// Paths a Free-tier user IS allowed to reach inside the dashboard shell.
// Anything else gets replaced with the Free-tier upgrade prompt.
const FREE_TIER_ALLOWED = [
  '/dashboard/settings/billing',
];

function isAllowedForFreeTier(pathname: string): boolean {
  return FREE_TIER_ALLOWED.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Wraps dashboard children with a plan-gate. Free-tier users see the
 * upgrade prompt instead of the real page (except on the billing page,
 * which is where they upgrade from).
 *
 * Runs client-side because server components can't read pathname without
 * threading headers through the layout.
 */
export function DashboardAccessGate({
  plan,
  children,
}: {
  plan: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Trial/Monitor/Automate/Full Platform/legacy paid plans → pass through
  if (hasDashboardAccess(plan)) {
    return <>{children}</>;
  }

  // Free tier — billing page stays accessible, everything else is gated
  if (isFreeTier(plan) && !isAllowedForFreeTier(pathname)) {
    // `latest` is a server-side sentinel at /report/[reportId] that
    // resolves to the user's most recent free compliance report.
    return <FreeTierDashboardGate reportId="latest" />;
  }

  return <>{children}</>;
}
