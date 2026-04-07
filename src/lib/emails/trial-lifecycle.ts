// ============================================================================
// SmartCOI — Trial Lifecycle Emails
// Automated email sequence for trial users: welcome, feature highlight,
// midpoint check-in, trial ending, and trial expired.
// ============================================================================

import { createServiceClient } from '@/lib/supabase/service';
import { sendNotificationEmail } from '@/lib/notifications/email-sender';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartcoi.io';
const SITE_URL = 'https://smartcoi.io';
const TONY_FROM = 'Tony from SmartCOI <contact@smartcoi.io>';

// Email IDs for tracking which have been sent
type TrialEmailId = 'day1_welcome' | 'day3_feature' | 'day7_checkin' | 'day12_ending' | 'day14_expired';

interface TrialEmailsSent {
  [key: string]: string; // emailId → ISO date sent
}

interface OrgTrialData {
  id: string;
  plan: string;
  trial_ends_at: string;
  trial_emails_sent: TrialEmailsSent | null;
  created_at: string;
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
    .select('id, plan, trial_ends_at, trial_emails_sent, created_at')
    .eq('plan', 'trial')
    .not('trial_ends_at', 'is', null);

  if (orgError || !orgs) {
    console.error('[trial-lifecycle] Failed to fetch trial orgs:', orgError);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  // Also fetch recently expired trials that haven't received the expired email
  const { data: expiredOrgs } = await supabase
    .from('organizations')
    .select('id, plan, trial_ends_at, trial_emails_sent, created_at')
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
    const template = buildEmail(emailToSend, firstName, stats);
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
  const [certRes, vendorRes, tenantRes] = await Promise.all([
    supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId),
    supabase
      .from('vendors')
      .select('id, compliance_status', { count: 'exact' })
      .eq('organization_id', orgId)
      .is('archived_at', null),
    supabase
      .from('tenants')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', orgId)
      .is('archived_at', null),
  ]);

  const vendorCount = vendorRes.count ?? 0;
  const tenantCount = tenantRes.count ?? 0;
  const totalEntities = vendorCount + tenantCount;

  let complianceRate: number | null = null;
  if (totalEntities > 0 && vendorRes.data) {
    const compliant = vendorRes.data.filter(
      (v: { compliance_status: string }) => v.compliance_status === 'compliant'
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

function buildEmail(
  emailId: TrialEmailId,
  firstName: string,
  stats: OrgStats | null
): { subject: string; html: string } | null {
  switch (emailId) {
    case 'day1_welcome':
      return day1Welcome(firstName);
    case 'day3_feature':
      return day3Feature(firstName);
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

function personalWrapper(body: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#ffffff;">
<table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;text-align:left;">
  <tr><td style="font-size:14px;line-height:1.7;color:#334155;">
${body}
  </td></tr>
  <tr><td style="padding-top:24px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;margin-top:24px;">
    You're receiving this because you signed up for a SmartCOI trial.<br>
    <a href="${SITE_URL}" style="color:#94a3b8;">SmartCOI</a> · AI-powered COI compliance tracking
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function day1Welcome(firstName: string): { subject: string; html: string } {
  const body = `
<p>Hi ${firstName},</p>

<p>I'm Tony, the founder of SmartCOI. I built this because I manage properties myself and got tired of chasing vendors for updated certificates.</p>

<p>I wanted to personally welcome you and ask — what's the biggest COI headache you're hoping SmartCOI solves? Understanding your situation helps me make sure you get the most out of your trial.</p>

<p>A few things to try first:</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li style="margin-bottom:6px;">Upload a certificate PDF and watch the AI extract everything in seconds</li>
  <li style="margin-bottom:6px;">Check out the compliance templates — they're pre-built for standard vendor and tenant requirements</li>
  <li style="margin-bottom:6px;">Try the bulk upload if you have a folder of COIs ready to go</li>
</ul>

<p>If you have any questions, just reply to this email. It comes straight to me.</p>

<p>Tony<br>Founder, SmartCOI</p>`;

  return {
    subject: 'Welcome to SmartCOI — quick question',
    html: personalWrapper(body),
  };
}

function day3Feature(firstName: string): { subject: string; html: string } {
  const body = `
<p>Hi ${firstName},</p>

<p>Most teams who try SmartCOI start with the bulk upload — drag and drop up to 50 certificate PDFs at once, and the AI builds your compliance roster automatically. No typing names or coverage limits.</p>

<p>If you have a folder of COIs on your computer or in a shared drive, give it a try:</p>
<ol style="padding-left:20px;margin:12px 0;">
  <li style="margin-bottom:6px;">Log in to <a href="${APP_URL}/dashboard" style="color:#059669;">SmartCOI</a></li>
  <li style="margin-bottom:6px;">Click "Upload COI" on your dashboard</li>
  <li style="margin-bottom:6px;">Select your files — the AI does the rest</li>
</ol>

<p>Most teams have everything loaded in about 10 minutes.</p>

<p>If you've already started uploading — great, ignore this email. If you need help getting set up, just reply and I'll walk you through it.</p>

<p>Tony</p>`;

  return {
    subject: 'The fastest way to get started with SmartCOI',
    html: personalWrapper(body),
  };
}

function day7Checkin(firstName: string, stats: OrgStats): { subject: string; html: string } {
  const hasActivity = stats.certificateCount > 0 || stats.vendorCount > 0;

  let statsBlock: string;
  if (hasActivity) {
    const complianceStr = stats.complianceRate != null ? `${stats.complianceRate}%` : '—';
    statsBlock = `
<p>Here's a quick snapshot of your account:</p>
<ul style="padding-left:20px;margin:12px 0;">
  <li style="margin-bottom:4px;"><strong>${stats.certificateCount}</strong> certificates uploaded</li>
  <li style="margin-bottom:4px;"><strong>${stats.vendorCount}</strong> entities tracked</li>
  <li style="margin-bottom:4px;"><strong>${complianceStr}</strong> compliance rate</li>
</ul>
<p>The two things that save the most time are the automated follow-ups (expiring vendors get reminded automatically) and the vendor portal (vendors upload their own certificates through a link — no login required).</p>`;
  } else {
    statsBlock = `
<p>It looks like you haven't had a chance to upload certificates yet. Want me to help you get started? I can do a quick 10-minute walkthrough — just reply with a time that works.</p>`;
  }

  const body = `
<p>Hi ${firstName},</p>

<p>You're halfway through your trial — how's it going?</p>

${statsBlock}

<p>You still have 7 days of full access. Questions? Just reply.</p>

<p>Tony</p>`;

  return {
    subject: "How's your first week with SmartCOI?",
    html: personalWrapper(body),
  };
}

function day12Ending(firstName: string): { subject: string; html: string } {
  const body = `
<p>Hi ${firstName},</p>

<p>Just a heads up — your SmartCOI trial wraps up in 2 days.</p>

<p>If SmartCOI is saving you time, you can upgrade to keep everything running:</p>

<table cellpadding="0" cellspacing="0" style="margin:16px 0;">
<tr><td style="background:#059669;border-radius:6px;padding:10px 20px;">
  <a href="${APP_URL}/dashboard/settings/billing" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Upgrade Now</a>
</td></tr>
</table>

<p>Plans start at $63/month (annual) and all your data, templates, and settings carry over instantly. No re-uploading, no reconfiguring.</p>

<p>If it's not the right fit, no hard feelings — your account will simply deactivate after the trial. Your data stays on file for 30 days in case you change your mind.</p>

<p>If you're on the fence, reply and tell me what's holding you back. I'd rather fix a real problem than lose you.</p>

<p>Tony</p>`;

  return {
    subject: 'Your SmartCOI trial ends in 2 days',
    html: personalWrapper(body),
  };
}

function day14Expired(firstName: string): { subject: string; html: string } {
  const body = `
<p>Hi ${firstName},</p>

<p>Your 14-day trial has ended and your account is now inactive.</p>

<p>Your data is still saved — if you upgrade within 30 days, everything picks up right where you left off. Same vendors, same templates, same compliance status.</p>

<table cellpadding="0" cellspacing="0" style="margin:16px 0;">
<tr><td style="background:#059669;border-radius:6px;padding:10px 20px;">
  <a href="${APP_URL}/dashboard/settings/billing" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Upgrade Now</a>
</td></tr>
</table>

<p>If SmartCOI wasn't the right fit, I'd really appreciate knowing why. Just reply with a sentence or two — it helps me build a better product.</p>

<p>Thanks for giving it a try.</p>

<p>Tony</p>`;

  return {
    subject: 'Your SmartCOI trial has ended',
    html: personalWrapper(body),
  };
}
