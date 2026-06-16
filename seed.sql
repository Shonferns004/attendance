-- ============================================================
-- SEED DATA: Add test worker with late minutes
-- ============================================================

-- First, let's check if the worker already exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM workers WHERE login_id = 'test2') THEN
    INSERT INTO workers (
      id,
      ngo_id,
      name,
      email,
      login_id,
      password,
      gender,
      dob,
      phone,
      address,
      shift,
      department,
      created_by,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NULL, -- ngo_id (nullable)
      'Test Worker Two',
      'test2@example.com',
      'test2',
      '$2a$10$92IXUNpkjOoOCisRbDP0fOeuVyD90I3e2h6w4c3z5z7z6z5z4z3z2z1', -- Hashed password (bcrypt)
      'Female',
      '1990-01-01',
      '+1234567890',
      '123 Test Street, Test City, Test State',
      'general',
      'HR-Recruitment', -- department
      '550e8400-e29b-41d4-a716-446655440001', -- Sample created_by (HR user)
      true,
      '2026-05-03 09:00:00', -- Joining date: 3rd May 2026
      '2026-05-03 09:00:00'  -- Updated at: 3rd May 2026
    );
  END IF;
END $$;

-- Add attendance records for the worker with late minutes (from 3rd May 2026 to 30th May 2026)
WITH test_worker AS (
  SELECT id FROM workers WHERE login_id = 'test2'
)
INSERT INTO attendance (
  id,
  worker_id,
  date,
  punch_in_time,
  punch_out_time,
  late_minutes,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  w.id,
  '2026-05-03',
  '2026-05-03 08:00:00',
  '2026-05-03 18:00:00',
  180, -- 180 late minutes (3 hours)
  'late',
  now()
FROM test_worker w
WHERE NOT EXISTS (
  SELECT 1 FROM attendance 
  WHERE worker_id = w.id 
  AND date = '2026-05-03'
);

-- Add more attendance records with late minutes to exceed 500 total
WITH test_worker AS (
  SELECT id FROM workers WHERE login_id = 'test2'
)
INSERT INTO attendance (
  id,
  worker_id,
  date,
  punch_in_time,
  punch_out_time,
  late_minutes,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  w.id,
  '2026-05-04',
  '2026-05-04 08:30:00',
  '2026-05-04 19:30:00',
  200, -- 200 late minutes (3 hours 20 minutes)
  'late',
  now()
FROM test_worker w
WHERE NOT EXISTS (
  SELECT 1 FROM attendance 
  WHERE worker_id = w.id 
  AND date = '2026-05-04'
);

-- Add one more attendance record with late minutes
WITH test_worker AS (
  SELECT id FROM workers WHERE login_id = 'test2'
)
INSERT INTO attendance (
  id,
  worker_id,
  date,
  punch_in_time,
  punch_out_time,
  late_minutes,
  status,
  created_at
)
SELECT
  gen_random_uuid(),
  w.id,
  '2026-05-05',
  '2026-05-05 09:00:00',
  '2026-05-05 17:00:00',
  150, -- 150 late minutes (2.5 hours)
  'late',
  now()
FROM test_worker w
WHERE NOT EXISTS (
  SELECT 1 FROM attendance 
  WHERE worker_id = w.id 
  AND date = '2026-05-05'
);

-- Verify the total late minutes for the worker
SELECT 
  w.name,
  SUM(a.late_minutes) as total_late_minutes,
  COUNT(*) as total_records
FROM workers w
LEFT JOIN attendance a ON w.id = a.worker_id
WHERE w.login_id = 'test2'
GROUP BY w.id, w.name;
