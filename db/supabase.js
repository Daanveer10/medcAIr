// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!');
  console.error('SUPABASE_URL:', supabaseUrl ? '✓ Set' : '✗ NOT SET');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? '✓ Set' : '✗ NOT SET');
  throw new Error('Supabase environment variables are required. Please set SUPABASE_URL and SUPABASE_ANON_KEY in Vercel dashboard.');
}

// Create Supabase client
let supabase;
try {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✓ Supabase client initialized successfully');
} catch (error) {
  console.error('❌ Error creating Supabase client:', error.message);
  throw error;
}

module.exports = supabase;
