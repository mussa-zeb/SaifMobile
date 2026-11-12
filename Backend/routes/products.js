import { Router } from 'express'
import multer from 'multer'
import PDFDocument from 'pdfkit'
import { requireAdmin } from '../middleware/auth.js'
import { uploadBuffer } from '../lib/cloudinary.js'
import Product from '../models/Product.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

function parseBody(body) {
  const category = body.category
  const stockInput = Math.max(0, Number(body.stock) || 0)
  const stock = category === 'mobile' ? 1 : stockInput
  return {
    name: (body.name || '').trim(),
    category,
    listedPrice: Number(body.listedPrice) || 0,
    costPrice: Number(body.costPrice) || 0,
    color: (body.color || '').trim(),
    stock,
    imei1: category === 'mobile' ? (body.imei1 || '').trim() : '',
    imei2: category === 'mobile' ? (body.imei2 || '').trim() : '',
    ptaStatus: category === 'mobile' ? (body.ptaStatus || '').trim() : '',
    batteryHealth: category === 'mobile' ? (body.batteryHealth || '').trim() : '',
    supplierName: (body.supplierName || '').trim(),
    supplierCnic: (body.supplierCnic || '').trim(),
    supplierContact: (body.supplierContact || '').trim(),
    purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : new Date(),
    comments: (body.comments || '').trim(),
    description: (body.description || '').trim(),
  }
}

async function handleImageUploads(files) {
  if (!files || files.length === 0) return null
  try {
    const uploadPromises = files.map(file => uploadBuffer(file.buffer))
    const results = await Promise.all(uploadPromises)
    return results.map(r => r.secure_url)
  } catch (error) {
    throw new Error('Failed to upload images. Please check your Cloudinary credentials.')
  }
}

function renderPdf(doc) {
  return new Promise((resolve, reject) => {
    const chunks = []
    doc.on('data', (chunk) => chunks.push(chunk))
    doc.on('end', () => resolve(Buffer.concat(chunks)))
    doc.on('error', reject)
  })
}

router.get('/', async (req, res, next) => {
  try {
    const { category, search, inStock } = req.query
    const filter = {}
    if (category && category !== 'all') filter.category = category
    if (inStock === 'true') filter.stock = { $gt: 0 }
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [
        { name: rx }, { color: rx }, { imei1: rx }, { imei2: rx },
        { supplierName: rx }, { supplierCnic: rx }, { supplierContact: rx }, { ptaStatus: rx },
      ]
    }
    const items = await Product.find(filter).sort({ purchaseDate: -1, createdAt: -1 }).lean()
    res.json(items)
  } catch (e) { next(e) }
})

// EXPORT PDF WITH DATE FILTER & CATEGORY GROUPING
router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate, category } = req.query
    const filter = {}
    
    if (category && category !== 'all') filter.category = category
    if (startDate || endDate) {
      filter.purchaseDate = {}
      if (startDate) filter.purchaseDate.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.purchaseDate.$lte = end
      }
    }

    const products = await Product.find(filter).sort({ category: 1, purchaseDate: -1 }).lean()

    if (products.length === 0) {
      return res.status(400).json({ message: 'Cannot generate PDF: No products found for the selected date range.' })
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' })
    const promise = renderPdf(doc)

    doc.fontSize(18).font('Helvetica-Bold').text('SAIF MOBILE - STOCK REPORT', { align: 'center' })
    doc.fontSize(11).font('Helvetica').text(`Date Range: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' })
    doc.moveDown(1.5)

    const categories = ['mobile', 'perfume', 'headphone']
    const catLabels = { mobile: 'MOBILES', perfume: 'PERFUMES', headphone: 'ACCESSORIES' }
    
    const safe = (v, len = 18) => String(v == null ? '' : v).substring(0, len) || '—'
    let currentY = doc.y

    categories.forEach(cat => {
      const catItems = products.filter(p => p.category === cat)
      if (catItems.length === 0) return

      if (currentY > 480) {
        doc.addPage()
        currentY = 40
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#73152A').text(catLabels[cat], 30, currentY)
      doc.fillColor('#000000')
      currentY += 20

      doc.fontSize(8).font('Helvetica-Bold')

      // Draw headers based on category
      if (cat === 'mobile') {
        doc.text('Buy Date', 30, currentY, { width: 55 })
        doc.text('Supplier', 90, currentY, { width: 75 })
        doc.text('Model', 170, currentY, { width: 110 })
        doc.text('IMEI 1', 285, currentY, { width: 85 })
        doc.text('IMEI 2', 375, currentY, { width: 85 })
        doc.text('PTA Status', 465, currentY, { width: 60 })
        doc.text('Battery', 530, currentY, { width: 60 })
        doc.text('Cost', 595, currentY, { width: 55, align: 'right' })
        doc.text('Comments', 655, currentY, { width: 150 })
      } else {
        doc.text('Buy Date', 30, currentY, { width: 65 })
        doc.text('Model / Name', 110, currentY, { width: 200 })
        doc.text(cat === 'perfume' ? 'Bottle Size' : 'Color', 330, currentY, { width: 100 })
        doc.text('Stock', 450, currentY, { width: 50, align: 'center' })
        doc.text('Cost', 520, currentY, { width: 70, align: 'right' })
        doc.text('Comments', 610, currentY, { width: 150 })
      }

      doc.moveTo(30, currentY + 12).lineTo(810, currentY + 12).stroke()
      currentY += 20

      let catTotal = 0
      catItems.forEach(p => {
        if (currentY > 540) {
          doc.addPage()
          currentY = 40
        }
        catTotal += Number(p.costPrice) || 0
        doc.fontSize(7.5).font('Helvetica')

        // Draw row data based on category
        if (cat === 'mobile') {
          doc.text(new Date(p.purchaseDate || p.createdAt).toLocaleDateString(), 30, currentY, { width: 55 })
          doc.text(safe(p.supplierName, 15), 90, currentY, { width: 75 })
          doc.text(safe(p.name, 22), 170, currentY, { width: 110 })
          doc.text(safe(p.imei1, 18), 285, currentY, { width: 85 })
          doc.text(safe(p.imei2, 18), 375, currentY, { width: 85 })
          doc.text(safe(p.ptaStatus, 10), 465, currentY, { width: 60 })
          doc.text(safe(p.batteryHealth, 10), 530, currentY, { width: 60 })
          doc.text(String(p.costPrice || 0), 595, currentY, { width: 55, align: 'right' })
          doc.text(safe(p.comments, 25), 655, currentY, { width: 150 })
        } else {
          doc.text(new Date(p.purchaseDate || p.createdAt).toLocaleDateString(), 30, currentY, { width: 65 })
          doc.text(safe(p.name, 30), 110, currentY, { width: 200 })
          doc.text(safe(p.color, 15), 330, currentY, { width: 100 })
          doc.text(String(p.stock), 450, currentY, { width: 50, align: 'center' })
          doc.text(String(p.costPrice || 0), 520, currentY, { width: 70, align: 'right' })
          doc.text(safe(p.comments, 30), 610, currentY, { width: 150 })
        }
        currentY += 15
      })

      doc.fontSize(9).font('Helvetica-Bold')
      doc.text(`Subtotal (${catItems.length} items):`, 520, currentY + 5, { width: 140, align: 'right' })
      doc.text(`${catTotal}`, 715, currentY + 5, { width: 55, align: 'right' })
      currentY += 30
    })

    doc.end()
    const pdfBuffer = await promise
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="products-report.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    res.json(product)
  } catch (e) { next(e) }
})

router.post('/', requireAdmin, upload.array('images', 6), async (req, res, next) => {
  try {
    if (!req.body.name || !req.body.category) return res.status(400).json({ message: 'Product name and category are required.' })
    const data = parseBody(req.body)
    const imageUrls = await handleImageUploads(req.files)
    if (imageUrls && imageUrls.length > 0) { data.images = imageUrls; data.image = imageUrls[0] }
    const product = await Product.create(data)
    res.status(201).json({ message: 'Product added successfully!', product })
  } catch (e) { next(e) }
})

router.put('/:id', requireAdmin, upload.array('images', 6), async (req, res, next) => {
  try {
    const data = parseBody(req.body)
    const imageUrls = await handleImageUploads(req.files)
    if (imageUrls && imageUrls.length > 0) { data.images = imageUrls; data.image = imageUrls[0] }
    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    res.json({ message: 'Product updated successfully!', product })
  } catch (e) { next(e) }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found.' })
    res.json({ message: 'Product deleted successfully.' })
  } catch (e) { next(e) }
})

export default router