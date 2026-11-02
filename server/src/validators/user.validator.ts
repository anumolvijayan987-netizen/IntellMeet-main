import { z } from 'zod'

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    avatarUrl: z.string().url().optional().or(z.literal('')),
    status: z.enum(['active', 'away', 'busy', 'offline']).optional(),
  }),
})

export const updatePreferencesSchema = z.object({
  body: z.object({
    theme: z.enum(['light', 'dark', 'system']).optional(),
    defaultMicEnabled: z.boolean().optional(),
    defaultCamEnabled: z.boolean().optional(),
    transcriptionLanguage: z.string().optional(),
  }),
})

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z
      .string()
      .min(8, 'New password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least 1 number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
  }),
})
