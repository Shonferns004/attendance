import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
  console.error('ERROR: SUPABASE_URL is not set in backend/.env');
  console.error('Go to https://supabase.com -> Project Settings -> API -> Project URL');
  process.exit(1);
}

const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key' || supabaseKey === 'your_supabase_service_key') {
  console.error('ERROR: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY is not set in backend/.env');
  console.error('Go to https://supabase.com -> Project Settings -> API -> service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default supabase;
