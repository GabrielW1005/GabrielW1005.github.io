import assert from 'node:assert/strict';
import packet from '../data.js';
import {getPractice,listPracticeIds} from '../practice.js';
import {createProgressStore,PACKET_IDS} from '../packet-core.js';
import {createWorkspaceStore,createWorkspaceProgressStore,parseWorkspaceRoute,workspaceHash,workspaceLink,WORKSPACE_IDS,WORKSPACE_IMPORT_BYTES,WORKSPACE_PROGRESS_PREFIX,WORKSPACE_SELECTION_PREFIX,WORKSPACE_SIMULATION_PREFIX} from '../workspace-state.js';
const problems=packet.sections.flatMap(s=>s.problems),problem=id=>problems.find(p=>p.id===id);
function memory(){const map=new Map();return{map,getItem:key=>map.get(key)??null,setItem:(key,value)=>map.set(key,String(value)),removeItem:key=>map.delete(key)};}
const backend=memory(),workspace=createWorkspaceStore(backend),progress=createWorkspaceProgressStore(backend);
assert.equal(WORKSPACE_IDS.length,problems.length*26+24);assert.equal(new Set(WORKSPACE_IDS).size,problems.length*26+24);assert.equal(WORKSPACE_IMPORT_BYTES,12000000);
let variants=0;
for(const p of problems){
 assert.equal(workspace.selection(p,'original').recordId,p.id);
 for(const variant of listPracticeIds(p)){
  const generated=getPractice(p,variant),chosen=workspace.select(p,generated.params);
  assert.equal(chosen.ok,true,variant);assert.equal(chosen.mode,'practice',variant);assert.equal(chosen.variantId,variant);
  assert.deepEqual(chosen.params,generated.params,variant);assert.equal(chosen.recordId,`${p.id}__v2_${variant.slice(-2)}`);
  const hash=workspaceHash(p,chosen),route=parseWorkspaceRoute(hash);
  assert.equal(route.id,p.id);assert.equal(route.variantId,variant);assert.equal(route.all,false);
  assert.equal(workspaceLink('packet.html',p,chosen),'packet.html'+hash);
  const restored=createWorkspaceStore(backend).selection(p);assert.deepEqual(restored.params,generated.params,variant);
  const separate=workspace.selectionForRecord(p,chosen.recordId);assert.deepEqual(separate.params,generated.params);
  variants++;
 }
}
assert.equal(variants,problems.length*24);
const p=problem('P05'),first=getPractice(p,'P05-v2-01'),second=getPractice(p,'P05-v2-02');
workspace.select(p,first.params);const firstSelection=workspace.selection(p),firstId=firstSelection.recordId;
assert.equal(progress.save(firstId,{answers:{speed:'2.4'},status:'needs-work'}).ok,true);
assert.equal(progress.save('P05',{answers:{speed:'1.5'},status:'correct'}).ok,true);
assert.equal(workspace.saveSimulation(firstId,{answer:'2.4',exploration:{force:3.5},time:4.8,graph:'speed',stepsRevealed:true}).ok,true);
workspace.select(p,second.params);const secondId=workspace.selection(p).recordId;
assert.equal(workspace.simulation(secondId).state,null,'New practice starts without old controls.');
assert.equal(progress.load(secondId).record,null,'New practice starts without old responses.');
workspace.select(p,workspace.selection(p,'original').params);
assert.equal(progress.load('P05').record.status,'correct');assert.equal(progress.load(firstId).record.answers.speed,'2.4');
workspace.select(p,workspace.selection(p,'P05-v2-01').params);
assert.equal(workspace.simulation(firstId).state.answer,'2.4');
assert.equal(createWorkspaceStore(backend).simulation(firstId).state.graph,'speed');
// Looking up an inactive record must not change the shared active question.
workspace.selectionForRecord(p,secondId);assert.equal(workspace.selection(p).variantId,'P05-v2-01');
// Stable selection routes keep the desired variant even when another view changed its active question.
workspace.select(p,second.params);const explicit=workspace.selection(p,parseWorkspaceRoute(workspaceHash(p,firstSelection)).variantId);
assert.equal(explicit.variantId,'P05-v2-01');assert.equal(workspace.selection(p).variantId,'P05-v2-02');
// Model/UI defaults do not create a custom exercise or invalidate an original answer.
const train=problem('P04'),trainSelection=workspace.select(train,{...train.simulation.params,frame:1,referenceSpeed:10});assert.equal(trainSelection.mode,'original');assert.equal(createWorkspaceStore(backend).selection(train,'original').params.frame,1,'Explicit return preserves UI-only frame for the active original.');
const walk=problem('P13');assert.equal(workspace.select(walk,{...walk.simulation.params,distanceScale:1,timeScale:1}).mode,'original');
// Editing a practice measurement creates its own custom response slot; no stale practice identity survives.
const custom=workspace.select(p,{...first.params,distance:first.params.distance+13});assert.equal(custom.mode,'custom');assert.equal(custom.params._practiceVariant,undefined);assert.equal(custom.clearedCustom,true);
assert.equal(progress.save(custom.recordId,{answers:{speed:'99'},status:'correct'}).ok,true);
workspace.saveSimulation(custom.recordId,{answer:'99'});
assert.equal(workspace.select(p,custom.params).clearedCustom,false,'Unchanged custom measurements retain answers.');
assert.equal(progress.load(custom.recordId).record.answers.speed,'99');
workspace.select(p,{...custom.params,distance:custom.params.distance+1});
assert.equal(progress.load(custom.recordId).record,null,'Changed custom measurements invalidate the entire prior answer.');
assert.equal(workspace.simulation(custom.recordId).state,null);
workspace.select(p,p.simulation.params);
assert.equal(workspace.selectionForRecord(p,'P05__custom').mode,'custom','Custom snapshot survives returning to original.');
assert.equal(progress.load(firstId).record.answers.speed,'2.4');
// Storage and import remain compatible with prior original-only work.
const legacyBackend=memory(),legacy=createProgressStore(legacyBackend);
legacy.save('P01',{answers:{distance:'17'},status:'correct'});legacy.save('W7c',{answers:{first:'2',second:'1'},status:'correct'});
assert.equal(progress.import(legacy.export().json).ok,true);assert.equal(progress.load('P01').record.answers.distance,'17');
assert.equal(createWorkspaceProgressStore(legacyBackend).load('W7c').record.answers.second,'1');
const exported=progress.export();assert.equal(exported.ok,true);assert.ok(exported.data.records[firstId]);
const destination=createWorkspaceProgressStore(memory());assert.equal(destination.import(exported.json).ok,true);assert.deepEqual(destination.all().records,progress.all().records);
assert.equal(createProgressStore(memory()).import(exported.json).ok,false,'A legacy reader rejects unfamiliar practice IDs rather than silently discarding them.');
// Allow-list remains local to each progress instance.
assert.equal(createProgressStore(backend).load(firstId).ok,false);assert.equal(createProgressStore(backend).all().ok,true);
assert.throws(()=>createProgressStore(backend,{ids:['P01','P01']}));assert.throws(()=>createProgressStore(backend,{prefix:'../../'}));assert.throws(()=>createProgressStore(backend,{importBytes:Infinity}));
const small=createProgressStore(memory(),{ids:['P01'],importBytes:1000});small.save('P01',{explanation:'x'.repeat(2000)});assert.equal(small.export().ok,false,'Do not produce a backup that the same store refuses to import.');
// Malformed routes and hostile/invalid saved state cannot choose a different exercise or inject objects.
assert.deepEqual(parseWorkspaceRoute('#all'),{id:'P01',variantId:null,all:true});assert.equal(parseWorkspaceRoute('#P05/P05-v2-24').variantId,'P05-v2-24');
for(const hash of ['#P05/P05-v2-25','#P05/P04-v2-01','#P05/a/b','#P05/__proto__','#%E0%A4%A'])assert.equal(parseWorkspaceRoute(hash).variantId,null,hash);
assert.throws(()=>workspaceHash(p,{mode:'practice',variantId:'P06-v2-01'}));assert.throws(()=>workspaceLink('https://elsewhere',p,firstSelection));
for(const params of [{...p.simulation.params,mass:'bad'},{...p.simulation.params,distance:Infinity},{...p.simulation.params,time:0},{...p.simulation.params,unrelated:true},JSON.parse('{"__proto__":{}}'),{...first.params,_displayUnits:{distance:'javascript:bad'}},{...first.params,_displayUnits:{force:'kg'}},{...first.params,_displayUnits:{answer:'kg'}}])assert.equal(workspace.select(p,params).ok,false);
for(const state of [{time:Infinity},{answer:'x'.repeat(501)},{exploration:null},{exploration:JSON.parse('{"__proto__":5}')},{exploration:{force:'bad'}},{graph:'<script>'},{unknown:1}])assert.equal(workspace.saveSimulation(firstId,state).ok,false);
assert.equal(workspace.saveSimulation('__proto__',{answer:'1'}).ok,false);
const corrupt=memory();corrupt.map.set(WORKSPACE_SELECTION_PREFIX+'P05','{broken');assert.equal(createWorkspaceStore(corrupt).selection(p).ok,false);
corrupt.map.set(WORKSPACE_SIMULATION_PREFIX+firstId,JSON.stringify({answer:'a',time:-1}));assert.equal(createWorkspaceStore(corrupt).simulation(firstId).ok,false);
const detached=createWorkspaceStore(memory());assert.equal(detached.selection(p,'custom').ok,false);assert.equal(detached.selectionForRecord(p,'P06__v2_01').ok,false);
// Blocked, silent-write, and transactional partial failures are explicit.
for(const storage of [null,{}, {getItem(){throw new Error('blocked');},setItem(){},removeItem(){}}]){const blocked=createWorkspaceStore(storage);assert.equal(blocked.selection(p).ok,false);assert.equal(blocked.select(p,first.params).ok,false);assert.equal(blocked.saveSimulation(firstId,{answer:'1'}).ok,false);}
const silent=memory();silent.setItem=()=>{};assert.equal(createWorkspaceStore(silent).select(p,first.params).ok,false);assert.equal(createWorkspaceStore(silent).saveSimulation(firstId,{answer:'1'}).ok,false);
const broken=memory(),atomic=createWorkspaceStore(broken),atomicProgress=createWorkspaceProgressStore(broken);
const oldCustom=atomic.select(p,{...p.simulation.params,distance:230});atomicProgress.save(oldCustom.recordId,{answers:{speed:'1.9'}});const previousStored=broken.getItem(WORKSPACE_SELECTION_PREFIX+'P05');
const remove=broken.removeItem;broken.removeItem=key=>{if(key.startsWith(WORKSPACE_PROGRESS_PREFIX))throw new Error('blocked delete');return remove(key);};
assert.equal(atomic.select(p,{...p.simulation.params,distance:240}).ok,false);assert.equal(broken.getItem(WORKSPACE_SELECTION_PREFIX+'P05'),previousStored);assert.equal(atomicProgress.load(oldCustom.recordId).record.answers.speed,'1.9');
console.log(`PASS: ${variants} deterministic practice route round trips; original/practice/custom progress isolation; saved simulation controls; custom invalidation; legacy-compatible bounded backups; strict state validation; explicit storage failures and rollback.`);
