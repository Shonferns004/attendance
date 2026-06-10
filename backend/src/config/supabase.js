import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl === 'your_supabase_url') {
  console.error('ERROR: SUPABASE_URL is not set');
  supabaseUrl = 'https://placeholder.supabase.co';
}

if (!supabaseKey || supabaseKey === 'your_supabase_anon_key' || supabaseKey === 'your_supabase_service_key') {
  console.error('ERROR: SUPABASE_SERVICE_KEY or SUPABASE_ANON_KEY is not set');
}

const supabase = createClient(supabaseUrl || '', supabaseKey || '');

export default supabase;
