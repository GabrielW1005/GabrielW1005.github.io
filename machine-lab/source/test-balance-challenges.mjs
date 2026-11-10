import assert from 'node:assert/strict';
import {machineCatalog} from '../challenges.js';
import {createBalanceChallenge,balanceValue,applyBalanceValue,horizontalRun} from '../balance-challenges.js';
import {ratio,makeState,readout,step,normalizeConfig} from '../physics.js';
const close=(a,b,note)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${note}: ${a} != ${b}`);
const onGrid=(n,step)=>Math.abs(n/step-Math.round(n/step))<1e-7;
let cases=0;
for(const machine of machineCatalog){
 const keys=new Set(),geometry=new Set(),strands=new Set(),pulleyGoals=new Set(),massTargets=new Set();
 for(const n of [...Array(120).keys(),997,65535]){
  const p=createBalanceChallenge(machine.type,n),c=p.config;
  assert.deepEqual(p,createBalanceChallenge(machine.type,n),'repeatable setup');
  assert.equal(p.type,machine.type);assert.equal(c.type,machine.type);
  assert.ok(['mass','geometry'].includes(p.kind));
  assert.ok(p.answer>=p.min-1e-9&&p.answer<=p.max+1e-9,`${p.id} feasible answer`);
  assert.ok(onGrid(p.answer-p.min,p.step),`${p.id} answer matches editable grid`);
  assert.ok(Number.isFinite(balanceValue(c,p.key)),`${p.id} finite current value`);
  assert.ok(Math.abs(balanceValue(c,p.key)-p.answer)>p.step*.5,`${p.id} answer is not initially filled in`);
  assert.ok(p.prompt.toLowerCase().includes(p.label.toLowerCase()),`${p.id} asks for editable field`);
  assert.ok(p.given.length>=2,`${p.id} fixed givens`);
  assert.equal(c.force,0);assert.equal(c.damping,0);
  for(const mass of [c.inputMass,c.outputMass])assert.ok(mass>=.5&&mass<=200&&onGrid(mass,.5),`${p.id} legal half-kg mass`);
  assert.ok(p.hints.every(s=>!s.includes('The answer is')&&!s.includes('Correct value')),`${p.id} no solution in hints`);
  const fixed=applyBalanceValue(c,p.key,p.answer),actual=balanceValue(fixed,p.key);
  close(actual,p.answer,`${p.id} exact target survives normalization`);
  close(fixed.inputMass*ratio(fixed),fixed.outputMass,`${p.id} masses satisfy geometry balance`);
  const initial=makeState(c,p.startFraction),before=readout(initial,c),state=makeState(fixed,p.startFraction),after=readout(state,fixed);
  assert.ok(!before.balanced,`${p.id} initial machine is not already balanced`);
  assert.ok(after.balanced,`${p.id} target balances real engine`);
  for(let frame=0;frame<60;frame++)step(state,fixed,1/60);
  close(state.q,state.q0,`${p.id} correct value remains at rest`);
  for(const value of Object.values(after))if(typeof value==='number')assert.ok(Number.isFinite(value),`${p.id} finite readout`);
  const changed=Object.keys(c).filter(k=>Math.abs((fixed[k]??0)-(c[k]??0))>1e-9);
  const allowed=machine.type==='ramp'?new Set([p.key==='rampRun'?'length':p.key,'length']):new Set([p.key]);
  assert.ok(changed.every(k=>allowed.has(k)),`${p.id} only requested value and derived ramp length change`);
  if(machine.type==='ramp'){
   assert.ok(c.length>c.height&&fixed.length>fixed.height&&fixed.length<=5+1e-9,`${p.id} real legal ramp`);
   assert.ok(['inputMass','outputMass','length'].includes(p.key),`${p.id} only mass or diagonal ramp length is requested`);
   assert.ok(!p.given.some(s=>/horizontal|base/i.test(s)),`${p.id} no unnecessary base dimension`);
   assert.ok(p.given.some(s=>s.startsWith('Height:')),`${p.id} height is always supplied`);
   assert.equal(p.given.some(s=>s.startsWith('Ramp length (diagonal):')),p.key!=='length',`${p.id} known diagonal length is supplied and unknown length is omitted`);
   if(p.key==='length')close(c.height,fixed.height,`${p.id} solving diagonal length preserves given height`);
   if(p.key==='height')close(horizontalRun(c),horizontalRun(fixed),`${p.id} height edit preserves base`);
   if(p.key==='rampRun')close(c.height,fixed.height,`${p.id} base edit preserves height`);
  }
  if(machine.type==='gears')assert.ok(c.crankRadius===.1&&c.drumRadius===.1,`${p.id} constant equal drums`);
  if(machine.type==='gearArms'){
   close(c.rIn,c.rOut,`${p.id} equal fixed arms`);close(initial.q,0,`${p.id} starts horizontally`);
   assert.ok(!['rIn','rOut'].includes(p.key),`${p.id} gear arm task focuses on tooth ratio`);
  }
  if(machine.type==='pulley'){assert.equal(p.kind,'mass');strands.add(c.strands);pulleyGoals.add(`${c.strands}/${p.key}`);}
  keys.add(p.key);geometry.add(JSON.stringify(machine.geometry.map(f=>c[f.key])));
  if(p.kind==='mass')massTargets.add(p.answer);
  cases++;
 }
 assert.ok(keys.has('inputMass')&&keys.has('outputMass'),`${machine.type} varies input/output unknown`);
 assert.ok(geometry.size>=6,`${machine.type} varies machine setups via Next`);
 assert.ok(massTargets.size>=8,`${machine.type} varied clean masses`);
 if(machine.type==='pulley'){assert.deepEqual([...strands].sort((a,b)=>a-b),[1,2,4,6]);assert.equal(pulleyGoals.size,8,'each pulley system varies both mass unknowns');}
 else if(machine.type==='ramp')assert.deepEqual([...keys].sort(),['inputMass','length','outputMass'],'ramps cycle both masses and diagonal length');
 else assert.ok(keys.size>=3,`${machine.type} includes geometry balance problems`);
}
// Independent base/height editing regression, including repeated reversals.
let ramp=normalizeConfig({type:'ramp',height:.6,length:1});
ramp=applyBalanceValue(ramp,'rampRun',2.4);close(horizontalRun(ramp),2.4,'extend base');
ramp=applyBalanceValue(ramp,'height',1.8);close(horizontalRun(ramp),2.4,'raise height preserves extended base');close(ramp.length,3,'3-4-5 triangle remains exact');
ramp=applyBalanceValue(ramp,'height',.6);close(horizontalRun(ramp),2.4,'lower height preserves extended base');
console.log(`Balance challenge checks passed (${cases} cases): one adjustable quantity, exact grid targets, no initial solutions, real engine equilibrium, setup variety, fixed drums, and independent ramp dimensions.`);
