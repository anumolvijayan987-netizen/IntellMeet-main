import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/appError'
import { ApiResponse } from '../utils/apiResponse'
import { logger } from '../utils/logger'
import { env } from '../config/env'

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  next: NextFunction
): void => {
  let statusCode = 500
  let code = 'INTERNAL_SERVER_ERROR'
  let message = err.message || 'An unexpected error occurred'
  let details: unknown = undefined

  if (err instanceof AppError) {
    statusCode = err.statusCode
    code = err.code
    message = err.message
    details = err.details
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400
    code = 'VALIDATION_ERROR'
    message = 'Data validation failed'
    details = err
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId)
    statusCode = 400
    code = 'INVALID_ID'
    message = 'Invalid resource identifier format'
  } else if ('code' in err && (err as { code: unknown }).code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409
    code = 'DUPLICATE_KEY'
    message = 'A resource with this key already exists'
  }

  // Log error
  if (statusCode >= 500) {
    logger.error(`🔥 [${req.method} ${req.originalUrl}] 500 Error: ${err.message}`, {
      stack: err.stack,
    })
  } else {
    logger.warn(`⚠️ [${req.method} ${req.originalUrl}] ${statusCode} ${code}: ${message}`)
  }

  ApiResponse.error(
    res,
    message,
    statusCode,
    code,
    details,
    env.isDev ? err.stack : undefined
  )
}

export const notFoundHandler = (req: Request, res: Response): void => {
  ApiResponse.error(
    res,
    `Route not found: ${req.method} ${req.originalUrl}`,
    404,
    'ROUTE_NOT_FOUND'
  )
}
