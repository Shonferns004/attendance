-- ============================================================
-- 038: Add status column to new_data for explicit state tracking
-- ============================================================

ALTER TABLE new_data ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'
  CHECK (status IN ('pending', 'converted', 'skipped'));

-- Mark existing rows that already have donor profiles as converted
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'donor_profiles') THEN
    UPDATE new_data nd
    SET status = 'converted'
    WHERE EXISTS (
      SELECT 1 FROM donor_profiles dp
      WHERE dp.mobile_number = nd.mobile_number
        AND (dp.ngo = nd.ngo OR (dp.ngo IS NULL AND nd.ngo IS NULL))
    );
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_new_data_status ON new_data(status);
