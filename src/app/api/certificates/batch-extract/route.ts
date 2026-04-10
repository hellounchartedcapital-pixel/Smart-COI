import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { extractCOIFromPDF } from '@/lib/ai/extraction';
import { MAX_FILE_SIZE } from '@/lib/utils/file-validation';
import { checkExtractionLimit } from '@/lib/plan-limits';
import { getActivePlanStatus, PLAN_INACTIVE_TAG } from '@/lib/plan-status';
import { createServiceClient } from '@/lib/supabase/service';
import { runAutoCompliance } from '@/lib/actions/certificates';
import { processConcurrentQueue } from '@/lib/utils/concurrent-queue';
import { sendBatchCompleteEmail } from '@/lib/emails/batch-complete';

const CONCURRENCY_LIMIT = 5;

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
 * POST /api/certificates/batch-extract
 *
 * Body: { certificateIds: string[], propertyId?: string, entityType?: string }
 *
 * 1. Validates auth and plan
 * 2. Creates a processing_batches record
 * 3. Returns immediately with batchId + status "processing"
 * 4. Uses after() to continue extraction in the background
 */
export async function POST(req: NextRequest) {
  try {
    // ---- Auth ----
    const authClient = await createAuthClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: profile } = await authClient
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();
    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization found' }, { status: 403 });
    }
    const orgId = profile.organization_id;

    // ---- Active plan check ----
    const serviceClient = createServiceClient();
    const { data: orgForPlan, error: orgPlanError } = await serviceClient
      .from('organizations')
      .select('plan, trial_ends_at, payment_failed, name')
      .eq('id', orgId)
      .single();
    if (orgPlanError || !orgForPlan) {
      return NextResponse.json({ error: 'Organization not found' }, { status: 403 });
    }
    const planStatus = getActivePlanStatus(orgForPlan);
    if (!planStatus.isActive) {
      return NextResponse.json(
        { error: `${PLAN_INACTIVE_TAG} Subscribe to upload certificates.` },
        { status: 403 }
      );
    }

    // ---- Plan limit check ----
    const limitCheck = await checkExtractionLimit(orgId);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error }, { status: 403 });
    }

    // ---- Parse body ----
    const { certificateIds, propertyId, entityType } = await req.json();
    if (!Array.isArray(certificateIds) || certificateIds.length === 0) {
      return NextResponse.json(
        { error: 'certificateIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // ---- Create batch record ----
    const { data: batch, error: batchError } = await serviceClient
      .from('processing_batches')
      .insert({
        organization_id: orgId,
        user_id: user.id,
        status: 'processing',
        total_certs: certificateIds.length,
        certificate_ids: certificateIds,
        property_id: propertyId ?? null,
        entity_type: entityType ?? null,
        client_active: true,
      })
      .select('id')
      .single();

    if (batchError || !batch) {
      console.error('[batch-extract] Failed to create batch record:', batchError);
      return NextResponse.json(
        { error: 'Failed to create batch' },
        { status: 500 }
      );
    }

    const batchId = batch.id;
    console.log(`[batch-extract] Created batch ${batchId} with ${certificateIds.length} certs for org=${orgId}`);

    // Capture values needed by the background task
    const userId = user.id;
    const userEmail = user.email;
    const orgName = orgForPlan.name ?? 'your organization';

    // ---- Background processing via after() ----
    after(async () => {
      console.log(`[batch-extract] Background processing started for batch ${batchId}`);
      const bgService = createServiceClient();

      try {
        await processConcurrentQueue({
          items: certificateIds as string[],
          concurrency: CONCURRENCY_LIMIT,
          maxRetries: 3,
          processFn: async (certificateId: string, signal: AbortSignal) => {
            return await extractSingleCertificate(bgService, certificateId, orgId, userId);
          },
          onStatusChange: async (index, status, error) => {
            if (status === 'complete') {
              await bgService
                .from('processing_batches')
                .update({
                  completed_count: (await getCurrentCounts(bgService, batchId)).completed + 1,
                })
                .eq('id', batchId);
            } else if (status === 'failed') {
              await bgService
                .from('processing_batches')
                .update({
                  failed_count: (await getCurrentCounts(bgService, batchId)).failed + 1,
                })
                .eq('id', batchId);
            }
          },
        });

        // ---- Batch complete — update record ----
        const finalCounts = await getCurrentCounts(bgService, batchId);
        const finalStatus = finalCounts.failed === certificateIds.length ? 'failed' : 'complete';

        await bgService
          .from('processing_batches')
          .update({
            status: finalStatus,
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchId);

        console.log(`[batch-extract] Batch ${batchId} complete: ${finalCounts.completed} done, ${finalCounts.failed} failed`);

        // ---- Send email if client is no longer polling ----
        const { data: finalBatch } = await bgService
          .from('processing_batches')
          .select('client_active')
          .eq('id', batchId)
          .single();

        if (finalBatch && !finalBatch.client_active && userEmail) {
          // Gather compliance stats for the email
          const stats = await gatherBatchStats(bgService, certificateIds as string[], orgId);
          try {
            await sendBatchCompleteEmail({
              to: userEmail,
              orgName,
              totalCerts: certificateIds.length,
              completedCount: finalCounts.completed,
              failedCount: finalCounts.failed,
              complianceGaps: stats.complianceGaps,
              vendorCount: stats.vendorCount,
              dashboardUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://smartcoi.io'}/dashboard`,
            });
            console.log(`[batch-extract] Completion email sent to ${userEmail}`);
          } catch (emailErr) {
            console.error('[batch-extract] Failed to send completion email:', emailErr);
          }
        } else {
          console.log(`[batch-extract] Skipping email — client still active for batch ${batchId}`);
        }

        // Log activity
        await bgService.from('activity_log').insert({
          organization_id: orgId,
          action: 'batch_extraction_completed',
          description: `Batch extraction completed: ${finalCounts.completed} of ${certificateIds.length} certificates processed successfully.`,
          performed_by: userId,
        });
      } catch (err) {
        console.error(`[batch-extract] Background processing failed for batch ${batchId}:`, err);
        await bgService
          .from('processing_batches')
          .update({
            status: 'failed',
            completed_at: new Date().toISOString(),
          })
          .eq('id', batchId);
      }
    });

    // ---- Immediate response ----
    return NextResponse.json({
      batchId,
      status: 'processing',
      totalCerts: certificateIds.length,
    });
  } catch (err) {
    console.error('[batch-extract] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function getCurrentCounts(
  client: ReturnType<typeof createServiceClient>,
  batchId: string
): Promise<{ completed: number; failed: number }> {
  const { data } = await client
    .from('processing_batches')
    .select('completed_count, failed_count')
    .eq('id', batchId)
    .single();
  return {
    completed: data?.completed_count ?? 0,
    failed: data?.failed_count ?? 0,
  };
}

/**
 * Extracts a single certificate — mirrors the logic in /api/certificates/extract
 * but runs server-side without a client request context.
 */
async function extractSingleCertificate(
  serviceClient: ReturnType<typeof createServiceClient>,
  certificateId: string,
  orgId: string,
  userId: string
): Promise<{ coverages: number; entities: number; inferredVendorType: string | null; vendorTypeNeedsReview: boolean }> {
  // Fetch certificate record
  const { data: cert, error: certError } = await serviceClient
    .from('certificates')
    .select('*')
    .eq('id', certificateId)
    .eq('organization_id', orgId)
    .single();

  if (certError || !cert) {
    throw new Error('Certificate not found');
  }

  if (!cert.file_path) {
    throw new Error('Certificate has no file attached');
  }

  // Download PDF from storage
  const { data: fileData, error: downloadError } = await serviceClient.storage
    .from('coi-documents')
    .download(cert.file_path);

  if (downloadError || !fileData) {
    console.error('[batch-extract] Storage download error:', downloadError);
    await serviceClient
      .from('certificates')
      .update({ processing_status: 'failed' })
      .eq('id', certificateId);
    throw new Error('Failed to download PDF from storage');
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  // File size validation
  if (buffer.length > MAX_FILE_SIZE) {
    await serviceClient
      .from('certificates')
      .update({ processing_status: 'failed' })
      .eq('id', certificateId);
    throw new Error('File is too large');
  }

  const pdfBase64 = buffer.toString('base64');

  // AI extraction
  console.log(`[batch-extract] Extracting certId=${certificateId}`);
  const result = await extractCOIFromPDF(pdfBase64);

  if (!result.success) {
    await serviceClient
      .from('certificates')
      .update({ processing_status: 'failed' })
      .eq('id', certificateId);

    await serviceClient.from('activity_log').insert({
      organization_id: orgId,
      certificate_id: certificateId,
      entity_id: cert.entity_id ?? cert.vendor_id ?? cert.tenant_id,
      vendor_id: cert.vendor_id,
      tenant_id: cert.tenant_id,
      action: 'coi_processed',
      description: `COI extraction failed: ${result.error}`,
      performed_by: userId,
    });

    throw new Error(result.userMessage ?? result.error ?? 'Extraction failed');
  }

  // Store extraction results
  if (result.coverages.length > 0) {
    const coverageRows = result.coverages.map((c) => ({
      certificate_id: certificateId,
      coverage_type: c.coverage_type,
      carrier_name: c.carrier_name,
      policy_number: c.policy_number,
      limit_amount: c.limit_amount,
      limit_type: c.limit_type,
      effective_date: c.effective_date,
      expiration_date: c.expiration_date,
      additional_insured_listed: c.additional_insured_listed,
      additional_insured_entities: c.additional_insured_entities,
      waiver_of_subrogation: c.waiver_of_subrogation,
      confidence_flag: c.confidence_flag,
      raw_extracted_text: c.raw_extracted_text,
    }));
    const { error: covError } = await serviceClient
      .from('extracted_coverages')
      .insert(coverageRows);
    if (covError) {
      console.error('[batch-extract] Failed to insert coverages:', covError);
      await serviceClient
        .from('certificates')
        .update({ processing_status: 'failed' })
        .eq('id', certificateId);
      throw new Error('Failed to store extraction results');
    }
  }

  if (result.entities.length > 0) {
    const entityRows = result.entities.map((e) => ({
      certificate_id: certificateId,
      entity_name: e.entity_name,
      entity_address: e.entity_address,
      entity_type: e.entity_type,
      confidence_flag: e.confidence_flag,
    }));
    const { error: entError } = await serviceClient
      .from('extracted_entities')
      .insert(entityRows);
    if (entError) {
      console.error('[batch-extract] Failed to insert entities:', entError);
      await serviceClient
        .from('certificates')
        .update({ processing_status: 'failed' })
        .eq('id', certificateId);
      throw new Error('Failed to store extraction results');
    }
  }

  // Update certificate status, insured name, endorsement data, and inferred vendor type
  await serviceClient
    .from('certificates')
    .update({
      processing_status: 'extracted',
      ...(result.insuredName ? { insured_name: result.insuredName } : {}),
      endorsement_data: result.endorsements.length > 0 ? result.endorsements : null,
      inferred_vendor_type: result.inferredVendorType ?? null,
      vendor_type_needs_review: result.vendorTypeNeedsReview ?? false,
    })
    .eq('id', certificateId);

  // Log activity
  await serviceClient.from('activity_log').insert({
    organization_id: orgId,
    certificate_id: certificateId,
    entity_id: cert.entity_id ?? cert.vendor_id ?? cert.tenant_id,
    vendor_id: cert.vendor_id,
    tenant_id: cert.tenant_id,
    action: 'coi_processed',
    description: `COI processed successfully — ${result.coverages.length} coverage(s) and ${result.entities.length} entity/entities extracted.`,
    performed_by: userId,
  });

  // Run compliance
  try {
    await runAutoCompliance(certificateId, orgId);
  } catch (compErr) {
    console.error(`[batch-extract] Auto-compliance failed for cert=${certificateId}:`, compErr);
  }

  return {
    coverages: result.coverages.length,
    entities: result.entities.length,
    inferredVendorType: result.inferredVendorType ?? null,
    vendorTypeNeedsReview: result.vendorTypeNeedsReview ?? false,
  };
}

/**
 * Gather compliance stats for the completion email.
 */
async function gatherBatchStats(
  client: ReturnType<typeof createServiceClient>,
  certificateIds: string[],
  orgId: string
): Promise<{ complianceGaps: number; vendorCount: number }> {
  try {
    // Count compliance gaps
    const { count: gapCount } = await client
      .from('compliance_results')
      .select('*', { count: 'exact', head: true })
      .in('certificate_id', certificateIds)
      .eq('status', 'non_compliant');

    // Count unique entities linked to these certificates
    const { data: certs } = await client
      .from('certificates')
      .select('entity_id, vendor_id, tenant_id')
      .in('id', certificateIds);

    const entityIds = new Set<string>();
    certs?.forEach((c) => {
      if (c.entity_id) entityIds.add(c.entity_id);
      else if (c.vendor_id) entityIds.add(c.vendor_id);
      else if (c.tenant_id) entityIds.add(c.tenant_id);
    });

    return {
      complianceGaps: gapCount ?? 0,
      vendorCount: entityIds.size,
    };
  } catch (err) {
    console.error('[batch-extract] Failed to gather stats:', err);
    return { complianceGaps: 0, vendorCount: 0 };
  }
}
