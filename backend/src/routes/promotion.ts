import { Router } from 'express'
import {
  validatePromoCode,
  getActivePromos,
} from '../controllers/promotion.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.get('/', authenticate, getActivePromos)
router.post('/validate', authenticate, validatePromoCode)

export default router