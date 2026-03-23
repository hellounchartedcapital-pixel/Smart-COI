// ============================================================================
// SmartCOI — Daily Notification Cron Job
// Runs daily at 8:00 AM UTC via Vercel Cron
// ============================================================================

import { NextResponse } from 'next/server';
import { checkAndScheduleNotifications } from '@/lib/notifications/scheduler';
import { processScheduledNotifications } from '@/lib/notifications/scheduler';
import { takeComplianceSnapshots } from '@/lib/actions/compliance-snapshots';

export const runtime = 'nodejs';
export const maxDuration = 60; // Allow up to 60 seconds

export async function POST(request: Request) {
  // Verify authorization — accept either Bearer token or Vercel cron signature
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    console.error('CRON_SECRET is not configured');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  const hasBearerAuth = authHeader === `Bearer ${cronSecret}`;
  const hasVercelSignature = request.headers.get('x-vercel-cron-signature') === cronSecret;

  if (!hasBearerAuth && !hasVercelSignature) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const startTime = Date.now();

  try {
    // Step 1: Take compliance snapshots for trend tracking
    const snapshots = await takeComplianceSnapshots();
    console.log(`[daily-check] Took ${snapshots} compliance snapshots`);

    // Step 2: Check expirations and schedule new notifications
    const scheduled = await checkAndScheduleNotifications();
    console.log(`[daily-check] Scheduled ${scheduled} new notifications`);

    // Step 3: Send all pending scheduled notifications
    const { sent, failed } = await processScheduledNotifications();
    console.log(`[daily-check] Sent ${sent}, failed ${failed}`);

    const duration = Date.now() - startTime;

    return NextResponse.json({
      ok: true,
      snapshots,
      scheduled,
      sent,
      failed,
      durationMs: duration,
    });
  } catch (err) {
    console.error('[daily-check] Error:', err instanceof Error ? err.message : err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

// Also support GET for Vercel Cron (Vercel Cron sends GET requests)
export async function GET(request: Request) {
  return POST(request);
}
