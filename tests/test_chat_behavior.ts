import { chromium } from 'playwright'

async function testChatBehavior() {
  console.log('Testing Chatbox Behavior for Name Repeating Bug...')
  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    permissions: ['camera', 'microphone'],
    viewport: { width: 1440, height: 900 },
  })
  const page = await context.newPage()

  try {
    // Open meeting room
    console.log('Navigating to meeting room...')
    await page.goto('http://localhost:5173/room/chat-test-room', { waitUntil: 'domcontentloaded', timeout: 15000 })
    
    // Wait 5 seconds to observe if any continuous repeating join/leave happens
    console.log('Observing chatbox for 5 seconds to ensure stability...')
    await page.waitForTimeout(5000)

    // Check all messages in the chat drawer
    const messages = await page.locator('aside .overflow-y-auto > div').allTextContents()
    console.log(`Total messages in chatbox after 5 seconds: ${messages.length}`)
    messages.forEach((m, i) => console.log(`  [Message ${i + 1}]: "${m.replace(/\s+/g, ' ').trim()}"`))

    // Send a message
    const chatInput = page.locator('input[placeholder*="message"]')
    if (await chatInput.isVisible()) {
      await chatInput.fill('Hello team, checking chat clarity!')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
    }

    const messagesAfterSend = await page.locator('aside .overflow-y-auto > div').allTextContents()
    console.log(`Total messages in chatbox after sending: ${messagesAfterSend.length}`)
    messagesAfterSend.forEach((m, i) => console.log(`  [Message ${i + 1}]: "${m.replace(/\s+/g, ' ').trim()}"`))

    // Check if there are any repeating identical messages
    const textCounts: Record<string, number> = {}
    for (const msg of messagesAfterSend) {
      const clean = msg.replace(/\s+/g, ' ').trim()
      textCounts[clean] = (textCounts[clean] || 0) + 1
    }

    let hasRepeatedMessages = false
    for (const [text, count] of Object.entries(textCounts)) {
      if (count > 1) {
        hasRepeatedMessages = true
        console.error(`❌ Found repeating message (${count}x): "${text}"`)
      }
    }

    if (!hasRepeatedMessages) {
      console.log('✅ Chatbox is completely clean and stable with 0 repeating messages!')
    }

  } catch (err: any) {
    console.error('Chat test error:', err.message || err)
  } finally {
    await browser.close()
  }
}

testChatBehavior()
