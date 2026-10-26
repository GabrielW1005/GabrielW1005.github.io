/* Shared selection and bounded, per-question browser state for both study views. */
import {createProgressStore,LIMITS} from './packet-core.js?v=20261026-2';
import packet from './data.js?v=20261026-2';
import {getPractice,listPracticeIds} from './practice.js?v=20261026-4';

export const WORKSPACE_SELECTION_PREFIX='motion-lab-selection-v1:';
export const WORKSPACE_SIMULATION_PREFIX='motion-lab-simulation-v1:';
export const WORKSPACE_PROGRESS_PREFIX='motion-lab-packet-v1:';
export const WORKSPACE_IMPORT_BYTES=12000000;
export const WORKSPACE_LAST_ROUTE_KEY='motion-lab-last-route-v1';
const workspaceProblems=packet.sections.flatMap(section=>section.problems);
const workspaceProblemMap=new Map(workspaceProblems.map(problem=>[problem.id,problem]));
const PROBLEM_IDS=workspaceProblems.map(problem=>problem.id);
const PACKET_IDS=[...PROBLEM_IDS,...packet.sections.flatMap(section=>(section.warmups||[]).map((_,i)=>`W${section.number}${String.fromCharCode(97+i)}`))];
export const WORKSPACE_IDS=Object.freeze([...PACKET_IDS,...PROBLEM_IDS.flatMap(id=>Array.from({length:24},(_,i)=>`${id}__v2_${String(i+1).padStart(2,'0')}`)),...PROBLEM_IDS.map(id=>`${id}__custom`)]);
const IDs=new Set(WORKSPACE_IDS),problemIDs=new Set(PROBLEM_IDS),maxStateBytes=30000;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const safeKey=k=>typeof k==='string'&&/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
const copy=v=>JSON.parse(JSON.stringify(v));
const fail=(error,extra={})=>({ok:false,error,...extra});
const schemaCache=new WeakMap(),quantityCache=new WeakMap();
const unitKeys=new Set(['distance','time','speed','acceleration','mass','force','momentum','answer']);
const dimensionUnits={distance:['m','cm','km'],time:['s','min','h'],speed:['m/s','km/h','cm/s','km/s'],acceleration:['m/s²','cm/s²'],mass:['kg','g'],force:['N','kN'],momentum:['kg·m/s','g·m/s']};
const units=new Set(Object.values(dimensionUnits).flat());
function answerUnits(problem,params){if(problem.extension){const dimension={netForce:'force',reactionForce:'force',buoyancy:'force',force:'force',weight:'force',acceleration:'acceleration',mass:'mass',momentum:'momentum',velocity:'speed'}[params._quantity];return dimension?dimensionUnits[dimension]:[...units];}const base=problem.numericAnswer?.unit;return Object.values(dimensionUnits).find(values=>values.includes(base))||[...units];}
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e16;
function scalar(v){return finite(v)||typeof v==='boolean'||typeof v==='string'&&v.length<=80;}
function stable(v){if(Array.isArray(v))return`[${v.map(stable).join(',')}]`;if(plain(v))return`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')}}`;return JSON.stringify(v);}
function validProblem(problem){return plain(problem)&&problemIDs.has(problem.id)&&plain(problem.simulation?.params);}
function knownKeys(problem){
 if(schemaCache.has(problem))return schemaCache.get(problem);
 const keys=new Map(Object.entries(problem.simulation.params).map(([key,value])=>[key,Array.isArray(value)?'array':typeof value]));
 for(const field of problem.simulation.adjustable||[])keys.set(field.key,'number');
 for(const key of ['frame','referenceSpeed','distanceScale','timeScale'])keys.set(key,'number');
 const quantities=new Set([problem.simulation.params._quantity].filter(Boolean));
 for(const id of listPracticeIds(problem)){const params=getPractice(problem,id).params;if(params._quantity)quantities.add(params._quantity);for(const[key,value]of Object.entries(params))keys.set(key,Array.isArray(value)?'array':typeof value);}
 quantityCache.set(problem,quantities);
 keys.set('_practiceVariant','string');keys.set('_displayUnits','object');
 schemaCache.set(problem,keys);return keys;
}
function cleanParams(problem,input){
 if(!plain(input)||Object.keys(input).length>96)return null;
 const allowed=knownKeys(problem),out={};
 for(const [key,value]of Object.entries(input)){
  if(!safeKey(key)||!allowed.has(key)||(Array.isArray(value)?'array':typeof value)!==allowed.get(key))return null;
  if(key==='_displayUnits'){
   if(!plain(value)||Object.keys(value).length>unitKeys.size)return null;
   out[key]={};for(const [dimension,unit]of Object.entries(value)){if(!unitKeys.has(dimension)||!(dimension==='answer'?answerUnits(problem,input):dimensionUnits[dimension]).includes(unit))return null;out[key][dimension]=unit;}
  }else if(key==='_quantity'){
   if(!quantityCache.get(problem)?.has(value))return null;out[key]=value;
  }else if(key==='_practiceVariant'){
   if(typeof value!=='string'||value.length>30)return null;out[key]=value;
  }else if(Array.isArray(value)){
   if(value.length>64||value.some(v=>key==='bodyLabels'?typeof v!=='string'||v.length>80:!finite(v)))return null;out[key]=[...value];
  }else{if(!scalar(value))return null;out[key]=value;}
 }
 for(const key of ['mass','mass1','mass2','compareMass','radius','radius1','radius2','springK','time','contactDuration','distanceScale','timeScale'])if(own(out,key)&&(!finite(out[key])||out[key]<=0))return null;
 if(out.times&&out.times.some((n,i)=>i&&n<=out.times[i-1]))return null;
 if(out.times&&out.positions&&out.times.length!==out.positions.length)return null;
 return out;
}
function comparable(problem,params){const value={...params};delete value._practiceVariant;delete value.frame;delete value.referenceSpeed;if(problem.simulation.kind==='piecewise'){value.distanceScale??=1;value.timeScale??=1;}return stable(value);}
function original(problem){return{mode:'original',variantId:'original',params:copy(problem.simulation.params),recordId:problem.id};}
function practice(problem,variantId){const generated=getPractice(problem,variantId);return{mode:'practice',variantId,params:copy(generated.params),recordId:`${problem.id}__v2_${variantId.slice(-2)}`};}
function classify(problem,input){
 const params=cleanParams(problem,input);if(!params)return null;
 const complete={...copy(problem.simulation.params),...params};
 if(comparable(problem,complete)===comparable(problem,problem.simulation.params))return{...original(problem),params:complete};
 const variant=params._practiceVariant;
 if(typeof variant==='string'&&listPracticeIds(problem).includes(variant)){
  const candidate=practice(problem,variant);
  if(comparable(problem,complete)===comparable(problem,candidate.params))return{...candidate,params:complete};
 }
 delete complete._practiceVariant;
 return{mode:'custom',variantId:'custom',params:complete,recordId:`${problem.id}__custom`};
}
function decodeSelection(problem,data){
 if(!plain(data)||data.version!==1||!['original','practice','custom'].includes(data.mode)||Object.keys(data).some(k=>!['version','mode','variantId','params','updatedAt'].includes(k)))return null;
 if(typeof data.updatedAt!=='string'||data.updatedAt.length>40||!Number.isFinite(Date.parse(data.updatedAt)))return null;
 const selection=classify(problem,data.params);
 if(!selection||selection.mode!==data.mode||selection.variantId!==data.variantId)return null;
 return selection;
}
function serialized(selection){return JSON.stringify({version:1,mode:selection.mode,variantId:selection.variantId,params:selection.params,updatedAt:new Date().toISOString()});}
function cleanSimulation(input){
 if(!plain(input)||Object.keys(input).some(k=>!['answer','exploration','time','graph','stepsRevealed'].includes(k)))return null;
 const value={answer:'',exploration:{},time:0,graph:'',stepsRevealed:false,...input};
 if(typeof value.answer!=='string'||value.answer.length>LIMITS.answerLength||!plain(value.exploration)||Object.keys(value.exploration).length>16||!finite(value.time)||value.time<0||typeof value.graph!=='string'||!/^[A-Za-z0-9_-]{0,40}$/.test(value.graph)||typeof value.stepsRevealed!=='boolean')return null;
 for(const [key,n]of Object.entries(value.exploration))if(!safeKey(key)||!finite(n))return null;
 return copy(value);
}

/** Canonical routes keep a practice question stable when changing study views. */
export function parseWorkspaceRoute(hash){
 let raw=typeof hash==='string'?hash.replace(/^#/,''):'';
 try{raw=decodeURIComponent(raw);}catch{return{id:'P01',variantId:null,all:false};}
 if(raw==='all')return{id:'P01',variantId:null,all:true};
 const parts=raw.split('/'),id=problemIDs.has(parts[0])?parts[0]:'P01';
 if(parts.length!==1&&parts.length!==2)return{id,variantId:null,all:false};
 const requested=parts[1];
 const variantId=requested==='original'||requested==='custom'||new RegExp(`^${id}-v2-(0[1-9]|1[0-9]|2[0-4])$`).test(requested||'')?requested:null;
 return{id,variantId,all:false};
}
export function workspaceHash(problem,selection){
 const id=typeof problem==='string'?problem:problem?.id;
 if(!problemIDs.has(id))throw new TypeError('Unknown workspace problem.');
 const variant=selection?.mode==='practice'?selection.variantId:selection?.mode==='custom'?'custom':'original';
 if(!['original','custom'].includes(variant)&&!new RegExp(`^${id}-v2-(0[1-9]|1[0-9]|2[0-4])$`).test(variant))throw new TypeError('The practice variant belongs to a different problem.');
 return`#${id}/${variant}`;
}
export function workspaceLink(page,problem,selection){if(!['index.html','packet.html'].includes(page))throw new TypeError('Unknown study view.');return page+workspaceHash(problem,selection);}

export function createWorkspaceProgressStore(storage){return createProgressStore(storage,{ids:WORKSPACE_IDS,prefix:WORKSPACE_PROGRESS_PREFIX,importBytes:WORKSPACE_IMPORT_BYTES});}
export function createWorkspaceStore(storage){
 let backend=storage,unavailable='';
 if(backend===undefined){try{backend=globalThis.localStorage;}catch{unavailable='Browser storage is blocked.';}}
 if(!backend||!['getItem','setItem','removeItem'].every(k=>typeof backend[k]==='function'))unavailable||='Browser storage is unavailable.';
 const localSelections=new Map(),localCustom=new Map(),localSimulation=new Map();
 const error=()=>unavailable||'Could not save or read this workspace in browser storage.';
 function read(key){
  if(unavailable)return fail(error());
  try{const raw=backend.getItem(key);if(raw===null)return{ok:true,data:null};if(typeof raw!=='string'||raw.length>maxStateBytes||new TextEncoder().encode(raw).length>maxStateBytes)return fail('Saved workspace is too large or invalid.');return{ok:true,data:JSON.parse(raw)};}catch{return fail(error());}
 }
 function readSelection(problem,custom=false){
  const cached=(custom?localCustom:localSelections).get(problem.id),result=read(WORKSPACE_SELECTION_PREFIX+problem.id+(custom?':custom':''));
  if(!result.ok)return{...result,selection:cached?copy(cached):null};
  if(result.data===null)return{ok:true,selection:null};
  const value=decodeSelection(problem,result.data);if(!value||custom&&value.mode!=='custom')return fail('Saved problem measurements are invalid.',{selection:cached?copy(cached):null});
  (custom?localCustom:localSelections).set(problem.id,copy(value));return{ok:true,selection:value};
 }
 function selection(problem,requestedVariant=null){
  if(!validProblem(problem))throw new TypeError('Unknown workspace problem.');
  const fallback=original(problem);
  if(requestedVariant==='original'||typeof requestedVariant==='string'&&listPracticeIds(problem).includes(requestedVariant)){
   const desired=requestedVariant==='original'?fallback:practice(problem,requestedVariant),active=readSelection(problem);
   if(active.selection?.mode===desired.mode&&active.selection?.variantId===desired.variantId){for(const key of ['frame','referenceSpeed'])if(own(active.selection.params,key))desired.params[key]=active.selection.params[key];}
   return{...desired,ok:active.ok,...(!active.ok?{error:active.error}:{})};
  }
  if(requestedVariant!==null&&requestedVariant!=='custom')return{...fallback,ok:false,error:'That practice question is unavailable. The printed problem is shown.'};
  const loaded=readSelection(problem,requestedVariant==='custom');
  if(loaded.selection)return{...loaded.selection,ok:loaded.ok,...(!loaded.ok?{error:loaded.error}:{})};
  if(requestedVariant==='custom')return{...fallback,ok:false,error:loaded.error||'The custom measurements are no longer saved. The printed problem is shown.'};
  return{...fallback,ok:loaded.ok,...(!loaded.ok?{error:loaded.error}:{})};
 }
 function selectionForRecord(problem,recordId){
  if(recordId===problem.id)return selection(problem,'original');
  if(recordId===`${problem.id}__custom`)return selection(problem,'custom');
  const match=typeof recordId==='string'?recordId.match(/^(P\d{2})__v2_(\d{2})$/):null;
  if(match&&match[1]===problem.id)return selection(problem,`${problem.id}-v2-${match[2]}`);
  return{...original(problem),ok:false,error:'This saved response does not belong to this question.'};
 }
 function select(problem,params){
  if(!validProblem(problem))throw new TypeError('Unknown workspace problem.');
  const chosen=classify(problem,params);if(!chosen)return{...original(problem),ok:false,error:'These measurements cannot be saved.'};
  const previousCustom=chosen.mode==='custom'?readSelection(problem,true):null;
  const changedCustom=chosen.mode==='custom'&&(!previousCustom?.selection||comparable(problem,previousCustom.selection.params)!==comparable(problem,chosen.params));
  localSelections.set(problem.id,copy(chosen));
  if(chosen.mode==='custom')localCustom.set(problem.id,copy(chosen));
  if(changedCustom)localSimulation.delete(chosen.recordId);
  if(unavailable)return{...chosen,ok:false,error:error(),clearedCustom:changedCustom};
  const updates=new Map([[WORKSPACE_SELECTION_PREFIX+problem.id,serialized(chosen)],[WORKSPACE_LAST_ROUTE_KEY,JSON.stringify({id:problem.id,variantId:chosen.variantId})]]);
  if(chosen.mode==='custom')updates.set(WORKSPACE_SELECTION_PREFIX+problem.id+':custom',serialized(chosen));
  if(changedCustom){updates.set(WORKSPACE_PROGRESS_PREFIX+chosen.recordId,null);updates.set(WORKSPACE_SIMULATION_PREFIX+chosen.recordId,null);}
  const old=new Map(),attempted=[];
  try{
   for(const key of updates.keys())old.set(key,backend.getItem(key));
   for(const [key,value]of updates){attempted.push(key);if(value===null)backend.removeItem(key);else backend.setItem(key,value);if(backend.getItem(key)!==value)throw new Error('Unconfirmed write');}
   return{...chosen,ok:true,clearedCustom:changedCustom};
  }catch{
   let partial=false;for(const key of attempted){try{const value=old.get(key);if(value===null)backend.removeItem(key);else backend.setItem(key,value);if(backend.getItem(key)!==value)partial=true;}catch{partial=true;}}
   return{...chosen,ok:false,error:partial?'Browser storage failed. Some workspace changes could not be restored.':error(),clearedCustom:changedCustom};
  }
 }
 function simulation(recordId){
  if(!IDs.has(recordId))return fail('Unknown question state.',{state:null});
  const loaded=read(WORKSPACE_SIMULATION_PREFIX+recordId);
  if(!loaded.ok)return{...loaded,state:localSimulation.has(recordId)?copy(localSimulation.get(recordId)):null};
  if(loaded.data===null)return{ok:true,state:null};
  const state=cleanSimulation(loaded.data);return state?{ok:true,state}:fail('Saved simulation controls are invalid.',{state:null});
 }
 function saveSimulation(recordId,patch){
  if(!IDs.has(recordId))return fail('Unknown question state.',{state:null});
  if(!plain(patch)||Object.keys(patch).some(k=>!['answer','exploration','time','graph','stepsRevealed'].includes(k))||own(patch,'exploration')&&!plain(patch.exploration))return fail('Invalid simulation controls.',{state:null});
  const old=simulation(recordId),state=cleanSimulation({...old.state,...patch,exploration:{...old.state?.exploration,...patch.exploration}});
  if(!state)return fail('Invalid simulation controls.',{state:old.state});
  localSimulation.set(recordId,state);
  if(unavailable)return fail(error(),{state});
  try{const text=JSON.stringify(state),key=WORKSPACE_SIMULATION_PREFIX+recordId;backend.setItem(key,text);if(backend.getItem(key)!==text)return fail('Could not confirm that simulation controls were saved.',{state});return{ok:true,state:copy(state)};}catch{return fail(error(),{state});}
 }
 function lastRoute(){const result=read(WORKSPACE_LAST_ROUTE_KEY);return cleanLastRoute(result.data)||{id:'P01',variantId:null,all:false};}
 function rememberRoute(problem,selected){
  let route;try{route=parseWorkspaceRoute(workspaceHash(problem,selected));}catch{return fail('Unknown workspace route.');}
  if(unavailable)return fail(error());
  try{const text=JSON.stringify({id:route.id,variantId:route.variantId});if(backend.getItem(WORKSPACE_LAST_ROUTE_KEY)!==text)backend.setItem(WORKSPACE_LAST_ROUTE_KEY,text);if(backend.getItem(WORKSPACE_LAST_ROUTE_KEY)!==text)return fail('Could not confirm that the selected problem was saved.');return{ok:true,route};}catch{return fail(error());}
 }
 return Object.freeze({selection,select,selectionForRecord,simulation,saveSimulation,lastRoute,rememberRoute});
}

function cleanLastRoute(value){
 if(!plain(value)||Object.keys(value).some(key=>!['id','variantId','all'].includes(key))||!problemIDs.has(value.id))return null;
 const variant=value.variantId;if(variant!==null&&variant!=='original'&&variant!=='custom'&&!new RegExp(`^${value.id}-v2-(0[1-9]|1[0-9]|2[0-4])$`).test(variant||''))return null;
 return{id:value.id,variantId:variant,all:false};
}
const BACKUP_FORMAT='motion-lab-workspace-backup';
function memoryStorage(){const map=new Map();return{getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};}
function validDate(value){return typeof value==='string'&&value.length<=40&&Number.isFinite(Date.parse(value));}
function validateSnapshot(input){
 if(!plain(input)||input.version!==1||Object.keys(input).some(key=>!['version','selections','custom','simulations','lastRoute'].includes(key)))return fail('The workspace measurements are invalid.');
 if(!plain(input.selections)||!plain(input.custom)||!plain(input.simulations)||Object.keys(input.selections).length>problemIDs.size||Object.keys(input.custom).length>problemIDs.size||Object.keys(input.simulations).length>IDs.size)return fail('The workspace state is invalid or too large.');
 for(const [kind,items]of [['selections',input.selections],['custom',input.custom]])for(const[id,data]of Object.entries(items)){
  const problem=workspaceProblemMap.get(id),selection=problem&&decodeSelection(problem,data);
  if(!selection||kind==='custom'&&selection.mode!=='custom'||new TextEncoder().encode(JSON.stringify(data)).length>maxStateBytes)return fail(`Saved measurements for ${id} are invalid.`);
 }
 for(const[id,state]of Object.entries(input.simulations))if(!IDs.has(id)||!cleanSimulation(state)||new TextEncoder().encode(JSON.stringify(state)).length>maxStateBytes||id.endsWith('__custom')&&!own(input.custom,id.split('__')[0]))return fail(`Saved simulation for ${id} is invalid or missing its custom measurements.`);
 if(input.lastRoute!==null&&!cleanLastRoute(input.lastRoute))return fail('The last selected problem is invalid.');
 for(const[id,data]of Object.entries(input.selections))if(data.mode==='custom'){
  const saved=input.custom[id];if(!saved||comparable(workspaceProblemMap.get(id),saved.params)!==comparable(workspaceProblemMap.get(id),data.params))return fail(`Custom measurements for ${id} do not match the active question.`);
 }
 return{ok:true,snapshot:copy(input)};
}
/** Downloadable full workspace backups. Imports validate before any writes and roll back together. */
export function createWorkspaceBackupStore(storage){
 let backend=storage,unavailable='';
 if(backend===undefined){try{backend=globalThis.localStorage;}catch{unavailable='Browser storage is blocked.';}}
 if(!backend||!['getItem','setItem','removeItem'].every(key=>typeof backend[key]==='function'))unavailable||='Browser storage is unavailable.';
 const progress=createWorkspaceProgressStore(backend);
 function raw(key){if(unavailable)throw new Error(unavailable);const text=backend.getItem(key);if(text===null)return null;if(typeof text!=='string'||text.length>maxStateBytes)throw new Error('A saved workspace entry is too large.');return JSON.parse(text);}
 function exportBackup({records}={}){
  if(records!==undefined&&!plain(records))return fail('The supplied responses are invalid.');
  const result=progress.export();if(!result.ok&&!records)return result;
  const recordValues={...(result.data?.records||result.records||{})};
  for(const[id,record]of Object.entries(records||{}))recordValues[id]=record;
  const exportedAt=new Date().toISOString(),progressData={format:'motion-lab-packet-progress',version:1,exportedAt,records:recordValues};
  const checked=createWorkspaceProgressStore(memoryStorage()).import(progressData);if(!checked.ok)return checked;
  const snapshot={version:1,selections:{},custom:{},simulations:{},lastRoute:null};let incomplete=!result.ok;
  try{
   for(const problem of workspaceProblems){
    const active=raw(WORKSPACE_SELECTION_PREFIX+problem.id),custom=raw(WORKSPACE_SELECTION_PREFIX+problem.id+':custom');
    if(active!==null)snapshot.selections[problem.id]=active;if(custom!==null)snapshot.custom[problem.id]=custom;
   }
   for(const id of WORKSPACE_IDS){const state=raw(WORKSPACE_SIMULATION_PREFIX+id);if(state!==null)snapshot.simulations[id]=state;}
   snapshot.lastRoute=raw(WORKSPACE_LAST_ROUTE_KEY);
  }catch(error){if(!records)return fail(error.message||'The complete workspace could not be read.');incomplete=true;}
  const validated=validateSnapshot(snapshot);if(!validated.ok)return validated;
  for(const id of Object.keys(recordValues))if(id.endsWith('__custom')&&!snapshot.custom[id.split('__')[0]])return fail('Custom measurements could not be read. Download the teacher report to preserve the responses available here.');
  const data={format:BACKUP_FORMAT,version:2,exportedAt,progress:progressData,workspace:snapshot},json=JSON.stringify(data,null,2);
  if(new TextEncoder().encode(json).length>WORKSPACE_IMPORT_BYTES)return fail('Saved work is too large for one workspace backup.');
  return{ok:true,data,json,incomplete,...(incomplete?{warning:'Some browser state could not be read. The backup includes the responses available on this page.'}:{})};
 }
 function importBackup(input,{overwrite=false}={}){
  let text,data;try{text=typeof input==='string'?input:JSON.stringify(input);if(typeof text!=='string'||text.length>WORKSPACE_IMPORT_BYTES||new TextEncoder().encode(text).length>WORKSPACE_IMPORT_BYTES)return fail('This progress backup is too large.');data=JSON.parse(text);}catch{return fail('This file is not valid JSON.');}
  if(data?.format==='motion-lab-packet-progress')return progress.import(data,{overwrite});
  if(!plain(data)||Object.keys(data).some(key=>!['format','version','exportedAt','progress','workspace'].includes(key))||data.format!==BACKUP_FORMAT||data.version!==2||!validDate(data.exportedAt))return fail('This is not a supported Motion Lab workspace backup.');
  const checked=createWorkspaceProgressStore(memoryStorage()).import(data.progress);if(!checked.ok)return checked;
  const validated=validateSnapshot(data.workspace);if(!validated.ok)return validated;
  const incoming=data.progress.records,snapshot=validated.snapshot;
  for(const id of Object.keys(incoming))if(id.endsWith('__custom')&&!snapshot.custom[id.split('__')[0]])return fail(`The custom response ${id} is missing its measurements.`);
  if(unavailable)return fail(unavailable);
  const updates=new Map(),old=new Map(),skipCustom=new Set(),replaceCustom=new Set();let imported=0,skipped=0;
  try{
   // A custom measurement and its answer are one unit. Never pair a saved answer with different measurements.
   for(const[id,entry]of Object.entries(snapshot.custom)){
    const key=WORKSPACE_SELECTION_PREFIX+id+':custom',local=raw(key),problem=workspaceProblemMap.get(id),recordId=id+'__custom',localResponse=progress.load(recordId);
    if(!localResponse.ok)return localResponse;
    if(local&&!decodeSelection(problem,local))return fail(`Existing custom measurements for ${id} are invalid.`);
    const same=local&&comparable(problem,local.params)===comparable(problem,entry.params);
    const localTime=Math.max(Date.parse(local?.updatedAt)||0,Date.parse(localResponse.record?.updatedAt)||0),incomingTime=Math.max(Date.parse(entry.updatedAt),Date.parse(incoming[recordId]?.updatedAt)||0);
    if(!overwrite&&!same&&local&&localTime>incomingTime){skipCustom.add(id);continue;}
    if(!same){replaceCustom.add(id);updates.set(WORKSPACE_PROGRESS_PREFIX+recordId,null);updates.set(WORKSPACE_SIMULATION_PREFIX+recordId,null);}
    if(overwrite||!local||Date.parse(entry.updatedAt)>=Date.parse(local.updatedAt)||!same)updates.set(key,JSON.stringify(entry));
   }
   const acceptedRecords=new Set();
   for(const[id,record]of Object.entries(incoming)){
    const base=id.split('__')[0];if(id.endsWith('__custom')&&skipCustom.has(base)){skipped++;continue;}
    const loaded=progress.load(id);if(!loaded.ok)return loaded;
    if(!overwrite&&!(id.endsWith('__custom')&&replaceCustom.has(base))&&loaded.record&&Date.parse(loaded.record.updatedAt)>Date.parse(record.updatedAt)){skipped++;continue;}
    updates.set(WORKSPACE_PROGRESS_PREFIX+id,JSON.stringify(record));acceptedRecords.add(id);imported++;
   }
   for(const[id,entry]of Object.entries(snapshot.selections)){
    if(entry.mode==='custom'&&skipCustom.has(id))continue;
    const key=WORKSPACE_SELECTION_PREFIX+id,local=raw(key);
    if(local&&!decodeSelection(workspaceProblemMap.get(id),local))return fail(`Existing measurements for ${id} are invalid.`);
    if(overwrite||!local||Date.parse(entry.updatedAt)>=Date.parse(local.updatedAt)||entry.mode==='custom'&&replaceCustom.has(id))updates.set(key,JSON.stringify(entry));
   }
   for(const[id,state]of Object.entries(snapshot.simulations)){
    if(id.endsWith('__custom')&&skipCustom.has(id.split('__')[0]))continue;
    const local=raw(WORKSPACE_SIMULATION_PREFIX+id);
    if(local&&!cleanSimulation(local))return fail(`Existing simulation for ${id} is invalid.`);
    // An older backup cannot replace controls linked to a newer response.
    if(overwrite||acceptedRecords.has(id)||local===null&&!own(incoming,id))updates.set(WORKSPACE_SIMULATION_PREFIX+id,JSON.stringify(state));
   }
   if(snapshot.lastRoute){const route=snapshot.lastRoute;if(!(route.variantId==='custom'&&skipCustom.has(route.id)))updates.set(WORKSPACE_LAST_ROUTE_KEY,JSON.stringify({id:route.id,variantId:route.variantId}));}
   // Keep an already selected custom question coherent if its measurements were replaced.
   for(const id of replaceCustom){
    const key=WORKSPACE_SELECTION_PREFIX+id,active=updates.has(key)?JSON.parse(updates.get(key)):raw(key);
    if(active?.mode==='custom')updates.set(key,JSON.stringify(snapshot.custom[id]));
   }
   for(const key of updates.keys())old.set(key,backend.getItem(key));
  }catch(error){return fail(error.message||'The existing workspace could not be read.');}
  const attempted=[];
  try{
   for(const[key,value]of updates){attempted.push(key);if(value===null)backend.removeItem(key);else backend.setItem(key,value);if(backend.getItem(key)!==value)throw new Error('Unconfirmed write');}
   return{ok:true,imported,skipped,workspaceEntries:updates.size};
  }catch{
   let partial=false;for(const key of attempted){try{const previous=old.get(key);if(previous===null)backend.removeItem(key);else backend.setItem(key,previous);if(backend.getItem(key)!==previous)partial=true;}catch{partial=true;}}
   return fail(partial?'Import stopped because browser storage failed. Some workspace changes could not be restored.':'Import could not be saved. Earlier answers and experiment settings were restored.',{imported:partial?imported:0,skipped,partial});
  }
 }
 return Object.freeze({export:exportBackup,import:importBackup});
}
