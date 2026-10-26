import assert from 'node:assert/strict';
import packet from '../data.js';
import {getQuestion,getPractice,listPracticeIds,getAnswerUnit,unitFactor} from '../practice.js';
import {getPracticeLesson,getActiveProblem,getEquationWarmups} from '../practice-lessons.js';
import {checkAnswers} from '../packet-core.js';
const originals=packet.sections.flatMap(s=>s.problems).filter(p=>!p.extension),extra=packet.sections.flatMap(s=>s.problems).filter(p=>p.extension);
assert.equal(originals.length,32);assert.equal(extra.length,18);assert.equal(packet.sections.filter(s=>s.extension).length,4);
function independent(problem,p){
 const k=problem.simulation.kind,q=p._quantity;
 if(k==='extension-interaction')return q==='reactionForce'?p.force:q==='mass'?p.force/(p.force/p.mass2):p.force/p.mass2;
 if(k==='extension-buoyancy')return q==='mass'?p.buoyancy/p.g:q==='buoyancy'?p.mass*p.g:q==='netForce'?p.buoyancy-p.mass*p.g:(p.buoyancy-p.mass*p.g)/p.mass;
 if(k==='extension-force'){const f=p.axis==='vertical'?p.upwardForce-p.mass*p.g:p.netForce;return q==='mass'?f/p.acceleration:q==='netForce'?f:f/p.mass;}
 return q==='momentum'?p.mass*p.velocity:q==='mass'?p.momentum/p.velocity:p.momentum/p.mass;
}
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${msg}: ${a} != ${b}`);
let count=0;const unitBank=new Set(),unknownBank=new Set(),warmupBank=new Set();
for(const problem of extra){
 assert.equal(problem.type,'quantitative');assert.ok(problem.numericAnswer);const ids=listPracticeIds(problem);assert.equal(ids.length,24);
 const unknowns=new Set(),resultsByUnknown=new Map();
 for(const variant of [null,...ids]){
  const generated=variant?getPractice(problem,variant):null,p=generated?.params||problem.simulation.params,q=getQuestion(problem,p),lesson=getPracticeLesson(problem,p),active=getActiveProblem(problem,p),unit=getAnswerUnit(problem,p),expected=independent(problem,p)/unit.factor;
  assert.equal(lesson.fields.length,1,problem.id);assert.equal(lesson.fields[0].type,'number');near(lesson.fields[0].expected,expected,variant||problem.id);near(active.numericAnswer.value,expected,variant||problem.id);assert.equal(active.numericAnswer.quantity,p._quantity);assert.equal(unitFactor(unit.unit),unit.factor);assert.ok(q.prompt.includes(`answer in ${unit.unit}`));assert.ok(q.prompt.length<760);assert.ok(!q.prompt.includes('undefined'));assert.ok(lesson.steps.length>0);assert.ok(lesson.why.length>10);
  assert.equal(checkAnswers(active,lesson,{value:String(expected)}).status,'correct');assert.notEqual(checkAnswers(active,lesson,{value:String(expected===0?3:expected*1.3+3)}).status,'correct');
  if(['mass','acceleration','velocity'].includes(p._quantity))assert.ok(lesson.steps.some(s=>s.includes('BOTH sides')),`${problem.id} ${p._quantity}`);
  unknowns.add(p._quantity);unknownBank.add(p._quantity);unitBank.add(unit.unit);
  if(variant){let set=resultsByUnknown.get(p._quantity);if(!set)resultsByUnknown.set(p._quantity,set=new Set());set.add(expected.toPrecision(10));count++;}
  for(const w of getEquationWarmups(problem,p)){assert.ok(w.prompt.length>0);assert.ok(w.steps.length>0);warmupBank.add(w.prompt);if(w.prompt.startsWith('Solve'))assert.ok(w.steps[0].includes('BOTH sides'));}
 }
 assert.equal(unknowns.size,problem.simulation.kind==='extension-buoyancy'?4:3,problem.id);
 for(const [unknown,answers]of resultsByUnknown)assert.ok(answers.size>=6,`${problem.id} ${unknown} should vary: ${answers.size}`);
}
assert.equal(count,432);assert.ok(unitBank.has('km/s'));assert.ok(unitBank.has('cm/s²'));assert.ok(unitBank.has('g'));assert.ok(warmupBank.size>80);assert.ok(unknownBank.has('reactionForce'));
for(const id of ['P25','P26','P27','P29','P30'])assert.equal(getEquationWarmups(originals.find(p=>p.id===id)).length,3);
console.log(`Passed: ${extra.length} new numerical problems, ${count} variants, all seven unknown types, numeric grading, unit conversions, varied BOTH-sides algebra warm-ups.`);
