import { Request, Response, NextFunction } from 'express'
import { AppError } from '../utils/appError'
import { verifyAccessToken, TokenPayload } from '../utils/token'
import { WorkspaceMember } from '../models/WorkspaceMember.model'

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined

  // 1. Check Authorization header
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies?.accessToken) {
    // 2. Check cookies
    token = req.cookies.accessToken
  }

  if (!token) {
    return next(AppError.unauthorized('Authentication token is required'))
  }

  try {
    const decoded = verifyAccessToken(token)
    req.user = decoded
    next()
  } catch (err: unknown) {
    const error = err as Error
    if (error.name === 'TokenExpiredError') {
      return next(AppError.unauthorized('Session has expired. Please log in again.'))
    }
    return next(AppError.unauthorized('Invalid authentication token'))
  }
}

export const authenticateOptional = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let token: string | undefined

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer ')
  ) {
    token = req.headers.authorization.split(' ')[1]
  } else if (req.cookies?.accessToken) {
    token = req.cookies.accessToken
  }

  if (token) {
    try {
      const decoded = verifyAccessToken(token)
      req.user = decoded
    } catch {
      // Ignore token decode failure for optional auth
    }
  }

  next()
}

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'))
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        AppError.forbidden(
          `Access denied. Role "${req.user.role}" does not have sufficient permissions.`
        )
      )
    }

    next()
  }
}

export const requireWorkspaceRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (!req.user) {
      return next(AppError.unauthorized('Authentication required'))
    }

    const workspaceId = req.params.workspaceId || req.body.workspaceId || req.user.workspaceId
    if (!workspaceId) {
      return next(AppError.badRequest('Workspace ID is required for verification'))
    }

    // Super admins bypass workspace check
    if (req.user.role === 'super_admin' || req.user.role === 'org_admin') {
      return next()
    }

    try {
      const membership = await WorkspaceMember.findOne({
        workspaceId,
        userId: req.user.userId,
      })

      if (!membership || !allowedRoles.includes(membership.role)) {
        return next(
          AppError.forbidden(
            'You do not possess the required permissions in this workspace.'
          )
        )
      }

      next()
    } catch (err) {
      next(err)
    }
  }
}
