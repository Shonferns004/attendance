import supabase from '../config/supabase.js';

export const getLeadList = async (req, res) => {
  try {
    const { status } = req.query;
    const statusFilter = status || 'pending';

    const { data, error } = await supabase
      .from('fro_donor_logs')
      .select(`
        id, action, disposition_category, disposition_detail, amount_collected,
        payment_screenshot_url, accounts_status, pan_number, notes, created_at,
        assignment_id,
        fro_assignments!inner(
          id,
          donor_id,
          fro_worker_id,
          status,
          donor_profiles!inner(id, name, mobile_number, city, pan_number),
          workers!inner(id, name, login_id)
        )
      `)
      .eq('action', 'disposition')
      .eq('disposition_detail', 'lead_done')
      .eq('accounts_status', statusFilter)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const result = (data || []).map(r => ({
      log_id: r.id,
      amount: r.amount_collected,
      screenshot_url: r.payment_screenshot_url,
      accounts_status: r.accounts_status,
      pan_number: r.pan_number,
      notes: r.notes,
      created_at: r.created_at,
      assignment_id: r.assignment_id,
      assignment_status: r.fro_assignments?.status || 'lead_done',
      donor_id: r.fro_assignments?.donor_id,
      donor_name: r.fro_assignments?.donor_profiles?.name || 'Unknown',
      donor_mobile: r.fro_assignments?.donor_profiles?.mobile_number || '',
      donor_city: r.fro_assignments?.donor_profiles?.city || '',
      donor_pan: r.fro_assignments?.donor_profiles?.pan_number || '',
      agent_id: r.fro_assignments?.fro_worker_id,
      agent_name: r.fro_assignments?.workers?.name || 'Unknown',
      agent_login: r.fro_assignments?.workers?.login_id || '',
    }));

    return res.json(result);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const verifyLead = async (req, res) => {
  try {
    const { logId } = req.params;
    const { pan_number, notes } = req.body;

    const { data: log, error: logError } = await supabase
      .from('fro_donor_logs')
      .select('*, fro_assignments!inner(id, fro_worker_id, donor_id, status, donor_profiles!inner(id, name, mobile_number))')
      .eq('id', logId)
      .single();

    if (logError || !log) {
      return res.status(404).json({ message: 'Log entry not found' });
    }

    if (log.accounts_status !== 'pending') {
      return res.status(400).json({ message: `This lead has already been ${log.accounts_status || 'processed'}` });
    }

    const assignmentId = log.fro_assignments?.id;
    if (!assignmentId) {
      return res.status(400).json({ message: 'Associated assignment not found' });
    }

    const { error: updateLogError } = await supabase
      .from('fro_donor_logs')
      .update({
        accounts_status: 'verified',
        verified_at: new Date().toISOString(),
        verified_by: req.user.id,
        pan_number: pan_number || log.pan_number || null,
        notes: notes || log.notes || null,
      })
      .eq('id', logId);

    if (updateLogError) throw updateLogError;

    const { error: updateAsgnError } = await supabase
      .from('fro_assignments')
      .update({
        status: 'donation_collected',
        last_contacted_at: new Date().toISOString(),
      })
      .eq('id', assignmentId);

    if (updateAsgnError) throw updateAsgnError;

    return res.json({ message: 'Lead verified, amount added to target' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
