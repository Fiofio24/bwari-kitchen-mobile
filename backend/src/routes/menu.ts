import { Router } from 'express'
import {
  getCategories,
  getMenuItems,
  getMenuItem,
  getPackages,
  getPackage,
  getFullMenu,
  getBranchInfo,
} from '../controllers/menu.controller'

const router = Router()

// All menu routes are public — no auth required
router.get('/', getFullMenu)
router.get('/categories', getCategories)
router.get('/items', getMenuItems)
router.get('/items/:id', getMenuItem)
router.get('/packages', getPackages)
router.get('/packages/:id', getPackage)
router.get('/branch', getBranchInfo)

export default router