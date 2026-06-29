import { Router } from 'express'
import {
  changePassword,
  getMe,
  login,
  logout,
  register,
  updateProfile,
} from '../controllers/auth.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

// Public
router.post('/register', register)
router.post('/login', login)

// Protected — customers and riders
router.get('/me', authenticate, getMe)
router.patch('/profile', authenticate, updateProfile)
router.patch('/change-password', authenticate, changePassword)
router.post('/logout', authenticate, logout)

export default router