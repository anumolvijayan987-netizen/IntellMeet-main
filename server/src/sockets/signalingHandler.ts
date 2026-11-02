import { Socket, Server } from 'socket.io'
import { logger } from '../utils/logger'

export const registerSignalingHandlers = (io: Server, socket: Socket): void => {
  // Unified WebRTC Signaling message exchange (Offer, Answer, ICE Candidate)
  socket.on('signal', ({ roomId, targetId, signalData }) => {
    if (targetId) {
      io.to(targetId).emit('signal', {
        senderId: socket.id,
        signalData,
      })
    } else if (roomId) {
      socket.to(roomId).emit('signal', {
        senderId: socket.id,
        signalData,
      })
    }
  })

  // Explicit Offer handler
  socket.on('offer', ({ targetId, targetSocketId, offer }) => {
    const dest = targetId || targetSocketId
    if (dest) {
      io.to(dest).emit('offer', {
        senderId: socket.id,
        offer,
      })
    }
  })

  // Explicit Answer handler
  socket.on('answer', ({ targetId, targetSocketId, answer }) => {
    const dest = targetId || targetSocketId
    if (dest) {
      io.to(dest).emit('answer', {
        senderId: socket.id,
        answer,
      })
    }
  })

  // Explicit ICE Candidate exchange
  socket.on('ice-candidate', ({ targetId, targetSocketId, candidate }) => {
    const dest = targetId || targetSocketId
    if (dest) {
      io.to(dest).emit('ice-candidate', {
        senderId: socket.id,
        candidate,
      })
    }
  })

  // Media state changes (mute, camera off, screen share)
  socket.on('media-state-change', ({ roomId, audioEnabled, videoEnabled, screenSharing, isSpeaking }) => {
    socket.to(roomId).emit('media-state-change', {
      userId: socket.id,
      audioEnabled,
      videoEnabled,
      screenSharing,
      isSpeaking,
    })
  })

  // Real-time Active Speaker audio level broadcast
  socket.on('active-speaker', (data) => {
    const speakerId = data.speakerId || data.userId || socket.id
    io.to(data.roomId).emit('active-speaker', {
      speakerId,
      userId: speakerId,
      speakerName: data.speakerName,
      volume: data.volume,
    })
  })

  // Host Action: Mute participant
  socket.on('admin-mute-user', ({ roomId, targetSocketId }) => {
    logger.info(`Host requested mute for ${targetSocketId} in room ${roomId}`)
    io.to(targetSocketId).emit('force-mute', {
      message: 'You were muted by the meeting host.',
    })
  })

  // Host Action: Remove participant
  socket.on('admin-remove-user', ({ roomId, targetSocketId }) => {
    logger.info(`Host requested disconnect for ${targetSocketId} in room ${roomId}`)
    io.to(targetSocketId).emit('force-disconnect', {
      message: 'You were removed from the meeting by the host.',
    })
  })

  // Host Action: End meeting for all participants
  const handleEndMeetingAll = ({ roomId }: { roomId: string }) => {
    logger.info(`Host ended meeting for all participants in room: ${roomId}`)
    io.to(roomId).emit('meeting-ended', {
      roomId,
      message: 'The meeting was concluded by the host.',
    })
  }

  socket.on('end-meeting-all', handleEndMeetingAll)
  socket.on('end-meeting-for-all', handleEndMeetingAll)
}
