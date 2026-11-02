import { z } from 'zod'

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(100),
    email: z.string().email('Please enter a valid work email address').toLowerCase(),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least 1 number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
    company: z.string().optional().default('Personal Workspace'),
    role: z
      .enum(['super_admin', 'org_admin', 'meeting_host', 'member', 'guest'])
      .optional()
      .default('member'),
  }),
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase(),
    password: z.string().min(1, 'Password is required'),
  }),
})

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address').toLowerCase(),
  }),
})

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email().optional(),
    token: z.string().min(6, 'Reset token is required'),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/\d/, 'Password must contain at least 1 number')
      .regex(/[!@#$%^&*(),.?":{}|<>]/, 'Password must contain at least 1 special character'),
  }),
})

export const verifyEmailSchema = z.object({
  body: z.object({
    email: z.string().email().toLowerCase(),
    code: z.string().length(6, 'Verification code must be 6 digits'),
  }),
})

export const refreshTokenSchema = z.object({
  body: z
    .object({
      refreshToken: z.string().optional(),
    })
    .optional(),
})
