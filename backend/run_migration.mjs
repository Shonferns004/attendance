import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const s = createClient(supabaseUrl, supabaseKey);
const sql = readFileSync(join(dirname(fileURLToPath(import.meta.url)), 'migrations', '003_notifications.sql'), 'utf8');

try {
  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': supabaseKey,
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({ query: sql }),
  });
  const text = await res.text();
  console.log('Status:', res.status);
  if (res.ok) {
    console.log('Migration applied successfully');
  } else {
    console.log('Response:', text.slice(0, 500));
  }
} catch (e) {
  console.error('Error:', e.message);
}
