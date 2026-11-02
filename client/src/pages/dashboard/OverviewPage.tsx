import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  Video,
  CalendarPlus,
  Plus,
  MonitorUp,
  Clock,
  CheckCircle2,
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Copy,
  Check,
  Calendar,
  AlertCircle,
  FileText,
  Activity,
  MoreVertical,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { useAuthStore } from '../../stores/authStore'
import { meetingService } from '../../services/meetingService'
import { actionItemService, ActionItemDto } from '../../services/actionItemService'
import { useToast } from '../../contexts/ToastContext'

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { success, info, error } = useToast()
  const [copiedRoomId, setCopiedRoomId] = useState<string | null>(null)

  // Fetch past and recorded meetings from server
  const { data: meetings = [], isLoading: isLoadingMeetings } = useQuery({
    queryKey: ['meetings'],
    queryFn: () => meetingService.getMeetings(),
  })

  // Fetch real upcoming meetings from server
  const { data: serverUpcoming = [] } = useQuery({
    queryKey: ['upcoming-meetings'],
    queryFn: () => meetingService.getUpcomingMeetings().catch(() => []),
  })

  // Fetch real action items from server
  const { data: serverTasks = [], refetch: refetchTasks } = useQuery({
    queryKey: ['action-items-overview'],
    queryFn: () => actionItemService.getActionItems().catch(() => []),
  })

  // Fallback upcoming meetings schedule if server has none yet
  const defaultUpcoming = [
    {
      id: 'm1',
      title: 'Sprint Planning & Backlog Grooming',
      roomId: 'sprint-plan-q4',
      time: 'Today, 2:00 PM – 2:45 PM',
      participants: ['Sarah Chen', 'David Miller', 'Elena Rostova'],
      host: 'Sarah Chen (You)',
      isHost: true,
    },
    {
      id: 'm2',
      title: 'Enterprise Architecture & SOC-2 Sync',
      roomId: 'arch-soc2-review',
      time: 'Today, 4:30 PM – 5:15 PM',
      participants: ['Alex Morgan', 'Marcus Vance', 'Sarah Chen'],
      host: 'Alex Morgan',
      isHost: false,
    },
    {
      id: 'm3',
      title: 'Weekly Cross-Functional Design Critique',
      roomId: 'design-critique-wk',
      time: 'Tomorrow, 10:00 AM – 11:00 AM',
      participants: ['Emily Watson', 'James Lee', 'Sarah Chen'],
      host: 'Emily Watson',
      isHost: false,
    },
  ]

  // Fallback tasks if server has none yet
  const defaultTasks = [
    {
      id: 't1',
      title: 'Finalize WebRTC STUN/TURN fallback verification',
      meeting: 'Sprint Planning',
      dueDate: 'Today',
      priority: 'high',
      completed: false,
    },
    {
      id: 't2',
      title: 'Review SOC-2 audit logging requirements for transcript storage',
      meeting: 'Architecture Sync',
      dueDate: 'Tomorrow',
      priority: 'medium',
      completed: false,
    },
    {
      id: 't3',
      title: 'Verify HTML5 Web Speech continuous subtitle auto-restart',
      meeting: 'Client Engine Review',
      dueDate: 'Nov 2',
      priority: 'high',
      completed: true,
    },
    {
      id: 't4',
      title: 'Distribute AI meeting minutes to executive leadership',
      meeting: 'Weekly Standup',
      dueDate: 'Nov 4',
      priority: 'low',
      completed: false,
    },
  ]

  const upcomingMeetings = serverUpcoming.length > 0
    ? serverUpcoming.map((m: any) => ({
        id: m._id || m.id || m.roomId,
        title: m.title || 'Scheduled Meeting',
        roomId: m.roomId,
        time: m.date ? `${m.date} at ${m.time || '10:00 AM'}` : 'Upcoming',
        participants: m.attendees ? m.attendees.split(',').map((a: string) => a.trim()) : ['Team'],
        host: m.hostName || 'Organizer',
        isHost: m.hostId === user.id || m.hostName?.includes(user.name),
      }))
    : defaultUpcoming

  const [localTasks, setLocalTasks] = useState(defaultTasks)

  const displayTasks = serverTasks.length > 0
    ? serverTasks.map((t) => ({
        id: t._id || t.id || '',
        title: t.title || t.text || 'Action Item',
        meeting: t.meetingTitle || 'Sprint Session',
        dueDate: t.dueDate ? String(t.dueDate).slice(0, 10) : 'Pending',
        priority: t.priority || 'medium',
        completed: t.status === 'completed',
      }))
    : localTasks

  const toggleTask = async (id: string) => {
    const task = displayTasks.find((t) => t.id === id)
    if (!task) return

    const newStatus = task.completed ? 'pending' : 'completed'

    if (serverTasks.length > 0) {
      try {
        await actionItemService.updateActionItem(id, { status: newStatus as any })
        refetchTasks()
        info(`Action item marked as ${newStatus}`)
      } catch {
        setLocalTasks((prev) =>
          prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
        )
      }
    } else {
      setLocalTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
      )
      info(`Action item status updated`)
    }
  }

  const handleStartInstant = async () => {
    try {
      const res = await meetingService.createMeeting({
        title: `${user.name}'s Instant Conference`,
      })
      success(`Instant meeting ready: ${res.roomId}`)
      navigate(`/room/${res.roomId}`)
    } catch {
      const fallbackRoom = `room-${Math.random().toString(36).substring(2, 8)}`
      info(`Starting instant conference: ${fallbackRoom}`)
      navigate(`/room/${fallbackRoom}`)
    }
  }

  const handleCopyLink = (roomId: string) => {
    const link = `${window.location.origin}/room/${roomId}`
    navigator.clipboard.writeText(link)
    setCopiedRoomId(roomId)
    success('Meeting link copied to clipboard!')
    setTimeout(() => setCopiedRoomId(null), 2000)
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* 1. Header Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-[#EAECF0]">
        <div>
          <h1 className="font-heading text-2xl sm:text-3xl font-bold text-[#101828] tracking-tight">
            Welcome back, {user.name.split(' ')[0]} 👋
          </h1>
          <p className="text-xs sm:text-sm text-[#667085] mt-1">
            Here is what is happening across your meetings and team workspaces today.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="md"
            icon={<Video className="w-4 h-4" />}
            onClick={handleStartInstant}
          >
            Start Instant Meeting
          </Button>
          <Link to="/app/schedule">
            <Button
              variant="secondary"
              size="md"
              icon={<CalendarPlus className="w-4 h-4 text-[#2563EB]" />}
            >
              Schedule Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* 2. Key Meeting Statistics (4 Cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-medium">Total Meeting Time</span>
            <div className="w-8 h-8 rounded-lg bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-[#101828]">38.5 hrs</span>
            <span className="text-xs font-semibold text-[#12B76A] flex items-center">
              <TrendingUp className="w-3 h-3 mr-0.5" /> +12%
            </span>
          </div>
          <p className="text-[11px] text-[#667085]">Across 24 sessions this month</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-medium">Meetings This Week</span>
            <div className="w-8 h-8 rounded-lg bg-[#ECFDF3] text-[#027A48] flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-[#101828]">14</span>
            <span className="text-xs font-semibold text-[#12B76A]">On schedule</span>
          </div>
          <p className="text-[11px] text-[#667085]">3 remaining for today</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-medium">Action Items Completion</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFFAEB] text-[#B54708] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-[#101828]">92%</span>
            <span className="text-xs font-semibold text-[#12B76A]">+4% vs last week</span>
          </div>
          <p className="text-[11px] text-[#667085]">34 tasks resolved of 37 extracted</p>
        </Card>

        <Card className="space-y-2">
          <div className="flex items-center justify-between text-xs text-[#667085]">
            <span className="font-medium">AI Hours Saved</span>
            <div className="w-8 h-8 rounded-lg bg-[#F8FAFC] text-[#2563EB] border border-[#EAECF0] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold font-heading text-[#101828]">18.4 hrs</span>
            <span className="text-xs font-semibold text-[#2563EB]">Automated</span>
          </div>
          <p className="text-[11px] text-[#667085]">Zero manual note-taking required</p>
        </Card>
      </div>

      {/* 3. Main Split View: Upcoming Meetings + Pending Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Upcoming Meetings (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-heading text-base font-bold text-[#101828]">
                  Upcoming Meetings
                </h2>
              </div>
              <Link
                to="/app/meetings"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3">
              {upcomingMeetings.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] hover:bg-white hover:shadow-subtle transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-[#101828] group-hover:text-[#2563EB] transition-colors">
                        {m.title}
                      </span>
                      {m.isHost && (
                        <Badge variant="primary" size="sm">
                          Host
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-[#667085]">
                      <span className="flex items-center gap-1 font-medium text-[#344054]">
                        <Clock className="w-3.5 h-3.5 text-[#98A2B3]" /> {m.time}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#98A2B3]" /> {m.participants.length} attendees
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleCopyLink(m.roomId)}
                      title="Copy invitation link"
                      className="p-2 rounded-lg border border-[#D0D5DD] bg-white text-[#667085] hover:text-[#101828] text-xs transition-colors"
                    >
                      {copiedRoomId === m.roomId ? (
                        <Check className="w-3.5 h-3.5 text-[#12B76A]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                    <Link to={`/room/${m.roomId}`}>
                      <Button variant="primary" size="sm" icon={<Video className="w-3.5 h-3.5" />}>
                        Join
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Recent Meeting Reports */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#2563EB]" />
                <h2 className="font-heading text-base font-bold text-[#101828]">
                  Recent Meeting Minutes & Transcripts
                </h2>
              </div>
              <Link
                to="/app/history"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1"
              >
                Full Archive <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            {isLoadingMeetings ? (
              <div className="py-8 text-center text-xs text-[#667085]">
                Loading recent meeting intelligence...
              </div>
            ) : meetings.length === 0 ? (
              <div className="py-6 text-center text-xs text-[#667085]">
                No recorded meetings found. Completed sessions will automatically save here.
              </div>
            ) : (
              <div className="space-y-2.5">
                {meetings.slice(0, 3).map((meeting: any) => (
                  <div
                    key={meeting.roomId || meeting._id}
                    onClick={() => navigate(`/room/${meeting.roomId}`)}
                    className="p-3.5 rounded-xl border border-[#EAECF0] hover:border-[#D0D5DD] hover:bg-[#F8FAFC] cursor-pointer transition-all flex items-center justify-between"
                  >
                    <div className="space-y-1 max-w-[80%]">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-[#101828]">
                          {meeting.title || meeting.roomId}
                        </span>
                        <Badge variant="success" size="sm">
                          AI Summarized
                        </Badge>
                      </div>
                      <p className="text-[11px] text-[#667085] truncate">
                        {meeting.summary || 'Sprint session with active multi-user discussions.'}
                      </p>
                    </div>

                    <ArrowRight className="w-4 h-4 text-[#98A2B3]" />
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Pending Action Items & AI Highlights (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Action Items Checklist */}
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-[#12B76A]" />
                <h2 className="font-heading text-base font-bold text-[#101828]">
                  Action Items ({displayTasks.filter((t) => !t.completed).length} Pending)
                </h2>
              </div>
              <Link
                to="/app/tasks"
                className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8]"
              >
                Task Board
              </Link>
            </div>

            <div className="space-y-2.5">
              {displayTasks.map((task) => (
                <div
                  key={task.id}
                  onClick={() => toggleTask(String(task.id))}
                  className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 select-none ${
                    task.completed
                      ? 'bg-[#F8FAFC] border-[#EAECF0] text-[#98A2B3] line-through'
                      : 'bg-white border-[#EAECF0] hover:border-[#D0D5DD] text-[#101828]'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => {}}
                    className="mt-0.5 rounded border-[#D0D5DD] text-[#2563EB] focus:ring-0"
                  />
                  <div className="space-y-1 flex-1">
                    <div className="font-medium leading-snug">{task.title}</div>
                    <div className="flex items-center gap-2 text-[10px] text-[#667085]">
                      <span>{task.meeting}</span>
                      <span>•</span>
                      <span className={task.dueDate === 'Today' ? 'text-[#F04438] font-bold' : ''}>
                        Due {task.dueDate}
                      </span>
                    </div>
                  </div>
                  <Badge
                    variant={
                      task.priority === 'high'
                        ? 'error'
                        : task.priority === 'medium'
                        ? 'warning'
                        : 'gray'
                    }
                    size="sm"
                  >
                    {task.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* AI Insights & Trend Card */}
          <Card className="space-y-3 bg-gradient-to-br from-[#EFF8FF] to-white border-[#B2DDFF]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#2563EB]" />
                <span className="font-heading font-bold text-xs text-[#175CD3] uppercase tracking-wider">
                  Weekly AI Meeting Trend
                </span>
              </div>
              <Badge variant="primary" size="sm">
                Positive (94%)
              </Badge>
            </div>

            <p className="text-xs text-[#344054] leading-relaxed">
              Top keywords trending across team calls: <span className="font-semibold text-[#101828]">WebRTC Mesh</span>, <span className="font-semibold text-[#101828]">SOC-2 Compliance</span>, and <span className="font-semibold text-[#101828]">V2.0 Launch</span>.
            </p>

            <div className="pt-2 border-t border-[#B2DDFF]/40 flex items-center justify-between text-[11px] text-[#475467]">
              <span>Team consensus index: 9.2/10</span>
              <Link to="/app/insights" className="font-semibold text-[#2563EB] hover:underline">
                Explore Analytics →
              </Link>
            </div>
          </Card>

          {/* Team Activity Stream */}
          <Card className="space-y-3">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#667085]" />
              <h3 className="font-heading text-xs font-bold text-[#101828] uppercase tracking-wider">
                Live Team Activity
              </h3>
            </div>

            <div className="space-y-3 text-xs text-[#667085]">
              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#12B76A] mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-[#101828]">Sarah Chen</span> ended{' '}
                  <span className="text-[#2563EB]">Sprint Q4 Review</span> with 3 action items.
                  <div className="text-[10px] text-[#98A2B3]">12 minutes ago</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#2563EB] mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-[#101828]">Elena Rostova</span> uploaded a new cloud recording.
                  <div className="text-[10px] text-[#98A2B3]">45 minutes ago</div>
                </div>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="w-2 h-2 rounded-full bg-[#F79009] mt-1.5 shrink-0" />
                <div>
                  <span className="font-medium text-[#101828]">David Miller</span> scheduled{' '}
                  <span className="text-[#101828] font-medium">Architecture Sync</span> for today 4:30 PM.
                  <div className="text-[10px] text-[#98A2B3]">2 hours ago</div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
