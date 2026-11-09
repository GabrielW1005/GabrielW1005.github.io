// From the app root, run: node source/test-physics.mjs
// Or pass the absolute path to this file from any working directory.
// Dependency-free physics regression checks. Node's assert is the only test dependency.
import assert from 'node:assert/strict';
import {defaultConfig,normalizeConfig,ratio,equilibriumForce,balancedInputMass,makeState,step,readout,limits,changeConfig,bodyJacobian,initialOutputAcceleration,MAX_FORCE,MAX_MASS} from '../physics.js';

{
const types=['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic'];
let checks=0;
const close=(actual,expected,tol=1e-7)=>{assert(Math.abs(actual-expected)<=tol,`${actual} != ${expected}`);checks++;};
for(const type of types){
 const c=defaultConfig(type);c.force=0;c.inputMass=balancedInputMass(c);
 const s=makeState(c,.5),q0=s.q;
 for(let i=0;i<240;i++)step(s,c,1/240);
 close(s.q,q0);close(s.v,0);assert(readout(s,c).balanced);checks++;
 for(const sign of [-1,1]){
  const forceConfig={...c,inputMass:0};forceConfig.force=Math.max(0,equilibriumForce(forceConfig)*(1+sign*.15));
  const st=makeState(forceConfig,.5),q=st.q;
  for(let i=0;i<10;i++)step(st,forceConfig,1/240);
  assert((st.q-q)*sign>0,type+' must move with force imbalance');checks++;
  const ro=readout(st,forceConfig);close(ro.energyResidual,0,type==='lever'?2e-5:1e-8);
 }
 const energetic={...c,inputMass:0,force:MAX_FORCE};
 const st=makeState(energetic,.5);for(let i=0;i<500;i++)step(st,energetic,1/60);
 const ro=readout(st,energetic),lim=limits(energetic);
 assert(st.q>=lim.min&&st.q<=lim.max&&Number.isFinite(st.v));checks++;
 assert(ro.stopEnergyLoss>=0&&ro.atLimit);checks++;
 close(ro.energyResidual,0,type==='lever'?.02:1e-6);
}
const ramp=defaultConfig('ramp');ramp.force=0;ramp.inputMass=0;const rstate=makeState(ramp,.5);step(rstate,ramp,.001);close(rstate.v,-10*(ramp.height/ramp.length)*.001);
const gear=defaultConfig('gears');close(ratio(gear),4);gear.crankRadius=.2;close(ratio(gear),4);close(normalizeConfig(gear).crankRadius,.1);close(normalizeConfig(gear).drumRadius,.1);
const hydraulic=defaultConfig('hydraulic');close(ratio(hydraulic),5);close(equilibriumForce(hydraulic),0);
const screw=defaultConfig('screw');screw.lead=2*Math.PI*screw.handleRadius;close(ratio(screw),1);
const lever=defaultConfig('lever'),s=makeState(lever,.4);step(s,{...lever,force:100},.02);const altered={...lever,rIn:2};changeConfig(s,lever,altered);close(s.v,0);close(s.workIn,0);assert(s.q>=limits(altered).min);checks++;
const fstate=makeState(ramp,.5);step(fstate,{...ramp,force:50},.01);step(fstate,{...ramp,force:100},.01);close(readout(fstate,{...ramp,force:100}).energyResidual,0,1e-9);
const bounded=normalizeConfig({...ramp,inputMass:1e50,outputMass:-5,force:1e50,length:-1,height:1e50});close(bounded.inputMass,MAX_MASS);close(bounded.outputMass,1);close(bounded.force,MAX_FORCE);assert(bounded.height<=bounded.length);checks++;
console.log(`${checks} meaningful dynamics, bounds, balance, and energy checks passed.`);
}

{
let checks=0;
const types=['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic'];
const near=(a,b,t=1e-8)=>{assert(Math.abs(a-b)<=t,`${a} ≠ ${b} (tolerance ${t})`);checks++;};
const ok=(condition,message)=>{assert(condition,message);checks++;};
const effectiveMass=c=>c.type==='lever'?c.inputMass*c.rIn*c.rIn+c.outputMass*c.rOut*c.rOut:c.type==='ramp'?c.inputMass+c.outputMass:c.inputMass+c.outputMass/ratio(c)**2;
for(const type of types){
 const c={...defaultConfig(type),inputMass:0};c.force=equilibriumForce(c);
 const J=bodyJacobian(c);
 near(J.input,type==='lever'?c.rIn:1);
 near(J.output,type==='lever'?c.rOut:type==='ramp'?1:1/ratio(c));
 for(const sign of [-1,1]){
  const s=makeState(c,.5),q0=s.q,ext={input:sign*c.force*.1,output:sign};
  for(let i=0;i<8;i++)step(s,c,1/480,ext);
  const r=readout(s,c,ext);
  ok(sign*(s.q-q0)>0,`${type}: signed pointer force must move in its sign`);
  near(r.pathDisplacementIn,J.input*(s.q-s.q0));
  near(r.pathDisplacementOut,J.output*(s.q-s.q0));
  near(r.pathDistanceIn,Math.abs(r.pathDisplacementIn));
  near(r.pathDistanceOut,Math.abs(r.pathDisplacementOut));
  near(r.pointerWork,ext.input*r.pathDisplacementIn+ext.output*r.pathDisplacementOut,1e-8);
  near(r.energyResidual,0,type==='lever'?1e-6:1e-8);
  near(r.inputPathSpeed,J.input*s.v);near(r.outputPathSpeed,J.output*s.v);
  near(r.outputPathAcceleration,J.output*r.acceleration);
 }
 // A spring and damper at the OUTPUT body, updated through actual path units.
 // Both signs occur; damping work is included in pointerWork, never hidden.
 const spring={...c,inputMass:balancedInputMass({...c,force:0}),force:0};
 const s=makeState(spring,.5),bound=limits(spring),center=s.q;
 const jp=bodyJacobian(spring).output,Mout=effectiveMass(spring)/(jp*jp),k=250,b=1.1*Math.sqrt(k*Mout);
 let positive=false,negative=false;
 for(let i=0;i<900;i++){
  const target=center+.18*bound.range*Math.sin(i/150);
  const raw=k*jp*(target-s.q)-b*jp*s.v;
  const ext={input:0,output:raw};positive ||= raw>.01;negative ||= raw<-.01;
  step(s,spring,1/500,ext);
  const r=readout(s,spring,ext);
  ok(Number.isFinite(r.energyResidual),`${type}: finite spring energy`);
  ok(s.q>=bound.min-1e-12&&s.q<=bound.max+1e-12,`${type}: spring remains bounded`);
  if(type!=='lever')ok(r.inputTension>=-1e-7,`${type}: nonnegative rope tension`);
 }
 const r=readout(s,spring);
 ok(positive&&negative,`${type}: spring tests both signed directions`);
 ok(r.pathDistanceOut>=Math.abs(r.pathDisplacementOut)-1e-9,`${type}: total path distance includes reversal`);
 near(r.energyResidual,0,type==='lever'?2e-5:2e-8);
 // Large requested forces are capped and no rope is asked to push.
 const ext={input:-1e6,output:1e6},cap=readout(makeState(spring,.5),spring,ext);
 ok(cap.forceLimited,`${type}: reports force cap`);
 ok(Math.abs(cap.externalInputForce)<=MAX_FORCE&&Math.abs(cap.externalOutputForce)<=MAX_FORCE,`${type}: actual caps`);
 if(type!=='lever')ok(cap.inputTension>=-1e-7,`${type}: unilateral cap`);
}
// A complete out-and-back reversal WITHIN ONE integration substep must count
// distance even though its final position equals its starting position.
const ramp={...defaultConfig('ramp'),inputMass:0};ramp.force=equilibriumForce(ramp);
const reversal=makeState(ramp,.5);reversal.v=.013;reversal.v0=.013;reversal.initialKineticEnergy=.5*ramp.outputMass*.013**2;
step(reversal,ramp,.0026,{output:-180});
const rr=readout(reversal,ramp,{output:-180});
near(rr.pathDisplacementOut,0,1e-12);near(rr.pathDistanceOut,.0000169,1e-10);near(rr.energyResidual,0,1e-10);
// A high-speed path that would hit a stop and turn back within the same step
// still collides; endpoint-only clamping would miss it.
const collision=makeState(ramp,.999999);collision.v=.02;collision.v0=.02;collision.initialKineticEnergy=.5*ramp.outputMass*.02**2;
step(collision,ramp,.004,{output:-180});
ok(collision.impactCount===1,'mid-substep stop detected');ok(collision.stopEnergyLoss>0,'impact kinetic energy absorbed');
near(readout(collision,ramp).energyResidual,0,1e-9);
// Ramp path distance and acceleration differ from vertical work displacement.
const slope=makeState(ramp,.5);step(slope,ramp,.01,{output:18});const sr=readout(slope,ramp,{output:18});
near(sr.outputPathAcceleration,1);near(sr.outputAcceleration,.25);near(sr.pathDisplacementOut,sr.displacementOut*4);
// Horizontal lever: the helper returns tangential acceleration at initial rest.
const lever={...defaultConfig('lever'),inputMass:0,force:70};
near(initialOutputAcceleration(lever),70*4/20-10);
near(initialOutputAcceleration(ramp),0);
near(initialOutputAcceleration({...ramp,force:81}),2);
// No external-force work is added while a stop blocks the requested motion.
const held=makeState(ramp,1),ext={output:100};step(held,ramp,.1,ext);const hr=readout(held,ramp,ext);
near(hr.pointerWork,0);near(hr.pathDistanceOut,0);near(hr.outputPathAcceleration,0);ok(hr.atLimit,'blocked at stop');
// Geometry or mass edits clear pointer energy and path history safely.
changeConfig(slope,ramp,{...ramp,outputMass:24});near(slope.pointerWork,0);near(slope.pathDistanceOut,0);near(slope.v,0);
console.log(`${checks} pointer dynamics, spring, reversal, path, acceleration, unilateral and energy checks passed.`);
}

// The active grip used by the UI, sampled at 60 Hz. Render cadence is separate.
// Tests here deliberately use exact constrained body position, not a stale SVG.
{
const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
const types=['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic'];
const physicalMass=c=>c.type==='lever'?c.inputMass*c.rIn**2+c.outputMass*c.rOut**2:c.type==='ramp'?c.inputMass+c.outputMass:c.inputMass+c.outputMass/ratio(c)**2;
const scenarios=[];
for(const type of types)scenarios.push({name:`${type}: default`,config:{...defaultConfig(type),inputMass:0,force:0},tracking:true});
const edgeCases=[
 ['screw: high MA, light load',{type:'screw',handleRadius:.15,lead:.003,inputMass:0,outputMass:1},true],
 ['screw: high MA, extreme masses',{type:'screw',handleRadius:.15,lead:.003,inputMass:200,outputMass:200},false],
 ['screw: coarse lead',{type:'screw',handleRadius:.015,lead:.6,inputMass:0,outputMass:1},true],
 ['wedge: high MA, light load',{type:'wedge',length:.75,height:.01,inputMass:0,outputMass:1},true],
 ['wedge: high MA, extreme masses',{type:'wedge',length:.75,height:.01,inputMass:200,outputMass:200},false],
 ['wedge: unit ratio',{type:'wedge',length:.06,height:.06,inputMass:0,outputMass:1},true],
 ['lever: long input arm',{type:'lever',rIn:3,rOut:.15,inputMass:0,outputMass:1},true],
 ['lever: short input arm, heavy load',{type:'lever',rIn:.15,rOut:3,inputMass:200,outputMass:200},false],
 ['ramp: long shallow heavy load',{type:'ramp',length:5,height:.1,inputMass:0,outputMass:200},true],
 ['ramp: steep heavy load',{type:'ramp',length:.3,height:.3,inputMass:200,outputMass:200},false],
 ['wheel: high ratio',{type:'wheel',rIn:.5,rOut:.015,inputMass:0,outputMass:1},true],
 ['wheel: low ratio, heavy load',{type:'wheel',rIn:.015,rOut:.5,inputMass:200,outputMass:200},false],
 ['gears: high ratio',{type:'gears',teethIn:8,teethOut:96,crankRadius:.3,drumRadius:.03,inputMass:0,outputMass:1},true],
 ['gears: low ratio, heavy load',{type:'gears',teethIn:96,teethOut:8,crankRadius:.03,drumRadius:.3,inputMass:200,outputMass:200},false],
 ['hydraulic: high area ratio',{type:'hydraulic',areaIn:.25,areaOut:20,inputMass:0,outputMass:1},true],
 ['hydraulic: low ratio, heavy load',{type:'hydraulic',areaIn:10,areaOut:.25,inputMass:200,outputMass:200},false],
 ['pulley: six strands, heavy load',{type:'pulley',strands:6,inputMass:0,outputMass:60},true],
 ['pulley: one strand, opposing masses',{type:'pulley',strands:1,inputMass:200,outputMass:200},true]
];
for(const [name,settings,tracking] of edgeCases)scenarios.push({name,config:normalizeConfig({...defaultConfig(settings.type),...settings,force:0}),tracking});
let samples=0,runs=0,maxNormalizedEnergyError=0,maxTrackingError=0,maxForce=0,maxKinetic=0;
for(const scenario of scenarios)for(const side of ['input','output'])for(const timeScale of [.25,.5,1]){
 const c=scenario.config,b=limits(c),J=bodyJacobian(c)[side],M=physicalMass(c)/(J*J);
 const k=Math.min(800,25*M),damping=1.6*Math.sqrt(k*M);
 const s=makeState(c,.5),start=s.q,targetFinal=start+.1*b.range;
 let lastCursorQ=start,trackingErrors=[],anyLimited=false;
 // Move a handle over two wall seconds, then hold it. At 0.25x this leaves
 // six physical seconds to settle. Caps/taut constraints can prevent tracking;
 // those configurations must remain stable, not magically follow the cursor.
 for(let frame=0;frame<26*60;frame++){
  const wallTime=(frame+1)/60,u=Math.min(1,wallTime/2);
  const smooth=.5-.5*Math.cos(Math.PI*u),cursorQ=start+.1*b.range*smooth;
  const cursorRate=(cursorQ-lastCursorQ)*60/timeScale;lastCursorQ=cursorQ;
  const delta=cursorQ-s.q;
  const stretch=c.type==='lever'?J*Math.sin(delta):J*delta;
  const cursorSpeed=clamp(J*cursorRate*(c.type==='lever'?Math.cos(delta):1),-5,5);
  const bodySpeed=J*s.v;
  const R=ratio(c),Qbase=c.type==='lever'?((c.inputMass*10+c.force)*c.rIn-c.outputMass*10*c.rOut)*Math.cos(s.q):c.inputMass*10+c.force-c.outputMass*10/R;
  const hold=-Qbase/J,F=clamp(hold+k*stretch+damping*(cursorSpeed-bodySpeed),-1000,1000);
  const ext={input:0,output:0,[side]:F};
  step(s,c,timeScale/60,ext);
  const r=readout(s,c,ext),energyScale=1+Math.abs(r.workIn)+Math.abs(r.workOut)+Math.abs(r.pointerWork)+r.stopEnergyLoss+r.kineticEnergy;
  assert(Number.isFinite(s.q)&&Number.isFinite(s.v)&&Number.isFinite(r.energyResidual),`${scenario.name}: finite active grip`);
  assert(s.q>=b.min-1e-10&&s.q<=b.max+1e-10,`${scenario.name}: bounded active grip`);
  assert(Math.abs(r.externalInputForce)<=1000+1e-9&&Math.abs(r.externalOutputForce)<=1000+1e-9,`${scenario.name}: capped active grip`);
  assert(r.kineticEnergy>=0&&r.stopEnergyLoss>=0,`${scenario.name}: nonnegative energy`);
  if(c.type!=='lever')assert(r.inputTension>=-1e-7,`${scenario.name}: taut rope/contact`);
  const normalized=Math.abs(r.energyResidual)/energyScale;
  assert(normalized<.0005,`${scenario.name}/${side}/${timeScale}: numerical energy growth ${normalized}`);
  maxNormalizedEnergyError=Math.max(maxNormalizedEnergyError,normalized);
  maxForce=Math.max(maxForce,Math.abs(r.externalInputForce),Math.abs(r.externalOutputForce));
  maxKinetic=Math.max(maxKinetic,r.kineticEnergy);anyLimited ||= r.forceLimited||Math.abs(F)>999.999;
  if(frame>25*60)trackingErrors.push(Math.abs(s.q-targetFinal)/b.range);
  samples++;
 }
 const error=Math.max(...trackingErrors);
 if(scenario.tracking&&!anyLimited){
  assert(error<.012,`${scenario.name}/${side}/${timeScale}: supported grip should settle, error=${error}`);
  maxTrackingError=Math.max(maxTrackingError,error);
 }
 runs++;
}
console.log(JSON.stringify({activeGripRuns:runs,activeGripSamples:samples,maxNormalizedEnergyError,maxTrackingError,maxActualForceN:maxForce,maxPhysicalKineticEnergyJ:maxKinetic}));
}

// Optional settling is a real output-side viscous damper, not a spring or an
// animation pause. Verify neutral equilibrium, heat, stops and continuous play.
{
const types=['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic'];
const effectiveMass=c=>c.type==='lever'?c.inputMass*c.rIn**2+c.outputMass*c.rOut**2:
  c.type==='ramp'?c.inputMass+c.outputMass:c.inputMass+c.outputMass/ratio(c)**2;
const near=(a,b,tolerance=1e-9)=>assert(Math.abs(a-b)<=tolerance,`${a} != ${b}`);
let settlingRuns=0,dampedSamples=0,maxDampedEnergyError=0;
function seededState(c,v,fraction=.5) {
  const s=makeState(c,fraction);s.v=v;s.v0=v;
  s.initialKineticEnergy=.5*effectiveMass(c)*v*v;
  return s;
}
function check(s,c,previousLoss=-1) {
  const r=readout(s,c),b=limits(c);
  assert(Number.isFinite(r.q)&&Number.isFinite(r.velocity)&&Number.isFinite(r.energyResidual));
  assert(r.q>=b.min-1e-12&&r.q<=b.max+1e-12,'Damped motion stays inside the real stroke');
  assert(r.dampingEnergyLoss>=previousLoss-1e-12,'Dissipated energy cannot decrease');
  assert(r.dampingGeneralizedForce*s.v<=1e-9,'Resistance must oppose motion');
  if(c.type!=='lever')assert(r.inputTension>=-1e-7,'Damping cannot make a rope push');
  const relative=Math.abs(r.energyResidual)/(1+Math.abs(r.workIn)+Math.abs(r.workOut)+Math.abs(r.pointerWork)+r.kineticEnergy+r.stopEnergyLoss+r.dampingEnergyLoss+s.initialKineticEnergy);
  maxDampedEnergyError=Math.max(maxDampedEnergyError,relative);
  assert(relative<1e-6,`${c.type}: damping energy residual ${relative}`);
  dampedSamples++;return r;
}
for(const type of types) {
  const c=normalizeConfig({...defaultConfig(type),force:0,damping:2.2});
  c.inputMass=balancedInputMass(c);
  const b=limits(c),neutral=makeState(c,.43),stationary=neutral.q;
  for(let i=0;i<120;i++)step(neutral,c,1/60);
  near(neutral.q,stationary);near(neutral.v,0);near(neutral.dampingEnergyLoss,0);
  for(const sign of [-1,1]) {
    const initialV=sign*.1*b.range,s=seededState(c,initialV),q0=s.q;
    let previousLoss=0;
    for(let i=0;i<360;i++) {
      step(s,c,1/60);const r=check(s,c,previousLoss);previousLoss=r.dampingEnergyLoss;
    }
    const elapsed=6,decay=Math.exp(-c.damping*elapsed);
    near(s.v,initialV*decay,1e-10);
    near(s.q,q0+initialV*(1-decay)/c.damping,1e-10);
    assert(Math.abs(s.q-q0)>.04*b.range,'A balanced machine rests at its displaced position');
    assert(s.impactCount===0,'Neutral settling does not need an end stop');
    near(s.dampingEnergyLoss,s.initialKineticEnergy-.5*effectiveMass(c)*s.v*s.v,1e-8);
    settlingRuns++;
  }
  // Switching resistance off preserves momentum, accumulated heat and origin.
  const on=seededState(c,.03*b.range),q0=on.q0;
  step(on,c,.1);const speed=on.v,heat=on.dampingEnergyLoss;
  const off={...c,damping:0};changeConfig(on,c,off);
  near(on.v,speed);near(on.dampingEnergyLoss,heat);near(on.q0,q0);
  for(let i=0;i<60;i++)step(on,off,1/60);
  near(on.v,speed);near(on.dampingEnergyLoss,heat);check(on,off);
  changeConfig(on,off,c);step(on,c,.1);
  assert(on.v<speed&&on.dampingEnergyLoss>heat,'Re-enabling damping resumes physical settling');
  check(on,c);

  // Unequal forces reach a physical stop. A new force then releases that stop
  // without a reset, unpausing trick, or clearing the accumulated energy.
  const moving={...c,inputMass:0};const required=equilibriumForce(moving);
  moving.force=.7*required;
  const run=makeState(moving,.5);
  for(let i=0;i<3000&&!readout(run,moving).atLimit;i++){step(run,moving,1/60);check(run,moving);}
  near(run.q,b.min);assert(run.impactCount>0&&run.stopEnergyLoss>0);
  const beforeTime=run.time,beforeHeat=run.dampingEnergyLoss,origin=run.q0;
  const reversed={...moving,force:1.3*required};changeConfig(run,moving,reversed);
  step(run,reversed,1/240);
  assert(run.q>b.min&&run.v>0,`${type}: an inward force releases the lower stop`);
  assert(run.time>beforeTime&&run.dampingEnergyLoss>=beforeHeat);near(run.q0,origin);
  for(let i=0;i<3000&&!readout(run,reversed).atLimit;i++){step(run,reversed,1/60);check(run,reversed);}
  near(run.q,b.max);assert(run.impactCount>=2);
  const stoppedHeat=run.dampingEnergyLoss;
  step(run,reversed,.1);near(run.v,0);near(run.dampingEnergyLoss,stoppedHeat);check(run,reversed);
}

// Very strong output resistance on a descending, heavy input can otherwise
// require negative input-rope tension. The saturated segment has constant
// acceleration and its heat is -Dcap*delta(q), not M*lambda*integral(v^2).
const capped=normalizeConfig({...defaultConfig('wheel'),inputMass:200,outputMass:1,force:0,damping:2.2,rIn:.5,rOut:.015});
const falling=seededState(capped,-1),start=falling.q,initial=readout(falling,capped);
assert(initial.dampingLimited&&initial.dampingGeneralizedForce>0);
near(initial.inputTension,0,1e-10);
step(falling,capped,.01);
near(falling.v,-.9,1e-10);near(falling.q,start-.0095,1e-10);
near(falling.dampingEnergyLoss,initial.dampingGeneralizedForce*.0095,1e-10);
check(falling,capped);
for(let i=0;i<120;i++){step(falling,capped,1/60);check(falling,capped);}

// Initial acceleration is unchanged by viscous drag because v=0. Very small
// damping must approach the ideal solution without cancellation or resetting.
for(const type of types) {
  const ideal={...defaultConfig(type),inputMass:0,force:0,damping:0};
  const tiny={...ideal,damping:1e-14},strong={...ideal,damping:10};
  near(initialOutputAcceleration(ideal),initialOutputAcceleration(strong));
  const a=makeState(ideal,.5),b=makeState(tiny,.5);
  for(let i=0;i<10;i++){step(a,ideal,1/240);step(b,tiny,1/240);}
  near(a.q,b.q,type==='lever'?1e-7:1e-10);near(a.v,b.v,type==='lever'?1e-6:1e-10);check(b,tiny);
}

// Drag, release, then re-grip under damping on every machine and both bodies.
for(const type of types)for(const side of ['input','output']) {
  const c=normalizeConfig({...defaultConfig(type),inputMass:0,force:0,damping:2.2});
  const s=makeState(c,.5),b=limits(c),target=s.q+.08*b.range,J=bodyJacobian(c)[side];
  const mass=effectiveMass(c)/(J*J),k=Math.min(800,25*mass),d=1.6*Math.sqrt(k*mass);
  let loss=0;
  for(let frame=0;frame<480;frame++) {
    let external={};
    if(frame<180||frame>=240) {
      const r=readout(s,c),speed=side==='input'?r.inputPathSpeed:r.outputPathSpeed;
      const base=c.type==='lever'?((c.inputMass*10+c.force)*c.rIn-c.outputMass*10*c.rOut)*Math.cos(s.q):c.inputMass*10+c.force-c.outputMass*10/ratio(c);
      const stretch=c.type==='lever'?J*Math.sin(target-s.q):J*(target-s.q);
      external[side]=Math.max(-1000,Math.min(1000,-base/J+k*stretch-d*speed));
    }
    step(s,c,1/60,external);const r=check(s,c,loss);loss=r.dampingEnergyLoss;
  }
}
const pulley=normalizeConfig({...defaultConfig('pulley'),pulleyTravel:1.7,pulleyRadius:.1});
near(limits(pulley).max,1.7);near(ratio(pulley),2);
near(normalizeConfig({...pulley,pulleyTravel:9,pulleyRadius:9}).pulleyTravel,1.8);
near(normalizeConfig({...pulley,pulleyTravel:0,pulleyRadius:0}).pulleyRadius,.08);
near(normalizeConfig({...pulley,pulleyRadius:9}).pulleyRadius,.32);
near(normalizeConfig({...pulley,strands:3}).strands,2);
near(normalizeConfig({...pulley,strands:5}).strands,4);
let dampedExtremeRuns=0;
for(const type of types)for(const highRatio of [false,true])for(const damping of [2.2,10]) {
  const c=normalizeConfig({...defaultConfig(type),damping,inputMass:highRatio?0:200,
    outputMass:highRatio?1:200,force:highRatio?1000:0,
    rIn:highRatio?3:.015,rOut:highRatio?.015:3,
    length:highRatio?5:.06,height:highRatio?.01:5,
    teethIn:highRatio?8:96,teethOut:highRatio?96:8,
    crankRadius:highRatio?.3:.03,drumRadius:highRatio?.03:.3,
    handleRadius:highRatio?.15:.015,lead:highRatio?.003:.6,
    strands:highRatio?6:1,areaIn:highRatio?.25:10,areaOut:highRatio?20:.25});
  const s=seededState(c,(highRatio?-1:1)*2*limits(c).range);let loss=0;
  for(let i=0;i<240;i++) {
    step(s,c,1/60,{input:1000*Math.sin(i*.7),output:1000*Math.cos(i*.4)});
    const r=check(s,c,loss);loss=r.dampingEnergyLoss;
  }
  dampedExtremeRuns++;
}
console.log(JSON.stringify({neutralSettlingRuns:settlingRuns,dampedExtremeRuns,dampedSamples,maxDampedEnergyError}));
}

// Damping saturation transitions: compare full substeps with independently
// calculated branch solutions and finely divided execution. Accepted input
// pull can exceed input weight, so saturation may be entered in either direction.
{
const c={...defaultConfig('pulley'),strands:2,inputMass:10,outputMass:20,force:0,damping:2.2};
const M=15,h=1/240,near=(a,b,t=1e-11)=>assert(Math.abs(a-b)<=t,`${a} != ${b}`);
function seeded(v) {
  const s=makeState(c,.5);s.v=s.v0=v;s.initialKineticEnergy=.5*M*v*v;return s;
}
function verify(input,v0,expectedQDelta,expectedV,expectedHeat) {
  const s=seeded(v0),fine=seeded(v0),q0=s.q,external={input};
  step(s,c,h,external);
  for(let i=0;i<100;i++)step(fine,c,h/100,external);
  near(s.q,q0+expectedQDelta);near(s.v,expectedV);
  near(s.dampingEnergyLoss,expectedHeat,1e-10);
  near(s.q,fine.q);near(s.v,fine.v);near(s.dampingEnergyLoss,fine.dampingEnergyLoss,1e-10);
  const r=readout(s,c);near(r.energyResidual,0,1e-10);
  assert(r.inputTension>=-1e-9&&r.dampingEnergyLoss>=0);
  return r;
}
const input=-101,cap=99.5,threshold=-cap/(M*c.damping),v0=threshold+1e-5;
const A=input/M,terminal=A/c.damping,aSat=-.1;
const crossing=Math.log((v0-terminal)/(threshold-terminal))/c.damping;
assert(crossing>0&&crossing<h);
const before=terminal*crossing+(v0-terminal)*(1-Math.exp(-c.damping*crossing))/c.damping;
const afterTime=h-crossing,dq=before+threshold*afterTime+.5*aSat*afterTime**2;
const v1=threshold+aSat*afterTime;
const heat=.5*M*(v0*v0-v1*v1)+input*dq;
assert(verify(input,v0,dq,v1,heat).dampingLimited);

// With zero allowed positive resistance, descending from rest stays on the
// constant-acceleration branch immediately and dissipates no fictitious heat.
const zeroCapInput=-300,zeroCapA=zeroCapInput/M;
assert(verify(zeroCapInput,0,.5*zeroCapA*h*h,zeroCapA*h,0).dampingLimited);

// The opposite transition remains correct: positive saturated acceleration
// takes a descending body back into ordinary exponential viscous settling.
const upperCap=150,upperThreshold=-upperCap/(M*c.damping),upperV0=upperThreshold-1e-5;
const upTime=(upperThreshold-upperV0)/10,remaining=h-upTime;
const upDQ=upperV0*upTime+5*upTime*upTime+upperThreshold*(1-Math.exp(-c.damping*remaining))/c.damping;
const upV=upperThreshold*Math.exp(-c.damping*remaining);
verify(0,upperV0,upDQ,upV,.5*M*(upperV0*upperV0-upV*upV));
console.log('3 exact damping-transition regressions passed (including both crossing directions and zero cap).');
}
