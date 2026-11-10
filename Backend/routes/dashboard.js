import { Router } from 'express'
import Product from '../models/Product.js'
import Sale from '../models/Sale.js'
import Purchase from '../models/Purchase.js'

const router = Router()
const dayKey = (d) => new Date(d).toISOString().slice(0, 10)

router.get('/', async (req, res, next) => {
  try {
    const range = req.query.range || '1w'
    
    const [products, rawSales, allPurchases] = await Promise.all([
      Product.find().lean(),
      Sale.find().lean(),
      Purchase.find().lean(),
    ])

    const allSales = rawSales.filter(s => s.status !== 'returned')

    let startDate = new Date()
    let endDate = new Date()
    startDate.setHours(0, 0, 0, 0)
    endDate.setHours(23, 59, 59, 999)

    let daysToShow = 7
    if (range === '1w') { startDate.setDate(startDate.getDate() - 7); daysToShow = 7 }
    else if (range === '1m') { startDate.setMonth(startDate.getMonth() - 1); daysToShow = 30 }
    else if (range === '90d') { startDate.setDate(startDate.getDate() - 90); daysToShow = 90 }
    else if (range === '1y') { startDate.setFullYear(startDate.getFullYear() - 1); daysToShow = 365 }

    const inRange = (dateStr) => {
      const d = new Date(dateStr)
      return d >= startDate && d <= endDate
    }

    const rangeSales = allSales.filter(s => inRange(s.date))
    const rangePurchases = allPurchases.filter(p => inRange(p.date))

    const sumStock = (cat) => products.filter((p) => p.category === cat).reduce((s, p) => s + p.stock, 0)
    
    const rangeSalesTotal = rangeSales.reduce((sum, sale) => {
       if (sale.items && sale.items.length > 0) {
         return sum + sale.items.reduce((s, item) => s + (item.sellPrice * item.quantity), 0)
       }
       return sum + Number(sale.sellPrice || 0) // Old format fallback
    }, 0)
    
    const rangeSalesCount = rangeSales.reduce((sum, sale) => {
       if (sale.items && sale.items.length > 0) {
         return sum + sale.items.reduce((s, item) => s + item.quantity, 0)
       }
       return sum + 1 // Old format fallback
    }, 0)

    const totalProfit = rangeSales.reduce((sum, sale) => {
       if (sale.items && sale.items.length > 0) {
         return sum + sale.items.reduce((s, item) => s + ((item.sellPrice - item.costPrice) * item.quantity), 0)
       }
       return sum + (Number(sale.sellPrice || 0) - Number(sale.costPrice || 0)) // Old format fallback
    }, 0)

    const trend = []
    for (let i = daysToShow - 1; i >= 0; i--) {
      const d = new Date(endDate)
      d.setDate(d.getDate() - i)
      const key = dayKey(d)
      const daySales = allSales.filter((s) => dayKey(s.date) === key)
      
      const dayProfit = daySales.reduce((sum, sale) => {
         if (sale.items && sale.items.length > 0) {
           return sum + sale.items.reduce((s, item) => s + ((item.sellPrice - item.costPrice) * item.quantity), 0)
         }
         return sum + (Number(sale.sellPrice || 0) - Number(sale.costPrice || 0)) // Old format fallback
      }, 0)

      const label = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      trend.push({ date: key, label, count: daySales.length, profit: dayProfit })
    }

    res.json({
      available: {
        mobile: sumStock('mobile'),
        perfume: sumStock('perfume'),
        headphone: sumStock('headphone'),
      },
      rangeStats: {
        salesTotal: rangeSalesTotal,
        salesCount: rangeSalesCount,
        buysTotal: rangePurchases.reduce((s, x) => s + Number(x.totalCost || 0), 0),
        profit: totalProfit,
      },
      trend
    })
  } catch (e) { next(e) }
})

export default router