import { Router } from 'express'
import express from 'express'
import {
  initializePayment,
  verifyPaymentPublic,
  paystackWebhook,
  getPaymentStatus,
  paymentCallbackRedirect,
} from '../controllers/payment.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  paystackWebhook
)

router.get('/verify', paymentCallbackRedirect)
router.get('/verify/:reference', verifyPaymentPublic)
router.post('/initialize', authenticate, initializePayment)
router.get('/order/:orderId', authenticate, getPaymentStatus)

export default router