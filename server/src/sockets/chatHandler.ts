import { Socket, Server } from 'socket.io'
import { logger } from '../utils/logger'
import { Message } from '../models/Message.model'
import { inMemoryMessages } from '../controllers/message.controller'
import { db } from '../config/db'

export const registerChatHandlers = (io: Server, socket: Socket): void => {
  socket.on('send-message', async ({ roomId, message }) => {
    logger.debug(`💬 [Room ${roomId}] ${message.sender}: ${message.text || message.content}`)

    const text = message.text || message.content || ''
    const sender = message.sender || message.senderName || 'Anonymous'

    const enrichedMessage = {
      ...message,
      meetingId: roomId,
      text,
      content: text,
      sender,
      senderName: sender,
      id: message.id || `msg_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: message.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      createdAt: new Date().toISOString(),
    }

    // Persist to MongoDB or in-memory store
    if (db.isConnected()) {
      try {
        await Message.create({
          meetingId: roomId,
          senderName: sender,
          senderId: message.senderId || socket.id,
          content: text,
          type: 'text',
        })
      } catch (err: unknown) {
        logger.warn('Failed to persist chat message to database:', { error: (err as Error).message })
      }
    } else {
      inMemoryMessages.push(enrichedMessage)
    }

    // Broadcast to all participants in the room
    io.to(roomId).emit('receive-message', enrichedMessage)
  })

  socket.on('user-typing', ({ roomId, userName, isTyping }) => {
    socket.to(roomId).emit('user-typing', {
      userId: socket.id,
      userName,
      isTyping,
    })
  })
}
