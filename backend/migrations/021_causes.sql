ALTER TABLE ngos ADD COLUMN IF NOT EXISTS registration_no TEXT;
ALTER TABLE ngos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE TABLE IF NOT EXISTS causes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT,
  file_name TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_causes_ngo_id ON causes(ngo_id);
CREATE INDEX IF NOT EXISTS idx_causes_is_active ON causes(is_active);
