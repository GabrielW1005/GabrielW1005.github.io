import assert from 'node:assert/strict';
import {machineCatalog,taskCatalog,createChallenge} from '../challenges.js';
import {ratio,limits,equilibriumForce,makeState,readout,step,GRAVITY,MAX_FORCE} from '../physics.js';

const close=(a,b,note)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${note}: ${a} ≠ ${b}`);
let checked=0;
for(const machine of machineCatalog){
  for(let variant=0;variant<40;variant++){
    const masses=[];
    for(let level=0;level<machine.levels.length;level++){
      const expectedRatio=(machine.type==='ramp'?[2,4,6]:[1,2,4])[level];
      for(const task of taskCatalog){
        const p=createChallenge(machine.type,task.id,level,variant),c=p.config;
        assert.deepEqual(p,createChallenge(machine.type,task.id,level,variant),'deterministic generator');
        close(p.ma,expectedRatio,`${p.id} geometry progression`);
        close(p.ma,ratio(c),`${p.id} actual engine geometry`);
        assert.ok(Number.isFinite(p.answer)&&p.answer>0,`${p.id} positive finite target`);
        assert.ok(p.startFraction>0&&p.startFraction<1,`${p.id} internal initial state`);
        assert.ok(c.force>=0&&c.force<=MAX_FORCE,`${p.id} supported force range`);
        assert.ok(p.steps.length>=4&&p.given.length>=3,`${p.id} complete setup`);
        if(machine.type==='ramp')assert.ok(c.length>c.height,`${p.id} real inclined ramp`);
        const state=makeState(c,p.startFraction),r=readout(state,c);
        if(task.id==='force'){
          close(p.answer,equilibriumForce(c),`${p.id} balance threshold`);
          const balanced={...c,force:p.answer},s=makeState(balanced,p.startFraction);
          for(let t=0;t<20;t++)step(s,balanced,.05);
          close(s.q,s.q0,`${p.id} threshold does not start motion`);
          masses.push(c.outputMass);
        }else if(task.id==='balance'){
          close(p.answer*p.ma,c.outputMass,`${p.id} balanced mass`);
          assert.ok(Math.abs(c.inputMass-p.answer)>.001,`${p.id} intentionally unbalanced first attempt`);
          const balanced={...c,inputMass:p.answer},s=makeState(balanced,p.startFraction);
          for(let t=0;t<20;t++)step(s,balanced,.05);
          close(s.q,s.q0,`${p.id} correct weight stays balanced`);
        }else if(task.id==='distance'){
          close(p.answer,p.motionDistance*p.ma,`${p.id} work-distance ratio`);
          close(equilibriumForce(c),0,`${p.id} balanced demonstration`);
          const b=limits(c);
          assert.ok(p.motion.targetQ>b.min&&p.motion.targetQ<b.max,`${p.id} motion remains inside stroke`);
          const end=readout({...state,q:p.motion.targetQ},c);
          close(end.displacementIn,p.answer,`${p.id} input work distance`);
          close(end.displacementOut,p.motionDistance,`${p.id} output rise`);
          assert.ok(!p.given.some(s=>s.includes('Input travel:')),`${p.id} does not give unknown input distance`);
        }else{
          const measured=c.type==='ramp'?r.acceleration:r.outputAcceleration;
          close(measured,p.answer,`${p.id} actual engine acceleration`);
          assert.ok(c.force>c.outputMass*GRAVITY/p.ma,`${p.id} positive unbalanced drive`);
          assert.ok(p.steps.every(s=>!s.includes('F₁d₁ = F₂d₂')),`${p.id} no false equal-work acceleration premise`);
          if(c.type==='lever'){close(state.q,0,`${p.id} lever starts horizontal`);assert.equal(p.accelerationFrame,'vertical');}
          if(c.type==='ramp')assert.equal(p.accelerationFrame,'alongRamp');
        }
        checked++;
      }
    }
    assert.ok(masses.every(m=>m===masses[0]),`${machine.type}-${variant} fixed load across progression`);
  }
  const sequence=Array.from({length:30},(_,i)=>createChallenge(machine.type,'force',1,i+1).config.outputMass);
  assert.ok(new Set(sequence).size>=9,`${machine.type} diverse practice masses`);
  assert.ok(sequence.slice(3).some((m,i)=>m!==sequence[i]),`${machine.type} does not repeat with period three`);
}
assert.deepEqual(taskCatalog.map(x=>x.id),['force','balance','distance','acceleration']);
console.log(`Passed ${checked} challenge cases: ratios, balance, motion bounds, dynamic acceleration, determinism, and practice variety.`);
