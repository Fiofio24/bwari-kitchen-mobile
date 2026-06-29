import { Router } from 'express'
import {
  getMyDeliveries,
  getDelivery,
  updateDeliveryStatus,
  updateRiderLocation,
  getRiderStats,
  getRiderProfile,
} from '../controllers/rider.controller'
import { authenticate, authorize } from '../middleware/auth'

const router = Router()

router.use(authenticate)
router.use(authorize('rider'))

router.get('/profile', getRiderProfile)
router.get('/stats', getRiderStats)
router.get('/deliveries', getMyDeliveries)
router.get('/deliveries/:id', getDelivery)
router.patch('/deliveries/:id/status', updateDeliveryStatus)
router.patch('/deliveries/:id/location', updateRiderLocation)

export default router