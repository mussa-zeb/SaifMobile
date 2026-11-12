import { Router } from 'express'

const router = Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminEmail || !adminPassword || !adminToken) {
    console.error('Auth Error: Missing ADMIN_EMAIL, ADMIN_PASSWORD, or ADMIN_TOKEN in .env')
    return res.status(500).json({ message: 'Server auth is not configured. Please check backend environment variables.' })
  }

  if (!email || email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(401).json({ message: 'Invalid credentials. The email address is incorrect.' })
  }

  if (password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid credentials. The password is incorrect.' })
  }

  res.json({ token: adminToken, message: 'Login successful!' })
})

export default router