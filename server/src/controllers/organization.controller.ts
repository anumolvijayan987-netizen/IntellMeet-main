import { Request, Response } from 'express'
import { Organization } from '../models/Organization.model'
import { Workspace } from '../models/Workspace.model'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'
import { db } from '../config/db'

export const createOrganization = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const { name, slug, tier } = req.body

  if (db.isConnected()) {
    const existing = await Organization.findOne({ slug })
    if (existing) {
      throw AppError.conflict('An organization with this slug already exists.')
    }

    const org = new Organization({
      name,
      slug,
      ownerId: userId,
      tier: tier || 'pro',
    })
    const saved = await org.save()

    // Create default workspace
    const workspace = new Workspace({
      organizationId: saved._id,
      name: 'General Workspace',
      slug: 'general',
      defaultRole: 'owner',
    })
    await workspace.save()

    ApiResponse.created(res, { organization: saved, workspace }, 'Organization created.')
    return
  }

  const mockOrg = {
    _id: `org_${Date.now()}`,
    name,
    slug,
    ownerId: userId,
    tier: tier || 'pro',
    createdAt: new Date(),
  }

  ApiResponse.created(res, mockOrg, 'Organization created successfully.')
}

export const getOrganization = async (req: Request, res: Response): Promise<void> => {
  const orgId = req.params.id || req.user?.organizationId
  if (!orgId) {
    throw AppError.badRequest('Organization ID is required.')
  }

  if (db.isConnected()) {
    const org = await Organization.findById(orgId).lean()
    if (!org) throw AppError.notFound('Organization not found.')
    ApiResponse.success(res, org, 'Organization details retrieved.')
    return
  }

  ApiResponse.success(
    res,
    { _id: orgId, name: 'Acme Corporation', slug: 'acme', tier: 'enterprise' },
    'Organization retrieved.'
  )
}
