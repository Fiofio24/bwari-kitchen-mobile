import { Router } from 'express'
import {
  adminGetOrders,
  adminGetOrder,
  updateOrderStatus,
  assignRider,
  getOrderStats,
  adminCancelOrder,
} from '../controllers/admin.order.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/stats', getOrderStats)
router.get('/', adminGetOrders)
router.get('/:id', adminGetOrder)
router.patch('/:id/status', updateOrderStatus)
router.patch('/:id/assign-rider', assignRider)
router.patch('/:id/cancel', adminCancelOrder)

export default router