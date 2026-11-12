import { useEffect, useState } from 'react'
import { Download, DollarSign, Wallet, TrendingUp, TrendingDown, X } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'
import Pagination from '../../components/Pagination'

const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function ProfitsLosses() {
  const [sales, setSales] = useState([])
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const [modal, setModal] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  useEffect(() => {
    api.getSales().then((data) => {
      const normalized = data.map(sale => {
        if (!sale.items || sale.items.length === 0) {
          return { ...sale, items: [{ productName: sale.productName || 'Unknown', costPrice: sale.costPrice || 0, sellPrice: sale.sellPrice || 0, quantity: 1 }] }
        }
        return sale
      })
      setSales(normalized)
    }).catch((err) => {
      alert(`Failed to load profit data:\n\n${err.message}`)
    }).finally(() => setLoading(false))
  }, [])

  async function handleDownload() {
    setDownloading(true)
    try { 
      await api.downloadSalesPdf(startDate, endDate) 
      setModal(false)
    } catch (err) { 
      alert(`PDF Download Error:\n\n${err.message}`) 
    } finally { 
      setDownloading(false) 
    }
  }

  const completedSales = sales.filter(s => s.status !== 'returned')
  const totals = completedSales.reduce((acc, s) => {
    const saleCost = s.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
    const saleRevenue = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
    acc.revenue += saleRevenue
    acc.cost += saleCost
    acc.profit += (saleRevenue - saleCost)
    return acc
  }, { revenue: 0, cost: 0, profit: 0 })

  const isProfit = totals.profit >= 0

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSales = sales.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(sales.length / itemsPerPage)

  return (
    <div className="page-container w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Profits &amp; Losses</h1>
          <p className="page-subtitle">Revenue from completed sales only</p>
        </div>
        <button onClick={() => setModal(true)} disabled={completedSales.length === 0} className="btn-primary w-full sm:w-auto">
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="mt-6 grid gap-2 sm:gap-4 grid-cols-1 sm:grid-cols-3">
        <div className="card p-3 sm:p-5 flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-gold/10 text-gold shrink-0"><DollarSign className="h-5 w-5 sm:h-6 sm:w-6" /></span>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-text-secondary font-semibold uppercase tracking-tight">Total Revenue</p>
              <p className="text-sm sm:text-2xl font-extrabold text-text-primary mt-0.5 break-all">{CURRENCY} {totals.revenue.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-5 flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className="grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl bg-gray-100 text-gray-600 shrink-0"><Wallet className="h-5 w-5 sm:h-6 sm:w-6" /></span>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-text-secondary font-semibold uppercase tracking-tight">Total Cost</p>
              <p className="text-sm sm:text-2xl font-extrabold text-text-primary mt-0.5 break-all">{CURRENCY} {totals.cost.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="card p-3 sm:p-5 flex items-center justify-between sm:justify-start gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <span className={`grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl shrink-0 ${isProfit ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>{isProfit ? <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> : <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />}</span>
            <div className="min-w-0">
              <p className="text-[11px] sm:text-xs text-text-secondary font-semibold uppercase tracking-tight">Net Profit</p>
              <p className={`text-sm sm:text-2xl font-extrabold mt-0.5 break-all ${isProfit ? 'text-success' : 'text-danger'}`}>{CURRENCY} {totals.profit.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="hidden md:block mt-6 card overflow-x-auto">
        <table className="data-table">
          <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Total Cost</th><th>Total Revenue</th><th>Profit / Loss</th></tr></thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>}
            {!loading && sales.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-text-muted">No sales recorded yet.</td></tr>}
            {!loading && currentSales.map((s) => {
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
                  <td>{isReturned ? <span className="text-text-muted">—</span> : (<span className={profit >= 0 ? 'badge-success' : 'badge-danger'}>{profit >= 0 ? '+' : '-'}{CURRENCY} {Math.abs(profit).toLocaleString()}</span>)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <div className="md:hidden mt-4 space-y-3">
        {loading && <p className="text-center py-6 text-text-muted">Loading...</p>}
        {!loading && sales.length === 0 && <p className="text-center py-6 text-text-muted">No sales yet.</p>}
        {currentSales.map((s) => {
          const isReturned = s.status === 'returned'
          const saleCost = s.items.reduce((sum, item) => sum + (item.costPrice * item.quantity), 0)
          const saleRevenue = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
          const profit = saleRevenue - saleCost
          return (
            <div key={s._id} className={`card p-3 flex flex-col gap-2 ${isReturned ? 'opacity-60' : ''}`}>
              <div className="flex items-center justify-between"><div><h3 className="font-bold text-text-primary text-sm">{s.customer.name}</h3><p className="text-[10px] text-text-muted">{fmtDate(s.date)}</p></div><span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${isReturned ? 'bg-gold/10 text-gold' : 'bg-success/10 text-success'}`}>{s.status}</span></div>
              <div className="grid grid-cols-3 gap-1 text-xs border-t border-border pt-2">
                <div><span className="text-text-muted text-[10px] block">Cost</span><span className="text-text-primary font-medium">{CURRENCY} {saleCost.toLocaleString()}</span></div>
                <div><span className="text-text-muted text-[10px] block">Revenue</span><span className={`font-medium ${isReturned ? 'line-through text-text-muted' : 'text-text-primary'}`}>{CURRENCY} {saleRevenue.toLocaleString()}</span></div>
                <div><span className="text-text-muted text-[10px] block">Profit</span>{isReturned ? <span className="text-text-muted">—</span> : (<span className={`font-bold ${profit >= 0 ? 'text-success' : 'text-danger'}`}>{profit >= 0 ? '+' : '-'}{CURRENCY} {Math.abs(profit).toLocaleString()}</span>)}</div>
              </div>
            </div>
          )
        })}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* DOWNLOAD MODAL */}
      {modal && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-bold text-text-primary">Export PDF</h3><p className="text-xs text-text-secondary">Select a date range. Leave blank for all time.</p></div>
              <button onClick={() => setModal(false)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
              <button type="button" onClick={() => setModal(false)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDownload} disabled={downloading} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">{downloading ? 'Generating...' : 'Download PDF'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}