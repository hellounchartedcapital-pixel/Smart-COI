// ============================================================================
// SmartCOI — Trial Lifecycle Emails
// Automated email sequence for trial users: welcome, feature highlight,
// midpoint check-in, trial ending, and trial expired.
// ============================================================================

import { createServiceClient } from '@/lib/supabase/service';
import { sendNotificationEmail } from '@/lib/notifications/email-sender';
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry } from '@/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartcoi.io';
const SITE_URL = 'https://smartcoi.io';

// Email IDs for tracking which have been sent
type TrialEmailId = 'day1_welcome' | 'day3_feature' | 'day7_checkin' | 'day12_ending' | 'day14_expired';

interface TrialEmailsSent {
  [key: string]: string; // emailId → ISO date sent
}

interface OrgUser {
  email: string;
  full_name: string | null;
}

interface OrgStats {
  certificateCount: number;
  vendorCount: number;
  tenantCount: number;
  complianceRate: number | null;
}

// ============================================================================
// Main entry point — called from the daily cron job
// ============================================================================

export async function processTrialLifecycleEmails(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createServiceClient();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Fetch all trial orgs (active or recently expired — within 1 day of expiry)
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, plan, trial_ends_at, trial_emails_sent, created_at, industry')
    .eq('plan', 'trial')
    .not('trial_ends_at', 'is', null);

  if (orgError || !orgs) {
    console.error('[trial-lifecycle] Failed to fetch trial orgs:', orgError);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  // Also fetch recently expired trials that haven't received the expired email
  const { data: expiredOrgs } = await supabase
    .from('organizations')
    .select('id, plan, trial_ends_at, trial_emails_sent, created_at, industry')
    .eq('plan', 'trial')
    .not('trial_ends_at', 'is', null)
    .lt('trial_ends_at', new Date().toISOString());

  // Combine and deduplicate
  const allOrgs = [...(orgs || [])];
  for (const eo of expiredOrgs || []) {
    if (!allOrgs.find((o) => o.id === eo.id)) {
      allOrgs.push(eo);
    }
  }

  for (const org of allOrgs) {
    const emailsSent: TrialEmailsSent = (org.trial_emails_sent as TrialEmailsSent) || {};
    const trialEndsAt = new Date(org.trial_ends_at);
    const now = new Date();
    const daysLeft = Math.ceil((trialEndsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const trialDaysPassed = 14 - daysLeft;

    // Get the primary user for this org
    const { data: users } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organization_id', org.id)
      .limit(1);

    if (!users || users.length === 0) continue;
    const user = users[0] as OrgUser;
    const firstName = getFirstName(user.full_name);

    // Determine which email to send (only one per cron run per org)
    let emailToSend: TrialEmailId | null = null;

    if (!emailsSent.day1_welcome && trialDaysPassed >= 0) {
      emailToSend = 'day1_welcome';
    } else if (!emailsSent.day3_feature && trialDaysPassed >= 3) {
      emailToSend = 'day3_feature';
    } else if (!emailsSent.day7_checkin && trialDaysPassed >= 7) {
      emailToSend = 'day7_checkin';
    } else if (!emailsSent.day12_ending && trialDaysPassed >= 12) {
      emailToSend = 'day12_ending';
    } else if (!emailsSent.day14_expired && daysLeft <= 0) {
      emailToSend = 'day14_expired';
    }

    if (!emailToSend) {
      skipped++;
      continue;
    }

    // For day3, check if user has uploaded any certificates
    if (emailToSend === 'day3_feature') {
      const { count } = await supabase
        .from('certificates')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', org.id);
      if (count && count > 0) {
        // User has uploaded certificates, skip this email and mark as sent
        await markEmailSent(supabase, org.id, emailsSent, 'day3_feature');
        skipped++;
        continue;
      }
    }

    // For day7, fetch stats
    let stats: OrgStats | null = null;
    if (emailToSend === 'day7_checkin') {
      stats = await getOrgStats(supabase, org.id);
    }

    // Build the email
    const industry = (org.industry as Industry) ?? null;
    const template = buildEmail(emailToSend, firstName, stats, industry);
    if (!template) {
      skipped++;
      continue;
    }

    // Send via Resend
    try {
      const result = await sendNotificationEmail(user.email, template.subject, template.html);
      if (result.success || result.devMode) {
        await markEmailSent(supabase, org.id, emailsSent, emailToSend);
        sent++;
        console.log(`[trial-lifecycle] Sent ${emailToSend} to ${user.email} (org=${org.id})`);
      } else {
        errors++;
        console.error(`[trial-lifecycle] Failed to send ${emailToSend} to ${user.email}: ${result.error}`);
      }
    } catch (err) {
      errors++;
      console.error(`[trial-lifecycle] Error sending ${emailToSend} to ${user.email}:`, err);
    }
  }

  return { sent, skipped, errors };
}

// ============================================================================
// Helpers
// ============================================================================

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'there';
  const first = fullName.split(' ')[0];
  return first || 'there';
}

async function markEmailSent(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
  existing: TrialEmailsSent,
  emailId: TrialEmailId
) {
  const updated = { ...existing, [emailId]: new Date().toISOString() };
  await supabase
    .from('organizations')
    .update({ trial_emails_sent: updated })
    .eq('id', orgId);
}

async function getOrgStats(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string
): Promise<OrgStats> {
  // Query unified entities table (not legacy vendors/tenants) to get accurate stats
  const [certRes, entityRes] = await Promise.all([
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('entities')
      .select('id, entity_type, compliance_status')
      .eq('organization_id', orgId)
      .is('deleted_at', null)
      .is('archived_at', null),
  ]);

  const entities = entityRes.data ?? [];
  const vendorCount = entities.filter((e) => e.entity_type !== 'tenant').length;
  const tenantCount = entities.filter((e) => e.entity_type === 'tenant').length;
  const totalEntities = entities.length;

  let complianceRate: number | null = null;
  if (totalEntities > 0) {
    const compliant = entities.filter(
      (e) => e.compliance_status === 'compliant'
    ).length;
    complianceRate = Math.round((compliant / totalEntities) * 100);
  }

  return {
    certificateCount: certRes.count ?? 0,
    vendorCount,
    tenantCount,
    complianceRate,
  };
}

// ============================================================================
// Email templates — personal tone, from Tony
// ============================================================================

function getIndustryValueProp(industry: Industry | null): string {
  const terms = getTerminology(industry);
  switch (industry) {
    case 'property_management':
      return `Track ${terms.entity.toLowerCase()} and ${terms.tenant?.toLowerCase() ?? 'tenant'} insurance across your ${terms.locationPlural.toLowerCase()}`;
    case 'construction':
      return `Track ${terms.entity.toLowerCase()} insurance across your ${terms.locationPlural.toLowerCase()}`;
    case 'logistics':
      return `Track ${terms.entity.toLowerCase()} insurance certificates at scale`;
    default:
      return `Track ${terms.entity.toLowerCase()} insurance compliance automatically`;
  }
}

function buildEmail(
  emailId: TrialEmailId,
  firstName: string,
  stats: OrgStats | null,
  industry: Industry | null
): { subject: string; html: string } | null {
  switch (emailId) {
    case 'day1_welcome':
      return day1Welcome(firstName, industry);
    case 'day3_feature':
      return day3Feature(firstName, industry);
    case 'day7_checkin':
      return day7Checkin(firstName, stats!);
    case 'day12_ending':
      return day12Ending(firstName);
    case 'day14_expired':
      return day14Expired(firstName);
    default:
      return null;
  }
}

const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

function personalWrapper(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:${FONT_STACK};background:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 20px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;text-align:left;">
  <tr><td style="font-size:16px;line-height:1.6;color:#374151;">
${body}
  </td></tr>
  <tr><td style="padding-top:32px;font-size:13px;color:#9CA3AF;border-top:1px solid #F3F4F6;margin-top:32px;">
    You're receiving this because you signed up for SmartCOI.<br>
    <a href="${SITE_URL}" style="color:#9CA3AF;text-decoration:none;">smartcoi.io</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function trialCtaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td>
  <a href="${href}" style="display:inline-block;background:#73E2A7;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${label}</a>
</td></tr>
</table>`;
}

function day1Welcome(firstName: string, industry: Industry | null): { subject: string; html: string } {
  const valueProp = getIndustryValueProp(industry);
  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">I'm Tony, the founder of SmartCOI. Welcome aboard.</p>

<p style="margin:0 0 20px;">I built SmartCOI because I got tired of chasing people for updated certificates. ${valueProp} &mdash; without the spreadsheets and manual follow-ups.</p>

<p style="margin:0 0 20px;">Quick question &mdash; what's the biggest COI headache you're hoping to solve? Reply and let me know. It helps me make sure you get the most out of SmartCOI.</p>

${trialCtaButton(APP_URL + '/dashboard', 'Go to Dashboard')}

<p style="margin:0;">Tony<br><span style="color:#6B7280;">Founder, SmartCOI</span></p>`;

  return {
    subject: 'Welcome to SmartCOI — let me know what you need',
    html: personalWrapper(body),
  };
}

function day3Feature(firstName: string, industry: Industry | null): { subject: string; html: string } {
  const terms = getTerminology(industry);
  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">How's it going? Most teams start with the bulk upload &mdash; drag and drop your certificate PDFs and the AI builds your ${terms.entity.toLowerCase()} compliance roster automatically.</p>

<p style="margin:0 0 20px;">No typing names or coverage limits. Most teams have everything loaded in about 10 minutes &mdash; and your first compliance report is on us.</p>

${trialCtaButton(APP_URL + '/dashboard', 'Upload Your First COI')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">Already started? Great &mdash; ignore this. Need help? Just reply.</p>

<p style="margin:0;">Tony</p>`;

  return {
    subject: "How's it going?",
    html: personalWrapper(body),
  };
}

function day7Checkin(firstName: string, stats: OrgStats): { subject: string; html: string } {
  const hasActivity = stats.certificateCount > 0 || stats.vendorCount > 0;

  let statsBlock: string;
  if (hasActivity) {
    const complianceStr = stats.complianceRate != null ? `${stats.complianceRate}%` : '\u2014';
    statsBlock = `
<p style="margin:0 0 16px;">Here's your compliance snapshot:</p>
<table cellpadding="0" cellspacing="0" style="margin:0 0 20px;font-size:15px;color:#374151;">
  <tr><td style="padding:4px 16px 4px 0;"><strong>${stats.certificateCount}</strong></td><td style="padding:4px 0;color:#6B7280;">certificates uploaded</td></tr>
  <tr><td style="padding:4px 16px 4px 0;"><strong>${stats.vendorCount}</strong></td><td style="padding:4px 0;color:#6B7280;">entities tracked</td></tr>
  <tr><td style="padding:4px 16px 4px 0;"><strong>${complianceStr}</strong></td><td style="padding:4px 0;color:#6B7280;">compliance rate</td></tr>
</table>`;
  } else {
    statsBlock = `
<p style="margin:0 0 20px;">It looks like you haven't uploaded certificates yet. Want me to help? I can do a quick 10-minute walkthrough &mdash; just reply with a time that works.</p>`;
  }

  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">Quick check-in &mdash; how's SmartCOI working out for you?</p>

${statsBlock}

${trialCtaButton(APP_URL + '/dashboard', 'View Dashboard')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">Questions? Just reply &mdash; I read every email.</p>

<p style="margin:0;">Tony</p>`;

  return {
    subject: 'Your compliance snapshot',
    html: personalWrapper(body),
  };
}

function day12Ending(firstName: string): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">Your SmartCOI trial ends in 2 days.</p>

<p style="margin:0 0 16px;">If SmartCOI is saving you time, upgrade to keep everything running:</p>

<ul style="padding-left:20px;margin:0 0 20px;color:#374151;line-height:1.8;">
  <li><strong>Monitor</strong> &mdash; continuous compliance tracking + expiration alerts ($79/mo, up to 50 certificates)</li>
  <li><strong>Automate</strong> &mdash; adds the vendor portal, automated renewal follow-ups, and lease extraction ($149/mo, up to 150 certificates)</li>
  <li><strong>Full Platform</strong> &mdash; unlimited certificates, custom templates, bulk operations, and priority support ($249/mo)</li>
</ul>

<p style="margin:0 0 20px;">All your data, templates, and settings carry over the moment you upgrade.</p>

${trialCtaButton(APP_URL + '/dashboard/settings/billing', 'See Plans')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">Need more time or want to talk through which plan fits? Just reply.</p>

<p style="margin:0;">Tony</p>`;

  return {
    subject: 'Your trial ends soon',
    html: personalWrapper(body),
  };
}

function day14Expired(firstName: string): { subject: string; html: string } {
  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">Your 14-day trial has ended.</p>

<p style="margin:0 0 20px;">Your data is saved &mdash; entities, templates, compliance status, all of it. Upgrade to <strong>Monitor</strong> ($79/mo) and you'll pick up right where you left off, with continuous compliance tracking from then on.</p>

${trialCtaButton(APP_URL + '/dashboard/settings/billing', 'Upgrade to Monitor')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">Not the right fit? I'd appreciate knowing why &mdash; just reply with a sentence or two.</p>

<p style="margin:0;">Tony</p>`;

  return {
    subject: 'Your trial has ended',
    html: personalWrapper(body),
  };
}
