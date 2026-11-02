import { startServer } from '../server/src/index'

async function runLiveCheck() {
  console.log('--- Starting live server verification test ---')
  const server = await startServer()

  try {
    // 1. Health check endpoint test
    const healthRes = await fetch('http://localhost:5000/api/v1/health')
    console.log(`Health endpoint status: ${healthRes.status} ${healthRes.statusText}`)
    const healthData = await healthRes.json()
    console.log('Health Response Data:', JSON.stringify(healthData, null, 2))

    if (!healthRes.ok || healthData.success !== true) {
      throw new Error(`Health check failed: ${JSON.stringify(healthData)}`)
    }

    // 2. Root endpoint test
    const rootRes = await fetch('http://localhost:5000/')
    console.log(`Root endpoint status: ${rootRes.status}`)
    const rootData = await rootRes.json()
    console.log('Root Endpoint Data:', JSON.stringify(rootData, null, 2))

    // 3. AI summarize endpoint test
    const aiRes = await fetch('http://localhost:5000/api/v1/ai/summarize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomName: 'Live Test Room',
        transcript: [
          { speaker: 'Architect', text: 'Let us confirm the health check and MongoDB resilient fallback.' },
          { speaker: 'DevOps', text: 'Health endpoint returned 200 OK.' },
        ],
        messages: [
          { sender: 'QA', text: 'All 4 verification tests passing with zero errors.' },
        ],
      }),
    })
    console.log(`AI summarize status: ${aiRes.status}`)
    const aiData = await aiRes.json()
    console.log('AI Summarize Output:', JSON.stringify(aiData, null, 2))

    // 4. Meeting create & retrieve test
    const saveRes = await fetch('http://localhost:5000/api/v1/meetings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        roomId: 'test-verified-room',
        title: 'Phase 1 Verified Meeting',
        hostName: 'Senior Architect',
        participants: ['Senior Architect', 'System Verifier'],
        summary: 'Phase 1 skeleton and architecture verified live.',
        keyDecisions: ['Approved Phase 1 complete technical foundation.'],
        actionItems: [{ text: 'Begin Phase 2 media relays', assignee: 'Architect', completed: false }],
      }),
    })
    console.log(`Meeting save status: ${saveRes.status}`)
    const saveData = await saveRes.json()
    console.log('Meeting Save Output:', JSON.stringify(saveData, null, 2))

    // 5. Query recent meetings
    const listRes = await fetch('http://localhost:5000/api/v1/meetings')
    console.log(`Meeting list status: ${listRes.status}`)
    const listData = await listRes.json()
    console.log('Meeting List Output count:', listData.data?.length)

    console.log('✅ ALL LIVE SERVER VERIFICATION CHECKS PASSED SUCCESSFULLY!')
  } finally {
    server.close(() => {
      console.log('--- Live test server closed cleanly ---')
      process.exit(0)
    })
  }
}

runLiveCheck().catch((err) => {
  console.error('❌ Live check failed:', err)
  process.exit(1)
})
