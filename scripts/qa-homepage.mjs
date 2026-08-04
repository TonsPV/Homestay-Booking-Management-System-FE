// Temporary Visual QA script for HomePage. Not committed.
import { chromium } from '@playwright/test'
import fs from 'node:fs'

const BASE = process.env.QA_BASE_URL ?? 'http://localhost:5173'
const OUT = 'docs/audits/homepage-qa'
fs.mkdirSync(OUT, { recursive: true })

const viewports = [
  { name: '375x812', width: 375, height: 812 },
  { name: '640x900', width: 640, height: 900 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
]

const report = []

const browser = await chromium.launch()

for (const vp of viewports) {
  const context = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    deviceScaleFactor: 1,
  })
  const page = await context.newPage()
  const consoleMessages = []
  page.on('console', (msg) => {
    if (msg.type() === 'error' || msg.type() === 'warning') {
      consoleMessages.push(`${msg.type()}: ${msg.text()}`)
    }
  })
  page.on('pageerror', (err) => consoleMessages.push(`pageerror: ${err.message}`))

  await page.goto(BASE + '/', { waitUntil: 'networkidle' })
  await page.waitForTimeout(1800)

  const metrics = await page.evaluate(() => {
    const doc = document.documentElement
    const hero = document.querySelector('[data-home-hero]')
    const navbar = document.querySelector('header, nav')
    const heroRect = hero?.getBoundingClientRect()
    const navRect = navbar?.getBoundingClientRect()
    const h1s = [...document.querySelectorAll('h1')].map((h) => h.textContent?.trim())
    const h2s = [...document.querySelectorAll('h2')].map((h) => h.textContent?.trim())
    const marqueeRows = [...document.querySelectorAll('[data-marquee-row]')].map(
      (row) => ({ children: row.children.length, width: row.scrollWidth }),
    )
    // find overflowing elements
    const overflowing = []
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect()
      if (r.width > 0 && (r.right > doc.clientWidth + 1 || r.left < -1)) {
        const style = getComputedStyle(el)
        if (style.position !== 'absolute' || r.right > doc.clientWidth + 1) {
          overflowing.push(
            `${el.tagName}.${String(el.className).slice(0, 60)} right=${Math.round(r.right)} left=${Math.round(r.left)}`,
          )
        }
      }
    })
    return {
      scrollWidth: doc.scrollWidth,
      clientWidth: doc.clientWidth,
      hasHorizontalScroll: doc.scrollWidth > doc.clientWidth + 1,
      heroTop: heroRect?.top ?? null,
      heroHeight: heroRect?.height ?? null,
      navHeight: navRect?.height ?? null,
      navOverlapsHero: navRect && heroRect ? navRect.bottom > heroRect.top + 1 : null,
      h1Count: h1s.length,
      h1s,
      h2s,
      marqueeRows,
      overflowing: overflowing.slice(0, 12),
    }
  })

  await page.screenshot({ path: `${OUT}/home-${vp.name}-top.png` })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.45))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/home-${vp.name}-mid.png` })
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${OUT}/home-${vp.name}-bottom.png` })

  report.push({ viewport: vp.name, ...metrics, consoleMessages })
  fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
  console.log(`done ${vp.name}`, JSON.stringify(metrics))
  await context.close()
}

// --- Interaction checks at 375px ---
const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } })
const page = await ctx.newPage()
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1200)

// 1. Search validation errors
await page.getByRole('button', { name: 'Tìm phòng', exact: true }).click()
await page.waitForTimeout(300)
const validation = await page.evaluate(() => {
  const checkIn = document.querySelector('#home-check-in')
  const checkOut = document.querySelector('#home-check-out')
  const guests = document.querySelector('#home-guests')
  const described = (el) => el?.getAttribute('aria-describedby')
  const errText = (el) => {
    const id = described(el)
    return id ? document.getElementById(id)?.textContent : null
  }
  return {
    checkInDescribedBy: described(checkIn),
    checkInError: errText(checkIn),
    checkOutError: errText(checkOut),
    guestsError: errText(guests),
    checkInInvalid: checkIn?.getAttribute('aria-invalid'),
  }
})

// 2. Fill form and submit -> verify query string
await page.fill('#home-check-in', '2026-08-10')
await page.fill('#home-check-out', '2026-08-12')
await page.fill('#home-guests', '3')
await page.getByRole('button', { name: 'Tìm phòng', exact: true }).click()
await page.waitForTimeout(600)
const searchUrl = page.url()

// 3. Search page reads params
const searchPageState = await page.evaluate(() => ({
  url: location.href,
  checkInValue: document.querySelector('input[type="date"]')?.value ?? null,
  bodySnippet: document.body.innerText.slice(0, 400),
}))

// 4. Tab order check on home
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.waitForTimeout(1000)
const tabOrder = []
for (let i = 0; i < 14; i++) {
  await page.keyboard.press('Tab')
  const active = await page.evaluate(() => {
    const el = document.activeElement
    if (!el) return null
    const outline = getComputedStyle(el).outlineWidth
    return {
      tag: el.tagName,
      text: (el.textContent ?? '').trim().slice(0, 40),
      href: el.getAttribute('href'),
      outlineWidth: outline,
      outlineStyle: getComputedStyle(el).outlineStyle,
    }
  })
  tabOrder.push(active)
}

// 5. Reduced motion
const rmCtx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: 'reduce',
})
const rmPage = await rmCtx.newPage()
await rmPage.goto(BASE + '/', { waitUntil: 'networkidle' })
await rmPage.waitForTimeout(1200)
const reducedMotionState = await rmPage.evaluate(() => {
  const animated = [...document.querySelectorAll('[data-marquee-row]')].map((r) =>
    getComputedStyle(r).animationName,
  )
  const scrollGallery = document.querySelector('.snap-x') !== null
  return { marqueeAnimations: animated, staticGalleryRendered: scrollGallery }
})
await rmPage.screenshot({ path: `${OUT}/home-reduced-motion.png` })
await rmCtx.close()

report.push({ validation, searchUrl, searchPageState, tabOrder, reducedMotionState })

fs.writeFileSync(`${OUT}/report.json`, JSON.stringify(report, null, 2))
console.log(JSON.stringify(report, null, 2))

await browser.close()
