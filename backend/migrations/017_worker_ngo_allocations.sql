CREATE TABLE IF NOT EXISTS worker_ngo_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id UUID NOT NULL REFERENCES workers(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE RESTRICT,
  salary_portion NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(worker_id, ngo_id)
);

ALTER TABLE worker_ngo_allocations ENABLE ROW LEVEL SECURITY;

-- Backfill: create allocations for existing workers based on their ngo_id
INSERT INTO worker_ngo_allocations (worker_id, ngo_id, salary_portion)
SELECT
  w.id,
  w.ngo_id,
  COALESCE(
    (SELECT sh.salary FROM salary_history sh WHERE sh.worker_id = w.id ORDER BY sh.from_month DESC LIMIT 1),
    0
  ) AS salary_portion
FROM workers w
WHERE w.ngo_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM worker_ngo_allocations wna WHERE wna.worker_id = w.id
  );
