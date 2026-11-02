import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  Video,
  Users,
  Search,
  Plus,
  Copy,
  Check,
  MoreVertical,
  CalendarPlus,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Tabs } from '../../components/ui/Tabs'

export const MyMeetingsPage: React.FC = () => {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('upcoming')
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const meetings = [
    {
      id: 'm1',
      title: 'Sprint Planning & Backlog Grooming',
      roomId: 'sprint-plan-q4',
      date: 'Today',
      time: '2:00 PM – 2:45 PM',
      duration: '45 mins',
      participants: ['Sarah Chen', 'David Miller', 'Elena Rostova'],
      category: 'upcoming',
      type: 'Scheduled',
    },
    {
      id: 'm2',
      title: 'Enterprise Architecture & SOC-2 Sync',
      roomId: 'arch-soc2-review',
      date: 'Today',
      time: '4:30 PM – 5:15 PM',
      duration: '45 mins',
      participants: ['Alex Morgan', 'Marcus Vance', 'Sarah Chen'],
      category: 'upcoming',
      type: 'Scheduled',
    },
    {
      id: 'm3',
      title: 'Weekly Cross-Functional Design Critique',
      roomId: 'design-critique-wk',
      date: 'Tomorrow',
      time: '10:00 AM – 11:00 AM',
      duration: '60 mins',
      participants: ['Emily Watson', 'James Lee', 'Sarah Chen'],
      category: 'scheduled',
      type: 'Recurring (Weekly)',
    },
    {
      id: 'm4',
      title: 'All-Hands Global Engineering Sync',
      roomId: 'all-hands-eng',
      date: 'Friday',
      time: '3:00 PM – 4:00 PM',
      duration: '60 mins',
      participants: ['Sarah Chen', 'All Engineering Team (42)'],
      category: 'scheduled',
      type: 'Recurring (Monthly)',
    },
  ]

  const filteredMeetings = meetings.filter((m) => {
    const matchesTab = activeTab === 'all' || m.category === activeTab || (activeTab === 'recurring' && m.type.includes('Recurring'))
    const matchesQuery = m.title.toLowerCase().includes(searchQuery.toLowerCase()) || m.roomId.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesTab && matchesQuery
  })

  const handleCopyLink = (roomId: string) => {
    navigator.clipboard.writeText(`${window.location.origin}/room/${roomId}`)
    setCopiedId(roomId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      {/* Page Title & CTAs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <h1 className="font-heading text-2xl font-bold text-[#101828]">My Meetings</h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Manage your upcoming sessions, recurring calls, and calendar invitations.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link to="/app/schedule">
            <Button variant="primary" size="sm" icon={<CalendarPlus className="w-4 h-4" />}>
              Schedule New Meeting
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <Tabs
          activeTab={activeTab}
          onChange={setActiveTab}
          variant="pills"
          tabs={[
            { id: 'upcoming', label: 'Upcoming Today', count: 2 },
            { id: 'scheduled', label: 'All Scheduled', count: 4 },
            { id: 'recurring', label: 'Recurring', count: 2 },
          ]}
        />

        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 text-[#98A2B3] absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search meetings..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-[#D0D5DD] bg-white text-xs text-[#101828] placeholder-[#98A2B3] focus:outline-none focus:border-[#2563EB]"
          />
        </div>
      </div>

      {/* Meetings List */}
      <div className="space-y-3">
        {filteredMeetings.length === 0 ? (
          <Card className="text-center py-12 text-[#667085] text-xs">
            No meetings found matching your filter criteria.
          </Card>
        ) : (
          filteredMeetings.map((meeting) => (
            <Card key={meeting.id} hoverable className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5">
                <div className="flex items-center gap-2.5">
                  <h3 className="font-semibold text-sm text-[#101828]">
                    {meeting.title}
                  </h3>
                  <Badge variant="primary" size="sm">
                    {meeting.type}
                  </Badge>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-xs text-[#667085]">
                  <span className="flex items-center gap-1 font-medium text-[#344054]">
                    <Clock className="w-3.5 h-3.5 text-[#98A2B3]" /> {meeting.date}, {meeting.time}
                  </span>
                  <span>•</span>
                  <span>Duration: {meeting.duration}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-[#98A2B3]" /> {meeting.participants.length} invited
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  icon={copiedId === meeting.roomId ? <Check className="w-3.5 h-3.5 text-[#12B76A]" /> : <Copy className="w-3.5 h-3.5" />}
                  onClick={() => handleCopyLink(meeting.roomId)}
                >
                  {copiedId === meeting.roomId ? 'Copied' : 'Invite'}
                </Button>

                <Link to={`/app/insights?meetingId=${meeting.roomId}`}>
                  <Button variant="secondary" size="sm" icon={<Calendar className="w-3.5 h-3.5" />}>
                    AI Insights
                  </Button>
                </Link>

                <Link to={`/room/${meeting.roomId}`}>
                  <Button variant="primary" size="sm" icon={<Video className="w-3.5 h-3.5" />}>
                    Join Room
                  </Button>
                </Link>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
