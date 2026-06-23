import { useState, useEffect, useRef } from 'react';
import { apiGet, apiPost } from '../api/auth';
import { getReceipt, generateReceipt as apiGenerateReceipt } from '../api/receipts';
import { generateReceiptPDF } from '../services/pdfGenerator';
import ReceiptTemplate_MannCar from '../components/ReceiptTemplate_MannCar';
import ReceiptTemplate_Ashray from '../components/ReceiptTemplate_Ashray';
import ReceiptTemplate_BeingSevak from '../components/ReceiptTemplate_BeingSevak';

const TEMPLATES = {
  manncar: ReceiptTemplate_MannCar,
  ashray: ReceiptTemplate_Ashray,
  beingsevak: ReceiptTemplate_BeingSevak,
};

const DB_TO_TEMPLATE = {
  maan: 'manncar',
  aflf: 'ashray',
  bsct: 'beingsevak',
};

const PROJECT_LABELS = {
  maan: 'Mann Care Foundation',
  aflf: 'Ashray For Life Foundation',
  bsct: 'Being Sevak Charitable Trust',
};

function getTemplateId(projectId) {
  return DB_TO_TEMPLATE[projectId] || 'beingsevak';
}

function buildDonor(receipt) {
  return {
    'Receipt No.': receipt.receipt_no || '',
    'Receipt Date': receipt.receipt_date || '',
    'Donor Name': receipt.donor_name || '',
    'Address 1': receipt.address || '',
    'PAN No.': receipt.pan_number || '',
    'Email ID': '',
    'Amount': receipt.amount || 0,
    'Mode of Payment (MOP)': receipt.mode || '',
    'Payment ID No.': '',
    'Donor Bank Name': '',
    'Account Of': 'Corpus',
    'City': '',
    'State': '',
    'Pincode': '',
  };
}

export default function LeadDetail({ logId, onBack }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const [receiptLoading, setReceiptLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [panInput, setPanInput] = useState('');
  const [modeInput, setModeInput] = useState('');
  const receiptRef = useRef(null);

  const load = () => {
    setLoading(true);
    apiGet('/accounts/leads')
      .then(all => all.find(l => l.log_id === parseInt(logId)))
      .then(l => setLead(l || null))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  const loadReceipt = () => {
    setReceiptLoading(true);
    getReceipt(logId)
      .then(r => setReceipt(r || null))
      .catch(() => setReceipt(null))
      .finally(() => setReceiptLoading(false));
  };

  useEffect(load, [logId]);

  useEffect(() => {
    if (lead && lead.accounts_status === 'verified') {
      loadReceipt();
    }
  }, [lead?.accounts_status]);

  const handleVerify = async () => {
    if (!lead || !window.confirm('Verify this lead and mark amount as collected?')) return;
    setSubmitting(true);
    try {
      await apiPost(`/accounts/leads/${lead.log_id}/verify`, { pan_number: lead.pan_number || lead.donor_pan || null });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!lead) return;
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    setSubmitting(true);
    try {
      await apiPost(`/accounts/leads/${lead.log_id}/reject`, { reason });
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateReceipt = async () => {
    if (!lead) return;
    setReceiptLoading(true);
    try {
      const body = {};
      if (panInput.trim()) body.pan_number = panInput.trim();
      if (modeInput.trim()) body.mode = modeInput.trim();
      const res = await apiGenerateReceipt(logId, body);
      setReceipt(res.receipt);
      setShowModal(true);
    } catch (err) {
      alert(err.message);
    } finally {
      setReceiptLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!receiptRef.current) return;
    try {
      const pdf = await generateReceiptPDF(receiptRef.current);
      pdf.save(`receipt_${(receipt?.receipt_no || 'download').replace(/[/\\]/g, '_')}.pdf`);
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  const handleSendWhatsApp = async () => {
    const phone = (l.donor_mobile || '').replace(/\D/g, '');
    if (!phone) {
      alert('Donor mobile number not available');
      return;
    }
    if (!receiptRef.current) return;
    try {
      const pdf = await generateReceiptPDF(receiptRef.current);
      pdf.save(`receipt_${(receipt?.receipt_no || 'download').replace(/[/\\]/g, '_')}.pdf`);
      const foundationName = PROJECT_LABELS[projectId] || 'our foundation';
      const amt = Number(receipt?.amount || 0).toLocaleString('en-IN');
      const msg = encodeURIComponent(
        `Thank you for your generous donation of ₹${amt} to ${foundationName}. ` +
        `Your receipt (No: ${receipt?.receipt_no || ''}) has been generated. ` +
        `Please find the PDF receipt attached.\n\nWith gratitude,\n${foundationName} Team`
      );
      window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    } catch (err) {
      alert('Failed to generate PDF: ' + err.message);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!lead) return <div className="empty-state"><p>Lead not found</p><button className="btn" onClick={onBack}>Back</button></div>;

  const l = lead;
  const projectId = (l.donor_project || '').toLowerCase();
  const templateId = getTemplateId(projectId);
  const ReceiptComp = TEMPLATES[templateId];
  const canGenerate = l.accounts_status === 'verified';
  const donor = receipt ? buildDonor(receipt) : null;

  return (
    <div>
      <div className="detail-header">
        <button className="back-btn" onClick={onBack}>{'\u{2190}'}</button>
        <h2>Lead Details</h2>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          {l.accounts_status === 'pending' && (
            <>
              <button className="btn btn-primary btn-sm" onClick={handleVerify} disabled={submitting}>
                {submitting ? 'Verifying...' : 'Verify'}
              </button>
              <button className="btn btn-sm" style={{ borderColor: '#dc2626', color: '#dc2626' }} onClick={handleReject} disabled={submitting}>
                {submitting ? 'Rejecting...' : 'Reject'}
              </button>
            </>
          )}
          {l.accounts_status === 'verified' && (
            <>
              <span className="pill pill-green">Verified</span>
              {receipt && (
                <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                  View Receipt
                </button>
              )}
            </>
          )}
          {l.accounts_status === 'rejected' && <span className="pill pill-red" title={l.rejection_reason || ''}>Rejected</span>}
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Donor Information</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13 }}>
            <div><strong>Name:</strong> {l.donor_name}</div>
            <div><strong>Mobile:</strong> {l.donor_mobile}</div>
            <div><strong>City:</strong> {l.donor_city || '—'}</div>
            <div><strong>Email:</strong> {l.donor_email || '—'}</div>
            <div><strong>Address:</strong> {l.donor_address || '—'}</div>
            <div><strong>PAN:</strong> {l.pan_number || l.donor_pan || '—'}</div>
            <div><strong>DOB:</strong> {l.donor_dob || '—'}</div>
            <div><strong>Project:</strong> {l.donor_project || '—'}</div>
            <div><strong>Donations:</strong> {l.donation_count || 0} times</div>
            <div><strong>Total Donated:</strong> ₹{Number(l.total_donated || 0).toLocaleString('en-IN')}</div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-head"><h3>Payment Details</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 13, marginBottom: 12 }}>
            <div><strong>Amount:</strong> ₹{Number(l.amount || 0).toLocaleString('en-IN')}</div>
            <div><strong>Agent:</strong> {l.agent_name} ({l.agent_login})</div>
            <div><strong>Submitted:</strong> {new Date(l.created_at).toLocaleString()}</div>
            <div><strong>Status:</strong> {l.accounts_status || '—'}</div>
          </div>
          {l.screenshot_url && (
            <div>
              <strong style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>Screenshot:</strong>
              <a href={l.screenshot_url} target="_blank" rel="noopener noreferrer">
                <img src={l.screenshot_url} alt="Payment screenshot" style={{ maxWidth: '100%', maxHeight: 350, borderRadius: 8, border: '1px solid var(--line)' }} />
              </a>
            </div>
          )}
        </div>
      </div>

      {canGenerate && !receipt && (
        <div className="card">
          <div className="card-head"><h3>Generate Receipt</h3></div>
          <div className="card-pad">
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end', fontSize: 13 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 3, fontWeight: 600 }}>PAN (optional)</label>
                <input className="input" style={{ width: 160 }} value={panInput} onChange={e => setPanInput(e.target.value)} placeholder={l.pan_number || l.donor_pan || 'Enter PAN'} />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 3, fontWeight: 600 }}>Mode (optional)</label>
                <input className="input" style={{ width: 160 }} value={modeInput} onChange={e => setModeInput(e.target.value)} placeholder="e.g. UPI, Cash" />
              </div>
              <button className="btn btn-primary btn-sm" onClick={handleGenerateReceipt} disabled={receiptLoading}>
                {receiptLoading ? 'Generating...' : 'Generate Receipt'}
              </button>
            </div>
          </div>
        </div>
      )}

      {l.notes && (
        <div className="card">
          <div className="card-head"><h3>Notes</h3></div>
          <div className="card-pad">
            <p style={{ fontSize: 13, margin: 0 }}>{l.notes}</p>
          </div>
        </div>
      )}

      {l.rejection_reason && (
        <div className="card">
          <div className="card-head"><h3>Rejection Reason</h3></div>
          <div className="card-pad" style={{ background: '#fef2f2', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
            <p style={{ fontSize: 13, margin: 0, color: '#991b1b' }}>{l.rejection_reason}</p>
          </div>
        </div>
      )}

      {showModal && receipt && donor && ReceiptComp && (
        <>
          <div className="modal-overlay" onClick={() => setShowModal(false)} />
          <div className="modal" style={{ maxWidth: 800, width: '90%', maxHeight: '90vh', overflow: 'auto' }}>
            <div className="modal-header">
              <h3>Receipt Preview</h3>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" onClick={handleDownload}>Download PDF</button>
                <button className="btn btn-sm" style={{ background: '#25D366', color: '#fff' }} onClick={handleSendWhatsApp}>
                  Send via WhatsApp
                </button>
                <button className="btn btn-sm" onClick={() => setShowModal(false)}>Close</button>
              </div>
            </div>
            <div className="modal-body" style={{ padding: 20 }}>
              <div ref={receiptRef} data-receipt data-receipt-print>
                <ReceiptComp
                  donor={donor}
                  index={0}
                  project={templateId}
                />
              </div>
            </div>
          </div>
        </>
      )}

      <style>{`
        .modal-overlay {
          position: fixed; inset: 0; background: rgba(0,0,0,0.5); z-index: 999;
        }
        .modal {
          position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
          background: #fff; border-radius: 12px; z-index: 1000; box-shadow: 0 8px 30px rgba(0,0,0,0.2);
        }
        .modal-header {
          display: flex; justify-content: space-between; align-items: center;
          padding: 14px 20px; border-bottom: 1px solid #e5e7eb;
        }
        .modal-header h3 { margin: 0; font-size: 16px; }
        .modal-body { overflow: auto; max-height: calc(90vh - 70px); }
        @media print {
          @page { size: A4 portrait; margin: 8mm; }
          html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; }
          body * { visibility: hidden; }
          [data-receipt-print], [data-receipt-print] * { visibility: visible; }
          .modal-overlay { display: none !important; }
          .modal-header { display: none !important; }
          .modal {
            position: static !important;
            transform: none !important;
            width: 100% !important;
            max-width: none !important;
            max-height: none !important;
            overflow: visible !important;
            box-shadow: none !important;
            border-radius: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          .modal-body {
            padding: 0 !important;
            margin: 0 !important;
            max-height: none !important;
            overflow: visible !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
          }
          [data-receipt-print] {
            position: relative;
            width: 100%;
            margin: -8mm 0 0 !important;
            padding: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: flex-start !important;
            overflow: visible !important;
          }
          [data-receipt-print] [data-receipt-sheet] {
            margin: 0 auto !important;
            max-width: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          [data-receipt-print] [data-pdf-width="1000"] { zoom: 0.68; }
          [data-receipt-print] [data-pdf-width="900"] { zoom: 0.75; }
          [data-receipt-print] [data-pdf-width="794"] { zoom: 0.85; }
        }
      `}</style>
    </div>
  );
}
