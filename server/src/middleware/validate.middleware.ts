import { Request, Response, NextFunction } from 'express'
import { AnyZodObject, ZodError } from 'zod'
import { AppError } from '../utils/appError'

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      })

      req.body = parsed.body ?? req.body
      req.query = parsed.query ?? req.query
      req.params = parsed.params ?? req.params

      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const formattedErrors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }))
        next(AppError.badRequest('Validation error', 'VALIDATION_FAILED', formattedErrors))
      } else {
        next(error)
      }
    }
  }
}
