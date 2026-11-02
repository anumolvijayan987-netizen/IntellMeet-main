import { Request, Response } from 'express'
import { User } from '../models/User.model'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'
import { hashPassword, comparePassword } from '../utils/token'
import { AuthService } from '../services/auth.service'
import { db } from '../config/db'

export const getUserProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const user = await AuthService.findUserById(userId)

  if (!user) {
    throw AppError.notFound('User profile not found.')
  }

  ApiResponse.success(res, user, 'Profile retrieved.')
}

export const updateUserProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { name, avatarUrl, status } = req.body

  if (db.isConnected()) {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { ...(name && { name }), ...(avatarUrl !== undefined && { avatarUrl }), ...(status && { status }) } },
      { new: true }
    )
    ApiResponse.success(res, updated, 'Profile updated successfully.')
    return
  }

  const user = await AuthService.findUserById(userId)
  if (user) {
    if (name) user.name = name
    if (avatarUrl !== undefined) user.avatarUrl = avatarUrl
    if (status) user.status = status
  }

  ApiResponse.success(res, user, 'Profile updated successfully.')
}

export const uploadAvatar = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId

  if (!req.file) {
    throw AppError.badRequest('No image file uploaded.')
  }

  // Convert buffer to data URL representation for robust local/cloud preview
  const base64Image = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`

  if (db.isConnected()) {
    await User.findByIdAndUpdate(userId, { avatarUrl: base64Image })
  } else {
    const user = await AuthService.findUserById(userId)
    if (user) user.avatarUrl = base64Image
  }

  ApiResponse.success(res, { avatarUrl: base64Image }, 'Avatar uploaded successfully.')
}

export const updatePreferences = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const preferences = req.body

  if (db.isConnected()) {
    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: { preferences } },
      { new: true }
    )
    ApiResponse.success(res, updated?.preferences, 'Preferences updated.')
    return
  }

  const user = await AuthService.findUserById(userId)
  if (user) {
    user.preferences = { ...user.preferences, ...preferences }
  }

  ApiResponse.success(res, user?.preferences || preferences, 'Preferences updated.')
}

export const changePassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { currentPassword, newPassword } = req.body

  const user = await AuthService.findUserById(userId)
  if (!user) {
    throw AppError.notFound('User not found.')
  }

  // Verify current password
  const isMatch = await comparePassword(currentPassword, user.passwordHash)
  if (!isMatch) {
    throw AppError.badRequest('Current password verification failed.')
  }

  const hashed = await hashPassword(newPassword)

  if (db.isConnected()) {
    await User.findByIdAndUpdate(userId, { passwordHash: hashed })
  } else {
    user.passwordHash = hashed
  }

  ApiResponse.success(res, { updated: true }, 'Password changed successfully.')
}

export const updateStatus = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { status } = req.body

  if (db.isConnected()) {
    await User.findByIdAndUpdate(userId, { status })
  } else {
    const user = await AuthService.findUserById(userId)
    if (user) user.status = status
  }

  ApiResponse.success(res, { status }, 'Status presence updated.')
}
