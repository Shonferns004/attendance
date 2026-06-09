import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateQR } from '../api/qr';

function GenerateQR() {
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser.');
      return;
    }
    setLocating(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude.toFixed(6));
        setLongitude(pos.coords.longitude.toFixed(6));
        setLocating(false);
      },
      (err) => {
        setError(`Location error: ${err.message}`);
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const data = await generateQR(label, parseFloat(latitude), parseFloat(longitude), parseFloat(radius));
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (!result) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL();
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>QR Code - ${result.qr.label}</title>
          <style>
            body { margin: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; font-family: system-ui, -apple-system, sans-serif; background: #fff; }
            .container { text-align: center; padding: 48px; }
            .label { font-size: 22px; font-weight: 700; color: #1a1a2e; margin-bottom: 32px; letter-spacing: -0.3px; }
            img { display: block; margin: 0 auto; }
            .info { margin-top: 28px; font-size: 13px; color: #666; line-height: 1.7; }
            @media print { @page { margin: 0; } body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="label">${result.qr.label}</div>
            <img src="${dataUrl}" width="320" height="320" alt="QR Code" />
            <div class="info">${result.qr.latitude}, ${result.qr.longitude} &bull; ${result.qr.radius_meters}m radius</div>
          </div>
          <script>window.addEventListener('load', function() { window.print(); window.close(); });</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div>
      <h1 className="text-headline-lg text-primary mb-stack-lg">Generate QR Code</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-outline-variant p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-label-md text-on-surface-variant block uppercase mb-1">Location Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-body-md"
                placeholder="e.g. Main Office Entrance"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-label-md text-on-surface-variant block uppercase mb-1">Latitude</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={latitude}
                    onChange={(e) => setLatitude(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-body-md pr-10"
                    placeholder="19.0760"
                    required
                  />
                  {latitude && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xs font-mono">N</span>
                  )}
                </div>
              </div>
              <div>
                <label className="text-label-md text-on-surface-variant block uppercase mb-1">Longitude</label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    value={longitude}
                    onChange={(e) => setLongitude(e.target.value)}
                    className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-body-md pr-10"
                    placeholder="72.8777"
                    required
                  />
                  {longitude && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant/40 text-xs font-mono">E</span>
                  )}
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={getCurrentLocation}
              disabled={locating}
              className="w-full flex items-center justify-center gap-2 bg-surface-container text-on-surface py-3 rounded-lg text-label-md border border-outline-variant hover:bg-surface-container-high transition-colors disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-lg">
                {locating ? 'location_searching' : 'my_location'}
              </span>
              {locating ? 'Detecting location…' : 'Get Current Location'}
            </button>
            <div>
              <label className="text-label-md text-on-surface-variant block uppercase mb-1">
                Geo-fence Radius (meters) <span className="text-on-surface-variant/60 font-normal normal-case">— default 100m</span>
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-4 py-3 border border-outline-variant rounded-lg focus:ring-2 focus:ring-primary/10 focus:border-primary outline-none text-body-md"
              />
            </div>
            {error && (
              <div className="bg-error-container border border-error/30 text-on-error-container px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-on-primary py-3 rounded-lg text-label-md hover:bg-primary-container transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-sm border border-outline-variant p-6 flex flex-col">
            <h3 className="text-headline-sm text-primary mb-4">QR Code Generated</h3>
            <div className="flex-1 flex flex-col items-center justify-center bg-surface-container rounded-xl p-8 border border-outline-variant">
              <div className="bg-white rounded-2xl shadow-sm border border-outline-variant p-4">
                <QRCodeCanvas
                  ref={canvasRef}
                  value={result.qrData}
                  size={220}
                  level="H"
                  fgColor="#091426"
                />
              </div>
              <p className="mt-4 font-bold text-primary">{result.qr.label}</p>
              <p className="text-body-sm text-on-surface-variant">
                {result.qr.latitude}, {result.qr.longitude} &bull; {result.qr.radius_meters}m radius
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePrint}
                className="flex-1 bg-primary text-on-primary py-3 rounded-lg text-label-md hover:bg-primary-container transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">print</span>
                Print
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(result.qrData); }}
                className="flex-1 bg-white border border-outline-variant text-primary py-3 rounded-lg text-label-md hover:bg-surface-container transition-colors"
              >
                Copy Data
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default GenerateQR;
