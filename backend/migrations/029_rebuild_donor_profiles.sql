-- ============================================================
-- 029: Rebuild donor_profiles — deduplicate by mobile_number
-- Drops and recreates the table, aggregates from imported_data
-- Adds UNIQUE constraint on mobile_number
-- ============================================================

-- Drop dependent tables first (order matters for FK refs)
DROP TABLE IF EXISTS fro_donor_logs CASCADE;
DROP TABLE IF EXISTS fro_assignments CASCADE;
DROP TABLE IF EXISTS donor_profiles CASCADE;

-- Recreate donor_profiles with UNIQUE mobile_number + aggregated columns
CREATE TABLE donor_profiles (
  id SERIAL PRIMARY KEY,
  mobile_number TEXT NOT NULL UNIQUE,
  name TEXT,
  bank_donor_name TEXT,
  agent_donor_name TEXT,
  mobile_2 TEXT,
  address_1 TEXT,
  address_2 TEXT,
  city TEXT,
  pin_code TEXT,
  pan_number TEXT,
  email TEXT,
  birth_date DATE,
  data_category TEXT,
  team TEXT,
  agent_name TEXT,
  mop TEXT,
  donors_bank_name TEXT,
  project_supported TEXT,
  account_of TEXT,
  category TEXT,
  amount NUMERIC(12, 2) DEFAULT 0,
  total_amount NUMERIC(12, 2) DEFAULT 0,
  donation_count INTEGER DEFAULT 1,
  first_donation_date DATE,
  last_donation_date DATE,
  raw_data JSONB,
  first_import_batch_id UUID,
  first_imported_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Populate from imported_data — one row per mobile, aggregated
INSERT INTO donor_profiles (
  mobile_number, name, amount, total_amount, donation_count,
  first_donation_date, last_donation_date, category,
  bank_donor_name, agent_donor_name, mobile_2,
  address_1, address_2, city, pin_code, pan_number, email,
  birth_date, data_category, team, agent_name, mop,
  donors_bank_name, project_supported, account_of
)
SELECT
  i.mobile_number,
  MAX(i.name) as name,
  MAX(i.amount) as amount,
  SUM(i.amount) as total_amount,
  COUNT(*) as donation_count,
  MIN(i.transaction_date) as first_donation_date,
  MAX(i.transaction_date) as last_donation_date,
  MAX(i.category) as category,
  MAX(i.bank_donor_name),
  MAX(i.agent_donor_name),
  MAX(i.mobile_2),
  MAX(i.address_1),
  MAX(i.address_2),
  MAX(i.city),
  MAX(i.pin_code),
  MAX(i.pan_number),
  MAX(i.email),
  MAX(i.birth_date),
  MAX(i.data_category),
  MAX(i.team),
  MAX(i.agent_name),
  MAX(i.mop),
  MAX(i.donors_bank_name),
  MAX(i.project_supported),
  MAX(i.account_of)
FROM imported_data i
WHERE i.mobile_number IS NOT NULL AND i.mobile_number != ''
GROUP BY i.mobile_number;

-- Recreate fro_assignments (empty — previous assignments lost with donors)
CREATE TABLE IF NOT EXISTS fro_assignments (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
  fro_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','not_reachable','donation_collected','not_interested','follow_up')),
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up DATE,
  UNIQUE(donor_id, fro_worker_id)
);

-- Recreate fro_donor_logs (empty)
CREATE TABLE IF NOT EXISTS fro_donor_logs (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES fro_assignments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('call','visit','message','follow_up','donation','note')),
  notes TEXT,
  outcome TEXT,
  amount_collected NUMERIC(12,2),
  created_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Recreate indexes
CREATE INDEX IF NOT EXISTS idx_donor_profiles_name ON donor_profiles(name);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_city ON donor_profiles(city);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_mobile ON donor_profiles(mobile_number);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_worker ON fro_assignments(fro_worker_id);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_ngo ON fro_assignments(ngo_id);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_status ON fro_assignments(status);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_donor ON fro_assignments(donor_id);
CREATE INDEX IF NOT EXISTS idx_fro_donor_logs_assignment ON fro_donor_logs(assignment_id);
