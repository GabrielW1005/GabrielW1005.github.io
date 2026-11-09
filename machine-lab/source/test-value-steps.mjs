import assert from 'node:assert/strict';
import {snapValue,answerRounding,displayValue,matchesRoundedAnswer} from '../value-steps.js';
import {defaultConfig,ratio,makeState,step,readout} from '../physics.js';
import {machineCatalog,createChallenge} from '../challenges.js';
let cases=0;
for(const [increment,min,max] of [[.5,0,200],[.05,.15,3],[.005,.015,.5],[.001,.003,.6],[.25,.25,20],[1,8,96],[.1,.287,4.974]]){
 let previous=-Infinity;
 for(let i=-30;i<=1030;i++){
  const value=min+(max-min)*i/1000,snapped=snapValue(value,increment,min,max);
  assert.ok(snapped>=min-1e-10&&snapped<=max+1e-10);
  assert.ok(Math.abs(snapped/increment-Math.round(snapped/increment))<1e-8);
  assert.ok(snapped>=previous);previous=snapped;cases++;
 }
}
assert.equal(snapValue(12.37,.5,0,200),12.5);
assert.equal(snapValue(.426,.05,.15,3),.45);
assert.equal(snapValue(.093,.005,.015,.5),.095);
assert.equal(answerRounding(20/3).text,'6.67');
assert.equal(displayValue(20/3),'≈ 6.67');
assert.equal(displayValue(12.5),'12.5');
assert.equal(answerRounding(.000048888,'distance').text,'0.0000489');
for(const [value,task] of [[20/3,'balance'],[-16/7,'acceleration'],[.014444,'distance'],[.000048888,'distance'],[0,'balance'],[21,'force']]){
 const rounded=answerRounding(value,task);
 assert.ok(matchesRoundedAnswer(value,value,task));
 assert.ok(matchesRoundedAnswer(rounded.value,value,task));
 if(value!==0)assert.ok(!matchesRoundedAnswer(0,value,task));
 assert.ok(!matchesRoundedAnswer(rounded.value+10**-rounded.places,value,task));
 cases++;
}
assert.ok(!matchesRoundedAnswer(20.99,21,'force'));
assert.ok(!matchesRoundedAnswer(NaN,21,'force'));
// The displayed rounded mass is accepted, then the exact mass is simulated.
for(const m of machineCatalog){
 let config=defaultConfig(m.type);config.force=0;config.damping=0;config.outputMass=20;
 const exact=config.outputMass/ratio(config),entered=answerRounding(exact).value;
 assert.ok(matchesRoundedAnswer(entered,exact));config.inputMass=exact;
 const state=makeState(config,.5),q0=state.q;
 for(let i=0;i<240;i++)step(state,config,1/120);
 assert.ok(readout(state,config).balanced,m.type);
 assert.ok(Math.abs(state.q-q0)<1e-9,m.type);cases++;
}
// All clean generated answers are accepted exactly as displayed, including tiny strokes.
for(const m of machineCatalog.filter(m=>!m.balanceOnly))for(let level=0;level<m.levels.length;level++)for(let variant=0;variant<24;variant++)for(const task of ['force','balance','distance','acceleration']){
 const c=createChallenge(m.type,task,level,variant),shown=answerRounding(c.answer,task);
 assert.ok(!shown.approximate,`${m.type}/${task}/${variant}: ${c.answer}`);
 assert.ok(matchesRoundedAnswer(shown.value,c.answer,task));cases++;
}
console.log(`Value-step and exact-balance checks passed (${cases} cases).`);
