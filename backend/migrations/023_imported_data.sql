CREATE TABLE IF NOT EXISTS imported_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_source_id UUID NOT NULL REFERENCES data_sources(id) ON DELETE CASCADE,
  import_date DATE NOT NULL,
  import_batch_id UUID NOT NULL,

  mobile_number TEXT NOT NULL,
  name TEXT,

  category TEXT NOT NULL,
  amount NUMERIC(12,2) DEFAULT 0,

  transaction_date DATE,
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
  received_bank TEXT,
  payment_id_no TEXT,
  donors_bank_name TEXT,
  receipt_no TEXT,
  receipt_date DATE,
  receipt_time TEXT,
  project_supported TEXT,
  account_of TEXT,
  branch TEXT,

  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_imported_mobile ON imported_data(mobile_number);
CREATE INDEX IF NOT EXISTS idx_imported_batch ON imported_data(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_imported_source ON imported_data(data_source_id);
CREATE INDEX IF NOT EXISTS idx_imported_date ON imported_data(import_date);
CREATE INDEX IF NOT EXISTS idx_imported_category ON imported_data(category);
CREATE INDEX IF NOT EXISTS idx_imported_transaction_date ON imported_data(transaction_date);
