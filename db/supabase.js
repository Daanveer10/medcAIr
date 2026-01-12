// Supabase client configuration
// Lazy initialization to prevent blocking on module load
const { createClient } = require('@supabase/supabase-js');

let supabase = null;
let initialized = false;

function getSupabase() {
  if (initialized) {
    return supabase;
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_ANON_KEY;

  if (supabaseUrl && supabaseKey) {
    try {
      supabase = createClient(supabaseUrl, supabaseKey);
      initialized = true;
      return supabase;
    } catch (error) {
      console.error('❌ Error creating Supabase client:', error.message);
      supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
      initialized = true;
      return supabase;
    }
  } else {
    // Create a dummy client to prevent crashes
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    initialized = true;
    return supabase;
  }
}

// Initialize immediately but don't block
if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
  getSupabase();
}

module.exports = getSupabase();
