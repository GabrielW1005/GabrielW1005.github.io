import assert from 'node:assert/strict';
import packet from '../data.js';
import {evaluate,modelInfo,solve,springScaleState} from '../physics.js';
import {getPractice,listPracticeIds} from '../practice.js';
import {createPrediction,getInitialPrediction,getPredictionBounds,closeEnough,getExploration,createExploration} from '../experiments.js';
import {extensionCacheInfo} from '../extension-physics.js';
const extensions=packet.sections.flatMap(s=>s.problems).filter(p=>p.extension),all=packet.sections.flatMap(s=>s.problems),by=id=>all.find(p=>p.id===id),near=(a,b,tol=1e-7)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
assert.equal(extensions.length,18);
function independent(p){const k=p.simulation.kind,s=p.simulation.params,q=s._quantity||p.numericAnswer.quantity;if(k==='extension-interaction')return q==='mass'?s.mass2:q==='acceleration'?s.force/s.mass2:s.force;if(k==='extension-buoyancy')return q==='mass'?s.buoyancy/s.g:q==='buoyancy'?s.mass*s.g:q==='acceleration'?(s.buoyancy-s.mass*s.g)/s.mass:s.buoyancy-s.mass*s.g;if(k==='extension-momentum')return q==='mass'?s.mass:q==='velocity'?s.velocity:s.mass*s.velocity;const F=s.axis==='vertical'?s.upwardForce-s.mass*s.g:s.netForce;return q==='mass'?s.mass:q==='acceleration'?F/s.mass:F;}
function finiteState(state){assert.ok([state.x,state.v,state.a,state.speed,state.distance,...state.bodies.flatMap(b=>[b.x,b.v,b.a,b.mass,b.distance]),...state.forces.map(f=>f.value),...state.readouts.map(r=>r.value)].every(Number.isFinite));for(let i=0;i<state.bodies.length;i++){const body=state.bodies[i],force=state.forces.filter(f=>f.body===i).reduce((s,f)=>s+f.value,0);near(force,body.mass*body.a,1e-6);}}
let cases=0,states=0;
for(const original of extensions){const paramsList=[original.simulation.params,...listPracticeIds(original).map(id=>getPractice(original,id).params)];
 for(const params of paramsList){const problem={...original,simulation:{...original.simulation,params}},snapshot=JSON.stringify(params),answer=solve(problem,params).value;near(answer,independent(problem));const initial=getInitialPrediction(problem,params);assert.equal(closeEnough(initial,answer),false,original.id);
  const limits=getPredictionBounds(problem,params);assert.ok(limits.min<=answer&&limits.max>=answer);const right=createPrediction(problem,params,answer);assert.equal(right.ok,true,right.error);assert.equal(right.correct,true);const wrong=createPrediction(problem,params,initial);assert.equal(wrong.ok,true,wrong.error);assert.equal(wrong.correct,false);
  for(const entered of [answer,initial,-Infinity,Infinity]){const experiment=createPrediction(problem,params,entered);assert.equal(experiment.ok,true,`${original.id}: ${experiment.error}`);for(const t of [0,experiment.duration/2,experiment.duration]){const state=evaluate(problem,experiment.params,t);finiteState(state);states++;}}
  if(problem.simulation.kind==='extension-interaction'){for(const t of [0,params.pushDuration/2,params.pushDuration,params.time]){const state=evaluate(problem,params,t);near(state.totalMomentum,0);if(state.contact){near(state.force1,-state.force2);assert.ok(state.bodies[0].a<0&&state.bodies[1].a>0);}else assert.equal(state.forces.length,0);}}
  if(problem.simulation.kind==='extension-momentum'){for(const t of [0,params.time])near(evaluate(problem,params,t).totalMomentum,params.mass*params.velocity);}
  assert.equal(JSON.stringify(params),snapshot,'Mutated original measurements');cases++;
 }
}
const water=extensions.find(p=>p.simulation.kind==='extension-buoyancy'),p={mass:80,g:10,buoyancy:1000,height:-3,time:20,vi:0};
const start=evaluate(water,p,0);near(start.a,2.5);near(start.dragForce,0);const floating=evaluate(water,p,20);assert.ok(floating.submergedFraction>0&&floating.submergedFraction<1);near(floating.buoyancy,800,.002);assert.ok(Math.abs(floating.v)<.005,'Float should settle');
const heavy=evaluate(water,{...p,mass:160},20);assert.equal(heavy.grounded,true);near(heavy.x,heavy.waterBottom+heavy.hullHeight/2);near(heavy.v,0);near(heavy.netForce,0);assert.ok(heavy.supportForce>0);near(heavy.forces.reduce((s,f)=>s+f.value,0),0);
const massQuestion=extensions.find(p=>p.simulation.kind==='extension-buoyancy'&&p.simulation.params._quantity==='mass'),massParams=massQuestion.simulation.params,massAnswer=solve(massQuestion,massParams).value,overload=createPrediction(massQuestion,massParams,massAnswer*1.7);assert.ok(evaluate(massQuestion,overload.params,0).a<0,'Fixed buoyancy and greater mass must sink');
const drone=by('P26'),droneTrial=createPrediction(drone,drone.simulation.params,4);assert.ok(evaluate(drone,droneTrial.params,0).a<0);near(droneTrial.params.upwardForce,evaluate(drone,drone.simulation.params,0).upwardForce);
for(const id of ['P17','P19']){const problem=by(id),params=problem.simulation.params,info=modelInfo(problem,params);assert.equal(info.static,false);for(const t of [0,.2,1,info.duration]){const s=evaluate(problem,params,t),scale=springScaleState(params,t);near(s.currentScaleForce,scale.force);near(s.netForce,s.mass*s.a);near(s.springExtension,scale.x);}const end=evaluate(problem,params,info.duration);near(end.currentScaleForce,end.weight,1e-4);}
// Existing practice controls, including westbound slowing, must also begin unsolved.
for(const problem of all.filter(p=>!p.extension))for(const params of [problem.simulation.params,...listPracticeIds(problem).map(id=>getPractice(problem,id).params)]){
 const guess=problem.numericAnswer?createPrediction(problem,params,getInitialPrediction(problem,params)):createExploration(problem,params,getExploration(problem,params).initial);
 assert.equal(guess.ok,true,problem.id);assert.equal(guess.correct,false,`${problem.id} ${params._practiceVariant||'original'} begins solved`);
}
const bus=by('P09'),zeroAcceleration={...bus.simulation.params,vf:bus.simulation.params.vi};assert.equal(createPrediction(bus,zeroAcceleration,getInitialPrediction(bus,zeroAcceleration)).correct,false);
assert.ok(extensionCacheInfo().buoyancyProfiles<=extensionCacheInfo().limit);
console.log(`PASS: ${cases} extension questions; ${states} finite Newtonian trial states; correct/incorrect defaults; input clamps; third-law force/impulse conservation; all F/m/a and p/m/v; floating equilibrium, sinking and seabed support; P26 fixed lift; consistent scale animation; bounded buoyancy cache.`);
