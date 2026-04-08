// ============================================================================
// Coverage Guide Data — substantive content for each coverage type
// Each guide is 1,500-2,500 words of hand-written expert content.
// ============================================================================

export interface CoverageGuide {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  sections: { heading: string; content: string }[];
  relatedSlugs: string[];
}

export const coverageGuides: CoverageGuide[] = [
  // ========================================================================
  // 1. GENERAL LIABILITY
  // ========================================================================
  {
    slug: 'general-liability',
    title: 'General Liability Insurance Requirements: What to Require from Vendors & Contractors',
    metaTitle: 'General Liability Insurance Requirements for Vendors & Contractors | SmartCOI',
    metaDescription: 'Complete guide to general liability insurance requirements. Learn standard GL limits by industry, additional insured endorsements, common gaps, and how to verify coverage on an ACORD 25 form.',
    relatedSlugs: ['workers-compensation', 'auto-liability', 'umbrella-excess-liability'],
    sections: [
      {
        heading: 'What General Liability Insurance Covers',
        content: `Commercial General Liability (CGL) insurance is the foundation of any vendor or contractor insurance program. It covers third-party claims for bodily injury, property damage, and personal/advertising injury arising from the insured's operations, products, or premises.

In practical terms, GL is what pays when a contractor's employee damages your property during a repair, when a vendor's delivery driver injures a visitor in your parking lot, or when a cleaning crew leaves a wet floor that causes a slip-and-fall. Without verified GL coverage from every vendor working on your premises, the property owner or hiring organization absorbs these claims directly.

GL policies are written on either an "occurrence" or "claims-made" basis. Most standard vendor GL policies are occurrence-based, meaning they cover incidents that happen during the policy period regardless of when the claim is filed. This distinction matters — a claims-made policy only covers claims reported while the policy is active, creating potential gaps if the vendor switches carriers.`,
      },
      {
        heading: 'Standard GL Limits by Industry',
        content: `Coverage limits vary significantly by industry and vendor risk level. Here are standard minimums:

**Property Management:** $1,000,000 per occurrence / $2,000,000 aggregate for standard vendors. High-risk vendors (roofing, demolition, asbestos abatement) should carry $2,000,000/$4,000,000.

**Construction:** $2,000,000 per occurrence / $4,000,000 aggregate is standard for subcontractors. General contractors on large projects often require $5,000,000 aggregate. The higher limits reflect the elevated injury and property damage risk on construction sites.

**Logistics & Transportation:** $1,000,000/$2,000,000 is standard for warehouse vendors and facility service providers. Carriers typically need auto liability more than GL, but warehouse operations require solid GL coverage.

**Healthcare:** $1,000,000/$2,000,000 for facility vendors. Clinical service providers may need higher limits ($2,000,000/$4,000,000) due to patient safety exposure.

**Manufacturing:** $2,000,000/$4,000,000 for suppliers handling chemicals, heavy equipment, or hazardous materials. Standard suppliers can carry $1,000,000/$2,000,000.

These are minimums. If a vendor's work involves particularly high exposure — working at height, handling hazardous materials, operating heavy machinery near people — consider requiring higher limits or umbrella coverage on top of the GL policy.`,
      },
      {
        heading: 'Per-Occurrence vs. Aggregate Limits',
        content: `Every GL policy has two key limits that appear on the ACORD 25 certificate:

**Per-occurrence limit** is the maximum the insurer will pay for any single incident. If you require $1,000,000 per occurrence and a vendor causes a $1.5 million claim, the vendor's policy only covers the first $1 million — the remaining $500,000 becomes the vendor's (and potentially your) problem.

**General aggregate limit** is the total maximum the insurer will pay across all claims during the policy period (usually one year). A $2,000,000 aggregate means that once the vendor has had $2 million in total claims during the policy year, the coverage is exhausted — even if each individual claim was well under the per-occurrence limit.

Always require both. A vendor with a $1M per-occurrence limit but only a $1M aggregate has effectively half the coverage of a vendor with $1M/$2M. The standard ratio is 1:2 (per-occurrence to aggregate).

On the ACORD 25 form, look for these limits in the "Commercial General Liability" section. The "Each Occurrence" field shows the per-occurrence limit. The "General Aggregate" field shows the aggregate. Make sure both meet your minimums.`,
      },
      {
        heading: 'Additional Insured Endorsements',
        content: `Requiring vendors to name you as an "Additional Insured" on their GL policy is one of the most important — and most frequently missed — compliance requirements.

When you're listed as an additional insured, the vendor's GL policy extends coverage to you for claims arising from the vendor's work. Without it, you'd need to file a claim against the vendor directly and hope they pay — a much slower and less certain process.

The key endorsements to look for on the ACORD 25 and endorsement pages:

**CG 20 10** — Additional Insured – Owners, Lessees or Contractors. This is the standard endorsement for ongoing operations. It covers claims arising from the vendor's current work at your location.

**CG 20 37** — Additional Insured – Completed Operations. This covers claims that arise after the vendor's work is finished. Critical for construction — if a contractor installs plumbing that fails six months later and causes water damage, CG 20 37 is what protects you.

**What to verify:** The additional insured endorsement should list your organization's exact legal entity name (not just "the building" or "the landlord"). It should reference your specific property or location. And for construction work, always require both CG 20 10 and CG 20 37.

SmartCOI's AI extraction automatically identifies additional insured endorsements on uploaded certificates, checking for CG 20 10 and CG 20 37 form numbers on the endorsement pages.`,
      },
      {
        heading: 'Common GL Coverage Gaps',
        content: `Even when a vendor provides a certificate showing adequate GL limits, there are several common gaps that can leave you exposed:

**Completed operations exclusion.** Some GL policies exclude coverage for claims arising after the vendor's work is completed. This is a major gap for construction and renovation work — the most expensive claims often surface months after the project ends.

**Contractual liability exclusion.** Your contract with the vendor likely includes indemnification clauses. If the vendor's GL policy excludes contractual liability, those indemnification clauses have no insurance backing.

**XCU exclusion (Explosion, Collapse, Underground).** Policies for excavation, demolition, or blasting contractors may exclude these specific perils. If your vendor is doing work that involves any of these risks, verify the XCU exclusion has been removed.

**Aggregate already eroded.** A vendor with $2M aggregate who has already had $1.5M in claims this year effectively only has $500K remaining for any incident at your property. You can ask for evidence of remaining aggregate, though few organizations do this consistently.

**Wrong entity name.** The certificate names "ABC Property Management" but your legal entity is "ABC Property Management, LLC." This seemingly minor difference can void the additional insured endorsement when a claim is filed.`,
      },
      {
        heading: 'How to Verify GL Coverage on an ACORD 25',
        content: `The ACORD 25 (Certificate of Liability Insurance) is the standard form used to evidence GL coverage. Here's where to look:

**Section: Commercial General Liability**
- Policy Number — verify it matches the endorsement pages
- Policy Effective and Expiration dates — confirm coverage is current
- Each Occurrence limit — your per-occurrence minimum
- General Aggregate — your aggregate minimum
- Products/Completed Operations aggregate — important for construction vendors
- "Addl Insd" checkbox — should be marked if you require additional insured status
- "Subr Wvd" checkbox — should be marked if you require waiver of subrogation

**Description of Operations box** (bottom of the form):
- Should reference your property or project
- Should name your entity as Additional Insured
- May reference specific endorsement form numbers (CG 20 10, CG 20 37)

**Endorsement pages** (pages 2+):
- Look for CG 20 10 and CG 20 37 endorsement forms
- Verify your entity name appears on the endorsement schedule
- Check the edition date — older editions may provide narrower coverage

SmartCOI's two-pass AI extraction reads both the ACORD 25 front page and all endorsement pages, automatically flagging missing additional insured endorsements and verifying form numbers.`,
      },
    ],
  },
  // ========================================================================
  // 2. WORKERS' COMPENSATION
  // ========================================================================
  {
    slug: 'workers-compensation',
    title: "Workers' Compensation Insurance Requirements for Vendors & Contractors",
    metaTitle: "Workers' Compensation Insurance Requirements for Vendors | SmartCOI",
    metaDescription: "Complete guide to workers' compensation insurance requirements. Learn statutory limits, employers' liability, waiver of subrogation, state-specific rules, and how to handle sole proprietor exemptions.",
    relatedSlugs: ['general-liability', 'umbrella-excess-liability', 'auto-liability'],
    sections: [
      {
        heading: "What Workers' Compensation Covers",
        content: `Workers' compensation insurance covers medical expenses, lost wages, rehabilitation costs, and death benefits for employees who are injured or become ill as a result of their job duties. In most states, employers are legally required to carry WC coverage — it's not optional.

For organizations that hire vendors and contractors, verifying WC coverage is critical because of a legal doctrine called "statutory employer" liability. If a vendor's employee is injured on your premises and the vendor doesn't have WC coverage, you — as the hiring entity — may be considered the statutory employer and become directly liable for the worker's medical bills and lost wages.

This is not a theoretical risk. It happens regularly in construction, property management, and manufacturing. A plumber's apprentice falls off a ladder at your building. The plumber's WC policy lapsed last month. The injured worker files a claim against you. Without verified WC coverage from every vendor, you're exposed to these claims with no insurance to absorb them.`,
      },
      {
        heading: 'Statutory Limits and What They Mean',
        content: `Unlike GL or auto insurance, workers' compensation doesn't have dollar limits that you set. WC coverage is "statutory" — meaning it pays whatever the state law requires for injured workers, with no cap per claim.

When you see "Statutory" listed under WC limits on an ACORD 25, it means the policy pays benefits as required by the state's workers' compensation statute. The actual dollar amounts (weekly wage replacement percentages, medical payment caps, death benefits) are determined by state law, not the insurance policy.

This is why you can't require a "$1 million workers' comp limit" — the concept doesn't apply. Instead, you verify that the vendor has an active WC policy in the state(s) where work will be performed. The certificate should show:

- **Part A (Workers Compensation):** Statutory limits
- **Part B (Employers Liability):** Dollar limits (this is where you can set minimums)
- **State coverage:** The policy must cover the state where work is being done`,
      },
      {
        heading: "Employers' Liability: The Limits That Matter",
        content: `While WC itself is statutory, every WC policy includes an "Employers' Liability" (EL) section (Part B on the policy) that does have dollar limits — and these are where you should set minimums.

Employers' liability covers lawsuits by employees (or their families) against the employer for workplace injuries that go beyond the standard WC benefits. Common scenarios include negligence claims, third-party-over actions, and loss of consortium claims by spouses.

**Standard EL limits:** $500,000 each accident / $500,000 disease (each employee) / $500,000 disease (policy limit). This is the baseline minimum for most vendor relationships.

**High-risk EL limits:** $1,000,000 / $1,000,000 / $1,000,000. Require this for vendors doing inherently dangerous work: construction at height, heavy equipment operation, work with hazardous chemicals, demolition, or electrical work.

On the ACORD 25, Employers' Liability limits appear in the Workers Compensation section under "E.L. Each Accident," "E.L. Disease - Each Employee," and "E.L. Disease - Policy Limit."`,
      },
      {
        heading: 'Waiver of Subrogation',
        content: `A waiver of subrogation prevents the vendor's WC insurance carrier from suing you to recover costs they paid for an employee's workplace injury that may have been partially your fault.

Here's the scenario: A vendor's employee is injured at your facility. The vendor's WC carrier pays the claim. The carrier then investigates and determines that a hazardous condition on your property contributed to the injury. Without a waiver of subrogation, the carrier can sue you ("subrogate") to recover the money they paid.

With a waiver of subrogation endorsement, the carrier waives this right. You're protected even if the injury was partially attributable to conditions at your property.

**When to require it:** Always, for every vendor. The waiver of subrogation is a standard endorsement that most carriers add at little or no cost. There's no good reason not to require it.

**How to verify:** On the ACORD 25, look for the "Subr Wvd" checkbox in the Workers Compensation section — it should be marked "Y." Also check the Description of Operations box for language like "Waiver of Subrogation in favor of [your entity name] applies."`,
      },
      {
        heading: 'State-Specific WC Requirements',
        content: `Workers' compensation laws vary by state, and there are a few quirks to be aware of:

**Monopolistic states:** Ohio, North Dakota, Washington, and Wyoming require employers to purchase WC through a state fund — private insurance is not available. Vendors in these states will show a state fund certificate instead of a standard insurance carrier certificate.

**Texas:** WC is not mandatory. Employers can opt out (becoming "non-subscribers"), but they lose certain legal protections. If you hire a Texas vendor who doesn't carry WC, you may want to require them to sign a waiver acknowledging the additional risk.

**Multi-state operations:** If a vendor operates in multiple states, their WC policy must include coverage for every state where work will be performed. The ACORD 25 should list the applicable states. A vendor with WC in California but not Nevada cannot legally send workers to your Nevada property.

**Maritime and federal workers:** Certain workers (longshoremen, harbor workers, federal employees, railroad workers) are covered under federal programs like the Jones Act or FELA, not state WC. This is uncommon for most vendor relationships but relevant in logistics and port operations.`,
      },
      {
        heading: 'Handling Sole Proprietors and Exemptions',
        content: `One of the most common compliance headaches is the vendor who says "I don't need workers' comp — I'm a sole proprietor with no employees."

In many states, sole proprietors and independent contractors can exempt themselves from WC requirements. But this creates a risk for you: if the sole proprietor is injured on your property and doesn't have WC, they may file a claim against your liability insurance instead — especially if they can argue they were acting as your "employee" under the state's definition.

**Best practices for handling exemptions:**

1. **Require a signed waiver.** If a sole proprietor is exempt from WC in their state, have them sign a waiver acknowledging they do not carry WC and releasing you from WC-related claims.

2. **Verify the exemption.** Some states require sole proprietors to file a formal exemption with the state. Request a copy of the exemption certificate.

3. **Consider requiring WC anyway.** Many sole proprietors can purchase WC voluntarily. If the work involves any physical risk (construction, maintenance, cleaning), it's worth requiring coverage regardless of the exemption.

4. **Check for subcontractors.** A "sole proprietor" who brings helpers or subcontractors to the job may be legally required to carry WC for those workers — even if the proprietor themselves is exempt.`,
      },
      {
        heading: "How to Verify WC Coverage on an ACORD 25",
        content: `On the ACORD 25 certificate, Workers' Compensation appears in its own section:

**Workers Compensation and Employers' Liability section:**
- Carrier name and policy number
- Policy effective and expiration dates
- "Statutory" should appear under WC limits (Part A)
- E.L. Each Accident, E.L. Disease - Each Employee, E.L. Disease - Policy Limit — these are your EL minimums
- "Subr Wvd" checkbox — should be "Y" if you require waiver of subrogation
- State coverage indicator — verify the correct state(s) are listed

**What to watch for:**
- Expired policies — WC is the coverage most likely to lapse, especially for small vendors
- Wrong state — the policy must cover the state where work is performed
- Low EL limits — many default policies have $100,000 EL limits, far below the $500,000 minimum most organizations require
- Missing waiver of subrogation — often omitted unless specifically requested

SmartCOI's AI extraction identifies WC coverage on the ACORD 25, verifies statutory limits, extracts EL amounts, and checks the waiver of subrogation checkbox automatically.`,
      },
    ],
  },
];

export function getCoverageGuide(slug: string): CoverageGuide | undefined {
  return coverageGuides.find((g) => g.slug === slug);
}

export function getAllCoverageGuideSlugs(): string[] {
  return coverageGuides.map((g) => g.slug);
}
