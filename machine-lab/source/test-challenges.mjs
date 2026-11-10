import assert from 'node:assert/strict';
import {machineCatalog,taskCatalog,createChallenge} from '../challenges.js';
import {ratio,limits,equilibriumForce,makeState,readout,step,GRAVITY,MAX_FORCE,MAX_MASS} from '../physics.js';

const close=(a,b,note)=>assert.ok(Math.abs(a-b)<=1e-8*Math.max(1,Math.abs(a),Math.abs(b)),`${note}: ${a} ≠ ${b}`);
const onGrid=(n,step)=>Math.abs(n/step-Math.round(n/step))<1e-7;
const assertGrid=(n,step,note)=>assert.ok(onGrid(n,step),`${note}: ${n} is not on step ${step}`);
function finiteNumbers(value,path){
  if(typeof value==='number')assert.ok(Number.isFinite(value),`${path} must be finite`);
  else if(value&&typeof value==='object')for(const [key,item] of Object.entries(value))finiteNumbers(item,`${path}.${key}`);
}
const reversible=new Set(['lever','wheel','gears','hydraulic']);
const expectedRatio=(type,level,variant)=>{
  if(type==='pulley')return [1,2,4,6][level];
  const band=(type==='ramp'?[[2,2.5,3],[3.5,4,4.5],[5,6,8]]:reversible.has(type)?[[.5,.625,.75],[1],[2,2.5,3],[4,5,6]]:[[1,1.25,1.5],[2,2.5,3],[4,5,6]])[level];
  return band[(variant+(type==='ramp'&&level>0?1:0))%band.length];
};
const distinct=(list,key)=>new Set(list.map(c=>typeof key==='function'?key(c):c[key])).size;
let checked=0;
let tinyDistances=0;
for(const machine of machineCatalog.filter(m=>!m.balanceOnly&&m.type!=='ramp')){
  for(const variant of [...Array(40).keys(),97,128,999,65535]){
    const masses=[],advantages=[],liftingForces=[];
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
        assert.ok(c.inputMass>=0&&c.inputMass<=MAX_MASS,`${p.id} supported input mass range`);
        assert.ok(c.outputMass>0&&c.outputMass<=MAX_MASS,`${p.id} supported output mass range`);
        assertGrid(c.outputMass,.5,`${p.id} editable output mass grid`);
        assertGrid(c.inputMass,.5,`${p.id} editable input mass grid`);
        assertGrid(p.answer,p.answerStep,`${p.id} exact answer uses the advertised increment`);
        for(const field of machine.geometry){
          assert.ok(c[field.key]>=field.min-1e-9&&c[field.key]<=field.max+1e-9,`${p.id} ${field.key} is within its displayed control range`);
          if(machine.type==='screw'&&field.key==='handleRadius'){
            assertGrid(2*Math.PI*c.handleRadius,.01,`${p.id} screw radius derives from a clean circumference`);
          }else assertGrid(c[field.key]-field.min,field.step,`${p.id} ${field.key} follows its editable control grid`);
          if(field.values)assert.ok(field.values.includes(c[field.key]),`${p.id} uses a supported discrete geometry option`);
        }
        assert.equal(c.damping,0,`${p.id} ideal generated exercise`);
        assert.ok(!/\bMA\b|mechanical advantage/i.test(p.prompt),`${p.id} prompt requests only the primary value`);
        assert.ok(p.steps.length>=4&&p.given.length>=3,`${p.id} complete setup`);
        assert.ok(p.goalLabel&&p.setupLabel,`${p.id} clear goal and geometry`);
        assert.ok(p.steps.every(s=>!s.includes('The answer is')),`${p.id} hints do not state the answer`);
        if(machine.type==='ramp')assert.ok(c.length>c.height,`${p.id} real inclined ramp`);
        const state=makeState(c,p.startFraction),r=readout(state,c);
        finiteNumbers(p,p.id);
        finiteNumbers(r,`${p.id}.initialReadout`);
        assert.ok([...p.given,...p.steps,p.prompt].every(s=>!s.includes('NaN')&&!s.includes('Infinity')),`${p.id} view text has finite numbers`);
        if(task.id==='force'){
          assert.equal(p.mode,'minimum');
          assert.ok(p.prompt.includes('From rest')&&p.prompt.includes('whole-number'),`${p.id} well-defined minimum`);
          assert.equal(c.inputMass,0);
          assert.equal(c.force,0,`${p.id} starting force does not reveal the answer`);
          assert.equal(p.answerPrecision,0);
          assert.equal(p.answerStep,1);
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
          masses.push(c.outputMass);advantages.push(p.ma);liftingForces.push(p.answer);
        }else if(task.id==='balance'){
          assertGrid(p.answer,.5,`${p.id} exact balance answer is a whole or half kilogram`);
          assert.equal(p.answerStep,.5);
          close(p.answer*p.ma,c.outputMass,`${p.id} balanced mass`);
          assert.ok(p.answer<=MAX_MASS,`${p.id} balance target is achievable without clipping`);
          assert.equal(c.force,0);
          assert.ok(Math.abs(c.inputMass-p.answer)>.001,`${p.id} intentionally unbalanced first attempt`);
          const balanced={...c,inputMass:p.answer},s=makeState(balanced,p.startFraction);
          for(let t=0;t<20;t++)step(s,balanced,.05);
          close(s.q,s.q0,`${p.id} correct weight stays balanced`);
          assert.ok(p.steps.some(s=>s.includes('g cancels')),`${p.id} cancellation is explained`);
        }else if(task.id==='distance'){
          assert.ok([2,3].includes(p.answerPrecision),`${p.id} distance has at most three decimals`);
          assertGrid(p.answer,10**-p.answerPrecision,`${p.id} exact input distance precision`);
          assertGrid(p.motionDistance,10**-p.answerPrecision,`${p.id} supplied output distance precision`);
          close(p.answer,p.motionDistance*p.ma,`${p.id} work-distance ratio`);
          close(equilibriumForce(c),0,`${p.id} balanced demonstration`);
          const b=limits(c);
          if(p.answerPrecision===3){
            tinyDistances++;
            const available=c.type==='lever'?c.rOut*(Math.sin(b.max)-Math.sin(state.q)):(b.max-state.q)/p.ma;
            const cleanHundredths=Array.from({length:Math.floor(available*.75*100+1e-8)},(_,i)=>(i+1)/100)
              .filter(d=>onGrid(d*p.ma,.01)&&![1,2,3].some(n=>Math.abs(d*p.ma-n)<1e-8));
            assert.equal(cleanHundredths.length,0,`${p.id} a third decimal is used only when no two-decimal pair fits`);
          }
          assert.ok(p.motion.targetQ>b.min&&p.motion.targetQ<b.max,`${p.id} motion remains inside stroke`);
          close(p.motion.qtarget,p.motion.targetQ,`${p.id} target aliases agree`);
          const end=readout({...state,q:p.motion.targetQ},c);
          finiteNumbers(end,`${p.id}.targetReadout`);
          close(end.displacementIn,p.answer,`${p.id} input work distance`);
          close(end.displacementOut,p.motionDistance,`${p.id} output rise`);
          assert.ok(!p.given.some(s=>s.includes('Input travel:')),`${p.id} does not give unknown input distance`);
        }else{
          assertGrid(p.answer,.1,`${p.id} acceleration answer has at most one decimal`);
          assertGrid(c.force,.01,`${p.id} applied force has at most two decimals`);
          assert.equal(p.answerPrecision,1);
          assert.equal(p.answerStep,.1);
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
    assert.ok(liftingForces.every((force,i)=>!i||force<liftingForces[i-1]),`${machine.type}-${variant} less force with increasing advantage`);
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
        assert.ok(configs.every(c=>c.crankRadius===.1&&c.drumRadius===.1),'gears retain equal fixed drums');
        for(const c of configs)close(ratio(c),c.teethOut/c.teethIn,'gear ratio comes only from tooth counts');
        const equalAdvantage=configs.filter((c,i)=>i%3===1);
        assert.ok(distinct(equalAdvantage,c=>`${c.teethIn}/${c.teethOut}/${c.crankRadius}/${c.drumRadius}`)>=5,'same overall advantage has several gear geometries');
      }else if(machine.type==='pulley'){
        assert.ok(configs.every(c=>c.strands===[1,2,4,6][level]),'only renderable strand counts');
        assert.equal(distinct(configs,'pulleyTravel'),7,'pulley input stroke varies');
        assert.equal(distinct(configs,'pulleyRadius'),7,'pulley radius varies');
        assert.ok(configs.every(c=>c.pulleyRadius>=.12&&c.pulleyRadius<=.24),'pulley generated sizes are visible and within supported range');
        assert.equal(new Set(Array.from({length:7},(_,i)=>createChallenge('pulley',task.id,level,i+1).sublevelLabel)).size,7,'pulley practice names seven distinct sublevels');
        for(const c of configs)close(limits(c).max,c.pulleyTravel,'pulley stroke matches engine');
      }else if(machine.type==='hydraulic'){
        assert.ok(distinct(configs,'areaIn')>=7,'syringes vary actual input area');
        assert.ok(distinct(configs,'areaOut')>=7,'syringes vary actual output area');
        if(level===0)assert.ok(configs.every(c=>c.areaOut<c.areaIn),'smaller output area gives less force and more travel');
        if(level===1)assert.ok(configs.every(c=>c.areaOut===c.areaIn),'equal areas have equal travel and force');
        if(level>=2)assert.ok(configs.every(c=>c.areaOut>c.areaIn),'larger output area gives more force and less travel');
      }
      if(reversible.has(machine.type)){
        if(level===0)assert.ok(configs.every(c=>ratio(c)<1),'reversible machines include distance advantage');
        if(level===1){
          for(const c of configs)close(ratio(c),1,'equal-ratio level');
          assert.ok(new Set(signatures).size>=7,'same MA is shown at several absolute scales');
        }
        if(level>=2)assert.ok(configs.every(c=>ratio(c)>1),'reversible machines include force advantage');
      }
    }
  }
}
// Legacy task selections and direct generator callers may still request any
// task. Ramps must always return a mass balance problem; the normal ramp UI
// uses createBalanceChallenge for mass/diagonal-length variety.
for(const task of [...taskCatalog.map(t=>t.id),'inputMass','d1','a']){
 for(let level=0;level<3;level++)for(const variant of [...Array(30).keys(),65535]){
  const p=createChallenge('ramp',task,level,variant),c=p.config;
  assert.equal(p.task,'balance',`${p.id} normalizes obsolete ramp task`);
  assert.equal(p.unknown,'inputMass',`${p.id} asks only for a mass`);
  assert.equal(p.mode,'balance');assert.equal(p.unit,'kg');
  assertGrid(p.answer,.5,`${p.id} simple mass answer`);
  close(p.answer*ratio(c),c.outputMass,`${p.id} mass satisfies ramp balance`);
  assert.ok(c.length>c.height,`${p.id} real inclined ramp`);
  assert.ok(p.given.every(s=>!/base|horizontal|acceleration|Applied input force/i.test(s)),`${p.id} no unnecessary ramp dimensions or force task`);
  const balanced={...c,inputMass:p.answer},state=makeState(balanced,p.startFraction);
  for(let frame=0;frame<30;frame++)step(state,balanced,1/60);
  close(state.q,state.q0,`${p.id} correct mass remains at rest`);
  checked++;
 }
}
assert.deepEqual(taskCatalog.map(x=>x.id),['force','balance','distance','acceleration']);
assert.ok(tinyDistances>0,'tiny-stroke three-decimal fallback is exercised');
console.log(`Passed ${checked} single-answer challenge cases: exact clean-number answers, editable geometry grids, finite view data, lifting minima, mass/force caps, geometry variety, stroke bounds, initial acceleration, and optional damping. ${tinyDistances} tiny-stroke cases correctly require three-decimal distances.`);
