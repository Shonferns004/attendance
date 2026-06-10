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
import ngoRoutes from './routes/ngoRoutes.js';
import userRoutes from './routes/userRoutes.js';
import letterRoutes from './routes/letterRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

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
app.use('/api/ngos', ngoRoutes);
app.use('/api/users', userRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/dashboard', dashboardRoutes);

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
      'Run the SQL in backend/migrations/ in your Supabase SQL Editor.\n' +
      '========================\n'
    );
  }
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  checkLeavesTable();
});
