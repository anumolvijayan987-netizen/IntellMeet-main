import { Request, Response } from 'express'
import { Transcript } from '../models/Transcript.model'
import { ApiResponse } from '../utils/apiResponse'
import { db } from '../config/db'

export const inMemoryTranscripts: any[] = [
  {
    _id: 'tr_1',
    speakerName: 'Sarah Chen',
    speaker: 'Sarah Chen',
    text: 'Let us start by confirming the WebRTC signaling mesh and STUN server endpoints.',
    startTime: 1000,
    time: '14:02:10',
    language: 'en-US',
    meetingId: 'default',
    createdAt: new Date(),
  },
  {
    _id: 'tr_2',
    speakerName: 'David Miller',
    speaker: 'David Miller',
    text: 'All signaling events for join, signal, and media state are active on Socket.io with zero dropouts.',
    startTime: 4000,
    time: '14:04:35',
    language: 'en-US',
    meetingId: 'default',
    createdAt: new Date(),
  },
  {
    _id: 'tr_3',
    speakerName: 'Elena Rostova',
    speaker: 'Elena Rostova',
    text: 'The on-device Web Speech API and Whisper backends generate subtitles with high fidelity and language metadata.',
    startTime: 8000,
    time: '14:08:12',
    language: 'en-US',
    meetingId: 'default',
    createdAt: new Date(),
  },
  {
    _id: 'tr_4',
    speakerName: 'Sarah Chen',
    speaker: 'Sarah Chen',
    text: 'Approved. David will finalize the WebRTC pipeline while QA verifies multi-user broadcasting.',
    startTime: 15000,
    time: '14:15:40',
    language: 'en-US',
    meetingId: 'default',
    createdAt: new Date(),
  },
]

export const getTranscripts = async (req: Request, res: Response): Promise<void> => {
  const { meetingId, search } = req.query

  if (db.isConnected()) {
    const filter: any = {}
    if (meetingId) filter.meetingId = meetingId
    if (search) {
      filter.text = { $regex: String(search), $options: 'i' }
    }
    const chunks = await Transcript.find(filter).sort({ startTime: 1 }).lean()
    ApiResponse.success(res, chunks, 'Transcript chunks retrieved.')
    return
  }

  let list = [...inMemoryTranscripts]
  if (meetingId && meetingId !== 'default') {
    const filteredByMeeting = list.filter((t) => String(t.meetingId) === String(meetingId))
    if (filteredByMeeting.length > 0) {
      list = filteredByMeeting
    }
  }

  if (search) {
    const q = String(search).toLowerCase()
    list = list.filter(
      (t) =>
        t.text.toLowerCase().includes(q) ||
        (t.speakerName && t.speakerName.toLowerCase().includes(q))
    )
  }

  ApiResponse.success(res, list, 'Transcript retrieved.')
}

export const saveTranscriptChunk = async (req: Request, res: Response): Promise<void> => {
  const data = req.body

  if (db.isConnected()) {
    try {
      const chunk = await Transcript.create(data)
      ApiResponse.created(res, chunk, 'Transcript chunk saved.')
      return
    } catch {
      // Fall through to in-memory fallback
    }
  }

  const chunk = {
    ...data,
    _id: `tr_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    speaker: data.speakerName || data.speaker || 'Unknown Speaker',
    speakerName: data.speakerName || data.speaker || 'Unknown Speaker',
    language: data.language || 'en-US',
    createdAt: new Date(),
  }
  inMemoryTranscripts.push(chunk)

  ApiResponse.created(res, chunk, 'Transcript chunk saved.')
}
