import React, { useEffect, useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  MonitorUp,
  MessageSquare,
  Sparkles,
  PhoneOff,
  Send,
  Users,
  Copy,
  CheckCircle2,
  Check,
  Captions,
  Loader2,
  ListTodo,
  Info,
  Shield,
  FileText,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { useSocket } from '../hooks/useSocket'
import { useWebRTC } from '../hooks/useWebRTC'
import { useSpeechRecognition } from '../hooks/useSpeechRecognition'
import { useMeetingStore } from '../stores/meetingStore'
import { useAuthStore } from '../stores/authStore'
import { aiService } from '../services/aiService'
import { meetingService } from '../services/meetingService'
import { ChatMessage } from '../types'

export const MeetingPage: React.FC = () => {
  const { roomId = 'sprint-room' } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { socket, isConnected } = useSocket()
  const user = useAuthStore((s) => s.user)

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
    participantsCount,
    setRoomId,
    toggleMic,
    toggleCam,
    toggleTranscribing,
    setActiveSideTab,
    addMessage,
    setActionItems,
    toggleActionItem,
    setParticipantsCount,
    resetMeetingState,
  } = useMeetingStore()

  // Local state
  const [copiedLink, setCopiedLink] = useState(false)
  const [messageInput, setMessageInput] = useState('')
  const [isGeneratingAi, setIsGeneratingAi] = useState(false)
  const [aiSummary, setAiSummary] = useState<string>('')
  const [keyDecisions, setKeyDecisions] = useState<string[]>([])
  const [isSavingMeeting, setIsSavingMeeting] = useState(false)

  // WebRTC & Speech Recognition Hooks
  const {
    localStream,
    screenStream,
    localVideoRef,
    screenVideoRef,
    deviceError,
    initMedia,
    toggleScreenShare,
  } = useWebRTC()

  useSpeechRecognition(roomId)

  const chatEndRef = useRef<HTMLDivElement | null>(null)

  // Initialize room and local media
  useEffect(() => {
    setRoomId(roomId)
    initMedia()

    if (socket && roomId) {
      socket.emit('join-room', {
        roomId,
        userName: user.name,
        userId: user.id,
      })

      socket.on('user-joined', (data: { userName: string }) => {
        addMessage({
          id: `sys_${Date.now()}`,
          sender: 'IntellMeet Assistant',
          text: `${data.userName} joined the room.`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
        setParticipantsCount(participantsCount + 1)
      })

      socket.on('receive-message', (msg: ChatMessage) => {
        addMessage(msg)
      })

      socket.on('user-left', (data: { userName: string }) => {
        addMessage({
          id: `sys_${Date.now()}`,
          sender: 'IntellMeet Assistant',
          text: `${data.userName || 'A participant'} left the meeting.`,
          isSystem: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        })
      })
    }

    return () => {
      if (socket) {
        socket.emit('leave-room', { roomId })
        socket.off('user-joined')
        socket.off('receive-message')
        socket.off('user-left')
      }
      resetMeetingState()
    }
  }, [roomId, socket, user.name, user.id])

  // Scroll to bottom on new chat messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Send Chat message
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!messageInput.trim() || !socket) return

    const newMsg: ChatMessage = {
      id: `msg_${Date.now()}`,
      sender: user.name,
      text: messageInput.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }

    socket.emit('send-message', {
      roomId,
      message: newMsg,
    })

    setMessageInput('')
  }

  // Copy meeting invite link
  const handleCopyInvite = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopiedLink(true)
    setTimeout(() => setCopiedLink(false), 2500)
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
          : summaryObj?.meetingOverview || ''
      const decisions = summaryObj?.importantDecisions || []
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
    } catch (err: unknown) {
      console.error('AI summary error:', err)
    } finally {
      setIsGeneratingAi(false)
    }
  }

  // End Meeting & Save to MongoDB
  const handleEndMeeting = async () => {
    setIsSavingMeeting(true)
    try {
      await meetingService.saveMeeting({
        roomId,
        title: `Sprint: ${roomId}`,
        hostName: user.name,
        participants: [user.name],
        participantsList: [user.name],
        summary: aiSummary || 'Session ended with live collaboration.',
        keyDecisions,
        actionItems,
      })
      navigate('/history')
    } catch {
      navigate('/history')
    } finally {
      setIsSavingMeeting(false)
    }
  }

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col gap-4">
      {/* Top Header Bar inside room */}
      <div className="flex items-center justify-between bg-surface-900/90 border border-slate-800 px-5 py-3 rounded-2xl shrink-0">
        <div className="flex items-center gap-3">
          <Badge variant="purple" className="text-xs font-mono">
            Room: {roomId}
          </Badge>
          <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
            <Users className="w-3.5 h-3.5 text-brand-400" />
            <span>{participantsCount} in room</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={copiedLink ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            onClick={handleCopyInvite}
          >
            {copiedLink ? 'Link Copied!' : 'Copy Invite'}
          </Button>

          <Button
            variant="primary"
            size="sm"
            icon={isGeneratingAi ? <Loader2 className="w-4 h-4 animate-spin text-white" /> : <Sparkles className="w-4 h-4 text-cyan-300" />}
            disabled={isGeneratingAi}
            onClick={handleGenerateSummary}
          >
            {isGeneratingAi ? 'Summarizing...' : 'Generate AI Minutes'}
          </Button>
        </div>
      </div>

      {/* Main Center Area: Video Stage + Side Drawer */}
      <div className="flex-1 flex gap-4 min-h-0">
        {/* Video Canvas Stage */}
        <div className="flex-1 bg-surface-950 border border-slate-800/80 rounded-3xl relative overflow-hidden flex flex-col justify-between p-4 shadow-2xl">
          {/* Main Video Element */}
          <div className="relative flex-1 w-full h-full rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center">
            {/* Screen Share or Local Webcam */}
            {isScreenSharing ? (
              <video
                ref={screenVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-contain bg-black"
              />
            ) : isCamOn ? (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover scale-x-[-1]"
              />
            ) : (
              <div className="flex flex-col items-center gap-3 text-slate-500">
                <div className="w-20 h-20 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 font-bold text-2xl">
                  {user.name.charAt(0)}
                </div>
                <div className="text-sm font-medium">{user.name} (Camera Off)</div>
              </div>
            )}

            {/* Device permission note if applicable */}
            {deviceError && (
              <div className="absolute top-4 left-4 right-4 bg-amber-950/90 border border-amber-800/80 p-3 rounded-xl flex items-center gap-2 text-xs text-amber-300 backdrop-blur-md">
                <Info className="w-4 h-4 shrink-0" />
                <span>{deviceError}</span>
              </div>
            )}

            {/* Spoken Subtitle Overlay (Live SpeechRecognition) */}
            {isTranscribing && liveSubtitle && (
              <div className="absolute bottom-6 left-6 right-6 flex justify-center pointer-events-none">
                <div className="max-w-2xl bg-black/80 backdrop-blur-md border border-white/10 px-5 py-2.5 rounded-2xl shadow-2xl text-center space-y-0.5 animate-fade-in">
                  <div className="text-[10px] font-semibold text-cyan-400 uppercase tracking-wider flex items-center justify-center gap-1">
                    <Captions className="w-3 h-3" />
                    {liveSubtitleSpeaker || user.name}
                  </div>
                  <div className="text-sm text-slate-100 font-medium">
                    "{liveSubtitle}"
                  </div>
                </div>
              </div>
            )}

            {/* Video overlay badge: Username */}
            <div className="absolute bottom-4 left-4 bg-slate-900/80 backdrop-blur-sm border border-slate-700/80 px-3 py-1 rounded-xl text-xs font-medium text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span>{user.name} (You)</span>
              {!isMicOn && <MicOff className="w-3 h-3 text-rose-400" />}
            </div>
          </div>

          {/* Bottom Floating Conference Control Bar */}
          <div className="mt-4 flex items-center justify-center gap-3">
            {/* Mic Toggle */}
            <Button
              variant={isMicOn ? 'secondary' : 'danger'}
              size="md"
              icon={isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
              onClick={toggleMic}
            >
              {isMicOn ? 'Mute' : 'Unmute'}
            </Button>

            {/* Camera Toggle */}
            <Button
              variant={isCamOn ? 'secondary' : 'danger'}
              size="md"
              icon={isCamOn ? <VideoIcon className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
              onClick={toggleCam}
            >
              {isCamOn ? 'Stop Video' : 'Start Video'}
            </Button>

            {/* Screen Share */}
            <Button
              variant={isScreenSharing ? 'primary' : 'secondary'}
              size="md"
              icon={<MonitorUp className="w-4 h-4" />}
              onClick={toggleScreenShare}
            >
              {isScreenSharing ? 'Stop Share' : 'Share Screen'}
            </Button>

            {/* Live Subtitles Toggle */}
            <Button
              variant={isTranscribing ? 'outline' : 'ghost'}
              size="md"
              icon={<Captions className="w-4 h-4 text-cyan-400" />}
              onClick={toggleTranscribing}
            >
              Captions {isTranscribing ? 'ON' : 'OFF'}
            </Button>

            {/* Side Tabs Toggle: Chat vs AI */}
            <Button
              variant={activeSideTab === 'chat' ? 'outline' : 'ghost'}
              size="md"
              icon={<MessageSquare className="w-4 h-4" />}
              onClick={() => setActiveSideTab('chat')}
            >
              Chat
            </Button>

            <Button
              variant={activeSideTab === 'ai' ? 'outline' : 'ghost'}
              size="md"
              icon={<Sparkles className="w-4 h-4 text-brand-400" />}
              onClick={() => setActiveSideTab('ai')}
            >
              AI Minutes
            </Button>

            {/* Leave / End Call */}
            <Button
              variant="danger"
              size="md"
              icon={isSavingMeeting ? <Loader2 className="w-4 h-4 animate-spin" /> : <PhoneOff className="w-4 h-4" />}
              disabled={isSavingMeeting}
              onClick={handleEndMeeting}
            >
              {isSavingMeeting ? 'Saving...' : 'End Session'}
            </Button>
          </div>
        </div>

        {/* Right Side Drawer: Chat or AI Meeting Minutes */}
        <div className="w-80 md:w-96 glass-panel rounded-3xl flex flex-col overflow-hidden shrink-0">
          {/* Drawer Tabs */}
          <div className="flex border-b border-slate-800 bg-surface-900/60 p-2 gap-1">
            <button
              onClick={() => setActiveSideTab('chat')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                activeSideTab === 'chat'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Room Chat ({messages.length})
            </button>

            <button
              onClick={() => setActiveSideTab('ai')}
              className={`flex-1 py-2 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 transition-colors ${
                activeSideTab === 'ai'
                  ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              AI Summary
            </button>
          </div>

          {/* Chat Tab Panel */}
          {activeSideTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500">
                    No messages yet. Send a greeting to the room!
                  </div>
                ) : (
                  messages.map((m) => (
                    <div
                      key={m.id}
                      className={`space-y-1 ${
                        m.isSystem
                          ? 'text-center my-2'
                          : m.sender === user.name
                          ? 'text-right'
                          : 'text-left'
                      }`}
                    >
                      {m.isSystem ? (
                        <span className="inline-block text-[11px] px-3 py-1 rounded-full bg-slate-800 text-slate-400">
                          {m.text}
                        </span>
                      ) : (
                        <div>
                          <div className="text-[10px] text-slate-500 font-medium">
                            {m.sender} • {m.timestamp}
                          </div>
                          <div
                            className={`inline-block px-3.5 py-2 rounded-2xl text-xs max-w-[85%] text-left ${
                              m.sender === user.name
                                ? 'bg-brand-600 text-white rounded-br-none'
                                : 'bg-slate-800 text-slate-200 rounded-bl-none'
                            }`}
                          >
                            {m.text}
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Message Input Form */}
              <form
                onSubmit={handleSendMessage}
                className="p-3 border-t border-slate-800 flex items-center gap-2 bg-surface-900/60"
              >
                <input
                  type="text"
                  placeholder="Type a message to room..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  disabled={!messageInput.trim()}
                  icon={<Send className="w-3.5 h-3.5" />}
                >
                  Send
                </Button>
              </form>
            </div>
          )}

          {/* AI Summary Tab Panel */}
          {activeSideTab === 'ai' && (
            <div className="flex-1 overflow-y-auto p-4 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  Meeting Intelligence
                </div>
                <Badge variant="info">AI Powered</Badge>
              </div>

              {/* Executive Summary */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-brand-400" />
                  Executive Summary
                </div>
                <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 leading-relaxed">
                  {aiSummary ||
                    'Click "Generate AI Minutes" at any time to summarize discussions, key decisions, and extracted tasks.'}
                </div>
              </div>

              {/* Key Decisions */}
              {keyDecisions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    Key Decisions ({keyDecisions.length})
                  </div>
                  <ul className="space-y-2">
                    {keyDecisions.map((decision, idx) => (
                      <li
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 flex items-start gap-2"
                      >
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Items Checklist */}
              {actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                    <ListTodo className="w-3.5 h-3.5 text-amber-400" />
                    Action Items ({actionItems.length})
                  </div>
                  <div className="space-y-2">
                    {actionItems.map((item) => (
                      <div
                        key={item.id}
                        onClick={() => toggleActionItem(item.id)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-2.5 ${
                          item.completed
                            ? 'bg-emerald-950/20 border-emerald-800/40 text-slate-400 line-through'
                            : 'bg-slate-900/80 border-slate-800 text-slate-200 hover:border-slate-700'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={item.completed}
                          onChange={() => {}}
                          className="mt-0.5 rounded border-slate-700 text-brand-600 focus:ring-0"
                        />
                        <div className="space-y-0.5">
                          <div>{item.text}</div>
                          <div className="text-[10px] text-slate-500">
                            Assignee: <span className="text-brand-400">{item.assignee}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
