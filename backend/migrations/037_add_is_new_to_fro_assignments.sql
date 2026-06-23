ALTER TABLE fro_assignments ADD COLUMN IF NOT EXISTS is_new BOOLEAN DEFAULT TRUE;
CREATE INDEX IF NOT EXISTS idx_fro_assignments_is_new ON fro_assignments(is_new);
