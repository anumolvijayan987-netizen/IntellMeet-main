import { IChatMessage, ITranscriptChunk } from './meeting.types'

export interface JoinRoomPayload {
  roomId: string
  userName: string
  userId?: string
}

export interface UserJoinedPayload {
  userId: string
  userName: string
  socketId: string
  time: string
}

export interface UserLeftPayload {
  userId: string
  socketId: string
  userName?: string
  time: string
}

export interface SendMessagePayload {
  roomId: string
  message: IChatMessage
}

export interface TranscriptPayload {
  roomId: string
  transcriptData: ITranscriptChunk
}

export interface SignalPayload {
  roomId: string
  targetId: string
  senderId?: string
  signalData: unknown
}

export interface MediaStatePayload {
  roomId: string
  audioEnabled?: boolean
  videoEnabled?: boolean
  screenSharing?: boolean
}
