import assert from 'node:assert/strict';
import {defaultConfig,normalizeConfig,ratio,limits,makeState,step,readout,bodyJacobian,verticalCoordinates,currentMechanicalAdvantage,generalizedDrive,balancedInputMass,equilibriumForce,initialOutputAcceleration,isAngularMachine} from '../physics.js';
let checks=0;
const near=(actual,expected,tol=1e-8)=>{assert.ok(Math.abs(actual-expected)<=tol*Math.max(1,Math.abs(expected)),`${actual} != ${expected}`);checks++;};
const ok=(condition,message)=>{assert.ok(condition,message);checks++;};
const kinetic=(c,v)=>.5*(c.inputMass*c.rIn**2+c.outputMass*(c.rOut*c.teethIn/c.teethOut)**2)*v*v;
const cases=[];
for(const [teethIn,teethOut] of [[8,96],[12,24],[20,20],[24,12],[96,8]])for(const [rIn,rOut] of [[.25,.25],[.3,.6],[.5,.2]]){
 const c=normalizeConfig({...defaultConfig('gearArms'),teethIn,teethOut,rIn,rOut,outputMass:4,force:0});c.inputMass=balancedInputMass(c);cases.push(c);
}
for(const c of cases){
 const k=c.teethIn/c.teethOut,J=bodyJacobian(c),bound=limits(c);
 ok(isAngularMachine(c)&&isAngularMachine(c.type),'Angular type recognized');near(ratio(c),c.rIn/(c.rOut*k));near(J.input,c.rIn);near(J.output,c.rOut*k);
 near(bound.max,.35/Math.max(1,k));near(bound.min,-bound.max);near(makeState(c).q,0);
 const balanced=makeState(c,.5);
 for(let i=0;i<240;i++)step(balanced,c,1/120);
 near(balanced.q,0);near(balanced.v,0);ok(readout(balanced,c).balanced,'Exact horizontal balance remains at rest');
 for(const fraction of [-.8,-.2,.2,.8]){
  const q=bound.max*fraction,v=verticalCoordinates(c,q),eps=1e-7;
  const before=verticalCoordinates(c,q-eps),after=verticalCoordinates(c,q+eps);
  near(v.input,c.rIn*Math.sin(q));near(v.output,c.rOut*Math.sin(k*q));
  // External gears rotate oppositely; both bars initially point left.
  near(c.teethIn*q+c.teethOut*(-k*q),0);
  near(v.input,-c.rIn*Math.sin(Math.PI+q));
  near(v.output,c.rOut*Math.sin(Math.PI-k*q));
  near((after.input-before.input)/(2*eps),v.inJacobian,1e-7);near((after.output-before.output)/(2*eps),v.outJacobian,1e-7);
  near(currentMechanicalAdvantage(c,q),v.inJacobian/v.outJacobian);
  near(generalizedDrive(c,q),10*c.inputMass*c.rIn*Math.cos(q)-10*c.outputMass*c.rOut*k*Math.cos(k*q));
  const s=makeState(c,.5);s.q=q;s.q0=q;const r=readout(s,c);
  near(r.ma,currentMechanicalAdvantage(c,q));near(r.nominalMechanicalAdvantage,ratio(c));
  near(equilibriumForce(c,q),c.outputMass*10/currentMechanicalAdvantage(c,q)-c.inputMass*10);
  near(balancedInputMass(c,q),c.outputMass/currentMechanicalAdvantage(c,q));
  near(r.netGeneralizedForce,generalizedDrive(c,q));
  if(k!==1)ok(Math.sign(generalizedDrive(c,q))===Math.sign(k*k-1),'Unequal-gear balance is semistable: torque has the same sign at +/- angle');
  else near(generalizedDrive(c,q),0);
 }
 // F=ma at the horizontal starting position, with no input mass.
 const forceConfig={...c,inputMass:0,force:35};near(initialOutputAcceleration(forceConfig),35*ratio(c)/c.outputMass-10);
 // Pointer forces do work through arc distance; gravity through vertical distance.
 for(const damping of [0,.3,2])for(const sign of [-1,1]){
  const d={...c,damping},s=makeState(d,.5);s.v=sign*.1;s.initialKineticEnergy=kinetic(d,s.v);
  const ext={input:sign*3,output:-sign*.2};
  for(let i=0;i<120;i++){
   step(s,d,1/240,ext);const r=readout(s,d,ext);
   ok(s.q>=bound.min-1e-10&&s.q<=bound.max+1e-10,'Travel bounds');
   ok(Number.isFinite(r.energyResidual)&&r.dampingEnergyLoss>=0,'Finite energy ledger');
   near(r.workIn,10*d.inputMass*d.rIn*(Math.sin(s.q)-Math.sin(s.q0)),2e-7);
   near(r.workOut,10*d.outputMass*d.rOut*(Math.sin(k*s.q)-Math.sin(k*s.q0)),2e-7);
   near(r.pointerWork,(ext.input*J.input+ext.output*J.output)*(s.q-s.q0),2e-7);
   near(r.energyResidual,0,2e-5);
   near(r.inputAcceleration,d.rIn*(Math.cos(s.q)*r.acceleration-Math.sin(s.q)*s.v*s.v));
   near(r.outputAcceleration,d.rOut*(k*Math.cos(k*s.q)*r.acceleration-k*k*Math.sin(k*s.q)*s.v*s.v));
  }
 }
}
// Strong loads and force caps still stop cleanly at the two physical angular limits.
for(const c of [
 normalizeConfig({...defaultConfig('gearArms'),teethIn:8,teethOut:96,rIn:3,rOut:.15,inputMass:0,outputMass:1,force:1000}),
 normalizeConfig({...defaultConfig('gearArms'),teethIn:96,teethOut:8,rIn:.15,rOut:3,inputMass:0,outputMass:200,force:0})]){
 const s=makeState(c,.5),bound=limits(c);for(let i=0;i<30;i++)step(s,c,.02);
 const r=readout(s,c);ok(r.atLimit,'Extremely unbalanced load reaches a physical stop');ok(s.q>=bound.min&&s.q<=bound.max,'Extreme bounds');near(r.energyResidual,0,1e-4);
}
const equal={...defaultConfig('gearArms'),teethIn:24,teethOut:24,rIn:.35,rOut:.35,inputMass:20,outputMass:20,force:0};
const n=makeState(equal,.5);n.v=.03;n.initialKineticEnergy=kinetic(equal,n.v);for(let i=0;i<120;i++)step(n,equal,1/240);near(n.v,.03);near(n.q,.015);near(readout(n,equal).energyResidual,0);
console.log(`Gear-arm physics passed ${checks} checks across ${cases.length} gear/arm geometries, including exact balance, semistability, Newtonian acceleration, energy, damping, tangent work and bounds.`);
