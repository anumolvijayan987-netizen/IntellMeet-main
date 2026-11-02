import { Request, Response } from 'express'
import { AuthService } from '../services/auth.service'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'
import { env } from '../config/env'

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.isProd,
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
}

export const register = async (req: Request, res: Response): Promise<void> => {
  const result = await AuthService.register(req.body)

  // Set HTTP-only refresh token cookie
  res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS)

  ApiResponse.created(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokens: result.tokens,
    },
    'Registration successful. Account initialized.'
  )
}

export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body
  const result = await AuthService.login(email, password)

  // Set HTTP-only refresh token cookie
  res.cookie('refreshToken', result.tokens.refreshToken, COOKIE_OPTIONS)

  ApiResponse.success(
    res,
    {
      user: result.user,
      accessToken: result.tokens.accessToken,
      refreshToken: result.tokens.refreshToken,
      tokens: result.tokens,
    },
    'Sign in successful.'
  )
}

export const logout = async (req: Request, res: Response): Promise<void> => {
  const { maxAge, ...clearOptions } = COOKIE_OPTIONS
  res.clearCookie('refreshToken', clearOptions)
  res.clearCookie('accessToken', clearOptions)
  ApiResponse.success(res, { loggedOut: true }, 'Signed out successfully.')
}

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const incoming = req.body.refreshToken || req.cookies.refreshToken

  if (!incoming) {
    throw AppError.unauthorized('Refresh token is required.')
  }

  const tokens = await AuthService.refreshTokens(incoming)
  res.cookie('refreshToken', tokens.refreshToken, COOKIE_OPTIONS)

  ApiResponse.success(res, tokens, 'Tokens refreshed successfully.')
}

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body
  const result = await AuthService.forgotPassword(email)
  ApiResponse.success(res, result, 'Password reset instructions dispatched.')
}

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token, newPassword } = req.body
  await AuthService.resetPassword(token, newPassword)
  ApiResponse.success(res, { reset: true }, 'Password reset successfully. You may now sign in.')
}

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const { email, code } = req.body
  await AuthService.verifyEmail(email, code)
  ApiResponse.success(res, { verified: true }, 'Work email verified successfully.')
}

export const getMe = async (req: Request, res: Response): Promise<void> => {
  if (!req.user) {
    throw AppError.unauthorized('Not authenticated.')
  }

  const user = await AuthService.findUserById(req.user.userId)
  if (!user) {
    throw AppError.notFound('User profile not found.')
  }

  const sanitized = {
    id: user._id?.toString() || user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatarUrl: user.avatarUrl || '',
    status: user.status || 'active',
    organizationId: user.organizationId,
    workspaceId: user.workspaceId,
    isEmailVerified: user.isEmailVerified,
    preferences: user.preferences,
    createdAt: user.createdAt,
  }

  ApiResponse.success(res, sanitized, 'Current user profile retrieved.')
}
