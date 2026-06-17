CREATE TABLE IF NOT EXISTS incentive_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL,
  is_auto_generated BOOLEAN DEFAULT false,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(worker_id, month)
);

ALTER TABLE incentive_targets ENABLE ROW LEVEL SECURITY;
