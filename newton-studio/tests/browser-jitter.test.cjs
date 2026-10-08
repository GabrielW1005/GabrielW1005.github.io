const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..');
const server = http.createServer((req, res) => {
  try {
    const file = path.join(project, req.url.split('?')[0] === '/' ? 'index.html' : req.url.split('?')[0]);
    res.setHeader('Content-Type', file.endsWith('.js') ? 'application/javascript' : file.endsWith('.css') ? 'text/css' : 'text/html');
    res.end(fs.readFileSync(file));
  } catch { res.writeHead(404); res.end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.NEWTON_CHROMIUM ? { executablePath: process.env.NEWTON_CHROMIUM } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage']
  });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => window.NewtonApp);
    for (const velocity of [{ vx: 80, vy: 0 }, { vx: 0, vy: 80 }, { vx: -120, vy: -80 }]) {
      await page.evaluate(velocity => {
        scene = N.empty(); scene.gravity = 0;
        const b = N.body('rectangle', 0, 3, { ...velocity, w: 1, h: 1 });
        scene.bodies = [b]; selected = trackedId = b.id; changed();
        camera = { x: 0, y: 3, scale: 55 };
        $('followToggle').checked = true;
      }, velocity);
      await page.locator('#runButton').click();
      const result = await page.evaluate(() => new Promise(resolve => {
        const rows = [];
        function sample() {
          const e = sim.bodies.get(trackedId), p = e.renderPosition || e.body.getPosition();
          rows.push({ ...screenPoint(p.x, p.y), t: sim.time });
          if (rows.length < 100) requestAnimationFrame(sample);
          else {
            const values = rows.slice(10);
            resolve({
              rangeX: Math.max(...values.map(p => p.x)) - Math.min(...values.map(p => p.x)),
              rangeY: Math.max(...values.map(p => p.y)) - Math.min(...values.map(p => p.y)),
              elapsed: values.at(-1).t - values[0].t
            });
          }
        }
        requestAnimationFrame(sample);
      }));
      assert.ok(result.elapsed > .5, 'Physics must advance during the measurement');
      assert.ok(result.rangeX < 1e-6 && result.rangeY < 1e-6, `Follow must remain steady: ${JSON.stringify(result)}`);
      await page.locator('#runButton').click();
      console.log('PASS steady camera follow', velocity, result);
    }
    // Let the final running-to-paused frame synchronize once, then pan freely.
    const pan = await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => {
      camera.x += 3; camera.y += 2;
      const expected = { x: camera.x, y: camera.y };
      requestAnimationFrame(() => requestAnimationFrame(() => resolve({ expected, actual: { x: camera.x, y: camera.y } })));
    })));
    assert.deepEqual(pan.actual, pan.expected, 'Follow must not override paused camera panning');
    assert.deepEqual(errors, []);
    console.log('PASS paused panning and no browser errors');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
