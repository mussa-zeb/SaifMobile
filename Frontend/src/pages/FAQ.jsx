import { Plus } from 'lucide-react'

const faqs = [
  { q: 'How do I place an order?', a: 'Browse the shop, open a product and press the "Buy on WhatsApp" button. Send us a message and we will confirm availability and delivery details.' },
  { q: 'Are the mobiles original?', a: 'Yes. Every device is checked and its IMEI number is verified before it is listed.' },
  { q: 'Do you offer warranty?', a: 'Warranty depends on the specific device. Details are shared with you on WhatsApp before purchase.' },
  { q: 'How can I pay?', a: 'We accept cash on delivery and bank transfer. Payment options are confirmed during the WhatsApp conversation.' },
]

export default function FAQ() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title text-3xl">Frequently Asked Questions</h1>
      <p className="mt-3">Answers to the questions we hear most often.</p>

      <div className="mt-8 space-y-3">
        {faqs.map((f) => (
          <details key={f.q} className="group card p-5 open:border-brand/50">
            <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-text-primary">
              {f.q}
              <Plus className="h-5 w-5 text-brand transition group-open:rotate-45" />
            </summary>
            <p className="mt-3 text-sm leading-relaxed">{f.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}