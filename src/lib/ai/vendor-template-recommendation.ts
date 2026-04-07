import type { LimitType } from '@/types';

// ============================================================================
// Types for AI vendor template recommendation
// ============================================================================

export interface VendorRecommendationInput {
  vendor_type: string;
  property_type?: string;
  property_details?: string;
  industry?: string;
}

export interface RecommendedCoverage {
  coverage_name: string;
  limit_type: LimitType;
  recommended_limit: number | null;
  requires_additional_insured: boolean;
  requires_waiver_of_subrogation: boolean;
  requires_primary_noncontributory: boolean;
  reasoning: string;
}

export interface VendorRecommendationResult {
  success: boolean;
  coverages: RecommendedCoverage[];
  error?: string;
  userMessage?: string;
}

// ============================================================================
// System prompt for vendor template recommendation
// ============================================================================

const RECOMMENDATION_SYSTEM_PROMPT = `You are an expert commercial insurance advisor specializing in Certificate of Insurance (COI) requirements across multiple industries. Your task is to recommend insurance coverage requirements for a specific third-party entity based on their type, the industry context, and any location/property details.

Return a JSON object with exactly this structure:
{
  "coverages": [
    {
      "coverage_name": "string — Title Case coverage name, e.g., 'Commercial General Liability'",
      "limit_type": "per_occurrence" | "aggregate" | "combined_single_limit" | "statutory" | "per_person" | "per_accident",
      "recommended_limit": number | null,
      "requires_additional_insured": true | false,
      "requires_waiver_of_subrogation": true | false,
      "requires_primary_noncontributory": true | false,
      "reasoning": "string — 1-2 sentence explanation of why this coverage is recommended for this vendor type"
    }
  ]
}

INSTRUCTIONS:
1. Recommend coverages based on INDUSTRY STANDARDS for the given vendor type. Consider the risk profile of the work they perform.
2. Always include both per_occurrence AND aggregate entries for General Liability (two separate entries with the same coverage_name but different limit_type).
3. Workers' Compensation should ALWAYS use limit_type "statutory" with recommended_limit null.
4. If the vendor type involves vehicles or driving (landscaping, delivery, general contractor, etc.), include Automobile Liability.
5. For high-risk vendor types (general contractor, roofing, demolition), recommend higher limits and Umbrella/Excess Liability.
6. For vendor types with environmental exposure (HVAC, plumbing, janitorial with chemicals), consider Pollution Liability.
7. For professional services (architects, engineers, consultants), include Professional Liability (E&O).
8. Convert all amounts to plain numbers (e.g., 1000000 for $1M, 2000000 for $2M).
9. Set requires_additional_insured to true for all liability coverages (GL, Auto, Umbrella). Set to false for Workers' Comp and professional coverages.
10. Set requires_waiver_of_subrogation to true for all coverages.
11. Set requires_primary_noncontributory to true for GL and Auto liability coverages.

COVERAGE NAME FORMAT — CRITICAL:
- Use human-readable Title Case names, NOT snake_case.
- Standard names:
  - "Commercial General Liability"
  - "Automobile Liability"
  - "Workers' Compensation"
  - "Employers' Liability"
  - "Umbrella / Excess Liability"
  - "Professional Liability (E&O)"
  - "Pollution Liability"
  - "Property / Inland Marine"
  - "Cyber Liability"
  - "Installation Floater"
  - "Builder's Risk"

INDUSTRY CONTEXT:
- Adjust recommendations based on the organization's industry:
  - Property Management: emphasize GL, umbrella, additional insured requirements. Tenant-facing vendors need higher limits.
  - Construction: emphasize completed operations, umbrella, employers' liability. Trades like roofing/electrical/demolition need higher limits. Consider builder's risk for GCs.
  - Logistics/Transportation: emphasize auto liability, motor truck cargo, warehouse liability. Higher auto limits for fleet operators.
  - Healthcare: emphasize professional liability, medical malpractice for clinical providers. Cyber liability for data-handling vendors.
  - Manufacturing: emphasize product liability, pollution liability for chemical/hazmat suppliers. Higher limits for heavy equipment vendors.
  - Hospitality: consider liquor liability for F&B vendors, event liability for entertainment providers.
  - Retail: standard commercial requirements; emphasize product liability for suppliers, auto for delivery.

PROPERTY/LOCATION CONTEXT:
- If property type/details are provided, adjust limits accordingly:
  - Larger properties or higher-value properties → higher limits
  - Industrial/warehouse → consider higher auto and pollution limits
  - If no property context, use standard commercial defaults.

Return ONLY the JSON object, no other text.`;

// ============================================================================
// Recommendation function
// ============================================================================

const VALID_LIMIT_TYPES = new Set<string>([
  'per_occurrence', 'aggregate', 'combined_single_limit', 'statutory', 'per_person', 'per_accident',
]);

export async function recommendVendorTemplate(
  input: VendorRecommendationInput
): Promise<VendorRecommendationResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      success: false,
      coverages: [],
      error: 'ANTHROPIC_API_KEY is not configured',
      userMessage: 'Something went wrong. Please try again or contact support@smartcoi.io.',
    };
  }

  // Build user prompt with context
  const industryLabel = input.industry ? input.industry.replace('_', ' ') : 'commercial';
  let userPrompt = `Recommend insurance coverage requirements for a "${input.vendor_type}" working in the ${industryLabel} industry.`;
  if (input.property_type) {
    userPrompt += ` The location/property is a ${input.property_type} type.`;
  }
  if (input.property_details) {
    userPrompt += ` Additional details: ${input.property_details}.`;
  }
  if (input.industry) {
    userPrompt += ` Industry context: ${input.industry}.`;
  }

  const requestBody = JSON.stringify({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    system: RECOMMENDATION_SYSTEM_PROMPT,
    messages: [
      {
        role: 'user',
        content: userPrompt,
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
          success: false,
          coverages: [],
          error: 'Could not parse AI response',
          userMessage: 'Failed to generate recommendations. Please try again.',
        };
      }

      let parsed: { coverages: Array<{
        coverage_name: string;
        limit_type: string;
        recommended_limit: number | null;
        requires_additional_insured: boolean;
        requires_waiver_of_subrogation: boolean;
        requires_primary_noncontributory: boolean;
        reasoning: string;
      }> };

      try {
        parsed = JSON.parse(jsonMatch[0]);
      } catch {
        return {
          success: false,
          coverages: [],
          error: 'Invalid JSON in AI response',
          userMessage: 'Failed to generate recommendations. Please try again.',
        };
      }

      if (!parsed.coverages?.length) {
        return {
          success: false,
          coverages: [],
          userMessage: 'No coverage recommendations could be generated for this vendor type.',
        };
      }

      // Map and validate
      const coverages: RecommendedCoverage[] = parsed.coverages
        .filter((c) => c.coverage_name && typeof c.coverage_name === 'string')
        .map((c) => ({
          coverage_name: c.coverage_name,
          limit_type: (VALID_LIMIT_TYPES.has(c.limit_type) ? c.limit_type : 'per_occurrence') as LimitType,
          recommended_limit: typeof c.recommended_limit === 'number' ? c.recommended_limit : null,
          requires_additional_insured: c.requires_additional_insured === true,
          requires_waiver_of_subrogation: c.requires_waiver_of_subrogation === true,
          requires_primary_noncontributory: c.requires_primary_noncontributory === true,
          reasoning: c.reasoning || '',
        }));

      return { success: true, coverages };
    }

    // Transient error — retry
    const status = response.status;
    if (attempt < BACKOFF_MS.length && [429, 502, 503, 529].includes(status)) {
      await new Promise((r) => setTimeout(r, BACKOFF_MS[attempt]));
      continue;
    }

    const errorText = await response.text().catch(() => '');
    console.error(`[vendor-recommendation] API error: status=${status} body=${errorText.slice(0, 500)}`);
    return {
      success: false,
      coverages: [],
      error: `API error: ${status}`,
      userMessage: status === 429
        ? 'Too many requests. Please wait a moment and try again.'
        : 'Something went wrong. Please try again.',
    };
  }

  return {
    success: false,
    coverages: [],
    error: 'All retries exhausted',
    userMessage: 'The service is temporarily busy. Please try again in a few minutes.',
  };
}
