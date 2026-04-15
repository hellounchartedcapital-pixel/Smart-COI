// ============================================================================
// SmartCOI — Post-Report Nurture Emails
//
// Free-tier users who generated a compliance report but haven't upgraded get
// a short 3-email nurture sequence (Day 3 / Day 7 / Day 14) that highlights
// the gaps in their report and explains why ongoing monitoring matters.
//
// Tracks sent emails per org via the existing `organizations.trial_emails_sent`
// JSONB column with distinct `nurture_*` keys so the trial-lifecycle and
// freemium nurture flows don't collide.
//
// Dispatched daily from the `/api/cron/daily-check` route.
// ============================================================================

import { createServiceClient } from '@/lib/supabase/service';
import { sendNotificationEmail } from '@/lib/notifications/email-sender';
import { normalizePlan } from '@/lib/stripe-prices';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartcoi.io';
const SITE_URL = 'https://smartcoi.io';
const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type NurtureEmailId =
  | 'nurture_day3_report_issues'
  | 'nurture_day7_silent_gaps'
  | 'nurture_day14_final';

interface EmailsSentMap {
  [key: string]: string; // emailId → ISO timestamp
}

interface OrgUser {
  email: string;
  full_name: string | null;
}

interface ReportSnapshot {
  totalGaps: number;
  expiredCount: number;
  expiringIn30Days: number;
  totalEntities: number;
}

// ----------------------------------------------------------------------------
// Main entry point — called from the daily cron
// ----------------------------------------------------------------------------

export async function processPostReportNurtureEmails(): Promise<{
  sent: number;
  skipped: number;
  errors: number;
}> {
  const supabase = createServiceClient();
  let sent = 0;
  let skipped = 0;
  let errors = 0;

  // Fetch every Free-tier org. The freemium model only puts new signups into
  // `free` after they've generated their report — so anyone here is a real
  // candidate for the nurture sequence.
  const { data: orgs, error: orgError } = await supabase
    .from('organizations')
    .select('id, plan, trial_emails_sent, name')
    .eq('plan', 'free');

  if (orgError) {
    console.error('[post-report-nurture] Failed to fetch free orgs:', orgError);
    return { sent: 0, skipped: 0, errors: 1 };
  }

  for (const org of orgs ?? []) {
    // Defensive: legacy orgs that landed on a non-modern plan label still
    // pass through normalizePlan; only true `free` plans should receive
    // the nurture sequence.
    if (normalizePlan(org.plan) !== 'free') {
      skipped++;
      continue;
    }

    const emailsSent: EmailsSentMap = (org.trial_emails_sent as EmailsSentMap) || {};

    // Use the earliest certificate upload as the proxy for "report
    // generated" — the moment the user uploaded COIs is when SmartCOI
    // produced their free report. This avoids needing a separate
    // first_report_at column.
    const { data: firstCert } = await supabase
      .from('certificates')
      .select('uploaded_at')
      .eq('organization_id', org.id)
      .neq('processing_status', 'failed')
      .order('uploaded_at', { ascending: true })
      .limit(1)
      .single();

    if (!firstCert?.uploaded_at) {
      // Free-tier user who never uploaded — nothing to nurture about.
      skipped++;
      continue;
    }

    const reportGeneratedAt = new Date(firstCert.uploaded_at);
    const daysSinceReport = Math.floor(
      (Date.now() - reportGeneratedAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Pick the next email this org should receive (only one per cron run
    // so we never double up on the same day).
    let emailToSend: NurtureEmailId | null = null;

    if (!emailsSent.nurture_day3_report_issues && daysSinceReport >= 3) {
      emailToSend = 'nurture_day3_report_issues';
    } else if (!emailsSent.nurture_day7_silent_gaps && daysSinceReport >= 7) {
      emailToSend = 'nurture_day7_silent_gaps';
    } else if (!emailsSent.nurture_day14_final && daysSinceReport >= 14) {
      emailToSend = 'nurture_day14_final';
    }

    if (!emailToSend) {
      skipped++;
      continue;
    }

    // Fetch the user we're emailing
    const { data: users } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('organization_id', org.id)
      .limit(1);

    if (!users || users.length === 0) {
      skipped++;
      continue;
    }
    const user = users[0] as OrgUser;
    const firstName = getFirstName(user.full_name);

    // Pull a snapshot of report stats for the email body
    const snapshot = await getReportSnapshot(supabase, org.id);

    const template = buildEmail(emailToSend, firstName, snapshot);
    if (!template) {
      skipped++;
      continue;
    }

    try {
      const result = await sendNotificationEmail(
        user.email,
        template.subject,
        template.html,
      );
      if (result.success || result.devMode) {
        await markEmailSent(supabase, org.id, emailsSent, emailToSend);
        sent++;
        console.log(
          `[post-report-nurture] Sent ${emailToSend} to ${user.email} (org=${org.id})`,
        );
      } else {
        errors++;
        console.error(
          `[post-report-nurture] Failed to send ${emailToSend} to ${user.email}: ${result.error}`,
        );
      }
    } catch (err) {
      errors++;
      console.error(
        `[post-report-nurture] Error sending ${emailToSend} to ${user.email}:`,
        err,
      );
    }
  }

  return { sent, skipped, errors };
}

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

function getFirstName(fullName: string | null): string {
  if (!fullName) return 'there';
  const first = fullName.split(' ')[0];
  return first || 'there';
}

async function markEmailSent(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
  existing: EmailsSentMap,
  emailId: NurtureEmailId,
) {
  const updated = { ...existing, [emailId]: new Date().toISOString() };
  await supabase
    .from('organizations')
    .update({ trial_emails_sent: updated })
    .eq('id', orgId);
}

async function getReportSnapshot(
  supabase: ReturnType<typeof createServiceClient>,
  orgId: string,
): Promise<ReportSnapshot> {
  // Pull entity-level compliance status counts. We derive the "issues"
  // number from non_compliant + expired + expiring_soon + needs_setup so
  // the nurture copy matches what the user actually saw on the report.
  const { data: entities } = await supabase
    .from('entities')
    .select('id, compliance_status')
    .eq('organization_id', orgId)
    .is('deleted_at', null)
    .is('archived_at', null);

  const list = entities ?? [];
  const totalEntities = list.length;
  const expiredCount = list.filter((e) => e.compliance_status === 'expired').length;
  const expiringIn30Days = list.filter(
    (e) => e.compliance_status === 'expiring_soon',
  ).length;
  const nonCompliantCount = list.filter(
    (e) => e.compliance_status === 'non_compliant',
  ).length;

  return {
    totalGaps: nonCompliantCount + expiredCount + expiringIn30Days,
    expiredCount,
    expiringIn30Days,
    totalEntities,
  };
}

// ----------------------------------------------------------------------------
// Email templates — clean, conversational, NOT aggressive
// ----------------------------------------------------------------------------

function emailShell(body: string): string {
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
    You're receiving this because you generated a free compliance report on SmartCOI.<br>
    <a href="${SITE_URL}" style="color:#9CA3AF;text-decoration:none;">smartcoi.io</a>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td>
  <a href="${href}" style="display:inline-block;background:#73E2A7;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${label}</a>
</td></tr>
</table>`;
}

function buildEmail(
  emailId: NurtureEmailId,
  firstName: string,
  snapshot: ReportSnapshot,
): { subject: string; html: string } | null {
  switch (emailId) {
    case 'nurture_day3_report_issues':
      return day3ReportIssues(firstName, snapshot);
    case 'nurture_day7_silent_gaps':
      return day7SilentGaps(firstName);
    case 'nurture_day14_final':
      return day14Final(firstName);
    default:
      return null;
  }
}

function pluralize(n: number, singular: string, plural?: string): string {
  return n === 1 ? singular : plural ?? `${singular}s`;
}

function day3ReportIssues(
  firstName: string,
  snapshot: ReportSnapshot,
): { subject: string; html: string } {
  const issues = Math.max(snapshot.totalGaps, 1);
  const subject = `Your compliance report found ${issues} ${pluralize(issues, 'issue')}. Here's what's at risk.`;

  // Build a small contextual fragment the body can lean on. Falls back to a
  // generic line when the report had no flagged entities (rare for paid
  // prospects but possible).
  const breakdown: string[] = [];
  if (snapshot.expiredCount > 0) {
    breakdown.push(
      `${snapshot.expiredCount} ${pluralize(snapshot.expiredCount, 'vendor')} with expired coverage`,
    );
  }
  if (snapshot.expiringIn30Days > 0) {
    breakdown.push(
      `${snapshot.expiringIn30Days} expiring in the next 30 days`,
    );
  }

  const breakdownLine = breakdown.length
    ? `Your report flagged <strong>${breakdown.join('</strong> and <strong>')}</strong>. Each one is real exposure &mdash; if a vendor causes property damage or injury today and their policy isn't current, you may be on the hook.`
    : `Your report walked through every certificate and flagged the items that need attention. Each gap represents real exposure if something goes wrong on site.`;

  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">A few days ago you uploaded your COIs and we built your free compliance report. ${breakdownLine}</p>

<p style="margin:0 0 20px;">The hard part isn't generating the report &mdash; it's keeping it accurate as certificates renew, vendors come on board, and policies expire. That's what <strong>Monitor</strong> does, automatically.</p>

<ul style="padding-left:20px;margin:0 0 20px;color:#374151;line-height:1.8;">
  <li>Continuous compliance tracking as new COIs come in</li>
  <li>Expiration alerts at 60, 30, and 14 days before a lapse</li>
  <li>Full dashboard with portfolio health at a glance</li>
  <li>Up to 50 certificates monitored &mdash; $79/mo, cancel anytime</li>
</ul>

${ctaButton(`${APP_URL}/dashboard/settings/billing`, 'Upgrade to Monitor')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">Want to look at your report again? <a href="${APP_URL}/report/latest" style="color:#4CC78A;text-decoration:none;">View it here</a>.</p>

<p style="margin:0;">Tony<br><span style="color:#6B7280;">Founder, SmartCOI</span></p>`;

  return { subject, html: emailShell(body) };
}

function day7SilentGaps(firstName: string): { subject: string; html: string } {
  const subject = "Certificates expire. Without monitoring, new gaps appear silently.";

  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">Quick thought: the report we generated for you last week was a snapshot. As of today, a few things may already be different &mdash; new vendors added, coverages renewed, others lapsed.</p>

<p style="margin:0 0 20px;">That's the catch with one-off compliance audits. They're accurate the day they're run and stale the day after. The whole reason I built SmartCOI was to fix that gap &mdash; certificates check themselves as they come in, expirations get flagged before they bite, and you stop having to remember.</p>

<p style="margin:0 0 16px;">Monitor includes:</p>

<ul style="padding-left:20px;margin:0 0 20px;color:#374151;line-height:1.8;">
  <li>Continuous AI compliance checking on every new upload</li>
  <li>Email alerts before coverage lapses (60/30/14 days out)</li>
  <li>Dashboard with portfolio health and action queue</li>
  <li>Up to 50 monitored certificates &mdash; $79/mo</li>
</ul>

${ctaButton(`${APP_URL}/dashboard/settings/billing`, 'Start Monitoring — $79/mo')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">No long-term contract. Cancel any time. Annual billing saves 20%.</p>

<p style="margin:0;">Tony</p>`;

  return { subject, html: emailShell(body) };
}

function day14Final(firstName: string): { subject: string; html: string } {
  const subject = "Still tracking compliance manually? Your SmartCOI data is ready when you are.";

  const body = `
<p style="margin:0 0 20px;">Hi ${firstName},</p>

<p style="margin:0 0 20px;">No pressure &mdash; just wanted to let you know your report and all the extracted data are still here whenever you want to come back.</p>

<p style="margin:0 0 20px;">If manual tracking is still working for you, that's totally fine. If you've found yourself thinking <em>"there has to be a better way to do this"</em> &mdash; that's exactly the moment Monitor pays for itself.</p>

<p style="margin:0 0 20px;">It's $79/month for up to 50 monitored certificates. No setup fee, no contracts, cancel any time. Your existing data carries over instantly when you upgrade.</p>

${ctaButton(`${APP_URL}/dashboard/settings/billing`, 'Activate Monitor')}

<p style="margin:0 0 20px;color:#6B7280;font-size:14px;">This is the last nurture email I'll send &mdash; I won't keep pestering you. If you ever have questions, just reply to any SmartCOI email and it goes straight to me.</p>

<p style="margin:0;">Tony<br><span style="color:#6B7280;">Founder, SmartCOI</span></p>`;

  return { subject, html: emailShell(body) };
}
