export interface CoverageGuideSection {
  id: string;
  title: string;
  content: string;
}

export interface CoverageGuide {
  slug: string;
  title: string;
  metaDescription: string;
  headline: string;
  intro: string;
  sections: CoverageGuideSection[];
  relatedGuides: { slug: string; name: string }[];
}

export const coverageGuides: CoverageGuide[] = [
  {
    slug: 'general-liability',
    title:
      'General Liability Insurance Requirements: What to Require from Vendors & Contractors',
    metaDescription:
      'Learn what general liability coverage limits to require from vendors, subcontractors, and third parties. Includes per-occurrence vs aggregate, additional insured endorsements, and industry benchmarks.',
    headline:
      'General Liability Insurance Requirements for Vendors & Contractors',
    intro:
      'General liability insurance is the foundation of every certificate of insurance you collect from vendors, contractors, and tenants. It is the first coverage line you check on an ACORD 25 form and the most frequent source of compliance gaps in commercial property management. This guide covers what general liability actually protects against, the limits you should require by industry, how additional insured endorsements work, and the specific form fields to verify when reviewing a COI.',
    sections: [
      {
        id: 'what-gl-covers',
        title: 'What General Liability Insurance Covers',
        content: `General liability (GL) insurance — formally called Commercial General Liability (CGL) — covers third-party claims arising from the insured's business operations. When you require GL coverage from a vendor or tenant, you're ensuring that their policy responds if their work or presence on your property causes harm to someone else.

GL policies cover five distinct areas:

**Bodily Injury and Property Damage (Coverage A)** covers claims when a vendor's operations cause physical harm to a person or damage to property. A cleaning contractor's employee leaves a wet floor unmarked and a tenant's client slips and breaks a wrist. A landscaping crew damages a building's irrigation system. A construction subcontractor's debris falls and dents a parked vehicle. In each case, the vendor's GL policy pays the resulting medical bills, repair costs, and legal defense — not your property insurance.

**Personal and Advertising Injury (Coverage B)** covers non-physical harms including libel, slander, wrongful eviction, and false arrest. While less common in typical vendor relationships, this coverage matters for tenants operating customer-facing businesses and for security contractors who may detain individuals on your property.

**Products-Completed Operations (Coverage C)** is critical for construction and maintenance vendors. It covers claims arising after the vendor has finished their work and left the premises. A plumber completes a pipe repair that fails six months later and floods a tenant suite. An electrician's wiring work causes a fire after the project closes out. Without products-completed operations coverage, the vendor's GL policy would deny these claims because the work was already complete — leaving the property owner holding the liability.

**Medical Payments (Coverage D)** provides a small no-fault benefit (typically $5,000–$10,000) for minor injuries on the premises, regardless of who is at fault. This coverage handles small claims quickly without triggering a full liability investigation, which helps maintain vendor and tenant relationships.

**Damage to Rented Premises** covers damage the insured causes to the specific premises they rent or temporarily occupy. For tenants, this responds to fire, explosion, or other damage to their leased space caused by their own operations — a meaningful protection for property owners that supplements the tenant's separate property insurance.

Each of these coverages matters in a COI review because a vendor with a $1M per-occurrence limit but a products-completed operations exclusion has a significant gap that will not appear in the limits fields of the ACORD 25 form.`,
      },
      {
        id: 'standard-limits',
        title: 'Standard Limits by Industry',
        content: `The general liability limits you require should reflect the risk profile of the vendor's work and the exposure your property faces if something goes wrong. Below are standard benchmarks used in commercial property management:

| Industry | Per Occurrence | General Aggregate | Notes |
|---|---|---|---|
| Property Management (general vendors) | $1,000,000 | $2,000,000 | Standard for cleaning, landscaping, pest control |
| Construction & General Contractors | $2,000,000 | $4,000,000 | Higher limits reflect injury severity and project values |
| Healthcare & Medical Tenants | $1,000,000 | $2,000,000 | Professional liability carried separately |
| Manufacturing & Industrial | $2,000,000 | $4,000,000 | Product liability and heavy equipment exposure |
| Logistics & Warehousing | $1,000,000 | $2,000,000 | Auto liability carried on a separate policy |
| Hospitality & Food Service | $1,000,000 | $2,000,000 | Liquor liability endorsed or separate |
| Retail Tenants | $1,000,000 | $2,000,000 | Adequate for most retail operations |

**Per-occurrence vs. aggregate — what's the difference?**

The per-occurrence limit is the maximum the policy pays for any single claim or incident. The general aggregate is the maximum the policy pays for all claims combined during the policy period (usually one year). A vendor with $1M per-occurrence and $2M aggregate can pay up to $1M for any single incident, but no more than $2M total across all claims in the policy year.

This distinction matters more than most property managers realize. A vendor who has already had a claim earlier in the year may have depleted part of their aggregate, meaning less coverage is available for your claim. This is why requiring a 2:1 ratio of aggregate to per-occurrence is standard — it provides a buffer for multiple incidents.

**Why construction and manufacturing require higher limits**

Construction and manufacturing vendors carry higher limits for two practical reasons. First, the severity of potential injuries is greater: a scaffolding collapse, crane accident, or heavy equipment failure can produce claims well above $1M. Second, construction projects involve multiple parties working simultaneously, and a single incident can trigger cross-claims among the general contractor, subcontractors, and property owner. A $1M limit can be exhausted by legal defense costs alone before any settlement is paid. The $2M per-occurrence standard for construction reflects the actual claims environment, not arbitrary caution.`,
      },
      {
        id: 'additional-insured',
        title: 'Additional Insured Endorsements',
        content: `Requiring a vendor to carry general liability insurance is only half the equation. Without an additional insured endorsement naming your entity on the vendor's policy, you have no direct right to make a claim against their coverage. If a vendor's employee injures someone on your property and your entity is not listed as additional insured, you may need to sue the vendor to access their policy — a costly and slow process.

**What "additional insured" means**

An additional insured endorsement extends the vendor's GL policy to cover claims made against your entity arising from the vendor's work. You become an insured party on their policy, with the right to tender claims directly to their insurer. This is different from being a "certificate holder," which simply means you receive copies of the certificate — certificate holder status gives you no coverage rights.

**CG 20 10 — Ongoing Operations**

ISO form CG 20 10 (Additional Insured — Owners, Lessees or Contractors — Scheduled Person or Organization) provides additional insured status for claims arising from the vendor's ongoing operations on your property. If a vendor's employee causes an injury while actively working on-site, CG 20 10 is the endorsement that extends coverage to you. This is the minimum additional insured endorsement you should require from every vendor.

**CG 20 37 — Completed Operations**

ISO form CG 20 37 (Additional Insured — Owners, Lessees or Contractors — Completed Operations) extends additional insured status to claims arising after the vendor's work is finished. A roofing contractor completes a repair in March. In October, the roof leaks and damages tenant property. CG 20 37 ensures you are covered under the contractor's products-completed operations coverage for claims arising from their finished work.

**Why you should require both endorsements**

Requiring CG 20 10 without CG 20 37 leaves a gap for every vendor who completes a project and leaves. The moment a contractor finishes work and leaves the site, CG 20 10 stops applying — and any claim arising from that completed work falls outside your additional insured coverage. For construction contractors, maintenance vendors, and any vendor performing physical work on the property, both endorsements should be non-negotiable.

**What to verify on the ACORD 25 form**

On the ACORD 25 Certificate of Liability Insurance, additional insured status is indicated in two places. First, in the Commercial General Liability section, there is a checkbox labeled "ADDL INSD" (Additional Insured) — this should be marked. Second, the Description of Operations section at the bottom of the form should list the specific endorsements by form number (CG 20 10, CG 20 37) and name your entity explicitly. A checked box without endorsement details in the description is insufficient — the certificate itself does not confer additional insured status. Only the actual endorsement attached to the policy does. The certificate is evidence that the endorsement exists, not a substitute for it.`,
      },
      {
        id: 'common-gaps',
        title: 'Common Gaps to Watch For',
        content: `Even when a vendor's certificate shows adequate per-occurrence and aggregate limits, the policy behind that certificate may contain exclusions that significantly reduce your actual protection. These are the most common gaps to watch for in general liability coverage:

**Completed operations exclusion**

Some GL policies exclude products-completed operations coverage entirely, or limit it to a fraction of the per-occurrence limit. This gap is particularly dangerous for construction and maintenance vendors. The ACORD 25 form has a separate field for "Products – Comp/Op Aggregate" — if this field is blank, shows $0, or shows a limit lower than the general aggregate, the vendor may not have adequate completed operations coverage. Any vendor performing physical work on your property should carry products-completed operations limits equal to their general aggregate.

**Contractual liability limitations**

Standard CGL policies include coverage for liability assumed under an "insured contract." However, some policies add endorsements that restrict or exclude contractual liability — meaning the vendor's insurance may not cover the indemnification obligations they agreed to in your contract. If a vendor signs a hold-harmless agreement but their policy excludes contractual liability, that indemnification clause is effectively unenforceable against their insurer.

**XCU exclusions**

XCU stands for Explosion, Collapse, and Underground hazards — three categories of risk that some GL policies exclude via endorsement. XCU exclusions are most common in policies for excavation, demolition, blasting, and underground utility contractors. If you manage industrial properties or oversee construction projects involving foundation work, trenching, or demolition, verify that the vendor's GL policy does not carry XCU exclusions. These exclusions will not appear on the ACORD 25 form — you need to request the actual policy endorsement schedule to confirm.

**Sunset clauses on completed operations**

Some policies include sunset provisions that terminate completed operations coverage after a set period (often 2–3 years) following project completion. For construction projects with long warranty periods, a sunset clause can leave you exposed before the statute of limitations on construction defect claims expires. Require that completed operations coverage extend at least as long as the applicable statute of repose in your jurisdiction.

**Per-project vs. per-location aggregate**

Standard GL policies apply the aggregate limit across all of the insured's operations — meaning a vendor working on five properties shares a single $2M aggregate across all of them. A per-project or per-location aggregate endorsement dedicates the full aggregate to each project or location individually. For construction contractors working on multiple properties, requiring a per-project aggregate ensures that claims on another property do not deplete the coverage available for your project. Look for the "Per Project" or "Per Location" notation in the General Liability section of the ACORD 25.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify GL on an ACORD 25',
        content: `The ACORD 25 Certificate of Liability Insurance is the standard form used to evidence a vendor's or tenant's insurance coverage. Here is a field-by-field walkthrough of where general liability information appears and what to verify:

**Commercial General Liability section (left side of form)**

The GL section shows the policy type (occurrence vs. claims-made), policy number, effective and expiration dates, and all coverage limits. Verify the following:

- **Policy type:** Should read "OCCUR" (occurrence-based) for most vendors. Claims-made policies are standard for professional liability but unusual for GL. If you see "CLAIMS-MADE" for a GL policy, understand that coverage only applies to claims made during the policy period, not to incidents that occurred during the policy period — a meaningful distinction.
- **Policy number:** Record this for your files. You will need it to file a claim.
- **Effective and expiration dates:** Confirm the policy is currently active and will not expire before the vendor's contract ends. A certificate showing a policy that expires in 60 days requires a renewal follow-up.
- **Each Occurrence limit:** The per-occurrence limit. Verify this meets your requirement (typically $1M minimum).
- **General Aggregate limit:** The total annual limit. Should be at least 2x the per-occurrence amount.
- **Products – Comp/Op Aggregate:** The aggregate limit for completed operations claims. For construction and maintenance vendors, this should match the general aggregate. A blank or $0 value is a red flag.
- **Damage to Rented Premises:** Relevant for tenants — typically $100,000 to $300,000.
- **Medical Expense:** The no-fault medical payments limit, typically $5,000 or $10,000.

**Additional insured indicators**

- **ADDL INSD checkbox:** Located in the GL section. Should be checked if additional insured status has been granted.
- **SUBR WVD checkbox:** Indicates whether waiver of subrogation has been granted.

**Description of Operations / Locations / Vehicles section**

This free-text field at the bottom of the form is where the certificate issuer lists specific endorsement details. Look for:
- Your entity's name as additional insured (spelled correctly, matching your legal entity name)
- Endorsement form numbers: CG 20 10 and CG 20 37
- Waiver of subrogation and primary & non-contributory language if required
- Project or property address if you require per-location coverage

**Certificate Holder section**

Your entity name and address should appear in the certificate holder box. While certificate holder status does not confer coverage rights on its own, it ensures you receive cancellation notices and renewal certificates. Verify that the entity name matches your legal name exactly — misspellings or wrong entities are one of the most common COI deficiencies.

A certificate that shows adequate limits but has an unchecked additional insured box, a blank description of operations, or the wrong entity name in the certificate holder field has compliance gaps that need to be resolved before the vendor begins work.`,
      },
      {
        id: 'disclaimer',
        title: 'Coverage Recommendations Disclaimer',
        content: `These coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Every property has unique risk characteristics, and the appropriate coverage requirements for your vendors and tenants depend on factors including your property type, location, lease terms, and risk tolerance. Consult with your insurance broker or risk management professional to determine appropriate requirements for your specific situation.`,
      },
    ],
    relatedGuides: [
      { slug: 'workers-compensation', name: 'Workers\' Compensation' },
      { slug: 'auto-liability', name: 'Auto Liability' },
      { slug: 'umbrella-excess-liability', name: 'Umbrella & Excess Liability' },
      { slug: 'professional-liability', name: 'Professional Liability' },
      { slug: 'property-inland-marine', name: 'Property & Inland Marine' },
    ],
  },
];

export function getCoverageGuide(slug: string): CoverageGuide | undefined {
  return coverageGuides.find((g) => g.slug === slug);
}
