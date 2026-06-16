import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Check if test2 worker already exists
    const { data: existingWorkers, error: checkError } = await supabase
      .from('workers')
      .select('id')
      .eq('login_id', 'test2');
    
    if (checkError) {
      throw checkError;
    }
    
    let workerId;
    
    if (existingWorkers && existingWorkers.length > 0) {
      workerId = existingWorkers[0].id;
      console.log(`✓ Test worker already exists with ID: ${workerId}`);
    } else {
      // Create test worker
      const { data: newWorker, error: workerError } = await supabase
        .from('workers')
        .insert([
          {
            name: 'Test Worker Two',
            email: 'test2@example.com',
            login_id: 'test2',
            password: '$2a$10$92IXUNpkjOoOCisRbDP0fOeuVyD90I3e2h6w4c3z5z7z6z5z4z3z2z1',
            gender: 'Female',
            dob: '1990-01-01',
            phone: '+1234567890',
            address: '123 Test Street, Test City, Test State',
            shift: 'general',
            department: 'HR-Recruitment',
            created_by: '550e8400-e29b-41d4-a716-446655440001',
            is_active: true,
            created_at: '2026-05-03T09:00:00Z',
            updated_at: '2026-05-03T09:00:00Z'
          }
        ])
        .select();
      
      if (workerError) {
        throw workerError;
      }
      
      workerId = newWorker[0].id;
      console.log(`✓ Test worker created: Test Worker Two (ID: ${workerId})`);
    }
    
    // Check if attendance records already exist for this worker
    const { data: existingAttendance, error: attendanceCheckError } = await supabase
      .from('attendance')
      .select('id')
      .eq('worker_id', workerId);
    
    if (attendanceCheckError) {
      throw attendanceCheckError;
    }
    
    if (existingAttendance && existingAttendance.length > 0) {
      console.log(`✓ Attendance records already exist: ${existingAttendance.length} records`);
    } else {
      // Insert attendance records
      const attendanceRecords = [
        {
          worker_id: workerId,
          date: '2026-05-03',
          punch_in_time: '2026-05-03T08:00:00Z',
          punch_out_time: '2026-05-03T18:00:00Z',
          late_minutes: 180,
          status: 'late',
          created_at: new Date().toISOString()
        },
        {
          worker_id: workerId,
          date: '2026-05-04',
          punch_in_time: '2026-05-04T08:30:00Z',
          punch_out_time: '2026-05-04T19:30:00Z',
          late_minutes: 200,
          status: 'late',
          created_at: new Date().toISOString()
        },
        {
          worker_id: workerId,
          date: '2026-05-05',
          punch_in_time: '2026-05-05T09:00:00Z',
          punch_out_time: '2026-05-05T17:00:00Z',
          late_minutes: 150,
          status: 'late',
          created_at: new Date().toISOString()
        }
      ];
      
      const { data: insertedRecords, error: insertError } = await supabase
        .from('attendance')
        .insert(attendanceRecords)
        .select();
      
      if (insertError) {
        throw insertError;
      }
      
      console.log(`✓ Attendance records created: ${insertedRecords.length} records`);
    }
    
    // Fetch and display summary
    const { data: attendance, error: summaryError } = await supabase
      .from('attendance')
      .select('date, late_minutes')
      .eq('worker_id', workerId)
      .order('date');
    
    if (summaryError) {
      throw summaryError;
    }
    
    if (attendance && attendance.length > 0) {
      const totalLateMinutes = attendance.reduce((sum, record) => sum + (record.late_minutes || 0), 0);
      console.log(`\n✓ Summary:`);
      console.log(`  Total records: ${attendance.length}`);
      console.log(`  Total late minutes: ${totalLateMinutes}`);
      attendance.forEach((record, index) => {
        console.log(`  Record ${index + 1}: ${record.date} - ${record.late_minutes} late minutes`);
      });
    }
    
    console.log('\n✓ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error.message);
    console.error(error);
    process.exit(1);
  }
}

seedDatabase();
