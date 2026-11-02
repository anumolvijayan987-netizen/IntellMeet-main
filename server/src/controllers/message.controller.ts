import { Request, Response } from 'express'
import { Message } from '../models/Message.model'
import { ApiResponse } from '../utils/apiResponse'
import { db } from '../config/db'

export const inMemoryMessages: any[] = []

export const getMessages = async (req: Request, res: Response): Promise<void> => {
  const { meetingId } = req.query

  if (db.isConnected() && meetingId) {
    const messages = await Message.find({ meetingId }).sort({ createdAt: 1 }).lean()
    ApiResponse.success(res, messages, 'Chat messages retrieved.')
    return
  }

  if (meetingId) {
    const filtered = inMemoryMessages.filter((m) => m.meetingId === meetingId)
    ApiResponse.success(res, filtered, 'Chat messages retrieved.')
    return
  }

  ApiResponse.success(res, [], 'Messages retrieved.')
}

export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  const data = req.body

  if (db.isConnected()) {
    const msg = await Message.create({
      ...data,
      senderId: req.user?.userId,
      senderName: req.user?.email.split('@')[0] || data.senderName || 'Anonymous',
    })
    ApiResponse.created(res, msg, 'Message recorded.')
    return
  }

  const mockMsg = {
    ...data,
    _id: `msg_${Date.now()}`,
    content: data.content || data.text,
    senderName: data.senderName || 'Anonymous',
    createdAt: new Date(),
  }
  inMemoryMessages.push(mockMsg)

  ApiResponse.created(res, mockMsg, 'Message recorded.')
}
