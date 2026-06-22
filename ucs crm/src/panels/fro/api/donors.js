import { api } from './auth'

export async function getMyDonors(status) {
  const params = status ? `?status=${status}` : ''
  return api(`/fro/donors${params}`, { _prefix: 'ucs' })
}

export async function getDonorDetail(assignmentId) {
  return api(`/fro/donors/${assignmentId}/logs`, { _prefix: 'ucs' })
}

export async function updateDonorStatus(assignmentId, data) {
  return api(`/fro/donors/${assignmentId}/status`, { method: 'PUT', body: JSON.stringify(data), _prefix: 'ucs' })
}

export async function addDonorLog(assignmentId, data) {
  return api(`/fro/donors/${assignmentId}/logs`, { method: 'POST', body: JSON.stringify(data), _prefix: 'ucs' })
}

export async function scheduleContact(assignmentId, data) {
  return api(`/fro/donors/${assignmentId}/schedule`, { method: 'POST', body: JSON.stringify(data), _prefix: 'ucs' })
}

export async function uploadPaymentScreenshot(fileBase64, mimeType) {
  return api('/fro/upload-payment-screenshot', { method: 'POST', body: JSON.stringify({ file_base64: fileBase64, mime_type: mimeType }), _prefix: 'ucs' })
}

export async function getMyDashboard() {
  return api('/fro/dashboard', { _prefix: 'ucs' })
}
