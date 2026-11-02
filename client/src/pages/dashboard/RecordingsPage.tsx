import React, { useState } from 'react'
import {
  Film,
  Play,
  Download,
  Clock,
  HardDrive,
  CheckCircle2,
  Share2,
  Trash2,
  X,
} from 'lucide-react'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { Card } from '../../components/ui/Card'
import { Modal } from '../../components/ui/Modal'
import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../../services/apiClient'

export const RecordingsPage: React.FC = () => {
  const [playingRecording, setPlayingRecording] = useState<any | null>(null)

  const { data: serverRecordings = [] } = useQuery({
    queryKey: ['recordings'],
    queryFn: () => apiRequest<any[]>('/recordings'),
  })

  const sampleRecordings = [
    {
      id: 'rec_1',
      title: 'Sprint Q4 Architecture Review',
      roomId: 'sprint-q4',
      date: 'Oct 30, 2026',
      duration: '42:15',
      size: '284 MB',
      format: 'MP4',
      status: 'Ready',
      transcriptStatus: 'Transcribed',
      thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    },
    {
      id: 'rec_2',
      title: 'Weekly Cross-Functional Design Critique',
      roomId: 'design-critique-wk',
      date: 'Oct 28, 2026',
      duration: '31:20',
      size: '198 MB',
      format: 'MP4',
      status: 'Ready',
      transcriptStatus: 'Transcribed',
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    },
  ]

  // Map server recordings into card items
  const formattedServerRecordings = serverRecordings.map((r) => ({
    id: r._id || r.id,
    title: r.title || 'Meeting Recording',
    roomId: r.meetingId || 'Room',
    date: r.createdAt ? new Date(r.createdAt).toLocaleDateString() : 'Today',
    duration: `${Math.floor((r.durationSeconds || 0) / 60)}:${((r.durationSeconds || 0) % 60).toString().padStart(2, '0')}`,
    size: r.fileSize ? `${(r.fileSize / (1024 * 1024)).toFixed(1)} MB` : '12.4 MB',
    format: (r.format || 'WEBM').toUpperCase(),
    status: 'Ready',
    transcriptStatus: 'Transcribed',
    url: r.url,
    thumbnail: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
  }))

  const recordings = [...formattedServerRecordings, ...sampleRecordings]

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAECF0]">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-2xl font-bold text-[#101828]">
              Cloud Recordings
            </h1>
            <Badge variant="primary" size="sm">
              AES-256 Encrypted
            </Badge>
          </div>
          <p className="text-xs text-[#667085] mt-0.5">
            Access past HD meeting recordings, video chapters, and synchronized transcripts.
          </p>
        </div>

        <div className="text-xs text-[#667085] font-medium flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-[#2563EB]" />
          <span>Storage: 894 MB of 50 GB used</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {recordings.map((rec) => (
          <Card key={rec.id} hoverable padding="none" className="overflow-hidden flex flex-col justify-between">
            {/* Thumbnail Header */}
            <div className="relative aspect-video bg-[#101828] group">
              <img
                src={rec.thumbnail}
                alt={rec.title}
                className="w-full h-full object-cover opacity-80 group-hover:opacity-95 transition-opacity"
              />
              <button
                onClick={() => setPlayingRecording(rec)}
                className="absolute inset-0 flex items-center justify-center text-white"
              >
                <div className="w-12 h-12 rounded-full bg-[#2563EB]/90 hover:bg-[#2563EB] flex items-center justify-center shadow-lg transition-transform group-hover:scale-110">
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                </div>
              </button>
              <div className="absolute bottom-2 right-2 bg-black/80 px-2 py-0.5 rounded text-[10px] text-white font-mono">
                {rec.duration}
              </div>
            </div>

            {/* Info Body */}
            <div className="p-4 space-y-2 flex-1">
              <h3 className="font-semibold text-sm text-[#101828] line-clamp-1">
                {rec.title}
              </h3>
              <div className="flex items-center gap-3 text-xs text-[#667085]">
                <span>{rec.date}</span>
                <span>•</span>
                <span>{rec.size}</span>
                <span>•</span>
                <span className="font-mono">{rec.format}</span>
              </div>
              <div className="pt-2 flex items-center gap-2">
                <Badge variant="success" size="sm">
                  {rec.transcriptStatus}
                </Badge>
              </div>
            </div>

            {/* Actions Bar */}
            <div className="p-3 bg-[#F8FAFC] border-t border-[#EAECF0] flex items-center justify-between">
              <Button
                variant="outline"
                size="xs"
                icon={<Play className="w-3.5 h-3.5" />}
                onClick={() => setPlayingRecording(rec)}
              >
                Watch
              </Button>
              <div className="flex items-center gap-1">
                <button
                  title="Share link"
                  className="p-1.5 rounded text-[#667085] hover:text-[#101828]"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button
                  title="Download recording"
                  className="p-1.5 rounded text-[#667085] hover:text-[#101828]"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Video Player Modal */}
      {playingRecording && (
        <Modal
          isOpen={Boolean(playingRecording)}
          onClose={() => setPlayingRecording(null)}
          title={playingRecording.title}
          description={`Recorded on ${playingRecording.date} • Duration ${playingRecording.duration}`}
          maxWidth="xl"
        >
          <div className="space-y-4">
            <div className="aspect-video bg-[#101828] rounded-xl flex items-center justify-center relative overflow-hidden">
              <div className="text-center space-y-2 text-white">
                <Film className="w-10 h-10 text-[#60A5FA] mx-auto animate-pulse" />
                <div className="text-xs font-semibold">HD Playback Simulation</div>
                <div className="text-[11px] text-[#98A2B3]">
                  Streaming encrypted media from S3/GCS secure vault
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setPlayingRecording(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
