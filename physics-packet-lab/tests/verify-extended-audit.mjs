/* Independent acceptance checks: compute from printed givens, conservation laws,
 * force balances, and browser-storage round trips rather than implementation helpers. */
import assert from 'node:assert/strict';
import packet from '../data.js';
import {getPractice,listPracticeIds,getQuestion,getAnswerUnit} from '../practice.js';
import {getPracticeLesson,getActiveProblem} from '../practice-lessons.js';
import {evaluate,modelInfo,solve} from '../physics.js';
import {getInitialPrediction,getPredictionBounds,createPrediction,getExploration,createExploration} from '../experiments.js';
import {checkAnswers} from '../packet-core.js';
import {createWorkspaceStore,createWorkspaceProgressStore,workspaceHash,parseWorkspaceRoute} from '../workspace-state.js';
import {extensionCacheInfo} from '../extension-physics.js';
import {buildProgressReport} from '../progress-export.js';

const all=packet.sections.flatMap(s=>s.problems),extensions=all.filter(p=>p.extension),by=id=>all.find(p=>p.id===id);
const near=(a,b,message,tolerance=1e-8)=>assert.ok(Math.abs(a-b)<=tolerance*Math.max(1,Math.abs(b)),`${message}: ${a} vs ${b}`);
const unitScale={'kg·m/s':1,'g·m/s':.001,'cm/s²':.01,'m/s²':1,'km/s':1000,'km/h':1/3.6,'cm/s':.01,'m/s':1,'kN':1000,'N':1,'kg':1,'g':.001};
function printedMeasures(prompt){
 const found=[...prompt.matchAll(/([+-]?[\d,]+(?:\.\d+)?)\s+(kg·m\/s|g·m\/s|cm\/s²|m\/s²|km\/s|km\/h|cm\/s|m\/s|kN|N|kg|g)\b/g)];
 return found.map(m=>({unit:m[2],value:Number(m[1].replaceAll(',',''))*unitScale[m[2]]}));
}
function answerFromPrintedGivens(problem,params,prompt){
 const k=problem.simulation.kind,q=params._quantity,items=printedMeasures(prompt),values=items.map(x=>x.value);
 if(k==='extension-interaction')return q==='reactionForce'?values[0]:q==='mass'?values[0]/values[1]:values[1]/values[0];
 if(k==='extension-buoyancy')return q==='mass'?values[0]/values[1]:q==='buoyancy'?values[0]*values[1]:q==='netForce'?values[1]-values[0]*values[2]:(values[1]-values[0]*values[2])/values[0];
 if(k==='extension-force'){
  if(q==='mass')return values[0]/values[1];
  if(params.axis==='vertical')return q==='netForce'?values[1]-values[0]*values[2]:(values[1]-values[2])/values[0];
  return q==='netForce'?values[0]*values[1]:values[1]/values[0];
 }
 return q==='momentum'?values[0]*values[1]:q==='mass'?values[0]/values[1]:values[1]/values[0];
}
function finiteState(state,label){
 for(const [key,value] of Object.entries(state))if(typeof value==='number')assert.ok(Number.isFinite(value),`${label} state ${key}`);
 for(const body of state.bodies)for(const[key,value]of Object.entries(body))if(typeof value==='number')assert.ok(Number.isFinite(value),`${label} body ${key}`);
 for(const force of state.forces)assert.ok(Number.isFinite(force.value),`${label} force`);
 for(const readout of state.readouts)assert.ok(Number.isFinite(readout.value),`${label} readout`);
}
class MemoryStorage{data=new Map();getItem(k){return this.data.get(k)??null;}setItem(k,v){this.data.set(k,String(v));}removeItem(k){this.data.delete(k);}}
const storage=new MemoryStorage();let cases=0,boundTrials=0;
assert.equal(extensions.length,18);
for(const problem of extensions){
 const targets=new Set(),originalSnapshot=JSON.stringify(problem);
 for(const variantId of [null,...listPracticeIds(problem)]){
  const params=variantId?getPractice(problem,variantId).params:problem.simulation.params,label=variantId||problem.id;
  const question=getQuestion(problem,params),lesson=getPracticeLesson(problem,params),active=getActiveProblem(problem,params),target=getAnswerUnit(problem,params),field=lesson.fields[0],expected=answerFromPrintedGivens(problem,params,question.prompt)/target.factor;
  targets.add(params._quantity);
  assert.equal(lesson.fields.length,1,`${label}: one numerical answer`);
  assert.equal(field.type,'number');
  assert.ok(Number.isFinite(expected),`${label}: printed problem is mathematically sufficient`);
  assert.ok(Math.abs(expected-field.expected)<=field.tolerance,`${label}: answer from literal printed givens ${expected} differs from key ${field.expected}`);
  assert.equal(checkAnswers(active,lesson,{[field.key]:String(expected)}).correct,true,`${label}: literal answer accepted`);
  assert.equal(checkAnswers(active,lesson,{[field.key]:String(expected+Math.max(.1,Math.abs(expected)*.1))}).correct,false,`${label}: incorrect value rejected`);
  near(solve(problem,params).value,field.expected*target.factor,`${label}: physical result matches key`,1e-7);
  assert.ok(!/undefined|NaN|Infinity/.test(question.prompt+lesson.steps.join(' ')),label);
  const initial=getInitialPrediction(problem,params),bounds=getPredictionBounds(problem,params),guess=createPrediction(problem,params,initial);
  assert.ok(initial>=bounds.min&&initial<=bounds.max,`${label}: initial within limits`);
  assert.equal(guess.ok,true,`${label}: initial experiment ${guess.error}`);
  assert.equal(guess.correct,false,`${label}: starting estimate must not solve`);
  const correct=createPrediction(problem,params,field.expected*target.factor);assert.equal(correct.ok,true,`${label}: correct prediction ${correct.error}`);assert.equal(correct.correct,true,label);
  for(const value of [-1e300,1e300]){
   const trial=createPrediction(problem,params,value);assert.equal(trial.ok,true,`${label}: bounded trial ${trial.error}`);
   assert.ok(trial.value>=bounds.min&&trial.value<=bounds.max,`${label}: clamp range`);
   for(const t of [0,trial.duration*.37,trial.duration,1e300])finiteState(evaluate(trial.problem,trial.params,t),label);
   boundTrials++;
  }
  const workspace=createWorkspaceStore(storage),selection=workspace.select(problem,params);assert.equal(selection.ok,true,`${label}: selection saved`);
  const recordId=selection.recordId,progress=createWorkspaceProgressStore(storage),response={[field.key]:String(expected)};
  assert.equal(progress.save(recordId,{answers:response,status:'correct',attempts:1}).ok,true,`${label}: answer saved`);
  const hash=workspaceHash(problem,selection),parsed=parseWorkspaceRoute(hash),reload=createWorkspaceStore(storage).selection(problem,parsed.variantId);
  assert.equal(reload.recordId,recordId,label);assert.deepEqual(reload.params,params,label);
  assert.deepEqual(createWorkspaceProgressStore(storage).load(recordId).record.answers,response,label);
  cases++;
 }
 assert.ok(targets.size>=3,`${problem.id}: at least three unknowns rotate`);
 assert.equal(JSON.stringify(problem),originalSnapshot,`${problem.id}: original is immutable`);
}
// A Newton's-third-law pair must conserve total momentum throughout the push.
for(const p of extensions.filter(p=>p.simulation.kind==='extension-interaction'))for(const id of listPracticeIds(p)){
 const params=getPractice(p,id).params;
 for(const t of [0,.1,params.pushDuration/2,params.pushDuration,2]){
  const s=evaluate(p,params,t),[a,b]=s.bodies;
  near(a.mass*a.v+b.mass*b.v,0,`${id}: isolated pair momentum`);
  if(t<params.pushDuration){assert.equal(s.forces.length,2);near(s.forces[0].value,-s.forces[1].value,`${id}: equal opposite forces`);near(a.mass*a.a,s.forces[0].value,`${id}: first F=ma`);near(b.mass*b.a,s.forces[1].value,`${id}: second F=ma`);}
  else{near(a.a,0,`${id}: first coasts after release`);near(b.a,0,`${id}: second coasts after release`);}
 }
}
// Buoyancy must respond to displacement, and excess mass must physically sink.
const boat=by('P36'),floatParams={...boat.simulation.params,mass:100,g:9.8,buoyancy:1960,height:-3,time:20};
const floating=evaluate(boat,floatParams,20);
assert.ok(Math.abs(floating.v)<.02,'floating object settles');near(floating.buoyancy,980,'floating buoyancy balances weight',.005);assert.ok(floating.submergedFraction<1&&floating.submergedFraction>0,'float partially submerged');
const sinkParams={...floatParams,mass:300},sinking=evaluate(boat,sinkParams,1),bottom=evaluate(boat,sinkParams,20);
assert.ok(sinking.x<sinkParams.height&&sinking.v<0,'overloaded object sinks');assert.equal(bottom.grounded,true);near(bottom.v,0,'bottom velocity');near(bottom.netForce,0,'bottom force balance');assert.ok(bottom.supportForce>0,'seabed supplies support');
for(let i=0;i<20;i++)evaluate(boat,{...floatParams,mass:50+i},1);assert.ok(extensionCacheInfo().buoyancyProfiles<=extensionCacheInfo().limit,'bounded cached trajectories');
// A fixed lander engine cannot support arbitrary mass.
const lander=by('P43'),heavy={...lander.simulation.params,mass:lander.simulation.params.mass*2};
assert.ok(evaluate(lander,heavy,.2).a<0,'heavier lander descends under fixed thrust');
// Every original and practice item starts with an incorrect, runnable estimate.
// In particular, westward slowing has POSITIVE acceleration: abs(a) is not a safe guess.
let oldCases=0;
for(const problem of all.filter(p=>!p.extension))for(const variantId of [null,...listPracticeIds(problem)]){
 const params=variantId?getPractice(problem,variantId).params:problem.simulation.params,label=variantId||problem.id;
 const initial=problem.numericAnswer?createPrediction(problem,params,getInitialPrediction(problem,params)):createExploration(problem,params,getExploration(problem,params).initial);
 assert.equal(initial.ok,true,`${label}: initial runnable`);assert.equal(initial.correct,false,`${label}: initial must be incorrect`);
 if(problem.numericAnswer)for(const value of [-1e300,1e300])assert.equal(createPrediction(problem,params,value).ok,true,`${label}: extreme input clamped`);
 oldCases++;
}
const drone=by('P26'),heavyDrone=createPrediction(drone,drone.simulation.params,4),droneState=evaluate(heavyDrone.problem,heavyDrone.params,.1);
near(droneState.a,-4.25,'4 kg drone under fixed 23 N lift accelerates downward');near(droneState.netForce,-17,'drone net force includes new weight');
for(const id of ['P17','P19']){
 const p=by(id),params=p.simulation.params,info=modelInfo(p,params);assert.equal(info.static,false,`${id}: base and trial both animate`);
 const start=evaluate(p,params,0),end=evaluate(p,params,info.duration);assert.notEqual(start.currentScaleForce,end.currentScaleForce,`${id}: scale loads and settles`);
 for(const time of [0,.3,info.duration]){const state=evaluate(p,params,time);near(state.forces.reduce((sum,f)=>sum+f.value,0),state.bodies[0].mass*state.bodies[0].a,`${id}: settling F=ma`);}
 near(end.currentScaleForce,params.mass*params.g,`${id}: settled weight`,.001);
}
// The readable progress file must not execute student-supplied HTML or scripts.
const html=buildProgressReport({studentName:'<script>alert(1)</script>',records:{P33:{answers:{value:'<img src=x onerror=alert(1)>'},explanation:'<svg/onload=alert(1)>',status:'draft',attempts:1}},resolveRecord:()=>({p:by('P33'),lesson:getPracticeLesson(by('P33'))})});
assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<script>'));assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('Skaters push apart'));
console.log(`PASS: independent audit of ${cases} extension originals/variants from literal printed givens; ${boundTrials} extreme bounded trials; ${oldCases} original/practice initial guesses; grading, routes, saved answers, force-pair momentum, sinking/floating, fixed-lift overload, spring-scale dynamics, bounded caches, and safe teacher report.`);
