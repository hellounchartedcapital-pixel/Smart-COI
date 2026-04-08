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
  {
    slug: 'workers-compensation',
    title:
      'Workers Compensation Insurance Requirements for Vendors & Contractors',
    metaDescription:
      'Understand workers compensation requirements for third-party vendors including statutory limits, employers liability, and waiver of subrogation.',
    headline:
      'Workers Compensation Insurance Requirements for Vendors & Contractors',
    intro:
      'Workers compensation is a mandatory coverage in nearly every state that protects employees injured on the job. When you collect COIs from vendors and contractors working on your property, verifying workers comp coverage is essential — without it, injured workers may file claims against the property owner directly. This guide covers what workers comp protects, the employers liability limits to require, waiver of subrogation endorsements, state-specific rules, and how to verify coverage on an ACORD 25.',
    sections: [
      {
        id: 'what-wc-covers',
        title: 'What Workers Compensation Covers',
        content: `Workers compensation insurance covers medical expenses, lost wages, and rehabilitation costs for employees who are injured or become ill as a result of their job duties. It operates on a no-fault basis — the employee does not need to prove the employer was negligent to receive benefits, and in exchange the employee generally cannot sue the employer for the injury. Coverage limits are not selected by the policyholder but are set by state statute, meaning every compliant policy in a given state provides the same baseline benefits.`,
      },
      {
        id: 'employers-liability-limits',
        title: 'Employers Liability Limits',
        content: `While the workers compensation portion of the policy pays statutory benefits, the employers liability portion covers lawsuits that fall outside the workers comp system — such as third-party-over actions or claims by spouses for loss of consortium. Standard employers liability limits are $500,000 per accident, $500,000 per employee for disease, and $500,000 disease policy limit. Construction and high-risk trades should carry $1,000,000 across all three.

| Risk Level | Each Accident | Disease – Each Employee | Disease – Policy Limit |
|---|---|---|---|
| Standard vendors | $500,000 | $500,000 | $500,000 |
| Construction / high-risk | $1,000,000 | $1,000,000 | $1,000,000 |`,
      },
      {
        id: 'waiver-of-subrogation',
        title: 'Waiver of Subrogation',
        content: `A waiver of subrogation on a workers comp policy prevents the vendor's insurer from recovering claim payments by suing the property owner. The standard endorsement is WC 00 03 13 (Waiver of Our Right to Recover from Others). Without this endorsement, if a vendor's employee is injured on your property and the insurer pays the claim, the insurer can turn around and sue you to recoup those costs. Requiring WC 00 03 13 from every vendor eliminates this exposure and should be a standard part of your insurance requirements.`,
      },
      {
        id: 'state-specific-considerations',
        title: 'State-Specific Considerations',
        content: `Workers compensation laws vary significantly by state. Four states — Ohio, Washington, Wyoming, and North Dakota — operate monopolistic state funds, meaning employers must purchase workers comp from the state rather than private insurers. Vendors operating in these states will show the state fund as the carrier on their certificate. Many states allow sole proprietors and business owners to exempt themselves from workers comp coverage, which means a one-person contractor may legally carry no workers comp policy. However, if that contractor hires subcontractors or temporary labor, the exemption no longer applies. Always confirm that vendors claiming an exemption have no employees or subcontractors performing work on your property.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify on an ACORD 25',
        content: `On the ACORD 25 form, workers compensation appears in its own section on the right side of the form, separate from general liability and auto coverage. Verify that the policy number is present and that the effective and expiration dates cover your contract period. The statutory limits field should show "X" in the box next to each applicable state, indicating the policy meets that state's statutory requirements. Employers liability limits are listed directly below as E.L. Each Accident, E.L. Disease – Each Employee, and E.L. Disease – Policy Limit — confirm these meet your minimums. Check the "SUBR WVD" (Subrogation Waived) checkbox in the workers comp section to confirm the waiver of subrogation endorsement is in place.`,
      },
      {
        id: 'disclaimer',
        title: 'Coverage Recommendations Disclaimer',
        content: `These coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Every property has unique risk characteristics, and the appropriate coverage requirements for your vendors and tenants depend on factors including your property type, location, lease terms, and risk tolerance. Consult with your insurance broker or risk management professional to determine appropriate requirements for your specific situation.`,
      },
    ],
    relatedGuides: [
      { slug: 'general-liability', name: 'General Liability' },
      { slug: 'auto-liability', name: 'Auto Liability' },
      { slug: 'umbrella-excess-liability', name: 'Umbrella & Excess Liability' },
      { slug: 'professional-liability', name: 'Professional Liability' },
      { slug: 'property-inland-marine', name: 'Property & Inland Marine' },
    ],
  },
  {
    slug: 'auto-liability',
    title:
      'Commercial Auto Liability Insurance Requirements for Vendors',
    metaDescription:
      'What commercial auto insurance to require from vendors. Covers CSL limits, hired and non-owned auto, MCS-90 for trucking, and ACORD 25 verification.',
    headline:
      'Commercial Auto Liability Insurance Requirements for Vendors',
    intro:
      'Commercial auto liability insurance covers bodily injury and property damage caused by vehicles used in a vendor\'s business operations. For property managers collecting COIs, auto coverage matters whenever vendors drive onto your property or use vehicles as part of their work — delivery services, landscaping crews, construction contractors, and any vendor with a fleet. This guide covers combined single limits, hired and non-owned auto, trucking endorsements, and how to verify auto coverage on an ACORD 25.',
    sections: [
      {
        id: 'what-auto-covers',
        title: 'What Commercial Auto Liability Covers',
        content: `Commercial auto liability insurance pays for bodily injury and property damage that the insured causes to third parties while operating owned, hired, or non-owned vehicles for business purposes. Unlike personal auto policies, commercial auto covers vehicles titled to the business, rented or borrowed vehicles, and employee-owned vehicles used for work. Most commercial auto policies are written with a Combined Single Limit (CSL) — a single dollar amount that applies to all bodily injury and property damage from one accident — rather than the split limits (per-person / per-accident / property damage) common on personal policies.`,
      },
      {
        id: 'standard-limits',
        title: 'Standard Limits',
        content: `The standard commercial auto liability requirement for most vendors is $1,000,000 CSL. This is adequate for general service vendors such as cleaning crews, HVAC technicians, and landscapers whose vehicle exposure is limited to driving to and from your property. Vendors in logistics, trucking, and heavy transport should carry significantly higher limits due to the severity of accidents involving large vehicles.

| Industry | CSL Limit | Notes |
|---|---|---|
| General service vendors | $1,000,000 | Cleaning, landscaping, maintenance, HVAC |
| Construction contractors | $1,000,000 – $2,000,000 | Heavy equipment transport increases exposure |
| Delivery & courier services | $1,000,000 | Frequent trips increase accident frequency |
| Long-haul trucking & logistics | $5,000,000+ | Federal minimums apply; severity of loss is high |
| Waste hauling | $2,000,000 – $5,000,000 | Environmental liability from spills compounds claims |`,
      },
      {
        id: 'hired-non-owned',
        title: 'Hired and Non-Owned Auto Coverage',
        content: `Hired auto coverage (symbol 8) covers vehicles the vendor rents or borrows for business use, while non-owned auto coverage (symbol 9) covers employee-owned vehicles used for business purposes. These coverages matter because a vendor who rents a truck for a job or whose employee drives a personal car to your property creates liability exposure that a standard owned-auto-only policy will not cover. Require symbols 8 and 9 — or symbol 1 (any auto), which includes both — from any vendor whose employees may use non-company vehicles for work on your property.`,
      },
      {
        id: 'mcs-90-cargo',
        title: 'MCS-90 and Motor Truck Cargo',
        content: `The MCS-90 endorsement is a federal requirement for motor carriers transporting property across state lines in vehicles over 10,001 pounds. It guarantees a minimum level of financial responsibility — $750,000 for general freight and $1,000,000 for hazardous materials — and applies even if the underlying policy would otherwise deny the claim. If you hire trucking or freight vendors, confirm the MCS-90 endorsement is listed on their certificate. Motor truck cargo insurance is a separate coverage that protects the goods being transported, not third-party liability — it is typically carried on an inland marine policy rather than the auto policy, so do not confuse cargo coverage with auto liability limits.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify on an ACORD 25',
        content: `On the ACORD 25 form, automobile liability has its own section between general liability and umbrella/excess liability. Verify the policy number, effective and expiration dates, and confirm the Combined Single Limit field shows the required amount — this is the primary limit to check for auto coverage. Look at the coverage symbols indicated on the form: symbol 1 (any auto) provides the broadest coverage, while symbols 2 through 9 indicate more specific categories such as owned autos only, hired, or non-owned. If the vendor does not carry symbol 1, confirm that the combination of symbols listed covers owned (symbol 2), hired (symbol 8), and non-owned (symbol 9) vehicles. Check the "ADDL INSD" and "SUBR WVD" checkboxes in the auto section to verify additional insured status and waiver of subrogation have been granted on the auto policy, not just on the GL policy.`,
      },
      {
        id: 'disclaimer',
        title: 'Coverage Recommendations Disclaimer',
        content: `These coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Every property has unique risk characteristics, and the appropriate coverage requirements for your vendors and tenants depend on factors including your property type, location, lease terms, and risk tolerance. Consult with your insurance broker or risk management professional to determine appropriate requirements for your specific situation.`,
      },
    ],
    relatedGuides: [
      { slug: 'general-liability', name: 'General Liability' },
      { slug: 'workers-compensation', name: 'Workers\' Compensation' },
      { slug: 'umbrella-excess-liability', name: 'Umbrella & Excess Liability' },
      { slug: 'professional-liability', name: 'Professional Liability' },
      { slug: 'property-inland-marine', name: 'Property & Inland Marine' },
    ],
  },
  {
    slug: 'umbrella-excess-liability',
    title:
      'Umbrella & Excess Liability Insurance Requirements',
    metaDescription:
      'When to require umbrella or excess liability coverage from vendors. Covers the difference between umbrella and excess, standard limits by industry, and ACORD 25 verification.',
    headline:
      'Umbrella & Excess Liability Insurance Requirements',
    intro:
      'Umbrella and excess liability policies provide additional limits above a vendor\'s primary general liability, auto, and employers liability coverage. For high-risk vendors — especially construction contractors and those performing work on occupied properties — underlying policy limits alone may not be enough to cover a catastrophic claim. This guide explains the difference between umbrella and excess policies, when to require them, how they interact with underlying coverage, and where to verify them on an ACORD 25.',
    sections: [
      {
        id: 'umbrella-vs-excess',
        title: 'Umbrella vs Excess Liability',
        content: `An umbrella policy provides broader coverage than the underlying policies it sits above — it increases limits on underlying coverages and can also "drop down" to cover certain claims that the underlying policies exclude, subject to a self-insured retention. An excess liability policy, by contrast, follows form exactly with the underlying policies, meaning it only increases the dollar limits without expanding the scope of coverage. In practice, many certificates list "umbrella/excess" interchangeably, but the distinction matters when a claim falls outside the underlying policy's coverage terms — an umbrella may respond where a strict excess policy would not.`,
      },
      {
        id: 'when-to-require',
        title: 'When to Require Umbrella Coverage',
        content: `Umbrella coverage should be required from any vendor whose work creates exposure that could exceed primary policy limits in a single incident — construction contractors, vendors working at height or with heavy equipment, and any vendor with significant vehicle operations. The required umbrella limit should reflect the realistic severity of a worst-case claim, not an arbitrary multiple of the underlying limits.

| Industry | Umbrella / Excess Limit | Notes |
|---|---|---|
| General property management vendors | $1,000,000 – $2,000,000 | Cleaning, landscaping, pest control |
| Construction & general contractors | $5,000,000+ | Multi-party jobsites, severe injury potential |
| Healthcare & medical tenants | $5,000,000+ | Malpractice severity drives higher limits |
| Logistics & transportation | $5,000,000+ | Large vehicle accidents produce high-value claims |
| Retail & office tenants | Not typically required | Primary GL limits are usually sufficient |`,
      },
      {
        id: 'following-form',
        title: 'Following Form vs Standalone',
        content: `A following-form umbrella or excess policy adopts the same terms, conditions, and exclusions as the underlying policies it sits above, which means coverage is predictable and there are no gaps between layers. A standalone umbrella has its own policy terms that may differ from the underlying coverage — creating the possibility that a claim covered by the primary policy is excluded by the umbrella, or vice versa. For COI compliance purposes, following-form policies are preferred because they ensure the additional limits apply to the same risks you verified on the primary coverage.`,
      },
      {
        id: 'underlying-interaction',
        title: 'How Umbrella Interacts with Underlying Policies',
        content: `An umbrella or excess policy sits above the vendor's primary GL, commercial auto, and employers liability policies and triggers only after the underlying policy's per-occurrence limit is fully exhausted. For example, a vendor with $1M GL and a $5M umbrella has $6M of total per-occurrence coverage — the umbrella pays the portion of a claim between $1M and $6M. Umbrella policies carry their own aggregate limit, which caps total payments across all claims during the policy period regardless of which underlying policy the claim falls under.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify on an ACORD 25',
        content: `On the ACORD 25 form, umbrella and excess liability appear in a dedicated section below the auto liability section. The form indicates whether the policy is an umbrella or excess type and whether it is occurrence-based or claims-made — require occurrence-based for consistency with the underlying GL policy. Verify the "Each Occurrence" limit and the "Aggregate" limit meet your requirements, and confirm the policy dates cover your contract period. The Description of Operations section or an attached schedule should list the underlying policies (GL, auto, employers liability) that the umbrella sits above — if the underlying policies are not scheduled, the umbrella may not apply to all coverage lines you expect.`,
      },
      {
        id: 'disclaimer',
        title: 'Coverage Recommendations Disclaimer',
        content: `These coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Every property has unique risk characteristics, and the appropriate coverage requirements for your vendors and tenants depend on factors including your property type, location, lease terms, and risk tolerance. Consult with your insurance broker or risk management professional to determine appropriate requirements for your specific situation.`,
      },
    ],
    relatedGuides: [
      { slug: 'general-liability', name: 'General Liability' },
      { slug: 'workers-compensation', name: 'Workers\' Compensation' },
      { slug: 'auto-liability', name: 'Auto Liability' },
      { slug: 'professional-liability', name: 'Professional Liability' },
      { slug: 'property-inland-marine', name: 'Property & Inland Marine' },
    ],
  },
  {
    slug: 'professional-liability',
    title:
      'Professional Liability (E&O) Insurance Requirements',
    metaDescription:
      'Which vendors need professional liability insurance and what limits to require. Covers E&O vs general liability, claims-made policies, tail coverage, and verification.',
    headline:
      'Professional Liability (E&O) Insurance Requirements',
    intro:
      'Professional liability insurance — also called errors and omissions (E&O) — covers claims arising from a vendor\'s professional services, advice, or designs rather than from physical work or bodily injury. General liability does not cover these risks, which means vendors who provide intellectual or advisory services need a separate professional liability policy. This guide covers which vendors need E&O, how claims-made policies differ from occurrence-based coverage, when cyber liability applies, and how to verify professional liability on a certificate.',
    sections: [
      {
        id: 'what-pl-covers',
        title: 'What Professional Liability Covers',
        content: `Professional liability insurance covers financial losses that a third party suffers due to the insured's errors, omissions, or negligent performance of professional services. This includes design defects by an architect, faulty advice from a consultant, missed deadlines that cause financial harm, and software failures from an IT vendor. General liability explicitly excludes these "professional services" claims — GL covers bodily injury and property damage, not economic loss from bad work — so vendors providing advisory, design, or technology services need both policies to be fully covered.`,
      },
      {
        id: 'which-vendors',
        title: 'Which Vendor Types Need It',
        content: `Any vendor whose primary deliverable is a service, design, recommendation, or technology product rather than physical labor should carry professional liability coverage. The limits you require should reflect the potential financial impact of a professional failure on your property or operations.

| Profession | Typical Limit | Notes |
|---|---|---|
| Architects & engineers | $1,000,000 – $2,000,000 | Design defects can cause extensive property damage claims |
| IT & technology vendors | $1,000,000 – $2,000,000 | Software failures, data loss, system downtime |
| Consultants & advisors | $1,000,000 | Financial advice, management consulting, environmental consulting |
| Accountants & auditors | $1,000,000 – $2,000,000 | Errors in financial reporting or tax filings |
| Property management firms | $1,000,000 – $3,000,000 | Fiduciary duty to owners, tenant disputes, regulatory compliance |
| Real estate appraisers | $1,000,000 | Valuation errors affecting transactions or financing |`,
      },
      {
        id: 'claims-made-vs-occurrence',
        title: 'Claims-Made vs Occurrence',
        content: `Professional liability policies are almost always written on a claims-made basis, which means the policy only covers claims that are filed during the active policy period — not claims filed later for incidents that happened while the policy was in force. This is a critical distinction from occurrence-based GL policies, which cover any incident that occurred during the policy period regardless of when the claim is filed. Every claims-made policy has a retroactive date, and only claims arising from incidents that occurred after that retroactive date are covered — a vendor who switched carriers and received a new retroactive date may have a gap in coverage for prior work. When a vendor cancels or does not renew a claims-made policy, they should purchase an extended reporting period (commonly called "tail coverage") to cover claims filed after cancellation for work performed during the policy period.`,
      },
      {
        id: 'cyber-liability',
        title: 'Cyber Liability',
        content: `Cyber liability insurance is related to but separate from professional liability — it covers data breaches, ransomware attacks, regulatory fines, and notification costs arising from a security incident. Require cyber liability from any vendor that accesses, stores, or processes sensitive data on your behalf, including IT service providers, property management software vendors, and any vendor with access to tenant personal information or financial records. For healthcare properties or vendors handling protected health information, cyber coverage should include HIPAA regulatory defense and penalty coverage, as breach notification and remediation costs alone can exceed $1M for a single incident.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify on an ACORD 25',
        content: `Professional liability does not have a dedicated section on the standard ACORD 25 form, so it is often evidenced on a separate certificate or listed in the Description of Operations section at the bottom of the ACORD 25. When it does appear, check whether the policy is marked "CLAIMS-MADE" or "OCCUR" — for professional liability, claims-made is standard, and an occurrence-based policy would be unusual. Verify the retroactive date listed on the certificate and confirm it predates the start of the vendor's work on your property — a retroactive date that postdates prior work creates a coverage gap for claims arising from that earlier period. Confirm that both the per-claim limit and the aggregate limit meet your requirements, and note the policy expiration date so you can follow up on renewal and verify that no gap in coverage occurs between policy periods.`,
      },
      {
        id: 'disclaimer',
        title: 'Coverage Recommendations Disclaimer',
        content: `These coverage recommendations are based on common industry benchmarks and should not be considered insurance advice. Every property has unique risk characteristics, and the appropriate coverage requirements for your vendors and tenants depend on factors including your property type, location, lease terms, and risk tolerance. Consult with your insurance broker or risk management professional to determine appropriate requirements for your specific situation.`,
      },
    ],
    relatedGuides: [
      { slug: 'general-liability', name: 'General Liability' },
      { slug: 'workers-compensation', name: 'Workers\' Compensation' },
      { slug: 'auto-liability', name: 'Auto Liability' },
      { slug: 'umbrella-excess-liability', name: 'Umbrella & Excess Liability' },
      { slug: 'property-inland-marine', name: 'Property & Inland Marine' },
    ],
  },
];

export function getCoverageGuide(slug: string): CoverageGuide | undefined {
  return coverageGuides.find((g) => g.slug === slug);
}
