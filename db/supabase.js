// Supabase client configuration
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Only create client if both variables are present
let supabase = null;

if (supabaseUrl && supabaseKey) {
  try {
    console.log('Initializing Supabase client...');
    console.log('Supabase URL:', supabaseUrl.substring(0, 30) + '...');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Supabase client created successfully');
  } catch (error) {
    console.error('Error creating Supabase client:', error);
    supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
    console.warn('Using placeholder Supabase client due to error');
  }
} else {
  console.error('Missing Supabase environment variables!');
  console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'NOT SET');
  console.error('SUPABASE_ANON_KEY:', supabaseKey ? 'Set' : 'NOT SET');
  console.error('Please set SUPABASE_URL and SUPABASE_ANON_KEY');
  // Create a dummy client to prevent crashes, but it won't work
  supabase = createClient('https://placeholder.supabase.co', 'placeholder-key');
  console.warn('Using placeholder Supabase client - operations will fail!');
}

module.exports = supabase;
