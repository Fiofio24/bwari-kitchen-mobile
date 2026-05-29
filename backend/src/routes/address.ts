import { Router } from 'express'
import {
  getAddresses,
  addAddress,
  updateAddress,
  setDefaultAddress,
  deleteAddress,
  getDeliveryFee,
} from '../controllers/address.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', getAddresses)
router.post('/', addAddress)
router.patch('/:id', updateAddress)
router.patch('/:id/default', setDefaultAddress)
router.delete('/:id', deleteAddress)
router.post('/delivery-fee', getDeliveryFee)

export default router