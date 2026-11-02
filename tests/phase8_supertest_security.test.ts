import request from 'supertest'
import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'

async function runSupertestSecurityAudit() {
  console.log('=================================================================')
  console.log(' INTELLMEET PHASE 8: SUPERTEST SECURITY & QUALITY AUDIT')
  console.log('=================================================================\n')

  const { app } = createApp()
  await db.connect()

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

  let adminToken = ''
  let memberToken = ''
  let refreshTokenCookie = ''
  const testAdminEmail = `sec.admin_${Date.now()}@enterprise.com`
  const testMemberEmail = `sec.member_${Date.now()}@enterprise.com`

  try {
    // ---------------------------------------------------------
    // 1. AUTHENTICATION & SECURE COOKIE TESTS
    // ---------------------------------------------------------
    console.log('\n[1] Testing Authentication & Cookie Security via Supertest...')

    await assert('Should register organization administrator account', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Security Admin',
          email: testAdminEmail,
          password: 'Password123!',
          organizationName: 'Secure Enterprise Corp',
          role: 'org_admin',
        })
        .expect(201)

      if (!res.body.success || !res.body.data?.accessToken) {
        throw new Error('Expected accessToken in registration response')
      }
      adminToken = res.body.data.accessToken

      // Verify Set-Cookie header for refreshToken
      const cookies = res.headers['set-cookie']
      if (!cookies || !cookies.some((c: string) => c.includes('refreshToken=') && c.includes('HttpOnly'))) {
        throw new Error('Expected HttpOnly refreshToken cookie in registration response')
      }
      refreshTokenCookie = cookies.find((c: string) => c.includes('refreshToken=')) || ''
    })

    await assert('Should register member account with standard role', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Standard Member',
          email: testMemberEmail,
          password: 'Password123!',
          organizationName: 'Secure Enterprise Corp',
          role: 'member',
        })
        .expect(201)

      memberToken = res.body.data?.accessToken
    })

    await assert('Should reject login with invalid password (401)', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdminEmail,
          password: 'WrongPassword999!',
        })
        .expect(401)

      if (res.body.success !== false) throw new Error('Expected failure response on bad password')
    })

    await assert('Should login with valid password and rotate secure cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({
          email: testAdminEmail,
          password: 'Password123!',
        })
        .expect(200)

      if (!res.body.data?.accessToken) throw new Error('Missing access token')
      adminToken = res.body.data.accessToken

      const cookies = res.headers['set-cookie']
      if (!cookies || !cookies.some((c: string) => c.includes('refreshToken=') && c.includes('HttpOnly'))) {
        throw new Error('Missing HttpOnly refreshToken cookie')
      }
    })

    // ---------------------------------------------------------
    // 2. SECURITY HEADERS & CORS COMPLIANCE
    // ---------------------------------------------------------
    console.log('\n[2] Testing HTTP Security Headers & CORS...')

    await assert('Should include Helmet security headers (nosniff, hidePoweredBy)', async () => {
      const res = await request(app).get('/api/health').expect(200)

      if (res.headers['x-powered-by']) {
        throw new Error('X-Powered-By header should be removed by Helmet')
      }
      if (res.headers['x-content-type-options'] !== 'nosniff') {
        throw new Error('Expected X-Content-Type-Options: nosniff')
      }
    })

    await assert('Should respond with CORS headers on OPTIONS preflight', async () => {
      const res = await request(app)
        .options('/api/meetings')
        .set('Origin', 'http://localhost:5173')
        .set('Access-Control-Request-Method', 'POST')
        .expect(204)

      if (!res.headers['access-control-allow-origin']) {
        throw new Error('Expected Access-Control-Allow-Origin header in preflight')
      }
    })

    // ---------------------------------------------------------
    // 3. AUTHORIZATION & RBAC GATING
    // ---------------------------------------------------------
    console.log('\n[3] Testing Authorization & RBAC Enforcement...')

    await assert('Should reject unauthenticated access to /api/auth/me with 401', async () => {
      const res = await request(app).get('/api/auth/me').expect(401)
      if (res.body.success !== false) throw new Error('Expected success: false')
    })

    await assert('Should allow authenticated access to /api/auth/me with Bearer token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200)

      if (!res.body.data?.email || res.body.data.email !== testAdminEmail) {
        throw new Error('User identity mismatch in /auth/me')
      }
    })

    await assert('Should block member from privileged workspace creation with 403', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Hacked Workspace',
          slug: 'hacked-ws',
        })
        .expect(403)

      if (res.body.success !== false) throw new Error('Expected forbidden response')
    })

    await assert('Should allow org_admin to create workspace', async () => {
      const res = await request(app)
        .post('/api/workspaces')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Security Audit Team',
          slug: `sec-audit-${Date.now()}`,
          description: 'Penetration testing & compliance review',
        })
        .expect(201)

      if (!res.body.data?._id) throw new Error('Workspace creation failed for org_admin')
    })

    // ---------------------------------------------------------
    // 4. INPUT VALIDATION & FILE UPLOAD RESTRICTIONS
    // ---------------------------------------------------------
    console.log('\n[4] Testing Input Validation & File Upload Restrictions...')

    await assert('Should reject invalid registration email with 400 Validation Error', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Bad Email User',
          email: 'not-an-email-address',
          password: 'Password123!',
          organizationName: 'Test Org',
        })
        .expect(400)

      if (res.body.success !== false) throw new Error('Expected validation failure')
    })

    await assert('Should reject executable script upload to recording endpoint (400)', async () => {
      const maliciousScript = Buffer.from('#!/bin/bash\nrm -rf /')

      const res = await request(app)
        .post('/api/recordings/upload')
        .set('Authorization', `Bearer ${adminToken}`)
        .field('meetingId', 'room_sec_test')
        .field('title', 'Exploit Payload')
        .attach('recording', maliciousScript, 'exploit.sh')
        .expect(400)

      if (res.body.success !== false) throw new Error('Expected file upload rejection for non-video')
    })

    await assert('Should reject malicious executable avatar upload (400)', async () => {
      const dummyExe = Buffer.from('MZ_DOS_EXECUTABLE_HEADER_FAKE')

      const res = await request(app)
        .post('/api/users/me/avatar')
        .set('Authorization', `Bearer ${adminToken}`)
        .attach('avatar', dummyExe, 'malware.exe')
        .expect(400)

      if (res.body.success !== false) throw new Error('Expected rejection for .exe file upload')
    })

    // ---------------------------------------------------------
    // 5. RESILIENCE, 404 & MALFORMED PAYLOAD HANDLING
    // ---------------------------------------------------------
    console.log('\n[5] Testing 404 Handling & Malformed Payloads...')

    await assert('Should return 404 for non-existent meeting room validation', async () => {
      await request(app)
        .get('/api/meetings/validate/non_existent_room_sec_test')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })

    await assert('Should return 400 for empty meeting patch update', async () => {
      await request(app)
        .patch('/api/meetings/test_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400)
    })

    await assert('Should return 404 for non-existent recording ID', async () => {
      await request(app)
        .get('/api/recordings/non_existent_rec_id')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404)
    })
  } catch (err: any) {
    console.error('Audit execution error:', err)
  } finally {
    await db.disconnect()
  }

  console.log('\n=================================================================')
  console.log(` SUPERTEST AUDIT RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runSupertestSecurityAudit()
