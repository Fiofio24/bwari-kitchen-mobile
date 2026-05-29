import { Router } from 'express'
import {
  adminGetPromos,
  adminGetPromo,
  createPromo,
  updatePromo,
  togglePromo,
  deletePromo,
} from '../controllers/promotion.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/', adminGetPromos)
router.get('/:id', adminGetPromo)
router.post('/', createPromo)
router.patch('/:id', updatePromo)
router.patch('/:id/toggle', togglePromo)
router.delete('/:id', deletePromo)

export default router