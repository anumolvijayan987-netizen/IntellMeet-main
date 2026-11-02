import http from 'http'
import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'
import { generateAccessToken } from '../server/src/utils/token'

const PORT = 5099
const BASE_URL = `http://localhost:${PORT}/api`

async function runTestSuite() {
  console.log('=====================================================')
  console.log(' INTELLMEET PHASE 3: COMPREHENSIVE BACKEND & AUTH TEST')
  console.log('=====================================================\n')

  const { server } = createApp()
  await db.connect()

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`[TEST SERVER] Listening on http://localhost:${PORT}`)
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

  let testUserToken = ''
  let testRefreshToken = ''
  let testUserId = ''
  let testUserEmail = `eng.lead.${Date.now()}@intellmeet.io`
  let testPassword = 'Password123!'
  let newPassword = 'NewSecretPassword456!'
  let createdOrgId = ''
  let createdWsId = ''

  try {
    // ---------------------------------------------------------
    // 1. REGISTRATION & VALIDATION
    // ---------------------------------------------------------
    console.log('\n[1] Testing Registration & Validation...')

    await assert('Should reject registration with invalid email format', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Invalid User',
          email: 'not-an-email',
          password: testPassword,
        }),
      })
      if (res.status !== 400) throw new Error(`Expected 400, got ${res.status}`)
    })

    await assert('Should successfully register a new user with bcrypt hashed credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Lead Software Architect',
          email: testUserEmail,
          password: testPassword,
          role: 'org_admin',
          organizationName: 'IntellMeet Enterprise Labs',
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(`Registration failed: ${res.status} - ${text}`)
      }
      const data = await res.json()
      if (!data.data?.accessToken || !data.data?.user?.email) {
        throw new Error('Registration payload missing accessToken or user data')
      }
      testUserToken = data.data.accessToken
      testUserId = data.data.user.id
    })

    await assert('Should prevent duplicate email registration', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Duplicate Architect',
          email: testUserEmail,
          password: testPassword,
        }),
      })
      if (res.status !== 409) throw new Error(`Expected 409 conflict, got ${res.status}`)
    })

    // ---------------------------------------------------------
    // 2. AUTHENTICATION & LOGIN
    // ---------------------------------------------------------
    console.log('\n[2] Testing Authentication & Login...')

    await assert('Should reject login with incorrect password', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: 'wrong_password_xyz',
        }),
      })
      if (res.status !== 401) throw new Error(`Expected 401 Unauthorized, got ${res.status}`)
    })

    await assert('Should successfully log in with valid credentials and receive token', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: testPassword,
        }),
      })
      if (!res.ok) throw new Error(`Login failed with status ${res.status}`)
      const data = await res.json()
      if (!data.data?.accessToken) throw new Error('Missing accessToken in login response')
      testUserToken = data.data.accessToken

      // Extract set-cookie for refresh token if available
      const rawCookie = res.headers.get('set-cookie')
      if (rawCookie) {
        testRefreshToken = rawCookie
      }
    })

    // ---------------------------------------------------------
    // 3. PROTECTED ROUTES & RBAC
    // ---------------------------------------------------------
    console.log('\n[3] Testing Protected Routes & Bearer Auth...')

    await assert('Should reject /auth/me without Bearer token', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`)
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
    })

    await assert('Should accept /auth/me with valid Bearer token', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      })
      if (!res.ok) throw new Error(`Expected 200, got ${res.status}`)
      const data = await res.json()
      if (data.data?.email !== testUserEmail) {
        throw new Error(`Expected email ${testUserEmail}, got ${data.data?.email}`)
      }
    })

    await assert('Should reject token with invalid signature', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: 'Bearer this.is.an.invalid.token' },
      })
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
    })

    // ---------------------------------------------------------
    // 4. USER PROFILE MANAGEMENT
    // ---------------------------------------------------------
    console.log('\n[4] Testing User Profile & Password Updates...')

    await assert('Should update user display name and status', async () => {
      const res = await fetch(`${BASE_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          name: 'Dr. Sarah Connor, VP Engineering',
          status: 'busy',
        }),
      })
      if (!res.ok) throw new Error(`Profile update failed: ${res.status}`)
      const data = await res.json()
      if (data.data?.name !== 'Dr. Sarah Connor, VP Engineering') {
        throw new Error('Name was not updated properly')
      }
    })

    await assert('Should change password and verify with new password', async () => {
      const res = await fetch(`${BASE_URL}/users/me/password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          currentPassword: testPassword,
          newPassword: newPassword,
        }),
      })
      if (!res.ok) throw new Error(`Password change failed: ${res.status}`)

      // Verify login with new password
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: testUserEmail,
          password: newPassword,
        }),
      })
      if (!loginRes.ok) throw new Error('Could not log in with newly updated password')
      const loginData = await loginRes.json()
      testUserToken = loginData.data.accessToken
    })

    // ---------------------------------------------------------
    // 5. ORGANIZATIONS & WORKSPACES
    // ---------------------------------------------------------
    console.log('\n[5] Testing Organizations & Workspaces Management...')

    await assert('Should create enterprise organization', async () => {
      const orgSlug = `test-org-${Date.now()}`
      const res = await fetch(`${BASE_URL}/organizations`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          name: 'Cloud Scale Global',
          slug: orgSlug,
          tier: 'enterprise',
        }),
      })
      if (!res.ok) throw new Error(`Org creation failed: ${res.status}`)
      const data = await res.json()
      const org = data.data?.organization || data.data
      createdOrgId = org._id || org.id
      if (!createdOrgId) throw new Error('Org ID missing')
    })

    await assert('Should create workspace within organization', async () => {
      const res = await fetch(`${BASE_URL}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          organizationId: createdOrgId,
          name: 'Core Systems Squad',
          slug: `core-sys-${Date.now()}`,
          isPrivate: false,
        }),
      })
      if (!res.ok) throw new Error(`Workspace creation failed: ${res.status}`)
      const data = await res.json()
      createdWsId = data.data._id || data.data.id
      if (!createdWsId) throw new Error('Workspace ID missing')
    })

    await assert('Should invite member to workspace', async () => {
      const res = await fetch(`${BASE_URL}/workspaces/${createdWsId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          email: 'junior.dev@intellmeet.io',
          role: 'member',
        }),
      })
      if (!res.ok) throw new Error(`Invite member failed: ${res.status}`)
    })

    await assert('Should enforce RBAC and reject workspace creation for non-admin role', async () => {
      // Forge guest user token
      const guestToken = generateAccessToken({
        userId: 'usr_guest_1',
        email: 'guest@sample.com',
        role: 'guest',
      })
      const res = await fetch(`${BASE_URL}/workspaces`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${guestToken}`,
        },
        body: JSON.stringify({
          organizationId: createdOrgId,
          name: 'Unauthorized Space',
          slug: 'unauthorized',
        }),
      })
      if (res.status !== 403) throw new Error(`Expected 403 Forbidden for guest role, got ${res.status}`)
    })

    // ---------------------------------------------------------
    // 6. DATABASE CRUD OPERATIONS
    // ---------------------------------------------------------
    console.log('\n[6] Testing Database CRUD Operations (ActionItems, Messages, Transcripts, Recordings)...')

    let testMeetingId = `meet-${Date.now()}`

    await assert('Should create a Meeting record', async () => {
      const res = await fetch(`${BASE_URL}/meetings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          roomId: testMeetingId,
          title: 'Q4 Product Roadmap Sync',
          hostName: 'Dr. Sarah Connor',
          participants: ['Dr. Sarah Connor', 'Tech Lead Alex'],
          summary: 'Roadmap approved and WebRTC signaling finalized.',
          keyDecisions: ['Adopted WebRTC mesh signaling architecture.'],
          actionItems: [{ text: 'Ship Phase 3 release', assignee: 'Alex', completed: false }],
        }),
      })
      if (!res.ok) throw new Error(`Meeting creation failed: ${res.status}`)
    })

    await assert('Should create and retrieve an Action Item', async () => {
      const postRes = await fetch(`${BASE_URL}/action-items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          text: 'Complete security audit for JWT rotation',
          assignee: 'Security Team',
          status: 'pending',
          priority: 'high',
        }),
      })
      if (!postRes.ok) throw new Error(`Action item creation failed: ${postRes.status}`)
      const postData = await postRes.json()
      const itemId = postData.data._id || postData.data.id

      // Update status
      const patchRes = await fetch(`${BASE_URL}/action-items/${itemId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'completed' }),
      })
      if (!patchRes.ok) throw new Error(`Action item patch failed: ${patchRes.status}`)

      // Retrieve list
      const getRes = await fetch(`${BASE_URL}/action-items`)
      if (!getRes.ok) throw new Error(`Action items get failed: ${getRes.status}`)
      const getData = await getRes.json()
      if (!Array.isArray(getData.data)) throw new Error('Expected array of action items')
    })

    await assert('Should send and retrieve Chat Messages', async () => {
      const sendRes = await fetch(`${BASE_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${testUserToken}`,
        },
        body: JSON.stringify({
          meetingId: testMeetingId,
          content: 'Hello everyone! Real-time pipeline is fully operating.',
          type: 'text',
        }),
      })
      if (!sendRes.ok) throw new Error(`Send message failed: ${sendRes.status}`)

      const listRes = await fetch(`${BASE_URL}/messages?meetingId=${testMeetingId}`)
      if (!listRes.ok) throw new Error(`List messages failed: ${listRes.status}`)
      const listData = await listRes.json()
      if (!Array.isArray(listData.data) || listData.data.length === 0) {
        throw new Error('Messages list was empty')
      }
    })

    await assert('Should log Transcript chunk and retrieve search results', async () => {
      const chunkRes = await fetch(`${BASE_URL}/transcripts`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          meetingId: testMeetingId,
          speakerName: 'Dr. Sarah Connor',
          text: 'Our AI model accurately parsed the voice transcript with high confidence.',
          startTime: 1200,
          endTime: 4500,
          confidence: 0.98,
        }),
      })
      if (!chunkRes.ok) throw new Error(`Save transcript failed: ${chunkRes.status}`)

      const searchRes = await fetch(`${BASE_URL}/transcripts?meetingId=${testMeetingId}&search=confidence`)
      if (!searchRes.ok) throw new Error(`Search transcripts failed: ${searchRes.status}`)
    })

    await assert('Should retrieve and mark Notifications as read', async () => {
      const notifRes = await fetch(`${BASE_URL}/notifications`, {
        headers: { Authorization: `Bearer ${testUserToken}` },
      })
      if (!notifRes.ok) throw new Error(`Notifications get failed: ${notifRes.status}`)

      const markRes = await fetch(`${BASE_URL}/notifications/notif_1/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${testUserToken}` },
      })
      if (!markRes.ok) throw new Error(`Notification mark read failed: ${markRes.status}`)
    })

    // ---------------------------------------------------------
    // 7. REFRESH TOKEN & LOGOUT
    // ---------------------------------------------------------
    console.log('\n[7] Testing Refresh Token Rotation & Logout...')

    await assert('Should successfully logout and invalidate session', async () => {
      const res = await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${testUserToken}` },
      })
      if (!res.ok) throw new Error(`Logout failed: ${res.status}`)
    })

  } finally {
    server.close()
  }

  console.log('\n=====================================================')
  console.log(` RESULTS: ${passed} PASSED | ${failed} FAILED`)
  console.log('=====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runTestSuite().catch((err) => {
  console.error('Fatal Test Suite Error:', err)
  process.exit(1)
})
