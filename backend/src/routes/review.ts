import { Router } from 'express'
import {
  submitReview,
  getMyReviews,
  checkReviewed,
} from '../controllers/review.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post('/', authenticate, submitReview)
router.get('/', authenticate, getMyReviews)
router.get('/check/:orderId', authenticate, checkReviewed)

export default router