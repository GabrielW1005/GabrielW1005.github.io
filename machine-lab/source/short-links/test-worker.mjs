import test from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync} from 'node:fs';
import {randomBytes} from 'node:crypto';
import worker, {APP_ORIGIN, LIMITS, MAX_BODY_BYTES, MAX_TOKEN_LENGTH, validId, validToken} from './worker.mjs';

const migration = readFileSync(new URL('./migrations/0000_progress_shares.sql', import.meta.url), 'utf8');
const newId = () => randomBytes(16).toString('base64url');
const token = 'z2.' + Buffer.from('opaque compressed progress').toString('base64url');
const secondToken = 'c2.' + Buffer.from('[1,"a different saved snapshot"]').toString('base64url');
const origin = 'https://progress.example';
function fixture(t) {
  const db = new DatabaseSync(':memory:'); db.exec(migration); t.after(() => db.close());
  const env = {CLIENT_HASH_KEY: 'test-only-server-key-at-least-32-bytes', DB: {
    prepare(sql) { return {bind(...values) { return {
      async all() { await Promise.resolve(); return {results: db.prepare(sql).all(...values)}; },
      async first() { await Promise.resolve(); return db.prepare(sql).get(...values) || null; },
    }; }}; },
  }};
  function request(id = newId(), {method = 'PUT', value = token, ip = '203.0.113.1', trusted = true, originHeader = APP_ORIGIN, headers = {}, body, path} = {}) {
    const h = {...(originHeader === null ? {} : {origin: originHeader}), ...(ip === null ? {} : {'cf-connecting-ip': ip}), ...headers};
    if (method === 'PUT' && !h['content-type']) h['content-type'] = 'application/json';
    const req = new Request(origin + (path || `/v1/progress/${id}`), {method, headers: h, ...(method === 'PUT' ? {body: body ?? JSON.stringify({token: value})} : {})});
    if (trusted) Object.defineProperty(req, 'cf', {value: {colo: 'TST'}});
    return req;
  }
  return {db, env, request, fetch: (id, options) => worker.fetch(request(id, options), env)};
}
const day = () => Math.floor(Date.now() / 86400000);
function setUsage(db, scope, amount, bucket = day()) {
  db.prepare('INSERT INTO share_usage (scope, day, used) VALUES (?, ?, ?) ON CONFLICT (scope, day) DO UPDATE SET used = excluded.used').run(scope, bucket, amount);
}

test('create/read/retry is lossless and immutable; records and IDs do not expire', async t => {
  const f = fixture(t), id = newId();
  const created = await f.fetch(id); assert.equal(created.status, 201); assert.deepEqual(await created.json(), {id});
  const read = await f.fetch(id, {method: 'GET'}); assert.equal(read.status, 200); assert.deepEqual(await read.json(), {token});
  assert.equal(read.headers.get('cache-control'), 'no-store');
  assert.equal((await f.fetch(id)).status, 200);
  assert.equal((await f.fetch(id, {value: secondToken})).status, 409);
  assert.deepEqual(await (await f.fetch(id, {method: 'GET'})).json(), {token});
  assert.equal(f.db.prepare('SELECT used FROM share_usage WHERE scope = ? AND day = -1').get('all').used, 1);
  assert.throws(() => f.db.prepare('UPDATE progress_shares SET token = ? WHERE id = ?').run(secondToken, id), /SHARE_IMMUTABLE/);
});

test('a database administrator can remove an accidentally shared snapshot without weakening public quotas', async t => {
  const f = fixture(t), id = newId(); await f.fetch(id);
  f.db.prepare('DELETE FROM progress_shares WHERE id = ?').run(id);
  assert.equal((await f.fetch(id, {method: 'GET'})).status, 404);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'all'").get().used, 1);
  assert.equal((await f.fetch(id, {method: 'DELETE'})).status, 405);
});

test('concurrent identical retries create exactly one record and consume one quota unit', async t => {
  const f = fixture(t), id = newId();
  const results = await Promise.all(Array.from({length: 25}, () => f.fetch(id)));
  assert.equal(results.filter(r => r.status === 201).length, 1);
  assert.equal(results.filter(r => r.status === 200).length, 24);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM progress_shares').get().n, 1);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'global'").get().used, 1);
});

test('competing payloads cannot overwrite each other', async t => {
  const f = fixture(t), id = newId();
  const results = await Promise.all([f.fetch(id), f.fetch(id, {value: secondToken})]);
  assert.deepEqual(results.map(r => r.status).sort(), [201, 409]);
  const row = f.db.prepare('SELECT token FROM progress_shares WHERE id = ?').get(id);
  assert.equal(row.token, results[0].status === 201 ? token : secondToken);
});

test('per-client quota is atomic across concurrent requests and retries remain possible at cap', async t => {
  const f = fixture(t), oldId = newId(); await f.fetch(oldId);
  const hash = f.db.prepare('SELECT client_hash FROM progress_shares').get().client_hash;
  setUsage(f.db, hash, LIMITS.clientPerDay - 3);
  const responses = await Promise.all(Array.from({length: 20}, () => f.fetch(newId())));
  assert.equal(responses.filter(r => r.status === 201).length, 3);
  assert.equal(responses.filter(r => r.status === 429).length, 17);
  assert.equal(f.db.prepare('SELECT used FROM share_usage WHERE scope = ?').get(hash).used, LIMITS.clientPerDay);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'global'").get().used, 4);
  assert.equal((await f.fetch(oldId)).status, 200);
  assert.equal((await f.fetch(newId(), {ip: '203.0.113.2'})).status, 201);
  assert.ok(Number(responses.find(r => r.status === 429).headers.get('retry-after')) > 0);
});

test('global quota is atomic across different clients; rejected inserts do not use client quota', async t => {
  const f = fixture(t); setUsage(f.db, 'global', LIMITS.globalPerDay - 4);
  const responses = await Promise.all(Array.from({length: 20}, (_, i) => f.fetch(newId(), {ip: `203.0.113.${i + 1}`})));
  assert.equal(responses.filter(r => r.status === 201).length, 4);
  assert.equal(responses.filter(r => r.status === 429).length, 16);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'global'").get().used, LIMITS.globalPerDay);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM progress_shares').get().n, 4);
  assert.equal(f.db.prepare("SELECT count(*) AS n FROM share_usage WHERE length(scope) = 64").get().n, 4);
});

test('lifetime storage cap is atomic and never silently deletes snapshots', async t => {
  const f = fixture(t), id = newId(); await f.fetch(id); setUsage(f.db, 'all', LIMITS.total - 2, -1);
  const responses = await Promise.all(Array.from({length: 10}, () => f.fetch(newId())));
  assert.equal(responses.filter(r => r.status === 201).length, 2);
  assert.equal(responses.filter(r => r.status === 503).length, 8);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'all'").get().used, LIMITS.total);
  assert.equal((await f.fetch(id)).status, 200); assert.equal((await f.fetch(id, {method: 'GET'})).status, 200);
});

test('quota windows reset daily without expiring prior snapshots', async t => {
  const f = fixture(t); setUsage(f.db, 'global', LIMITS.globalPerDay, day() - 1);
  assert.equal((await f.fetch()).status, 201);
  assert.equal(f.db.prepare("SELECT used FROM share_usage WHERE scope = 'global' AND day = ?").get(day() - 1).used, LIMITS.globalPerDay);
});

test('only canonical 128-bit identifiers and bounded v2 wire envelopes are accepted', () => {
  for (let i = 0; i < 100; i++) assert.equal(validId(newId()), true);
  for (const id of ['', 'a'.repeat(22), 'A'.repeat(21), 'A'.repeat(23), 'A'.repeat(21) + '=']) assert.equal(validId(id), false);
  assert.equal(validToken('c2.AA'), true); assert.equal(validToken('z2.AAA'), true);
  for (const value of [null, '', 'https://example.com', 'c1.AA', 'c2.A', 'c2.AB', 'z2.AAB', 'z2.AA=', 'c2.AA/', 'c2.' + 'A'.repeat(MAX_TOKEN_LENGTH)]) assert.equal(validToken(value), false);
  assert.equal(validToken('c2.' + 'A'.repeat(MAX_TOKEN_LENGTH - 4)), true);
});

test('CORS permits only the app origin and methods; requests never redirect', async t => {
  const f = fixture(t), id = newId();
  const allowed = await f.fetch(id, {method: 'OPTIONS', headers: {'access-control-request-method': 'PUT', 'access-control-request-headers': 'content-type'}});
  assert.equal(allowed.status, 204); assert.equal(allowed.headers.get('access-control-allow-origin'), APP_ORIGIN);
  for (const options of [
    {originHeader: 'https://evil.example'}, {originHeader: null},
    {method: 'OPTIONS', headers: {'access-control-request-method': 'DELETE'}},
    {method: 'OPTIONS', headers: {'access-control-request-method': 'PUT', 'access-control-request-headers': 'authorization'}},
  ]) { const r = await f.fetch(id, options); assert.equal(r.status, 403); assert.equal(r.headers.get('location'), null); }
  assert.equal((await f.fetch(id, {method: 'DELETE'})).status, 405);
  assert.equal((await f.fetch(id, {method: 'GET', originHeader: 'null'})).status, 403);
  assert.equal((await f.fetch(id, {method: 'GET', originHeader: null})).status, 404);
});

test('there are no listing, replace, or redirect endpoints', async t => {
  const f = fixture(t);
  for (const path of ['/v1/progress', '/v1/progress/', '/admin', '/https://example.com', `/v1/progress/${newId()}?url=https://example.com`, '/v1/progress/%2e%2e']) {
    const r = await f.fetch(null, {method: 'GET', path}); assert.equal(r.status, 404); assert.equal(r.headers.get('location'), null);
  }
});

test('body limits, grammar, content type, and UTF-8 fail before any writes', async t => {
  const f = fixture(t);
  for (const [body, status, headers = {}] of [
    ['{', 400], ['{}', 400], [JSON.stringify({token, student: 'Do not store extra fields'}), 400],
    [JSON.stringify({token: 'javascript:alert(1)'}), 400], ['x'.repeat(MAX_BODY_BYTES + 1), 413],
    [JSON.stringify({token}), 415, {'content-type': 'text/plain'}],
    [JSON.stringify({token}), 413, {'content-length': String(MAX_BODY_BYTES + 1)}],
    [new Uint8Array([0xff, 0xfe]), 400],
  ]) assert.equal((await f.fetch(newId(), {body, headers})).status, status);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM progress_shares').get().n, 0);
});

test('creation fails closed without trusted edge metadata or server secret', async t => {
  const f = fixture(t);
  for (const options of [{trusted: false}, {ip: null}, {ip: 'bad-ip'}, {ip: null, headers: {'x-forwarded-for': '203.0.113.1'}}]) assert.equal((await f.fetch(newId(), options)).status, 503);
  f.env.CLIENT_HASH_KEY = 'short'; assert.equal((await f.fetch()).status, 503);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM progress_shares').get().n, 0);
});

test('only keyed hashes are stored; caller forwarding headers cannot evade quota', async t => {
  const f = fixture(t); await f.fetch();
  const row = f.db.prepare('SELECT * FROM progress_shares').get(); assert.match(row.client_hash, /^[a-f0-9]{64}$/);
  assert.equal(JSON.stringify(row).includes('203.0.113.1'), false);
  setUsage(f.db, row.client_hash, LIMITS.clientPerDay);
  assert.equal((await f.fetch(newId(), {headers: {'x-forwarded-for': '198.51.100.8', 'x-real-ip': '198.51.100.9'}})).status, 429);
  assert.equal((await f.fetch(newId(), {ip: '2001:db8::1'})).status, 201);
});

test('database failures return a generic error without leaking saved data or secrets', async t => {
  const f = fixture(t); f.env.DB.prepare = () => { throw new Error(`SECRET:${token}`); };
  const r = await f.fetch(newId(), {method: 'GET'}); assert.equal(r.status, 503);
  assert.deepEqual(await r.json(), {error: 'Progress sharing is temporarily unavailable.'});
});
