ALTER TABLE donor_profiles DROP CONSTRAINT IF EXISTS donor_profiles_pkey CASCADE;

ALTER TABLE donor_profiles ADD COLUMN id SERIAL PRIMARY KEY;

ALTER TABLE donor_profiles ADD COLUMN category TEXT;
ALTER TABLE donor_profiles ADD COLUMN amount NUMERIC(12, 2) DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_donor_profiles_mobile ON donor_profiles(mobile_number);
