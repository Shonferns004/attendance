-- Add new columns to existing imported_data table (safe to run multiple times)

ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS transaction_date DATE;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS bank_donor_name TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS agent_donor_name TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS mobile_2 TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS address_1 TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS address_2 TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS pin_code TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS pan_number TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS birth_date DATE;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS data_category TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS team TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS agent_name TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS mop TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS received_bank TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS payment_id_no TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS donors_bank_name TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS receipt_no TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS receipt_date DATE;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS receipt_time TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS project_supported TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS account_of TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS branch TEXT;
ALTER TABLE imported_data ALTER COLUMN name DROP NOT NULL;

-- Make name nullable if it was NOT NULL before
DO $$ BEGIN
  ALTER TABLE imported_data ALTER COLUMN name DROP NOT NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS idx_imported_category ON imported_data(category);
CREATE INDEX IF NOT EXISTS idx_imported_transaction_date ON imported_data(transaction_date);
