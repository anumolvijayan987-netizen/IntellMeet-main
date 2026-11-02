import { z } from 'zod'

export const createOrgSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(100),
    slug: z.string().min(2).max(50).toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric and dashes'),
    tier: z.enum(['starter', 'pro', 'enterprise']).optional().default('pro'),
  }),
})

export const createWorkspaceSchema = z.object({
  body: z.object({
    organizationId: z.string().optional(),
    name: z.string().min(2).max(80),
    slug: z.string().min(2).max(50).toLowerCase().regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase alphanumeric and dashes'),
    description: z.string().max(300).optional().default(''),
    isPrivate: z.boolean().optional().default(false),
  }),
})

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z.string().email('Please enter a valid email address'),
    role: z.enum(['owner', 'admin', 'member', 'guest']).default('member'),
  }),
})
