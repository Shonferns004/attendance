-- ============================================================
-- 040: Station Rework — FRO optional on stations, reassign support
-- ============================================================

-- Allow stations without FROs
ALTER TABLE fro_station_assignments ALTER COLUMN fro_worker_id DROP NOT NULL;

-- Allow multiple assignments of same donor (reassignment history)
ALTER TABLE fro_assignments DROP CONSTRAINT IF EXISTS fro_assignments_donor_id_fro_worker_id_key;

-- Allow reassigned status (drop old check, app handles validation)
ALTER TABLE fro_assignments DROP CONSTRAINT IF EXISTS fro_assignments_status_check;

-- Add direct donor+worker refs to fro_donor_logs for station-based lookup
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS donor_id INTEGER REFERENCES donor_profiles(id);
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS fro_worker_id UUID REFERENCES workers(id);
