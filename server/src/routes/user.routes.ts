import { Router } from 'express'
import {
  getUserProfile,
  updateUserProfile,
  uploadAvatar,
  updatePreferences,
  changePassword,
  updateStatus,
} from '../controllers/user.controller'
import { authenticate } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import {
  updateProfileSchema,
  updatePreferencesSchema,
  changePasswordSchema,
} from '../validators/user.validator'
import { avatarUpload } from '../middleware/upload.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

// All user routes require authentication
router.use(authenticate)

router.get('/me', asyncHandler(getUserProfile))
router.patch('/me', validate(updateProfileSchema), asyncHandler(updateUserProfile))
router.post('/me/avatar', avatarUpload.single('avatar'), asyncHandler(uploadAvatar))
router.patch('/me/preferences', validate(updatePreferencesSchema), asyncHandler(updatePreferences))
router.post('/me/change-password', validate(changePasswordSchema), asyncHandler(changePassword))
router.post('/me/password', validate(changePasswordSchema), asyncHandler(changePassword))
router.patch('/me/status', asyncHandler(updateStatus))

export default router
