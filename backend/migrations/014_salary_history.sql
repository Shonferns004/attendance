CREATE TABLE IF NOT EXISTS salary_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  salary NUMERIC(12,2) NOT NULL,
  from_month DATE NOT NULL,
  to_month DATE,
  created_by UUID,
  paid_at TIMESTAMPTZ,
  extra_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE salary_history ENABLE ROW LEVEL SECURITY;
