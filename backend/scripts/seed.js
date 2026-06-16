import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = "https://sqlbimnmhdvesudpxtbi.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNxbGJpbW5taGR2ZXN1ZHB4dGJpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDk4MDg1MywiZXhwIjoyMDk2NTU2ODUzfQ.-1blwyk_qxNEfnRceBzvd1m3oTq9t-4ueHtanMsSS4U";

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_KEY (or SUPABASE_ANON_KEY) environment variables are required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

function generateAttendanceRecords(workerId) {
  const records = [];
  const startDate = new Date('2026-05-03');
  const endDate = new Date('2026-05-30');
  
  let currentDate = new Date(startDate);
  let totalLateMinutes = 0;
  
  while (currentDate <= endDate) {
    const dayOfWeek = currentDate.getDay();
    
    // Skip weekends (Saturday = 6, Sunday = 0)
    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
      const dateStr = currentDate.toISOString().split('T')[0];
      
      // Vary late minutes throughout the month to reach >500 total
      // Use a mix: 30 to 50 minutes late per day for ~20 working days = 600-1000 total
      const lateMinutes = 30 + Math.floor(Math.random() * 21); // 30-50 minutes
      
      records.push({
        worker_id: workerId,
        date: dateStr,
        punch_in_time: new Date(`${dateStr}T08:${String(lateMinutes).padStart(2, '0')}:00Z`).toISOString(),
        punch_out_time: new Date(`${dateStr}T18:00:00Z`).toISOString(),
        late_minutes: lateMinutes,
        status: 'late',
        created_at: new Date().toISOString()
      });
      
      totalLateMinutes += lateMinutes;
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return records;
}

async function seedDatabase() {
  try {
    console.log('Starting database seeding for full month attendance...');
    
    // Check if test3 worker already exists
    const { data: existingWorkers, error: checkError } = await supabase
      .from('workers')
      .select('id')
      .eq('login_id', 'test3');
    
    if (checkError) {
      throw checkError;
    }
    
    let workerId;
    
    if (existingWorkers && existingWorkers.length > 0) {
      workerId = existingWorkers[0].id;
      console.log(`✓ Test worker 'test3' already exists with ID: ${workerId}`);
    } else {
      // Create test worker
      const { data: newWorker, error: workerError } = await supabase
        .from('workers')
        .insert([
          {
            name: 'Test Worker Three',
            email: 'test3@example.com',
            login_id: 'test3',
            password: '$2a$10$92IXUNpkjOoOCisRbDP0fOeuVyD90I3e2h6w4c3z5z7z6z5z4z3z2z1',
            gender: 'Male',
            dob: '1992-01-01',
            phone: '+1234567891',
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
      console.log(`✓ Test worker created: Test Worker Three (ID: ${workerId})`);
    }
    
    // Check if attendance records already exist for this worker
    const { data: existingAttendance, error: attendanceCheckError } = await supabase
      .from('attendance')
      .select('id')
      .eq('worker_id', workerId)
      .gte('date', '2026-05-03')
      .lte('date', '2026-05-30');
    
    if (attendanceCheckError) {
      throw attendanceCheckError;
    }
    
    if (existingAttendance && existingAttendance.length > 0) {
      console.log(`✓ Attendance records already exist: ${existingAttendance.length} records for May 3-30`);
      
      // Show summary
      const { data: attendance, error: summaryError } = await supabase
        .from('attendance')
        .select('date, late_minutes')
        .eq('worker_id', workerId)
        .gte('date', '2026-05-03')
        .lte('date', '2026-05-30')
        .order('date');
      
      if (!summaryError && attendance) {
        const totalLateMinutes = attendance.reduce((sum, record) => sum + (record.late_minutes || 0), 0);
        console.log(`\n✓ Summary:`);
        console.log(`  Total records: ${attendance.length}`);
        console.log(`  Total late minutes: ${totalLateMinutes}`);
      }
    } else {
      // Generate and insert attendance records for full month
      console.log('Generating attendance records for May 3-30, 2026...');
      const attendanceRecords = generateAttendanceRecords(workerId);
      
      console.log(`Inserting ${attendanceRecords.length} attendance records...`);
      
      // Insert in batches of 50 to avoid payload size limits
      const batchSize = 50;
      let totalInserted = 0;
      
      for (let i = 0; i < attendanceRecords.length; i += batchSize) {
        const batch = attendanceRecords.slice(i, i + batchSize);
        const { data: insertedRecords, error: insertError } = await supabase
          .from('attendance')
          .insert(batch)
          .select();
        
        if (insertError) {
          throw insertError;
        }
        
        totalInserted += insertedRecords.length;
        console.log(`  Inserted ${totalInserted}/${attendanceRecords.length} records...`);
      }
      
      console.log(`✓ Attendance records created: ${totalInserted} records`);
      
      // Fetch and display summary
      const { data: attendance, error: summaryError } = await supabase
        .from('attendance')
        .select('date, late_minutes')
        .eq('worker_id', workerId)
        .gte('date', '2026-05-03')
        .lte('date', '2026-05-30')
        .order('date');
      
      if (summaryError) {
        throw summaryError;
      }
      
      if (attendance && attendance.length > 0) {
        const totalLateMinutes = attendance.reduce((sum, record) => sum + (record.late_minutes || 0), 0);
        console.log(`\n✓ Summary:`);
        console.log(`  Total records: ${attendance.length}`);
        console.log(`  Total late minutes: ${totalLateMinutes}`);
        console.log(`\n  First 5 records:`);
        attendance.slice(0, 5).forEach((record, index) => {
          console.log(`    ${index + 1}. ${record.date} - ${record.late_minutes} late minutes`);
        });
        console.log(`  ...`);
        console.log(`  Last 5 records:`);
        attendance.slice(-5).forEach((record, index) => {
          console.log(`    ${attendance.length - 4 + index}. ${record.date} - ${record.late_minutes} late minutes`);
        });
      }
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
