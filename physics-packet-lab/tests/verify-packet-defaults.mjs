import assert from 'node:assert/strict';
import packet from '../data.js';
import {lessons} from '../packet-lessons.js';
import {getPracticeLesson,getActiveProblem} from '../practice-lessons.js';
import {getAnswerUnit,listPracticeIds,getPractice} from '../practice.js';
import {getPredictionBounds,getInitialPrediction} from '../experiments.js';
import {checkAnswers} from '../packet-core.js';
import {getEquationWarmups} from '../extensions.js';
const problems=packet.sections.flatMap(section=>section.problems);let checked=0;
for(const p of problems){
 const variants=[{params:p.simulation.params,original:true},...listPracticeIds(p).map(id=>getPractice(p,id))];
 for(const variant of variants){
  const params=variant.params,lesson=variant.original&&!p.extension?lessons[p.id]:getPracticeLesson(p,params),active=variant.original&&!p.extension?p:getActiveProblem(p,params);
  if(!lesson.fields.length)continue;
  const unit=getAnswerUnit(p,params),bounds=getPredictionBounds(p,params),guess=Number((getInitialPrediction(p,params)/unit.factor).toPrecision(7));
  assert(Number.isFinite(guess),`${p.id} finite starting value`);
  assert(guess>=bounds.min/unit.factor-1e-9&&guess<=bounds.max/unit.factor+1e-9,`${p.id} starting value in allowed display range`);
  const answers=Object.fromEntries(lesson.fields.map(field=>[field.key,field.type==='number'?String(guess):field.expected]));
  assert(!checkAnswers(active,lesson,answers).correct,`${p.id} default is not the answer`);
  for(const field of lesson.fields.filter(field=>field.type==='number')){
   assert(field.expected>=bounds.min/unit.factor-1e-8&&field.expected<=bounds.max/unit.factor+1e-8,`${p.id} correct field answer allowed`);
  }
  checked++;
 }
}
for(const id of ['P25','P26','P27','P29','P30','P33','P40','P45']){
 const p=problems.find(p=>p.id===id),warmups=getEquationWarmups(p,p.simulation.params);assert(warmups.length,`${id} has equation warmups`);assert(warmups.some(w=>w.steps.some(step=>/both sides/i.test(step))),`${id} explicitly teaches doing the same operation on both sides`);
}
console.log(`${checked} packet numerical starting guesses are finite, within display-unit limits, and not graded correct; F=ma and p=mv equation warm-ups teach both sides.`);
