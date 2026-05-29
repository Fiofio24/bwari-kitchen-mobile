import { Router } from 'express'
import {
  uploadMenuItemImage,
  uploadCategoryImage,
  uploadPackageImage,
  uploadProfilePhoto,
  deleteMenuItemImage,
  deleteProfilePhoto,
} from '../controllers/upload.controller'
import { authenticate } from '../middleware/auth'
import { authenticateAdmin } from '../middleware/adminAuth'
import { upload } from '../lib/upload'

const router = Router()

router.post('/menu-item/:id', authenticateAdmin, upload.single('image'), uploadMenuItemImage)
router.post('/category/:id', authenticateAdmin, upload.single('image'), uploadCategoryImage)
router.post('/package/:id', authenticateAdmin, upload.single('image'), uploadPackageImage)
router.delete('/menu-item/:id', authenticateAdmin, deleteMenuItemImage)
router.post('/profile-photo', authenticate, upload.single('image'), uploadProfilePhoto)
router.delete('/profile-photo', authenticate, deleteProfilePhoto)

export default router