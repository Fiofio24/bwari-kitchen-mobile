import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(express.json())

// Health check — useful for the frontend team to confirm API is alive
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'Bwari Kitchen API',
    timestamp: new Date().toISOString()
  })
})

// Routes will be imported here as you build them
// app.use('/api/auth', authRoutes)
// app.use('/api/menu', menuRoutes)
// app.use('/api/orders', orderRoutes)

app.listen(PORT, () => {
  console.log(`🍽️  Bwari Kitchen API running on port ${PORT}`)
})

export default app