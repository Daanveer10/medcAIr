// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client synchronously (should be fast)
let supabase;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error.message);
    // Create a dummy client to prevent crashes
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
} else {
  // Create a dummy client to prevent crashes
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

module.exports = supabase;
