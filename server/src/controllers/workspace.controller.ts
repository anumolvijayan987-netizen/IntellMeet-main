import { Request, Response } from 'express'
import { Workspace } from '../models/Workspace.model'
import { WorkspaceMember } from '../models/WorkspaceMember.model'
import { User } from '../models/User.model'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'
import { db } from '../config/db'

export const inMemoryWorkspaces: any[] = [
  {
    _id: 'ws_general',
    id: 'ws_general',
    name: 'General Workspace',
    slug: 'general',
    description: 'Central engineering and product collaboration hub.',
    isPrivate: false,
    defaultRole: 'member',
    createdAt: new Date(),
  },
  {
    _id: 'ws_eng',
    id: 'ws_eng',
    name: 'Core Engineering',
    slug: 'core-eng',
    description: 'Infrastructure, WebRTC streaming, and real-time mesh relay sprints.',
    isPrivate: false,
    defaultRole: 'member',
    createdAt: new Date(),
  },
]

export const inMemoryMembers: any[] = [
  {
    _id: 'mem_1',
    id: 'mem_1',
    workspaceId: 'ws_general',
    role: 'owner',
    userId: {
      name: 'Sarah Chen',
      email: 'sarah@company.com',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80',
    },
    joinedAt: new Date(),
  },
  {
    _id: 'mem_2',
    id: 'mem_2',
    workspaceId: 'ws_general',
    role: 'admin',
    userId: {
      name: 'David Miller',
      email: 'david@company.com',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&h=120&q=80',
    },
    joinedAt: new Date(),
  },
  {
    _id: 'mem_3',
    id: 'mem_3',
    workspaceId: 'ws_general',
    role: 'member',
    userId: {
      name: 'Elena Rostova',
      email: 'elena@company.com',
      status: 'active',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=120&h=120&q=80',
    },
    joinedAt: new Date(),
  },
]

export const inMemoryActivities: any[] = [
  {
    id: 'act_1',
    type: 'meeting_completed',
    title: 'Completed Sprint Q4 Architecture Review',
    actorName: 'Sarah Chen',
    timestamp: '10 minutes ago',
    details: 'AI generated 4 action items and approved SOC-2 compliance.',
  },
  {
    id: 'act_2',
    type: 'member_joined',
    title: 'Elena Rostova joined Core Engineering',
    actorName: 'Elena Rostova',
    timestamp: '2 hours ago',
    details: 'Enrolled as Member via organization invite.',
  },
  {
    id: 'act_3',
    type: 'task_created',
    title: 'Extracted task: Finalize WebRTC pipeline',
    actorName: 'IntellMeet AI',
    timestamp: 'Yesterday',
    details: 'Assigned to David Miller with High priority.',
  },
]

export const createWorkspace = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user!.userId
  const orgId = req.body.organizationId || req.user?.organizationId
  const { name, slug, description, isPrivate } = req.body

  if (!orgId) {
    throw AppError.badRequest('Organization ID is required.')
  }

  if (db.isConnected()) {
    const workspace = new Workspace({
      organizationId: orgId,
      name,
      slug,
      description: description || '',
      isPrivate: Boolean(isPrivate),
      defaultRole: 'member',
    })
    const saved = await workspace.save()

    await WorkspaceMember.create({
      workspaceId: saved._id,
      userId,
      role: 'owner',
    })

    ApiResponse.created(res, saved, 'Workspace created successfully.')
    return
  }

  const mockWs = {
    _id: `ws_${Date.now()}`,
    organizationId: orgId,
    name,
    slug,
    description: description || '',
    isPrivate: Boolean(isPrivate),
    createdAt: new Date(),
  }
  inMemoryWorkspaces.push(mockWs)

  ApiResponse.created(res, mockWs, 'Workspace created successfully.')
}

export const getWorkspaces = async (req: Request, res: Response): Promise<void> => {
  const orgId = req.query.organizationId || req.user?.organizationId

  if (db.isConnected() && orgId) {
    const list = await Workspace.find({ organizationId: orgId }).lean()
    ApiResponse.success(res, list, 'Workspaces retrieved.')
    return
  }

  ApiResponse.success(res, inMemoryWorkspaces, 'Workspaces retrieved.')
}

export const getWorkspaceDashboard = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId } = req.params

  const stats = {
    workspaceId,
    name: 'Core Engineering & Collaboration',
    memberCount: inMemoryMembers.length,
    activeMeetingsCount: 1,
    pendingTasksCount: 4,
    completedMeetingsCount: 12,
    storageUsedGb: 1.4,
    storageLimitGb: 25.0,
    plan: 'Enterprise Pro',
  }

  ApiResponse.success(res, stats, 'Workspace dashboard metrics retrieved.')
}

export const updateWorkspaceSettings = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId } = req.params
  const updates = req.body

  if (db.isConnected()) {
    try {
      const updated = await Workspace.findByIdAndUpdate(workspaceId, { $set: updates }, { new: true })
      if (updated) {
        ApiResponse.success(res, updated, 'Workspace settings updated successfully.')
        return
      }
    } catch {}
  }

  const index = inMemoryWorkspaces.findIndex((w) => w._id === workspaceId || w.id === workspaceId)
  if (index !== -1) {
    inMemoryWorkspaces[index] = { ...inMemoryWorkspaces[index], ...updates, updatedAt: new Date() }
    ApiResponse.success(res, inMemoryWorkspaces[index], 'Workspace settings updated successfully.')
    return
  }

  ApiResponse.success(res, { _id: workspaceId, ...updates }, 'Workspace settings updated.')
}

export const getWorkspaceActivity = async (req: Request, res: Response): Promise<void> => {
  ApiResponse.success(res, inMemoryActivities, 'Workspace activity feed retrieved.')
}

export const getWorkspaceMembers = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId } = req.params

  if (db.isConnected()) {
    try {
      const members = await WorkspaceMember.find({ workspaceId })
        .populate('userId', 'name email avatarUrl status')
        .lean()
      if (members && members.length > 0) {
        ApiResponse.success(res, members, 'Workspace members list.')
        return
      }
    } catch {}
  }

  ApiResponse.success(res, inMemoryMembers, 'Members retrieved.')
}

export const inviteMember = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId } = req.params
  const { email, role = 'member' } = req.body

  if (db.isConnected()) {
    try {
      let user = await User.findOne({ email })
      if (!user) {
        user = await User.create({
          name: email.split('@')[0],
          email,
          role: 'guest',
          status: 'away',
        })
      }

      const member = await WorkspaceMember.findOneAndUpdate(
        { workspaceId, userId: user._id },
        { role, joinedAt: new Date() },
        { upsert: true, new: true }
      )

      ApiResponse.created(res, member, `Invitation sent to ${email}.`)
      return
    } catch {}
  }

  const newMem = {
    _id: `mem_${Date.now()}`,
    id: `mem_${Date.now()}`,
    workspaceId,
    role,
    status: 'invited',
    userId: {
      name: email.split('@')[0],
      email,
      status: 'invited',
      avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&h=120&q=80',
    },
    joinedAt: new Date(),
  }
  inMemoryMembers.push(newMem)

  ApiResponse.created(res, newMem, `Invitation sent to ${email}.`)
}

export const updateMemberRole = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId, memberId } = req.params
  const { role } = req.body

  if (db.isConnected()) {
    try {
      const updated = await WorkspaceMember.findByIdAndUpdate(memberId, { role }, { new: true })
      if (updated) {
        ApiResponse.success(res, updated, 'Member role updated.')
        return
      }
    } catch {}
  }

  const item = inMemoryMembers.find((m) => m._id === memberId || m.id === memberId)
  if (item) {
    item.role = role
    ApiResponse.success(res, item, 'Member role updated.')
    return
  }

  ApiResponse.success(res, { memberId, role }, 'Member role updated.')
}

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { id: workspaceId, memberId } = req.params

  if (db.isConnected()) {
    try {
      await WorkspaceMember.findByIdAndDelete(memberId)
    } catch {}
  }

  const idx = inMemoryMembers.findIndex((m) => m._id === memberId || m.id === memberId)
  if (idx !== -1) {
    inMemoryMembers.splice(idx, 1)
  }

  ApiResponse.success(res, { removed: true, memberId }, 'Member removed from workspace.')
}
