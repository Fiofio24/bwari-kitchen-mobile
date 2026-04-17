import { Router } from 'express'
import {
  register,
  login,
  getMe,
  updateProfile,
  changePassword,
  createStaff,
  getAllUsers,
  deactivateUser,
  logout,
} from '../controllers/auth.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

// ─────────────────────────────────────────
// Public routes
// ─────────────────────────────────────────
router.post('/register', register)
router.post('/login', login)

// ─────────────────────────────────────────
// Customer + Admin + Rider routes
// ─────────────────────────────────────────
router.get('/me', authenticate, getMe)
router.patch('/profile', authenticate, updateProfile)
router.patch('/change-password', authenticate, changePassword)
router.post('/logout', authenticate, logout)

// ─────────────────────────────────────────
// Admin only routes
// ─────────────────────────────────────────
router.post('/staff/create', authenticate, authorize('admin'), createStaff)
router.get('/users', authenticate, authorize('admin'), getAllUsers)
router.patch('/users/:id/deactivate', authenticate, authorize('admin'), deactivateUser)

export default router