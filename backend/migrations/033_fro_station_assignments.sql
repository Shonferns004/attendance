CREATE TABLE IF NOT EXISTS fro_station_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fro_worker_id UUID REFERENCES workers(id) ON DELETE CASCADE NOT NULL,
  ngo_id UUID REFERENCES ngos(id) ON DELETE CASCADE NOT NULL,
  station TEXT NOT NULL,
  assigned_by UUID REFERENCES users(id),
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(ngo_id, station)
);
