-- ============================================================
-- 002: Drop workers.created_by FK constraint (HRs are in hrs table)
-- ============================================================

ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_created_by_fkey;
