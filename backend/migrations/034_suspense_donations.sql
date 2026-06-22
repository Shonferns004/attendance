CREATE TABLE IF NOT EXISTS suspense_donations (
  id SERIAL PRIMARY KEY,
  donor_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  transaction_date DATE,
  notes TEXT,
  assigned_to_fro_id UUID REFERENCES workers(id),
  assigned_at TIMESTAMPTZ,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved')),
  imported_data_id UUID REFERENCES imported_data(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE suspense_donations ENABLE ROW LEVEL SECURITY;

-- Index for faster lookups by status
CREATE INDEX IF NOT EXISTS idx_suspense_donations_status ON suspense_donations(status);
CREATE INDEX IF NOT EXISTS idx_suspense_donations_created_at ON suspense_donations(created_at DESC);
