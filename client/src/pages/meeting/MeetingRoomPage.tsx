import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Clock,
  MonitorUp,
  MessageSquare,
  Sparkles,
  PhoneOff,
  Send,
  Users,
  User,
  Copy,
  CheckCircle2,
  Check,
  Captions,
  Loader2,
  ListTodo,
  Info,
  Shield,
  FileText,
  Radio,
  Settings,
  ChevronDown,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Modal } from '../../components/ui/Modal'
import { Input } from '../../components/ui/Input'
import { useSocket } from '../../hooks/useSocket'
import { useWebRTC, RemotePeer } from '../../hooks/useWebRTC'
import { useSpeechRecognition } from '../../hooks/useSpeechRecognition'
import { useMeetingStore } from '../../stores/meetingStore'
import { useAuthStore } from '../../stores/authStore'
import { aiService } from '../../services/aiService'
import { meetingService } from '../../services/meetingService'
import { ChatMessage } from '../../types'
import { useToast } from '../../contexts/ToastContext'

// Component for rendering a remote participant's real MediaStream
const PeerVideoTile: React.FC<{
  peer: RemotePeer
  isActiveSpeaker: boolean
  onMute?: () => void
  onRemove?: () => void
  canModerate?: boolean
}> = ({ peer, isActiveSpeaker, onMute, onRemove, canModerate }) => {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    if (videoRef.current && peer.stream) {
      videoRef.current.srcObject = peer.stream
    }
  }, [peer.stream])

  return (
    <div
      className={`rounded-2xl bg-[#111827] relative overflow-hidden flex items-center justify-center shadow-lg transition-all duration-200 ${
        isActiveSpeaker || peer.isSpeaking
          ? 'border-2 border-[#12B76A] ring-4 ring-[#12B76A]/20'
          : 'border border-white/10'
      }`}
    >
      {peer.videoEnabled ? (
        <video
          ref={videoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="flex flex-col items-center gap-3 text-slate-400 p-4">
          {peer.avatarUrl ? (
            <img
              src={peer.avatarUrl}
              alt={peer.userName}
              className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-inner">
              {peer.userName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="text-xs font-medium text-slate-300">
            {peer.userName} (Camera Off)
          </div>
        </div>
      )}

      {/* Speaking badge */}
      {(isActiveSpeaker || peer.isSpeaking) && (
        <div className="absolute top-3 left-3 bg-[#12B76A] text-black px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
          <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
          Speaking
        </div>
      )}

      {/* Connection indicator */}
      <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] text-slate-300 flex items-center gap-1.5">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            peer.connectionState === 'connected' ? 'bg-[#12B76A]' : 'bg-[#F79009]'
          }`}
        />
        <span className="capitalize">{peer.connectionState || 'connected'}</span>
      </div>

      {/* Bottom overlay: Name & Mic indicator */}
      <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
        <div className="bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-2">
          <span>{peer.userName}</span>
          {peer.isHost && (
            <span className="bg-[#2563EB]/40 text-[#60A5FA] border border-[#60A5FA]/40 text-[9px] px-1 py-0.2 rounded font-semibold">
              Host
            </span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          {canModerate && (
            <div className="flex items-center gap-1">
              <button
                onClick={onMute}
                title="Mute participant"
                className="bg-black/80 hover:bg-white/20 p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <MicOff className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onRemove}
                title="Remove from meeting"
                className="bg-black/80 hover:bg-rose-600/70 p-1.5 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <PhoneOff className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          <div className="bg-black/80 p-1.5 rounded-lg text-white">
            {peer.audioEnabled ? (
              <Mic className="w-3.5 h-3.5 text-[#12B76A]" />
            ) : (
              <MicOff className="w-3.5 h-3.5 text-[#F04438]" />
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export const MeetingRoomPage: React.FC = () => {
  const { roomId = 'sprint-room' } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const { user, setUserName, isAuthenticated } = useAuthStore()
  const { success, info, error: toastError } = useToast()

  // Store state
  const {
    isMicOn,
    isCamOn,
    isScreenSharing,
    isTranscribing,
    activeSideTab,
    messages,
    transcripts,
    liveSubtitle,
    liveSubtitleSpeaker,
    actionItems,
    setRoomId,
    toggleMic,
    toggleCam,
    toggleTranscribing,
    setActiveSideTab,
    addMessage,
    setActionItems,
    toggleActionItem,
    resetMeetingState,
  } = useMeetingStore()

  // Local state
  const [copiedLink, setCopiedLink] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [keyDecisions, setKeyDecisions] = useState<string[]>([])
  const [meetingSeconds, setMeetingSeconds] = useState(0)
  const [leaveModalOpen, setLeaveModalOpen] = useState(false)
  const [deviceModalOpen, setDeviceModalOpen] = useState(false)
  const [editNameOpen, setEditNameOpen] = useState(false)
  const [newName, setNewName] = useState(user.name)
  const [isHost, setIsHost] = useState(false)
  const [transcriptSearch, setTranscriptSearch] = useState('')

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  const memoizedCurrentUser = React.useMemo(() => ({
    id: user.id || 'usr_anonymous',
    name: user.name || 'Anonymous',
    avatarUrl: user.avatarUrl,
  }), [user.id, user.name, user.avatarUrl])

  const handleMeetingEndedCallback = React.useCallback(() => {
    alert('The meeting has been concluded by the host.')
    navigate('/app')
  }, [navigate])

  const handleForceDisconnectCallback = React.useCallback(() => {
    alert('You have been removed from the meeting by the host.')
    navigate('/app')
  }, [navigate])

  // WebRTC Hook
  const {
    localStream,
    screenStream,
    localVideoRef,
    screenVideoRef,
    peers,
    deviceError,
    isRecording,
    activeSpeakerId,
    audioInputDevices,
    videoInputDevices,
    selectedAudioId,
    selectedVideoId,
    initMedia,
    toggleScreenShare,
    switchCamera,
    switchMicrophone,
    startRecording,
    stopRecording,
    muteParticipant,
    removeParticipant,
    endMeetingForAll,
  } = useWebRTC({
    roomId,
    socket,
    currentUser: memoizedCurrentUser,
    isHost,
    onMeetingEnded: handleMeetingEndedCallback,
    onForceDisconnect: handleForceDisconnectCallback,
  })

  // Speech Recognition Subtitles
  useSpeechRecognition(roomId)

  // Validate Meeting Room & Host Status
  useEffect(() => {
    meetingService
      .validateMeeting(roomId)
      .then((res) => {
        setIsHost(res.isHost)
      })
      .catch((err) => console.warn('Room validation check:', err))
  }, [roomId])

  // Synchronize meeting ID and load persistent chat history
  useEffect(() => {
    setRoomId(roomId)

    // Load persistent messages from database
    meetingService
      .getMeetingMessages(roomId)
      .then((history) => {
        if (Array.isArray(history) && history.length > 0) {
          history.forEach((msg, idx) => {
            const msgId = msg._id || msg.id || `hist_${idx}_${msg.senderName || msg.sender}`
            addMessage({
              id: msgId,
              sender: msg.senderName || msg.sender || 'Participant',
              text: msg.content || msg.text || '',
              timestamp: msg.createdAt
                ? new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : '',
            })
          })
        }
      })
      .catch((err) => console.warn('Could not load chat history:', err))

    // Initialize local hardware media tracks
    initMedia()
  }, [roomId])

  // Meeting duration timer
  useEffect(() => {
    const timer = setInterval(() => {
      setMeetingSeconds((sec) => sec + 1)
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // Format seconds into HH:MM:SS
  const formatDuration = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600)
    const mins = Math.floor((totalSeconds % 3600) / 60)
    const secs = totalSeconds % 60
    return `${hrs > 0 ? `${hrs}:` : ''}${mins.toString().padStart(2, '0')}:${secs
      .toString()
      .padStart(2, '0')}`
  }

  // Socket room chat events
  useEffect(() => {
    if (!socket) return

    const handleReceiveMessage = (msg: ChatMessage) => {
      addMessage(msg)
    }

    const handleUserJoined = (data: { socketId?: string; userId?: string; userName: string }) => {
      // Never show user-joined for current user
      if (!data.userName || data.userName === user.name || data.userId === user.id) return

      addMessage({
        id: `sys_join_${data.userId || data.socketId || data.userName}`,
        sender: 'IntellMeet Hub',
        text: `${data.userName} joined the meeting.`,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }

    const handleUserLeft = (data: { socketId?: string; userId?: string; userName: string }) => {
      // Never show user-left for current user
      if (!data.userName || data.userName === user.name || data.userId === user.id) return

      addMessage({
        id: `sys_leave_${data.userId || data.socketId || data.userName}_${Date.now()}`,
        sender: 'IntellMeet Hub',
        text: `${data.userName || 'A participant'} left the meeting.`,
        isSystem: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })
    }

    socket.on('receive-message', handleReceiveMessage)
    socket.on('user-joined', handleUserJoined)
    socket.on('user-left', handleUserLeft)

    return () => {
      socket.off('receive-message', handleReceiveMessage)
      socket.off('user-joined', handleUserJoined)
      socket.off('user-left', handleUserLeft)
    }
  }, [socket, user.name, user.id, addMessage])

  // Scroll to bottom on new message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !socket) return

    const text = messageInput.trim()

    socket.emit('send-message', {
      roomId,
      message: {
        text,
        content: text,
        sender: user.name,
        senderId: user.id,
      },
    })

    setMessageInput('')
  }

  // Copy meeting invite link
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    info('Meeting invitation link copied to clipboard')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  // Autonomous AI Summarization Trigger
  const handleGenerateSummary = async () => {
    setIsGeneratingAi(true)
    try {
      const result = await aiService.summarize({
        roomName: roomId,
        transcript: transcripts,
        messages: messages,
      })

      const summaryObj = result.summary
      const summaryText =
        typeof summaryObj === 'string'
          ? summaryObj
          : summaryObj?.meetingOverview || (result as any).executiveSummary || ''
      const decisions =
        summaryObj?.importantDecisions || (result as any).keyDecisions || []
      const items = (result.actionItems || []).map((item, idx) => ({
        id: item.id || `ai_item_${idx}_${Date.now()}`,
        text: item.title || (item as any).text || '',
        assignee: item.assignee || 'Unassigned',
        completed: item.status === 'completed',
        priority: item.priority || 'medium',
      }))

      setAiSummary(summaryText)
      setKeyDecisions(decisions)
      setActionItems(items)
      setActiveSideTab('ai')
      success('AI meeting minutes and key decisions generated')
    } catch (err: unknown) {
      console.error('AI summary error:', err)
      toastError('Failed to generate AI meeting minutes')
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // Toggle Meeting Cloud Recording
  const handleToggleRecording = async () => {
    if (isRecording) {
      const rec = await stopRecording(meetingSeconds)
      if (rec) {
        success('Recording saved to cloud object storage')
        addMessage({
          id: `rec_${Date.now()}`,
          sender: 'IntellMeet Hub',
          text: `Recording saved to cloud object storage: ${rec.title || 'Session Recording'}.`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      }
    } else {
      startRecording()
      info('Cloud meeting recording started')
    }
  }

  // Leave / End Meeting
  const handleConfirmLeave = (endForAll = false) => {
    try {
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop())
      }
      if (screenStream) {
        screenStream.getTracks().forEach((t) => t.stop())
      }
      if (endForAll && isHost) {
        endMeetingForAll()
        info('Meeting ended for all participants')
      } else {
        meetingService.saveMeeting({
          roomId,
          title: `Session: ${roomId}`,
          hostName: user.name,
          participants: [user.name, ...peers.map((p) => p.userName)],
          summary: aiSummary || 'Session concluded with live peer streaming.',
          keyDecisions,
          actionItems,
        }).catch(() => {})
        info('Left meeting room')
      }
    } catch (err: unknown) {
      console.warn('Error on leaving meeting:', err)
    } finally {
      resetMeetingState()
      navigate('/app')
    }
  }

  const isLocalSpeaking = activeSpeakerId === user.id
  const hasRemoteScreenShare = peers.some((p) => p.screenSharing)

  return (
    <div className="h-screen w-screen bg-[#0B0F19] text-white flex flex-col overflow-hidden select-none font-sans">
      {/* 1. Header Control Bar */}
      <header className="h-14 px-4 border-b border-white/10 flex items-center justify-between shrink-0 bg-[#0B0F19]/90 backdrop-blur-md z-20">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#12B76A] animate-pulse" />
            <h1 className="font-heading text-sm font-semibold text-white tracking-wide">
              {roomId}
            </h1>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <Badge variant="gray" size="sm" className="text-slate-300 border-white/10 bg-white/5">
              <Shield className="w-3 h-3 text-[#12B76A] mr-1" />
              WebRTC E2EE
            </Badge>

            {isRecording && (
              <Badge variant="error" size="sm" className="bg-[#F04438]/20 text-[#F04438] border border-[#F04438]/40 animate-pulse">
                <Radio className="w-3 h-3 mr-1" />
                REC
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Meeting Duration Clock */}
        <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1 rounded-full text-xs font-mono text-slate-300">
          <Clock className="w-3.5 h-3.5 text-[#60A5FA]" />
          <span>{formatDuration(meetingSeconds)}</span>
        </div>

        {/* Right Header Actions */}
        <div className="flex items-center gap-2">
          {/* Participant Identity badge with instant Name Editor */}
          <button
            type="button"
            onClick={() => {
              setNewName(user.name)
              setEditNameOpen(true)
            }}
            title="Click to edit your display name"
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-200 transition-colors"
          >
            <User className="w-3.5 h-3.5 text-[#60A5FA]" />
            <span className="font-medium max-w-[120px] truncate">{user.name}</span>
            <span className="text-[10px] text-slate-400 font-mono">(Edit)</span>
          </button>

          {!isAuthenticated && (
            <Link to="/login">
              <Button
                variant="outline"
                size="sm"
                className="text-xs bg-[#2563EB]/20 border-[#2563EB]/40 text-[#60A5FA] hover:bg-[#2563EB]/30"
              >
                Sign in
              </Button>
            </Link>
          )}

          <Button
            variant="outline"
            size="sm"
            icon={copiedLink ? <Check className="w-3.5 h-3.5 text-[#12B76A]" /> : <Copy className="w-3.5 h-3.5" />}
            onClick={handleCopyInvite}
            className="text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            {copiedLink ? 'Copied Link' : 'Copy Invite'}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            icon={<Settings className="w-3.5 h-3.5" />}
            onClick={() => setDeviceModalOpen(true)}
            className="text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
          >
            Hardware
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={<Sparkles className="w-3.5 h-3.5" />}
            onClick={handleGenerateSummary}
            disabled={isGeneratingAi}
            className="text-xs bg-[#2563EB] hover:bg-[#1D4ED8]"
          >
            {isGeneratingAi ? 'Analyzing...' : 'AI Minutes'}
          </Button>
        </div>
      </header>

      {/* 2. Main Stage & Video Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Video Grid Area */}
        <div className="flex-1 flex flex-col p-3 sm:p-4 gap-3 overflow-hidden relative">
          {/* Permission or device warning */}
          {deviceError && (
            <div className="absolute top-6 left-1/2 -translate-x-1/2 z-30 bg-amber-500/20 border border-amber-500/40 text-amber-200 px-4 py-2 rounded-xl text-xs flex items-center gap-2 shadow-xl backdrop-blur-md">
              <Info className="w-4 h-4 text-amber-400" />
              <span>{deviceError}</span>
            </div>
          )}

          {/* Screen Share Stage View */}
          {isScreenSharing || hasRemoteScreenShare ? (
            <div className="flex-1 flex flex-col gap-3 min-h-0">
              {/* Pinned presentation view */}
              <div className="flex-1 rounded-2xl bg-black border border-white/10 relative overflow-hidden flex items-center justify-center shadow-2xl">
                {isScreenSharing ? (
                  <video
                    ref={screenVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <video
                    autoPlay
                    playsInline
                    ref={(el) => {
                      const peerScreen = peers.find((p) => p.screenSharing)
                      if (el && peerScreen?.stream) el.srcObject = peerScreen.stream
                    }}
                    className="w-full h-full object-contain"
                  />
                )}
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-xs px-3 py-1 rounded-lg text-xs font-semibold text-white flex items-center gap-2">
                  <MonitorUp className="w-4 h-4 text-[#60A5FA]" />
                  <span>{isScreenSharing ? 'You are sharing your screen' : 'Screen Share Active'}</span>
                </div>
              </div>

              {/* Participant camera strip below shared screen */}
              <div className="h-32 flex gap-3 overflow-x-auto shrink-0 pb-1">
                {/* Local user tile */}
                <div
                  key="strip-local-tile"
                  className="w-48 h-full rounded-xl bg-[#111827] border border-white/10 relative overflow-hidden shrink-0"
                >
                  {isCamOn ? (
                    <video
                      ref={localVideoRef}
                      autoPlay
                      playsInline
                      muted
                      className="w-full h-full object-cover scale-x-[-1]"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                      Camera Off
                    </div>
                  )}
                  <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-0.5 rounded text-[10px] text-white">
                    You
                  </div>
                </div>

                {/* Peer tiles */}
                {peers.map((peer) => (
                  <div
                    key={peer.socketId}
                    className="w-48 h-full rounded-xl bg-[#111827] border border-white/10 relative overflow-hidden shrink-0"
                  >
                    <PeerVideoTile
                      peer={peer}
                      isActiveSpeaker={activeSpeakerId === peer.userId}
                      onMute={() => muteParticipant(peer.socketId)}
                      onRemove={() => removeParticipant(peer.socketId)}
                      canModerate={isHost}
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* Standard Dynamic Multi-User Video Grid */
            <div
              className={`flex-1 grid gap-3 sm:gap-4 min-h-0 ${
                peers.length === 0
                  ? 'grid-cols-1'
                  : peers.length === 1
                  ? 'grid-cols-1 sm:grid-cols-2'
                  : peers.length === 2
                  ? 'grid-cols-1 sm:grid-cols-3'
                  : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-2'
              }`}
            >
              {/* 1. Local User Video Tile */}
              <div
                key="local-user-tile"
                className={`rounded-2xl bg-[#111827] relative overflow-hidden flex items-center justify-center shadow-lg transition-all duration-200 ${
                  isLocalSpeaking
                    ? 'border-2 border-[#12B76A] ring-4 ring-[#12B76A]/20'
                    : 'border border-white/10'
                }`}
              >
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover scale-x-[-1] ${isCamOn ? 'block' : 'hidden'}`}
                />

                {!isCamOn && (
                  <div className="flex flex-col items-center gap-3 text-slate-400 p-4">
                    {user.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={user.name}
                        className="w-20 h-20 rounded-full object-cover ring-2 ring-white/10"
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-full bg-[#1E293B] border border-white/10 flex items-center justify-center text-white font-bold text-xl shadow-inner">
                        {user.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="text-xs font-medium text-slate-300">
                      {user.name} (Camera Off)
                    </div>
                  </div>
                )}

                {/* Top Badge: Active Speaker */}
                {isLocalSpeaking && (
                  <div className="absolute top-3 left-3 bg-[#12B76A] text-black px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 shadow">
                    <span className="w-1.5 h-1.5 rounded-full bg-black animate-ping" />
                    Speaking
                  </div>
                )}

                {/* Bottom Bar: Name & Mic indicator */}
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
                  <div className="bg-black/80 backdrop-blur-xs px-2.5 py-1 rounded-lg text-xs font-medium text-white flex items-center gap-2">
                    <span>{user.name} (You)</span>
                    {isHost && (
                      <span className="bg-[#2563EB]/40 text-[#60A5FA] border border-[#60A5FA]/40 text-[9px] px-1 py-0.2 rounded font-semibold">
                        Host
                      </span>
                    )}
                  </div>

                  <div className="bg-black/80 p-1.5 rounded-lg text-white">
                    {isMicOn ? (
                      <Mic className="w-3.5 h-3.5 text-[#12B76A]" />
                    ) : (
                      <MicOff className="w-3.5 h-3.5 text-[#F04438]" />
                    )}
                  </div>
                </div>
              </div>

              {/* 2. Remote Peer Video Tiles */}
              {peers.map((peer) => (
                <PeerVideoTile
                  key={peer.socketId}
                  peer={peer}
                  isActiveSpeaker={activeSpeakerId === peer.userId}
                  onMute={() => muteParticipant(peer.socketId)}
                  onRemove={() => removeParticipant(peer.socketId)}
                  canModerate={isHost}
                />
              ))}

              {/* Empty State: Waiting for attendees */}
              {peers.length === 0 && (
                <div key="empty-waiting-attendees" className="hidden sm:flex rounded-2xl bg-[#111827]/40 border border-dashed border-white/10 flex-col items-center justify-center text-center p-6 space-y-3">
                  <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400">
                    <Users className="w-6 h-6 text-[#60A5FA]" />
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-white">Waiting for participants to join</h3>
                    <p className="text-xs text-slate-400 mt-1 max-w-xs">
                      Share the meeting room link with your team to begin collaborating in real time.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    icon={copiedLink ? <Check className="w-3.5 h-3.5 text-[#12B76A]" /> : <Copy className="w-3.5 h-3.5" />}
                    onClick={handleCopyInvite}
                    className="text-xs bg-white/5 border-white/10 text-white hover:bg-white/10"
                  >
                    {copiedLink ? 'Link Copied!' : 'Copy Meeting Invite'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Floating On-Device Real-time Subtitles */}
          {isTranscribing && liveSubtitle && (
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 max-w-xl w-full px-4 z-20 pointer-events-none">
              <div className="bg-black/85 backdrop-blur-md border border-white/15 px-4 py-2.5 rounded-2xl shadow-2xl text-center space-y-0.5 animate-fade-in">
                <div className="text-[11px] font-semibold text-[#60A5FA]">
                  {liveSubtitleSpeaker || user.name}
                </div>
                <div className="text-xs text-white font-medium leading-relaxed">
                  {liveSubtitle}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Side Drawer: Chat / AI Minutes / Participants */}
        <aside className="w-80 sm:w-96 border-l border-white/10 bg-[#0E131F] flex flex-col shrink-0 z-20">
          {/* Tab Selection */}
          <div className="flex border-b border-white/10 p-2 gap-1 bg-[#0B0F19]/60">
            <button
              onClick={() => setActiveSideTab('chat')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeSideTab === 'chat' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat</span>
              {messages.length > 0 && (
                <span className="bg-white/20 px-1.5 py-0.2 rounded-full text-[10px]">
                  {messages.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveSideTab('participants')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeSideTab === 'participants' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>People ({peers.length + 1})</span>
            </button>

            <button
              onClick={() => setActiveSideTab('ai')}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                activeSideTab === 'ai' ? 'bg-[#2563EB] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Minutes</span>
            </button>
          </div>

          {/* Drawer Body: 1. Chat Tab */}
          {activeSideTab === 'chat' && (
            <div className="flex-1 flex flex-col justify-between overflow-hidden">
              <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs text-center p-4">
                    <MessageSquare className="w-8 h-8 mb-2 opacity-40 text-slate-400" />
                    <span>No messages yet. Real-time chat messages are encrypted and persistent.</span>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col text-xs ${
                        msg.isSystem ? 'items-center my-2 text-slate-500 text-[11px]' : 'space-y-1'
                      }`}
                    >
                      {msg.isSystem ? (
                        <div className="bg-white/5 border border-white/10 px-3 py-1 rounded-full text-slate-400">
                          {msg.text}
                        </div>
                      ) : (
                        <div
                          className={`rounded-xl p-2.5 max-w-[85%] ${
                            msg.sender === user.name
                              ? 'ml-auto bg-[#2563EB] text-white'
                              : 'mr-auto bg-white/10 text-slate-200 border border-white/5'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-3 text-[10px] text-white/70 mb-1">
                            <span className="font-semibold">{msg.sender}</span>
                            <span>{msg.timestamp}</span>
                          </div>
                          <div className="leading-relaxed">{msg.text}</div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Form */}
              <form onSubmit={handleSendMessage} className="p-3 border-t border-white/10 flex gap-2 bg-[#0B0F19]/50">
                <input
                  type="text"
                  placeholder="Send a real-time message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#2563EB]"
                />
                <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </Button>
              </form>
            </div>
          )}

          {/* Drawer Body: 2. Participants Tab */}
          {activeSideTab === 'participants' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-4">
              <div className="space-y-2">
                <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  In this meeting ({peers.length + 1})
                </div>

                {/* You */}
                <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={user.avatarUrl}
                      alt={user.name}
                      className="w-7 h-7 rounded-lg object-cover"
                    />
                    <div>
                      <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                        <span>{user.name}</span>
                        <span className="text-[10px] text-slate-400">(You)</span>
                      </div>
                      <div className="text-[10px] text-[#12B76A]">Online</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-slate-400">
                    {isMicOn ? <Mic className="w-3.5 h-3.5 text-[#12B76A]" /> : <MicOff className="w-3.5 h-3.5 text-[#F04438]" />}
                    {isCamOn ? <Video className="w-3.5 h-3.5 text-[#12B76A]" /> : <VideoOff className="w-3.5 h-3.5 text-[#F04438]" />}
                  </div>
                </div>

                {/* Remote Peers */}
                {peers.map((peer) => (
                  <div key={peer.socketId} className="flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/5">
                    <div className="flex items-center gap-2.5">
                      {peer.avatarUrl ? (
                        <img
                          src={peer.avatarUrl}
                          alt={peer.userName}
                          className="w-7 h-7 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-lg bg-[#1E293B] text-white flex items-center justify-center text-xs font-bold">
                          {peer.userName.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                          <span>{peer.userName}</span>
                          {peer.isHost && (
                            <span className="bg-[#2563EB]/40 text-[#60A5FA] text-[9px] px-1 rounded">
                              Host
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 capitalize">{peer.connectionState || 'Connected'}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-slate-400">
                      {isHost && (
                        <button
                          onClick={() => muteParticipant(peer.socketId)}
                          title="Mute user"
                          className="hover:text-white p-1"
                        >
                          <MicOff className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {peer.audioEnabled ? <Mic className="w-3.5 h-3.5 text-[#12B76A]" /> : <MicOff className="w-3.5 h-3.5 text-[#F04438]" />}
                      {peer.videoEnabled ? <Video className="w-3.5 h-3.5 text-[#12B76A]" /> : <VideoOff className="w-3.5 h-3.5 text-[#F04438]" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Drawer Body: 3. AI Minutes & Highlights */}
          {activeSideTab === 'ai' && (
            <div className="flex-1 p-3 overflow-y-auto space-y-4 text-xs">
              {/* Executive Summary */}
              <div className="space-y-1.5">
                <div className="font-heading text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  <span>Executive Minutes</span>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-300 leading-relaxed text-[11px]">
                  {aiSummary || 'AI Minutes will automatically crystallize discussions and key takeaways once the meeting progresses.'}
                </div>
              </div>

              {/* Action Items */}
              <div className="space-y-2">
                <div className="font-heading text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-[#12B76A]" />
                  <span>Extracted Commitments</span>
                </div>
                {actionItems.length === 0 ? (
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-slate-500 text-[11px]">
                    No action items detected yet.
                  </div>
                ) : (
                  actionItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => toggleActionItem(item.id)}
                      className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-start gap-2.5 cursor-pointer hover:bg-white/10 transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={item.completed}
                        onChange={() => {}}
                        className="mt-0.5 rounded border-white/20 text-[#2563EB]"
                      />
                      <div className="flex-1">
                        <div className={`text-[11px] ${item.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                          {item.text}
                        </div>
                        <div className="text-[10px] text-[#60A5FA] mt-0.5">{item.assignee}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </aside>
      </div>

      {/* 3. Bottom Control Bar */}
      <footer className="h-18 px-4 border-t border-white/10 bg-[#0B0F19] flex items-center justify-between shrink-0 z-30">
        <div className="flex items-center gap-2">
          {/* Microphone toggle */}
          <button
            type="button"
            onClick={toggleMic}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              isMicOn
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-[#F04438] text-white hover:bg-[#D92D20]'
            }`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
          </button>

          {/* Camera toggle */}
          <button
            type="button"
            onClick={toggleCam}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              isCamOn
                ? 'bg-white/10 text-white hover:bg-white/15'
                : 'bg-[#F04438] text-white hover:bg-[#D92D20]'
            }`}
          >
            {isCamOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
          </button>

          {/* Screen Share toggle */}
          <button
            type="button"
            onClick={toggleScreenShare}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              isScreenSharing
                ? 'bg-[#2563EB] text-white hover:bg-[#1D4ED8]'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <MonitorUp className="w-5 h-5" />
          </button>

          {/* Recording toggle */}
          <button
            type="button"
            onClick={handleToggleRecording}
            className={`p-3 rounded-2xl flex items-center justify-center transition-all ${
              isRecording
                ? 'bg-[#F04438] text-white animate-pulse'
                : 'bg-white/10 text-white hover:bg-white/15'
            }`}
          >
            <Radio className="w-5 h-5" />
          </button>
        </div>

        {/* Center: Live Subtitles Caption Toggle */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTranscribing}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 border transition-all ${
              isTranscribing
                ? 'bg-[#12B76A]/20 text-[#12B76A] border-[#12B76A]/40'
                : 'bg-white/5 text-slate-400 border-white/10 hover:text-white'
            }`}
          >
            <Captions className="w-4 h-4" />
            <span>{isTranscribing ? 'Subtitles ON' : 'Subtitles OFF'}</span>
          </button>
        </div>

        {/* Right: Leave / End Meeting */}
        <div className="flex items-center gap-3">
          <Button
            variant="danger"
            size="md"
            icon={<PhoneOff className="w-4 h-4" />}
            onClick={() => {
              if (isHost) {
                setLeaveModalOpen(true)
              } else {
                handleConfirmLeave(false)
              }
            }}
            className="rounded-xl px-5 bg-[#F04438] hover:bg-[#D92D20] text-white font-semibold shadow-lg shadow-[#F04438]/20"
          >
            Leave
          </Button>
        </div>
      </footer>

      {/* Hardware Settings Modal */}
      <Modal
        isOpen={deviceModalOpen}
        onClose={() => setDeviceModalOpen(false)}
        title="Audio & Video Hardware Settings"
        description="Select active microphone, camera input, and audio channels."
      >
        <div className="space-y-4 pt-2">
          {/* Camera Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#344054]">
              Camera Hardware Input
            </label>
            <select
              value={selectedVideoId}
              onChange={(e) => switchCamera(e.target.value)}
              className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
            >
              {videoInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Camera ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          {/* Microphone Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-[#344054]">
              Microphone Audio Input
            </label>
            <select
              value={selectedAudioId}
              onChange={(e) => switchMicrophone(e.target.value)}
              className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
            >
              {audioInputDevices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label || `Microphone ${d.deviceId.slice(0, 5)}`}
                </option>
              ))}
            </select>
          </div>

          <div className="flex justify-end pt-3">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setDeviceModalOpen(false)}
            >
              Done
            </Button>
          </div>
        </div>
      </Modal>

      {/* Leave / End Meeting Confirmation Modal */}
      <Modal
        isOpen={leaveModalOpen}
        onClose={() => setLeaveModalOpen(false)}
        title="Leave Meeting"
        description="Are you sure you want to exit the current session?"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-[#667085]">
            Meeting minutes, transcriptions, and recorded media will be preserved.
          </p>

          <div className="flex flex-col sm:flex-row justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLeaveModalOpen(false)}
            >
              Cancel
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={() => handleConfirmLeave(false)}
            >
              Leave Session
            </Button>

            {isHost && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => handleConfirmLeave(true)}
              >
                End Meeting for All
              </Button>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit Display Name Modal */}
      <Modal
        isOpen={editNameOpen}
        onClose={() => setEditNameOpen(false)}
        title="Edit Display Name"
        description="Choose how you appear to other participants in this meeting room."
      >
        <div className="space-y-4 pt-2">
          <Input
            label="Your Display Name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="e.g. Alex Rivera, Sarah Chen"
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setEditNameOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => {
                if (newName.trim()) {
                  const trimmed = newName.trim()
                  setUserName(trimmed)
                  socket?.emit('update-name', { roomId, userName: trimmed })
                  success(`Name updated to "${trimmed}"`)
                }
                setEditNameOpen(false)
              }}
            >
              Save Name
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
