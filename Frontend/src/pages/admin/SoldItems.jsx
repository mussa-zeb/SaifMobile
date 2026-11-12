import { useEffect, useState } from 'react'
import { RotateCcw, X, Download, Search } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'
import Pagination from '../../components/Pagination'

const fmtDate = (d) => new Date(d).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })

export default function SoldItems() {
  const [sales, setSales] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  
  const [modal, setModal] = useState(null) // 'download' or 'details' or 'return'
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [selectedSale, setSelectedSale] = useState(null)
  const [returnSale, setReturnSale] = useState(null)
  const [returning, setReturning] = useState(false)

  function load() {
    setLoading(true)
    api.getSales().then((data) => {
      const normalized = data.map(sale => {
        if (!sale.items || sale.items.length === 0) {
          return { ...sale, items: [{ productName: sale.productName || 'Unknown', category: sale.category || 'mobile', imei1: sale.imei1 || '', imei2: sale.imei2 || '', ptaStatus: sale.ptaStatus || '', batteryHealth: sale.batteryHealth || '', color: sale.color || '', costPrice: sale.costPrice || 0, sellPrice: sale.sellPrice || 0, quantity: 1, comments: sale.comments || '' }] }
        }
        return sale
      })
      setSales(normalized)
    }).catch((err) => {
      alert(`Failed to load sales data:\n\n${err.message}`)
    }).finally(() => setLoading(false))
  }

  useEffect(load, [])
  useEffect(() => { setCurrentPage(1) }, [query])

  async function handleDownload() {
    setDownloading(true)
    try { 
      await api.downloadSalesPdf(startDate, endDate) 
      setModal(null)
    } catch (err) { 
      alert(`PDF Download Error:\n\n${err.message}`) 
    } finally { 
      setDownloading(false) 
    }
  }

  function openReturnModal(sale) {
    const editableSale = JSON.parse(JSON.stringify(sale))
    setReturnSale(editableSale)
    setSelectedSale(null)
    setModal('return')
  }

  async function confirmReturn() {
    if (!window.confirm(`Are you sure you want to process this return with the updated values?`)) return
    setReturning(true)
    try {
      await api.returnSale(returnSale._id, {
        items: returnSale.items
      })
      load()
      setReturnSale(null)
      setModal(null)
    } catch (err) {
      alert(`Failed to return sale:\n\n${err.message}`)
    } finally {
      setReturning(false)
    }
  }

  const q = query.toLowerCase()
  const filtered = sales.filter((s) => {
    const productNames = s.items.map(i => i.productName).join(' ')
    const imeis = s.items.map(i => `${i.imei1} ${i.imei2}`).join(' ')
    const ptas = s.items.map(i => i.ptaStatus || '').join(' ')
    return `${s.customer?.name} ${s.customer?.number} ${s.customer?.cnic} ${productNames} ${imeis} ${ptas} ${s.comments || ''}`.toLowerCase().includes(q)
  })

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentSales = filtered.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(filtered.length / itemsPerPage)

  return (
    <div className="page-container w-full overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title">Sold Items</h1>
          <p className="page-subtitle">Complete record of sales</p>
        </div>
        <button onClick={() => setModal('download')} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover w-full sm:w-auto">
          <Download className="h-4 w-4" /> Export PDF
        </button>
      </div>

      <div className="mb-6 w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Name, Product, IMEI..." className="w-full rounded-xl border border-border pl-10 pr-4 py-2 text-sm outline-none focus:border-brand bg-white" />
        </div>
      </div>

      <div className="hidden md:block card overflow-x-auto">
        <table className="data-table">
          <thead>
            <tr><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Status</th><th className="text-right">Actions</th></tr>
          </thead>
          <tbody>
            {loading && <tr><td colSpan={6} className="text-center py-10">Loading...</td></tr>}
            {!loading && filtered.length === 0 && <tr><td colSpan={6} className="text-center py-10 text-text-muted">No sales found.</td></tr>}
            {!loading && currentSales.map((s) => {
              const isReturned = s.status === 'returned'
              const total = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
              return (
                <tr key={s._id} className={`hover:bg-gray-50 ${isReturned ? 'opacity-50' : ''}`}>
                  <td className="whitespace-nowrap cursor-pointer" onClick={() => { setSelectedSale(s); setModal('details'); }}>{fmtDate(s.date)}</td>
                  <td className="font-bold text-text-primary cursor-pointer" onClick={() => { setSelectedSale(s); setModal('details'); }}>{s.customer?.name}</td>
                  <td className="text-text-secondary cursor-pointer" onClick={() => { setSelectedSale(s); setModal('details'); }}>{s.items.length} item(s)</td>
                  <td className={`font-semibold cursor-pointer ${isReturned ? 'line-through text-text-muted' : 'text-brand'}`} onClick={() => { setSelectedSale(s); setModal('details'); }}>{CURRENCY} {total.toLocaleString()}</td>
                  <td><span className={isReturned ? 'badge-danger' : 'badge-success'}>{s.status}</span></td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => { setSelectedSale(s); setModal('details'); }} className="btn-secondary px-3 py-1.5 text-xs">View</button>
                      {!isReturned && (<button onClick={() => openReturnModal(s)} className="btn-danger px-3 py-1.5 text-xs"><RotateCcw className="h-3 w-3" /> Return</button>)}
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <div className="md:hidden space-y-4">
        {currentSales.map((s) => {
          const isReturned = s.status === 'returned'
          const total = s.items.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
          return (
            <div key={s._id} className={`card p-4 flex flex-col gap-3 ${isReturned ? 'opacity-60' : ''}`}>
              <div className="flex justify-between items-start cursor-pointer" onClick={() => { setSelectedSale(s); setModal('details'); }}>
                <div><h3 className="font-bold text-text-primary">{s.customer?.name}</h3><p className="text-xs text-text-muted mt-1">{fmtDate(s.date)}</p></div>
                <span className={isReturned ? 'badge-danger' : 'badge-success'}>{s.status}</span>
              </div>
              <div className="flex justify-between items-center border-t border-border pt-3">
                <span className="text-sm font-medium">{s.items.length} item(s)</span>
                <span className={`font-bold ${isReturned ? 'text-text-muted' : 'text-brand'}`}>{CURRENCY} {total.toLocaleString()}</span>
              </div>
              {!isReturned && (
                <button onClick={() => openReturnModal(s)} className="btn-danger w-full py-2"><RotateCcw className="h-3 w-3" /> Return Order</button>
              )}
            </div>
          )
        })}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* DOWNLOAD MODAL */}
      {modal === 'download' && (
        <div className="modal-overlay">
          <div className="modal-container max-w-md">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-lg font-bold text-text-primary">Export PDF</h3><p className="text-xs text-text-secondary">Select a date range. Leave blank for all time.</p></div>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-2 border-t border-border">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDownload} disabled={downloading} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">{downloading ? 'Generating...' : 'Download PDF'}</button>
            </div>
          </div>
        </div>
      )}

      {/* VIEW DETAILS MODAL */}
      {modal === 'details' && selectedSale && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="flex items-center justify-between mb-6">
              <div><h3 className="text-xl font-bold text-text-primary">Order Details</h3><p className="text-sm text-text-secondary">{fmtDate(selectedSale.date)}</p></div>
              <button onClick={() => setModal(null)} className="p-2 hover:bg-gray-100 rounded-lg"><X className="h-6 w-6" /></button>
            </div>

            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-xl border border-border text-sm space-y-2">
                <div className="flex justify-between"><span className="text-gray-600">Customer Name</span><span className="font-bold text-text-primary">{selectedSale.customer.name}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Contact Number</span><span className="font-medium text-text-primary">{selectedSale.customer.number}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">CNIC</span><span className="font-medium text-text-primary">{selectedSale.customer.cnic || '—'}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Status</span><span className={selectedSale.status === 'returned' ? 'badge-danger' : 'badge-success'}>{selectedSale.status}</span></div>
                
                {selectedSale.comments && (
                  <div className="flex justify-between gap-4 border-t border-border pt-2 mt-2">
                    <span className="text-gray-600 shrink-0">Customer Comment</span>
                    <span className="font-medium text-text-primary text-right italic">{selectedSale.comments}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-bold text-sm mb-3">Items Purchased</h4>
                <div className="space-y-2">
                  {selectedSale.items.map((item, idx) => (
                    <div key={idx} className="border border-border p-3 rounded-lg text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-bold text-text-primary">{item.quantity}x {item.productName}</p>
                          {item.color && <p className="text-xs text-gray-600 mt-0.5"><span className='text-black font-bold'>Color: </span>{item.color}</p>}
                          {item.imei1 && <p className="text-xs text-gray-600 mt-0.5"><span className='text-black font-bold'>IMEI 1:</span> {item.imei1}</p>}
                          {item.imei2 && <p className="text-xs text-gray-600 mt-0.5"><span className='text-black font-bold'>IMEI 2:</span> {item.imei2}</p>}
                          {item.ptaStatus && <p className="text-xs font-bold text-brand mt-0.5">PTA Status: {item.ptaStatus}</p>}
                          {item.batteryHealth && <p className="text-xs font-bold text-success mt-0.5">Battery: {item.batteryHealth}</p>}
                          {item.comments && <p className="text-xs text-gray-500 mt-1 italic">Item Note: {item.comments}</p>}
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-brand">{CURRENCY} {(item.sellPrice * item.quantity).toLocaleString()}</p>
                          <p className="text-xs text-success">Profit: {CURRENCY} {((item.sellPrice - item.costPrice) * item.quantity).toLocaleString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EDITABLE RETURN MODAL */}
      {modal === 'return' && returnSale && (
        <div className="modal-overlay">
          <div className="modal-container">
            <div className="flex items-center justify-between mb-4">
              <div><h3 className="text-base font-bold text-red-600">Process Return</h3><p className="text-xs text-text-secondary">Edit values if item condition or price changed</p></div>
              <button onClick={() => setModal(null)} className="p-1.5 hover:bg-gray-100 rounded-lg"><X className="h-5 w-5" /></button>
            </div>

            <div className="space-y-3">
              <div className="bg-red-50 text-red-700 p-3 rounded-xl text-xs font-bold border border-red-200">
                Warning: Confirming this will mark the sale as returned, save any edits you make below, and add the items back to stock.
              </div>

              <div>
                <h4 className="font-bold text-xs mb-1.5 uppercase tracking-wide">Customer Details</h4>
                <div className="bg-gray-50 p-3 rounded-xl border border-border text-xs space-y-1.5">
                  <div className="flex justify-between"><span className="text-text-muted">Name</span><span className="font-bold text-text-primary">{returnSale.customer.name}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">Contact</span><span className="font-medium text-text-primary">{returnSale.customer.number}</span></div>
                  <div className="flex justify-between"><span className="text-text-muted">CNIC</span><span className="font-medium text-text-primary">{returnSale.customer.cnic || '—'}</span></div>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-xs mb-1.5 uppercase tracking-wide">Items Being Returned (Editable)</h4>
                <div className="space-y-2.5">
                  {returnSale.items.map((item, idx) => (
                    <div key={idx} className="border border-border p-3 rounded-xl bg-gray-50 text-xs">
                      <div className="flex justify-between items-center mb-2">
                        <p className="font-bold text-text-primary text-sm">{item.quantity}x {item.productName}</p>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Cost Price</label>
                          <input type="number" min="0" value={item.costPrice} onChange={(e) => {
                            const newItems = [...returnSale.items];
                            newItems[idx].costPrice = Number(e.target.value);
                            setReturnSale({ ...returnSale, items: newItems });
                          }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Refund Price</label>
                          <input type="number" min="0" value={item.sellPrice} onChange={(e) => {
                            const newItems = [...returnSale.items];
                            newItems[idx].sellPrice = Number(e.target.value);
                            setReturnSale({ ...returnSale, items: newItems });
                          }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" />
                        </div>
                        
                        {item.category === 'mobile' && (
                          <>
                            <div className="col-span-2">
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Battery Health</label>
                              <input value={item.batteryHealth || ''} onChange={(e) => {
                                const newItems = [...returnSale.items];
                                newItems[idx].batteryHealth = e.target.value;
                                setReturnSale({ ...returnSale, items: newItems });
                              }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" placeholder="e.g. 85%" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">PTA Status</label>
                              <input value={item.ptaStatus || ''} onChange={(e) => {
                                const newItems = [...returnSale.items];
                                newItems[idx].ptaStatus = e.target.value;
                                setReturnSale({ ...returnSale, items: newItems });
                              }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Color</label>
                              <input value={item.color || ''} onChange={(e) => {
                                const newItems = [...returnSale.items];
                                newItems[idx].color = e.target.value;
                                setReturnSale({ ...returnSale, items: newItems });
                              }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" />
                            </div>
                            <div className="col-span-2">
                              <span className="text-text-muted block text-[10px]">IMEI 1</span>
                              <span className="font-mono text-xs text-text-primary block break-all">{item.imei1 || '—'}</span>
                            </div>
                            <div className="col-span-2">
                              <span className="text-text-muted block text-[10px]">IMEI 2</span>
                              <span className="font-mono text-xs text-text-primary block break-all">{item.imei2 || '—'}</span>
                            </div>
                          </>
                        )}

                        <div className="col-span-2">
                          <label className="block text-[10px] font-bold text-gray-500 uppercase mb-0.5">Item Comments (if any)</label>
                          <input value={item.comments || ''} onChange={(e) => {
                            const newItems = [...returnSale.items];
                            newItems[idx].comments = e.target.value;
                            setReturnSale({ ...returnSale, items: newItems });
                          }} className="w-full rounded-lg border border-border px-2 py-1.5 text-xs outline-none focus:border-brand" placeholder="e.g. Screen scratched..." />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-3 border-t border-border mt-3">
                <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-300 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
                <button onClick={confirmReturn} disabled={returning} className="rounded-xl bg-red-600 px-5 py-1.5 text-xs font-bold text-white hover:bg-red-700 w-full">
                  {returning ? 'Processing...' : 'Confirm Return & Save Edits'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}