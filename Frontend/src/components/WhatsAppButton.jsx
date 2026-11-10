import { motion } from 'framer-motion'
import { FaWhatsapp } from 'react-icons/fa6'
import { WHATSAPP_NUMBER, WHATSAPP_MESSAGE } from '../config'

export default function WhatsAppButton() {
  if (!WHATSAPP_NUMBER) return null
  const href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`

  return (
    <motion.a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: 'spring', stiffness: 200, damping: 20 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      className="fixed bottom-6 right-6 z-50 flex h-13 w-13 items-center justify-center rounded-full bg-[#25D366] text-white shadow-[0_8px_24px_-6px_rgba(37,211,102,0.6)]"
      style={{ height: 52, width: 52 }}
    >
      <FaWhatsapp className="h-7 w-7" />
    </motion.a>
  )
}