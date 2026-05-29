const { chromium } = require('playwright')

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'

async function withBrowserPage(run, options = {}) {
  const { timeout = 90000 } = options
  let browser

  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--disable-blink-features=AutomationControlled', '--no-sandbox'],
    })

    const context = await browser.newContext({
      userAgent: USER_AGENT,
      viewport: { width: 1366, height: 900 },
      locale: 'en-US',
      timezoneId: 'America/New_York',
      extraHTTPHeaders: {
        'Accept-Language': 'en-US,en;q=0.9',
      },
    })

    const page = await context.newPage()
    page.setDefaultTimeout(timeout)
    return await run(page)
  } finally {
    if (browser) await browser.close()
  }
}

async function scrollPage(page, steps = 4) {
  for (let step = 0; step < steps; step++) {
    await page.evaluate(() => window.scrollBy(0, 800))
    await page.waitForTimeout(600)
  }
}

module.exports = {
  USER_AGENT,
  withBrowserPage,
  scrollPage,
}
