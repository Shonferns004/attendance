import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
  console.error('ERROR: SUPABASE_URL is not set in backend/.env');
  console.error('Go to https://supabase.com -> Project Settings -> API -> Project URL');
  process.exit(1);
}

if (!supabaseAnonKey || supabaseAnonKey === 'your_supabase_anon_key') {
  console.error('ERROR: SUPABASE_ANON_KEY is not set in backend/.env');
  console.error('Go to https://supabase.com -> Project Settings -> API -> anon/public key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;
