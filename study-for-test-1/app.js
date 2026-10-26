import {createProgressState,recordCheck,recordSelfReview,summarizeProgress,makeReportText,makeReportCSV,makeBackup,validateBackup} from './progress.js?v=8';
import {createAutoAdvance} from './advance.js?v=8';
import {getExample,MAX_EXAMPLE_INDEX} from './generators.js?v=8';
import {diagramMarkup} from './generated-diagrams.js?v=8';
import {packetData} from './packet-data.js?v=8';
const STORAGE_KEY = 'study-for-test-1-v2';
const LEGACY_STORAGE_KEY = 'study-for-test-1-v1';
const REVISED_PROBLEM_IDS = new Set([2,3,4,14,15,16,26,27,29,30,31,32,33,67,68,69,70]);
const app = document.querySelector('#app');
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const prose = value => escapeHTML(value).replace(/\n/g,'<br>');
let data, problems = [], interactiveModule, cleanupInteractive;
let hintOpen = false;
let saveTimer, toastTimer;
let presentationMode = null, presentationReturnFocus = null;
let migratedProgress = false;
let dialogState = null, pendingImport = null, reportName = '';
let downloadURLs = [];
const expandedSolutions = new Set();
const initial = {view:'lesson',question:1,page:0,variants:{},exampleIndices:{},answers:{},plots:{},lines:{},checked:{},plotChecked:{},theme:'light',autoNext:true,progress:createProgressState()};
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
for (const key of ['variants','exampleIndices','answers','plots','lines','checked','plotChecked']) if (!state[key] || typeof state[key] !== 'object') state[key] = {};
if (!['lesson','packet','practice'].includes(state.view)) state.view = 'lesson';
if (!['light','dark'].includes(state.theme)) state.theme = 'light';
try {
  const linkedTheme = new URL(window.location.href).searchParams.get('theme');
  if (['light','dark'].includes(linkedTheme)) state.theme = linkedTheme;
} catch { /* A saved theme also works without URL support. */ }
if (!state.progress || state.progress.version !== 1 || !state.progress.records || typeof state.progress.records !== 'object') state.progress = createProgressState();
if (typeof state.autoNext !== 'boolean') state.autoNext = true;
document.body.classList.toggle('dark',state.theme === 'dark');
const autoAdvance = createAutoAdvance({onAdvance:pending=> {
  if (Number(state.question) !== Number(pending.id) || variantIndex() !== pending.variant || document.querySelector('#study-dialog').open || document.hidden) return cancelAdvance();
  selectProblem(pending.target,state.view,state.view === 'packet');
}});

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
  saveTimer = setTimeout(flushSave,150);
}
function flushSave() {
  clearTimeout(saveTimer);
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); updateSavedStatus(); refreshDownloadLinks(); }
  catch { document.querySelector('#save-status').textContent = 'Saving is unavailable. Download a backup from Progress before closing this tab.'; }
}
function updateSavedStatus() {
  const count = Object.values(state.answers).filter(value=>String(value).trim()).length;
  document.querySelector('#save-status').textContent = count ? `${count} ${count === 1 ? 'answer' : 'answers'} saved on this browser.` : 'Answers stay on this browser.';
}
function original(id = state.question) { return problems.find(p=>Number(p.id) === Number(id)) || problems[0]; }
function variantIndex(id = state.question) {
  const p = original(id); const v = Number(state.variants[id] || 0);
  return p && Number.isInteger(v) && v >= 0 && v <= MAX_EXAMPLE_INDEX ? v : 0;
}
function current(id = state.question) {
  const p = original(id); const v = variantIndex(id);
  return getExample(p,v);
}
function highestExample(id) {
  let highest = Math.max(variantIndex(id),Number(state.exampleIndices[id]) || 0);
  for (const map of [state.answers,state.plots,state.progress.records]) for (const key of Object.keys(map)) {
    const [problem,index] = key.split(':').map(Number);
    if (problem === Number(id) && Number.isInteger(index) && index > highest && index <= MAX_EXAMPLE_INDEX) highest = index;
  }
  return Math.min(MAX_EXAMPLE_INDEX,highest);
}
function chooseExample(id,index) {
  const selected = Math.max(0,Math.min(MAX_EXAMPLE_INDEX,Number(index) || 0));
  state.variants[id] = selected;
  state.exampleIndices[id] = Math.max(highestExample(id),selected);
}
function keyFor(id,field='') { return `${id}:${variantIndex(id)}${field ? ':'+field : ''}`; }
function pageFor(id = state.question) { return data.pages.findIndex(page=>page.problems.some(p=>Number(p.id) === Number(id))); }
function saveURL() {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set('problem',String(state.question));
    url.searchParams.set('view',state.view);
    url.searchParams.set('example',String(variantIndex()));
    if (url.searchParams.has('theme')) url.searchParams.set('theme',state.theme);
    url.hash = '';
    history.replaceState(null,'',url);
  } catch { /* File previews may not support URL history. */ }
}
function selectProblem(id,view = state.view,scroll = false) {
  if (!data) return;
  if (!original(id)) return;
  cancelAdvance();
  state.question = Number(id); state.page = Math.max(0,pageFor(id)); state.view = view;
  if (view === 'practice' && variantIndex(id) === 0) chooseExample(id,Math.min(MAX_EXAMPLE_INDEX,highestExample(id)+1));
  hintOpen = false;
  render(); persist(); saveURL();
  if (scroll) requestAnimationFrame(()=>document.querySelector(`[data-card-id="${id}"]`)?.scrollIntoView({block:'center',behavior:'smooth'}));
}
function setView(view) {
  if (!data) return;
  cancelAdvance();
  state.view = view;
  if (view === 'practice' && variantIndex() === 0) chooseExample(state.question,Math.min(MAX_EXAMPLE_INDEX,highestExample(state.question)+1));
  hintOpen = false;
  render(); persist(); saveURL();
}
function nextExample(id) {
  cancelAdvance();
  const highest = highestExample(id);
  if (highest >= MAX_EXAMPLE_INDEX) { notify('You have reached the last example for this problem. Your earlier answers are still saved.'); return; }
  chooseExample(id,highest+1);
  state.question = Number(id); state.page = pageFor(id); hintOpen = false;
  render(); persist(); saveURL();
}
function formatNumber(n) { return Number(n.toFixed(7)).toString(); }
function parseNumber(value) {
  const raw = String(value).trim().replace(/,/g,'').replace(/[−–]/g,'-').replace(/[⁄∕]/g,'/');
  if (/^[+-]?(\d+\.?\d*|\.\d+)$/.test(raw)) return Number(raw);
  let match = raw.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*([+-]?\d+(?:\.\d+)?)$/);
  if (match && Number(match[2]) !== 0) return Number(match[1])/Number(match[2]);
  match = raw.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (match && Number(match[3]) !== 0) return Number(match[1]) + (match[1].startsWith('-') ? -1 : 1)*Number(match[2])/Number(match[3]);
  return NaN;
}
function normalize(value) { return String(value).toLowerCase().trim().replace(/[.!?]+$/,'').replace(/π/g,'pi').replace(/²/g,'^2').replace(/squared/g,'^2').replace(/[∠\s*×;:°]/g,''); }
function evaluate(field,value) {
  if (!String(value ?? '').trim()) return {status:'blank',message:'Add an answer first.'};
  if (field.value !== null && field.value !== undefined && Number.isFinite(Number(field.value))) {
    const parsed = parseNumber(value);
    if (!Number.isFinite(parsed)) return {status:'incorrect',message:'Enter a number or a fraction.'};
    const tolerance = field.tolerance === undefined ? .005 : Number(field.tolerance);
    return Math.abs(parsed-Number(field.value)) <= tolerance + 1e-10 ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Take another look. Use the hint if you need it.'};
  }
  if (Array.isArray(field.accepted) && field.accepted.length) {
    const lists = field.accepted.filter(answer=>String(answer).includes(',')).map(answer=>String(answer).split(',').map(parseNumber)).filter(values=>values.every(Number.isFinite));
    if (lists.length) {
      const cells = String(value).split(',');
      if (cells.some(cell=>!cell.trim())) return {status:'blank',message:'Complete every table value first.'};
      const parsed = cells.map(parseNumber);
      const ok = lists.some(expected=>expected.length === parsed.length && parsed.every((n,i)=>Number.isFinite(n)&&Math.abs(n-expected[i])<1e-7));
      return ok ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Check each table value against the constant ratio.'};
    }
    const ok = field.accepted.some(answer=>normalize(answer) === normalize(value));
    return ok ? {status:'correct',message:'Correct.'} : {status:'incorrect',message:'Take another look. Use the hint if you need it.'};
  }
  return {status:'review',message:'Your explanation is saved. Review your reasoning.'};
}
function answerFields(p,compact = false) {
  return `<div class="answer-fields">${(p.fields || []).map((field,index)=> {
    const key = keyFor(p.id,field.key);
    const value = state.answers[key] || '';
    const result = state.checked[key] ? state.progress.records[keyFor(p.id)]?.fields?.[field.key] === 'self-reviewed' ? {status:'self-reviewed',message:'Self-reviewed.'} : evaluate(field,value) : null;
    const textField = (field.value === null || field.value === undefined) && !(field.accepted || []).length;
    const prefix = (p.fields || []).length > 1 ? `${String.fromCharCode(97+index)}. ` : '';
    const inputID = `answer-${p.id}-${variantIndex(p.id)}-${field.key}`;
    if (isPlotField(p,field)) return compact ? `<div class="answer-field"><label>${prefix}${prose(field.label)}</label><div class="plot-field-note">${(state.plots[keyFor(p.id)] || []).length ? `${(state.plots[keyFor(p.id)] || []).length} points saved on your graph.` : 'Add your points directly on the graph.'}</div>${state.plotChecked[keyFor(p.id)] ? `<span class="field-feedback">${escapeHTML(graphFeedback(p))}</span>` : ''}</div>` : '';
    if (p.diagram?.type === 'graph' && p.diagram.table && index === 0) {
      const values = String(value).split(',');
      const t = p.diagram.table;
      if (!compact) return `<div class="answer-field table-answer-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}"><label>${prefix}${prose(field.label)}</label><table class="answer-table horizontal-answer-table"><tbody><tr><th scope="row">${escapeHTML(t.headers[0])}</th>${t.rows.map(row=>`<th scope="col">${escapeHTML(row[0])}</th>`).join('')}</tr><tr><th scope="row">${escapeHTML(t.headers[1])}</th>${t.rows.map((row,i)=>`<td><input data-table-key="${escapeHTML(key)}" data-table-index="${i}" data-problem-id="${p.id}" inputmode="text" value="${escapeHTML((values[i] || '').trim())}" aria-label="${escapeHTML(t.headers[1])} when ${escapeHTML(t.headers[0])} is ${escapeHTML(row[0])}" autocomplete="off"></td>`).join('')}</tr></tbody></table>${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}</div>`;
      return `<div class="answer-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}"><label>${prefix}${prose(field.label)}</label><table class="answer-table"><thead><tr>${t.headers.map(h=>`<th scope="col">${escapeHTML(h)}</th>`).join('')}</tr></thead><tbody>${t.rows.map((row,i)=>`<tr><th scope="row">${escapeHTML(row[0])}</th><td><input data-table-key="${escapeHTML(key)}" data-table-index="${i}" data-problem-id="${p.id}" inputmode="text" value="${escapeHTML((values[i] || '').trim())}" aria-label="${escapeHTML(t.headers[1])} when ${escapeHTML(t.headers[0])} is ${escapeHTML(row[0])}" autocomplete="off"></td></tr>`).join('')}</tbody></table>${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}</div>`;
    }
    return `<div class="answer-field answer-line-field ${result?.status || ''}" data-field-key="${escapeHTML(key)}">
      <div class="answer-line"><label for="${escapeHTML(inputID)}">${prefix}${prose(field.label || 'Your answer')}</label><span class="answer-equals" aria-hidden="true">=</span><div class="input-row">
      ${textField ? `<textarea id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" rows="1" aria-label="${escapeHTML(field.label || 'Your answer')}">${escapeHTML(value)}</textarea>` : `<input id="${escapeHTML(inputID)}" data-answer-key="${escapeHTML(key)}" data-problem-id="${p.id}" value="${escapeHTML(value)}" inputmode="text" title="${field.value !== null && field.value !== undefined ? 'Enter a number, negative number, or fraction such as -3/4' : escapeHTML(field.label || 'Your answer')}" autocomplete="off" aria-label="${escapeHTML(field.label || 'Your answer')}">`}${field.unit ? `<span class="unit">${escapeHTML(field.unit)}</span>` : ''}</div></div>
      ${result ? `<span class="field-feedback">${escapeHTML(result.message)}</span>` : ''}
    </div>`;
  }).join('')}</div>`;
}
function isPlotField(p,field) { return p.diagram?.type === 'graph' && p.diagram.student_plot && /plot.*point/i.test(field.label || ''); }
function canShowSolutions(p) { return variantIndex(p.id) > 0; }
function originalHint(p) {
  const specific = {
    18:'Compare the two outlines and the positions of the pieces. Refer to the measurements labeled in the diagram.',
    34:'Trace the radius and diameter in the diagram. Describe the relationship you observe before comparing the expressions.',
    42:'Use the relationship stated in the question. Keep the symbols until you have simplified your expression.',
    47:'Look at the values you calculated in the preceding questions. Describe a pattern, then connect it to the picture.',
    48:'Use the preceding comparison. State a base, a height, and an area expression that agree with your observations.'
  };
  if (specific[p.id]) return specific[p.id];
  const topic = String(p.topic || '').toLowerCase();
  if (topic.includes('angle')) return 'Find the vertex and rays. Look for straight lines and marked corners, then relate the labeled angles.';
  if (topic.includes('perimeter')) return 'Trace the outside boundary once. Use the labeled measurements to identify any missing side lengths.';
  if (topic.includes('volume')) return 'Identify the base and the prism length, or identify one layer of unit pieces. Keep track of whole and partial units.';
  if (topic.includes('circle') || topic.includes('circles')) return 'Identify the marked radius or diameter and the quantity being requested. Use the relationships provided in the question and keep the units consistent.';
  if (topic.includes('area')) return 'Identify one square unit. Look for a way to divide or rearrange the figure without gaps or overlaps.';
  if (topic.includes('graph')) return 'Match each table column to its axis. Read the scale carefully before placing or reading a point.';
  if (topic.includes('ratio') || topic.includes('proportion')) return 'Match corresponding quantities in the same order. Check whether the comparison stays consistent.';
  return 'Identify one unit in the drawing. Compare each whole or partial piece with that unit before counting.';
}
function solutionsMarkup(p) {
  if (!canShowSolutions(p)) return '';
  const open = expandedSolutions.has(keyFor(p.id));
  const review = (p.fields || []).filter(field=>state.progress.records[keyFor(p.id)]?.fields?.[field.key] === 'review');
  return `<section class="inline-solution"><button class="soft-button inline-solution-toggle" type="button" data-action="steps" data-id="${p.id}" aria-expanded="${open}" aria-controls="steps-${p.id}-${variantIndex(p.id)}">${open ? 'Hide' : 'Show'} step-by-step solution</button>${open ? `<div class="inline-solution-body" id="steps-${p.id}-${variantIndex(p.id)}"><ol>${(p.solution || []).map(line=>`<li>${prose(line)}</li>`).join('')}</ol><div class="example-answers">${(p.fields || []).map(field=>`<p><strong>${escapeHTML(field.label)}:</strong> ${prose(field.answer)}</p>`).join('')}</div>${review.map(field=>`<div class="inline-reflection"><p>Compare your explanation of “${escapeHTML(field.label)}” with these steps. Different wording can express the same idea.</p><button class="outline-button" data-action="self-review-inline" data-id="${p.id}" data-key="${escapeHTML(field.key)}">My explanation matches</button></div>`).join('')}</div>` : ''}</section>`;
}
function showInlineSolution(id,toggle = false) {
  if (!canShowSolutions(current(id))) return;
  cancelAdvance();
  const key = keyFor(id);
  if (toggle && expandedSolutions.has(key)) expandedSolutions.delete(key); else expandedSolutions.add(key);
  render();
}
function checkAnswers(id) {
  const p = current(id);
  cancelAdvance();
  for (const field of p.fields || []) {
    if (isPlotField(p,field)) state.plotChecked[keyFor(id)] = true;
    else state.checked[keyFor(id,field.key)] = true;
  }
  const record = recordCheck(state.progress,{id:p.id,variant:variantIndex(id),fields:fieldStatuses(p)});
  render(); persist();
  if (record.complete) scheduleAdvance(p);
  else if (Object.values(record.fields).includes('review')) notify(canShowSolutions(p) ? 'Open the example steps to review your explanation.' : 'Your explanation is saved. Review your reasoning using the question and diagram.');
}
function fieldStatuses(p) {
  const previous = state.progress.records[keyFor(p.id)];
  return (p.fields || []).map(field=> {
    let status = isPlotField(p,field) ? graphStatus(p) : evaluate(field,state.answers[keyFor(p.id,field.key)] || '').status;
    if (status === 'review' && previous?.fields?.[field.key] === 'self-reviewed') status = 'self-reviewed';
    return {key:field.key,status};
  });
}
function graphStatus(p) {
  const expected = expectedPoints(p), points = state.plots[keyFor(p.id)] || [];
  if (!points.length) return 'blank';
  const matching = points.length === expected.length && expected.every(pt=>points.some(a=>Math.abs(a[0]-pt[0])<1e-7&&Math.abs(a[1]-pt[1])<1e-7));
  return matching && state.lines[keyFor(p.id)] ? 'correct' : 'incorrect';
}
function invalidateProgress(id,fieldKey) {
  cancelAdvance();
  const record = state.progress.records[keyFor(id)];
  if (!record) return;
  if (fieldKey) record.fields[fieldKey] = 'blank';
  else for (const field of current(id).fields || []) if (isPlotField(current(id),field)) record.fields[field.key] = 'blank';
  record.complete = false;
}
function cancelAdvance() {
  autoAdvance.cancel();
  const banner = document.querySelector('#advance-banner'); if (banner) banner.hidden = true;
}
function scheduleAdvance(p) {
  const index = problems.findIndex(item=>Number(item.id) === Number(p.id));
  const target = problems[index+1];
  if (!target || !state.autoNext) { notify('All answers checked. Your progress is saved.'); return; }
  if (Number(state.question) !== Number(p.id)) { state.question = Number(p.id); state.page = pageFor(p.id); }
  const pending = {id:p.id,variant:variantIndex(p.id),target:target.id};
  autoAdvance.start(pending,3000);
  const banner = document.querySelector('#advance-banner');
  banner.innerHTML = `<span>Problem ${p.id} complete. Next problem in 3 seconds.</span><div><button type="button" data-advance="stay">Stay here</button><button type="button" data-advance="review">Review</button><button type="button" data-advance="next">Next now →</button></div>`;
  banner.hidden = false;
}
function progressStatus(id,variant = 0) {
  const record = state.progress.records[`${id}:${variant}`];
  if (!record) return {text:'Not checked',className:'status-unstarted',symbol:'○'};
  if (record.complete) return {text:Object.values(record.fields || {}).includes('self-reviewed') ? 'Complete · self-reviewed' : 'Correct',className:'status-complete',symbol:'✓'};
  if (Object.values(record.fields || {}).includes('incorrect')) return {text:'Needs another try',className:'status-missed',symbol:'!'};
  if (Object.values(record.fields || {}).includes('review')) return {text:'Self-review needed',className:'status-review',symbol:'↺'};
  return {text:'In progress',className:'status-started',symbol:'•'};
}
function checkSummary(p) {
  const record = state.progress.records[keyFor(p.id)];
  if (!record) return '';
  const status = progressStatus(p.id,variantIndex(p.id));
  const needsReview = Object.values(record.fields || {}).includes('review');
  return `<div class="check-summary ${status.className}" role="status"><span>${status.symbol} ${status.text} · ${record.attempts} ${record.attempts === 1 ? 'check' : 'checks'}</span>${needsReview ? `<button class="soft-button small-button" data-action="review" data-id="${p.id}">Review explanation</button>` : ''}</div>`;
}
function sourceFor(p) { const v = variantIndex(p.id); return `./diagrams/q${String(p.id).padStart(2,'0')}${v ? '-v'+v : ''}.svg`; }
function geometryMarkup(p) {
  return p.generated ? diagramMarkup(p,{answer:false}) : `<img class="diagram-image" src="${sourceFor(p)}" alt="Diagram for problem ${p.id}: ${escapeHTML(p.topic || '')}">`;
}
function problemTags(p) { return `${variantIndex(p.id) ? `<span class="variant-tag">Extra example ${variantIndex(p.id)}</span>` : (p.concept ? '<span class="concept-tag">Concept check</span>' : '')}`; }
function toolbar(packet = false) {
  const pg = data.pages[state.page];
  return `<div class="workspace-toolbar"><div class="section-select-wrap"><span class="eyebrow">${packet ? 'Your virtual packet' : state.view === 'practice' ? 'Extra practice' : 'Explore the lesson'}</span><select class="section-select" id="section-select" aria-label="Choose a section">${data.pages.map((page,index)=>`<option value="${index}" ${index === state.page ? 'selected' : ''}>${escapeHTML(page.title)}</option>`).join('')}</select></div><div class="toolbar-right"><span class="page-count">Page ${state.page+1} of ${data.pages.length}</span></div></div><div class="question-jump"><span class="jump-label">Problems</span>${pg.problems.map(p=>`<button type="button" data-action="jump" data-id="${p.id}" class="${Number(p.id) === Number(state.question) ? 'active' : ''} ${hasAnswers(p.id) ? 'answered' : ''}" aria-label="Problem ${p.id}" aria-current="${Number(p.id) === Number(state.question) ? 'true' : 'false'}">${p.id}</button>`).join('')}</div>`;
}
function hasAnswers(id) { const prefix = keyFor(id)+':'; return Object.entries(state.answers).some(([key,value])=>key.startsWith(prefix)&&String(value).trim()); }
function renderLesson() {
  const p = current();
  const isGraph = p.diagram?.type === 'graph';
  const visual = p.diagram ? isGraph ? graphMarkup(p) : geometryMarkup(p) : `<div class="text-visual"><div class="text-visual-symbol" aria-hidden="true">${(p.topic || '').toLowerCase().includes('ratio') ? 'a : b' : 'x'}</div><p>${prose(p.prompt)}</p></div>`;
  app.innerHTML = toolbar()+`<div class="lesson-layout"><section class="visual-panel" aria-label="Problem visualization"><div class="visual-topbar"><span class="eyebrow">${isGraph ? p.diagram.student_plot ? 'Your graph' : 'Read the graph' : p.diagram ? 'See the mathematics' : 'Think it through'}</span><div class="visual-tools"><button type="button" data-action="zoom-out" title="Zoom out" aria-label="Zoom out">−</button><button type="button" data-action="zoom-reset" title="Reset zoom" aria-label="Reset zoom">↺</button><button type="button" data-action="zoom-in" title="Zoom in" aria-label="Zoom in">+</button><button type="button" data-action="visual-fullscreen" title="Enlarge visualization" aria-label="Enlarge visualization">⛶</button></div></div><div id="visual-stage" class="visual-stage">${visual}</div><div class="visual-note" id="visual-note">${isGraph && p.diagram.student_plot ? 'Tap the grid or enter coordinates below it.' : 'The picture and question use the same measurements.'}</div></section>
    <section class="problem-panel ${isGraph ? 'graph-problem-panel' : ''}" aria-label="Problem ${p.id}"><div class="problem-content"><div class="problem-topline"><span class="problem-number">PROBLEM ${p.id}</span>${problemTags(p)}</div><h1 class="problem-prompt">${prose(p.prompt)}</h1>${answerFields(p)}${checkSummary(p)}${solutionsMarkup(p)}</div><div class="problem-footer"><div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check answers</button><button class="outline-button" data-action="hint" data-id="${p.id}">Hint</button><button class="soft-button" data-action="packet" data-id="${p.id}">Packet ↗</button></div><div class="example-controls"><button class="outline-button small-button" data-action="example" data-id="${p.id}" ${highestExample(p.id) >= MAX_EXAMPLE_INDEX ? 'disabled' : ''}>New example ↻</button>${variantIndex() ? `<button class="quiet-button" data-action="original" data-id="${p.id}">Packet original</button>` : ''}<span>${variantIndex() ? `Example ${variantIndex()}` : 'Practice with new values'}</span></div><div class="compact-nav"><button class="outline-button" data-action="previous" ${Number(p.id) === Number(problems[0].id) ? 'disabled' : ''} aria-label="Previous problem">← Previous</button><label class="auto-next-label"><input type="checkbox" data-auto-next ${state.autoNext ? 'checked' : ''}> Auto-next</label><button class="outline-button" data-action="next" ${Number(p.id) === Number(problems.at(-1).id) ? 'disabled' : ''}>Next →</button></div></div></section></div>`;
  mountLessonInteractive(p);
}
function reviewAnswers(p) { return checkSummary(p); }
function mountLessonInteractive(p) {
  const container = document.querySelector('#visual-stage');
  if (p.diagram?.type === 'graph' || !interactiveModule?.mountInteractive) return;
  const fallback = container.innerHTML;
  try {
    const result = interactiveModule.mountInteractive(container,p,{variantIndex:variantIndex(p.id),allowSolutions:canShowSolutions(p),theme:state.theme,reducedMotion:matchMedia('(prefers-reduced-motion: reduce)').matches});
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
    return `<article class="packet-card ${graph ? 'graph-card' : ''} ${Number(p.id) === Number(state.question) ? 'is-selected' : ''}" data-card-id="${p.id}"><div class="problem-topline"><span class="problem-number">${p.id}.</span>${problemTags(p)}</div><h2 class="problem-prompt">${prose(p.prompt)}</h2><div ${graph ? 'class="graph-packet-grid"' : ''}>${p.diagram ? graph ? graphMarkup(p) : `<div class="diagram-wrap">${geometryMarkup(p)}</div>` : ''}<div>${answerFields(p,true)}${solutionsMarkup(p)}<div class="problem-actions"><button class="primary-button" data-action="check" data-id="${p.id}">Check</button><button class="soft-button" data-action="lesson" data-id="${p.id}">Go to Visualization ↗</button><button class="outline-button" data-action="example" data-id="${p.id}" ${highestExample(p.id) >= MAX_EXAMPLE_INDEX ? 'disabled' : ''}>New example ↻</button>${variantIndex(p.id) ? `<button class="outline-button" data-action="original" data-id="${p.id}">Original</button>` : ''}</div>${reviewAnswers(p)}</div></div></article>`;
  }).join('')}</div></section><div class="packet-bottom"><button class="outline-button" data-action="page-previous" ${state.page === 0 ? 'disabled' : ''}>← Previous page</button><span>Packet originals and extra practice. Answers save as you go.</span><button class="primary-button" data-action="page-next" ${state.page === data.pages.length-1 ? 'disabled' : ''}>Next page →</button></div>`;
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
  const overlay = canShowSolutions(p) && expandedSolutions.has(keyFor(p.id)) && d.student_plot && expected.length ? `<polyline fill="none" stroke="#b16f32" stroke-width="2.2" stroke-dasharray="6 5" points="${expected.map(pt=>pos(...pt).join(',')).join(' ')}"/>${expected.map(pt=>`<circle cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="7" fill="none" stroke="#b16f32" stroke-width="2"/>`).join('')}` : '';
  return `<div class="graph-plot-wrap"><div class="graph-shell"><svg viewBox="0 0 560 440" role="img" aria-label="${escapeHTML(d.student_plot ? 'Interactive graph. Tap grid intersections to place points.' : 'Graph for this problem.')}" data-graph-id="${p.id}" data-graph-origin-x="${x0}" data-graph-origin-y="${y0}" data-graph-cell="${cell}" data-graph-xstep="${xstep}" data-graph-ystep="${ystep}" data-graph-xmax="${xmax}" data-graph-ymax="${ymax}" data-graph-editable="${Boolean(d.student_plot)}">${grid}<line x1="${x0}" y1="${y0}" x2="${x0+gw+10}" y2="${y0}" class="graph-axis"/><line x1="${x0}" y1="${y0}" x2="${x0}" y2="${y0-gh-10}" class="graph-axis"/><path d="M${x0+gw+5},${y0-4} L${x0+gw+10},${y0} L${x0+gw+5},${y0+4} M${x0-4},${y0-gh-5} L${x0},${y0-gh-10} L${x0+4},${y0-gh-5}" fill="none" class="graph-axis"/><text x="${x0+gw/2}" y="${y0+50}" text-anchor="middle" class="graph-label">${escapeHTML(d.xlabel || 'x')}</text><text x="${x0-50}" y="${y0-gh/2}" text-anchor="middle" class="graph-label" transform="rotate(-90 ${x0-50} ${y0-gh/2})">${escapeHTML(d.ylabel || 'y')}</text>${givenLine}${overlay}${joined}${points.map(pt=>`<circle class="graph-point" cx="${pos(...pt)[0]}" cy="${pos(...pt)[1]}" r="6"/>`).join('')}</svg></div>${d.student_plot ? `<div class="graph-controls"><label><input type="checkbox" data-join-id="${p.id}" ${state.lines[key] ? 'checked' : ''}> Join my points</label><button class="soft-button small-button" data-action="check-graph" data-id="${p.id}">Check graph</button><button class="outline-button small-button" data-action="clear-graph" data-id="${p.id}">Clear points</button></div><div class="graph-coordinate-entry" data-problem-id="${p.id}"><label>x <input class="coordinate-input" data-coordinate="x" type="text" inputmode="text" min="0" max="${xmax}" step="${xstep}" aria-label="Point x coordinate"></label><label>y <input class="coordinate-input" data-coordinate="y" type="text" inputmode="text" min="0" max="${ymax}" step="${ystep}" aria-label="Point y coordinate"></label><button class="outline-button small-button" type="button" data-action="add-coordinate" data-id="${p.id}">Add point</button></div><div class="point-chips">${points.map((pt,index)=>`<button type="button" data-action="remove-point" data-id="${p.id}" data-index="${index}" aria-label="Remove point ${pt.join(', ')}">(${pt.map(formatNumber).join(', ')}) ×</button>`).join('')}</div><p class="graph-tip">Tap a grid intersection to place or remove a point.</p>${state.plotChecked[key] ? `<p class="graph-feedback">${escapeHTML(graphFeedback(p))}</p>` : ''}` : ''}</div>`;
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
  document.body.dataset.view = state.view;
  document.querySelectorAll('[data-view]').forEach(button=> {
    const active = button.dataset.view === state.view; button.classList.toggle('active',active); button.setAttribute('aria-current',active ? 'page' : 'false');
  });
  const stepsButton = document.querySelector('#solutions-toggle');
  stepsButton.hidden = !canShowSolutions(current());
  stepsButton.setAttribute('aria-pressed',String(expandedSolutions.has(keyFor(state.question))));
  document.querySelector('#theme-toggle').setAttribute('aria-label',`Switch to ${state.theme === 'dark' ? 'light' : 'dark'} theme`);
  state.view === 'packet' ? renderPacket() : renderLesson();
  app.querySelectorAll('.answer-line textarea').forEach(sizeAnswer);
  applyPresentation();
  app.setAttribute('aria-busy','false'); updateSavedStatus();
}

function dialogFrame(title,body,footer = '') {
  return `<div class="dialog-header"><h2 id="dialog-title">${escapeHTML(title)}</h2><button class="icon-button" type="button" data-dialog-action="close" aria-label="Close dialog">×</button></div><div class="dialog-body">${body}</div>${footer ? `<div class="dialog-footer">${footer}</div>` : ''}`;
}
function openDialog(kind,options = {}) {
  if (!data) return;
  cancelAdvance();
  if (kind === 'help') {
    const id = options.id || state.question, extra = canShowSolutions(current(id));
    if (extra && ['solution','review'].includes(options.tab)) { closeDialog(); showInlineSolution(id); return; }
    if (options.tab === 'solution') options = {...options,tab:'hint'};
  }
  dialogState = {kind,...options};
  renderDialog();
  const dialog = document.querySelector('#study-dialog');
  if (!dialog.open) dialog.showModal();
}
function closeDialog() {
  const dialog = document.querySelector('#study-dialog');
  if (dialog.open) dialog.close();
  dialogState = null; pendingImport = null;
  releaseDownloadURLs();
}
function renderDialog() {
  if (!dialogState) return;
  const summary = summarizeProgress(state.progress,problems,state.variants);
  let markup = '';
  if (dialogState.kind === 'contents') {
    markup = dialogFrame('Table of contents',`<p class="dialog-intro">Choose a packet problem. Your original and extra-example answers are saved separately.</p><div class="toc-list">${data.pages.map((page,index)=> {
      const complete = page.problems.filter(p=>state.progress.records[`${p.id}:0`]?.complete).length;
      return `<details class="toc-section" ${index === state.page ? 'open' : ''}><summary><span>${escapeHTML(page.title)}<small>Problems ${page.problems[0].id}–${page.problems.at(-1).id}</small></span><span class="toc-count">${complete}/${page.problems.length} complete</span></summary><div class="toc-problem-list">${page.problems.map(p=> {
        const status = progressStatus(p.id), extras = Object.entries(state.progress.records).filter(([key,entry])=>key.startsWith(p.id+':')&&Number(key.split(':')[1])>0&&entry.complete).length;
        return `<button type="button" class="toc-problem ${status.className}" data-dialog-action="jump" data-id="${p.id}" data-variant="0"><strong>${p.id}. ${escapeHTML(p.topic || '')}</strong><span>${status.symbol} ${status.text}${extras ? ` · ${extras} extras complete` : ''}</span></button>`;
      }).join('')}</div></details>`;
    }).join('')}</div>`,`<span>${summary.overall.mainComplete} of ${summary.overall.mainTotal} packet problems complete</span><button class="soft-button" data-dialog-action="progress">View progress</button>`);
  } else if (dialogState.kind === 'progress') {
    const total = summary.overall;
    markup = dialogFrame('Your progress',`<p class="dialog-intro">Saved on this browser. Correct answers and self-reviewed explanations count as complete; untouched answers are never graded.</p><div class="progress-overview"><div><strong>${total.mainComplete} / ${total.mainTotal}</strong><span>Packet complete</span></div><div><strong>${total.extraComplete}</strong><span>Extra examples complete</span></div><div><strong>${total.totalAttempts}</strong><span>Answer checks</span></div></div>${summary.recommendedId ? `<button class="primary-button recommended-button" data-dialog-action="jump" data-id="${summary.recommendedId}" data-variant="${summary.recommendedVariant}">Recommended: problem ${summary.recommendedId}${summary.recommendedVariant ? `, extra ${summary.recommendedVariant}` : ''} →</button>` : '<p>Every packet problem is complete. Generate another example whenever you want more practice.</p>'}<h3>What to review</h3>${summary.targetedReview.length ? `<div class="review-list">${summary.targetedReview.map(item=>`<button class="review-item" data-dialog-action="jump" data-id="${item.id}" data-variant="${item.variant}"><strong>Problem ${item.id}${item.variant ? ` · Extra ${item.variant}` : ''}: ${escapeHTML(item.topic)}</strong><span>${escapeHTML(item.reason)} ${escapeHTML(item.hint)}</span></button>`).join('')}</div>` : '<p>No checked answers currently need another try. Keep going with the recommended problem.</p>'}<details class="skill-details"><summary>Skill summary</summary><div class="skill-list">${summary.topics.map(skill=>`<div class="skill-card"><strong>${escapeHTML(skill.topic)}</strong><span>${skill.mainComplete}/${skill.mainTotal} packet · ${skill.extraComplete} extra complete</span>${skill.missedIds.length ? `<small>Review: ${skill.missedIds.join(', ')}</small>` : ''}</div>`).join('')}</div></details><section class="report-section"><h3>Save or share your work</h3><p>Reports include your answers and checks. A JSON backup moves your saved work to another device. Nothing is sent automatically.</p><label class="report-name-label" for="report-name">Student name (optional)</label><input id="report-name" maxlength="100" value="${escapeHTML(reportName)}" autocomplete="off"><div class="report-actions"><a class="outline-button" data-report-link="text" href="#" download="Study_for_Test_1_Progress.txt">Download report</a><a class="outline-button" data-report-link="csv" href="#" download="Study_for_Test_1_Progress.csv">Download CSV</a><a class="outline-button" data-report-link="backup" href="#" download="Study_for_Test_1_Backup.json">Download backup</a><button class="outline-button" data-dialog-action="restore">Restore backup</button></div></section>`,`<label class="auto-next-label"><input type="checkbox" data-dialog-auto-next ${state.autoNext ? 'checked' : ''}> Automatically move on after a fully correct check</label>`);
  } else if (dialogState.kind === 'help') {
    const p = current(dialogState.id), tab = dialogState.tab === 'review' ? 'review' : 'hint';
    const record = state.progress.records[keyFor(p.id)];
    const review = (p.fields || []).filter(field=>record?.fields?.[field.key] === 'review');
    const guidance = canShowSolutions(p) ? p.hint : originalHint(p);
    const body = tab === 'hint' ? `<div class="hint-box"><strong>A place to start</strong><p>${prose(guidance)}</p></div>` : review.length ? review.map(field=>`<section class="reflection-card"><h3>${escapeHTML(field.label)}</h3><p><strong>Your explanation:</strong> ${prose(state.answers[keyFor(p.id,field.key)] || '')}</p><p>${prose(guidance)}</p><p>Check that you addressed every part, used the measurements and units consistently, and explained why your reasoning works. Ask your teacher if you are unsure.</p><button class="primary-button" data-dialog-action="self-review" data-key="${escapeHTML(field.key)}">I reviewed my reasoning</button></section>`).join('') : '<p>No explanation is waiting for review. Check your answers first.</p>';
    markup = dialogFrame(`Problem ${p.id} · ${variantIndex(p.id) ? 'Extra example '+variantIndex(p.id) : 'Packet original'}`,`<div class="help-tabs"><button class="${tab === 'hint' ? 'primary-button' : 'outline-button'}" data-dialog-action="help-tab" data-tab="hint">Concept hint</button>${review.length ? `<button class="${tab === 'review' ? 'primary-button' : 'outline-button'}" data-dialog-action="help-tab" data-tab="review">Review reasoning</button>` : ''}</div>${body}`);
  } else if (dialogState.kind === 'restore' && pendingImport) {
    const imported = summarizeProgress(pendingImport.progress || createProgressState(),problems,pendingImport.variants);
    const answers = Object.values(pendingImport.answers || {}).filter(value=>String(value).trim()).length;
    markup = dialogFrame('Restore this backup?',`<p>This backup contains <strong>${answers} saved ${answers === 1 ? 'answer' : 'answers'}</strong> and <strong>${imported.overall.mainComplete} completed packet ${imported.overall.mainComplete === 1 ? 'problem' : 'problems'}</strong>.</p><p>Restoring replaces the answers, graphs, and progress currently saved in this browser. Download your current backup first if you want to keep both.</p><p>You will resume at problem ${pendingImport.question || imported.recommendedId || problems[0].id}.</p>`,`<a class="outline-button" data-report-link="backup" href="#" download="Study_for_Test_1_Backup.json">Download current backup</a><button class="outline-button" data-dialog-action="close">Cancel</button><button class="primary-button" data-dialog-action="confirm-restore">Replace progress</button>`);
  }
  document.querySelector('#dialog-content').innerHTML = markup;
  refreshDownloadLinks();
}
function releaseDownloadURLs() {
  const previous = downloadURLs; downloadURLs = [];
  if (previous.length) setTimeout(()=>previous.forEach(url=>URL.revokeObjectURL(url)),30000);
}
function refreshDownloadLinks() {
  if (!data || !dialogState || !['progress','restore'].includes(dialogState.kind)) return;
  const links = document.querySelectorAll('#study-dialog [data-report-link]');
  if (!links.length) return;
  releaseDownloadURLs();
  for (const link of links) {
    const kind = link.dataset.reportLink;
    const contents = kind === 'text' ? makeReportText({data,state,studentName:reportName}) : kind === 'csv' ? makeReportCSV({data,state,studentName:reportName}) : JSON.stringify(makeBackup({state}),null,2);
    const type = kind === 'text' ? 'text/plain;charset=utf-8' : kind === 'csv' ? 'text/csv;charset=utf-8' : 'application/json';
    const url = URL.createObjectURL(new Blob([contents],{type}));
    downloadURLs.push(url); link.href = url;
  }
}

document.querySelectorAll('[data-view]').forEach(button=>button.addEventListener('click',()=>setView(button.dataset.view)));
document.querySelector('.brand').addEventListener('click',event=> { event.preventDefault(); selectProblem(problems[0]?.id || 1,'lesson'); });
document.querySelector('#contents-toggle').addEventListener('click',()=>openDialog('contents'));
document.querySelector('#progress-toggle').addEventListener('click',()=>openDialog('progress'));
document.querySelector('#solutions-toggle').addEventListener('click',()=>showInlineSolution(state.question,true));
document.querySelector('#theme-toggle').addEventListener('click',()=> {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'; document.body.classList.toggle('dark',state.theme === 'dark'); persist(); if (data) { render(); saveURL(); }
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
  cancelAdvance();
  for (const key of ['answers','plots','lines','checked','plotChecked']) state[key] = {};
  state.progress = createProgressState();
  render(); persist(); notify('Saved answers cleared.');
});
app.addEventListener('input',event=> {
  cancelAdvance();
  if (event.target.matches('[data-table-key]')) {
    const input = event.target;
    const key = input.dataset.tableKey;
    const values = [...input.closest('tbody').querySelectorAll('input')].map(el=>el.value.trim());
    state.answers[key] = values.some(Boolean) ? values.join(', ') : '';
    state.checked[key] = false;
    invalidateProgress(input.dataset.problemId,key.split(':').at(-1)); updateInlineSummary(input.dataset.problemId);
    const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
    persist(); return;
  }
  const input = event.target.closest('[data-answer-key]');
  if (!input) return;
  if (input.tagName === 'TEXTAREA') sizeAnswer(input);
  state.answers[input.dataset.answerKey] = input.value; state.checked[input.dataset.answerKey] = false;
  invalidateProgress(input.dataset.problemId,input.dataset.answerKey.split(':').at(-1)); updateInlineSummary(input.dataset.problemId);
  const field = input.closest('.answer-field'); field.classList.remove('correct','incorrect','review'); field.querySelector('.field-feedback')?.remove();
  persist();
});
function sizeAnswer(input) { input.style.height = 'auto'; input.style.height = `${Math.max(38,input.scrollHeight)}px`; }
function updateInlineSummary(id) {
  const summary = app.querySelector(`[data-card-id="${id}"] .check-summary`) || (Number(state.question) === Number(id) ? app.querySelector('.problem-panel .check-summary') : null);
  if (summary) summary.outerHTML = checkSummary(current(id));
}
app.addEventListener('change',event=> {
  if (event.target.id === 'section-select') { const page = data.pages[Number(event.target.value)]; selectProblem(page.problems[0].id,state.view); }
  if (event.target.matches('[data-auto-next]')) { state.autoNext = event.target.checked; cancelAdvance(); persist(); }
  if (event.target.matches('[data-join-id]')) { invalidateProgress(event.target.dataset.joinId); state.lines[keyFor(event.target.dataset.joinId)] = event.target.checked; state.plotChecked[keyFor(event.target.dataset.joinId)] = false; render(); persist(); }
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
  invalidateProgress(svg.dataset.graphId); state.plots[key] = points; state.plotChecked[key] = false; render(); persist();
});
app.addEventListener('click',async event=> {
  const button = event.target.closest('[data-action]'); if (!button || button.disabled) return;
  const id = Number(button.dataset.id || state.question); const action = button.dataset.action;
  if (action === 'jump') selectProblem(id,state.view,state.view === 'packet');
  else if (action === 'lesson') selectProblem(id,'lesson');
  else if (action === 'packet') selectProblem(id,'packet',true);
  else if (action === 'check') checkAnswers(id);
  else if (action === 'hint') openDialog('help',{id,tab:'hint'});
  else if (action === 'review') openDialog('help',{id,tab:'review'});
  else if (action === 'steps') showInlineSolution(id,true);
  else if (action === 'self-review-inline') {
    const p = current(id), field = p.fields.find(f=>f.key === button.dataset.key);
    if (!canShowSolutions(p) || !field || field.value !== null || field.accepted?.length || evaluate(field,state.answers[keyFor(id,field.key)] || '').status !== 'review') return;
    const record = recordSelfReview(state.progress,{id,variant:variantIndex(id),fieldKeys:[field.key]}); render(); persist(); if (record?.complete) scheduleAdvance(p);
  }
  else if (action === 'example') nextExample(id);
  else if (action === 'original') { chooseExample(id,0); selectProblem(id,state.view === 'practice' ? 'lesson' : state.view); }
  else if (action === 'original-page') { cancelAdvance(); data.pages[state.page].problems.forEach(p=>state.variants[p.id]=0); render(); persist(); }
  else if (action === 'previous' || action === 'next') { const index = problems.findIndex(p=>Number(p.id) === Number(state.question)); const p = problems[index+(action === 'next' ? 1 : -1)]; if (p) selectProblem(p.id); }
  else if (action === 'page-previous' || action === 'page-next') { const page = data.pages[state.page+(action === 'page-next' ? 1 : -1)]; if (page) { selectProblem(page.problems[0].id,'packet'); window.scrollTo({top:0,behavior:'smooth'}); } }
  else if (action === 'download') document.querySelector('#download-menu').hidden = false;
  else if (action.startsWith('zoom-')) {
    if (typeof cleanupInteractive?.zoom === 'function') { cleanupInteractive.zoom(action); return; }
    const image = document.querySelector('#visual-stage .diagram-image');
    if (image) { let z = Number(image.dataset.zoom || 1); z = action === 'zoom-reset' ? 1 : Math.max(.5,Math.min(2,z+(action === 'zoom-in' ? .2 : -.2))); image.dataset.zoom = z; image.style.transform = `scale(${z})`; }
    else notify('Use the controls in this visualization, or enlarge it.');
  } else if (action === 'visual-fullscreen') {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.querySelector('#visual-stage').requestFullscreen(); } catch { openPresentation('visual'); }
  } else if (action === 'check-graph') checkAnswers(id);
  else if (action === 'clear-graph') { invalidateProgress(id); state.plots[keyFor(id)] = []; state.plotChecked[keyFor(id)] = false; render(); persist(); }
  else if (action === 'remove-point') { invalidateProgress(id); (state.plots[keyFor(id)] || []).splice(Number(button.dataset.index),1); state.plotChecked[keyFor(id)] = false; render(); persist(); }
  else if (action === 'add-coordinate') {
    const group = button.closest('.graph-coordinate-entry'), p = current(id), d = p.diagram;
    const x = parseNumber(group.querySelector('[data-coordinate="x"]').value), y = parseNumber(group.querySelector('[data-coordinate="y"]').value);
    if (!Number.isFinite(x) || !Number.isFinite(y) || x<0 || y<0 || x>d.xmax || y>d.ymax || Math.abs(x/d.xstep-Math.round(x/d.xstep))>1e-7 || Math.abs(y/d.ystep-Math.round(y/d.ystep))>1e-7) { notify('Enter coordinates at a labeled grid intersection.'); return; }
    const points = state.plots[keyFor(id)] || [];
    if (points.some(pt=>Math.abs(pt[0]-x)<1e-7&&Math.abs(pt[1]-y)<1e-7)) { notify('That point is already on your graph.'); return; }
    invalidateProgress(id); state.plots[keyFor(id)] = [...points,[x,y]]; state.plotChecked[keyFor(id)] = false; render(); persist();
    app.querySelector(`.graph-coordinate-entry[data-problem-id="${id}"] [data-coordinate="x"]`)?.focus();
  }
});
document.addEventListener('keydown',event=> {
  if (event.key === 'Escape') { document.querySelector('#download-menu').hidden = true; if (document.querySelector('#study-dialog').open) return; cancelAdvance(); if (presentationMode) { event.preventDefault(); closePresentation(); } }
  if (event.key === 'Tab' && presentationMode === 'visual') {
    const focusable = [...document.querySelectorAll('#visual-stage button:not([disabled]),#visual-stage input:not([disabled]),#visual-stage select:not([disabled]),#visual-stage textarea:not([disabled]),#visual-stage [tabindex="0"],#focus-close')];
    const currentIndex = focusable.indexOf(document.activeElement);
    if (focusable.length && (currentIndex < 0 || (!event.shiftKey && currentIndex === focusable.length-1) || (event.shiftKey && currentIndex === 0))) {
      event.preventDefault(); focusable[event.shiftKey ? focusable.length-1 : 0].focus();
    }
  }
  if (event.altKey && ['ArrowLeft','ArrowRight'].includes(event.key) && data && !document.querySelector('#study-dialog').open) {
    event.preventDefault(); const i = problems.findIndex(p=>Number(p.id) === Number(state.question));
    const p = problems[i+(event.key === 'ArrowRight' ? 1 : -1)]; if (p) selectProblem(p.id);
  }
});
document.querySelector('#advance-banner').addEventListener('click',event=> {
  const action = event.target.closest('[data-advance]')?.dataset.advance;
  if (!action) return;
  if (action === 'next') autoAdvance.nextNow();
  else if (action === 'review') { const id = autoAdvance.pending?.id || state.question; cancelAdvance(); openDialog('help',{id,tab:'solution'}); }
  else { cancelAdvance(); notify('Staying here. Your checked answers are saved.'); }
});
document.querySelector('#study-dialog').addEventListener('cancel',event=> { event.preventDefault(); closeDialog(); });
document.querySelector('#study-dialog').addEventListener('click',event=> {
  const button = event.target.closest('[data-dialog-action]'); if (!button) return;
  const action = button.dataset.dialogAction;
  if (action === 'close') closeDialog();
  else if (action === 'progress') openDialog('progress');
  else if (action === 'jump') { const id = Number(button.dataset.id), variant = Number(button.dataset.variant || 0); closeDialog(); chooseExample(id,variant); selectProblem(id,variant ? 'practice' : 'lesson'); }
  else if (action === 'help-tab') openDialog('help',{id:dialogState.id,tab:button.dataset.tab});
  else if (action === 'self-review') {
    const p = current(dialogState.id), field = p.fields.find(f=>f.key === button.dataset.key);
    if (!field || field.value !== null || field.accepted?.length || evaluate(field,state.answers[keyFor(p.id,field.key)] || '').status !== 'review') return;
    const record = recordSelfReview(state.progress,{id:p.id,variant:variantIndex(p.id),fieldKeys:[field.key]});
    persist(); render();
    if (record?.complete) { closeDialog(); scheduleAdvance(p); } else renderDialog();
  } else if (action === 'restore') document.querySelector('#restore-input').click();
  else if (action === 'confirm-restore' && pendingImport) {
    const restored = pendingImport, imported = summarizeProgress(restored.progress || createProgressState(),problems,restored.variants);
    state = {...state,...restored,question:restored.question || imported.recommendedId || problems[0].id,view:restored.view || 'lesson',progress:restored.progress || createProgressState()};
    for (const key of ['answers','plots','lines','checked','plotChecked','variants','exampleIndices']) state[key] = restored[key] || {};
    if (typeof state.autoNext !== 'boolean') state.autoNext = true;
    reportName = state.studentName || ''; state.page = pageFor(state.question);
    closeDialog(); document.body.classList.toggle('dark',state.theme === 'dark'); render(); saveURL(); flushSave(); notify('Backup restored. Your progress is saved on this browser.');
  }
});
document.querySelector('#study-dialog').addEventListener('input',event=> {
  if (event.target.id === 'report-name') { reportName = event.target.value.slice(0,100); state.studentName = reportName; refreshDownloadLinks(); persist(); }
});
document.querySelector('#study-dialog').addEventListener('change',event=> {
  if (event.target.matches('[data-dialog-auto-next]')) { state.autoNext = event.target.checked; cancelAdvance(); refreshDownloadLinks(); persist(); render(); }
});
document.querySelector('#restore-input').addEventListener('change',async event=> {
  const file = event.target.files?.[0]; event.target.value = ''; if (!file) return;
  cancelAdvance();
  try {
    if (file.size > 4000000) throw Error('This backup is too large. Choose a Study for Test 1 JSON backup under 4 MB.');
    pendingImport = validateBackup(await file.text(),problems);
    openDialog('restore');
  } catch (error) { pendingImport = null; notify(`Backup not restored: ${error.message}`); }
});
window.addEventListener('pagehide',flushSave);
window.addEventListener('beforeunload',flushSave);
document.addEventListener('visibilitychange',()=> { if (document.hidden) { cancelAdvance(); flushSave(); } });

async function start() {
  try {
    data = packetData;
    if (!data || !Array.isArray(data.pages) || !data.pages.length) throw Error('The packet has no pages.');
    problems = data.pages.flatMap(page=>page.problems);
    reportName = typeof state.studentName === 'string' ? state.studentName.slice(0,100) : '';
    const url = new URL(window.location.href); const problem = Number(url.searchParams.get('problem')); const view = url.searchParams.get('view'); const example = Number(url.searchParams.get('example'));
    if (problem && problems.some(p=>Number(p.id) === problem)) state.question = problem;
    if (['lesson','packet','practice'].includes(view)) state.view = view;
    if (!problems.some(p=>Number(p.id) === Number(state.question))) state.question = problems[0].id;
    if (url.searchParams.has('example') && Number.isInteger(example) && example >= 0 && example <= MAX_EXAMPLE_INDEX) chooseExample(state.question,example);
    if (state.view === 'practice' && variantIndex() === 0) chooseExample(state.question,Math.min(MAX_EXAMPLE_INDEX,highestExample(state.question)+1));
    state.page = Math.max(0,pageFor()); render(); saveURL();
    window.studyPacketBoot?.ready();
    if (migratedProgress) notify('Packet updated. Saved answers for unchanged problems are still here.');
  } catch (error) {
    app.setAttribute('aria-busy','false');
    app.innerHTML = `<section class="error-state"><h1>The packet could not open.</h1><p>Your saved answers are safe on this browser. Reload to try again.</p><button class="primary-button" onclick="location.reload()">Reload</button></section>`;
    console.error(error);
    window.studyPacketBoot?.fail(error);
    return;
  }
  import('./interactives.js?v=8').then(module=> {
    interactiveModule = module;
    if (state.view !== 'packet' && document.querySelector('#visual-stage')) mountLessonInteractive(current());
  }).catch(error=>console.warn('Interactive lessons are unavailable; the packet diagrams remain usable.',error));
}
start();
