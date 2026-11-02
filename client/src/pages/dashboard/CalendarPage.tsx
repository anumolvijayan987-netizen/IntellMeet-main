import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  CalendarDays,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Clock,
  Video,
  Users,
  Plus,
  ExternalLink,
  Shield,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Globe,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { meetingService } from '../../services/meetingService'
import { MeetingRecord } from '../../types'

export const CalendarPage: React.FC = () => {
  const navigate = useNavigate()
  const [currentDate, setCurrentDate] = useState(new Date(2026, 10, 1)) // Nov 2026
  const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month')
  const [meetings, setMeetings] = useState<any[]>([])
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)

  useEffect(() => {
    meetingService
      .getMeetings()
      .then((data) => {
        if (data && data.length > 0) {
          setMeetings(data)
        } else {
          setMeetings([
            {
              roomId: 'sprint-plan-q4',
              title: 'Sprint Planning & Backlog Grooming',
              scheduledStartTime: new Date(2026, 10, 2, 14, 0).toISOString(),
              durationMinutes: 45,
              timezone: 'UTC-5',
              hostName: 'Sarah Chen',
              participantsList: ['Sarah Chen', 'David Miller', 'Elena Rostova'],
              status: 'scheduled',
            },
            {
              roomId: 'arch-soc2-review',
              title: 'Enterprise Architecture & SOC-2 Sync',
              scheduledStartTime: new Date(2026, 10, 5, 16, 30).toISOString(),
              durationMinutes: 45,
              timezone: 'UTC',
              hostName: 'David Miller',
              participantsList: ['David Miller', 'Sarah Chen'],
              status: 'scheduled',
            },
            {
              roomId: 'design-critique-wk',
              title: 'Weekly Cross-Functional Design Critique',
              scheduledStartTime: new Date(2026, 10, 10, 10, 0).toISOString(),
              durationMinutes: 60,
              timezone: 'UTC+1',
              hostName: 'Elena Rostova',
              participantsList: ['Elena Rostova', 'Emily Watson'],
              status: 'scheduled',
            },
          ])
        }
      })
      .catch(() => {})
  }, [])

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ]

  const currentYear = currentDate.getFullYear()
  const currentMonth = currentDate.getMonth()

  const handlePrev = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth - 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))
    } else {
      setCurrentDate(new Date(currentDate.getTime() - 86400000))
    }
  }

  const handleNext = () => {
    if (viewMode === 'month') {
      setCurrentDate(new Date(currentYear, currentMonth + 1, 1))
    } else if (viewMode === 'week') {
      setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))
    } else {
      setCurrentDate(new Date(currentDate.getTime() + 86400000))
    }
  }

  const handleToday = () => {
    setCurrentDate(new Date(2026, 10, 2))
  }

  // Days in month calculation
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay()

  const openMeetingDetails = (meeting: any) => {
    setSelectedMeeting(meeting)
    setDetailsModalOpen(true)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-[#101828]">
              Meeting Calendar
            </h1>
            <Badge variant="primary" size="sm">
              <CalendarDays className="w-3.5 h-3.5 text-[#2563EB]" /> Live Calendar
            </Badge>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Integrated schedule across workspaces, timezone coordination, and external provider integration.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/schedule">
            <Button variant="primary" size="sm" icon={<Plus className="w-4 h-4" />}>
              Schedule Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Calendar Controls & View Toggle Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-3.5 rounded-2xl border border-[#EAECF0]">
        <div className="flex items-center gap-3">
          <h2 className="font-heading font-bold text-base text-[#101828] min-w-[180px]">
            {monthNames[currentMonth]} {currentYear}
          </h2>

          <div className="flex items-center gap-1 border border-[#D0D5DD] rounded-lg p-0.5 bg-[#F8FAFC]">
            <button
              onClick={handlePrev}
              className="p-1.5 rounded text-[#667085] hover:text-[#101828] hover:bg-white transition-colors"
              title="Previous"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold text-[#344054] hover:bg-white rounded transition-colors"
            >
              Today
            </button>
            <button
              onClick={handleNext}
              className="p-1.5 rounded text-[#667085] hover:text-[#101828] hover:bg-white transition-colors"
              title="Next"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* View Mode Selector */}
        <div className="flex items-center gap-1 bg-[#F8FAFC] border border-[#EAECF0] p-1 rounded-lg text-xs">
          <button
            onClick={() => setViewMode('day')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'day'
                ? 'bg-white text-[#101828] shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#101828]'
            }`}
          >
            Day View
          </button>
          <button
            onClick={() => setViewMode('week')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'week'
                ? 'bg-white text-[#101828] shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#101828]'
            }`}
          >
            Week View
          </button>
          <button
            onClick={() => setViewMode('month')}
            className={`px-3 py-1 rounded-md font-medium transition-all ${
              viewMode === 'month'
                ? 'bg-white text-[#101828] shadow-xs font-semibold'
                : 'text-[#667085] hover:text-[#101828]'
            }`}
          >
            Month View
          </button>
        </div>
      </div>

      {/* VIEW 1: MONTH VIEW */}
      {viewMode === 'month' && (
        <Card padding="none" className="overflow-hidden">
          {/* Weekday headers */}
          <div className="grid grid-cols-7 border-b border-[#EAECF0] bg-[#F8FAFC] text-center text-[11px] font-semibold text-[#667085] py-2.5">
            <div>SUN</div>
            <div>MON</div>
            <div>TUE</div>
            <div>WED</div>
            <div>THU</div>
            <div>FRI</div>
            <div>SAT</div>
          </div>

          {/* Month day grid */}
          <div className="grid grid-cols-7 auto-rows-fr divide-x divide-y divide-[#EAECF0] bg-white">
            {/* Empty offset padding for days before 1st */}
            {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
              <div key={`empty_${idx}`} className="h-28 bg-[#F8FAFC]/50 p-2" />
            ))}

            {/* Days in Month */}
            {Array.from({ length: daysInMonth }).map((_, idx) => {
              const dayNumber = idx + 1
              const dayMeetings = meetings.filter((m) => {
                const d = new Date(m.scheduledStartTime || m.createdAt)
                return d.getDate() === dayNumber && d.getMonth() === currentMonth
              })

              const isToday = dayNumber === 2 && currentMonth === 10

              return (
                <div
                  key={`day_${dayNumber}`}
                  className={`h-28 p-2 overflow-y-auto space-y-1 transition-colors hover:bg-[#F8FAFC] ${
                    isToday ? 'bg-[#EFF8FF]/40' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isToday
                          ? 'w-5 h-5 rounded-full bg-[#2563EB] text-white flex items-center justify-center'
                          : 'text-[#475467]'
                      }`}
                    >
                      {dayNumber}
                    </span>
                  </div>

                  {dayMeetings.map((m, mIdx) => (
                    <div
                      key={m.roomId || mIdx}
                      onClick={() => openMeetingDetails(m)}
                      className="p-1 rounded bg-[#EFF8FF] text-[#175CD3] border border-[#B2DDFF] text-[10px] font-medium truncate cursor-pointer hover:bg-[#D1E9FF] transition-colors"
                      title={m.title}
                    >
                      {m.title}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* VIEW 2: WEEK VIEW */}
      {viewMode === 'week' && (
        <Card padding="none" className="overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[#EAECF0] bg-[#F8FAFC] text-center text-xs font-semibold text-[#667085] py-3">
            <div>Mon, Nov 2</div>
            <div>Tue, Nov 3</div>
            <div>Wed, Nov 4</div>
            <div>Thu, Nov 5</div>
            <div>Fri, Nov 6</div>
            <div>Sat, Nov 7</div>
            <div>Sun, Nov 8</div>
          </div>
          <div className="grid grid-cols-7 divide-x divide-[#EAECF0] min-h-[360px] bg-white p-2">
            {Array.from({ length: 7 }).map((_, idx) => {
              const dayNumber = idx + 2
              const dayMeetings = meetings.filter((m) => {
                const d = new Date(m.scheduledStartTime || m.createdAt)
                return d.getDate() === dayNumber
              })

              return (
                <div key={idx} className="p-2 space-y-2">
                  {dayMeetings.map((m, mIdx) => (
                    <div
                      key={m.roomId || mIdx}
                      onClick={() => openMeetingDetails(m)}
                      className="p-2.5 rounded-xl bg-[#EFF8FF] border border-[#B2DDFF] text-xs space-y-1 cursor-pointer hover:shadow-subtle transition-all"
                    >
                      <div className="font-semibold text-[#175CD3] line-clamp-1">{m.title}</div>
                      <div className="text-[10px] text-[#2563EB] flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {m.durationMinutes || 45} mins
                      </div>
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {/* VIEW 3: DAY VIEW */}
      {viewMode === 'day' && (
        <Card className="space-y-4">
          <div className="flex items-center justify-between border-b border-[#EAECF0] pb-3">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Agenda for Today: Monday, Nov 2, 2026
            </h3>
            <Badge variant="primary" size="sm">
              3 Scheduled Sessions
            </Badge>
          </div>

          <div className="space-y-3">
            {meetings.map((m, idx) => (
              <div
                key={m.roomId || idx}
                onClick={() => openMeetingDetails(m)}
                className="p-4 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] hover:bg-white hover:border-[#2563EB] hover:shadow-subtle transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm text-[#101828]">{m.title}</span>
                    <Badge variant="primary" size="sm">
                      {m.roomId}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085]">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#98A2B3]" /> 14:00 – 14:45 ({m.timezone || 'UTC-5'})
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#98A2B3]" /> Host: {m.hostName || 'Sarah Chen'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/room/${m.roomId}`}>
                    <Button variant="primary" size="sm" icon={<Video className="w-3.5 h-3.5" />}>
                      Join Meeting
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* External Calendar Provider Sync Integration Card */}
      <Card className="p-5 border border-[#EAECF0] bg-white space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAECF0] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#EFF8FF] text-[#2563EB] flex items-center justify-center shrink-0">
              <Globe className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-semibold text-sm text-[#101828]">
                External Calendar Provider Sync
              </h3>
              <p className="text-xs text-[#667085]">
                Bi-directional calendar synchronisation with Google Workspace & Microsoft 365.
              </p>
            </div>
          </div>

          <Badge variant="gray" size="sm">
            Ready for OAuth Link
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D0D5DD] flex items-center justify-center font-bold text-[#EA4335]">
                G
              </div>
              <div>
                <div className="font-semibold text-[#101828]">Google Calendar</div>
                <div className="text-[11px] text-[#667085]">Status: Not connected</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Connect Google
            </Button>
          </div>

          <div className="p-3.5 rounded-xl border border-[#EAECF0] bg-[#F8FAFC] flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-white border border-[#D0D5DD] flex items-center justify-center font-bold text-[#0078D4]">
                M
              </div>
              <div>
                <div className="font-semibold text-[#101828]">Microsoft Outlook</div>
                <div className="text-[11px] text-[#667085]">Status: Not connected</div>
              </div>
            </div>
            <Button variant="outline" size="sm">
              Connect Outlook
            </Button>
          </div>
        </div>
      </Card>

      {/* Meeting Details Modal */}
      {selectedMeeting && (
        <Modal
          isOpen={detailsModalOpen}
          onClose={() => setDetailsModalOpen(false)}
          title="Meeting Details"
          description="Review scheduled parameters and attendee roster."
        >
          <div className="space-y-4 pt-2 text-xs">
            <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] space-y-2">
              <div className="flex justify-between">
                <span className="text-[#667085]">Title:</span>
                <span className="font-semibold text-[#101828]">{selectedMeeting.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Room Code:</span>
                <span className="font-mono text-[#2563EB] font-bold">{selectedMeeting.roomId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Host:</span>
                <span className="text-[#101828] font-medium">{selectedMeeting.hostName || 'Host'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Duration:</span>
                <span className="text-[#101828]">{selectedMeeting.durationMinutes || 45} minutes</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#667085]">Timezone:</span>
                <span className="text-[#101828]">{selectedMeeting.timezone || 'UTC'}</span>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setDetailsModalOpen(false)}
              >
                Close
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDetailsModalOpen(false)
                  navigate(`/room/${selectedMeeting.roomId}`)
                }}
                icon={<Video className="w-3.5 h-3.5" />}
              >
                Join Meeting
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
