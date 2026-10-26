// Browser-local practice records. Sharing is an explicit, read-only snapshot.
const APP='math-review-1';
const BACKUP='math-review-backup';
const SNAPSHOT='math-review-progress';
const MAX_FILE=8*1024*1024, MAX_SHARED=120000, MAX_HASH=32000;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const plain=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
const integer=(x,max=1000000)=>Number.isSafeInteger(x)&&x>=0&&x<=max;
const number=x=>Number.isFinite(+x)?+x:0;
const trim=(s,n=120)=>String(s??'').trim().slice(0,n);
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const stamp=()=>new Date().toISOString();
const labels={'not-started':'Not started','needs-practice':'Needs practice',developing:'Developing',secure:'Secure'};
const statuses=Object.keys(labels);
const safeKey=k=>typeof k==='string'&&k.length>0&&k.length<160&&!['__proto__','constructor','prototype'].includes(k);
const skillId=(chapter,label)=>`${chapter}::${label}`;
function fingerprint(raw){let h=2166136261;for(const c of String(raw??'').trim().replace(/\u2212/g,'-').replace(/\s+/g,' ').toLowerCase()){h^=c.charCodeAt(0);h=Math.imul(h,16777619);}return (h>>>0).toString(36);}
function problemInfo(p){return {key:String(p.key??p.block?.id??''),originalKey:p.originalKey?String(p.originalKey):null,label:trim(p.blockTitle||p.category||p.block?.title||'Review'),chapter:trim(p.page?.chapter||'Review')};}

/** One record per distinct problem, so repeated Check clicks cannot raise mastery. */
export function recordAttempt(state,problem,result,raw,{assisted=false}={}){
  const p=problemInfo(problem);if(!safeKey(p.key))return false;
  if(!plain(state.attempts))state.attempts={};if(!plain(state.assisted))state.assisted={};
  const outcome=typeof result==='boolean'?{correct:result}:result||{};
  const usedHelp=!!assisted||!!state.assisted[p.key],response=fingerprint(raw),now=stamp();
  let record=state.attempts[p.key];
  if(!plain(record))record={firstCorrect:!!outcome.correct,firstAssisted:usedHelp,firstNeedsReview:!!outcome.needsReview,firstAt:now,tries:0,responses:[],originalKey:p.originalKey,skill:p.label,chapter:p.chapter};
  if(!Array.isArray(record.responses))record.responses=[];
  const repeated=record.responses.includes(response);
  if(!repeated){record.tries=Math.min(100000,number(record.tries)+1);record.responses.push(response);if(record.responses.length>80)record.responses.shift();}
  record.correct=!!outcome.correct;record.needsReview=!!outcome.needsReview;record.assisted=!!record.assisted||usedHelp;record.lastAt=now;
  record.originalKey=p.originalKey;record.skill=p.label;record.chapter=p.chapter;
  state.attempts[p.key]=record;return !repeated;
}

/** Call when an extra-practice step or solution is revealed, before another check. */
export function markAssisted(state,key){key=String(key);if(!safeKey(key))return;if(!plain(state.assisted))state.assisted={};state.assisted[key]=true;if(plain(state.attempts?.[key]))state.attempts[key].assisted=true;}

export function buildReport(state,problems){
  const canonical=new Map((problems||[]).map(p=>[String(p.key??p.block?.id),p]));
  const skills=new Map(),byKey=new Map();
  const ensure=(p)=>{const info=problemInfo(p),id=skillId(info.chapter,info.label);if(!skills.has(id))skills.set(id,{id,label:info.label,chapter:info.chapter,total:0,attempted:0,correct:0,practiceTried:0,practiceCorrect:0,firstTryCorrect:0,firstTryTotal:0,independentExtra:0,helped:0,pending:0,unmarked:0,legacyCorrect:0,checks:0,recommendKey:info.originalKey||info.key,status:'not-started'});return skills.get(id);};
  for(const p of canonical.values()){const skill=ensure(p);skill.total++;byKey.set(String(p.key??p.block?.id),skill);}
  const entries=[...canonical.values(),...(Array.isArray(state.extra)?state.extra.filter(p=>canonical.has(String(p.originalKey))):[])];
  const seen=new Set();
  for(const p of entries){const info=problemInfo(p);if(!safeKey(info.key)||seen.has(info.key))continue;seen.add(info.key);
    const original=canonical.get(info.originalKey),skill=info.originalKey&&original?byKey.get(info.originalKey):byKey.get(info.key)||ensure(p);
    const record=plain(state.attempts?.[info.key])?state.attempts[info.key]:null,checked=state.checked?.[info.key];
    const current=typeof checked==='boolean'?{correct:checked}:plain(checked)?checked:null;
    const attempted=!!record||!!current,extra=!!info.originalKey;
    if(extra){if(attempted)skill.practiceTried++;if(current?.correct)skill.practiceCorrect++;}
    else {if(attempted)skill.attempted++;if(current?.correct)skill.correct++;}
    if(current&&!current.correct){skill.pending++;if(!extra)skill.recommendKey=info.key;}
    if(!current&&String(state.answers?.[info.key]||'').trim())skill.unmarked++;
    if(record){skill.checks+=number(record.tries);if(!record.firstAssisted&&!record.firstNeedsReview){skill.firstTryTotal++;if(record.firstCorrect){skill.firstTryCorrect++;if(extra)skill.independentExtra++;}}}
    else if(current?.correct)skill.legacyCorrect++;
    if(record?.assisted||state.assisted?.[info.key])skill.helped++;
  }
  for(const skill of skills.values()){
    const submitted=skill.attempted+skill.practiceTried;
    if(!submitted)skill.status='not-started';
    else if(skill.pending)skill.status='needs-practice';
    else if(skill.firstTryCorrect>=3&&skill.independentExtra>=1&&skill.firstTryCorrect/Math.max(1,skill.firstTryTotal)>=.8)skill.status='secure';
    else if(skill.correct+skill.practiceCorrect>0)skill.status='developing';
    else skill.status='needs-practice';
    skill.firstTryPercent=skill.firstTryTotal?Math.round(skill.firstTryCorrect/skill.firstTryTotal*100):null;
  }
  const list=[...skills.values()],chapters=[];
  for(const skill of list){let chapter=chapters.find(c=>c.label===skill.chapter);if(!chapter){chapter={label:skill.chapter,total:0,correct:0,attempted:0,practiceTried:0,practiceCorrect:0,secure:0,skills:0};chapters.push(chapter);}for(const key of ['total','correct','attempted','practiceTried','practiceCorrect'])chapter[key]+=skill[key];chapter.skills++;if(skill.status==='secure')chapter.secure++;}
  const sum=key=>list.reduce((n,s)=>n+s[key],0);
  const summary={total:sum('total'),correct:sum('correct'),attempted:sum('attempted'),practiceTried:sum('practiceTried'),practiceCorrect:sum('practiceCorrect'),firstTryCorrect:sum('firstTryCorrect'),firstTryTotal:sum('firstTryTotal'),helped:sum('helped'),pending:sum('pending'),unmarked:sum('unmarked'),legacyCorrect:sum('legacyCorrect'),checks:sum('checks'),secure:list.filter(s=>s.status==='secure').length,skills:list.length};
  const priority={'needs-practice':0,developing:1,'not-started':2,secure:3};
  const recommendations=list.filter(s=>s.status!=='secure').map((s,i)=>({...s,order:i})).sort((a,b)=>priority[a.status]-priority[b.status]||a.order-b.order).slice(0,5).map(s=>({key:s.recommendKey,label:s.label,status:s.status,reason:s.pending?'Revisit a problem you have not yet answered correctly.':s.status==='not-started'?'Begin this skill, then try a new set of values.':'Build consistency with a new practice problem.'}));
  return {schema:SNAPSHOT,version:1,title:'8th Grade - Math Review 1',generatedAt:stamp(),studentName:trim(state.studentName,60),summary,skills:list,chapters,recommendations};
}

function assertSafeTree(value,depth=0){
  if(depth>30)throw Error('This file has an unsupported structure.');
  if(value===null||typeof value==='boolean')return;
  if(typeof value==='number'){if(!Number.isFinite(value))throw Error('The file contains an invalid number.');return;}
  if(typeof value==='string'){if(value.length>300000)throw Error('A field in this file is too large.');return;}
  if(Array.isArray(value)){if(value.length>20000)throw Error('This file contains too many records.');for(const x of value)assertSafeTree(x,depth+1);return;}
  if(!plain(value))throw Error('This is not a valid progress file.');
  for(const [k,v] of Object.entries(value)){if(!safeKey(k))throw Error('This file contains an invalid field.');if(k==='visual'&&plain(v))assertSafeVisual(v);assertSafeTree(v,depth+1);}
}
function assertSafeVisual(value){
  if(Array.isArray(value)){value.forEach(assertSafeVisual);return;}
  if(!plain(value))return;
  for(const [key,v] of Object.entries(value)){
    if(['fill','color','stroke'].includes(key)&&v!==null&&v!==undefined&&v!==false&&!(typeof v==='string'&&/^(?:#[0-9a-f]{3,8}|[a-z]+|rgba?\([\d.,%\s]+\))$/i.test(v)))throw Error('A diagram in this backup contains an invalid color.');
    if(key==='anchor'&&v!==undefined&&!['start','middle','end'].includes(v))throw Error('A diagram in this backup contains an invalid label.');
    if(['svgWidth','svgHeight','opacity','width','radius'].includes(key)&&v!==undefined&&v!==null&&typeof v!=='number')throw Error('A diagram in this backup contains an invalid dimension.');
    if(v&&typeof v==='object')assertSafeVisual(v);
  }
}
const stateFields=['page','view','selected','answers','checked','help','labState','extra','difficulty','theme','practice','collapsed','chapterOpen','lessonClosed','layoutVersion','attempts','assisted','studentName'];
export function makeBackup(state){const snapshot={};for(const key of stateFields)if(state[key]!==undefined)snapshot[key]=state[key];const backup={schema:BACKUP,version:1,app:APP,createdAt:stamp(),state:JSON.parse(JSON.stringify(snapshot))};validateBackup(backup);return backup;}
export function validateBackup(value){
  const backup=typeof value==='string'?JSON.parse(value):value;
  if(!plain(backup)||backup.schema!==BACKUP||backup.version!==1||backup.app!==APP||!plain(backup.state))throw Error('Choose a progress backup downloaded from this math review.');
  assertSafeTree(backup);if(JSON.stringify(backup).length>MAX_FILE)throw Error('This progress file is too large.');
  const s=backup.state,clean={};for(const key of stateFields)if(own(s,key))clean[key]=s[key];
  for(const key of ['answers','checked','help','labState','lessonClosed','attempts','assisted']){if(clean[key]===undefined)clean[key]={};if(!plain(clean[key]))throw Error(`The ${key} records are invalid.`);}
  for(const [key,value] of Object.entries(clean.answers))if(!safeKey(key)||typeof value!=='string'||value.length>4000)throw Error('An answer in this file is invalid.');
  for(const value of Object.values(clean.checked))if(!plain(value)||typeof value.correct!=='boolean')throw Error('The answer-check records are invalid.');
  for(const value of Object.values(clean.attempts)){if(!plain(value)||!integer(value.tries,100000)||typeof value.firstCorrect!=='boolean'||typeof value.firstAssisted!=='boolean'||!Array.isArray(value.responses)||value.responses.length>80||value.responses.some(x=>typeof x!=='string'||x.length>30))throw Error('The attempt records are invalid.');}
  for(const value of Object.values(clean.assisted))if(typeof value!=='boolean')throw Error('The help records are invalid.');
  if(clean.extra===undefined)clean.extra=[];if(!Array.isArray(clean.extra)||clean.extra.length>5000)throw Error('The extra-practice records are invalid.');
  for(const p of clean.extra)if(!plain(p)||!safeKey(p.key)||!safeKey(String(p.originalKey||''))||typeof p.prompt!=='string'||!Array.isArray(p.steps))throw Error('An extra-practice problem is invalid.');
  if(clean.page!==undefined&&(!integer(clean.page,10000)||clean.page<1))throw Error('The saved page is invalid.');
  if(clean.view!==undefined&&!['packet','lab','progress'].includes(clean.view))throw Error('The saved view is invalid.');
  if(clean.theme!==undefined&&!['light','dark'].includes(clean.theme))throw Error('The saved theme is invalid.');
  clean.studentName=trim(clean.studentName,60);
  return clean;
}

const metricKeys=['total','attempted','correct','practiceTried','practiceCorrect','firstTryCorrect','firstTryTotal','independentExtra','helped','pending','unmarked','legacyCorrect','checks'];
function packReport(r){return {v:1,t:r.generatedAt,n:r.studentName,c:r.chapters.map(c=>c.label),s:r.skills.map(s=>[s.label,r.chapters.findIndex(c=>c.label===s.chapter),statuses.indexOf(s.status),...metricKeys.map(k=>s[k]),s.recommendKey])};}
function unpackReport(p){
  if(!plain(p)||p.v!==1||typeof p.t!=='string'||!Number.isFinite(Date.parse(p.t))||typeof p.n!=='string'||p.n.length>60||!Array.isArray(p.c)||p.c.length>40||p.c.some(x=>typeof x!=='string'||!x.length||x.length>120)||!Array.isArray(p.s)||p.s.length>300)throw Error('This progress link is invalid or incomplete.');
  const skills=p.s.map(row=>{
    if(!Array.isArray(row)||row.length!==17||typeof row[0]!=='string'||row[0].length>120||!integer(row[1],p.c.length-1)||!integer(row[2],3)||row.slice(3,16).some(x=>!integer(x))||!safeKey(row[16]))throw Error('This progress link contains invalid skill data.');
    const skill={id:skillId(p.c[row[1]],row[0]),label:row[0],chapter:p.c[row[1]],status:statuses[row[2]],recommendKey:row[16]};metricKeys.forEach((k,i)=>skill[k]=row[i+3]);
    if(skill.correct>skill.total||skill.attempted>skill.total||skill.practiceCorrect>skill.practiceTried||skill.firstTryCorrect>skill.firstTryTotal)throw Error('This progress link contains inconsistent totals.');
    skill.firstTryPercent=skill.firstTryTotal?Math.round(skill.firstTryCorrect/skill.firstTryTotal*100):null;return skill;
  });
  const chapters=p.c.map(label=>{const ss=skills.filter(s=>s.chapter===label);return {label,total:ss.reduce((n,s)=>n+s.total,0),correct:ss.reduce((n,s)=>n+s.correct,0),attempted:ss.reduce((n,s)=>n+s.attempted,0),practiceTried:ss.reduce((n,s)=>n+s.practiceTried,0),practiceCorrect:ss.reduce((n,s)=>n+s.practiceCorrect,0),secure:ss.filter(s=>s.status==='secure').length,skills:ss.length};});
  const summary={};for(const k of metricKeys)summary[k]=skills.reduce((n,s)=>n+s[k],0);summary.secure=skills.filter(s=>s.status==='secure').length;summary.skills=skills.length;
  const priority={'needs-practice':0,developing:1,'not-started':2,secure:3};
  const recommendations=skills.filter(s=>s.status!=='secure').map((s,i)=>({...s,order:i})).sort((a,b)=>priority[a.status]-priority[b.status]||a.order-b.order).slice(0,5).map(s=>({key:s.recommendKey,label:s.label,status:s.status,reason:s.pending?'Revisit a problem you have not yet answered correctly.':s.status==='not-started'?'Begin this skill, then try a new set of values.':'Build consistency with a new practice problem.'}));
  return {schema:SNAPSHOT,version:1,title:'8th Grade - Math Review 1',generatedAt:p.t,studentName:p.n,summary,skills,chapters,recommendations};
}
function toBase64(bytes){let s='';for(let i=0;i<bytes.length;i+=8192)s+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(s).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
function fromBase64(text){if(!/^[\w-]+$/.test(text))throw Error('This progress link is invalid.');const raw=atob(text.replace(/-/g,'+').replace(/_/g,'/'));return Uint8Array.from(raw,c=>c.charCodeAt(0));}
async function transformBytes(bytes,format){const stream=new Blob([bytes]).stream().pipeThrough(format);const reader=stream.getReader();let size=0,parts=[];while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>MAX_SHARED){await reader.cancel();throw Error('This progress link is too large.');}parts.push(value);}const out=new Uint8Array(size);let at=0;for(const part of parts){out.set(part,at);at+=part.length;}return out;}
export async function buildShareLink(report,baseURL=window.location.href){
  let bytes=new TextEncoder().encode(JSON.stringify(packReport(report))),format='j1';
  if(typeof CompressionStream==='function'){bytes=await transformBytes(bytes,new CompressionStream('gzip'));format='g1';}
  const payload=format+'.'+toBase64(bytes);if(payload.length>MAX_HASH)throw Error('This snapshot is too large for a link. Download the progress report instead.');
  const url=new URL(baseURL);url.hash='progress='+payload;return url.href;
}
export async function readSharedReport(hash){
  const match=String(hash||'').match(/^#progress=(g1|j1)\.([\w-]+)$/);if(!String(hash||'').startsWith('#progress='))return null;if(!match||hash.length>MAX_HASH)throw Error('This progress link is invalid or incomplete.');
  try{let bytes=fromBase64(match[2]);if(match[1]==='g1'){if(typeof DecompressionStream!=='function')throw Error('This browser cannot open compressed progress links. Try a current Chrome, Edge, or Firefox browser.');bytes=await transformBytes(bytes,new DecompressionStream('gzip'));}if(bytes.length>MAX_SHARED)throw Error('This progress link is too large.');return unpackReport(JSON.parse(new TextDecoder().decode(bytes)));}catch(error){if(/browser|too large|incomplete|inconsistent/.test(error.message))throw error;throw Error('This progress link is invalid or incomplete.');}
}

function csvField(value){let s=String(value??'');if(/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';}
export function reportCSV(report){const rows=[['Student',report.studentName||'Not entered'],['Snapshot',report.generatedAt],['Review',report.title],[],['Chapter','Skill','Status','Packet correct','Packet total','Packet attempted','Extra correct','Extra attempted','Independent first-try correct','Independent first tries','Questions with help','Needs another check']];for(const s of report.skills)rows.push([s.chapter,s.label,labels[s.status],s.correct,s.total,s.attempted,s.practiceCorrect,s.practiceTried,s.firstTryCorrect,s.firstTryTotal,s.helped,s.pending]);return '\uFEFF'+rows.map(row=>row.map(csvField).join(',')).join('\r\n');}
function download(text,name,type){const url=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
const ratio=(n,d)=>`${n} / ${d}`;
const displayDate=s=>new Date(s).toLocaleString();

/** Owns only this screen. Shared reports do not write to student state. */
export function mountProgress(host,{state,problems,onPractice=()=>{},onRestore=()=>{},onChange=()=>{},onBack=()=>{},sharedReport=null}){
  let disposed=false,restoreCandidate=null,report=sharedReport||buildReport(state,problems);const shared=!!sharedReport;
  const status=(message,bad=false)=>{if(disposed)return;const el=host.querySelector('.progress-message');if(el){el.textContent=message;el.classList.toggle('is-error',bad);}};
  const details=report.chapters.map(ch=>`<details class="progress-chapter"><summary><span>${esc(ch.label)}</span><span>${ratio(ch.correct,ch.total)} packet · ${ch.secure}/${ch.skills} secure</span></summary><div class="progress-table-wrap"><table><thead><tr><th>Skill</th><th>Packet</th><th>Extra practice</th><th>Readiness</th>${shared?'':'<th><span class="sr-only">Practice</span></th>'}</tr></thead><tbody>${report.skills.filter(s=>s.chapter===ch.label).map(s=>`<tr><th scope="row">${esc(s.label)}</th><td>${ratio(s.correct,s.total)}</td><td>${ratio(s.practiceCorrect,s.practiceTried)}</td><td><span class="progress-tag ${s.status}">${labels[s.status]}</span><small>${s.firstTryTotal?ratio(s.firstTryCorrect,s.firstTryTotal)+' independent first tries':'No independent first-try record yet'}</small></td>${shared?'':`<td><button class="subtle" data-progress-practice="${esc(s.recommendKey)}">Practice</button></td>`}</tr>`).join('')}</tbody></table></div></details>`).join('');
  host.classList.add('progress-screen');
  host.innerHTML=`<div class="page-head"><div><p class="eyebrow">${shared?'SHARED SNAPSHOT':'YOUR LEARNING'}</p><h1>${shared?'Progress snapshot':'My progress'}</h1><p class="page-description">${shared?`${esc(report.studentName||'Student')} · ${esc(displayDate(report.generatedAt))}`:'Your answers and practice save automatically on this browser.'}</p></div><button class="subtle" data-progress-back>${shared?'Open my own work':'Back to my work'}</button></div>${shared?'<p class="progress-notice">This is a read-only snapshot, not a live feed. Opening it does not change your own saved work.</p>':`<label class="progress-name">Name or label <span>(optional)</span><input aria-label="Student name or label" maxlength="60" value="${esc(state.studentName||'')}" autocomplete="off" placeholder="For your teacher’s report"></label>`}<div class="progress-overview"><div><strong>${ratio(report.summary.correct,report.summary.total)}</strong><span>packet problems correct</span></div><div><strong>${ratio(report.summary.secure,report.summary.skills)}</strong><span>skills showing secure evidence</span></div><div><strong>${report.summary.practiceTried}</strong><span>new practice problems tried</span></div><div><strong>${report.summary.firstTryTotal?Math.round(100*report.summary.firstTryCorrect/report.summary.firstTryTotal)+'%':'—'}</strong><span>independent first-try success</span></div></div><section class="progress-next"><h2>${shared?'Skills to continue':'What to practice next'}</h2>${report.recommendations.length?`<div class="progress-recommendations">${report.recommendations.map(r=>`<${shared?'div':'button'} ${shared?'':`data-progress-practice="${esc(r.key)}"`} class="progress-recommendation"><span class="progress-tag ${r.status}">${labels[r.status]}</span><strong>${esc(r.label)}</strong><span>${esc(r.reason)}</span>${shared?'':'<b>Practice →</b>'}</${shared?'div':'button'}>`).join('')}</div>`:'<p>Every skill currently shows secure evidence. Revisit mixed practice to keep it fresh.</p>'}</section><section class="progress-skills"><h2>Skills and chapters</h2><p class="progress-explanation">“Secure” means at least three different problems correct on the first try without steps, including new practice, with at least 80% independent first-try success and no remaining incorrect checked answer. This is practice evidence, not a grade. Previously saved correct answers still count toward completion; first-try history starts with this update.</p>${details}</section><section class="progress-share"><h2>${shared?'Save this snapshot':'Save or share progress'}</h2>${shared?'':`<p>Your teacher receives nothing automatically. A copied link contains a snapshot of your name or label and skill totals; anyone with the link can view it.</p>`}<div class="progress-actions">${shared?'':`<button class="primary" data-progress-share>Copy progress link</button><button class="subtle" data-progress-backup>Download backup</button>`}<button class="subtle" data-progress-csv>Download report (CSV)</button>${shared?'':`<label class="subtle progress-import">Restore backup<input type="file" accept=".json,application/json" aria-label="Choose progress backup"></label>`}</div><p class="progress-message" role="status" aria-live="polite"></p><textarea class="progress-link" aria-label="Progress link to copy" readonly hidden></textarea><div class="progress-restore" hidden></div></section>`;
  const handlers=[];const listen=(element,event,fn)=>{if(!element)return;element.addEventListener(event,fn);handlers.push(()=>element.removeEventListener(event,fn));};
  listen(host.querySelector('[data-progress-back]'),'click',onBack);
  host.querySelectorAll('[data-progress-practice]').forEach(button=>listen(button,'click',()=>onPractice(button.dataset.progressPractice)));
  const nameInput=host.querySelector('.progress-name input');listen(nameInput,'input',()=>{state.studentName=nameInput.value.slice(0,60);onChange();});
  const getReport=()=>shared?report:buildReport(state,problems);
  listen(host.querySelector('[data-progress-csv]'),'click',()=>{report=getReport();download(reportCSV(report),'Math_Review_1_Progress.csv','text/csv;charset=utf-8');status('Progress report downloaded.');});
  listen(host.querySelector('[data-progress-backup]'),'click',()=>{try{download(JSON.stringify(makeBackup(state),null,2),'Math_Review_1_Progress_Backup.json','application/json');status('Backup downloaded. Keep it to restore your answers and practice on another device.');}catch(error){status(error.message,true);}});
  const shareButton=host.querySelector('[data-progress-share]');listen(shareButton,'click',async()=>{shareButton.disabled=true;status('Preparing your snapshot…');try{const link=await buildShareLink(getReport());if(disposed)return;const field=host.querySelector('.progress-link');field.value=link;try{await navigator.clipboard.writeText(link);status('Progress link copied. Paste it into your message to your teacher.');}catch{field.hidden=false;field.focus();field.select();status('Select and copy this link, then send it to your teacher.');}}catch(error){status(error.message,true);}finally{if(!disposed)shareButton.disabled=false;}});
  listen(host.querySelector('input[type="file"]'),'change',async event=>{const file=event.target.files?.[0],box=host.querySelector('.progress-restore');restoreCandidate=null;box.hidden=true;if(!file)return;if(file.size>MAX_FILE){status('Choose a progress backup smaller than 8 MB.',true);return;}try{const text=await file.text();if(disposed)return;restoreCandidate=validateBackup(text);const preview=buildReport(restoreCandidate,problems);box.innerHTML=`<h3>Restore this backup?</h3><p>${esc(preview.studentName||'Unnamed student')} · ${preview.summary.correct} packet answers correct · ${restoreCandidate.extra.length} saved practice problems.</p><p>This replaces the answers and progress saved in this browser.</p><div class="progress-actions"><button class="primary" data-progress-restore>Restore this backup</button><button class="subtle" data-progress-cancel>Cancel</button></div>`;box.hidden=false;box.querySelector('[data-progress-restore]').onclick=()=>{if(!restoreCandidate)return;const next=restoreCandidate;restoreCandidate=null;onRestore(next);};box.querySelector('[data-progress-cancel]').onclick=()=>{restoreCandidate=null;box.hidden=true;};status('Backup checked. Review the preview before restoring.');}catch(error){status(error.message||'This backup could not be read.',true);}});
  return ()=>{disposed=true;for(const remove of handlers)remove();host.classList.remove('progress-screen');};
}
