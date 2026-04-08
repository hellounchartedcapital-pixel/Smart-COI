/**
 * Unit tests for getTerminology and formatTerm.
 *
 * Run with: npx tsx src/__tests__/terminology.test.ts
 *
 * Uses a minimal assertion helper since no test framework is installed.
 */

// Import using relative paths to avoid @/ alias issues in standalone execution
import { getTerminology, formatTerm } from '../lib/constants/terminology';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    passed++;
    console.log(`  PASS: ${message}`);
  } else {
    failed++;
    console.error(`  FAIL: ${message}`);
  }
}

function assertEqual(actual: unknown, expected: unknown, message: string) {
  const pass = actual === expected;
  if (!pass) {
    console.error(`  FAIL: ${message} — expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    failed++;
  } else {
    passed++;
    console.log(`  PASS: ${message}`);
  }
}

// ============================================================================
// Test: property_management returns PM-specific terms
// ============================================================================
console.log('\nTest: property_management terms');
{
  const t = getTerminology('property_management');
  assertEqual(t.location, 'Property', 'location = Property');
  assertEqual(t.locationPlural, 'Properties', 'locationPlural = Properties');
  assertEqual(t.entity, 'Vendor', 'entity = Vendor');
  assertEqual(t.entityPlural, 'Vendors', 'entityPlural = Vendors');
  assertEqual(t.tenant, 'Tenant', 'tenant = Tenant');
  assertEqual(t.tenantPlural, 'Tenants', 'tenantPlural = Tenants');
  assertEqual(t.hasTenants, true, 'hasTenants = true');
  assert(t.locationDescription.includes('building'), 'locationDescription mentions building');
  assert(t.entityDescription.includes('Contractors'), 'entityDescription mentions Contractors');
  assert(t.tenantDescription !== null, 'tenantDescription is not null');
  assert(t.uploadPrompt.includes('tenants'), 'uploadPrompt mentions tenants');
}

// ============================================================================
// Test: construction returns construction-specific terms
// ============================================================================
console.log('\nTest: construction terms');
{
  const t = getTerminology('construction');
  assertEqual(t.location, 'Project', 'location = Project');
  assertEqual(t.locationPlural, 'Projects', 'locationPlural = Projects');
  assertEqual(t.entity, 'Subcontractor', 'entity = Subcontractor');
  assertEqual(t.entityPlural, 'Subcontractors', 'entityPlural = Subcontractors');
  assertEqual(t.tenant, null, 'tenant = null');
  assertEqual(t.tenantPlural, null, 'tenantPlural = null');
  assertEqual(t.hasTenants, false, 'hasTenants = false');
  assert(t.locationDescription.includes('job site'), 'locationDescription mentions job site');
  assert(t.entityDescription.includes('Subcontractors'), 'entityDescription mentions Subcontractors');
  assertEqual(t.tenantDescription, null, 'tenantDescription = null');
  assert(t.uploadPrompt.includes('subcontractors'), 'uploadPrompt mentions subcontractors');
}

// ============================================================================
// Test: null returns defaults (same as "other")
// ============================================================================
console.log('\nTest: null industry returns defaults');
{
  const t = getTerminology(null);
  assertEqual(t.location, 'Location', 'location = Location');
  assertEqual(t.locationPlural, 'Locations', 'locationPlural = Locations');
  assertEqual(t.entity, 'Vendor', 'entity = Vendor');
  assertEqual(t.entityPlural, 'Vendors', 'entityPlural = Vendors');
  assertEqual(t.tenant, null, 'tenant = null');
  assertEqual(t.hasTenants, false, 'hasTenants = false');
  assert(t.locationDescription.includes('business location'), 'locationDescription mentions business location');
}

// ============================================================================
// Test: "other" returns same defaults as null
// ============================================================================
console.log('\nTest: "other" industry matches null defaults');
{
  const tOther = getTerminology('other');
  const tNull = getTerminology(null);
  assertEqual(tOther.location, tNull.location, 'other.location matches null.location');
  assertEqual(tOther.entity, tNull.entity, 'other.entity matches null.entity');
  assertEqual(tOther.hasTenants, tNull.hasTenants, 'other.hasTenants matches null.hasTenants');
}

// ============================================================================
// Test: hasTenants is only true for property_management
// ============================================================================
console.log('\nTest: hasTenants is only true for property_management');
{
  const industries = [
    'construction', 'logistics', 'healthcare',
    'manufacturing', 'hospitality', 'retail', 'other',
  ] as const;

  for (const industry of industries) {
    const t = getTerminology(industry);
    assertEqual(t.hasTenants, false, `${industry}.hasTenants = false`);
    assertEqual(t.tenant, null, `${industry}.tenant = null`);
  }

  const pm = getTerminology('property_management');
  assertEqual(pm.hasTenants, true, 'property_management.hasTenants = true');
}

// ============================================================================
// Test: logistics returns carrier terms
// ============================================================================
console.log('\nTest: logistics terms');
{
  const t = getTerminology('logistics');
  assertEqual(t.entity, 'Carrier', 'entity = Carrier');
  assertEqual(t.entityPlural, 'Carriers', 'entityPlural = Carriers');
}

// ============================================================================
// Test: manufacturing returns supplier terms
// ============================================================================
console.log('\nTest: manufacturing terms');
{
  const t = getTerminology('manufacturing');
  assertEqual(t.entity, 'Supplier', 'entity = Supplier');
  assertEqual(t.entityPlural, 'Suppliers', 'entityPlural = Suppliers');
  assertEqual(t.location, 'Plant', 'location = Plant');
}

// ============================================================================
// Test: formatTerm replaces placeholders
// ============================================================================
console.log('\nTest: formatTerm');
{
  const pm = getTerminology('property_management');
  assertEqual(
    formatTerm('Add a {entity} to your {location}', pm),
    'Add a Vendor to your Property',
    'replaces {entity} and {location} for PM',
  );

  const construction = getTerminology('construction');
  assertEqual(
    formatTerm('Add a {entity} to your {location}', construction),
    'Add a Subcontractor to your Project',
    'replaces {entity} and {location} for construction',
  );

  assertEqual(
    formatTerm('View all {entityPlural} across {locationPlural}', pm),
    'View all Vendors across Properties',
    'replaces plural forms',
  );

  assertEqual(
    formatTerm('Manage {tenantPlural}', pm),
    'Manage Tenants',
    'replaces {tenantPlural} for PM',
  );

  assertEqual(
    formatTerm('Manage {tenantPlural}', construction),
    'Manage ',
    '{tenantPlural} becomes empty string when null',
  );
}

// ============================================================================
// Test: requesterLabel returns correct label per industry
// ============================================================================
console.log('\nTest: requesterLabel per industry');
{
  assertEqual(getTerminology('property_management').requesterLabel, 'property manager', 'PM requesterLabel');
  assertEqual(getTerminology('construction').requesterLabel, 'project manager', 'construction requesterLabel');
  assertEqual(getTerminology('logistics').requesterLabel, 'operations team', 'logistics requesterLabel');
  assertEqual(getTerminology(null).requesterLabel, 'compliance team', 'null industry requesterLabel fallback');
}

// ============================================================================
// Summary
// ============================================================================
console.log(`\n${'='.repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) {
  process.exit(1);
} else {
  console.log('All tests passed!');
}
