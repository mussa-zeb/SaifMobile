import { Router } from 'express'
import PDFDocument from 'pdfkit'
import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

// 1. GET ALL SALES
router.get('/', async (req, res, next) => {
  try {
    const sales = await Sale.find().sort({ date: -1 }).lean()
    res.json(sales)
  } catch (e) { next(e) }
})

// 2. NEW CHECKOUT (Multi-item Sale)
router.post('/checkout', requireAdmin, async (req, res, next) => {
  try {
    const { items, customer, date } = req.body
    if (!items || items.length === 0) return res.status(400).json({ message: 'No items in cart' })
    if (!customer.name || !customer.number) return res.status(400).json({ message: 'Customer info required' })

    const saleItems = []

    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) return res.status(404).json({ message: `Product ${item.productName} not found` })
      
      const qty = Number(item.quantity) || 1
      if (product.stock < qty) return res.status(400).json({ message: `Not enough stock for ${product.name}` })

      saleItems.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        imei1: product.imei1,
        imei2: product.imei2,
        color: product.color,
        costPrice: product.costPrice,
        sellPrice: Number(item.sellPrice) || product.listedPrice,
        quantity: qty,
      })

      product.stock -= qty
      await product.save()
    }

    const sale = await Sale.create({
      items: saleItems,
      customer,
      date: date ? new Date(date) : new Date(),
      status: 'completed'
    })

    res.status(201).json(sale)
  } catch (e) { next(e) }
})

// 3. RETURN SALE (Handles both NEW cart items and OLD single items)
router.post('/:id/return', requireAdmin, async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found' })
    if (sale.status === 'returned') return res.status(400).json({ message: 'Already returned' })

    // Restore Stock FIRST before marking as returned
    if (sale.items && sale.items.length > 0) {
      // NEW FORMAT (Cart)
      for (const item of sale.items) {
        if (item.productId) {
          const product = await Product.findById(item.productId)
          if (product) {
            if (product.category === 'mobile') {
              product.stock = 1 // Mobiles are unique
            } else {
              product.stock += item.quantity || 1 // Add exact quantity back
            }
            await product.save()
          }
        }
      }
    } else if (sale.productId) {
      // OLD FORMAT (Single item)
      const product = await Product.findById(sale.productId)
      if (product) {
        if (product.category === 'mobile') {
          product.stock = 1
        } else {
          product.stock += 1
        }
        await product.save()
      }
    }

    // Mark as returned AFTER stock is safely restored
    sale.status = 'returned'
    await sale.save()

    res.json({ message: 'Sale returned and stock restored.' })
  } catch (e) { next(e) }
})

// 4. EXPORT TO PDF
router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const sales = await Sale.find({ status: 'completed' }).sort({ date: -1 }).lean()
    const doc = new PDFDocument({ margin: 40, size: 'A4' })
    
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"')
    doc.pipe(res)

    doc.fontSize(20).font('Helvetica-Bold').text('SAIF MOBILE', { align: 'center' })
    doc.fontSize(12).font('Helvetica').text('Sales & Profit Report', { align: 'center' })
    doc.moveDown(2)

    const tableTop = doc.y
    doc.fontSize(10).font('Helvetica-Bold')
    doc.text('Date', 40, tableTop)
    doc.text('Items', 130, tableTop)
    doc.text('Customer', 320, tableTop)
    doc.text('Total', 450, tableTop, { width: 70, align: 'right' })
    doc.text('Profit', 520, tableTop, { width: 70, align: 'right' })

    doc.moveTo(40, tableTop + 15).lineTo(550, tableTop + 15).stroke()

    let y = tableTop + 25
    let totalProfit = 0

    sales.forEach((sale) => {
      let saleProfit = 0
      let saleTotal = 0
      let itemNames = []

      if (sale.items && sale.items.length > 0) {
        sale.items.forEach(item => {
          saleProfit += (item.sellPrice - item.costPrice) * item.quantity
          saleTotal += item.sellPrice * item.quantity
          itemNames.push(`${item.quantity}x ${item.productName}`)
        })
      } else {
        // Old format fallback for PDF
        saleProfit += (sale.sellPrice || 0) - (sale.costPrice || 0)
        saleTotal += sale.sellPrice || 0
        itemNames.push(`1x ${sale.productName || 'Unknown'}`)
      }

      totalProfit += saleProfit
      const namesStr = itemNames.join(', ').substring(0, 30)

      doc.fontSize(9).font('Helvetica')
      doc.text(new Date(sale.date).toLocaleDateString(), 40, y)
      doc.text(namesStr, 130, y)
      doc.text(sale.customer.name.substring(0, 15), 320, y)
      doc.text(String(saleTotal), 450, y, { width: 70, align: 'right' })
      
      if (saleProfit >= 0) {
        doc.fillColor('#059669').text(`+${saleProfit}`, 520, y, { width: 70, align: 'right' })
      } else {
        doc.fillColor('#dc2626').text(`${saleProfit}`, 520, y, { width: 70, align: 'right' })
      }
      doc.fillColor('#000000')

      y += 20
      if (y > 700) {
        doc.addPage()
        y = 40
      }
    })

    doc.moveTo(40, y + 10).lineTo(550, y + 10).stroke()
    doc.fontSize(12).font('Helvetica-Bold').text('Total Net Profit:', 400, y + 20)
    doc.text(`${totalProfit}`, 520, y + 20, { width: 70, align: 'right' })

    doc.end()
  } catch (e) { next(e) }
})

export default router