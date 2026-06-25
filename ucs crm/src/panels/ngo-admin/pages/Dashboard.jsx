import { useState, useEffect } from 'react';
import { apiGet } from '../api/auth';

const GROUPS = [
  {
    key: 'collected', label: 'Collected',
    statuses: ['donation_collected', 'promise_to_pay', 'lead_done', 'visit_donate', 'payment_pending', 'already_donated'],
    color: '#22c55e',
  },
  {
    key: 'active', label: 'Active',
    statuses: ['pending', 'contacted', 'follow_up', 'scheduled'],
    color: '#f59e0b',
  },
  {
    key: 'negative', label: 'Negative',
    statuses: ['not_interested', 'not_interested_now', 'rejected', 'busy', 'ringing', 'unreachable', 'switched_off', 'wrong_number', 'invalid_number', 'language_barrier'],
    color: '#ef4444',
  },
  {
    key: 'other', label: 'Other',
    statuses: ['transferred_senior', 'query_complaint', 'receipt_request'],
    color: '#3b82f6',
  },
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
  const [modalData, setModalData] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');

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

  const getGroupCount = (station, group) => {
    let total = 0;
    for (const s of group.statuses) {
      total += stations[station]?.[s] || 0;
    }
    return total;
  };

  const getStationTotal = (station) => {
    let t = 0;
    for (const g of GROUPS) t += getGroupCount(station, g);
    return t;
  };

  const handleSegmentClick = async (station, group) => {
    setModalLoading(true);
    setSelectedFilter('all');
    setModalData(null);
    try {
      const donors = await apiGet(`/ngo-admin/donors-by-station?station=${encodeURIComponent(station)}`);
      setModalData({ station, group, donors });
    } catch (e) {
      setModalData({ station, group, donors: [], error: 'Failed to load donors' });
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => {
    setModalData(null);
    setSelectedFilter('all');
  };

  const getFilteredDonors = () => {
    if (!modalData || !modalData.donors) return [];
    const { group, donors } = modalData;
    if (selectedFilter === 'all') {
      return donors.filter(d => group.statuses.includes(d.status));
    }
    return donors.filter(d => d.status === selectedFilter);
  };

  return (
    <div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
        gap: 16,
        marginBottom: 24,
      }}>
        {[
          { label: 'Total Donors', value: data.total_donors, color: '#6366f1' },
          { label: 'Assigned Donors', value: data.assigned_donors, color: '#22c55e' },
          { label: 'Active FRO Workers', value: data.active_fros, color: '#f59e0b' },
          { label: 'Month Collection', value: `₹${Number(data.month_collection || 0).toLocaleString('en-IN')}`, color: '#3b82f6' },
        ].map((card, i) => (
          <div key={i} style={{
            background: '#fff', borderRadius: 14, padding: '22px 24px',
            borderLeft: `5px solid ${card.color}`,
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
          }}>
            <div style={{ fontSize: 28, fontWeight: 800, color: '#1a1a2e', lineHeight: 1.2 }}>{card.value}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4, fontWeight: 500 }}>{card.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <div className="card-head">
          <h3>Station-wise Disposition</h3>
          <span className="count">{stationNames.length} stations</span>
        </div>
        <div className="card-pad" style={{ padding: '16px 20px' }}>
          {stationNames.map(station => {
            const total = getStationTotal(station);
            if (total === 0) return null;
            return (
              <StationBar
                key={station}
                station={station}
                total={total}
                groups={GROUPS.map(g => ({ ...g, count: getGroupCount(station, g) }))}
                onSegmentClick={handleSegmentClick}
              />
            );
          })}
        </div>
      </div>

      {modalData && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 900, width: '90%', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div className="modal-head">
              <h3>{modalData.station} — {modalData.group.label}</h3>
              <button onClick={closeModal}>✕</button>
            </div>
            <div className="modal-body" style={{ flex: 1, overflow: 'auto', padding: 16 }}>
              <div style={{ marginBottom: 12, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 12, color: '#64748b', fontWeight: 600, marginRight: 4 }}>Filter:</span>
                <button
                  className={`btn btn-sm ${selectedFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                  style={{ fontSize: 12, padding: '3px 10px', borderRadius: 14 }}
                  onClick={() => setSelectedFilter('all')}
                >
                  All ({modalData.group.statuses.reduce((t, s) => t + ((stations[modalData.station]?.[s]) || 0), 0)})
                </button>
                {modalData.group.statuses
                  .filter(s => (stations[modalData.station]?.[s] || 0) > 0)
                  .map(s => (
                    <button
                      key={s}
                      className={`btn btn-sm ${selectedFilter === s ? 'btn-primary' : 'btn-outline'}`}
                      style={{ fontSize: 12, padding: '3px 10px', borderRadius: 14 }}
                      onClick={() => setSelectedFilter(s)}
                    >
                      {DISPOSITION_LABELS[s] || s} ({stations[modalData.station]?.[s] || 0})
                    </button>
                  ))}
              </div>
              {modalLoading ? (
                <div className="loading" style={{ padding: 40 }}>Loading donors...</div>
              ) : (
                <DonorTable donors={getFilteredDonors()} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StationBar({ station, total, groups, onSegmentClick }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
        <span style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>{station}</span>
        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{total} total</span>
      </div>
      <div style={{ display: 'flex', borderRadius: 8, overflow: 'hidden', height: 32, background: '#f1f5f9' }}>
        {groups.map(g => {
          if (g.count === 0) return null;
          const pct = (g.count / total) * 100;
          return (
            <div
              key={g.key}
              onClick={() => onSegmentClick(station, g)}
              title={`${g.label}: ${g.count}`}
              style={{
                width: `${pct}%`,
                minWidth: 24,
                background: g.color,
                opacity: 0.8,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 11,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'opacity 0.15s',
                position: 'relative',
                borderRight: '1px solid rgba(255,255,255,0.3)',
              }}
              onMouseEnter={e => { e.currentTarget.style.opacity = '1'; }}
              onMouseLeave={e => { e.currentTarget.style.opacity = '0.8'; }}
            >
              {pct > 8 ? g.count : null}
            </div>
          );
        })}
      </div>
      {groups.filter(g => g.count > 0).length > 0 && (
        <div style={{ display: 'flex', gap: 14, marginTop: 4, flexWrap: 'wrap' }}>
          {groups.filter(g => g.count > 0).map(g => (
            <div key={g.key} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 8, height: 8, borderRadius: 2, background: g.color, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#64748b' }}>{g.label}: <strong>{g.count}</strong></span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DonorTable({ donors }) {
  if (donors.length === 0) {
    return <div className="empty-state" style={{ padding: 30 }}><p>No donors found for this filter.</p></div>;
  }
  return (
    <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 13 }}>
      <thead>
        <tr>
          <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Name</th>
          <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Mobile</th>
          <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>FRO</th>
          <th style={{ textAlign: 'center', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Status</th>
          <th style={{ textAlign: 'center', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Last Contacted</th>
          <th style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '2px solid #e2e8f0', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#64748b' }}>Notes</th>
        </tr>
      </thead>
      <tbody>
        {donors.map(d => (
          <tr key={d.id} style={{ transition: 'background 0.1s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; }}
            onMouseLeave={e => { e.currentTarget.style.background = ''; }}>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontWeight: 600 }}>{d.donor_name}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#475569' }}>{d.donor_mobile}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', color: '#64748b' }}>{d.fro_name}</td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center' }}>
              <span style={{
                display: 'inline-block', padding: '2px 8px', borderRadius: 12,
                fontSize: 11, fontWeight: 600,
                background: d.status === 'donation_collected' ? '#f0fdf4' : d.status === 'not_interested' || d.status === 'rejected' ? '#fef2f2' : '#fffbeb',
                color: d.status === 'donation_collected' ? '#166534' : d.status === 'not_interested' || d.status === 'rejected' ? '#991b1b' : '#92400e',
              }}>
                {DISPOSITION_LABELS[d.status] || d.status}
              </span>
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', textAlign: 'center', fontSize: 12, color: '#64748b' }}>
              {d.last_contacted_at ? new Date(d.last_contacted_at).toLocaleDateString('en-IN') : '—'}
            </td>
            <td style={{ padding: '8px 10px', borderBottom: '1px solid #f1f5f9', fontSize: 12, color: '#64748b', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {d.notes || '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
