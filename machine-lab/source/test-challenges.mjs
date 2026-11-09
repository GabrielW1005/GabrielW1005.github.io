import assert from 'node:assert/strict';
import {machineCatalog,taskCatalog,createChallenge} from '../challenges.js';
import {ratio,limits,equilibriumForce,makeState,readout,step,GRAVITY,MAX_FORCE} from '../physics.js';

const close=(a,b,note)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${note}: ${a} ≠ ${b}`);
const expectedRatio=(type,level,variant)=>type==='pulley'?[1,2,4,6][level]:
  (type==='ramp'?[[2,2.5,3],[3.5,4,4.5],[5,6,8]]:[[1,1.25,1.5],[2,2.5,3],[4,5,6]])[level][(variant+(type==='ramp'&&level>0?1:0))%3];
const distinct=(list,key)=>new Set(list.map(c=>typeof key==='function'?key(c):c[key])).size;
let checked=0;
for(const machine of machineCatalog){
  for(let variant=0;variant<40;variant++){
    const masses=[],advantages=[];
    for(let level=0;level<machine.levels.length;level++){
      for(const task of taskCatalog){
        const p=createChallenge(machine.type,task.id,level,variant),c=p.config;
        assert.deepEqual(p,createChallenge(machine.type,task.id,level,variant),'deterministic generator');
        close(p.ma,expectedRatio(machine.type,level,variant),`${p.id} intended geometry without clipping`);
        close(p.ma,ratio(c),`${p.id} actual engine geometry`);
        assert.ok(Number.isFinite(p.answer)&&p.answer>0,`${p.id} positive finite target`);
        assert.ok(Math.abs(p.answer-1)>1e-8,`${p.id} nontrivial requested value`);
        assert.ok(p.startFraction>0&&p.startFraction<1,`${p.id} internal initial state`);
        assert.ok(c.force>=0&&c.force<=MAX_FORCE,`${p.id} supported force range`);
        assert.equal(c.damping,0,`${p.id} ideal generated exercise`);
        assert.ok(p.steps.length>=4&&p.given.length>=3,`${p.id} complete setup`);
        assert.ok(p.goalLabel&&p.setupLabel,`${p.id} clear goal and geometry`);
        assert.ok(p.steps.every(s=>!s.includes('The answer is')),`${p.id} hints do not state the answer`);
        if(machine.type==='ramp')assert.ok(c.length>c.height,`${p.id} real inclined ramp`);
        const state=makeState(c,p.startFraction),r=readout(state,c);
        if(task.id==='force'){
          assert.equal(p.mode,'minimum');
          assert.ok(p.prompt.includes('From rest')&&p.prompt.includes('whole-number'),`${p.id} well-defined minimum`);
          assert.equal(c.inputMass,0);
          close(p.balanceForce,equilibriumForce(c),`${p.id} balance threshold`);
          assert.equal(p.answer,Math.floor(p.balanceForce+1e-9)+1,`${p.id} smallest integer above threshold`);
          assert.ok(p.answer<=MAX_FORCE,`${p.id} answer below force cap`);
          const balanced={...c,force:p.balanceForce},s=makeState(balanced,p.startFraction);
          for(let t=0;t<20;t++)step(s,balanced,.05);
          close(s.q,s.q0,`${p.id} exact threshold does not start motion`);
          const lifting={...c,force:p.answer},liftState=makeState(lifting,p.startFraction);
          assert.ok(readout(liftState,lifting).acceleration>0,`${p.id} entered minimum lifts from rest`);
          step(liftState,lifting,.01);
          assert.ok(liftState.q>liftState.q0,`${p.id} correct entered force produces real movement`);
          const lower={...c,force:p.answer-1};
          assert.ok(readout(makeState(lower,p.startFraction),lower).acceleration<=1e-8,`${p.id} one fewer newton cannot lift from rest`);
          masses.push(c.outputMass);advantages.push(p.ma);
        }else if(task.id==='balance'){
          close(p.answer*p.ma,c.outputMass,`${p.id} balanced mass`);
          assert.equal(c.force,0);
          assert.ok(Math.abs(c.inputMass-p.answer)>.001,`${p.id} intentionally unbalanced first attempt`);
          const balanced={...c,inputMass:p.answer},s=makeState(balanced,p.startFraction);
          for(let t=0;t<20;t++)step(s,balanced,.05);
          close(s.q,s.q0,`${p.id} correct weight stays balanced`);
          assert.ok(p.steps.some(s=>s.includes('g cancels')),`${p.id} cancellation is explained`);
        }else if(task.id==='distance'){
          close(p.answer,p.motionDistance*p.ma,`${p.id} work-distance ratio`);
          close(equilibriumForce(c),0,`${p.id} balanced demonstration`);
          const b=limits(c);
          assert.ok(p.motion.targetQ>b.min&&p.motion.targetQ<b.max,`${p.id} motion remains inside stroke`);
          close(p.motion.qtarget,p.motion.targetQ,`${p.id} target aliases agree`);
          const end=readout({...state,q:p.motion.targetQ},c);
          close(end.displacementIn,p.answer,`${p.id} input work distance`);
          close(end.displacementOut,p.motionDistance,`${p.id} output rise`);
          assert.ok(!p.given.some(s=>s.includes('Input travel:')),`${p.id} does not give unknown input distance`);
        }else{
          const measured=c.type==='ramp'?r.acceleration:r.outputAcceleration;
          close(measured,p.answer,`${p.id} actual initial engine acceleration`);
          assert.equal(c.inputMass,0);
          assert.ok(c.force>p.balanceForce,`${p.id} positive unbalanced drive`);
          assert.ok(p.prompt.includes('rest')&&p.prompt.includes('initial'),`${p.id} initial acceleration specified`);
          assert.ok(p.steps.every(s=>!s.includes('F₁d₁ = F₂d₂')),`${p.id} no false equal-work acceleration premise`);
          const damped={...c,damping:4},dr=readout(makeState(damped,p.startFraction),damped);
          close(c.type==='ramp'?dr.acceleration:dr.outputAcceleration,p.answer,`${p.id} initial acceleration unaffected by optional viscous resistance`);
          if(c.type==='lever'){close(state.q,0,`${p.id} lever starts horizontal`);assert.equal(p.accelerationFrame,'vertical');}
          if(c.type==='ramp')assert.equal(p.accelerationFrame,'alongRamp');
        }
        checked++;
      }
    }
    assert.ok(masses.every(m=>m===masses[0]),`${machine.type}-${variant} fixed load across progression`);
    assert.ok(advantages.every((r,i)=>!i||r>advantages[i-1]),`${machine.type}-${variant} increasing advantage across levels`);
  }
  const sequence=Array.from({length:30},(_,i)=>createChallenge(machine.type,'force',1,i+1).config.outputMass);
  assert.ok(new Set(sequence).size>=9,`${machine.type} diverse practice masses`);
  assert.ok(sequence.slice(3).some((m,i)=>m!==sequence[i]),`${machine.type} does not repeat with period three`);
  for(let level=0;level<machine.levels.length;level++){
    for(const task of taskCatalog){
      const configs=Array.from({length:40},(_,variant)=>createChallenge(machine.type,task.id,level,variant).config);
      const signatures=configs.map(c=>JSON.stringify(machine.geometry.map(({key})=>c[key])));
      assert.ok(signatures.every((s,i)=>!i||s!==signatures[i-1]),`${machine.type}/${task.id}/${level} every next setup changes geometry`);
      assert.ok(new Set(signatures).size>=7,`${machine.type}/${task.id}/${level} substantial geometry diversity`);
      if(machine.type==='ramp'){
        assert.ok(distinct(configs,'height')>=5,'ramps vary height');
        assert.ok(distinct(configs,'length')>=10,'ramps vary length');
        assert.equal(distinct(configs,c=>(Math.asin(c.height/c.length)).toFixed(9)),3,'ramps vary slope angle within each level');
      }else if(machine.type==='gears'){
        assert.ok(distinct(configs,c=>`${c.teethIn}/${c.teethOut}`)>=10,'gears vary tooth counts');
        assert.ok(distinct(configs,c=>(c.crankRadius/c.drumRadius).toFixed(9))>=3,'gears vary independent drum ratio');
        assert.ok(configs.some(c=>c.crankRadius!==c.drumRadius),'gears include unequal drums');
        const equalAdvantage=configs.filter((c,i)=>i%3===1);
        assert.ok(distinct(equalAdvantage,c=>`${c.teethIn}/${c.teethOut}/${c.crankRadius}/${c.drumRadius}`)>=5,'same overall advantage has several gear geometries');
      }else if(machine.type==='pulley'){
        assert.ok(configs.every(c=>c.strands===[1,2,4,6][level]),'only renderable strand counts');
        assert.equal(distinct(configs,'pulleyTravel'),7,'pulley input stroke varies');
        assert.equal(distinct(configs,'pulleyRadius'),7,'pulley radius varies');
        for(const c of configs)close(limits(c).max,c.pulleyTravel,'pulley stroke matches engine');
      }
    }
  }
}
assert.deepEqual(taskCatalog.map(x=>x.id),['force','balance','distance','acceleration']);
console.log(`Passed ${checked} challenge cases: integer lifting minima, balance, geometry progression and variety, stroke bounds, dynamic acceleration, determinism, and optional damping.`);
