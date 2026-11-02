export const SOCKET_EVENTS = {
  // Connection events
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',

  // Room lifecycle
  ROOM_JOIN: 'join-room',
  ROOM_LEAVE: 'leave-room',
  USER_JOINED: 'user-joined',
  USER_LEFT: 'user-left',
  ROOM_USERS: 'room-users',

  // WebRTC Signaling
  SIGNAL: 'signal',
  OFFER: 'offer',
  ANSWER: 'answer',
  ICE_CANDIDATE: 'ice-candidate',

  // Real-time Chat
  CHAT_SEND: 'send-message',
  CHAT_RECEIVE: 'receive-message',
  CHAT_TYPING: 'user-typing',

  // Real-time Audio Transcription
  TRANSCRIPT_CHUNK: 'transcript-chunk',
  TRANSCRIPT_RECEIVE: 'receive-transcript',

  // Participant Media States
  MEDIA_STATE_CHANGE: 'media-state-change',
  HAND_RAISE: 'hand-raise',

  // Meeting Control
  MEETING_END: 'meeting-ended',
  AI_SUMMARY_GENERATED: 'ai-summary-generated',
} as const

export type SocketEventName = typeof SOCKET_EVENTS[keyof typeof SOCKET_EVENTS]
