import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = path.resolve(__dirname, '../public');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

const DROP_SVG = `
<svg viewBox="0 0 24 24" width="100%" height="100%" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="dropFill" x1="6" y1="4" x2="18" y2="22" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#7dd3fc"/>
      <stop offset="45%" stop-color="#38bdf8"/>
      <stop offset="100%" stop-color="#0284c7"/>
    </linearGradient>
    <linearGradient id="dropShine" x1="8" y1="6" x2="12" y2="14" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.7"/>
      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
    </linearGradient>
  </defs>
  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" fill="url(#dropFill)"/>
  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" stroke="#e0f2fe" stroke-width="0.6" stroke-opacity="0.35"/>
  <path d="M9.2 12.4c.7 2.1 2.2 3.4 4.3 3.7" stroke="#e0f2fe" stroke-width="1.3" stroke-linecap="round" stroke-opacity="0.85"/>
  <ellipse cx="10.2" cy="9.4" rx="1.6" ry="2.4" fill="url(#dropShine)" transform="rotate(-28 10.2 9.4)"/>
</svg>
`;

function iconHtml(size) {
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  html, body { margin: 0; width: ${size}px; height: ${size}px; overflow: hidden; }
  body {
    background:
      radial-gradient(circle at 32% 28%, #1a3a58 0%, transparent 42%),
      radial-gradient(circle at 70% 78%, #083344 0%, #090d16 58%);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .mark { width: ${Math.round(size * 0.62)}px; height: ${Math.round(size * 0.62)}px; }
</style></head>
<body><div class="mark">${DROP_SVG}</div></body></html>`;
}

function splashHtml(cssW, cssH, dpr) {
  const pxW = cssW * dpr;
  const pxH = cssH * dpr;
  const mark = Math.round(Math.min(pxW, pxH) * 0.22);
  return `<!doctype html>
<html><head><meta charset="utf-8">
<style>
  html, body { margin: 0; width: ${pxW}px; height: ${pxH}px; overflow: hidden; background: #090d16; }
  body { display: flex; align-items: center; justify-content: center; }
  .mark { width: ${mark}px; height: ${mark}px; }
</style></head>
<body><div class="mark">${DROP_SVG}</div></body></html>`;
}

async function screenshotHtml(browser, html, width, height, outPath) {
  const page = await browser.newPage();
  await page.setViewport({ width, height, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'png', omitBackground: false });
  await page.close();
}

async function run() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--hide-scrollbars'],
  });

  const icon512 = path.join(PUBLIC_DIR, 'icon-512.png');
  const icon192 = path.join(PUBLIC_DIR, 'icon-192.png');
  const touch = path.join(PUBLIC_DIR, 'apple-touch-icon.png');

  await screenshotHtml(browser, iconHtml(512), 512, 512, icon512);
  await screenshotHtml(browser, iconHtml(192), 192, 192, icon192);
  await screenshotHtml(browser, iconHtml(180), 180, 180, touch);

  const splashes = [
    [402, 874],
    [440, 956],
    [420, 912],
    [393, 852],
    [390, 844],
  ];
  for (const [w, h] of splashes) {
    const out = path.join(PUBLIC_DIR, `splash-${w}x${h}.png`);
    await screenshotHtml(browser, splashHtml(w, h, 3), w * 3, h * 3, out);
    console.log('wrote', path.basename(out));
  }

  await browser.close();
  console.log('wrote icon-512.png, icon-192.png, apple-touch-icon.png');
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
