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
      'Learn what workers compensation coverage to require from vendors and contractors. Covers statutory limits, employers liability, waiver of subrogation, state requirements, and how to verify WC on an ACORD 25.',
    headline:
      'Workers Compensation Insurance Requirements for Vendors & Contractors',
    intro:
      'Workers compensation is a mandatory coverage in nearly every state, yet it remains one of the most common gaps found during COI reviews. Unlike general liability, workers comp is a no-fault system — it pays injured workers regardless of who caused the accident. For property managers, requiring proof of workers compensation from every vendor and contractor is not optional. If an uninsured worker is injured on your property, you may be held liable for their medical bills and lost wages. This guide covers what workers comp protects against, the employers liability limits you should require, waiver of subrogation endorsements, state-specific considerations, and how to verify coverage on an ACORD 25 form.',
    sections: [
      {
        id: 'what-wc-covers',
        title: 'What Workers Compensation Covers',
        content: `Workers compensation insurance (Part A of the policy) provides benefits to employees who are injured or become ill as a direct result of their job. It is a no-fault system — the employee does not need to prove the employer was negligent, and the employer cannot argue that the employee was at fault. In exchange for guaranteed benefits, the employee gives up the right to sue their employer for workplace injuries.

Workers compensation covers four categories of benefits:

**Medical expenses** are covered in full with no deductible or copay for the injured worker. This includes emergency treatment, surgery, hospitalization, physical therapy, prescription medications, and any ongoing medical care related to the workplace injury. There is no dollar cap on medical benefits in most states — the policy pays whatever treatment is medically necessary.

**Lost wages** are partially replaced while the employee is unable to work. Most states pay two-thirds of the employee's average weekly wage, subject to a state-set maximum. Benefits begin after a waiting period (typically 3–7 days) and continue until the employee returns to work or reaches maximum medical improvement. For permanent disabilities, benefits may continue for years or for life depending on the severity.

**Rehabilitation costs** cover vocational retraining if the employee cannot return to their previous job due to the injury. This includes job placement services, education, and retraining programs.

**Death benefits** provide payments to the surviving dependents of an employee killed on the job, plus a burial allowance. Benefits are typically a percentage of the deceased worker's wages paid to the spouse and dependent children.

Workers compensation limits are statutory — they are set by each state's workers compensation law, not by the policy. You will see "Statutory" in the WC limits field on the ACORD 25 form rather than a dollar amount. This means the policy provides whatever benefits the state law requires, which vary significantly from state to state.

For property managers, the critical point is this: if a vendor's employee is injured on your property and that vendor does not carry workers compensation, the injured worker may file a claim against you as the property owner. Workers compensation is not just the vendor's problem — it is your first line of defense against workplace injury claims on your property.`,
      },
      {
        id: 'employers-liability',
        title: 'Employers Liability Limits (Part B)',
        content: `Every workers compensation policy has two parts. Part A provides the statutory workers comp benefits described above. Part B — Employers Liability — covers lawsuits that fall outside the workers compensation system.

While workers compensation is a no-fault, no-lawsuit system, there are exceptions. An injured employee's spouse may sue the employer for loss of consortium. An employee may sue a third party (like the property owner) who then seeks contribution from the employer. In some states, employees can sue for injuries caused by the employer's "gross negligence" or "intentional acts" that fall outside the workers comp exclusive remedy. Employers liability coverage responds to these claims.

**Standard employers liability limits**

The standard employers liability limits carried by most small to mid-size vendors are:

- **$500,000** — Each Accident (bodily injury by accident)
- **$500,000** — Disease – Policy Limit (aggregate for all disease claims)
- **$500,000** — Disease – Each Employee (per-employee disease claim limit)

These $500K/$500K/$500K limits are the default on most workers compensation policies and are adequate for low-risk vendors such as cleaning services, landscaping crews, pest control, and general maintenance contractors.

**When to require $1,000,000 employers liability**

For higher-risk vendors, you should require $1M/$1M/$1M employers liability limits. This applies to:

- **Construction contractors and subcontractors** — The severity of construction injuries regularly exceeds $500K in medical costs alone. A fall from height, scaffolding collapse, or heavy equipment accident can produce claims in the $1M–$5M range.
- **Vendors performing hazardous work** — Asbestos abatement, lead paint removal, electrical work, roofing, and demolition all carry elevated injury severity that warrants higher limits.
- **Vendors with large crews on-site** — A vendor with 20+ workers on your property increases the probability of a workplace injury claim. Higher limits provide a larger pool of coverage.
- **Any vendor required to carry umbrella coverage** — The umbrella policy sits above employers liability (among other underlying policies). If you require a $5M umbrella, requiring only $500K employers liability creates an unnecessary gap in the coverage tower.

On the ACORD 25 form, employers liability limits appear in the Workers Compensation section as three separate line items: "E.L. Each Accident," "E.L. Disease – Ea Employee," and "E.L. Disease – Policy Limit." Verify all three meet your requirements — it is common to see one or two at $1M while the third remains at $500K.`,
      },
      {
        id: 'waiver-of-subrogation',
        title: 'Waiver of Subrogation for Workers Compensation',
        content: `Subrogation is the right of an insurance company to recover money it paid on a claim from a third party who may have been responsible. In a workers compensation context, if a vendor's employee is injured on your property, the vendor's workers comp insurer pays the employee's benefits and then may turn around and sue you — the property owner — to recover what it paid, arguing that unsafe conditions on your property contributed to the injury.

A waiver of subrogation endorsement eliminates this right. When a vendor's workers comp policy includes a waiver of subrogation in your favor, their insurer cannot pursue you for reimbursement of workers comp benefits paid to the vendor's injured employee — even if your property conditions contributed to the injury.

**WC 00 03 13 — The standard endorsement**

The standard ISO endorsement for waiver of subrogation on workers compensation policies is form WC 00 03 13 (Waiver of Our Right to Recover From Others Endorsement). This endorsement must specifically name your entity as the party in whose favor subrogation is waived. A blanket waiver of subrogation endorsement — which waives subrogation for any party the insured has agreed to waive it for in a written contract — is also acceptable and increasingly common.

**Why waiver of subrogation matters**

Without a waiver of subrogation, you face a paradox: you required the vendor to carry workers comp to protect yourself from workplace injury claims, but the vendor's own insurer can still come after you. The waiver closes this loop. It ensures that the vendor's workers comp coverage actually protects you as intended, not just the vendor's employees.

**Where it appears on the ACORD 25**

On the ACORD 25 form, waiver of subrogation for workers compensation is indicated by the "SUBR WVD" (Subrogation Waived) checkbox in the Workers Compensation section — this checkbox should be marked "Y." Additionally, the Description of Operations section at the bottom of the form should reference the waiver, typically with language such as "Waiver of Subrogation applies in favor of [Your Entity Name] per endorsement WC 00 03 13" or "Blanket Waiver of Subrogation included where required by written contract."

A checked SUBR WVD box without supporting language in the description, or description language without a checked box, should both be flagged for clarification with the vendor's insurance agent. The endorsement itself — not the certificate — is the legal document that grants the waiver. The certificate is evidence, not the source.`,
      },
      {
        id: 'state-considerations',
        title: 'State-Specific Considerations',
        content: `Workers compensation is regulated at the state level, and requirements vary significantly. Property managers operating across multiple states — or managing vendors who work in multiple states — need to be aware of key differences.

**Monopolistic states**

Four states operate monopolistic or exclusive state fund systems for workers compensation:

- **Ohio** — Coverage must be purchased through the Ohio Bureau of Workers' Compensation (BWC). Private insurance is not available.
- **Washington** — Coverage through the Washington State Department of Labor & Industries. Private insurance is not available for state fund coverage, though employers can self-insure with approval.
- **Wyoming** — Coverage through the Wyoming Department of Workforce Services.
- **North Dakota** — Coverage through Workforce Safety & Insurance (WSI).

In these states, vendors will not have a standard workers comp policy from a private insurer. Instead, they will have a certificate or letter from the state fund. The ACORD 25 may show the state fund as the insurer, or the vendor may provide a separate state-issued certificate. Accept state fund documentation as equivalent to private coverage — the benefits to injured workers are the same.

**Important note:** Employers liability (Part B) is typically not included in monopolistic state fund coverage. If you require employers liability limits from vendors in these states, they may need to purchase a separate "stop gap" employers liability endorsement, usually added to their general liability policy.

**Sole proprietor and officer exemptions**

Most states allow sole proprietors, partners, and corporate officers to exempt themselves from workers compensation requirements. A sole proprietor plumber working alone can legally operate without workers comp in most states by filing an exemption.

This creates risk for property managers. If that sole proprietor is injured on your property, they have no workers comp coverage — and they retain their right to sue you directly for their injuries since they are not covered by the exclusive remedy of workers compensation.

**How to handle exemptions:** Require a signed waiver or certificate of exemption from any vendor claiming a sole proprietor or officer exemption. Document it in your compliance records. For high-risk work (construction, roofing, electrical), consider requiring workers comp regardless of exemption status, or require the vendor to carry occupational accident insurance as an alternative.

**Coverage for the state where work is performed**

Workers compensation policies must cover the state where the work is actually performed, not just the state where the vendor is based. A contractor headquartered in Texas who performs work on your property in Colorado must have Colorado listed on their workers comp policy (Item 3.A on the policy declarations). If the state where work is performed is not listed, coverage may not apply.

On the ACORD 25, verify that the correct state or "All States" coverage is indicated. If a vendor works across multiple states, "All States" or a list of all applicable states should appear in the Workers Compensation section.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify Workers Compensation on an ACORD 25',
        content: `The Workers Compensation and Employers Liability section of the ACORD 25 is in the middle-right area of the form. Here is what to check field by field:

**Workers Compensation section fields:**

- **WC Statutory Limits:** This checkbox or field should indicate "Y" or show "Statutory." This confirms the policy meets the state-mandated benefit levels. If this field is blank or shows "N," the vendor may not have workers comp coverage — a critical compliance failure for any vendor with employees.
- **Employers Liability limits:** Three separate fields show the Part B limits:
  - **E.L. Each Accident** — The per-accident limit (typically $500K or $1M)
  - **E.L. Disease – Each Employee** — The per-employee limit for occupational disease claims
  - **E.L. Disease – Policy Limit** — The aggregate limit for all disease claims
  Verify all three fields meet your requirements. Do not assume they are identical — some policies carry split limits.

- **SUBR WVD (Subrogation Waived):** Should be marked "Y" if you require waiver of subrogation. Cross-reference with the Description of Operations section for endorsement details.

**What a blank Workers Compensation section means**

If the entire Workers Compensation section of the ACORD 25 is blank, it means one of three things: the vendor does not carry workers comp, the certificate issuer did not include it on this certificate, or the vendor is exempt. None of these are acceptable without follow-up.

If the vendor claims exemption, request documentation of their exemption filing with the state. If the vendor claims they have coverage but it was not listed on the certificate, request a corrected certificate. If the vendor simply does not carry workers comp and has employees, they are operating in violation of state law in nearly every state and should not be permitted to work on your property.

**Policy dates and state coverage**

Verify the effective and expiration dates are current. Workers comp policies are typically annual. Also confirm that the policy covers the state where your property is located — this information may appear in the Workers Compensation section or in the Description of Operations.

**Description of Operations cross-reference**

For workers compensation specifically, the Description of Operations section should include:
- Waiver of subrogation language and endorsement form number (WC 00 03 13) if required
- The specific project or property address if applicable
- Any state-specific endorsements

A workers compensation certificate that shows statutory limits, adequate employers liability, a checked SUBR WVD box, and supporting description language represents complete WC compliance. Any missing element should trigger a follow-up request to the vendor's insurance agent before the vendor begins work on your property.`,
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
      'Learn what commercial auto liability coverage to require from vendors. Covers combined single limits, hired and non-owned auto, MCS-90 endorsements, motor truck cargo, and how to verify auto coverage on an ACORD 25.',
    headline:
      'Commercial Auto Liability Insurance Requirements for Vendors',
    intro:
      'Commercial auto liability is the third coverage line on most ACORD 25 certificates, and it is the one property managers most often overlook. If a vendor uses any vehicle in connection with their work on your property — whether a company truck, a personal car on a job errand, or a rented van — their commercial auto policy is what responds when that vehicle causes an accident. Personal auto policies exclude business use, which means a vendor driving to your property for work may have no coverage under their personal policy if they lack a commercial auto policy. This guide covers what commercial auto protects against, the limits you should require, hired and non-owned auto coverage, endorsements for trucking operations, and how to verify auto coverage on an ACORD 25 form.',
    sections: [
      {
        id: 'what-auto-covers',
        title: 'What Commercial Auto Liability Covers',
        content: `Commercial auto liability insurance covers bodily injury and property damage caused by vehicles used in the insured's business operations. When a vendor's driver causes an accident while performing work related to your property — driving to the job site, transporting materials, making deliveries, or traveling between properties — the vendor's commercial auto policy pays for injuries to other people and damage to their property.

Commercial auto policies are structured around "covered auto" designations using numbered symbols that define which vehicles are insured:

**Symbol 1 — Any Auto** covers all vehicles regardless of ownership. This is the broadest coverage and the simplest to verify. If a vendor's policy shows Symbol 1, every vehicle they own, hire, or borrow is covered.

**Symbol 2 — Owned Autos Only** covers vehicles titled in the insured's name. This is the most common designation for businesses with their own fleet. It does not cover rented or employee-owned vehicles used for business.

**Symbol 7 — Specifically Described Autos** covers only the vehicles listed by VIN on the policy. This is common for small operations with one or two trucks. The risk is that a newly purchased vehicle may not be covered until added to the policy.

**Symbol 8 — Hired Autos** covers vehicles the insured rents, leases, or borrows. This is critical for vendors who rent trucks or equipment for specific jobs.

**Symbol 9 — Non-Owned Autos** covers vehicles owned by the insured's employees when used for business purposes. This protects against the scenario where an employee uses their personal car to run a work errand and causes an accident.

The distinction between these symbols matters because a vendor with only Symbol 2 (owned autos) has no coverage when their employee uses a personal vehicle on a job errand or when they rent a truck for a large project. For property managers, the safest requirement is Symbol 1 (any auto) or a combination of Symbols 2, 8, and 9 (owned, hired, and non-owned).`,
      },
      {
        id: 'standard-limits',
        title: 'Standard Limits and When to Require More',
        content: `Commercial auto liability is typically written with a Combined Single Limit (CSL) — a single limit that applies to both bodily injury and property damage per accident, rather than separate limits for each. This simplifies verification because you only need to check one number.

**Standard CSL requirements by vendor type:**

| Vendor Type | CSL Per Accident | Notes |
|---|---|---|
| General vendors (cleaning, landscaping, pest control) | $1,000,000 | Standard for light vehicle use |
| Construction contractors | $1,000,000 | Minimum; $2M for heavy equipment operators |
| Delivery and courier services | $1,000,000 | Regular vehicle use increases exposure |
| HVAC, plumbing, electrical | $1,000,000 | Service vehicles on-site daily |
| Long-haul trucking (interstate) | $1,000,000–$5,000,000 | Federal minimums apply (see MCS-90 below) |
| Hazmat transport | $5,000,000 | Federal requirement for hazardous materials |
| Passenger transport (shuttles, buses) | $5,000,000 | Reflects multi-passenger injury severity |

**Why $1M CSL is the baseline**

A single serious auto accident involving injuries to multiple people can easily exceed $500K in medical costs and lost wages. A vendor's truck running a red light and hitting a vehicle with three occupants can produce claims totaling $1M–$3M when accounting for surgeries, rehabilitation, permanent disability, and pain and suffering. The $1M CSL standard reflects the realistic cost of a single serious accident — not a catastrophic one.

**When to require higher limits**

For vendors operating heavy vehicles (dump trucks, concrete trucks, cranes on trailers), transporting hazardous materials, or driving high-mileage routes, $1M may not be sufficient. These vendors should carry higher auto limits or have an umbrella/excess policy that sits above the auto liability and increases the effective limit. A vendor with $1M auto CSL and a $5M umbrella policy has $6M in effective auto liability protection — a more cost-effective structure than purchasing a standalone $5M auto policy.`,
      },
      {
        id: 'hired-non-owned',
        title: 'Hired and Non-Owned Auto Coverage',
        content: `Hired and non-owned auto coverage (Symbols 8 and 9) is one of the most important — and most commonly missing — components of a commercial auto policy. Many small vendors carry only owned auto coverage (Symbol 2), leaving a significant gap when vehicles they do not own are used for business purposes.

**Hired auto (Symbol 8)** covers vehicles the vendor rents, leases, or borrows for business use. A contractor rents a flatbed truck to haul materials to your property. A vendor leases a van for a week-long project. A maintenance company borrows a pickup from another business. In each case, if the rented or borrowed vehicle causes an accident, the vendor's hired auto coverage responds. Without it, there may be no coverage at all — rental company insurance is limited and the vendor's owned auto policy will not cover a vehicle they do not own.

**Non-owned auto (Symbol 9)** covers employees' personal vehicles when used for business. This is the coverage gap that catches the most property managers off guard. A vendor's employee drives their personal car to your property for a service call. On the way, they cause an accident. The employee's personal auto policy may deny the claim because the trip was for business purposes. The vendor's commercial auto policy will deny the claim if it only covers owned autos. Non-owned auto coverage fills this gap by extending the vendor's commercial auto policy to cover business use of employee-owned vehicles.

**When to require hired and non-owned auto**

Require hired and non-owned auto coverage from any vendor whose employees may use personal vehicles for business purposes — which is nearly every vendor. Even a vendor with a fleet of company trucks likely has employees who occasionally use personal cars for supply runs, site visits, or travel between locations. The only vendors who might reasonably lack this coverage are those whose employees never drive for work purposes — and that is a narrow exception.

**How it appears on the ACORD 25**

On the ACORD 25, the Automobile Liability section includes checkboxes or fields for coverage type. Look for "ANY AUTO," "HIRED AUTOS ONLY," "NON-OWNED AUTOS ONLY," or "SCHEDULED AUTOS." If the form shows "ANY AUTO," hired and non-owned coverage is included by definition. If it shows "OWNED AUTOS ONLY" or "SCHEDULED AUTOS," hired and non-owned coverage is likely absent unless separately indicated. Some certificates will list "HIRED" and "NON-OWNED" as separate line items or note them in the Description of Operations section.`,
      },
      {
        id: 'mcs-90-trucking',
        title: 'MCS-90 Endorsement and Trucking Requirements',
        content: `For vendors involved in interstate trucking operations, federal regulations impose additional insurance requirements that go beyond standard commercial auto coverage.

**MCS-90 endorsement**

The MCS-90 is a federal endorsement required for motor carriers operating vehicles over 10,001 pounds in interstate commerce. It guarantees that the insurer will pay bodily injury and property damage claims caused by the motor carrier, even if the policy would otherwise exclude or deny the claim. The MCS-90 acts as a public safety net — it protects accident victims, not the insured.

Federal minimum liability limits for interstate motor carriers are:

- **$750,000** for general freight carriers (non-hazardous)
- **$1,000,000** for carriers transporting oil and hazardous materials (non-bulk)
- **$5,000,000** for carriers transporting bulk hazardous materials

If any vendor delivers freight to your property using vehicles over 10,001 pounds in interstate commerce, they are required by law to carry the MCS-90 endorsement. Request confirmation that the endorsement is in force — it may appear in the Description of Operations section of the ACORD 25 or on a separate MCS-90 certificate.

**Motor truck cargo coverage**

Motor truck cargo insurance is separate from auto liability and covers damage to goods being transported by the vendor. This is not liability coverage — it covers the cargo itself. If a trucking vendor is transporting materials, equipment, or products to or from your property and the cargo is damaged in transit, motor truck cargo insurance pays for the loss.

Standard motor truck cargo limits range from $100,000 to $500,000 depending on the value of goods typically transported. For vendors hauling high-value construction materials, specialized equipment, or tenant property during a move, verify that cargo limits are adequate for the value at risk.

Motor truck cargo coverage does not appear in a standard section of the ACORD 25. It is typically listed in the Description of Operations section or evidenced on a separate certificate. If a vendor's trucking operations are material to your property — regular deliveries, tenant move-in/move-out logistics, or construction material hauling — request a separate certificate confirming motor truck cargo coverage with adequate limits.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify Auto Liability on an ACORD 25',
        content: `The Automobile Liability section of the ACORD 25 is located below the General Liability section on the left side of the form. Here is what to verify field by field:

**Coverage type indicators**

The form includes checkboxes or fields indicating the type of auto coverage:
- **ANY AUTO** — The broadest coverage. If checked, all vehicles (owned, hired, non-owned, scheduled) are covered. This is the simplest to verify and the most protective.
- **ALL OWNED AUTOS** — Only vehicles titled to the insured. Check for hired and non-owned separately.
- **HIRED AUTOS** — Rented, leased, or borrowed vehicles. Should be present if "Any Auto" is not checked.
- **NON-OWNED AUTOS** — Employee-owned vehicles used for business. Should be present if "Any Auto" is not checked.
- **SCHEDULED AUTOS** — Only specifically listed vehicles. Most restrictive — verify that the vehicles used on your property are on the schedule.

**Limits fields**

- **Combined Single Limit (CSL)** — The per-accident limit for both bodily injury and property damage combined. This is the primary limit to verify. Should meet your requirement (typically $1M minimum).
- **Bodily Injury Per Person / Per Accident** — If the policy uses split limits instead of CSL, these fields show the per-person and per-accident BI limits separately. Split limits are less common in commercial auto but still appear on some policies.
- **Property Damage Per Accident** — The per-accident limit for damage to other people's property. Only applies if the policy uses split limits.

If you see split limits instead of CSL, evaluate whether the per-person BI limit is adequate. A policy with $250K per person / $500K per accident / $100K property damage has significantly less protection than a $1M CSL policy — the $250K per-person limit can be exhausted by a single serious injury.

**Additional insured and subrogation**

- **ADDL INSD:** Check whether the additional insured box is marked in the auto section if you require additional insured status on the auto policy (less common than GL additional insured, but required by some contracts).
- **SUBR WVD:** Check whether waiver of subrogation is indicated if your contract requires it for auto coverage.

**Description of Operations**

For auto liability, the Description of Operations section may include:
- MCS-90 endorsement confirmation for interstate trucking vendors
- Motor truck cargo coverage details and limits
- Specific vehicle or fleet descriptions
- Additional insured language specific to auto coverage

A complete auto liability review confirms that the coverage type includes all vehicles the vendor may use (ideally "Any Auto"), the CSL meets your requirement, and any endorsements required by your contract are evidenced on the certificate or in the description. Missing hired and non-owned coverage is the most common auto compliance gap — and the one most likely to leave you exposed.`,
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
      'Learn the difference between umbrella and excess liability policies, when to require them from vendors, standard limits by industry, and how to verify umbrella coverage on an ACORD 25.',
    headline:
      'Umbrella & Excess Liability Insurance Requirements',
    intro:
      'General liability, auto liability, and employers liability each have per-occurrence limits — and those limits can be exhausted by a single serious claim. When a construction worker falls three stories, when a vendor\'s truck causes a multi-vehicle accident, or when a completed project fails catastrophically, the underlying policy limits may not be enough. Umbrella and excess liability policies provide an additional layer of protection above the underlying coverage, and requiring them from higher-risk vendors is standard practice in commercial property management. This guide covers the difference between umbrella and excess policies, when to require each, standard limits by industry, how they interact with underlying coverages, and how to verify them on an ACORD 25.',
    sections: [
      {
        id: 'umbrella-vs-excess',
        title: 'Umbrella vs. Excess Liability: What Is the Difference?',
        content: `The terms "umbrella" and "excess" are often used interchangeably, but they are different policy structures with different implications for your coverage requirements.

**Excess liability** is the simpler of the two. An excess policy follows form — it provides additional limits on top of a specific underlying policy using the same terms, conditions, and exclusions. If the underlying GL policy has a per-occurrence limit of $1M and an excess policy adds $5M, the excess policy pays up to $5M after the underlying $1M is exhausted — but only for claims that the underlying policy would have covered. If the underlying GL policy excludes pollution liability, the excess policy excludes it too. An excess policy does not expand coverage; it only increases limits.

**Umbrella liability** is broader. An umbrella policy also sits above the underlying policies and provides additional limits, but it can cover claims that the underlying policies do not. An umbrella policy has its own terms and conditions, and it may cover claims that fall outside the underlying GL, auto, or employers liability policies — subject to the umbrella's own exclusions and a self-insured retention (SIR). The SIR is a deductible that the insured must pay out of pocket when the umbrella responds to a claim not covered by any underlying policy. Typical SIR amounts range from $10,000 to $25,000.

**Practical difference for property managers**

For most COI compliance purposes, both umbrella and excess policies accomplish the same goal: increasing the total limits available to pay a large claim. The distinction matters when a claim falls in a gap between underlying coverages — an umbrella may cover it (minus the SIR) while an excess policy would not.

In practice, most policies marketed as "umbrella" policies are actually a hybrid — they follow form for most claims (like excess) but provide some gap coverage for claims outside the underlying policies. When reviewing an ACORD 25, you will typically see the section labeled "Umbrella Liab" or "Excess Liab" with a checkbox for each. Either is generally acceptable unless your contract specifically requires one or the other. If your lease or vendor agreement specifically requires "umbrella" coverage, verify that the ACORD 25 does not show "excess" only.`,
      },
      {
        id: 'when-to-require',
        title: 'When to Require Umbrella or Excess Coverage',
        content: `Not every vendor needs umbrella or excess coverage. A pest control company with two employees making monthly visits poses a different risk profile than a general contractor managing a $5M renovation. Requiring umbrella coverage from every vendor increases their insurance costs — and by extension, your vendor costs — without a proportional reduction in risk.

**Require umbrella or excess coverage from:**

- **Construction contractors and subcontractors** — The severity of construction claims regularly exceeds primary policy limits. A scaffolding collapse, crane failure, or building fire during construction can produce claims in the $5M–$20M range. Every GC and sub working on your property should carry umbrella coverage.
- **Vendors performing high-risk work** — Roofing, demolition, asbestos abatement, electrical, elevator maintenance, and any work at height or involving hazardous materials. The probability and severity of claims justify the additional layer.
- **Vendors with heavy vehicle operations** — Trucking companies, heavy equipment operators, and vendors with large fleets. Auto accident severity can exceed $1M primary limits with a single multi-vehicle collision.
- **Vendors with large crews on-site** — The more workers a vendor has on your property, the higher the probability of a workplace incident and the higher the potential aggregate exposure across workers comp and GL claims.
- **Any vendor working on a large project** — Renovation, build-out, capital improvement, or any project with a contract value above $500K. The project value and complexity increase the exposure.

**When umbrella or excess is not necessary:**

Low-risk vendors with minimal on-site presence — such as office supply deliveries, copier maintenance, vending machine services, or janitorial services for small spaces — generally do not need umbrella coverage. Their $1M primary GL and auto limits are adequate for the risk they present. Requiring umbrella coverage from these vendors increases their costs and creates unnecessary compliance friction without meaningful risk reduction.`,
      },
      {
        id: 'standard-limits-by-industry',
        title: 'Standard Umbrella Limits by Industry',
        content: `The umbrella or excess limit you require should reflect the severity of potential claims the vendor's work could produce. Here are standard benchmarks:

| Industry / Vendor Type | Umbrella Limit | Rationale |
|---|---|---|
| General contractors | $5,000,000–$10,000,000 | Multi-trade projects, high severity, completed ops exposure |
| Subcontractors (electrical, plumbing, HVAC) | $2,000,000–$5,000,000 | Trade-specific risk, injury severity |
| Roofing, demolition, structural work | $5,000,000–$10,000,000 | Height, collapse risk, high claim severity |
| Property management companies | $1,000,000–$2,000,000 | Moderate operational risk |
| Healthcare tenants | $3,000,000–$5,000,000 | Medical malpractice severity (separate from E&O) |
| Trucking and heavy transport | $5,000,000–$10,000,000 | Multi-vehicle accident severity |
| Building security contractors | $2,000,000–$5,000,000 | Use of force, wrongful detention claims |
| Environmental remediation | $5,000,000–$10,000,000 | Pollution, long-tail health claims |

**Scaling limits to contract value**

For project-based work, a common rule of thumb is to require umbrella limits equal to or exceeding the contract value. A $3M renovation project warrants at least $3M in umbrella coverage. This is not a hard rule — a $500K contract with high-severity risk (roofing, demolition) may warrant $5M in umbrella — but it provides a useful starting point.

**Cost perspective**

Umbrella and excess policies are relatively inexpensive compared to the limits they provide. A $5M umbrella policy for a general contractor typically costs $3,000–$8,000 per year, compared to $15,000–$30,000 for the underlying GL and auto policies. Vendors who resist carrying umbrella coverage are often unaware of the relatively low cost. If a vendor pushes back, the conversation is easier when you can point to the cost-to-coverage ratio.`,
      },
      {
        id: 'following-form',
        title: 'Following Form vs. Standalone Umbrella',
        content: `Understanding how an umbrella or excess policy interacts with the underlying coverages is critical to knowing what you are actually protected against.

**Following form (excess)**

A following-form policy adopts the terms, conditions, and exclusions of the underlying policy it sits above. If the underlying GL policy covers products-completed operations, the following-form excess policy does too. If the underlying GL policy excludes pollution, the excess policy excludes it too. Following form is clean and predictable — whatever the underlying policy covers, the excess extends.

The risk with following form is that gaps in the underlying policy are replicated in the excess layer. A vendor with a GL policy that contains an XCU exclusion (explosion, collapse, underground) and a following-form excess policy has zero coverage for XCU claims at any layer. The excess policy does not fill gaps — it only extends existing coverage.

**Standalone umbrella**

A standalone umbrella has its own insuring agreement, its own definitions, and its own exclusion list. It sits above the underlying policies but is not bound by their terms. This means the umbrella may cover claims that the underlying policies exclude — subject to the umbrella's own exclusions and the self-insured retention.

For example, a vendor's GL policy might exclude personal injury claims arising from social media posts, but the umbrella's broader personal injury coverage might pick up the claim (minus the SIR). A standalone umbrella provides more comprehensive protection, but it also introduces complexity — you need to understand the umbrella's own exclusions, not just the underlying policy's.

**What property managers should look for**

For most vendor relationships, either structure is acceptable. The key verification is that the umbrella or excess policy actually sits above all the underlying coverages you require — GL, auto, and employers liability. Some umbrella policies only sit above GL and auto, excluding employers liability from the umbrella stack. If a vendor carries $500K employers liability and a $5M umbrella that does not cover employers liability, the effective employers liability limit is only $500K.

On the ACORD 25, the Umbrella/Excess section should indicate which underlying policies the umbrella covers. Look for "OCCUR" (occurrence) or "CLAIMS-MADE" to understand the policy type, and verify the "EACH OCCURRENCE" and "AGGREGATE" limits meet your requirements.`,
      },
      {
        id: 'how-umbrella-interacts',
        title: 'How Umbrella Interacts with Underlying GL, Auto, and WC',
        content: `An umbrella or excess policy creates a "coverage tower" — stacked limits that increase the total amount available to pay a claim. Understanding how these layers interact helps you verify that a vendor's total coverage is adequate.

**The coverage tower concept**

Consider a vendor with the following primary policies:
- GL: $1M per occurrence / $2M aggregate
- Auto: $1M CSL
- Employers liability: $1M each accident / $1M disease
- Umbrella: $5M per occurrence / $5M aggregate (over GL, auto, and EL)

If a GL claim produces a $3M judgment, the first $1M is paid by the primary GL policy. The remaining $2M is paid by the umbrella. If an auto accident produces a $4M judgment, the first $1M is paid by the auto policy and the remaining $3M by the umbrella. The umbrella's $5M limit is shared across all underlying coverages, which means a large GL claim reduces the umbrella limit available for a subsequent auto claim in the same policy period.

**Underlying limits requirement**

Most umbrella policies require the insured to maintain minimum underlying limits. A common requirement is $1M GL, $1M auto CSL, and $500K or $1M employers liability. If the insured drops their underlying limits below the umbrella's required minimums, the umbrella insurer may deny claims — leaving a gap between the actual underlying limit and the umbrella attachment point. This is called a "gap in the tower," and it means the insured is self-funding the difference.

For property managers, this reinforces the importance of verifying both the underlying limits and the umbrella limits on the ACORD 25. A vendor with a $5M umbrella but only $500K underlying GL may have a gap if the umbrella requires $1M underlying GL.

**Workers compensation and umbrella interaction**

Umbrella policies interact with workers compensation through the employers liability (Part B) layer — not Part A (statutory benefits). The umbrella sits above the employers liability limits, not above the statutory workers comp benefits. This means the umbrella provides additional limits for employers liability lawsuits (third-party-over claims, loss of consortium, etc.) but does not affect the statutory workers comp benefits paid to injured workers.

When reviewing a vendor's coverage tower, verify that employers liability is listed as a covered underlying policy in the umbrella section. If not, the umbrella does not extend employers liability — and the EL limits stand alone.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify Umbrella/Excess on an ACORD 25',
        content: `The Umbrella Liability / Excess Liability section on the ACORD 25 is located below the Workers Compensation section on the right side of the form. Here is what to verify:

**Policy type**

- **UMBRELLA LIAB** — A true umbrella policy with its own terms. May provide gap coverage beyond underlying policies.
- **EXCESS LIAB** — A following-form excess policy. Extends underlying coverage only.
- **OCCUR** or **CLAIMS-MADE** — Indicates whether the policy is occurrence-based or claims-made. Occurrence is standard and preferable for umbrella/excess coverage.

**Limits fields**

- **EACH OCCURRENCE** — The per-occurrence umbrella or excess limit. This is the maximum additional amount available for any single claim above the underlying policy limits.
- **AGGREGATE** — The annual aggregate umbrella or excess limit. This is the maximum total amount available across all claims for the policy period.
- **DED / RETENTION** — The deductible or self-insured retention (SIR). For excess policies, this is typically $0 (the excess attaches immediately above the underlying limit). For umbrella policies, the SIR typically ranges from $10,000 to $25,000 and applies to claims where no underlying policy responds.

**What to look for in the Description of Operations**

The Description of Operations section should clarify:
- Which underlying policies the umbrella or excess covers (GL, auto, employers liability)
- Whether the umbrella provides additional insured status to you (many umbrella policies automatically extend additional insured status to parties who are additional insureds on the underlying GL)
- Any specific endorsements, such as primary and non-contributory language at the umbrella level

**Common verification issues**

- **Umbrella that excludes employers liability:** If the umbrella only covers GL and auto, the employers liability limits are capped at the primary EL amounts. Verify that all three underlying lines are covered.
- **Claims-made umbrella:** Less common but sometimes seen. A claims-made umbrella only covers claims made during the policy period — not incidents that occurred during the policy period. This can create gaps when the vendor switches insurers or when claims are reported after policy expiration.
- **Aggregate already partially depleted:** The ACORD 25 shows the original policy limits, not the remaining limits. If a vendor had a major claim earlier in the policy year, the aggregate may be partially exhausted. There is no way to verify remaining aggregate from the certificate alone — you would need a loss run or a statement from the insurer.

A vendor's ACORD 25 that shows adequate underlying limits plus an umbrella or excess policy with appropriate per-occurrence and aggregate limits, covering all required underlying lines, represents a complete coverage tower. Gaps in the tower — missing underlying coverages, employers liability excluded from the umbrella, or inadequate per-occurrence limits — should be flagged for correction before high-risk work begins.`,
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
      'Learn what professional liability (errors & omissions) coverage to require from vendors. Covers which vendors need E&O, standard limits by profession, claims-made vs occurrence, and how to verify on an ACORD 25.',
    headline:
      'Professional Liability (E&O) Insurance Requirements',
    intro:
      'General liability covers bodily injury and property damage — but it does not cover financial losses caused by a vendor\'s professional mistakes. When an architect\'s design error leads to a costly rebuild, when an IT consultant\'s configuration mistake takes down your building management system, or when an accountant\'s error causes a tax penalty, general liability will not respond. Professional liability insurance — also called Errors & Omissions (E&O) — covers claims arising from negligent professional services, errors, and omissions. This guide covers what E&O protects against, which vendor types need it, standard limits by profession, the critical distinction between claims-made and occurrence policies, and how to verify professional liability on an ACORD 25.',
    sections: [
      {
        id: 'what-eo-covers',
        title: 'What Professional Liability (E&O) Covers',
        content: `Professional liability insurance covers claims alleging that the insured's professional services caused financial harm due to errors, omissions, negligence, or failure to perform. Unlike general liability, which covers physical harm (bodily injury and property damage), professional liability covers economic losses — the financial consequences of professional mistakes.

**What triggers a professional liability claim:**

- **Errors** — The professional made a mistake. An architect miscalculates load-bearing requirements. An engineer specifies the wrong material. An accountant makes an error on a tax filing.
- **Omissions** — The professional failed to do something they should have done. A consultant fails to identify a code violation during an inspection. An IT provider fails to implement a security patch that was part of their scope. An attorney misses a filing deadline.
- **Negligent professional services** — The professional's work fell below the standard of care expected of their profession. A property inspector conducts a superficial inspection and misses a material defect. A design firm produces plans that do not meet building code requirements.

**What E&O does not cover:**

Professional liability does not cover bodily injury or property damage — those are covered by general liability. It does not cover intentional wrongdoing, fraud, or criminal acts. It does not cover breach of contract in most cases (though some policies include contractual liability coverage as an add-on). And it does not cover claims arising from services outside the professional's declared area of expertise.

**Why E&O matters for property managers:**

When a professional vendor's mistake causes financial harm to your property or your tenants, general liability will not pay. If an HVAC engineer designs a system that fails and causes $200K in energy cost overruns, if an architect's design error requires $500K in remediation, or if a building code consultant misses a violation that results in fines and project delays — only the vendor's professional liability policy responds to these claims. Without E&O, you would need to sue the vendor directly and collect from their assets, which may be insufficient.`,
      },
      {
        id: 'which-vendors-need-eo',
        title: 'Which Vendor Types Need Professional Liability',
        content: `Not every vendor needs professional liability insurance. A landscaping crew, a cleaning service, or a painting contractor performs manual labor — not professional services — and their general liability policy covers the risks they present. Professional liability is required for vendors who provide advice, design, consultation, or specialized technical services where their professional judgment creates the potential for financial harm.

**Vendors that should always carry E&O:**

- **Architects and design firms** — Design errors can produce claims in the millions. E&O limits of $1M–$5M are standard depending on project scope.
- **Engineers (structural, mechanical, electrical, civil)** — Engineering errors in building systems can cause catastrophic failures and costly remediation. $1M–$3M limits are typical.
- **General contractors (for design-build projects)** — When the GC provides design services as part of a design-build contract, they need E&O in addition to their GL coverage.
- **IT and technology consultants** — System failures, data breaches from misconfiguration, and software implementation errors. $1M–$2M limits are standard.
- **Environmental consultants** — Phase I and Phase II environmental assessments carry significant liability if contamination is missed or mischaracterized. $1M–$3M limits.
- **Accountants and financial advisors** — Tax errors, audit failures, and financial misstatements. $1M–$2M limits are standard.
- **Attorneys** — Legal malpractice insurance is a form of E&O. $1M–$5M depending on the scope of legal services.
- **Property inspectors and appraisers** — Missed defects, incorrect valuations, and incomplete reports. $1M minimum.
- **Property management companies** — If you hire a third-party PM company, they should carry E&O covering their management decisions, tenant screening errors, and fiduciary responsibilities. $1M–$2M limits.
- **Insurance brokers** — Errors in coverage placement or failure to procure required coverage. $1M–$2M limits.

**Vendors that generally do not need E&O:**

Trades contractors (plumbers, electricians, roofers) performing physical work rather than design or advisory services typically do not need E&O. Their GL and completed operations coverage addresses the risk of faulty workmanship. However, if a trades contractor provides engineering or design services as part of their scope — for example, an electrical contractor who designs the electrical system — E&O should be required for the design component.`,
      },
      {
        id: 'standard-limits',
        title: 'Standard Limits by Profession',
        content: `Professional liability limits should reflect the potential financial exposure from the vendor's professional services. A data entry error by an administrative consultant has a different severity profile than a structural engineering miscalculation.

| Profession | Per Claim | Annual Aggregate | Notes |
|---|---|---|---|
| Architects | $1,000,000–$5,000,000 | $2,000,000–$5,000,000 | Scale with project value |
| Structural engineers | $1,000,000–$3,000,000 | $2,000,000–$3,000,000 | High severity potential |
| MEP engineers | $1,000,000–$2,000,000 | $2,000,000 | System design exposure |
| IT consultants / MSPs | $1,000,000–$2,000,000 | $2,000,000 | Data breach, system failure |
| Environmental consultants | $1,000,000–$3,000,000 | $2,000,000–$3,000,000 | Remediation cost exposure |
| Accountants / CPAs | $1,000,000 | $2,000,000 | Tax penalty, audit exposure |
| Attorneys | $1,000,000–$5,000,000 | $2,000,000–$5,000,000 | Case-dependent |
| Property inspectors | $1,000,000 | $1,000,000 | Missed defect exposure |
| Property management companies | $1,000,000–$2,000,000 | $2,000,000 | Management decision exposure |

**Scaling to project value**

For project-based professional services (architecture, engineering, design-build), a common benchmark is to require E&O limits equal to or exceeding the professional services fee or the project value, whichever results in higher limits. A $2M architectural project should be backed by at least $2M in professional liability coverage. For high-value projects, discuss appropriate limits with your risk management advisor.

**Per-claim vs. aggregate distinction**

Like general liability, professional liability has both per-claim and aggregate limits. The per-claim limit is the maximum paid for any single claim. The aggregate is the maximum paid for all claims combined in the policy period. Because E&O policies are typically claims-made (discussed in the next section), the aggregate is particularly important — a prior claim in the same policy year reduces the coverage available for your claim.`,
      },
      {
        id: 'claims-made-vs-occurrence',
        title: 'Claims-Made vs. Occurrence Policies',
        content: `This is the single most important concept in professional liability insurance — and the one most frequently misunderstood by property managers reviewing COIs.

**Occurrence policies** cover incidents that occur during the policy period, regardless of when the claim is filed. If a vendor has an occurrence policy from 2024 to 2025 and an error made in 2024 is discovered and claimed in 2027, the 2024–2025 policy responds. Most general liability and auto liability policies are occurrence-based.

**Claims-made policies** cover claims that are first made (reported) during the policy period, regardless of when the incident occurred — subject to a retroactive date. If a vendor has a claims-made policy from 2024 to 2025 and a claim is filed in 2025 for an error made in 2023, the policy covers the claim as long as the retroactive date is on or before 2023. But if the claim is filed in 2026 — after the policy expires — there is no coverage, even though the error occurred during the policy period.

**Why this matters for property managers:**

Nearly all professional liability policies are claims-made. This creates two critical timing risks:

**Retroactive date gaps.** The retroactive date is the earliest date for which the policy provides coverage. If a vendor switches insurers and the new policy has a later retroactive date, there is a gap. Work performed before the new retroactive date is not covered. When reviewing a vendor's E&O certificate, verify that the retroactive date precedes the start of the vendor's work on your property.

**Tail coverage (Extended Reporting Period).** When a claims-made policy expires or is not renewed, the vendor has no coverage for claims filed after expiration — even for errors made during the policy period. Tail coverage (also called an Extended Reporting Period or ERP) extends the window for reporting claims after the policy ends. Tail coverage periods range from 1 to 5 years, with some policies offering unlimited tail.

For professional vendors performing work with long-tail exposure — architects and engineers whose designs will be in use for decades, environmental consultants whose assessments are relied upon for years — require evidence that the vendor will maintain continuous claims-made coverage or purchase tail coverage upon policy expiration. This can be addressed in your contract and verified during annual COI renewals.

**What to look for on the certificate:**

On the ACORD 25 or a professional liability certificate, look for:
- **"Claims-made"** notation (nearly universal for E&O)
- **Retroactive date** — Should predate the vendor's work on your property
- **Policy period** — Should be currently active
- If the vendor recently switched insurers, confirm there is no gap between the old retroactive date and the new one`,
      },
      {
        id: 'cyber-liability',
        title: 'Cyber Liability as Related Coverage',
        content: `Cyber liability insurance has emerged as a coverage that is increasingly relevant alongside professional liability, particularly for vendors with access to your building systems, tenant data, or IT infrastructure.

**When to require cyber liability separately:**

- **IT consultants and managed service providers (MSPs)** — Any vendor with administrative access to your networks, building management systems, or tenant portals should carry cyber liability. A misconfiguration that leads to a data breach or system outage is a professional liability claim, but the costs of breach notification, credit monitoring, forensic investigation, and regulatory fines may exceed E&O limits or fall outside E&O policy terms.
- **Vendors handling sensitive tenant data** — Property management software vendors, accounting firms processing tenant financial data, and marketing firms with access to tenant contact information all present cyber risk.
- **Building automation and IoT vendors** — Vendors who install or maintain smart building systems, access control, surveillance, or HVAC automation have access to networked systems that can be compromised.

**Standard cyber liability limits:**

For most vendor relationships in property management, $1M in cyber liability coverage is adequate. For vendors with access to large volumes of personal data (thousands of tenant records) or critical building infrastructure, $2M–$5M may be appropriate.

**Cyber liability vs. professional liability overlap:**

Some professional liability policies include limited cyber coverage as a sublimit or endorsement. However, dedicated cyber liability policies provide broader coverage including first-party costs (breach response, business interruption, ransomware payments) that professional liability typically does not cover. When cyber risk is material to the vendor relationship, require a standalone cyber policy rather than relying on an E&O sublimit.

Cyber liability does not have a dedicated section on the ACORD 25 form. It is typically listed in the Description of Operations section or evidenced on a separate certificate. If you require cyber liability from a vendor, specify it in your insurance requirements and request separate evidence of coverage.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify Professional Liability on an ACORD 25',
        content: `Professional liability does not have a dedicated section on the standard ACORD 25 Certificate of Liability Insurance. This is one of the most important things to understand when reviewing COIs for professional vendors. The ACORD 25 is designed for GL, auto, workers comp, and umbrella — not professional liability.

**Where E&O appears on the ACORD 25:**

- **Description of Operations section** — Many certificate issuers list professional liability coverage in the free-text Description of Operations section at the bottom of the ACORD 25. Look for "Professional Liability," "Errors & Omissions," or "E&O" with the policy number, limits, effective/expiration dates, and claims-made/retroactive date information.
- **Additional coverage sections** — Some ACORD 25 forms include a blank section that can be used for additional coverage lines. The certificate issuer may use this space to list professional liability details.

**When to request a separate certificate:**

For vendors where professional liability is a critical requirement — architects, engineers, IT consultants, environmental firms — request a separate ACORD certificate specifically for professional liability. The ACORD 310 (Evidence of Commercial Property Insurance) or a generic evidence of insurance letter from the vendor's insurer provides clearer documentation than cramming E&O details into the ACORD 25 Description of Operations field.

**What to verify regardless of format:**

- **Per-claim and aggregate limits** — Confirm both meet your requirements.
- **Policy type** — Should indicate "claims-made." If it says "occurrence" for an E&O policy, verify — occurrence E&O policies exist but are rare and more expensive.
- **Retroactive date** — Must predate the vendor's work on your property. A retroactive date that matches the current policy inception date means prior work is not covered.
- **Policy period** — Confirm the policy is currently active and will not expire before the vendor's engagement ends.
- **Insurer name and AM Best rating** — Professional liability is a specialized line. Verify the insurer is financially sound (AM Best rating of A- or better is standard).

Professional liability is frequently the coverage line that property managers forget to require or fail to verify because it does not have a prominent section on the ACORD 25. For any vendor providing professional services — advice, design, consultation, or technical expertise — E&O should be an explicit line item in your insurance requirements and verified on every certificate renewal.`,
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
  {
    slug: 'property-inland-marine',
    title:
      'Property & Inland Marine Insurance Requirements for Tenants & Vendors',
    metaDescription:
      'Learn what property and inland marine insurance to require from tenants and vendors. Covers business personal property, tenant vs landlord coverage, builders risk, inland marine, business interruption, and how to verify on an ACORD 25.',
    headline:
      'Property & Inland Marine Insurance Requirements for Tenants & Vendors',
    intro:
      'Property insurance in a COI context is different from the building coverage you carry as a property owner. When you require property insurance from a tenant or vendor, you are ensuring they have coverage for their own assets — business personal property, tenant improvements, equipment, and inventory — so that a loss event does not disrupt their operations or create a dispute about who pays for what. Inland marine insurance extends this protection to property in transit, at temporary locations, or on construction sites. This guide covers what property insurance means on a COI, how tenant and landlord coverage responsibilities differ, when to require inland marine or builders risk, typical limits by tenant and vendor type, and how to verify property coverage on an ACORD 25.',
    sections: [
      {
        id: 'what-property-covers',
        title: 'What Property Insurance Covers in a COI Context',
        content: `When property insurance appears on a certificate of insurance from a tenant or vendor, it refers to first-party coverage — insurance that pays the policyholder for damage to their own property. This is distinct from liability insurance (which pays third parties for harm the policyholder caused). In a COI review, property insurance confirms that the tenant or vendor can recover from a loss to their own assets without looking to you for compensation.

**Business personal property (BPP)** is the core coverage. It protects the tenant's or vendor's movable property: furniture, equipment, inventory, supplies, computers, and tools. A restaurant tenant's commercial kitchen equipment, a retail tenant's inventory, an office tenant's furniture and technology — all are covered under BPP. If a fire, water damage, theft, or other covered peril destroys or damages this property, the tenant's BPP coverage pays for repair or replacement.

**Tenant improvements and betterments** cover the modifications a tenant makes to the leased space at their own expense. A restaurant tenant installs a commercial kitchen, custom lighting, and built-out dining room finishes. An office tenant adds server rooms, custom partitions, and specialized flooring. These improvements become part of the building but were paid for by the tenant. If a covered loss damages these improvements, the tenant's property policy covers the cost to restore them — not the landlord's building policy. This is a frequently disputed area after a loss, which is why requiring tenants to carry tenant improvement coverage is critical.

**Peril types — named peril vs. special form**

Property policies come in two forms. Named peril policies (also called basic or broad form) cover only the specific perils listed in the policy: fire, lightning, windstorm, hail, explosion, smoke, vandalism, and others explicitly named. If a peril is not listed, it is not covered. Special form (also called all-risk) policies cover all perils except those specifically excluded — typically flood, earthquake, war, nuclear hazard, and government action. Special form provides broader protection and is the standard you should require from tenants.

On a certificate, you may see "Special" or "All Risk" in the property coverage section, indicating special form coverage. "Basic" or "Broad" indicates a more limited named peril policy. For tenants occupying significant space or with valuable improvements, require special form coverage to avoid gaps from unnamed perils.`,
      },
      {
        id: 'tenant-vs-landlord',
        title: 'Tenant Property Insurance vs. Building Coverage',
        content: `One of the most common points of confusion in commercial property management is the boundary between the landlord's building coverage and the tenant's property coverage. Understanding this boundary is essential for setting the right insurance requirements in your leases.

**What the landlord's policy covers:**

Your building insurance (commercial property policy) covers the structure itself — walls, roof, foundation, common area finishes, building systems (HVAC, plumbing, electrical), elevators, and permanently installed fixtures that are part of the base building. It also covers common area contents that you own: lobby furniture, maintenance equipment, and landscaping.

**What the tenant's policy should cover:**

The tenant is responsible for insuring everything they bring into or add to the space:

- **Business personal property** — All movable property the tenant owns or is responsible for: furniture, equipment, inventory, supplies, computers, signage, decorations.
- **Tenant improvements and betterments** — All modifications the tenant makes to the space: custom build-outs, kitchen installations, specialized flooring, additional walls or partitions, lighting upgrades, and technology infrastructure.
- **Business income / extra expense** — The tenant's lost income and additional costs incurred while their space is being restored after a covered loss.

**The gray area: who covers what after a loss?**

The most contentious post-loss disputes arise over tenant improvements. If a tenant installs $300K in custom improvements and a fire destroys them, who pays to rebuild? If the tenant has tenant improvement coverage on their property policy, their insurer pays. If the tenant does not carry this coverage, they may argue that the improvements became part of the building and should be covered by your building policy. Your building policy likely excludes tenant improvements made at the tenant's expense. The result is a coverage gap, a dispute, and a delayed rebuild.

**How to prevent this:**

Your lease should clearly state that the tenant is responsible for insuring their own improvements and betterments. Your COI requirements should include tenant property insurance with a limit adequate to cover the value of their improvements plus their business personal property. Review the tenant's certificate at lease signing and at every renewal to confirm coverage is in force.`,
      },
      {
        id: 'inland-marine-builders-risk',
        title: 'Inland Marine and Builders Risk Insurance',
        content: `Inland marine insurance is one of the most misunderstood coverage types in commercial property management. Despite the name, it has nothing to do with waterways — the term is a historical artifact from maritime insurance. Inland marine covers property that is mobile, in transit, or at temporary locations — property that does not fit neatly into a standard property policy tied to a fixed location.

**Inland marine coverage**

Inland marine policies cover specific categories of movable property:

- **Contractors' equipment and tools** — Heavy equipment, power tools, scaffolding, and specialized construction tools that move between job sites. A standard property policy covers property at a fixed location; inland marine covers it wherever it goes. If a contractor's $50K excavator is stolen from your job site, their inland marine policy pays — not their property policy and not your building policy.
- **Property in transit** — Goods, materials, and equipment being transported from one location to another. A vendor transporting $200K in HVAC units to your property for installation has inland marine covering those units while in transit.
- **Installation floater** — Covers materials and equipment during the installation process, from the time they arrive at the job site until the installation is complete and accepted. This fills the gap between the manufacturer's coverage (which typically ends at delivery) and the building owner's coverage (which begins at acceptance).
- **Electronic data processing (EDP) equipment** — Servers, networking equipment, and other technology that may be covered under an inland marine policy rather than a standard property policy.

**Builders risk insurance**

Builders risk (also called course of construction insurance) covers a building and materials during construction or renovation. It is a specialized form of property insurance that covers the structure being built, materials on-site, and materials in transit to the site against damage from fire, wind, theft, vandalism, and other perils.

For renovation and construction projects on your property, builders risk coverage is essential. The question is who carries it — you or the contractor. Common arrangements include:

- **Owner-provided builders risk** — You purchase a builders risk policy covering the project value. This is common for large renovations where you want to control the coverage terms.
- **Contractor-provided builders risk** — The GC purchases builders risk as part of their insurance package. This is common for contractor-led projects where the GC manages all aspects of construction insurance.

Whichever arrangement you use, verify that builders risk coverage is in place before construction begins, that the limit reflects the total completed value of the project (not just the current construction cost), and that the policy covers materials in transit and at temporary storage locations.`,
      },
      {
        id: 'typical-limits',
        title: 'Typical Limits by Tenant and Vendor Type',
        content: `Property insurance limits should reflect the actual value of the tenant's or vendor's property at risk. Unlike liability insurance (where limits reflect potential claim severity), property insurance limits should match the replacement cost of the covered property.

**Tenant property insurance limits:**

| Tenant Type | BPP Limit | Improvements Limit | Notes |
|---|---|---|---|
| Small retail (under 2,000 sq ft) | $50,000–$100,000 | $50,000–$100,000 | Inventory-dependent; jewelry, electronics higher |
| Large retail (over 2,000 sq ft) | $100,000–$500,000 | $100,000–$250,000 | Scale with inventory value |
| Restaurant / food service | $150,000–$500,000 | $100,000–$250,000 | Commercial kitchen equipment is expensive |
| General office | $50,000–$150,000 | $50,000–$100,000 | Furniture, computers, modest build-out |
| Technology / data center tenant | $250,000–$1,000,000+ | $100,000–$500,000 | Server equipment, UPS systems, specialized cooling |
| Medical / dental office | $250,000–$750,000 | $150,000–$500,000 | Specialized equipment, build-out costs |
| Industrial / warehouse | $100,000–$500,000+ | $50,000–$200,000 | Inventory and equipment dependent |
| Salon / spa | $50,000–$150,000 | $50,000–$150,000 | Specialized equipment and fixtures |

**Vendor inland marine / equipment limits:**

| Vendor Type | Equipment Limit | Notes |
|---|---|---|
| General contractor | $100,000–$500,000 | Tools, scaffolding, temporary structures |
| Excavation / grading | $250,000–$1,000,000+ | Heavy equipment (excavators, loaders) |
| Electrical contractor | $50,000–$200,000 | Tools, testing equipment, wire/cable stock |
| HVAC contractor | $50,000–$250,000 | Units in transit, installation materials |
| Landscaping | $25,000–$100,000 | Mowers, trailers, hand tools |

**Replacement cost vs. actual cash value**

Require replacement cost valuation, not actual cash value (ACV). Replacement cost pays the full cost to replace damaged property with new property of like kind and quality. ACV deducts depreciation — meaning a 5-year-old commercial oven worth $40K new would only pay out $20K–$25K under ACV after depreciation. If a tenant carries ACV coverage and suffers a major loss, the depreciation gap may prevent them from fully restoring their space, delaying their reopening and potentially leading to a lease default.`,
      },
      {
        id: 'business-interruption',
        title: 'Business Interruption Coverage',
        content: `Business interruption insurance (also called business income coverage) pays for the tenant's lost income and continuing expenses while their business is shut down due to a covered property loss. For property managers, requiring business interruption coverage from tenants serves two purposes: it protects the tenant's ability to continue paying rent during restoration, and it reduces the likelihood of lease default after a loss.

**What business interruption covers:**

- **Lost net income** — The income the tenant would have earned during the restoration period, based on historical financial records.
- **Continuing expenses** — Fixed costs that continue even while the business is closed: rent, loan payments, employee salaries (to retain key staff), insurance premiums, and utilities.
- **Extra expense** — Additional costs incurred to minimize the shutdown period: renting temporary space, expediting repairs, leasing replacement equipment. Extra expense coverage is sometimes included in business interruption and sometimes written as a separate coverage.

**Why it matters for property managers:**

After a significant loss, the restoration period for a commercial tenant can range from weeks to months. A restaurant after a kitchen fire may be closed for 3–6 months. A retail store after flood damage may be closed for 2–4 months. During that time, the tenant has no revenue but still owes rent under their lease. Without business interruption coverage, the tenant may default on rent or seek to terminate the lease early.

Business interruption coverage gives the tenant a financial bridge through the restoration period. Their insurer pays the lost income, the tenant continues paying rent, and the lease survives the loss. This protects your rental income stream and avoids the cost of finding a replacement tenant.

**When to require it:**

Business interruption coverage should be required from tenants with significant build-outs or specialized spaces that would take a long time to restore. Restaurants, medical offices, data center tenants, and manufacturing or industrial tenants are all candidates. For small office tenants with minimal build-out who could relocate quickly to temporary space, business interruption is less critical — though still recommended.

**Typical coverage period:**

Business interruption coverage is measured in months of coverage, not a dollar limit. Require a minimum of 12 months of business interruption coverage. Tenants with complex build-outs (restaurants, medical, industrial) should carry 18–24 months to account for permitting delays, equipment lead times, and contractor availability during restoration.`,
      },
      {
        id: 'verify-acord-25',
        title: 'How to Verify Property Coverage on an ACORD 25',
        content: `Property insurance for tenants is typically evidenced on an ACORD 28 (Evidence of Commercial Property Insurance) rather than the ACORD 25 (Certificate of Liability Insurance). The ACORD 25 is designed for liability coverages — GL, auto, workers comp, and umbrella. Property coverage may appear on the ACORD 25 in a limited capacity, but for complete property insurance verification, request an ACORD 28 from the tenant's insurance agent.

**Where property information appears on the ACORD 25:**

The ACORD 25 has a section in the lower-left area that may include property coverage information. Some certificate issuers list property coverage details here, including:
- Policy type (Special, Basic, Broad)
- Property coverage limits
- Deductible amounts
- Covered location address

However, this section is limited and may not include tenant improvement limits, business interruption details, or inland marine coverage. For tenants, always request the ACORD 28 in addition to the ACORD 25.

**What to verify on the ACORD 28:**

- **Covered property types** — Business personal property, tenant improvements and betterments, and business income should each be listed as covered with separate limits.
- **Coverage form** — Special form (all-risk) is preferred over basic or broad form.
- **Valuation method** — Replacement cost is preferred over actual cash value.
- **Per-location limits** — If the tenant operates multiple locations, verify that the limit shown is specific to your property, not an aggregate across all locations (unless the total limit is sufficient).
- **Business interruption period** — If business income coverage is listed, the form may show a coverage limit or a coverage period (12 months, 18 months, etc.).
- **Deductible** — Note the deductible amount. A tenant with a $25K deductible on property coverage may not file small claims, which means minor losses are self-funded.

**Inland marine and builders risk verification:**

Inland marine coverage for vendors (contractors' equipment, property in transit) and builders risk coverage for construction projects do not have dedicated sections on either the ACORD 25 or ACORD 28. They are typically evidenced by:
- A notation in the Description of Operations section of the ACORD 25
- A separate ACORD 29 (Evidence of Property Insurance for the Inland Marine Policy)
- A standalone builders risk certificate issued by the insurer

For construction projects, request a separate builders risk certificate that shows the project address, coverage limit (total completed value), covered perils, and policy period matching the construction timeline. Do not rely on the ACORD 25 to evidence builders risk or inland marine coverage — the form is not designed for it.

**Loss payee and mortgage holder considerations:**

If your property has a lender, the lender may require loss payee status on the tenant's property policy. This ensures the lender is notified of policy changes and receives claim proceeds to the extent of their interest. Loss payee status appears on the ACORD 28 in a dedicated section. Verify that the lender's name and loan number are listed correctly if this is a lease or loan requirement.`,
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
      { slug: 'professional-liability', name: 'Professional Liability' },
    ],
  },
];

export function getCoverageGuide(slug: string): CoverageGuide | undefined {
  return coverageGuides.find((g) => g.slug === slug);
}
