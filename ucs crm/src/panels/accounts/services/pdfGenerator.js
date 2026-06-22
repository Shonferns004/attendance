import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import JSZip from 'jszip'
import { saveAs } from 'file-saver'

export function formatIndianCurrency(amount) {
  const num = Number(amount)
  if (isNaN(num)) return '₹0'

  const str = Math.round(num).toString()
  const lastThree = str.slice(-3)
  const rest = str.slice(0, -3)
  let formatted = rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',')
  if (rest) formatted += ','
  formatted += lastThree
  return `₹${formatted}`
}

const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function convertBelow1000(n) {
  if (n === 0) return ''
  let res = ''
  if (n >= 100) {
    res += ones[Math.floor(n / 100)] + ' Hundred '
    n %= 100
  }
  if (n >= 20) {
    res += tens[Math.floor(n / 10)] + ' '
    n %= 10
  }
  if (n > 0) {
    res += ones[n] + ' '
  }
  return res.trim()
}

export function amountInWords(amount) {
  const num = Math.round(Number(amount))
  if (isNaN(num) || num === 0) return 'Zero'

  let res = ''
  const crore = Math.floor(num / 10000000)
  const lakh = Math.floor((num % 10000000) / 100000)
  const thousand = Math.floor((num % 100000) / 1000)
  const remainder = num % 1000

  if (crore > 0) res += convertBelow1000(crore) + ' Crore '
  if (lakh > 0) res += convertBelow1000(lakh) + ' Lakh '
  if (thousand > 0) res += convertBelow1000(thousand) + ' Thousand '
  if (remainder > 0) res += convertBelow1000(remainder)

  return res.trim() + ''
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December']

export function getFormattedDate() {
  const d = new Date()
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function parseMonthName(s) {
  if (!s) return -1
  const lower = s.toLowerCase()
  for (let i = 0; i < MONTHS_SHORT.length; i++) {
    if (MONTHS_SHORT[i].toLowerCase() === lower) return i + 1
  }
  return -1
}

function parseAndFormat(raw) {
  let parts = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/)
  if (parts) {
    let [, d, m, y] = parts
    if (y.length === 2) y = '20' + y
    const day = parseInt(d, 10)
    const month = parseInt(m, 10)
    const year = parseInt(y, 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDateFromParts(day, month, year)
    }
  }

  parts = raw.match(/^(\d{1,2})[/-]([A-Za-z]{3})[/-](\d{2,4})$/)
  if (parts) {
    let [, d, m, y] = parts
    if (y.length === 2) y = '20' + y
    const day = parseInt(d, 10)
    const month = parseMonthName(m)
    const year = parseInt(y, 10)
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return formatDateFromParts(day, month, year)
    }
  }

  parts = raw.match(/^(\d{1,2})[ ](\d{1,2}|[A-Za-z]{3,})[ ](\d{2,4})$/)
  if (parts) {
    let [, d, m, y] = parts
    if (y.length === 2) y = '20' + y
    const day = parseInt(d, 10)
    const monthNum = parseInt(m, 10)
    if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12 && day >= 1 && day <= 31) {
      return formatDateFromParts(day, monthNum, year)
    }
    const monthName = parseMonthName(m)
    if (monthName >= 1 && monthName <= 12 && day >= 1 && day <= 31) {
      return formatDateFromParts(day, monthName, year)
    }
  }

  return null
}

function formatDateFromParts(day, month, year) {
  const shortYear = String(year).slice(-2)
  return `${day}-${MONTHS_SHORT[month - 1]}-${shortYear}`
}

function formatInIndianTimezone(d) {
  const ms = d.getTime()
  const indianOffset = 5.5 * 60 * 60 * 1000
  const local = new Date(ms + indianOffset)
  const sy = String(local.getUTCFullYear()).slice(-2)
  return `${local.getUTCDate()}-${MONTHS_SHORT[local.getUTCMonth()]}-${sy}`
}

export function formatReceiptDate(dateStr) {
  if (!dateStr || String(dateStr).trim() === '') return getFormattedDate()

  if (dateStr instanceof Date) {
    return formatInIndianTimezone(dateStr)
  }

  if (typeof dateStr === 'number') {
    const d = new Date((dateStr - 25569) * 86400000)
    if (!isNaN(d.getTime())) {
      return formatInIndianTimezone(d)
    }
  }

  const raw = String(dateStr).trim()

  const numeric = raw.replace(/[, ]/g, '')
  if (/^\d{5}$/.test(numeric)) {
    const d = new Date((parseInt(numeric, 10) - 25569) * 86400000)
    if (!isNaN(d.getTime())) {
      return formatInIndianTimezone(d)
    }
  }

  const result = parseAndFormat(raw)
  if (result) return result

  const d = new Date(raw)
  if (!isNaN(d.getTime())) {
    return formatInIndianTimezone(d)
  }

  return raw
}

export async function generateReceiptPDF(element) {
  const canvas = await html2canvas(element, {
    scale: 1,
    useCORS: true,
    logging: false,
    width: 1000,
    onclone: (doc) => {
      let el = doc.querySelector('[data-receipt-batch]')
      if (!el) el = doc.querySelector('[data-receipt]')
      if (el) {
        let p = el.parentElement
        while (p) {
          if (p.style.display === 'none') {
            p.style.display = 'block'
            p.style.position = 'absolute'
            p.style.left = '-9999px'
          }
          p = p.parentElement
        }
      }
    },
  })
  const pdf = new jsPDF('p', 'mm', 'a4')
  const pdfW = pdf.internal.pageSize.getWidth()
  const pdfH = pdf.internal.pageSize.getHeight()
  const margin = 3
  const maxW = pdfW - 2 * margin
  const maxH = pdfH - 2 * margin
  const ratio = Math.min(maxW / canvas.width, maxH / canvas.height)
  const imgW = canvas.width * ratio
  const imgH = canvas.height * ratio
  const x = (pdfW - imgW) / 2
  const y = (pdfH - imgH) / 2
  pdf.addImage(canvas.toDataURL('image/jpeg', 0.8), 'JPEG', x, y, imgW, imgH)
  return pdf
}

function sanitizeFileName(name) {
  return String(name).replace(/[<>:"/\\|?*]/g, '_').trim() || 'Unknown'
}

function getFilePrefix(project) {
  if (!project) return ''
  const map = {
    ashray: 'Ashray',
    beingsevak: 'BeingSevak',
    manncar: 'MannCare',
  }
  return (map[project] || project) + '_'
}

function getZipName(project) {
  if (!project) return 'Donation_Receipts.zip'
  const map = {
    ashray: 'Ashray',
    beingsevak: 'BeingSevak',
    manncar: 'MannCare',
  }
  return (map[project] || project) + '_Donation_Receipts.zip'
}

export async function downloadSinglePDF(element, donor, project = '') {
  const receiptNo = donor['Receipt No.'] || 'N/A'
  const donorName = sanitizeFileName(donor['Donor Name'])
  const prefix = getFilePrefix(project)
  const pdf = await generateReceiptPDF(element)
  pdf.save(`${prefix}Receipt_${receiptNo}_${donorName}.pdf`)
}

export async function downloadAllPDFs(elements, project = '') {
  const zip = new JSZip()
  const folder = zip.folder('Donation_Receipts')

  for (let i = 0; i < elements.length; i++) {
    const { element, donor } = elements[i]
    const pdf = await generateReceiptPDF(element)
    const receiptNo = donor['Receipt No.'] || `ROW${i + 1}`
    const donorName = sanitizeFileName(donor['Donor Name'])
    const prefix = getFilePrefix(project)
    folder.file(`${prefix}Receipt_${receiptNo}_${donorName}.pdf`, pdf.output('arraybuffer'))
  }

  const content = await zip.generateAsync({ type: 'blob' })
  saveAs(content, getZipName(project))
}
