-- ============================================================
-- 030: FRO Disposition System
-- Expands statuses, adds disposition tracking, scheduled contacts
-- ============================================================

-- 1. Drop old status check and add new one with full dispositions
ALTER TABLE fro_assignments DROP CONSTRAINT IF EXISTS fro_assignments_status_check;
ALTER TABLE fro_assignments ADD CONSTRAINT fro_assignments_status_check
  CHECK (status IN (
    'pending',
    'contacted',
    'donation_collected',
    'follow_up',
    'not_reachable',
    'not_interested',
    -- Not Connected
    'busy',
    'ringing',
    'unreachable',
    'switched_off',
    'wrong_number',
    'invalid_number',
    'rejected',
    -- Connected
    'lead_done',
    'scheduled',
    'visit_donate',
    'promise_to_pay',
    'payment_pending',
    'already_donated',
    'not_interested_now',
    'language_barrier',
    'transferred_senior',
    'query_complaint',
    'receipt_request',
    -- Accounts
    'payment_rejected'
  ));

-- 2. Add disposition columns to fro_donor_logs
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS disposition_category TEXT;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS disposition_detail TEXT;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS scheduled_at TIMESTAMPTZ;

-- 3. Update action check constraint to include 'disposition'
ALTER TABLE fro_donor_logs DROP CONSTRAINT IF EXISTS fro_donor_logs_action_check;
ALTER TABLE fro_donor_logs ADD CONSTRAINT fro_donor_logs_action_check
  CHECK (action IN ('call','visit','message','follow_up','donation','note','disposition'));

-- 3b. Add payment tracking columns for lead_done with screenshot
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS payment_screenshot_url TEXT;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS accounts_status TEXT DEFAULT NULL;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS pan_number TEXT DEFAULT NULL;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ DEFAULT NULL;
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES workers(id);
ALTER TABLE fro_donor_logs ADD COLUMN IF NOT EXISTS rejection_reason TEXT DEFAULT NULL;

-- 4. Create fro_scheduled_contacts table
CREATE TABLE IF NOT EXISTS fro_scheduled_contacts (
  id SERIAL PRIMARY KEY,
  assignment_id INTEGER NOT NULL REFERENCES fro_assignments(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  notes TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  reminded BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES workers(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for scheduled contacts
CREATE INDEX IF NOT EXISTS idx_scheduled_contacts_assignment ON fro_scheduled_contacts(assignment_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_contacts_due ON fro_scheduled_contacts(scheduled_at)
  WHERE is_completed = FALSE;
