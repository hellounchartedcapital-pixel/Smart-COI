import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isOrgOnboarded } from '@/lib/actions/auth';
import { DashboardShell } from '@/components/dashboard/sidebar';
import type { Industry } from '@/types';
import { TrialBanner } from '@/components/dashboard/trial-banner';
import { UpgradeModalProvider } from '@/components/dashboard/upgrade-modal';
import { SessionGuard } from '@/components/dashboard/session-guard';
import { PostHogProvider } from '@/components/posthog-provider';
import { CrispChat } from '@/components/crisp-chat';
import { DashboardAccessGate } from '@/components/dashboard/dashboard-access-gate';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch the user's profile and org name — use fallbacks if missing
  const { data: profile } = await supabase
    .from('users')
    .select('full_name, email, organization_id')
    .eq('id', user.id)
    .single();

  let orgName = 'My Organization';
  let orgPlan = 'trial';
  let trialEndsAt: string | null = null;
  let paymentFailed = false;
  let orgIndustry: Industry | null = null;
  let onboardingCompleted = false;
  if (profile?.organization_id) {
    const { data: org } = await supabase
      .from('organizations')
      .select('name, settings, plan, trial_ends_at, payment_failed, industry')
      .eq('id', profile.organization_id)
      .single();
    if (org?.name) orgName = org.name;
    orgPlan = org?.plan ?? 'trial';
    trialEndsAt = org?.trial_ends_at ?? null;
    paymentFailed = org?.payment_failed ?? false;
    orgIndustry = (org?.industry as Industry) ?? null;

    // Use the service-role-based check which also has a property/vendor fallback
    // and auto-fixes stale data. This bypasses any RLS issues with reading settings.
    onboardingCompleted = await isOrgOnboarded(profile.organization_id);
  }

  if (!onboardingCompleted) {
    console.log('[DashboardLayout] Redirecting to /setup — profile:', !!profile, 'orgId:', profile?.organization_id ?? 'none');
    redirect('/setup');
  }

  const userEmail = profile?.email ?? user.email ?? '';
  const userName = profile?.full_name ?? undefined;

  return (
    <PostHogProvider userEmail={userEmail} userName={userName ?? undefined}>
      <UpgradeModalProvider>
        <SessionGuard />
        <CrispChat userEmail={userEmail} userName={userName ?? undefined} />
        <div className="flex h-screen overflow-hidden bg-slate-50/50">
          <DashboardShell
            userName={userName ?? null}
            userEmail={userEmail}
            orgName={orgName}
            industry={orgIndustry}
            trialDaysLeft={(() => {
              if (orgPlan !== 'trial' || !trialEndsAt) return null;
              const msLeft = new Date(trialEndsAt).getTime() - Date.now();
              return Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));
            })()}
            plan={orgPlan}
            topBanner={<TrialBanner plan={orgPlan} trialEndsAt={trialEndsAt} paymentFailed={paymentFailed} />}
          >
            <DashboardAccessGate plan={orgPlan}>{children}</DashboardAccessGate>
          </DashboardShell>
        </div>
      </UpgradeModalProvider>
    </PostHogProvider>
  );
}
