const STORAGE_KEY = 'study-for-test-1-v2';
const LEGACY_STORAGE_KEY = 'study-for-test-1-v1';
const REVISED_PROBLEM_IDS = new Set([2,3,4,14,15,16,26,27,29,30,31,32,33,67,68,69,70]);
const app = document.querySelector('#app');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const prose = value => escapeHTML(value).replace(/\n/g,'<br>');
let data, problems = [], interactiveModule, cleanupInteractive;
let solutions = false;
let hintOpen = false;
let saveTimer, toastTimer;
let presentationMode = null, presentationReturnFocus = null;
let migratedProgress = false;
const initial = {view:'lesson',question:1,page:0,variants:{},answers:{},plots:{},lines:{},checked:{},plotChecked:{},theme:'light'};
let state = {...initial};
function migrateProgress(previous) {
  const migrated = {...previous};
  for (const key of ['variants','answers','plots','lines','checked','plotChecked']) {
    migrated[key] = Object.fromEntries(Object.entries(previous[key] || {}).filter(([entry])=>!REVISED_PROBLEM_IDS.has(Number(entry.split(':')[0]))));
  }
  return migrated;
}
try {
  const saved = localStorage.getItem(STORAGE_KEY);
  const legacy = saved === null ? localStorage.getItem(LEGACY_STORAGE_KEY) : null;
  state = {...initial,...(legacy ? migrateProgress(JSON.parse(legacy)) : JSON.parse(saved || '{}'))};
  if (legacy) { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); migratedProgress = true; }
} catch { /* Storage is optional. */ }
for (const key of ['variants','answers','plots','lines','checked','plotChecked']) if (!state[key] || typeof state[key] !== 'object') state[key] = {};
if (!['lesson','packet','practice'].includes(state.view)) state.view = 'lesson';
if (!['light','dark'].includes(state.theme)) state.theme = 'light';
document.body.classList.toggle('dark',state.theme === 'dark');

function notify(message) {
  const toast = document.querySelector('#toast');
  toast.textContent = message; toast.classList.add('visible');
  clearTimeout(toastTimer); toastTimer = setTimeout(()=>toast.classList.remove('visible'),2600);
}
function applyPresentation() {
  const stage = document.querySelector('#visual-stage');
  if (presentationMode === 'visual' && !stage) presentationMode = null;
  document.body.classList.toggle('presentation-mode',presentationMode === 'page');
  document.body.classList.toggle('visual-focus-open',presentationMode === 'visual');
  document.querySelector('#focus-close')?.remove();
  document.querySelector('#focus-backdrop')?.remove();
  if (stage) {
    stage.classList.toggle('is-enlarged',presentationMode === 'visual');
    if (presentationMode === 'visual') { stage.setAttribute('role','dialog'); stage.setAttribute('aria-modal','true'); stage.setAttribute('aria-label','Enlarged visualization'); }
    else { stage.removeAttribute('role'); stage.removeAttribute('aria-modal'); stage.removeAttribute('aria-label'); }
  }
  if (!presentationMode) return;
  if (presentationMode === 'visual') {
    const backdrop = document.createElement('div'); backdrop.id = 'focus-backdrop'; backdrop.setAttribute('aria-hidden','true');
    backdrop.addEventListener('click',closePresentation); document.body.append(backdrop);
  }
  const close = document.createElement('button'); close.id = 'focus-close'; close.type = 'button';
  close.textContent = presentationMode === 'visual' ? 'Close visualization ×' : 'Exit presentation ×';
  close.addEventListener('click',closePresentation); document.body.append(close);
}
function openPresentation(mode) {
  presentationReturnFocus = document.activeElement; presentationMode = mode; applyPresentation();
  document.querySelector('#focus-close')?.focus();
}
function closePresentation() {
  presentationMode = null; applyPresentation();
  if (presentationReturnFocus?.isConnected) presentationReturnFocus.focus();
  presentationReturnFocus = null;
}
function persist() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(()=> {
    try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); updateSavedStatus(); }
    catch { document.querySelector('#save-status').textContent = 'This browser cannot save answers. Keep this tab open.'; }
  },150);
}
function updateSavedStatus() {
  const count = Object.values(state.answers).filter(value=>String(value).trim()).length;
  document.querySelector('#save-status').textContent = count ? `${count} ${count === 1 ? 'answer' : 'answers'} saved on this browser.` : 'Answers stay on this browser.';
}
function original(id = state.question) { return problems.find(p=>Number(p.id) === Number(id)) || problems[0]; }
function variantIndex(id = state.question) {
  const p = original(id); const v = Number(state.variants[id] || 0);
  return p && v >= 0 && v <= (p.variants || []).length ? v : 0;
}
function current(id = state.question) {
  const p = original(id); const v = variantIndex(id);
  return v ? {...p,...p.variants[v-1],id:p.id} : p;
}
function keyFor(id,field='') { return `${id}:${variantIndex(id)}${field ? ':'+field : ''}`; }
function pageFor(id = state.question) { return data.pages.findIndex(page=>page.problems.some(p=>Number(p.id) === Number(id))); }
function saveURL() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('problem',String(state.question));
    url.searchParams.set('view',state.view);
    url.hash = '';
    history.replaceState(null,'',url);
  } catch { /* File previews may not support URL history. */ }
}
function selectProblem(id,view = state.view,scroll = false) {
  if (!data) return;
  if (!original(id)) return;
  state.question = Number(id); state.page = Math.max(0,pageFor(id)); state.view = view;
  hintOpen = false;
  render(); persist(); saveURL();
  if (scroll) requestAnimationFrame(()=>document.querySelector(`[data-card-id="${id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));
}
function setView(view) {
  if (!data) return;
  state.view = view;
  if (view === 'practice' && variantIndex() === 0 && (original().variants || []).length) state.variants[state.question] = 1;
  hintOpen = false;
  render(); persist(); saveURL();
}
function nextExample(id) {
  const count = (original(id).variants || []).length;
  if (!count) { notify('This concept uses the packet example. Try the lesson controls to explore it.'); return; }
  const v = variantIndex(id); state.variants[id] = v >= count ? 1 : v+1;
  state.question = Number(id); state.page = pageFor(id); hintOpen = false;
  render(); persist(); saveURL();
}
function formatNumber(n) { return Number(n.toFixed(7)).toString(); }
function parseNumber(value) {
  const raw = String(value).trim().replace(/,/g,'').replace(/−/g,'-');
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(raw)) return Number(raw);
  let match = raw.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (match && Number(match[2]) !== 0) return Number(match[1])/Number(match[2]);
  match = raw.match(/^([+-]?\d+)\s+(\d+)\/(\d+)$/);
  if (match && Number(match[3]) !== 0) return Number(match[1]) + (Number(match[1]) < 0 ? -1 : 1)*Number(match[2])/Number(match[3]);
  return NaN;
}
function normalize(value) { return String(value).toLowerCase().replace(/[∠\s.!?;:°]/g,'').trim(); }
function evaluate(field,value) {
  if (!String(value ?? '').trim()) return {status:'blank',message:'Add an answer first.'};
  if (field.value !== null && field.value !== undefined && Number.isFinite(Number(field.value))) {
    const parsed = parseNumber(value);
    if (!Number.isFinite(parsed)) return {status:'incorrect',message:'Enter a number or a fraction.'};
    const tolerance = field.tolerance === undefined ? .005 : Number(field.tolerance);
    return Math.abs(parsed-Number(field.value)) <= tolerance + 1e-10 ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Take another look. Use the hint if you need it.'};
  }
  if (Array.isArray(field.accepted) && field.accepted.length) {
    const ok = field.accepted.some(answer=>normalize(answer) === normalize(value));
    return ok ? {status:'correct',message:'Correct.'} : {status:'review',message:'Compare your reasoning with the sample answer.'};
  }
  return {status:'review',message:'Your explanation is saved. Compare it with the sample answer.'};
}
function answerFields(p,compact = false) {
  return `<div class="answer-fields">${(p.fields || []).map((field,index)=> {
    const key = keyFor(p.id,field.key);
    const value = state.answers[key] || '';
    const result = state.checked[key] ? evaluate(field,value) : null;
    const textField = (field.value === null || field.value === undefined) && !(field.accepted || []).length;
    const prefix = (p.fields || []).length > 1 ? `${String.fromCharCode(97+index)}. ` : '';
    const inputID = `answer-${p.id}-${variantIndex(p.id)}-${field.key}`;
    if (isPlotField(p,field)) return `<div class="answer-field"><label>${prefix}${prose(field.label)}</label><div class="plot-field-note">${(state.plots[keyFor(p.id)] || []).length ? `${(state.plots[keyFor(p.id)] || []).length} points saved on your graph.` : 'Add your points directly on the graph.'}</div>${state.plotChecked[keyFor(p.id)] ? `<span class="field-feedback">${escapeHTML(graphFeedback(p))}</span>` : ''}</div>`;
    if (p.diagram?.type === 'graph' && p.diagram.table && index === 0) {
      const values = String(value).split(',');
      const t = p.diagram.table;
      return `<div class="answer-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}"><label>${prefix}${prose(field.label)}</label><table class="answer-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((row,i)=>`<tr><th scope="row">${escapeHTML(row[0])}</th><td><input data-table-key="${escapeHTML(key)}" data-table-index="${i}" data-problem-id="${p.id}" inputmode="decimal" value="${escapeHTML((values[i] || '').trim())}" aria-label="${escapeHTML(t.headers[1])} when ${escapeHTML(t.headers[0])} is ${escapeHTML(row[0])}" autocomplete="off"></td></tr>`).join('')}</tbody></table>${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}</div>`;
    }
    return `<div class="answer-field answer-line-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}">
      <div class="answer-line"><label for="${escapeHTML(inputID)}">${prefix}${prose(field.label || 'Your answer')}</label><span class="answer-equals" aria-hidden="true">=</span><div class="input-row">
      ${textField ? `<textarea id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" rows="1" aria-label="${escapeHTML(field.label || 'Your answer')}">${escapeHTML(value)}</textarea>` : `<input id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" value="${escapeHTML(value)}" inputmode="${field.value !== null && field.value !== undefined ? 'decimal' : 'text'}" autocomplete="off" aria-label="${escapeHTML(field.label || 'Your answer')}">`}${field.unit ? `<span class="unit">${escapeHTML(field.unit)}</span>` : ''}</div></div>
      ${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}
function isPlotField(p,field) { return p.diagram?.type === 'graph' && p.diagram.student_plot && /plot.*point/i.test(field.label || ''); }
function solutionsMarkup(p,force = false) {
  if (!solutions && !force) return '';
  return `<div class="solution-box"><strong>Worked solution</strong>${(p.solution || []).map(line=>`<p>${prose(line)}</p>`).join('')}<ul>${(p.fields || []).map(field=>`<li>${prose(field.answer)}</li>`).join('')}</ul></div>`;
}
function checkAnswers(id) {
  const p = current(id);
  for (const field of p.fields || []) {
    if (isPlotField(p,field)) state.plotChecked[keyFor(id)] = true;
    else state.checked[keyFor(id,field.key)] = true;
  }
  render(); persist();
}
function sourceFor(p) { const v = variantIndex(p.id); return `./diagrams/q${String(p.id).padStart(2,'0')}${v ? '-v'+v : ''}.svg`; }
function problemTags(p) { return `${variantIndex(p.id) ? `<span class="variant-tag">Extra example ${variantIndex(p.id)}</span>` : (p.concept ? '<span class="concept-tag">Concept check</span>' : '')}`; }
function toolbar(packet = false) {
  const pg = data.pages[state.page];
  return `<div class="workspace-toolbar"><div class="section-select-wrap"><span class="eyebrow">${packet ? 'Your virtual packet' : state.view === 'practice' ? 'Extra practice' : 'Explore the lesson'}</span><select class="section-select" id="section-select" aria-label="Choose a section">${data.pages.map((page,index)=>`<option value="${index}" ${index === state.page ? 'selected' : ''}>${escapeHTML(page.title)}</option>`).join('')}</select></div><div class="toolbar-right"><span class="page-count">Page ${state.page+1} of ${data.pages.length}</span></div></div><div class="question-jump"><span class="jump-label">Problems</span>${pg.problems.map(p=>`<button type="button" data-action="jump" data-id="${p.id}" class="${Number(p.id) === Number(state.question) ? 'active' : ''} ${hasAnswers(p.id) ? 'answered' : ''}" aria-label="Problem ${p.id}" aria-current="${Number(p.id) === Number(state.question) ? 'true' : 'false'}">${p.id}</button>`).join('')}</div>`;
}
function hasAnswers(id) { const prefix = keyFor(id)+':'; return Object.entries(state.answers).some(([key,value])=>key.startsWith(prefix)&&String(value).trim()); }
function renderLesson() {
  const p = current();
  const count = (original().variants || []).length;
  const isGraph = p.diagram?.type === 'graph';
  const conceptDescription = p.concept ? 'Look closely at what each unit measures.' : 'The picture and question use the same measurements.';
  app.innerHTML = toolbar()+`${state.view === 'practice' ? `<div class="practice-banner"><div><strong>${variantIndex() ? 'A new example. The same idea.' : 'Start with the packet example.'}</strong><br><span>${variantIndex() ? 'Your extra-practice answers stay separate from your packet answers.' : 'Extra examples are available for calculation problems. Lesson controls let you explore the concepts.'}</span></div><button class="outline-button small-button" data-action="original" data-id="${p.id}">Packet original</button></div>` : ''}
    <div class="lesson-layout"><section class="visual-panel" aria-label="Problem visualization"><div class="visual-topbar"><span class="eyebrow">${isGraph ? p.diagram.student_plot ? 'Your graph' : 'Read the graph' : p.diagram ? 'See the mathematics' : 'Think it through'}</span><div class="visual-tools"><button type="button" data-action="zoom-out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-action="zoom-reset" title="Reset zoom" aria-label="Reset zoom">↺</button><button type="button" data-action="zoom-in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-action="visual-fullscreen" title="Enlarge visualization" aria-label="Enlarge visualization">⛶</button></div></div><div id="visual-stage" class="visual-stage">${p.diagram ? isGraph ? graphMarkup(p) : `<img class="diagram-image" src="${sourceFor(p)}" alt="Diagram for problem ${p.id}: ${escapeHTML(p.topic || p.prompt)}">` : `<div class="text-visual"><div class="text-visual-symbol" aria-hidden="true">${(p.topic || '').toLowerCase().includes('ratio') ? 'a : b' : 'x'}</div><p>${prose(p.prompt)}</p><small>Use the answer space to work through the relationship.</small></div>`}</div><div class="visual-note" id="visual-note">${isGraph && p.diagram.student_plot ? 'Tap a grid intersection to add a point. Tap it again to remove it.' : conceptDescription}</div></section>
    <section class="problem-panel" aria-label="Problem ${p.id}"><div class="problem-topline"><span class="problem-number">PROBLEM ${p.id}</span>${problemTags(p)}</div><h1 class="problem-prompt">${prose(p.prompt)}</h1>${answerFields(p)}<div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check answers</button><button class="outline-button" data-action="hint" data-id="${p.id}" aria-expanded="${hintOpen}">${hintOpen ? 'Hide hint' : 'Hint'}</button></div>${hintOpen ? `<div class="hint-box"><strong>A place to start</strong>${prose(p.hint || 'Look at the units and the measurements given. Break the problem into one small step at a time.')}</div>` : ''}${solutionsMarkup(p)}${reviewAnswers(p)}<div class="problem-nav-link"><button class="soft-button" data-action="packet" data-id="${p.id}">Go to Packet →</button></div></section></div>
    <div class="lesson-bottom"><div class="example-controls"><button class="outline-button" data-action="example" data-id="${p.id}" ${count ? '' : 'disabled'}>Another example ↻</button>${variantIndex() ? `<button class="quiet-button" data-action="original" data-id="${p.id}">Packet original</button>` : ''}<span>${count ? variantIndex() ? `Extra example ${variantIndex()} of ${count}` : `${count} extra examples available` : 'Use the lesson controls to explore this idea.'}</span></div><div class="step-nav"><button class="outline-button" data-action="previous" ${Number(p.id) === Number(problems[0].id) ? 'disabled' : ''}>← Previous</button><button class="primary-button" data-action="next" ${Number(p.id) === Number(problems.at(-1).id) ? 'disabled' : ''}>Next problem →</button></div></div>`;
  mountLessonInteractive(p);
}
function reviewAnswers(p) {
  if (solutions) return '';
  const review = (p.fields || []).filter(field=>!isPlotField(p,field) && state.checked[keyFor(p.id,field.key)] && evaluate(field,state.answers[keyFor(p.id,field.key)] || '').status === 'review');
  if (!review.length) return '';
  return `<details class="solution-box"><summary>Compare with a sample answer</summary>${review.map(field=>`<p>${prose(field.answer)}</p>`).join('')}<p>Different wording can still be correct. Check whether your explanation shows the same mathematical idea.</p></details>`;
}
function mountLessonInteractive(p) {
  const container = document.querySelector('#visual-stage');
  if (p.diagram?.type === 'graph' || !interactiveModule?.mountInteractive) return;
  const fallback = container.innerHTML;
  try {
    const result = interactiveModule.mountInteractive(container,p,{variantIndex:variantIndex(p.id),theme:state.theme,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
    if (typeof result === 'function') {
      cleanupInteractive = result;
      container.classList.add('interactive');
      document.querySelector('#visual-note').textContent = 'Explore with the controls. Changed measurements are labeled as exploration; your packet question stays the same.';
    } else container.innerHTML = fallback;
  } catch (error) {
    container.innerHTML = fallback;
    console.warn('Interactive lesson unavailable; using the packet diagram.',error);
  }
}
function renderPacket() {
  const page = data.pages[state.page];
  app.innerHTML = toolbar(true)+`<section class="packet-sheet"><div class="packet-heading"><div><h1>${escapeHTML(data.title || 'Study for Test 1 Packet')}</h1><p>${escapeHTML(page.title)} · Page ${page.number || state.page+1}</p></div><button class="outline-button small-button" data-action="original-page">Use packet originals</button></div><div class="packet-grid ${page.large ? 'large-problems' : ''}" data-problem-count="${page.problems.length}">${page.problems.map(base=> {
    const p = current(base.id); const graph = p.diagram?.type === 'graph';
    return `<article class="packet-card ${graph ? 'graph-card' : ''} ${Number(p.id) === Number(state.question) ? 'is-selected' : ''}" data-card-id="${p.id}"><div class="problem-topline"><span class="problem-number">${p.id}.</span>${problemTags(p)}</div><h2 class="problem-prompt">${prose(p.prompt)}</h2><div ${graph ? 'class="graph-packet-grid"' : ''}>${p.diagram ? graph ? graphMarkup(p) : `<div class="diagram-wrap"><img src="${sourceFor(p)}" alt="Diagram for problem ${p.id}"></div>` : ''}<div>${answerFields(p,true)}<div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check</button><button class="soft-button" data-action="lesson" data-id="${p.id}">Go to Visualization ↗</button>${(base.variants || []).length ? `<button class="outline-button" data-action="example" data-id="${p.id}">Another example ↻</button>` : ''}${variantIndex(p.id) ? `<button class="outline-button" data-action="original" data-id="${p.id}">Original</button>` : ''}</div>${solutionsMarkup(p)}${reviewAnswers(p)}</div></div></article>`;
  }).join('')}</div></section><div class="packet-bottom"><button class="outline-button" data-action="page-previous" ${state.page === 0 ? 'disabled' : ''}>← Previous page</button><span>Same problems. Same values. Answers save as you go.</span><button class="primary-button" data-action="page-next" ${state.page === data.pages.length-1 ? 'disabled' : ''}>Next page →</button></div>`;
}
function graphMarkup(p) {
  const d = p.diagram; const key = keyFor(p.id);
  const points = Array.isArray(state.plots[key]) ? state.plots[key] : [];
  const xmax = Number(d.xmax || 6), ymax = Number(d.ymax || 12);
  const xstep = Number(d.xstep || 1), ystep = Number(d.ystep || 1);
  const nx = Math.round(xmax/xstep), ny = Math.round(ymax/ystep);
  const cell = Math.min(450/Math.max(1,nx),340/Math.max(1,ny));
  const gw = nx*cell, gh = ny*cell; const x0 = (560-gw)/2+12, y0 = 372;
  const pos = (x,y)=>[x0+x/xstep*cell,y0-y/ystep*cell];
  const grid = Array.from({length:nx+1},(_,i)=>`<line x1="${x0+i*cell}" y1="${y0-gh}" x2="${x0+i*cell}" y2="${y0}" class="graph-grid"/><text x="${x0+i*cell}" y="${y0+21}" text-anchor="middle" class="graph-tick">${formatNumber(i*xstep)}</text>`).join('')+Array.from({length:ny+1},(_,j)=>`<line x1="${x0}" y1="${y0-j*cell}" x2="${x0+gw}" y2="${y0-j*cell}" class="graph-grid"/>${j ? `<text x="${x0-12}" y="${y0-j*cell+4}" text-anchor="end" class="graph-tick">${formatNumber(j*ystep)}</text>` : ''}`).join('');
  let givenLine = '';
  if (d.plot_line && Number.isFinite(Number(d.slope))) {
    const slope = Number(d.slope); const endX = slope > 0 ? Math.min(xmax,ymax/slope) : xmax;
    givenLine = `<polyline class="graph-line" points="${pos(0,0).join(',')} ${pos(endX,endX*slope).join(',')}"/>`;
  }
  if (Array.isArray(d.points) && d.points.length) givenLine += d.points.map(pt=>`<circle class="graph-point" cx="${pos(pt[0],pt[1])[0]}" cy="${pos(pt[0],pt[1])[1]}" r="5"/>`).join('');
  const joined = state.lines[key] && points.length > 1 ? `<polyline class="graph-line" points="${[...points].sort((a,b)=>a[0]-b[0]).map(pt=>pos(...pt).join(',')).join(' ')}"/>` : '';
  const expected = expectedPoints(p);
  const overlay = solutions && d.student_plot && expected.length ? `<polyline fill="none" stroke="#b16f32" stroke-width="2.2" stroke-dasharray="6 5" points="${expected.map(pt=>pos(...pt).join(',')).join(' ')}"/>${expected.map(pt=>`<circle cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="7" fill="none" stroke="#b16f32" stroke-width="2"/>`).join('')}` : '';
  return `<div class="graph-plot-wrap"><div class="graph-shell"><svg viewBox="0 0 560 440" role="img" aria-label="${escapeHTML(d.student_plot ? 'Interactive graph. Tap grid intersections to place points.' : 'Graph for this problem.')}" data-graph-id="${p.id}" data-graph-origin-x="${x0}" data-graph-origin-y="${y0}" data-graph-cell="${cell}" data-graph-xstep="${xstep}" data-graph-ystep="${ystep}" data-graph-xmax="${xmax}" data-graph-ymax="${ymax}" data-graph-editable="${Boolean(d.student_plot)}">${grid}<line x1="${x0}" y1="${y0}" x2="${x0+gw+10}" y2="${y0}" class="graph-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0-gh-10}" class="graph-axis"/><path d="M${x0+gw+5},${y0-4} L${x0+gw+10},${y0} L${x0+gw+5},${y0+4} M${x0-4},${y0-gh-5} L${x0},${y0-gh-10} L${x0+4},${y0-gh-5}" fill="none" class="graph-axis"/><text x="${x0+gw/2}" y="${y0+50}" text-anchor="middle" class="graph-label">${escapeHTML(d.xlabel || 'x')}</text><text x="${x0-50}" y="${y0-gh/2}" text-anchor="middle" class="graph-label" transform="rotate(-90 ${x0-50} ${y0-gh/2})">${escapeHTML(d.ylabel || 'y')}</text>${givenLine}${overlay}${joined}${points.map(pt=>`<circle class="graph-point" cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="6"/>`).join('')}</svg></div>${d.student_plot ? `<div class="graph-controls"><label><input type="checkbox" data-join-id="${p.id}" ${state.lines[key] ? 'checked' : ''}> Join my points</label><button class="soft-button small-button" data-action="check-graph" data-id="${p.id}">Check graph</button><button class="outline-button small-button" data-action="clear-graph" data-id="${p.id}">Clear points</button></div><div class="point-chips">${points.map((pt,index)=>`<button type="button" data-action="remove-point" data-id="${p.id}" data-index="${index}" aria-label="Remove point ${pt.join(', ')}">(${pt.map(formatNumber).join(', ')}) ×</button>`).join('')}</div><p class="graph-tip">Tap a grid intersection to place or remove a point.</p>${state.plotChecked[key] ? `<p class="graph-feedback">${escapeHTML(graphFeedback(p))}</p>` : ''}` : ''}</div>`;
}
function expectedPoints(p) {
  if (Array.isArray(p.diagram?.expected_points)) return p.diagram.expected_points;
  return [];
}
function graphFeedback(p) {
  const key = keyFor(p.id), actual = state.plots[key] || [], expected = expectedPoints(p);
  if (!expected.length) return 'Use the table to check each coordinate you plotted.';
  const equal = (a,b)=>Math.abs(a[0]-b[0])<1e-7 && Math.abs(a[1]-b[1])<1e-7;
  const missing = expected.filter(pt=>!actual.some(a=>equal(a,pt)));
  const extra = actual.filter(pt=>!expected.some(a=>equal(a,pt)));
  if (!missing.length && !extra.length) return state.lines[key] ? 'Your points and connecting line are correct.' : 'All points are correct. Turn on “Join my points” to connect them.';
  return `${actual.length ? 'Check the coordinates in your table.' : 'Start by placing the table’s points.'} ${missing.length ? `${missing.length} ${missing.length === 1 ? 'point is' : 'points are'} still missing.` : ''} ${extra.length ? `${extra.length} ${extra.length === 1 ? 'point needs' : 'points need'} another look.` : ''}`.trim();
}
function render() {
  if (typeof cleanupInteractive === 'function') { cleanupInteractive(); cleanupInteractive = null; }
  state.page = Math.max(0,Math.min(data.pages.length-1,pageFor(state.question)));
  document.querySelectorAll('[data-view]').forEach(button=> {
    const active = button.dataset.view === state.view; button.classList.toggle('active',active); button.setAttribute('aria-current',active ? 'page' : 'false');
  });
  document.querySelector('#solutions-toggle').setAttribute('aria-pressed',String(solutions));
  document.querySelector('#theme-toggle').setAttribute('aria-label',`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
  state.view === 'packet' ? renderPacket() : renderLesson();
  app.querySelectorAll('.answer-line textarea').forEach(sizeAnswer);
  applyPresentation();
  app.setAttribute('aria-busy','false'); updateSavedStatus();
}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.querySelector('.brand').addEventListener('click',event=> { event.preventDefault(); selectProblem(problems[0]?.id || 1,'lesson'); });
document.querySelector('#solutions-toggle').addEventListener('click',()=> { if (!data) return; solutions = !solutions; render(); });
document.querySelector('#theme-toggle').addEventListener('click',()=> {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.body.classList.toggle('dark',state.theme === 'dark'); persist(); if (data) render();
});
document.querySelector('#fullscreen-toggle').addEventListener('click',async()=> {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
  catch { openPresentation('page'); }
});
document.addEventListener('fullscreenchange',()=> { const active = Boolean(document.fullscreenElement); document.querySelector('#fullscreen-toggle').setAttribute('aria-label',active ? 'Exit full screen' : 'Enter full screen'); });
document.querySelector('#download-toggle').addEventListener('click',()=> { document.querySelector('#download-menu').hidden = !document.querySelector('#download-menu').hidden; });
document.addEventListener('click',event=> { if (!event.target.closest('#download-toggle,#download-menu,[data-action="download"]')) document.querySelector('#download-menu').hidden = true; });
document.querySelector('#reset-progress').addEventListener('click',()=> {
  if (!data) return;
  if (!confirm('Clear all saved answers and plotted points for this study packet on this browser?')) return;
  for (const key of ['answers','plots','lines','checked','plotChecked']) state[key] = {};
  render(); persist(); notify('Saved answers cleared.');
});
app.addEventListener('input',event=> {
  if (event.target.matches('[data-table-key]')) {
    const input = event.target;
    const key = input.dataset.tableKey;
    const values = [...input.closest('tbody').querySelectorAll('input')].map(el=>el.value.trim());
    state.answers[key] = values.some(Boolean) ? values.join(', ') : '';
    state.checked[key] = false;
    const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
    persist(); return;
  }
  const input = event.target.closest('[data-answer-key]');
  if (!input) return;
  if (input.tagName === 'TEXTAREA') sizeAnswer(input);
  state.answers[input.dataset.answerKey] = input.value; state.checked[input.dataset.answerKey] = false;
  const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
  persist();
});
function sizeAnswer(input) { input.style.height = 'auto'; input.style.height = `${Math.max(38,input.scrollHeight)}px`; }
app.addEventListener('change',event=> {
  if (event.target.id === 'section-select') { const page = data.pages[Number(event.target.value)]; selectProblem(page.problems[0].id,state.view); }
  if (event.target.matches('[data-join-id]')) { state.lines[keyFor(event.target.dataset.joinId)] = event.target.checked; render(); persist(); }
});
app.addEventListener('pointerdown',event=> {
  const svg = event.target.closest('svg[data-graph-editable="true"]');
  if (!svg) return;
  event.preventDefault();
  const point = svg.createSVGPoint(); point.x = event.clientX; point.y = event.clientY;
  const matrix = svg.getScreenCTM(); if (!matrix) return;
  const local = point.matrixTransform(matrix.inverse());
  const x = Math.round((local.x-Number(svg.dataset.graphOriginX))/Number(svg.dataset.graphCell))*Number(svg.dataset.graphXstep);
  const y = Math.round((Number(svg.dataset.graphOriginY)-local.y)/Number(svg.dataset.graphCell))*Number(svg.dataset.graphYstep);
  if (x < 0 || y < 0 || x > Number(svg.dataset.graphXmax) || y > Number(svg.dataset.graphYmax)) return;
  const key = keyFor(svg.dataset.graphId); const points = state.plots[key] || [];
  const existing = points.findIndex(pt=>Math.abs(pt[0]-x)<1e-7&&Math.abs(pt[1]-y)<1e-7);
  if (existing >= 0) points.splice(existing,1); else points.push([Number(x.toFixed(7)),Number(y.toFixed(7))]);
  state.plots[key] = points; state.plotChecked[key] = false; render(); persist();
});
app.addEventListener('click',async event=> {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const id = Number(button.dataset.id || state.question); const action = button.dataset.action;
  if (action === 'jump') selectProblem(id,state.view,state.view === 'packet');
  else if (action === 'lesson') selectProblem(id,'lesson');
  else if (action === 'packet') selectProblem(id,'packet',true);
  else if (action === 'check') checkAnswers(id);
  else if (action === 'hint') { hintOpen = !hintOpen; render(); }
  else if (action === 'example') nextExample(id);
  else if (action === 'original') { state.variants[id] = 0; selectProblem(id); }
  else if (action === 'original-page') { data.pages[state.page].problems.forEach(p=>state.variants[p.id]=0); render(); persist(); }
  else if (action === 'previous' || action === 'next') { const index = problems.findIndex(p=>Number(p.id) === Number(state.question)); const p = problems[index+(action === 'next' ? 1 : -1)]; if (p) selectProblem(p.id); }
  else if (action === 'page-previous' || action === 'page-next') { const page = data.pages[state.page+(action === 'page-next' ? 1 : -1)]; if (page) { selectProblem(page.problems[0].id,'packet'); window.scrollTo({top:0,behavior:'smooth'}); } }
  else if (action === 'download') document.querySelector('#download-menu').hidden = false;
  else if (action.startsWith('zoom-')) {
    const image = document.querySelector('#visual-stage .diagram-image');
    if (image) { let z = Number(image.dataset.zoom || 1); z = action === 'zoom-reset' ? 1 : Math.max(.5,Math.min(2,z+(action === 'zoom-in' ? .2 : -.2))); image.dataset.zoom = z; image.style.transform = `scale(${z})`; }
    else notify('Use the controls in this visualization, or enlarge it.');
  } else if (action === 'visual-fullscreen') {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('#visual-stage').requestFullscreen(); } catch { openPresentation('visual'); }
  } else if (action === 'check-graph') { state.plotChecked[keyFor(id)] = true; render(); persist(); }
  else if (action === 'clear-graph') { state.plots[keyFor(id)] = []; state.plotChecked[keyFor(id)] = false; render(); persist(); }
  else if (action === 'remove-point') { (state.plots[keyFor(id)] || []).splice(Number(button.dataset.index),1); state.plotChecked[keyFor(id)] = false; render(); persist(); }
});
document.addEventListener('keydown',event=> {
  if (event.key === 'Escape') { document.querySelector('#download-menu').hidden = true; if (presentationMode) { event.preventDefault(); closePresentation(); } }
  if (event.key === 'Tab' && presentationMode === 'visual') {
    const focusable = [...document.querySelectorAll('#visual-stage button:not([disabled]),#visual-stage input:not([disabled]),#visual-stage select:not([disabled]),#visual-stage textarea:not([disabled]),#visual-stage [tabindex="0"],#focus-close')];
    const currentIndex = focusable.indexOf(document.activeElement);
    if (focusable.length && (currentIndex < 0 || (!event.shiftKey && currentIndex === focusable.length-1) || (event.shiftKey && currentIndex === 0))) {
      event.preventDefault(); focusable[event.shiftKey ? focusable.length-1 : 0].focus();
    }
  }
  if (event.altKey && ['ArrowLeft','ArrowRight'].includes(event.key) && data) {
    event.preventDefault(); const i = problems.findIndex(p=>Number(p.id) === Number(state.question));
    const p = problems[i+(event.key === 'ArrowRight' ? 1 : -1)]; if (p) selectProblem(p.id);
  }
});

async function start() {
  try {
    const results = await Promise.allSettled([fetch('./content.json').then(response=>{if(!response.ok) throw Error(`Content ${response.status}`);return response.json();}),import('./interactives.js')]);
    if (results[0].status !== 'fulfilled') throw results[0].reason;
    data = results[0].value; if (!Array.isArray(data.pages) || !data.pages.length) throw Error('The packet has no pages.');
    problems = data.pages.flatMap(page=>page.problems);
    if (results[1].status === 'fulfilled') interactiveModule = results[1].value;
    const url = new URL(window.location.href); const problem = Number(url.searchParams.get('problem')); const view = url.searchParams.get('view');
    if (problem && problems.some(p=>Number(p.id) === problem)) state.question = problem;
    if (['lesson','packet','practice'].includes(view)) state.view = view;
    if (!problems.some(p=>Number(p.id) === Number(state.question))) state.question = problems[0].id;
    state.page = Math.max(0,pageFor()); render(); saveURL();
    if (migratedProgress) notify('Packet updated. Saved answers for unchanged problems are still here.');
  } catch (error) {
    app.setAttribute('aria-busy','false');
    app.innerHTML = `<section class="error-state"><h1>The packet could not open.</h1><p>Your saved answers are safe on this browser. Reload to try again.</p><button class="primary-button" onclick="location.reload()">Reload</button></section>`;
    console.error(error);
  }
}
start();
