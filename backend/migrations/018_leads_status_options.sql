ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_status_check;
ALTER TABLE leads ADD CONSTRAINT leads_status_check CHECK (status IN ('rejected', 'selected', 'hold'));
UPDATE leads SET status = 'hold' WHERE status NOT IN ('rejected', 'selected', 'hold');
