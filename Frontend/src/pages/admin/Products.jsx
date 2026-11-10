import { useEffect, useState } from 'react'
import { Plus, Pencil, Trash2, ShoppingCart, X, ImageOff, ShoppingBag } from 'lucide-react'
import { api } from '../../api'
import { CURRENCY } from '../../config'

const CATEGORIES = [
  { value: 'mobile', label: 'Mobiles' },
  { value: 'perfume', label: 'Perfumes' },
  { value: 'headphone', label: 'Headphones' },
]

const emptyForm = { name: '', category: 'mobile', listedPrice: '', costPrice: '', color: '', stock: '1', imei1: '', imei2: '', description: '' }
const emptySell = { customerName: '', customerNumber: '', customerCnic: '', customerAddress: '', date: '' }

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

export default function Products() {
  const [category, setCategory] = useState('mobile')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [modal, setModal] = useState(null)
  
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [imageFiles, setImageFiles] = useState([]) // Array for multiple images
  const [saving, setSaving] = useState(false)

  const [cart, setCart] = useState([])
  const [sellForm, setSellForm] = useState(emptySell)
  
  function load() {
    setLoading(true); setError('')
    api.getProducts({ category, inStock: 'true' }).then(setProducts).catch((e) => setError(e.message)).finally(() => setLoading(false))
  }
  useEffect(load, [category])

  function openAdd() { setEditing(null); setForm({ ...emptyForm, category }); setImageFiles([]); setModal('form') }
  function openEdit(p) {
    setEditing(p)
    setForm({ name: p.name, category: p.category, listedPrice: String(p.listedPrice), costPrice: String(p.costPrice), color: p.color || '', stock: String(p.stock), imei1: p.imei1 || '', imei2: p.imei2 || '', description: p.description || '' })
    setImageFiles([]); setModal('form')
  }
  function closeModal() { setModal(null); setEditing(null); setSaving(false) }

  async function handleSubmit(e) {
    e.preventDefault(); setSaving(true)
    try {
      const fd = new FormData()
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))
      
      // Append multiple images to FormData
      if (imageFiles.length > 0) {
        Array.from(imageFiles).forEach(file => {
          fd.append('images', file)
        })
      }

      if (editing) await api.updateProduct(editing._id || editing.id, fd)
      else await api.createProduct(fd)
      closeModal(); load()
    } catch (err) { alert(err.message); setSaving(false) }
  }

  async function handleDelete(p) {
    if (!window.confirm(`Delete "${p.name}"?`)) return
    try { await api.deleteProduct(p._id || p.id); load() } catch (err) { alert(err.message) }
  }

  function addToCart(product) {
    const existing = cart.find(c => c.productId === product._id)
    if (existing) {
      if (product.category === 'mobile') return alert('Mobile already in cart')
      if (existing.quantity >= product.stock) return alert('Not enough stock')
      setCart(cart.map(c => c.productId === product._id ? { ...c, quantity: c.quantity + 1 } : c))
    } else {
      setCart([...cart, { 
        productId: product._id, 
        productName: product.name, 
        category: product.category,
        costPrice: product.costPrice,
        sellPrice: product.listedPrice, 
        quantity: 1, 
        maxStock: product.stock,
        imei1: product.imei1 
      }])
    }
  }

  function removeFromCart(productId) { setCart(cart.filter(c => c.productId !== productId)) }
  function updateCartQty(id, qty) {
    const num = Number(qty)
    if (num < 1) return
    const item = cart.find(c => c.productId === id)
    if (num > item.maxStock) return alert('Not enough stock')
    setCart(cart.map(c => c.productId === id ? { ...c, quantity: num } : c))
  }
  function updateCartPrice(id, price) { setCart(cart.map(c => c.productId === id ? { ...c, sellPrice: Number(price) } : c)) }

  async function handleCheckout(e) {
    e.preventDefault(); setSaving(true)
    try {
      await api.checkoutSale({ items: cart, customer: { name: sellForm.customerName, number: sellForm.customerNumber, cnic: sellForm.customerCnic, address: sellForm.customerAddress }, date: sellForm.date })
      closeModal(); setCart([]); setSellForm(emptySell); load()
    } catch (err) { alert(err.message); setSaving(false) }
  }

  const cartTotal = cart.reduce((sum, item) => sum + (item.sellPrice * item.quantity), 0)
  const cartProfit = cart.reduce((sum, item) => sum + ((item.sellPrice - item.costPrice) * item.quantity), 0)

  return (
    <div className="page-container w-full overflow-hidden pb-24">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="page-title text-2xl font-bold">Products</h1>
          <p className="page-subtitle text-sm text-text-secondary">Manage inventory and record sales</p>
        </div>
        <button onClick={openAdd} className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-bold text-white transition hover:bg-brand-hover w-full sm:w-auto">
          <Plus className="h-4 w-4" /> Add Product
        </button>
      </div>

      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button 
            key={c.value} 
            onClick={() => setCategory(c.value)} 
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              category === c.value ? 'bg-brand text-white shadow-md' : 'bg-white border border-border text-text-secondary hover:border-brand'
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {error && <p className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>}

      {/* DESKTOP TABLE */}
      <div className="hidden md:block card overflow-x-auto bg-white rounded-xl border border-border">
        <table className="w-full text-left text-sm min-w-[700px]">
          <thead className="bg-gray-50 border-b border-border text-xs uppercase text-text-muted">
            <tr>
              <th className="px-4 py-3">Product</th><th className="px-4 py-3">{category === 'perfume' ? 'Size' : 'Color'}</th>
              {category === 'mobile' && <th className="px-4 py-3">IMEI</th>}
              <th className="px-4 py-3">Cost</th><th className="px-4 py-3">Selling</th><th className="px-4 py-3">Stock</th><th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {loading && <tr><td colSpan={7} className="text-center py-10">Loading...</td></tr>}
            {!loading && products.map((p) => (
              <tr key={p._id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg bg-gray-100 border border-border">
                      {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-4 w-4 text-text-muted" />}
                    </div>
                    <span className="font-bold text-text-primary">{p.name}</span>
                  </div>
                </td>
                <td className="px-4 py-3 text-text-secondary">{p.color || '—'}</td>
                {category === 'mobile' && <td className="px-4 py-3 text-text-secondary text-xs">{p.imei1 || '—'}</td>}
                <td className="px-4 py-3 text-text-secondary">{CURRENCY} {Number(p.costPrice).toLocaleString()}</td>
                <td className="px-4 py-3 font-bold text-text-primary">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</td>
                <td className="px-4 py-3">
                  <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => addToCart(p)} disabled={p.stock < 1} className="inline-flex items-center gap-1 rounded-lg border border-brand/30 bg-brand/5 px-2.5 py-1.5 text-xs font-bold text-brand hover:bg-brand hover:text-white transition">
                      <ShoppingCart className="h-3 w-3" /> Add
                    </button>
                    <button onClick={() => openEdit(p)} className="inline-flex items-center rounded-lg border border-gray-200 p-1.5 text-gray-500 hover:bg-gray-100"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(p)} className="inline-flex items-center rounded-lg bg-red-50 p-1.5 text-red-600 hover:bg-red-100"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MOBILE CARDS */}
      <div className="md:hidden space-y-4">
        {loading && <p className="text-center py-10">Loading...</p>}
        {products.map((p) => (
          <div key={p._id} className="bg-white rounded-xl border border-border p-4 flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg bg-gray-50 border border-border shrink-0">
                  {p.images?.[0] || p.image ? <img src={p.images?.[0] || p.image} alt="" className="h-full w-full object-cover" /> : <ImageOff className="h-5 w-5 text-text-muted" />}
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-base leading-tight">{p.name}</h3>
                  <p className="text-xs text-text-secondary mt-0.5">{p.color || 'No size/color'}</p>
                </div>
              </div>
              <span className={`inline-flex rounded-md px-2 py-1 text-xs font-bold ${p.stock > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>{p.stock}</span>
            </div>
            <div className="flex justify-between text-sm border-t border-border pt-3">
              <span className="text-text-secondary">Cost: {CURRENCY} {Number(p.costPrice).toLocaleString()}</span>
              <span className="font-bold text-brand">{CURRENCY} {Number(p.listedPrice).toLocaleString()}</span>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => addToCart(p)} disabled={p.stock < 1} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-brand/30 bg-brand/5 py-1.5 text-xs font-bold text-brand"><ShoppingCart className="h-3 w-3" /> Add</button>
              <button onClick={() => openEdit(p)} className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-gray-200 py-1.5 text-xs font-bold text-gray-600"><Pencil className="h-3 w-3" /> Edit</button>
              <button onClick={() => handleDelete(p)} className="flex items-center justify-center rounded-lg bg-red-50 px-3 py-1.5 text-red-600"><Trash2 className="h-3 w-3" /></button>
            </div>
          </div>
        ))}
      </div>

      {/* FLOATING CART */}
      {cart.length > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-11/12 max-w-md z-40 animate-in slide-in-from-bottom">
          <button onClick={() => setModal('cart')} className="w-full bg-brand text-white rounded-xl shadow-2xl p-4 flex items-center justify-between hover:bg-brand-hover transition">
            <div className="flex items-center gap-3">
              <div className="bg-white/20 p-2 rounded-lg"><ShoppingBag className="h-5 w-5" /></div>
              <span className="font-bold">{cart.reduce((s, i) => s + i.quantity, 0)} Items</span>
            </div>
            <span className="font-bold">{CURRENCY} {cartTotal.toLocaleString()} →</span>
          </button>
        </div>
      )}

      {/* FORM MODAL */}
      {modal === 'form' && (
        <Modal title={editing ? 'Edit Product' : 'Add Product'} onClose={closeModal}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Name</label>
              <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Category</label>
              <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value, stock: e.target.value === 'mobile' ? '1' : form.stock })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand">
                {CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Cost ({CURRENCY})</label><input type="number" required value={form.costPrice} onChange={(e) => setForm({ ...form, costPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Selling ({CURRENCY})</label><input type="number" required value={form.listedPrice} onChange={(e) => setForm({ ...form, listedPrice: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 uppercase mb-1">{form.category === 'perfume' ? 'Bottle Size' : 'Color'}</label>
                <input value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" placeholder={form.category === 'perfume' ? 'e.g. 100ml' : 'e.g. Black'} />
              </div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Stock</label><input type="number" min="0" required value={form.category === 'mobile' ? '1' : form.stock} disabled={form.category === 'mobile'} onChange={(e) => setForm({ ...form, stock: e.target.value })} className={`w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand ${form.category === 'mobile' ? 'bg-gray-100 text-gray-400' : ''}`} /></div>
            </div>
            {form.category === 'mobile' && (
              <div className="rounded-xl border border-brand/20 bg-brand/5 p-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold text-brand uppercase mb-1">IMEI 1</label><input value={form.imei1} onChange={(e) => setForm({ ...form, imei1: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                  <div><label className="block text-xs font-bold text-brand uppercase mb-1">IMEI 2</label><input value={form.imei2} onChange={(e) => setForm({ ...form, imei2: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
                </div>
              </div>
            )}
            
            {/* MULTI-IMAGE UPLOAD */}
            <div>
              <label className="block text-xs font-bold text-gray-600 uppercase mb-1">Product Images (Max 6)</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setImageFiles(e.target.files)} className="block w-full text-sm text-gray-500 file:mr-4 file:rounded-xl file:border-0 file:bg-brand/10 file:px-4 file:py-2 file:text-sm file:font-bold file:text-brand hover:file:bg-brand/20" />
              
              {editing && editing.images?.length > 0 && imageFiles.length === 0 && (
                <div className="flex gap-2 mt-3 overflow-x-auto">
                  {editing.images.map((img, i) => (
                    <img key={i} src={img} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                  ))}
                </div>
              )}
              {imageFiles.length > 0 && (
                <p className="text-xs text-green-600 mt-2 font-bold">{imageFiles.length} new image(s) selected.</p>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border mt-6">
              <button type="button" onClick={closeModal} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover">{saving ? 'Saving...' : 'Save'}</button>
            </div>
          </form>
        </Modal>
      )}

      {/* CHECKOUT MODAL */}
      {modal === 'cart' && (
        <Modal title="Checkout Cart" onClose={closeModal}>
          <div className="space-y-4 mb-6">
            {cart.map(item => (
              <div key={item.productId} className="flex items-center justify-between gap-3 bg-gray-50 p-3 rounded-lg border border-border">
                <div className="flex-1">
                  <p className="font-bold text-sm text-text-primary">{item.productName}</p>
                  {item.category === 'mobile' && <p className="text-xs text-text-muted">IMEI: {item.imei1}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-col items-center">
                     <label className="text-[10px] text-text-muted font-bold mb-1">Qty</label>
                     <input type="number" min="1" value={item.quantity} onChange={(e) => updateCartQty(item.productId, e.target.value)} disabled={item.category === 'mobile'} className="w-16 rounded-lg border border-border px-2 py-1 text-center text-sm outline-none focus:border-brand" />
                  </div>
                  <div className="flex flex-col items-center">
                     <label className="text-[10px] text-text-muted font-bold mb-1">Price</label>
                     <input type="number" min="0" value={item.sellPrice} onChange={(e) => updateCartPrice(item.productId, e.target.value)} className="w-24 rounded-lg border border-border px-2 py-1 text-sm outline-none focus:border-brand" />
                  </div>
                  <button type="button" onClick={() => removeFromCart(item.productId)} className="mt-4 p-2 text-red-500 hover:bg-red-50 rounded-lg transition"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
            ))}
            <div className="flex justify-between items-center bg-green-50 p-3 rounded-lg text-green-700 font-bold">
              <span>Cart Profit:</span>
              <span>{CURRENCY} {cartProfit.toLocaleString()}</span>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="space-y-4 border-t border-border pt-4">
            <h4 className="font-bold text-text-primary">Customer Details</h4>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Name</label><input required value={sellForm.customerName} onChange={(e) => setSellForm({ ...sellForm, customerName: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
              <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">Phone</label><input required value={sellForm.customerNumber} onChange={(e) => setSellForm({ ...sellForm, customerNumber: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            </div>
            <div><label className="block text-xs font-bold text-gray-600 uppercase mb-1">CNIC (Optional)</label><input value={sellForm.customerCnic} onChange={(e) => setSellForm({ ...sellForm, customerCnic: e.target.value })} className="w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand" /></div>
            <div className="flex justify-end gap-3 pt-4 mt-2">
              <button type="button" onClick={closeModal} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={saving || cart.length === 0} className="rounded-xl bg-brand px-6 py-2 text-sm font-bold text-white hover:bg-brand-hover w-full">{saving ? 'Processing...' : `Confirm Sale (${CURRENCY} ${cartTotal.toLocaleString()})`}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}