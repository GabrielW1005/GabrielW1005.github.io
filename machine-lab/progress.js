/** Bounded, portable student progress. No account or server is required. */
import {defaultConfig,normalizeConfig} from './physics.js?v=progress-v1';

export const PROGRESS_SCHEMA='machine-lab-progress';
export const PROGRESS_VERSION=1;
export const MAX_SHARE_LENGTH=12000;
const MAX_JSON_BYTES=131072,MAX_RECENT=50,MAX_COUNTER=1000000;
const machines={lever:{label:'Lever',levels:4},ramp:{label:'Ramp',levels:3},pulley:{label:'Pulley',levels:4},wheel:{label:'Wheel & axle',levels:4},gears:{label:'Gears',levels:4},gearArms:{label:'Gear arms',levels:1},screw:{label:'Screw',levels:3},wedge:{label:'Wedge',levels:3},hydraulic:{label:'Syringes',levels:4}};
const TYPES=Object.keys(machines),TASKS=['force','balance','distance','acceleration'],MODES=['balance','challenge','auto'];
const CONFIG_KEYS=Object.keys(defaultConfig()).filter(k=>k!=='type');
const VARIABLES=[...CONFIG_KEYS,'rampRun','distance','acceleration'];
const plain=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const own=(value,key)=>plain(value)&&Object.prototype.hasOwnProperty.call(value,key)?value[key]:undefined;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const number=(value,min,max,fallback)=>typeof value==='number'&&Number.isFinite(value)?clamp(value,min,max):fallback;
const integer=(value,min,max,fallback=0)=>Math.floor(number(value,min,max,fallback));
const boolean=(value,fallback=false)=>typeof value==='boolean'?value:fallback;
const text=(value,max=80)=>Array.from(typeof value==='string'?value:typeof value==='number'&&Number.isFinite(value)?String(value):'').filter(c=>!/[\u0000-\u001f\u007f]/.test(c)).slice(0,max).join('');
function choice(value,options,fallback,label){
 if(value===undefined||value===null)return fallback;
 if(options.includes(value))return value;
 throw new Error(`Unsupported ${label}.`);
}
function timestamp(value,fallback=Date.now()){
 const n=typeof value==='string'?Date.parse(value):value;
 return typeof n==='number'&&Number.isFinite(n)&&n>=0&&n<=Date.UTC(2200,0,1)?Math.floor(n):fallback;
}
function cleanConfig(value,type){
 const candidate={type};
 for(const key of CONFIG_KEYS){const n=own(value,key);if(typeof n==='number'&&Number.isFinite(n))candidate[key]=n;}
 return normalizeConfig(candidate);
}
function cleanSaved(value){
 const skills={},balanceVariants={};
 for(const type of TYPES){
  const source=own(own(value,'skills'),type),row={};
  for(const task of TASKS)row[task]=integer(own(source,task),0,machines[type].levels);
  skills[type]=row;
  balanceVariants[type]=integer(own(own(value,'balanceVariants'),type),0,1000000000);
 }
 return {dark:boolean(own(value,'dark'),true),skills,serial:integer(own(value,'serial'),0,1000000000),pathWidth:number(own(value,'pathWidth'),1,10,3),balanceVariants};
}
function cleanView(value){
 const out={};
 for(const [key,fallback] of Object.entries({paths:true,forces:false,accelerations:false,charts:false,graphToggle:false,pullTool:true,autoAdvance:true}))out[key]=boolean(own(value,key),fallback);
 out.compareKind=choice(own(value,'compareKind'),['work','path','force'],'work','comparison view');
 out.plotKind=choice(own(value,'plotKind'),['distance','path','force','acceleration'],'distance','plot view');
 out.autoTarget=choice(own(value,'autoTarget'),['mass','geometry'],'mass','automatic balance target');
 const speed=own(value,'speed');out.speed=[.25,.5,1].includes(Number(speed))?Number(speed):1;
 return out;
}
function cleanSession(value,saved){
 const type=choice(own(value,'type'),TYPES,'lever','machine');
 let mode=choice(own(value,'mode'),MODES,'balance','activity');
 if(type==='gearArms')mode='balance';
 const task=mode==='balance'?'balance':choice(own(value,'task'),TASKS,'force','question type');
 const topic=choice(own(value,'topic'),['mixed',...TASKS],'mixed','practice topic');
 const config=cleanConfig(own(value,'config'),type),camera=own(value,'camera'),ramp=own(value,'rampView');
 const resistance=number(own(value,'resistance'),0,3,number(config.damping,0,3,0));config.damping=resistance;if(mode==='balance'||mode==='auto')config.force=0;
 const rampView=plain(ramp)&&['scale','baseY','x0'].every(k=>typeof own(ramp,k)==='number'&&Number.isFinite(own(ramp,k)))?{scale:number(ramp.scale,5,2000,100),baseY:number(ramp.baseY,0,540,350),x0:number(ramp.x0,-200,900,110)}:null;
 return {mode,type,task,topic,level:integer(own(value,'level'),0,machines[type].levels-1),variant:integer(own(value,'variant'),0,1000000000,mode==='balance'?saved.balanceVariants[type]:saved.serial),
  config,answer:text(own(value,'answer'),48),custom:boolean(own(value,'custom')),attempts:integer(own(value,'attempts'),0,MAX_COUNTER),credited:boolean(own(value,'credited')),forceCorrect:boolean(own(value,'forceCorrect')),resistance,
  camera:{zoom:number(own(camera,'zoom'),.6,3.5,1),cx:number(own(camera,'cx'),80,820,450),cy:number(own(camera,'cy'),30,510,270)},rampView,view:cleanView(own(value,'view'))};
}
function cleanAttempt(value){
 const type=own(value,'type');if(!TYPES.includes(type))return null;
 const mode=MODES.includes(own(value,'mode'))?value.mode:'balance',task=TASKS.includes(own(value,'task'))?value.task:'balance';
 const variable=own(value,'variable')??own(value,'key');
 return {at:timestamp(own(value,'at')),type,mode,task,level:integer(own(value,'level'),0,machines[type].levels-1),variant:integer(own(value,'variant'),0,1000000000),variable:VARIABLES.includes(variable)?variable:'',
  entry:text(own(value,'entry'),48),correct:boolean(own(value,'correct')),custom:boolean(own(value,'custom')),signature:text(own(value,'signature'),80).replace(/[^\x20-\x7e]/g,'')};
}
function cleanStats(value){
 const byMachine={};let sumAttempts=0,sumCorrect=0;
 for(const type of TYPES){const row=own(own(value,'byMachine'),type),attempts=integer(own(row,'attempts'),0,MAX_COUNTER),correct=integer(own(row,'correct'),0,attempts);byMachine[type]={attempts,correct};sumAttempts+=attempts;sumCorrect+=correct;}
 const attempts=Math.max(sumAttempts,integer(own(value,'attempts'),0,MAX_COUNTER*TYPES.length));
 const correct=Math.min(attempts,Math.max(sumCorrect,integer(own(value,'correct'),0,attempts)));
 const source=own(value,'recent'),recent=Array.isArray(source)?source.slice(-MAX_RECENT).map(cleanAttempt).filter(Boolean):[];
 return {attempts,correct,byMachine,recent};
}

/** Whitelists every field; untrusted object keys and hidden solutions are discarded. */
export function normalizeProgress(snapshot={}){
 if(!plain(snapshot))throw new Error('This is not a Machine Lab progress file.');
 if(own(snapshot,'schema')!==undefined&&snapshot.schema!==PROGRESS_SCHEMA)throw new Error('This is not a Machine Lab progress file.');
 if(own(snapshot,'version')!==undefined&&snapshot.version!==PROGRESS_VERSION)throw new Error('This progress file uses an unsupported version.');
 const saved=cleanSaved(own(snapshot,'saved'));
 return {schema:PROGRESS_SCHEMA,version:PROGRESS_VERSION,savedAt:new Date(timestamp(own(snapshot,'savedAt'))).toISOString(),student:text(own(snapshot,'student'),80),saved,
  session:cleanSession(own(snapshot,'session'),saved),stats:cleanStats(own(snapshot,'stats'))};
}
export function serializeProgress(snapshot,{pretty=false}={}){
 const result=JSON.stringify(normalizeProgress(snapshot),null,pretty?2:0);
 if(new TextEncoder().encode(result).length>MAX_JSON_BYTES)throw new Error('This progress file is too large.');
 return result;
}
export function parseProgress(source){
 if(typeof source!=='string'||source.length>MAX_JSON_BYTES||new TextEncoder().encode(source).length>MAX_JSON_BYTES)throw new Error('This progress file is too large or unreadable.');
 let value;try{value=JSON.parse(source.replace(/^\uFEFF/,''));}catch{throw new Error('This is not a readable progress file.');}
 if(!plain(value)||own(value,'schema')!==PROGRESS_SCHEMA||own(value,'version')!==PROGRESS_VERSION)throw new Error('This is not a supported Machine Lab progress file.');
 return normalizeProgress(value);
}
// Version 2 wire tables are deliberately fixed: new fields need a new wire version.
const WIRE_TYPES=['lever','ramp','pulley','wheel','gears','gearArms','screw','wedge','hydraulic'];
const WIRE_TASKS=['force','balance','distance','acceleration'],WIRE_MODES=['balance','challenge','auto'];
const WIRE_TOPICS=['mixed',...WIRE_TASKS];
const WIRE_CONFIG=['inputMass','outputMass','force','damping','rIn','rOut','length','height','teethIn','teethOut','crankRadius','drumRadius','handleRadius','lead','strands','pulleyTravel','pulleyRadius','areaIn','areaOut'];
const WIRE_VARIABLES=['',...WIRE_CONFIG,'rampRun','distance','acceleration'];
const WIRE_CHECKS=['paths','forces','accelerations','charts','graphToggle','pullTool','autoAdvance'];
const WIRE_COMPARE=['work','path','force'],WIRE_PLOT=['distance','path','force','acceleration'],WIRE_TARGET=['mass','geometry'],WIRE_SPEED=[.25,.5,1];
function compactProgress(p){
 const a=p.session,s=p.saved,stats=p.stats,time=Date.parse(p.savedAt);
 const machineRows=WIRE_TYPES.flatMap((type,i)=>{
  const row=[...WIRE_TASKS.map(task=>s.skills[type][task]),s.balanceVariants[type]];
  return row.some(Boolean)?[[i,...row]]:[];
 });
 const totals=WIRE_TYPES.flatMap((type,i)=>{const row=stats.byMachine[type];return row.attempts||row.correct?[[i,row.attempts,row.correct]]:[];});
 const v=a.view,view=[WIRE_CHECKS.reduce((bits,key,i)=>bits|(Number(v[key])<<i),0),WIRE_COMPARE.indexOf(v.compareKind),WIRE_PLOT.indexOf(v.plotKind),WIRE_TARGET.indexOf(v.autoTarget),WIRE_SPEED.indexOf(v.speed)];
 return [time,p.student,[Number(s.dark),s.serial,s.pathWidth,machineRows],
  [WIRE_TYPES.indexOf(a.type),WIRE_MODES.indexOf(a.mode),WIRE_TASKS.indexOf(a.task),WIRE_TOPICS.indexOf(a.topic),a.level,a.variant,WIRE_CONFIG.map(key=>a.config[key]),a.answer,Number(a.custom)|(Number(a.credited)<<1)|(Number(a.forceCorrect)<<2),a.attempts,a.resistance,[a.camera.zoom,a.camera.cx,a.camera.cy],a.rampView?[a.rampView.scale,a.rampView.baseY,a.rampView.x0]:null,view],
  [stats.attempts,stats.correct,totals,stats.recent.map(row=>[time-row.at,WIRE_TYPES.indexOf(row.type),WIRE_MODES.indexOf(row.mode),WIRE_TASKS.indexOf(row.task),row.level,row.variant,WIRE_VARIABLES.indexOf(row.variable),row.entry,Number(row.correct)|(Number(row.custom)<<1),row.signature])]];
}
const invalidLink=()=>new Error('This progress link is incomplete or invalid.');
function tuple(value,length){if(!Array.isArray(value)||value.length!==length)throw invalidLink();return value;}
function list(value,max){if(!Array.isArray(value)||value.length>max)throw invalidLink();return value;}
function finite(value){if(typeof value!=='number'||!Number.isFinite(value))throw invalidLink();return value;}
function whole(value,min,max){if(!Number.isInteger(value)||value<min||value>max)throw invalidLink();return value;}
function wireText(value,max){if(typeof value!=='string'||Array.from(value).length>max)throw invalidLink();return value;}
function lookup(table,index){return table[whole(index,0,table.length-1)];}
function expandProgress(value){
 const [time,student,s,a,t]=tuple(value,5);whole(time,0,Date.UTC(2200,0,1));wireText(student,80);tuple(s,4);tuple(a,14);tuple(t,4);
 const saved={dark:!!whole(s[0],0,1),serial:whole(s[1],0,1000000000),pathWidth:finite(s[2]),skills:{},balanceVariants:{}},seen=new Set();
 for(const row of list(s[3],WIRE_TYPES.length)){
  tuple(row,6);const type=lookup(WIRE_TYPES,row[0]);if(seen.has(type))throw invalidLink();seen.add(type);
  saved.skills[type]=Object.fromEntries(WIRE_TASKS.map((task,i)=>[task,whole(row[i+1],0,4)]));saved.balanceVariants[type]=whole(row[5],0,1000000000);
 }
 const type=lookup(WIRE_TYPES,a[0]),flags=whole(a[8],0,7),c=tuple(a[6],WIRE_CONFIG.length),camera=tuple(a[11],3),ramp=a[12]===null?null:tuple(a[12],3),view=tuple(a[13],5),bits=whole(view[0],0,127);
 const session={type,mode:lookup(WIRE_MODES,a[1]),task:lookup(WIRE_TASKS,a[2]),topic:lookup(WIRE_TOPICS,a[3]),level:whole(a[4],0,3),variant:whole(a[5],0,1000000000),
  config:{type,...Object.fromEntries(WIRE_CONFIG.map((key,i)=>[key,finite(c[i])]))},answer:wireText(a[7],48),custom:!!(flags&1),credited:!!(flags&2),forceCorrect:!!(flags&4),attempts:whole(a[9],0,MAX_COUNTER),resistance:finite(a[10]),
  camera:{zoom:finite(camera[0]),cx:finite(camera[1]),cy:finite(camera[2])},rampView:ramp?{scale:finite(ramp[0]),baseY:finite(ramp[1]),x0:finite(ramp[2])}:null,
  view:{...Object.fromEntries(WIRE_CHECKS.map((key,i)=>[key,!!(bits&(1<<i))])),compareKind:lookup(WIRE_COMPARE,view[1]),plotKind:lookup(WIRE_PLOT,view[2]),autoTarget:lookup(WIRE_TARGET,view[3]),speed:lookup(WIRE_SPEED,view[4])}};
 const stats={attempts:whole(t[0],0,MAX_COUNTER*WIRE_TYPES.length),correct:whole(t[1],0,MAX_COUNTER*WIRE_TYPES.length),byMachine:{},recent:[]};seen.clear();
 for(const row of list(t[2],WIRE_TYPES.length)){
  tuple(row,3);const key=lookup(WIRE_TYPES,row[0]);if(seen.has(key))throw invalidLink();seen.add(key);
  stats.byMachine[key]={attempts:whole(row[1],0,MAX_COUNTER),correct:whole(row[2],0,MAX_COUNTER)};
 }
 for(const row of list(t[3],MAX_RECENT)){
  tuple(row,10);const at=time-finite(row[0]);whole(at,0,Date.UTC(2200,0,1));const flags=whole(row[8],0,3);
  stats.recent.push({at,type:lookup(WIRE_TYPES,row[1]),mode:lookup(WIRE_MODES,row[2]),task:lookup(WIRE_TASKS,row[3]),level:whole(row[4],0,3),variant:whole(row[5],0,1000000000),variable:lookup(WIRE_VARIABLES,row[6]),entry:wireText(row[7],48),correct:!!(flags&1),custom:!!(flags&2),signature:wireText(row[9],80)});
 }
 return normalizeProgress({schema:PROGRESS_SCHEMA,version:PROGRESS_VERSION,savedAt:time,student,saved,session,stats});
}
function base64url(bytes){
 let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromBase64url(token){
 if(!token.length||token.length%4===1||!/^[A-Za-z0-9_-]+$/.test(token))throw invalidLink();
 const binary=atob(token.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(token.length/4)*4,'='));
 return Uint8Array.from(binary,c=>c.charCodeAt(0));
}
async function collectBounded(stream,maxBytes=MAX_JSON_BYTES){
 const reader=stream.getReader(),parts=[];let length=0;
 try{
  while(true){const {done,value}=await reader.read();if(done)break;length+=value.byteLength;if(length>maxBytes)throw invalidLink();parts.push(value);}
 }catch(error){await reader.cancel().catch(()=>{});throw error;}finally{reader.releaseLock();}
 const result=new Uint8Array(length);let offset=0;for(const part of parts){result.set(part,offset);offset+=part.byteLength;}return result;
}
/** Compact and compress the entire normalized snapshot, including all recent tests. */
export async function encodeProgress(snapshot,{compress=true}={}){
 const clean=normalizeProgress(snapshot),bytes=new TextEncoder().encode(JSON.stringify(compactProgress(clean)));
 if(bytes.byteLength>MAX_JSON_BYTES)throw new Error('Progress is too large to share as a link. Save a progress file instead.');
 let encoded='c2.'+base64url(bytes);
 if(compress&&typeof CompressionStream==='function'&&typeof DecompressionStream==='function'){
  const packed=await collectBounded(new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate')));
  const candidate='z2.'+base64url(packed);if(candidate.length<encoded.length)encoded=candidate;
 }
 if(encoded.length>MAX_SHARE_LENGTH)throw new Error('Progress is too large to share as a link. Save a progress file instead.');
 return encoded;
}
/** Supports both compact v2 links and every valid original v1 progress link. */
export async function decodeProgress(token){
 if(typeof token!=='string'||!token.length||token.length>MAX_SHARE_LENGTH)throw invalidLink();
 if(token.startsWith('z2.')&&typeof DecompressionStream!=='function')throw new Error('Open this compressed progress link in a current browser, or use a progress backup file.');
 try{
  const compressed=token.startsWith('z2.'),compact=compressed||token.startsWith('c2.');
  let bytes=fromBase64url(compact?token.slice(3):token);
  if(compressed)bytes=await collectBounded(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate')));
  if(bytes.byteLength>MAX_JSON_BYTES)throw invalidLink();
  const source=new TextDecoder('utf-8',{fatal:true}).decode(bytes);
  return compact?expandProgress(JSON.parse(source)):parseProgress(source);
 }catch{throw invalidLink();}
}
/** A test is counted once when an identical setup is run repeatedly in a row. */
export function recordAttempt(stats,attempt){
 const clean=cleanStats(stats),row=cleanAttempt(attempt);
 if(!row)throw new Error('Cannot save a test for an unknown machine.');
 if(row.signature&&clean.recent.at(-1)?.signature===row.signature)return clean;
 clean.attempts=Math.min(MAX_COUNTER*TYPES.length,clean.attempts+1);
 clean.correct=Math.min(clean.attempts,clean.correct+(row.correct?1:0));
 const machine=clean.byMachine[row.type];machine.attempts=Math.min(MAX_COUNTER,machine.attempts+1);machine.correct=Math.min(machine.attempts,machine.correct+(row.correct?1:0));
 clean.recent.push(row);if(clean.recent.length>MAX_RECENT)clean.recent.shift();
 return clean;
}
export function summarizeProgress(snapshot){
 const clean=normalizeProgress(snapshot),{stats}=clean;
 return {student:clean.student,savedAt:clean.savedAt,tests:stats.attempts,successfulTests:stats.correct,accuracy:stats.attempts?Math.round(stats.correct/stats.attempts*100):0,
  machines:TYPES.map(type=>({type,label:machines[type].label,tests:stats.byMachine[type].attempts,successfulTests:stats.byMachine[type].correct})).filter(row=>row.tests>0),recent:stats.recent};
}
