import { useState, useEffect } from 'react';
import { fetchCallLogs } from '../api/callLogs';

const STATUS_STYLES = {
  connected: 'pill-green',
  not_reached: 'pill-yellow',
  busy: 'pill-red',
  switched_off: 'pill-gray',
  wrong_number: 'pill-red',
};

export default function CallLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;
    fetchCallLogs(params)
      .then(setLogs)
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleFilter = () => { load(); };

  if (loading) return <div className="loading">Loading call logs…</div>;

  return (
    <div>
      <div className="card">
        <div className="card-head"><h3>Call Logs</h3></div>
        <div className="card-pad">
          <div className="filter-bar">
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All statuses</option>
              <option value="connected">Connected</option>
              <option value="not_reached">Not Reached</option>
              <option value="busy">Busy</option>
              <option value="switched_off">Switched Off</option>
              <option value="wrong_number">Wrong Number</option>
            </select>
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)}
              placeholder="From" style={{ maxWidth:140 }} />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)}
              placeholder="To" style={{ maxWidth:140 }} />
            <button className="btn btn-sm btn-primary" onClick={handleFilter}>Filter</button>
            <span className="count">{logs.length} log{logs.length !== 1 ? 's' : ''}</span>
          </div>

          {logs.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📞</div>
              <h3>No call logs</h3>
              <p>Calls you log will appear here.</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Date/Time</th>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Duration</th>
                  <th>Follow-up</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr key={log.id}>
                    <td style={{ whiteSpace:'nowrap', fontSize:12 }}>
                      {new Date(log.call_time).toLocaleString('en-GB', {
                        day:'numeric', month:'short', hour:'2-digit', minute:'2-digit',
                      })}
                    </td>
                    <td style={{ fontWeight:500 }}>{log.leads?.name || '\u2014'}</td>
                    <td>{log.leads?.phone || '\u2014'}</td>
                    <td>
                      <span className="pill pill-gray" style={{ fontSize:10 }}>{log.call_type}</span>
                    </td>
                    <td>
                      <span className={`pill ${STATUS_STYLES[log.status] || 'pill-gray'}`} style={{ fontSize:10 }}>
                        {log.status ? log.status.replace(/_/g, ' ') : '\u2014'}
                      </span>
                    </td>
                    <td>{log.duration_seconds > 0 ? `${log.duration_seconds}s` : '\u2014'}</td>
                    <td style={{ fontSize:12 }}>
                      {log.follow_up_date
                        ? new Date(log.follow_up_date + 'T00:00:00').toLocaleDateString('en-GB', { day:'numeric', month:'short' })
                        : '\u2014'}
                    </td>
                    <td style={{ maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--ink-soft)', fontSize:12 }}>
                      {log.notes || '\u2014'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
