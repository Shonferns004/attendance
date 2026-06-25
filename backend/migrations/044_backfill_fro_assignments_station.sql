-- ============================================================
-- 044: Backfill fro_assignments.station where null
-- Matches fro_assignments to fro_station_assignments via
-- (fro_worker_id, ngo_id) to fill in the station name.
-- This handles rows created before the station column existed,
-- or before the FRO was assigned to the station.
-- ============================================================

UPDATE fro_assignments fa
SET station = fsa.station
FROM fro_station_assignments fsa
WHERE fa.fro_worker_id = fsa.fro_worker_id
  AND fa.ngo_id = fsa.ngo_id
  AND fa.station IS NULL;
