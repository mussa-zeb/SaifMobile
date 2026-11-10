import { Link } from 'react-router-dom'
import { MessageCircle, ArrowUpRight } from 'lucide-react'
import { SHOP_NAME, WHATSAPP_NUMBER } from '../config'

export default function Footer() {
  return (
    <footer className="border-t border-border bg-surface mt-auto">
      {/* Changed py-16 to py-10 md:py-16 for mobile compactness */}
      <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10 md:py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5">
              <img src="/logo.png" alt="" className="h-8 md:h-9 w-auto object-contain" onError={(e) => (e.target.style.display = 'none')} />
              <span className="text-lg md:text-xl font-bold text-brand tracking-tight" style={{ fontFamily: 'var(--font-sans)' }}>
                SAIF MOBILE
              </span>
            </Link>
            <p className="mt-3 max-w-xs text-xs md:text-sm leading-relaxed text-text-secondary">
              Premium smartphones, exclusive perfumes, and high-end audio. Hand-picked. Verified. Delivered.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">Explore</h4>
            <ul className="space-y-2">
              {[['/shop', 'Shop'], ['/about', 'About'], ['/contact', 'Contact']].map(([to, label]) => (
                <li key={to}>
                  <Link to={to} className="text-sm text-text-secondary hover:text-brand transition">{label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-text-primary mb-3">Connect</h4>
            <ul className="space-y-2">
              {WHATSAPP_NUMBER && (
                <li>
                  <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="text-sm text-text-secondary hover:text-brand transition inline-flex items-center gap-1">
                    WhatsApp <ArrowUpRight className="h-3 w-3" />
                  </a>
                </li>
              )}
              <li><Link to="/terms" className="text-sm text-text-secondary hover:text-brand transition">Terms</Link></li>
              <li><Link to="/privacy" className="text-sm text-text-secondary hover:text-brand transition">Privacy</Link></li>
            </ul>
          </div>

        </div>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border pt-5 text-xs text-text-muted">
          <p>© {new Date().getFullYear()} SAIF MOBILE. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}