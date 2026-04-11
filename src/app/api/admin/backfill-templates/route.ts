import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getRecommendedRequirements } from '@/lib/constants/vendor-requirements';
import type { Industry } from '@/types';

/**
 * POST /api/admin/backfill-templates
 *
 * Finds all entities that have entity_category set (AI-inferred vendor type)
 * but no requirement template assigned, and creates + assigns an
 * AI-recommended template for each. Handles the Kastle Systems edge case
 * and any similar cases from previous batches.
 *
 * Auth: CRON_SECRET
 *
 * Usage:
 *   curl -X POST https://smartcoi.io/api/admin/backfill-templates \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret) {
    return NextResponse.json({ error: 'CRON_SECRET not configured' }, { status: 500 });
  }
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServiceClient();

  // Find all entities with entity_category but no template
  const { data: entities, error: fetchErr } = await supabase
    .from('entities')
    .select('id, name, organization_id, entity_type, entity_category')
    .is('template_id', null)
    .not('entity_category', 'is', null)
    .is('deleted_at', null)
    .is('archived_at', null);

  if (fetchErr) {
    return NextResponse.json({ error: 'Failed to fetch entities', details: fetchErr.message }, { status: 500 });
  }

  if (!entities || entities.length === 0) {
    return NextResponse.json({ message: 'No entities need template backfill', created: 0 });
  }

  // Group by org to fetch industry once per org
  const orgCache = new Map<string, Industry | null>();
  const results: Array<{ entityId: string; name: string; vendorType: string; templateName: string }> = [];
  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const entity of entities) {
    const orgId = entity.organization_id;
    const vendorType = entity.entity_category!;
    const entityType = entity.entity_type ?? 'vendor';

    // Get org industry (cached)
    if (!orgCache.has(orgId)) {
      const { data: org } = await supabase
        .from('organizations')
        .select('industry')
        .eq('id', orgId)
        .single();
      orgCache.set(orgId, (org?.industry as Industry) ?? null);
    }
    const industry = orgCache.get(orgId) ?? null;

    // Check if requirements exist for this vendor type
    const requirements = getRecommendedRequirements(industry, vendorType);
    if (requirements.length === 0) {
      skipped++;
      continue;
    }

    const templateName = `${vendorType.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())} — AI Recommended`;
    const category = entityType === 'tenant' ? 'tenant' : 'vendor';

    try {
      // Create template
      const { data: template, error: templateErr } = await supabase
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
        console.error(`[backfill-templates] Failed to create template for entity=${entity.id}:`, templateErr);
        failed++;
        continue;
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
      await supabase.from('template_coverage_requirements').insert(rows);

      // Assign template to entity (both tables)
      await supabase
        .from('entities')
        .update({ template_id: template.id })
        .eq('id', entity.id);

      const legacyTable = entityType === 'tenant' ? 'tenants' : 'vendors';
      await supabase
        .from(legacyTable)
        .update({ template_id: template.id })
        .eq('id', entity.id);

      created++;
      results.push({
        entityId: entity.id,
        name: entity.name,
        vendorType,
        templateName,
      });

      console.log(`[backfill-templates] Created template "${templateName}" for entity "${entity.name}" (${entity.id})`);
    } catch (err) {
      console.error(`[backfill-templates] Failed for entity=${entity.id}:`, err);
      failed++;
    }
  }

  const summary = {
    totalFound: entities.length,
    created,
    skipped,
    failed,
    results,
  };

  console.log('[admin/backfill-templates]', JSON.stringify(summary, null, 2));

  return NextResponse.json(summary);
}
