import { Router } from 'express'
import {
  placeOrder,
  getMyOrders,
  getOrder,
  cancelOrder,
} from '../controllers/order.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.post('/', placeOrder)
router.get('/', getMyOrders)
router.get('/:id', getOrder)
router.patch('/:id/cancel', cancelOrder)

export default router