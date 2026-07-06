import { Router } from 'express'
import { getActivityLogs, getDistinctAdmins } from '../controllers/admin.activityLog.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/', getActivityLogs)
router.get('/admins', getDistinctAdmins)

export default router