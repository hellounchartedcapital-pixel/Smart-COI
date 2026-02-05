import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Anthropic from 'https://esm.sh/@anthropic-ai/sdk@0.52.0';
import { getCorsHeaders, handleCorsPreflightRequest } from '../_shared/cors.ts';

interface Requirements {
  general_liability: number;
  auto_liability: number;
  workers_comp: string | number;
  employers_liability: number;
  company_name?: string;
  require_additional_insured?: boolean;
  require_waiver_of_subrogation?: boolean;
}

function normalizeCompanyName(name: string): string {
  return name.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()'"]/g, '').replace(/\s+/g, ' ').trim();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return handleCorsPreflightRequest(req);
  }

  const corsHeaders = getCorsHeaders(req);

  try {
    const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY');
    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured');
    }

    const { pdfBase64, requirements } = await req.json();

    if (!pdfBase64) {
      throw new Error('No PDF data provided');
    }

    const reqs: Requirements = requirements || {
      general_liability: 1000000,
      auto_liability: 1000000,
      workers_comp: 'Statutory',
      employers_liability: 500000
    };

    const anthropic = new Anthropic({ apiKey: ANTHROPIC_API_KEY });

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 }
          },
          {
            type: 'text',
            text: `You are an expert at extracting data from Certificate of Insurance (COI) documents.

Extract the following information from this COI PDF and return it as a JSON object:

{
  "companyName": "Full legal company name of the insured (not the insurance company)",
  "dba": "Doing Business As name (if any, otherwise null)",
  "expirationDate": "The EARLIEST policy expiration date among all coverages in YYYY-MM-DD format",
  "generalLiability": {
    "eachOccurrence": number,
    "aggregate": number,
    "amount": number,
    "expirationDate": "YYYY-MM-DD"
  },
  "autoLiability": {
    "amount": number,
    "expirationDate": "YYYY-MM-DD"
  },
  "workersComp": {
    "amount": "Statutory" or number,
    "expirationDate": "YYYY-MM-DD"
  },
  "employersLiability": {
    "amount": number,
    "expirationDate": "YYYY-MM-DD"
  },
  "additionalCoverages": [],
  "additionalInsured": "Names listed as additional insured",
  "certificateHolder": "Certificate holder name and address",
  "insuranceCompany": "Insurance company/carrier name",
  "waiverOfSubrogation": "yes or no"
}

Extract amounts as pure numbers (e.g., 1000000 not "$1,000,000").
Use YYYY-MM-DD format for all dates.
If a field is not found, use null.

Return ONLY the JSON object, no other text.`
          }
        ]
      }]
    });

    const responseText = message.content[0].type === 'text' ? message.content[0].text : '';
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);

    if (!jsonMatch) {
      throw new Error('Could not extract JSON from AI response');
    }

    const extractedData = JSON.parse(jsonMatch[0]);
    const vendorData = buildVendorData(extractedData, reqs);

    return new Response(
      JSON.stringify({ success: true, data: vendorData }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );

  } catch (error) {
    console.error('Extraction error:', error);
    return new Response(
      JSON.stringify({ success: false, error: error.message || 'Failed to extract data from PDF' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});

function buildVendorData(extractedData: any, requirements: Requirements) {
  const glOccurrence = extractedData.generalLiability?.eachOccurrence || extractedData.generalLiability?.amount || 0;
  const glAggregate = extractedData.generalLiability?.aggregate || (glOccurrence * 2);

  const vendorData: any = {
    name: extractedData.companyName || 'Unknown Company',
    dba: extractedData.dba,
    expirationDate: extractedData.expirationDate || new Date().toISOString().split('T')[0],
    coverage: {
      generalLiability: {
        eachOccurrence: glOccurrence,
        aggregate: glAggregate,
        amount: glOccurrence,
        expirationDate: extractedData.generalLiability?.expirationDate,
        compliant: glOccurrence >= requirements.general_liability
      },
      autoLiability: {
        amount: extractedData.autoLiability?.amount || 0,
        expirationDate: extractedData.autoLiability?.expirationDate,
        compliant: (extractedData.autoLiability?.amount || 0) >= requirements.auto_liability
      },
      workersComp: {
        amount: extractedData.workersComp?.amount || 'Statutory',
        expirationDate: extractedData.workersComp?.expirationDate,
        compliant: true
      },
      employersLiability: {
        amount: extractedData.employersLiability?.amount || 0,
        expirationDate: extractedData.employersLiability?.expirationDate,
        compliant: (extractedData.employersLiability?.amount || 0) >= requirements.employers_liability
      }
    },
    additionalCoverages: extractedData.additionalCoverages || [],
    rawData: extractedData,
    requirements: requirements,
    additionalInsured: extractedData.additionalInsured || '',
    certificateHolder: extractedData.certificateHolder || '',
    waiverOfSubrogation: extractedData.waiverOfSubrogation || ''
  };

  const issues: any[] = [];
  const today = new Date();
  const expirationDate = new Date(vendorData.expirationDate);
  const daysUntilExpiration = Math.floor((expirationDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (daysUntilExpiration < 0) {
    vendorData.status = 'expired';
    issues.push({ type: 'critical', message: `Policies expired ${vendorData.expirationDate}` });
  } else if (daysUntilExpiration <= 30) {
    vendorData.status = 'expiring';
    issues.push({ type: 'warning', message: `Policies expiring in ${daysUntilExpiration} days` });
  } else {
    vendorData.status = 'compliant';
  }

  if (!vendorData.coverage.generalLiability.compliant) {
    vendorData.status = 'non-compliant';
    issues.push({ type: 'error', message: `General Liability below requirement` });
  }

  if (!vendorData.coverage.autoLiability.compliant) {
    vendorData.status = 'non-compliant';
    issues.push({ type: 'error', message: `Auto Liability below requirement` });
  }

  if (!vendorData.coverage.employersLiability.compliant) {
    vendorData.status = 'non-compliant';
    issues.push({ type: 'error', message: `Employers Liability below requirement` });
  }

  vendorData.issues = issues;
  return vendorData;
}
