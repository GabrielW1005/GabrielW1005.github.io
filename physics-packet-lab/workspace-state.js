/* Shared selection and bounded, per-question browser state for both study views. */
import {PACKET_IDS,PROBLEM_IDS,createProgressStore,LIMITS} from './packet-core.js?v=20261025-2';
import {getPractice,listPracticeIds} from './practice.js?v=20261025-2';

export const WORKSPACE_SELECTION_PREFIX='motion-lab-selection-v1:';
export const WORKSPACE_SIMULATION_PREFIX='motion-lab-simulation-v1:';
export const WORKSPACE_PROGRESS_PREFIX='motion-lab-packet-v1:';
export const WORKSPACE_IMPORT_BYTES=12000000;
export const WORKSPACE_IDS=Object.freeze([...PACKET_IDS,...PROBLEM_IDS.flatMap(id=>Array.from({length:24},(_,i)=>`${id}__v2_${String(i+1).padStart(2,'0')}`)),...PROBLEM_IDS.map(id=>`${id}__custom`)]);
const IDs=new Set(WORKSPACE_IDS),problemIDs=new Set(PROBLEM_IDS),maxStateBytes=30000;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const safeKey=k=>typeof k==='string'&&/^[A-Za-z_][A-Za-z0-9_]{0,63}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
const copy=v=>JSON.parse(JSON.stringify(v));
const fail=(error,extra={})=>({ok:false,error,...extra});
const schemaCache=new WeakMap();
const unitKeys=new Set(['distance','time','speed','acceleration','mass','force','momentum','answer']);
const dimensionUnits={distance:['m','cm','km'],time:['s','min','h'],speed:['m/s','km/h','cm/s'],acceleration:['m/s²','cm/s²'],mass:['kg','g'],force:['N','kN'],momentum:['kg·m/s','g·m/s']};
const units=new Set(Object.values(dimensionUnits).flat());
function answerUnits(problem){const base=problem.numericAnswer?.unit;return Object.values(dimensionUnits).find(values=>values.includes(base))||[...units];}
const finite=n=>typeof n==='number'&&Number.isFinite(n)&&Math.abs(n)<=1e16;
function scalar(v){return finite(v)||typeof v==='boolean'||typeof v==='string'&&v.length<=80;}
function stable(v){if(Array.isArray(v))return`[${v.map(stable).join(',')}]`;if(plain(v))return`{${Object.keys(v).sort().map(k=>JSON.stringify(k)+':'+stable(v[k])).join(',')}}`;return JSON.stringify(v);}
function validProblem(problem){return plain(problem)&&problemIDs.has(problem.id)&&plain(problem.simulation?.params);}
function knownKeys(problem){
 if(schemaCache.has(problem))return schemaCache.get(problem);
 const keys=new Map(Object.entries(problem.simulation.params).map(([key,value])=>[key,Array.isArray(value)?'array':typeof value]));
 for(const field of problem.simulation.adjustable||[])keys.set(field.key,'number');
 for(const key of ['frame','referenceSpeed','distanceScale','timeScale'])keys.set(key,'number');
 for(const id of listPracticeIds(problem))for(const [key,value]of Object.entries(getPractice(problem,id).params))keys.set(key,Array.isArray(value)?'array':typeof value);
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
   out[key]={};for(const [dimension,unit]of Object.entries(value)){if(!unitKeys.has(dimension)||!(dimension==='answer'?answerUnits(problem):dimensionUnits[dimension]).includes(unit))return null;out[key][dimension]=unit;}
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
  const updates=new Map([[WORKSPACE_SELECTION_PREFIX+problem.id,serialized(chosen)]]);
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
 return Object.freeze({selection,select,selectionForRecord,simulation,saveSimulation});
}
