-- ============================================================
-- 041: Seed 37 stations (new_ucs-1 .. new_ucs-37)
-- Each station gets assigned to a random NGO
-- ============================================================

DO $$
DECLARE
  ngo_ids UUID[];
  random_ngo UUID;
  i INTEGER;
BEGIN
  -- Fetch all NGO UUIDs
  SELECT ARRAY_AGG(id) INTO ngo_ids FROM ngos;

  IF array_length(ngo_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'No NGOs found in the database';
  END IF;

  FOR i IN 1..37 LOOP
    -- Pick a random NGO from the list
    random_ngo := ngo_ids[1 + floor(random() * array_length(ngo_ids, 1))];

    INSERT INTO fro_station_assignments (ngo_id, station, assigned_by)
    VALUES (random_ngo, 'new_ucs-' || i, NULL);
  END LOOP;
END $$;
