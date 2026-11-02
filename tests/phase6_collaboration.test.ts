import http from 'http'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'
import { convertToUtcDate, formatInTimezone } from '../server/src/utils/timezone'

const PORT = 5094
const SERVER_URL = `http://localhost:${PORT}`
const API_URL = `${SERVER_URL}/api`

async function runPhase6CollaborationTests() {
  console.log('=====================================================')
  console.log(' INTELLMEET PHASE 6: COLLABORATION & WORKSPACE TEST')
  console.log('=====================================================\n')

  const { server } = createApp()
  await db.connect()

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`[COLLABORATION TEST SERVER] Listening on ${SERVER_URL}`)
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

  // Generate auth token for test user
  let authToken = ''
  let socketClient: ClientSocket | null = null

  try {
    // Register / login test user to get valid Bearer token
    const regRes = await fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Chen Architect',
        email: `sarah.collab_${Date.now()}@enterprise.com`,
        password: 'Password123!',
        organizationName: 'Enterprise Cloud Corp',
        role: 'org_admin',
      }),
    })
    const regData = await regRes.json()
    authToken = regData.data?.accessToken || ''

    const authHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${authToken}`,
    }

    // ---------------------------------------------------------
    // 1. WORKSPACE SYSTEM & ROLE MANAGEMENT
    // ---------------------------------------------------------
    console.log('\n[1] Testing Workspace Dashboard, Members, Roles & Settings...')

    let testWorkspaceId = 'ws_general'

    await assert('Should fetch workspace dashboard metrics and stats', async () => {
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/dashboard`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Dashboard fetch failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data) throw new Error('Expected dashboard stats')
      if (typeof data.data.memberCount !== 'number' || typeof data.data.activeMeetingsCount !== 'number') {
        throw new Error('Dashboard stats missing required numeric metrics')
      }
    })

    await assert('Should retrieve workspace members roster with role assignments', async () => {
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/members`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Members fetch failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Expected members array')
      }
      if (data.data.length === 0) throw new Error('Expected at least one member')
    })

    let invitedMemberId = ''

    await assert('Should invite new team member with specified role', async () => {
      const testEmail = `colleague_${Date.now()}@enterprise.com`
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/members`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          email: testEmail,
          role: 'member',
        }),
      })

      if (res.status !== 201) throw new Error(`Invite member failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data) throw new Error('Expected invited member object')
      invitedMemberId = data.data._id || data.data.id
    })

    await assert('Should update workspace member role (member -> admin)', async () => {
      if (!invitedMemberId) throw new Error('No member ID available for role update')
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/members/${invitedMemberId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({ role: 'admin' }),
      })

      if (!res.ok) throw new Error(`Update role failed: ${res.status}`)
      const data = await res.json()
      if (data.data.role !== 'admin') throw new Error('Member role was not updated to admin')
    })

    await assert('Should remove member from workspace', async () => {
      if (!invitedMemberId) throw new Error('No member ID available for removal')
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/members/${invitedMemberId}`, {
        method: 'DELETE',
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Remove member failed: ${res.status}`)
    })

    await assert('Should update workspace settings (name, slug, privacy)', async () => {
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          name: 'Core Platform Engineering',
          description: 'Updated architecture and collaboration platform.',
          isPrivate: true,
        }),
      })

      if (!res.ok) throw new Error(`Update workspace settings failed: ${res.status}`)
      const data = await res.json()
      if (data.data.name !== 'Core Platform Engineering') {
        throw new Error('Workspace name was not updated')
      }
    })

    await assert('Should retrieve workspace team activity audit feed', async () => {
      const res = await fetch(`${API_URL}/workspaces/${testWorkspaceId}/activity`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Activity fetch failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Expected activity array')
      }
      if (data.data.length === 0) throw new Error('Expected activity events')
    })

    // ---------------------------------------------------------
    // 2. MEETING SCHEDULING & TIMEZONE CONVERSIONS
    // ---------------------------------------------------------
    console.log('\n[2] Testing Meeting Scheduling, Timezone Conversions, Edit & Cancel...')

    let scheduledMeetingRoomId = ''

    await assert('Should correctly convert local date, time, and timezone to UTC Date', async () => {
      // 2026-11-05 at 14:00 in US Eastern Time (UTC-5) -> 19:00 UTC
      const utcDate = convertToUtcDate('2026-11-05', '14:00', 'UTC-5')
      if (utcDate.getUTCHours() !== 19 || utcDate.getUTCDate() !== 5) {
        throw new Error(`Timezone conversion mismatch: expected 19:00 UTC, got ${utcDate.toISOString()}`)
      }

      // Formatting back to UTC-5
      const formatted = formatInTimezone(utcDate, 'UTC-5')
      if (!formatted.timeString.includes('2:00 PM')) {
        throw new Error(`Timezone format mismatch: expected 2:00 PM, got ${formatted.timeString}`)
      }
    })

    await assert('Should schedule a meeting with recurrence, invitations, and timezone handling', async () => {
      const res = await fetch(`${API_URL}/meetings/schedule`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Sprint Planning & Architecture Sync',
          description: 'Review Q4 deliverables and WebRTC mesh architecture.',
          date: '2026-11-05',
          time: '14:00',
          timezone: 'UTC-5',
          durationMinutes: 45,
          recurrence: 'weekly',
          attendees: 'david@company.com, elena@company.com',
          settings: {
            isMutedOnEntry: true,
            isCamOffOnEntry: false,
            enableTranscription: true,
            enableAiSummaries: true,
          },
        }),
      })

      if (res.status !== 201) throw new Error(`Schedule meeting failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data || !data.data.roomId) {
        throw new Error('Expected scheduled meeting with roomId')
      }

      scheduledMeetingRoomId = data.data.roomId
      if (data.data.status !== 'scheduled') {
        throw new Error(`Expected status 'scheduled', got ${data.data.status}`)
      }
      if (data.data.recurrence !== 'weekly') {
        throw new Error(`Expected recurrence 'weekly', got ${data.data.recurrence}`)
      }
    })

    await assert('Should edit an existing scheduled meeting', async () => {
      if (!scheduledMeetingRoomId) throw new Error('No room ID available to edit')
      const res = await fetch(`${API_URL}/meetings/${scheduledMeetingRoomId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          title: 'Sprint Planning & Architecture Sync (Rescheduled)',
          durationMinutes: 60,
        }),
      })

      if (!res.ok) throw new Error(`Edit meeting failed: ${res.status}`)
      const data = await res.json()
      if (!data.data.title.includes('Rescheduled')) {
        throw new Error('Meeting title was not updated')
      }
    })

    await assert('Should retrieve upcoming scheduled meetings list', async () => {
      const res = await fetch(`${API_URL}/meetings/upcoming`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Upcoming meetings fetch failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data)) {
        throw new Error('Expected array of upcoming meetings')
      }
      const found = data.data.find((m: any) => m.roomId === scheduledMeetingRoomId)
      if (!found) throw new Error('Scheduled meeting not present in upcoming list')
    })

    await assert('Should cancel a meeting and mark status as cancelled', async () => {
      if (!scheduledMeetingRoomId) throw new Error('No room ID available to cancel')
      const res = await fetch(`${API_URL}/meetings/${scheduledMeetingRoomId}/cancel`, {
        method: 'POST',
        headers: authHeaders,
      })

      if (!res.ok) throw new Error(`Cancel meeting failed: ${res.status}`)
      const data = await res.json()
      if (data.data.status !== 'cancelled') {
        throw new Error(`Expected status 'cancelled', got ${data.data.status}`)
      }
    })

    // ---------------------------------------------------------
    // 3. MEETING HISTORY (SEARCH, FILTERING, SORTING, PAGINATION)
    // ---------------------------------------------------------
    console.log('\n[3] Testing Meeting History Archive with Filtering & Pagination...')

    await assert('Should query meeting history with search and pagination parameters', async () => {
      const res = await fetch(`${API_URL}/meetings/history?page=1&limit=2&status=all`, {
        headers: authHeaders,
      })

      if (!res.ok) throw new Error(`Meeting history fetch failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data || !Array.isArray(data.data.meetings)) {
        throw new Error('Expected paginated meetings response')
      }
      if (typeof data.data.total !== 'number' || typeof data.data.page !== 'number') {
        throw new Error('Missing pagination metadata (total, page)')
      }

      // Check required fields on history items
      if (data.data.meetings.length > 0) {
        const item = data.data.meetings[0]
        if (!item.title || !item.roomId) {
          throw new Error('History item missing title or roomId')
        }
      }
    })

    await assert('Should filter meeting history by keyword search', async () => {
      const res = await fetch(`${API_URL}/meetings/history?search=SOC-2`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Search history failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !Array.isArray(data.data.meetings)) {
        throw new Error('Expected meetings array')
      }
      const match = data.data.meetings.find((m: any) =>
        (m.title && m.title.includes('SOC-2')) || (m.summary && m.summary.includes('SOC-2'))
      )
      if (!match) throw new Error('Expected to find meeting matching "SOC-2"')
    })

    await assert('Should sort meeting history by duration', async () => {
      const res = await fetch(`${API_URL}/meetings/history?sort=duration`, {
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Sort history failed: ${res.status}`)
      const data = await res.json()
      const list = data.data.meetings
      if (list.length >= 2) {
        if ((list[0].durationMinutes || 0) < (list[1].durationMinutes || 0)) {
          throw new Error('History was not sorted by duration descending')
        }
      }
    })

    // ---------------------------------------------------------
    // 4. TASK MANAGEMENT & AI-GENERATED TASK LINKING
    // ---------------------------------------------------------
    console.log('\n[4] Testing Task Management CRUD & AI-Generated Task Linking...')

    let createdTaskId = ''

    await assert('Should create task with AI-generated linking and due date', async () => {
      const res = await fetch(`${API_URL}/action-items`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          meetingId: 'arch-soc2-review',
          meetingTitle: 'Enterprise Architecture & SOC-2 Sync',
          title: 'Implement TLS 1.3 on media relay endpoints',
          assigneeName: 'David Miller',
          dueDate: '2026-11-10',
          priority: 'high',
          status: 'pending',
          aiGenerated: true,
          relatedDiscussion: 'David Miller: I will verify TLS 1.3 encryption on media relay nodes.',
        }),
      })

      if (res.status !== 201) throw new Error(`Create task failed: ${res.status}`)
      const data = await res.json()
      if (!data.success || !data.data) throw new Error('Expected created task object')
      createdTaskId = data.data._id || data.data.id

      if (!data.data.aiGenerated && !data.data.relatedDiscussion) {
        throw new Error('AI linking metadata was not persisted')
      }
    })

    await assert('Should update task status and assignee details', async () => {
      if (!createdTaskId) throw new Error('No task ID available to update')
      const res = await fetch(`${API_URL}/action-items/${createdTaskId}`, {
        method: 'PATCH',
        headers: authHeaders,
        body: JSON.stringify({
          status: 'completed',
          assigneeName: 'David Miller (Verified)',
        }),
      })

      if (!res.ok) throw new Error(`Update task failed: ${res.status}`)
      const data = await res.json()
      if (data.data.status !== 'completed') {
        throw new Error(`Expected status 'completed', got ${data.data.status}`)
      }
    })

    // ---------------------------------------------------------
    // 5. NOTIFICATIONS (SOCKET.IO REAL-TIME UPDATES & DISPATCH)
    // ---------------------------------------------------------
    console.log('\n[5] Testing Notifications & Real-Time Socket.io Dispatch...')

    let socketNotificationReceived: any = null

    await assert('Should connect Socket.io client and receive real-time notification events', async () => {
      socketClient = ioClient(SERVER_URL, {
        transports: ['websocket'],
        reconnection: false,
      })

      await new Promise<void>((resolve, reject) => {
        socketClient!.on('connect', () => resolve())
        socketClient!.on('connect_error', reject)
        setTimeout(() => reject(new Error('Socket connection timed out')), 4000)
      })

      socketClient.on('notification', (notif: any) => {
        socketNotificationReceived = notif
      })

      // Dispatch a notification
      const postRes = await fetch(`${API_URL}/notifications`, {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({
          type: 'action_item_assigned',
          title: 'New Action Item Assigned',
          message: 'You were assigned to verify WebRTC STUN relay fallback.',
          link: '/app/tasks',
        }),
      })

      if (postRes.status !== 201) throw new Error(`Create notification failed: ${postRes.status}`)

      // Await socket broadcast
      let attempts = 0
      while (attempts < 15) {
        attempts++
        if (socketNotificationReceived) break
        await new Promise((r) => setTimeout(r, 100))
      }

      if (!socketNotificationReceived) {
        throw new Error('Did not receive real-time socket notification event')
      }
      if (socketNotificationReceived.type !== 'action_item_assigned') {
        throw new Error(`Notification type mismatch: ${socketNotificationReceived.type}`)
      }
    })

    await assert('Should retrieve notifications list and mark notification as read', async () => {
      const getRes = await fetch(`${API_URL}/notifications`, {
        headers: authHeaders,
      })
      if (!getRes.ok) throw new Error(`Get notifications failed: ${getRes.status}`)
      const getData = await getRes.json()
      if (!getData.success || !Array.isArray(getData.data)) {
        throw new Error('Expected notifications array')
      }

      const notifId = getData.data[0]._id || getData.data[0].id
      const patchRes = await fetch(`${API_URL}/notifications/${notifId}/read`, {
        method: 'PATCH',
        headers: authHeaders,
      })

      if (!patchRes.ok) throw new Error(`Mark read failed: ${patchRes.status}`)
      const patchData = await patchRes.json()
      if (!patchData.data.read) throw new Error('Notification was not marked read')
    })

    await assert('Should mark all notifications as read in bulk', async () => {
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PATCH',
        headers: authHeaders,
      })
      if (!res.ok) throw new Error(`Mark all read failed: ${res.status}`)
    })

  } finally {
    if (socketClient) {
      socketClient.disconnect()
    }

    await new Promise<void>((resolve) => {
      server.close(() => {
        console.log('\n[COLLABORATION TEST SERVER] Closed successfully.')
        resolve()
      })
    })
    await db.disconnect()
  }

  console.log('\n=====================================================')
  console.log(` PHASE 6 TEST RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=====================================================\n')

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase6CollaborationTests().catch((err) => {
  console.error('Fatal error during Phase 6 tests:', err)
  process.exit(1)
})
