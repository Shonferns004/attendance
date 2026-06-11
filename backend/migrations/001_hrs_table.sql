-- ============================================================
-- 001: Create hrs table (separate from users)
-- ============================================================

-- Create hrs table
CREATE TABLE IF NOT EXISTS hrs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  department TEXT,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_hrs_ngo_id ON hrs(ngo_id);
CREATE INDEX idx_hrs_email ON hrs(email);

-- Migrate existing HR users to hrs table
INSERT INTO hrs (id, ngo_id, name, email, password_hash, department, created_by, is_active, last_login, created_at, updated_at)
SELECT id, ngo_id, name, email, password_hash, department, created_by, is_active, last_login, created_at, updated_at
FROM users WHERE role = 'hr'
ON CONFLICT (id) DO NOTHING;

-- Remove migrated HRs from users table
DELETE FROM users WHERE role = 'hr';

-- Update users role CHECK constraint
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check CHECK (role IN ('hoadmin', 'accounts', 'leads', 'recruiter', 'telecaller', 'team_lead'));
