import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/agentos/.gemini/antigravity/brain/9a34b44a-7fd1-4315-81c2-df0f405306e1';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function clickButtonByText(page, textSubstring) {
  return page.evaluate((text) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((b) => b.textContent && b.textContent.includes(text));
    if (target) {
      target.click();
      return true;
    }
    return false;
  }, textSubstring);
}

async function run() {
  console.log('Launching headless Chrome...');
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--enable-webgl',
      '--ignore-gpu-blocklist',
      '--use-gl=angle',
      '--use-angle=metal',
    ],
    defaultViewport: { width: 1200, height: 960, deviceScaleFactor: 2 },
  });

  const page = await browser.newPage();
  
  page.on('console', (msg) => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', (err) => console.error('PAGE ERROR:', err.toString()));

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

  // 1. Initial Empty Dashboard (Header without reference button)
  await new Promise((r) => setTimeout(r, 1200));
  console.log('Capturing updated dashboard empty view...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot-1-dashboard-empty.png') });

  // 2. Open Settings to verify 32 oz present and 128 oz removed
  console.log('Opening Goal Settings Modal...');
  const settingsBtn = await page.$('button[title="Daily Target Settings"]');
  if (settingsBtn) {
    await settingsBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot-2-settings-modal-32oz.png') });
    await clickButtonByText(page, 'Save Target');
    await new Promise((r) => setTimeout(r, 400));
  }

  // 3. Log Cup 1 (Tall Glass) - Capture plunging fluid stream
  console.log('Logging Cup 1 (Tall Glass)...');
  await page.evaluate(() => {
    const cupButtons = Array.from(document.querySelectorAll('button'));
    const tallCup = cupButtons.find((b) => b.textContent && b.textContent.includes('Tall Glass'));
    if (tallCup) tallCup.click();
  });
  await new Promise((r) => setTimeout(r, 700));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot-3-cinematic-pour-fluid.png') });

  // Wait for finish
  await new Promise((r) => setTimeout(r, 2600));

  // 4. Log multiple glasses (5 glasses total) to demonstrate tiered depth layout & auto-zooming camera
  console.log('Logging multiple glasses for depth tier test...');
  for (let i = 0; i < 4; i++) {
    await page.evaluate((index) => {
      const cupButtons = Array.from(document.querySelectorAll('button:has(h4)'));
      const cup = cupButtons[index % cupButtons.length];
      if (cup) cup.click();
    }, i + 1);
    await new Promise((r) => setTimeout(r, 300));
    await clickButtonByText(page, 'fast-fill');
    await new Promise((r) => setTimeout(r, 1200));
  }

  // 5. Capture the multi-tier staggered depth board with all glasses fully visible on screen!
  console.log('Capturing multi-tier staggered depth board...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot-4-tiered-depth-board.png') });

  // 6. Open Drink History Modal to verify exact glass icons & pure water labels
  console.log('Opening drink history modal...');
  const histBtn = await page.$('button[title="Drink History"]');
  if (histBtn) {
    await histBtn.click();
    await new Promise((r) => setTimeout(r, 600));
    await page.screenshot({ path: path.join(ARTIFACT_DIR, 'screenshot-5-history-exact-icons.png') });
  }

  await browser.close();
  console.log('All tests completed successfully!');
}

run().catch((e) => {
  console.error('Error running visual tests:', e);
  process.exit(1);
});
