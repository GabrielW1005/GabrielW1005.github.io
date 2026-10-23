/* Pure packet grading and bounded local progress. No network or text-response grading. */
export const PROBLEM_IDS=Object.freeze(Array.from({length:32},(_,i)=>`P${String(i+1).padStart(2,'0')}`));
export const WARMUP_IDS=Object.freeze(Array.from({length:8},(_,i)=>['a','b','c'].map(letter=>`W${i+1}${letter}`)).flat());
export const PACKET_IDS=Object.freeze([...PROBLEM_IDS,...WARMUP_IDS]);
const IDS=new Set(PACKET_IDS),PREFIX='motion-lab-packet-v1:',FORMAT='motion-lab-packet-progress',VERSION=1;
const own=(o,k)=>Object.prototype.hasOwnProperty.call(o||{},k);
const plain=o=>o!==null&&typeof o==='object'&&!Array.isArray(o)&&(Object.getPrototypeOf(o)===Object.prototype||Object.getPrototypeOf(o)===null);
const safeKey=k=>typeof k==='string'&&/^[A-Za-z][A-Za-z0-9_-]{0,63}$/.test(k)&&!['__proto__','constructor','prototype'].includes(k);
const copy=o=>JSON.parse(JSON.stringify(o));
const fail=(error,extra={})=>({ok:false,error,...extra});
// Every valid 56-item export fits this budget, even when each character needs JSON escaping.
export const LIMITS=Object.freeze({answerLength:500,explanationLength:6000,answerFields:16,recordBytes:100000,importBytes:6000000,attempts:100000});
const STATUSES=new Set(['draft','correct','needs-work','saved','reviewed']);
function decimal(token){
 const value=token.trim();
 if(!/^[+-]?(?:(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d*)?|\.\d+)(?:[eE][+-]?\d+)?$/.test(value))return null;
 const n=Number(value.replaceAll(',',''));return Number.isFinite(n)?n:null;
}
/** Decimals, signed fractions, mixed numbers, and correctly grouped thousands. No eval. */
export function parseNumber(input){
 if(typeof input==='number')return Number.isFinite(input)?{ok:true,value:input}:fail('Use a finite number.');
 if(typeof input!=='string'||!input.trim())return fail('Enter an answer.');
 if(input.length>LIMITS.answerLength)return fail('That answer is too long.');
 const raw=input.trim().replace(/[−–]/g,'-').replace(/⁄/g,'/');
 const mixed=raw.match(/^([+-]?\d+)\s+(\d+)\s*\/\s*(\d+)$/);
 if(mixed){const denominator=Number(mixed[3]);if(denominator===0)return fail('A fraction cannot have a zero denominator.');const sign=mixed[1].startsWith('-')?-1:1,value=sign*(Math.abs(Number(mixed[1]))+Number(mixed[2])/denominator);return Number.isFinite(value)?{ok:true,value}:fail('Use a finite number.');}
 const parts=raw.split('/');
 if(parts.length===2){const a=decimal(parts[0]),b=decimal(parts[1]);if(a===null||b===null)return fail('Use a number or a fraction such as 3/2.');if(b===0)return fail('A fraction cannot have a zero denominator.');const value=a/b;return Number.isFinite(value)?{ok:true,value}:fail('Use a finite number.');}
 if(parts.length!==1)return fail('Use one fraction bar, such as 3/2.');
 const value=decimal(raw);return value===null?fail('Use a number or a fraction such as 3/2.'): {ok:true,value};
}
const DIRECTION_GROUPS={
 east:['east','eastward','eastwards','to the east','toward the east','towards the east'],
 west:['west','westward','westwards','to the west','toward the west','towards the west'],
 right:['right','rightward','rightwards','to the right','toward the right','towards the right'],
 left:['left','leftward','leftwards','to the left','toward the left','towards the left'],
 up:['up','upward','upwards','vertically up','vertically upward','toward the sky','towards the sky'],
 down:['down','downward','downwards','vertically down','vertically downward','toward the ground','towards the ground'],
 north:['north','northward','northwards'],south:['south','southward','southwards'],
 none:['none','no direction','neither','zero'],clockwise:['clockwise','cw'],counterclockwise:['counterclockwise','counter-clockwise','anticlockwise','anti-clockwise','ccw']
};
export function normalizeDirection(value){
 if(typeof value!=='string')return'';
 const cleaned=value.trim().toLowerCase().replace(/[.!?]+$/g,'').replace(/\s+/g,' ');
 for(const [canonical,words] of Object.entries(DIRECTION_GROUPS))if(words.includes(cleaned))return canonical;
 return cleaned;
}
/** Written answers are saved for explicit self-review; their content is never auto-graded. */
export function checkAnswers(problem,lesson,answers={},options={}){
 const fields=Object.create(null),input=plain(answers)?answers:{};
 if(!Array.isArray(lesson?.fields))return{status:'saved',correct:null,feedback:'The answer key for this item is unavailable. Your work can still be saved.',fields};
 if(!lesson.fields.length){
  const explanation=typeof options.explanation==='string'?options.explanation:own(input,'explanation')&&typeof input.explanation==='string'?input.explanation:'';
  if(!explanation.trim())return{status:'needs-work',correct:null,feedback:'Write your explanation before reviewing it.',fields};
  return{status:'saved',correct:null,feedback:options.reviewed?'You marked this response reviewed. Written explanations are not automatically graded.':'Compare your explanation with the review criteria, then mark it reviewed yourself.',fields};
 }
 let unavailable=false,correct=true;
 for(const field of lesson.fields){
  if(!safeKey(field?.key)||!['number','direction'].includes(field.type)){unavailable=true;continue;}
  const raw=own(input,field.key)?input[field.key]:'';
  let result;
  if(field.type==='number'){
   const parsed=parseNumber(raw),expected=parseNumber(field.expected);
   if(!expected.ok){result={correct:null,message:'This answer key is unavailable.'};unavailable=true;}
   else if(!parsed.ok)result={correct:false,message:parsed.error};
   else{
    const tolerance=typeof field.tolerance==='number'&&Number.isFinite(field.tolerance)&&field.tolerance>=0?field.tolerance:1e-9*Math.max(1,Math.abs(expected.value));
    const accepted=[expected.value,...(Array.isArray(field.accepted)?field.accepted.map(x=>parseNumber(x)).filter(x=>x.ok).map(x=>x.value):[])];
    const right=accepted.some(goal=>Math.abs(parsed.value-goal)<=tolerance+Number.EPSILON*Math.max(1,Math.abs(goal)));
    result={correct:right,message:right?'Correct.':'Not yet. Check the calculation, sign, and units.'};
   }
  }else{
   const normalized=normalizeDirection(raw),accepted=[field.expected,...(Array.isArray(field.accepted)?field.accepted:[])].map(normalizeDirection).filter(Boolean);
   if(!accepted.length){result={correct:null,message:'This answer key is unavailable.'};unavailable=true;}
   else{const right=!!normalized&&accepted.includes(normalized);result={correct:right,message:right?'Correct.':normalized?'Check the direction of the result.':'Enter a direction.'};}
  }
  fields[field.key]=result;if(result.correct!==true)correct=false;
 }
 if(unavailable)return{status:'saved',correct:null,feedback:'Part of this answer key is unavailable. Your work can still be saved.',fields};
 return{status:correct?'correct':'needs-work',correct,feedback:correct?'Correct. Your answers match the problem.':'Check the marked answers and try again.',fields};
}
function emptyRecord(){return{answers:{},explanation:'',status:'draft',reviewed:false,attempts:0,updatedAt:new Date().toISOString()};}
function validateRecord(record){
 if(!plain(record))return fail('A progress record must be an object.');
 const allowed=new Set(['answers','explanation','status','reviewed','attempts','updatedAt']);
 if(Object.keys(record).some(k=>!allowed.has(k)))return fail('A progress record has an unsupported field.');
 if(!plain(record.answers)||Object.keys(record.answers).length>LIMITS.answerFields)return fail('The answer list is invalid or too large.');
 const answers={};
 for(const [key,value] of Object.entries(record.answers)){if(!safeKey(key)||typeof value!=='string'||value.length>LIMITS.answerLength)return fail('An answer has an invalid key or is too long.');answers[key]=value;}
 if(typeof record.explanation!=='string'||record.explanation.length>LIMITS.explanationLength)return fail('The written explanation is invalid or too long.');
 if(!STATUSES.has(record.status)||typeof record.reviewed!=='boolean')return fail('The progress status is invalid.');
 if(!Number.isInteger(record.attempts)||record.attempts<0||record.attempts>LIMITS.attempts)return fail('The attempt count is invalid.');
 if(typeof record.updatedAt!=='string'||record.updatedAt.length>40||!Number.isFinite(Date.parse(record.updatedAt)))return fail('The saved date is invalid.');
 if((record.reviewed||record.status==='reviewed')&&!record.explanation.trim())return fail('Write an explanation before marking it reviewed.');
 if(record.reviewed!==(record.status==='reviewed'))return fail('The review flag and progress status do not agree.');
 return{ok:true,record:{answers,explanation:record.explanation,status:record.status,reviewed:record.reviewed,attempts:record.attempts,updatedAt:new Date(record.updatedAt).toISOString()}};
}
function validateImport(input){
 let data,text;
 try{text=typeof input==='string'?input:JSON.stringify(input);}catch{return fail('This progress file is not valid JSON.');}
 if(typeof text!=='string')return fail('This is not a supported packet progress file.');
 if(text.length>LIMITS.importBytes||new TextEncoder().encode(text).length>LIMITS.importBytes)return fail('This progress file is too large.');
 try{data=JSON.parse(text);}catch{return fail('This file is not valid JSON.');}
 if(!plain(data)||Object.keys(data).some(k=>!['format','version','exportedAt','records'].includes(k)))return fail('This is not a supported packet progress file.');
 if(data.format!==FORMAT||data.version!==VERSION)return fail('This progress file uses an unsupported format or version.');
 if(typeof data.exportedAt!=='string'||data.exportedAt.length>40||!Number.isFinite(Date.parse(data.exportedAt)))return fail('This progress file has an invalid export date.');
 if(!plain(data.records)||Object.keys(data.records).length>PACKET_IDS.length)return fail('This progress file has an invalid record list.');
 const records={};
 for(const [id,record] of Object.entries(data.records)){if(!IDS.has(id))return fail('This progress file contains an unknown problem or warm-up.');const checked=validateRecord(record);if(!checked.ok)return fail(`${id}: ${checked.error}`);records[id]=checked.record;}
 return{ok:true,records};
}
export function createProgressStore(storage){
 let backend=storage,unavailable='';
 if(backend===undefined){try{backend=globalThis.localStorage;}catch{unavailable='Browser storage is blocked.';}}
 if(!backend||!['getItem','setItem','removeItem'].every(k=>typeof backend[k]==='function'))unavailable||='Browser storage is unavailable.';
 const storageError=()=>fail(unavailable||'Could not access browser storage. Your latest work may not have been saved.');
 function load(id){
  if(!IDS.has(id))return fail('Unknown problem or warm-up.',{record:null});if(unavailable)return{...storageError(),record:null};
  try{const raw=backend.getItem(PREFIX+id);if(raw===null)return{ok:true,record:null};if(typeof raw!=='string'||raw.length>LIMITS.recordBytes||new TextEncoder().encode(raw).length>LIMITS.recordBytes)return fail('Saved progress is too large or invalid.',{record:null});let parsed;try{parsed=JSON.parse(raw);}catch{return fail('Saved progress is damaged and could not be read.',{record:null});}const checked=validateRecord(parsed);return checked.ok?{ok:true,record:copy(checked.record)}:{...checked,record:null};}catch{return{...storageError(),record:null};}
 }
 function save(id,patch){
  if(!IDS.has(id))return fail('Unknown problem or warm-up.',{record:null});if(!plain(patch)||Object.keys(patch).some(k=>!['answers','explanation','status','reviewed','attempts','updatedAt'].includes(k)))return fail('The progress update is invalid.',{record:null});
  const loaded=load(id);if(!loaded.ok)return loaded;const old=loaded.record||emptyRecord();
  if(own(patch,'answers')&&(!plain(patch.answers)||Object.keys(patch.answers).some(k=>!safeKey(k))))return fail('The answer update is invalid.',{record:null});
  const merged={...old,...patch,answers:{...old.answers,...(patch.answers||{})},updatedAt:new Date().toISOString()};
  const edited=JSON.stringify(merged.answers)!==JSON.stringify(old.answers)||merged.explanation!==old.explanation;
  if(edited&&!own(patch,'status'))merged.status='draft';
  if(edited&&!own(patch,'reviewed'))merged.reviewed=false;
  if(merged.status!=='reviewed')merged.reviewed=false;
  if(merged.status==='reviewed')merged.reviewed=true;
  const checked=validateRecord(merged);if(!checked.ok)return{...checked,record:null};
  try{const json=JSON.stringify(checked.record);backend.setItem(PREFIX+id,json);if(backend.getItem(PREFIX+id)!==json)return fail('Could not confirm that this answer was saved.',{record:null});return{ok:true,record:copy(checked.record)};}catch{return{...storageError(),record:null};}
 }
 function all(){const records={},errors={};for(const id of PACKET_IDS){const result=load(id);if(!result.ok)errors[id]=result.error;else if(result.record)records[id]=result.record;}return Object.keys(errors).length?fail('Some saved work could not be read.',{records,errors}):{ok:true,records};}
 function clear(){
  if(unavailable)return storageError();let cleared=0;
  try{for(const id of PACKET_IDS){backend.removeItem(PREFIX+id);if(backend.getItem(PREFIX+id)!==null)return fail('Could not confirm that saved work was cleared.',{cleared});cleared++;}return{ok:true,cleared};}catch{return{...storageError(),cleared};}
 }
 function exportProgress(){const result=all();if(!result.ok)return result;const data={format:FORMAT,version:VERSION,exportedAt:new Date().toISOString(),records:result.records};return{ok:true,data,json:JSON.stringify(data,null,2)};}
 function importProgress(input,{overwrite=false}={}){
  const checked=validateImport(input);if(!checked.ok)return checked;if(unavailable)return storageError();
  const changes=[],previous=new Map();let skipped=0;
  for(const [id,incoming] of Object.entries(checked.records)){const result=load(id);if(!result.ok)return result;if(!overwrite&&result.record&&Date.parse(result.record.updatedAt)>Date.parse(incoming.updatedAt)){skipped++;continue;}changes.push([id,incoming]);}
  try{for(const [id] of changes)previous.set(id,backend.getItem(PREFIX+id));}catch{return storageError();}
  const attempted=[];let imported=0;
  try{for(const [id,record] of changes){attempted.push(id);const json=JSON.stringify(record);backend.setItem(PREFIX+id,json);if(backend.getItem(PREFIX+id)!==json)throw new Error('verification');imported++;}return{ok:true,imported,skipped};}
  catch{let rollbackFailed=false;for(const id of attempted){try{const old=previous.get(id);if(old===null)backend.removeItem(PREFIX+id);else backend.setItem(PREFIX+id,old);if(backend.getItem(PREFIX+id)!==old)rollbackFailed=true;}catch{rollbackFailed=true;}}return fail(rollbackFailed?'Import stopped because browser storage failed. Some imported answers may remain.':'Import could not be saved. Earlier answers were restored.',{imported:rollbackFailed?imported:0,skipped,partial:rollbackFailed});}
 }
 return Object.freeze({load,save,all,clear,export:exportProgress,import:importProgress});
}
