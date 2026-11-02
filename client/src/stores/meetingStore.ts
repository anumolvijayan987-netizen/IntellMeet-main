import { create } from 'zustand'
import { ActionItem, ChatMessage, TranscriptEntry } from '../types'

interface MeetingState {
  roomId: string
  roomTitle: string
  isMicOn: boolean
  isCamOn: boolean
  isScreenSharing: boolean
  isTranscribing: boolean
  activeSideTab: 'chat' | 'ai' | 'participants'
  messages: ChatMessage[]
  transcripts: TranscriptEntry[]
  liveSubtitle: string
  liveSubtitleSpeaker: string
  actionItems: ActionItem[]
  participantsCount: number

  // Actions
  setRoomId: (id: string) => void
  setRoomTitle: (title: string) => void
  toggleMic: () => void
  toggleCam: () => void
  setScreenSharing: (sharing: boolean) => void
  toggleTranscribing: () => void
  setActiveSideTab: (tab: 'chat' | 'ai' | 'participants') => void
  addMessage: (msg: ChatMessage) => void
  addTranscript: (entry: TranscriptEntry) => void
  setLiveSubtitle: (text: string, speaker: string) => void
  setActionItems: (items: ActionItem[]) => void
  toggleActionItem: (id: string | number) => void
  setParticipantsCount: (count: number) => void
  resetMeetingState: () => void
}

export const useMeetingStore = create<MeetingState>((set) => ({
  roomId: '',
  roomTitle: 'IntellMeet Room',
  isMicOn: true,
  isCamOn: true,
  isScreenSharing: false,
  isTranscribing: true,
  activeSideTab: 'chat',
  messages: [],
  transcripts: [],
  liveSubtitle: '',
  liveSubtitleSpeaker: '',
  actionItems: [],
  participantsCount: 1,

  setRoomId: (roomId) => set({ roomId }),
  setRoomTitle: (roomTitle) => set({ roomTitle }),
  toggleMic: () => set((state) => ({ isMicOn: !state.isMicOn })),
  toggleCam: () => set((state) => ({ isCamOn: !state.isCamOn })),
  setScreenSharing: (isScreenSharing) => set({ isScreenSharing }),
  toggleTranscribing: () => set((state) => ({ isTranscribing: !state.isTranscribing })),
  setActiveSideTab: (activeSideTab) => set({ activeSideTab }),
  addMessage: (msg) =>
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) {
        return state
      }
      return { messages: [...state.messages, msg] }
    }),
  addTranscript: (entry) => set((state) => ({ transcripts: [...state.transcripts, entry] })),
  setLiveSubtitle: (liveSubtitle, liveSubtitleSpeaker) =>
    set({ liveSubtitle, liveSubtitleSpeaker }),
  setActionItems: (actionItems) => set({ actionItems }),
  toggleActionItem: (id) =>
    set((state) => ({
      actionItems: state.actionItems.map((item) =>
        item.id === id ? { ...item, completed: !item.completed } : item
      ),
    })),
  setParticipantsCount: (participantsCount) => set({ participantsCount }),
  resetMeetingState: () =>
    set({
      roomId: '',
      messages: [],
      transcripts: [],
      liveSubtitle: '',
      liveSubtitleSpeaker: '',
      actionItems: [],
      participantsCount: 1,
      isScreenSharing: false,
    }),
}))
