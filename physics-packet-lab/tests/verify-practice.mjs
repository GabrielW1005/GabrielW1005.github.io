import assert from 'node:assert/strict';
import packet from '../data.js';
import {getQuestion,generatePractice,getPractice,listPracticeIds,unitFactor,displayValue,getAnswerUnit} from '../practice.js';
import {solve,evaluate,modelInfo} from '../physics.js';
const problems=packet.sections.flatMap(s=>s.problems),byId=Object.fromEntries(problems.map(p=>[p.id,p]));
const clone=o=>JSON.parse(JSON.stringify(o));
const close=(a,b,msg)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(b)),`${msg}: ${a} versus ${b}`);
const fmt=x=>Number(x.toFixed(Math.abs(x)>0&&Math.abs(x)<.1?4:3)).toLocaleString('en-US',{maximumFractionDigits:Math.abs(x)>0&&Math.abs(x)<.1?4:3});
const finiteTree=(x,path='value')=>{if(typeof x==='number')assert.ok(Number.isFinite(x),`${path} must be finite`);else if(x&&typeof x==='object')for(const [k,v]of Object.entries(x))finiteTree(v,`${path}.${k}`);};
const freeze=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(freeze);Object.freeze(o);}return o;};
const numericExpected=(id,p)=>{
 switch(id){
 case'P01':return Math.abs(p.turn-p.start)+Math.abs(p.end-p.turn);
 case'P02':return p.end-p.start;
 case'P05':return p.distance/p.time;
 case'P06':return p.speed*p.time;
 case'P09':return(p.vf-p.vi)/(p.endTime-p.startTime);
 case'P10':return p.vi+p.acceleration*p.time;
 case'P13':return p.positions.slice(1).reduce((s,x,i)=>s+Math.abs(x-p.positions[i]),0)*p.distanceScale/((p.times.at(-1)-p.times[0])*p.timeScale);
 case'P14':return(p.vf-p.vi)/p.time;
 case'P17':return p.mass*p.g;
 case'P18':return p.forwardForce;
 case'P21':case'P22':return p.upwardForce-p.weight;
 case'P25':return(p.upwardForce-p.mass*p.g)/p.mass;
 case'P26':return p.netForce/p.acceleration;
 case'P29':case'P30':return p.mass1*p.velocity1+p.mass2*p.velocity2;
 default:throw new Error(`Missing independent expected value: ${id}`);
 }
};
assert.equal(problems.length,32);
assert.equal(problems.filter(p=>p.type==='quantitative').length,16);
let variantsChecked=0;
for(const problem of problems){
 const before=JSON.stringify(problem),frozen=freeze(clone(problem));
 let previous=freeze(clone(problem.simulation.params));
 const visited=new Set();
 const physicalAnswers=new Set(),displayAnswers=new Set(),answerUnits=new Set();
 const ids=listPracticeIds(problem);assert.equal(ids.length,24);assert.equal(new Set(ids).size,24);
 for(const variantId of ids){
  const previousBefore=JSON.stringify(previous);
  const result=getPractice(frozen,variantId);
  assert.deepEqual(result,getPractice(frozen,variantId),'deterministic shared problem');
  assert.notEqual(result.variantId,previous._practiceVariant,`${problem.id}: must change practice variant`);
  assert.equal(JSON.stringify(previous),previousBefore,`${problem.id}: previous parameters mutated`);
  assert.ok(result.prompt.length>30&&result.prompt.length<650,`${problem.id}: readable complete prompt (${result.prompt.length} chars)`);
  assert.ok(result.hint.length>12,`${problem.id}: useful hint missing`);
  assert.deepEqual(getQuestion(frozen,result.params,{practice:true}).prompt,result.prompt);
  finiteTree(result.params,`${problem.id}.params`);
  if(result.params.time!==undefined)assert.ok(result.params.time>0);
  for(const key of ['mass','mass1','mass2','compareMass','g','radius','orbitAU'])if(result.params[key]!==undefined)assert.ok(result.params[key]>0,`${problem.id}.${key}`);
  if(result.params.times){
   for(let i=1;i<result.params.times.length;i++)assert.ok(result.params.times[i]>result.params.times[i-1]);
   assert.equal(result.params.times.length,result.params.positions.length);
   for(let i=1;i<result.params.positions.length;i++)assert.ok(result.params.positions[i]>=result.params.positions[i-1]);
  }
  if(problem.type==='quantitative'){
   const expected=numericExpected(problem.id,result.params),actual=solve(problem,result.params).value,target=getAnswerUnit(problem,result.params);
   close(actual,expected,`${result.variantId} independently calculated answer`);
   close(displayValue(actual,target.unit)*target.factor,expected,`${result.variantId} unit round trip`);
   assert.ok(result.prompt.includes(`Give your answer in ${target.unit}`));
   physicalAnswers.add(Number(expected.toPrecision(10)));displayAnswers.add(Number(displayValue(expected,target.unit).toPrecision(10)));answerUnits.add(target.unit);
  }
  if(['P13','P15'].includes(problem.id)){
   assert.ok(result.table,`${problem.id}: current onscreen table required`);
   assert.deepEqual(result.table.rows,result.params.times.map((t,i)=>[displayValue(t*result.params.timeScale,result.params._displayUnits.time),displayValue(result.params.positions[i]*result.params.distanceScale,result.params._displayUnits.distance)]));
  }
  if(problem.id==='P05')assert.ok(result.params.distance/result.params.time>=.6&&result.params.distance/result.params.time<=2,'realistic walking speed');
  if(problem.id==='P09')assert.ok(numericExpected('P09',result.params)>0&&numericExpected('P09',result.params)<=2.5,'realistic bus acceleration');
  if(problem.id==='P10')assert.ok(numericExpected('P10',result.params)<=8,'realistic running speed');
  if(problem.id==='P23'){
   close(result.params.upwardForce,result.params.weight,'balanced practice airplane lift');
   close(result.params.forwardForce,result.params.backwardForce,'balanced practice airplane thrust');
   assert.equal(result.params.vy,0);
  }
  if(problem.id==='P27'){
   close(result.params.upwardForce,result.params.mass*result.params.g,'first plane level lift');
   close(result.params.compareLift,result.params.compareMass*result.params.g,'second plane level lift');
   assert.match(result.prompt,/forward acceleration/,'custom vertical forces must not be confused with forward acceleration');
  }
  if(['P29','P30'].includes(problem.id)){
   assert.equal(problem.numericAnswer.quantity,'totalMomentum');
   assert.match(result.prompt,/total.*momentum/,'momentum question must ask system total');
   assert.doesNotMatch(result.prompt,/shared velocity|final velocity/);
  }
  const info=modelInfo(problem,result.params);finiteTree(info.duration);
  for(const f of [0,.25,.5,.75,1])finiteTree(evaluate(problem,result.params,info.duration*f),`${result.variantId}@${f}`);
  if(problem.simulation.kind==='momentum'){
   const total=result.params.mass1*result.params.velocity1+result.params.mass2*result.params.velocity2;
   close(evaluate(problem,result.params,info.duration).totalMomentum,total,`${result.variantId}: conserved total momentum`);
  }
  visited.add(result.variantId);previous=freeze(result.params);variantsChecked++;
 }
 assert.equal(visited.size,24,`${problem.id}: 24 distinct variants reachable`);
 if(problem.type==='quantitative'){assert.ok(physicalAnswers.size>=18,`${problem.id}: only ${physicalAnswers.size} distinct physical answers`);assert.ok(displayAnswers.size>=18,`${problem.id}: only ${displayAnswers.size} distinct displayed answers`);if(!['P17','P29'].includes(problem.id))assert.ok(answerUnits.size>=2,`${problem.id}: answer-unit variety`);}
 assert.equal(JSON.stringify(problem),before,`${problem.id}: printed problem mutated`);
}
// Current-value regressions: change values after selecting a question. The text must
// follow the edited givens rather than retain the packet's or variant's numbers.
const customCases=[
 ['P01',{start:0,turn:17,end:6},['17 m','11 m']],
 ['P02',{start:-8,end:13},['-8 m','+13 m']],
 ['P03',{radius:26,speed:2.4,laps:2},['26 m','2.4 m/s','2 laps']],
 ['P04',{speed:13.4},['13.4 m/s']],
 ['P05',{distance:196,time:140},['196 m','140 s']],
 ['P06',{speed:3.2,time:35},['3.2 m/s','35 s']],
 ['P07',{speed:2.2,otherSpeed:-3.1},['2.2 m/s east','3.1 m/s west']],
 ['P08',{distanceScale:1.5,timeScale:2},['1.5 m/s','20 s']],
 ['P09',{vi:6,vf:11,startTime:2,endTime:7,time:5},['6 m/s','11 m/s','2 s','7 s']],
 ['P10',{vi:1.7,acceleration:.4,time:6},['1.7 m/s','+0.4 m/s²','6 s']],
 ['P11',{vi:-.8,vf:-2.4,time:4},['-0.8 m/s','-2.4 m/s','4 s']],
 ['P12',{orbitAU:1.3},['1.3 times']],
 ['P14',{vi:3,vf:9,time:7},['3 m/s','9 m/s','7 s']],
 ['P16',{speed:2.4,otherSpeed:-3.6,time:7},['2.4 m/s east','3.6 m/s west','7 s']],
 ['P17',{mass:16,g:4.2},['16 kg','4.2 m/s²','this location']],
 ['P18',{forwardForce:29},['29 N']],
 ['P19',{mass:170,g:12,compareG:10},['170 kg','12 m/s²','10 m/s²']],
 ['P20',{forwardForce:27,staticLimit:21,kineticFriction:16},['27 N','21 N','16 N']],
 ['P21',{upwardForce:14300,weight:11300},['14,300 N','11,300 N']],
 ['P22',{upwardForce:10700,weight:10400},['10,700 N','10,400 N']],
 ['P23',{vi:52,vy:-2,upwardForce:11700,weight:12300,forwardForce:3300,backwardForce:2900},['52 m/s','2 m/s down','11,700 N','12,300 N','3,300 N','2,900 N']],
 ['P24',{vi:2.6},['2.6 m/s right']],
 ['P25',{mass:.7,g:10,upwardForce:8.4},['0.7 kg','8.4 N','7 N']],
 ['P26',{netForce:2.4,acceleration:1.2},['2.4 N','1.2 m/s²']],
 ['P27',{mass:.7,compareMass:1.4,netForce:1.4},['0.7 kg','1.4 kg','1.4 N','forward acceleration']],
 ['P28',{radius:14,speed:3.5},['14 m','3.5 m/s']],
 ['P29',{mass1:5.5,mass2:1.6,velocity1:4.2},['5.5 kg','1.6 kg','4.2 m/s','total momentum']],
 ['P30',{mass1:.15,mass2:.25,velocity1:1.4},['0.15 kg','0.25 kg','1.4 m/s','total system momentum']],
 ['P31',{mass1:.015,mass2:.025,velocity1:.7},['0.015 kg','0.025 kg','0.7 m/s']],
 ['P32',{mass1:19,mass2:18,velocity1:.9},['19 kg','18 kg','0.9 m/s','total system momentum']]
];
for(const [id,edits,fragments]of customCases){
 const current={...clone(byId[id].simulation.params),...edits},view=getQuestion(byId[id],current);
 for(const text of fragments)assert.ok(view.prompt.includes(text),`${id}: current prompt missing ${JSON.stringify(text)}: ${view.prompt}`);
}
for(const id of ['P13','P15']){
 const p={...clone(byId[id].simulation.params),distanceScale:1.5,timeScale:2};
 const view=getQuestion(byId[id],p);
 assert.deepEqual(view.table.rows,p.times.map((t,i)=>[t*2,p.positions[i]*1.5]));
 assert.ok(view.givens.every(s=>typeof s==='string'));
}
// Repeated button presses do not repeat the immediate previous variant, even with
// the same random draw, and always return fresh objects.
for(const problem of problems){let last=clone(problem.simulation.params);const seen=new Set();for(let i=0;i<24;i++){const next=generatePractice(problem,last,()=>0);assert.notEqual(next.params,last);assert.notEqual(next.variantId,last._practiceVariant);last=next.params;seen.add(next.variantId);}assert.equal(seen.size,24,'fixed random draw must traverse the whole bank');}
assert.equal(unitFactor('km/h'),1/3.6);close(displayValue(2500,'km'),2.5,'distance conversion');close(displayValue(1.2,'g'),1200,'mass conversion');close(displayValue(180,'min'),3,'time conversion');close(displayValue(4800,'kN'),4.8,'force conversion');assert.throws(()=>unitFactor('bogus'));
const unitTypes=new Set(problems.flatMap(p=>listPracticeIds(p).flatMap(id=>Object.values(getPractice(p,id).params._displayUnits))));
for(const unit of ['m','cm','km','s','min','h','m/s','km/h','cm/s','kg','g','N','kN','m/s²','cm/s²','kg·m/s','g·m/s'])assert.ok(unitTypes.has(unit),`unit ${unit} is represented`);
assert.throws(()=>getPractice(byId.P05,'P06-v2-01'),'cross-problem variant rejected');
assert.throws(()=>getPractice(byId.P05,'P05-v2-99'),'out-of-range variant rejected');
console.log(`Practice checks passed: ${variantsChecked} reviewed variants across 32 problems; 32 current-value regressions; no mutation; all 16 numeric types independently verified.`);

// Independently solve what a student actually reads, including the displayed
// unit conversion. This catches rounding before conversion and stale SI labels.
const literalFactors={'m':1,'cm':.01,'km':1000,'s':1,'min':60,'h':3600,'m/s':1,'km/h':1000/3600,'cm/s':.01,'m/s²':1,'cm/s²':.01,'kg':1,'g':.001,'N':1,'kN':1000};
function numbersFromPrompt(text){return [...text.matchAll(/([+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)) (cm\/s²|m\/s²|cm\/s|km\/h|m\/s|min|kg|kN|cm|km|N|g|m|s|h)(?![A-Za-z/²])/g)].map(m=>Number(m[1].replaceAll(',',''))*literalFactors[m[2]]);}
for(const problem of problems.filter(p=>p.numericAnswer))for(const id of listPracticeIds(problem)){
 const view=getPractice(problem,id),n=numbersFromPrompt(view.prompt);let answer;
 switch(problem.id){
 case'P01':answer=n[0]+n[1];break;
 case'P02':answer=n[1]-n[0];break;
 case'P05':answer=n[0]/n[1];break;
 case'P06':answer=n[0]*n[1];break;
 case'P09':answer=(n[2]-n[0])/(n[3]-n[1]);break;
 case'P10':answer=n[0]+n[1]*n[2];break;
 case'P13':{const tUnit=view.table.headers[0].match(/\((.*)\)/)[1],dUnit=view.table.headers[1].match(/\((.*)\)/)[1];answer=(view.table.rows.at(-1)[1]-view.table.rows[0][1])*literalFactors[dUnit]/((view.table.rows.at(-1)[0]-view.table.rows[0][0])*literalFactors[tUnit]);break;}
 case'P14':answer=(n[2]-n[0])/(n[3]-n[1]);break;
 case'P17':answer=n[0]*n[1];break;
 case'P18':answer=n[0];break;
 case'P21':case'P22':answer=n[0]-n[1];break;
 case'P25':answer=(n[1]-n[2])/n[0];break;
 case'P26':answer=n[0]/n[1];break;
 case'P29':case'P30':answer=n[0]*n[1];break;
 }
 close(answer,solve(problem,view.params).value,`${id}: answer from literal question measurements matches simulated physics`);
}
const tinyMassView=getPractice(byId.P27,'P27-v2-04');assert.ok(tinyMassView.prompt.includes('0.4425 kg'),'model mass must not round from 0.4425 kg to 0.443 kg');
console.log('Literal question audit passed: all 384 quantitative prompts solve to their exact physical answer after displayed-unit conversion.');
