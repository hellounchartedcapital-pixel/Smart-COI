import type { CoverageType, LimitType, EndorsementRecord } from '@/types';

// ============================================================================
// Types for the AI extraction response
// ============================================================================

interface AILimit {
  amount: number;
  type: LimitType;
}

interface AICoverage {
  coverage_type: CoverageType;
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

interface AIExtractionResponse {
  coverages: AICoverage[];
  named_insured: string;
  certificate_holder: AIEntity;
  additional_insured_entities: AIEntity[];
  endorsements: AIEndorsement[];
  page_count: number;
}

// ============================================================================
// Mapped output types matching database schema
// ============================================================================

export interface ExtractedCoverageRow {
  coverage_type: CoverageType;
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
      "coverage_type": "general_liability" | "automobile_liability" | "workers_compensation" | "employers_liability" | "umbrella_excess_liability" | "professional_liability_eo" | "property_inland_marine" | "pollution_liability" | "liquor_liability" | "cyber_liability",
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
  ]
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
8. DESCRIPTION OF OPERATIONS — look for additional insured language, waiver of subrogation mentions, and any entity names listed

=== PASS 2 — ENDORSEMENT PAGES (Pages 2+) ===

If the document has more than 1 page, scan remaining pages for endorsement documents. For each endorsement found, add an entry to the "endorsements" array.

Look for these specific endorsements:
- CG 20 10 (Additional Insured — Ongoing Operations): Record form number, edition date, and named insured(s) from the schedule
- CG 20 37 (Additional Insured — Completed Operations): Same fields
- CG 20 26 or similar Additional Insured endorsements: Record form number and details
- Waiver of Subrogation endorsement (CG 24 04 or similar): Record form number and confirmation
- Primary and Non-Contributory endorsement: Record form number and confirmation
- Any other endorsement types: Record form number and brief description

KEY RULES:
- Dollar amounts from endorsement pages (policy terms, conditions, definitions) must NEVER override or replace the ACORD 25 limits from page 1. The limits array should ONLY contain values from the ACORD 25 form.
- Endorsement pages are ONLY used to verify endorsement existence and extract endorsement-specific data (form numbers, named parties).
- If the PDF is a single page, set "endorsements" to an empty array — do not penalize single-page uploads.
- Set "page_count" to the total number of pages in the PDF.

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
 * Automatically retries up to 3 times for transient errors (429, 529, 502, 503)
 * with exponential backoff: 5s → 15s → 30s.
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
  const BACKOFF_MS = [5_000, 15_000, 30_000];
  let lastStatus = 0;
  let lastErrorText = '';

  for (let attempt = 0; attempt <= BACKOFF_MS.length; attempt++) {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers,
      body: requestBody,
    });

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

  // Certificate holder
  if (parsed.certificate_holder?.name) {
    entities.push({
      entity_name: parsed.certificate_holder.name,
      entity_address: parsed.certificate_holder.address || null,
      entity_type: 'certificate_holder',
      confidence_flag: parsed.certificate_holder.confidence !== 'low',
    });
  }

  // Additional insured entities
  for (const ent of parsed.additional_insured_entities ?? []) {
    if (ent.name) {
      entities.push({
        entity_name: ent.name,
        entity_address: ent.address || null,
        entity_type: 'additional_insured',
        confidence_flag: ent.confidence !== 'low',
      });
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

  return {
    success: true,
    coverages,
    entities,
    endorsements,
    insuredName: parsed.named_insured || null,
  };
}
