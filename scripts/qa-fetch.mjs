import { chromium } from '@playwright/test'

const browser = await chromium.launch()
const page = await browser.newPage()
const errors = []
page.on('console', (m) => errors.push(`${m.type()}: ${m.text()}`))
page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`))
page.on('requestfailed', (r) =>
  errors.push(`requestfailed: ${r.url()} ${r.failure()?.errorText}`),
)
await page.goto('http://localhost:5173/', { waitUntil: 'load' })
await page.waitForTimeout(3000)
const html = await page.content()
console.log('BODY LENGTH', html.length)
console.log(html.slice(0, 1500))
console.log('---CONSOLE---')
console.log(errors.join('\n'))
await browser.close()
