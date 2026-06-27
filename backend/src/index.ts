import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

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

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

app.use(helmet())
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:8081'],
  credentials: true,
}))

// Webhook must be registered BEFORE express.json()
// Preserves raw body for Paystack signature verification
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

// JSON parsing for all other routes
app.use(express.json())

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Bwari Kitchen API',
    timestamp: new Date().toISOString()
  })
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

// ─── Global error handler ─────────────────
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack)
  res.status(500).json({
    message: 'Something went wrong. Please try again.',
  })
})

app.listen(PORT, () => {
  console.log(`🍽️  Bwari Kitchen API running on port ${PORT}`)
})

export default app