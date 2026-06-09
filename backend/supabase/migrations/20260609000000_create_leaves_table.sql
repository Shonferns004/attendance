-- Run this in Supabase SQL Editor
CREATE TABLE IF NOT EXISTS leaves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('full_day', 'half_day', 'vacational')),
  leave_date DATE,
  start_date DATE,
  end_date DATE,
  half_start_time TIME,
  half_end_time TIME,
  days NUMERIC(4,1) NOT NULL,
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_remark TEXT,
  applied_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_leaves_worker_id ON leaves(worker_id);
CREATE INDEX IF NOT EXISTS idx_leaves_status ON leaves(status);
