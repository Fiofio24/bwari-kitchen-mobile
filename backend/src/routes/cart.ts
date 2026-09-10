import express from 'express';
import { saveCart, getCart } from '../controllers/cart.controller';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Both endpoints are protected by the customer auth middleware
router.get('/', authenticate, getCart);
router.post('/', authenticate, saveCart);

export default router;