import type { CoverageType, LimitType } from '@/types';

// ============================================================================
// Types for lease extraction
// ============================================================================

export interface LeaseRequirementRow {
  coverage_type: CoverageType;
  is_required: boolean;
  minimum_limit: number | null;
  limit_type: LimitType | null;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory: boolean;
}

export interface LeaseExtractionResult {
  success: boolean;
  requirements: LeaseRequirementRow[];
  additional_insured_name: string | null;
  certificate_holder_name: string | null;
  requires_primary_noncontributory: boolean;
  error?: string;
  userMessage?: string;
}

// ============================================================================
// System prompt for lease insurance requirements extraction
// ============================================================================

const LEASE_SYSTEM_PROMPT = `You are an expert commercial real estate lease analyst. Your task is to find and extract insurance requirements from a tenant lease document.

Search the entire document for sections typically titled "Insurance," "Insurance Requirements," "Certificate of Insurance," "Indemnification," "Tenant's Insurance," "Required Coverage," or similar headings.

Return a JSON object with exactly this structure:
{
  "found_requirements": true | false,
  "requirements": [
    {
      "coverage_type": "general_liability" | "automobile_liability" | "workers_compensation" | "employers_liability" | "umbrella_excess_liability" | "professional_liability_eo" | "property_inland_marine" | "pollution_liability" | "liquor_liability" | "cyber_liability" | "fire_legal_liability" | "business_income",
      "limit_amount": number | null,
      "limit_type": "per_occurrence" | "aggregate" | "combined_single_limit" | "statutory" | "per_person" | "per_accident",
      "is_required": true | false,
      "requires_primary_noncontributory": true | false
    }
  ],
  "additional_insured_name": "string or null — the SPECIFIC NAMED ENTITY (company or person name) that must be named as additional insured. Never return generic terms like 'Landlord' — look for the actual entity name in the lease.",
  "certificate_holder_name": "string or null — the SPECIFIC NAMED ENTITY (company or person name) that should receive certificates. Never return generic terms like 'Landlord' or 'Owner' — look for the actual entity name (e.g., 'Wyoming Financial Properties, Inc.').",
  "requires_waiver_of_subrogation": true | false,
  "requires_primary_noncontributory": true | false
}

INSTRUCTIONS:
1. Search the ENTIRE document for insurance requirement sections. They may appear anywhere in the lease.
2. For each coverage type mentioned, extract the specific dollar amount required.
3. Convert all amounts to plain numbers (e.g., "$1,000,000" becomes 1000000, "$2M" becomes 2000000).
4. If a coverage is mentioned as required but no specific limit is stated, set limit_amount to null.
5. Workers' Compensation should always use limit_type "statutory" unless a specific dollar amount is given.
6. If you find per-occurrence AND aggregate limits for the same coverage (e.g., "$1M per occurrence / $2M aggregate"), create TWO separate entries with the SAME coverage_type but DIFFERENT limit_type values.
7. Look for requirements about Additional Insured, Waiver of Subrogation, and Primary & Non-Contributory language. Set requires_primary_noncontributory to true on LIABILITY coverages (general_liability, automobile_liability, umbrella_excess_liability) when the lease requires policies to be primary and non-contributory.
8. If NO insurance requirements section exists in the document, set found_requirements to false and return an empty requirements array.
9. CRITICAL — Fire Legal Liability / Fire Damage Legal Liability / Damage to Rented Premises is a SEPARATE coverage type from General Liability. If the lease specifies a "fire legal liability" or "damage to rented premises" limit (often a sublimit under GL), return it as "fire_legal_liability", NOT as a second "general_liability" entry. Do NOT create duplicate general_liability rows.
10. CRITICAL — Business Income / Loss of Business Income / Business Interruption insurance (including Extra Expense, Contingent Business Income) should be returned as "business_income". This is a separate coverage type, not part of property insurance.
11. ENTITY NAMES — For additional_insured_name and certificate_holder_name, extract the ACTUAL NAMED ENTITY from the lease (e.g., "Wyoming Financial Properties, Inc.", "Westfield Tower LLC"). Search the lease header, signature blocks, and definitions for the landlord/owner entity name. Never return generic role terms like "Landlord", "Owner", "Lessor", or "Property Manager".
12. Only return coverage types from the allowed enum values. Map common lease language:
   - "Commercial General Liability" / "CGL" → general_liability
   - "Automobile Liability" / "Auto" → automobile_liability
   - "Workers' Compensation" / "Worker's Comp" → workers_compensation
   - "Employer's Liability" → employers_liability
   - "Umbrella" / "Excess Liability" → umbrella_excess_liability
   - "Professional Liability" / "E&O" / "Errors and Omissions" → professional_liability_eo
   - "Property Insurance" / "Inland Marine" / "Business Personal Property" → property_inland_marine
   - "Pollution Liability" / "Environmental" → pollution_liability
   - "Liquor Liability" / "Dram Shop" → liquor_liability
   - "Cyber Liability" / "Technology E&O" → cyber_liability
   - "Fire Legal Liability" / "Fire Damage Legal Liability" / "Damage to Rented Premises" → fire_legal_liability
   - "Business Income" / "Loss of Business Income" / "Business Interruption" / "Extra Expense" → business_income

Return ONLY the JSON object, no other text.`;

// ============================================================================
// Extraction function
// ============================================================================

interface AILeaseRequirement {
  coverage_type: CoverageType;
  limit_amount: number | null;
  limit_type: LimitType;
  is_required: boolean;
  requires_primary_noncontributory?: boolean;
}

interface AILeaseResponse {
  found_requirements: boolean;
  requirements: AILeaseRequirement[];
  additional_insured_name: string | null;
  certificate_holder_name: string | null;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory: boolean;
}

const VALID_COVERAGE_TYPES = new Set<string>([
  'general_liability', 'automobile_liability', 'workers_compensation',
  'employers_liability', 'umbrella_excess_liability', 'professional_liability_eo',
  'property_inland_marine', 'pollution_liability', 'liquor_liability', 'cyber_liability',
  'fire_legal_liability', 'business_income',
]);

const VALID_LIMIT_TYPES = new Set<string>([
  'per_occurrence', 'aggregate', 'combined_single_limit', 'statutory', 'per_person', 'per_accident',
]);

/**
 * Send a lease PDF (as base64) to the Anthropic Claude API and extract
 * insurance requirements. Returns structured data for template creation.
 */
export async function extractLeaseRequirements(pdfBase64: string): Promise<LeaseExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false, requirements: [],
      additional_insured_name: null, certificate_holder_name: null,
      requires_primary_noncontributory: false,
      error: 'ANTHROPIC_API_KEY is not configured',
      userMessage: 'Something went wrong. Please try again or contact support@smartcoi.io.',
    };
  }

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: LEASE_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'document',
            source: {
              type: 'base64',
              media_type: 'application/pdf',
              data: pdfBase64,
            },
          },
          {
            type: 'text',
            text: 'Extract all insurance requirements from this lease document. Search every section for coverage types, minimum limits, additional insured requirements, waiver of subrogation, and primary & non-contributory language.',
          },
        ],
      },
    ],
  });

  const headers = {
    'Content-Type': 'application/json',
    'x-api-key': apiKey,
    'anthropic-version': '2023-06-01',
  };

  // Retry with backoff for transient errors
  const BACKOFF_MS = [5_000, 15_000, 30_000];

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: requestBody,
    });

    if (response.ok) {
      const messageResponse = await response.json();
      const responseText =
        messageResponse.content?.[0]?.type === 'text' ? messageResponse.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false, requirements: [],
          additional_insured_name: null, certificate_holder_name: null,
          requires_primary_noncontributory: false,
          error: 'Could not parse AI response',
          userMessage: "We couldn't read this PDF. Please make sure it's a valid lease document.",
        };
      }

      let parsed: AILeaseResponse;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false, requirements: [],
          additional_insured_name: null, certificate_holder_name: null,
          requires_primary_noncontributory: false,
          error: 'Invalid JSON in AI response',
          userMessage: "We couldn't read this PDF. Please try again.",
        };
      }

      if (!parsed.found_requirements || !parsed.requirements?.length) {
        return {
          success: false, requirements: [],
          additional_insured_name: null, certificate_holder_name: null,
          requires_primary_noncontributory: false,
          userMessage: 'No insurance requirements found in this document. Please verify this is the correct lease.',
        };
      }

      // Map to output rows, filtering invalid values
      const globalWaiverOfSubrogation = parsed.requires_waiver_of_subrogation === true;
      const globalPrimaryNoncontributory = parsed.requires_primary_noncontributory === true;

      const requirements: LeaseRequirementRow[] = parsed.requirements
        .filter((r) => VALID_COVERAGE_TYPES.has(r.coverage_type))
        .map((r) => ({
          coverage_type: r.coverage_type,
          is_required: r.is_required !== false,
          minimum_limit: typeof r.limit_amount === 'number' ? r.limit_amount : null,
          limit_type: VALID_LIMIT_TYPES.has(r.limit_type) ? r.limit_type : 'per_occurrence',
          requires_additional_insured: !!parsed.additional_insured_name,
          requires_waiver_of_subrogation: globalWaiverOfSubrogation,
          requires_primary_noncontributory: r.requires_primary_noncontributory === true || globalPrimaryNoncontributory,
        }));

      return {
        success: true,
        requirements,
        additional_insured_name: parsed.additional_insured_name || null,
        certificate_holder_name: parsed.certificate_holder_name || null,
        requires_primary_noncontributory: parsed.requires_primary_noncontributory === true,
      };
    }

    // Transient error — retry
    const status = response.status;
    if (attempt < BACKOFF_MS.length && [429, 502, 503, 529].includes(status)) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
      continue;
    }

    // Non-retryable or out of retries
    const errorText = await response.text().catch(() => '');
    console.error(`[lease-extraction] API error: status=${status} body=${errorText.slice(0, 500)}`);
    return {
      success: false, requirements: [],
      additional_insured_name: null, certificate_holder_name: null,
      requires_primary_noncontributory: false,
      error: `API error: ${status}`,
      userMessage: status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Something went wrong. Please try again.',
    };
  }

  return {
    success: false, requirements: [],
    additional_insured_name: null, certificate_holder_name: null,
    requires_primary_noncontributory: false,
    error: 'All retries exhausted',
    userMessage: 'The service is temporarily busy. Please try again in a few minutes.',
  };
}
