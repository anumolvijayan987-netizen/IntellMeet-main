import { Router } from 'express'
import {
  createOrganization,
  getOrganization,
} from '../controllers/organization.controller'
import { authenticate, requireRole } from '../middleware/auth.middleware'
import { validate } from '../middleware/validate.middleware'
import { createOrgSchema } from '../validators/organization.validator'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()

router.use(authenticate)

router.post('/', validate(createOrgSchema), asyncHandler(createOrganization))
router.get('/:id?', asyncHandler(getOrganization))

export default router
