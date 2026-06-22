CREATE TABLE IF NOT EXISTS receipts (
  id SERIAL PRIMARY KEY,
  log_id INTEGER NOT NULL REFERENCES fro_donor_logs(id) ON DELETE CASCADE,
  receipt_no TEXT NOT NULL,
  project_id TEXT NOT NULL,
  donor_name TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  pan_number TEXT,
  address TEXT,
  mode TEXT,
  purpose TEXT DEFAULT 'General Donation',
  receipt_date DATE DEFAULT CURRENT_DATE,
  generated_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_receipts_log_id ON receipts(log_id);
CREATE INDEX IF NOT EXISTS idx_receipts_receipt_no ON receipts(receipt_no);
