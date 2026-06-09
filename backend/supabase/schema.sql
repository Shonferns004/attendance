CREATE TABLE workers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  login_id TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE tasks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed')),
  assigned_date TIMESTAMPTZ DEFAULT NOW(),
  deadline DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE qr_codes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  label TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  radius_meters DOUBLE PRECISION DEFAULT 100,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE attendance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID REFERENCES workers(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  punch_in_time TIMESTAMPTZ,
  punch_out_time TIMESTAMPTZ,
  punch_in_lat DOUBLE PRECISION,
  punch_in_lng DOUBLE PRECISION,
  punch_out_lat DOUBLE PRECISION,
  punch_out_lng DOUBLE PRECISION,
  late_minutes INTEGER DEFAULT 0,
  status TEXT DEFAULT 'present' CHECK (status IN ('present', 'late', 'absent')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_tasks_worker_id ON tasks(worker_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_workers_login_id ON workers(login_id);
CREATE INDEX idx_attendance_worker_date ON attendance(worker_id, date);
CREATE INDEX idx_attendance_month ON attendance(worker_id, date);
CREATE INDEX idx_qr_codes_code ON qr_codes(code);
