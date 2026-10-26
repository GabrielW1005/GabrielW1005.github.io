import assert from 'node:assert/strict';
import packet from '../data.js';
import {getPractice} from '../practice.js';
import {createProgressStore} from '../packet-core.js';
import {createWorkspaceStore,createWorkspaceProgressStore,createWorkspaceBackupStore,WORKSPACE_SELECTION_PREFIX,WORKSPACE_SIMULATION_PREFIX,WORKSPACE_PROGRESS_PREFIX,WORKSPACE_LAST_ROUTE_KEY,WORKSPACE_IDS} from '../workspace-state.js';
const problems=packet.sections.flatMap(s=>s.problems),p=problems.find(p=>p.id==='P05');
function memory(){const map=new Map();return{map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};}
const source=memory(),work=createWorkspaceStore(source),progress=createWorkspaceProgressStore(source),backup=createWorkspaceBackupStore(source);
assert.deepEqual(work.lastRoute(),{id:'P01',variantId:null,all:false});
const variant=getPractice(p,'P05-v2-02'),selected=work.select(p,variant.params);
assert.deepEqual(work.lastRoute(),{id:'P05',variantId:'P05-v2-02',all:false});
const other=problems.find(p=>p.id==='P02');assert.equal(work.rememberRoute(other,work.selection(other)).ok,true);assert.equal(work.lastRoute().id,'P02');work.rememberRoute(p,selected);
const countBefore=source.map.size;work.rememberRoute(p,selected);assert.equal(source.map.size,countBefore);
assert.equal(progress.save(selected.recordId,{answers:{speed:'2.52'},status:'correct'}).ok,true);
work.saveSimulation(selected.recordId,{answer:'2.52',time:9,graph:'speed',stepsRevealed:true});
const custom=work.select(p,{...p.simulation.params,distance:347});
progress.save(custom.recordId,{answers:{speed:'2.89'},status:'needs-work'});work.saveSimulation(custom.recordId,{answer:'2.89',time:3.7});
work.select(p,p.simulation.params); // Original view must retain its hidden custom snapshot.
progress.save('P05',{answers:{speed:'1.5'},status:'correct'});
const exported=backup.export();assert.equal(exported.ok,true,exported.error);assert.equal(exported.data.format,'motion-lab-workspace-backup');assert.equal(exported.data.version,2);assert.equal(exported.data.workspace.custom.P05.params.distance,347);
const target=memory(),targetBackup=createWorkspaceBackupStore(target),targetWork=createWorkspaceStore(target),targetProgress=createWorkspaceProgressStore(target);
assert.equal(targetBackup.import(exported.json).ok,true);
assert.deepEqual(targetProgress.all().records,progress.all().records);
assert.equal(targetWork.selection(p).mode,'original');assert.equal(targetWork.selection(p,'custom').params.distance,347);assert.equal(targetWork.simulation(custom.recordId).state.time,3.7);
assert.deepEqual(targetWork.lastRoute(),work.lastRoute());
// Full backups carry every extension's current requested unknown and unit, not merely its base ID.
let extensions=0;
for(const q of problems.filter(p=>p.extension)){
 const v=getPractice(q,`${q.id}-v2-24`),choice=work.select(q,v.params);assert.equal(choice.ok,true,q.id);progress.save(choice.recordId,{answers:{value:'1.23'}});extensions++;
}
if(extensions){const all=backup.export();assert.equal(all.ok,true,all.error);assert.equal(targetBackup.import(all.json).ok,true);for(const q of problems.filter(p=>p.extension))assert.deepEqual(targetWork.selection(q).params,work.selection(q).params,q.id);}
// Legacy response-only backups still restore, preserving other work.
const legacy=createProgressStore(memory());legacy.save('P02',{answers:{distance:'15'},status:'correct'});assert.equal(targetBackup.import(legacy.export().json).ok,true);assert.equal(targetProgress.load('P02').record.answers.distance,'15');assert.equal(targetProgress.load('P05').record.answers.speed,'1.5');
// Hostile, malformed and too-large files cannot partially change responses or custom state.
const before=new Map(target.map),mutate=fn=>{const data=structuredClone(exported.data);fn(data);return data;};
for(const data of [
 mutate(x=>x.workspace.custom.P05.params.mass=-4),
 mutate(x=>x.workspace.custom.P05.params.distance=1e30),
 mutate(x=>x.workspace.selections.P05.params.hacked=true),
 mutate(x=>x.workspace.simulations.P05={time:-1}),
 mutate(x=>x.workspace.lastRoute={id:'P99',variantId:'original'}),
 mutate(x=>delete x.workspace.custom.P05),
 mutate(x=>x.progress.records.P99=x.progress.records.P05),
 mutate(x=>x.progress.records.P05.answers.x=2),
 mutate(x=>x.workspace.unknown=true),
 mutate(x=>x.version=3),
 '{bad',
 'x'.repeat(12000001),
]){assert.equal(targetBackup.import(data).ok,false);assert.deepEqual(target.map,before);}
const polluted=JSON.parse(exported.json);Object.defineProperty(polluted.workspace.custom,'__proto__',{value:{},enumerable:true});assert.equal(targetBackup.import(polluted).ok,false);assert.deepEqual(target.map,before);
// Older backups do not attach an old custom answer to newer edited measurements.
const newer=targetWork.select(p,{...p.simulation.params,distance:999});targetProgress.save(newer.recordId,{answers:{speed:'8.325'},status:'correct'});
const late='2099-01-01T00:00:00.000Z';
for(const key of [WORKSPACE_SELECTION_PREFIX+'P05',WORKSPACE_SELECTION_PREFIX+'P05:custom',WORKSPACE_PROGRESS_PREFIX+newer.recordId]){const value=JSON.parse(target.getItem(key));value.updatedAt=late;target.setItem(key,JSON.stringify(value));}
const olderResult=targetBackup.import(exported.json);assert.equal(olderResult.ok,true);assert.ok(olderResult.skipped>=1);assert.equal(targetWork.selection(p,'custom').params.distance,999);assert.equal(targetProgress.load(newer.recordId).record.answers.speed,'8.325');
// A newer incoming custom model must not overwrite newer answers to the unrelated original.
const currentOriginal=JSON.parse(target.getItem(WORKSPACE_PROGRESS_PREFIX+'P05'));currentOriginal.updatedAt='2099-02-01T00:00:00.000Z';currentOriginal.answers.speed='3';target.setItem(WORKSPACE_PROGRESS_PREFIX+'P05',JSON.stringify(currentOriginal));
const incomingNewCustom=structuredClone(exported.data);incomingNewCustom.workspace.custom.P05.updatedAt='2099-03-01T00:00:00.000Z';
assert.equal(targetBackup.import(incomingNewCustom).ok,true);assert.equal(targetProgress.load('P05').record.answers.speed,'3');assert.equal(targetWork.selection(p,'custom').params.distance,347);
// Explicit overwrite restores an entire custom bundle, including its associated simulation.
assert.equal(targetBackup.import(exported.json,{overwrite:true}).ok,true);assert.equal(targetWork.selection(p,'custom').params.distance,347);assert.equal(targetProgress.load(custom.recordId).record.answers.speed,'2.89');
// A storage failure midway through a full import restores all earlier state.
const failing=memory();failing.setItem(WORKSPACE_LAST_ROUTE_KEY,JSON.stringify({id:'P02',variantId:'original'}));const initial=new Map(failing.map);let writes=0;const set=failing.setItem;failing.setItem=(key,value)=>{if(++writes===4)throw new Error('quota');set(key,value);};
const failed=createWorkspaceBackupStore(failing).import(exported.json);assert.equal(failed.ok,false);assert.equal(failed.partial,false);assert.deepEqual(failing.map,initial);
const silent=memory();silent.setItem=()=>{};assert.equal(createWorkspaceBackupStore(silent).import(exported.json).ok,false);
assert.equal(createWorkspaceBackupStore(null).import(exported.json).ok,false);
// Unknown quantity or incompatible answer units cannot be persisted in extension routes.
for(const q of problems.filter(p=>p.extension)){
 const v=getPractice(q,`${q.id}-v2-01`);assert.equal(work.select(q,{...v.params,_quantity:'not-a-quantity'}).ok,false);
}
console.log(`PASS: full workspace backups, ${extensions} extension routes, custom snapshot/answer matching, last route, legacy import, newer-work protection, validation before writes, transactional rollback, and ${WORKSPACE_IDS.length} bounded response slots.`);
