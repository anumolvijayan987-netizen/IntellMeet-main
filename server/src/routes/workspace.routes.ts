import { Router } from 'express'
import {
  createWorkspace,
  getWorkspaces,
  getWorkspaceDashboard,
  updateWorkspaceSettings,
  getWorkspaceActivity,
  getWorkspaceMembers,
  inviteMember,
  updateMemberRole,
  removeMember,
} from '../controllers/workspace.controller'
import { asyncHandler } from '../utils/asyncHandler'
import { authenticate, requireRole } from '../middleware/auth.middleware'

const router = Router()

router.use(authenticate)

router.get('/', asyncHandler(getWorkspaces))
router.post('/', requireRole('super_admin', 'org_admin'), asyncHandler(createWorkspace))
router.get('/:id/dashboard', asyncHandler(getWorkspaceDashboard))
router.get('/:id/activity', asyncHandler(getWorkspaceActivity))
router.patch('/:id', asyncHandler(updateWorkspaceSettings))
router.get('/:id/members', asyncHandler(getWorkspaceMembers))
router.post('/:id/members', requireRole('super_admin', 'org_admin'), asyncHandler(inviteMember))
router.patch('/:id/members/:memberId', requireRole('super_admin', 'org_admin'), asyncHandler(updateMemberRole))
router.delete('/:id/members/:memberId', requireRole('super_admin', 'org_admin'), asyncHandler(removeMember))

export default router
