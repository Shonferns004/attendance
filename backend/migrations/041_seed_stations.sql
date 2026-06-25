-- ============================================================
-- 041: Seed 37 stations (new_ucs-1 .. new_ucs-37)
-- Set the correct ngo_id before running
-- ============================================================

DO $$
DECLARE
  ngo_ids UUID[] := ARRAY['REPLACE_WITH_UUID_1'::UUID, 'REPLACE_WITH_UUID_2'::UUID];  -- <-- list all your NGO UUIDs here
  ngo_id UUID;
  i INTEGER;
  existing_count INTEGER;
BEGIN
  FOREACH ngo_id IN ARRAY ngo_ids LOOP
    FOR i IN 1..37 LOOP
      SELECT COUNT(*) INTO existing_count FROM fro_station_assignments
        WHERE ngo_id = ngo_id AND station = 'new_ucs-' || i;
      IF existing_count = 0 THEN
        INSERT INTO fro_station_assignments (ngo_id, station, assigned_by)
        VALUES (ngo_id, 'new_ucs-' || i, NULL);
      END IF;
    END LOOP;
  END LOOP;
END $$;
