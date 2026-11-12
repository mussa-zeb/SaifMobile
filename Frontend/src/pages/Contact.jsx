import { motion } from 'framer-motion'
import { MessageCircle, MapPin, Phone, Clock, ArrowUpRight } from 'lucide-react'
import { WHATSAPP_NUMBER } from '../config'

export default function Contact() {
  return (
    <div className="bg-base min-h-screen">
      {/* Header */}
      <section className="pt-20 pb-12 text-center px-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-text-primary tracking-tight">
            Get in Touch
          </h1>
          <p className="mt-4 text-lg text-text-secondary max-w-xl mx-auto">
            Have a question about a product or need help? We're just a message or a visit away.
          </p>
        </motion.div>
      </section>

      {/* Main Content Grid */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12">
          <div className="grid lg:grid-cols-5 gap-8">
            
            {/* Contact Details (Left Side) */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="lg:col-span-2 space-y-4"
            >
              {/* WhatsApp Card */}
              {WHATSAPP_NUMBER && (
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="card p-6 flex items-start gap-4 hover:border-[#25D366] transition-colors group">
                  <div className="h-12 w-12 rounded-xl bg-[#25D366]/10 text-[#25D366] flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                    <MessageCircle className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-text-primary text-lg">WhatsApp</h3>
                    <p className="text-sm text-text-secondary mt-1">Fastest way to reach us. Usually replies within minutes.</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-sm font-bold text-[#25D366]">
                      Message Now <ArrowUpRight className="h-4 w-4" />
                    </span>
                  </div>
                </a>
              )}

              {/* Phone Card */}
              <div className="card p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <Phone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Call Us</h3>
                  <p className="text-sm text-text-secondary mt-1">Muhammad Saif: 0311 870 4231</p>
                </div>
              </div>

              {/* Hours Card */}
              <div className="card p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-gold-muted text-gold flex items-center justify-center shrink-0">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Store Hours</h3>
                  <p className="text-sm text-text-secondary mt-1">Mon – Sat: 8:00 AM – 6:00 PM</p>
                  <p className="text-sm text-text-secondary">Sunday: Closed</p>
                </div>
              </div>

              {/* Address Card */}
              <div className="card p-6 flex items-start gap-4">
                <div className="h-12 w-12 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-bold text-text-primary text-lg">Visit the Store</h3>
                  <p className="text-sm text-text-secondary mt-1">Shop No.2, Pennell Plaza, Pareti Gate Bannu, Khyber Pakhtunkhwa, Pakistan</p>
                </div>
              </div>
            </motion.div>

            {/* Map (Right Side) */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="lg:col-span-3 card overflow-hidden h-[500px] lg:h-auto min-h-[500px] relative"
            >
              <iframe 
                src="https://maps.google.com/maps?q=Saif%20Mobiles%20Bannu&t=&z=15&ie=UTF8&iwloc=&output=embed" 
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                allowFullScreen="" 
                loading="lazy" 
                referrerPolicy="no-referrer-when-downgrade"
                title="Saif Mobile Location"
                className="absolute inset-0"
              ></iframe>
            </motion.div>

          </div>
        </div>
      </section>
    </div>
  )
}