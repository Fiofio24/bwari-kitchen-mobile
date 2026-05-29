import { Router } from 'express'
import {
  getOverview,
  getRevenueOverTime,
  getOrdersOverTime,
  getTopSellingItems,
  getPeakHours,
  getPeakDays,
  getCustomerRetention,
  getRiderPerformance,
  getPaymentMethodBreakdown,
  exportOrdersCSV,
  exportRevenueCSV,
  exportTopItemsCSV,
} from '../controllers/admin.analytics.controller'
import { authenticateAdmin } from '../middleware/adminAuth'

const router = Router()

router.use(authenticateAdmin)

router.get('/overview', getOverview)
router.get('/revenue', getRevenueOverTime)
router.get('/orders-over-time', getOrdersOverTime)
router.get('/top-items', getTopSellingItems)
router.get('/peak-hours', getPeakHours)
router.get('/peak-days', getPeakDays)
router.get('/customer-retention', getCustomerRetention)
router.get('/rider-performance', getRiderPerformance)
router.get('/payment-methods', getPaymentMethodBreakdown)
router.get('/export/orders', exportOrdersCSV)
router.get('/export/revenue', exportRevenueCSV)
router.get('/export/top-items', exportTopItemsCSV)

export default router