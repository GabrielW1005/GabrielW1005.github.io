/** Prepared integration. Not loaded by the live app until service access is approved. */
const ID = /^[A-Za-z0-9_-]{21}[AQgw]$/;
const TOKEN = /^(?:c2|z2)\.[A-Za-z0-9_-]+$/;
export const MAX_TOKEN = 12000;
export const APP_URL = 'https://gabrielw1005.github.io/machine-lab/';

export function newShareId(random = globalThis.crypto) {
  const bytes = random.getRandomValues(new Uint8Array(16));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function validateToken(token) {
  if (typeof token !== 'string' || token.length > MAX_TOKEN || !TOKEN.test(token)) {
    throw new Error('This saved progress cannot be shared. Download a progress file instead.');
  }
  return token;
}

function endpoint(origin, id) {
  const url = new URL(origin);
  if (url.protocol !== 'https:' || url.username || url.password || url.pathname !== '/' || url.search || url.hash || !ID.test(id)) {
    throw new Error('Progress sharing is not configured correctly.');
  }
  return new URL('/v1/progress/' + id, url).href;
}

async function boundedJson(response) {
  if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/json')) throw new Error('The progress service returned an unreadable response.');
  const reader = response.body?.getReader();
  if (!reader) throw new Error('The progress service returned an empty response.');
  const chunks = []; let total = 0;
  try {
    while (true) {
      const {done, value} = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > MAX_TOKEN + 1024) throw new Error('The saved progress is too large.');
      chunks.push(value);
    }
  } catch (error) { await reader.cancel().catch(() => {}); throw error; }
  finally { reader.releaseLock(); }
  const bytes = new Uint8Array(total); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return JSON.parse(new TextDecoder('utf-8', {fatal:true}).decode(bytes));
}

async function request(origin, id, method, token, {fetcher = globalThis.fetch, timeoutMs = 12000, signal} = {}) {
  const url = endpoint(origin, id);
  if (signal?.aborted) throw signal.reason || new DOMException('Request cancelled.', 'AbortError');
  const controller = new AbortController();
  const cancel = () => controller.abort(signal.reason);
  signal?.addEventListener('abort', cancel, {once:true});
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetcher(url, {
      method, signal:controller.signal, credentials:'omit', redirect:'error', cache:'no-store',
      referrerPolicy:'no-referrer', headers:method === 'PUT' ? {'Content-Type':'application/json'} : {},
      ...(method === 'PUT' ? {body:JSON.stringify({token:validateToken(token)})} : {})
    });
    if (response.status === 404) throw new Error('This progress link was not found. Your saved work is unchanged.');
    if (response.status === 429) throw new Error('The sharing limit was reached. Try again later, or download a progress file.');
    if (!response.ok) throw new Error('Progress sharing is unavailable. Try again, or download a progress file.');
    const data = await boundedJson(response);
    if (method === 'GET') return validateToken(data.token);
    if (data.id !== id) throw new Error('The progress service could not verify this link.');
    return id;
  } finally { clearTimeout(timer); signal?.removeEventListener('abort', cancel); }
}

/** Retain id for retries of the same immutable snapshot; never overwrite a previous share. */
export function saveShortProgress(origin, id, token, options) { return request(origin, id, 'PUT', token, options); }
export function loadShortProgress(origin, id, options) { return request(origin, id, 'GET', undefined, options); }
export function shortProgressLink(id) {
  if (!ID.test(id)) throw new Error('Invalid progress code.');
  // Refresh old HTML/app modules that do not yet understand the short-link key.
  const url = new URL(APP_URL); url.search = '?v=s3'; url.hash = 's=' + id;
  return url.href;
}
