-- ============================================================
-- Seed: demo_ufs_59 — joins Jan 15, 2026 with fake attendance
-- Run this in the Supabase SQL editor
-- ============================================================

DO $$
DECLARE
  v_worker_id UUID;
  v_ngo_id UUID;
  v_user_id UUID;
  v_salary_id UUID;
  v_date DATE;
  v_status TEXT;
  v_late INTEGER;
  v_punch_in TIMESTAMPTZ;
  v_punch_out TIMESTAMPTZ;
  v_start_date DATE := '2026-01-15';
  v_end_date DATE := '2026-06-15';
  v_rand REAL;
  v_shift_start INTEGER := 10;  -- 10:00
  v_shift_end INTEGER := 19;    -- 19:00
  v_hour INTEGER;
  v_min INTEGER;
BEGIN

  -- Get an existing NGO (use first one)
  SELECT id INTO v_ngo_id FROM ngos ORDER BY created_at ASC LIMIT 1;
  IF v_ngo_id IS NULL THEN
    RAISE EXCEPTION 'No NGO found. Create an NGO first.';
  END IF;

  -- Get an existing user to be created_by
  SELECT id INTO v_user_id FROM users ORDER BY created_at ASC LIMIT 1;

  -- ============================================================
  -- 1. Create or update worker demo_ufs_59
  -- ============================================================
  -- Delete existing attendance/salary for this login first
  DELETE FROM salary_history WHERE worker_id IN (SELECT id FROM workers WHERE login_id = 'demo_ufs_59');
  DELETE FROM attendance WHERE worker_id IN (SELECT id FROM workers WHERE login_id = 'demo_ufs_59');
  DELETE FROM workers WHERE login_id = 'demo_ufs_59';

  INSERT INTO workers (name, login_id, password, shift, department, ngo_id, created_by, created_at, updated_at, is_active)
  VALUES (
    'Demo Employee',
    'demo_ufs_59',
    '$2a$10$bzglPnfp3whlrPXWVDWAYOV1882aRn9V6p43r/PLLPS4VV4SSDb/u',  -- "123456"
    '10-7',
    'FRO',
    v_ngo_id,
    v_user_id,
    '2026-01-15 00:00:00+00',
    '2026-01-15 00:00:00+00',
    true
  )
  RETURNING id INTO v_worker_id;

  RAISE NOTICE 'Created worker: %', v_worker_id;

  -- ============================================================
  -- 2. Generate attendance from Jan 15 to Jun 15, 2026
  -- ============================================================
  v_date := v_start_date;
  WHILE v_date <= v_end_date LOOP
    -- Skip Sundays
    IF EXTRACT(DOW FROM v_date) = 0 THEN
      v_date := v_date + 1;
      CONTINUE;
    END IF;

    -- Randomly assign status
    v_rand := random();
    v_status := 'present';
    v_late := 0;
    v_punch_in := NULL;
    v_punch_out := NULL;

    -- Force absences on Jun 3, Jun 5 (pay date delay) and May 4 (compact card demo)
    IF v_date IN ('2026-06-03', '2026-06-05') THEN
      v_status := 'absent';
    ELSIF v_date = '2026-05-04' THEN
      v_status := 'absent';
    ELSIF v_rand < 0.08 THEN
      -- 8% absent
      v_status := 'absent';
    ELSIF v_rand < 0.20 THEN
      -- 12% late (various minutes)
      v_status := 'late';
      v_late := CASE
        WHEN v_rand < 0.10 THEN floor(random() * 20 + 1)::INT   -- 1-20 min
        WHEN v_rand < 0.13 THEN floor(random() * 30 + 21)::INT  -- 21-50 min
        WHEN v_rand < 0.16 THEN floor(random() * 60 + 51)::INT  -- 51-110 min
        ELSE floor(random() * 120 + 111)::INT                    -- 111-230 min
      END;
    END IF;

    -- Generate punch times for present/late
    IF v_status IN ('present', 'late') THEN
      v_hour := v_shift_start + (v_late / 60);
      v_min := v_late % 60;
      IF v_hour >= 24 THEN v_hour := 23; v_min := 59; END IF;

      -- Punch in (in IST, stored as TIMESTAMPTZ)
      v_punch_in := (v_date || 'T' || LPAD(v_hour::TEXT, 2, '0') || ':' || LPAD(v_min::TEXT, 2, '0') || ':00+05:30')::TIMESTAMPTZ;

      -- Punch out (~9 hours later, or early for late days)
      IF v_late > 120 THEN
        -- Very late: shorter day
        v_punch_out := (v_date || 'T' || LPAD((v_hour + 6 + floor(random() * 2))::TEXT, 2, '0') || ':' || LPAD(floor(random() * 60)::TEXT, 2, '0') || ':00+05:30')::TIMESTAMPTZ;
      ELSE
        -- Normal day
        v_punch_out := (v_date || 'T' || LPAD((19 + floor(random() * 2))::TEXT, 2, '0') || ':' || LPAD(floor(random() * 30)::TEXT, 2, '0') || ':00+05:30')::TIMESTAMPTZ;
      END IF;
    END IF;

    -- Insert attendance record
    INSERT INTO attendance (worker_id, date, status, late_minutes, punch_in_time, punch_out_time)
    VALUES (v_worker_id, v_date, v_status, v_late, v_punch_in, v_punch_out);

    v_date := v_date + 1;
  END LOOP;

  RAISE NOTICE 'Created attendance records from % to %', v_start_date, v_end_date;

  -- ============================================================
  -- 3. Create salary records for each month (Jan-Jun), all paid
  -- ============================================================
  -- January (partial: 15th-31st)
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-01-01', '2026-01-31', v_user_id, '2026-02-10 00:00:00+00');

  -- February (full)
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-02-01', '2026-02-28', v_user_id, '2026-03-10 00:00:00+00');

  -- March (full)
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-03-01', '2026-03-31', v_user_id, '2026-04-10 00:00:00+00');

  -- April (full)
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-04-01', '2026-04-30', v_user_id, '2026-05-10 00:00:00+00');

  -- May (full) — unpaid to demonstrate "Due by" in compact card
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-05-01', '2026-05-31', v_user_id, NULL);

  -- June (current month, unpaid — to demonstrate pay date logic)
  INSERT INTO salary_history (worker_id, salary, from_month, to_month, created_by, paid_at)
  VALUES (v_worker_id, 59000.00, '2026-06-01', '2026-06-30', v_user_id, NULL);

  RAISE NOTICE 'Created salary records (all paid) for Jan-Jun 2026';
  RAISE NOTICE 'DONE ✓ Worker demo_ufs_59 created successfully. Password: 123456';
END $$;
