import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkExtractionLimit } from '@/lib/plan-limits';
import { checkFeatureAccess } from '@/lib/require-active-plan';
import { extractLeaseRequirements } from '@/lib/ai/lease-extraction';

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { data: profile } = await supabase
      .from('users')
      .select('organization_id')
      .eq('id', user.id)
      .single();

    if (!profile?.organization_id) {
      return NextResponse.json({ error: 'No organization' }, { status: 403 });
    }

    // Feature gate — lease extraction is an Automate-tier feature.
    const featureCheck = await checkFeatureAccess('lease_extraction');
    if ('error' in featureCheck) {
      return NextResponse.json(
        { error: featureCheck.error, upgrade: true, feature: 'lease_extraction' },
        { status: 403 },
      );
    }

    // Extraction limit check (counts against plan credits)
    const limitCheck = await checkExtractionLimit(profile.organization_id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error, upgrade: true }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { pdfBase64 } = body;

    if (!pdfBase64 || typeof pdfBase64 !== 'string') {
      return NextResponse.json({ error: 'Missing PDF data' }, { status: 400 });
    }

    // Run AI extraction
    const result = await extractLeaseRequirements(pdfBase64);

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.userMessage || 'Extraction failed',
      }, { status: 200 });
    }

    // Log the extraction for credit tracking
    await supabase.from('activity_log').insert({
      organization_id: profile.organization_id,
      action: 'coi_processed',
      description: 'Lease insurance requirements extracted via AI',
      performed_by: user.id,
    });

    return NextResponse.json({
      success: true,
      requirements: result.requirements,
      additional_insured_name: result.additional_insured_name,
      certificate_holder_name: result.certificate_holder_name,
      requires_primary_noncontributory: result.requires_primary_noncontributory,
    });
  } catch (err) {
    console.error('[lease-extract] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
