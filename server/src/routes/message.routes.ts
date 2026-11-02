import { Router } from 'express'
import { getMessages, sendMessage } from '../controllers/message.controller'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.get('/', asyncHandler(getMessages))
router.post('/', asyncHandler(sendMessage))

export default router
