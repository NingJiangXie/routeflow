import { spawn } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { get } from 'node:http';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const APP_URL = process.env.ROUTEFLOW_URL || 'http://127.0.0.1:5173';
const OUT_DIR = resolve(ROOT, 'artifacts', 'visual-smoke');
const USER_DATA_DIR = resolve(ROOT, 'artifacts', '.edge-visual-profile');
const PORT = Number(process.env.ROUTEFLOW_CDP_PORT || 9327);

const browserPath = [
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe',
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
].find(existsSync);

if (!browserPath) {
  throw new Error('No Edge or Chrome executable found for visual smoke.');
}

mkdirSync(OUT_DIR, { recursive: true });
rmSync(USER_DATA_DIR, { recursive: true, force: true });
mkdirSync(USER_DATA_DIR, { recursive: true });

const browser = spawn(browserPath, [
  '--headless=new',
  '--disable-gpu',
  '--disable-dev-shm-usage',
  '--hide-scrollbars',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${USER_DATA_DIR}`,
  'about:blank',
], { stdio: 'ignore' });

try {
  const version = await waitForJson(`http://127.0.0.1:${PORT}/json/version`);
  const cdp = await connectCdp(version.webSocketDebuggerUrl);
  const { targetId } = await cdp.send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await cdp.send('Target.attachToTarget', { targetId, flatten: true });

  await cdp.send('Page.enable', {}, sessionId);
  await cdp.send('Runtime.enable', {}, sessionId);

  const desktop2d = await captureView(cdp, sessionId, {
    name: 'desktop-2d',
    width: 1440,
    height: 980,
    mobile: false,
    switch3d: false,
  });
  const toggles = await verifyToggles(cdp, sessionId);
  const desktop3d = await captureView(cdp, sessionId, {
    name: 'desktop-3d',
    width: 1440,
    height: 980,
    mobile: false,
    switch3d: true,
  });
  const mobile3d = await captureView(cdp, sessionId, {
    name: 'mobile-3d',
    width: 390,
    height: 844,
    mobile: true,
    switch3d: true,
  });

  await cdp.close();
  console.log(JSON.stringify({ ok: true, desktop2d, toggles, desktop3d, mobile3d }, null, 2));
} finally {
  browser.kill();
}

async function captureView(cdp, sessionId, view) {
  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: view.width,
    height: view.height,
    deviceScaleFactor: view.mobile ? 2 : 1,
    mobile: view.mobile,
  }, sessionId);
  await cdp.send('Page.navigate', { url: APP_URL }, sessionId);
  await waitForReady(cdp, sessionId);

  if (view.switch3d) {
    await cdp.send('Runtime.evaluate', {
      expression: "document.querySelector('.view-toggle button:nth-child(2)')?.click()",
    }, sessionId);
    await sleep(2800);
  }

  const layout = await evaluate(cdp, sessionId, `(() => {
    const canvasWrap = document.querySelector('.canvas-wrap')?.getBoundingClientRect();
    const webgl = document.querySelector('.simulation-3d-canvas');
    const appShell = document.querySelector('.app-shell')?.getBoundingClientRect();
    return {
      title: document.title,
      body: { width: document.body.scrollWidth, height: document.body.scrollHeight },
      viewport: { width: innerWidth, height: innerHeight },
      canvasWrap: canvasWrap ? { width: canvasWrap.width, height: canvasWrap.height, top: canvasWrap.top } : null,
      webgl: webgl ? { width: webgl.width, height: webgl.height, className: webgl.className } : null,
      appShell: appShell ? { width: appShell.width, height: appShell.height } : null,
      horizontalOverflow: document.body.scrollWidth > innerWidth + 2,
    };
  })()`);

  if (!layout.canvasWrap || layout.canvasWrap.width < 250 || layout.canvasWrap.height < 250) {
    throw new Error(`${view.name}: canvas area is too small or missing.`);
  }
  if (layout.horizontalOverflow) {
    throw new Error(`${view.name}: page has horizontal overflow.`);
  }
  if (view.switch3d && (!layout.webgl || layout.webgl.width < 200 || layout.webgl.height < 200)) {
    throw new Error(`${view.name}: 3D canvas did not render with usable dimensions.`);
  }

  const screenshot = await cdp.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: false }, sessionId);
  const file = join(OUT_DIR, `${view.name}.png`);
  const bytes = Buffer.from(screenshot.data, 'base64');
  writeFileSync(file, bytes);
  if (bytes.length < 20_000) {
    throw new Error(`${view.name}: screenshot is unexpectedly small.`);
  }

  const pixelProbe = view.switch3d ? await evaluate(cdp, sessionId, `(() => {
    const canvas = document.querySelector('.simulation-3d-canvas');
    const gl = canvas?.getContext('webgl2') || canvas?.getContext('webgl');
    if (!canvas || !gl) return { available: false };
    const points = [[0.5, 0.5], [0.42, 0.48], [0.58, 0.52], [0.5, 0.62]];
    const pixels = new Uint8Array(4);
    let nonZero = 0;
    const samples = [];
    for (const [x, y] of points) {
      gl.readPixels(Math.floor(canvas.width * x), Math.floor(canvas.height * y), 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
      const sample = Array.from(pixels);
      samples.push(sample);
      if (sample.some(value => value > 8)) nonZero += 1;
    }
    return { available: true, nonZero, samples };
  })()`) : null;

  return { file, bytes: bytes.length, layout, pixelProbe };
}

async function verifyToggles(cdp, sessionId) {
  const result = await evaluate(cdp, sessionId, `(() => {
    const buttons = [...document.querySelectorAll('.command-switch button')];
    const dark = buttons.find(button => /深色|Dark/.test(button.textContent));
    const en = buttons.find(button => /EN/.test(button.textContent));
    dark?.click();
    en?.click();
    return new Promise(resolve => requestAnimationFrame(() => {
      resolve({
        theme: document.documentElement.dataset.theme,
        lang: document.documentElement.lang,
        nav: [...document.querySelectorAll('.nav-tabs button')].map(button => button.textContent.trim()),
        switches: buttons.map(button => ({ text: button.textContent.trim(), active: button.classList.contains('active') })),
      });
    }));
  })()`, true);

  if (result.theme !== 'dark') throw new Error('Theme switch did not set dark mode.');
  if (result.lang !== 'en') throw new Error('Language switch did not set English lang.');
  if (!result.nav.includes('Plan')) throw new Error('English navigation label was not rendered.');
  return result;
}

async function waitForReady(cdp, sessionId) {
  await evaluate(cdp, sessionId, `new Promise(resolve => {
    if (document.readyState === 'complete') resolve(true);
    else addEventListener('load', () => resolve(true), { once: true });
  })`, true);
  await evaluate(cdp, sessionId, 'document.fonts?.ready || true', true);
  await sleep(900);
}

async function evaluate(cdp, sessionId, expression, awaitPromise = false) {
  const result = await cdp.send('Runtime.evaluate', {
    expression,
    awaitPromise,
    returnByValue: true,
  }, sessionId);
  if (result.exceptionDetails) {
    throw new Error(result.exceptionDetails.text || 'Runtime evaluation failed.');
  }
  return result.result?.value;
}

function waitForJson(url, attempts = 80) {
  return new Promise((resolvePromise, reject) => {
    const attempt = remaining => {
      get(url, response => {
        let body = '';
        response.on('data', chunk => { body += chunk; });
        response.on('end', () => {
          try {
            resolvePromise(JSON.parse(body));
          } catch (error) {
            if (remaining <= 0) reject(error);
            else setTimeout(() => attempt(remaining - 1), 125);
          }
        });
      }).on('error', error => {
        if (remaining <= 0) reject(error);
        else setTimeout(() => attempt(remaining - 1), 125);
      });
    };
    attempt(attempts);
  });
}

function connectCdp(webSocketUrl) {
  const socket = new WebSocket(webSocketUrl);
  let id = 0;
  const pending = new Map();

  socket.addEventListener('message', event => {
    const message = JSON.parse(event.data);
    if (!message.id || !pending.has(message.id)) return;
    const { resolvePromise, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(message.error.message));
    else resolvePromise(message.result || {});
  });

  const ready = new Promise((resolvePromise, reject) => {
    socket.addEventListener('open', resolvePromise, { once: true });
    socket.addEventListener('error', reject, { once: true });
  });

  return {
    async send(method, params = {}, sessionId) {
      await ready;
      const messageId = ++id;
      const payload = { id: messageId, method, params };
      if (sessionId) payload.sessionId = sessionId;
      socket.send(JSON.stringify(payload));
      return new Promise((resolvePromise, reject) => {
        pending.set(messageId, { resolvePromise, reject });
      });
    },
    async close() {
      await ready;
      socket.close();
    },
  };
}

function sleep(ms) {
  return new Promise(resolvePromise => setTimeout(resolvePromise, ms));
}
