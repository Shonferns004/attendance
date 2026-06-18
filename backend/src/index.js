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
import hrRoutes from './routes/hrRoutes.js';
import letterRoutes from './routes/letterRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import noticeRoutes from './routes/noticeRoutes.js';
import achievementRoutes from './routes/achievementRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import notificationAdminRoutes from './routes/notificationAdminRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import leadRoutes from './routes/leadRoutes.js';
import recruiterRoutes from './routes/recruiterRoutes.js';
import holidayRoutes from './routes/holidayRoutes.js';
import calendarRoutes from './routes/calendarRoutes.js';
import salaryRoutes from './routes/salaryRoutes.js';
import incentiveRoutes from './routes/incentiveRoutes.js';
import callLogRoutes from './routes/callLogRoutes.js';
import causeRoutes from './routes/causeRoutes.js';
import dataSourceRoutes from './routes/dataSourceRoutes.js';
import dataImportRoutes from './routes/dataImportRoutes.js';

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
app.use('/api/hrs', hrRoutes);
app.use('/api/letters', letterRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/notices', noticeRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin/notifications', notificationAdminRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/call-logs', callLogRoutes);
app.use('/api/recruiters', recruiterRoutes);
app.use('/api/holidays', holidayRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/salary', salaryRoutes);
app.use('/api/incentive', incentiveRoutes);
app.use('/api/causes', causeRoutes);
app.use('/api/data-sources', dataSourceRoutes);
app.use('/api/data-import', dataImportRoutes);

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

if (!process.env.VERCEL) {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    checkLeavesTable();
    import('./services/notificationScheduler.js');
  });
}

export default app;
