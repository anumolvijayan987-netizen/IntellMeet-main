import { Request, Response, NextFunction } from 'express'
import { logger } from '../utils/logger'

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now()

  res.on('finish', () => {
    const duration = Date.now() - start
    const status = res.statusCode
    const logMsg = `${req.method} ${req.originalUrl} ${status} - ${duration}ms`

    if (status >= 400) {
      logger.warn(logMsg)
    } else {
      logger.http(logMsg)
    }
  })

  next()
}
