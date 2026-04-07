// ============================================================================
// SmartCOI — Email Templates
// Friendly, professional notification emails that maximize vendor/tenant
// response rates. Tone scales with urgency.
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
  entity_name: string; // entity company name
  contact_name?: string; // optional contact person name
  entity_type: string; // vendor, tenant, subcontractor, carrier, supplier
  property_name: string;
  organization_name: string;
  gaps_summary: string; // HTML list of compliance gaps
  portal_link: string;
  expiration_date: string; // formatted date string
  days_until_expiration: number;
  is_expired?: boolean; // true when the certificate has expired coverage
  /** @deprecated Use admin_name instead */
  pm_name: string;
  /** @deprecated Use admin_email instead */
  pm_email: string;
  admin_name?: string;
  admin_email?: string;
}

interface EmailTemplate {
  subject: string;
  html: string;
}

// ============================================================================
// Shared layout
// ============================================================================

function emailWrapper(body: string, fields: Pick<EmailMergeFields, 'organization_name'>): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#059669;padding:20px 24px;">
    <span style="color:#ffffff;font-size:18px;font-weight:700;">SmartCOI</span>
    <span style="color:#d1fae5;font-size:12px;margin-left:8px;">${escapeHtml(fields.organization_name)}</span>
  </td></tr>
  <tr><td style="padding:24px;">${body}</td></tr>
  <tr><td style="padding:16px 24px;background:#f1f5f9;font-size:11px;color:#64748b;text-align:center;">
    Powered by <a href="https://smartcoi.io" style="color:#059669;text-decoration:none;font-weight:600;">SmartCOI</a> — Automated COI compliance tracking<br>
    <span style="color:#94a3b8;">This is an automated message. Please do not reply directly to this email.</span>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

function portalButton(link: string, label = 'Upload Your Certificate'): string {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
<tr><td style="background:#059669;border-radius:6px;padding:12px 24px;">
  <a href="${link}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">${label}</a>
</td></tr>
</table>`;
}

function greeting(fields: Pick<EmailMergeFields, 'contact_name' | 'entity_name'>): string {
  const name = escapeHtml(fields.contact_name || fields.entity_name);
  return `<p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px;">Hi ${name},</p>`;
}

function contactBlock(fields: Pick<EmailMergeFields, 'pm_name' | 'pm_email' | 'admin_name' | 'admin_email'>): string {
  const name = fields.admin_name ?? fields.pm_name;
  const email = fields.admin_email ?? fields.pm_email;
  return `<p style="font-size:13px;color:#475569;margin-top:24px;">
  Questions? Reach out to <strong>${escapeHtml(name)}</strong> at <a href="mailto:${encodeURI(email)}" style="color:#059669;">${escapeHtml(email)}</a>
</p>`;
}

function brokerInstruction(): string {
  return `<p style="font-size:14px;color:#334155;line-height:1.6;margin-top:16px;">
  Please send this email to your insurance broker and ask them to issue an updated certificate with these changes. Then upload the new certificate using the button below.
</p>`;
}

// ============================================================================
// Expiration Warning
// ============================================================================

export function expirationWarning(fields: EmailMergeFields): EmailTemplate {
  const days = fields.days_until_expiration;
  const safeProperty = escapeHtml(fields.property_name);
  const safeExpDate = escapeHtml(fields.expiration_date);
  let message: string;

  if (days > 45) {
    // 60+ days: casual and friendly
    message = `Just a heads up that your certificate of insurance for <strong>${safeProperty}</strong> expires on <strong>${safeExpDate}</strong>. No rush, but we wanted to give you plenty of time to get an updated certificate from your broker.`;
  } else if (days > 20) {
    // ~30 days: friendly but clear
    message = `Your certificate of insurance for <strong>${safeProperty}</strong> expires on <strong>${safeExpDate}</strong> — about ${days} days from now. Please start the renewal process with your insurance broker so we can keep your file up to date.`;
  } else {
    // 14 days or less: direct
    message = `Your certificate of insurance for <strong>${safeProperty}</strong> expires on <strong>${safeExpDate}</strong> — that\u2019s just <strong>${days} day${days !== 1 ? 's' : ''} away</strong>. Please upload an updated certificate as soon as possible to avoid a lapse in compliance.`;
  }

  const body = `
${greeting(fields)}
<p style="font-size:14px;color:#334155;line-height:1.6;">${message}</p>
${portalButton(fields.portal_link)}
${contactBlock(fields)}`;

  return {
    subject: `Insurance certificate expiring — ${fields.property_name}`,
    html: emailWrapper(body, fields),
  };
}

// ============================================================================
// Gap Notification
// ============================================================================

export function gapNotification(fields: EmailMergeFields): EmailTemplate {
  const safeProperty = escapeHtml(fields.property_name);
  const safeExpDate = escapeHtml(fields.expiration_date);
  const expirationLead = fields.is_expired
    ? `<p style="font-size:14px;color:#dc2626;line-height:1.6;font-weight:600;margin-bottom:12px;">
  Your certificate of insurance for <strong>${safeProperty}</strong> expired on <strong>${safeExpDate}</strong>. An updated certificate is needed immediately.
</p>
<p style="font-size:14px;color:#334155;line-height:1.6;">
  In addition, we found the following items that need to be addressed:
</p>`
    : `<p style="font-size:14px;color:#334155;line-height:1.6;">
  We reviewed your certificate of insurance for <strong>${safeProperty}</strong> and found a few items that need to be updated:
</p>`;

  const body = `
${greeting(fields)}
${expirationLead}
<div style="background:#f8fafc;border-radius:6px;padding:14px 18px;margin:16px 0;">
  ${fields.gaps_summary}
</div>
${brokerInstruction()}
${portalButton(fields.portal_link)}
${contactBlock(fields)}`;

  return {
    subject: `Action needed: Insurance coverage gap — ${fields.property_name}`,
    html: emailWrapper(body, fields),
  };
}

// ============================================================================
// Follow-Up Reminder
// ============================================================================

export function followUpReminder(fields: EmailMergeFields): EmailTemplate {
  const safeProperty = escapeHtml(fields.property_name);
  const safeExpDate = escapeHtml(fields.expiration_date);
  const expirationLead = fields.is_expired
    ? `<p style="font-size:14px;color:#dc2626;line-height:1.6;font-weight:600;margin-bottom:12px;">
  Your certificate of insurance for <strong>${safeProperty}</strong> expired on <strong>${safeExpDate}</strong>. An updated certificate is needed immediately.
</p>
<p style="font-size:14px;color:#334155;line-height:1.6;">
  We still need an updated certificate that also addresses the following:
</p>`
    : `<p style="font-size:14px;color:#334155;line-height:1.6;">
  We wanted to follow up on your certificate of insurance for <strong>${safeProperty}</strong>. We still need an updated certificate that addresses the following:
</p>`;

  const body = `
${greeting(fields)}
${expirationLead}
<div style="background:#f8fafc;border-radius:6px;padding:14px 18px;margin:16px 0;">
  ${fields.gaps_summary}
</div>
${brokerInstruction()}
${portalButton(fields.portal_link)}
${contactBlock(fields)}`;

  return {
    subject: `Insurance certificate required — ${fields.property_name}`,
    html: emailWrapper(body, fields),
  };
}

// ============================================================================
// Expired Notice
// ============================================================================

export function expiredNotice(fields: EmailMergeFields): EmailTemplate {
  const safeProperty = escapeHtml(fields.property_name);
  const safeExpDate = escapeHtml(fields.expiration_date);
  const body = `
${greeting(fields)}
<p style="font-size:14px;color:#334155;line-height:1.6;">
  Your certificate of insurance for <strong>${safeProperty}</strong> expired on <strong>${safeExpDate}</strong>. Please upload a current certificate immediately to maintain compliance.
</p>
<p style="font-size:14px;color:#334155;line-height:1.6;margin-top:12px;">
  If you\u2019ve already renewed your policy, just ask your broker to send over the updated certificate and upload it using the button below.
</p>
${portalButton(fields.portal_link)}
${contactBlock(fields)}`;

  return {
    subject: `URGENT: Insurance certificate expired — ${fields.property_name}`,
    html: emailWrapper(body, fields),
  };
}

// ============================================================================
// Format gap descriptions as a friendly HTML list
// ============================================================================

export function formatGapsAsHtml(gaps: string[]): string {
  if (gaps.length === 0) return '<p style="font-size:13px;color:#475569;">Please provide an updated Certificate of Insurance.</p>';
  return `<ul style="margin:0;padding:0 0 0 18px;font-size:13px;color:#334155;line-height:2;">
${gaps.map((g) => {
    const safe = escapeHtml(g);
    // Style "Certificate expired" items with urgency
    if (g.startsWith('Certificate expired')) {
      return `  <li style="color:#dc2626;font-weight:600;">${safe}</li>`;
    }
    return `  <li>${safe}</li>`;
  }).join('\n')}
</ul>`;
}

// ============================================================================
// Welcome / Onboarding Email
// ============================================================================

interface WelcomeEmailFields {
  user_name: string;
  setup_link: string;
}

export function welcomeEmail(fields: WelcomeEmailFields): EmailTemplate {
  const name = escapeHtml(fields.user_name || 'there');

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:32px;">
    <table cellpadding="0" cellspacing="0"><tr>
      <td style="vertical-align:middle;padding-right:10px;">
        <div style="display:inline-block;width:32px;height:32px;border-radius:7px;background:linear-gradient(135deg,#73E2A7,#5CC98E);text-align:center;line-height:32px;font-size:16px;color:#ffffff;">&#10003;</div>
      </td>
      <td style="vertical-align:middle;">
        <span style="font-family:'DM Sans',sans-serif;font-size:22px;font-weight:700;color:#0f172a;">SmartCOI</span>
      </td>
    </tr></table>
  </td></tr>

  <!-- Card -->
  <tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);">
    <!-- Green accent bar -->
    <tr><td style="height:4px;background:linear-gradient(90deg,#4CC78A,#73E2A7);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Content -->
    <tr><td style="padding:40px 36px 32px;">
      <h1 style="margin:0 0 8px;font-family:'DM Sans',sans-serif;font-size:24px;font-weight:700;color:#0f172a;">Welcome to SmartCOI!</h1>
      <p style="margin:0 0 24px;font-size:15px;color:#475569;line-height:1.6;">
        Hi ${name}, your account is confirmed and ready to go. You\u2019re just a few steps away from automating your COI compliance.
      </p>

      <!-- Steps -->
      <table cellpadding="0" cellspacing="0" width="100%" style="margin-bottom:28px;">
        <tr>
          <td style="width:44px;vertical-align:top;padding:14px 0;">
            <div style="width:36px;height:36px;border-radius:50%;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:36px;">1</div>
          </td>
          <td style="vertical-align:top;padding:14px 0 14px 14px;">
            <p style="margin:0 0 2px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f172a;font-weight:700;">Set up your organization</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Name your company and configure your certificate holder entities.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="padding:0 0 0 50px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
        <tr>
          <td style="width:44px;vertical-align:top;padding:14px 0;">
            <div style="width:36px;height:36px;border-radius:50%;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:36px;">2</div>
          </td>
          <td style="vertical-align:top;padding:14px 0 14px 14px;">
            <p style="margin:0 0 2px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f172a;font-weight:700;">Add your first property</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Create a property and start associating vendors and tenants.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="padding:0 0 0 50px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
        <tr>
          <td style="width:44px;vertical-align:top;padding:14px 0;">
            <div style="width:36px;height:36px;border-radius:50%;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:36px;">3</div>
          </td>
          <td style="vertical-align:top;padding:14px 0 14px 14px;">
            <p style="margin:0 0 2px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f172a;font-weight:700;">Upload up to 50 COIs free</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Our AI extracts vendor names, coverages, limits, and dates automatically.</p>
          </td>
        </tr>
        <tr><td colspan="2" style="padding:0 0 0 50px;"><div style="border-top:1px solid #e2e8f0;"></div></td></tr>
        <tr>
          <td style="width:44px;vertical-align:top;padding:14px 0;">
            <div style="width:36px;height:36px;border-radius:50%;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-align:center;line-height:36px;">4</div>
          </td>
          <td style="vertical-align:top;padding:14px 0 14px 14px;">
            <p style="margin:0 0 2px;font-family:'DM Sans',sans-serif;font-size:14px;color:#0f172a;font-weight:700;">Set compliance requirements</p>
            <p style="margin:0;font-size:13px;color:#64748b;line-height:1.5;">Define the coverages and limits each vendor or tenant type must carry.</p>
          </td>
        </tr>
      </table>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center">
        <a href="${fields.setup_link}" style="display:inline-block;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 2px 8px rgba(115,226,167,0.3);">Get Started</a>
      </td></tr>
      </table>
    </td></tr>
  </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 0;text-align:center;">
    <p style="margin:0 0 4px;font-family:'DM Sans',sans-serif;font-size:12px;color:#94a3b8;">
      \u00A9 ${new Date().getFullYear()} SmartCOI. All rights reserved.
    </p>
    <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:12px;color:#94a3b8;">
      Questions? <a href="mailto:support@smartcoi.io" style="color:#4CC78A;text-decoration:none;">support@smartcoi.io</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: "Welcome to SmartCOI \u2014 Let's Get You Set Up",
    html,
  };
}

// ============================================================================
// Email Confirmation Template
// Branded template for Supabase email confirmation. To use this template,
// copy the HTML from confirmationEmail({ confirmation_url: '{{ .ConfirmationURL }}' })
// into Supabase Dashboard > Auth > Email Templates > Confirm signup.
// ============================================================================

interface ConfirmationEmailFields {
  confirmation_url: string;
}

export function confirmationEmail(fields: ConfirmationEmailFields): EmailTemplate {
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap" rel="stylesheet">
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:'DM Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:560px;" cellpadding="0" cellspacing="0">
  <!-- Logo -->
  <tr><td align="center" style="padding-bottom:32px;">
    <img src="https://smartcoi.io/logo-email.png" alt="SmartCOI" width="60" height="60" style="display:block;width:60px;height:60px;border:0;" />
  </td></tr>

  <!-- Card -->
  <tr><td>
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.08),0 4px 12px rgba(0,0,0,0.04);">
    <!-- Green accent bar -->
    <tr><td style="height:4px;background:linear-gradient(90deg,#4CC78A,#73E2A7);font-size:0;line-height:0;">&nbsp;</td></tr>

    <!-- Content -->
    <tr><td style="padding:40px 36px 32px;text-align:center;">
      <h1 style="margin:0 0 12px;font-family:'DM Sans',sans-serif;font-size:24px;font-weight:700;color:#0f172a;">Confirm your email</h1>
      <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
        Thanks for signing up for SmartCOI! Click the button below to confirm your email address and start automating your COI compliance.
      </p>

      <!-- CTA Button -->
      <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center">
        <a href="${fields.confirmation_url}" style="display:inline-block;background:#73E2A7;color:#0f172a;font-family:'DM Sans',sans-serif;font-size:15px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:12px;box-shadow:0 2px 8px rgba(115,226,167,0.3);">Confirm Email</a>
      </td></tr>
      </table>

      <p style="margin:24px 0 0;font-size:13px;color:#94a3b8;line-height:1.6;">
        If you didn\u2019t create an account, you can safely ignore this email.
      </p>
    </td></tr>
  </table>
  </td></tr>

  <!-- Footer -->
  <tr><td style="padding:28px 0;text-align:center;">
    <p style="margin:0 0 4px;font-family:'DM Sans',sans-serif;font-size:12px;color:#94a3b8;">
      \u00A9 ${new Date().getFullYear()} SmartCOI. All rights reserved.
    </p>
    <p style="margin:0;font-family:'DM Sans',sans-serif;font-size:12px;color:#94a3b8;">
      <a href="https://smartcoi.io" style="color:#4CC78A;text-decoration:none;">smartcoi.io</a>
    </p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  return {
    subject: 'Confirm your SmartCOI account',
    html,
  };
}
