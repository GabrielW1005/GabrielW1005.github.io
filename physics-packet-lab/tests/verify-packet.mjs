import assert from 'node:assert/strict';
import packet from '../data.js';
import {lessons,warmupLessons} from '../packet-lessons.js';
import {solve} from '../physics.js';
import {parseNumber,normalizeDirection,checkAnswers,createProgressStore,PACKET_IDS,PROBLEM_IDS,WARMUP_IDS,LIMITS} from '../packet-core.js';

const problems=packet.sections.flatMap(section=>section.problems),warmups=packet.sections.flatMap(section=>section.warmups);
const question=id=>problems.find(p=>p.id===id)||warmups.find(w=>w.id===id);
const key=id=>lessons[id]||warmupLessons[id];
const expectedAnswers=lesson=>Object.fromEntries(lesson.fields.map(field=>[field.key,String(field.expected)]));
const grade=(id,answers,options)=>checkAnswers(question(id),key(id),answers,options);
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,`${a} != ${b}`);

// Check the actual authored keys, including every required part and direction.
assert.deepEqual(Object.keys(lessons),PROBLEM_IDS);
assert.deepEqual(Object.keys(warmupLessons),WARMUP_IDS);
assert.equal(PACKET_IDS.length,56);
let quantitative=0,conceptual=0;
for(const id of PACKET_IDS){
 const p=question(id),lesson=key(id);assert.ok(p&&lesson,id);
 assert.ok(lesson.hint&&lesson.why&&lesson.steps.length&&lesson.criteria.length,id);
 if(lesson.fields.length){
  quantitative++;
  const answers=expectedAnswers(lesson),right=grade(id,answers);assert.equal(right.status,'correct',id);assert.equal(right.correct,true,id);
  for(const field of lesson.fields){
   const missing={...answers};delete missing[field.key];assert.equal(grade(id,missing).correct,false,`${id}: missing ${field.key}`);
   const wrong={...answers,[field.key]:field.type==='number'?String(Number(field.expected)+10):'not a direction'};
   assert.equal(grade(id,wrong).correct,false,`${id}: wrong ${field.key}`);
  }
  if(p.numericAnswer){near(Number(lesson.fields.find(field=>field.type==='number').expected),p.numericAnswer.value);near(solve(p,p.simulation.params).value,p.numericAnswer.value);}
 }else{
  conceptual++;
  assert.equal(grade(id,{}).status,'needs-work',id);
  const written=grade(id,{}, {explanation:'My reasoning about the motion.'});assert.equal(written.correct,null,id);assert.equal(written.status,'saved',id);
  const selfReviewed=grade(id,{}, {explanation:'My own explanation.',reviewed:true});assert.equal(selfReviewed.correct,null,id);assert.equal(selfReviewed.status,'saved',id);
 }
}
assert.equal(quantitative,40);assert.equal(conceptual,16);
for(const [input,expected] of [['0',0],['-0',0],['−200',-200],['.20',.2],['+1.5',1.5],['16/10',1.6],['8⁄5',1.6],['-3/2',-1.5],['3/-2',-1.5],['-1 1/2',-1.5],['1 1/2',1.5],['3,000',3000],['1,234.5',1234.5],['2e-1',.2]]){
 const parsed=parseNumber(input);assert.equal(parsed.ok,true,input);near(parsed.value,expected);
}
for(const input of ['', '  ',null,undefined,'1/0','0/0','1/2/3','1,2','12,34','3 m/s','Infinity','NaN','1e999','2+3','1/','0x20','9'.repeat(LIMITS.answerLength+1)])assert.equal(parseNumber(input).ok,false,String(input).slice(0,30));
assert.equal(parseNumber(Infinity).ok,false);
assert.equal(normalizeDirection(' To the RIGHT! '),'right');assert.equal(normalizeDirection('upwards'),'up');
assert.equal(normalizeDirection('left'),'left');assert.equal(normalizeDirection('west'),'west');
assert.equal(grade('P02',{displacement:'15',direction:'eastward'}).correct,true);
assert.equal(grade('P02',{displacement:'15',direction:'right'}).correct,false,'Different coordinate systems are aliases only when a lesson explicitly permits them.');
assert.equal(grade('P18',{friction:'35',direction:'west'}).correct,false,'Left does not automatically imply geographic west.');
assert.equal(grade('P25',{acceleration:'2',direction:'UPWARD.'}).correct,true);
assert.equal(grade('P29',{totalMomentum:'18',direction:'ahead'}).correct,true);
assert.equal(grade('P22',{netForce:'−200',direction:'down'}).correct,true);
assert.equal(grade('P22',{netForce:'200',direction:'down'}).correct,false,'Direction does not silently repair a wrong signed value.');
assert.equal(grade('P30',{before:'1/5',after:'.20',direction:'right'}).correct,true);
assert.equal(grade('P30',{before:'.204',after:'.2',direction:'right'}).correct,false,'A 2% momentum error is not rounding.');
assert.equal(grade('P30',{before:'.2',direction:'right'}).correct,false);
assert.equal(grade('W4c',{answer:'16/10'}).correct,true);assert.equal(grade('W4c',{answer:'8/5'}).correct,true);
assert.equal(grade('W6a',{answer:'3,000'}).correct,true);
assert.equal(grade('W7c',{first:'2',second:'1'}).correct,true);assert.equal(grade('W7c',{first:'2'}).correct,false);assert.equal(grade('W7c',{first:'1',second:'2'}).correct,false);
assert.equal(grade('W1c',{answer:''}).correct,false,'Empty does not become zero.');
assert.equal(grade('W1c',{answer:'0'}).correct,true);
assert.equal(grade('W1a',Object.create({answer:'17'})).correct,false,'Inherited answer values are not accepted.');
assert.equal(checkAnswers({},null,{}).correct,null,'Missing keys do not imply correctness.');

// Storage objects use the browser Storage interface. Tests exercise two independent stores.
const prefix='motion-lab-packet-v1:';
function memoryStorage(){
 const map=new Map();
 return{map,getItem(key){return map.has(key)?map.get(key):null;},setItem(key,value){map.set(key,String(value));},removeItem(key){map.delete(key);}};
}
const backend=memoryStorage(),store=createProgressStore(backend),otherTab=createProgressStore(backend);
assert.equal(store.load('P01').record,null);
assert.equal(store.save('P01',{answers:{distance:'17'},status:'correct',attempts:1}).ok,true);
assert.equal(otherTab.save('P02',{answers:{displacement:'15',direction:'right'},status:'correct',attempts:1}).ok,true);
assert.equal(createProgressStore(backend).load('P01').record.answers.distance,'17','A fresh instance restores work.');
assert.equal(store.all().records.P02.answers.direction,'right','Separate tabs do not replace other IDs.');
assert.equal(otherTab.save('P30',{answers:{before:'.2'}}).ok,true);
assert.equal(store.save('P30',{answers:{after:'.2'}}).ok,true);
assert.deepEqual(store.load('P30').record.answers,{before:'.2',after:'.2'},'Each save merges current per-ID answers.');
assert.equal(store.save('P01',{answers:{distance:'18'}}).record.status,'draft','Editing invalidates old checked state.');
assert.equal(store.save('P03',{explanation:'Distance is not zero; start and finish coincide.',status:'reviewed',reviewed:true}).record.reviewed,true);
const changedConcept=store.save('P03',{explanation:'I changed my explanation.'});assert.equal(changedConcept.record.status,'draft');assert.equal(changedConcept.record.reviewed,false);
assert.equal(store.save('P04',{explanation:' ',status:'reviewed',reviewed:true}).ok,false);
assert.equal(store.save('W1a',{answers:{answer:'17'}}).ok,true);
assert.equal(store.load('W1a').record.answers.answer,'17');
for(const id of ['P00','P33','W0a','W9a','W1d','__proto__','constructor','toString'])assert.equal(store.save(id,{answers:{answer:'1'}}).ok,false,id);
assert.equal(store.save('P01',{answers:JSON.parse('{"__proto__":"unsafe"}')}).ok,false);
assert.equal(store.save('P01',{answers:{distance:'x'.repeat(LIMITS.answerLength+1)}}).ok,false);
assert.equal(store.save('P01',{explanation:'x'.repeat(LIMITS.explanationLength+1)}).ok,false);
const exported=store.export();assert.equal(exported.ok,true);assert.equal(exported.data.version,1);assert.equal(exported.data.format,'motion-lab-packet-progress');
assert.ok(Number.isFinite(Date.parse(exported.data.records.P01.updatedAt)));
const restored=createProgressStore(memoryStorage());assert.equal(restored.import(exported.json).ok,true);assert.deepEqual(restored.all().records,store.all().records);
// Maximum legal text must survive JSON escaping, reload, and a whole-packet backup.
const maximalBackend=memoryStorage(),maximalStore=createProgressStore(maximalBackend);
const maximalAnswers=Object.fromEntries(Array.from({length:LIMITS.answerFields},(_,i)=>['answer'+i,'\u0000'.repeat(LIMITS.answerLength)]));
for(const id of PACKET_IDS)assert.equal(maximalStore.save(id,{answers:maximalAnswers,explanation:'\u0000'.repeat(LIMITS.explanationLength)}).ok,true,id);
assert.equal(maximalStore.all().ok,true);
const maximalExport=maximalStore.export();assert.equal(maximalExport.ok,true);assert.ok(new TextEncoder().encode(maximalExport.json).length<=LIMITS.importBytes);
const maximalRestore=createProgressStore(memoryStorage());assert.equal(maximalRestore.import(maximalExport.json).ok,true);assert.deepEqual(maximalRestore.load('W8c').record,maximalStore.load('W8c').record);

// Imports are bounded, validated as a whole, and preserve unrelated and newer work.
const record=(answer,date='2020-01-01T00:00:00.000Z')=>({answers:{answer},explanation:'',status:'draft',reviewed:false,attempts:0,updatedAt:date});
const document=records=>({format:'motion-lab-packet-progress',version:1,exportedAt:'2026-10-23T00:00:00.000Z',records});
assert.equal(store.import(document({W1b:record('15')})).ok,true);assert.ok(store.load('P02').record,'Unmentioned records survive imports.');
const skip=store.import(document({W1a:record('99')}));assert.equal(skip.skipped,1);assert.equal(store.load('W1a').record.answers.answer,'17');
assert.equal(store.import(document({W1a:record('99')}),{overwrite:true}).ok,true);assert.equal(store.load('W1a').record.answers.answer,'99');
const unchanged=backend.getItem(prefix+'W1b');
const malformedRecords=[
 {W1b:record('16'),P99:record('1')},
 {W1b:record('16'),P01:{...record('1'),status:'invented'}},
 {W1b:record('16'),P01:{...record('1'),reviewed:true,status:'reviewed'}},
 {P01:{...record('1'),answers:JSON.parse('{"constructor":"1"}')}},
 {P01:{...record('1'),updatedAt:'not a date'}},
 {P01:{...record('1'),attempts:-1}},
 {P01:{...record('1'),answers:{a:'1'.repeat(LIMITS.answerLength+1)}}},
 {P01:{...record('1'),answers:Object.fromEntries(Array.from({length:LIMITS.answerFields+1},(_,i)=>['a'+i,'1']))}}
];
for(const records of malformedRecords)assert.equal(store.import(document(records)).ok,false);
assert.equal(backend.getItem(prefix+'W1b'),unchanged,'An invalid late record cannot partially import earlier valid records.');
for(const input of ['{','[]','null','x'.repeat(LIMITS.importBytes+1),{...document({}),version:99},{...document({}),unexpected:true}])assert.equal(store.import(input).ok,false);
const cycle=document({});cycle.loop=cycle;assert.equal(store.import(cycle).ok,false);
assert.equal(store.import({...document({}),exportedAt:'x'.repeat(LIMITS.importBytes+1)}).ok,false);
assert.equal(store.import(JSON.parse('{"format":"motion-lab-packet-progress","version":1,"exportedAt":"2026-10-23","records":{"__proto__":{}}}')).ok,false);
const damaged=memoryStorage();damaged.map.set(prefix+'P01','{broken');damaged.map.set(prefix+'P02',JSON.stringify({...record('15'),status:'invented'}));
const damagedStore=createProgressStore(damaged);assert.equal(damagedStore.load('P01').ok,false);assert.equal(damagedStore.load('P02').ok,false);assert.equal(damagedStore.all().ok,false);assert.equal(damagedStore.export().ok,false);

// Blocked/quota/silent-write failures are explicit; no false "saved" result.
for(const backend of [null,{}, {getItem(){throw new Error('blocked');},setItem(){},removeItem(){}}]){
 const blocked=createProgressStore(backend);assert.equal(blocked.load('P01').ok,false);assert.equal(blocked.save('P01',{answers:{distance:'17'}}).ok,false);assert.equal(blocked.export().ok,false);
}
const quota=memoryStorage();quota.setItem=()=>{throw new Error('quota');};assert.equal(createProgressStore(quota).save('P01',{answers:{distance:'17'}}).ok,false);
const silent=memoryStorage();silent.setItem=()=>{};assert.equal(createProgressStore(silent).save('P01',{answers:{distance:'17'}}).ok,false);
const rollbackBackend=memoryStorage(),rollbackStore=createProgressStore(rollbackBackend);rollbackStore.save('W1a',{answers:{answer:'17'}});
const previous=rollbackBackend.getItem(prefix+'W1a'),realSet=rollbackBackend.setItem.bind(rollbackBackend);let thrown=false;
rollbackBackend.setItem=(key,value)=>{if(key===prefix+'W1b'&&!thrown){thrown=true;throw new Error('one write failed');}realSet(key,value);};
const rejected=rollbackStore.import(document({W1a:record('999'),W1b:record('999')}),{overwrite:true});assert.equal(rejected.ok,false);assert.equal(rejected.partial,false);assert.equal(rollbackBackend.getItem(prefix+'W1a'),previous);assert.equal(rollbackBackend.getItem(prefix+'W1b'),null);
const partialBackend=memoryStorage(),partialStore=createProgressStore(partialBackend);let setCount=0;
partialBackend.setItem=(key,value)=>{if(++setCount>1)throw new Error('storage failed');partialBackend.map.set(key,value);};partialBackend.removeItem=()=>{throw new Error('removal failed');};
const partial=partialStore.import(document({W1a:record('17'),W1b:record('15')}));assert.equal(partial.ok,false);assert.equal(partial.partial,true);
backend.map.set('unrelated-app','keep me');assert.equal(store.clear().ok,true);assert.equal(Object.keys(store.all().records).length,0);assert.equal(backend.getItem('unrelated-app'),'keep me');
console.log('PASS: all 32 packet lessons and 24 warm-ups; exact multi-part and direction grading; fraction/decimal/sign parsing; written answers never auto-graded; per-item reload and tab merging; edited checks invalidated; bounded validated imports; timestamp merge; rollback; explicit storage failures.');
