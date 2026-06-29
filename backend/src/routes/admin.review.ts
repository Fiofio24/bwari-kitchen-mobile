import { Router } from 'express'
import {
  adminGetReviews,
  toggleReviewVisibility,
  adminDeleteReview,
} from '../controllers/review.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/', adminGetReviews)
router.patch('/:id/visibility', toggleReviewVisibility)
router.delete('/:id', adminDeleteReview)

export default router