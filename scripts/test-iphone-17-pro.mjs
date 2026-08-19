import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'visual-tests');
const CHROME_PATH = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const BASE_URL = process.env.TEST_URL || 'http://127.0.0.1:3000';

const IPHONE_17_PRO = {
  width: 402,
  height: 874,
  deviceScaleFactor: 3,
  isMobile: true,
  hasTouch: true,
};
const SAFE_TOP = 62;
const SAFE_BOTTOM = 34;

const STATUS_OVERLAY = `
<div id="ios-chrome-overlay" style="
  position:fixed;inset:0;pointer-events:none;z-index:2147483647;
  font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#fff;
">
  <div style="position:absolute;top:0;left:0;right:0;height:${SAFE_TOP}px;">
    <div style="position:absolute;left:22px;top:16px;font-size:15px;font-weight:600;letter-spacing:-0.2px;">9:41</div>
    <div style="position:absolute;left:50%;top:11px;transform:translateX(-50%);
      width:126px;height:37px;background:#000;border-radius:999px;border:1px solid rgba(255,255,255,0.12);"></div>
    <div style="position:absolute;right:18px;top:18px;font-size:12px;font-weight:600;opacity:0.95;">5G ●●●●</div>
  </div>
  <div style="position:absolute;left:50%;bottom:8px;transform:translateX(-50%);
    width:134px;height:5px;background:rgba(255,255,255,0.42);border-radius:999px;"></div>
</div>
`;

function fail(failures, message) {
  failures.push(message);
  console.error('FAIL:', message);
}

function pass(message) {
  console.log('PASS:', message);
}

async function applyIphoneStandalone(page) {
  await page.setViewport(IPHONE_17_PRO);
}

async function injectSafeArea(page) {
  await page.evaluate((top, bottom) => {
    document.documentElement.style.setProperty('--safe-top', `${top}px`);
    document.documentElement.style.setProperty('--safe-bottom', `${bottom}px`);
    document.documentElement.style.setProperty('--safe-left', '0px');
    document.documentElement.style.setProperty('--safe-right', '0px');
  }, SAFE_TOP, SAFE_BOTTOM);
}

async function injectOverlay(page) {
  await page.evaluate((html) => {
    document.getElementById('ios-chrome-overlay')?.remove();
    document.body.insertAdjacentHTML('beforeend', html);
  }, STATUS_OVERLAY);
}

async function clickByTitle(page, title) {
  const handle = await page.$(`button[title="${title}"]`);
  if (!handle) return false;
  await handle.click();
  return true;
}

async function clickByText(page, text) {
  return page.evaluate((needle) => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const target = buttons.find((b) => b.textContent && b.textContent.includes(needle));
    if (!target) return false;
    target.click();
    return true;
  }, text);
}

async function measureLayout(page) {
  return page.evaluate((safeTop, safeBottom, height) => {
    const header = document.querySelector('.safe-top');
    const dock = document.querySelector('.safe-bottom');
    const frameBadge = Array.from(document.querySelectorAll('span,button')).filter((el) => {
      const t = (el.textContent || '').trim();
      return t === 'Fullscreen' || t === 'iPhone Frame' || t === 'iPhone 17 Pro';
    });
    const chassis = document.querySelector('[class*="rounded-\\[54px\\]"]');
    const headerBox = header ? header.getBoundingClientRect() : null;
    const firstHeaderControl = header
      ? header.querySelector('button, .rounded-full')
      : null;
    const firstBox = firstHeaderControl ? firstHeaderControl.getBoundingClientRect() : headerBox;
    const dockBox = dock ? dock.getBoundingClientRect() : null;
    const lastDock = dock ? dock.lastElementChild : null;
    const lastBox = lastDock ? lastDock.getBoundingClientRect() : dockBox;
    const shell = document.querySelector('.app-shell');
    const shellBox = shell ? shell.getBoundingClientRect() : null;

    return {
      hasFullscreenToggle: frameBadge.some((el) => (el.textContent || '').includes('Fullscreen')),
      hasFrameToggle: frameBadge.some((el) => (el.textContent || '').includes('iPhone Frame')),
      hasProBadge: frameBadge.some((el) => (el.textContent || '').trim() === 'iPhone 17 Pro'),
      hasChassis: Boolean(chassis),
      headerTop: firstBox ? firstBox.top : null,
      dockBottom: lastBox ? lastBox.bottom : null,
      shell: shellBox
        ? { width: shellBox.width, height: shellBox.height, top: shellBox.top, left: shellBox.left }
        : null,
      viewport: { width: window.innerWidth, height: window.innerHeight },
      safeTop,
      safeBottom,
      maxDockBottom: height - safeBottom,
    };
  }, SAFE_TOP, SAFE_BOTTOM, IPHONE_17_PRO.height);
}

async function checkHtml(page, failures) {
  const meta = await page.evaluate(() => {
    const get = (name) => document.querySelector(`meta[name="${name}"]`)?.getAttribute('content');
    const viewport = document.querySelector('meta[name="viewport"]')?.getAttribute('content') || '';
    return {
      capable: get('apple-mobile-web-app-capable'),
      mobileCapable: get('mobile-web-app-capable'),
      statusBar: get('apple-mobile-web-app-status-bar-style'),
      title: get('apple-mobile-web-app-title'),
      theme: get('theme-color'),
      viewport,
      icon: document.querySelector('link[rel="apple-touch-icon"]')?.getAttribute('href') || '',
      manifest: document.querySelector('link[rel="manifest"]')?.getAttribute('href') || '',
      splash: document.querySelectorAll('link[rel="apple-touch-startup-image"]').length,
    };
  });

  if (meta.capable !== 'yes') fail(failures, 'apple-mobile-web-app-capable is not yes');
  else pass('apple-mobile-web-app-capable=yes');
  if (meta.statusBar !== 'black-translucent') fail(failures, `status bar style is ${meta.statusBar}`);
  else pass('status-bar-style=black-translucent');
  if (!meta.viewport.includes('viewport-fit=cover')) fail(failures, 'viewport-fit=cover missing');
  else pass('viewport-fit=cover');
  if (!meta.icon) fail(failures, 'apple-touch-icon missing');
  else pass(`apple-touch-icon=${meta.icon}`);
  if (!meta.manifest) fail(failures, 'manifest link missing');
  else pass(`manifest=${meta.manifest}`);
  if (meta.splash < 1) fail(failures, 'no apple-touch-startup-image links');
  else pass(`startup images: ${meta.splash}`);
  if (meta.title !== 'AquaFlow') fail(failures, `apple-mobile-web-app-title is ${meta.title}`);
  else pass('home-screen title AquaFlow');

  const manifestHref = meta.manifest;
  const manifest = await page.evaluate(async (href) => {
    const res = await fetch(href);
    if (!res.ok) throw new Error(`manifest HTTP ${res.status}`);
    return res.json();
  }, manifestHref);
  if (manifest.display !== 'standalone') fail(failures, `manifest display is ${manifest.display}`);
  else pass('manifest display=standalone');
  if (manifest.theme_color !== '#090d16') fail(failures, `theme_color is ${manifest.theme_color}`);
  else pass('manifest theme_color=#090d16');
}

async function run() {
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const failures = [];

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
      '--hide-scrollbars',
    ],
  });

  const page = await browser.newPage();
  page.setDefaultTimeout(20000);
  await applyIphoneStandalone(page);

  page.on('pageerror', (err) => fail(failures, `pageerror: ${err.message}`));

  await page.goto(BASE_URL, { waitUntil: 'networkidle0', timeout: 20000 });
  await injectSafeArea(page);
  await new Promise((r) => setTimeout(r, 900));

  await checkHtml(page, failures);
  await injectSafeArea(page);

  const layout = await measureLayout(page);
  if (layout.hasFullscreenToggle || layout.hasFrameToggle || layout.hasProBadge || layout.hasChassis) {
    fail(failures, `mock iPhone chrome still present: ${JSON.stringify({
      hasFullscreenToggle: layout.hasFullscreenToggle,
      hasFrameToggle: layout.hasFrameToggle,
      hasProBadge: layout.hasProBadge,
      hasChassis: layout.hasChassis,
    })}`);
  } else {
    pass('no mock iPhone frame / fullscreen toggle');
  }

  if (!layout.shell || layout.shell.top !== 0 || layout.shell.left !== 0) {
    fail(failures, `app-shell is not flush to origin: ${JSON.stringify(layout.shell)}`);
  } else if (Math.abs(layout.shell.width - IPHONE_17_PRO.width) > 1) {
    fail(failures, `app-shell width ${layout.shell.width} != ${IPHONE_17_PRO.width}`);
  } else {
    pass(`app-shell fills ${layout.shell.width}x${layout.shell.height}`);
  }

  if (layout.headerTop == null || layout.headerTop < SAFE_TOP) {
    fail(failures, `header content top ${layout.headerTop} overlaps ${SAFE_TOP}px status bar`);
  } else {
    pass(`header content top=${layout.headerTop.toFixed(1)} >= ${SAFE_TOP}`);
  }

  if (layout.dockBottom == null || layout.dockBottom > layout.maxDockBottom + 0.5) {
    fail(failures, `dock bottom ${layout.dockBottom} overlaps home indicator (max ${layout.maxDockBottom})`);
  } else {
    pass(`dock bottom=${layout.dockBottom.toFixed(1)} <= ${layout.maxDockBottom}`);
  }

  await injectOverlay(page);
  await page.screenshot({ path: path.join(OUT_DIR, '01-home-iphone-17-pro.png'), type: 'png' });

  const settingsOpened = await clickByTitle(page, 'Daily Target Settings');
  if (!settingsOpened) fail(failures, 'could not open settings');
  await new Promise((r) => setTimeout(r, 400));
  await injectOverlay(page);
  await page.screenshot({ path: path.join(OUT_DIR, '02-settings-iphone-17-pro.png'), type: 'png' });
  await clickByText(page, 'Save Target');
  await new Promise((r) => setTimeout(r, 300));

  const historyOpened = await clickByTitle(page, 'Drink History');
  if (!historyOpened) fail(failures, 'could not open history');
  await new Promise((r) => setTimeout(r, 400));
  await injectOverlay(page);
  await page.screenshot({ path: path.join(OUT_DIR, '03-history-iphone-17-pro.png'), type: 'png' });
  await clickByText(page, 'Load Sample Day');
  await new Promise((r) => setTimeout(r, 300));
  const closedHistory = await clickByText(page, 'Done');
  if (!closedHistory) {
    await page.evaluate(() => {
      const buttons = Array.from(document.querySelectorAll('button'));
      const close = buttons.find((b) => b.querySelector('svg') && b.closest('.safe-overlay'));
      close?.click();
    });
  }
  await new Promise((r) => setTimeout(r, 400));

  await clickByText(page, 'Tall Glass');
  await new Promise((r) => setTimeout(r, 700));
  await injectSafeArea(page);
  await injectOverlay(page);
  const pourLayout = await page.evaluate((safeTop, height, safeBottom) => {
    const header = document.querySelector('.absolute.inset-0.z-50 .safe-top') || document.querySelector('.safe-top');
    const footer = document.querySelector('.absolute.inset-0.z-50 .safe-bottom') || document.querySelectorAll('.safe-bottom')[1];
    const headerBox = header?.getBoundingClientRect();
    const footerBox = footer?.getBoundingClientRect();
    return {
      headerTop: headerBox ? headerBox.top : null,
      headerContentTop: headerBox ? headerBox.top : null,
      footerBottom: footerBox ? footerBox.bottom : null,
      maxBottom: height - safeBottom,
      safeTop,
    };
  }, SAFE_TOP, IPHONE_17_PRO.height, SAFE_BOTTOM);

  if (pourLayout.headerTop != null && pourLayout.headerTop < 0) {
    fail(failures, `pour header top ${pourLayout.headerTop} is off-screen`);
  }
  const pourFirst = await page.evaluate(() => {
    const el = document.querySelector('.absolute.inset-0.z-50 .safe-top > *');
    return el ? el.getBoundingClientRect().top : null;
  });
  if (pourFirst == null || pourFirst < SAFE_TOP) {
    fail(failures, `pour controls top ${pourFirst} overlaps status bar`);
  } else {
    pass(`pour controls top=${pourFirst.toFixed(1)} >= ${SAFE_TOP}`);
  }

  await page.screenshot({ path: path.join(OUT_DIR, '04-pour-iphone-17-pro.png'), type: 'png' });

  // Desktop check: still fullscreen, no chassis
  await page.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1, isMobile: false, hasTouch: false });
  await page.goto(BASE_URL, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 600));
  const desktop = await page.evaluate(() => {
    const badge = Array.from(document.querySelectorAll('span,button')).some((el) => {
      const t = (el.textContent || '').trim();
      return t === 'Fullscreen' || t === 'iPhone Frame' || t === 'iPhone 17 Pro';
    });
    const shell = document.querySelector('.app-shell')?.getBoundingClientRect();
    return { badge, width: shell?.width, height: shell?.height };
  });
  if (desktop.badge) fail(failures, 'desktop still shows mock iPhone chrome');
  else pass('desktop has no mock frame');
  if (!desktop.width || desktop.width < 1200) fail(failures, `desktop shell width ${desktop.width}`);
  else pass(`desktop shell width=${desktop.width}`);
  await page.screenshot({ path: path.join(OUT_DIR, '05-desktop-fullscreen.png'), type: 'png' });

  await browser.close();

  const summary = {
    ok: failures.length === 0,
    failures,
    layout,
    outDir: OUT_DIR,
  };
  fs.writeFileSync(path.join(OUT_DIR, 'results.json'), JSON.stringify(summary, null, 2));
  console.log(failures.length === 0 ? '\nALL CHECKS PASSED' : `\n${failures.length} CHECK(S) FAILED`);
  if (failures.length) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
