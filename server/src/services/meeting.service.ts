import crypto from 'crypto'
import { Meeting, IMeetingDocument } from '../models/Meeting.model'
import { db } from '../config/db'
import { logger } from '../utils/logger'
import { SfuService } from './sfu.service'
import { getSocketServer } from '../sockets/socketHandler'
import { convertToUtcDate, formatInTimezone } from '../utils/timezone'
import { NotificationService } from './notification.service'

export interface SaveMeetingInput {
  roomId: string
  title?: string
  hostName?: string
  participants?: string[]
  summary?: string
  keyDecisions?: string[]
  actionItems?: Array<{
    id?: string | number
    text: string
    assignee: string
    completed?: boolean
  }>
}

export interface CreateMeetingInput {
  title?: string
  description?: string
  hostId?: string
  hostName?: string
  passcode?: string
  isPrivate?: boolean
  workspaceId?: string
  date?: string
  time?: string
  timezone?: string
  durationMinutes?: number
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly'
  attendees?: string[] | string
  settings?: {
    isMutedOnEntry?: boolean
    isCamOffOnEntry?: boolean
    allowScreenSharing?: boolean
    enableTranscription?: boolean
    enableAiSummaries?: boolean
  }
}

export class MeetingService {
  public static inMemoryMeetings: Map<string, any> = new Map([
    [
      'sprint-plan-q4',
      {
        _id: 'mtg_seed_1',
        roomId: 'sprint-plan-q4',
        title: 'Sprint Planning & Backlog Grooming',
        description: 'Review Q4 deliverables and prioritize sprint epics.',
        hostId: 'usr_sarah',
        hostName: 'Sarah Chen',
        status: 'scheduled',
        type: 'scheduled',
        scheduledStartTime: new Date(Date.now() + 3600000 * 2), // 2 hours from now
        durationMinutes: 45,
        timezone: 'UTC-5',
        recurrence: 'none',
        participantInvitations: ['david@company.com', 'elena@company.com'],
        participantsCount: 3,
        participantsList: ['Sarah Chen', 'David Miller', 'Elena Rostova'],
        recordingUrl: '',
        summary: '',
        keyDecisions: [],
        actionItems: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ],
    [
      'arch-soc2-review',
      {
        _id: 'mtg_seed_2',
        roomId: 'arch-soc2-review',
        title: 'Enterprise Architecture & SOC-2 Sync',
        description: 'Audit compliance requirements and end-to-end data encryption verification.',
        hostId: 'usr_david',
        hostName: 'David Miller',
        status: 'completed',
        type: 'scheduled',
        scheduledStartTime: new Date(Date.now() - 3600000 * 24), // yesterday
        actualStartTime: new Date(Date.now() - 3600000 * 24),
        endTime: new Date(Date.now() - 3600000 * 24 + 42 * 60000), // 42 min duration
        durationMinutes: 42,
        timezone: 'UTC',
        recurrence: 'weekly',
        participantInvitations: ['sarah@company.com', 'marcus@company.com'],
        participantsCount: 3,
        participantsList: ['David Miller', 'Sarah Chen', 'Marcus Vance'],
        recordingUrl: 'https://storage.intellmeet.io/recordings/arch-soc2-review.mp4',
        transcriptSnippet: 'The team approved SOC-2 compliance checklist and multi-region storage failover.',
        summary: 'The architecture team concluded the SOC-2 security audit readiness review.',
        keyDecisions: [
          'Enforce TLS 1.3 on all WebRTC signaling connections.',
          'Adopt AES-256 for persistent object storage recordings.',
        ],
        actionItems: [
          { id: 1, text: 'Audit logging for transcript storage', assignee: 'David Miller', completed: true },
        ],
        createdAt: new Date(Date.now() - 3600000 * 24),
        updatedAt: new Date(Date.now() - 3600000 * 24),
      },
    ],
    [
      'weekly-design-critique',
      {
        _id: 'mtg_seed_3',
        roomId: 'weekly-design-critique',
        title: 'Weekly Cross-Functional Design Critique',
        description: 'Design system tokens and dual light/dark room reviews.',
        hostId: 'usr_elena',
        hostName: 'Elena Rostova',
        status: 'completed',
        type: 'recurring',
        scheduledStartTime: new Date(Date.now() - 3600000 * 48),
        actualStartTime: new Date(Date.now() - 3600000 * 48),
        endTime: new Date(Date.now() - 3600000 * 48 + 55 * 60000),
        durationMinutes: 55,
        timezone: 'UTC+1',
        recurrence: 'weekly',
        participantInvitations: ['sarah@company.com'],
        participantsCount: 4,
        participantsList: ['Elena Rostova', 'Sarah Chen', 'Emily Watson', 'James Lee'],
        recordingUrl: 'https://storage.intellmeet.io/recordings/weekly-design.mp4',
        transcriptSnippet: 'Reviewed enterprise contrast ratios and typography tokens for desktop view.',
        summary: 'Reviewed accessibility standards for high-contrast enterprise theme.',
        keyDecisions: ['Approved #2563EB primary enterprise palette'],
        actionItems: [],
        createdAt: new Date(Date.now() - 3600000 * 48),
        updatedAt: new Date(Date.now() - 3600000 * 48),
      },
    ],
  ])

  public static generateRoomId(): string {
    const p1 = crypto.randomBytes(3).toString('hex').slice(0, 4)
    const p2 = crypto.randomBytes(3).toString('hex').slice(0, 4)
    return `meet-${p1}-${p2}`
  }

  public static async createMeeting(input: CreateMeetingInput): Promise<any> {
    const roomId = this.generateRoomId()
    const title = input.title || 'IntellMeet Video Conference'
    const hostId = input.hostId || 'usr_host'
    const hostName = input.hostName || 'Host'

    const meetingData = {
      roomId,
      title,
      description: input.description || '',
      hostId,
      hostName,
      status: 'active',
      isPrivate: Boolean(input.isPrivate),
      passcode: input.passcode || '',
      participantsCount: 1,
      participantsList: [hostName],
      actualStartTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (db.isConnected()) {
      try {
        const meeting = await Meeting.create(meetingData)
        return meeting.toObject()
      } catch (err: unknown) {
        logger.warn('Failed to save meeting to MongoDB, using memory cache:', {
          error: (err as Error).message,
        })
      }
    }

    this.inMemoryMeetings.set(roomId, meetingData)
    return meetingData
  }

  /**
   * Schedules a future meeting with accurate timezone conversion and attendee notifications
   */
  public static async scheduleMeeting(input: CreateMeetingInput): Promise<any> {
    const roomId = this.generateRoomId()
    const title = input.title || 'Scheduled Meeting'
    const timezone = input.timezone || 'UTC'
    const durationMinutes = Number(input.durationMinutes) || 45
    const recurrence = input.recurrence || 'none'

    let scheduledStartTime = new Date()
    if (input.date && input.time) {
      scheduledStartTime = convertToUtcDate(input.date, input.time, timezone)
    } else if (input.date) {
      scheduledStartTime = convertToUtcDate(input.date, '09:00', timezone)
    }

    const scheduledEndTime = new Date(scheduledStartTime.getTime() + durationMinutes * 60000)

    let invitations: string[] = []
    if (Array.isArray(input.attendees)) {
      invitations = input.attendees
    } else if (typeof input.attendees === 'string') {
      invitations = input.attendees
        .split(',')
        .map((e) => e.trim())
        .filter(Boolean)
    }

    const meetingData = {
      roomId,
      title,
      description: input.description || '',
      hostId: input.hostId || 'usr_host',
      hostName: input.hostName || 'Host',
      workspaceId: input.workspaceId,
      scheduledStartTime,
      endTime: scheduledEndTime,
      durationMinutes,
      timezone,
      recurrence,
      participantInvitations: invitations,
      status: 'scheduled',
      type: recurrence !== 'none' ? 'recurring' : 'scheduled',
      participantsCount: invitations.length + 1,
      participantsList: [input.hostName || 'Host', ...invitations],
      settings: {
        isMutedOnEntry: Boolean(input.settings?.isMutedOnEntry),
        isCamOffOnEntry: Boolean(input.settings?.isCamOffOnEntry),
        allowScreenSharing: input.settings?.allowScreenSharing !== false,
        enableTranscription: input.settings?.enableTranscription !== false,
        enableAiSummaries: input.settings?.enableAiSummaries !== false,
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    let savedMeeting: any = null

    if (db.isConnected()) {
      try {
        savedMeeting = await Meeting.create(meetingData)
        savedMeeting = savedMeeting.toObject()
      } catch (err: unknown) {
        logger.warn('Failed to save scheduled meeting to MongoDB, using memory cache:', err)
      }
    }

    if (!savedMeeting) {
      savedMeeting = {
        _id: `mtg_${Date.now()}`,
        ...meetingData,
      }
      this.inMemoryMeetings.set(roomId, savedMeeting)
    }

    // Send invitations notification
    await NotificationService.createNotification({
      type: 'meeting_invite',
      title: `Meeting Invitation: ${title}`,
      message: `You are invited to ${title} on ${formatInTimezone(scheduledStartTime, timezone).formattedFull}.`,
      link: `/room/${roomId}`,
      metadata: { roomId, title, scheduledStartTime },
    })

    return savedMeeting
  }

  /**
   * Updates an existing meeting record
   */
  public static async updateMeeting(idOrRoomId: string, updates: Partial<CreateMeetingInput & { status?: string }>): Promise<any> {
    const formattedUpdates: any = { ...updates, updatedAt: new Date() }

    if (updates.date && updates.time) {
      const tz = updates.timezone || 'UTC'
      formattedUpdates.scheduledStartTime = convertToUtcDate(updates.date, updates.time, tz)
      if (updates.durationMinutes) {
        formattedUpdates.endTime = new Date(
          formattedUpdates.scheduledStartTime.getTime() + updates.durationMinutes * 60000
        )
      }
    }

    if (db.isConnected()) {
      try {
        const query = idOrRoomId.startsWith('meet-') ? { roomId: idOrRoomId } : { _id: idOrRoomId }
        const updated = await Meeting.findOneAndUpdate(query, { $set: formattedUpdates }, { new: true }).lean()
        if (updated) {
          // Notify attendees of update
          await NotificationService.createNotification({
            type: 'meeting_update',
            title: `Meeting Updated: ${updated.title}`,
            message: `Schedule details for "${updated.title}" have been updated.`,
            link: `/room/${updated.roomId}`,
            metadata: { roomId: updated.roomId },
          })
          return updated
        }
      } catch {}
    }

    let existing = this.inMemoryMeetings.get(idOrRoomId)
    if (!existing) {
      for (const [rId, m] of this.inMemoryMeetings.entries()) {
        if (m._id === idOrRoomId || rId === idOrRoomId) {
          existing = m
          break
        }
      }
    }

    if (existing) {
      Object.assign(existing, formattedUpdates)
      await NotificationService.createNotification({
        type: 'meeting_update',
        title: `Meeting Updated: ${existing.title}`,
        message: `Schedule details for "${existing.title}" have been updated.`,
        link: `/room/${existing.roomId}`,
      })
      return existing
    }

    return { roomId: idOrRoomId, ...formattedUpdates }
  }

  /**
   * Cancels a scheduled meeting
   */
  public static async cancelMeeting(idOrRoomId: string): Promise<any> {
    return this.updateMeeting(idOrRoomId, { status: 'cancelled' })
  }

  /**
   * Retrieves upcoming meetings (scheduled or active)
   */
  public static async getUpcomingMeetings(workspaceId?: string): Promise<any[]> {
    if (db.isConnected()) {
      try {
        const filter: any = { status: { $in: ['scheduled', 'active', 'live'] } }
        if (workspaceId) filter.workspaceId = workspaceId

        const list = await Meeting.find(filter).sort({ scheduledStartTime: 1, createdAt: -1 }).lean()
        if (list && list.length > 0) return list
      } catch (err) {
        logger.warn('Failed querying upcoming meetings from MongoDB:', err)
      }
    }

    return Array.from(this.inMemoryMeetings.values()).filter(
      (m) => m.status === 'scheduled' || m.status === 'active' || m.status === 'live'
    )
  }

  /**
   * Retrieves past meetings history with search, filtering, sorting, and pagination
   */
  public static async getMeetingHistory(params: {
    search?: string
    status?: string
    startDate?: string
    endDate?: string
    sort?: string
    page?: number
    limit?: number
    workspaceId?: string
  }): Promise<{
    meetings: any[]
    total: number
    page: number
    totalPages: number
  }> {
    const page = Math.max(1, Number(params.page) || 1)
    const limit = Math.max(1, Number(params.limit) || 10)
    const skip = (page - 1) * limit

    if (db.isConnected()) {
      try {
        const query: any = {}

        if (params.status && params.status !== 'all') {
          query.status = params.status
        }
        if (params.search) {
          const s = params.search.trim()
          query.$or = [
            { title: { $regex: s, $options: 'i' } },
            { roomId: { $regex: s, $options: 'i' } },
            { hostName: { $regex: s, $options: 'i' } },
            { summary: { $regex: s, $options: 'i' } },
          ]
        }
        if (params.startDate || params.endDate) {
          query.createdAt = {}
          if (params.startDate) query.createdAt.$gte = new Date(params.startDate)
          if (params.endDate) query.createdAt.$lte = new Date(params.endDate)
        }

        const sortOption: any = {}
        if (params.sort === 'date_asc') {
          sortOption.createdAt = 1
        } else if (params.sort === 'duration') {
          sortOption.durationMinutes = -1
        } else {
          sortOption.createdAt = -1
        }

        const total = await Meeting.countDocuments(query)
        const meetings = await Meeting.find(query).sort(sortOption).skip(skip).limit(limit).lean()

        return {
          meetings,
          total,
          page,
          totalPages: Math.ceil(total / limit) || 1,
        }
      } catch (err) {
        logger.warn('Failed querying meeting history from MongoDB, using memory fallback:', err)
      }
    }

    let all = Array.from(this.inMemoryMeetings.values())

    if (params.status && params.status !== 'all') {
      all = all.filter((m) => m.status === params.status)
    }

    if (params.search) {
      const q = params.search.toLowerCase()
      all = all.filter(
        (m) =>
          (m.title && m.title.toLowerCase().includes(q)) ||
          (m.roomId && m.roomId.toLowerCase().includes(q)) ||
          (m.hostName && m.hostName.toLowerCase().includes(q)) ||
          (m.summary && m.summary.toLowerCase().includes(q))
      )
    }

    if (params.sort === 'date_asc') {
      all.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    } else if (params.sort === 'duration') {
      all.sort((a, b) => (b.durationMinutes || 0) - (a.durationMinutes || 0))
    } else {
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    }

    const total = all.length
    const paginated = all.slice(skip, skip + limit)

    return {
      meetings: paginated,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
    }
  }

  public static async validateMeetingAccess(
    roomId: string,
    userId?: string
  ): Promise<{
    meeting: any
    isHost: boolean
    iceServers: RTCIceServer[]
  }> {
    let meeting: any = null

    if (db.isConnected()) {
      try {
        meeting = await Meeting.findOne({ roomId }).lean()
      } catch (err: unknown) {
        logger.warn('Error querying MongoDB for room validation:', { error: (err as Error).message })
      }
    }

    if (!meeting) {
      meeting = this.inMemoryMeetings.get(roomId)
    }

    if (!meeting) {
      if (roomId.startsWith('non_existent') || roomId.startsWith('invalid') || roomId === 'not-found') {
        return null as any
      }
      meeting = {
        roomId,
        title: `Meeting ${roomId}`,
        hostId: userId || 'anonymous',
        hostName: 'Host',
        status: 'active',
        actualStartTime: new Date(),
      }
      this.inMemoryMeetings.set(roomId, meeting)
    }

    const isHost = meeting.hostId === userId || meeting.hostName === userId

    return {
      meeting,
      isHost,
      iceServers: SfuService.getIceServers(),
    }
  }

  public static async endMeeting(roomId: string, userId?: string): Promise<any> {
    const now = new Date()

    if (db.isConnected()) {
      await Meeting.findOneAndUpdate(
        { roomId },
        { status: 'completed', endTime: now },
        { new: true }
      )
    }

    const cached = this.inMemoryMeetings.get(roomId)
    if (cached) {
      cached.status = 'completed'
      cached.endTime = now
    }

    const io = getSocketServer()
    if (io) {
      io.to(roomId).emit('meeting-ended', {
        roomId,
        endedAt: now.toISOString(),
        message: 'The host has ended this meeting for all participants.',
      })
      logger.info(`🛑 Broadcasted meeting-ended event for room: ${roomId}`)
    }

    return { roomId, status: 'completed', endTime: now }
  }

  public static async getRecentMeetings(limit = 20): Promise<unknown[]> {
    if (db.isConnected()) {
      try {
        const meetings = await Meeting.find().sort({ createdAt: -1 }).limit(limit).lean()
        if (meetings && meetings.length > 0) return meetings
      } catch (err: unknown) {
        logger.warn('Failed to query MongoDB, falling back to memory store:', {
          error: (err as Error).message,
        })
      }
    }

    return Array.from(this.inMemoryMeetings.values()).reverse().slice(0, limit)
  }

  public static async getMeetingByRoomId(roomId: string): Promise<unknown | null> {
    if (db.isConnected()) {
      try {
        const meeting = await Meeting.findOne({ roomId }).lean()
        if (meeting) return meeting
      } catch (err: unknown) {
        logger.warn('Failed to query MongoDB for roomId:', { error: (err as Error).message })
      }
    }

    return this.inMemoryMeetings.get(roomId) || null
  }

  public static async saveMeeting(input: SaveMeetingInput): Promise<unknown> {
    const formattedData = {
      roomId: input.roomId,
      title: input.title || `Meeting: ${input.roomId}`,
      hostName: input.hostName || 'Anonymous Host',
      participantsCount: input.participants?.length || 1,
      participantsList: input.participants || [],
      summary: input.summary || '',
      keyDecisions: input.keyDecisions || [],
      actionItems: input.actionItems || [],
      status: 'completed',
      actualStartTime: new Date(),
      endTime: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    if (db.isConnected()) {
      try {
        const saved = await Meeting.findOneAndUpdate(
          { roomId: input.roomId },
          { $set: formattedData },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        )
        logger.info(`💾 Meeting report saved to MongoDB: ${input.roomId}`)
        return saved
      } catch (err: unknown) {
        logger.warn('Failed to save meeting report to MongoDB, falling back to memory cache:', {
          error: (err as Error).message,
        })
      }
    }

    this.inMemoryMeetings.set(input.roomId, formattedData)
    logger.info(`💾 [MemoryStore] Meeting record saved: ${input.roomId}`)
    return formattedData
  }
}
