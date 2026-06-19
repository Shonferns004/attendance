CREATE TABLE IF NOT EXISTS user_ngo_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ngo_id UUID NOT NULL REFERENCES ngos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, ngo_id)
);

CREATE INDEX IF NOT EXISTS idx_user_ngo_access_user_id ON user_ngo_access(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ngo_access_ngo_id ON user_ngo_access(ngo_id);
