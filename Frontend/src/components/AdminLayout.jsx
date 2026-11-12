import { useState } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Package, Receipt, TrendingUp, Store, LogOut, ArrowLeft, Menu, X, Boxes } from 'lucide-react'
import { clearToken } from '../api'

const links = [
  { to: '/admin', label: 'Dashboard', Icon: LayoutDashboard, end: true },
  { to: '/admin/inventory', label: 'Inventory (Stock)', Icon: Boxes },
  { to: '/admin/products', label: 'I Sell', Icon: Package },
  { to: '/admin/sold', label: 'Sold Items', Icon: Receipt },
  { to: '/admin/profits', label: 'Profits & Losses', Icon: TrendingUp },
]

export default function AdminLayout() {
  const navigate = useNavigate()
  const [isMobileOpen, setIsMobileOpen] = useState(false)

  function logout() { clearToken(); navigate('/admin/login') }

  const SidebarContent = () => (
    <>
      <Link to="/admin" className="mb-6 flex items-center gap-2 px-2 text-lg font-bold text-text-primary">
        <img src="/logo.png" alt="Logo" className="h-8 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
        Admin Panel
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {links.map(({ to, label, Icon, end }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setIsMobileOpen(false)} className={({ isActive }) => isActive ? 'admin-nav-link-active' : 'admin-nav-link'}>
            <Icon className="h-4 w-4" /> {label}
          </NavLink>
        ))}
      </nav>
      <div className="mt-4 space-y-1 border-t border-border pt-4">
        <Link to="/" className="admin-nav-link"><ArrowLeft className="h-4 w-4" /> View Store</Link>
        <button type="button" onClick={logout} className="admin-nav-link text-danger hover:text-danger hover:bg-danger-muted w-full"><LogOut className="h-4 w-4" /> Logout</button>
      </div>
    </>
  )

  return (
    <div className="flex min-h-screen bg-base">
      <aside className="admin-sidebar"><SidebarContent /></aside>
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 flex md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileOpen(false)} />
          <aside className="relative z-50 flex w-72 flex-col bg-surface p-5 shadow-2xl animate-in slide-in-from-left duration-200">
            <button onClick={() => setIsMobileOpen(false)} className="absolute right-4 top-4 text-text-muted hover:text-text-primary"><X className="h-6 w-6" /></button>
            <SidebarContent />
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-surface px-4 py-3 md:hidden">
          <span className="font-bold text-text-primary">Admin Panel</span>
          <button onClick={() => setIsMobileOpen(true)} className="rounded-lg p-1.5 text-text-secondary bg-gray-100 hover:bg-gray-200"><Menu className="h-5 w-5" /></button>
        </header>
        <main className="p-4 md:p-8 flex-1 overflow-x-hidden"><Outlet /></main>
      </div>
    </div>
  )
}