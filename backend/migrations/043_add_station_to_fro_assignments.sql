-- ============================================================
-- 043: Add station column to fro_assignments for per-NGO tracking
-- Donor profiles are mobile-unique (shared across NGOs), so
-- donor_profiles.station gets overwritten. Store station per
-- fro_assignment instead.
-- Also make fro_worker_id nullable to allow assignments for
-- stations without FROs (donors still assigned to a station
-- via fro_assignments.station).
-- ============================================================

ALTER TABLE fro_assignments ADD COLUMN IF NOT EXISTS station TEXT;
ALTER TABLE fro_assignments ALTER COLUMN fro_worker_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_fro_assignments_station ON fro_assignments(station);
