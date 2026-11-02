import { Socket, Server } from 'socket.io'

export const registerTranscriptionHandlers = (io: Server, socket: Socket): void => {
  socket.on('transcript-chunk', ({ roomId, transcriptData }) => {
    // Broadcast live spoken subtitle transcript to all other participants in room
    socket.to(roomId).emit('receive-transcript', {
      ...transcriptData,
      speakerId: socket.id,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    })
  })
}
