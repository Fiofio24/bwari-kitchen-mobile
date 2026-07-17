import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import prisma from './lib/prisma'

// Customer app routes
import authRoutes from './routes/auth'
import menuRoutes from './routes/menu'
import addressRoutes from './routes/address'
import orderRoutes from './routes/order'
import paymentRoutes from './routes/payment'
import notificationRoutes from './routes/notification'
import reviewRoutes from './routes/review'
import promotionRoutes from './routes/promotion'
import uploadRoutes from './routes/upload'
import favoriteRoutes from './routes/favorite'

// Rider routes
import riderRoutes from './routes/rider'

// Admin routes
import adminAuthRoutes from './routes/admin.auth'
import adminMenuRoutes from './routes/admin.menu'
import adminOrderRoutes from './routes/admin.order'
import adminUserRoutes from './routes/admin.user'
import adminSettingsRoutes from './routes/admin.settings'
import adminAnalyticsRoutes from './routes/admin.analytics'
import adminReviewRoutes from './routes/admin.review'
import adminPromotionRoutes from './routes/admin.promotion'
import adminActivityLogRoutes from './routes/admin.activityLog'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081', 'https://bwari-kitchen-admin.vercel.app',],
  credentials: true,
}))

// Webhook must be registered BEFORE express.json()
// Preserves raw body for Paystack signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())

// Health check
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({
      status: 'ok',
      app: 'Bwari Kitchen API',
      db: 'connected',
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected' })
  }
})

// ─── Customer app routes ──────────────────
app.use('/api/auth', authRoutes)
app.use('/api/menu', menuRoutes)
app.use('/api/addresses', addressRoutes)
app.use('/api/orders', orderRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/reviews', reviewRoutes)
app.use('/api/promotions', promotionRoutes)
app.use('/api/upload', uploadRoutes)
app.use('/api/favorites', favoriteRoutes)

// ─── Rider routes ─────────────────────────
app.use('/api/rider', riderRoutes)

// ─── Admin routes ─────────────────────────
app.use('/api/admin/auth', adminAuthRoutes)
app.use('/api/admin/menu', adminMenuRoutes)
app.use('/api/admin/orders', adminOrderRoutes)
app.use('/api/admin/users', adminUserRoutes)
app.use('/api/admin/settings', adminSettingsRoutes)
app.use('/api/admin/analytics', adminAnalyticsRoutes)
app.use('/api/admin/reviews', adminReviewRoutes)
app.use('/api/admin/promotions', adminPromotionRoutes)
app.use('/api/admin/activity-logs', adminActivityLogRoutes)

// ─── Global error handler ─────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'Something went wrong. Please try again.',
  })
})

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`🍽️  Bwari Kitchen API running on port ${PORT}`)
})

export default app