import { Router } from 'express'
import { getFavorites, addFavorite, removeFavorite } from '../controllers/favorite.controller'
import { authenticate } from '../middleware/auth'

const router = Router()

router.use(authenticate)

router.get('/', getFavorites)
router.post('/', addFavorite)
router.delete('/', removeFavorite)

export default router