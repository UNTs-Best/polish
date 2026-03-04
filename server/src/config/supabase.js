import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for server
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY; // For client-facing operations

let supabaseAdmin = null;
let supabaseClient = null;

/**
 * Get Supabase admin client (with service role key)
 * Use this for server-side operations that bypass RLS
 */
export const getSupabaseAdmin = () => {
  if (!supabaseAdmin) {
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    }
    supabaseAdmin = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
  }
  return supabaseAdmin;
};

/**
 * Get Supabase client (with anon key)
 * Use this for operations that respect RLS
 */
export const getSupabaseClient = () => {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase credentials not configured. Please set SUPABASE_URL and SUPABASE_ANON_KEY environment variables.');
    }
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
  return supabaseClient;
};

/**
 * Check if Supabase is configured
 */
export const isSupabaseConfigured = () => {
  return Boolean(supabaseUrl && supabaseKey);
};

/**
 * Initialize Supabase connection and verify tables exist
 */
export const connectSupabase = async () => {
  try {
    if (!supabaseUrl || !supabaseKey) {
      console.warn('Supabase env not fully set. Skipping connection.');
      return;
    }

    const supabase = getSupabaseAdmin();

    // Test connection by querying users table
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned, which is OK
      throw error;
    }

    console.log('✅ Supabase connected successfully');
  } catch (err) {
    console.error('❌ Supabase connection failed:', err.message);
    process.exit(1);
  }
};
