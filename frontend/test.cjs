const { chromium } = require('playwright-core');

(async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' }).catch(async () => {
    // Fallback if Chrome is not there
    const puppeteer = require('puppeteer');
    return puppeteer.launch();
  });
  const page = await browser.newPage();
  page.on('console', msg => console.log('LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
  await page.goto('http://localhost:5173');
  await page.waitForTimeout(2000);
  await browser.close();
})();
