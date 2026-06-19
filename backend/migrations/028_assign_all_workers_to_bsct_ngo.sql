-- ============================================================
-- 028: Assign all workers to BSCT NGO
-- Links every worker to the BSCT NGO via worker_ngo_allocations
-- ============================================================

WITH bsct AS (
  SELECT id FROM ngos WHERE name ILIKE 'BSCT' LIMIT 1
),
worker_salary AS (
  SELECT DISTINCT ON (sh.worker_id)
    sh.worker_id,
    sh.salary
  FROM salary_history sh
  ORDER BY sh.worker_id, sh.from_month DESC
)
DELETE FROM worker_ngo_allocations
WHERE worker_id IN (SELECT id FROM workers);

INSERT INTO worker_ngo_allocations (worker_id, ngo_id, salary_portion)
SELECT
  w.id,
  (SELECT id FROM bsct),
  COALESCE(ws.salary, 0)
FROM workers w
LEFT JOIN worker_salary ws ON ws.worker_id = w.id;

UPDATE workers
SET ngo_id = (SELECT id FROM bsct)
WHERE ngo_id IS NULL;
