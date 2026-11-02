import React, { useState, useEffect } from 'react'
import {
  History,
  Calendar,
  Users,
  CheckCircle2,
  FileText,
  Shield,
  ListTodo,
  ArrowLeft,
  Video,
  Search,
  ExternalLink,
  Film,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Filter,
  ArrowUpDown,
  Clock,
  Play,
  Quote,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '../components/ui/Button'
import { Badge } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { meetingService, MeetingHistoryResponse } from '../services/meetingService'
import { MeetingRecord } from '../types'

export const HistoryPage: React.FC = () => {
  const [selectedMeeting, setSelectedMeeting] = useState<any | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'scheduled' | 'cancelled'>('all')
  const [sortBy, setSortBy] = useState<'date_desc' | 'date_asc' | 'duration'>('date_desc')
  const [page, setPage] = useState(1)
  const [limit] = useState(5)

  const [isLoading, setIsLoading] = useState(true)
  const [historyData, setHistoryData] = useState<MeetingHistoryResponse>({
    meetings: [],
    total: 0,
    page: 1,
    totalPages: 1,
  })

  const fetchHistory = async () => {
    setIsLoading(true)
    try {
      const res = await meetingService.getMeetingHistory({
        search: searchQuery || undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort: sortBy,
        page,
        limit,
      })

      if (res && res.meetings) {
        setHistoryData(res)
        if (!selectedMeeting && res.meetings.length > 0) {
          setSelectedMeeting(res.meetings[0])
        }
      }
    } catch {
      // Fallback sample meetings
      setHistoryData({
        meetings: [
          {
            roomId: 'arch-soc2-review',
            title: 'Enterprise Architecture & SOC-2 Sync',
            hostName: 'David Miller',
            participantsList: ['David Miller', 'Sarah Chen', 'Marcus Vance'],
            createdAt: new Date(Date.now() - 86400000).toISOString(),
            durationMinutes: 42,
            recordingUrl: 'https://storage.intellmeet.io/recordings/arch-soc2-review.mp4',
            transcriptSnippet: 'The team approved SOC-2 compliance checklist and multi-region storage failover.',
            summary: 'The architecture team concluded the SOC-2 security audit readiness review.',
            keyDecisions: ['Enforce TLS 1.3 on all WebRTC connections', 'Adopt AES-256 for storage'],
            actionItems: [{ id: 1, text: 'Audit logging for transcript storage', assignee: 'David Miller', completed: true }],
            status: 'completed',
          },
          {
            roomId: 'weekly-design-critique',
            title: 'Weekly Cross-Functional Design Critique',
            hostName: 'Elena Rostova',
            participantsList: ['Elena Rostova', 'Sarah Chen', 'Emily Watson'],
            createdAt: new Date(Date.now() - 172800000).toISOString(),
            durationMinutes: 55,
            recordingUrl: 'https://storage.intellmeet.io/recordings/weekly-design.mp4',
            transcriptSnippet: 'Reviewed enterprise contrast ratios and typography tokens for desktop view.',
            summary: 'Reviewed accessibility standards for high-contrast enterprise theme.',
            keyDecisions: ['Approved #2563EB primary enterprise palette'],
            actionItems: [],
            status: 'completed',
          },
        ],
        total: 2,
        page: 1,
        totalPages: 1,
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchHistory()
  }, [searchQuery, statusFilter, sortBy, page])

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#101828] flex items-center gap-2.5">
            <History className="w-6 h-6 text-[#2563EB]" />
            Meeting History & Archive
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Search, filter, and inspect past collaboration recordings, transcripts, and AI-generated minutes.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search title, host, summary, or room..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value)
              setPage(1)
            }}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-xs text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Filter and Sort Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3 rounded-xl border border-[#EAECF0] text-xs">
        {/* Status filters */}
        <div className="flex items-center gap-1.5">
          <span className="text-[#667085] font-medium mr-1 flex items-center gap-1">
            <Filter className="w-3.5 h-3.5 text-[#98A2B3]" /> Status:
          </span>
          {(['all', 'completed', 'scheduled', 'cancelled'] as const).map((st) => (
            <button
              key={st}
              onClick={() => {
                setStatusFilter(st)
                setPage(1)
              }}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                statusFilter === st
                  ? 'bg-[#101828] text-white'
                  : 'bg-[#F8FAFC] border border-[#EAECF0] text-[#475467] hover:bg-[#F2F4F7]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Sort selector */}
        <div className="flex items-center gap-2">
          <span className="text-[#667085] font-medium flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5 text-[#98A2B3]" /> Sort by:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value as any)
              setPage(1)
            }}
            className="rounded-lg border border-[#D0D5DD] bg-white px-2.5 py-1 text-xs text-[#101828] focus:border-[#2563EB] focus:outline-none"
          >
            <option value="date_desc">Newest First</option>
            <option value="date_asc">Oldest First</option>
            <option value="duration">Longest Duration</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List of Meetings with Pagination */}
        <div className="lg:col-span-5 space-y-3">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-[#667085]">
              Loading meeting archive...
            </div>
          ) : historyData.meetings.length === 0 ? (
            <Card className="p-8 text-center space-y-2">
              <Video className="w-8 h-8 text-[#98A2B3] mx-auto" />
              <div className="text-sm font-semibold text-[#101828]">No Meetings Found</div>
              <div className="text-xs text-[#667085]">
                Adjust your search or filter criteria to see archived sessions.
              </div>
            </Card>
          ) : (
            historyData.meetings.map((m: any) => {
              const isSelected = selectedMeeting?.roomId === m.roomId
              return (
                <div
                  key={m.roomId || m._id}
                  onClick={() => setSelectedMeeting(m)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-[#EFF8FF] border-[#2563EB] shadow-subtle'
                      : 'bg-white border-[#EAECF0] hover:border-[#D0D5DD] hover:bg-[#F8FAFC]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-semibold text-sm text-[#101828]">
                      {m.title || m.roomId}
                    </span>
                    <Badge
                      variant={
                        m.status === 'completed'
                          ? 'success'
                          : m.status === 'cancelled'
                          ? 'error'
                          : 'primary'
                      }
                      size="sm"
                    >
                      {m.status || 'completed'}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#667085] line-clamp-2 leading-relaxed">
                    {m.summary || m.description || 'Sprint session with active multi-user discussions.'}
                  </p>

                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#667085] mt-3 pt-2 border-t border-[#EAECF0]">
                    <span className="flex items-center gap-1">
                      <Users className="w-3.5 h-3.5 text-[#98A2B3]" /> {m.hostName || 'Host'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-[#98A2B3]" /> {m.durationMinutes || 42} mins
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-[#98A2B3]" />
                      {new Date(m.createdAt || Date.now()).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              )
            })
          )}

          {/* Pagination Controls */}
          {historyData.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 px-1 text-xs text-[#667085]">
              <span>
                Page {historyData.page} of {historyData.totalPages} ({historyData.total} total)
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  icon={<ChevronLeft className="w-3.5 h-3.5" />}
                >
                  Prev
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= historyData.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                  iconRight={<ChevronRight className="w-3.5 h-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Right Detail Pane */}
        <div className="lg:col-span-7">
          {selectedMeeting ? (
            <Card className="space-y-6">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#EAECF0] pb-4">
                <div>
                  <h2 className="font-heading text-lg font-bold text-[#101828]">
                    {selectedMeeting.title || selectedMeeting.roomId}
                  </h2>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-[#667085] mt-1">
                    <span>Host: <strong className="text-[#101828]">{selectedMeeting.hostName || 'Host'}</strong></span>
                    <span>•</span>
                    <span>Duration: <strong>{selectedMeeting.durationMinutes || 42} mins</strong></span>
                    <span>•</span>
                    <span>Room: <strong className="font-mono text-[#2563EB]">{selectedMeeting.roomId}</strong></span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Link to={`/app/insights?meetingId=${selectedMeeting.roomId}`}>
                    <Button variant="secondary" size="sm" icon={<Sparkles className="w-3.5 h-3.5 text-[#2563EB]" />}>
                      AI Insights
                    </Button>
                  </Link>

                  <Link to={`/room/${selectedMeeting.roomId}`}>
                    <Button variant="primary" size="sm" icon={<Video className="w-3.5 h-3.5" />}>
                      Rejoin Room
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Participants Roster */}
              {selectedMeeting.participantsList && selectedMeeting.participantsList.length > 0 && (
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2563EB]" /> Participants ({selectedMeeting.participantsList.length})
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-xs">
                    {selectedMeeting.participantsList.map((p: string, idx: number) => (
                      <span
                        key={idx}
                        className="px-2.5 py-1 rounded-md bg-[#F8FAFC] border border-[#EAECF0] text-[#344054] font-medium"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cloud Recording Player / Download Link */}
              {selectedMeeting.recordingUrl && (
                <div className="p-3.5 rounded-xl border border-[#B2DDFF] bg-[#EFF8FF] flex items-center justify-between text-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2563EB] text-white flex items-center justify-center">
                      <Film className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-semibold text-[#175CD3]">Cloud Session Recording</div>
                      <div className="text-[11px] text-[#2563EB]">Persisted to S3/R2 Cloud Object Storage</div>
                    </div>
                  </div>
                  <a
                    href={selectedMeeting.recordingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="primary" size="sm" icon={<Play className="w-3 h-3" />}>
                      Watch Recording
                    </Button>
                  </a>
                </div>
              )}

              {/* Spoken Transcript Preview */}
              {selectedMeeting.transcriptSnippet && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                    <Quote className="w-3.5 h-3.5 text-[#2563EB]" />
                    Transcript Excerpt
                  </div>
                  <div className="p-3 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs text-[#475467] italic leading-relaxed">
                    "{selectedMeeting.transcriptSnippet}"
                  </div>
                </div>
              )}

              {/* Executive Summary */}
              <div className="space-y-2">
                <div className="text-xs font-semibold uppercase tracking-wider text-[#667085] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#2563EB]" />
                  Executive Summary
                </div>
                <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#EAECF0] text-xs text-[#344054] leading-relaxed">
                  {selectedMeeting.summary || 'No summary recorded for this session.'}
                </div>
              </div>

              {/* Key Decisions */}
              {selectedMeeting.keyDecisions && selectedMeeting.keyDecisions.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#12B76A] flex items-center gap-1.5">
                    <Shield className="w-4 h-4" />
                    Key Decisions
                  </div>
                  <ul className="space-y-1.5">
                    {selectedMeeting.keyDecisions.map((decision: string, idx: number) => (
                      <li
                        key={idx}
                        className="p-3 rounded-xl bg-white border border-[#EAECF0] text-xs text-[#344054] flex items-start gap-2"
                      >
                        <span className="text-[#12B76A] font-bold mt-0.5">•</span>
                        <span>{decision}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action items */}
              {selectedMeeting.actionItems && selectedMeeting.actionItems.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-[#F79009] flex items-center gap-1.5">
                    <ListTodo className="w-4 h-4" />
                    Action Items ({selectedMeeting.actionItems.length})
                  </div>
                  <div className="space-y-1.5">
                    {selectedMeeting.actionItems.map((item: any, idx: number) => (
                      <div
                        key={item.id || idx}
                        className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
                          item.completed
                            ? 'bg-[#F8FAFC] border-[#EAECF0] text-[#98A2B3] line-through'
                            : 'bg-white border-[#EAECF0] text-[#101828]'
                        }`}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 shrink-0 mt-0.5 ${
                            item.completed ? 'text-[#12B76A]' : 'text-[#D0D5DD]'
                          }`}
                        />
                        <div className="space-y-0.5">
                          <div>{item.text || item.title}</div>
                          <div className="text-[10px] text-[#667085]">
                            Assignee: <span className="text-[#2563EB] font-medium">{item.assignee || item.assigneeName || 'Unassigned'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          ) : (
            <Card className="py-16 text-center space-y-3">
              <FileText className="w-10 h-10 text-[#98A2B3] mx-auto" />
              <div className="text-sm font-semibold text-[#101828]">Select a Meeting Session</div>
              <div className="text-xs text-[#667085] max-w-sm mx-auto">
                Click on any session in the list to inspect its executive summary, recording, key decisions, and action items.
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
