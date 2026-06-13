CREATE TABLE IF NOT EXISTS holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  date DATE NOT NULL,
  type TEXT NOT NULL DEFAULT 'holiday' CHECK (type IN ('holiday', 'event')),
  is_recurring BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can select holidays"
  ON holidays FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "HR admins can insert holidays"
  ON holidays FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "HR admins can update holidays"
  ON holidays FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "HR admins can delete holidays"
  ON holidays FOR DELETE
  TO authenticated
  USING (true);
