import { Request, Response } from 'express'
import { MeetingService } from '../services/meeting.service'
import { ApiResponse } from '../utils/apiResponse'

export const getCalendarEvents = async (req: Request, res: Response): Promise<void> => {
  const meetings = await MeetingService.getUpcomingMeetings()

  const events = meetings.map((m: any) => ({
    id: m._id || m.roomId,
    roomId: m.roomId,
    title: m.title || 'Meeting',
    start: m.scheduledStartTime || m.createdAt,
    durationMinutes: m.durationMinutes || 45,
    timezone: m.timezone || 'UTC',
    status: m.status || 'scheduled',
    hostName: m.hostName || 'Organizer',
    attendees: m.attendees || [],
  }))

  ApiResponse.success(res, events, 'Calendar events retrieved successfully')
}
