import packet from './data.js?v=20261026-2';
import {isHandoutOriginal,getHandoutGuidance} from './learning-help.js?v=20261026-4';
import {lessons,warmupLessons} from './packet-lessons.js?v=20261026-2';
import {checkAnswers,LIMITS,parseNumber} from './packet-core.js?v=20261026-2';
import {generatePractice,getAnswerUnit} from './practice.js?v=20261026-4';
import {getPredictionBounds,getInitialPrediction} from './experiments.js?v=20261026-2';
import {getEquationWarmups} from './extensions.js?v=20261026-2';
import {buildProgressReport,buildTextProgressReport,downloadText} from './progress-export.js?v=20261026-2';
import {getActiveProblem,getPracticeLesson} from './practice-lessons.js?v=20261026-4';
import {createWorkspaceStore,createWorkspaceProgressStore,createWorkspaceBackupStore,parseWorkspaceRoute,workspaceHash,workspaceLink,WORKSPACE_IMPORT_BYTES,WORKSPACE_SELECTION_PREFIX,WORKSPACE_PROGRESS_PREFIX} from './workspace-state.js?v=20261026-4';

const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const problems=packet.sections.flatMap(section=>section.problems.map(p=>({...p,section,warmup:false})));
const warmups=packet.sections.flatMap(section=>(section.warmups||[]).map((p,i)=>({...p,type:'quantitative',title:`Math warm-up ${i+1}`,section,warmup:true,ordinal:i+1})));
const items=new Map([...problems,...warmups].map(p=>[p.id,p]));
const workspaceStore=createWorkspaceStore(),store=createWorkspaceProgressStore(),backupStore=createWorkspaceBackupStore();
const pending=new Map(),timers=new Map(),failedPatches=new Map(),views=new Map();
let records={},route='P01',selectedPage=1,lastSaveError='',selectionError='',theme='light',studentName='';
try{studentName=String(localStorage.getItem('motion-lab-student-name')||'').slice(0,120);}catch{}
try{theme=JSON.parse(localStorage.getItem('motion-lab-theme'))||'light';}catch{}
document.body.classList.toggle('dark',theme==='dark');

function originalLesson(p){return(p.warmup?warmupLessons:lessons)[p.id]||{hint:'Use the given measurements and units.',steps:p.steps||[],why:p.answer||'',criteria:[],fields:[]};}
function makeView(original,selection){
 if(original.warmup)return{original,p:original,lesson:originalLesson(original),selection:null,recordId:original.id};
 const active=selection||workspaceStore.selection(original);
 return{original,selection:active,recordId:active.recordId,p:active.mode==='original'&&!original.extension?original:getActiveProblem(original,active.params),lesson:active.mode==='original'&&!original.extension?originalLesson(original):getPracticeLesson(original,active.params)};
}
function viewFor(id){if(!views.has(id))views.set(id,makeView(items.get(id)));return views.get(id);}
function recordView(id){
 if(items.has(id))return makeView(items.get(id),items.get(id).warmup?null:workspaceStore.selection(items.get(id),'original'));
 const original=items.get(id.split('__')[0]);if(!original||original.warmup)return null;
 const selection=workspaceStore.selectionForRecord(original,id);
 return selection?.params&&selection.recordId===id?makeView(original,selection):null;
}
function emptyRecord(){return{answers:{},explanation:'',status:'draft',reviewed:false,attempts:0,updatedAt:new Date().toISOString()};}
function responseFor(id){return records[id]||emptyRecord();}
function hasResponse(r){return!!r&&(Object.values(r.answers||{}).some(x=>String(x).trim())||String(r.explanation||'').trim());}
function saySaved(text,error=false){$('saveStatus').textContent=text;$('saveStatus').classList.toggle('error',error);}
function checkedRecord(id,record){
 if(!record)return record;const view=recordView(id);if(!view)return{...record,status:'draft',reviewed:false};
 const l=view.lesson;let status=record.status,reviewed=record.reviewed;
 if(l.fields.length){if(status!=='draft')status=checkAnswers(view.p,l,record.answers).status;reviewed=false;}
 else if(status==='correct'||status==='needs-work'||status==='reviewed'&&!reviewed){status=record.explanation.trim()?'saved':'draft';reviewed=false;}
 return{...record,status,reviewed};
}
function saveState(){
 if(failedPatches.size||lastSaveError)saySaved('Some work is not saved. Download a backup.',true);
 else if(selectionError)saySaved('Problem selection could not be saved on this browser.',true);
 else if(pending.size)saySaved('Saving…');else saySaved('Saved on this browser');
}
function readAll(){
 const result=store.all(),fresh={};
 for(const[id,record]of Object.entries(result.records||{}))fresh[id]=checkedRecord(id,record);
 for(const[id,record]of Object.entries(records))if(pending.has(id)||failedPatches.has(id)||result.errors?.[id])fresh[id]=record;
 records=fresh;lastSaveError=result.ok?'':result.error||'Browser storage is unavailable.';
 if(!result.ok)saveState();return result;
}
function syncPrediction(id,answers){
 if(!answers)return;const view=recordView(id);if(!view||view.original.warmup)return;
 const field=view.lesson.fields.find(f=>f.type==='number');
 if(field&&Object.hasOwn(answers,field.key))workspaceStore.saveSimulation(id,{answer:answers[field.key]});
}
function savePatch(id,patch){
 const failed=failedPatches.get(id)||{},combined={...failed,...patch,answers:{...failed.answers,...patch.answers}},previous=responseFor(id);
 records[id]={...previous,...combined,answers:{...previous.answers,...combined.answers},updatedAt:new Date().toISOString()};
 const result=store.save(id,combined);
 if(result.ok){records[id]=checkedRecord(id,result.record);failedPatches.delete(id);lastSaveError='';}
 else{failedPatches.set(id,combined);lastSaveError=result.error||'Browser storage is unavailable.';}
 syncPrediction(id,combined.answers);saveState();updateProgress();updateCardStatus(id);return result;
}
function queueSave(id,patch){
 const old=pending.get(id)||{};pending.set(id,{...old,...patch,answers:{...old.answers,...patch.answers}});
 records[id]={...responseFor(id),...patch,answers:{...responseFor(id).answers,...patch.answers},updatedAt:new Date().toISOString()};
 if(timers.has(id))clearTimeout(timers.get(id));timers.set(id,setTimeout(()=>flush(id),300));saveState();updateCardStatus(id);updateProgress();
}
function flush(id){if(timers.has(id)){clearTimeout(timers.get(id));timers.delete(id);}const patch=pending.get(id);if(!patch)return;pending.delete(id);savePatch(id,patch);}
function flushAll(){for(const id of[...pending.keys()])flush(id);}
function statusText(r){if(!hasResponse(r))return'Not started';return({correct:'Checked correct','needs-work':'Needs another try',saved:'Response submitted',reviewed:'Self-reviewed',draft:'Draft'})[r.status]||'Draft';}
function updateCardStatus(id){
 const r=responseFor(id),card=document.querySelector(`[data-record="${id}"]`);if(!card)return;
 const badge=card.querySelector('.status-badge');badge.textContent=statusText(r);badge.className=`status-badge ${r.status||'draft'}`;
 const note=card.querySelector('[data-save-note]');if(note){note.textContent=failedPatches.has(id)?'Not saved on this browser. Download a backup to keep this response.':pending.has(id)?'Saving…':'';note.classList.toggle('error',failedPatches.has(id));}
}
function counts(ids){const c={correct:0,reviewed:0,submitted:0,drafts:0};for(const id of ids){const r=records[id];if(!hasResponse(r))continue;if(r.status==='correct')c.correct++;else if(r.status==='reviewed')c.reviewed++;else if(['saved','needs-work'].includes(r.status))c.submitted++;else c.drafts++;}return c;}
function updateProgress(){
 const c=counts(problems.filter(p=>!p.extension).map(p=>p.id)),extra=counts(problems.filter(p=>p.extension).map(p=>p.id)),w=counts(warmups.map(p=>p.id)),practice=counts(Object.keys(records).filter(id=>id.includes('__')));
 $('progressCounts').innerHTML=`<div class="progress-subtitle">Printed packet · 32 problems</div><div class="count-row"><span>Checked correct</span><strong>${c.correct}</strong></div><div class="count-row"><span>Self-reviewed</span><strong>${c.reviewed}</strong></div><div class="count-row"><span>Submitted · not yet checked correct</span><strong>${c.submitted}</strong></div><div class="count-row"><span>Drafts</span><strong>${c.drafts}</strong></div><div class="progress-subtitle practice-count-title">Online extensions · ${problems.filter(p=>p.extension).length} problems</div><div class="count-row"><span>Checked correct</span><strong>${extra.correct}</strong></div><div class="count-row"><span>Submitted / drafts</span><strong>${extra.submitted+extra.drafts}</strong></div><div class="progress-subtitle practice-count-title">Practice & custom problems</div><div class="count-row"><span>Checked correct</span><strong>${practice.correct}</strong></div><div class="count-row"><span>Self-reviewed</span><strong>${practice.reviewed}</strong></div><div class="count-row"><span>Submitted / drafts</span><strong>${practice.submitted+practice.drafts}</strong></div>`;
 $('warmupCounts').textContent=`Math warm-ups: ${w.correct} of 24 checked correct.`;
 document.querySelectorAll('.nav-link[data-id]').forEach(a=>{const view=viewFor(a.dataset.id),r=records[view.recordId],done=r?.status==='correct'||r?.status==='reviewed';a.querySelector('.nav-number').textContent=done?'✓':Number(a.dataset.id.slice(1));a.querySelector('.nav-number').classList.toggle('done',done);});
}
function tableHTML(p){if(!p.table)return'';const t=p.table,heads=t.headers||t.columns||[];return`<table class="data-table"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${(t.rows||[]).map(row=>`<tr>${(Array.isArray(row)?row:Object.values(row)).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;}
function protectedView(view){return isHandoutOriginal(view.original,view.selection?.params);}
function optionalHelp(view){
 const l=view.lesson;
 if(protectedView(view)){const g=getHandoutGuidance(view.original);return`<div class="help-row"><details><summary>Hint</summary><p>${esc(g.hint)}</p></details><details><summary>How to approach it</summary><p>${esc(g.explanation)}</p><ul>${g.prompts.map(s=>`<li>${esc(s)}</li>`).join('')}</ul></details></div><p class="draft-note">This handout question includes guidance without a worked answer.${view.original.warmup?'':' Choose More practice for a new question with a step-by-step solution.'}</p>${view.original.warmup?'':'<button data-action="practice">More practice with a worked solution →</button>'}`;}
 return`<div class="help-row"><details><summary>Hint</summary><p>${esc(l.hint)}</p></details><details><summary>Step by step</summary><ol>${(l.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol>${l.why?`<div class="why"><strong>WHY IT WORKS</strong>${esc(l.why)}</div>`:''}</details></div>`;
}
function selectionLabel(selection,original){return selection.mode==='practice'?`Practice ${Number(selection.variantId.split('-').at(-1))} of 24`:selection.mode==='custom'?'Your values':original.extension?'Online extension':'Printed packet';}
function fieldLimits(view,field){
 if(field.type!=='number')return null;
 if(!view.original.warmup){const bounds=getPredictionBounds(view.original,view.selection.params),factor=getAnswerUnit(view.original,view.selection.params).factor||1;if(bounds&&Number.isFinite(bounds.min)&&Number.isFinite(bounds.max))return{min:bounds.min/factor,max:bounds.max/factor};}
 const expected=Number(field.expected)||0,limit=Math.max(100,Math.abs(expected)*20);return{min:-limit,max:limit};
}
function defaultField(view,field){
 if(field.type!=='number')return'';
 if(!view.original.warmup){const factor=getAnswerUnit(view.original,view.selection.params).factor||1,value=getInitialPrediction(view.original,view.selection.params)/factor;if(Number.isFinite(value))return String(Number(value.toPrecision(7)));}
 const expected=Number(field.expected)||0;return String(expected===0?1:Number((expected*.6).toPrecision(7)));
}
function fieldValue(view,field){const answers=responseFor(view.recordId).answers||{};return Object.hasOwn(answers,field.key)?answers[field.key]:defaultField(view,field);}
function clampField(view,input){
 const field=view.lesson.fields.find(f=>f.key===input.dataset.answer),limits=field&&fieldLimits(view,field);if(!limits||!input.value.trim())return false;
 const parsed=parseNumber(input.value);let value=parsed.value;
 if(!parsed.ok){const text=input.value.trim().replaceAll(',','');if(!/^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(text))return false;value=Number(text);if(Number.isNaN(value))return false;}
 const bounded=Math.max(limits.min,Math.min(limits.max,value));if(bounded===value)return false;
 input.value=String(Number(bounded.toPrecision(10)));const feedback=input.closest('.answer-field').querySelector('[data-field-feedback]');feedback.textContent='Adjusted to the limit.';return true;
}
function formatLimit(value){return Number(value.toPrecision(6)).toLocaleString('en-US',{maximumFractionDigits:8});}
function equationWarmupsHTML(view){
 if(view.original.warmup)return'';const list=getEquationWarmups(view.original,view.selection.params)||[];if(!list.length)return'';
 return`<details class="equation-warmups"><summary>Math warm-up · Solve one-step equations</summary><p class="single-warmups-note">Try the math first. The same operation on both sides keeps an equation balanced.</p>${list.map(w=>`<div class="equation-example"><p class="equation-prompt">${esc(w.prompt)}</p><details><summary>Show both sides, step by step</summary><ol>${(w.steps||[]).map(step=>`<li>${esc(step)}</li>`).join('')}</ol><p><strong>${esc(w.answer)}</strong></p></details></div>`).join('')}</details>`;
}
function cardHTML(original){
 const view=viewFor(original.id),p=view.p,l=view.lesson,r=responseFor(view.recordId),fields=l.fields||[],numeric=fields.length>0;
 const simulationLink=original.warmup?'':`<a class="experiment-link" data-simulation-link href="${esc(workspaceLink('index.html',original,view.selection))}">Go To Simulation <span aria-hidden="true">→</span></a>`;
 const practiceTools=original.warmup?'':`<div class="practice-tools"><span class="selection-badge${view.selection.mode==='original'?'':' practice'}">${esc(selectionLabel(view.selection,original))}</span><button data-action="practice">${view.selection.mode==='practice'?'New practice':'More practice'}</button><button data-action="original" ${view.selection.mode==='original'?'disabled':''}>${original.extension?'Extension original':'Packet original'}</button></div>`;
 const inputFields=fields.map(f=>{const bounds=fieldLimits(view,f);return`<div class="answer-field"><label for="answer-${original.id}-${f.key}">${esc(f.label)}</label><div class="input-with-unit"><input id="answer-${original.id}-${f.key}" data-answer="${esc(f.key)}" type="text" maxlength="${LIMITS.answerLength}" ${f.type==='number'?'inputmode="text"':''} autocomplete="off" spellcheck="false" value="${esc(fieldValue(view,f))}" aria-label="${esc(f.label)} for ${original.warmup?'warm-up '+original.ordinal:'problem '+Number(original.id.slice(1))}" ${bounds?`data-min="${bounds.min}" data-max="${bounds.max}"`:''}>${f.unit?`<span class="unit">${esc(f.unit)}</span>`:''}</div>${bounds?`<small class="input-range">Range: ${formatLimit(bounds.min)} to ${formatLimit(bounds.max)} ${esc(f.unit||'')}</small>`:''}<div data-field-feedback="${esc(f.key)}" class="field-feedback"></div></div>`;}).join('');
 return`<article class="problem-card${original.warmup?' warmup-card':''}" data-problem="${original.id}" data-record="${view.recordId}" id="card-${original.id}"><header><div>${original.warmup?'':`<div class="eyebrow">${original.extension?'ONLINE EXTENSION':`PAGE ${original.section.number}`} · PROBLEM ${Number(original.id.slice(1))}</div>`}<${original.warmup?'h3':'h2'}>${esc(p.title)}</${original.warmup?'h3':'h2'}></div><span class="status-badge ${r.status}">${esc(statusText(r))}</span></header>${practiceTools}<p class="problem-text">${esc(p.prompt)}</p>${tableHTML(p)}${equationWarmupsHTML(view)}<div class="response-area">${numeric?`<p class="entry-note">${hasResponse(r)?'Your saved response is shown.':'The starting number is a trial guess, not the answer.'} Enter your calculation using the unit shown; decimals, negatives (-), and fractions (/) work. Values outside the displayed range are adjusted when you leave the field or check.</p><div class="answer-fields">${inputFields}</div><div class="action-row"><button class="primary" data-action="check">Check answers</button>${simulationLink}</div>`:`<label class="writing-label" for="explanation-${original.id}">Explain your reasoning</label><textarea id="explanation-${original.id}" maxlength="${LIMITS.explanationLength}" data-explanation placeholder="Use the motion, forces, or measurements as evidence.">${esc(r.explanation||'')}</textarea><div class="action-row"><button data-action="save-concept">Submit response</button><button class="primary" data-action="compare">Compare my reasoning</button>${simulationLink}</div><p class="draft-note">Drafts save automatically on this browser. Written explanations are self-reviewed, not automatically graded.</p>`}<p class="save-note" data-save-note role="status"></p><div class="feedback hide" data-feedback role="status"></div><div data-review></div></div>${optionalHelp(view)}</article>`;
}
function warmupsHTML(section){const list=warmups.filter(w=>w.section.number===section.number);return list.length?`<details class="warmups-panel"><summary>Math warm-ups · Page ${section.number} · ${list.length} problems</summary><p class="single-warmups-note">These calculations prepare you for this page. Warm-up progress is tracked separately.</p><div class="warmup-grid">${list.map(cardHTML).join('')}</div></details>`:'';}
function updateTopNavigation(){
 const last=workspaceStore.lastRoute?.(),original=route!=='all'?items.get(route):items.get(last?.id)||problems[0];
 const selection=route!=='all'?viewFor(original.id).selection:workspaceStore.selection(original,last?.variantId||null);
 $('topSimulationLink').href=workspaceLink('index.html',original,selection);$('topPacketLink').href='#all';
}
function renderNav(){
 const section=packet.sections.find(s=>s.number===selectedPage)||packet.sections[0];$('pageSelect').value=section.number;
 $('problemNav').innerHTML=section.problems.map(p=>`<a class="nav-link${route===p.id?' active':''}" data-id="${p.id}" href="${esc(workspaceHash(p,viewFor(p.id).selection))}" ${route===p.id?'aria-current="page"':''}><span class="nav-number">${Number(p.id.slice(1))}</span><span>${esc(p.title)}</span></a>`).join('');
}
function renderRoute({scroll=true}={}){
 flushAll();views.clear();const parsed=parseWorkspaceRoute(location.hash);route=parsed.all?'all':items.has(parsed.id)&&!items.get(parsed.id).warmup?parsed.id:'P01';
 if(route!=='all'&&parsed.variantId){
  const original=items.get(route),requested=workspaceStore.selection(original,parsed.variantId),active=workspaceStore.selection(original);
  const selected=active.recordId===requested.recordId?active:workspaceStore.select(original,requested.params);
  selectionError=requested.ok===false?requested.error||'Selection unavailable.':selected.ok===false?selected.error||'Selection not saved.':'';
  views.set(route,makeView(original,selected));
 }
 if(route==='all'){
  $('workspace').className='all-view';$('workspace').innerHTML=`<h1>Your physical science packet</h1><p class="all-intro">${problems.filter(p=>!p.extension).length} printed problems and ${warmups.length} math warm-ups, followed by ${problems.filter(p=>p.extension).length} online extensions. Each problem keeps your current practice version synchronized with its simulation. Choose <strong>Packet original</strong> to return to the printed question; its answers stay saved separately.</p>${packet.sections.map(s=>`<section class="page-group" id="page-${s.number}"><header class="group-heading"><div class="eyebrow">${s.extension?'ONLINE EXTENSIONS · NOT IN THE PRINTED PACKET':`PAGE ${s.number}`}</div><h2>${esc(s.title)}</h2></header>${warmupsHTML(s)}${problems.filter(p=>p.section.number===s.number).map(cardHTML).join('')}</section>`).join('')}`;
 }else{
  const original=items.get(route),i=problems.indexOf(original);selectedPage=original.section.number;const current=viewFor(route);workspaceStore.rememberRoute(original,current.selection);
  if(!parsed.variantId)history.replaceState(null,'',workspaceHash(original,current.selection));
  $('workspace').className='single-view';$('workspace').innerHTML=`<div class="page-toolbar"><a href="#all" class="button">← All problems</a><div class="step-navigation">${i>0?`<a class="button" href="${esc(workspaceHash(problems[i-1],viewFor(problems[i-1].id).selection))}">← Previous</a>`:''}${i<problems.length-1?`<a class="button" href="${esc(workspaceHash(problems[i+1],viewFor(problems[i+1].id).selection))}">Next →</a>`:''}</div></div>${cardHTML(original)}${warmupsHTML(original.section)}`;
 }
 renderNav();updateTopNavigation();updateProgress();document.querySelectorAll('[data-record]').forEach(card=>updateCardStatus(card.dataset.record));saveState();if(scroll)window.scrollTo({top:0,behavior:'instant'});
}
function showCardFeedback(card,text,kind='neutral'){const el=card.querySelector('[data-feedback]');el.textContent=text;el.className=`feedback ${kind}`;}
function currentAnswers(card){return Object.fromEntries([...card.querySelectorAll('[data-answer]')].map(el=>[el.dataset.answer,el.value]));}
function submitNumeric(view,card){
 const id=view.recordId;for(const input of card.querySelectorAll('[data-answer]'))clampField(view,input);flush(id);const answers=currentAnswers(card),result=checkAnswers(view.p,view.lesson,answers),previous=responseFor(id);
 savePatch(id,{answers,status:result.status,reviewed:false,attempts:(previous.attempts||0)+1});showCardFeedback(card,result.feedback||'Review your answers.',result.correct?'good':'try');
 for(const field of card.querySelectorAll('[data-field-feedback]')){const f=result.fields?.[field.dataset.fieldFeedback];field.textContent=f?.message||'';field.classList.toggle('good',!!f?.correct);}
}
function submitConcept(view,card,compare=false){
 const id=view.recordId;flush(id);const explanation=card.querySelector('[data-explanation]').value;
 if(!explanation.trim()){showCardFeedback(card,'Write your explanation first. Then compare your reasoning.','try');return;}
 const result=checkAnswers(view.p,view.lesson,{}, {explanation}),saved=savePatch(id,{explanation,status:result.status,reviewed:false});
 showCardFeedback(card,saved.ok?'Response submitted and saved on this browser. Compare your reasoning to review it; written answers are not automatically graded.':'Response submitted here, but browser saving failed. Download a backup to keep it. Written answers are not automatically graded.',saved.ok?'neutral':'try');if(compare)renderReview(view,card);
}
function renderReview(view,card){
 const l=view.lesson,protectedQuestion=protectedView(view),g=protectedQuestion?getHandoutGuidance(view.original):null;
 card.querySelector('[data-review]').innerHTML=`<section class="reasoning-review"><h3>Compare your reasoning</h3><p class="review-notice">Check your own explanation against these points. Revise it if needed.</p><ul>${(g?g.prompts:l.criteria||[]).map(c=>`<li>${esc(c)}</li>`).join('')}</ul>${protectedQuestion?`<p>${esc(g.explanation)}</p><p class="review-notice">The handout answer is not shown. Try More practice to see a worked solution with different measurements.</p>`:`<div class="model-answer"><strong>MODEL EXPLANATION</strong>${esc(l.answer||view.p.answer)}</div>`}<button data-action="reviewed" class="primary">I checked my reasoning</button><p class="review-notice">This records a self-review, not an automatic correctness grade.</p></section>`;
}
function switchSelection(original,params){
 flushAll();const selected=workspaceStore.select(original,params);selectionError=selected.ok===false?selected.error||'Selection not saved.':'';
 if(route!=='all')history.replaceState(null,'',workspaceHash(original,selected));
 views.set(original.id,makeView(original,selected));readAll();updateTopNavigation();
 if(route==='all'){const card=document.getElementById(`card-${original.id}`);card.outerHTML=cardHTML(original);renderNav();updateProgress();updateCardStatus(selected.recordId);saveState();}
 else renderRoute({scroll:false});
}
$('workspace').addEventListener('input',e=>{
 const card=e.target.closest('[data-problem]');if(!card)return;const id=card.dataset.record;
 if(e.target.dataset.answer!==undefined)queueSave(id,{answers:{[e.target.dataset.answer]:e.target.value},status:'draft',reviewed:false});
 else if(e.target.matches('[data-explanation]'))queueSave(id,{explanation:e.target.value,status:'draft',reviewed:false});else return;
 card.querySelector('[data-feedback]').classList.add('hide');card.querySelector('[data-review]').innerHTML='';card.querySelectorAll('[data-field-feedback]').forEach(el=>el.textContent='');
});
$('workspace').addEventListener('focusout',e=>{const card=e.target.closest('[data-problem]');if(!card||e.target.dataset.answer===undefined)return;const view=viewFor(card.dataset.problem);if(clampField(view,e.target))queueSave(view.recordId,{answers:{[e.target.dataset.answer]:e.target.value},status:'draft',reviewed:false});});
$('workspace').addEventListener('click',e=>{
 if(e.target.closest('[data-simulation-link]')){flushAll();const card=e.target.closest('[data-problem]'),view=card&&viewFor(card.dataset.problem);if(view)workspaceStore.select(view.original,view.selection.params);return;}
 const button=e.target.closest('[data-action]'),card=button?.closest('[data-problem]');if(!card)return;const view=viewFor(card.dataset.problem),id=view.recordId;
 if(button.dataset.action==='practice'){const next=generatePractice(view.original,view.selection.params);switchSelection(view.original,next.params);}
 else if(button.dataset.action==='original')switchSelection(view.original,view.original.simulation.params);
 else if(button.dataset.action==='check')submitNumeric(view,card);
 else if(button.dataset.action==='save-concept')submitConcept(view,card);
 else if(button.dataset.action==='compare')submitConcept(view,card,true);
 else if(button.dataset.action==='reviewed'){
  flush(id);if(!responseFor(id).explanation.trim()){showCardFeedback(card,'Write and compare your explanation first.','try');return;}
  const saved=savePatch(id,{status:'reviewed',reviewed:true,explanation:responseFor(id).explanation});
  showCardFeedback(card,saved.ok?'Self-review recorded. You checked your reasoning against the criteria.':'Self-review marked here, but browser saving failed. Download a backup to keep it.',saved.ok?'good':'try');button.textContent='✓ Self-review recorded';button.disabled=true;
 }
});
function showModal(html){$('modalContent').innerHTML=html;if(!$('modal').open)$('modal').showModal();}
function openSaveDialog(){
 flushAll();showModal(`<h2>Save, load & share progress</h2><p class="dialog-note">Your answers save automatically in this browser. A backup restores answers, practice versions, custom measurements, and simulation controls on another device.</p><label class="student-name-label" for="studentName">Student name for the report (optional)</label><input id="studentName" type="text" maxlength="120" autocomplete="name" value="${esc(studentName)}"><div class="backup-actions"><button id="downloadReport" class="primary">Download teacher progress report (.txt)</button><button id="downloadPrintableReport">Download printable report (.html)</button><button id="downloadProgress">Download editable backup (.json)</button><button id="loadProgress">Load a progress backup</button><button id="resetProgress" class="danger">Reset saved responses…</button></div><p class="dialog-note">To share with your teacher, attach the report or backup in Google Classroom or an email. Nothing is sent automatically. The text report opens on any device. The printable report opens in a browser and can be printed to PDF.</p><p id="backupFeedback" class="dialog-note" role="status">Loading a backup merges saved work. Newer responses are kept; other problems are preserved.</p>`);
 $('studentName').oninput=e=>{studentName=e.target.value.slice(0,120);try{localStorage.setItem('motion-lab-student-name',studentName);}catch{}};
 $('downloadProgress').onclick=downloadProgress;$('downloadReport').onclick=()=>downloadReport(false);$('downloadPrintableReport').onclick=()=>downloadReport(true);$('loadProgress').onclick=()=>$('importFile').click();
 $('resetProgress').onclick=()=>{
  showModal('<h2>Reset all packet responses?</h2><p>This clears saved original problems, online extensions, practice responses, custom responses, and math warm-ups in this browser. Download a backup first if you want to keep them.</p><div class="action-row"><button id="confirmReset" class="primary">Reset all responses</button><button id="cancelReset">Cancel</button></div>');
  $('cancelReset').onclick=()=>$('modal').close();$('confirmReset').onclick=()=>{flushAll();const result=store.clear();if(!result.ok){showModal(`<h2>Could not reset</h2><p>${esc(result.error||'Browser storage is unavailable.')}</p>`);return;}records={};failedPatches.clear();lastSaveError='';$('modal').close();renderRoute();saySaved('Saved responses cleared');};
 };
}
$('backupBtn').onclick=openSaveDialog;
function availableRecords(){
 flushAll();const result=store.all(),available={...result.records};
 for(const[id,record]of Object.entries(records))if(!available[id]||Date.parse(record.updatedAt)>=Date.parse(available[id].updatedAt)||failedPatches.has(id))available[id]=record;
 return{records:available,ok:result.ok&&!failedPatches.size};
}
function downloadProgress(){
 const available=availableRecords(),result=backupStore.export({records:available.records});
 if(!result.json){if($('backupFeedback'))$('backupFeedback').textContent=result.error||'The backup could not be prepared. Your responses remain on this page.';return;}
 const size=new TextEncoder().encode(result.json).length;if(size>WORKSPACE_IMPORT_BYTES){if($('backupFeedback'))$('backupFeedback').textContent='This progress collection is too large for one backup. No file was downloaded.';return;}
 downloadText(result.json,`MotionLab-backup-${new Date().toISOString().slice(0,10)}.json`,'application/json');
 if($('backupFeedback'))$('backupFeedback').textContent=result.ok&&!result.incomplete&&available.ok?'Backup downloaded. Keep it to restore your work, or attach it to share with your teacher.':'Backup downloaded with the work available here, including unsaved responses. Browser storage could not be fully read; work from other visits may be missing.';
}
function downloadReport(printable=false){
 const available=availableRecords(),options={records:available.records,resolveRecord:recordView,studentName},report=printable?buildProgressReport(options):buildTextProgressReport(options),extension=printable?'html':'txt';
 downloadText(report,`MotionLab-progress-report-${new Date().toISOString().slice(0,10)}.${extension}`,printable?'text/html':'text/plain;charset=utf-8');
 if($('backupFeedback'))$('backupFeedback').textContent='Report download requested. Check your browser’s Downloads, then attach the file in Classroom or email. If the printable HTML report is blocked, use the text report. The JSON backup restores editable work.';
}
$('importFile').onchange=async e=>{
 const file=e.target.files?.[0];if(!file)return;flushAll();
 if(file.size>WORKSPACE_IMPORT_BYTES){showModal(`<h2>Backup not loaded</h2><p>Choose a Motion Lab progress JSON file smaller than ${WORKSPACE_IMPORT_BYTES/1000000} MB.</p>`);e.target.value='';return;}
 try{const result=backupStore.import(await file.text());if(!result.ok)throw new Error(result.error||'This backup could not be loaded.');const last=workspaceStore.lastRoute?.(),lastProblem=last&&items.get(last.id);if(lastProblem)history.replaceState(null,'',workspaceHash(lastProblem,workspaceStore.selection(lastProblem,last.variantId)));readAll();renderRoute();showModal(`<h2>Progress loaded</h2><p>${Number(result.imported)||0} saved responses were restored. ${Number(result.skipped)||0} older responses were skipped.</p><p class="dialog-note">Problems not included in the backup were preserved.</p>`);saveState();}catch(error){showModal(`<h2>Backup not loaded</h2><p>${esc(error.message)}</p>`);}e.target.value='';
};
$('closeModal').onclick=()=>$('modal').close();$('modal').onclick=e=>{if(e.target===$('modal')){const r=$('modal').getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)$('modal').close();}};
$('pageSelect').innerHTML=packet.sections.map(s=>`<option value="${s.number}">${s.extension?'':s.number+'. '}${esc(s.title)}</option>`).join('');
$('pageSelect').onchange=e=>{selectedPage=Number(e.target.value);if(route==='all'){renderNav();updateProgress();document.getElementById(`page-${selectedPage}`).scrollIntoView({block:'start',behavior:'smooth'});}else{const p=items.get(packet.sections.find(s=>s.number===selectedPage).problems[0].id);location.hash=workspaceHash(p,viewFor(p.id).selection);}};
$('themeBtn').onclick=()=>{theme=theme==='dark'?'light':'dark';document.body.classList.toggle('dark',theme==='dark');try{localStorage.setItem('motion-lab-theme',JSON.stringify(theme));}catch{}};
window.addEventListener('hashchange',()=>renderRoute());window.addEventListener('beforeunload',flushAll);window.addEventListener('pagehide',flushAll);
window.addEventListener('pageshow',e=>{if(e.persisted){readAll();renderRoute({scroll:false});}});
document.addEventListener('visibilitychange',()=>{if(document.hidden)flushAll();});
window.addEventListener('storage',e=>{
 if(e.key&&e.key.startsWith(WORKSPACE_SELECTION_PREFIX)){
  flushAll();const id=e.key.slice(WORKSPACE_SELECTION_PREFIX.length);views.delete(id);
  if(route===id){const original=items.get(id);if(original)history.replaceState(null,'',workspaceHash(original,viewFor(id).selection));}
  renderRoute({scroll:false});return;
 }
 if(e.key&&!e.key.startsWith(WORKSPACE_PROGRESS_PREFIX))return;
 const previous=records;readAll();updateProgress();
 document.querySelectorAll('[data-record]').forEach(card=>{
  const id=card.dataset.record;updateCardStatus(id);if(pending.has(id)||failedPatches.has(id))return;
  const record=responseFor(id);if(JSON.stringify(previous[id])===JSON.stringify(records[id]))return;
  card.querySelectorAll('[data-answer]').forEach(input=>{const view=viewFor(card.dataset.problem),field=view.lesson.fields.find(f=>f.key===input.dataset.answer);input.value=field?fieldValue(view,field):'';});const textarea=card.querySelector('[data-explanation]');if(textarea)textarea.value=record.explanation;
  card.querySelector('[data-review]').innerHTML='';card.querySelectorAll('[data-field-feedback]').forEach(el=>el.textContent='');showCardFeedback(card,records[id]?'Response updated from the simulation or another page.':'Response cleared in another page.');
 });saveState();
});
readAll();renderRoute();

document.querySelectorAll('#topSimulationLink,#topPacketLink').forEach(link=>link.addEventListener('click',flushAll));
if(new URLSearchParams(location.search).has('save')){const url=new URL(location.href);url.searchParams.delete('save');history.replaceState(null,'',url.pathname+url.search+url.hash);openSaveDialog();}
