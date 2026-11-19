(() => {
  'use strict';

  const FORMAT = 'classroom-game-progress';
  const VERSION = 1;
  const MAX_SAVE_BYTES = 600_000;
  const MAX_LINK_LENGTH = 125_000;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });

  function toToken(bytes) {
    let binary = '';
    for (let offset = 0; offset < bytes.length; offset += 0x4000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x4000));
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
  }

  function fromToken(token) {
    if (!/^[A-Za-z0-9_-]+$/.test(token)) throw new Error('Invalid progress link.');
    const binary = atob(token.replace(/-/g, '+').replace(/_/g, '/'));
    return Uint8Array.from(binary, character => character.charCodeAt(0));
  }

  async function readLimited(stream, maximum) {
    const reader = stream.getReader();
    const chunks = [];
    let bytes = 0;
    try {
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        bytes += value.length;
        if (bytes > maximum) {
          await reader.cancel();
          throw new Error('The save is too large.');
        }
        chunks.push(value);
      }
    } finally {
      reader.releaseLock();
    }
    const result = new Uint8Array(bytes);
    let offset = 0;
    for (const chunk of chunks) {
      result.set(chunk, offset);
      offset += chunk.length;
    }
    return result;
  }

  async function makeLink(text) {
    const bytes = encoder.encode(text);
    let payload = `r.${toToken(bytes)}`;
    if (typeof CompressionStream === 'function') {
      const compressed = await readLimited(
        new Blob([bytes]).stream().pipeThrough(new CompressionStream('gzip')),
        MAX_SAVE_BYTES + 4096
      );
      const shorter = `g.${toToken(compressed)}`;
      if (shorter.length < payload.length) payload = shorter;
    }
    if (payload.length > MAX_LINK_LENGTH) {
      throw new Error('This save is too large for a link. Use Download save instead.');
    }
    const url = new URL(location.href);
    url.hash = `progress=${payload}`;
    return url.href;
  }

  async function readLink(hash) {
    const payload = hash.slice('#progress='.length);
    if (payload.length > MAX_LINK_LENGTH) throw new Error('The progress link is too large.');
    const encoding = payload.slice(0, 2);
    const bytes = fromToken(payload.slice(2));
    if (encoding === 'r.') return decoder.decode(bytes);
    if (encoding === 'g.' && typeof DecompressionStream === 'function') {
      const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));
      return decoder.decode(await readLimited(stream, MAX_SAVE_BYTES));
    }
    throw new Error('Open this progress link in a current version of Chrome.');
  }

  function installStyles() {
    if (document.getElementById('game-save-style')) return;
    const styles = document.createElement('style');
    styles.id = 'game-save-style';
    styles.textContent = `
      .gs-tools { display:inline-flex; gap:.36rem; align-items:center; flex-wrap:wrap; white-space:nowrap; }
      .gs-tools .gs-tool { min-height:2.4rem; min-width:2.4rem; border:1px solid #5b7190; border-radius:.48rem;
        background:#23334b; color:#f4f7ff; font:650 .81rem/1.2 system-ui,sans-serif; padding:.4rem .58rem; cursor:pointer; }
      .gs-tools .gs-tool:hover { background:#345074; }
      .gs-tools .gs-tool:focus-visible, .gs-dialog button:focus-visible, .gs-dialog textarea:focus-visible {
        outline:3px solid #9ff1d1; outline-offset:3px; }
      dialog.gs-dialog { width:min(30rem,calc(100% - 2rem)); max-height:calc(100vh - 2rem); max-height:calc(100dvh - 2rem);
        overflow:auto; margin:auto; padding:1.2rem; border:1px solid #5c7696; border-radius:.85rem;
        background:#182538; color:#f1f5fc; font:400 1rem/1.45 system-ui,sans-serif; box-shadow:0 20px 90px #0007; }
      .gs-dialog::backdrop { background:#08111dbb; }
      .gs-dialog .gs-heading { display:flex; align-items:center; justify-content:space-between; gap:1rem; margin-bottom:.65rem; }
      .gs-dialog .gs-heading h2 { margin:0; color:inherit; font:750 1.34rem/1.25 system-ui,sans-serif; }
      .gs-dialog .gs-note, .gs-dialog .gs-status { margin:.6rem 0; color:#d5e1f5; }
      .gs-dialog .gs-status { min-height:1.45rem; font-size:.88rem; }
      .gs-dialog .gs-options { display:flex; flex-wrap:wrap; gap:.45rem; margin:1rem 0; }
      .gs-dialog button { display:inline-block; min-height:2.55rem; border:1px solid #6983aa; border-radius:.42rem;
        background:#263e5e; color:#fff; font:650 .875rem/1.35 system-ui,sans-serif; padding:.45rem .66rem; cursor:pointer; }
      .gs-dialog button:hover { background:#35577e; }
      .gs-dialog button:disabled { opacity:.55; cursor:wait; }
      .gs-dialog .gs-close { min-width:2.55rem; padding:.3rem .5rem; font-size:1.15rem; }
      .gs-dialog .gs-link label { display:block; font-weight:650; margin-bottom:.35rem; }
      .gs-dialog .gs-link textarea { width:100%; background:#101b2c; color:#fff; border:1px solid #6983aa; padding:.48rem;
        font:.85rem/1.4 system-ui,sans-serif; resize:vertical; border-radius:.4rem; box-sizing:border-box; }
      .gs-dialog [hidden], .gs-banner[hidden] { display:none !important; }
      .gs-banner { position:fixed; inset:auto .75rem .75rem auto; z-index:90; max-width:min(28rem,calc(100vw - 1.5rem));
        padding:.55rem .78rem; border:1px solid #6983aa; border-radius:.45rem; background:#172539; color:#fff;
        font:650 .87rem/1.4 system-ui,sans-serif; pointer-events:none; }
      @media(max-width:550px) { .gs-tools .gs-tool { font-size:.73rem; min-height:2.25rem; padding:.32rem .43rem; } }
    `;
    document.head.append(styles);
  }

  function attach({ game, title, mount, snapshot, restore, onOpenChange }) {
    if (!mount || typeof snapshot !== 'function' || typeof restore !== 'function') {
      throw new Error('Progress controls require a mount, a snapshot function and a restore function.');
    }
    installStyles();
    const storageKey = `classroom-game-progress:${game}:v${VERSION}`;
    const buttonGroup = document.createElement('div');
    buttonGroup.className = 'gs-tools';
    buttonGroup.innerHTML = `
      <button class="gs-tool" data-fullscreen type="button" title="Open fullscreen" aria-pressed="false">Fullscreen</button>
      <button class="gs-tool" data-progress type="button" aria-haspopup="dialog" aria-controls="game-progress-dialog">Progress</button>`;
    mount.append(buttonGroup);

    const dialog = document.createElement('dialog');
    dialog.className = 'gs-dialog';
    dialog.id = 'game-progress-dialog';
    dialog.setAttribute('aria-labelledby', 'game-progress-title');
    dialog.innerHTML = `
      <div class="gs-heading">
        <h2 id="game-progress-title">Game progress</h2>
        <button class="gs-close" data-close type="button" aria-label="Close progress">×</button>
      </div>
      <p class="gs-note" data-autosave>Progress saves automatically on this device.</p>
      <div class="gs-options">
        <button data-copy type="button">Copy progress link</button>
        <button data-download type="button">Download save</button>
        <button data-open type="button">Open save file</button>
      </div>
      <div class="gs-link" data-link hidden>
        <label for="game-progress-link">Progress link</label>
        <textarea id="game-progress-link" rows="2" readonly spellcheck="false"></textarea>
      </div>
      <input data-file type="file" accept=".json,application/json" hidden>
      <p class="gs-status" data-status role="status" aria-live="polite"></p>`;
    document.body.append(dialog);

    const banner = document.createElement('div');
    banner.className = 'gs-banner';
    banner.setAttribute('role', 'status');
    banner.hidden = true;
    document.body.append(banner);

    const fullscreenButton = buttonGroup.querySelector('[data-fullscreen]');
    const progressButton = buttonGroup.querySelector('[data-progress]');
    const copyButton = dialog.querySelector('[data-copy]');
    const downloadButton = dialog.querySelector('[data-download]');
    const openButton = dialog.querySelector('[data-open]');
    const fileInput = dialog.querySelector('[data-file]');
    const linkField = dialog.querySelector('[data-link]');
    const linkInput = linkField.querySelector('textarea');
    const autosave = dialog.querySelector('[data-autosave]');
    const status = dialog.querySelector('[data-status]');
    let loading = true;
    let sharing = false;
    let lastState = null;
    let canStore = true;
    let bannerTimer;
    let hashAttempt = 0;

    function showBanner(message) {
      banner.textContent = message;
      banner.hidden = false;
      clearTimeout(bannerTimer);
      bannerTimer = setTimeout(() => { banner.hidden = true; }, 4100);
    }

    function capture() {
      const data = snapshot();
      if (!data || typeof data !== 'object') throw new Error('Start playing to create a save.');
      const state = JSON.stringify(data);
      const header = JSON.stringify({ format: FORMAT, version: VERSION, game, savedAt: Date.now() });
      const text = header.slice(0, -1) + ',"data":' + state + '}';
      if (encoder.encode(text).length > MAX_SAVE_BYTES) throw new Error('The save is too large.');
      return { state, text };
    }

    function saveNow() {
      if (loading) return false;
      let current;
      try {
        current = capture();
      } catch {
        return false;
      }
      if (lastState === current.state) return canStore;
      try {
        localStorage.setItem(storageKey, current.text);
        lastState = current.state;
        canStore = true;
        autosave.textContent = 'Progress saves automatically on this device.';
        return true;
      } catch {
        canStore = false;
        autosave.textContent = 'Automatic saving is unavailable here. You can still copy a progress link or download a save.';
        return false;
      }
    }

    function applyText(text) {
      if (encoder.encode(text).length > MAX_SAVE_BYTES) throw new Error('The save is too large.');
      let envelope;
      try {
        envelope = JSON.parse(text);
      } catch {
        throw new Error('This save file or progress link is damaged.');
      }
      if (envelope?.format !== FORMAT || envelope.version !== VERSION) {
        throw new Error('This is not a compatible game save.');
      }
      if (envelope.game !== game) throw new Error(`This save belongs to a different game. Open ${title} progress here.`);
      if (!envelope.data || typeof envelope.data !== 'object' || restore(envelope.data) !== true) {
        throw new Error('This save contains progress that the game could not read.');
      }
      lastState = null;
    }

    function restoreLocal() {
      let stored;
      try {
        stored = localStorage.getItem(storageKey);
        const probe = storageKey + ':probe';
        localStorage.setItem(probe, '1');
        localStorage.removeItem(probe);
      } catch {
        canStore = false;
        autosave.textContent = 'Automatic saving is unavailable here. You can still copy a progress link or download a save.';
      }
      if (!stored) return;
      try {
        applyText(stored);
        showBanner('Progress restored on this device.');
      } catch {
        showBanner('The latest automatic save could not be opened.');
      }
    }

    async function restoreHash(hash, fallback = false) {
      const attempt = ++hashAttempt;
      loading = true;
      try {
        const text = await readLink(hash);
        if (attempt !== hashAttempt) return;
        applyText(text);
        if (location.hash === hash) {
          const url = new URL(location.href);
          url.hash = '';
          history.replaceState(history.state, '', url.href);
        }
        showBanner('Progress restored from the link.');
      } catch (error) {
        if (attempt !== hashAttempt) return;
        if (fallback) restoreLocal();
        showBanner(error.message || 'The progress link could not be opened.');
      } finally {
        if (attempt === hashAttempt) {
          loading = false;
          saveNow();
        }
      }
    }

    function updateFullscreen() {
      const active = Boolean(document.fullscreenElement);
      fullscreenButton.textContent = active ? 'Exit fullscreen' : 'Fullscreen';
      fullscreenButton.title = active ? 'Exit fullscreen' : 'Open fullscreen';
      fullscreenButton.setAttribute('aria-pressed', String(active));
    }

    fullscreenButton.addEventListener('click', async () => {
      try {
        if (document.fullscreenElement) await document.exitFullscreen();
        else if (document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen();
        else throw new Error();
      } catch {
        showBanner('Fullscreen is unavailable here. Open the game directly in Chrome and try again.');
      }
    });
    document.addEventListener('fullscreenchange', updateFullscreen);
    updateFullscreen();

    progressButton.addEventListener('click', () => {
      saveNow();
      status.textContent = '';
      linkField.hidden = true;
      dialog.showModal();
      onOpenChange?.(true);
    });
    dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
    dialog.addEventListener('close', () => { onOpenChange?.(false); });
    copyButton.addEventListener('click', async () => {
      if (sharing || loading) return;
      sharing = true;
      copyButton.disabled = true;
      status.textContent = 'Creating progress link…';
      linkField.hidden = true;
      try {
        const link = await makeLink(capture().text);
        if (navigator.clipboard?.writeText) {
          try {
            await navigator.clipboard.writeText(link);
            status.textContent = 'Progress link copied. Open it to continue from this point.';
            return;
          } catch {
            // A selectable link also works when clipboard permissions are restricted.
          }
        }
        linkInput.value = link;
        linkField.hidden = false;
        linkInput.focus();
        linkInput.select();
        status.textContent = 'Copy the selected link to share or reopen it later.';
      } catch (error) {
        status.textContent = error.message;
      } finally {
        sharing = false;
        copyButton.disabled = false;
      }
    });

    downloadButton.addEventListener('click', () => {
      if (loading) return;
      try {
        const url = URL.createObjectURL(new Blob([capture().text], { type: 'application/json' }));
        const download = document.createElement('a');
        download.href = url;
        download.download = `${game}-progress.json`;
        document.body.append(download);
        download.click();
        download.remove();
        setTimeout(() => URL.revokeObjectURL(url), 2000);
        status.textContent = 'Save downloaded. Use Open save file to continue from it.';
      } catch (error) {
        status.textContent = error.message;
      }
    });
    openButton.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async () => {
      const file = fileInput.files[0];
      fileInput.value = '';
      if (!file || loading) return;
      loading = true;
      try {
        if (file.size > MAX_SAVE_BYTES) throw new Error('The save file is too large.');
        applyText(await file.text());
        status.textContent = 'Progress restored from the save file.';
        linkField.hidden = true;
      } catch (error) {
        status.textContent = error.message || 'The save file could not be opened.';
      } finally {
        loading = false;
        saveNow();
      }
    });

    const ready = (async () => {
      if (location.hash.startsWith('#progress=')) await restoreHash(location.hash, true);
      else {
        restoreLocal();
        loading = false;
        saveNow();
      }
    })();
    window.addEventListener('hashchange', () => {
      if (location.hash.startsWith('#progress=')) void restoreHash(location.hash);
    });
    window.addEventListener('pagehide', saveNow);
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') saveNow();
    });
    setInterval(saveNow, 3500);

    return { ready, saveNow, isOpen: () => dialog.open };
  }

  window.GameSave = Object.freeze({ attach });
})();
