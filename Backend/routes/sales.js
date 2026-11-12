import { Router } from 'express'
import PDFDocument from 'pdfkit'
import Sale from '../models/Sale.js'
import Product from '../models/Product.js'
import { requireAdmin } from '../middleware/auth.js'

const router = Router()

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
    const sales = await Sale.find().sort({ date: -1 }).lean()
    res.json(sales)
  } catch (e) { next(e) }
})

router.post('/checkout', requireAdmin, async (req, res, next) => {
  try {
    const { items, customer, date, comments } = req.body
    if (!items || items.length === 0) return res.status(400).json({ message: 'Cart is empty.' })
    if (!customer || !customer.name || !customer.number) return res.status(400).json({ message: 'Customer name and contact required.' })

    const saleItems = []
    for (const item of items) {
      const product = await Product.findById(item.productId)
      if (!product) return res.status(404).json({ message: `Product ${item.productName} not found.` })
      const qty = Number(item.quantity) || 1
      if (product.stock < qty) return res.status(400).json({ message: `Not enough stock for ${product.name}.` })

      saleItems.push({
        productId: product._id,
        productName: product.name,
        category: product.category,
        imei1: product.imei1,
        imei2: product.imei2,
        ptaStatus: product.ptaStatus,
        batteryHealth: product.batteryHealth,
        color: product.color,
        costPrice: product.costPrice,
        sellPrice: Number(item.sellPrice) || product.listedPrice,
        quantity: qty,
        comments: item.comments || '',
      })
      product.stock -= qty
      await product.save()
    }

    const sale = await Sale.create({ items: saleItems, customer, comments: comments || '', date: date ? new Date(date) : new Date(), status: 'completed' })
    res.status(201).json({ message: 'Sale completed!', sale })
  } catch (e) { next(e) }
})

// PROCESS RETURN 
router.post('/:id/return', requireAdmin, async (req, res, next) => {
  try {
    const sale = await Sale.findById(req.params.id)
    if (!sale) return res.status(404).json({ message: 'Sale not found.' })
    if (sale.status === 'returned') return res.status(400).json({ message: 'Already returned.' })

    // 1. Apply the edits (new cost price, battery health, comments, etc.) to the Sale
    if (req.body.items) {
      sale.items = req.body.items.map(it => ({
        ...it,
        costPrice: Number(it.costPrice),
        sellPrice: Number(it.sellPrice),
        quantity: Number(it.quantity)
      }))
      sale.markModified('items') // Force Mongoose to save the nested array changes
    }

    // 2. Restore Stock AND update the original Product's inventory details
    if (sale.items && sale.items.length > 0) {
      for (const item of sale.items) {
        if (item.productId) {
          const product = await Product.findById(item.productId)
          if (product) {
            // Restore Stock
            if (product.category === 'mobile') {
              product.stock = 1
            } else {
              product.stock += item.quantity || 1
            }
            
            // Update Product with the condition/value it was returned in
            product.costPrice = Number(item.costPrice) || product.costPrice
            product.listedPrice = Number(item.sellPrice) || product.listedPrice
            product.batteryHealth = item.batteryHealth || product.batteryHealth
            product.ptaStatus = item.ptaStatus || product.ptaStatus
            product.color = item.color || product.color
            product.comments = item.comments || product.comments
            
            await product.save()
          }
        }
      }
    }

    sale.status = 'returned'
    await sale.save()
    res.json({ message: 'Sale returned, data updated, and stock restored.' })
  } catch (e) { next(e) }
})

router.get('/export', requireAdmin, async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query
    const filter = { status: 'completed' }
    
    if (startDate || endDate) {
      filter.date = {}
      if (startDate) filter.date.$gte = new Date(startDate)
      if (endDate) {
        const end = new Date(endDate)
        end.setHours(23, 59, 59, 999)
        filter.date.$lte = end
      }
    }

    const sales = await Sale.find(filter).sort({ date: -1 }).lean()
    
    if (sales.length === 0) {
      return res.status(400).json({ message: 'Cannot generate PDF: No sales found for the selected date range.' })
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' })
    const promise = renderPdf(doc)

    doc.fontSize(18).font('Helvetica-Bold').text('SAIF MOBILE - SALES REPORT', { align: 'center' })
    doc.fontSize(11).font('Helvetica').text(`Date Range: ${startDate || 'All Time'} to ${endDate || 'Present'}`, { align: 'center' })
    doc.moveDown(1.5)

    const allSaleItems = []
    sales.forEach(sale => {
      sale.items.forEach(item => {
        allSaleItems.push({ ...item, date: sale.date, customer: sale.customer, comments: item.comments || sale.comments })
      })
    })

    const categories = ['mobile', 'perfume', 'headphone']
    const catLabels = { mobile: 'MOBILES', perfume: 'PERFUMES', headphone: 'ACCESSORIES' }
    
    const safe = (v, len = 18) => String(v == null ? '' : v).substring(0, len) || '—'
    let currentY = doc.y
    let grandTotalRevenue = 0
    let grandTotalProfit = 0

    categories.forEach(cat => {
      const catItems = allSaleItems.filter(i => i.category === cat)
      if (catItems.length === 0) return

      if (currentY > 480) {
        doc.addPage()
        currentY = 40
      }

      doc.fontSize(12).font('Helvetica-Bold').fillColor('#73152A').text(catLabels[cat], 30, currentY)
      doc.fillColor('#000000')
      currentY += 20

      doc.fontSize(8).font('Helvetica-Bold')

      if (cat === 'mobile') {
        doc.text('Sale Date', 30, currentY, { width: 55 })
        doc.text('Customer', 90, currentY, { width: 75 })
        doc.text('Model', 170, currentY, { width: 100 })
        doc.text('IMEI 1', 275, currentY, { width: 85 })
        doc.text('IMEI 2', 365, currentY, { width: 85 })
        doc.text('PTA Status', 455, currentY, { width: 55 })
        doc.text('Battery', 515, currentY, { width: 55 })
        doc.text('Total', 575, currentY, { width: 55, align: 'right' })
        doc.text('Profit', 635, currentY, { width: 55, align: 'right' })
        doc.text('Comments', 695, currentY, { width: 110 })
      } else {
        doc.text('Sale Date', 30, currentY, { width: 65 })
        doc.text('Customer', 100, currentY, { width: 100 })
        doc.text('Model / Name', 210, currentY, { width: 150 })
        doc.text('Qty', 370, currentY, { width: 40, align: 'center' })
        doc.text('Sell Price', 430, currentY, { width: 70, align: 'right' })
        doc.text('Profit', 520, currentY, { width: 70, align: 'right' })
        doc.text('Comments', 610, currentY, { width: 150 })
      }

      doc.moveTo(30, currentY + 12).lineTo(810, currentY + 12).stroke()
      currentY += 20

      let catRevenue = 0
      let catProfit = 0

      catItems.forEach(i => {
        if (currentY > 540) {
          doc.addPage()
          currentY = 40
        }
        const itemTotal = i.sellPrice * i.quantity
        const itemProfit = (i.sellPrice - i.costPrice) * i.quantity
        catRevenue += itemTotal
        catProfit += itemProfit

        doc.fontSize(7.5).font('Helvetica')

        if (cat === 'mobile') {
          doc.text(new Date(i.date).toLocaleDateString(), 30, currentY, { width: 55 })
          doc.text(safe(i.customer.name, 15), 90, currentY, { width: 75 })
          doc.text(safe(i.productName, 20), 170, currentY, { width: 100 })
          doc.text(safe(i.imei1, 18), 275, currentY, { width: 85 })
          doc.text(safe(i.imei2, 18), 365, currentY, { width: 85 })
          doc.text(safe(i.ptaStatus, 10), 455, currentY, { width: 55 })
          doc.text(safe(i.batteryHealth, 10), 515, currentY, { width: 55 })
          doc.text(String(itemTotal), 575, currentY, { width: 55, align: 'right' })
          if (itemProfit >= 0) doc.fillColor('#059669').text(`+${itemProfit}`, 635, currentY, { width: 55, align: 'right' })
          else doc.fillColor('#dc2626').text(`${itemProfit}`, 635, currentY, { width: 55, align: 'right' })
          doc.fillColor('#000000')
          doc.text(safe(i.comments, 20), 695, currentY, { width: 110 })
        } else {
          doc.text(new Date(i.date).toLocaleDateString(), 30, currentY, { width: 65 })
          doc.text(safe(i.customer.name, 15), 100, currentY, { width: 100 })
          doc.text(safe(i.productName, 25), 210, currentY, { width: 150 })
          doc.text(String(i.quantity), 370, currentY, { width: 40, align: 'center' })
          doc.text(String(itemTotal), 430, currentY, { width: 70, align: 'right' })
          if (itemProfit >= 0) doc.fillColor('#059669').text(`+${itemProfit}`, 520, currentY, { width: 70, align: 'right' })
          else doc.fillColor('#dc2626').text(`${itemProfit}`, 520, currentY, { width: 70, align: 'right' })
          doc.fillColor('#000000')
          doc.text(safe(i.comments, 25), 610, currentY, { width: 150 })
        }
        currentY += 15
      })

      grandTotalRevenue += catRevenue
      grandTotalProfit += catProfit

      doc.fontSize(9).font('Helvetica-Bold')
      doc.text(`Subtotal (${catItems.length} items):`, 430, currentY + 5, { width: 120, align: 'right' })
      doc.text(`${catRevenue}`, 550, currentY + 5, { width: 60, align: 'right' })
      doc.text(`${catProfit}`, 620, currentY + 5, { width: 60, align: 'right' })
      currentY += 30
    })

    if (currentY > 520) {
      doc.addPage()
      currentY = 40
    }
    doc.moveTo(30, currentY).lineTo(810, currentY).stroke()
    doc.fontSize(11).font('Helvetica-Bold')
    doc.text('GRAND TOTAL REVENUE:', 400, currentY + 10, { width: 150, align: 'right' })
    doc.text(`${grandTotalRevenue}`, 550, currentY + 10, { width: 60, align: 'right' })
    doc.text('GRAND TOTAL PROFIT:', 400, currentY + 25, { width: 150, align: 'right' })
    doc.fillColor('#059669').text(`${grandTotalProfit}`, 550, currentY + 25, { width: 60, align: 'right' })

    doc.end()
    const pdfBuffer = await promise
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', 'attachment; filename="sales-report.pdf"')
    res.setHeader('Content-Length', pdfBuffer.length)
    res.end(pdfBuffer)
  } catch (e) { next(e) }
})

export default router