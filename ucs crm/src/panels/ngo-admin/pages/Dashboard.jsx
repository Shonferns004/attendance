import { useState, useEffect } from 'react';
import { apiGet } from '../api/auth';

const DISPOSITION_ORDER = [
  'pending', 'contacted', 'follow_up', 'scheduled',
  'busy', 'ringing', 'unreachable', 'switched_off', 'wrong_number', 'invalid_number', 'rejected',
  'lead_done', 'visit_donate', 'promise_to_pay', 'payment_pending', 'already_donated',
  'not_interested', 'not_interested_now', 'language_barrier',
  'transferred_senior', 'query_complaint', 'receipt_request',
  'donation_collected',
];

const DISPOSITION_LABELS = {
  pending: 'Pending', contacted: 'Contacted', follow_up: 'Follow Up', scheduled: 'Scheduled',
  busy: 'Busy', ringing: 'Ringing', unreachable: 'Unreachable', switched_off: 'Switched Off',
  wrong_number: 'Wrong Number', invalid_number: 'Invalid', rejected: 'Rejected',
  lead_done: 'Lead Done', visit_donate: 'Visit & Donate', promise_to_pay: 'Promise to Pay',
  payment_pending: 'Payment Pending', already_donated: 'Already Donated',
  not_interested: 'Not Interested', not_interested_now: 'Not Interested Now',
  language_barrier: 'Language Barrier', transferred_senior: 'Transferred to Senior',
  query_complaint: 'Query/Complaint', receipt_request: 'Receipt Request',
  donation_collected: 'Donation Collected',
};

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [stationStats, setStationStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiGet('/ngo-admin/dashboard'),
      apiGet('/ngo-admin/dashboard/station-stats'),
    ])
      .then(([d, s]) => { setData(d); setStationStats(s); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data) return <div className="empty-state"><p>Could not load dashboard data.</p></div>;

  const stations = stationStats?.stations || {};
  const summary = stationStats?.summary || {};
  const stationNames = Object.keys(stations).sort((a, b) => {
    const idxA = a.lastIndexOf('-');
    const idxB = b.lastIndexOf('-');
    const numA = idxA > 0 ? parseInt(a.slice(idxA + 1)) || 0 : 0;
    const numB = idxB > 0 ? parseInt(b.slice(idxB + 1)) || 0 : 0;
    const preA = idxA > 0 ? a.slice(0, idxA) : a;
    const preB = idxB > 0 ? b.slice(0, idxB) : b;
    if (preA !== preB) return preA.localeCompare(preB);
    return numA - numB;
  });

  const getCell = (station, status) => stations[station]?.[status] || 0;
  const getStationTotal = (station) => {
    let t = 0;
    for (const s of Object.values(stations[station] || {})) t += s;
    return t;
  };

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-num">{data.total_donors}</div>
          <div className="stat-lbl">Total Donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.assigned_donors}</div>
          <div className="stat-lbl">Assigned Donors</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">{data.active_fros}</div>
          <div className="stat-lbl">Active FRO Workers</div>
        </div>
        <div className="stat-card">
          <div className="stat-num">₹{Number(data.month_collection || 0).toLocaleString('en-IN')}</div>
          <div className="stat-lbl">Month Collection</div>
        </div>
      </div>

      {stationNames.length > 0 && (
        <div className="card" style={{ marginTop: 20, overflowX: 'auto' }}>
          <div className="card-head">
            <h3>Station-wise Disposition Matrix</h3>
          </div>
          <div className="card-pad" style={{ overflowX: 'auto' }}>
            <table style={{ fontSize: 12, borderCollapse: 'collapse', width: '100%', minWidth: 600 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', padding: '6px 10px', borderBottom: '2px solid var(--line, #e5e7eb)', background: '#f9fafb', position: 'sticky', left: 0 }}>Disposition</th>
                  {stationNames.map(s => (
                    <th key={s} style={{ textAlign: 'center', padding: '6px 8px', borderBottom: '2px solid var(--line, #e5e7eb)', background: '#f9fafb', fontWeight: 700, fontSize: 11 }}>{s}</th>
                  ))}
                  <th style={{ textAlign: 'center', padding: '6px 10px', borderBottom: '2px solid var(--line, #e5e7eb)', background: '#eef2ff', fontWeight: 800 }}>Total</th>
                </tr>
              </thead>
              <tbody>
                {DISPOSITION_ORDER.map(status => {
                  const rowTotal = summary[status] || 0;
                  if (rowTotal === 0 && stationNames.every(s => getCell(s, status) === 0)) return null;
                  return (
                    <tr key={status}>
                      <td style={{ padding: '4px 10px', borderBottom: '1px solid var(--line, #e5e7eb)', fontWeight: 600, fontSize: 11, position: 'sticky', left: 0, background: '#fff', whiteSpace: 'nowrap' }}>
                        {DISPOSITION_LABELS[status] || status}
                      </td>
                      {stationNames.map(s => {
                        const val = getCell(s, status);
                        return (
                          <td key={s} style={{ padding: '4px 8px', borderBottom: '1px solid var(--line, #e5e7eb)', textAlign: 'center', color: val > 0 ? 'inherit' : '#d1d5db' }}>
                            {val || 0}
                          </td>
                        );
                      })}
                      <td style={{ padding: '4px 10px', borderBottom: '1px solid var(--line, #e5e7eb)', textAlign: 'center', fontWeight: 700, background: '#f9fafb' }}>
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f0fdf4' }}>
                  <td style={{ padding: '6px 10px', borderTop: '2px solid var(--line, #e5e7eb)', fontWeight: 800, fontSize: 12, position: 'sticky', left: 0, background: '#f0fdf4' }}>
                    Total
                  </td>
                  {stationNames.map(s => (
                    <td key={s} style={{ padding: '6px 8px', borderTop: '2px solid var(--line, #e5e7eb)', textAlign: 'center', fontWeight: 800 }}>
                      {getStationTotal(s)}
                    </td>
                  ))}
                  <td style={{ padding: '6px 10px', borderTop: '2px solid var(--line, #e5e7eb)', textAlign: 'center', fontWeight: 800, background: '#eef2ff' }}>
                    {stationNames.reduce((t, s) => t + getStationTotal(s), 0)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
