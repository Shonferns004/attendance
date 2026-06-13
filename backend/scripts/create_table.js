import dotenv from 'dotenv';
dotenv.config();

const ref = process.env.SUPABASE_URL.replace('https://', '').replace('.supabase.co', '');

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
  const { default: pg } = await import('pg');

  // Try session pooler (port 5432)
  for (const password of [process.env.SUPABASE_SERVICE_KEY, process.env.SUPABASE_ANON_KEY, 'postgres']) {
    try {
      const pool = new pg.Pool({
        host: 'aws-0-ap-south-1.pooler.supabase.com',
        port: 5432,
        database: 'postgres',
        user: 'postgres.' + ref,
        password: password,
        ssl: { rejectUnauthorized: false },
        max: 1,
        idleTimeoutMillis: 5000
      });
      const r = await pool.query(sql);
      console.log('Table created via session pooler!');
      await pool.end();
      process.exit(0);
    } catch(e) {
      console.log('Failed with password', password.substring(0, 8) + '...:', e.message);
    }
  }

  // Try connection string from env
  if (process.env.DATABASE_URL) {
    try {
      const pool2 = new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false }, max: 1 });
      await pool2.query(sql);
      console.log('Table created via DATABASE_URL!');
      await pool2.end();
      process.exit(0);
    } catch(e) {
      console.log('DATABASE_URL failed:', e.message);
    }
  }

  console.log('\nCould not auto-create table. Please run this SQL in Supabase Dashboard SQL Editor:');
  console.log('https://supabase.com/dashboard/project/' + ref + '/sql/new');
  console.log('\n' + sql);
  process.exit(0);
}
run();
