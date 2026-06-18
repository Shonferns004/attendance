import fs from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

dotenv.config();

const sql = fs.readFileSync('./migrations/027_fro_tables.sql', 'utf8');

async function run() {
  console.log('Running migration 027_fro_tables.sql...');

  const projectRef = 'sqlbimnmhdvesudpxtbi';
  const serviceKey = process.env.SUPABASE_SERVICE_KEY;
  const sniHost = `${projectRef}.pooler.supabase.com`;

  const regions = ['ap-southeast-1', 'ap-south-1', 'us-east-1', 'eu-west-1'];
  const ports = [5432, 6543];

  for (const region of regions) {
    for (const port of ports) {
      let c;
      try {
        c = new pg.Client({
          user: 'postgres',
          password: serviceKey,
          database: 'postgres',
          host: `aws-0-${region}.pooler.supabase.com`,
          port,
          ssl: {
            rejectUnauthorized: false,
            servername: sniHost,
          },
          connectionTimeoutMillis: 10000,
          keepAlive: false,
        });
        await c.connect();
        console.log(`Connected! (${region}:${port})`);
        await c.query(sql);
        console.log('Migration 027 completed successfully!');
        await c.end();
        process.exit(0);
      } catch (err) {
        const msg = err.message || String(err);
        console.log(`  ${region}:${port} -> ${msg.slice(0, 100)}`);
        if (c) { try { await c.end(); } catch {} }
      }
    }
  }

  console.error('All connection attempts failed');
  process.exit(1);
}

run().catch(console.error);
