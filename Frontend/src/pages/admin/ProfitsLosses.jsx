import { useEffect, useState } from 'react'
import { Download } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'

const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function ProfitsLosses() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    api.getSales().then((data) => {
      // Normalize old data
      const normalized = data.map(sale => {
        if (!sale.items || sale.items.length === 0) {
          return {
            ...sale,
            items: [{
              productName: sale.productName || 'Unknown',
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
  }, [])

  const completedSales = sales.filter(s => s.status !== 'returned')

  const totals = completedSales.reduce((acc, s) => {
    const saleCost = s.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
    const saleRevenue = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
    acc.revenue += saleRevenue
    acc.cost += saleCost
    acc.profit += (saleRevenue - saleCost)
    return acc
  }, { revenue: 0, cost: 0, profit: 0 })

  async function handleDownload() {
    setDownloading(true)
    try {
      const blob = await api.downloadSalesPdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'Profits-Losses.pdf'; document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url)
    } catch (err) { alert(err.message) } finally { setDownloading(false) }
  }

  return (
    <div className="page-container w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Profits &amp; Losses</h1>
          <p className="page-subtitle">Revenue from completed sales only</p>
        </div>
        <button onClick={handleDownload} disabled={downloading || completedSales.length === 0} className="btn-primary w-full sm:w-auto self-start">
          <Download className="h-4 w-4" /> {downloading ? 'Preparing...' : 'Download PDF'}
        </button>
      </div>

      <div className="mt-6 grid gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="stat-card"><p className="stat-title">Total Revenue</p><p className="stat-value">{CURRENCY} {totals.revenue.toLocaleString()}</p></div>
        <div className="stat-card"><p className="stat-title">Total Cost</p><p className="stat-value">{CURRENCY} {totals.cost.toLocaleString()}</p></div>
        <div className="stat-card"><p className="stat-title">Net Profit / Loss</p><p className={`stat-value ${totals.profit >= 0 ? 'text-success' : 'text-danger'}`}>{CURRENCY} {totals.profit.toLocaleString()}</p></div>
      </div>

      {/* DESKTOP TABLE */}
      <div className="hidden md:block mt-6 card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Customer</th><th>Items</th><th>Total Cost</th><th>Total Revenue</th><th>Profit / Loss</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>}
            {!loading && sales.map((s) => {
              const isReturned = s.status === 'returned'
              const saleCost = s.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
              const saleRevenue = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
              const profit = saleRevenue - saleCost
              
              return (
                <tr key={s._id} className={isReturned ? 'opacity-50' : ''}>
                  <td className="whitespace-nowrap">{fmtDate(s.date)}</td>
                  <td className="font-medium text-text-primary">{s.customer.name}</td>
                  <td className="text-text-secondary">{s.items.length} items</td>
                  <td className="text-text-secondary">{CURRENCY} {saleCost.toLocaleString()}</td>
                  <td className={`text-text-secondary ${isReturned ? 'line-through' : ''}`}>{CURRENCY} {saleRevenue.toLocaleString()}</td>
                  <td>{isReturned ? <span className="text-text-muted">—</span> : (
                    <span className={profit >= 0 ? 'badge-success' : 'badge-danger'}>{profit >= 0 ? '+' : '-'}{CURRENCY} {Math.abs(profit).toLocaleString()}</span>
                  )}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS (RESTORED) */}
      <div className="md:hidden mt-6 space-y-4">
        {loading && <p className="text-center py-6 text-text-muted">Loading...</p>}
        {!loading && sales.length === 0 && <p className="text-center py-6 text-text-muted">No sales yet.</p>}
        {sales.map((s) => {
          const isReturned = s.status === 'returned'
          const saleCost = s.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
          const saleRevenue = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
          const profit = saleRevenue - saleCost
          
          return (
            <div key={s._id} className={`card p-4 flex flex-col gap-3 ${isReturned ? 'opacity-60' : ''}`}>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-bold text-text-primary text-base">{s.customer.name}</h3>
                  <p className="text-xs text-text-muted mt-1">{fmtDate(s.date)}</p>
                </div>
                <span className={isReturned ? 'badge-danger' : 'badge-success'}>{s.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-sm border-t border-border pt-3">
                <div><span className="text-text-secondary text-xs block">Cost</span><span className="text-text-primary">{CURRENCY} {saleCost.toLocaleString()}</span></div>
                <div><span className="text-text-secondary text-xs block">Revenue</span><span className={isReturned ? 'line-through text-text-muted' : 'text-text-primary'}>{CURRENCY} {saleRevenue.toLocaleString()}</span></div>
                <div className="col-span-2 mt-2">
                  <span className="text-text-secondary text-xs block mb-1">Profit / Loss</span>
                  {isReturned ? <span className="text-text-muted">—</span> : (
                    <span className={profit >= 0 ? 'badge-success' : 'badge-danger'}>
                      {profit >= 0 ? '+' : '-'}{CURRENCY} {Math.abs(profit).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}