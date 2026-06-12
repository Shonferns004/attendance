-- Migration 004: Employee Onboarding tables
-- Adds personal details columns to workers, plus education, family, references, and policies tables

-- 1. Add personal details columns to workers table
ALTER TABLE workers ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS alternate_phone TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS pincode TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS photo_url TEXT;
ALTER TABLE workers ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- 2. Worker Education table
CREATE TABLE IF NOT EXISTS worker_education (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  degree TEXT NOT NULL,
  institution TEXT NOT NULL,
  university TEXT,
  year_of_passing INTEGER,
  percentage TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_education_worker_id ON worker_education(worker_id);

-- 3. Worker Family Details table
CREATE TABLE IF NOT EXISTS worker_family (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  relationship TEXT NOT NULL,
  occupation TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_family_worker_id ON worker_family(worker_id);

-- 4. Worker Professional References table
CREATE TABLE IF NOT EXISTS worker_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  designation TEXT,
  organization TEXT,
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_references_worker_id ON worker_references(worker_id);

-- 5. Company Policies table (editable via admin)
CREATE TABLE IF NOT EXISTS company_policies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO company_policies (title, content, sort_order) VALUES
('Attendance Policy', '• All employees must punch in and out using the QR code scanning system.\n• Office hours are from 10:00 AM to 7:00 PM, Monday through Saturday.\n• Employees must be at their designated workstations by 10:00 AM.\n• Late arrivals beyond 15 minutes will be marked as "Late" and tracked in the late balance.\n• More than 3 late arrivals in a month may result in a formal warning.\n• Regular attendance is a key factor in performance evaluations and promotions.', 1),
('Leave Policy', '• Full-day leave requires minimum 2 days prior notice and can only be applied after 12 PM.\n• Half-day leave requires minimum 1 day prior notice.\n• Vacational/planned leave requires minimum 30 days prior notice.\n• All leave applications must include a valid reason.\n• Emergency leave may be granted at management discretion.\n• Leave balance does not carry forward to the next year unless explicitly stated.', 2),
('Code of Conduct', '• Maintain professional behavior and dress code at all times.\n• Respect colleagues, supervisors, and company property.\n• Confidentiality of company and client information is mandatory.\n• Use of company resources (internet, devices) should be work-related.\n• Personal mobile phone usage during work hours should be minimal.\n• Any form of harassment, discrimination, or misconduct will result in disciplinary action.', 3),
('Workplace Safety', '• Follow all safety guidelines and procedures in your work area.\n• Report any hazards, accidents, or near-misses to your supervisor immediately.\n• Keep emergency exits and walkways clear at all times.\n• Know the locations of fire extinguishers and first aid kits.\n• Attend mandatory safety training sessions as scheduled.\n• Use provided safety equipment as required for your role.', 4),
('IT & Data Usage Policy', '• Company-provided devices (laptops, phones) are for official use only.\n• Do not install unauthorized software on company devices.\n• Use strong passwords and change them periodically.\n• Do not share your login credentials with anyone.\n• Report any suspicious emails or security breaches immediately.\n• Company data must not be copied or transferred to personal devices without authorization.', 5);
