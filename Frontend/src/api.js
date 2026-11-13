import { API_URL } from './config'

export function getToken() { return localStorage.getItem('adminToken') || '' }
export function setToken(token) { localStorage.setItem('adminToken', token) }
export function clearToken() { localStorage.removeItem('adminToken') }

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body && !(options.body instanceof FormData)) headers['Content-Type'] = 'application/json'
  const token = getToken()
  if (token) headers['x-admin-token'] = token

  let res
  try {
    res = await fetch(API_URL + path, { ...options, headers })
  } catch (err) {
    throw new Error('Network Error: Could not reach the backend server. It might be sleeping or offline. Please wait a moment and try again.')
  }

  if (!res.ok) {
    let message = `Request failed with status code ${res.status}.`
    try {
      const data = await res.json()
      if (data.message) message = data.message
    } catch { /* Not a JSON error response */ }
    
    // REMOVED the forced window.location.href = '/admin/login' redirect here.
    // Now it just throws the error so the UI shows the alert without logging you out.
    if (res.status === 401) {
      throw new Error('Unauthorized: Your admin token is invalid or missing. Please check your backend settings.')
    }

    throw new Error(message)
  }

  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) return res.json()
  return res.text()
}

async function downloadPdf(path, filename) {
  let res
  try {
    res = await fetch(API_URL + path, { headers: { 'x-admin-token': getToken() } })
  } catch (err) {
    throw new Error('Network Error: Could not connect to server to download the PDF.')
  }

  if (!res.ok) {
    let message = `Failed to download PDF (Status: ${res.status}).`
    try {
      const data = await res.json()
      if (data.message) message = data.message
    } catch { 
      const text = await res.text().catch(() => '')
      if (text) message = `Server Error: ${text.substring(0, 100)}...`
    }
    throw new Error(message)
  }

  const blob = await res.blob()
  if (blob.size === 0) throw new Error('Download failed: The server returned an empty file.')

  const firstBytes = await blob.slice(0, 5).text()
  if (!firstBytes.startsWith('%PDF')) {
    throw new Error('Download failed: Server did not return a valid PDF file.')
  }

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export const api = {
  login: (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProducts: (params = {}) => {
    const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'all')
    return request(`/products${entries.length ? `?${new URLSearchParams(entries)}` : ''}`)
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (formData) => request('/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => request(`/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  checkoutSale: (payload) => request(`/sales/checkout`, { method: 'POST', body: JSON.stringify(payload) }),
  returnSale: (id, payload) => request(`/sales/${id}/return`, { method: 'POST', body: JSON.stringify(payload) }),
  getSales: () => request('/sales'),
  
  downloadSalesPdf: (startDate = '', endDate = '') => {
    const qs = new URLSearchParams({ startDate, endDate }).toString()
    return downloadPdf(`/sales/export?${qs}`, 'Sales-Report.pdf')
  },
  downloadProductsPdf: (category = '', startDate = '', endDate = '') => {
    const qs = new URLSearchParams({ category, startDate, endDate }).toString()
    return downloadPdf(`/products/export?${qs}`, 'Products-Report.pdf')
  },
  
  getDashboard: (params = {}) => request(`/dashboard?${new URLSearchParams(params)}`),
}