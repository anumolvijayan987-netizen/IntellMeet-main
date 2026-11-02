import { User, IUserDocument } from '../models/User.model'
import { Organization } from '../models/Organization.model'
import { Workspace } from '../models/Workspace.model'
import { WorkspaceMember } from '../models/WorkspaceMember.model'
import { AppError } from '../utils/appError'
import {
  hashPassword,
  comparePassword,
  generateTokens,
  verifyRefreshToken,
  GeneratedTokens,
  TokenPayload,
} from '../utils/token'
import { db } from '../config/db'
import { logger } from '../utils/logger'

export interface RegisterDTO {
  name: string
  email: string
  password: string
  company?: string
  role?: string
}

export interface LoginResult {
  user: {
    id: string
    name: string
    email: string
    role: string
    avatarUrl?: string
    status: string
    isEmailVerified: boolean
    organizationId?: string
    workspaceId?: string
  }
  tokens: GeneratedTokens
}

export class AuthService {
  // In-memory fallback user store when MongoDB is offline
  private static inMemoryUsers: Map<string, any> = new Map()

  public static async register(data: RegisterDTO): Promise<LoginResult> {
    const existingUser = await this.findUserByEmail(data.email)
    if (existingUser) {
      throw AppError.conflict('An account with this email address already exists.')
    }

    const hashedPassword = await hashPassword(data.password)
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()

    let savedUser: any

    if (db.isConnected()) {
      try {
        // 1. Create Organization
        const orgSlug = (data.company || `${data.name}'s Org`)
          .toLowerCase()
          .replace(/[^a-z0-9]/g, '-')
          .slice(0, 30)

        // Pre-generate User ID
        const newUser = new User({
          name: data.name,
          email: data.email,
          passwordHash: hashedPassword,
          role: data.role || 'member',
          verificationCode,
          verificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000),
          isEmailVerified: true,
          status: 'active',
        })

        const org = new Organization({
          name: data.company || `${data.name}'s Organization`,
          slug: `${orgSlug}-${Date.now().toString().slice(-4)}`,
          ownerId: newUser._id,
          tier: 'pro',
        })
        await org.save()

        // 2. Create Workspace
        const workspace = new Workspace({
          organizationId: org._id,
          name: 'General Workspace',
          slug: 'general',
          defaultRole: 'owner',
        })
        await workspace.save()

        // 3. Link Organization and Workspace to User
        newUser.organizationId = org._id as any
        newUser.workspaceId = workspace._id as any
        savedUser = await newUser.save()

        // 4. Add Membership
        const member = new WorkspaceMember({
          workspaceId: workspace._id,
          userId: savedUser._id,
          role: 'owner',
        })
        await member.save()
      } catch (err: unknown) {
        logger.warn('Failed to write to MongoDB, utilizing in-memory store:', {
          error: (err as Error).message,
        })
      }
    }

    if (!savedUser) {
      // In-Memory Fallback creation
      const mockId = `usr_${Date.now()}`
      const mockOrgId = `org_${Date.now()}`
      const mockWsId = `ws_${Date.now()}`

      savedUser = {
        _id: mockId,
        id: mockId,
        name: data.name,
        email: data.email,
        passwordHash: hashedPassword,
        role: data.role || 'member',
        organizationId: mockOrgId,
        workspaceId: mockWsId,
        isEmailVerified: true,
        verificationCode,
        status: 'active',
        preferences: {
          theme: 'light',
          defaultMicEnabled: true,
          defaultCamEnabled: true,
          transcriptionLanguage: 'en-US',
        },
        createdAt: new Date(),
      }

      this.inMemoryUsers.set(data.email.toLowerCase(), savedUser)
    }

    const payload: TokenPayload = {
      userId: savedUser._id?.toString() || savedUser.id,
      email: savedUser.email,
      role: savedUser.role,
      organizationId: savedUser.organizationId?.toString(),
      workspaceId: savedUser.workspaceId?.toString(),
    }

    const tokens = generateTokens(payload)

    return {
      user: {
        id: payload.userId,
        name: savedUser.name,
        email: savedUser.email,
        role: savedUser.role,
        avatarUrl: savedUser.avatarUrl || '',
        status: savedUser.status || 'active',
        isEmailVerified: savedUser.isEmailVerified,
        organizationId: payload.organizationId,
        workspaceId: payload.workspaceId,
      },
      tokens,
    }
  }

  public static async login(email: string, password: string): Promise<LoginResult> {
    const user = await this.findUserByEmail(email, true)

    if (!user) {
      throw AppError.unauthorized('Invalid work email or password credentials.')
    }

    const isMatch = await comparePassword(password, user.passwordHash)
    if (!isMatch) {
      throw AppError.unauthorized('Invalid work email or password credentials.')
    }

    const userId = user._id?.toString() || user.id
    const payload: TokenPayload = {
      userId,
      email: user.email,
      role: user.role,
      organizationId: user.organizationId?.toString(),
      workspaceId: user.workspaceId?.toString(),
    }

    const tokens = generateTokens(payload)

    // Update lastLoginAt
    if (db.isConnected()) {
      try {
        await User.findByIdAndUpdate(userId, { lastLoginAt: new Date() })
      } catch {
        // Ignore
      }
    }

    return {
      user: {
        id: userId,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl || '',
        status: user.status || 'active',
        isEmailVerified: user.isEmailVerified,
        organizationId: payload.organizationId,
        workspaceId: payload.workspaceId,
      },
      tokens,
    }
  }

  public static async refreshTokens(incomingRefreshToken: string): Promise<GeneratedTokens> {
    try {
      const decoded = verifyRefreshToken(incomingRefreshToken)
      const user = await this.findUserById(decoded.userId)

      if (!user) {
        throw AppError.unauthorized('User associated with session not found.')
      }

      const payload: TokenPayload = {
        userId: user._id?.toString() || user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId?.toString(),
        workspaceId: user.workspaceId?.toString(),
      }

      return generateTokens(payload)
    } catch {
      throw AppError.unauthorized('Invalid or expired refresh token. Please sign in again.')
    }
  }

  public static async forgotPassword(email: string): Promise<{ message: string; token: string }> {
    const user = await this.findUserByEmail(email)
    const resetToken = Math.random().toString(36).substring(2, 8).toUpperCase()

    if (user) {
      if (db.isConnected()) {
        try {
          await User.findOneAndUpdate(
            { email },
            {
              resetPasswordToken: resetToken,
              resetPasswordExpires: new Date(Date.now() + 3600000), // 1 hour
            }
          )
        } catch {
          // Fallback
        }
      } else {
        const memUser = this.inMemoryUsers.get(email.toLowerCase())
        if (memUser) {
          memUser.resetPasswordToken = resetToken
          memUser.resetPasswordExpires = new Date(Date.now() + 3600000)
        }
      }
    }

    return {
      message: 'If the email is registered, password recovery instructions have been dispatched.',
      token: resetToken,
    }
  }

  public static async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedPassword = await hashPassword(newPassword)
    let updated = false

    if (db.isConnected()) {
      try {
        const user = await User.findOneAndUpdate(
          {
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: new Date() },
          },
          {
            passwordHash: hashedPassword,
            resetPasswordToken: undefined,
            resetPasswordExpires: undefined,
          }
        )
        if (user) updated = true
      } catch {
        // Fallback
      }
    }

    if (!updated) {
      for (const [_, u] of this.inMemoryUsers) {
        if (u.resetPasswordToken === token && u.resetPasswordExpires > new Date()) {
          u.passwordHash = hashedPassword
          u.resetPasswordToken = undefined
          updated = true
          break
        }
      }
    }

    if (!updated) {
      throw AppError.badRequest('Invalid or expired reset token.')
    }
  }

  public static async verifyEmail(email: string, code: string): Promise<boolean> {
    if (db.isConnected()) {
      try {
        const user = await User.findOneAndUpdate(
          { email, verificationCode: code },
          { isEmailVerified: true, verificationCode: undefined }
        )
        if (user) return true
      } catch {
        // Fallback
      }
    }

    const memUser = this.inMemoryUsers.get(email.toLowerCase())
    if (memUser) {
      memUser.isEmailVerified = true
      return true
    }

    return true // Dev grace
  }

  public static async findUserByEmail(email: string, includePassword = false): Promise<any> {
    if (db.isConnected()) {
      try {
        const query = User.findOne({ email })
        if (includePassword) query.select('+passwordHash')
        const user = await query.exec()
        if (user) return user
      } catch {
        // Fallback
      }
    }

    return this.inMemoryUsers.get(email.toLowerCase()) || null
  }

  public static async findUserById(id: string): Promise<any> {
    if (db.isConnected()) {
      try {
        const user = await User.findById(id).lean()
        if (user) return user
      } catch {
        // Fallback
      }
    }

    for (const [_, u] of this.inMemoryUsers) {
      if (u._id === id || u.id === id) return u
    }

    return null
  }
}
