import { useEffect, useState } from 'react'
import { Trash2, ShoppingCart, X, ImageOff, ShoppingBag, Search, Pencil, Battery } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'
import Pagination from '../../components/Pagination'

const CATEGORIES = [
  { value: 'mobile', label: 'Mobiles' },
  { value: 'perfume', label: 'Perfumes' },
  { value: 'headphone', label: 'Accessories' },
]

const emptySell = { customerName: '', customerNumber: '', customerCnic: '', customerAddress: '', comments: '', date: '' }

const emptyForm = {
  name: '', category: 'mobile', listedPrice: '', costPrice: '', color: '', stock: '1',
  imei1: '', imei2: '', ptaStatus: '', batteryHealth: '',
  supplierName: '', supplierCnic: '', supplierContact: '',
  purchaseDate: new Date().toISOString().split('T')[0], comments: '', description: '',
}

function Modal({ title, onClose, children }) {
  return (
    <div className="modal-overlay">
      <div className="modal-container max-w-lg">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-lg font-bold text-text-primary">{title}</h3>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-text-muted hover:bg-gray-100"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  )
}

export default function Products() {
  const [category, setCategory] = useState('mobile')
  const [search, setSearch] = useState('')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null) 

  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const [cart, setCart] = useState([])
  const [sellForm, setSellForm] = useState(emptySell)
  const [saving, setSaving] = useState(false)

  const [selectedProduct, setSelectedProduct] = useState(null)
  const [editingProduct, setEditingProduct] = useState(null)
  const [editForm, setEditForm] = useState(emptyForm)
  const [imageFiles, setImageFiles] = useState([])

  function load() {
    setLoading(true); setError('')
    api.getProducts({ category, search })
      .then(setProducts)
      .catch((e) => setError(`Error loading products: ${e.message}`))
      .finally(() => setLoading(false))
  }
  
  useEffect(() => { setCurrentPage(1); load() }, [category, search])

  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = products.slice(indexOfFirstItem, indexOfLastItem)
  const totalPages = Math.ceil(products.length / itemsPerPage)

  function addToCart(product, e) {
    if (e) e.stopPropagation()
    if (product.stock < 1) return alert('This item is out of stock!')
    
    const existing = cart.find(c => c.productId === product._id)
    if (existing) {
      if (product.category === 'mobile') return alert('Mobile already in cart')
      if (existing.quantity >= product.stock) return alert('Not enough stock available')
      setCart(cart.map(c => c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { productId: product._id, productName: product.name, category: product.category, costPrice: product.costPrice, sellPrice: product.listedPrice, quantity: 1, maxStock: product.stock, imei1: product.imei1, imei2: product.imei2, ptaStatus: product.ptaStatus, batteryHealth: product.batteryHealth }])
    }
  }

  function removeFromCart(productId) { setCart(cart.filter(c => c.productId !== productId)) }
  function updateCartQty(id, qty) { const num = Number(qty); if (num < 1) return; const item = cart.find(c => c.productId === id); if (num > item.maxStock) return alert('Not enough stock available'); setCart(cart.map(c => c.productId === id ? { ...c, quantity: num } : c)) }
  function updateCartPrice(id, price) { setCart(cart.map(c => c.productId === id ? { ...c, sellPrice: Number(price) } : c)) }

  async function handleCheckout(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.checkoutSale({ items: cart, customer: { name: sellForm.customerName, number: sellForm.customerNumber, cnic: sellForm.customerCnic, address: sellForm.customerAddress }, comments: sellForm.comments, date: sellForm.date })
      setModal(null); setCart([]); setSellForm(emptySell); load()
    } catch (err) { alert(`Failed to complete sale:\n\n${err.message}`); setSaving(false) }
  }

  function openDetails(product) {
    setSelectedProduct(product)
    setModal('details')
  }

  function openEdit(product) {
    setEditingProduct(product)
    setEditForm({
      name: product.name, category: product.category, listedPrice: String(product.listedPrice), costPrice: String(product.costPrice),
      color: product.color || '', stock: String(product.stock), imei1: product.imei1 || '', imei2: product.imei2 || '',
      ptaStatus: product.ptaStatus || '', batteryHealth: product.batteryHealth || '',
      supplierName: product.supplierName || '', supplierCnic: product.supplierCnic || '', supplierContact: product.supplierContact || '',
      purchaseDate: product.purchaseDate ? new Date(product.purchaseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      comments: product.comments || '', description: product.description || '',
    })
    setImageFiles([])
    setModal('edit')
  }

  async function handleEditSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(editForm).forEach(([k, v]) => fd.append(k, v))
      if (imageFiles.length > 0) Array.from(imageFiles).forEach(file => fd.append('images', file))
      await api.updateProduct(editingProduct._id || editingProduct.id, fd)
      setModal(null); setSelectedProduct(null); load()
    } catch (err) { alert(`Failed to update product:\n\n${err.message}`); setSaving(false) }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
  const cartProfit = cart.reduce((sum, item) => sum + ((item.sellPrice - item.costPrice) * item.quantity), 0)

  const renderImage = (p) => {
    const imgSrc = p.images?.[0] || p.image;
    if (!imgSrc) return <ImageOff className="h-4 w-4 text-text-muted" />;
    return (
      <>
        <img 
          src={imgSrc} 
          alt="" 
          className="h-full w-full object-cover" 
          onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block'; }} 
        />
        <ImageOff className="hidden h-4 w-4 text-text-muted" />
      </>
    );
  };

  return (
    <div className="page-container w-full overflow-hidden pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">I Sell — Create Sale</h1>
          <p className="page-subtitle text-sm text-text-secondary">Click on any item to view details or edit, or add to cart to sell</p>
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
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Name, IMEI, Color..." className="w-full rounded-xl border border-border pl-10 pr-4 py-2 text-sm outline-none focus:border-brand bg-white" />
        </div>
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600 font-bold">{error}</p>}

      <div className="hidden md:block card overflow-x-auto bg-white rounded-xl border border-border">
        <table className="w-full text-left text-sm min-w-[800px]">
          <thead className="bg-gray-50 border-b border-border text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Product</th><th className="px-4 py-3">Details</th>
              <th className="px-4 py-3">Price</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && <tr><td colSpan={5} className="text-center py-10">Loading...</td></tr>}
            {!loading && products.length === 0 && <tr><td colSpan={5} className="text-center py-10 text-text-muted">No products found.</td></tr>}
            {!loading && currentProducts.map((p) => (
              <tr key={p._id} onClick={() => openDetails(p)} className="hover:bg-gray-50 cursor-pointer transition-colors">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 border border-border shrink-0">
                      {renderImage(p)}
                    </div>
                    <div><div className="font-bold text-text-primary">{p.name}</div><div className="text-xs text-text-muted">{p.color || '—'}</div></div>
                  </div>
                </td>
                <td className="px-4 py-3 text-xs">
                  {p.category === 'mobile' && (
                    <div className="text-text-secondary">
                      <div><span className="font-bold">IMEI 1:</span> {p.imei1 || '—'}</div>
                      <div><span className="font-bold">IMEI 2:</span> {p.imei2 || '—'}</div>
                    </div>
                  )}
                  {p.ptaStatus && <div className="text-brand font-bold mt-0.5">PTA Status: {p.ptaStatus}</div>}
                  {p.batteryHealth && <div className="text-success font-bold mt-0.5">Battery Health: {p.batteryHealth}</div>}
                </td>
                <td className="px-4 py-3 font-bold text-text-primary">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</td>
                <td className="px-4 py-3"><span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span></td>
                <td className="px-4 py-3">
                  <div className="flex justify-end">
                    <button onClick={(e) => addToCart(p, e)} disabled={p.stock < 1} className={`inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition ${p.stock < 1 ? 'opacity-50 cursor-not-allowed' : ''}`}>
                      <ShoppingCart className="h-3 w-3" /> {p.stock < 1 ? 'Sold Out' : 'Add'}
                    </button>
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
          <div key={p._id} onClick={() => openDetails(p)} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3 cursor-pointer hover:border-brand transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-border shrink-0">
                  {renderImage(p)}
                </div>
                <div><h3 className="font-bold text-text-primary text-base leading-tight">{p.name}</h3><p className="text-xs text-text-secondary mt-0.5">{p.color || '—'}</p></div>
              </div>
              <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span>
            </div>
            {p.category === 'mobile' && (
              <div className="text-xs text-text-secondary border-t border-border pt-2">
                <div><span className="font-bold">IMEI 1:</span> {p.imei1 || '—'}</div>
                <div><span className="font-bold">IMEI 2:</span> {p.imei2 || '—'}</div>
                <div className="flex gap-2 mt-1">{p.ptaStatus && <span className="text-brand font-bold bg-brand/5 px-1 rounded">PTA Status: {p.ptaStatus}</span>}{p.batteryHealth && <span className="text-success font-bold bg-success/5 px-1 rounded">Battery Health: {p.batteryHealth}</span>}</div>
              </div>
            )}
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="font-bold text-brand">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</span>
              <button onClick={(e) => addToCart(p, e)} disabled={p.stock < 1} className={`inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-3 py-1.5 text-xs font-bold text-brand ${p.stock < 1 ? 'opacity-50' : ''}`}><ShoppingCart className="h-3 w-3" /> Add</button>
            </div>
          </div>
        ))}
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* FLOATING CART */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-50 animate-in slide-in-from-bottom">
          <button onClick={() => setModal('cart')} className="w-full bg-brand text-white rounded-xl shadow-2xl p-4 flex items-center justify-between hover:bg-brand-hover transition">
            <div className="flex items-center gap-3"><div className="bg-white/20 p-2 rounded-lg"><ShoppingBag className="h-5 w-5" /></div><span className="font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span></div>
            <span className="font-bold">{CURRENCY} {cartTotal.toLocaleString()} →</span>
          </button>
        </div>
      )}

      {/* DETAILS MODAL */}
      {modal === 'details' && selectedProduct && (
        <Modal title="Product Details" onClose={() => setModal(null)}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="h-16 w-16 shrink-0 rounded-xl border border-border bg-gray-50 overflow-hidden flex items-center justify-center">
                {renderImage(selectedProduct)}
              </div>
              <div>
                <h3 className="text-base font-bold text-text-primary">{selectedProduct.name}</h3>
                <p className="text-xs text-text-secondary">{selectedProduct.color || '—'} • {selectedProduct.category}</p>
                <p className="text-sm font-extrabold text-brand mt-0.5">{CURRENCY} {Number(selectedProduct.listedPrice).toLocaleString()}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 bg-gray-50 p-2.5 rounded-xl border border-border text-xs">
              <div><span className="text-text-muted block text-[10px]">Cost Price</span><span className="font-bold text-text-primary text-xs">{CURRENCY} {Number(selectedProduct.costPrice).toLocaleString()}</span></div>
              <div><span className="text-text-muted block text-[10px]">Stock</span><span className={`font-bold text-xs ${selectedProduct.stock > 0 ? 'text-success' : 'text-danger'}`}>{selectedProduct.stock}</span></div>
              
              {selectedProduct.category === 'mobile' && (
                <>
                  <div className="col-span-1 border-t border-border pt-1.5 mt-0.5"><span className="text-text-muted block text-[10px]">Supplier Name</span><span className="font-medium text-text-primary truncate block">{selectedProduct.supplierName || '—'}</span></div>
                  <div className="col-span-1 border-t border-border pt-1.5 mt-0.5"><span className="text-text-muted block text-[10px]">Supplier CNIC</span><span className="font-medium text-text-primary">{selectedProduct.supplierCnic || '—'}</span></div>
                  <div><span className="text-text-muted block text-[10px]">Supplier Contact</span><span className="font-medium text-text-primary">{selectedProduct.supplierContact || '—'}</span></div>
                  <div><span className="text-text-muted block text-[10px]">PTA Status</span><span className="font-bold text-brand">{selectedProduct.ptaStatus || '—'}</span></div>
                  <div className="col-span-2"><span className="text-text-muted block text-[10px]">IMEI 1</span><span className="font-mono text-[11px] text-text-primary">{selectedProduct.imei1 || '—'}</span></div>
                  <div className="col-span-2"><span className="text-text-muted block text-[10px]">IMEI 2</span><span className="font-mono text-[11px] text-text-primary">{selectedProduct.imei2 || '—'}</span></div>
                  <div className="col-span-2"><span className="text-text-muted block text-[10px]">Battery Health</span><span className="font-bold text-success flex items-center gap-1"><Battery className="h-3 w-3" /> {selectedProduct.batteryHealth || '—'}</span></div>
                </>
              )}
            </div>

            {selectedProduct.description && (
              <div>
                <span className="text-text-muted text-[10px] block mb-0.5">Description</span>
                <p className="text-xs text-text-primary bg-gray-50 p-2 rounded-lg border border-border">{selectedProduct.description}</p>
              </div>
            )}
            
            {selectedProduct.comments && (
              <div>
                <span className="text-text-muted text-[10px] block mb-0.5">Comments</span>
                <p className="text-xs text-text-primary bg-gray-50 p-2 rounded-lg border border-border">{selectedProduct.comments}</p>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button onClick={() => setModal(null)} className="btn-secondary w-full py-1.5 text-xs">Close</button>
              <button onClick={() => openEdit(selectedProduct)} className="btn-primary w-full py-1.5 text-xs">
                <Pencil className="h-3.5 w-3.5" /> Edit Product
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* EDIT MODAL */}
      {modal === 'edit' && editingProduct && (
        <Modal title="Edit Product" onClose={() => setModal(null)}>
          <form onSubmit={handleEditSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2"><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Model / Product Name</label><input required value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
              <div className="col-span-2"><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Category</label><select value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value, stock: e.target.value === 'mobile' ? '1' : editForm.stock })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand">{CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Cost ({CURRENCY})</label><input type="number" required value={editForm.costPrice} onChange={(e) => setEditForm({ ...editForm, costPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
              <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Selling ({CURRENCY})</label><input type="number" required value={editForm.listedPrice} onChange={(e) => setEditForm({ ...editForm, listedPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
              <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">{editForm.category === 'perfume' ? 'Bottle Size' : 'Color'}</label><input value={editForm.color} onChange={(e) => setEditForm({ ...editForm, color: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder={editForm.category === 'perfume' ? 'e.g. 100ml' : 'e.g. Black'} /></div>
              <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Stock</label><input type="number" min="0" required value={editForm.category === 'mobile' ? '1' : editForm.stock} disabled={editForm.category === 'mobile'} onChange={(e) => setEditForm({ ...editForm, stock: e.target.value })} className={`w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand ${editForm.category === 'mobile' ? 'bg-gray-100 text-gray-400' : ''}`} /></div>
            </div>

            {editForm.category === 'mobile' && (
              <div className="border-t border-border pt-3">
                <h4 className="text-[11px] font-bold text-brand uppercase mb-2">Supplier &amp; Purchase Info</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Supplier Name</label><input value={editForm.supplierName} onChange={(e) => setEditForm({ ...editForm, supplierName: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">CNIC Number</label><input value={editForm.supplierCnic} onChange={(e) => setEditForm({ ...editForm, supplierCnic: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                  <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Contact Number</label><input value={editForm.supplierContact} onChange={(e) => setEditForm({ ...editForm, supplierContact: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                  <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Buy Date</label><input type="date" value={editForm.purchaseDate} onChange={(e) => setEditForm({ ...editForm, purchaseDate: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                </div>
              </div>
            )}

            {editForm.category === 'mobile' && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-3">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-[10px] font-bold text-brand uppercase mb-0.5">PTA Status</label><input value={editForm.ptaStatus} onChange={(e) => setEditForm({ ...editForm, ptaStatus: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder="PTA / Non PTA" /></div>
                  <div><label className="block text-[10px] font-bold text-brand uppercase mb-0.5">Battery Health</label><input value={editForm.batteryHealth} onChange={(e) => setEditForm({ ...editForm, batteryHealth: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder="e.g. 89%" /></div>
                  <div><label className="block text-[10px] font-bold text-brand uppercase mb-0.5">IMEI 1</label><input value={editForm.imei1} onChange={(e) => setEditForm({ ...editForm, imei1: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                  <div><label className="block text-[10px] font-bold text-brand uppercase mb-0.5">IMEI 2</label><input value={editForm.imei2} onChange={(e) => setEditForm({ ...editForm, imei2: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
                </div>
              </div>
            )}

            <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Description</label><textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} rows={2} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder="Full product description..." /></div>
            <div><label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Comments if any!</label><textarea value={editForm.comments} onChange={(e) => setEditForm({ ...editForm, comments: e.target.value })} rows={1} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>

            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase mb-0.5">Images (Max 6)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)} className="block w-full text-xs text-gray-500 file:mr-3 file:rounded-xl file:border-0 file:bg-brand/10 file:px-3 file:py-1.5 file:text-xs file:font-bold file:text-brand hover:file:bg-brand/20" />
              {editingProduct.images?.length > 0 && imageFiles.length === 0 && (
                <div className="flex gap-2 mt-2 overflow-x-auto">
                  {editingProduct.images.map((img, i) => (<img key={i} src={img} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-border mt-4">
              <button type="button" onClick={() => setModal('details')} className="rounded-xl border border-gray-300 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">Back</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand px-5 py-1.5 text-xs font-bold text-white hover:bg-brand-hover">{saving ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* CHECKOUT CART MODAL */}
      {modal === 'cart' && (
        <Modal title="Checkout Cart" onClose={() => setModal(null)}>
          <div className="space-y-3 mb-4">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between gap-2 bg-gray-50 p-2.5 rounded-lg border border-border">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs text-text-primary truncate">{item.productName}</p>
                  {item.category === 'mobile' && (
                    <div className="text-[10px] text-text-muted truncate">
                      <div>IMEI 1: {item.imei1}</div>
                      <div>IMEI 2: {item.imei2}</div>
                      {item.ptaStatus && <div>PTA: {item.ptaStatus} {item.batteryHealth && `• Batt: ${item.batteryHealth}`}</div>}
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="flex flex-col items-center"><label className="text-[9px] text-text-muted font-bold mb-0.5">Qty</label><input type="number" min="1" value={item.quantity} onChange={(e) => updateCartQty(item.productId, e.target.value)} disabled={item.category === 'mobile'} className="w-12 rounded-lg border border-border px-1.5 py-1 text-center text-xs outline-none focus:border-brand" /></div>
                  <div className="flex flex-col items-center"><label className="text-[9px] text-text-muted font-bold mb-0.5">Price</label><input type="number" min="0" value={item.sellPrice} onChange={(e) => updateCartPrice(item.productId, e.target.value)} className="w-20 rounded-lg border border-border px-1.5 py-1 text-xs outline-none focus:border-brand" /></div>
                  <button type="button" onClick={() => removeFromCart(item.productId)} className="mt-3.5 p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center bg-green-50 p-2.5 rounded-lg text-green-700 font-bold text-xs"><span>Cart Profit:</span><span>{CURRENCY} {cartProfit.toLocaleString()}</span></div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-3 border-t border-border pt-3">
            <h4 className="font-bold text-xs text-text-primary uppercase tracking-wide">Customer Details</h4>
            <div className="grid grid-cols-2 gap-2.5">
              <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Name</label><input required value={sellForm.customerName} onChange={(e) => setSellForm({ ...sellForm, customerName: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
              <div><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Contact Number</label><input required value={sellForm.customerNumber} onChange={(e) => setSellForm({ ...sellForm, customerNumber: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" /></div>
              <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">CNIC Number</label><input value={sellForm.customerCnic} onChange={(e) => setSellForm({ ...sellForm, customerCnic: e.target.value })} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder="Optional" /></div>
              <div className="col-span-2"><label className="block text-[10px] font-bold text-gray-600 uppercase mb-0.5">Comments if any!</label><textarea value={sellForm.comments} onChange={(e) => setSellForm({ ...sellForm, comments: e.target.value })} rows={1} className="w-full rounded-xl border border-border px-3 py-1.5 text-xs outline-none focus:border-brand" placeholder="Any note about this sale..." /></div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2 mt-1">
              <button type="button" onClick={() => setModal(null)} className="rounded-xl border border-gray-300 px-4 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving || cart.length === 0} className="rounded-xl bg-brand px-5 py-1.5 text-xs font-bold text-white hover:bg-brand-hover w-full">{saving ? 'Processing...' : `Confirm Sale (${CURRENCY} ${cartTotal.toLocaleString()})`}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}