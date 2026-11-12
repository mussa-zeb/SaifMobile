import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, X, ImageOff, Download, Search } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'
import Pagination from '../../components/Pagination'

const CATEGORIES = [
  { value: 'mobile', label: 'Mobiles' },
  { value: 'perfume', label: 'Perfumes' },
  { value: 'headphone', label: 'Accessories' },
]

const getTodayStr = () => new Date().toISOString().split('T')[0]
const emptyForm = {
  name: '', category: 'mobile', listedPrice: '', costPrice: '', color: '', stock: '1',
  imei1: '', imei2: '', ptaStatus: '', batteryHealth: '',
  supplierName: '', supplierCnic: '', supplierContact: '',
  purchaseDate: getTodayStr(), comments: '', description: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-white p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Inventory() {
  const [category, setCategory] = useState('mobile')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  const [modal, setModal] = useState(null) // 'form' or 'download'
  const [downloading, setDownloading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFiles, setImageFiles] = useState([])
  const [saving, setSaving] = useState(false)

  function load() {
    setLoading(true); setError('')
    api.getProducts({ category, search, inStock: 'true' })
      .then(setProducts)
      .catch((e) => setError(`Error loading inventory: ${e.message}`))
      .finally(() => setLoading(false))
  }
  useEffect(() => { setCurrentPage(1); load() }, [category, search])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(products.length / itemsPerPage)

  function openAdd() { setEditing(null); setForm({ ...emptyForm, category, purchaseDate: getTodayStr() }); setImageFiles([]); setModal('form') }
  function openEdit(p) {
    setEditing(p)
    setForm({
      name: p.name, category: p.category, listedPrice: String(p.listedPrice), costPrice: String(p.costPrice),
      color: p.color || '', stock: String(p.stock), imei1: p.imei1 || '', imei2: p.imei2 || '',
      ptaStatus: p.ptaStatus || '', batteryHealth: p.batteryHealth || '',
      supplierName: p.supplierName || '', supplierCnic: p.supplierCnic || '', supplierContact: p.supplierContact || '',
      purchaseDate: p.purchaseDate ? new Date(p.purchaseDate).toISOString().split('T')[0] : getTodayStr(),
      comments: p.comments || '', description: p.description || '',
    })
    setImageFiles([]); setModal('form')
  }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      if (imageFiles.length > 0) Array.from(imageFiles).forEach(file => fd.append('images', file))
      if (editing) await api.updateProduct(editing._id || editing.id, fd)
      else await api.createProduct(fd)
      setModal(null); load()
    } catch (err) { alert(`Failed to save product:\n\n${err.message}`); setSaving(false) }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}" permanently?`)) return
    try { await api.deleteProduct(p._id || p.id); load() } catch (err) { alert(`Failed to delete product:\n\n${err.message}`) }
  }

  async function handleDownload() {
    setDownloading(true)
    try { 
      await api.downloadProductsPdf(category, startDate, endDate) 
      setModal(null)
    } catch (err) { 
      alert(`PDF Error:\n\n${err.message}`) 
    } finally { 
      setDownloading(false) 
    }
  }

  return (
    <div className="page-container w-full overflow-hidden pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">Inventory Management</h1>
          <p className="page-subtitle text-sm text-text-secondary">Add, edit, delete, and export all products</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button onClick={() => setModal('download')} className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand/30 bg-brand/5 px-4 py-2.5 text-sm font-bold text-brand hover:bg-brand hover:text-white transition flex-1 sm:flex-none">
            <Download className="h-4 w-4" /> Export PDF
          </button>
          <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover flex-1 sm:flex-none">
            <Plus className="h-4 w-4" /> Add Product
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {CATEGORIES.map((c) => (
          <button key={c.value} onClick={() => setCategory(c.value)} className={`rounded-xl px-3 py-1.5 text-xs sm:px-4 sm:py-2 sm:text-sm font-semibold transition ${category === c.value ? 'bg-brand text-white shadow-md' : 'bg-white border border-border text-text-secondary hover:border-brand'}`}>{c.label}</button>
        ))}
      </div>

      <div className="mb-6 w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Name, IMEI, CNIC, Supplier..." className="w-full rounded-xl border border-border pl-10 pr-4 py-2 text-sm outline-none focus:border-brand bg-white" />
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 font-bold">{error}</p>}

      <div className="hidden md:block card overflow-x-auto bg-white rounded-xl border border-border">
        <table className="w-full text-left text-sm min-w-[900px]">
          <thead className="bg-gray-50 border-b border-border text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Product / Supplier</th><th className="px-4 py-3">Color</th>
              {category === 'mobile' && <th className="px-4 py-3">IMEI / PTA / Battery</th>}
              <th className="px-4 py-3">Cost</th><th className="px-4 py-3">Selling</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && <tr><td colSpan={7} className="text-center py-10">Loading...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={7} className="text-center py-10 text-text-muted">No products found.</td></tr>}
            {!loading && currentProducts.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 border border-border shrink-0">
                      {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 text-text-muted" />}
                    </div>
                    <div>
                      <div className="font-bold text-text-primary">{p.name}</div>
                      <div className="text-xs text-text-muted">{p.supplierName || '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{p.color || '—'}</td>
                {category === 'mobile' && (
                  <td className="px-4 py-3 text-xs">
                    <div className="text-text-secondary"><span className="font-bold">IMEI 1:</span> {p.imei1 || '—'}</div>
                    <div className="text-text-secondary"><span className="font-bold">IMEI 2:</span> {p.imei2 || '—'}</div>
                    <div className="flex gap-2 mt-1">
                      {p.ptaStatus && <span className="text-brand font-bold bg-brand/5 px-1 rounded">{p.ptaStatus}</span>}
                      {p.batteryHealth && <span className="text-success font-bold bg-success/5 px-1 rounded">{p.batteryHealth}</span>}
                    </div>
                  </td>
                )}
                <td className="px-4 py-3 text-text-secondary">{CURRENCY} {Number(p.costPrice).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-text-primary">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => openEdit(p)} className="inline-flex items-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(p)} className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      <div className="md:hidden space-y-4">
        {currentProducts.map((p) => (
          <div key={p._id} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-border shrink-0">
                  {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5 text-text-muted" />}
                </div>
                <div><h3 className="font-bold text-text-primary text-base leading-tight">{p.name}</h3><p className="text-xs text-text-secondary mt-0.5">{p.supplierName || '—'}</p></div>
              </div>
              <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span>
            </div>
            {category === 'mobile' && (
              <div className="text-xs text-text-secondary border-t border-border pt-2">
                <div><span className="font-bold">IMEI 1:</span> {p.imei1 || '—'}</div>
                <div><span className="font-bold">IMEI 2:</span> {p.imei2 || '—'}</div>
                <div className="flex gap-2 mt-1">
                  {p.ptaStatus && <span className="text-brand font-bold bg-brand/5 px-1 rounded">{p.ptaStatus}</span>}
                  {p.batteryHealth && <span className="text-success font-bold bg-success/5 px-1 rounded">{p.batteryHealth}</span>}
                </div>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-text-secondary">Cost: {CURRENCY} {Number(p.costPrice).toLocaleString()}</span>
              <span className="font-bold text-brand">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => openEdit(p)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-bold text-gray-600"><Pencil className="h-3 w-3" /> Edit</button>
              <button onClick={() => handleDelete(p)} className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* FORM MODAL */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Product' : 'Add New Product'} onClose={() => setModal(null)}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Model / Product Name</label><input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label><select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, stock: e.target.value === 'mobile' ? '1' : form.stock })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cost ({CURRENCY})</label><input type="number" required value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Selling ({CURRENCY})</label><input type="number" required value={form.listedPrice} onChange={(e) => setForm({ ...form, listedPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">{form.category === 'perfume' ? 'Bottle Size' : 'Color'}</label><input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" placeholder={form.category === 'perfume' ? 'e.g. 100ml' : 'e.g. Black'} /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Stock</label><input type="number" min="0" required value={form.category === 'mobile' ? '1' : form.stock} disabled={form.category === 'mobile'} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={`w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand ${form.category === 'mobile' ? 'bg-gray-100 text-gray-400' : ''}`} /></div>
            </div>

            {/* Show Supplier info ONLY for Mobiles */}
            {form.category === 'mobile' && (
              <div className="border-t border-border pt-4">
                <h4 className="text-xs font-bold text-brand uppercase mb-3">Supplier &amp; Purchase Info</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Supplier Name</label><input value={form.supplierName} onChange={(e) => setForm({ ...form, supplierName: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">CNIC Number</label><input value={form.supplierCnic} onChange={(e) => setForm({ ...form, supplierCnic: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                  <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Contact Number</label><input value={form.supplierContact} onChange={(e) => setForm({ ...form, supplierContact: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Buy Date</label><input type="date" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                </div>
              </div>
            )}

            {form.category === 'mobile' && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-brand uppercase mb-1">PTA Status</label><input value={form.ptaStatus} onChange={(e) => setForm({ ...form, ptaStatus: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" placeholder="PTA Approved / Non PTA" /></div>
                  <div className="col-span-2"><label className="block text-xs font-bold text-brand uppercase mb-1">Battery Health</label><input value={form.batteryHealth} onChange={(e) => setForm({ ...form, batteryHealth: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" placeholder="e.g. 89%" /></div>
                  <div><label className="block text-xs font-bold text-brand uppercase mb-1">IMEI 1</label><input value={form.imei1} onChange={(e) => setForm({ ...form, imei1: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                  <div><label className="block text-xs font-bold text-brand uppercase mb-1">IMEI 2</label><input value={form.imei2} onChange={(e) => setForm({ ...form, imei2: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                </div>
              </div>
            )}

            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" placeholder="Full product description..." /></div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Comments if any!</label><textarea value={form.comments} onChange={(e) => setForm({ ...form, comments: e.target.value })} rows={1} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>

            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Images (Max 6)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand hover:file:bg-brand/20" />
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* DOWNLOAD MODAL */}
      {modal === 'download' && (
        <Modal title="Export PDF" onClose={() => setModal(null)}>
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">Select a date range for the {category} report. Leave blank to download all time.</p>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">From Date</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">To Date</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            </div>
            <div className="flex justify-end gap-3 pt-4 mt-2">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button onClick={handleDownload} disabled={downloading} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">{downloading ? 'Generating...' : 'Download PDF'}</button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}