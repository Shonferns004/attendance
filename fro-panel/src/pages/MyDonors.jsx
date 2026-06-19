import { useState, useEffect } from 'react';
import { getMyDonors } from '../api/donors';
import DonorDetail from './DonorDetail';

export default function MyDonors({ onSelect }) {
  const [donors, setDonors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setLoading(true);
    setIndex(0);
    getMyDonors()
      .then(setDonors)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const current = donors[index];

  return (
    <div>

      {loading ? (
        <div className="loading" style={{ padding: 40 }}>Loading donors...</div>
      ) : donors.length === 0 ? (
        <div className="empty-state" style={{ padding: 40 }}>
          <div className="icon">{'\u{1F46B}'}</div>
          <h3>No donors assigned</h3>
          <p>Your assigned donors will appear here once the NGO admin assigns them.</p>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
            <button className="btn btn-sm" disabled={index === 0} onClick={() => setIndex(i => i - 1)}
              style={{ background: index === 0 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>
              {'\u2190'} Prev
            </button>
            <span style={{ fontSize: 13, color: 'var(--ink-soft)' }}>{index + 1} of {donors.length}</span>
            <button className="btn btn-sm" disabled={index === donors.length - 1} onClick={() => setIndex(i => i + 1)}
              style={{ background: index === donors.length - 1 ? 'transparent' : 'var(--card-bg)', border: '1px solid var(--line)', minWidth: 90 }}>
              Next {'\u2192'}
            </button>
          </div>
          <DonorDetail assignmentId={current.id} donor={current} />
        </>
      )}
    </div>
  );
}
