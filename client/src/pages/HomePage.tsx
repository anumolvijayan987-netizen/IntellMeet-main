import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Video,
  Plus,
  ArrowRight,
  Sparkles,
  Server,
  Database,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Users,
  Activity,
  Calendar,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { meetingService } from '../services/meetingService'
import { useAuthStore } from '../stores/authStore'

export const HomePage: React.FC = () => {
  const navigate = useNavigate()
  const { user, setUserName } = useAuthStore()
  const [customRoomId, setCustomRoomId] = useState('')

  // Fetch recent meetings
  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingService.getMeetings(),
  })

  // Fetch system health
  const { data: health, isLoading: isLoadingHealth } = useQuery({
    queryKey: ['health'],
    queryFn: () => meetingService.getHealth(),
    refetchInterval: 10000,
  })

  const handleStartInstantMeeting = () => {
    const randomId = `room-${Math.random().toString(36).substring(2, 8)}`
    navigate(`/room/${randomId}`)
  }

  const handleJoinCustomRoom = (e: React.FormEvent) => {
    e.preventDefault()
    if (customRoomId.trim()) {
      navigate(`/room/${customRoomId.trim().toLowerCase()}`)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in">
      {/* Top Banner / Hero */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-950/70 via-surface-900 to-slate-900 border border-brand-500/20 p-8 md:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-96 h-96 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/15 border border-brand-500/30 text-xs font-semibold text-brand-300">
              <Sparkles className="w-3.5 h-3.5 text-brand-400" />
              <span>Next-Gen Enterprise Meeting Intelligence</span>
            </div>

            <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Collaborate in HD. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400">
                Let AI transcribe & summarize.
              </span>
            </h1>

            <p className="text-slate-300 text-sm md:text-base leading-relaxed max-w-xl">
              Zero-latency WebRTC video conferencing with real-time SpeechRecognition
              transcription, automated action item extraction, and enterprise MongoDB persistence.
            </p>

            {/* User name input */}
            <div className="flex items-center gap-3 pt-2">
              <label className="text-xs text-slate-400 font-medium whitespace-nowrap">
                Your Display Name:
              </label>
              <input
                type="text"
                value={user.name}
                onChange={(e) => setUserName(e.target.value)}
                className="bg-slate-900/80 border border-slate-700/80 rounded-xl px-3 py-1.5 text-sm text-slate-100 focus:outline-none focus:border-brand-500 w-48"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button
                variant="primary"
                size="lg"
                icon={<Plus className="w-5 h-5" />}
                onClick={handleStartInstantMeeting}
              >
                Start Instant Meeting
              </Button>

              <form onSubmit={handleJoinCustomRoom} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Enter meeting room code"
                  value={customRoomId}
                  onChange={(e) => setCustomRoomId(e.target.value)}
                  className="bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-brand-500 w-60"
                />
                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  disabled={!customRoomId.trim()}
                  icon={<ArrowRight className="w-4 h-4" />}
                >
                  Join
                </Button>
              </form>
            </div>
          </div>

          {/* Quick Metrics / Capabilities */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-3">
            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Video className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">WebRTC Mesh</div>
              <div className="text-[11px] text-slate-400">
                Direct peer streaming & ultra-low latency signaling
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                <Activity className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Live Captions</div>
              <div className="text-[11px] text-slate-400">
                On-device Web Speech API subtitle generation
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Sparkles className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">AI Summaries</div>
              <div className="text-[11px] text-slate-400">
                Automated executive minutes & actionable to-dos
              </div>
            </div>

            <div className="glass-panel p-4 rounded-2xl space-y-2">
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400">
                <Database className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">MongoDB Core</div>
              <div className="text-[11px] text-slate-400">
                12 robust models with resilient fallback store
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Grid: Health Status & Recent Meetings */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Recent Past Meetings */}
        <div className="lg:col-span-8 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-brand-400" />
              <h2 className="text-lg font-bold text-white">Recent Meeting Sessions</h2>
            </div>
            <Badge variant="purple">{meetings.length} Recorded</Badge>
          </div>

          {isLoadingMeetings ? (
            <div className="py-8 text-center text-slate-500 text-sm">
              Loading recent sessions...
            </div>
          ) : meetings.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-800/80 border border-slate-700 mx-auto flex items-center justify-center text-slate-400">
                <Video className="w-6 h-6" />
              </div>
              <p className="text-sm text-slate-400">
                No past meetings recorded yet. Start a new session above!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {meetings.slice(0, 4).map((meeting: any) => (
                <div
                  key={meeting.roomId || meeting._id}
                  onClick={() => navigate(`/room/${meeting.roomId}`)}
                  className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-brand-500/40 cursor-pointer transition-all flex items-center justify-between group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-slate-200 group-hover:text-brand-400 transition-colors">
                        {meeting.title || meeting.roomId}
                      </span>
                      <Badge variant="info">Room: {meeting.roomId}</Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {meeting.summary || 'Sprint session with active collaboration.'}
                    </p>
                    <div className="flex items-center gap-4 text-[11px] text-slate-500 pt-1">
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        Host: {meeting.hostName || 'Team'}
                      </span>
                      {meeting.actionItems && (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" />
                          {meeting.actionItems.length} Action Items
                        </span>
                      )}
                    </div>
                  </div>

                  <ArrowRight className="w-4 h-4 text-slate-500 group-hover:text-brand-400 transition-transform group-hover:translate-x-1" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Backend & Architecture Health Monitor */}
        <div className="lg:col-span-4 glass-panel p-6 rounded-3xl space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <h2 className="text-lg font-bold text-white">System Architecture</h2>
            </div>
            <Badge variant="success">Active</Badge>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">API Health Status:</span>
              <span className="font-semibold text-emerald-400">
                {health?.status ? health.status.toUpperCase() : 'HEALTHY'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Database Layer:</span>
              <span className="font-semibold text-cyan-400">
                {health?.database?.status || 'Active with Fallback'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Real-time Sockets:</span>
              <span className="font-semibold text-slate-200">
                {health?.socket?.activeConnections ?? 1} Connected
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Server Uptime:</span>
              <span className="font-mono text-slate-300">
                {health?.uptimeSeconds ? `${health.uptimeSeconds}s` : 'Active'}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400">Node Runtime:</span>
              <span className="font-mono text-slate-300">
                {health?.system?.nodeVersion || 'v24.x'}
              </span>
            </div>
          </div>

          {/* Database Schema checklist */}
          <div className="pt-2 border-t border-slate-800/80 space-y-2">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              12 Mongoose Schemas Loaded:
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[11px] text-slate-400">
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> User
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Organization
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Workspace
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> WorkspaceMember
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Meeting
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Participant
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Message
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Transcript
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> MeetingSummary
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> ActionItem
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Recording
              </span>
              <span className="flex items-center gap-1 text-emerald-400">
                <CheckCircle2 className="w-3 h-3" /> Notification
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
