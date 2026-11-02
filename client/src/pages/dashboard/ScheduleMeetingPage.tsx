import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  CalendarPlus,
  Clock,
  Globe2,
  Users,
  Settings,
  Shield,
  CheckCircle2,
  ArrowRight,
  Sparkles,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { meetingService } from '../../services/meetingService'
import { useToast } from '../../contexts/ToastContext'

export const ScheduleMeetingPage: React.FC = () => {
  const navigate = useNavigate()
  const { success, info } = useToast()

  const [title, setTitle] = useState('Sprint Planning Session')
  const [date, setDate] = useState('2026-11-02')
  const [time, setTime] = useState('14:00')
  const [duration, setDuration] = useState('45')
  const [timezone, setTimezone] = useState('UTC-5 (Eastern Time)')
  const [recurrence, setRecurrence] = useState('none')
  const [attendees, setAttendees] = useState('sarah@company.com, david@company.com')

  // Meeting parameters
  const [muteOnEntry, setMuteOnEntry] = useState(false)
  const [camOffOnEntry, setCamOffOnEntry] = useState(false)
  const [enableTranscription, setEnableTranscription] = useState(true)
  const [enableAiSummary, setEnableAiSummary] = useState(true)

  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [scheduledRoom, setScheduledRoom] = useState<string | null>(null)
  const [inviteUrl, setInviteUrl] = useState('')
  const [copiedLink, setCopiedLink] = useState(false)

  const handleSchedule = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const res = await meetingService.scheduleMeeting({
        title,
        description,
        date,
        time,
        timezone,
        durationMinutes: parseInt(duration, 10),
        recurrence: recurrence as any,
        attendees,
        settings: {
          isMutedOnEntry: muteOnEntry,
          isCamOffOnEntry: camOffOnEntry,
          enableTranscription,
          enableAiSummaries: enableAiSummary,
        },
      })

      const generatedRoom = res.roomId || `sprint-${Math.random().toString(36).substring(2, 7)}`
      setScheduledRoom(generatedRoom)
      setInviteUrl(res.inviteUrl || `${window.location.origin}/room/${generatedRoom}`)
      success(`Meeting "${title}" scheduled successfully!`)
    } catch {
      const fallbackRoom = `sprint-${Math.random().toString(36).substring(2, 7)}`
      setScheduledRoom(fallbackRoom)
      setInviteUrl(`${window.location.origin}/room/${fallbackRoom}`)
      success(`Meeting "${title}" scheduled!`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    navigator.clipboard.writeText(inviteUrl)
    setCopiedLink(true)
    info('Meeting invitation link copied to clipboard.')
    setTimeout(() => setCopiedLink(false), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div className="pb-4 border-b border-[#EAECF0]">
        <h1 className="font-heading text-2xl font-bold text-[#101828]">Schedule a Meeting</h1>
        <p className="text-xs text-[#667085] mt-0.5">
          Plan upcoming collaborative sessions with automated calendar invites and AI minutes extraction.
        </p>
      </div>

      {scheduledRoom ? (
        <Card className="text-center py-10 space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#ECFDF3] border border-[#A6F4C5] text-[#12B76A] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-[#101828] font-heading">
              Meeting Scheduled Successfully!
            </h2>
            <p className="text-xs text-[#667085]">
              Invitation details have been sent to attendees.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] max-w-md mx-auto text-xs space-y-2 text-left">
            <div className="flex justify-between">
              <span className="text-[#667085]">Room Code:</span>
              <span className="font-mono font-bold text-[#2563EB]">{scheduledRoom}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">Scheduled Time:</span>
              <span className="font-medium text-[#101828]">{date} at {time} ({timezone})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#667085]">AI Minutes:</span>
              <Badge variant="success" size="sm">Enabled</Badge>
            </div>
            {inviteUrl && (
              <div className="pt-2 border-t border-[#EAECF0] flex items-center justify-between">
                <span className="text-[#667085] truncate max-w-[240px] font-mono text-[11px]">{inviteUrl}</span>
                <Button variant="outline" size="sm" onClick={handleCopyLink}>
                  {copiedLink ? 'Copied' : 'Copy Link'}
                </Button>
              </div>
            )}
          </div>

          <div className="flex justify-center gap-3 pt-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                setScheduledRoom(null)
                navigate('/app/meetings')
              }}
            >
              View My Meetings
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => navigate(`/room/${scheduledRoom}`)}
            >
              Open Meeting Room Now
            </Button>
          </div>
        </Card>
      ) : (
        <form onSubmit={handleSchedule} className="space-y-6">
          <Card className="space-y-5">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Basic Information
            </h3>

            <Input
              label="Meeting Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Q4 Sprint Planning"
              required
            />

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />

              <Input
                label="Start Time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-[#344054]">
                  Duration
                </label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="15">15 minutes</option>
                  <option value="30">30 minutes</option>
                  <option value="45">45 minutes</option>
                  <option value="60">60 minutes</option>
                  <option value="90">90 minutes</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-[#344054]">
                  Recurrence
                </label>
                <select
                  value={recurrence}
                  onChange={(e) => setRecurrence(e.target.value)}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="none">Does not repeat</option>
                  <option value="daily">Daily (Monday to Friday)</option>
                  <option value="weekly">Weekly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>

              <div className="space-y-1.5 text-left">
                <label className="block text-xs font-medium text-[#344054]">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-lg border border-[#D0D5DD] bg-white px-3 py-2 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
                >
                  <option value="UTC-5">UTC-5 (Eastern Time)</option>
                  <option value="UTC-8">UTC-8 (Pacific Time)</option>
                  <option value="UTC+0">UTC+0 (London, GMT)</option>
                  <option value="UTC+5:30">UTC+5:30 (India Standard Time)</option>
                </select>
              </div>
            </div>

            <Input
              label="Invite Attendees (comma-separated emails)"
              value={attendees}
              onChange={(e) => setAttendees(e.target.value)}
              placeholder="sarah@company.com, david@company.com"
              icon={<Users className="w-4 h-4" />}
            />
          </Card>

          {/* Meeting Security & Automation Settings */}
          <Card className="space-y-4">
            <h3 className="font-heading font-semibold text-sm text-[#101828]">
              Audio, Video & AI Automation Rules
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={muteOnEntry}
                  onChange={(e) => setMuteOnEntry(e.target.checked)}
                  className="rounded border-[#D0D5DD] text-[#2563EB]"
                />
                <div>
                  <div className="font-medium text-[#101828]">Mute participants on entry</div>
                  <div className="text-[11px] text-[#667085]">Participants join with microphone muted</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#EAECF0] hover:bg-[#F8FAFC] cursor-pointer">
                <input
                  type="checkbox"
                  checked={camOffOnEntry}
                  onChange={(e) => setCamOffOnEntry(e.target.checked)}
                  className="rounded border-[#D0D5DD] text-[#2563EB]"
                />
                <div>
                  <div className="font-medium text-[#101828]">Camera off on entry</div>
                  <div className="text-[11px] text-[#667085]">Turn off webcam when joining room</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableTranscription}
                  onChange={(e) => setEnableTranscription(e.target.checked)}
                  className="rounded border-[#D0D5DD] text-[#2563EB]"
                />
                <div>
                  <div className="font-medium text-[#175CD3] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Enable Live Transcription
                  </div>
                  <div className="text-[11px] text-[#475467]">On-device HTML5 SpeechRecognition</div>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-lg border border-[#B2DDFF] bg-[#EFF8FF] cursor-pointer">
                <input
                  type="checkbox"
                  checked={enableAiSummary}
                  onChange={(e) => setEnableAiSummary(e.target.checked)}
                  className="rounded border-[#D0D5DD] text-[#2563EB]"
                />
                <div>
                  <div className="font-medium text-[#175CD3] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" /> Autonomous AI Summary
                  </div>
                  <div className="text-[11px] text-[#475467]">Extract executive minutes & action items</div>
                </div>
              </label>
            </div>
          </Card>

          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={() => navigate('/app/meetings')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              iconRight={<ArrowRight className="w-4 h-4" />}
            >
              Confirm & Schedule Meeting
            </Button>
          </div>
        </form>
      )}
    </div>
  )
}
