import StoreFront from "../assets/store-front.jpeg"
import StoreDisplay from "../assets/store-display.jpeg"
import StoreInterior from "../assets/store-interior.jpeg"
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, ShieldCheck, MapPin, Smartphone, SprayCan, Headphones } from 'lucide-react'
import { api } from '../api'
import ProductCard from '../components/ProductCard'
import { WHATSAPP_NUMBER } from '../config'

const categories = [
  { key: 'mobile', label: 'Mobile Phones', Icon: Smartphone, desc: 'Original iPhones & Androids with verified IMEI.' },
  { key: 'headphone', label: 'Accessories', Icon: Headphones, desc: 'High-quality sound and essential mobile accessories.' },
  { key: 'perfume', label: 'Saif Perfumes', Icon: SprayCan, desc: 'Premium, long-lasting perfumes for every occasion.' },
]

export default function Home() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    api.getProducts({ inStock: 'true' }).then((items) => {
      setProducts([...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4))
    }).catch(() => {})
  }, [])

  return (
    <div className="bg-gray-50">
      
      {/* HERO */}
      <section className="relative h-[90vh] min-h-[600px] w-full overflow-hidden">
        <div className="absolute inset-0">
          <img src={StoreFront} alt="Saif Mobile Storefront" className="h-full w-full object-cover object-center" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/50 to-transparent"></div>
        </div>

        <div className="relative z-10 mx-auto flex h-full max-w-7xl flex-col justify-center px-5 sm:px-8 lg:px-12">
          <motion.div 
            initial={{ opacity: 0, y: 30 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[#f3d87b] text-xs font-bold backdrop-blur-md mb-6">
              <ShieldCheck className="h-4 w-4" /> 100% Original Guarantee
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-[1.05] text-white tracking-tight">
              The Name of <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f3d87b] to-[#d4af37]">
                Trust & Quality.
              </span>
            </h1>
            <p className="mt-6 text-lg text-gray-200 leading-relaxed max-w-lg">
              Premium smartphones, exclusive perfumes, and high-end audio. Visit our store in Bannu or order directly via WhatsApp.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/shop" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-sm font-bold text-brand transition-all hover:bg-gray-100 shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                Explore Collection <ArrowRight className="h-4 w-4" />
              </Link>
              {WHATSAPP_NUMBER && (
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10 hover:border-white">
                  Chat on WhatsApp
                </a>
              )}
            </div>
          </motion.div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="py-20 bg-white border-y border-gray-200">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl font-bold text-gray-900">What are you looking for?</h2>
          </div>
          <div className="grid grid-cols-3 gap-4 md:gap-6 lg:grid-cols-3">
            {categories.map((c) => (
              <Link key={c.key} to={`/shop?category=${c.key}`} className="group p-5 md:p-8 flex flex-col items-center text-center bg-gray-50 rounded-2xl border border-gray-200 transition-all duration-300 hover:border-brand/30 hover:shadow-md">
                <div className="h-8 w-8 md:h-16 md:w-16 rounded-2xl bg-[#fdf8e8] text-[#d4af37] flex items-center justify-center mb-4 md:mb-6 group-hover:scale-110 transition-transform">
                  <c.Icon className="h-6 w-6 md:h-8 md:w-8" />
                </div>
                <h3 className="text-xs md:text-xl font-bold text-gray-900">{c.label}</h3>
                <p className="mt-2 text-xs md:text-sm text-gray-600 leading-relaxed hidden sm:block">{c.desc}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* STORE SHOWCASE */}
      <section className="py-20 bg-gray-50">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="grid grid-cols-2 gap-4">
              <img src={StoreDisplay} alt="Phones" className="rounded-2xl object-cover h-64 w-full shadow-lg" />
              <img src={StoreInterior} alt="Store Interior" className="rounded-2xl object-cover h-64 w-full shadow-lg mt-8" />
            </div>
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-6">Visit Our Physical Store</h2>
              <p className="text-gray-600 leading-relaxed mb-6">
                We aren't just an online shop. We have a fully stocked physical store where you can inspect devices, test fragrances, and get expert advice in person.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-900 font-medium">
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0"><MapPin className="h-5 w-5" /></div>
                  Main Bazar, Bannu, Khyber Pakhtunkhwa
                </li>
              </ul>
              <a href="https://maps.app.goo.gl/Qf7RCLuaCVqfauZV7" target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white transition-all hover:bg-brand-hover">
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* NEW ARRIVALS */}
      <section className="py-20 bg-white border-t border-gray-200">
        <div className="mx-auto max-w-7xl px-4 sm:px-8 lg:px-12">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Latest Arrivals</h2>
              <p className="text-gray-600 mt-2">Fresh stock added recently.</p>
            </div>
            <Link to="/shop" className="hidden sm:flex items-center gap-1 text-sm font-bold text-brand hover:text-brand-hover">
              View All <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            {products.map((p) => <ProductCard key={p._id} product={p} />)}
          </div>
        </div>
      </section>

    </div>
  )
}