/** Prepared only. This service is not registered, deployed, or used by the app. */
export const APP_ORIGIN = 'https://gabrielw1005.github.io';
export const MAX_TOKEN_LENGTH = 12000;
export const MAX_BODY_BYTES = MAX_TOKEN_LENGTH + 128;
export const LIMITS = Object.freeze({clientPerDay: 500, globalPerDay: 5000, total: 100000});
const encoder = new TextEncoder();
const ID = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const INSERT = `INSERT INTO progress_shares (id, token, client_hash, day, created_at)
  SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM progress_shares WHERE id = ?)
  RETURNING id`;

export function validId(id) { return typeof id === 'string' && ID.test(id); }

/** Validate the opaque wire envelope; the existing app validates decoded progress. */
export function validToken(token) {
  if (typeof token !== 'string' || token.length > MAX_TOKEN_LENGTH || !/^[cz]2\.[A-Za-z0-9_-]+$/.test(token)) return false;
  const body = token.slice(3), remainder = body.length % 4;
  return remainder !== 1 && (remainder !== 2 || /[AQgw]$/.test(body)) && (remainder !== 3 || /[AEIMQUYcgkosw048]$/.test(body));
}

class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

async function readBody(request) {
  if (request.headers.get('content-type')?.split(';')[0].trim().toLowerCase() !== 'application/json') throw new HttpError(415, 'Use application/json.');
  const length = request.headers.get('content-length');
  if (length !== null && (!/^\d+$/.test(length) || Number(length) > MAX_BODY_BYTES)) throw new HttpError(413, 'Progress is too large.');
  if (!request.body) throw new HttpError(400, 'A progress token is required.');
  const reader = request.body.getReader(), chunks = [];
  let size = 0;
  try {
    for (;;) {
      const {done, value} = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) throw new HttpError(413, 'Progress is too large.');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  let body;
  try { body = JSON.parse(new TextDecoder('utf-8', {fatal: true}).decode(bytes)); }
  catch { throw new HttpError(400, 'Invalid JSON.'); }
  if (!body || typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length !== 1 || !validToken(body.token)) throw new HttpError(400, 'Invalid progress token.');
  return body.token;
}

async function clientHash(request, env) {
  // Cloudflare sets cf and overwrites CF-Connecting-IP at the edge. No alternate
  // caller-controlled forwarding header, body field, or development bypass exists.
  const ip = request.headers.get('cf-connecting-ip');
  if (!request.cf || typeof request.cf !== 'object' || !ip || ip.length > 45 || !/^[0-9a-fA-F:.]+$/.test(ip) ||
      typeof env.CLIENT_HASH_KEY !== 'string' || encoder.encode(env.CLIENT_HASH_KEY).length < 32) {
    throw new HttpError(503, 'Progress sharing is not configured.');
  }
  const key = await crypto.subtle.importKey('raw', encoder.encode(env.CLIENT_HASH_KEY), {name: 'HMAC', hash: 'SHA-256'}, false, ['sign']);
  const digest = await crypto.subtle.sign('HMAC', key, encoder.encode(ip.toLowerCase()));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function reply(request, status, body, extra = {}) {
  const headers = {
    'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store',
    'x-content-type-options': 'nosniff', 'referrer-policy': 'no-referrer',
    'content-security-policy': "default-src 'none'", vary: 'Origin', ...extra,
  };
  if (request.headers.get('origin') === APP_ORIGIN) headers['access-control-allow-origin'] = APP_ORIGIN;
  return new Response(status === 204 ? null : JSON.stringify(body), {status, headers});
}

export default {
  async fetch(request, env) {
    try {
      const url = new URL(request.url), route = /^\/v1\/progress\/([^/]+)$/.exec(url.pathname);
      if (!route || !validId(route[1]) || url.search) return reply(request, 404, {error: 'Progress link not found.'});
      const id = route[1], origin = request.headers.get('origin');
      if (origin !== null && origin !== APP_ORIGIN) return reply(request, 403, {error: 'Origin is not allowed.'});
      if (request.method === 'OPTIONS') {
        const method = request.headers.get('access-control-request-method');
        const headers = (request.headers.get('access-control-request-headers') || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
        if (origin !== APP_ORIGIN || !['GET', 'PUT'].includes(method) || headers.some(h => h !== 'content-type')) return reply(request, 403, {error: 'Request is not allowed.'});
        return reply(request, 204, null, {'access-control-allow-methods': 'GET, PUT', 'access-control-allow-headers': 'Content-Type', 'access-control-max-age': '600'});
      }
      if (!['GET', 'PUT'].includes(request.method)) return reply(request, 405, {error: 'Method is not allowed.'}, {allow: 'GET, PUT, OPTIONS'});
      if (!env.DB) throw new HttpError(503, 'Progress sharing is not configured.');
      if (request.method === 'GET') {
        const row = await env.DB.prepare('SELECT token FROM progress_shares WHERE id = ?').bind(id).first();
        return row ? reply(request, 200, {token: row.token}) : reply(request, 404, {error: 'Progress link not found.'});
      }
      if (origin !== APP_ORIGIN) throw new HttpError(403, 'Origin is required.');
      const token = await readBody(request), hash = await clientHash(request, env);
      const now = Date.now(), day = Math.floor(now / 86400000);
      // The INSERT and schema triggers are one atomic SQLite write. Existing IDs
      // never fire insert/quota triggers, so safe retries work even at the cap.
      const result = await env.DB.prepare(INSERT).bind(id, token, hash, day, now, id).all();
      if (result.results.length) return reply(request, 201, {id});
      const existing = await env.DB.prepare('SELECT token FROM progress_shares WHERE id = ?').bind(id).first();
      return existing?.token === token ? reply(request, 200, {id}) : reply(request, 409, {error: 'This link already contains different progress.'});
    } catch (error) {
      if (error instanceof HttpError) return reply(request, error.status, {error: error.message});
      const message = String(error?.message || '');
      if (/SHARE_(CLIENT|GLOBAL)_LIMIT/.test(message)) {
        const seconds = Math.max(1, Math.ceil((Math.floor(Date.now() / 86400000) * 86400000 + 86400000 - Date.now()) / 1000));
        return reply(request, 429, {error: 'Sharing limit reached. Save a progress file or try again tomorrow.'}, {'retry-after': String(seconds)});
      }
      if (message.includes('SHARE_TOTAL_LIMIT')) return reply(request, 503, {error: 'Progress sharing is full. Save a progress file.'});
      // Do not log tokens, capabilities, names, IP addresses, or database errors.
      return reply(request, 503, {error: 'Progress sharing is temporarily unavailable.'});
    }
  },
};
