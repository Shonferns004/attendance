CREATE TABLE IF NOT EXISTS telecaller_targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  target_amount DECIMAL NOT NULL DEFAULT 0,
  achievement_amount DECIMAL DEFAULT 0,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(worker_id, month)
);
