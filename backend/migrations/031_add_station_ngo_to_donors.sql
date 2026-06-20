-- ============================================================
-- 031: Add station and ngo columns to donor_profiles & imported_data
-- ============================================================

ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS station TEXT;
ALTER TABLE donor_profiles ADD COLUMN IF NOT EXISTS ngo TEXT;

ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS station TEXT;
ALTER TABLE imported_data ADD COLUMN IF NOT EXISTS ngo TEXT;
