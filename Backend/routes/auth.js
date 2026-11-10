import { Router } from 'express'

const router = Router()

router.post('/login', (req, res) => {
  const { email, password } = req.body || {}
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPassword = process.env.ADMIN_PASSWORD
  const adminToken = process.env.ADMIN_TOKEN

  if (!adminEmail || !adminPassword || !adminToken) {
    return res.status(500).json({ message: 'Server auth not configured' })
  }

  if (!email || email.toLowerCase() !== adminEmail.toLowerCase()) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  if (password !== adminPassword) {
    return res.status(401).json({ message: 'Invalid email or password' })
  }

  res.json({ token: adminToken })
})

export default router