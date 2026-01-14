// add-sample-vendors.js
// Run this once to add sample vendors to your database

import { supabase } from './src/supabaseClient.js';

const sampleVendors = [
  {
    name: "American Direct Procurement, LLC",
    dba: "Avalon Communications Services",
    status: "expired",
    expiration_date: "2025-06-13",
    days_overdue: 210,
    issues: [
      { type: "critical", message: "All policies expired 6/13/2025 (210 days overdue)" },
      { type: "error", message: "Missing property physical address on COI" }
    ],
    coverage: {
      generalLiability: { amount: 1000000, compliant: true },
      autoLiability: { amount: 1000000, compliant: true },
      workersComp: { amount: "Statutory", compliant: true },
      employersLiability: { amount: 1000000, compliant: true }
    }
  },
  {
    name: "Faith Enterprises Incorporated",
    dba: null,
    status: "non-compliant",
    expiration_date: "2026-10-01",
    days_overdue: 0,
    issues: [
      { type: "error", message: "General Liability below requirement: $500,000 (requires $1.0M)" }
    ],
    coverage: {
      generalLiability: { amount: 500000, compliant: false },
      autoLiability: { amount: 1000000, compliant: true },
      workersComp: { amount: "Statutory", compliant: true },
      employersLiability: { amount: 1000000, compliant: true }
    }
  },
  {
    name: "Captivate Holdings, LLC",
    dba: null,
    status: "expired",
    expiration_date: "2025-09-25",
    days_overdue: 106,
    issues: [
      { type: "critical", message: "All policies expired 9/25/2025 (106 days overdue)" }
    ],
    coverage: {
      generalLiability: { amount: 1000000, compliant: true },
      autoLiability: { amount: 1000000, compliant: false },
      workersComp: { amount: "Statutory", compliant: true },
      employersLiability: { amount: 1000000, compliant: true }
    }
  }
];

async function addSampleVendors() {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) throw authError;
    if (!user) throw new Error('Not authenticated. Please log in first.');

    console.log('Adding vendors for user:', user.email);

    // Add user_id to each vendor
    const vendorsWithUser = sampleVendors.map(vendor => ({
      ...vendor,
      user_id: user.id
    }));

    // Insert all vendors
    const { data, error } = await supabase
      .from('vendors')
      .insert(vendorsWithUser)
      .select();

    if (error) throw error;

    console.log('✅ Successfully added', data.length, 'sample vendors!');
    console.log('Refresh your app to see them.');
    
  } catch (error) {
    console.error('❌ Error adding sample vendors:', error.message);
  }
}

// Run the function
addSampleVendors();
