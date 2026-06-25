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

const STATUS_GROUPS = [
  {
    label: 'Active',
    statuses: ['pending', 'contacted', 'follow_up', 'scheduled'],
    colors: { bg: '#fffbeb', text: '#92400e', dot: '#f59e0b', cellBg: '#fefce8' },
  },
  {
    label: 'Positive',
    statuses: ['donation_collected', 'promise_to_pay', 'lead_done', 'visit_donate', 'payment_pending', 'already_donated'],
    colors: { bg: '#f0fdf4', text: '#166534', dot: '#22c55e', cellBg: '#f0fdf4' },
  },
  {
    label: 'Negative',
    statuses: ['not_interested', 'not_interested_now', 'rejected', 'unreachable', 'switched_off', 'wrong_number', 'invalid_number', 'busy', 'ringing', 'language_barrier'],
    colors: { bg: '#fef2f2', text: '#991b1b', dot: '#ef4444', cellBg: '#fef2f2' },
  },
  {
    label: 'Other',
    statuses: ['transferred_senior', 'query_complaint', 'receipt_request'],
    colors: { bg: '#eff6ff', text: '#1e40af', dot: '#3b82f6', cellBg: '#eff6ff' },
  },
];

const STATUS_GROUP_MAP = {};
for (const g of STATUS_GROUPS) {
  for (const s of g.statuses) {
    STATUS_GROUP_MAP[s] = g;
  }
}

const getStatusStyle = (status) => {
  const g = STATUS_GROUP_MAP[status];
  if (!g) return { bg: '#f9fafb', text: '#374151', dot: '#6b7280', cellBg: '#f9fafb' };
  return g.colors;
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
        <div className="card" style={{ overflowX: 'auto', borderRadius: 12 }}>
          <div className="card-head" style={{ borderBottom: '1px solid var(--line, #e5e7eb)', padding: '14px 20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 700 }}>Station-wise Disposition Matrix</h3>
            <span className="count" style={{ fontSize: 12, padding: '3px 10px', borderRadius: 20, background: '#f0fdf4', color: '#166534', fontWeight: 600 }}>{stationNames.length} stations</span>
          </div>
          <div className="card-pad" style={{ padding: 0 }}>
            <table style={{ borderCollapse: 'collapse', width: '100%', minWidth: 750 }}>
              <thead>
                <tr>
                  <th style={{
                    textAlign: 'left', padding: '14px 20px',
                    borderBottom: '2px solid #e2e8f0',
                    background: '#f8fafc', position: 'sticky', left: 0, zIndex: 2,
                    fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: '#64748b', minWidth: 140,
                  }}>
                    Disposition
                  </th>
                  {stationNames.map(s => (
                    <th key={s} style={{
                      textAlign: 'center', padding: '14px 6px',
                      borderBottom: '2px solid #e2e8f0',
                      background: '#f8fafc',
                      fontWeight: 700, fontSize: 11, textTransform: 'uppercase',
                      letterSpacing: '0.04em', color: '#475569', whiteSpace: 'nowrap',
                    }}>
                      {s}
                    </th>
                  ))}
                  <th style={{
                    textAlign: 'center', padding: '14px 20px',
                    borderBottom: '2px solid #e2e8f0',
                    background: '#eef2ff',
                    fontWeight: 800, fontSize: 11, textTransform: 'uppercase',
                    letterSpacing: '0.05em', color: '#4338ca',
                  }}>
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {STATUS_GROUPS.map(group => {
                  const visibleStatuses = group.statuses.filter(status => {
                    const rowTotal = summary[status] || 0;
                    return rowTotal > 0 || stationNames.some(s => getCell(s, status) > 0);
                  });
                  if (visibleStatuses.length === 0) return null;
                  return (
                    <Fragment key={group.label}>
                      <tr>
                        <td colSpan={stationNames.length + 2} style={{
                          padding: '8px 20px 4px',
                          fontWeight: 700, fontSize: 11,
                          textTransform: 'uppercase', letterSpacing: '0.08em',
                          color: group.colors.text,
                          background: group.colors.bg,
                          borderBottom: '1px solid #e2e8f0',
                        }}>
                          {group.label}
                        </td>
                      </tr>
                      {visibleStatuses.map(status => {
                        const rowTotal = summary[status] || 0;
                        const sc = getStatusStyle(status);
                        const maxStation = Math.max(...stationNames.map(s => getCell(s, status)), 1);
                        return (
                          <tr key={status} style={{ transition: 'background 0.1s' }}
                            onMouseEnter={e => { e.currentTarget.style.background = '#f1f5f9'; }}
                            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
                            <td style={{
                              padding: '6px 20px',
                              borderBottom: '1px solid #f1f5f9',
                              fontWeight: 600, fontSize: 12,
                              position: 'sticky', left: 0, background: '#fff',
                              whiteSpace: 'nowrap',
                            }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', gap: 7,
                                padding: '2px 10px', borderRadius: 20,
                                background: sc.bg, color: sc.text, fontSize: 11, fontWeight: 600,
                              }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                                {DISPOSITION_LABELS[status] || status}
                              </span>
                            </td>
                            {stationNames.map(s => {
                              const val = getCell(s, status);
                              const pct = maxStation > 0 ? (val / maxStation) * 100 : 0;
                              return (
                                <td key={s} style={{
                                  padding: '6px 4px',
                                  borderBottom: '1px solid #f1f5f9',
                                  textAlign: 'center',
                                  position: 'relative',
                                }}>
                                  {val > 0 ? (
                                    <span style={{
                                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                      minWidth: 28, height: 26,
                                      padding: '0 8px',
                                      borderRadius: 8,
                                      background: sc.cellBg,
                                      color: sc.text,
                                      fontWeight: 700,
                                      fontSize: 13,
                                      position: 'relative',
                                      overflow: 'hidden',
                                    }}>
                                      <span style={{
                                        position: 'absolute', left: 0, top: 0, bottom: 0,
                                        width: `${Math.max(pct, 8)}%`,
                                        background: sc.dot,
                                        opacity: 0.1,
                                        borderRadius: 8,
                                      }} />
                                      <span style={{ position: 'relative', zIndex: 1 }}>{val}</span>
                                    </span>
                                  ) : (
                                    <span style={{ color: '#e2e8f0', fontSize: 12 }}>—</span>
                                  )}
                                </td>
                              );
                            })}
                            <td style={{
                              padding: '6px 20px',
                              borderBottom: '1px solid #f1f5f9',
                              textAlign: 'center',
                              fontWeight: 700, fontSize: 13,
                              background: sc.cellBg, color: sc.text,
                            }}>
                              <span style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                                minWidth: 28, height: 28,
                                borderRadius: 8,
                                fontWeight: 700, fontSize: 13,
                              }}>
                                {rowTotal}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </Fragment>
                  );
                })}
                <tr style={{ background: '#f0fdf4' }}>
                  <td style={{
                    padding: '12px 20px',
                    borderTop: '2px solid #bbf7d0',
                    fontWeight: 800, fontSize: 13,
                    position: 'sticky', left: 0, background: '#f0fdf4',
                    color: '#166534',
                  }}>
                    Total
                  </td>
                  {stationNames.map(s => {
                    const total = getStationTotal(s);
                    const grandTotal = stationNames.reduce((t, st) => t + getStationTotal(st), 0);
                    const pct = grandTotal > 0 ? (total / grandTotal) * 100 : 0;
                    return (
                      <td key={s} style={{
                        padding: '12px 4px',
                        borderTop: '2px solid #bbf7d0',
                        textAlign: 'center',
                        position: 'relative',
                      }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                          minWidth: 32, height: 30,
                          padding: '0 10px',
                          borderRadius: 8,
                          background: '#dcfce7',
                          color: '#166534',
                          fontWeight: 800, fontSize: 14,
                          position: 'relative',
                          overflow: 'hidden',
                        }}>
                          <span style={{
                            position: 'absolute', left: 0, top: 0, bottom: 0,
                            width: `${pct}%`,
                            background: '#22c55e',
                            opacity: 0.15,
                            borderRadius: 8,
                          }} />
                          <span style={{ position: 'relative', zIndex: 1 }}>{total}</span>
                        </span>
                      </td>
                    );
                  })}
                  <td style={{
                    padding: '12px 20px',
                    borderTop: '2px solid #bbf7d0',
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

function Fragment({ children }) {
  return children;
}
