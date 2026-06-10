-- ============================================================
-- UFS CRM + Attendance — Full Schema
-- Drop all tables (CASCADE handles FK dependencies)
-- Then recreate everything from scratch
-- ============================================================

DROP TABLE IF EXISTS generated_letters CASCADE;
DROP TABLE IF EXISTS letter_templates CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS leaves CASCADE;
DROP TABLE IF EXISTS tasks CASCADE;
DROP TABLE IF EXISTS qr_codes CASCADE;
DROP TABLE IF EXISTS settings CASCADE;
DROP TABLE IF EXISTS workers CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS ngos CASCADE;

-- ============================================================
-- 1. NGOS (tenants)
-- ============================================================
CREATE TABLE ngos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  address TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_ngos_code ON ngos(code);
CREATE INDEX idx_ngos_is_active ON ngos(is_active);

-- ============================================================
-- 2. USERS (CRM roles: hoadmin, hr, accounts, leads, recruiter, telecaller, team_lead)
-- ============================================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('hoadmin','hr','accounts','leads','recruiter','telecaller','team_lead')),
  department TEXT,
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_ngo_id ON users(ngo_id);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_is_active ON users(is_active);

-- ============================================================
-- 3. WORKERS (employees who use the Flutter attendance app)
-- ============================================================
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  login_id TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  gender TEXT,
  dob DATE,
  phone TEXT,
  address TEXT,
  shift TEXT DEFAULT 'general',
  department TEXT,
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_workers_ngo_id ON workers(ngo_id);
CREATE INDEX idx_workers_login_id ON workers(login_id);
CREATE INDEX idx_workers_created_by ON workers(created_by);

-- ============================================================
-- 4. ATTENDANCE (punch in/out records)
-- ============================================================
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  punch_in_time TIMESTAMPTZ,
  punch_in_lat DOUBLE PRECISION,
  punch_in_lng DOUBLE PRECISION,
  punch_out_time TIMESTAMPTZ,
  punch_out_lat DOUBLE PRECISION,
  punch_out_lng DOUBLE PRECISION,
  late_minutes INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'present' CHECK (status IN ('present','late','absent','leave')),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_attendance_worker_id ON attendance(worker_id);
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE UNIQUE INDEX idx_attendance_worker_date ON attendance(worker_id, date);

-- ============================================================
-- 5. LEAVES (leave applications)
-- ============================================================
CREATE TABLE leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('full_day','half_day','vacational')),
  leave_date DATE,
  start_date DATE,
  end_date DATE,
  half_start_time TIME,
  half_end_time TIME,
  days NUMERIC(4,1) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  admin_remark TEXT,
  applied_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_leaves_worker_id ON leaves(worker_id);
CREATE INDEX idx_leaves_status ON leaves(status);

-- ============================================================
-- 6. TASKS (admin-assigned tasks for workers)
-- ============================================================
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','in_progress','completed')),
  deadline DATE,
  assigned_date TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX idx_tasks_status ON tasks(status);

-- ============================================================
-- 7. QR CODES (geo-fenced location QR codes)
-- ============================================================
CREATE TABLE qr_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  label TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_qr_codes_code ON qr_codes(code);

-- ============================================================
-- 8. SETTINGS (key-value config store)
-- ============================================================
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Default settings
INSERT INTO settings (key, value) VALUES
  ('office_start_time', '10:00'),
  ('office_end_time', '19:00')
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 9. LETTER TEMPLATES (HTML templates for HR letters)
-- ============================================================
CREATE TABLE letter_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('joining','offer','experience','appointment','salary_revision')),
  html_content TEXT NOT NULL,
  variables JSONB DEFAULT '[]',
  created_by UUID REFERENCES users(id),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_letter_templates_ngo_id ON letter_templates(ngo_id);
CREATE INDEX idx_letter_templates_category ON letter_templates(category);

-- ============================================================
-- 10. GENERATED LETTERS (HR-generated letters for workers)
-- ============================================================
CREATE TABLE generated_letters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES letter_templates(id) ON DELETE SET NULL,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  generated_by UUID REFERENCES users(id),
  filled_html TEXT NOT NULL,
  variables JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_generated_letters_ngo_id ON generated_letters(ngo_id);
CREATE INDEX idx_generated_letters_template_id ON generated_letters(template_id);
CREATE INDEX idx_generated_letters_worker_id ON generated_letters(worker_id);
