import { motion } from 'framer-motion'
import { ShieldCheck, HeartHandshake, MapPin, Award } from 'lucide-react'
import StoreInterior from "../assets/store-interior.jpeg"

export default function About() {
  return (
    <div className="bg-base">
      {/* Hero */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ duration: 0.6 }}
          >
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-text-primary tracking-tight">
              More Than Just a Shop.
            </h1>
            <p className="mt-6 text-md text-text-secondary max-w-2xl mx-auto leading-relaxed">
              We are a family-run business in the heart of Bannu, dedicated to bringing you the best in mobile technology and premium fragrances since day one.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Story & Image Split */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Side */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6 }}
              className="relative"
            >
              <img 
                src={StoreInterior} 
                alt="Inside Saif Mobile" 
                className="rounded-3xl shadow-2xl w-full object-cover h-[500px]"
              />
              {/* Floating Logo Card */}
              <div className="absolute -bottom-6 -right-6 bg-white p-4 rounded-2xl shadow-xl border border-border hidden sm:block">
                <img src="/logo.png" alt="Saif Mobile Logo" className="h-16 w-auto" />
              </div>
            </motion.div>

            {/* Text Side */}
            <motion.div 
              initial={{ opacity: 0, x: 30 }} 
              whileInView={{ opacity: 1, x: 0 }} 
              viewport={{ once: true }} 
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <h2 className="text-3xl font-bold text-text-primary mb-6">Our Story</h2>
              <p className="text-text-secondary leading-relaxed mb-4">
                Saif Mobile started with a simple idea: provide our community with genuine, high-quality products at fair prices, backed by honest service. What began as a small counter has grown into a trusted destination for thousands of customers.
              </p>
              <p className="text-text-secondary leading-relaxed mb-8">
                We carefully handpick every smartphone, verify every IMEI, and test every fragrance. We don't just sell products; we build relationships.
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">100% Authentic</h4>
                    <p className="text-sm text-text-secondary mt-1">Verified products only.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-brand/10 text-brand flex items-center justify-center shrink-0">
                    <HeartHandshake className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-text-primary">Customer First</h4>
                    <p className="text-sm text-text-secondary mt-1">Honest advice, always.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values / Stats Bar */}
      <section className="bg-white border-y border-border py-12 sm:py-16">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
            <div>
              <p className="text-2xl sm:text-4xl font-extrabold text-brand">8+</p>
              <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1 uppercase tracking-wider">Years of Trust</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-extrabold text-brand">10k+</p>
              <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1 uppercase tracking-wider">Happy Customers</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-extrabold text-brand">100%</p>
              <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1 uppercase tracking-wider">Original Stock</p>
            </div>
            <div>
              <p className="text-2xl sm:text-4xl font-extrabold text-brand">5.0</p>
              <p className="text-xs sm:text-sm font-bold text-text-secondary mt-1 uppercase tracking-wider">Google Rating</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}