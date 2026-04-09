import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { extractCOIFromPDF } from '@/lib/ai/extraction';
import { checkExtractionLimit } from '@/lib/plan-limits';
import { getActivePlanStatus } from '@/lib/plan-status';
import { getTerminology } from '@/lib/constants/terminology';
import type { Industry } from '@/types';
import { runAutoCompliance } from '@/lib/actions/certificates';
import { sendNotificationEmail } from '@/lib/notifications/email-sender';

const MAX_EXTRACTIONS_PER_HOUR = 5;

interface TokenData {
  id: string;
  vendor_id: string | null;
  tenant_id: string | null;
  token: string;
  expires_at: string;
  is_active: boolean;
}

async function validateToken(
  supabase: ReturnType<typeof createServiceClient>,
  token: string
): Promise<{ valid: false; error: string; status: number } | { valid: true; data: TokenData }> {
  const { data, error } = await supabase
    .from('upload_portal_tokens')
    .select('id, vendor_id, tenant_id, token, expires_at, is_active')
    .eq('token', token)
    .single();

  if (error || !data) {
    return { valid: false, error: 'This upload link is no longer active.', status: 404 };
  }

  if (!data.is_active) {
    return { valid: false, error: 'This upload link is no longer active.', status: 410 };
  }

  if (new Date(data.expires_at) < new Date()) {
    return { valid: false, error: 'This upload link has expired.', status: 410 };
  }

  return { valid: true, data };
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const supabase = createServiceClient();

    // Validate token
    const tokenResult = await validateToken(supabase, token);
    if (!tokenResult.valid) {
      return NextResponse.json(
        { error: tokenResult.error },
        { status: tokenResult.status }
      );
    }

    const tokenData = tokenResult.data;
    const entityType = tokenData.vendor_id ? 'vendor' : 'tenant';
    const entityId = (tokenData.vendor_id ?? tokenData.tenant_id)!;

    // Rate limit: max extractions per hour for this entity
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count: recentExtractions } = await supabase
      .from('certificates')
      .select('id', { count: 'exact', head: true })
      .eq(entityType === 'vendor' ? 'vendor_id' : 'tenant_id', entityId)
      .in('processing_status', ['extracted', 'processing'])
      .gte('uploaded_at', oneHourAgo);

    if ((recentExtractions ?? 0) >= MAX_EXTRACTIONS_PER_HOUR) {
      return NextResponse.json(
        { error: "You've reached the extraction limit. Please try again later." },
        { status: 429 }
      );
    }

    // Parse request body
    const { certificate_id } = await request.json();
    if (!certificate_id) {
      return NextResponse.json(
        { error: 'Missing certificate_id.' },
        { status: 400 }
      );
    }

    // Verify the certificate belongs to this entity
    const { data: cert, error: certError } = await supabase
      .from('certificates')
      .select('id, file_path, organization_id, entity_id, vendor_id, tenant_id, processing_status')
      .eq('id', certificate_id)
      .single();

    if (certError || !cert) {
      return NextResponse.json(
        { error: 'Certificate not found.' },
        { status: 404 }
      );
    }

    // Verify the certificate belongs to the entity associated with this token
    // Check entity_id first (unified), then fall back to legacy vendor_id/tenant_id
    const certEntityId = cert.entity_id ?? (entityType === 'vendor' ? cert.vendor_id : cert.tenant_id);
    if (certEntityId !== entityId) {
      return NextResponse.json(
        { error: 'Certificate not found.' },
        { status: 404 }
      );
    }

    // Check org plan status — reject if canceled or trial expired
    const { data: orgForPlan } = await supabase
      .from('organizations')
      .select('plan, trial_ends_at, payment_failed, industry')
      .eq('id', cert.organization_id)
      .single();

    const requesterLabel = getTerminology((orgForPlan?.industry as Industry) ?? null).requesterLabel;

    if (orgForPlan) {
      const planStatus = getActivePlanStatus(orgForPlan);
      if (!planStatus.isActive) {
        return NextResponse.json(
          { error: `This upload portal is temporarily unavailable. Please contact your ${requesterLabel}.` },
          { status: 403 }
        );
      }
    }

    // Check monthly extraction limit for the org
    const limitCheck = await checkExtractionLimit(cert.organization_id);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { error: `This organization has reached its monthly processing limit. Please contact your ${requesterLabel}.` },
        { status: 403 }
      );
    }

    // Download the PDF from storage
    // Normalize path: strip public URL prefixes if stored as full URL
    const publicUrlPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/coi-documents/`;
    let storagePath = cert.file_path;
    if (storagePath.startsWith(publicUrlPrefix)) {
      storagePath = storagePath.slice(publicUrlPrefix.length);
    } else if (storagePath.startsWith('http')) {
      const idx = storagePath.indexOf('/coi-documents/');
      if (idx !== -1) {
        storagePath = storagePath.slice(idx + '/coi-documents/'.length);
      }
    }

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('coi-documents')
      .download(storagePath);

    if (downloadError || !fileData) {
      await supabase
        .from('certificates')
        .update({ processing_status: 'failed' })
        .eq('id', certificate_id);

      return NextResponse.json(
        { error: 'Failed to process your document. Please try again.' },
        { status: 500 }
      );
    }

    // Convert to base64 and extract using the shared AI extraction
    const arrayBuffer = await fileData.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');

    const result = await extractCOIFromPDF(base64);

    if (!result.success) {
      await supabase
        .from('certificates')
        .update({ processing_status: 'failed' })
        .eq('id', certificate_id);

      return NextResponse.json(
        { error: result.userMessage ?? 'Failed to process your document. Please try again.' },
        { status: 422 }
      );
    }

    // Store extracted coverages (explicitly pick known fields — never spread AI output)
    if (result.coverages.length > 0) {
      const coverageRows = result.coverages.map((c) => ({
        certificate_id,
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
      const { error: covError } = await supabase
        .from('extracted_coverages')
        .insert(coverageRows);
      if (covError) {
        console.error('Failed to insert extracted_coverages:', covError);
        await supabase
          .from('certificates')
          .update({ processing_status: 'failed' })
          .eq('id', certificate_id);
        return NextResponse.json(
          { error: 'Failed to store extraction results. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Store extracted entities (explicitly pick known fields)
    if (result.entities.length > 0) {
      const entityRows = result.entities.map((e) => ({
        certificate_id,
        entity_name: e.entity_name,
        entity_address: e.entity_address,
        entity_type: e.entity_type,
        confidence_flag: e.confidence_flag,
      }));
      const { error: entError } = await supabase
        .from('extracted_entities')
        .insert(entityRows);
      if (entError) {
        console.error('Failed to insert extracted_entities:', entError);
        await supabase
          .from('certificates')
          .update({ processing_status: 'failed' })
          .eq('id', certificate_id);
        return NextResponse.json(
          { error: 'Failed to store extraction results. Please try again.' },
          { status: 500 }
        );
      }
    }

    // Update certificate status and store insured name
    await supabase
      .from('certificates')
      .update({
        processing_status: 'extracted',
        ...(result.insuredName ? { insured_name: result.insuredName } : {}),
      })
      .eq('id', certificate_id);

    // Fetch entity info for activity log and admin notification — try legacy, fall back to entities
    let entityInfo: { company_name: string; organization_id: string; property_id: string | null } | null = null;
    const { data: legacyInfo } = await supabase
      .from(entityType === 'vendor' ? 'vendors' : 'tenants')
      .select('company_name, organization_id, property_id')
      .eq('id', entityId)
      .single();
    entityInfo = legacyInfo;

    if (!entityInfo) {
      const { data: unifiedInfo } = await supabase
        .from('entities')
        .select('name, organization_id, property_id')
        .eq('id', entityId)
        .single();
      if (unifiedInfo) {
        entityInfo = { company_name: unifiedInfo.name, organization_id: unifiedInfo.organization_id, property_id: unifiedInfo.property_id };
      }
    }
    const entityName = entityInfo?.company_name ?? entityType;

    // Log processing activity — include entity name since portal is unauthenticated
    await supabase.from('activity_log').insert({
      organization_id: cert.organization_id,
      entity_id: entityId,
      [entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
      certificate_id,
      action: 'coi_processed',
      description: `COI processed via self-service portal by ${entityName} — ${result.coverages.length} coverage(s) and ${result.entities.length} entity/entities extracted.`,
    });

    if (entityInfo) {
      const { data: orgUsers } = await supabase
        .from('users')
        .select('id, email')
        .eq('organization_id', entityInfo.organization_id)
        .limit(1);

      if (orgUsers && orgUsers.length > 0) {
        const emailSubject = `New COI uploaded by ${entityInfo.company_name} via self-service portal`;
        const reviewUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.smartcoi.io'}/dashboard/certificates/${certificate_id}/review`;
        const emailHtml = `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f8fafc;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;padding:32px 16px;">
<tr><td align="center">
<table width="100%" style="max-width:600px;background:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
  <tr><td style="background:#059669;padding:20px 24px;">
    <span style="color:#ffffff;font-size:18px;font-weight:700;">SmartCOI</span>
  </td></tr>
  <tr><td style="padding:24px;">
    <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px;">A new certificate of insurance has been uploaded by <strong>${entityInfo.company_name}</strong> through your self-service portal.</p>
    <p style="font-size:14px;color:#334155;line-height:1.6;margin:0 0 16px;">Please review it at your earliest convenience.</p>
    <table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:#059669;border-radius:6px;padding:12px 24px;">
      <a href="${reviewUrl}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Review Certificate</a>
    </td></tr>
    </table>
  </td></tr>
  <tr><td style="padding:16px 24px;background:#f1f5f9;font-size:11px;color:#64748b;text-align:center;">
    Powered by <a href="https://smartcoi.io" style="color:#059669;text-decoration:none;font-weight:600;">SmartCOI</a>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`;

        await supabase.from('notifications').insert({
          organization_id: entityInfo.organization_id,
          [entityType === 'vendor' ? 'vendor_id' : 'tenant_id']: entityId,
          type: 'portal_upload',
          scheduled_date: new Date().toISOString(),
          sent_date: new Date().toISOString(),
          status: 'sent',
          email_subject: emailSubject,
          email_body: emailHtml,
          portal_link: `/dashboard/certificates/${certificate_id}/review`,
        });

        // Send immediate email to org admin
        const adminEmail = orgUsers[0].email;
        if (adminEmail) {
          try {
            await sendNotificationEmail(adminEmail, emailSubject, emailHtml);
          } catch (emailErr) {
            console.error('[portal/extract] Failed to send admin notification email:', emailErr);
          }
        }
      }
    }

    // Run compliance automatically after extraction
    try {
      await runAutoCompliance(certificate_id, cert.organization_id);
    } catch (compErr) {
      console.error(`[portal/extract] Auto-compliance failed for cert=${certificate_id}:`, compErr);
    }

    return NextResponse.json({
      success: true,
      message: 'Certificate processed successfully.',
    });
  } catch {
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
