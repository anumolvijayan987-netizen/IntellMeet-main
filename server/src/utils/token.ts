import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import { env } from '../config/env'

export interface TokenPayload {
  userId: string
  email: string
  role: string
  organizationId?: string
  workspaceId?: string
}

export interface GeneratedTokens {
  accessToken: string
  refreshToken: string
}

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10)
  return bcrypt.hash(password, salt)
}

export const comparePassword = async (
  password: string,
  hashed: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashed)
}

export const generateAccessToken = (payload: TokenPayload): string => {
  return jwt.sign(payload, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as any,
  })
}

export const generateTokens = (payload: TokenPayload): GeneratedTokens => {
  const accessToken = generateAccessToken(payload)

  const refreshToken = jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.JWT_REFRESH_EXPIRES_IN as any,
  })

  return { accessToken, refreshToken }
}

export const verifyAccessToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_SECRET) as TokenPayload
}

export const verifyRefreshToken = (token: string): TokenPayload => {
  return jwt.verify(token, env.JWT_REFRESH_SECRET) as TokenPayload
}
