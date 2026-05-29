import { Router } from 'express'
import {
  getSettings,
  getSetting,
  updateSetting,
  updateMultipleSettings,
  createSetting,
  getBranch,
  updateBranch,
  toggleRestaurantOpen,
} from '../controllers/admin.settings.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/branch/info', getBranch)
router.patch('/branch/info', updateBranch)
router.patch('/branch/toggle-open', toggleRestaurantOpen)

router.get('/', getSettings)
router.post('/', createSetting)
router.patch('/', updateMultipleSettings)
router.get('/:key', getSetting)
router.patch('/:key', updateSetting)

export default router