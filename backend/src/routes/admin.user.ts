import { Router } from 'express'
import {
  getCustomers,
  getCustomer,
  getRiders,
  getRider,
  createRider,
  updateRider,
  toggleUserActive,
  resetUserPassword,
  deleteUser,
  getUserStats,
} from '../controllers/admin.user.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/stats', getUserStats)
router.get('/customers', getCustomers)
router.get('/customers/:id', getCustomer)
router.get('/riders', getRiders)
router.get('/riders/:id', getRider)
router.post('/riders', createRider)
router.patch('/riders/:id', updateRider)
router.patch('/:id/toggle-active', toggleUserActive)
router.patch('/:id/reset-password', resetUserPassword)
router.delete('/:id', deleteUser)

export default router