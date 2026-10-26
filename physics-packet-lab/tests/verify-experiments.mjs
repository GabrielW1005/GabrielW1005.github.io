import assert from 'node:assert/strict';
import packet from '../data.js';
import {generatePractice} from '../practice.js';
import {evaluate,modelInfo,solve} from '../physics.js';
import {createPrediction,getExploration,createExploration,closeEnough,getPredictionBounds} from '../experiments.js';
const all=packet.sections.flatMap(s=>s.problems).filter(p=>!p.extension),by=id=>all.find(p=>p.id===id),clone=o=>JSON.parse(JSON.stringify(o)),near=(a,b)=>assert.ok(Math.abs(a-b)<=1e-7*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
function checkEnvelope(x){assert.equal(x.ok,true,x.error);assert.ok(x.duration>0&&Number.isFinite(x.duration));assert.ok(Number.isFinite(x.value)&&Number.isFinite(x.expected));assert.ok(x.explanation.length>25);for(const [problem,params,end] of [[x.problem,x.params,x.sampleTime??x.duration],[x.referenceProblem,x.referenceParams,x.referenceSampleTime??x.duration]])for(const t of [0,end/2,end]){const s=evaluate(problem,params,t);assert.ok([s.x,s.v,s.a,...s.bodies.flatMap(b=>[b.x,b.v,b.a,...(b.y!==undefined?[b.y,b.vy,b.ay]:[])]),...s.readouts.map(r=>r.value)].every(Number.isFinite));}}
const solutionValues=(p,params,spec,start)=>p.id==='P23'?{proposedThrust:params.backwardForce,proposedLift:params.weight}:{[spec.controls[0].key]:start.expected};
let numericCases=0,conceptCases=0;
for(const p of all){const base=p.simulation.params,snapshot=JSON.stringify(base);
 if(p.numericAnswer){
  const expected=solve(p,base).value,correct=createPrediction(p,base,expected);checkEnvelope(correct);assert.equal(correct.correct,true,p.id);near(solve(correct.problem,correct.params,p.numericAnswer.quantity).value,expected);
  const wrongValue=expected===0?1:expected*1.5,wrong=createPrediction(p,base,wrongValue);checkEnvelope(wrong);assert.equal(wrong.correct,false,p.id);near(solve(wrong.problem,wrong.params,p.numericAnswer.quantity).value,wrongValue);assert.notDeepEqual(wrong.params,wrong.referenceParams,p.id);
  // Custom givens must produce a new expected answer and a corresponding physical trial.
  for(const f of p.simulation.adjustable||[]){const custom={...base,[f.key]:f.max},answer=solve(p,custom).value,x=createPrediction(p,custom,answer);checkEnvelope(x);assert.equal(x.correct,true,p.id);near(x.expected,answer);near(solve(x.problem,x.params,p.numericAnswer.quantity).value,answer);numericCases++;}
  numericCases+=2;
 }else{
  const spec=getExploration(p,base);assert.equal(spec.controls.length,p.id==='P23'?2:1);assert.ok(spec.instruction.length>25);const start=createExploration(p,base,spec.initial);checkEnvelope(start);assert.equal(start.correct,false,`${p.id} default must not solve the goal`);
  const key=spec.controls[0].key,answer=start.expected,done=createExploration(p,base,solutionValues(p,base,spec,start));checkEnvelope(done);assert.equal(done.correct,true,p.id);
  if(start.overlay){assert.ok(['vector','interval'].includes(start.overlay.type));assert.notDeepEqual(start.overlay,done.overlay,p.id);if(start.overlay.type==='vector'){assert.ok(start.overlay.label.startsWith('Your'));assert.ok(start.overlay.expectedLabel.includes('Physical'));}}
  else assert.ok(JSON.stringify(start.params)!==JSON.stringify(done.params)||start.sampleTime!==done.sampleTime,p.id);
  // Check custom givens and both control endpoints for all conceptual tasks.
  for(const f of p.simulation.adjustable||[]){const custom={...base,[f.key]:f.max},cs=getExploration(p,custom),first=createExploration(p,custom,cs.initial);checkEnvelope(first);assert.equal(first.correct,false,`${p.id} custom default`);const solved=createExploration(p,custom,solutionValues(p,custom,cs,first));checkEnvelope(solved);assert.equal(solved.correct,true,p.id);conceptCases++;}
  for(const field of spec.controls)for(const value of [field.min,field.max]){const x=createExploration(p,base,{...spec.initial,[field.key]:value});if(x.ok)checkEnvelope(x);else assert.ok(x.error);}
  conceptCases+=2;
 }
 assert.equal(JSON.stringify(base),snapshot,'Inputs mutated');
}
// Zero is valid where physical; positive mass/weight and impossible signs clamp to their nearest bound.
for(const id of ['P01','P02','P05','P06','P09','P10','P13','P14','P18','P21','P22','P25','P29','P30']){const p=by(id),x=createPrediction(p,p.simulation.params,0);checkEnvelope(x);near(solve(x.problem,x.params,p.numericAnswer.quantity).value,0);}
for(const id of ['P17','P26'])for(const invalid of [-1,0,1e-300]){const p=by(id),x=createPrediction(p,p.simulation.params,invalid);checkEnvelope(x);near(x.value,getPredictionBounds(p,p.simulation.params).min);}
for(const id of ['P01','P05','P06','P13','P18']){const p=by(id);const x=createPrediction(p,p.simulation.params,-1);checkEnvelope(x);near(x.value,0);}
for(const p of all.filter(p=>p.numericAnswer)){assert.equal(createPrediction(p,p.simulation.params,NaN).ok,false);for(const value of [Infinity,-Infinity,1e10]){const x=createPrediction(p,p.simulation.params,value);checkEnvelope(x);assert.equal(x.inputClamped,true);}const large=createPrediction(p,p.simulation.params,1e9);if(large.ok)checkEnvelope(large);else assert.ok(large.error);}
// Friction predictions create acceleration, but the model never has passive friction reverse a stopped box.
const box=by('P18'),tooMuch=createPrediction(box,box.simulation.params,70);const stopped=evaluate(tooMuch.problem,tooMuch.params,3);near(stopped.v,0);assert.ok(stopped.x>=0);
// Wrong contact-force guesses remain visibly separate prediction arrows, not impossible unequal internal forces.
const marble=by('P31'),guess=createExploration(marble,marble.simulation.params,{forceN:-5});checkEnvelope(guess);assert.equal(guess.overlay.angle,180);const contact=evaluate(guess.problem,guess.params,guess.sampleTime);near(contact.forces[0].value,-contact.forces[1].value);assert.equal(guess.correct,false);
const crate=by('P20'),pull=createExploration(crate,crate.simulation.params,{frictionForce:-18});checkEnvelope(pull);near(evaluate(pull.problem,pull.params,0).a,0);assert.equal(pull.correct,false);
// Momentum predictions change actual velocities and preserve their proposed system total across impact.
const clay=by('P30'),clayTrial=createPrediction(clay,clay.simulation.params,.3);for(const t of [0,1.004,2])near(evaluate(clayTrial.problem,clayTrial.params,t).totalMomentum,.3);
const astronaut=by('P19'),sameMass=createExploration(astronaut,astronaut.simulation.params,{mass:150});near(evaluate(sameMass.referenceProblem,sameMass.referenceParams,0).weight,1500);near(evaluate(sameMass.problem,sameMass.params,0).weight,555);near(sameMass.referenceParams.mass,sameMass.params.mass);
const train=by('P04'),observer=createExploration(train,{...train.simulation.params,frame:1},{referenceVelocity:10});near(evaluate(observer.referenceProblem,observer.referenceParams,3).v,10);near(evaluate(observer.problem,observer.params,3).v,0);
const balloon=by('P22'),downLimit=createPrediction(balloon,balloon.simulation.params,-11000);checkEnvelope(downLimit);near(downLimit.value,-balloon.simulation.params.weight);
assert.equal(closeEnough(.204,.2),false);assert.equal(closeEnough(.2005,.2),true);assert.equal(closeEnough(0,0),true);assert.equal(closeEnough(.02,0),false);
// P23 must balance BOTH force components, preserving even a nonzero initial vertical velocity.
const airplane=by('P23'),given={...airplane.simulation.params,backwardForce:4000,upwardForce:15000,vy:3};
const balance=createExploration(airplane,given,{proposedThrust:4000,proposedLift:12000});checkEnvelope(balance);assert.equal(balance.correct,true);const levelAccel=evaluate(balance.problem,balance.params,2);near(levelAccel.ax,0);near(levelAccel.ay,0);near(levelAccel.vy,3);
const unbalanced=createExploration(airplane,given,{proposedThrust:4000,proposedLift:11000});checkEnvelope(unbalanced);assert.equal(unbalanced.correct,false);assert.ok(evaluate(unbalanced.problem,unbalanced.params,2).ay<0);
assert.equal(createExploration(airplane,given,{proposedThrust:4000}).ok,false);
// Practice variants retain lap semantics and must not begin with the fastest window already selected.
for(const id of ['P03','P15'])for(const draw of [.01,.4,.9]){const problem=by(id),practice=generatePractice(problem,{},()=>draw),spec=getExploration(problem,practice.params),start=createExploration(problem,practice.params,spec.initial);checkEnvelope(start);assert.equal(start.correct,false,`${practice.variantId} begins unsolved`);const complete=createExploration(problem,practice.params,{[spec.controls[0].key]:start.expected});checkEnvelope(complete);assert.equal(complete.correct,true);if(id==='P03'){near(complete.sampleTime,modelInfo(problem,practice.params).duration);if(practice.params.laps===2){const oneLap=createExploration(problem,practice.params,{finishLap:1});assert.equal(oneLap.correct,false);near(oneLap.sampleTime,modelInfo(problem,practice.params).duration/2);near(evaluate(oneLap.problem,oneLap.params,oneLap.sampleTime).distance,2*Math.PI*practice.params.radius);}}}
const routeProblem=by('P01'),bothEast={...routeProblem.simulation.params,start:0,turn:8,end:9},eastPrediction=createPrediction(routeProblem,bothEast,9);checkEnvelope(eastPrediction);assert.equal(eastPrediction.correct,true);near(eastPrediction.params.end,9);near(evaluate(eastPrediction.problem,eastPrediction.params,eastPrediction.duration).x,9);
console.log(`PASS: ${numericCases} numeric prediction cases, ${conceptCases} conceptual exploration cases; all 32 problems; correct/wrong/current-value trials; immutable givens; finite states; signed/zero/extreme boundaries; physical momentum; safe friction and third-law overlays.`);
