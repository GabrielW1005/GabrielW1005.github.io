import assert from 'node:assert/strict';
import {machineCatalog,createChallenge} from '../challenges.js';
import {ratio,limits,bodyJacobian,makeState,readout,step,MAX_FORCE} from '../physics.js';
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let count=0,maxError=0,maxResidual=0;
for(const machine of machineCatalog.filter(m=>!m.balanceOnly))for(let level=0;level<machine.levels.length;level++)for(const variant of [0,7,15])for(const damping of [0,2.2])for(const factor of [.5,1,1.5])for(const customLoad of [1,1.5]){
 const p=createChallenge(machine.type,'distance',level,variant),c={...p.config,outputMass:p.config.outputMass*customLoad,damping},s=makeState(c,p.startFraction),bound=limits(c),value=p.answer*factor;
 const raw=c.type==='lever'?Math.asin(clamp(Math.sin(s.q)+value/c.rIn,-1,1)):s.q+value,target=clamp(raw,bound.min,bound.max),R=ratio(c),J=bodyJacobian(c).input;
 const M=c.type==='lever'?c.inputMass*c.rIn**2+c.outputMass*c.rOut**2:c.type==='ramp'?c.inputMass+c.outputMass:c.inputMass+c.outputMass/R**2;
 const effectiveMass=M/J**2,k=Math.min(700,36*effectiveMass),drag=2*Math.sqrt(k*effectiveMass);
 for(let n=0;n<900;n++){
  const Qbase=c.type==='lever'?((c.inputMass*10+c.force)*c.rIn-c.outputMass*10*c.rOut)*Math.cos(s.q):c.inputMass*10+c.force-c.outputMass*10/R;const f=clamp(-Qbase/J+k*(target-s.q)*J-drag*s.v*J,-MAX_FORCE,MAX_FORCE);step(s,c,1/60,{input:f,output:0});
  assert.ok(Number.isFinite(s.q)&&Number.isFinite(s.v),'finite controller state');
 }
 const r=readout(s,c,{input:0,output:0}),error=Math.abs(s.q-target)*J;
 maxError=Math.max(maxError,error);maxResidual=Math.max(maxResidual,Math.abs(r.energyResidual));
 assert.ok(error<.0002,`${machine.type} level${level} factor${factor} damping${damping}: target error ${error}`);
 assert.ok(Math.abs(r.energyResidual)<1e-5*Math.max(1,Math.abs(r.workOut),Math.abs(r.pointerWork)),`actuator energy ${r.energyResidual}`);
 if(factor===1)assert.ok(Math.abs(r.displacementOut-p.motionDistance)<.0002,`correct answer reaches specified rise: ${machine.type}`);
 if(factor===.5)assert.ok(r.displacementOut<p.motionDistance*.55,`wrong half distance must show smaller rise: ${machine.type}`);
 count++;
}
console.log(JSON.stringify({count,maxError,maxResidual}));
