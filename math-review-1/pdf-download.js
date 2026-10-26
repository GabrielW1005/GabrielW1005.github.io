const completed = new Map();
const pending = new Map();
let manifestPromise;

async function getManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(new URL('downloads/manifest.json', import.meta.url), { cache: 'no-store' })
      .then(response => {
        if (!response.ok) throw new Error('The PDF list could not be loaded.');
        return response.json();
      }).catch(error => { manifestPromise = undefined; throw error; });
  }
  return manifestPromise;
}

/** Reassemble and verify the unchanged print PDF; cache only verified results. */
export async function preparePDF(key, onProgress = () => {}) {
  if (key !== 'packet' && key !== 'key') throw new Error('Choose the packet or answer key.');
  if (completed.has(key)) { onProgress(100); return completed.get(key); }
  if (pending.has(key)) return pending.get(key);
  const task = (async () => {
    onProgress(0);
    const manifest = await getManifest();
    const entry = manifest[key];
    if (!entry || !Array.isArray(entry.parts) || !entry.parts.length ||
        !Number.isSafeInteger(entry.bytes) || entry.bytes <= 0 ||
        !/^[a-f0-9]{64}$/i.test(entry.sha256) || !entry.filename?.endsWith('.pdf')) {
      throw new Error('The PDF download information is incomplete.');
    }
    const pieces = new Array(entry.parts.length);
    let next = 0, received = 0;
    const controller = new AbortController();
    const worker = async () => {
      while (next < entry.parts.length) {
        const i = next++;
        const url = new URL(entry.parts[i], import.meta.url);
        if (url.origin !== new URL(import.meta.url).origin) throw new Error('The PDF address is invalid.');
        const response = await fetch(url, { signal: controller.signal });
        if (!response.ok) throw new Error('Part of the PDF could not be loaded.');
        pieces[i] = new Uint8Array(await response.arrayBuffer());
        received += pieces[i].byteLength;
        if (received > entry.bytes) throw new Error('The PDF download size did not match.');
        onProgress(Math.min(98, Math.floor(98 * received / entry.bytes)));
      }
    };
    try {
      await Promise.all(Array.from({ length: Math.min(3, pieces.length) }, worker));
    } catch (error) { controller.abort(); throw error; }
    if (received !== entry.bytes) throw new Error('The PDF download is incomplete.');
    const bytes = new Uint8Array(received);
    let offset = 0;
    for (const piece of pieces) { bytes.set(piece, offset); offset += piece.length; }
    if (!globalThis.crypto?.subtle) throw new Error('Open this page using its secure HTTPS address and try again.');
    const hash = await crypto.subtle.digest('SHA-256', bytes);
    const sha256 = Array.from(new Uint8Array(hash), value => value.toString(16).padStart(2, '0')).join('');
    if (sha256 !== entry.sha256.toLowerCase()) throw new Error('The PDF could not be verified. Please try again.');
    const result = { objectURL: URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })), filename: entry.filename };
    completed.set(key, result);
    onProgress(100);
    return result;
  })();
  pending.set(key, task);
  try { return await task; } finally { pending.delete(key); }
}

function savePDF(result) {
  const link = document.createElement('a');
  link.href = result.objectURL;
  link.download = result.filename;
  link.hidden = true;
  document.body.append(link);
  link.click();
  link.remove();
}

for (const control of document.querySelectorAll('[data-pdf]')) {
  let busy = false;
  const status = control.querySelector('[data-pdf-status]') ||
    document.getElementById(control.getAttribute('aria-describedby'));
  control.addEventListener('click', async event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    if (busy) return;
    busy = true;
    control.setAttribute('aria-busy', 'true');
    control.setAttribute('aria-disabled', 'true');
    try {
      const result = await preparePDF(control.dataset.pdf, percentage => {
        if (status) status.textContent = percentage < 100 ? `Preparing PDF… ${percentage}%` : 'PDF ready.';
      });
      savePDF(result);
      if (status) status.textContent = 'Download started. Select again to download another copy.';
    } catch (error) {
      if (status) status.textContent = `${error.message || 'The download could not finish.'} Select again to retry.`;
    } finally {
      busy = false;
      control.removeAttribute('aria-busy');
      control.removeAttribute('aria-disabled');
    }
  });
}
