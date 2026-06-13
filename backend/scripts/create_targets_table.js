import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const sql = `CREATE TABLE IF NOT EXISTS telecaller_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  target_amount DECIMAL NOT NULL DEFAULT 0,
  achievement_amount DECIMAL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, month)
);`;

async function run() {
  // Check if table already exists
  const { error: checkErr } = await supabase.from('telecaller_targets').select('id').limit(1);
  if (!checkErr) {
    console.log('telecaller_targets table already exists');
    process.exit(0);
  }

  // Try creating via exec_sql rpc
  try {
    const { error } = await supabase.rpc('exec_sql', { sql_text: sql });
    if (error) console.log('exec_sql failed:', error.message);
    else console.log('exec_sql succeeded');
  } catch(e) {
    console.log('exec_sql exception:', e.message);
  }

  // Check again
  const { error: checkErr2 } = await supabase.from('telecaller_targets').select('id').limit(1);
  if (!checkErr2) {
    console.log('telecaller_targets table created successfully');
  } else {
    console.log('Could not create table automatically.');
    console.log('Please run the SQL from migrations/015_telecaller_targets.sql in Supabase SQL Editor');
  }
  process.exit(0);
}
run();
