import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { generateQR } from '../api/qr';

function GenerateQR() {
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [radius, setRadius] = useState('100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const canvasRef = useRef(null);

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
            body {
              margin: 0;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              min-height: 100vh;
              font-family: system-ui, -apple-system, sans-serif;
              background: #fff;
            }
            .container {
              text-align: center;
              padding: 48px;
            }
            .label {
              font-size: 22px;
              font-weight: 700;
              color: #1a1a2e;
              margin-bottom: 32px;
              letter-spacing: -0.3px;
            }
            img { display: block; margin: 0 auto; }
            .info {
              margin-top: 28px;
              font-size: 13px;
              color: #666;
              line-height: 1.7;
            }
            @media print {
              @page { margin: 0; }
              body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="label">${result.qr.label}</div>
            <img src="${dataUrl}" width="320" height="320" alt="QR Code" />
            <div class="info">
              ${result.qr.latitude}, ${result.qr.longitude} &bull; ${result.qr.radius_meters}m radius
            </div>
          </div>
          <script>window.addEventListener('load', function() { window.print(); window.close(); });</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Generate QR Code</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location Label</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="e.g. Main Office Entrance"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Latitude</label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="19.0760"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Longitude</label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="72.8777"
                  required
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geo-fence Radius (meters) <span className="text-gray-400 font-normal">— default 100m</span>
              </label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg text-sm">{error}</div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Generating...' : 'Generate QR Code'}
            </button>
          </form>
        </div>

        {result && (
          <div className="bg-white rounded-xl shadow-md p-6 flex flex-col">
            <h3 className="font-semibold text-gray-800 mb-4">QR Code Generated</h3>
            <div className="flex-1 flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-100">
              <div className="bg-white rounded-2xl shadow-lg p-4">
                <QRCodeCanvas
                  ref={canvasRef}
                  value={result.qrData}
                  size={220}
                  level="H"
                  fgColor="#1a1a2e"
                />
              </div>
              <p className="mt-4 font-medium text-gray-800">{result.qr.label}</p>
              <p className="text-sm text-gray-500">
                {result.qr.latitude}, {result.qr.longitude} &bull; {result.qr.radius_meters}m radius
              </p>
            </div>
            <div className="flex gap-3 mt-4">
              <button
                onClick={handlePrint}
                className="flex-1 bg-gray-900 text-white py-3 rounded-lg font-semibold hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print
              </button>
              <button
                onClick={() => { navigator.clipboard.writeText(result.qrData); }}
                className="flex-1 bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
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
