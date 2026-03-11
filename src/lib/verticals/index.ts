export interface VerticalData {
  slug: string;
  name: string;
  headline: string;
  description: string;
  metaDescription: string;
  painPoints: { title: string; description: string }[];
  solutions: { title: string; description: string }[];
  vendors: string[];
  testimonials: { quote: string; name: string; title: string }[];
  insuranceRequirementsSlug: string | null;
}

export const verticals: VerticalData[] = [
  {
    slug: 'multifamily',
    name: 'Multifamily & Apartment Communities',
    headline: 'COI Compliance Built for Multifamily Property Managers',
    description:
      'Multifamily properties have high vendor turnover, tenant insurance requirements, and a constant stream of renovation contractors. SmartCOI automates the compliance tracking that keeps your community protected.',
    metaDescription:
      'SmartCOI helps multifamily property managers automate COI compliance for vendors, tenants, and renovation contractors. Start free — no credit card required.',
    painPoints: [
      {
        title: 'High vendor turnover',
        description:
          'Multifamily properties cycle through maintenance vendors, landscapers, and contractors constantly. Each new vendor means new COIs to collect, verify, and track — and expired certificates pile up fast.',
      },
      {
        title: 'Tenant insurance requirements',
        description:
          'Tracking renters insurance and liability coverage across dozens or hundreds of units is tedious work. Lease renewals, move-ins, and policy changes create a constant churn of documents to manage.',
      },
      {
        title: 'Unit renovation contractors',
        description:
          'Every unit turnover and renovation brings short-term contractors who need insurance verification. Tracking one-off vendors alongside long-term service providers creates compliance gaps.',
      },
    ],
    solutions: [
      {
        title: 'Automated vendor & tenant tracking',
        description:
          'SmartCOI tracks both vendor COIs and tenant insurance in a single dashboard. Set coverage requirements once, and the system monitors compliance automatically.',
      },
      {
        title: 'Self-service vendor portal',
        description:
          'Send vendors a portal link where they upload their own COIs. AI extracts the data instantly — no more chasing paperwork or manually entering certificate details.',
      },
      {
        title: 'Expiration alerts & auto follow-up',
        description:
          'SmartCOI sends automated notifications before certificates expire and follows up with non-compliant vendors, so you never have an uncovered contractor on-site.',
      },
    ],
    vendors: [
      'Landscaping & grounds maintenance',
      'HVAC service companies',
      'Plumbing contractors',
      'Electrical contractors',
      'Pest control services',
      'Cleaning & janitorial',
      'Pool maintenance',
      'Elevator service companies',
      'Painting contractors',
      'Roofing companies',
    ],
    testimonials: [
      {
        quote: 'We manage 12 apartment communities with over 200 vendor relationships. SmartCOI cut our compliance tracking time from 15 hours a week to about 2.',
        name: 'Sarah M.',
        title: 'Regional Property Manager',
      },
      {
        quote: 'The tenant insurance tracking alone was worth it. We went from spreadsheets and reminder emails to automated compliance in a single afternoon.',
        name: 'James K.',
        title: 'Community Manager',
      },
      {
        quote: 'Our maintenance vendors actually prefer the upload portal. They send their COIs once, and we stop calling them every time something expires.',
        name: 'Linda T.',
        title: 'Operations Director',
      },
    ],
    insuranceRequirementsSlug: 'multifamily-apartments',
  },
  {
    slug: 'commercial-office',
    name: 'Commercial Office Buildings',
    headline: 'COI Compliance Built for Commercial Office Managers',
    description:
      'Commercial office buildings require ongoing compliance tracking for building service vendors, tenant build-out contractors, and property-level insurance. SmartCOI keeps your entire portfolio compliant.',
    metaDescription:
      'SmartCOI helps commercial office building managers automate COI compliance for service vendors, tenant contractors, and property-level insurance. Start free.',
    painPoints: [
      {
        title: 'Complex vendor ecosystems',
        description:
          'Office buildings rely on a wide range of service vendors — from HVAC and elevator maintenance to security and janitorial. Each vendor has different insurance requirements, and managing them across a portfolio multiplies the complexity.',
      },
      {
        title: 'Tenant build-out contractors',
        description:
          'When tenants renovate their spaces, their contractors need proper insurance. Coordinating COI collection for tenant-hired contractors you don\'t directly manage is a compliance headache.',
      },
      {
        title: 'Portfolio-wide visibility',
        description:
          'Managing compliance across multiple office buildings means scattered spreadsheets, inconsistent standards, and no single view of your portfolio\'s compliance status.',
      },
    ],
    solutions: [
      {
        title: 'Multi-property dashboard',
        description:
          'See compliance status across your entire office portfolio in one view. Drill into any property to see vendor details, expiring certificates, and compliance gaps.',
      },
      {
        title: 'Standardized compliance templates',
        description:
          'Set coverage requirements once and apply them across all properties. Ensure every vendor meets the same standards whether they work in one building or ten.',
      },
      {
        title: 'Bulk upload with AI extraction',
        description:
          'Upload stacks of COIs at once. AI extracts vendor names, coverage types, limits, and dates in seconds — no manual data entry required.',
      },
    ],
    vendors: [
      'Janitorial & cleaning services',
      'HVAC maintenance companies',
      'Elevator service providers',
      'Security companies',
      'Fire protection services',
      'Electrical contractors',
      'Plumbing contractors',
      'Window cleaning services',
      'Parking management companies',
      'General contractors (tenant build-outs)',
    ],
    testimonials: [
      {
        quote: 'We manage 8 Class A office buildings. SmartCOI gave us portfolio-wide visibility into vendor compliance for the first time. No more per-building spreadsheets.',
        name: 'Michael R.',
        title: 'VP of Property Management',
      },
      {
        quote: 'Tenant build-out season used to mean a flood of contractor COIs to process. Now vendors upload directly and SmartCOI handles the rest.',
        name: 'Patricia W.',
        title: 'Building Manager',
      },
      {
        quote: 'The compliance templates saved us weeks of setup. We configured our requirements once and rolled them out across all properties in an afternoon.',
        name: 'David L.',
        title: 'Director of Operations',
      },
    ],
    insuranceRequirementsSlug: 'office-buildings',
  },
  {
    slug: 'retail-centers',
    name: 'Retail Shopping Centers',
    headline: 'COI Compliance Built for Retail Center Managers',
    description:
      'Retail centers juggle tenant insurance, common area maintenance vendors, and seasonal contractors. SmartCOI automates compliance tracking so you can focus on keeping your center thriving.',
    metaDescription:
      'SmartCOI helps retail center managers automate COI compliance for tenants, CAM vendors, and seasonal contractors. Start free — no credit card required.',
    painPoints: [
      {
        title: 'High tenant insurance volume',
        description:
          'Retail centers can have dozens of tenants, each with their own insurance requirements and renewal cycles. Tracking every tenant\'s liability, property, and workers\' comp coverage manually is unsustainable.',
      },
      {
        title: 'Seasonal and event contractors',
        description:
          'Holiday displays, parking lot maintenance, snow removal, and special events bring temporary contractors who need COI verification — often on short notice with tight deadlines.',
      },
      {
        title: 'CAM vendor compliance',
        description:
          'Common area maintenance vendors — landscaping, cleaning, security — need consistent insurance coverage year-round. Lapses in coverage expose the entire center to liability.',
      },
    ],
    solutions: [
      {
        title: 'Tenant & vendor tracking in one platform',
        description:
          'SmartCOI tracks both tenant insurance and vendor COIs in a single dashboard. Set different compliance templates for tenants vs. vendors and manage everything in one place.',
      },
      {
        title: 'Fast onboarding for short-term vendors',
        description:
          'Send a portal link, vendor uploads their COI, AI extracts everything in seconds. Perfect for seasonal contractors who need quick compliance clearance.',
      },
      {
        title: 'Automated renewal tracking',
        description:
          'SmartCOI monitors every certificate expiration and sends automated follow-up notifications, ensuring no tenant or vendor lapses go unnoticed.',
      },
    ],
    vendors: [
      'Landscaping & snow removal',
      'Security services',
      'Janitorial & pressure washing',
      'Parking lot maintenance',
      'HVAC service companies',
      'Electrical contractors',
      'Signage companies',
      'General contractors',
      'Holiday display installers',
      'Waste management services',
    ],
    testimonials: [
      {
        quote: 'With 45 tenants and 20+ service vendors, we were drowning in certificate paperwork. SmartCOI turned a full-time job into a quick daily check.',
        name: 'Karen S.',
        title: 'Center Manager',
      },
      {
        quote: 'Seasonal contractor compliance used to be our biggest headache. Now we send a portal link and they\'re cleared in minutes, not days.',
        name: 'Robert H.',
        title: 'Operations Manager',
      },
      {
        quote: 'The automated expiration alerts alone save us from weekly compliance audits. We only intervene when something actually needs attention.',
        name: 'Jennifer P.',
        title: 'Regional Director',
      },
    ],
    insuranceRequirementsSlug: 'retail-centers',
  },
  {
    slug: 'industrial',
    name: 'Industrial & Warehouse Properties',
    headline: 'COI Compliance Built for Industrial Property Managers',
    description:
      'Industrial properties face unique risks from heavy equipment, hazardous materials, and specialized contractors. SmartCOI ensures every vendor meets the higher insurance thresholds your properties require.',
    metaDescription:
      'SmartCOI helps industrial and warehouse property managers automate COI compliance for high-risk vendors and specialized contractors. Start free.',
    painPoints: [
      {
        title: 'Higher coverage requirements',
        description:
          'Industrial properties often require higher liability limits and specialized coverages like pollution liability or equipment breakdown. Verifying these non-standard requirements manually is time-consuming and error-prone.',
      },
      {
        title: 'Specialized contractor compliance',
        description:
          'Dock door repair, crane operators, hazmat handlers — industrial properties use specialized contractors whose insurance needs differ significantly from standard service vendors.',
      },
      {
        title: 'Multi-tenant warehouse compliance',
        description:
          'Industrial parks and multi-tenant warehouses need to track tenant insurance alongside vendor COIs, each with different coverage thresholds based on their operations.',
      },
    ],
    solutions: [
      {
        title: 'Configurable compliance templates',
        description:
          'Set custom coverage requirements for different vendor types — higher limits for high-risk contractors, standard requirements for service vendors. SmartCOI checks each COI against the right template.',
      },
      {
        title: 'AI extraction for all coverage types',
        description:
          'SmartCOI\'s AI extracts all coverage types from ACORD certificates including general liability, workers\' comp, commercial auto, umbrella, and specialty coverages.',
      },
      {
        title: 'Compliance dashboard with gap alerts',
        description:
          'See which vendors are non-compliant at a glance. Get automatic notifications when coverage lapses or falls below required thresholds.',
      },
    ],
    vendors: [
      'Dock & loading equipment repair',
      'HVAC & industrial ventilation',
      'Fire suppression systems',
      'Electrical contractors',
      'Roofing companies',
      'Paving & lot maintenance',
      'Waste & recycling services',
      'Security services',
      'Pest control',
      'General contractors',
    ],
    testimonials: [
      {
        quote: 'Our industrial park has 30 tenants and vendors with very different insurance requirements. SmartCOI lets us set custom templates for each category and track everything automatically.',
        name: 'Tom B.',
        title: 'Industrial Park Manager',
      },
      {
        quote: 'We used to spend hours manually checking that contractors met our higher liability thresholds. Now SmartCOI flags non-compliant vendors instantly.',
        name: 'Angela F.',
        title: 'Risk & Compliance Manager',
      },
      {
        quote: 'The bulk upload feature was a game-changer for our annual vendor re-certification. We uploaded 80 COIs and had results in minutes.',
        name: 'Steve C.',
        title: 'Facility Director',
      },
    ],
    insuranceRequirementsSlug: 'industrial-warehouses',
  },
  {
    slug: 'mixed-use',
    name: 'Mixed-Use Developments',
    headline: 'COI Compliance Built for Mixed-Use Property Managers',
    description:
      'Mixed-use properties combine residential, retail, and office — each with different insurance requirements. SmartCOI handles the complexity so you don\'t have to manage three separate compliance systems.',
    metaDescription:
      'SmartCOI helps mixed-use development managers automate COI compliance across residential, retail, and office components. Start free — no credit card required.',
    painPoints: [
      {
        title: 'Multiple compliance standards',
        description:
          'Residential tenants, retail tenants, and office tenants each have different insurance requirements. Managing three sets of compliance rules in one property is exponentially complex.',
      },
      {
        title: 'Shared-space vendor coordination',
        description:
          'Vendors who serve common areas, parking structures, and shared amenities need coverage that accounts for the mixed-use nature of the property — residential-grade and commercial-grade simultaneously.',
      },
      {
        title: 'Higher vendor volume',
        description:
          'Mixed-use properties need more vendors than single-use buildings: residential maintenance, retail fit-out contractors, office building services, plus common area vendors. The COI volume compounds quickly.',
      },
    ],
    solutions: [
      {
        title: 'Multiple compliance templates',
        description:
          'Create separate compliance templates for residential tenants, retail tenants, office tenants, and vendors. Assign the right template to each entity and SmartCOI handles the rest.',
      },
      {
        title: 'Unified compliance dashboard',
        description:
          'See compliance status across all property components — residential, retail, and office — in a single dashboard. No switching between systems or spreadsheets.',
      },
      {
        title: 'Scalable for complex properties',
        description:
          'SmartCOI handles high vendor and tenant volumes without slowing down. Bulk upload COIs, automate follow-ups, and let AI do the extraction work.',
      },
    ],
    vendors: [
      'General contractors',
      'HVAC & mechanical',
      'Elevator service',
      'Landscaping & grounds',
      'Security services',
      'Janitorial services',
      'Parking management',
      'Plumbing contractors',
      'Fire protection services',
      'Signage & wayfinding',
    ],
    testimonials: [
      {
        quote: 'Our mixed-use development has retail on the ground floor, offices above, and 200 residential units. SmartCOI is the first tool that handles all three compliance standards in one place.',
        name: 'Rachel M.',
        title: 'Development Manager',
      },
      {
        quote: 'We were using separate spreadsheets for residential tenant insurance and commercial vendor COIs. SmartCOI replaced both with one automated system.',
        name: 'Chris D.',
        title: 'Property Manager',
      },
      {
        quote: 'The ability to set different compliance templates for different tenant types saved us from building a custom solution. It just works out of the box.',
        name: 'Nicole H.',
        title: 'Asset Manager',
      },
    ],
    insuranceRequirementsSlug: 'mixed-use-properties',
  },
  {
    slug: 'hoa',
    name: 'HOA & Community Associations',
    headline: 'COI Compliance Built for HOA & Community Association Managers',
    description:
      'HOAs and community associations hire dozens of vendors for common area maintenance, pool services, and landscaping. SmartCOI automates the COI tracking that protects your association and its members.',
    metaDescription:
      'SmartCOI helps HOA and community association managers automate COI compliance for service vendors and contractors. Start free — no credit card required.',
    painPoints: [
      {
        title: 'Board liability concerns',
        description:
          'HOA board members face personal liability if an uninsured vendor causes damage or injury on community property. Tracking vendor insurance is a fiduciary responsibility, not just paperwork.',
      },
      {
        title: 'Volunteer-managed compliance',
        description:
          'Many HOAs rely on volunteer board members or part-time managers to track vendor insurance. Without dedicated staff, compliance tracking falls through the cracks.',
      },
      {
        title: 'Seasonal vendor rotation',
        description:
          'Pool companies in summer, snow removal in winter, holiday lighting — HOAs constantly rotate seasonal vendors, each needing insurance verification before they start work.',
      },
    ],
    solutions: [
      {
        title: 'Simple enough for volunteer boards',
        description:
          'SmartCOI\'s intuitive interface means board members don\'t need training. Upload COIs, set requirements, and the system handles the rest — compliance tracking anyone can manage.',
      },
      {
        title: 'Vendor self-service portal',
        description:
          'Send vendors a link to upload their own certificates. AI verifies coverage instantly. No back-and-forth emails, no manual data entry.',
      },
      {
        title: 'Automated expiration management',
        description:
          'SmartCOI notifies you and your vendors before certificates expire. Automated follow-ups ensure vendors renew on time without board members chasing paperwork.',
      },
    ],
    vendors: [
      'Landscaping & lawn care',
      'Pool maintenance companies',
      'Snow removal services',
      'Painting contractors',
      'Roofing companies',
      'Pest control services',
      'Tree trimming services',
      'Paving & concrete',
      'Fencing contractors',
      'Holiday lighting installers',
    ],
    testimonials: [
      {
        quote: 'As a volunteer board president, I don\'t have time to chase vendor insurance certificates. SmartCOI automated the entire process for our 150-home community.',
        name: 'Barbara W.',
        title: 'HOA Board President',
      },
      {
        quote: 'We had an incident with an uninsured landscaping company that cost our association $15,000. SmartCOI ensures that never happens again.',
        name: 'Mark J.',
        title: 'Community Association Manager',
      },
      {
        quote: 'At $79 a month, SmartCOI costs less than one hour of our attorney\'s time. The liability protection alone makes it worthwhile.',
        name: 'Diane L.',
        title: 'HOA Treasurer',
      },
    ],
    insuranceRequirementsSlug: null,
  },
  {
    slug: 'property-management-companies',
    name: 'Property Management Companies',
    headline: 'COI Compliance Built for Property Management Firms',
    description:
      'Third-party property management companies manage multiple clients, each with their own properties, vendors, and compliance standards. SmartCOI gives you portfolio-wide visibility without portfolio-wide headaches.',
    metaDescription:
      'SmartCOI helps property management companies automate COI compliance across multiple clients and property types. Start free — no credit card required.',
    painPoints: [
      {
        title: 'Multi-client complexity',
        description:
          'Each client has different properties, vendor relationships, and insurance requirements. Managing compliance across multiple clients with different standards is exponentially complex.',
      },
      {
        title: 'Scaling compliance operations',
        description:
          'As your firm takes on new clients and properties, compliance tracking doesn\'t scale linearly — it compounds. Each new property adds vendors, tenants, and certificates to manage.',
      },
      {
        title: 'Demonstrating value to owners',
        description:
          'Property owners expect professional compliance management. Without clear reporting and documentation, it\'s hard to demonstrate the risk mitigation value you provide.',
      },
    ],
    solutions: [
      {
        title: 'Portfolio-wide compliance dashboard',
        description:
          'See compliance status across all clients and properties in one view. Drill into any property for detailed vendor and tenant compliance data.',
      },
      {
        title: 'Standardized processes, custom requirements',
        description:
          'Use a consistent compliance workflow across your entire portfolio while customizing requirements for each client\'s specific needs.',
      },
      {
        title: 'Scalable automation',
        description:
          'SmartCOI scales with your firm. Bulk upload, AI extraction, automated notifications, and vendor portals mean adding a new client doesn\'t mean adding compliance staff.',
      },
    ],
    vendors: [
      'HVAC service companies',
      'Landscaping services',
      'Janitorial & cleaning',
      'Electrical contractors',
      'Plumbing contractors',
      'General contractors',
      'Security companies',
      'Pest control services',
      'Elevator service',
      'Fire protection & sprinkler',
    ],
    testimonials: [
      {
        quote: 'We manage properties for 8 different owners across 25 buildings. SmartCOI replaced a patchwork of spreadsheets with one unified compliance system.',
        name: 'Andrew T.',
        title: 'CEO, Mid-Atlantic Property Management',
      },
      {
        quote: 'When we pitch new clients, we show them our SmartCOI dashboard. It demonstrates a level of compliance rigor that spreadsheets never could.',
        name: 'Maria G.',
        title: 'Director of Property Management',
      },
      {
        quote: 'We added three new clients last quarter without hiring additional compliance staff. SmartCOI\'s automation made that possible.',
        name: 'Brian K.',
        title: 'COO, Pacific Property Group',
      },
    ],
    insuranceRequirementsSlug: null,
  },
];
