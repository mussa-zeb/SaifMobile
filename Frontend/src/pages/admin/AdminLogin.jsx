import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Mail, Lock, Store } from 'lucide-react'
import { api, getToken, setToken } from '../../api'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  if (getToken()) return <Navigate to="/admin" replace />

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true); setError('')
    try {
      const data = await api.login(email, password)
      setToken(data.token)
      navigate('/admin')
    } catch (err) { 
      setError(err.message) 
    } finally { 
      setLoading(false) 
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-base px-4">
      <div className="w-full max-w-md rounded-2xl border border-border bg-surface p-8 shadow-2xl">
        <div className="mb-8 text-center">
          <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-brand text-white shadow-lg">
            <Store className="h-7 w-7" />
          </span>
          <h1 className="mt-5 text-2xl font-bold text-text-primary">Admin Portal</h1>
          <p className="mt-1 text-sm text-text-secondary">Sign in to manage your store</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="input-label">Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@yourstore.com" required className="input-field pl-11" />
            </div>
          </div>
          <div>
            <label className="input-label">Password</label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required className="input-field pl-11" />
            </div>
          </div>
          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 font-bold">{error}</p>}
          <button type="submit" disabled={loading} className="btn-primary w-full py-3">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  )
}