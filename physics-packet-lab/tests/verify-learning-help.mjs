import assert from 'node:assert/strict';
import packet from '../data.js';
import {isHandoutOriginal,getHandoutGuidance} from '../learning-help.js';
import {listPracticeIds,getPractice} from '../practice.js';
import {checkAnswers} from '../packet-core.js';
import {lessons,warmupLessons} from '../packet-lessons.js';
const problems=packet.sections.flatMap(s=>s.problems),originals=problems.filter(p=>!p.extension),byId=id=>problems.find(p=>p.id===id);
let practices=0;
for(const p of originals){
 assert.equal(isHandoutOriginal(p),true,`${p.id}: implicit originals protected`);
 assert.equal(isHandoutOriginal(p,p.simulation.params),true,`${p.id}: explicit originals protected`);
 assert.equal(isHandoutOriginal(p,{...p.simulation.params,_practiceVariant:`${p.id}-v2-01`,_displayUnits:{answer:'cm'}}),true,`${p.id}: a label or unit change alone does not expose the key`);
 const guide=getHandoutGuidance(p);
 assert.deepEqual(Object.keys(guide).sort(),['explanation','hint','prompts']);
 assert.ok(guide.hint&&guide.explanation&&guide.prompts.length);
 assert.equal(/\d/.test(JSON.stringify(guide)),false,`${p.id}: guidance contains no numerical substitutions or answers`);
 assert.notEqual(guide.explanation,p.answer,`${p.id}: no authored answer copied into guidance`);
 const fields=lessons[p.id].fields;
 if(fields.length){const answers=Object.fromEntries(fields.map(f=>[f.key,String(f.expected)]));assert.equal(checkAnswers(p,lessons[p.id],answers).correct,true,`${p.id}: checking still works without displaying its key`);}
}
for(const p of problems){
 if(p.extension)assert.equal(isHandoutOriginal(p,p.simulation.params),false,`${p.id}: extension steps allowed`);
 for(const variant of listPracticeIds(p)){const practice=getPractice(p,variant);assert.equal(isHandoutOriginal(p,practice.params),false,`${variant}: changed practice permits a worked solution`);practices++;}
}
for(const section of packet.sections)for(const warmup of section.warmups||[]){
 assert.equal(isHandoutOriginal(warmup),true,`${warmup.id}: printed warm-up protected`);
 assert.equal(/\d/.test(JSON.stringify(getHandoutGuidance(warmup))),false);
 const lesson=warmupLessons[warmup.id],answers=Object.fromEntries(lesson.fields.map(f=>[f.key,String(f.expected)]));assert.equal(checkAnswers(warmup,lesson,answers).correct,true);
}
assert.equal(isHandoutOriginal(byId('P01'),{speed:2.7}),true,'Playback speed alone does not change the handout distances.');
assert.equal(isHandoutOriginal(byId('P01'),{turn:14}),false,'Changed path measurements permit a worked example.');
assert.equal(isHandoutOriginal(byId('P04'),{frame:1,referenceSpeed:10}),true,'Changing observer keeps the printed question protected.');
assert.equal(isHandoutOriginal(byId('P17'),{springK:750,supported:true}),true,'A spring setting does not expose the weight answer.');
assert.equal(isHandoutOriginal(byId('P17'),{mass:23}),false,'A changed mass is a different numerical question.');
assert.equal(isHandoutOriginal(byId('P18'),{mass:50,vi:2,time:5}),true,'Only the given push is needed for the steady-friction handout answer.');
assert.equal(isHandoutOriginal(byId('P13'),{distanceScale:1,timeScale:1}),true,'Neutral path scales preserve protection.');
assert.equal(isHandoutOriginal(byId('P13'),{positions:[0,10,20,40]}),false,'New table data permit a worked example.');
assert.equal(isHandoutOriginal(byId('P30'),{contactDuration:.02,radius1:.03}),true,'Drawing and contact details do not change the printed momenta.');
assert.equal(isHandoutOriginal(null),false);
console.log(`Verified 32 protected originals, 24 protected printed warm-ups, ${practices} worked practice versions, 18 extensions, animation-only edits, and unchanged grading.`);
