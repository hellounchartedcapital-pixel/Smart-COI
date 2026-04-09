import { NextResponse } from 'next/server';
import { sendNotificationEmail } from '@/lib/notifications/email-sender';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { fullName, companyName, email, phone, vendorCount, message } = body;

    if (!fullName || !companyName || !email) {
      return NextResponse.json(
        { error: 'Full name, company name, and email are required.' },
        { status: 400 }
      );
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const html = `
      <h2>New Free COI Compliance Assessment Request</h2>
      <table style="border-collapse:collapse;width:100%;max-width:600px;">
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Name</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(fullName)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Company</td><td style="padding:8px;border-bottom:1px solid #eee;">${escapeHtml(companyName)}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Email</td><td style="padding:8px;border-bottom:1px solid #eee;"><a href="mailto:${escapeHtml(email)}">${escapeHtml(email)}</a></td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Phone</td><td style="padding:8px;border-bottom:1px solid #eee;">${phone ? escapeHtml(phone) : 'Not provided'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Vendors/Contractors</td><td style="padding:8px;border-bottom:1px solid #eee;">${vendorCount ? escapeHtml(vendorCount) : 'Not specified'}</td></tr>
        <tr><td style="padding:8px;font-weight:bold;border-bottom:1px solid #eee;">Message</td><td style="padding:8px;border-bottom:1px solid #eee;">${message ? escapeHtml(message) : 'None'}</td></tr>
      </table>
    `;

    const result = await sendNotificationEmail(
      'tony@smartcoi.io',
      `Free Assessment Request: ${companyName}`,
      html
    );

    if (!result.success && !result.devMode) {
      console.error('Failed to send assessment notification email:', result.error);
      return NextResponse.json(
        { error: 'Failed to send your request. Please try again or email tony@smartcoi.io directly.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Free assessment route error:', err);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
