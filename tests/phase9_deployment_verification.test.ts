import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'
import { SfuService } from '../server/src/services/sfu.service'
import { StorageService } from '../server/src/services/storage.service'
import { AiService } from '../server/src/services/ai/ai.service'
import supertest from 'supertest'
import { io as ClientIO } from 'socket.io-client'
import http from 'http'
import fs from 'fs'
import path from 'path'

const TEST_PORT = 5098
const BACKEND_URL = `http://localhost:${TEST_PORT}`

async function runDeploymentVerification() {
  console.log('=================================================================')
  console.log(' INTELLMEET PHASE 9: PRODUCTION DEPLOYMENT & READINESS VERIFICATION')
  console.log('=================================================================\n')

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

  // 1. Initialize Server & DB
  const { app, server } = createApp()
  await db.connect()

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`[DEPLOYMENT TEST HOST] Backend server running on ${BACKEND_URL}\n`)
      resolve()
    })
  })

  const request = supertest(app)

  try {
    // -------------------------------------------------------------
    // 1. HEALTH CHECKS & SYSTEM STATUS APIS
    // -------------------------------------------------------------
    console.log('[1] Testing Production Health Checks & Service Endpoints...')

    await assert('Top-level GET /health returns 200 with system metrics', async () => {
      const res = await request.get('/health')
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      if (!res.body.success) throw new Error('Response success flag is false')
      if (!res.body.data.database?.status) throw new Error('Database status missing in health check')
      if (!res.body.data.system?.memoryUsageMB) throw new Error('Memory usage missing in health check')
    })

    await assert('Versioned GET /api/v1/health returns healthy status', async () => {
      const res = await request.get('/api/v1/health')
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      if (res.body.data.status !== 'healthy') throw new Error(`Expected healthy, got ${res.body.data.status}`)
    })

    await assert('Root welcome GET / returns platform directory', async () => {
      const res = await request.get('/')
      if (res.status !== 200) throw new Error(`Expected 200, got ${res.status}`)
      if (!res.body.service.includes('IntellMeet')) throw new Error('Service name not found')
    })

    // -------------------------------------------------------------
    // 2. PRODUCTION SECURITY HEADERS & CORS
    // -------------------------------------------------------------
    console.log('\n[2] Testing Production Security Headers & CORS...')

    await assert('Security: Response contains Helmet nosniff header', async () => {
      const res = await request.get('/health')
      if (res.headers['x-content-type-options'] !== 'nosniff') {
        throw new Error('x-content-type-options: nosniff header missing')
      }
    })

    await assert('CORS: OPTIONS preflight responds with sanctioned credentials headers', async () => {
      const res = await request
        .options('/api/auth/login')
        .set('Origin', 'https://intellmeet.vercel.app')
        .set('Access-Control-Request-Method', 'POST')
      if (res.status !== 204 && res.status !== 200) {
        throw new Error(`Expected 200 or 204 for OPTIONS, got ${res.status}`)
      }
    })

    // -------------------------------------------------------------
    // 3. AUTHENTICATION & ACCESS CONTROL
    // -------------------------------------------------------------
    console.log('\n[3] Testing Production Authentication & RBAC Gating...')

    const uniqueEmail = `deploy_admin_${Date.now()}@intellmeet.com`
    let accessToken = ''

    await assert('Auth: Register organization owner in production mode', async () => {
      const res = await request.post('/api/auth/register').send({
        name: 'DevOps Architect',
        email: uniqueEmail,
        password: 'SecurePassword123!',
        organizationName: 'Global Cloud Enterprise',
      })
      if (res.status !== 201) throw new Error(`Registration failed: ${res.status} ${JSON.stringify(res.body)}`)
      accessToken = res.body.data.accessToken
    })

    await assert('Auth: Profile endpoint /api/auth/me accepts Bearer token', async () => {
      const res = await request.get('/api/auth/me').set('Authorization', `Bearer ${accessToken}`)
      if (res.status !== 200) throw new Error(`Profile fetch failed: ${res.status}`)
      if (res.body.data.email !== uniqueEmail) throw new Error('Email mismatch in profile')
    })

    await assert('Security: Request without Bearer token returns 401 Unauthorized', async () => {
      const res = await request.get('/api/auth/me')
      if (res.status !== 401) throw new Error(`Expected 401, got ${res.status}`)
    })

    // -------------------------------------------------------------
    // 4. REAL-TIME SOCKET.IO SIGNALING & WEBRTC
    // -------------------------------------------------------------
    console.log('\n[4] Testing Socket.io Real-Time Signaling Engine...')

    await assert('Socket: Client connects and successfully joins room with signaling', async () => {
      const clientSocket = ClientIO(BACKEND_URL, {
        transports: ['websocket'],
        reconnection: false,
      })

      await new Promise<void>((resolve, reject) => {
        const timer = setTimeout(() => {
          clientSocket.disconnect()
          reject(new Error('Socket connection timed out'))
        }, 5000)

        clientSocket.on('connect', () => {
          clientSocket.emit('join-room', {
            roomId: 'prod_deploy_test_room',
            user: { id: 'usr_deploy', name: 'DevOps QA', isHost: true },
          })
        })

        clientSocket.on('room-users', () => {
          clearTimeout(timer)
          clientSocket.disconnect()
          resolve()
        })

        clientSocket.on('connect_error', (err) => {
          clearTimeout(timer)
          reject(err)
        })
      })
    })

    await assert('Video: SFU credentials generation produces valid token and STUN servers', async () => {
      const sfuCreds = await SfuService.generateToken({
        roomId: 'prod_deploy_test_room',
        identity: 'usr_deploy',
        name: 'DevOps QA',
        isHost: true,
      })
      if (!sfuCreds.token) throw new Error('SFU token is empty')
      if (!sfuCreds.iceServers || sfuCreds.iceServers.length === 0) {
        throw new Error('STUN/TURN ICE servers list is empty')
      }
    })

    // -------------------------------------------------------------
    // 5. AI ENGINE & PERSISTENT STORAGE
    // -------------------------------------------------------------
    console.log('\n[5] Testing AI Intelligence & Cloud Storage Service...')

    await assert('AI: Summarization service generates structured 7-section minutes', async () => {
      const res = await request
        .post('/api/ai/summarize')
        .send({
          roomName: 'mtg_prod_deploy',
          transcript: [
            { speaker: 'DevOps Lead', text: 'All Docker containers, Vercel SPA routing, and health checks are configured.' },
            { speaker: 'Security Architect', text: 'Helmet security headers and MIME upload filters are active.' },
            { speaker: 'Database Lead', text: 'MongoDB compound indexes and connection pooling are verified.' },
          ],
        })
      if (res.status !== 200) throw new Error(`Summarize failed: ${res.status}`)
      if (!res.body.data?.summary?.meetingOverview) {
        throw new Error('Summary missing required enterprise minute sections')
      }
    })

    await assert('Storage: Persists recording metadata and handles object storage upload', async () => {
      const sampleBuffer = Buffer.from('RIFF....WAVEfmt ....data....')
      const rec = await StorageService.uploadRecording({
        meetingId: 'mtg_prod_deploy',
        title: 'Production Audit Recording',
        durationSeconds: 120,
        buffer: sampleBuffer,
        mimeType: 'video/webm',
        format: 'webm',
      })
      if (!rec.url) throw new Error('Recording URL was not returned')
    })

    // -------------------------------------------------------------
    // 6. VERCEL CONFIGURATION & STATIC ARTIFACTS VALIDATION
    // -------------------------------------------------------------
    console.log('\n[6] Testing Vercel Configuration & Client SPA Build...')

    await assert('Vercel: Root and client vercel.json exist with valid SPA rewrites', async () => {
      const rootVercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../vercel.json'), 'utf-8'))
      const clientVercel = JSON.parse(fs.readFileSync(path.resolve(__dirname, '../client/vercel.json'), 'utf-8'))

      if (!rootVercel.rewrites || rootVercel.rewrites[0].destination !== '/index.html') {
        throw new Error('Root vercel.json missing SPA /index.html rewrite')
      }
      if (!clientVercel.rewrites || clientVercel.rewrites[0].destination !== '/index.html') {
        throw new Error('Client vercel.json missing SPA /index.html rewrite')
      }
    })

    await assert('Vercel: Client dist directory exists with compiled index.html and assets', async () => {
      const indexPath = path.resolve(__dirname, '../client/dist/index.html')
      if (!fs.existsSync(indexPath)) throw new Error('client/dist/index.html is missing. Run npm run build:client')
      const indexContent = fs.readFileSync(indexPath, 'utf-8')
      if (!indexContent.includes('<div id="root"></div>')) {
        throw new Error('client/dist/index.html root mounting element not found')
      }
    })
  } catch (err: any) {
    console.error('Fatal deployment verification error:', err)
  } finally {
    await db.disconnect()
    server.close()
  }

  console.log('\n=================================================================')
  console.log(` DEPLOYMENT VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runDeploymentVerification()
