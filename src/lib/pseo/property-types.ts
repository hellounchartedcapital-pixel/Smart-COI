import type { PropertyType } from './types';

export const propertyTypes: PropertyType[] = [
  {
    slug: 'office-buildings',
    name: 'Office Building',
    plural: 'Office Buildings',
    description:
      'Class A, B, and C office properties including high-rises, suburban office parks, and mixed-use office spaces.',
    vendorExamples: ['janitorial services', 'HVAC contractors', 'elevator maintenance', 'security companies'],
    tenantExamples: ['law firms', 'tech companies', 'accounting firms', 'consulting agencies'],
    complianceChallenges:
      'Office buildings rely on a rotating cast of service vendors — from the janitorial crew that works every night to the elevator technician who visits quarterly. Each vendor represents a separate liability exposure. A slip-and-fall in the lobby during after-hours cleaning, a water leak from an HVAC repair gone wrong, or an electrical fire from faulty maintenance work can all result in claims against the building owner. The challenge is that many of these vendors are small businesses that let coverage lapse between renewal periods, and without active tracking, the gap goes unnoticed until a claim arrives. Tenant build-outs add another layer of complexity — general contractors bring subcontractors onto the property, and each one needs verified coverage before starting work.',
    commonGaps:
      'The most common gap in office building COI compliance is expired coverage that was never renewed. Vendors submit a certificate at onboarding and nobody checks again until the next lease renewal — which could be years. Additional insured endorsements are frequently missing or list the wrong entity name. Umbrella policies often exclude the specific property address. And for tenant build-out contractors, the GL policy may not include completed operations coverage, leaving the building owner exposed after the work is finished.',
    smartcoiHelps:
      'SmartCOI monitors every vendor and tenant certificate across your office portfolio. When a policy is about to expire, the vendor gets an automated reminder with a direct upload link. No more chasing emails or checking spreadsheets — every certificate is extracted by AI and checked against your requirements in seconds.',
  },
  {
    slug: 'retail-centers',
    name: 'Retail Center',
    plural: 'Retail Centers',
    description:
      'Shopping centers, strip malls, power centers, and lifestyle centers with multiple retail tenants.',
    vendorExamples: ['parking lot maintenance', 'landscaping crews', 'snow removal', 'signage installers'],
    tenantExamples: ['restaurants', 'clothing retailers', 'fitness studios', 'salons'],
    complianceChallenges:
      'Retail centers have uniquely high foot traffic, which amplifies liability exposure for every vendor working on the property. A landscaping crew that leaves debris in a walkway, a paving contractor that creates an uneven surface in the parking lot, or a snow removal company that misses an icy patch — each scenario can result in a slip-and-fall claim against the center owner. Restaurant tenants add liquor liability and food safety exposure. Seasonal vendors (holiday kiosk operators, pop-up shops) rotate frequently and often have minimal insurance. The sheer number of tenants and vendors at a busy retail center makes manual COI tracking impractical.',
    commonGaps:
      'Restaurant tenants frequently lack liquor liability coverage or carry limits well below what the lease requires. Seasonal and temporary tenants often provide a certificate at signing but let coverage lapse within weeks. Parking lot contractors may carry auto liability but not general liability. And signage companies doing work at height rarely carry the umbrella coverage that the risk warrants.',
    smartcoiHelps:
      'SmartCOI tracks both vendor and tenant certificates across every property in your retail portfolio. Compliance templates let you set different requirements for restaurants (liquor liability), fitness studios (professional liability), and standard retail tenants. Automated expiration alerts keep seasonal vendor compliance from falling through the cracks.',
  },
  {
    slug: 'industrial-warehouses',
    name: 'Industrial Warehouse',
    plural: 'Industrial Warehouses',
    description:
      'Warehouses, distribution centers, flex spaces, and light manufacturing facilities.',
    vendorExamples: ['dock equipment repair', 'forklift maintenance', 'fire suppression contractors', 'roofing companies'],
    tenantExamples: ['logistics companies', 'e-commerce fulfillment', 'manufacturers', 'cold storage operators'],
    complianceChallenges:
      'Industrial properties carry elevated risk due to heavy equipment, hazardous materials, and high-value inventory. A forklift accident, a chemical spill from a tenant operation, or a roof collapse during contractor work can result in seven-figure claims. Coverage requirements for industrial vendors are typically 2x-4x higher than standard commercial properties. Tenant operations often involve activities that standard GL policies exclude — such as welding, spray painting, or handling flammable materials. Verifying that tenants carry appropriate pollution liability and that contractors have adequate umbrella coverage is critical but time-consuming.',
    commonGaps:
      'Industrial vendor COIs frequently show adequate GL limits but lack pollution liability or equipment floater coverage. Roofing contractors may exclude hot-tar operations from their policy. Dock equipment repair vendors often carry low auto liability limits despite operating heavy machinery. Tenant certificates may list the correct entity name but exclude the specific warehouse address from the additional insured endorsement.',
    smartcoiHelps:
      'SmartCOI lets you set higher coverage requirements for industrial vendors without maintaining a separate spreadsheet. AI extraction reads ACORD 25 forms including endorsement pages, catching missing additional insured endorsements and verifying that CG 20 10 and CG 20 37 forms are present.',
  },
  {
    slug: 'multifamily-apartments',
    name: 'Multifamily Apartment',
    plural: 'Multifamily Apartments',
    description:
      'Apartment complexes, garden-style communities, mid-rise and high-rise residential buildings.',
    vendorExamples: ['plumbing contractors', 'pest control', 'pool maintenance', 'painting companies'],
    tenantExamples: ['individual residents', 'corporate housing tenants', 'student housing residents'],
    complianceChallenges:
      'Multifamily properties face a dual compliance burden: vendor insurance for service providers and renters insurance for residents. Vendor turnover is high — a plumbing emergency at 2 AM means calling whoever is available, and verifying insurance before they start work is often skipped. Pool maintenance, pest control, and landscaping vendors rotate seasonally. Unit renovation contractors bring subcontractors who may not carry any coverage at all. On the tenant side, many lease agreements require renters insurance but enforcement is spotty. Tracking hundreds of resident policies alongside dozens of vendor certificates manually is unsustainable.',
    commonGaps:
      'Emergency repair vendors (plumbers, electricians, locksmiths) are the most common gap — they get called urgently and their COI status is checked after the fact, if at all. Pool maintenance vendors frequently lack the specific GL endorsements required for aquatic operations. Painting contractors working at height may not carry adequate workers comp. And resident renters insurance compliance often drops below 50% because there is no automated way to track policy expirations across hundreds of units.',
    smartcoiHelps:
      'SmartCOI automates both vendor and tenant insurance tracking from a single dashboard. Set different compliance templates for high-risk vendors (renovation contractors) and standard vendors (landscaping). The self-service portal lets vendors upload their own certificates, eliminating the back-and-forth email chains that slow down emergency repairs.',
  },
  {
    slug: 'mixed-use-properties',
    name: 'Mixed-Use Property',
    plural: 'Mixed-Use Properties',
    description:
      'Properties combining retail, office, and residential uses — often with ground-floor commercial and upper-floor residential.',
    vendorExamples: ['general contractors', 'fire safety inspectors', 'waste management', 'window cleaning'],
    tenantExamples: ['ground-floor restaurants', 'professional offices', 'residential tenants', 'co-working spaces'],
    complianceChallenges:
      'Mixed-use properties have the most complex compliance requirements because they combine the challenges of retail, office, and residential — all under one roof. A ground-floor restaurant needs liquor liability and food service coverage. The office tenants above need standard commercial GL. Residential tenants on the upper floors need renters insurance. And every vendor working on the building — from the window cleaners rappelling down the facade to the HVAC technicians servicing shared systems — needs coverage that accounts for the mixed occupancy. Insurance requirements vary by use type, and applying the wrong template to the wrong tenant is a common and costly mistake.',
    commonGaps:
      'The most dangerous gap in mixed-use is applying residential insurance standards to commercial tenants or vice versa. A co-working space operating under a residential tenant template may lack the professional liability coverage their operations require. Restaurant tenants in a mixed-use building often have certificates that list the restaurant address but not the building ownership entity. Contractors working in shared areas (lobbies, parking garages, mechanical rooms) need certificates that name all ownership entities as additional insureds — and frequently only name one.',
    smartcoiHelps:
      'SmartCOI lets you create separate compliance templates for each tenant type — retail, office, and residential — and assign the right one to each tenant automatically. The AI extraction engine verifies that additional insured endorsements list every required entity, not just one.',
  },
  {
    slug: 'medical-office-buildings',
    name: 'Medical Office Building',
    plural: 'Medical Office Buildings',
    description:
      'Medical offices, outpatient clinics, dental practices, and ambulatory surgery centers.',
    vendorExamples: ['biomedical waste disposal', 'medical equipment service', 'specialized cleaning', 'IT network contractors'],
    tenantExamples: ['physician practices', 'dental offices', 'physical therapy clinics', 'imaging centers'],
    complianceChallenges:
      'Medical office buildings have uniquely stringent compliance requirements driven by patient safety regulations and the high cost of malpractice claims. Biomedical waste disposal vendors must carry pollution liability and specific environmental coverage. Medical equipment service technicians need professional liability in addition to standard GL. IT contractors handling patient data systems need cyber liability coverage to address HIPAA breach exposure. Cleaning crews in medical facilities need coverage that accounts for bloodborne pathogen exposure. The consequence of a compliance lapse in a medical building is not just financial — it can trigger regulatory action and put patient safety at risk.',
    commonGaps:
      'Biomedical waste vendors frequently carry GL but lack the pollution liability endorsement that covers hazardous material incidents. IT contractors almost never carry cyber liability unless specifically required. Medical equipment service companies may have professional liability but with limits far below what the exposure warrants. And specialized cleaning vendors — even those trained for medical environments — often carry standard janitorial insurance that excludes biohazard exposure.',
    smartcoiHelps:
      'SmartCOI compliance templates for medical buildings include professional liability, pollution liability, and cyber liability requirements that standard templates miss. AI extraction verifies these specialized coverage types automatically, so you catch gaps at upload — not after an incident.',
  },
  {
    slug: 'hospitality-hotels',
    name: 'Hospitality Property',
    plural: 'Hotels & Hospitality Properties',
    description:
      'Hotels, motels, resorts, and extended-stay properties with complex vendor relationships.',
    vendorExamples: ['linen services', 'food suppliers', 'valet parking', 'AV equipment providers'],
    tenantExamples: ['restaurant operators', 'spa operators', 'gift shop tenants', 'event planners'],
    complianceChallenges:
      'Hotels and hospitality properties operate 24/7 with a constant flow of guests, vendors, and service providers. A guest injury in the lobby, a food safety incident at the restaurant, a valet driver in an accident — each scenario creates immediate liability exposure. Hotel vendors cover everything from linen delivery to AV setup for conferences, and many are on-site daily. Restaurant and bar operators need liquor liability. Event companies setting up for weddings or conferences need coverage for temporary structures and high-value equipment. The reputational risk of an uninsured incident at a hotel is particularly severe because guest reviews directly impact revenue.',
    commonGaps:
      'Valet parking operators frequently carry auto liability but with limits too low for luxury vehicles. Food suppliers may lack product liability coverage. Event setup companies often exclude coverage for temporary structures like tents and staging. And linen services — which seem low-risk — can create slip-and-fall liability when deliveries block corridors or leave wet floors.',
    smartcoiHelps:
      'SmartCOI tracks every vendor certificate across your hotel portfolio with automated expiration alerts and a self-service portal for vendors to upload renewals. Set higher requirements for high-risk vendors like valet and event companies, and standard requirements for routine service providers.',
  },
  {
    slug: 'self-storage-facilities',
    name: 'Self-Storage Facility',
    plural: 'Self-Storage Facilities',
    description:
      'Climate-controlled and standard self-storage facilities, including boat and RV storage.',
    vendorExamples: ['gate and access control repair', 'pest control', 'paving contractors', 'security system vendors'],
    tenantExamples: ['individual renters', 'small businesses', 'moving companies'],
    complianceChallenges:
      'Self-storage facilities have fewer vendors than other commercial property types but face unique compliance challenges around tenant insurance. Many storage leases require tenants to carry personal property insurance, but enforcement is inconsistent. Facility vendors — particularly gate and access control technicians, pest control operators, and paving contractors — work on-site with minimal supervision, increasing liability exposure. Security system vendors have access to the entire facility and handle sensitive access data. Moving companies that operate from storage facilities create auto liability exposure on the property.',
    commonGaps:
      'Tenant insurance compliance at self-storage facilities is typically the weakest link — many operators require insurance at lease signing but never verify that the policy stays active. Gate and access control vendors may carry professional liability but not GL. Paving contractors working in vehicle traffic areas often lack adequate auto liability. And pest control vendors using chemical treatments may not carry pollution liability.',
    smartcoiHelps:
      'SmartCOI automates tenant insurance verification alongside vendor compliance tracking. The self-service portal lets tenants upload proof of insurance directly, and automated alerts catch expirations before they create gaps.',
  },
];
