import { useState, useEffect } from 'react';
import { getLeaves, updateLeaveStatus } from '../api/leaves';

const leaveTypeLabels = {
  full_day: 'Full Day',
  half_day: 'Half Day',
  vacational: 'Vacational',
};

const statusConfig = {
  pending: { label: 'Pending', classes: 'bg-tertiary-fixed text-on-tertiary-fixed', icon: 'pending' },
  approved: { label: 'Approved', classes: 'bg-secondary-container text-on-secondary-container', icon: 'check_circle' },
  rejected: { label: 'Rejected', classes: 'bg-error-container text-on-error-container', icon: 'cancel' },
};

function Leaves() {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [remark, setRemark] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [activeTab, setActiveTab] = useState('pending');

  const fetchLeaves = async () => {
    try {
      const data = await getLeaves();
      setLeaves(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const handleActionClick = (id, action) => {
    setActionId(id);
    setModalAction(action);
    setRemark('');
    setShowModal(true);
  };

  const confirmAction = async () => {
    try {
      await updateLeaveStatus(actionId, modalAction, remark);
      setShowModal(false);
      fetchLeaves();
    } catch (err) {
      alert(err.message);
    }
  };

  const pendingLeaves = leaves.filter((l) => l.status === 'pending');
  const historyLeaves = leaves.filter((l) => l.status !== 'pending');

  const formatDate = (d) =>
    d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  const formatDateTime = (d) =>
    d ? new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  const getLeaveDates = (l) => {
    if (l.type === 'vacational') return `${formatDate(l.start_date)} – ${formatDate(l.end_date)}`;
    if (l.type === 'half_day') {
      const t = l.half_start_time?.slice(0, 5) + ' – ' + l.half_end_time?.slice(0, 5);
      return `${formatDate(l.leave_date)} · ${t}`;
    }
    return formatDate(l.leave_date);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-stack-lg">
        <h2 className="text-headline-lg text-primary">Leave Management</h2>
        <p className="text-body-md text-on-surface-variant">Review and manage worker leave applications.</p>
      </div>

      <div className="bg-white rounded-xl border border-outline-variant shadow-sm overflow-hidden">
        <div className="px-6 border-b border-outline-variant">
          <div className="flex gap-8 relative">
            <button
              onClick={() => setActiveTab('pending')}
              className={`py-5 text-label-md relative transition-colors ${activeTab === 'pending' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              Pending ({pendingLeaves.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`py-5 text-label-md relative transition-colors ${activeTab === 'history' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}
            >
              History ({historyLeaves.length})
            </button>
            <div
              className="absolute bottom-0 h-0.5 bg-primary transition-all duration-300"
              style={{
                left: activeTab === 'pending' ? '0' : '50%',
                width: '50%',
              }}
            />
          </div>
        </div>

        {activeTab === 'pending' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">WORKER</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">TYPE</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">DATES</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">DAYS</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">REASON</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">APPLIED</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {pendingLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-body-md text-on-surface-variant">
                      No pending leave applications.
                    </td>
                  </tr>
                ) : (
                  pendingLeaves.map((l) => (
                    <tr key={l.id} className="hover:bg-surface/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">
                            {l.workers?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                          </div>
                          <div>
                            <p className="text-body-md font-medium">{l.workers?.name || 'Unknown'}</p>
                            <p className="text-body-sm text-on-surface-variant">{l.workers?.login_id || ''}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-body-md">{leaveTypeLabels[l.type] || l.type}</td>
                      <td className="px-6 py-4 text-body-md">{getLeaveDates(l)}</td>
                      <td className="px-6 py-4 text-body-md">{l.days}</td>
                      <td className="px-6 py-4 text-body-md max-w-[200px] truncate">{l.reason}</td>
                      <td className="px-6 py-4 text-body-sm text-on-surface-variant">{formatDateTime(l.applied_at)}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleActionClick(l.id, 'approved')}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-secondary-container text-on-secondary-container hover:opacity-80 transition-opacity"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleActionClick(l.id, 'rejected')}
                            className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg bg-error-container text-on-error-container hover:opacity-80 transition-opacity"
                          >
                            Reject
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-surface border-b border-outline-variant">
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">WORKER</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">TYPE</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">DATES</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">DAYS</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant text-center">STATUS</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">REMARK</th>
                  <th className="px-6 py-4 text-label-md text-on-surface-variant">APPLIED</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant">
                {historyLeaves.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-body-md text-on-surface-variant">
                      No leave history yet.
                    </td>
                  </tr>
                ) : (
                  historyLeaves.map((l) => {
                    const cfg = statusConfig[l.status] || statusConfig.pending;
                    return (
                      <tr key={l.id} className="hover:bg-surface/50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-primary-container flex items-center justify-center text-white text-[10px] font-bold">
                              {l.workers?.name?.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || '?'}
                            </div>
                            <div>
                              <p className="text-body-md font-medium">{l.workers?.name || 'Unknown'}</p>
                              <p className="text-body-sm text-on-surface-variant">{l.workers?.login_id || ''}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-body-md">{leaveTypeLabels[l.type] || l.type}</td>
                        <td className="px-6 py-4 text-body-md">{getLeaveDates(l)}</td>
                        <td className="px-6 py-4 text-body-md">{l.days}</td>
                        <td className="px-6 py-4 text-center">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${cfg.classes}`}>
                            <span className="material-symbols-outlined text-[14px]">{cfg.icon}</span>
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-body-sm text-on-surface-variant max-w-[150px] truncate">
                          {l.admin_remark || '—'}
                        </td>
                        <td className="px-6 py-4 text-body-sm text-on-surface-variant">{formatDateTime(l.applied_at)}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 mx-4">
            <h3 className="text-headline-md font-bold text-primary mb-2">
              {modalAction === 'approved' ? 'Approve Leave' : 'Reject Leave'}
            </h3>
            <p className="text-body-md text-on-surface-variant mb-4">
              {modalAction === 'approved'
                ? 'Confirm approval of this leave application.'
                : 'Confirm rejection of this leave application.'}
            </p>
            <textarea
              className="w-full p-3 border border-outline-variant rounded-lg text-body-md mb-4 resize-none"
              rows={3}
              placeholder="Admin remark (optional)..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-label-md font-medium text-on-surface-variant hover:bg-surface rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                className={`px-4 py-2 text-label-md font-bold text-white rounded-lg transition-colors ${
                  modalAction === 'approved' ? 'bg-secondary' : 'bg-error'
                } hover:opacity-90`}
              >
                {modalAction === 'approved' ? 'Approve' : 'Reject'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Leaves;
