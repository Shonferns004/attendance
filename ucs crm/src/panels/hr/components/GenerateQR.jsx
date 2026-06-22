import { useState, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { useHR } from '../store';

export default function GenerateQR() {
  const { generateQR, fetchQRCodes, removeQRCode } = useHR();
  const [codes, setCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [busy, setBusy] = useState(false);
  const [newQR, setNewQR] = useState(null);
  const [viewedQR, setViewedQR] = useState(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const data = await fetchQRCodes();
      setCodes(data);
      if (!Array.isArray(data)) setError('Unexpected response format');
    } catch (e) { setError(e.message); } finally {
      setLoading(false);
    }
  }, [fetchQRCodes]);

  useEffect(() => { load(); }, [load]);

  const getLocation = () => {
    if (!navigator.geolocation) return alert('Geolocation not supported');
    navigator.geolocation.getCurrentPosition(
      (pos) => { setLatitude(pos.coords.latitude.toFixed(6)); setLongitude(pos.coords.longitude.toFixed(6)); },
      () => alert('Could not get location'),
    );
  };

  const handleGenerate = async () => {
    if (!label || !latitude || !longitude) return alert('Label, latitude, and longitude are required');
    setBusy(true);
    try {
      const result = await generateQR(label, parseFloat(latitude), parseFloat(longitude), parseInt(radius) || 100);
      setNewQR(result.qr);
      setLabel(''); setLatitude(''); setLongitude(''); setRadius('100');
      load();
    } catch (err) { alert(err.message); }
    finally { setBusy(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this QR code?')) return;
    try {
      await removeQRCode(id);
      if (newQR?.id === id) setNewQR(null);
      load();
    } catch (err) { alert(err.message); }
  };

  const printQR = (qr) => {
    const win = window.open('', '_blank');
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>QR Code</title><style>body{display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;margin:0;padding:20px}img{max-width:300px}h2{margin:16px 0 4px}p{margin:2px 0;color:#666}</style></head><body>`);
    win.document.write(`<img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(JSON.stringify({ code: qr.code, lat: qr.latitude, lng: qr.longitude }))}" alt="QR"/>`);
    win.document.write(`<h2>${qr.label}</h2>`);
    win.document.write(`<p>${qr.latitude}, ${qr.longitude} (${qr.radius_meters}m radius)</p>`);
    win.document.write('</body></html>');
    win.document.close();
    setTimeout(() => { win.print(); }, 500);
  };

  return (
    <div>
      <div className="card" style={{ padding: '24px 28px', marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 16 }}>Generate New QR Code</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <label className="field" style={{ gridColumn: '1 / -1' }}>
            Location Label
            <input value={label} onChange={e => setLabel(e.target.value)} placeholder="e.g. Main Office - Ground Floor" />
          </label>
          <label className="field">
            Latitude
            <input type="number" step="any" value={latitude} onChange={e => setLatitude(e.target.value)} placeholder="e.g. 19.076090" />
          </label>
          <label className="field">
            Longitude
            <input type="number" step="any" value={longitude} onChange={e => setLongitude(e.target.value)} placeholder="e.g. 72.877426" />
          </label>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 12, alignItems: 'center', flexWrap: 'wrap' }}>
          <button className="btn btn-sm" onClick={getLocation}>&#x1F4CD; Get Current Location</button>
          <label className="field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, fontSize: 12 }}>
            Radius (m):
            <input type="number" value={radius} onChange={e => setRadius(e.target.value)} style={{ width: 70 }} min="10" />
          </label>
          <button className="btn btn-primary btn-sm" onClick={handleGenerate} disabled={busy} style={{ marginLeft: 'auto' }}>
            {busy ? 'Generating...' : 'Generate QR'}
          </button>
        </div>
      </div>

      {newQR && (
        <div className="card" style={{ padding: '24px 28px', marginBottom: 16, textAlign: 'center' }}>
          <div className="card-title" style={{ marginBottom: 12 }}>Generated QR Code</div>
          <QRCodeCanvas value={JSON.stringify({ code: newQR.code, lat: newQR.latitude, lng: newQR.longitude })} size={200} level="H" />
          <p style={{ margin: '8px 0 2px', fontWeight: 600 }}>{newQR.label}</p>
          <p style={{ fontSize: 12, color: 'var(--ink-soft)' }}>{newQR.latitude}, {newQR.longitude} &middot; {newQR.radius_meters}m radius</p>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 10 }}>
            <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ code: newQR.code, lat: newQR.latitude, lng: newQR.longitude })); alert('Copied!'); }}>
              Copy Data
            </button>
            <button className="btn btn-sm" onClick={() => printQR(newQR)}>Print</button>
          </div>
        </div>
      )}

      {error && <div style={{ background:'#fef2f2', color:'#991b1b', padding:'10px 14px', borderRadius:8, fontSize:13, marginBottom:12 }}>{error}</div>}

      <div className="card">
        <div className="card-head">
          <h3>All QR Codes</h3>
          <span className="count">{codes.length} total</span>
        </div>
        {loading ? (
          <div className="card-pad"><div className="loading">Loading...</div></div>
        ) : codes.length === 0 ? (
          <div className="card-pad"><div className="loading">No QR codes generated yet</div></div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12, padding: 16 }}>
            {codes.map(qr => (
              <div key={qr.id} className="card" style={{ padding: 14, textAlign: 'center', boxShadow: 'none', cursor: 'pointer' }} onClick={() => setViewedQR(qr)}>
                <QRCodeCanvas value={JSON.stringify({ code: qr.code, lat: qr.latitude, lng: qr.longitude })} size={120} level="H" />
                <p style={{ fontSize: 12, fontWeight: 600, margin: '6px 0 2px' }}>{qr.label}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{qr.latitude}, {qr.longitude}</p>
                <p style={{ fontSize: 10, color: 'var(--ink-soft)' }}>{qr.radius_meters}m radius</p>
                <div style={{ display: 'flex', gap: 4, justifyContent: 'center', marginTop: 6 }}>
                  <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); printQR(qr); }} title="Print">&#x1F5A8;</button>
                  <button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); handleDelete(qr.id); }} title="Delete" style={{ color: 'var(--danger)' }}>&#x1F5D1;</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {viewedQR && (
        <div className="modal-overlay" onClick={() => setViewedQR(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <div className="modal-head">
              <h3>{viewedQR.label}</h3>
              <button className="btn btn-sm" onClick={() => setViewedQR(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center', padding: '24px 24px 16px' }}>
              <QRCodeCanvas value={JSON.stringify({ code: viewedQR.code, lat: viewedQR.latitude, lng: viewedQR.longitude })} size={280} level="H" />
              <p style={{ margin: '12px 0 2px', fontSize: 14, color: 'var(--ink-soft)' }}>
                {viewedQR.latitude}, {viewedQR.longitude}
              </p>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--ink-soft)' }}>
                {viewedQR.radius_meters}m radius
              </p>
            </div>
            <div className="modal-foot" style={{ justifyContent: 'center', gap: 8 }}>
              <button className="btn btn-sm" onClick={() => { navigator.clipboard.writeText(JSON.stringify({ code: viewedQR.code, lat: viewedQR.latitude, lng: viewedQR.longitude })); alert('Copied!'); }}>
                Copy Data
              </button>
              <button className="btn btn-sm" onClick={() => printQR(viewedQR)}>Print</button>
              <button className="btn btn-sm" onClick={() => { setViewedQR(null); handleDelete(viewedQR.id); }} style={{ color: 'var(--danger)' }}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
