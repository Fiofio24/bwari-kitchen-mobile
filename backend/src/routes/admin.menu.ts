import { Router } from 'express'
import {
  adminGetCategories,
  createCategory,
  updateCategory,
  toggleCategoryAvailability,
  deleteCategory,
  adminGetMenuItems,
  createMenuItem,
  updateMenuItem,
  toggleItemAvailability,
  deleteMenuItem,
  adminGetPackages,
  createPackage,
  updatePackage,
  togglePackageAvailability,
  deletePackage,
} from '../controllers/admin.menu.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

// All admin menu routes require admin auth
router.use(authenticateAdmin)

// ─── Categories ───────────────────────────
router.get('/categories', adminGetCategories)
router.post('/categories', createCategory)
router.patch('/categories/:id', updateCategory)
router.patch('/categories/:id/availability', toggleCategoryAvailability)
router.delete('/categories/:id', deleteCategory)

// ─── Menu Items ───────────────────────────
router.get('/items', adminGetMenuItems)
router.post('/items', createMenuItem)
router.patch('/items/:id', updateMenuItem)
router.patch('/items/:id/availability', toggleItemAvailability)
router.delete('/items/:id', deleteMenuItem)

// ─── Packages ─────────────────────────────
router.get('/packages', adminGetPackages)
router.post('/packages', createPackage)
router.patch('/packages/:id', updatePackage)
router.patch('/packages/:id/availability', togglePackageAvailability)
router.delete('/packages/:id', deletePackage)

export default router