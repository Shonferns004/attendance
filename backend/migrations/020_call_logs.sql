CREATE TABLE IF NOT EXISTS call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES leads(id) ON DELETE CASCADE,
  telecaller_id UUID REFERENCES users(id) ON DELETE SET NULL,
  call_time TIMESTAMPTZ DEFAULT now(),
  duration_seconds INTEGER DEFAULT 0,
  call_type TEXT CHECK (call_type IN ('outgoing','incoming','missed')),
  status TEXT CHECK (status IN ('connected','not_reached','busy','switched_off','wrong_number')),
  notes TEXT,
  follow_up_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_call_logs_lead_id ON call_logs(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_telecaller_id ON call_logs(telecaller_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_call_time ON call_logs(call_time);
