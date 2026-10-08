const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), http = require('http');
const assert = require('node:assert/strict');
const project = path.resolve(__dirname, '..');
const staleRequests = [], versions = new Set();
const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  const file = path.join(project, url.pathname === '/' ? 'index.html' : url.pathname);
  try {
    const script = file.endsWith('.js'), css = file.endsWith('.css');
    res.setHeader('Content-Type', script ? 'application/javascript' : css ? 'text/css' : 'text/html');
    // Simulate an existing browser cache containing incompatible old assets.
    // Correctly versioned requests bypass those entries.
    if ((script || css) && !url.searchParams.get('v')) {
      staleRequests.push(url.pathname);
      res.end(script ? 'throw new Error("Stale asset from an earlier release");' : 'canvas { visibility: hidden; }');
    } else {
      if (script || css) versions.add(url.searchParams.get('v'));
      res.end(fs.readFileSync(file));
    }
  } catch { res.writeHead(404); res.end(); }
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true,
    ...(process.env.NEWTON_CHROMIUM ? { executablePath: process.env.NEWTON_CHROMIUM } : {}),
    args: ['--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage'] });
  try {
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`http://127.0.0.1:${server.address().port}`);
    await page.waitForFunction(() => window.NewtonApp);
    const progressBefore = await page.evaluate(() => JSON.stringify(progress));
    const examples = await page.locator('#exampleSelect option').evaluateAll(options => options.map(o => o.value).filter(Boolean));
    assert.equal(examples.length, 15);
    for (const name of examples) {
      await page.locator('#exampleSelect').selectOption(name);
      await page.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve))));
      const loaded = await page.evaluate(() => ({
        count: scene.bodies.length, liveCount: sim.bodies.size,
        visible: [...sim.bodies.values()].filter(e => !['ground', 'terrain'].includes(e.spec.kind) && bodyVisible(e)).length,
        selected: !!selected, mode, time: sim.time
      }));
      assert.equal(loaded.mode, 'explore');
      assert.equal(loaded.time, 0);
      assert.equal(loaded.count, loaded.liveCount);
      assert.ok(name === 'empty' ? loaded.count === 0 : loaded.count > 0 && loaded.visible > 0 && loaded.selected, `${name} must be visible and inspectable`);
      assert.equal(await page.locator('#exampleSelect').inputValue(), '');
      await page.locator('#runButton').click();
      await page.waitForFunction(() => sim.time >= .05 && Number($('timeReadout').textContent) > 0);
      await page.locator('#runButton').click();
      assert.deepEqual(errors, [], name);
      console.log('PASS example loads, draws and runs:', name);
    }
    const tutorialIndices = await page.evaluate(() => tutorials.map((t, i) => t.scene ? i : null).filter(i => i !== null));
    for (const index of tutorialIndices) {
      await page.evaluate(index => showTutorial(index), index);
      await page.locator('#loadTutorial').click();
      assert.equal(await page.locator('#modal').evaluate(e => e.open), false);
      await page.locator('#runButton').click();
      await page.waitForFunction(() => sim.time >= .05 && Number($('timeReadout').textContent) > 0);
      await page.locator('#runButton').click();
      console.log('PASS tutorial example:', index);
    }
    assert.equal(await page.evaluate(() => JSON.stringify(progress)), progressBefore);
    assert.deepEqual(staleRequests, [], 'No old unversioned asset should be requested');
    assert.equal(versions.size, 1, 'All hosted assets should come from the same release');
    // The portable edition must still embed every asset and work offline.
    const offline = await browser.newPage();
    let requests = 0;
    offline.on('request', r => { if (/^https?:/.test(r.url())) requests++; });
    offline.on('pageerror', error => errors.push(error.message));
    await offline.goto('file://' + project + '/Newton_Studio_Standalone.html');
    await offline.waitForFunction(() => window.NewtonApp);
    await offline.locator('#exampleSelect').selectOption('catapult');
    await offline.locator('#runButton').click();
    await offline.waitForFunction(() => sim.time >= .05 && Number($('timeReadout').textContent) > 0);
    assert.equal(requests, 0);
    assert.deepEqual(errors, []);
    console.log('PASS stale-cache isolation, progress preservation and offline example');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => server.close());
