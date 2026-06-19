-- ============================================================
-- 027: FRO (Field Relationship Officer) Tables
-- Donor assignments, monthly collection targets, and CRM logs
-- ============================================================

-- fro_assignments: tracks which donor is assigned to which FRO worker
CREATE TABLE IF NOT EXISTS fro_assignments (
  id SERIAL PRIMARY KEY,
  donor_mobile TEXT NOT NULL REFERENCES donor_profiles(mobile_number) ON DELETE CASCADE,
  fro_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES users(id),
  assigned_at TIMESTAMPTZ DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','contacted','not_reachable','donation_collected','not_interested','follow_up')),
  notes TEXT,
  last_contacted_at TIMESTAMPTZ,
  next_follow_up DATE,
  UNIQUE(donor_mobile, fro_worker_id)
);

-- fro_monthly_targets: monthly donation collection targets per FRO worker
CREATE TABLE IF NOT EXISTS fro_monthly_targets (
  id SERIAL PRIMARY KEY,
  fro_worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  month DATE NOT NULL,
  target_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  set_by UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(fro_worker_id, ngo_id, month)
);

-- fro_donor_logs: detailed CRM tracking for each assignment
CREATE TABLE IF NOT EXISTS fro_donor_logs (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES fro_assignments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('call','visit','message','follow_up','donation','note')),
  notes TEXT,
  outcome TEXT,
  amount_collected NUMERIC(12,2),
  created_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fro_assignments_worker ON fro_assignments(fro_worker_id);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_ngo ON fro_assignments(ngo_id);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_status ON fro_assignments(status);
CREATE INDEX IF NOT EXISTS idx_fro_assignments_donor ON fro_assignments(donor_mobile);
CREATE INDEX IF NOT EXISTS idx_fro_monthly_targets_lookup ON fro_monthly_targets(fro_worker_id, month);
CREATE INDEX IF NOT EXISTS idx_fro_monthly_targets_ngo ON fro_monthly_targets(ngo_id, month);
CREATE INDEX IF NOT EXISTS idx_fro_donor_logs_assignment ON fro_donor_logs(assignment_id);
