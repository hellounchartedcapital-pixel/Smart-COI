import { NextRequest, NextResponse } from 'next/server';
import { after } from 'next/server';
import * as Sentry from '@sentry/nextjs';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { extractCOIFromPDF, type ExtractionResult } from '@/lib/ai/extraction';
import { MAX_FILE_SIZE } from '@/lib/utils/file-validation';
import { checkExtractionLimit } from '@/lib/plan-limits';
import { getActivePlanStatus, PLAN_INACTIVE_TAG } from '@/lib/plan-status';
import { createServiceClient } from '@/lib/supabase/service';
import { autoAssignCertificateToEntity, runAutoCompliance } from '@/lib/actions/certificates';
import { processConcurrentQueue } from '@/lib/utils/concurrent-queue';
import { sendBatchCompleteEmail } from '@/lib/emails/batch-complete';
import { withExtractionRetry } from '@/lib/utils/extraction-retry';
import { getRecommendedRequirements } from '@/lib/constants/vendor-requirements';
import type { Industry } from '@/types';

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
      .select('plan, trial_ends_at, payment_failed, name, industry')
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
    const orgIndustry = (orgForPlan.industry as Industry) ?? null;
    const batchPropertyId = propertyId ?? null;
    const batchEntityType = entityType ?? 'vendor';

    // ---- Background processing via after() ----
    after(async () => {
      console.log(`[batch-extract] Background processing started for batch ${batchId}`);
      const bgService = createServiceClient();

      try {
        await processConcurrentQueue({
          items: certificateIds as string[],
          concurrency: CONCURRENCY_LIMIT,
          maxRetries: 3,
          processFn: async (certificateId: string) => {
            return await extractSingleCertificate(bgService, certificateId, orgId, userId);
          },
          onStatusChange: async (index, status, _error, result) => {
            const certId = (certificateIds as string[])[index];
            if (status === 'complete') {
              await bgService
                .from('processing_batches')
                .update({
                  completed_count: (await getCurrentCounts(bgService, batchId)).completed + 1,
                })
                .eq('id', batchId);

              // Auto-assign entity from extraction results
              if (result?.insuredName) {
                try {
                  const assignResult = await autoAssignCertificateToEntity({
                    certificateId: certId,
                    orgId,
                    propertyId: batchPropertyId,
                    insuredName: result.insuredName,
                    entityType: batchEntityType,
                    inferredVendorType: result.inferredVendorType ?? undefined,
                    vendorTypeNeedsReview: result.vendorTypeNeedsReview ?? undefined,
                  });

                  // Auto-apply recommended requirements template if entity was newly created
                  if (assignResult && 'entityId' in assignResult && assignResult.entityId && result.inferredVendorType) {
                    await autoApplyRecommendedTemplate(
                      bgService,
                      assignResult.entityId,
                      orgId,
                      orgIndustry,
                      result.inferredVendorType,
                      batchEntityType,
                    );
                  }
                } catch (assignErr) {
                  console.error(`[batch-extract] Auto-assign failed for cert=${certId}:`, assignErr);
                }
              }
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
          const stats = await gatherBatchStats(bgService, certificateIds as string[]);
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
): Promise<{ coverages: number; entities: number; insuredName: string | null; inferredVendorType: string | null; vendorTypeNeedsReview: boolean }> {
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

  // AI extraction with automatic retries for non-rate-limit failures.
  // Rate-limit (429) retries are handled inside extractCOIFromPDF itself.
  console.log(`[batch-extract] Extracting certId=${certificateId}`);

  const retryResult = await withExtractionRetry<ExtractionResult>(
    async () => {
      const result = await extractCOIFromPDF(pdfBase64);
      if (!result.success) {
        throw new Error(result.userMessage ?? result.error ?? 'Extraction failed');
      }
      return result;
    },
    async (attempt, prevError) => {
      await serviceClient
        .from('certificates')
        .update({
          retry_count: attempt,
          ...(prevError ? { last_error: prevError } : {}),
        })
        .eq('id', certificateId);
    },
  );

  if (!retryResult.success) {
    const errorMessage = retryResult.error ?? 'Extraction failed';

    await serviceClient
      .from('certificates')
      .update({
        processing_status: 'failed',
        retry_count: retryResult.attempts,
        last_error: errorMessage,
      })
      .eq('id', certificateId);

    Sentry.captureException(new Error(`COI extraction failed: ${errorMessage}`), {
      tags: { flow: 'batch_extract', certificateId },
      extra: { orgId, attempts: retryResult.attempts, errorMessage },
    });

    await serviceClient.from('activity_log').insert({
      organization_id: orgId,
      certificate_id: certificateId,
      entity_id: cert.entity_id ?? cert.vendor_id ?? cert.tenant_id,
      vendor_id: cert.vendor_id,
      tenant_id: cert.tenant_id,
      action: 'coi_processed',
      description: `COI extraction failed after ${retryResult.attempts} attempt(s): ${errorMessage}`,
      performed_by: userId,
    });

    throw new Error(errorMessage);
  }

  const result = retryResult.data!;

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
        .update({ processing_status: 'failed', last_error: 'Failed to store extraction results' })
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
        .update({ processing_status: 'failed', last_error: 'Failed to store extraction results' })
        .eq('id', certificateId);
      throw new Error('Failed to store extraction results');
    }
  }

  // Update certificate status
  await serviceClient
    .from('certificates')
    .update({
      processing_status: 'extracted',
      retry_count: retryResult.attempts,
      last_error: null,
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
    description: `COI processed successfully — ${result.coverages.length} coverage(s) and ${result.entities.length} entity/entities extracted.${retryResult.attempts > 1 ? ` (${retryResult.attempts} attempts)` : ''}`,
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
    insuredName: result.insuredName,
    inferredVendorType: result.inferredVendorType ?? null,
    vendorTypeNeedsReview: result.vendorTypeNeedsReview ?? false,
  };
}

/**
 * Auto-create and assign a recommended requirements template to an entity
 * based on the org's industry and the inferred vendor type.
 * Skips if the entity already has a template assigned.
 */
async function autoApplyRecommendedTemplate(
  client: ReturnType<typeof createServiceClient>,
  entityId: string,
  orgId: string,
  industry: Industry | null,
  vendorType: string,
  entityType: string,
) {
  try {
    // Check if entity already has a template
    const { data: entity } = await client
      .from('entities')
      .select('template_id')
      .eq('id', entityId)
      .single();

    if (entity?.template_id) return; // Already has a template

    const requirements = getRecommendedRequirements(industry, vendorType);
    if (requirements.length === 0) return;

    const templateName = `${vendorType.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())} — AI Recommended`;
    const category = entityType === 'tenant' ? 'tenant' : 'vendor';

    // Create template
    const { data: template, error: templateErr } = await client
      .from('requirement_templates')
      .insert({
        organization_id: orgId,
        name: templateName,
        description: `Auto-generated requirements for ${vendorType.replace(/_/g, ' ')} vendors`,
        category,
        risk_level: 'standard',
        is_system_default: false,
        source_type: 'ai_recommended',
      })
      .select('id')
      .single();

    if (templateErr || !template) {
      console.error('[batch-extract] Failed to create recommended template:', templateErr);
      return;
    }

    // Insert coverage requirements
    const rows = requirements.map((r) => ({
      template_id: template.id,
      coverage_type: r.coverage_type,
      is_required: r.is_required,
      minimum_limit: r.minimum_limit,
      limit_type: r.limit_type,
      requires_additional_insured: r.requires_additional_insured,
      requires_waiver_of_subrogation: r.requires_waiver_of_subrogation,
    }));

    await client.from('template_coverage_requirements').insert(rows);

    // Assign template to entity (both entities + legacy table)
    await client
      .from('entities')
      .update({ template_id: template.id })
      .eq('id', entityId);

    const legacyTable = entityType === 'tenant' ? 'tenants' : 'vendors';
    await client
      .from(legacyTable)
      .update({ template_id: template.id })
      .eq('id', entityId);

    console.log(`[batch-extract] Auto-applied template "${templateName}" (${template.id}) to entity ${entityId}`);
  } catch (err) {
    console.error(`[batch-extract] Failed to auto-apply template for entity ${entityId}:`, err);
  }
}

/**
 * Gather compliance stats for the completion email.
 */
async function gatherBatchStats(
  client: ReturnType<typeof createServiceClient>,
  certificateIds: string[],
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
