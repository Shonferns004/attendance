import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import supabase from './config/supabase.js';
import authRoutes from './routes/authRoutes.js';
import workerRoutes from './routes/workerRoutes.js';
import taskRoutes from './routes/taskRoutes.js';
import qrRoutes from './routes/qrRoutes.js';
import attendanceRoutes from './routes/attendanceRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors("*"));
app.use(express.json({ limit: '10mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/workers', workerRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/qr', qrRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/leaves', leaveRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Attendance API is running' });
});

async function checkLeavesTable() {
  try {
    await supabase.from('leaves').select('id').limit(1);
  } catch {
    console.warn(
      '\n=== MISSING TABLE: leaves ===\n' +
      'The "leaves" table does not exist in your Supabase database.\n' +
      'Run this SQL in your Supabase SQL Editor:\n\n' +
      '  CREATE TABLE IF NOT EXISTS leaves (\n' +
      '    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n' +
      '    worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,\n' +
      '    type TEXT NOT NULL CHECK (type IN (\'full_day\', \'half_day\', \'vacational\')),\n' +
      '    leave_date DATE,\n' +
      '    start_date DATE,\n' +
      '    end_date DATE,\n' +
      '    half_start_time TIME,\n' +
      '    half_end_time TIME,\n' +
      '    days NUMERIC(4,1) NOT NULL,\n' +
      '    reason TEXT NOT NULL,\n' +
      '    status TEXT NOT NULL DEFAULT \'pending\' CHECK (status IN (\'pending\', \'approved\', \'rejected\')),\n' +
      '    admin_remark TEXT,\n' +
      '    applied_at TIMESTAMPTZ DEFAULT NOW(),\n' +
      '    updated_at TIMESTAMPTZ DEFAULT NOW()\n' +
      '  );\n\n' +
      '  CREATE INDEX IF NOT EXISTS idx_leaves_worker_id ON leaves(worker_id);\n' +
      '  CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);\n' +
      '========================\n'
    );
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  checkLeavesTable();
});
