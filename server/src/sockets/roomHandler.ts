import { Socket, Server } from 'socket.io'
import { logger } from '../utils/logger'

export interface RoomParticipant {
  socketId: string
  userId: string
  userName: string
  avatarUrl?: string
  isHost?: boolean
  audioEnabled?: boolean
  videoEnabled?: boolean
  screenSharing?: boolean
  joinedAt: string
}

// In-memory room occupancy tracking
const activeRooms = new Map<string, Map<string, RoomParticipant>>()

export const registerRoomHandlers = (io: Server, socket: Socket): void => {
  socket.on('join-room', (payload) => {
    const { roomId, avatarUrl } = payload
    const userName = payload.userName || payload.user?.name || 'Anonymous'
    const userId = payload.userId || payload.user?.id || socket.id
    const isHost = payload.isHost !== undefined ? payload.isHost : Boolean(payload.user?.isHost)

    socket.join(roomId)

    if (!activeRooms.has(roomId)) {
      activeRooms.set(roomId, new Map())
    }

    const participant: RoomParticipant = {
      socketId: socket.id,
      userId,
      userName,
      avatarUrl: avatarUrl || payload.user?.avatarUrl || '',
      isHost: Boolean(isHost),
      audioEnabled: true,
      videoEnabled: true,
      screenSharing: false,
      joinedAt: new Date().toISOString(),
    }

    activeRooms.get(roomId)!.set(socket.id, participant)

    logger.info(`👤 ${participant.userName} (${socket.id}) joined room: ${roomId} [Host: ${participant.isHost}]`)

    // Notify other peers in room about new peer
    socket.to(roomId).emit('user-joined', {
      socketId: socket.id,
      userId: participant.userId,
      userName: participant.userName,
      avatarUrl: participant.avatarUrl,
      isHost: participant.isHost,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })

    // Send current participants list to joining client (excluding itself)
    const currentUsers = Array.from(activeRooms.get(roomId)!.values()).filter(
      (u) => u.socketId !== socket.id
    )
    socket.emit('room-users', currentUsers)
  })

  socket.on('update-name', ({ roomId, userName }: { roomId: string; userName: string }) => {
    const room = activeRooms.get(roomId)
    if (room && room.has(socket.id)) {
      const p = room.get(socket.id)!
      p.userName = userName
      logger.info(`📝 User in room ${roomId} updated name to: ${userName}`)
      socket.to(roomId).emit('user-updated', {
        socketId: socket.id,
        userId: p.userId,
        userName,
      })
    }
  })

  socket.on('leave-room', ({ roomId }) => {
    handleUserLeave(io, socket, roomId)
  })

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      if (roomId !== socket.id) {
        handleUserLeave(io, socket, roomId)
      }
    }
  })
}

function handleUserLeave(io: Server, socket: Socket, roomId: string): void {
  const room = activeRooms.get(roomId)
  if (room && room.has(socket.id)) {
    const user = room.get(socket.id)
    room.delete(socket.id)

    if (room.size === 0) {
      activeRooms.delete(roomId)
    }

    logger.info(`🚪 User ${user?.userName} (${socket.id}) left room: ${roomId}`)

    io.to(roomId).emit('user-left', {
      socketId: socket.id,
      userId: user?.userId,
      userName: user?.userName,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  }
}
