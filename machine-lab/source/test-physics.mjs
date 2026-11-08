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
const gear=defaultConfig('gears');close(ratio(gear),4);gear.crankRadius=.2;close(ratio(gear),8);
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
