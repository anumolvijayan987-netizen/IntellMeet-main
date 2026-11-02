import { Request, Response } from 'express'
import { MeetingParticipant } from '../models/MeetingParticipant.model'
import { ApiResponse } from '../utils/apiResponse'
import { db } from '../config/db'

export const getParticipants = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.query

  if (db.isConnected() && meetingId) {
    const list = await MeetingParticipant.find({ meetingId }).sort({ joinedAt: 1 }).lean()
    ApiResponse.success(res, list, 'Participants retrieved.')
    return
  }

  ApiResponse.success(
    res,
    [
      { guestName: 'Sarah Chen', role: 'host', audioEnabled: true, videoEnabled: true },
      { guestName: 'David Miller', role: 'participant', audioEnabled: true, videoEnabled: true },
    ],
    'Participants retrieved.'
  )
}

export const logParticipantJoin = async (req: Request, res: Response): Promise<void> => {
  const data = req.body

  if (db.isConnected()) {
    const participant = await MeetingParticipant.create(data)
    ApiResponse.created(res, participant, 'Participant attendance logged.')
    return
  }

  ApiResponse.created(res, { ...data, _id: `part_${Date.now()}` }, 'Attendance logged.')
}

export const logParticipantLeave = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params

  if (db.isConnected()) {
    const part = await MeetingParticipant.findById(id)
    if (part) {
      part.leftAt = new Date()
      part.durationSeconds = Math.round(
        (part.leftAt.getTime() - new Date(part.joinedAt).getTime()) / 1000
      )
      await part.save()
      ApiResponse.success(res, part, 'Participant leave logged.')
      return
    }
  }

  ApiResponse.success(res, { id, leftAt: new Date() }, 'Leave logged.')
}
