import supabase from '../config/supabase.js';

export const createStationAssignment = async (data) => {
  const { data: result, error } = await supabase
    .from('fro_station_assignments')
    .insert([data])
    .select('*, workers!fro_station_assignments_fro_worker_id_fkey(id, name, login_id)')
    .single();
  if (error) throw error;
  return result;
};

export const upsertStationAssignment = async (fro_worker_id, ngo_id, station, assigned_by) => {
  const { data: existing } = await supabase
    .from('fro_station_assignments')
    .select('id')
    .eq('ngo_id', ngo_id)
    .eq('station', station)
    .maybeSingle();

  if (existing) {
    const { data, error } = await supabase
      .from('fro_station_assignments')
      .update({ fro_worker_id, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select('*, workers!fro_station_assignments_fro_worker_id_fkey(id, name, login_id)')
      .single();
    if (error) throw error;
    return data;
  }

  const { data, error } = await supabase
    .from('fro_station_assignments')
    .insert([{ fro_worker_id, ngo_id, station, assigned_by }])
    .select('*, workers!fro_station_assignments_fro_worker_id_fkey(id, name, login_id)')
    .single();
  if (error) throw error;
  return data;
};

export const getStationAssignmentsByNgo = async (ngoIds) => {
  const { data, error } = await supabase
    .from('fro_station_assignments')
    .select('*, workers!fro_station_assignments_fro_worker_id_fkey(id, name, login_id)')
    .in('ngo_id', ngoIds)
    .order('station', { ascending: true });
  if (error) throw error;
  return data || [];
};

export const deleteStationAssignment = async (id) => {
  const { error } = await supabase
    .from('fro_station_assignments')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

export const getStationAssignmentByNgoAndStation = async (ngoId, station) => {
  const { data, error } = await supabase
    .from('fro_station_assignments')
    .select('*, workers!fro_station_assignments_fro_worker_id_fkey(id, name, login_id)')
    .eq('ngo_id', ngoId)
    .eq('station', station)
    .maybeSingle();
  if (error) throw error;
  return data;
};
