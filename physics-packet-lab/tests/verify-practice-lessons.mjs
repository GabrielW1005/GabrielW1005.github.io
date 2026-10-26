import assert from 'node:assert/strict';
import packet from '../data.js';
import {getPractice,listPracticeIds,getQuestion,getAnswerUnit} from '../practice.js';
import {getActiveProblem,getPracticeLesson} from '../practice-lessons.js';
import {checkAnswers} from '../packet-core.js';
import {lessons} from '../packet-lessons.js';

const problems=packet.sections.flatMap(s=>s.problems).filter(p=>!p.extension),byId=Object.fromEntries(problems.map(p=>[p.id,p]));
const copy=x=>JSON.parse(JSON.stringify(x));
const close=(a,b,message)=>assert.ok(Math.abs(a-b)<1e-8*Math.max(1,Math.abs(b)),`${message}: ${a} versus ${b}`);
function independent(id,p){
 switch(id){
 case'P01':return Math.abs(p.turn-p.start)+Math.abs(p.end-p.turn);
 case'P02':return p.end-p.start;
 case'P05':return p.distance/p.time;
 case'P06':return p.speed*p.time;
 case'P09':return(p.vf-p.vi)/(p.endTime-p.startTime);
 case'P10':return p.vi+p.acceleration*p.time;
 case'P13':return p.positions.slice(1).reduce((sum,x,i)=>sum+Math.abs(x-p.positions[i]),0)*p.distanceScale/((p.times.at(-1)-p.times[0])*p.timeScale);
 case'P14':return(p.vf-p.vi)/p.time;
 case'P17':return p.mass*p.g;
 case'P18':return p.forwardForce;
 case'P21':case'P22':return p.upwardForce-p.weight;
 case'P25':return(p.upwardForce-p.mass*p.g)/p.mass;
 case'P26':return p.netForce/p.acceleration;
 case'P29':case'P30':return p.mass1*p.velocity1+p.mass2*p.velocity2;
 default:throw new Error(`Missing independent formula for ${id}`);
 }
}
const primary={P01:'distance',P02:'displacement',P05:'speed',P06:'distance',P09:'acceleration',P10:'velocity',P13:'speed',P14:'acceleration',P17:'weight',P18:'friction',P21:'netForce',P22:'netForce',P25:'acceleration',P26:'mass',P29:'totalMomentum',P30:'before'};
let checked=0,numeric=0;
for(const original of problems){
 const before=JSON.stringify(original),baseKeys=lessons[original.id].fields.map(f=>f.key);
 for(const id of listPracticeIds(original)){
  const variant=getPractice(original,id),paramsBefore=JSON.stringify(variant.params),lesson=getPracticeLesson(original,variant.params),active=getActiveProblem(original,variant.params);
  assert.equal(active.prompt,getQuestion(original,variant.params,{practice:true}).prompt,`${id}: current question`);
  assert.deepEqual(active.table,getQuestion(original,variant.params,{practice:true}).table,`${id}: current table`);
  assert.equal(active.answer,lesson.answer,`${id}: current model answer`);
  assert.deepEqual(active.simulation.params,variant.params,`${id}: current model params`);
  assert.deepEqual(lesson.fields.map(f=>f.key),baseKeys,`${id}: preserved answer field identities`);
  assert.ok(lesson.hint.length>12&&lesson.why.length>25&&lesson.answer.length>4,`${id}: useful help`);
  assert.ok(lesson.steps.length>=2&&lesson.steps.length<=9,`${id}: concise steps`);
  assert.ok(lesson.criteria.length>=2,`${id}: review criteria`);
  assert.doesNotMatch(JSON.stringify(lesson),/undefined|NaN|Infinity/,`${id}: finite help values`);
  assert.equal(JSON.stringify(variant.params),paramsBefore,`${id}: input params mutated`);
  if(original.numericAnswer){
   const target=getAnswerUnit(original,variant.params),expected=independent(original.id,variant.params)/target.factor;
   close(active.numericAnswer.value,expected,`${id}: independent answer`);
   assert.equal(active.numericAnswer.unit,target.unit);
   close(lesson.fields.find(f=>f.key===primary[original.id]).expected,expected,`${id}: field answer`);
   if(original.id==='P30')close(lesson.fields.find(f=>f.key==='after').expected,expected,`${id}: conserved total afterward`);
   const answers=Object.fromEntries(lesson.fields.map(f=>[f.key,String(f.expected)]));
   assert.equal(checkAnswers(active,lesson,answers).correct,true,`${id}: correct full answer accepted`);
   for(const f of lesson.fields){
    const missing={...answers,[f.key]:''};assert.equal(checkAnswers(active,lesson,missing).correct,false,`${id}: missing ${f.key} rejected`);
    const wrong={...answers,[f.key]:f.type==='number'?String(f.expected+Math.max(.1,Math.abs(f.expected)*.25)):'opposite'};
    assert.equal(checkAnswers(active,lesson,wrong).correct,false,`${id}: wrong ${f.key} rejected`);
   }
   const direction=lesson.fields.find(f=>f.type==='direction');
   if(direction&&['P02','P09','P10','P14'].includes(original.id))assert.equal(direction.expected,expected===0?'none':expected>0?'east':'west');
   if(direction&&['P21','P22','P25'].includes(original.id))assert.equal(direction.expected,Math.abs(expected)<1e-9?'none':expected>0?'up':'down');
   if(target.unit!==original.numericAnswer.unit.replace(/ (east|west|up|down)$/,''))assert.ok(lesson.steps.some(step=>step.includes(target.unit)),`${id}: requested unit in steps`);
   numeric++;
  }else{
   assert.equal(lesson.fields.length,0);
   assert.equal(checkAnswers(active,lesson,{}, {explanation:'This is a student explanation.'}).correct,null,`${id}: prose never auto-graded`);
  }
  checked++;
 }
 assert.equal(JSON.stringify(original),before,`${original.id}: printed original mutated`);
}
// Dynamic conceptual explanations must change when a quantity changes the conclusion.
const custom=(id,patch)=>getPracticeLesson(byId[id],{...copy(byId[id].simulation.params),...patch});
assert.match(custom('P03',{laps:1.5}).answer,/nonzero/);
assert.match(custom('P07',{speed:2,otherSpeed:-3}).answer,/different speeds/);
assert.match(custom('P07',{speed:2,otherSpeed:2}).answer,/same velocities/);
assert.match(custom('P11',{vi:-3,vf:-1}).answer,/slowing down/);
assert.match(custom('P11',{vi:-1,vf:2}).answer,/reverses direction/);
assert.match(custom('P15',{times:[0,5,15,20],positions:[0,10,20,23]}).answer,/0–5 s/);
assert.match(custom('P16',{speed:2,otherSpeed:-4}).answer,/differ in height/);
assert.match(custom('P19',{g:12,compareG:10}).answer,/larger/);
assert.match(custom('P20',{forwardForce:25,staticLimit:18,kineticFriction:14}).answer,/slides.*14 N left/);
assert.match(custom('P20',{forwardForce:10,staticLimit:18}).answer,/stays at rest.*10 N left/);
assert.match(custom('P23',{upwardForce:11000,weight:12000,forwardForce:3500,backwardForce:3000}).answer,/forward.*downward/);
assert.match(custom('P24',{vi:-2}).answer,/2 m\/s left/);
assert.match(custom('P27',{mass:1,compareMass:.5,netForce:1}).steps.join(' '),/0.5 kg airplane has the greater/);
// Tiny unit-converted values cannot pass when rounded almost to zero.
const small=custom('P18',{forwardForce:12.5,backwardForce:12.5,_displayUnits:{force:'N',answer:'kN'}});
assert.equal(checkAnswers(byId.P18,small,{friction:'0.01',direction:'left'}).correct,false);
assert.equal(checkAnswers(byId.P18,small,{friction:'0.0125',direction:'left'}).correct,true);
// Unit conversion steps must be attached to the measurements the prompt actually gives.
const bird=custom('P25',{mass:.35,upwardForce:4.2,_displayUnits:{mass:'g',force:'N',answer:'cm/s²'}});
assert.ok(bird.steps.some(s=>s.includes('350 g = 0.35 kg')));
assert.ok(bird.steps.some(s=>s.includes('2 m/s² = 200 cm/s²')));
console.log(`PASS: ${checked} dynamic practice lessons (${numeric} numeric); independent display-unit answers, complete multipart checks, current conceptual conclusions, conversions, and unchanged originals.`);
