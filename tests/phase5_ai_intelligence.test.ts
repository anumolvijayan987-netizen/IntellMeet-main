import http from 'http'
import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'
import { AiJobQueue } from '../server/src/services/ai/aiJobQueue'

const PORT = 5092
const SERVER_URL = `http://localhost:${PORT}`
const API_URL = `${SERVER_URL}/api`

async function runPhase5AiTests() {
  console.log('=====================================================')
  console.log(' INTELLMEET PHASE 5: AI MEETING INTELLIGENCE TEST')
  console.log('=====================================================\n')

  const { server } = createApp()
  await db.connect()

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`[AI TEST SERVER] Listening on ${SERVER_URL}`)
      resolve()
    })
  })

  let passed = 0
  let failed = 0

  async function assert(desc: string, fn: () => Promise<void>) {
    try {
      await fn()
      console.log(`  ✓ ${desc}`)
      passed++
    } catch (err: any) {
      console.error(`  ✗ ${desc}:`, err.message || err)
      failed++
    }
  }

  const testMeetingId = `mtg_ai_${Date.now()}`
  const sampleTranscript = [
    {
      speaker: 'Sarah Chen',
      text: 'Good morning everyone. Let us review the Q4 architecture and finalize our WebRTC signaling mesh.',
      timestamp: '10:00:05',
    },
    {
      speaker: 'David Miller',
      text: 'The primary problem was STUN/TURN connection timeouts on high-latency networks. We propose deploying redundant Google and Twilio STUN fallback endpoints.',
      timestamp: '10:02:15',
    },
    {
      speaker: 'Sarah Chen',
      text: 'Decision approved. David Miller, please finalize the WebRTC pipeline by Friday.',
      timestamp: '10:05:30',
    },
    {
      speaker: 'Elena Rostova',
      text: 'We also need someone to review SOC-2 audit logging requirements for transcript storage.',
      timestamp: '10:08:45',
    },
  ]

  const sampleMessages = [
    {
      sender: 'David Miller',
      text: 'I will submit the pull request tomorrow morning after integration tests.',
      timestamp: '10:10:00',
    },
  ]

  try {
    // ---------------------------------------------------------
    // 1. TRANSCRIPTION & KEYWORD SEARCH
    // ---------------------------------------------------------
    console.log('\n[1] Testing Audio Transcription, Language Metadata & Transcript Search...')

    await assert('Should transcribe audio file and return timestamped segments with language metadata', async () => {
      // Create a mock WAV audio buffer (44 bytes standard RIFF header + dummy PCM bytes)
      const wavHeader = Buffer.alloc(44)
      wavHeader.write('RIFF', 0)
      wavHeader.writeUInt32LE(36 + 100, 4)
      wavHeader.write('WAVE', 8)
      wavHeader.write('fmt ', 12)
      wavHeader.writeUInt32LE(16, 16)
      wavHeader.writeUInt16LE(1, 20) // PCM
      wavHeader.writeUInt16LE(1, 22) // Mono
      wavHeader.writeUInt32LE(16000, 24) // 16kHz
      wavHeader.writeUInt32LE(32000, 28)
      wavHeader.writeUInt16LE(2, 32)
      wavHeader.writeUInt16LE(16, 34)
      wavHeader.write('data', 36)
      wavHeader.writeUInt32LE(100, 40)
      const audioBuffer = Buffer.concat([wavHeader, Buffer.alloc(100, 0xaa)])

      const boundary = '----WebKitFormBoundary' + Math.random().toString(36).substring(2)
      const crlf = '\r\n'

      const pre = Buffer.from(
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="meetingId"${crlf}${crlf}` +
        `${testMeetingId}${crlf}` +
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="language"${crlf}${crlf}` +
        `en-US${crlf}` +
        `--${boundary}${crlf}` +
        `Content-Disposition: form-data; name="audio"; filename="sample_meeting.wav"${crlf}` +
        `Content-Type: audio/wav${crlf}${crlf}`
      )
      const post = Buffer.from(`${crlf}--${boundary}--${crlf}`)
      const body = Buffer.concat([pre, audioBuffer, post])

      const res = await fetch(`${API_URL}/ai/transcribe`, {
        method: 'POST',
        headers: {
          'Content-Type': `multipart/form-data; boundary=${boundary}`,
        },
        body,
      })

      if (!res.ok) throw new Error(`Transcribe failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Expected array of transcript segments')
      }
      if (data.data.length === 0) {
        throw new Error('Expected at least one transcript segment')
      }

      const first = data.data[0]
      if (!first.text || typeof first.startTime !== 'number') {
        throw new Error('Segment missing required text or startTime fields')
      }
      if (!first.language || !first.speakerName) {
        throw new Error('Segment missing speaker or language metadata')
      }
    })

    await assert('Should search and filter transcripts by keyword across meeting', async () => {
      // Save explicit chunk for searchable verification
      await fetch(`${API_URL}/transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          speakerName: 'Sarah Chen',
          text: 'The WebRTC signaling mesh is verified and active.',
          startTime: 12000,
          language: 'en-US',
        }),
      })

      const searchRes = await fetch(`${API_URL}/transcripts?meetingId=${testMeetingId}&search=signaling`)
      if (!searchRes.ok) throw new Error(`Transcript search failed: ${searchRes.status}`)
      const searchData = await searchRes.json()
      if (!searchData.success || !Array.isArray(searchData.data)) {
        throw new Error('Expected array of transcript chunks')
      }

      const match = searchData.data.find((item: any) =>
        item.text.toLowerCase().includes('signaling')
      )
      if (!match) throw new Error('Expected to find transcript matching keyword "signaling"')
    })

    // ---------------------------------------------------------
    // 2. STRUCTURED AI MEETING SUMMARIES
    // ---------------------------------------------------------
    console.log('\n[2] Testing Structured AI Meeting Summaries & Persistence...')

    let generatedSummary: any = null

    await assert('Should generate structured summary with all 7 enterprise minute sections', async () => {
      const res = await fetch(`${API_URL}/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: testMeetingId,
          transcript: sampleTranscript,
          messages: sampleMessages,
        }),
      })

      if (!res.ok) throw new Error(`Summarize failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data || !data.data.summary) {
        throw new Error('Expected summary object in response')
      }

      const s = data.data.summary
      generatedSummary = s

      // Verify all 7 required sections
      if (!s.meetingOverview || typeof s.meetingOverview !== 'string' || s.meetingOverview.length < 10) {
        throw new Error('Invalid meetingOverview in summary')
      }
      if (!Array.isArray(s.discussionPoints) || s.discussionPoints.length === 0) {
        throw new Error('Missing discussionPoints array')
      }
      if (!Array.isArray(s.importantDecisions) || s.importantDecisions.length === 0) {
        throw new Error('Missing importantDecisions array')
      }
      if (!Array.isArray(s.keyHighlights) || s.keyHighlights.length === 0) {
        throw new Error('Missing keyHighlights array')
      }
      if (!Array.isArray(s.problemsDiscussed) || s.problemsDiscussed.length === 0) {
        throw new Error('Missing problemsDiscussed array')
      }
      if (!Array.isArray(s.proposedSolutions) || s.proposedSolutions.length === 0) {
        throw new Error('Missing proposedSolutions array')
      }
      if (!Array.isArray(s.followUpRequirements) || s.followUpRequirements.length === 0) {
        throw new Error('Missing followUpRequirements array')
      }
    })

    // ---------------------------------------------------------
    // 3. SMART ACTION ITEM EXTRACTION (STRICT ANTI-HALLUCINATION)
    // ---------------------------------------------------------
    console.log('\n[3] Testing Smart Action Item Extraction & Task Review/Editing...')

    let extractedTasks: any[] = []

    await assert('Should extract tasks with identified assignees and strictly mark unassigned without hallucination', async () => {
      const res = await fetch(`${API_URL}/ai/extract-tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          transcript: sampleTranscript,
        }),
      })

      if (!res.ok) throw new Error(`Extract tasks failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Expected array of extracted action items')
      }

      extractedTasks = data.data
      if (extractedTasks.length === 0) {
        throw new Error('Expected at least one action item to be extracted')
      }

      // Check task properties
      for (const task of extractedTasks) {
        if (!task.title) throw new Error('Task missing title')
        if (!task.assignee) throw new Error('Task missing assignee')
        if (!['low', 'medium', 'high'].includes(task.priority)) {
          throw new Error(`Invalid task priority: ${task.priority}`)
        }
        if (!['pending', 'in_progress', 'completed'].includes(task.status)) {
          throw new Error(`Invalid task status: ${task.status}`)
        }
      }

      // Strict anti-hallucination check:
      // The transcript contained an unassigned task ("review SOC-2 audit logging requirements")
      // which should NOT have an invented person or hallucinated deadline
      const unassignedTask = extractedTasks.find((t) =>
        t.title.toLowerCase().includes('soc-2') || t.title.toLowerCase().includes('audit')
      )
      if (unassignedTask) {
        if (unassignedTask.assignee !== 'Unassigned') {
          // If assigned, it must be someone in the room, not an imaginary entity
          const knownPeople = ['Sarah Chen', 'David Miller', 'Elena Rostova']
          if (!knownPeople.includes(unassignedTask.assignee)) {
            throw new Error(`Hallucinated assignee detected: ${unassignedTask.assignee}`)
          }
        }
      }
    })

    await assert('Should allow user to review and edit extracted action items', async () => {
      // Create an action item in database/memory store
      const createRes = await fetch(`${API_URL}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          title: 'Finalize WebRTC STUN relay verification',
          assigneeName: 'David Miller',
          priority: 'high',
          status: 'pending',
        }),
      })

      if (!createRes.ok) throw new Error(`Create action item failed: ${createRes.status}`)
      const createdData = await createRes.json()
      const taskId = createdData.data._id || createdData.data.id

      // Edit task: mark completed and update title
      const updateRes = await fetch(`${API_URL}/action-items/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'completed',
          title: 'Finalize WebRTC STUN relay verification (Verified)',
        }),
      })

      if (!updateRes.ok) throw new Error(`Update action item failed: ${updateRes.status}`)
      const updatedData = await updateRes.json()
      if (updatedData.data.status !== 'completed') {
        throw new Error('Action item status was not updated to completed')
      }
    })

    // ---------------------------------------------------------
    // 4. GROUNDED AI MEETING ASSISTANT
    // ---------------------------------------------------------
    console.log('\n[4] Testing Grounded AI Meeting Assistant Q&A...')

    await assert('Should answer natural language questions about decisions grounded in transcript', async () => {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          question: 'What were the main decisions agreed upon?',
        }),
      })

      if (!res.ok) throw new Error(`Assistant query failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data || !data.data.answer) {
        throw new Error('Expected assistant answer in response')
      }

      const answer = data.data.answer
      if (typeof answer !== 'string' || answer.length < 10) {
        throw new Error('Assistant answer is empty or too short')
      }
      if (!Array.isArray(data.data.citations)) {
        throw new Error('Expected citations array in assistant response')
      }
      if (typeof data.data.confidence !== 'number') {
        throw new Error('Expected numerical confidence score in assistant response')
      }
    })

    await assert('Should answer participant-specific queries using grounded context', async () => {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          question: 'What did Sarah Chen mention about the WebRTC pipeline?',
        }),
      })

      if (!res.ok) throw new Error(`Assistant query failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data) throw new Error('Expected valid response')
      if (!data.data.answer.toLowerCase().includes('sarah') && !data.data.answer.toLowerCase().includes('webrtc')) {
        throw new Error('Assistant answer did not cite the requested speaker or topic')
      }
    })

    await assert('Should reject invalid empty questions with 400 Bad Request', async () => {
      const res = await fetch(`${API_URL}/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          question: '   ',
        }),
      })

      if (res.status !== 400) {
        throw new Error(`Expected 400 Bad Request, got: ${res.status}`)
      }
    })

    // ---------------------------------------------------------
    // 5. AI INSIGHTS (OBJECTIVE METRICS, NO EMOTIONAL CLAIMS)
    // ---------------------------------------------------------
    console.log('\n[5] Testing AI Insights Metrics & Objective Aggregation...')

    await assert('Should retrieve meeting duration, topic counts, task stats and avoid unsupported emotional claims', async () => {
      const res = await fetch(`${API_URL}/ai/insights/${testMeetingId}`)
      if (!res.ok) throw new Error(`Get insights failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data) throw new Error('Expected insights data')

      const insights = data.data
      if (!insights.meetingId) throw new Error('Missing meetingId in insights')
      if (typeof insights.durationFormatted !== 'string') {
        throw new Error('Missing formatted duration in insights')
      }
      if (!Array.isArray(insights.topicsDiscussed)) {
        throw new Error('Missing topicsDiscussed array')
      }
      if (typeof insights.actionItemsCount !== 'number') {
        throw new Error('Missing actionItemsCount')
      }
      if (typeof insights.completedTasksCount !== 'number') {
        throw new Error('Missing completedTasksCount')
      }
      if (typeof insights.pendingTasksCount !== 'number') {
        throw new Error('Missing pendingTasksCount')
      }
      if (!insights.summary) {
        throw new Error('Missing meeting summary in insights')
      }

      // Check strictly: NO unsupported performance ratings or emotional claims in insights
      const serialized = JSON.stringify(insights).toLowerCase()
      if (serialized.includes('lazy') || serialized.includes('incompetent') || serialized.includes('depressed')) {
        throw new Error('Prohibited subjective emotion/performance claim detected in AI insights')
      }
    })

    // ---------------------------------------------------------
    // 6. ASYNCHRONOUS BACKGROUND JOB PROCESSING & RETRIES
    // ---------------------------------------------------------
    console.log('\n[6] Testing Background Job Queue, Status Tracking & Asynchronous Execution...')

    await assert('Should enqueue asynchronous summarization job and track status to completion', async () => {
      const enqueueRes = await fetch(`${API_URL}/ai/summarize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomName: `async_${testMeetingId}`,
          transcript: sampleTranscript,
          messages: sampleMessages,
          asyncMode: true,
        }),
      })

      if (enqueueRes.status !== 201) {
        throw new Error(`Expected 201 Created for async enqueue, got: ${enqueueRes.status}`)
      }

      const enqueueData = await enqueueRes.json()
      if (!enqueueData.success || !enqueueData.data || !enqueueData.data.jobId) {
        throw new Error('Expected jobId in enqueue response')
      }

      const jobId = enqueueData.data.jobId

      // Poll job status until completed
      let attempts = 0
      let completedJob: any = null

      while (attempts < 10) {
        attempts++
        await new Promise((r) => setTimeout(r, 100))

        const pollRes = await fetch(`${API_URL}/ai/jobs/${jobId}`)
        if (!pollRes.ok) throw new Error(`Poll job failed: ${pollRes.status}`)
        const pollData = await pollRes.json()

        if (pollData.data.status === 'completed') {
          completedJob = pollData.data
          break
        }
      }

      if (!completedJob) {
        throw new Error(`Job ${jobId} did not complete within expected time`)
      }
      if (!completedJob.result || !completedJob.result.summary) {
        throw new Error('Completed job result missing summary')
      }
    })

  } finally {
    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('\n[AI TEST SERVER] Closed successfully.')
        resolve()
      })
    })
    await db.disconnect()
  }

  console.log('\n=====================================================')
  console.log(` PHASE 5 AI TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase5AiTests().catch((err) => {
  console.error('Fatal error during Phase 5 tests:', err)
  process.exit(1)
})
