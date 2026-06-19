-- ============================================================
-- 028: Assign all workers to BSCT NGO
-- Links every worker to the BSCT NGO via worker_ngo_allocations
-- ============================================================

-- First, clear existing allocations
DELETE FROM worker_ngo_allocations
WHERE worker_id IN (SELECT id FROM workers);

-- Insert new allocations: all workers → BSCT with their latest salary
INSERT INTO worker_ngo_allocations (worker_id, ngo_id, salary_portion)
SELECT
  w.id,
  (SELECT id FROM ngos WHERE name ILIKE 'BSCT' LIMIT 1),
  COALESCE((
    SELECT sh.salary FROM salary_history sh
    WHERE sh.worker_id = w.id
    ORDER BY sh.from_month DESC
    LIMIT 1
  ), 0)
FROM workers w;

-- Set all workers' ngo_id to BSCT
UPDATE workers
SET ngo_id = (SELECT id FROM ngos WHERE name ILIKE 'BSCT' LIMIT 1);
