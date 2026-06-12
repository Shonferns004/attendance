ALTER TABLE leaves DROP CONSTRAINT IF EXISTS leaves_type_check;
ALTER TABLE leaves ADD CONSTRAINT leaves_type_check CHECK (type IN ('full_day', 'half_day', 'vacational', 'emergency'));
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS proof_data TEXT;
ALTER TABLE leaves ADD COLUMN IF NOT EXISTS proof_mime TEXT;
