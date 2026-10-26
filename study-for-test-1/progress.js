/* Local learning records and portable, deliberately non-secure student reports. */
const FORMAT = 'study-for-test-1-backup';
const STATUSES = new Set(['correct','incorrect','blank','review','self-reviewed']);
const COMPLETE = new Set(['correct','self-reviewed']);
const MAPS = ['answers','plots','lines','checked','plotChecked','variants'];
const BAD_KEYS = new Set(['__proto__','prototype','constructor']);
const now = () => new Date().toISOString();
const plain = value => value !== null && typeof value === 'object' && !Array.isArray(value) && [Object.prototype,null].includes(Object.getPrototypeOf(value));
const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const finished = fields => Object.keys(fields).length > 0 && Object.values(fields).every(status=>COMPLETE.has(status));
const recordKey = (id,variant=0) => `${Number(id)}:${Number(variant)}`;
const safeCount = value => Number.isSafeInteger(value) && value >= 0 ? Math.min(value,1000000) : 0;
const timestamp = value => typeof value === 'string' && value.length <= 40 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : now();
const flatten = definitions => Array.isArray(definitions) ? definitions : (definitions?.pages || []).flatMap(page=>page.problems || []);
const actualProblem = (problem,variant) => variant ? {...problem,...problem.variants[variant-1],id:problem.id} : problem;
const isPlotField = (problem,field) => problem.diagram?.student_plot && /plot.*point/i.test(field.label || '');

export function createProgressState() { return {version:1,records:{}}; }

export function recordCheck(progress,{id,variant=0,fields=[],graphStatus,timestamp:checkedAt} = {}) {
  if (!Number.isInteger(Number(id)) || Number(id) < 1 || !Number.isInteger(Number(variant)) || Number(variant) < 0) throw new Error('A valid problem and example are required.');
  if (!plain(progress.records)) progress.records = {};
  progress.version = 1;
  const key = recordKey(id,variant), previous = progress.records[key] || {};
  const statuses = {};
  for (const field of fields) {
    if (!field || typeof field.key !== 'string' || BAD_KEYS.has(field.key) || field.key.length > 100) throw new Error('Invalid answer field.');
    statuses[field.key] = STATUSES.has(field.status) ? field.status : 'blank';
  }
  if (graphStatus !== undefined) statuses.$graph = STATUSES.has(graphStatus) ? graphStatus : 'blank';
  const complete = finished(statuses);
  const record = {
    attempts:Math.min(1000000,safeCount(previous.attempts)+1),
    totalCorrectChecks:Math.min(1000000,safeCount(previous.totalCorrectChecks)+(complete ? 1 : 0)),
    lastChecked:timestamp(checkedAt),fields:statuses,complete,
    lastReviewed:previous.lastReviewed || null,
  };
  progress.records[key] = record;
  return record;
}

export function recordSelfReview(progress,{id,variant=0,fieldKeys=[],timestamp:reviewedAt} = {}) {
  const record = progress?.records?.[recordKey(id,variant)];
  if (!record || !plain(record.fields)) return null;
  let changed = false;
  for (const key of fieldKeys) if (record.fields[key] === 'review') { record.fields[key] = 'self-reviewed'; changed = true; }
  if (changed) record.lastReviewed = timestamp(reviewedAt);
  record.complete = finished(record.fields);
  return record;
}

export function summarizeProgress(progress,definitions,variantsMap={}) {
  const problems = flatten(definitions), records = progress?.records || {};
  const overall = {mainTotal:problems.length,mainAttempted:0,mainComplete:0,extraTotal:0,extraAttempted:0,extraComplete:0,totalAttempts:0};
  const topics = new Map(), targetedReview = [], missed = new Set(), review = new Set();
  for (const base of problems) {
    const topic = base.topic || 'Mathematics';
    if (!topics.has(topic)) topics.set(topic,{topic,mainTotal:0,mainAttempted:0,mainComplete:0,extraTotal:0,extraAttempted:0,extraComplete:0,missedIds:[],reviewIds:[]});
    const skill = topics.get(topic); skill.mainTotal++;
    overall.extraTotal += (base.variants || []).length; skill.extraTotal += (base.variants || []).length;
    for (let variant=0;variant<=(base.variants || []).length;variant++) {
      const entry = records[recordKey(base.id,variant)];
      if (!entry) continue;
      const attempted = safeCount(entry.attempts)>0 || Object.values(entry.fields || {}).includes('self-reviewed');
      const complete = entry.complete === true && finished(entry.fields || {});
      const prefix = variant ? 'extra' : 'main';
      if (attempted) { overall[prefix+'Attempted']++; skill[prefix+'Attempted']++; }
      if (complete) { overall[prefix+'Complete']++; skill[prefix+'Complete']++; }
      overall.totalAttempts += safeCount(entry.attempts);
      const values = Object.values(entry.fields || {});
      if (!complete && values.includes('incorrect')) {
        missed.add(base.id); if (!skill.missedIds.includes(base.id)) skill.missedIds.push(base.id);
        targetedReview.push({id:base.id,variant,topic,reason:'An answer needs another look.',hint:actualProblem(base,variant).hint || 'Review the measurements and units, then try again.'});
      } else if (!complete && values.includes('review')) {
        review.add(base.id); if (!skill.reviewIds.includes(base.id)) skill.reviewIds.push(base.id);
        targetedReview.push({id:base.id,variant,topic,reason:'Compare your explanation with the sample answer.',hint:actualProblem(base,variant).hint || 'Check whether your explanation includes the same mathematical idea.'});
      }
    }
  }
  const mainComplete = problem => records[recordKey(problem.id)]?.complete === true && finished(records[recordKey(problem.id)]?.fields || {});
  let recommended = targetedReview.find(item=>item.variant===0) || null;
  if (!recommended) { const problem = problems.find(p=>!mainComplete(p)); if (problem) recommended = {id:problem.id,variant:0}; }
  if (!recommended) recommended = targetedReview[0] || null;
  if (!recommended) for (const problem of problems) {
    const preferred = Number(variantsMap[problem.id] || 0);
    const order = [...new Set([...(preferred > 0 ? [preferred] : []),...(problem.variants || []).map((_,i)=>i+1)])];
    const variant = order.find(index=>index<=(problem.variants || []).length && !records[recordKey(problem.id,index)]?.complete);
    if (variant) { recommended = {id:problem.id,variant}; break; }
  }
  return {overall,topics:[...topics.values()],missedIds:[...missed],reviewIds:[...review],targetedReview,recommendedId:recommended?.id ?? null,recommendedVariant:recommended?.variant ?? 0};
}

function reportRows(data,state) {
  const rows = [];
  for (const base of flatten(data)) for (let variant=0;variant<=(base.variants || []).length;variant++) {
    const key = recordKey(base.id,variant), entry = state.progress?.records?.[key];
    const problem = actualProblem(base,variant);
    const responses = (problem.fields || []).map(field=>({field,answer:isPlotField(problem,field) ? (state.plots?.[key] || []).map(pt=>`(${pt[0]}, ${pt[1]})`).join('; ') : String(state.answers?.[`${key}:${field.key}`] ?? ''),status:entry?.fields?.[field.key] || (isPlotField(problem,field) ? entry?.fields?.$graph : '') || 'not checked'}));
    if (variant && !entry && !responses.some(item=>item.answer.trim())) continue;
    rows.push({id:base.id,variant,topic:problem.topic || base.topic || 'Mathematics',prompt:problem.prompt,attempts:safeCount(entry?.attempts),complete:entry?.complete === true && finished(entry.fields || {}),entry,responses});
  }
  return rows;
}
function statusLabel(value) { return ({correct:'Correct',incorrect:'Needs review',blank:'Incomplete',review:'Self-review needed','self-reviewed':'Self-reviewed'})[value] || 'Not checked'; }

export function makeReportHTML({data,state,studentName='',createdAt=now()}) {
  const summary = summarizeProgress(state.progress,data,state.variants), rows = reportRows(data,state);
  const name = String(studentName).slice(0,100), title = data.title || 'Study for Test 1 Packet';
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHTML(name ? name+' — '+title : title)} — Progress report</title><style>body{font:15px/1.55 system-ui,sans-serif;color:#1c293c;max-width:1000px;margin:40px auto;padding:0 22px}h1{font-size:28px}h2{font-size:20px;margin-top:32px}h3{font-size:16px}p{margin:.5em 0}.muted{color:#5c697b}.summary{display:flex;gap:24px;flex-wrap:wrap;background:#edf2f7;padding:18px;border-radius:10px}.summary strong{display:block;font-size:23px}table{border-collapse:collapse;width:100%;margin:14px 0;font-size:13px}th,td{border-bottom:1px solid #d9dfe7;padding:9px;text-align:left;vertical-align:top}th{background:#f1f4f8}.response{white-space:pre-wrap;overflow-wrap:anywhere}.problem{border-top:1px solid #d9dfe7;padding-top:14px;margin-top:20px;break-inside:avoid}.status{font-size:12px;color:#5c697b}@media print{body{margin:10px;font-size:11px}.summary{padding:10px}h2{break-after:avoid}table{font-size:10px}}</style></head><body><h1>${escapeHTML(title)} — Progress report</h1>${name ? `<p><strong>Student:</strong> ${escapeHTML(name)}</p>` : ''}<p class="muted">Created ${escapeHTML(createdAt)}. This report reflects answers and self-reviews saved on one browser. It is not a verified grade.</p><div class="summary"><div><strong>${summary.overall.mainComplete} / ${summary.overall.mainTotal}</strong>packet problems complete</div><div><strong>${summary.overall.extraComplete}</strong>extra examples complete</div><div><strong>${summary.overall.totalAttempts}</strong>answer checks</div></div><h2>Skills to review</h2>${summary.targetedReview.length ? `<ul>${summary.targetedReview.map(item=>`<li><strong>Problem ${item.id}${item.variant ? `, extra example ${item.variant}` : ''} — ${escapeHTML(item.topic)}.</strong> ${escapeHTML(item.reason)} ${escapeHTML(item.hint)}</li>`).join('')}</ul>` : '<p>No checked answers currently need review. Unchecked problems are listed below.</p>'}<table><thead><tr><th>Skill</th><th>Packet complete</th><th>Extra examples complete</th><th>Review problems</th></tr></thead><tbody>${summary.topics.map(topic=>`<tr><td>${escapeHTML(topic.topic)}</td><td>${topic.mainComplete} / ${topic.mainTotal}</td><td>${topic.extraComplete}</td><td>${[...new Set([...topic.missedIds,...topic.reviewIds])].join(', ') || '—'}</td></tr>`).join('')}</tbody></table><h2>Answers and checks</h2>${rows.map(row=>`<section class="problem"><h3>Problem ${row.id}${row.variant ? ` · Extra example ${row.variant}` : ' · Packet original'} — ${escapeHTML(row.topic)}</h3><p>${escapeHTML(row.prompt)}</p><p class="status">${row.complete ? 'Complete' : row.attempts ? 'In progress' : 'Not checked'} · ${row.attempts} ${row.attempts===1 ? 'check' : 'checks'}${Object.values(row.entry?.fields || {}).includes('self-reviewed') ? ' · Includes student self-review' : ''}</p><table><thead><tr><th>Answer</th><th>Student response</th><th>Check</th></tr></thead><tbody>${row.responses.map(item=>`<tr><td>${escapeHTML(item.field.label)}</td><td class="response">${escapeHTML(item.answer || '—')}</td><td>${escapeHTML(statusLabel(item.status))}</td></tr>`).join('')}</tbody></table></section>`).join('')}</body></html>`;
}

export function makeReportCSV({data,state,studentName='',createdAt=now()}) {
  const cell = value => { let text=String(value ?? ''); if (/^[\s]*[=+@-]/.test(text) || /^[\t\r]/.test(text)) text="'"+text; return '"'+text.replace(/"/g,'""')+'"'; };
  const rows = [['Student','Created','Problem','Example','Skill','Complete','Checks','Answer field','Student response','Check result']];
  for (const row of reportRows(data,state)) for (const item of row.responses) rows.push([String(studentName).slice(0,100),createdAt,row.id,row.variant ? `Extra ${row.variant}` : 'Original',row.topic,row.complete ? 'Yes' : 'No',row.attempts,item.field.label,item.answer,statusLabel(item.status)]);
  return rows.map(row=>row.map(cell).join(',')).join('\r\n');
}

export function makeReportText({data,state,studentName='',createdAt=now()}) {
  const summary=summarizeProgress(state.progress,data,state.variants),rows=reportRows(data,state);
  const lines=[`${data.title || 'Study for Test 1 Packet'} — Progress report`];
  const name=String(studentName).slice(0,100);
  if(name)lines.push(`Student: ${name}`);
  lines.push(`Created: ${createdAt}`,'',
    'This report reflects answers and checks saved on one browser. It is not a verified grade.',
    'Correct = automatically checked. Self-reviewed = the student compared an explanation with a sample answer. Completion may include self-reviewed explanations. Unchecked answers do not count as complete.','',
    'PROGRESS',
    `Packet problems complete: ${summary.overall.mainComplete} / ${summary.overall.mainTotal}`,
    `Extra examples complete: ${summary.overall.extraComplete} / ${summary.overall.extraTotal}`,
    `Answer checks: ${summary.overall.totalAttempts}`);
  if(summary.recommendedId!==null)lines.push(`Recommended next: Problem ${summary.recommendedId}${summary.recommendedVariant ? `, extra example ${summary.recommendedVariant}` : ', packet original'}`);
  lines.push('','SKILLS');
  for(const topic of summary.topics)lines.push(`${topic.topic}: ${topic.mainComplete} / ${topic.mainTotal} packet problems complete; ${topic.extraComplete} extra examples complete. Review problems: ${[...new Set([...topic.missedIds,...topic.reviewIds])].join(', ') || 'none currently flagged'}.`);
  lines.push('','WHAT TO REVIEW');
  if(!summary.targetedReview.length)lines.push('No checked answers currently need review. Unchecked problems are listed below.');
  for(const item of summary.targetedReview)lines.push(`Problem ${item.id}${item.variant ? `, extra example ${item.variant}` : ''} — ${item.topic}`,`${item.reason} ${item.hint}`,'');
  lines.push('','ANSWERS AND CHECKS');
  for(const row of rows){
    lines.push('',`Problem ${row.id} — ${row.variant ? `Extra example ${row.variant}` : 'Packet original'} — ${row.topic}`,String(row.prompt || ''),
      `${row.complete ? 'Complete' : row.attempts ? 'In progress' : 'Not checked'}; ${row.attempts} ${row.attempts===1 ? 'check' : 'checks'}${Object.values(row.entry?.fields || {}).includes('self-reviewed') ? '; includes student self-review' : ''}.`);
    for(const item of row.responses)lines.push(`${item.field.label}${item.field.unit ? ` (${item.field.unit})` : ''}: ${item.answer || '[not entered]'}`,`Check: ${statusLabel(item.status)}`);
  }
  return lines.join('\n')+'\n';
}

export function makeBackup({state,createdAt=now()}) {
  const saved = {};
  for (const key of [...MAPS,'progress','autoNext','autonext','theme','question','view','studentName']) if (state[key] !== undefined) saved[key] = JSON.parse(JSON.stringify(state[key]));
  return {format:FORMAT,version:1,createdAt,state:saved};
}

export function validateBackup(value,definitions) {
  if (typeof value === 'string') { if (value.length > 5_000_000) throw new Error('The backup is too large.'); try { value = JSON.parse(value); } catch { throw new Error('This file is not valid JSON.'); } }
  if (!plain(value) || value.format !== FORMAT || value.version !== 1 || !plain(value.state)) throw new Error('Choose a Study for Test 1 backup file.');
  const problems = new Map(flatten(definitions).map(problem=>[Number(problem.id),problem]));
  const source = value.state, out = {answers:{},plots:{},lines:{},checked:{},plotChecked:{},variants:{},progress:createProgressState()};
  const entries = (object,label) => {
    if (object === undefined) return [];
    if (!plain(object)) throw new Error(`The ${label} section is invalid.`);
    const items = Object.entries(object);
    if (items.length > 10000 || items.some(([key])=>BAD_KEYS.has(key))) throw new Error(`The ${label} section is invalid.`);
    return items;
  };
  function identity(key,withField=false) {
    const match = String(key).match(withField ? /^(\d+):(\d+):([^:]+)$/ : /^(\d+):(\d+)$/);
    if (!match) throw new Error('A saved problem reference is invalid.');
    const id=Number(match[1]),variant=Number(match[2]),base=problems.get(id);
    if (!base || variant>(base.variants || []).length || String(key)!==`${id}:${variant}${withField ? ':'+match[3] : ''}`) throw new Error('The backup contains an unavailable problem or example.');
    const problem=actualProblem(base,variant),field=withField ? (problem.fields || []).find(f=>f.key===match[3]) : null;
    if (withField && (!field || BAD_KEYS.has(match[3]))) throw new Error('The backup contains an unknown answer field.');
    return {id,variant,problem,field};
  }
  for (const [key,answer] of entries(source.answers,'answers')) {
    identity(key,true); if (typeof answer !== 'string' || answer.length>10000) throw new Error('A saved answer is invalid or too long.'); out.answers[key]=answer;
  }
  for (const name of ['checked','lines','plotChecked']) for (const [key,value] of entries(source[name],name)) {
    const {problem}=identity(key,name==='checked');
    if (typeof value !== 'boolean' || (name!=='checked' && !problem.diagram?.student_plot)) throw new Error('A saved check is invalid.'); out[name][key]=value;
  }
  for (const [key,points] of entries(source.plots,'graphs')) {
    const {problem}=identity(key),d=problem.diagram;
    if (!d?.student_plot || !Array.isArray(points) || points.length>500) throw new Error('A saved graph is invalid.');
    out.plots[key]=points.map(point=>{
      if (!Array.isArray(point) || point.length!==2 || !point.every(n=>typeof n==='number' && Number.isFinite(n)) || point[0]<0 || point[1]<0 || point[0]>d.xmax || point[1]>d.ymax || Math.abs(point[0]/(d.xstep||1)-Math.round(point[0]/(d.xstep||1)))>1e-7 || Math.abs(point[1]/(d.ystep||1)-Math.round(point[1]/(d.ystep||1)))>1e-7) throw new Error('A saved graph coordinate is outside its grid.');
      return [...point];
    });
    const unique=new Set(out.plots[key].map(point=>point.join(','))); if(unique.size!==points.length) throw new Error('A saved graph contains duplicate points.');
  }
  for (const [id,variant] of entries(source.variants,'examples')) {
    if (!/^\d+$/.test(id) || String(Number(id))!==id || !Number.isInteger(variant) || variant<0 || !problems.has(Number(id)) || variant>(problems.get(Number(id)).variants || []).length) throw new Error('A selected example is invalid.'); out.variants[id]=variant;
  }
  if (source.progress !== undefined) {
    if (!plain(source.progress) || source.progress.version!==1) throw new Error('The learning progress section is invalid.');
    for (const [key,record] of entries(source.progress.records,'learning progress')) {
      const {problem}=identity(key);
      if (!plain(record) || !Number.isSafeInteger(record.attempts) || record.attempts<0 || record.attempts>1000000 || !Number.isSafeInteger(record.totalCorrectChecks) || record.totalCorrectChecks<0 || record.totalCorrectChecks>record.attempts) throw new Error('A learning record is invalid.');
      const allowed=new Set((problem.fields || []).map(f=>f.key)); if(problem.diagram?.student_plot)allowed.add('$graph');
      const fields={};
      for(const [field,status] of entries(record.fields,'answer checks')) {
        if(!allowed.has(field) || !STATUSES.has(status))throw new Error('An answer check is invalid.');
        const definition=(problem.fields || []).find(item=>item.key===field);
        if(status==='self-reviewed' && (!definition || definition.value!==null && definition.value!==undefined || (definition.accepted || []).length || isPlotField(problem,definition)))throw new Error('Only explanation answers may be marked self-reviewed.');
        fields[field]=status;
      }
      for(const field of problem.fields || []) if(fields[field.key]===undefined && !(isPlotField(problem,field) && fields.$graph!==undefined))fields[field.key]='blank';
      const importTime=value=>{if(value===null || value===undefined)return null;if(typeof value!=='string' || value.length>40 || !Number.isFinite(Date.parse(value)))throw new Error('A saved check date is invalid.');return new Date(value).toISOString();};
      const lastChecked=importTime(record.lastChecked),lastReviewed=importTime(record.lastReviewed);
      out.progress.records[key]={attempts:record.attempts,totalCorrectChecks:record.totalCorrectChecks,lastChecked,lastReviewed,fields,complete:finished(fields)};
    }
  }
  for(const key of ['autoNext','autonext']) if(source[key]!==undefined) { if(typeof source[key]!=='boolean')throw new Error('The auto-next preference is invalid.');out[key]=source[key]; }
  if(source.theme!==undefined) { if(!['light','dark'].includes(source.theme))throw new Error('The color theme is invalid.');out.theme=source.theme; }
  if(source.question!==undefined) { if(!Number.isInteger(source.question) || !problems.has(source.question))throw new Error('The saved current problem is invalid.');out.question=source.question; }
  if(source.view!==undefined) { if(!['lesson','packet','practice'].includes(source.view))throw new Error('The saved view is invalid.');out.view=source.view; }
  if(source.studentName!==undefined) { if(typeof source.studentName!=='string' || source.studentName.length>100)throw new Error('The student name is too long or invalid.');out.studentName=source.studentName; }
  return out;
}
