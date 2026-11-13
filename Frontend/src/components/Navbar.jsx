import { useState, useEffect } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { Menu, X, Heart } from 'lucide-react'
import { getFavorites } from '../utils/favorites'

const links = [
  { to: '/', label: 'Home' },
  { to: '/shop', label: 'Shop' },
  { to: '/about', label: 'About' },
  { to: '/contact', label: 'Contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [favCount, setFavCount] = useState(0)

  // Update count on mount and when favorites change
  useEffect(() => {
    const updateCount = () => setFavCount(getFavorites().length)
    updateCount()
    
    window.addEventListener('favoritesUpdated', updateCount)
    return () => window.removeEventListener('favoritesUpdated', updateCount)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`navbar ${scrolled ? 'py-2 shadow-sm' : 'py-2'}`}>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-5 sm:px-8 lg:px-12 h-20">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3">
          <img src="/logo.png" alt="Saif Mobile" className="h-12 lg:h-20 w-auto object-contain" onError={(e) => e.target.style.display = 'none'} />
          <div className="flex flex-col">
            <span className="text-xl font-black tracking-tight text-brand leading-none">SAIF MOBILE</span>
            <span className="text-[10px] font-bold tracking-[0.2em] text-gold uppercase mt-1">Premium Store</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className={({ isActive }) => isActive ? 'nav-link-active' : 'nav-link'}>
              {l.label}
            </NavLink>
          ))}
          
          <div className="h-6 w-[1px] bg-gray-200 mx-1"></div>

          {/* Premium Wishlist Button */}
          <Link 
            to="/favorites" 
            className="relative p-2.5 text-gray-600 hover:text-brand hover:bg-gray-50 rounded-full transition-all group"
            title="Saved Items"
          >
            <Heart className="h-5 w-5 group-hover:scale-110 transition-transform" />
            {favCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand text-[10px] font-bold text-white shadow-sm border-2 border-white">
                {favCount}
              </span>
            )}
          </Link>

          <Link to="/admin/login" className="btn-secondary !py-2 !px-4 text-xs">Admin Login</Link>
        </nav>

        {/* Mobile Toggle & Mobile Wishlist Icon */}
        <div className="flex items-center gap-2 md:hidden">
          <Link 
            to="/favorites" 
            className="relative p-2 text-gray-600 hover:text-brand transition-all"
          >
            <Heart className="h-6 w-6" />
            {favCount > 0 && (
              <span className="absolute top-0 right-0 inline-flex items-center justify-center h-4 w-4 rounded-full bg-brand text-[10px] font-bold text-white border-2 border-white">
                {favCount}
              </span>
            )}
          </Link>
          
          <button onClick={() => setOpen(!open)} className="rounded-lg p-2 text-text-secondary hover:bg-gray-100">
            {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {open && (
        <div className="absolute top-full left-0 w-full z-50 border-t border-border bg-surface md:hidden shadow-xl">
          <div className="flex flex-col gap-1 p-5">
            {links.map((l) => (
              <NavLink key={l.to} to={l.to} onClick={() => setOpen(false)} className={({ isActive }) => isActive ? 'admin-nav-link-active' : 'admin-nav-link'}>
                {l.label}
              </NavLink>
            ))}
            <Link to="/admin/login" onClick={() => setOpen(false)} className="btn-secondary mt-4 w-full">Admin Login</Link>
          </div>
        </div>
      )}
    </header>
  )
}