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

const STATUS_COLORS = {
  green: new Set(['donation_collected', 'promise_to_pay', 'lead_done', 'visit_donate']),
  blue: new Set(['transferred_senior', 'query_complaint', 'receipt_request', 'payment_pending', 'already_donated']),
  amber: new Set(['pending', 'contacted', 'follow_up', 'scheduled']),
};

const getStatusStyle = (status) => {
  if (STATUS_COLORS.green.has(status)) return { bg: '#f0fdf4', text: '#166534', dot: '#22c55e' };
  if (STATUS_COLORS.blue.has(status)) return { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6' };
  if (STATUS_COLORS.amber.has(status)) return { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b' };
  return { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444' };
};

const STYLES = {
  statCard: (color) => ({
    background: '#fff',
    borderRadius: 14,
    padding: '22px 24px',
    borderLeft: `5px solid ${color}`,
    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    transition: 'transform 0.15s, box-shadow 0.15s',
    cursor: 'default',
  }),
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
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        <div style={STYLES.statCard('#6366f1')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(99,102,241,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{data.total_donors}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>Total Donors</div>
        </div>
        <div style={STYLES.statCard('#22c55e')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(34,197,94,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{data.assigned_donors}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>Assigned Donors</div>
        </div>
        <div style={STYLES.statCard('#f59e0b')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(245,158,11,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{data.active_fros}</div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>Active FRO Workers</div>
        </div>
        <div style={STYLES.statCard('#3b82f6')}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.15)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>
            ₹{Number(data.month_collection || 0).toLocaleString('en-IN')}
          </div>
          <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>Month Collection</div>
        </div>
      </div>

      {stationNames.length > 0 && (
        <div className="card" style={{ overflowX: 'auto' }}>
          <div className="card-head">
            <h3>Station-wise Disposition Matrix</h3>
            <span className="count">{stationNames.length} stations</span>
          </div>
          <div className="card-pad" style={{ overflowX: 'auto', padding: 0 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 700, fontSize: 13 }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left', padding: '12px 16px',
                    borderBottom: '2px solid var(--line, #e5e7eb)',
                    background: '#f8fafc', position: 'sticky', left: 0, zIndex: 2,
                    fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
                    letterSpacing: '0.04em', color: '#64748b', minWidth: 150,
                  }}>
                    Disposition
                  </th>
                  {stationNames.map(s => (
                    <th key={s} style={{
                      textAlign: 'center', padding: '12px 8px',
                      borderBottom: '2px solid var(--line, #e5e7eb)',
                      background: '#f8fafc',
                      fontWeight: 700, fontSize: 12, textTransform: 'uppercase',
                      letterSpacing: '0.03em', color: '#475569', whiteSpace: 'nowrap',
                    }}>
                      {s}
                    </th>
                  ))}
                  <th style={{
                    textAlign: 'center', padding: '12px 16px',
                    borderBottom: '2px solid var(--line, #e5e7eb)',
                    background: '#eef2ff',
                    fontWeight: 800, fontSize: 12, textTransform: 'uppercase',
                    letterSpacing: '0.04em', color: '#4338ca',
                  }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {DISPOSITION_ORDER.map(status => {
                  const rowTotal = summary[status] || 0;
                  if (rowTotal === 0 && stationNames.every(s => getCell(s, status) === 0)) return null;
                  const sc = getStatusStyle(status);
                  return (
                    <tr key={status} style={{ transition: 'background 0.1s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                      <td style={{
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--line, #e5e7eb)',
                        fontWeight: 600, fontSize: 12,
                        position: 'sticky', left: 0, background: '#fff',
                        whiteSpace: 'nowrap',
                      }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 8,
                          padding: '3px 10px', borderRadius: 20,
                          background: sc.bg, color: sc.text, fontSize: 12, fontWeight: 600,
                        }}>
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                          {DISPOSITION_LABELS[status] || status}
                        </span>
                      </td>
                      {stationNames.map(s => {
                        const val = getCell(s, status);
                        return (
                          <td key={s} style={{
                            padding: '8px 8px',
                            borderBottom: '1px solid var(--line, #e5e7eb)',
                            textAlign: 'center',
                            fontWeight: val > 0 ? 600 : 400,
                            color: val > 0 ? sc.text : '#e2e8f0',
                            fontSize: 14,
                            background: val > 0 ? sc.bg : 'transparent',
                            transition: 'background 0.1s',
                          }}>
                            {val || 0}
                          </td>
                        );
                      })}
                      <td style={{
                        padding: '8px 16px',
                        borderBottom: '1px solid var(--line, #e5e7eb)',
                        textAlign: 'center',
                        fontWeight: 700, fontSize: 14,
                        background: sc.bg, color: sc.text,
                      }}>
                        {rowTotal}
                      </td>
                    </tr>
                  );
                })}
                <tr style={{ background: '#f0fdf4' }}>
                  <td style={{
                    padding: '10px 16px',
                    borderTop: '2px solid var(--line, #e5e7eb)',
                    fontWeight: 800, fontSize: 13,
                    position: 'sticky', left: 0, background: '#f0fdf4',
                    color: '#166534',
                  }}>
                    Total
                  </td>
                  {stationNames.map(s => (
                    <td key={s} style={{
                      padding: '10px 8px',
                      borderTop: '2px solid var(--line, #e5e7eb)',
                      textAlign: 'center',
                      fontWeight: 800, fontSize: 14,
                      color: '#166534',
                    }}>
                      {getStationTotal(s)}
                    </td>
                  ))}
                  <td style={{
                    padding: '10px 16px',
                    borderTop: '2px solid var(--line, #e5e7eb)',
                    textAlign: 'center',
                    fontWeight: 800, fontSize: 15,
                    background: '#dcfce7', color: '#166534',
                  }}>
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
