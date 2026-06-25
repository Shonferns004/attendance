-- ============================================================
-- 041: Seed 37 stations (new_ucs-1 .. new_ucs-37)
-- Set the correct ngo_id before running
-- ============================================================

DO $$
DECLARE
  ngo_id_val UUID := 'REPLACE_WITH_YOUR_NGO_UUID';  -- <-- CHANGE THIS to your NGO's UUID
  i INTEGER;
BEGIN
  FOR i IN 1..37 LOOP
    INSERT INTO fro_station_assignments (ngo_id, station, assigned_by)
    VALUES (ngo_id_val, 'new_ucs-' || i, NULL);
  END LOOP;
END $$;
