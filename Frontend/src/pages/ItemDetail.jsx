import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, ImageOff } from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { api } from '../api'
import { CURRENCY, WHATSAPP_NUMBER } from '../config'

const labels = { mobile: 'Mobile', perfume: 'Perfume', headphone: 'Headphone' }

export default function ItemDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState('')

  useEffect(() => {
    api.getProduct(id).then((data) => {
      setProduct(data)
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0])
      } else if (data.image) {
        setActiveImage(data.image)
      }
    }).catch((e) => setError(e.message))
  }, [id])

  if (error) return <div className="page-container text-center py-24 text-red-600">{error}</div>
  if (!product) return <div className="page-container text-center py-24 text-gray-500">Loading…</div>

  const waText = encodeURIComponent(
    `Hello, I'm interested in "${product.name}" (${CURRENCY} ${product.listedPrice}). Is it available?`
  )

  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : [])

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-6 sm:py-10">
        
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-600 transition hover:text-brand mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          
          {/* Image Gallery */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="relative aspect-square w-full overflow-hidden rounded-2xl border border-gray-200 bg-white flex items-center justify-center"
            >
              {activeImage ? (
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  className="h-full w-full object-contain p-4 sm:p-8" 
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`flex flex-col items-center justify-center text-gray-400 ${activeImage ? 'hidden' : 'flex'}`}>
                <ImageOff className="h-16 w-16 mb-2" />
                <span className="text-sm font-medium">No image available</span>
              </div>
            </motion.div>

            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveImage(img)}
                    className={`relative h-20 w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all ${
                      activeImage === img ? 'border-brand' : 'border-gray-200 hover:border-brand/50'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand mb-3">
              {labels[product.category] || product.category}
            </span>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-gray-900 leading-tight">
              {product.name}
            </h1>
            
            <div className="mt-5 flex items-center gap-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand">
                {CURRENCY} {Number(product.listedPrice).toLocaleString()}
              </p>
              <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-bold ${
                product.stock > 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
              }`}>
                {product.stock > 0 ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            <div className="mt-8 space-y-4 border-t border-gray-200 pt-6 text-sm">
              {product.color && (
                <div className="flex justify-between">
                  <span className="text-gray-500 font-medium">{product.category === 'perfume' ? 'Bottle Size' : 'Color'}</span>
                  <span className="font-bold text-gray-900">{product.color}</span>
                </div>
              )}
              {product.category === 'mobile' && product.imei1 && (
                <>
                  <div className="flex justify-between">
                    <span className="text-gray-500 font-medium">IMEI 1</span>
                    <span className="font-mono font-bold text-gray-900">{product.imei1}</span>
                  </div>
                  {product.imei2 && (
                    <div className="flex justify-between">
                      <span className="text-gray-500 font-medium">IMEI 2</span>
                      <span className="font-mono font-bold text-gray-900">{product.imei2}</span>
                    </div>
                  )}
                </>
              )}
            </div>

            {product.description && (
              <div className="mt-8 border-t border-gray-200 pt-6">
                <h3 className="font-bold text-gray-900 mb-3">Description</h3>
                <p className="text-sm leading-relaxed text-gray-600 whitespace-pre-line">
                  {product.description}
                </p>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3">
              {WHATSAPP_NUMBER && product.stock > 0 && (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 text-base font-bold text-white transition hover:bg-[#1ebd5a] hover:shadow-lg hover:shadow-[#25D366]/30"
                >
                  <FaWhatsapp className="h-6 w-6" /> 
                  <span>Order on WhatsApp</span>
                </a>
              )}
              
              <Link 
                to="/shop" 
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-gray-300 px-6 py-4 text-base font-bold text-gray-800 transition hover:border-gray-900 hover:bg-gray-50"
              >
                Continue Shopping
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}