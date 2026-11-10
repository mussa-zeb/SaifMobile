import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ImageOff } from 'lucide-react'
import { CURRENCY } from '../config'

const labels = { mobile: 'Mobile', perfume: 'Perfume', headphone: 'Audio' }

export default function ProductCard({ product }) {
  // Use the first image from the array, or fallback to the old single image
  const displayImage = product.images?.[0] || product.image;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4 }}>
      <Link to={`/item/${product._id}`} className="card group flex flex-col h-full rounded-xl overflow-hidden">
        
        <div className="relative aspect-square sm:aspect-[4/5] overflow-hidden bg-gray-50 flex items-center justify-center">
          {displayImage ? (
            <img src={displayImage} alt={product.name} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
          ) : (
            <ImageOff className="h-8 w-8 sm:h-12 sm:w-12 text-gray-300" />
          )}
          <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-white/90 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold text-brand shadow-sm">
            {labels[product.category] || product.category}
          </span>
        </div>
        
        <div className="p-2.5 sm:p-4 flex flex-col flex-1 border-t border-border">
          <h3 className="font-bold text-text-primary text-xs sm:text-base line-clamp-1 leading-tight">{product.name}</h3>
          {product.color && <p className="text-[10px] sm:text-xs text-text-secondary mt-0.5">{product.color}</p>}
          
          <div className="mt-auto pt-3 flex flex-col gap-1.5 sm:gap-2">
            <span className="text-sm sm:text-lg font-extrabold text-brand">
              {CURRENCY} {Number(product.listedPrice).toLocaleString()}
            </span>
            <span className={`text-[9px] sm:text-[11px] font-bold px-1.5 py-0.5 rounded w-fit ${product.stock > 0 ? 'bg-success/10 text-success' : 'bg-danger/10 text-danger'}`}>
              {product.stock > 0 ? 'In Stock' : 'Sold Out'}
            </span>
          </div>
        </div>

      </Link>
    </motion.div>
  )
}