import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal } from 'lucide-react'
import { api } from '../api'
import ProductCard from '../components/ProductCard'

const categories = [
  { key: 'all', label: 'All' },
  { key: 'mobile', label: 'Mobiles' },
  { key: 'perfume', label: 'Perfumes' },
  { key: 'headphone', label: 'Audio' },
]

export default function Shop() {
  const [params, setParams] = useSearchParams()
  const category = params.get('category') || 'all'
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('newest')
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.getProducts({ category, search, inStock: 'true' })
      .then(setProducts)
      .finally(() => setLoading(false))
  }, [category, search])

  const sorted = [...products].sort((a, b) => {
    if (sort === 'price-asc') return a.listedPrice - b.listedPrice
    if (sort === 'price-desc') return b.listedPrice - a.listedPrice
    return new Date(b.createdAt) - new Date(a.createdAt)
  })

  return (
    <div className="bg-gray-50 min-h-screen">
      {/* Header */}
      <section className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-10 sm:py-16">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900">
              Shop
            </h1>
            <p className="mt-3 max-w-xl text-sm sm:text-base leading-relaxed text-gray-600">
              Search, filter, and find your next favourite.
            </p>
          </motion.div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-8">
        
        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((c) => (
            <button
              key={c.key}
              type="button"
              onClick={() => c.key === 'all' ? setParams({}) : setParams({ category: c.key })}
              className={`rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
                category === c.key 
                  ? 'bg-brand text-white shadow-md' 
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-brand hover:text-brand'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>

        {/* Search + Sort */}
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products..."
              className="w-full rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="relative sm:w-56">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <select 
              value={sort} 
              onChange={(e) => setSort(e.target.value)} 
              className="w-full appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pl-10 text-sm text-gray-900 outline-none transition focus:border-brand"
            >
              <option value="newest">Newest first</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </div>
        </div>

        <p className="mt-6 text-xs font-bold uppercase tracking-wider text-gray-500">
          {loading ? 'Loading…' : `${sorted.length} product${sorted.length === 1 ? '' : 's'}`}
        </p>

        {!loading && sorted.length === 0 && (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 p-16 text-center text-sm text-gray-500 bg-white">
            Nothing matches your filters yet.
          </div>
        )}

        {/* 2 Columns on Mobile, 4 on Desktop */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
          {sorted.map((p, i) => (
            <ProductCard key={p._id || p.id} product={p} index={i} />
          ))}
        </div>
      </div>
    </div>
  )
}