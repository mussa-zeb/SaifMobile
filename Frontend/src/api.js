import { API_URL } from './config'

export function getToken() {
  return localStorage.getItem('adminToken') || ''
}
export function setToken(token) {
  localStorage.setItem('adminToken', token)
}
export function clearToken() {
  localStorage.removeItem('adminToken')
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) }
  if (options.body && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json'
  }
  const token = getToken()
  if (token) headers['x-admin-token'] = token

  const res = await fetch(API_URL + path, { ...options, headers })

  if (!res.ok) {
    let message = `Request failed (${res.status})`
    try {
      const data = await res.json()
      if (data.message) message = data.message
    } catch { /* ignore */ }
    throw new Error(message)
  }

  const type = res.headers.get('content-type') || ''
  if (type.includes('application/json')) return res.json()
  return res.text()
}

export const api = {
  login: (email, password) => request('/admin/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  getProducts: (params = {}) => {
    const entries = Object.entries(params).filter(([, v]) => v !== '' && v != null && v !== 'all')
    const qs = new URLSearchParams(entries).toString()
    return request(`/products${qs ? `?${qs}` : ''}`)
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (formData) => request('/products', { method: 'POST', body: formData }),
  updateProduct: (id, formData) => request(`/products/${id}`, { method: 'PUT', body: formData }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  sellProduct: (id, payload) => request(`/products/${id}/sell`, { method: 'POST', body: JSON.stringify(payload) }),
  checkoutSale: (payload) => request(`/sales/checkout`, { method: 'POST', body: JSON.stringify(payload) }),
  returnSale: (id) => request(`/sales/${id}/return`, { method: 'POST' }),
  getSales: () => request('/sales'),
  
  // NEW: PDF Download method
  downloadSalesPdf: async () => {
    const res = await fetch(`${API_URL}/sales/export`, { headers: { 'x-admin-token': getToken() } })
    if (!res.ok) throw new Error('Failed to download PDF')
    return res.blob()
  },
  
  getDashboard: (params = {}) => {
    const qs = new URLSearchParams(params).toString()
    return request(`/dashboard${qs ? `?${qs}` : ''}`)
  },
}