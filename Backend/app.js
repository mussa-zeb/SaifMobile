import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { connectDB } from './lib/db.js'
import authRouter from './routes/auth.js'
import productsRouter from './routes/products.js'
import salesRouter from './routes/sales.js'
import dashboardRouter from './routes/dashboard.js'

const app = express()

const allowedOrigins = (process.env.CORS_ORIGIN || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(
  cors({
    origin: allowedOrigins.length > 0 ? allowedOrigins : true,
    credentials: true,
  })
)
app.use(express.json({ limit: '10mb' }))

// Ensure DB is connected before handling any request (cached across invocations)
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('DB connection error:', err)
    res.status(500).json({ message: 'Database connection failed' })
  }
})

app.use('/api/admin', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/sales', salesRouter)
app.use('/api/dashboard', dashboardRouter)
app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use((err, req, res, _next) => {
  console.error(err)
  res.status(500).json({ message: err.message || 'Server error' })
})

export default app