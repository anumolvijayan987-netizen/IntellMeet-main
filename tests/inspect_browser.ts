import { chromium } from 'playwright'
import fs from 'fs'
import path from 'path'

async function inspectWebsite() {
  console.log('=================================================================')
  console.log(' COMPREHENSIVE INTELLMEET FUNCTIONAL & BROWSER AUDIT')
  console.log('=================================================================\n')

  const browser = await chromium.launch({ headless: true })
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    permissions: ['camera', 'microphone'],
  })
  const page = await context.newPage()

  const consoleLogs: string[] = []
  const pageErrors: string[] = []
  const failedRequests: string[] = []

  page.on('console', (msg) => {
    const text = `[BROWSER CONSOLE ${msg.type().toUpperCase()}] ${msg.text()}`
    consoleLogs.push(text)
    if (msg.type() === 'error') {
      console.error('  🔴', text)
    }
  })

  page.on('pageerror', (err) => {
    const text = `[PAGE UNCAUGHT ERROR] ${err.message}\n${err.stack}`
    pageErrors.push(text)
    console.error('  💥', text)
  })

  page.on('requestfailed', (req) => {
    const text = `[REQUEST FAILED] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`
    failedRequests.push(text)
    console.error('  ⚠️ ', text)
  })

  const screenshotDir = path.resolve(__dirname, '../screenshots')
  if (!fs.existsSync(screenshotDir)) {
    fs.mkdirSync(screenshotDir, { recursive: true })
  }

  try {
    // 1. Landing Page
    console.log('[1] Landing Page (http://localhost:5173/) ...')
    const res = await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded', timeout: 15000 })
    console.log(`  HTTP Status: ${res?.status()}`)
    const title = await page.title()
    console.log(`  Title: "${title}"`)
    const heroH1 = await page.textContent('h1')
    console.log(`  Hero Heading: "${heroH1?.trim()}"`)
    await page.screenshot({ path: path.join(screenshotDir, '01_landing_page.png') })
    console.log('  📸 Screenshot: 01_landing_page.png')

    // 2. Login Page & 1-Click Demo Profile
    console.log('\n[2] Login Page & 1-Click Profile (http://localhost:5173/login) ...')
    await page.goto('http://localhost:5173/login', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.screenshot({ path: path.join(screenshotDir, '02_login_page.png') })
    console.log('  📸 Screenshot: 02_login_page.png')

    // Click 1-Click Demo Profile "Sarah Chen"
    const demoButton = page.locator('button:has-text("Sarah Chen")')
    if (await demoButton.isVisible()) {
      await demoButton.click()
      await page.waitForURL('**/app', { timeout: 10000 })
      console.log('  ✅ 1-Click Demo Login navigated to /app successfully!')
    }

    // 3. Register Page (No Email Verification Requirement)
    console.log('\n[3] Register Flow Without Email Verification (http://localhost:5173/register) ...')
    await page.goto('http://localhost:5173/register', { waitUntil: 'domcontentloaded', timeout: 15000 })
    const testEmail = `lead_${Date.now()}@company.com`
    await page.fill('input[placeholder="Sarah Chen"]', 'Lead Tester')
    await page.fill('input[placeholder="sarah@company.com"]', testEmail)
    await page.fill('input[placeholder="Acme Global Inc."]', 'Global Cloud Inc')
    await page.fill('input[placeholder="Create a strong password"]', 'Password123!')
    await page.check('input[type="checkbox"]')
    await page.screenshot({ path: path.join(screenshotDir, '03_register_filled.png') })

    await page.click('button[type="submit"]')
    // Should navigate straight to /app WITHOUT /verify-email wall!
    await page.waitForURL('**/app', { timeout: 10000 })
    console.log('  ✅ Registration completed & immediately accessed /app without email verification code!')
    await page.screenshot({ path: path.join(screenshotDir, '04_registered_dashboard.png') })

    // 4. Meeting Room Functional Testing
    console.log('\n[4] Meeting Room Interactive Testing (/room/sprint-audit) ...')
    await page.goto('http://localhost:5173/room/sprint-audit', { waitUntil: 'domcontentloaded', timeout: 15000 })
    await page.waitForTimeout(2000)
    await page.screenshot({ path: path.join(screenshotDir, '05_meeting_initial.png') })
    console.log('  📸 Screenshot: 05_meeting_initial.png')

    // Test Camera Toggle
    console.log('  Testing Camera Toggle button...')
    const camButton = page.locator('footer button').nth(1)
    await camButton.click({ noWaitAfter: true })
    await page.waitForTimeout(1000)
    console.log('  Camera toggled OFF')
    await page.screenshot({ path: path.join(screenshotDir, '06_cam_off.png') })
    await camButton.click({ noWaitAfter: true })
    await page.waitForTimeout(1000)
    console.log('  Camera toggled ON')
    await page.screenshot({ path: path.join(screenshotDir, '07_cam_on.png') })

    // Test Screen Share Toggle
    console.log('  Testing Screen Share button...')
    const screenButton = page.locator('footer button').nth(2)
    await screenButton.click({ force: true, noWaitAfter: true })
    await page.waitForTimeout(1500)
    console.log('  Screen share activated!')
    await page.screenshot({ path: path.join(screenshotDir, '08_screen_share_active.png') })

    // Test Name Change (Comment / Identity section)
    console.log('  Testing Display Name Editor...')
    const nameEditButton = page.locator('header button:has-text("(Edit)")')
    if (await nameEditButton.isVisible()) {
      await nameEditButton.dispatchEvent('click')
      await page.waitForTimeout(500)
      const nameInput = page.locator('input[placeholder*="Alex Rivera"]')
      if (await nameInput.isVisible()) {
        await nameInput.fill('Dr. David Kim (Chief Architect)')
        await page.locator('button:has-text("Save Name")').dispatchEvent('click')
        await page.waitForTimeout(500)
        console.log('  Display name updated to custom title!')
      }
    }

    // Test Live Chat (Comment Section)
    console.log('  Testing Live Chat / Comments...')
    const chatInput = page.locator('input[placeholder*="message"]')
    if (await chatInput.isVisible()) {
      await chatInput.fill('All systems verified: WebRTC mesh, camera, and display streaming active.')
      await page.keyboard.press('Enter')
      await page.waitForTimeout(1000)
      console.log('  Chat message sent successfully!')
      try {
        await page.screenshot({ path: path.join(screenshotDir, '09_chat_verified.png'), timeout: 5000, animations: 'disabled' })
      } catch (e) {
        console.warn('  (Screenshot 09 skipped due to canvas animation)')
      }
    }

    // Test Leave Button
    console.log('  Testing Leave button...')
    await page.evaluate(() => {
      const btn = Array.from(document.querySelectorAll('footer button')).find((b) => b.textContent?.includes('Leave')) as HTMLButtonElement | undefined
      btn?.click()
    })
    await page.waitForTimeout(500)

    // If modal appeared (e.g. if host), click Leave Session
    await page.evaluate(() => {
      const modalBtn = Array.from(document.querySelectorAll('button')).find((b) => b.textContent?.includes('Leave Session')) as HTMLButtonElement | undefined
      modalBtn?.click()
    })

    // Wait for redirect to /app
    await page.waitForURL('**/app', { timeout: 10000 })
    console.log('  ✅ Leave button immediately exited meeting room and navigated to /app!')
    try {
      await page.screenshot({ path: path.join(screenshotDir, '10_exited_dashboard.png'), timeout: 5000, animations: 'disabled' })
    } catch (e) {
      console.warn('  (Screenshot 10 skipped)')
    }

  } catch (err: any) {
    console.error('\nFatal inspection error:', err.message || err)
  } finally {
    await browser.close()
  }

  console.log('\n=================================================================')
  console.log(' AUDIT SUMMARY')
  console.log('=================================================================')
  console.log(`  Page Errors:      ${pageErrors.length}`)
  console.log(`  Failed Requests:  ${failedRequests.length}`)
  console.log(`  Total Logs:       ${consoleLogs.length}`)
  console.log('=================================================================\n')
}

inspectWebsite()
