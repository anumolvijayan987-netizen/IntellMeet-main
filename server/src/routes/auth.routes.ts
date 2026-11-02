import { Router } from 'express'
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
  verifyEmail,
  getMe,
} from '../controllers/auth.controller'
import { validate } from '../middleware/validate.middleware'
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  verifyEmailSchema,
  refreshTokenSchema,
} from '../validators/auth.validator'
import { authenticate } from '../middleware/auth.middleware'
import { authRateLimiter } from '../middleware/rateLimiter.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.post('/register', authRateLimiter, validate(registerSchema), asyncHandler(register))
router.post('/login', authRateLimiter, validate(loginSchema), asyncHandler(login))
router.post('/logout', asyncHandler(logout))
router.post('/refresh-token', validate(refreshTokenSchema), asyncHandler(refreshToken))
router.post('/forgot-password', authRateLimiter, validate(forgotPasswordSchema), asyncHandler(forgotPassword))
router.post('/reset-password', authRateLimiter, validate(resetPasswordSchema), asyncHandler(resetPassword))
router.post('/verify-email', validate(verifyEmailSchema), asyncHandler(verifyEmail))
router.get('/me', authenticate, asyncHandler(getMe))

export default router
