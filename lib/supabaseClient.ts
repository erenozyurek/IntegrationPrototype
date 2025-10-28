import { createClient } from '@supabase/supabase-js';

// Supabase client for browser and server usage.
// Uses NEXT_PUBLIC_ vars (safe to be used in client code for anon key).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

if (!supabaseUrl || !supabaseAnonKey) {
  // Optional: during development we avoid throwing so the app still builds.
  // Runtime calls will fail clearly if credentials are missing.
  // You can uncomment the line below to make missing envs a build-time error.
  // throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY in environment');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
