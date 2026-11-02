import { Request, Response, NextFunction } from 'express'

function sanitizeObject(obj: any): void {
  if (!obj || typeof obj !== 'object') return

  for (const key of Object.keys(obj)) {
    if (key.startsWith('$') || key.includes('.')) {
      delete obj[key]
    } else if (typeof obj[key] === 'object') {
      sanitizeObject(obj[key])
    }
  }
}

export const mongoSanitize = (req: Request, res: Response, next: NextFunction): void => {
  if (req.body) sanitizeObject(req.body)
  if (req.query) sanitizeObject(req.query)
  if (req.params) sanitizeObject(req.params)
  next()
}
