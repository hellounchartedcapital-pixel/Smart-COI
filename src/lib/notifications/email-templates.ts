// ============================================================================
// SmartCOI — Email Templates
// Clean, premium design inspired by Dock (dock.io).
// Single-column, generous spacing, one CTA per email.
// ============================================================================

/** Escape HTML special characters to prevent XSS in email templates. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export interface EmailMergeFields {
  entity_name: string;
  contact_name?: string;
  entity_type: string;
  property_name: string;
  organization_name: string;
  gaps_summary: string;
  portal_link: string;
  expiration_date: string;
  days_until_expiration: number;
  is_expired?: boolean;
  /** @deprecated Use admin_name instead */
  pm_name: string;
  /** @deprecated Use admin_email instead */
  pm_email: string;
  admin_name?: string;
  admin_email?: string;
  /** Industry-aware terminology labels */
  location_label?: string;
  entity_label?: string;
  requester_label?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// ============================================================================
// Shared layout — clean white, single column, centered
// ============================================================================

const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://smartcoi.io';

function emailShell(body: string): string {
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background:#ffffff;font-family:${FONT_STACK};">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;">
<tr><td align="center" style="padding:40px 20px;">
<table width="100%" style="max-width:600px;" cellpadding="0" cellspacing="0">
  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:32px;">
    <span style="font-size:24px;font-weight:700;color:#111827;letter-spacing:-0.3px;">SmartCOI</span>
  </td></tr>

  <!-- Content -->
  <tr><td style="padding:0 20px;">
    ${body}
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:40px 20px 0;text-align:center;border-top:1px solid #F3F4F6;margin-top:32px;">
    <p style="margin:0 0 4px;font-size:13px;color:#9CA3AF;">
      &copy; ${new Date().getFullYear()} SmartCOI. All rights reserved.
    </p>
    <p style="margin:0;font-size:13px;color:#9CA3AF;">
      <a href="https://smartcoi.io" style="color:#9CA3AF;text-decoration:none;">smartcoi.io</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function ctaButton(href: string, label: string): string {
  return `<table cellpadding="0" cellspacing="0" width="100%" style="margin:28px 0;">
<tr><td align="center">
  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;v-text-anchor:middle;width:200px;" arcsize="17%" fillcolor="#73E2A7"><center style="color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;">${label}</center></v:roundrect><![endif]-->
  <!--[if !mso]><!--><a href="${href}" style="display:inline-block;background:#73E2A7;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${label}</a><!--<![endif]-->
</td></tr>
</table>`;
}

function contactLine(fields: Pick<EmailMergeFields, 'pm_name' | 'pm_email' | 'admin_name' | 'admin_email' | 'requester_label'>): string {
  const name = fields.admin_name ?? fields.pm_name;
  const email = fields.admin_email ?? fields.pm_email;
  const rolePrefix = fields.requester_label ? `your ${escapeHtml(fields.requester_label)}, ` : '';
  return `<p style="font-size:14px;color:#6B7280;margin-top:28px;">
  Questions? Reach out to ${rolePrefix}<strong style="color:#374151;">${escapeHtml(name)}</strong> at <a href="mailto:${encodeURI(email)}" style="color:#4CC78A;text-decoration:none;">${escapeHtml(email)}</a>
</p>`;
}

// ============================================================================
// Expiration Warning
// ============================================================================

export function expirationWarning(fields: EmailMergeFields): EmailTemplate {
  const days = fields.days_until_expiration;
  const safeEntity = escapeHtml(fields.entity_name);
  const safeExpDate = escapeHtml(fields.expiration_date);

  let headline: string;
  let message: string;
  if (days > 45) {
    headline = `${safeEntity}'s COI expires on ${safeExpDate}`;
    message = `This is an early reminder. No rush, but please start the renewal process with your broker to keep compliance current.`;
  } else if (days > 20) {
    headline = `${safeEntity}'s COI expires in ${days} days`;
    message = `The certificate expires on <strong>${safeExpDate}</strong>. Please reach out to your insurance broker to start the renewal process.`;
  } else {
    headline = `${safeEntity}'s COI expires in ${days} day${days !== 1 ? 's' : ''}`;
    message = `The certificate expires on <strong>${safeExpDate}</strong>. Please upload an updated certificate as soon as possible to avoid a lapse in compliance.`;
  }

  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">${headline}</h1>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">${message}</p>
${ctaButton(fields.portal_link, 'Upload Certificate')}
${contactLine(fields)}`;

  return {
    subject: `${fields.entity_name}'s COI expires in ${days} days`,
    html: emailShell(body),
  };
}

// ============================================================================
// Gap Notification
// ============================================================================

export function gapNotification(fields: EmailMergeFields): EmailTemplate {
  const safeEntity = escapeHtml(fields.entity_name);
  const safeExpDate = escapeHtml(fields.expiration_date);

  const expiredNote = fields.is_expired
    ? `<p style="font-size:16px;color:#EF4444;line-height:1.6;font-weight:600;margin:0 0 16px;">
  The certificate expired on ${safeExpDate}. An updated certificate is needed immediately.
</p>`
    : '';

  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">${safeEntity} has coverage gaps</h1>
${expiredNote}
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">We reviewed the certificate and found items that need to be updated:</p>
<div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
  ${fields.gaps_summary}
</div>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 4px;">Please send this to your insurance broker and ask them to issue an updated certificate. Then upload the new certificate using the button below.</p>
${ctaButton(fields.portal_link, 'Upload Certificate')}
${contactLine(fields)}`;

  return {
    subject: `Action needed: ${fields.entity_name} has coverage gaps`,
    html: emailShell(body),
  };
}

// ============================================================================
// Follow-Up Reminder
// ============================================================================

export function followUpReminder(fields: EmailMergeFields): EmailTemplate {
  const safeEntity = escapeHtml(fields.entity_name);
  const safeExpDate = escapeHtml(fields.expiration_date);

  const expiredNote = fields.is_expired
    ? `<p style="font-size:16px;color:#EF4444;line-height:1.6;font-weight:600;margin:0 0 16px;">
  The certificate expired on ${safeExpDate}. An updated certificate is needed immediately.
</p>`
    : '';

  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Reminder: ${safeEntity} still has coverage gaps</h1>
${expiredNote}
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">We're following up on items that still need to be addressed:</p>
<div style="background:#F9FAFB;border-radius:8px;padding:16px 20px;margin:0 0 20px;">
  ${fields.gaps_summary}
</div>
${ctaButton(fields.portal_link, 'Upload Certificate')}
${contactLine(fields)}`;

  return {
    subject: `Reminder: ${fields.entity_name} — certificate update needed`,
    html: emailShell(body),
  };
}

// ============================================================================
// Expired Notice
// ============================================================================

export function expiredNotice(fields: EmailMergeFields): EmailTemplate {
  const safeEntity = escapeHtml(fields.entity_name);
  const safeExpDate = escapeHtml(fields.expiration_date);

  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">${safeEntity}'s certificate has expired</h1>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">
  The certificate expired on <strong>${safeExpDate}</strong>. Please upload a current certificate of insurance to maintain compliance.
</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 4px;">
  If you've already renewed your policy, ask your broker to send the updated certificate and upload it below.
</p>
${ctaButton(fields.portal_link, 'Upload Certificate')}
${contactLine(fields)}`;

  return {
    subject: `${fields.entity_name}'s certificate has expired`,
    html: emailShell(body),
  };
}

// ============================================================================
// Format gap descriptions as HTML list
// ============================================================================

export function formatGapsAsHtml(gaps: string[]): string {
  if (gaps.length === 0) return '<p style="font-size:14px;color:#6B7280;">Please provide an updated Certificate of Insurance.</p>';
  return `<ul style="margin:0;padding:0 0 0 18px;font-size:14px;color:#374151;line-height:1.8;">
${gaps.map((g) => {
    const safe = escapeHtml(g);
    if (g.startsWith('Certificate expired')) {
      return `  <li style="color:#EF4444;font-weight:600;">${safe}</li>`;
    }
    return `  <li>${safe}</li>`;
  }).join('\n')}
</ul>`;
}

// ============================================================================
// Welcome Email
// ============================================================================

interface WelcomeEmailFields {
  user_name: string;
  setup_link: string;
}

export function welcomeEmail(fields: WelcomeEmailFields): EmailTemplate {
  const name = escapeHtml(fields.user_name || 'there');

  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;">Welcome to SmartCOI</h1>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;">
  Hi ${name}, your account is ready. Upload your first certificate and let our AI handle the extraction, compliance checking, and follow-ups.
</p>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 4px;">
  You have 14 days to try everything free — up to 50 certificates, no credit card required.
</p>
${ctaButton(fields.setup_link, 'Go to Dashboard')}
<p style="font-size:14px;color:#6B7280;margin-top:28px;">
  Questions? Just reply to this email.
</p>`;

  return {
    subject: 'Welcome to SmartCOI',
    html: emailShell(body),
  };
}

// ============================================================================
// Email Confirmation
// ============================================================================

interface ConfirmationEmailFields {
  confirmation_url: string;
}

export function confirmationEmail(fields: ConfirmationEmailFields): EmailTemplate {
  const body = `
<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:#111827;text-align:center;">Confirm your email</h1>
<p style="font-size:16px;color:#374151;line-height:1.6;margin:0 0 20px;text-align:center;">
  Click the button below to confirm your email address and get started with SmartCOI.
</p>
${ctaButton(fields.confirmation_url, 'Confirm Email')}
<p style="font-size:14px;color:#9CA3AF;text-align:center;margin-top:20px;">
  If you didn't create an account, you can safely ignore this email.
</p>`;

  return {
    subject: 'Confirm your SmartCOI account',
    html: emailShell(body),
  };
}
