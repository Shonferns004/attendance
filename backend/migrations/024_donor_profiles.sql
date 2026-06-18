CREATE TABLE IF NOT EXISTS donor_profiles (
  mobile_number TEXT PRIMARY KEY,
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
  raw_data JSONB,
  first_import_batch_id UUID,
  first_imported_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donor_profiles_name ON donor_profiles(name);
CREATE INDEX IF NOT EXISTS idx_donor_profiles_city ON donor_profiles(city);
