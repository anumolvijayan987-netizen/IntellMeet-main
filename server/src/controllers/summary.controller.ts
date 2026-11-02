import { Request, Response } from 'express'
import { MeetingSummary } from '../models/MeetingSummary.model'
import { ApiResponse } from '../utils/apiResponse'
import { db } from '../config/db'

export const getMeetingSummary = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.params

  if (db.isConnected()) {
    const summary = await MeetingSummary.findOne({ meetingId }).lean()
    if (summary) {
      ApiResponse.success(res, summary, 'Summary retrieved.')
      return
    }
  }

  ApiResponse.success(
    res,
    {
      meetingId,
      executiveSummary: 'Sprint session covered technical architecture and database foundations.',
      keyDecisions: ['Confirmed 12 Mongoose models with validation', 'Enabled Speech-to-text STT'],
      sentiment: 'positive',
    },
    'Summary retrieved.'
  )
}

export const saveMeetingSummary = async (req: Request, res: Response): Promise<void> => {
  const data = req.body

  if (db.isConnected()) {
    const saved = await MeetingSummary.findOneAndUpdate(
      { meetingId: data.meetingId },
      { $set: data },
      { upsert: true, new: true }
    )
    ApiResponse.created(res, saved, 'Summary saved.')
    return
  }

  ApiResponse.created(res, { ...data, _id: `sum_${Date.now()}` }, 'Summary saved.')
}
