// ============================================================================
// SmartCOI — Batch Processing Complete Email
//
// Sent when background COI extraction finishes and the user has navigated
// away from the upload page. Designed to drive a click through to the
// freshly-generated compliance report.
// ============================================================================

import { sendNotificationEmail } from '@/lib/notifications/email-sender';

const FONT_STACK = "'Inter',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";
const SITE_URL = 'https://smartcoi.io';

interface BatchCompleteEmailParams {
  to: string;
  orgName: string;
  totalCerts: number;
  completedCount: number;
  failedCount: number;
  complianceGaps: number;
  vendorCount: number;
  /** Number of vendors with expired coverage (used as a teaser stat) */
  expiredVendorCount?: number;
  /** Number of vendors expiring within the next 30 days */
  expiringSoonCount?: number;
  /** URL the CTA button points at — should be the report page, not the dashboard */
  reportUrl: string;
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
      <a href="${SITE_URL}" style="color:#9CA3AF;text-decoration:none;">smartcoi.io</a>
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

/**
 * Build the email subject line. We want the user to see at a glance how
 * many compliance issues their report flagged, so they actually open it.
 */
function buildSubject(complianceGaps: number, vendorCount: number): string {
  if (complianceGaps === 0) {
    return `Your compliance report is ready — no gaps found across ${vendorCount} vendor${vendorCount !== 1 ? 's' : ''}`;
  }
  return `Your compliance report is ready — ${complianceGaps} gap${complianceGaps !== 1 ? 's' : ''} found across ${vendorCount} vendor${vendorCount !== 1 ? 's' : ''}`;
}

/**
 * Pick the most attention-grabbing teaser stat for the body. Order of
 * preference: expired vendors → expiring soon → general gap count.
 */
function buildTeaser(params: {
  complianceGaps: number;
  expiredVendorCount: number;
  expiringSoonCount: number;
}): { color: string; text: string } | null {
  const { complianceGaps, expiredVendorCount, expiringSoonCount } = params;

  if (expiredVendorCount > 0) {
    return {
      color: '#DC2626',
      text: `<strong>${expiredVendorCount} vendor${expiredVendorCount !== 1 ? 's have' : ' has'} expired coverage</strong> right now.`,
    };
  }
  if (expiringSoonCount > 0) {
    return {
      color: '#D97706',
      text: `<strong>${expiringSoonCount} vendor${expiringSoonCount !== 1 ? 's have' : ' has'} coverage expiring in the next 30 days.</strong>`,
    };
  }
  if (complianceGaps > 0) {
    return {
      color: '#DC2626',
      text: `<strong>${complianceGaps} compliance gap${complianceGaps !== 1 ? 's' : ''}</strong> found that may need attention.`,
    };
  }
  return null;
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
    expiredVendorCount = 0,
    expiringSoonCount = 0,
    reportUrl,
  } = params;

  const subject = buildSubject(complianceGaps, vendorCount);

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
        </tr>`,
    )
    .join('');

  const teaser = buildTeaser({ complianceGaps, expiredVendorCount, expiringSoonCount });
  const teaserHtml = teaser
    ? `<p style="font-size:15px;color:${teaser.color};margin:20px 0 0;line-height:1.5;">
        ${teaser.text}
      </p>`
    : `<p style="font-size:14px;color:#059669;margin:20px 0 0;">
        <strong>No compliance gaps found</strong> &mdash; all uploaded certificates meet requirements.
      </p>`;

  const body = `
    <h1 style="font-size:22px;font-weight:700;color:#111827;margin:0 0 8px;">Your compliance report is ready</h1>
    <p style="font-size:15px;color:#6B7280;margin:0 0 24px;line-height:1.6;">
      We've finished analyzing ${totalCerts} certificate${totalCerts !== 1 ? 's' : ''} for ${orgName}. Here's a quick summary:
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

    ${teaserHtml}

    ${ctaButton(reportUrl, 'View Your Report')}

    <p style="font-size:13px;color:#9CA3AF;margin:0;text-align:center;">
      You're receiving this email because your COI upload finished while you were away.
    </p>
  `;

  const html = emailShell(body);

  return sendNotificationEmail(to, subject, html);
}
