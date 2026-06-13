-- Add second emergency contact columns to workers table
ALTER TABLE workers
ADD COLUMN IF NOT EXISTS emergency_contact_name2 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_relation2 TEXT,
ADD COLUMN IF NOT EXISTS emergency_contact_phone2 TEXT;
