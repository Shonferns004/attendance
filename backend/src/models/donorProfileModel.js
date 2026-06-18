import supabase from '../config/supabase.js';

export const getDonorByMobile = async (mobile) => {
  const { data, error } = await supabase
    .from('donor_profiles')
    .select('*')
    .eq('mobile_number', mobile)
    .limit(1);
  if (error) throw error;
  return data && data.length > 0 ? data[0] : null;
};

export const upsertDonorProfile = async (profile) => {
  const existing = await getDonorByMobile(profile.mobile_number);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('donor_profiles')
    .insert({
      mobile_number: profile.mobile_number,
      name: profile.name || null,
      bank_donor_name: profile.bank_donor_name || null,
      agent_donor_name: profile.agent_donor_name || null,
      mobile_2: profile.mobile_2 || null,
      address_1: profile.address_1 || null,
      address_2: profile.address_2 || null,
      city: profile.city || null,
      pin_code: profile.pin_code || null,
      pan_number: profile.pan_number || null,
      email: profile.email || null,
      birth_date: profile.birth_date || null,
      data_category: profile.data_category || null,
      team: profile.team || null,
      agent_name: profile.agent_name || null,
      mop: profile.mop || null,
      donors_bank_name: profile.donors_bank_name || null,
      project_supported: profile.project_supported || null,
      account_of: profile.account_of || null,
      raw_data: profile.raw_data || null,
      first_import_batch_id: profile.import_batch_id || null,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const insertDonorProfile = async (profile) => {
  const row = {
    mobile_number: profile.mobile_number,
    name: profile.name || null,
    bank_donor_name: profile.bank_donor_name || null,
    agent_donor_name: profile.agent_donor_name || null,
    mobile_2: profile.mobile_2 || null,
    address_1: profile.address_1 || null,
    address_2: profile.address_2 || null,
    city: profile.city || null,
    pin_code: profile.pin_code || null,
    pan_number: profile.pan_number || null,
    email: profile.email || null,
    birth_date: profile.birth_date || null,
    data_category: profile.data_category || null,
    team: profile.team || null,
    agent_name: profile.agent_name || null,
    mop: profile.mop || null,
    donors_bank_name: profile.donors_bank_name || null,
    project_supported: profile.project_supported || null,
    account_of: profile.account_of || null,
    raw_data: profile.raw_data || null,
    first_import_batch_id: profile.import_batch_id || null,
    category: profile.category || '',
    amount: profile.amount || 0,
  };
  const { data, error } = await supabase
    .from('donor_profiles')
    .insert(row)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const getAllDonorProfiles = async (limit = 500) => {
  const { data, error } = await supabase
    .from('donor_profiles')
    .select('*')
    .order('first_imported_at', { ascending: false })
    .limit(limit);
  if (error) throw error;
  return data;
};
