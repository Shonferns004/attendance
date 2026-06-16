ALTER TABLE leads ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_date DATE;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_by UUID;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;
ALTER TABLE leads ADD COLUMN IF NOT EXISTS scheduled_by_name TEXT;

ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('rejected', 'selected', 'hold', 'scheduled', 'joined'));

UPDATE leads SET status = 'hold' WHERE status NOT IN ('rejected', 'selected', 'hold', 'scheduled', 'joined');
