// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Create Supabase client (don't throw - let the app handle missing vars gracefully)
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase client initialized');
  } catch (error) {
    console.error('❌ Error creating Supabase client:', error.message);
    // Don't throw - create a dummy client to prevent crashes
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  }
} else {
  console.warn('⚠️ Supabase environment variables not set');
  console.warn('SUPABASE_URL:', supabaseUrl ? '✓' : '✗');
  console.warn('SUPABASE_ANON_KEY:', supabaseKey ? '✓' : '✗');
  // Create a dummy client to prevent crashes
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
}

module.exports = supabase;
