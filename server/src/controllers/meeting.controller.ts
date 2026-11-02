import { Request, Response } from 'express'
import { MeetingService } from '../services/meeting.service'
import { SfuService } from '../services/sfu.service'
import { ApiResponse } from '../utils/apiResponse'
import { AppError } from '../utils/appError'

export const getMeetings = async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 20
  const meetings = await MeetingService.getRecentMeetings(limit)
  ApiResponse.success(res, meetings, 'Meetings retrieved successfully')
}

export const getMeetingByRoom = async (req: Request, res: Response): Promise<void> => {
  const roomId = String(req.params.roomId)
  const meeting = await MeetingService.getMeetingByRoomId(roomId)

  if (!meeting) {
    throw AppError.notFound(`No meeting found with room ID: ${roomId}`)
  }

  ApiResponse.success(res, meeting, 'Meeting details retrieved')
}

export const saveMeeting = async (req: Request, res: Response): Promise<void> => {
  const meeting = await MeetingService.saveMeeting(req.body)
  ApiResponse.created(res, meeting, 'Meeting record saved successfully')
}

export const createMeeting = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'usr_host'
  const userName = req.user?.email.split('@')[0] || req.body.hostName || 'Lead Host'
  const { title, isPrivate, passcode, workspaceId } = req.body

  const meeting = await MeetingService.createMeeting({
    title,
    hostId: userId,
    hostName: userName,
    isPrivate,
    passcode,
    workspaceId: workspaceId || req.user?.workspaceId,
  })

  const protocol = req.protocol || 'http'
  const host = req.get('host') || 'localhost:5173'
  const inviteUrl = `${protocol}://${host}/room/${meeting.roomId}`

  ApiResponse.created(
    res,
    {
      ...meeting,
      inviteUrl,
    },
    'Meeting room initialized successfully.'
  )
}

export const scheduleMeeting = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.userId || 'usr_host'
  const userName = req.user?.email.split('@')[0] || req.body.hostName || 'Lead Host'

  const scheduled = await MeetingService.scheduleMeeting({
    ...req.body,
    hostId: userId,
    hostName: userName,
    workspaceId: req.body.workspaceId || req.user?.workspaceId,
  })

  const protocol = req.protocol || 'http'
  const host = req.get('host') || 'localhost:5173'
  const inviteUrl = `${protocol}://${host}/room/${scheduled.roomId}`

  ApiResponse.created(
    res,
    {
      ...scheduled,
      inviteUrl,
    },
    'Meeting scheduled successfully.'
  )
}

export const updateMeeting = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  if (!req.body || Object.keys(req.body).length === 0) {
    throw AppError.badRequest('Meeting update payload cannot be empty.')
  }
  const updated = await MeetingService.updateMeeting(id, req.body)
  ApiResponse.success(res, updated, 'Meeting schedule updated.')
}

export const cancelMeeting = async (req: Request, res: Response): Promise<void> => {
  const id = String(req.params.id)
  const cancelled = await MeetingService.cancelMeeting(id)
  ApiResponse.success(res, cancelled, 'Meeting cancelled successfully.')
}

export const getUpcomingMeetings = async (req: Request, res: Response): Promise<void> => {
  const workspaceId = req.query.workspaceId as string | undefined
  const upcoming = await MeetingService.getUpcomingMeetings(workspaceId)
  ApiResponse.success(res, upcoming, 'Upcoming meetings retrieved.')
}

export const getMeetingHistory = async (req: Request, res: Response): Promise<void> => {
  const { search, status, startDate, endDate, sort, page, limit, workspaceId } = req.query

  const history = await MeetingService.getMeetingHistory({
    search: search ? String(search) : undefined,
    status: status ? String(status) : undefined,
    startDate: startDate ? String(startDate) : undefined,
    endDate: endDate ? String(endDate) : undefined,
    sort: sort ? String(sort) : undefined,
    page: page ? Number(page) : undefined,
    limit: limit ? Number(limit) : undefined,
    workspaceId: workspaceId ? String(workspaceId) : undefined,
  })

  ApiResponse.success(res, history, 'Meeting history archive retrieved.')
}

export const validateMeetingAccess = async (req: Request, res: Response): Promise<void> => {
  const roomId = String(req.params.roomId)
  const userId = req.user?.userId

  const access = await MeetingService.validateMeetingAccess(roomId, userId)
  if (!access || !access.meeting) {
    throw AppError.notFound(`No meeting found with room ID: ${roomId}`)
  }

  ApiResponse.success(res, access, 'Meeting room validated.')
}

export const getSfuToken = async (req: Request, res: Response): Promise<void> => {
  const roomId = String(req.params.roomId)
  const identity = req.user?.userId || (req.query.identity as string) || `user_${Date.now()}`
  const name = req.user?.email.split('@')[0] || (req.query.name as string) || 'Attendee'
  const isHost = req.user?.role === 'super_admin' || req.user?.role === 'org_admin' || req.user?.role === 'meeting_host'

  const credentials = await SfuService.generateToken({
    roomId,
    identity,
    name,
    isHost,
  })

  ApiResponse.success(res, credentials, 'SFU credentials issued.')
}

export const endMeeting = async (req: Request, res: Response): Promise<void> => {
  const roomId = String(req.params.roomId)
  const userId = req.user?.userId

  const result = await MeetingService.endMeeting(roomId, userId)
  ApiResponse.success(res, result, 'Meeting concluded for all participants.')
}
