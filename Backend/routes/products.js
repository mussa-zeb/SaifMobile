import { Router } from 'express'
import multer from 'multer'
import { requireAdmin } from '../middleware/auth.js'
import { uploadBuffer } from '../lib/cloudinary.js'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'
import Purchase from '../models/Purchase.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })
const CATEGORIES = ['mobile', 'perfume', 'headphone']

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
    description: (body.description || '').trim(),
  }
}

// Helper to upload multiple files
async function handleImageUploads(files) {
  if (!files || files.length === 0) return null
  const uploadPromises = files.map(file => uploadBuffer(file.buffer))
  const results = await Promise.all(uploadPromises)
  return results.map(r => r.secure_url)
}

router.get('/', async (req, res, next) => {
  try {
    const { category, search, inStock } = req.query
    const filter = {}
    if (category && category !== 'all') filter.category = category
    if (inStock === 'true') filter.stock = { $gt: 0 }
    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i')
      filter.$or = [{ name: rx }, { color: rx }, { imei1: rx }, { imei2: rx }]
    }
    const items = await Product.find(filter).sort({ createdAt: -1 }).lean()
    res.json(items)
  } catch (e) { next(e) }
})

router.get('/:id', async (req, res, next) => {
  try {
    const product = await Product.findById(req.params.id).lean()
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (e) { next(e) }
})

// CREATE PRODUCT (Now uses upload.array)
router.post('/', requireAdmin, upload.array('images', 6), async (req, res, next) => {
  try {
    const data = parseBody(req.body)
    const imageUrls = await handleImageUploads(req.files)
    if (imageUrls && imageUrls.length > 0) {
      data.images = imageUrls
      data.image = imageUrls[0] // Set the first image as the primary fallback
    }
    const product = await Product.create(data)
    res.status(201).json(product)
  } catch (e) { next(e) }
})

// UPDATE PRODUCT
router.put('/:id', requireAdmin, upload.array('images', 6), async (req, res, next) => {
  try {
    const data = parseBody(req.body)
    const imageUrls = await handleImageUploads(req.files)
    
    // If new images are uploaded, replace the old ones
    if (imageUrls && imageUrls.length > 0) {
      data.images = imageUrls
      data.image = imageUrls[0]
    }

    const product = await Product.findByIdAndUpdate(req.params.id, data, { new: true })
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json(product)
  } catch (e) { next(e) }
})

router.delete('/:id', requireAdmin, async (req, res, next) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    res.json({ message: 'Product deleted successfully' })
  } catch (e) { next(e) }
})

router.post('/:id/sell', requireAdmin, async (req, res, next) => {
  // ... (Keep your existing SELL logic here, no changes needed)
  try {
    const product = await Product.findById(req.params.id)
    if (!product) return res.status(404).json({ message: 'Product not found' })
    if (product.stock < 1) return res.status(400).json({ message: 'Out of stock' })

    const { customerName, customerAddress, customerCnic, customerNumber, sellPrice, date } = req.body || {}
    if (!customerName || !customerNumber) return res.status(400).json({ message: 'Customer name and number required' })

    const actualSellPrice = Number(sellPrice) || product.listedPrice

    const sale = await Sale.create({
      items: [{
        productId: product._id,
        productName: product.name,
        category: product.category,
        imei1: product.imei1,
        imei2: product.imei2,
        color: product.color,
        costPrice: product.costPrice,
        sellPrice: actualSellPrice,
        quantity: 1
      }],
      customer: { name: customerName, address: customerAddress || '', cnic: customerCnic || '', number: customerNumber },
      date: date ? new Date(date) : new Date(),
    })

    product.stock -= 1
    await product.save()
    res.status(201).json(sale)
  } catch (e) { next(e) }
})

export default router