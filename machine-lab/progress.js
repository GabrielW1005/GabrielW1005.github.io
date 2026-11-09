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
 for(const [key,fallback] of Object.entries({paths:true,forces:true,accelerations:false,charts:false,graphToggle:false,pullTool:true,autoAdvance:true}))out[key]=boolean(own(value,key),fallback);
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
function base64url(source){
 const bytes=new TextEncoder().encode(source);let binary='';for(const byte of bytes)binary+=String.fromCharCode(byte);
 return btoa(binary).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
/** Keep all totals and current work; trim only oldest recent rows to fit a share link. */
export function encodeProgress(snapshot){
 const clean=normalizeProgress(snapshot);let encoded=base64url(JSON.stringify(clean));
 while(encoded.length>MAX_SHARE_LENGTH&&clean.stats.recent.length){clean.stats.recent.shift();encoded=base64url(JSON.stringify(clean));}
 if(encoded.length>MAX_SHARE_LENGTH)throw new Error('Progress is too large to share as a link. Save a progress file instead.');
 return encoded;
}
export function decodeProgress(token){
 if(typeof token!=='string'||!token.length||token.length>MAX_SHARE_LENGTH||token.length%4===1||!/^[A-Za-z0-9_-]+$/.test(token))throw new Error('This progress link is incomplete or invalid.');
 try{
  const binary=atob(token.replace(/-/g,'+').replace(/_/g,'/').padEnd(Math.ceil(token.length/4)*4,'='));
  const bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));
  return parseProgress(new TextDecoder('utf-8',{fatal:true}).decode(bytes));
 }catch{throw new Error('This progress link is incomplete or invalid.');}
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
