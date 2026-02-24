/**
 * Repair script for bulk-upload data issues:
 * 1. Fix vendor/tenant names that contain ".pdf" (use certificate insured_name)
 * 2. Link orphaned bulk-upload certificates to matching vendors
 *
 * Run from project root (where .env.local exists):
 *   npx tsx scripts/repair-bulk-upload-data.ts
 *
 * Or with explicit env:
 *   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ... \
 *   npx tsx scripts/repair-bulk-upload-data.ts
 *
 * Add --dry-run to preview changes without writing:
 *   npx tsx scripts/repair-bulk-upload-data.ts --dry-run
 */

import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load .env.local (Next.js convention)
config({ path: '.env.local' });
config({ path: '.env' });

const DRY_RUN = process.argv.includes('--dry-run');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  console.error('Make sure .env.local exists or pass them as environment variables.');
  process.exit(1);
}

const supabase = createClient(url, serviceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function main() {
  console.log(DRY_RUN ? '=== DRY RUN (no changes will be written) ===' : '=== RUNNING REPAIR ===');
  console.log();

  let vendorNamesFixed = 0;
  let tenantNamesFixed = 0;
  let certsLinked = 0;

  // ---- Fix 1: Vendor names containing ".pdf" ----
  console.log('--- Fix 1: Vendors with ".pdf" in company_name ---');

  const { data: pdfVendors, error: pvErr } = await supabase
    .from('vendors')
    .select('id, company_name, organization_id')
    .is('deleted_at', null)
    .like('company_name', '%.pdf%');

  if (pvErr) {
    console.error('Error fetching vendors:', pvErr.message);
  } else {
    console.log(`Found ${(pdfVendors ?? []).length} vendor(s) with ".pdf" in name`);

    for (const v of pdfVendors ?? []) {
      // Try to get insured_name from the vendor's most recent certificate
      const { data: cert } = await supabase
        .from('certificates')
        .select('insured_name')
        .eq('vendor_id', v.id)
        .not('insured_name', 'is', null)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newName = cert?.insured_name || v.company_name.replace(/\.pdf$/i, '');

      if (newName !== v.company_name) {
        console.log(`  [vendor] "${v.company_name}" → "${newName}"`);
        if (!DRY_RUN) {
          const { error: updateErr } = await supabase
            .from('vendors')
            .update({ company_name: newName })
            .eq('id', v.id);
          if (updateErr) {
            console.error(`    ERROR updating vendor ${v.id}:`, updateErr.message);
          } else {
            vendorNamesFixed++;
          }
        } else {
          vendorNamesFixed++;
        }
      }
    }
  }

  console.log();

  // ---- Fix 1b: Tenant names containing ".pdf" ----
  console.log('--- Fix 1b: Tenants with ".pdf" in company_name ---');

  const { data: pdfTenants, error: ptErr } = await supabase
    .from('tenants')
    .select('id, company_name, organization_id')
    .is('deleted_at', null)
    .like('company_name', '%.pdf%');

  if (ptErr) {
    console.error('Error fetching tenants:', ptErr.message);
  } else {
    console.log(`Found ${(pdfTenants ?? []).length} tenant(s) with ".pdf" in name`);

    for (const t of pdfTenants ?? []) {
      const { data: cert } = await supabase
        .from('certificates')
        .select('insured_name')
        .eq('tenant_id', t.id)
        .not('insured_name', 'is', null)
        .order('uploaded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const newName = cert?.insured_name || t.company_name.replace(/\.pdf$/i, '');

      if (newName !== t.company_name) {
        console.log(`  [tenant] "${t.company_name}" → "${newName}"`);
        if (!DRY_RUN) {
          const { error: updateErr } = await supabase
            .from('tenants')
            .update({ company_name: newName })
            .eq('id', t.id);
          if (updateErr) {
            console.error(`    ERROR updating tenant ${t.id}:`, updateErr.message);
          } else {
            tenantNamesFixed++;
          }
        } else {
          tenantNamesFixed++;
        }
      }
    }
  }

  console.log();

  // ---- Fix 2: Link orphaned bulk-upload certificates ----
  console.log('--- Fix 2: Orphaned bulk-upload certificates ---');

  const { data: orphanedCerts, error: ocErr } = await supabase
    .from('certificates')
    .select('id, file_path, insured_name, processing_status, organization_id')
    .like('file_path', 'bulk/%')
    .is('vendor_id', null)
    .is('tenant_id', null)
    .eq('processing_status', 'extracted');

  if (ocErr) {
    console.error('Error fetching orphaned certs:', ocErr.message);
  } else {
    console.log(`Found ${(orphanedCerts ?? []).length} orphaned bulk certificate(s)`);

    // Group by org for efficient vendor lookups
    const byOrg = new Map<string, typeof orphanedCerts>();
    for (const cert of orphanedCerts ?? []) {
      const orgCerts = byOrg.get(cert.organization_id) ?? [];
      orgCerts.push(cert);
      byOrg.set(cert.organization_id, orgCerts);
    }

    for (const [orgId, certs] of byOrg) {
      // Load all active vendors for this org
      const { data: vendors } = await supabase
        .from('vendors')
        .select('id, company_name, property_id')
        .eq('organization_id', orgId)
        .is('deleted_at', null)
        .is('archived_at', null);

      for (const cert of certs ?? []) {
        if (!cert.insured_name) {
          console.log(`  [skip] cert ${cert.id} — no insured_name`);
          continue;
        }

        const certName = cert.insured_name.toLowerCase().trim();

        const matchedVendor = (vendors ?? []).find((v) => {
          const vName = v.company_name.toLowerCase().trim();
          return (
            vName === certName ||
            vName.includes(certName) ||
            certName.includes(vName) ||
            vName === certName.replace(/\.pdf$/i, '')
          );
        });

        if (matchedVendor) {
          console.log(
            `  [link] cert ${cert.id} ("${cert.insured_name}") → vendor "${matchedVendor.company_name}" (${matchedVendor.id})`
          );
          if (!DRY_RUN) {
            const { error: updateErr } = await supabase
              .from('certificates')
              .update({ vendor_id: matchedVendor.id })
              .eq('id', cert.id);
            if (updateErr) {
              console.error(`    ERROR linking cert ${cert.id}:`, updateErr.message);
            } else {
              certsLinked++;
            }
          } else {
            certsLinked++;
          }
        } else {
          console.log(
            `  [no match] cert ${cert.id} ("${cert.insured_name}") — no vendor matched`
          );
        }
      }
    }
  }

  // ---- Summary ----
  console.log();
  console.log('=== SUMMARY ===');
  console.log(`  Vendor names fixed:      ${vendorNamesFixed}`);
  console.log(`  Tenant names fixed:      ${tenantNamesFixed}`);
  console.log(`  Certificates linked:     ${certsLinked}`);
  console.log(`  Orphaned (unmatched):    ${((orphanedCerts ?? []).length) - certsLinked}`);

  if (DRY_RUN) {
    console.log();
    console.log('This was a DRY RUN. Re-run without --dry-run to apply changes.');
  } else {
    console.log();
    console.log('Done! Changes applied. Visit the app and hard-refresh to see updates.');
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
