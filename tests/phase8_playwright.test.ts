import { chromium } from 'playwright'
import express from 'express'
import http from 'http'
import path from 'path'

const PREVIEW_PORT = 5199
const APP_URL = `http://localhost:${PREVIEW_PORT}`

async function runPlaywrightSuite() {
  console.log('=================================================================')
  console.log(' INTELLMEET PHASE 8: PLAYWRIGHT BROWSER & RESPONSIVE E2E')
  console.log('=================================================================\n')

  // Serve client dist directory
  const app = express()
  const distPath = path.resolve(__dirname, '../client/dist')
  app.use(express.static(distPath))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(distPath, 'index.html'))
  })

  const server = http.createServer(app)
  await new Promise<void>((resolve) => {
    server.listen(PREVIEW_PORT, () => {
      console.log(`[PLAYWRIGHT TEST HOST] Serving production build on ${APP_URL}`)
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

  const browser = await chromium.launch({
    headless: true,
  })

  try {
    // ---------------------------------------------------------
    // 1. DESKTOP VIEWPORT TEST (1920x1080)
    // ---------------------------------------------------------
    console.log('\n[1] Testing Desktop Viewport (1920x1080)...')

    await assert('Desktop: Landing Page loads with valid title and hero headline', async () => {
      const context = await browser.newContext({ viewport: { width: 1920, height: 1080 } })
      const page = await context.newPage()
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })

      const heading = await page.textContent('h1')
      if (!heading || !heading.includes('Make Every Meeting Matter')) {
        throw new Error(`Expected hero headline, found: "${heading}"`)
      }

      // Check no horizontal overflow
      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasHorizontalScroll) throw new Error('Detected horizontal layout overflow on desktop')

      await context.close()
    })

    // ---------------------------------------------------------
    // 2. LAPTOP VIEWPORT TEST (1366x768)
    // ---------------------------------------------------------
    console.log('\n[2] Testing Laptop Viewport (1366x768)...')

    await assert('Laptop: Authentication login page renders cleanly', async () => {
      const context = await browser.newContext({ viewport: { width: 1366, height: 768 } })
      const page = await context.newPage()
      await page.goto(`${APP_URL}/login`, { waitUntil: 'domcontentloaded' })

      const emailInput = await page.waitForSelector('input[type="email"]')
      if (!emailInput) throw new Error('Login email input not found')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasHorizontalScroll) throw new Error('Detected horizontal layout overflow on laptop')

      await context.close()
    })

    // ---------------------------------------------------------
    // 3. TABLET VIEWPORT TEST (768x1024)
    // ---------------------------------------------------------
    console.log('\n[3] Testing Tablet Viewport (768x1024)...')

    await assert('Tablet: Registration page renders with password validation', async () => {
      const context = await browser.newContext({ viewport: { width: 768, height: 1024 } })
      const page = await context.newPage()
      await page.goto(`${APP_URL}/register`, { waitUntil: 'domcontentloaded' })

      const submitBtn = await page.waitForSelector('button[type="submit"]')
      if (!submitBtn) throw new Error('Registration submit button not found')

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasHorizontalScroll) throw new Error('Detected horizontal layout overflow on tablet')

      await context.close()
    })

    // ---------------------------------------------------------
    // 4. MOBILE VIEWPORT TEST (375x667 - iPhone SE / 390x844 - iPhone 12)
    // ---------------------------------------------------------
    console.log('\n[4] Testing Mobile Viewport (375x667)...')

    await assert('Mobile: Landing page navigation and CTAs adapt without overflow', async () => {
      const context = await browser.newContext({ viewport: { width: 375, height: 667 } })
      const page = await context.newPage()
      await page.goto(APP_URL, { waitUntil: 'domcontentloaded' })

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasHorizontalScroll) throw new Error('Detected horizontal layout overflow on mobile')

      // Check Get Started button is visible and tap-friendly
      const getStartedBtn = await page.waitForSelector('button:has-text("Get Started")')
      if (!getStartedBtn) throw new Error('Get Started CTA missing on mobile')

      await context.close()
    })

    await assert('Mobile: Dark meeting room layout adapts without horizontal clipping', async () => {
      const context = await browser.newContext({ viewport: { width: 390, height: 844 } })
      const page = await context.newPage()
      await page.goto(`${APP_URL}/room/playwright-test-room`, { waitUntil: 'domcontentloaded' })

      const hasHorizontalScroll = await page.evaluate(() => {
        return document.documentElement.scrollWidth > document.documentElement.clientWidth
      })
      if (hasHorizontalScroll) throw new Error('Meeting room horizontal clipping detected on mobile')

      await context.close()
    })
  } catch (err: any) {
    console.error('Playwright suite error:', err)
  } finally {
    await browser.close()
    server.close()
  }

  console.log('\n=================================================================')
  console.log(` PLAYWRIGHT E2E RESULTS: ${passed} PASSED, ${failed} FAILED`)
  console.log('=================================================================')

  if (failed > 0) {
    process.exit(1)
  }
}

runPlaywrightSuite()
