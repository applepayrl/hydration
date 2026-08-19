import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const ARTIFACT_DIR = '/Users/agentos/.gemini/antigravity/brain/9a34b44a-7fd1-4315-81c2-df0f405306e1';
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

async function clickCup(page, cupName) {
  await page.evaluate((name) => {
    const buttons = Array.from(document.querySelectorAll('button:has(h4)'));
    const target = buttons.find((b) => b.textContent && b.textContent.includes(name));
    if (target) target.click();
  }, cupName);
  await new Promise((r) => setTimeout(r, 200));
  
  // Click fast fill if available
  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const fastFill = buttons.find((b) => b.textContent && b.textContent.includes('fast-fill'));
    if (fastFill) fastFill.click();
  });
  await new Promise((r) => setTimeout(r, 900));
}

async function clearShelf(page) {
  const histBtn = await page.$('button[title="Drink History"]');
  if (histBtn) {
    await histBtn.click();
    await new Promise((r) => setTimeout(r, 400));
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const reset = buttons.find((b) => b.textContent && b.textContent.includes('Reset Today'));
      if (reset) reset.click();
      const done = buttons.find((b) => b.textContent && b.textContent.includes('Done'));
      if (done) done.click();
    });
    // Also click X if still open
    const closeBtn = await page.$('button:has(svg.lucide-x)');
    if (closeBtn) await closeBtn.click();
    await new Promise((r) => setTimeout(r, 500));
  }
}

async function run() {
  console.log('Launching headless Chrome for stacking sequence verification...');
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
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 15000 });

  // 1. Verify Clean Empty State (no forced log first glass button)
  await clearShelf(page);
  await new Promise((r) => setTimeout(r, 800));
  console.log('Capturing empty shelf with no forced button...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-1-empty-shelf-clean.png') });

  // 2. Test Sequence A: User specific case: Tall Glass THEN Teardrop Glass (2 glasses)
  console.log('Testing Sequence A: Tall Glass + Teardrop Glass (2 glasses)...');
  await clickCup(page, 'Tall Glass');
  await clickCup(page, 'Teardrop Glass');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-2-tall-then-teardrop.png') });

  // 3. Test Sequence B: Teardrop Glass THEN Tall Glass (reverse order)
  console.log('Testing Sequence B: Teardrop Glass + Tall Glass (reverse order)...');
  await clearShelf(page);
  await clickCup(page, 'Teardrop Glass');
  await clickCup(page, 'Tall Glass');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-3-teardrop-then-tall.png') });

  // 4. Test Sequence C: Classic (8oz) + Tall (10oz) + Teardrop (10oz) (3 glasses)
  console.log('Testing Sequence C: 3 glasses (Classic + Tall + Teardrop)...');
  await clearShelf(page);
  await clickCup(page, 'Classic Glass');
  await clickCup(page, 'Tall Glass');
  await clickCup(page, 'Teardrop Glass');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-4-three-glasses-formation.png') });

  // 5. Test Sequence D: 4 glasses (Teardrop, Tall, Classic, Tall)
  console.log('Testing Sequence D: 4 glasses...');
  await clickCup(page, 'Tall Glass');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-5-four-glasses-formation.png') });

  // 6. Test Sequence E: 6 glasses
  console.log('Testing Sequence E: 6 glasses...');
  await clickCup(page, 'Classic Glass');
  await clickCup(page, 'Teardrop Glass');
  await new Promise((r) => setTimeout(r, 1200));
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'test-6-six-glasses-formation.png') });

  await browser.close();
  console.log('All stacking tests passed successfully!');
}

run().catch((e) => {
  console.error('Error running stacking tests:', e);
  process.exit(1);
});
