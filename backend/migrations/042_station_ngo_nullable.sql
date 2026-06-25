-- ============================================================
-- 042: Allow stations without an NGO assignment
-- ============================================================

ALTER TABLE fro_station_assignments ALTER COLUMN ngo_id DROP NOT NULL;
