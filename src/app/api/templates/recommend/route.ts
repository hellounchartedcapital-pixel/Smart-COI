import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkExtractionLimit } from '@/lib/plan-limits';
import { recommendVendorTemplate } from '@/lib/ai/vendor-template-recommendation';

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

    // Extraction limit check (counts against plan credits)
    const limitCheck = await checkExtractionLimit(profile.organization_id);
    if (!limitCheck.allowed) {
      return NextResponse.json({ error: limitCheck.error, upgrade: true }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { vendor_type, property_type, property_details } = body;

    if (!vendor_type || typeof vendor_type !== 'string') {
      return NextResponse.json({ error: 'Missing vendor_type' }, { status: 400 });
    }

    // Fetch org industry for context
    const { data: org } = await supabase
      .from('organizations')
      .select('industry')
      .eq('id', profile.organization_id)
      .single();

    // Run AI recommendation
    const result = await recommendVendorTemplate({
      vendor_type,
      property_type: property_type || undefined,
      property_details: property_details || undefined,
      industry: org?.industry || undefined,
    });

    if (!result.success) {
      return NextResponse.json({
        success: false,
        message: result.userMessage || 'Recommendation failed',
      }, { status: 200 });
    }

    // Log the recommendation for credit tracking
    await supabase.from('activity_log').insert({
      organization_id: profile.organization_id,
      action: 'coi_processed',
      description: `AI vendor template recommendation generated for "${vendor_type}"`,
      performed_by: user.id,
    });

    return NextResponse.json({
      success: true,
      coverages: result.coverages,
    });
  } catch (err) {
    console.error('[template-recommend] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
