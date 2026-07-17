import { Router } from 'express'
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  getUnreadCount,
  getPreferences,
  updatePreferences,
} from '../controllers/notification.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', getNotifications)
router.get('/unread-count', getUnreadCount)
router.get('/preferences', getPreferences)
router.patch('/preferences', updatePreferences)
router.patch('/read-all', markAllAsRead)
router.patch('/:id/read', markAsRead)
router.delete('/', deleteAllNotifications)
router.delete('/:id', deleteNotification)

export default router