// ============================================================================
// SmartCOI — Batch Processing Complete Email
// Sent when background COI extraction finishes and the user has left the page.
// ============================================================================

import { sendNotificationEmail } from '@/lib/notifications/email-sender';

const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

interface BatchCompleteEmailParams {
  to: string;
  orgName: string;
  totalCerts: number;
  completedCount: number;
  failedCount: number;
  complianceGaps: number;
  vendorCount: number;
  dashboardUrl: string;
}

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
  <!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${href}" style="height:48px;v-text-anchor:middle;width:240px;" arcsize="17%" fillcolor="#73E2A7"><center style="color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;">${label}</center></v:roundrect><![endif]-->
  <!--[if !mso]><!--><a href="${href}" style="display:inline-block;background:#73E2A7;color:#ffffff;font-family:${FONT_STACK};font-size:15px;font-weight:600;text-decoration:none;padding:14px 32px;border-radius:8px;">${label}</a><!--<![endif]-->
</td></tr>
</table>`;
}

export async function sendBatchCompleteEmail(params: BatchCompleteEmailParams) {
  const {
    to,
    orgName,
    totalCerts,
    completedCount,
    failedCount,
    complianceGaps,
    vendorCount,
    dashboardUrl,
  } = params;

  const subject = 'Your SmartCOI compliance report is ready';

  const statsRows = [
    { label: 'Certificates analyzed', value: String(completedCount) },
    { label: 'Vendors identified', value: String(vendorCount) },
    { label: 'Compliance gaps found', value: String(complianceGaps) },
    ...(failedCount > 0
      ? [{ label: 'Failed extractions', value: String(failedCount) }]
      : []),
  ];

  const statsHtml = statsRows
    .map(
      (row) =>
        `<tr>
          <td style="padding:10px 12px;font-size:14px;color:#374151;border-bottom:1px solid #F3F4F6;">${row.label}</td>
          <td style="padding:10px 12px;font-size:14px;font-weight:600;color:#111827;text-align:right;border-bottom:1px solid #F3F4F6;">${row.value}</td>
        </tr>`
    )
    .join('');

  const gapNote =
    complianceGaps > 0
      ? `<p style="font-size:14px;color:#DC2626;margin:20px 0 0;">
          <strong>${complianceGaps} compliance gap${complianceGaps !== 1 ? 's' : ''}</strong> found that may need attention.
        </p>`
      : `<p style="font-size:14px;color:#059669;margin:20px 0 0;">
          <strong>No compliance gaps found</strong> — all uploaded certificates meet requirements.
        </p>`;

  const body = `
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Your compliance report is ready</h1>
    <p style="font-size:15px;color:#6B7280;margin:0 0 24px;line-height:1.6;">
      We've finished processing ${totalCerts} certificate${totalCerts !== 1 ? 's' : ''} for ${orgName}. Here's a quick summary:
    </p>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #E5E7EB;border-radius:8px;overflow:hidden;">
      <thead>
        <tr style="background:#F9FAFB;">
          <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-align:left;text-transform:uppercase;letter-spacing:0.05em;">Metric</th>
          <th style="padding:10px 12px;font-size:12px;font-weight:600;color:#6B7280;text-align:right;text-transform:uppercase;letter-spacing:0.05em;">Count</th>
        </tr>
      </thead>
      <tbody>
        ${statsHtml}
      </tbody>
    </table>

    ${gapNote}

    ${ctaButton(dashboardUrl, 'View Your Dashboard')}

    <p style="font-size:13px;color:#9CA3AF;margin:0;text-align:center;">
      You're receiving this email because your COI upload batch was completed while you were away.
    </p>
  `;

  const html = emailShell(body);

  return sendNotificationEmail(to, subject, html);
}
