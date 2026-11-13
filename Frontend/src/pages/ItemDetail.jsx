import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  ArrowLeft, 
  ImageOff, 
  ShieldCheck, 
  Truck, 
  Phone, 
  MapPin, 
  Battery, 
  CheckCircle2,
  AlertCircle,
  Package,
  Heart
} from 'lucide-react'
import { FaWhatsapp } from 'react-icons/fa6'
import { api } from '../api'
import { CURRENCY, WHATSAPP_NUMBER, SHOP_NAME } from '../config'
import { isFavorite, toggleFavorite } from '../utils/favorites'

const labels = { mobile: 'Mobile', perfume: 'Perfume', headphone: 'Audio' }

export default function ItemDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const [error, setError] = useState('')
  const [activeImage, setActiveImage] = useState('')
  const [imgError, setImgError] = useState(false)
  const [fav, setFav] = useState(false)

  useEffect(() => {
    api.getProduct(id).then((data) => {
      setProduct(data)
      if (data.images && data.images.length > 0) {
        setActiveImage(data.images[0])
      } else if (data.image) {
        setActiveImage(data.image)
      }
      setFav(isFavorite(data._id))
    }).catch((e) => setError(e.message))
  }, [id])

  const handleFav = () => {
    if (product) {
      const newState = toggleFavorite(product._id)
      setFav(newState)
    }
  }

  if (error) return <div className="page-container text-center py-24 text-red-600 font-bold">{error}</div>
  if (!product) return <div className="page-container text-center py-24 text-gray-500 animate-pulse">Loading product details...</div>

  const isOutOfStock = product.stock < 1
  const waText = encodeURIComponent(
    `Hello ${SHOP_NAME}, I'm interested in "${product.name}" (${CURRENCY} ${product.listedPrice}). Is it available?`
  )

  const galleryImages = product.images && product.images.length > 0 
    ? product.images 
    : (product.image ? [product.image] : [])

  return (
    <div className="bg-base min-h-screen pb-12">
      
      {/* Breadcrumb Navigation */}
      <div className="bg-white border-b border-border">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-4 flex items-center gap-2 text-xs sm:text-sm text-text-muted">
          <Link to="/" className="hover:text-brand transition">Home</Link>
          <span>/</span>
          <Link to="/shop" className="hover:text-brand transition">Shop</Link>
          <span>/</span>
          <Link to={`/shop?category=${product.category}`} className="hover:text-brand transition capitalize">{product.category}</Link>
          <span>/</span>
          <span className="text-text-primary font-medium truncate">{product.name}</span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12 py-8 sm:py-12">
        
        <Link to="/shop" className="inline-flex items-center gap-1.5 text-sm font-semibold text-text-secondary transition hover:text-brand mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to shop
        </Link>

        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 xl:gap-16">
          
          {/* Left Column: Image Gallery */}
          <div className="flex flex-col gap-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative aspect-square w-full overflow-hidden rounded-3xl border border-border bg-white flex items-center justify-center group"
            >
              {activeImage && !imgError ? (
                <img 
                  src={activeImage} 
                  alt={product.name} 
                  className="h-full w-full object-contain p-6 sm:p-12 transition-transform duration-500 group-hover:scale-105" 
                  onError={() => setImgError(true)}
                />
              ) : null}
              <div className={`flex flex-col items-center justify-center text-gray-400 ${activeImage && !imgError ? 'hidden' : 'flex'}`}>
                <ImageOff className="h-16 w-16 mb-2" />
                <span className="text-sm font-medium">No image available</span>
              </div>
              
              {/* Category Badge */}
              <span className="absolute top-4 left-4 bg-brand text-white px-3 py-1 rounded-full text-xs font-bold shadow-md">
                {labels[product.category] || product.category}
              </span>
            </motion.div>

            {/* Thumbnails */}
            {galleryImages.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2 snap-x">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => { setActiveImage(img); setImgError(false); }}
                    className={`relative h-20 w-20 shrink-0 snap-start overflow-hidden rounded-xl border-2 transition-all ${
                      activeImage === img && !imgError ? 'border-brand shadow-md' : 'border-border hover:border-brand/50'
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${idx}`} className="h-full w-full object-cover" onError={(e) => e.target.style.display = 'none'} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column: Product Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex flex-col"
          >
            <div className="mb-2 flex justify-between items-start gap-4">
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-brand mt-1">
                {labels[product.category] || product.category}
              </span>
              
              {/* Heart / Save Button */}
              <button 
                onClick={handleFav}
                className="p-2 rounded-full border border-border bg-white shadow-sm hover:scale-110 transition-transform shrink-0"
                title={fav ? "Remove from favorites" : "Save to favorites"}
              >
                <Heart className={`h-5 w-5 ${fav ? 'fill-red-500 text-red-500' : 'text-gray-400'}`} />
              </button>
            </div>
            
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-text-primary leading-tight">
              {product.name}
            </h1>
            
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <p className="text-3xl sm:text-4xl font-extrabold text-brand">
                {CURRENCY} {Number(product.listedPrice).toLocaleString()}
              </p>
              <span className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold ${
                !isOutOfStock ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'
              }`}>
                {!isOutOfStock ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {!isOutOfStock ? 'In Stock' : 'Out of Stock'}
              </span>
            </div>

            {/* Specifications Grid */}
            <div className="mt-8 bg-white border border-border rounded-2xl p-5 shadow-sm">
              <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider mb-4 border-b border-border pb-2">Specifications</h3>
              <div className="grid grid-cols-2 gap-y-4 gap-x-6 text-sm">
                
                <div>
                  <span className="text-text-muted block text-xs mb-0.5">{product.category === 'perfume' ? 'Bottle Size' : 'Color'}</span>
                  <span className="font-bold text-text-primary">{product.color || 'Standard'}</span>
                </div>

                <div>
                  <span className="text-text-muted block text-xs mb-0.5">Category</span>
                  <span className="font-bold text-text-primary capitalize">{labels[product.category] || product.category}</span>
                </div>

                {product.category === 'mobile' && (
                  <>
                    {product.ptaStatus && (
                      <div>
                        <span className="text-text-muted block text-xs mb-0.5">PTA Status</span>
                        <span className="font-bold text-brand">{product.ptaStatus}</span>
                      </div>
                    )}
                    {product.batteryHealth && (
                      <div>
                        <span className="text-text-muted block text-xs mb-0.5">Battery Health</span>
                        <span className="font-bold text-success flex items-center gap-1">
                          <Battery className="h-4 w-4" /> {product.batteryHealth}
                        </span>
                      </div>
                    )}
                  </>
                )}

                <div>
                  <span className="text-text-muted block text-xs mb-0.5">Availability</span>
                  <span className="font-bold text-text-primary">{product.stock} Units</span>
                </div>
              </div>
            </div>

            {/* Description */}
            {product.description && (
              <div className="mt-6">
                <h3 className="font-bold text-text-primary mb-2">Product Description</h3>
                <p className="text-sm leading-relaxed text-text-secondary whitespace-pre-line bg-white p-4 rounded-xl border border-border">
                  {product.description}
                </p>
              </div>
            )}

            {/* Trust Badges */}
            <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-border text-center gap-1.5 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-brand" />
                <span className="text-[10px] font-bold text-text-primary uppercase">100% Authentic</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-border text-center gap-1.5 shadow-sm">
                <Package className="h-5 w-5 text-gold" />
                <span className="text-[10px] font-bold text-text-primary uppercase">Verified Quality</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-border text-center gap-1.5 shadow-sm">
                <Truck className="h-5 w-5 text-blue-600" />
                <span className="text-[10px] font-bold text-text-primary uppercase">Fast Delivery</span>
              </div>
              <div className="flex flex-col items-center justify-center bg-white p-3 rounded-xl border border-border text-center gap-1.5 shadow-sm">
                <MapPin className="h-5 w-5 text-danger" />
                <span className="text-[10px] font-bold text-text-primary uppercase">In-Store Pickup</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-8 flex flex-col gap-3 sticky bottom-4 sm:static">
              {WHATSAPP_NUMBER && !isOutOfStock && (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-4 text-base font-bold text-white transition hover:bg-[#1ebd5a] shadow-lg shadow-[#25D366]/30"
                >
                  <FaWhatsapp className="h-6 w-6" /> 
                  <span>Order on WhatsApp</span>
                </a>
              )}
              
              {WHATSAPP_NUMBER && isOutOfStock && (
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(`Hello ${SHOP_NAME}, I'm looking for "${product.name}". It's out of stock online, do you have it in store?`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gray-800 px-6 py-4 text-base font-bold text-white transition hover:bg-gray-900 shadow-lg"
                >
                  <FaWhatsapp className="h-6 w-6" /> 
                  <span>Ask for Restock</span>
                </a>
              )}

              {/* Call Button */}
              <a
                href="tel:+923118704231"
                className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-border bg-white px-6 py-4 text-base font-bold text-text-primary transition hover:border-brand hover:text-brand"
              >
                <Phone className="h-5 w-5" /> Call Us to Order
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}