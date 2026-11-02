import assert from 'node:assert'
import test from 'node:test'
import { createApp } from '../server/src/index'
import {
  User,
  Organization,
  Workspace,
  WorkspaceMember,
  Meeting,
  MeetingParticipant,
  Message,
  Transcript,
  MeetingSummary,
  ActionItem,
  Recording,
  Notification,
} from '../server/src/models'
import { AiService } from '../server/src/services/ai.service'
import { MeetingService } from '../server/src/services/meeting.service'

test('1. Database Schemas Validation: All 12 Mongoose Models Instantiated', () => {
  const models = [
    { name: 'User', model: User },
    { name: 'Organization', model: Organization },
    { name: 'Workspace', model: Workspace },
    { name: 'WorkspaceMember', model: WorkspaceMember },
    { name: 'Meeting', model: Meeting },
    { name: 'MeetingParticipant', model: MeetingParticipant },
    { name: 'Message', model: Message },
    { name: 'Transcript', model: Transcript },
    { name: 'MeetingSummary', model: MeetingSummary },
    { name: 'ActionItem', model: ActionItem },
    { name: 'Recording', model: Recording },
    { name: 'Notification', model: Notification },
  ]

  assert.strictEqual(models.length, 12, 'Must have exactly 12 Mongoose models')

  for (const { name, model } of models) {
    assert.ok(model, `Model ${name} must be defined`)
    assert.ok(model.schema, `Model ${name} must have a valid Mongoose schema`)
  }
})

test('2. AI Summarization Service: Generates Executive Minutes & Action Items', async () => {
  const sampleTranscript = [
    { speaker: 'Alice', text: 'Let us align on the WebRTC mesh deployment.' },
    { speaker: 'Bob', text: 'I will finalize the socket signaling pipeline by tomorrow.' },
  ]
  const sampleMessages = [
    { speaker: 'Charlie', text: 'Database schemas are now ready for review.' },
  ]

  const summary = await AiService.summarizeConversation(
    'Architecture Sprint',
    sampleTranscript,
    sampleMessages
  )

  assert.ok(summary.summary, 'Summary text must be generated')
  assert.ok(summary.executiveSummary, 'Executive summary must be present')
  assert.ok(Array.isArray(summary.keyDecisions), 'Key decisions must be an array')
  assert.ok(Array.isArray(summary.actionItems), 'Action items must be an array')
  assert.ok(summary.actionItems.length > 0, 'Should extract action items')
  assert.ok(summary.actionItems[0].assignee, 'Action item must have an assignee')
})

test('3. Meeting Service: In-Memory Resilient Persistence & Retrieval', async () => {
  const testRoomId = `test-room-${Date.now()}`
  const saved = await MeetingService.saveMeeting({
    roomId: testRoomId,
    title: 'Test Sprint Session',
    hostName: 'Test Architect',
    participants: ['Test Architect', 'Test Peer'],
    summary: 'Automated test meeting persistence.',
    keyDecisions: ['Confirmed Phase 1 technical skeleton.'],
    actionItems: [{ id: 1, text: 'Run verification tests', assignee: 'Architect', completed: true }],
  })

  assert.ok(saved, 'Saved meeting record must be returned')

  const retrieved = await MeetingService.getMeetingByRoomId(testRoomId)
  assert.ok(retrieved, 'Should retrieve meeting by roomId from cache/store')
})

test('4. Express Server & Route Organization: App Initialization', () => {
  const { app, server } = createApp()
  assert.ok(app, 'Express app must be created')
  assert.ok(server, 'HTTP server must be created')
})
