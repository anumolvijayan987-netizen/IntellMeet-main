import { Router } from 'express'
import {
  getActionItems,
  createActionItem,
  updateActionItem,
} from '../controllers/actionItem.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getActionItems))
router.post('/', asyncHandler(createActionItem))
router.patch('/:id', asyncHandler(updateActionItem))

export default router
