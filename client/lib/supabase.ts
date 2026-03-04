import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseClient() {
  if (!supabaseClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        'Supabase credentials not configured. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.'
      );
    }

    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false, // We're using our own JWT auth
        autoRefreshToken: false,
      },
    });
  }
  return supabaseClient;
}

// TypeScript types for our tables
export interface User {
  id: string;
  email: string;
  password?: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  provider: string;
  provider_id?: string;
  provider_data?: any;
  email_verified: boolean;
  is_active: boolean;
  refresh_token?: string;
  refresh_token_expires_at?: string;
  created_at: string;
  updated_at: string;
  last_login_at?: string;
}

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  content?: string;
  blob_name?: string;
  blob_url?: string;
  size?: number;
  mime_type?: string;
  version: number;
  version_count: number;
  created_at: string;
  updated_at: string;
}

export interface Version {
  id: string;
  document_id: string;
  owner_id: string;
  version: number;
  title: string;
  content: string;
  changes?: string[];
  previous_version_id?: string;
  created_by?: string;
  metadata?: any;
  created_at: string;
}

export interface Session {
  id: string;
  user_id: string;
  user_agent?: string;
  ip_address?: string;
  is_active: boolean;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  deactivated_at?: string;
}

export interface AIInteraction {
  id: string;
  document_id?: string;
  user_id: string;
  prompt: string;
  response?: string;
  model?: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost: number;
  meta?: any;
  created_at: string;
  updated_at: string;
}
