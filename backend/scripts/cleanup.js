import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  try {
    const { data: workers } = await supabase
      .from('workers')
      .select('id')
      .eq('login_id', 'test3');
    
    if (workers && workers.length > 0) {
      const workerId = workers[0].id;
      
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('worker_id', workerId)
        .gte('date', '2026-05-03')
        .lte('date', '2026-05-30');
      
      if (error) {
        console.error('Delete error:', error);
      } else {
        console.log('Deleted old attendance records for test3');
      }
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

cleanup();
