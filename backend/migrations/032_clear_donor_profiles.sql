-- ============================================================
-- 032: Clear all donor profile data (for re-import with new columns)
-- Cascades to fro_assignments and fro_donor_logs via FK ON DELETE CASCADE
-- ============================================================

TRUNCATE TABLE donor_profiles CASCADE;
