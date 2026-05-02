import express, { Request, Response, NextFunction } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'
import authRoutes from './routes/auth'
import adminAuthRoutes from './routes/admin.auth'
import menuRoutes from './routes/menu'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Routes
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Bwari Kitchen API',
    timestamp: new Date().toISOString()
  })
})

// Customer app routes
app.use('/api/auth', authRoutes)
// Menu routes
app.use('/api/menu', menuRoutes)
// Admin dashboard routes
app.use('/api/admin/auth', adminAuthRoutes)

// Global error handler — catches anything thrown in async controllers
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