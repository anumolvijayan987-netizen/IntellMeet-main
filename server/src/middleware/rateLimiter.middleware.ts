import rateLimit from 'express-rate-limit'
import { env } from '../config/env'
import { AppError } from '../utils/appError'

// Auth endpoints rate limiter (Login, Register, Forgot Password)
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(
      AppError.badRequest(
        'Too many authentication requests from this IP. Please try again after 15 minutes.'
      )
    )
  },
})

// General API rate limiter
export const apiRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    next(AppError.badRequest('Rate limit exceeded. Please throttle requests.'))
  },
})
