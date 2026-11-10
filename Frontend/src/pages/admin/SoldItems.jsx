import { useEffect, useState } from 'react'
import { RotateCcw, X } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'

const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function SoldItems() {
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [returning, setReturning] = useState(null)
  const [selectedSale, setSelectedSale] = useState(null)

  function load() {
    setLoading(true)
    api.getSales().then((data) => {
      // Normalize old sales data to match new cart structure
      const normalized = data.map(sale => {
        if (!sale.items || sale.items.length === 0) {
          return {
            ...sale,
            items: [{
              productName: sale.productName || 'Unknown',
              category: sale.category || 'mobile',
              imei1: sale.imei1 || '',
              imei2: sale.imei2 || '',
              color: sale.color || '',
              costPrice: sale.costPrice || 0,
              sellPrice: sale.sellPrice || 0,
              quantity: 1
            }]
          }
        }
        return sale
      })
      setSales(normalized)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])

  async function handleReturn(sale) {
    if (!window.confirm(`Return this entire order? This adds items back to stock.`)) return
    setReturning(sale._id)
    try {
      await api.returnSale(sale._id)
      load()
      setSelectedSale(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setReturning(null)
    }
  }

  const q = query.toLowerCase()
  const filtered = sales.filter((s) => {
    const productNames = s.items.map(i => i.productName).join(' ')
    const imeis = s.items.map(i => i.imei1).join(' ')
    const searchStr = `${s.customer?.name} ${s.customer?.number} ${s.customer?.cnic} ${productNames} ${imeis}`.toLowerCase()
    return searchStr.includes(q)
  })

  return (
    <div className="page-container w-full overflow-hidden">
      <div className="mb-6">
        <h1 className="page-title">Sold Items</h1>
        <p className="page-subtitle">Complete record of sales</p>
      </div>

      <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Name, Product, CNIC, IMEI..." className="input-field max-w-md mb-6" />

      {/* DESKTOP TABLE */}
      <div className="hidden md:block card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr>
              <th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>}
            {!loading && filtered.map((s) => {
              const isReturned = s.status === 'returned'
              const total = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
              return (
                <tr key={s._id} onClick={() => setSelectedSale(s)} className={`cursor-pointer hover:bg-gray-50 ${isReturned ? 'opacity-50' : ''}`}>
                  <td className="whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="font-bold text-text-primary">{s.customer?.name}</td>
                  <td className="text-text-secondary">{s.items.length} item(s)</td>
                  <td className={`font-semibold ${isReturned ? 'line-through text-text-muted' : 'text-brand'}`}>{CURRENCY} {total.toLocaleString()}</td>
                  <td><span className={isReturned ? 'badge-danger' : 'badge-success'}>{s.status}</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      {!isReturned && (
                        <button onClick={(e) => { e.stopPropagation(); handleReturn(s); }} className="btn-danger px-3 py-1.5"><RotateCcw className="h-3 w-3" /> Return</button>
                      )}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">
        {filtered.map((s) => {
          const isReturned = s.status === 'returned'
          const total = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
          return (
            <div key={s._id} onClick={() => setSelectedSale(s)} className={`card p-4 flex flex-col gap-3 cursor-pointer ${isReturned ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-text-primary">{s.customer?.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{fmtDate(s.date)}</p>
                </div>
                <span className={isReturned ? 'badge-danger' : 'badge-success'}>{s.status}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                 <span className="text-sm font-medium">{s.items.length} item(s)</span>
                 <span className={`font-bold ${isReturned ? 'text-text-muted' : 'text-brand'}`}>{CURRENCY} {total.toLocaleString()}</span>
              </div>
            </div>
          )
        })}
      </div>

      {/* DETAILS MODAL */}
      {selectedSale && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-text-primary">Order Details</h3>
                <p className="text-sm text-text-secondary">{fmtDate(selectedSale.date)}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-border text-sm space-y-2">
                <div className="flex justify-between"><span className="text-text-muted">Customer Name</span><span className="font-bold text-text-primary">{selectedSale.customer.name}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Phone</span><span className="font-medium text-text-primary">{selectedSale.customer.number}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">CNIC</span><span className="font-medium text-text-primary">{selectedSale.customer.cnic || '—'}</span></div>
                <div className="flex justify-between"><span className="text-text-muted">Status</span><span className={selectedSale.status === 'returned' ? 'badge-danger' : 'badge-success'}>{selectedSale.status}</span></div>
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3">Items Purchased</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="border border-border p-3 rounded-lg flex justify-between items-center text-sm">
                      <div>
                        <p className="font-bold text-text-primary">{item.quantity}x {item.productName}</p>
                        {item.imei1 && <p className="text-xs text-text-muted mt-0.5">IMEI: {item.imei1}</p>}
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-brand">{CURRENCY} {(item.sellPrice * item.quantity).toLocaleString()}</p>
                        <p className="text-xs text-success">Profit: {CURRENCY} {((item.sellPrice - item.costPrice) * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {selectedSale.status !== 'returned' && (
                <button onClick={() => handleReturn(selectedSale)} className="btn-danger w-full py-3">
                  <RotateCcw className="h-4 w-4" /> Return Entire Order
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}