import type { CoverageType, LimitType } from '@/types';

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

interface AIExtractionResponse {
  coverages: AICoverage[];
  named_insured: string;
  certificate_holder: AIEntity;
  additional_insured_entities: AIEntity[];
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
  insuredName: string | null;
  error?: string;
  /** User-facing error message (friendly wording, no raw status codes) */
  userMessage?: string;
}

// ============================================================================
// System prompt
// ============================================================================

const SYSTEM_PROMPT = `You are an expert insurance document analyzer. Extract all coverage and entity information from this Certificate of Insurance (COI) document.

Return a JSON object with exactly this structure:
{
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
  ]
}

Important instructions:
- Extract ALL coverage sections found on the certificate
- For General Liability, extract BOTH per occurrence AND aggregate limits as separate limit entries in the limits array. The ACORD 25 form has separate fields for "EACH OCCURRENCE" and "GENERAL AGGREGATE" — extract both with the correct limit types ("per_occurrence" and "aggregate").
- For Workers Compensation, use "statutory" as the limit type with amount 0. IMPORTANT: Employers' Liability (E.L.) is a sub-section within the Workers' Compensation section on ACORD 25 forms. It has its own limits (E.L. EACH ACCIDENT, E.L. DISEASE - EA EMPLOYEE, E.L. DISEASE - POLICY LIMIT). Extract Employers' Liability as a SEPARATE coverage entry with coverage_type "employers_liability" and its per_accident limit.
- If a field is unclear or illegible, still include it but set confidence to "low"
- Look at ALL pages of the document for endorsements, additional insured schedules, and supplementary information
- Extract exact entity names and addresses for certificate holder and all additional insured parties

IMPORTANT — Additional Insured Detection:
Additional insured status must be detected from MULTIPLE locations on the certificate:
1. The "ADDL INSD" checkbox column — if marked "Y" for a coverage line, set additional_insured to true for that coverage
2. The "Description of Operations / Locations / Vehicles" section — look for language like:
   - "[Entity Name] is included as Additional Insured"
   - "Additional Insured: [Entity Name]"
   - "[Entity Names] are included as Additional Insureds with respect to..."
   - "Certificate holder and [Entity Name] are named as additional insured..."
   - Any entity names listed alongside phrases like "additional insured", "named insured", "loss payee"
3. Attached endorsement pages — look for CG 20 10, CG 20 26, CG 20 37, or similar Additional Insured endorsement forms. These confirm additional insured status even if the checkbox is not clearly marked.
4. The certificate holder box — sometimes additional insured entities are listed together with the certificate holder.

Extract ALL entity names mentioned as additional insureds from ANY of these sources and include them in the additional_insured_entities array. If additional insured status is confirmed by any source (checkbox, description, or endorsement), set additional_insured to true on the relevant coverage.

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
      success: false, coverages: [], entities: [], insuredName: null,
      error: 'ANTHROPIC_API_KEY is not configured',
      userMessage: 'Something went wrong. Please try again or contact support@smartcoi.io.',
    };
  }

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
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
            text: 'Extract all insurance data from this Certificate of Insurance.',
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
          success: false, coverages: [], entities: [], insuredName: null,
          error: 'Could not parse structured data from AI response',
          userMessage: "We couldn't read this PDF. Please make sure it's a valid, non-corrupted PDF file.",
        };
      }

      let parsed: AIExtractionResponse;
      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false, coverages: [], entities: [], insuredName: null,
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
    success: false, coverages: [], entities: [], insuredName: null,
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

  return {
    success: true,
    coverages,
    entities,
    insuredName: parsed.named_insured || null,
  };
}
