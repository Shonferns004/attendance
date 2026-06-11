import { getAllNgos } from '../models/ngoModel.js';
import { getAllUsers, getUsersCountByRole } from '../models/userModel.js';
import { getAllHRs } from '../models/hrModel.js';
import { getAllWorkers } from '../models/workerModel.js';
import supabase from '../config/supabase.js';

export const getSuperAdminDashboard = async (req, res) => {
  try {
    const ngos = await getAllNgos();
    const [users, hrs, workers] = await Promise.all([
      getAllUsers({}),
      getAllHRs({}),
      getAllWorkers(),
    ]);

    const activeUsers = users.filter((u) => u.is_active).length;
    const stats = {
      totalNgos: ngos.length,
      totalUsers: users.length,
      activeUsers,
      totalWorkers: workers.length,
      totalHr: hrs.length,
      totalRecruiters: users.filter((u) => u.role === 'recruiter').length,
    };

    const ngoUserCounts = await Promise.all(
      ngos.map(async (ngo) => ({
        id: ngo.id, name: ngo.name, code: ngo.code,
        users: (await getAllUsers({ ngo_id: ngo.id })).length,
        workers: workers.filter((w) => w.ngo_id === ngo.id).length,
      }))
    );

    const roleDistribution = {};
    users.forEach((u) => {
      roleDistribution[u.role] = (roleDistribution[u.role] || 0) + 1;
    });

    const deptWorkers = {};
    workers.forEach((w) => {
      if (w.department) deptWorkers[w.department] = (deptWorkers[w.department] || 0) + 1;
    });

    return res.json({ stats, ngoUserCounts, roleDistribution, deptWorkers, recentActivity: [] });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getHrDashboard = async (req, res) => {
  try {
    const workers = await getAllWorkers();
    const users = await getAllUsers({});

    const totalWorkers = workers.length;
    const recruiters = users.filter((u) => u.role === 'recruiter').length;
    const totalNgos = (await getAllNgos()).length;

    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
    const newThisMonth = workers.filter((w) => w.created_at >= monthStart).length;

    const { data: leaves } = await supabase
      .from('leaves')
      .select('status')
      .eq('status', 'pending');
    const pendingLeaves = leaves?.length || 0;

    const { data: attendance } = await supabase
      .from('attendance')
      .select('status');
    const statusCounts = { present: 0, late: 0, absent: 0, leave: 0 };
    (attendance || []).forEach((a) => {
      if (statusCounts[a.status] !== undefined) statusCounts[a.status]++;
    });

    const deptWorkers = {};
    workers.forEach((w) => {
      if (w.department) deptWorkers[w.department] = (deptWorkers[w.department] || 0) + 1;
    });

    const genderCounts = { Male: 0, Female: 0, Other: 0 };
    workers.forEach((w) => {
      if (w.gender && genderCounts[w.gender] !== undefined) genderCounts[w.gender]++;
    });

    return res.json({
      stats: { totalWorkers, recruiters, pendingLeaves, newThisMonth, totalNgos, totalUsers: users.length },
      attendanceStatus: statusCounts,
      deptWorkers,
      genderCounts,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getHoadminDashboard = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const workers = ngoId ? await getAllWorkers(ngoId) : await getAllWorkers();
    const users = ngoId ? await getAllUsers({ ngo_id: ngoId }) : await getAllUsers({});

    const userCounts = {};
    users.forEach((u) => { userCounts[u.role] = (userCounts[u.role] || 0) + 1; });

    const { data: attendance } = await supabase
      .from('attendance')
      .select('status, workers!inner(ngo_id)');

    const statusCounts = { present: 0, late: 0, absent: 0, leave: 0 };
    const workerIds = new Set(workers.map((w) => w.id));
    (attendance || []).forEach((a) => {
      if (workerIds.has(a.worker_id) && statusCounts[a.status] !== undefined) statusCounts[a.status]++;
    });

    const deptWorkers = {};
    workers.forEach((w) => {
      if (w.department) deptWorkers[w.department] = (deptWorkers[w.department] || 0) + 1;
    });

    return res.json({
      stats: { totalWorkers: workers.length, ...userCounts },
      attendanceStatus: statusCounts,
      deptWorkers,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getAccountsDashboard = async (req, res) => {
  try {
    const ngoId = req.user.ngo_id;
    const workers = ngoId ? await getAllWorkers(ngoId) : await getAllWorkers();

    const { data: attendance } = await supabase
      .from('attendance')
      .select('worker_id, status, date, late_minutes');

    const workerIds = new Set(workers.map((w) => w.id));
    const monthAttendance = (attendance || []).filter((a) => workerIds.has(a.worker_id));

    const deptWorkers = {};
    workers.forEach((w) => {
      if (w.department) deptWorkers[w.department] = (deptWorkers[w.department] || 0) + 1;
    });

    return res.json({
      stats: { totalWorkers: workers.length },
      deptWorkers,
      attendanceCount: monthAttendance.length,
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getRecruiterDashboard = async (req, res) => {
  try {
    const workers = await getAllWorkers();
    const totalWorkers = workers.length;
    return res.json({ stats: { totalWorkers } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getLeadsDashboard = async (req, res) => {
  try {
    return res.json({ stats: { totalLeads: 0, callsToday: 0 } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTelecallerDashboard = async (req, res) => {
  try {
    return res.json({ stats: { assignedLeads: 0, callsMade: 0 } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTeamLeadDashboard = async (req, res) => {
  try {
    return res.json({ stats: { teamSize: 0, pendingTasks: 0 } });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
