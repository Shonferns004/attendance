import { formatIndianCurrency, amountInWords, formatReceiptDate } from '../services/pdfGenerator'

export default function ReceiptTemplate_MannCar({ data, receiptNo }) {
  const d = data || {}
  return (
    <div data-receipt style={{ width: 1000, padding: 0, fontFamily: 'Arial, sans-serif', background: '#fff' }}>
      <div style={{ border: '3px solid #1a5276', margin: 0, position: 'relative', overflow: 'hidden' }}>
        <div style={{ padding: '20px 30px 15px', textAlign: 'center', borderBottom: '2px solid #1a5276', position: 'relative' }}>
          <img src="/receipt-assets/MAANCareLogo.jpeg" alt="Logo" style={{ position: 'absolute', left: 30, top: 15, height: 65, width: 'auto' }} />
          <h1 style={{ margin: 0, fontSize: 26, color: '#1a5276', fontFamily: 'Georgia, serif' }}>Mann Care Foundation</h1>
          <p style={{ margin: '2px 0', fontSize: 13, color: '#444' }}>Office no 101, 1st floor, Bldg no 2, Sector 2, Gaur City 2, Greater Noida West, UP 201301</p>
          <p style={{ margin: '2px 0', fontSize: 12, color: '#666' }}>Email: manncarefoundation2@gmail.com | Mo: +91-8527999908</p>
          <p style={{ margin: '2px 0', fontSize: 11, color: '#888' }}>80G & 12A Registered | PAN: AABTM7045K</p>
          <img src="/receipt-assets/stamp.png" alt="Stamp" style={{ position: 'absolute', right: 40, top: 10, height: 65, width: 'auto', opacity: 0.75 }} />
        </div>

        <h2 style={{ textAlign: 'center', margin: '12px 0', fontSize: 20, color: '#1a5276', textTransform: 'uppercase', letterSpacing: 3 }}>Receipt</h2>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0 30px', fontSize: 13, marginBottom: 8 }}>
          <div><strong>Receipt No:</strong> {receiptNo || '—'}</div>
          <div><strong>Date:</strong> {formatReceiptDate(d.date)}</div>
        </div>

        <table style={{ width: '94%', margin: '0 auto', borderCollapse: 'collapse', fontSize: 13 }}>
          <tbody>
            <tr><td style={{ padding: '4px 6px', width: 140 }}><strong>Received with thanks from</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{d.donor_name || '—'}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>Address</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{d.address || '—'}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>PAN No</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{d.pan_number || '—'}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>Donation towards</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{d.purpose || 'General Donation'}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>Amount (in words)</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{amountInWords(d.amount)}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>Amount (in figures)</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333', fontSize: 15, fontWeight: 'bold' }}>{formatIndianCurrency(d.amount)}</td></tr>
            <tr><td style={{ padding: '4px 6px' }}><strong>Payment Mode</strong></td><td style={{ padding: '4px 6px', borderBottom: '1px solid #333' }}>{d.mode || '—'}</td></tr>
          </tbody>
        </table>

        <div style={{ display: 'flex', justifyContent: 'space-between', padding: '20px 30px 15px', fontSize: 12, marginTop: 8 }}>
          <div><em>This is a computer-generated receipt</em></div>
          <div style={{ textAlign: 'right' }}>
            <div>_________________________</div>
            <div><strong>Authorised Signatory</strong></div>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: 10, color: '#aaa', padding: '0 30px 10px', borderTop: '1px solid #ddd', paddingTop: 8 }}>
          This receipt is valid under 80G of IT Act 1961 | Donation exempt u/s 80G
        </div>
      </div>
    </div>
  )
}
