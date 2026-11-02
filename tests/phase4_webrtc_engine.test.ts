import http from 'http'
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client'
import { createApp } from '../server/src/index'
import { db } from '../server/src/config/db'

const PORT = 5088
const SERVER_URL = `http://localhost:${PORT}`
const API_URL = `${SERVER_URL}/api`

async function runPhase4Tests() {
  console.log('=====================================================')
  console.log(' INTELLMEET PHASE 4: REAL-TIME VIDEO & WEBRTC ENGINE')
  console.log('=====================================================\n')

  const { server } = createApp()
  await db.connect()

  await new Promise<void>((resolve) => {
    server.listen(PORT, () => {
      console.log(`[REAL-TIME TEST SERVER] Listening on ${SERVER_URL}`)
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

  let testRoomId = ''
  let clientHost: ClientSocket | null = null
  let clientPeer: ClientSocket | null = null

  try {
    // ---------------------------------------------------------
    // 1. MEETING CREATION, VALIDATION & SFU CREDENTIALS
    // ---------------------------------------------------------
    console.log('\n[1] Testing Meeting Creation, Access Validation & SFU Tokens...')

    await assert('Should create meeting with unique roomId and invitation link', async () => {
      const res = await fetch(`${API_URL}/meetings/create`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'WebRTC Architecture & Mesh Relay Sprint',
          hostName: 'Sarah Connor',
          isPrivate: false,
        }),
      })
      if (!res.ok) throw new Error(`Create meeting failed: ${res.status}`)
      const data = await res.json()
      testRoomId = data.data.roomId
      if (!testRoomId || !data.data.inviteUrl) {
        throw new Error('Missing roomId or inviteUrl in response')
      }
    })

    await assert('Should validate meeting access and return STUN/TURN ICE configuration', async () => {
      const res = await fetch(`${API_URL}/meetings/validate/${testRoomId}`)
      if (!res.ok) throw new Error(`Validate meeting failed: ${res.status}`)
      const data = await res.json()
      if (!data.data.iceServers || data.data.iceServers.length === 0) {
        throw new Error('Missing STUN/TURN ICE servers configuration')
      }
    })

    await assert('Should generate LiveKit SFU access token with room permissions', async () => {
      const res = await fetch(`${API_URL}/meetings/${testRoomId}/token?identity=usr_sarah&name=Sarah%20Connor`)
      if (!res.ok) throw new Error(`SFU token issue failed: ${res.status}`)
      const data = await res.json()
      if (!data.data.token || data.data.provider !== 'livekit') {
        throw new Error('Invalid SFU credentials response')
      }
    })

    // ---------------------------------------------------------
    // 2. MULTI-USER SOCKET.IO PRESENCE & PEER DISCOVERY
    // ---------------------------------------------------------
    console.log('\n[2] Testing Multi-User Socket.io Signaling & Peer Discovery...')

    await assert('Should connect Host client and join meeting room', async () => {
      clientHost = ioClient(SERVER_URL, { transports: ['websocket'] })
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Host socket connection timeout')), 3000)
        clientHost!.on('connect', () => {
          clearTimeout(timeout)
          clientHost!.emit('join-room', {
            roomId: testRoomId,
            userName: 'Sarah Connor (Host)',
            userId: 'usr_sarah',
            isHost: true,
          })
          resolve()
        })
      })
    })

    await assert('Should connect Participant client and receive mutual peer discovery', async () => {
      clientPeer = ioClient(SERVER_URL, { transports: ['websocket'] })

      const hostDiscoveredPeer = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Host did not discover new peer')), 4000)
        clientHost!.on('user-joined', (data) => {
          if (data.userName.includes('David')) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      const peerReceivedRoomUsers = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Peer did not receive room-users')), 4000)
        clientPeer!.on('room-users', (users) => {
          if (Array.isArray(users) && users.some((u) => u.userName.includes('Sarah'))) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      await new Promise<void>((resolve) => {
        clientPeer!.on('connect', () => {
          clientPeer!.emit('join-room', {
            roomId: testRoomId,
            userName: 'David Miller',
            userId: 'usr_david',
            isHost: false,
          })
          resolve()
        })
      })

      await Promise.all([hostDiscoveredPeer, peerReceivedRoomUsers])
    })

    // ---------------------------------------------------------
    // 3. WEBRTC SIGNALING: SDP OFFER, ANSWER & TRICKLE ICE
    // ---------------------------------------------------------
    console.log('\n[3] Testing WebRTC Offer, Answer & ICE Candidate Signaling Exchange...')

    await assert('Should exchange SDP Offer and Answer between Host and Participant', async () => {
      const peerReceivedOffer = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Peer did not receive SDP Offer')), 3000)
        clientPeer!.on('offer', ({ senderId, offer }) => {
          if (offer?.type === 'offer' && offer.sdp) {
            clearTimeout(timeout)
            // Respond with answer
            clientPeer!.emit('answer', {
              targetId: senderId,
              answer: { type: 'answer', sdp: 'v=0\r\no=david 4567 2 IN IP4 127.0.0.1\r\ns=IntellMeet\r\nt=0 0\r\n' },
            })
            resolve()
          }
        })
      })

      const hostReceivedAnswer = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Host did not receive SDP Answer')), 3000)
        clientHost!.on('answer', ({ answer }) => {
          if (answer?.type === 'answer' && answer.sdp) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      // Host initiates offer to peer
      clientHost!.emit('offer', {
        targetId: clientPeer!.id,
        offer: { type: 'offer', sdp: 'v=0\r\no=sarah 1234 2 IN IP4 127.0.0.1\r\ns=IntellMeet\r\nt=0 0\r\n' },
      })

      await Promise.all([peerReceivedOffer, hostReceivedAnswer])
    })

    await assert('Should exchange Trickle ICE Candidates between peers', async () => {
      const peerReceivedCandidate = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Peer did not receive ICE Candidate')), 3000)
        clientPeer!.on('ice-candidate', ({ candidate }) => {
          if (candidate?.candidate.includes('19302')) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientHost!.emit('ice-candidate', {
        targetId: clientPeer!.id,
        candidate: {
          candidate: 'candidate:1 1 UDP 2130706431 192.168.1.50 19302 typ host',
          sdpMid: '0',
          sdpMLineIndex: 0,
        },
      })

      await peerReceivedCandidate
    })

    // ---------------------------------------------------------
    // 4. MEDIA STATE & ACTIVE SPEAKER PROPAGATION
    // ---------------------------------------------------------
    console.log('\n[4] Testing Media State & Active Speaker Broadcasts...')

    await assert('Should broadcast Camera/Microphone track mute state changes', async () => {
      const peerReceivedMediaChange = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Media state change timeout')), 3000)
        clientPeer!.on('media-state-change', (state) => {
          if (state.audioEnabled === false && state.videoEnabled === true) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientHost!.emit('media-state-change', {
        roomId: testRoomId,
        audioEnabled: false,
        videoEnabled: true,
        screenSharing: false,
      })

      await peerReceivedMediaChange
    })

    await assert('Should broadcast Screen Sharing activation status', async () => {
      const peerReceivedScreenShare = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Screen share status timeout')), 3000)
        clientPeer!.on('media-state-change', (state) => {
          if (state.screenSharing === true) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientHost!.emit('media-state-change', {
        roomId: testRoomId,
        audioEnabled: true,
        videoEnabled: true,
        screenSharing: true,
      })

      await peerReceivedScreenShare
    })

    await assert('Should propagate Active Speaker real-time audio level events', async () => {
      const hostReceivedActiveSpeaker = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Active speaker event timeout')), 3000)
        clientHost!.on('active-speaker', (data) => {
          if (data.speakerName === 'David Miller' && data.volume > 50) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientPeer!.emit('active-speaker', {
        roomId: testRoomId,
        speakerId: 'usr_david',
        speakerName: 'David Miller',
        volume: 75.4,
      })

      await hostReceivedActiveSpeaker
    })

    // ---------------------------------------------------------
    // 5. REAL-TIME CHAT & DATABASE PERSISTENCE
    // ---------------------------------------------------------
    console.log('\n[5] Testing Real-Time Chat & Database Persistence...')

    await assert('Should broadcast chat message in real time and persist to MongoDB', async () => {
      const testContent = 'Confirming WebRTC mesh relay with zero latency!'

      const hostReceivedChat = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Chat message timeout')), 3000)
        clientHost!.on('receive-message', (msg) => {
          if (msg.text === testContent && msg.sender === 'David Miller') {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientPeer!.emit('send-message', {
        roomId: testRoomId,
        message: {
          text: testContent,
          content: testContent,
          sender: 'David Miller',
          senderId: 'usr_david',
        },
      })

      await hostReceivedChat

      // Verify message persistence via API
      const historyRes = await fetch(`${API_URL}/messages?meetingId=${testRoomId}`)
      if (!historyRes.ok) throw new Error('Chat history endpoint failed')
      const historyData = await historyRes.json()
      if (!Array.isArray(historyData.data) || !historyData.data.some((m: any) => m.content === testContent)) {
        throw new Error('Persisted chat message not found in database')
      }
    })

    // ---------------------------------------------------------
    // 6. HOST CONTROLS & END MEETING
    // ---------------------------------------------------------
    console.log('\n[6] Testing Host Administrative Controls & Meeting Conclude...')

    await assert('Host should be able to force-mute a participant', async () => {
      const peerReceivedMute = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Force mute timeout')), 3000)
        clientPeer!.on('force-mute', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      clientHost!.emit('admin-mute-user', {
        roomId: testRoomId,
        targetSocketId: clientPeer!.id,
      })

      await peerReceivedMute
    })

    await assert('Host should be able to end meeting for all participants', async () => {
      const peerReceivedEndMeeting = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Meeting ended event timeout')), 3000)
        clientPeer!.on('meeting-ended', () => {
          clearTimeout(timeout)
          resolve()
        })
      })

      clientHost!.emit('end-meeting-all', { roomId: testRoomId })
      await peerReceivedEndMeeting
    })

    // ---------------------------------------------------------
    // 7. CLOUD OBJECT STORAGE RECORDING PERSISTENCE
    // ---------------------------------------------------------
    console.log('\n[7] Testing Persistent Cloud Object Storage Recording Upload...')

    await assert('Should upload recording media to object storage and persist metadata', async () => {
      const dummyWebM = Buffer.from('WEBM_HEADER_SAMPLE_RECORDING_STREAM_AUDIO_VIDEO_PAYLOAD')
      const formData = new FormData()
      formData.append('recording', new Blob([dummyWebM], { type: 'video/webm' }), 'test-rec.webm')
      formData.append('meetingId', testRoomId)
      formData.append('title', 'Phase 4 WebRTC Engine Verification Recording')
      formData.append('durationSeconds', '145')

      const res = await fetch(`${API_URL}/recordings/upload`, {
        method: 'POST',
        body: formData,
      })
      if (!res.ok) {
        const errText = await res.text()
        throw new Error(`Recording upload failed: ${res.status} - ${errText}`)
      }
      const data = await res.json()
      if (!data.data.url || data.data.status !== 'ready') {
        throw new Error('Recording metadata invalid')
      }

      // Verify retrieval
      const getRes = await fetch(`${API_URL}/recordings?meetingId=${testRoomId}`)
      if (!getRes.ok) throw new Error('Failed to retrieve recording from database')
    })

    // ---------------------------------------------------------
    // 8. DISCONNECTION & RESOURCE CLEANUP
    // ---------------------------------------------------------
    console.log('\n[8] Testing Participant Disconnection & Clean Resource Cleanup...')

    await assert('Should cleanly process peer departure and notify remaining room members', async () => {
      const peerSocketId = clientPeer!.id
      const hostReceivedDeparture = new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('Peer departure event timeout')), 4000)
        clientHost!.on('user-left', (data) => {
          if (data.socketId === peerSocketId) {
            clearTimeout(timeout)
            resolve()
          }
        })
      })

      clientPeer!.disconnect()
      await hostReceivedDeparture
    })

  } finally {
    if (clientHost) clientHost.disconnect()
    if (clientPeer) clientPeer.disconnect()
    server.close()
  }

  console.log('\n=====================================================')
  console.log(` PHASE 4 RESULTS: ${passed} PASSED | ${failed} FAILED`)
  console.log('=====================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runPhase4Tests().catch((err) => {
  console.error('Fatal Phase 4 Test Suite Error:', err)
  process.exit(1)
})
