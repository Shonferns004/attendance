import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { themes, applyTheme } from './theme.js';

const HRContext = createContext(null);
export const useHR = () => useContext(HRContext);

const PALETTE = ['#5B6B4E','#B5603A','#C08A2E','#4F6472','#7A5C7E','#88693D'];
export const avatarColor = (name) => {
  let h = 0; for (const c of name) h = c.charCodeAt(0) + ((h << 5) - h);
  return PALETTE[Math.abs(h) % PALETTE.length];
};
export const initials = (n) => n.trim().split(/\s+/).map(w => w[0]).slice(0,2).join('').toUpperCase();
const tint = (hex) => hex + '22';
export const avatarTint = tint;

const now = () => new Date().toLocaleString('en-GB', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' });

export const DEPTS = ['FRO','Admin','HR-Recruiter','Housekeeping','CSR','Digital','Manager','Event Manager','NA'];

const API_BASE = import.meta.env.VITE_API_URL || 'https://attendance-roan-zeta.vercel.app/api';

export function HRProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem('hr_token') || '');
  const [user, setUser] = useState(() => {
    try { const u = localStorage.getItem('hr_user'); return u ? JSON.parse(u) : null; }
    catch { return null; }
  });
  const [workers, setWorkers] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [notifs, setNotifs] = useState([]);
  const [ngos, setNgos] = useState([]);
  const [feed, setFeed] = useState([{ id:'init', msg:'HR Panel ready', time:now() }]);
  const [loading, setLoading] = useState(false);
  const [themeName, setThemeName] = useState(() => localStorage.getItem('hr_theme') || 'sage');

  const setTheme = useCallback((name) => {
    if (themes[name]) {
      applyTheme(themes[name]);
      setThemeName(name);
      localStorage.setItem('hr_theme', name);
    }
  }, []);

  useEffect(() => {
    const t = themes[themeName];
    if (t) applyTheme(t);
  }, [themeName]);

  let idCounter = Date.now();
  const nextId = () => ++idCounter;

  const log = useCallback((msg) => {
    setFeed(f => [{ id:nextId(), msg, time:now() }, ...f].slice(0, 8));
  }, []);

  const api = useCallback(async (path, options = {}) => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE + path, {
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
        ...options,
      });
      if (res.status === 401) {
        setToken(''); setUser(null);
        localStorage.removeItem('hr_token'); localStorage.removeItem('hr_user');
        throw new Error('Session expired. Please login again.');
      }
      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: `HTTP ${res.status}` }));
        throw new Error(err.message || 'Request failed');
      }
      return res.json();
    } finally {
      setLoading(false);
    }
  }, [token]);

  const login = useCallback(async (identifier, password) => {
    const res = await fetch(API_BASE + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ identifier, password }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: 'Invalid credentials' }));
      throw new Error(err.message || 'Login failed');
    }
    const data = await res.json();
    setToken(data.token);
    setUser(data.user);
    localStorage.setItem('hr_token', data.token);
    localStorage.setItem('hr_user', JSON.stringify(data.user));
    log(`Logged in as ${data.user?.name || data.role}`);
    return data;
  }, [log]);

  const logout = useCallback(() => {
    setToken(''); setUser(null);
    localStorage.removeItem('hr_token'); localStorage.removeItem('hr_user');
    log('Logged out');
  }, [log]);

  const fetchWorkers = useCallback(async () => {
    const data = await api('/workers');
    setWorkers(data);
    return data;
  }, [api]);

  const fetchNGOs = useCallback(async () => {
    const data = await api('/ngos');
    setNgos(data);
    return data;
  }, [api]);

  const addWorker = useCallback(async ({ name, email, dept, ngo_id, allocations }) => {
    const body = { name, email: email || null, department: dept || null };
    if (allocations) {
      body.allocations = allocations;
    } else {
      body.ngo_id = ngo_id || null;
    }
    const data = await api('/workers', {
      method: 'POST',
      body: JSON.stringify(body),
    });
    const w = data.worker;
    setWorkers(p => [{ id: w.id, name: w.name, email: w.email, login_id: w.login_id, created_at: new Date().toISOString(), department: dept }, ...p]);
    log(`Added ${w.name}`);
    return data;
  }, [api, log]);

  const removeWorker = useCallback(async (id) => {
    const w = workers.find(x => x.id === id);
    await api('/workers/' + id, { method: 'DELETE' });
    setWorkers(p => p.filter(x => x.id !== id));
    if (w) log(`Removed ${w.name}`);
  }, [api, workers, log]);

  const fetchWorkerById = useCallback(async (id) => {
    return await api('/workers/' + id);
  }, [api]);

  const updateWorker = useCallback(async (id, updates) => {
    const data = await api('/workers/' + id, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    log(`Updated worker`);
    return data;
  }, [api, log]);

  const fetchAttendance = useCallback(async () => {
    const data = await api('/attendance/all');
    setAttendance(data);
    return data;
  }, [api]);

  const fetchLeaves = useCallback(async () => {
    const data = await api('/leaves');
    setLeaves(data);
    return data;
  }, [api]);

  const decideLeave = useCallback(async (id, status) => {
    const newStatus = status === 'Approved' ? 'approved' : 'rejected';
    const data = await api('/leaves/' + id + '/status', {
      method: 'PUT',
      body: JSON.stringify({ status: newStatus }),
    });
    setLeaves(p => p.map(l => l.id === id ? { ...l, status: newStatus } : l));
    const l = leaves.find(x => x.id === id);
    log(`Leave ${status.toLowerCase()} · ${l?.workers?.name || ''}`);
    return data;
  }, [api, leaves, log]);

  const fetchTemplates = useCallback(async () => {
    try {
      const data = await api('/letters/templates');
      setTemplates(data);
      return data;
    } catch { setTemplates([]); return []; }
  }, [api]);

  const generateLetter = useCallback(async (template_id, worker_id) => {
    const data = await api('/letters/generate', {
      method: 'POST',
      body: JSON.stringify({ template_id, worker_id }),
    });
    log(`Letter generated`);
    return data;
  }, [api, log]);

  const fetchWorkerLetters = useCallback(async (workerId) => {
    try {
      const res = await fetch(API_BASE + '/letters/generated/worker/' + workerId, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return [];
      return await res.json();
    } catch {
      return [];
    }
  }, [token]);

  const sendNotif = useCallback(async (title, body, worker_id) => {
    const data = await api('/admin/notifications/send-now', {
      method: 'POST',
      body: JSON.stringify({ title, body, worker_id: worker_id || undefined }),
    });
    setNotifs(p => [{ id:nextId(), to: title, msg: body, time:now() }, ...p]);
    log(`Notification sent`);
    return data;
  }, [api, log]);

  const [leads, setLeads] = useState([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [recruiters, setRecruiters] = useState([]);

  const fetchHolidays = useCallback(async () => {
    try {
      const data = await api('/holidays');
      setHolidays(data);
    } catch { /* ignore */ }
  }, [api]);

  const addHoliday = useCallback(async (h) => {
    const data = await api('/holidays', {
      method: 'POST',
      body: JSON.stringify(h),
    });
    setHolidays(p => [...p, data.holiday]);
    log(`Added holiday · ${h.name}`);
    return data;
  }, [api, log]);

  const removeHoliday = useCallback(async (id) => {
    await api('/holidays/' + id, { method: 'DELETE' });
    setHolidays(p => p.filter(h => h.id !== id));
  }, [api]);

  const fetchLeads = useCallback(async (filters = {}) => {
    setLeadsLoading(true);
    const params = new URLSearchParams();
    if (filters.recruiter_id) params.set('recruiter_id', filters.recruiter_id);
    if (filters.status) params.set('status', filters.status);
    if (filters.search) params.set('search', filters.search);
    const q = params.toString();
    const data = await api('/leads' + (q ? '?' + q : ''));
    setLeads(data);
    setLeadsLoading(false);
    return data;
  }, [api]);

  const addLead = useCallback(async (leadData) => {
    const data = await api('/leads', {
      method: 'POST',
      body: JSON.stringify(leadData),
    });
    setLeads(p => [data.lead, ...p]);
    log(`Lead added · ${data.lead.name}`);
    return data;
  }, [api, log]);

  const updateLead = useCallback(async (id, updates) => {
    const data = await api('/leads/' + id, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
    setLeads(p => p.map(l => l.id === id ? data.lead : l));
    log(`Lead updated`);
    return data;
  }, [api, log]);

  const fetchRecruiters = useCallback(async () => {
    const data = await api('/recruiters');
    setRecruiters(data);
    return data;
  }, [api]);

  const fetchRecruiterStats = useCallback(async (id) => {
    return await api('/recruiters/' + id + '/stats');
  }, [api]);

  const fetchWorkerSalaries = useCallback(async (workerId) => {
    return await api('/salary/worker/' + workerId);
  }, [api]);

  const addWorkerSalary = useCallback(async (data) => {
    const result = await api('/salary', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    log(`Salary added for worker`);
    return result;
  }, [api, log]);

  const updateWorkerSalary = useCallback(async (id, data) => {
    const result = await api('/salary/' + id, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return result;
  }, [api]);

  const fetchLeadsDashboard = useCallback(async () => {
    return await api('/leads/dashboard');
  }, [api]);

  const fetchWorkerTargets = useCallback(async (workerId) => {
    return await api('/incentive/worker/' + workerId + '/targets');
  }, [api]);

  const fetchWorkerTargetForMonth = useCallback(async (workerId, month) => {
    return await api('/incentive/worker/' + workerId + '/month/' + month);
  }, [api]);

  const updateWorkerTarget = useCallback(async (workerId, month, target_amount) => {
    return await api('/incentive/worker/' + workerId + '/month/' + month, {
      method: 'PUT',
      body: JSON.stringify({ target_amount }),
    });
  }, [api]);

  const fetchWorkerAllocations = useCallback(async (workerId) => {
    return await api('/workers/' + workerId + '/allocations');
  }, [api]);

  const setWorkerAllocations = useCallback(async (workerId, allocations, salary) => {
    return await api('/workers/' + workerId + '/allocations', {
      method: 'PUT',
      body: JSON.stringify({ allocations, salary }),
    });
  }, [api]);

  const fetchWorkerSalaryAllocations = useCallback(async (workerId, month) => {
    let url = '/salary/worker/' + workerId + '/allocations';
    if (month) url += '?month=' + month;
    return await api(url);
  }, [api]);

  const generateAllTargets = useCallback(async () => {
    return await api('/incentive/generate-all', { method: 'POST' });
  }, [api]);

  const fetchCurrentMonthTargets = useCallback(async () => {
    return await api('/incentive/current-month-targets');
  }, [api]);

  const setAchievement = useCallback(async (workerId, date, amount) => {
    return await api('/incentive/worker/' + workerId + '/achievement/' + date, {
      method: 'PUT',
      body: JSON.stringify({ amount }),
    });
  }, [api]);

  const fetchWorkerAchievements = useCallback(async (workerId, month) => {
    return await api('/incentive/worker/' + workerId + '/achievements/' + month);
  }, [api]);

  const fetchIncentiveSummary = useCallback(async (workerId, month) => {
    return await api('/incentive/worker/' + workerId + '/incentive-summary/' + month);
  }, [api]);

  const fetchMonthlyIncentiveSummary = useCallback(async () => {
    return await api('/incentive/monthly-summary');
  }, [api]);

  return (
    <HRContext.Provider value={{
      DEPTS, ngos, workers, attendance, leaves, templates, notifs, holidays, feed,
      loading, user, token, login, logout,
      fetchWorkers, fetchNGOs, addWorker, removeWorker, fetchWorkerById, updateWorker,
      fetchAttendance, fetchLeaves, decideLeave,
      fetchTemplates, generateLetter, fetchWorkerLetters, sendNotif,
      addHoliday, removeHoliday, fetchHolidays,
      themeName, setTheme, themes,
      leads, leadsLoading, recruiters,
      fetchLeads, addLead, updateLead,
      fetchRecruiters, fetchRecruiterStats, fetchLeadsDashboard,
      fetchWorkerSalaries, addWorkerSalary, updateWorkerSalary,
      fetchWorkerTargets, fetchWorkerTargetForMonth, updateWorkerTarget,
      generateAllTargets, fetchCurrentMonthTargets,
      setAchievement, fetchWorkerAchievements, fetchIncentiveSummary, fetchMonthlyIncentiveSummary,
      fetchWorkerAllocations, setWorkerAllocations, fetchWorkerSalaryAllocations,
    }}>
      {children}
    </HRContext.Provider>
  );
}
