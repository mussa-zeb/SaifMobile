export function requireAdmin(req, res, next) {
  const token = process.env.ADMIN_TOKEN
  if (!token) {
    return res.status(500).json({ message: 'ADMIN_TOKEN not configured on server' })
  }
  if (req.headers['x-admin-token'] !== token) {
    return res.status(401).json({ message: 'Unauthorized. Please login as admin.' })
  }
  next()
}