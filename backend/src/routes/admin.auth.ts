import { Router } from 'express'
import {
  adminLogin,
  createAdmin,
  getAdminMe,
  changeAdminPassword,
} from '../controllers/admin.auth.controller'
import {
  authenticateAdmin,
  requireSuperAdmin,
} from '../middleware/adminAuth'

const router = Router()

// Public
router.post('/login', adminLogin)

// Protected — any admin
router.get('/me', authenticateAdmin, getAdminMe)
router.patch('/change-password', authenticateAdmin, changeAdminPassword)

// Super admin only
router.post('/create', authenticateAdmin, requireSuperAdmin, createAdmin)

export default router