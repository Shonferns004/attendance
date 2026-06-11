-- ============================================================
-- 002: Drop FK constraints so HRs can create workers & users
-- ============================================================

ALTER TABLE workers DROP CONSTRAINT IF EXISTS workers_created_by_fkey;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_created_by_fkey;
