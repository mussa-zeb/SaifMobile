import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import { api } from '../api'
import ProductCard from '../components/ProductCard'
import { getFavorites } from '../utils/favorites'
import { Link } from 'react-router-dom'

export default function Favorites() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch ALL products (no inStock filter) so out-of-stock favorites still show
    api.getProducts().then((data) => {
      const favIds = getFavorites()
      const favProducts = data.filter(p => favIds.includes(p._id))
      setProducts(favProducts)
    }).finally(() => setLoading(false))
  }, [])

  return (
    <div className="bg-gray-50 min-h-screen py-10">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-red-500 fill-red-500" />
          <div>
            <h1 className="text-3xl font-extrabold text-text-primary tracking-tight">Your Saved Items</h1>
            <p className="text-sm text-text-secondary mt-1">Products you've saved for later.</p>
          </div>
        </div>

        {loading ? (
          <p className="text-center py-20 text-text-muted animate-pulse">Loading saved items...</p>
        ) : products.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-2xl border border-border">
            <Heart className="h-12 w-12 text-gray-200 mx-auto mb-4" />
            <h2 className="text-lg font-bold text-text-primary">No saved items yet</h2>
            <p className="text-sm text-text-secondary mt-2 mb-6">Tap the heart icon on any product to save it for later.</p>
            <Link to="/shop" className="btn-primary">Browse Shop</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:gap-6 md:grid-cols-3 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}