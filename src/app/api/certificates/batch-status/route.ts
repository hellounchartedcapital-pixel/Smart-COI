import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // ignored in route handlers
          }
        },
      },
    }
  );
}

/**
 * GET /api/certificates/batch-status?batchId=<uuid>
 *
 * Returns current batch progress. Also marks the batch as client_active
 * so the background processor knows whether to send an email on completion.
 */
export async function GET(req: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const batchId = req.nextUrl.searchParams.get('batchId');
    if (!batchId) {
      return NextResponse.json({ error: 'batchId is required' }, { status: 400 });
    }

    // Fetch batch via RLS-scoped client (org membership enforced automatically)
    const { data: batch, error } = await authClient
      .from('processing_batches')
      .select('id, status, total_certs, completed_count, failed_count, started_at, completed_at, client_active')
      .eq('id', batchId)
      .single();

    if (error || !batch) {
      return NextResponse.json({ error: 'Batch not found' }, { status: 404 });
    }

    // Mark the batch as client_active (the client is still polling)
    // Only update if the batch is still processing and not already marked
    if (batch.status === 'processing' || batch.status === 'queued') {
      await authClient
        .from('processing_batches')
        .update({ client_active: true })
        .eq('id', batchId);
    }

    return NextResponse.json({
      batchId: batch.id,
      status: batch.status,
      totalCerts: batch.total_certs,
      completedCount: batch.completed_count,
      failedCount: batch.failed_count,
      startedAt: batch.started_at,
      completedAt: batch.completed_at,
    });
  } catch (err) {
    console.error('[batch-status] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/certificates/batch-status
 *
 * Body: { batchId: string, clientActive: boolean }
 *
 * Called when the client navigates away (clientActive: false) or returns
 * (clientActive: true). This controls whether the background processor
 * sends a completion email.
 */
export async function PATCH(req: NextRequest) {
  try {
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { batchId, clientActive } = await req.json();
    if (!batchId || typeof clientActive !== 'boolean') {
      return NextResponse.json(
        { error: 'batchId and clientActive (boolean) are required' },
        { status: 400 }
      );
    }

    await authClient
      .from('processing_batches')
      .update({ client_active: clientActive })
      .eq('id', batchId);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[batch-status] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
