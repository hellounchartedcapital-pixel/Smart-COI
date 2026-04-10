import type { LimitType, EndorsementRecord } from '@/types';

// ============================================================================
// Types for the AI extraction response
// ============================================================================

interface AILimit {
  amount: number;
  type: LimitType;
}

interface AICoverage {
  coverage_type: string; // freetext coverage name (e.g., "Commercial General Liability")
  carrier_name: string;
  policy_number: string;
  limits: AILimit[];
  effective_date: string;
  expiration_date: string;
  additional_insured: boolean;
  waiver_of_subrogation: boolean;
  confidence: 'high' | 'low';
  raw_text: string;
}

interface AIEntity {
  name: string;
  address: string;
  confidence: 'high' | 'low';
}

interface AIEndorsement {
  type: string;
  form_number: string | null;
  edition_date: string | null;
  found: boolean;
  named_parties: string[];
  description: string | null;
}

interface AIVendorTypeInference {
  vendor_type: string;
  confidence: 'high' | 'low';
}

interface AIExtractionResponse {
  coverages: AICoverage[];
  named_insured: string;
  certificate_holder: AIEntity;
  additional_insured_entities: AIEntity[];
  endorsements: AIEndorsement[];
  page_count: number;
  inferred_vendor_type?: AIVendorTypeInference;
}

// ============================================================================
// Mapped output types matching database schema
// ============================================================================

export interface ExtractedCoverageRow {
  coverage_type: string; // freetext coverage name
  carrier_name: string | null;
  policy_number: string | null;
  limit_amount: number | null;
  limit_type: LimitType | null;
  effective_date: string | null;
  expiration_date: string | null;
  additional_insured_listed: boolean;
  additional_insured_entities: string[];
  waiver_of_subrogation: boolean;
  confidence_flag: boolean;
  raw_extracted_text: string | null;
}

export interface ExtractedEntityRow {
  entity_name: string;
  entity_address: string | null;
  entity_type: 'certificate_holder' | 'additional_insured';
  confidence_flag: boolean;
}

export interface ExtractionResult {
  success: boolean;
  coverages: ExtractedCoverageRow[];
  entities: ExtractedEntityRow[];
  endorsements: EndorsementRecord[];
  insuredName: string | null;
  /** AI-inferred vendor trade/type (e.g., "electrician", "plumber", "other") */
  inferredVendorType?: string;
  /** True when vendor type inference confidence is low — UI should prompt review */
  vendorTypeNeedsReview?: boolean;
  error?: string;
  /** User-facing error message (friendly wording, no raw status codes) */
  userMessage?: string;
}

// ============================================================================
// System prompt — Two-pass extraction strategy
// ============================================================================

const SYSTEM_PROMPT = `You are an expert insurance document analyzer. Extract all coverage and entity information from this Certificate of Insurance (COI) document using a two-pass approach.

Return a JSON object with exactly this structure:
{
  "page_count": number,
  "coverages": [
    {
      "coverage_type": "string — the coverage name exactly as it appears on the certificate, cleaned up to Title Case. Examples: 'Commercial General Liability', 'Automobile Liability', 'Workers\\' Compensation', 'Employers\\' Liability', 'Umbrella / Excess Liability', 'Professional Liability (E&O)', 'Property / Inland Marine', 'Cyber Liability', 'Pollution Liability', 'Fire Legal Liability', 'Business Income / Extra Expense', 'Builder\\'s Risk', 'Tenant\\'s Legal Liability', etc.",
      "carrier_name": "string",
      "policy_number": "string",
      "limits": [
        {
          "amount": number,
          "type": "per_occurrence" | "aggregate" | "combined_single_limit" | "statutory" | "per_person" | "per_accident"
        }
      ],
      "effective_date": "YYYY-MM-DD",
      "expiration_date": "YYYY-MM-DD",
      "additional_insured": true | false,
      "waiver_of_subrogation": true | false,
      "confidence": "high" | "low",
      "raw_text": "the original text from the document for this coverage section"
    }
  ],
  "named_insured": "The insured / named insured entity name from the top of the certificate (the policyholder)",
  "certificate_holder": {
    "name": "string",
    "address": "string",
    "confidence": "high" | "low"
  },
  "additional_insured_entities": [
    {
      "name": "string",
      "address": "string or empty",
      "confidence": "high" | "low"
    }
  ],
  "endorsements": [
    {
      "type": "CG 20 10" | "CG 20 37" | "Waiver of Subrogation" | "Primary and Non-Contributory" | "other",
      "form_number": "string or null (e.g., 'CG 20 10 04 13')",
      "edition_date": "string or null (e.g., '04 13')",
      "found": true | false,
      "named_parties": ["string"],
      "description": "string or null"
    }
  ],
  "inferred_vendor_type": {
    "vendor_type": "plumber" | "electrician" | "hvac" | "landscaper" | "general_contractor" | "roofing" | "painting" | "cleaning_janitorial" | "fire_protection" | "elevator" | "security" | "pest_control" | "other",
    "confidence": "high" | "low"
  }
}

=== PASS 1 — ACORD 25 FORM (Page 1) ===

Extract all standard certificate fields from page 1 ONLY:

1. INSURED NAME — the named insured / policyholder from the top-left of the certificate
2. PRODUCER / AGENCY — the producing agent/broker info
3. ALL COVERAGES with their specific limits:

   CRITICAL — GENERAL LIABILITY LIMITS:
   The ACORD 25 form has SEPARATE fields for General Liability limits. These are DIFFERENT dollar amounts — do NOT copy the same value for both:
   - "EACH OCCURRENCE" → extract as limit type "per_occurrence" (e.g., $1,000,000)
   - "GENERAL AGGREGATE" → extract as limit type "aggregate" (often $2,000,000)
   - "PRODUCTS - COMP/OP AGG" → extract as a second "aggregate" entry if different
   - "DAMAGE TO RENTED PREMISES" → can be ignored unless relevant
   - "MED EXP" → can be ignored unless relevant
   - "PERSONAL & ADV INJURY" → can be ignored unless relevant
   Read each field's dollar amount individually. The aggregate is typically 2x the per-occurrence limit but read the actual values.

   AUTOMOBILE LIABILITY:
   - "COMBINED SINGLE LIMIT" → extract as "combined_single_limit"
   - Or individual limits if split (BODILY INJURY per person, per accident, PROPERTY DAMAGE)

   UMBRELLA / EXCESS LIABILITY:
   - "EACH OCCURRENCE" → "per_occurrence"
   - "AGGREGATE" → "aggregate"

   WORKERS COMPENSATION:
   - WC STATUTORY LIMITS → use limit type "statutory" with amount 0
   - E.L. EACH ACCIDENT → extract as SEPARATE coverage_type "employers_liability" with "per_accident" limit
   - E.L. DISEASE - EA EMPLOYEE → "per_person" limit
   - E.L. DISEASE - POLICY LIMIT → "aggregate" limit

4. POLICY NUMBERS, EFFECTIVE DATES, EXPIRATION DATES for each coverage line
5. ADDL INSD column — if marked "Y" for a coverage line, set additional_insured to true
6. SUBR WVD column — if marked "Y" for a coverage line, set waiver_of_subrogation to true
7. CERTIFICATE HOLDER — name and address from the bottom-left box
   IMPORTANT — Multi-entity certificate holder blocks:
   The certificate holder box often contains multiple entity names, especially with "c/o" (care of), "Attn:" (attention), or multi-line entries where a management company appears on a separate line. Examples:
   - "Alturas Stanford, LLC c/o Alturas Capital Partners, LLC" → extract BOTH as certificate_holder entities
   - "XYZ Property LLC\\nAttn: ABC Management" → extract BOTH as certificate_holder entities
   - "Property Owner LLC\\nManagement Company LLC\\n123 Main St" → extract BOTH company names
   For the certificate_holder field, use the PRIMARY entity name (the first/main one). Then add ALL other entity names from the certificate holder box to the additional_insured_entities array so they can be matched during compliance checking.
8. DESCRIPTION OF OPERATIONS — look for additional insured language, waiver of subrogation mentions, and any entity names listed. Extract ALL entity names mentioned as additional insureds and add them to additional_insured_entities.

=== PASS 2 — ENDORSEMENT PAGES (Pages 2+) ===

If the document has more than 1 page, scan remaining pages for endorsement documents. For each endorsement found, add an entry to the "endorsements" array.

Look for these specific endorsements:
- CG 20 10 (Additional Insured — Ongoing Operations): Record form number, edition date, and named insured(s) from the schedule
- CG 20 37 (Additional Insured — Completed Operations): Same fields
- CG 20 26 or similar Additional Insured endorsements: Record form number and details
- Waiver of Subrogation endorsement (CG 24 04 or similar): Record form number and confirmation
- Primary and Non-Contributory endorsement: Record form number and confirmation
- Any other endorsement types: Record form number and brief description

=== VENDOR TYPE INFERENCE ===

Infer the vendor's trade/type from the named insured name, the description of operations, and any other clues on the certificate (coverage types held, carrier specializations, etc.).

Supported vendor types:
- "plumber" — plumbing, water/sewer, pipe fitting
- "electrician" — electrical contractors, wiring, power systems
- "hvac" — heating, ventilation, air conditioning, refrigeration
- "landscaper" — landscaping, lawn care, tree service, irrigation
- "general_contractor" — general construction, building, renovation, demolition
- "roofing" — roofing contractors, roof repair
- "painting" — painting contractors, coatings, wall covering
- "cleaning_janitorial" — janitorial, cleaning services, maid services, pressure washing
- "fire_protection" — fire sprinklers, fire alarm, fire suppression
- "elevator" — elevator maintenance, escalator service
- "security" — security guards, alarm monitoring, surveillance
- "pest_control" — pest control, extermination, fumigation
- "other" — does not clearly fit any of the above categories

Set confidence to "high" when the insured name or description of operations clearly indicates the trade (e.g., "ABC Plumbing Inc" → plumber/high, "Smith Electric Co" → electrician/high).
Set confidence to "low" when the type is ambiguous or you are guessing (e.g., "Johnson Services LLC" → other/low).
When genuinely unsure, use vendor_type "other" with confidence "low".

KEY RULES:
- Dollar amounts from endorsement pages (policy terms, conditions, definitions) must NEVER override or replace the ACORD 25 limits from page 1. The limits array should ONLY contain values from the ACORD 25 form.
- Endorsement pages are ONLY used to verify endorsement existence and extract endorsement-specific data (form numbers, named parties).
- If the PDF is a single page, set "endorsements" to an empty array — do not penalize single-page uploads.
- Set "page_count" to the total number of pages in the PDF.

COVERAGE TYPE NAMES:
- Return the coverage name as it appears on the ACORD 25 form, cleaned up to Title Case.
- Use the standard ACORD field labels: "Commercial General Liability", "Automobile Liability", "Workers' Compensation", "Umbrella / Excess Liability", "Professional Liability (E&O)", "Property / Inland Marine", etc.
- Do NOT map to snake_case enum values. Return the human-readable name.
- Normalize common abbreviations: "CGL" → "Commercial General Liability", "WC" → "Workers' Compensation", "Auto" → "Automobile Liability"
- For Employers' Liability (the E.L. section under Workers' Comp), use "Employers' Liability" as a separate coverage_type.
- If you encounter a coverage type not listed above, return it as-is in Title Case (e.g., "Builder's Risk", "Equipment Breakdown", "Crime / Fidelity").
- Fire Damage Legal Liability / Damage to Rented Premises → "Fire Legal Liability"
- Business Income / Business Interruption → "Business Income / Extra Expense"

ADDITIONAL INSURED DETECTION (combine all sources):
1. ADDL INSD checkbox column on ACORD 25 — if "Y", set additional_insured to true
2. Description of Operations section — look for "additional insured", "named insured", "loss payee" language
3. Endorsement pages (CG 20 10, CG 20 26, CG 20 37) — confirms additional insured status
4. Certificate holder box — sometimes lists additional insured entities

Extract ALL entity names mentioned as additional insureds from ANY source and include them in additional_insured_entities.

- Return ONLY the JSON object, no other text`;

// ============================================================================
// Main extraction function
// ============================================================================

/**
 * Map an HTTP status code from the Anthropic API to a user-friendly message.
 */
function getExtractionErrorMessage(status: number): string {
  switch (status) {
    case 429:
      return 'AI service is busy. Click retry to try again later.';
    case 529:
      return 'AI service is busy. Click retry to try again later.';
    case 500:
    case 502:
    case 503:
      return 'AI extraction is temporarily unavailable. Please try again in a few minutes.';
    case 400:
      return "We couldn't read this PDF. Please make sure it's a valid, non-corrupted PDF file.";
    case 401:
    case 403:
      return 'Something went wrong. Please try again or contact support@smartcoi.io.';
    default:
      return 'AI extraction failed. Please try again.';
  }
}

/** Status codes that are retryable (transient overload / rate limiting). */
function isRetryableStatus(status: number): boolean {
  return status === 429 || status === 529 || status === 502 || status === 503;
}

/**
 * Send a PDF (as base64) to the Anthropic Claude API and extract
 * structured COI data. Returns rows ready for database insertion.
 *
 * Automatically retries up to 5 times for transient errors (429, 529, 502, 503)
 * with exponential backoff: 5s → 15s → 30s → 60s → 90s.
 */
export async function extractCOIFromPDF(pdfBase64: string): Promise<ExtractionResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('[CRITICAL] ANTHROPIC_API_KEY is not configured');
    return {
      success: false, coverages: [], entities: [], endorsements: [], insuredName: null,
      error: 'ANTHROPIC_API_KEY is not configured',
      userMessage: 'Something went wrong. Please try again or contact support@smartcoi.io.',
    };
  }

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8192,
    system: SYSTEM_PROMPT,
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
            text: 'Extract all insurance data from this Certificate of Insurance using the two-pass approach. Pass 1: Extract all ACORD 25 data from page 1 with correct per-occurrence and aggregate limits. Pass 2: Scan endorsement pages (if any) for CG 20 10, CG 20 37, Waiver of Subrogation, and other endorsements.',
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

  // Retry with exponential backoff for transient errors
  const BACKOFF_MS = [5_000, 15_000, 30_000, 60_000, 90_000];
  let lastStatus = 0;
  let lastErrorText = '';

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    // 90-second timeout to prevent indefinite hangs
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 90_000);

    let response: Response;
    try {
      response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers,
        body: requestBody,
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeoutId);
      const isTimeout = fetchErr instanceof DOMException && fetchErr.name === 'AbortError';
      const errorLabel = isTimeout ? 'Request timed out (90s)' : 'Network error';
      console.error(
        `[extraction] ${errorLabel} (attempt ${attempt + 1}/${BACKOFF_MS.length + 1})`
      );

      // Treat timeouts and network errors as retryable
      if (attempt >= BACKOFF_MS.length) {
        return {
          success: false, coverages: [], entities: [], endorsements: [], insuredName: null,
          error: errorLabel,
          userMessage: 'AI extraction is temporarily unavailable. Please try again in a few minutes.',
        };
      }

      const delay = BACKOFF_MS[attempt];
      console.warn(
        `[extraction] ${errorLabel}, waiting ${delay / 1000}s before retry…`
      );
      await new Promise((resolve) => setTimeout(resolve, delay));
      continue;
    }
    clearTimeout(timeoutId);

    if (response.ok) {
      // Successful response — parse and return
      const messageResponse = await response.json();
      const responseText =
        messageResponse.content?.[0]?.type === 'text' ? messageResponse.content[0].text : '';

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return {
          success: false, coverages: [], entities: [], endorsements: [], insuredName: null,
          error: 'Could not parse structured data from AI response',
          userMessage: "We couldn't read this PDF. Please make sure it's a valid, non-corrupted PDF file.",
        };
      }

      let parsed: AIExtractionResponse;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false, coverages: [], entities: [], endorsements: [], insuredName: null,
          error: 'AI returned malformed JSON',
          userMessage: "We couldn't read this PDF. Please make sure it's a valid, non-corrupted PDF file.",
        };
      }

      // Basic structural validation — ensure required arrays exist
      if (!Array.isArray(parsed.coverages)) parsed.coverages = [];
      if (!Array.isArray(parsed.endorsements)) parsed.endorsements = [];
      if (typeof parsed.named_insured !== 'string') parsed.named_insured = '';

      return mapToDbRows(parsed);
    }

    // Non-OK response
    lastStatus = response.status;
    lastErrorText = await response.text();
    console.error(
      `[extraction] Anthropic API error (attempt ${attempt + 1}/${BACKOFF_MS.length + 1}): status=${response.status} body=${lastErrorText.slice(0, 500)}`
    );

    if (response.status === 401 || response.status === 403) {
      console.error('[CRITICAL] Anthropic API key issue — check ANTHROPIC_API_KEY');
    }

    // Only retry on transient errors
    if (!isRetryableStatus(response.status) || attempt >= BACKOFF_MS.length) {
      break;
    }

    const delay = BACKOFF_MS[attempt];
    console.warn(
      `[extraction] Retryable error (${response.status}), waiting ${delay / 1000}s before retry…`
    );
    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // All retries exhausted or non-retryable error
  return {
    success: false, coverages: [], entities: [], endorsements: [], insuredName: null,
    error: `AI extraction failed (status ${lastStatus})`,
    userMessage: getExtractionErrorMessage(lastStatus),
  };
}

// ============================================================================
// Map AI response → database rows
// ============================================================================

/**
 * Split entity names that contain "c/o", "Attn:", or multi-line separators
 * into individual names. Returns an array of trimmed, non-empty names.
 */
function splitEntityNames(name: string): string[] {
  // Split on c/o, attn:, and newlines
  const parts = name
    .split(/\bc\/o\b|\bC\/O\b|\battn:\s*/i)
    .flatMap((p) => p.split(/\n/))
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  // Filter out parts that look like addresses (start with a number, contain
  // common address tokens like "St", "Ave", "Blvd", state abbreviations, or zip codes)
  return parts.filter((p) => {
    // Skip if it starts with a digit (street address line)
    if (/^\d/.test(p)) return false;
    // Skip if it looks like "City, ST 12345"
    if (/,\s*[A-Z]{2}\s+\d{5}/.test(p)) return false;
    return true;
  });
}

function mapToDbRows(parsed: AIExtractionResponse): ExtractionResult {
  const coverages: ExtractedCoverageRow[] = [];
  const entities: ExtractedEntityRow[] = [];

  // Collect additional insured entity names for each coverage
  const allAINames = (parsed.additional_insured_entities ?? []).map((e) => e.name);

  for (const cov of parsed.coverages ?? []) {
    const limits = cov.limits ?? [];
    if (limits.length === 0) {
      // Coverage with no limits — still record it
      coverages.push({
        coverage_type: cov.coverage_type,
        carrier_name: cov.carrier_name || null,
        policy_number: cov.policy_number || null,
        limit_amount: null,
        limit_type: null,
        effective_date: cov.effective_date || null,
        expiration_date: cov.expiration_date || null,
        additional_insured_listed: cov.additional_insured ?? false,
        additional_insured_entities: cov.additional_insured ? allAINames : [],
        waiver_of_subrogation: cov.waiver_of_subrogation ?? false,
        confidence_flag: cov.confidence !== 'low',
        raw_extracted_text: cov.raw_text || null,
      });
    } else {
      // One row per limit (e.g., GL per-occurrence + GL aggregate)
      for (const limit of limits) {
        coverages.push({
          coverage_type: cov.coverage_type,
          carrier_name: cov.carrier_name || null,
          policy_number: cov.policy_number || null,
          limit_amount: limit.amount ?? null,
          limit_type: limit.type ?? null,
          effective_date: cov.effective_date || null,
          expiration_date: cov.expiration_date || null,
          additional_insured_listed: cov.additional_insured ?? false,
          additional_insured_entities: cov.additional_insured ? allAINames : [],
          waiver_of_subrogation: cov.waiver_of_subrogation ?? false,
          confidence_flag: cov.confidence !== 'low',
          raw_extracted_text: cov.raw_text || null,
        });
      }
    }
  }

  // Certificate holder — split c/o and multi-line entries into separate entities.
  // The first name stays as certificate_holder; additional names from c/o, Attn:,
  // or separate lines are added as certificate_holder entities so the compliance
  // matcher can find them.
  if (parsed.certificate_holder?.name) {
    const certHolderNames = splitEntityNames(parsed.certificate_holder.name);
    const address = parsed.certificate_holder.address || null;
    const confidence = parsed.certificate_holder.confidence !== 'low';

    if (certHolderNames.length > 0) {
      // Primary certificate holder
      entities.push({
        entity_name: certHolderNames[0],
        entity_address: address,
        entity_type: 'certificate_holder',
        confidence_flag: confidence,
      });
      // Additional names from c/o, Attn:, or multi-line — also as certificate_holder
      for (let i = 1; i < certHolderNames.length; i++) {
        entities.push({
          entity_name: certHolderNames[i],
          entity_address: address,
          entity_type: 'certificate_holder',
          confidence_flag: confidence,
        });
      }
    } else {
      // Fallback: use the raw name as-is if splitting produced nothing
      entities.push({
        entity_name: parsed.certificate_holder.name,
        entity_address: address,
        entity_type: 'certificate_holder',
        confidence_flag: confidence,
      });
    }
  }

  // Additional insured entities — also split c/o patterns
  for (const ent of parsed.additional_insured_entities ?? []) {
    if (ent.name) {
      const names = splitEntityNames(ent.name);
      if (names.length === 0) names.push(ent.name);
      for (const name of names) {
        entities.push({
          entity_name: name,
          entity_address: ent.address || null,
          entity_type: 'additional_insured',
          confidence_flag: ent.confidence !== 'low',
        });
      }
    }
  }

  // Map endorsements
  const endorsements: EndorsementRecord[] = (parsed.endorsements ?? []).map((e) => ({
    type: e.type,
    form_number: e.form_number || null,
    edition_date: e.edition_date || null,
    found: e.found ?? true,
    named_parties: e.named_parties ?? [],
    description: e.description || null,
  }));

  // Map vendor type inference
  const vendorTypeInference = parsed.inferred_vendor_type;
  const inferredVendorType = vendorTypeInference?.vendor_type || 'other';
  const vendorTypeNeedsReview = !vendorTypeInference || vendorTypeInference.confidence === 'low';

  // Reject extractions with zero coverages — likely not a COI document
  if (coverages.length === 0) {
    return {
      success: false,
      coverages: [],
      entities,
      endorsements,
      insuredName: parsed.named_insured || null,
      inferredVendorType,
      vendorTypeNeedsReview,
      error: 'no_coverages',
      userMessage: 'No insurance coverage data found in this document. Please upload a valid Certificate of Insurance (COI).',
    };
  }

  return {
    success: true,
    coverages,
    entities,
    endorsements,
    insuredName: parsed.named_insured || null,
    inferredVendorType,
    vendorTypeNeedsReview,
  };
}
