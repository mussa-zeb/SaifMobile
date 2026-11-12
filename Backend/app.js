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

// DB Connection Middleware
app.use(async (req, res, next) => {
  try {
    await connectDB()
    next()
  } catch (err) {
    console.error('❌ DB connection error:', err)
    res.status(500).json({ message: 'Database connection failed. Please check if the database is online and the connection string is correct.' })
  }
})

// Routes
app.use('/api/admin', authRouter)
app.use('/api/products', productsRouter)
app.use('/api/sales', salesRouter)
app.use('/api/dashboard', dashboardRouter)
app.get('/api/health', (req, res) => res.json({ ok: true, message: 'Backend is running perfectly.' }))

// 🚨 GLOBAL ERROR HANDLER (Translates all errors to clear messages)
app.use((err, req, res, _next) => {
  console.error('🔥 Server Error:', err)

  // If headers are already sent (e.g., during a PDF stream failure), end gracefully
  if (res.headersSent) {
    return res.end()
  }

  let statusCode = err.status || 500
  let message = err.message || 'An unexpected server error occurred.'

  // 1. Handle Mongoose Validation Errors (e.g., missing required fields, wrong number types)
  if (err.name === 'ValidationError') {
    statusCode = 400
    const fields = Object.values(err.errors).map(e => e.message).join(', ')
    message = `Validation Failed: ${fields}`
  }

  // 2. Handle Mongoose Cast Errors (e.g., providing an invalid ID format)
  if (err.name === 'CastError') {
    statusCode = 400
    message = `Invalid format for field: ${err.path}. Please check your input.`
  }

  // 3. Handle Duplicate Key Errors (e.g., trying to create a duplicate record)
  if (err.code === 11000) {
    statusCode = 400
    const field = Object.keys(err.keyValue)[0]
    message = `Duplicate value entered for ${field}. Please use another value.`
  }

  // 4. Handle Custom JWT / Auth errors
  if (err.name === 'UnauthorizedError') {
    statusCode = 401
    message = 'Authentication failed. Please log in again.'
  }

  // Send the final clean message to the frontend
  res.status(statusCode).json({ message })
})

export default app