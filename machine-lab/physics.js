/**
 * Ideal constrained mechanics, SI units.
 * g = 10 N/kg is rounded Earth gravity for classroom arithmetic.
 * q is input rope/plunger travel (m), except a lever's angle (rad).
 * Shafts, ropes, pulleys, wedge and fluid have negligible inertia; the masses
 * shown on the machine supply the inertia. No friction is silently added.
 */
export const GRAVITY = 10;
export const MAX_FORCE = 1000;
export const MAX_MASS = 200;
const STEP = 1 / 240;
const TYPES = new Set(['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic']);
const finite = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const pi2 = 2 * Math.PI;

export function defaultConfig(type='lever') {
  if (!TYPES.has(type)) type='lever';
  const common={type,inputMass:0,outputMass:20,force:0,rIn:1.2,rOut:.3,
    length:2,height:.5,teethIn:12,teethOut:48,crankRadius:.1,drumRadius:.1,
    handleRadius:.3/pi2,lead:.01,strands:2,areaIn:1,areaOut:5};
  const values={
    lever:{},ramp:{outputMass:18},pulley:{outputMass:14},
    wheel:{rIn:.2,rOut:.04,outputMass:24},
    gears:{outputMass:16},screw:{outputMass:30},
    wedge:{length:.24,height:.04,outputMass:21},
    hydraulic:{inputMass:4,outputMass:20}
  };
  return {...common,...values[type]};
}

export function normalizeConfig(config={}) {
  const type=TYPES.has(config.type)?config.type:'lever';
  const d=defaultConfig(type),c={...d,...config,type};
  c.force=clamp(finite(c.force,0),0,MAX_FORCE);
  c.inputMass=clamp(finite(c.inputMass,d.inputMass),0,MAX_MASS);
  c.outputMass=clamp(finite(c.outputMass,d.outputMass),1,MAX_MASS);
  c.rIn=clamp(finite(c.rIn,d.rIn),type==='lever'?.15:.015,type==='lever'?3:.5);
  c.rOut=clamp(finite(c.rOut,d.rOut),type==='lever'?.15:.015,type==='lever'?3:.5);
  if(type==='wedge') {
    c.length=clamp(finite(c.length,d.length),.06,.75);
    c.height=clamp(finite(c.height,d.height),.01,c.length);
  } else {
    c.length=clamp(finite(c.length,d.length),.3,5);
    c.height=clamp(finite(c.height,d.height),.1,c.length);
  }
  c.teethIn=Math.round(clamp(finite(c.teethIn,d.teethIn),8,96));
  c.teethOut=Math.round(clamp(finite(c.teethOut,d.teethOut),8,96));
  c.crankRadius=clamp(finite(c.crankRadius,d.crankRadius),.03,.3);
  c.drumRadius=clamp(finite(c.drumRadius,d.drumRadius),.03,.3);
  c.handleRadius=clamp(finite(c.handleRadius,d.handleRadius),.015,.15);
  c.lead=clamp(finite(c.lead,d.lead),.003,.6);
  c.strands=Math.round(clamp(finite(c.strands,d.strands),1,6));
  c.areaIn=clamp(finite(c.areaIn,d.areaIn),.25,10);
  c.areaOut=clamp(finite(c.areaOut,d.areaOut),.25,20);
  return c;
}

function rawRatio(c) {
  switch(c.type) {
    case 'lever': case 'wheel': return c.rIn/c.rOut;
    case 'ramp': case 'wedge': return c.length/c.height;
    case 'pulley': return c.strands;
    case 'gears': return (c.teethOut/c.teethIn)*(c.crankRadius/c.drumRadius);
    case 'screw': return pi2*c.handleRadius/c.lead;
    case 'hydraulic': return c.areaOut/c.areaIn;
    default:return 1;
  }
}
export const ratio = config => rawRatio(normalizeConfig(config));

export function limits(config) {
  const c=normalizeConfig(config);
  if(c.type==='lever') return {min:-.35,max:.35,range:.7,unit:'rad'};
  let max;
  switch(c.type) {
    case 'ramp': case 'wedge':max=c.length;break;
    case 'screw':max=pi2*c.handleRadius;break;
    case 'hydraulic':max=.24;break;
    case 'wheel':max=Math.min(.5,2*c.rIn,.5*rawRatio(c));break;
    case 'gears':max=Math.min(.5,4*c.crankRadius,.5*rawRatio(c));break;
    default:max=1.2;
  }
  return {min:0,max,range:max,unit:'m'};
}

/** Additional applied force needed after the hanging input weight; may be negative. */
export function equilibriumForce(config) {
  const c=normalizeConfig(config);
  return c.outputMass*GRAVITY/rawRatio(c)-c.inputMass*GRAVITY;
}
/** Required hanging input mass at the current applied force; negative means impossible using only a positive mass. */
export function balancedInputMass(config) {
  const c=normalizeConfig(config);
  return c.outputMass/rawRatio(c)-c.force/GRAVITY;
}

function massSignature(c) {
  const clean={...c};delete clean.force;
  return JSON.stringify(clean);
}
function coordinates(q,c) {
  if(c.type==='lever') return {input:c.rIn*Math.sin(q),output:c.rOut*Math.sin(q),
    inJacobian:c.rIn*Math.cos(q),outJacobian:c.rOut*Math.cos(q)};
  const R=rawRatio(c);
  return {input:q,output:q/R,inJacobian:1,outJacobian:1/R};
}
function inertia(c) {
  if(c.type==='lever') return c.inputMass*c.rIn*c.rIn+c.outputMass*c.rOut*c.rOut;
  if(c.type==='ramp') return c.inputMass+c.outputMass;
  const R=rawRatio(c);
  return c.inputMass+c.outputMass/(R*R);
}
function acceleration(q,c) {
  const input=c.inputMass*GRAVITY+c.force,output=c.outputMass*GRAVITY;
  if(c.type==='lever') return (input*c.rIn-output*c.rOut)*Math.cos(q)/inertia(c);
  return (input-output/rawRatio(c))/inertia(c);
}

export function makeState(config,startFraction=.35) {
  const c=normalizeConfig(config),bound=limits(c),fraction=clamp(finite(startFraction,.35),0,1);
  const q=bound.min+fraction*bound.range;
  return {q,v:0,q0:q,v0:0,time:0,workIn:0,workOut:0,appliedWork:0,inputGravityWork:0,
    stopEnergyLoss:0,initialKineticEnergy:0,atLimit:false,impactCount:0,
    signature:massSignature(c),lastForce:c.force};
}
export const reset = makeState;

/** Geometry/mass changes restart the energy experiment at the same stroke fraction. */
export function changeConfig(state,oldConfig,newConfig) {
  const old=normalizeConfig(oldConfig),next=normalizeConfig(newConfig);
  if(massSignature(old)===massSignature(next)) {state.lastForce=next.force;return state;}
  const oldLimits=limits(old),fraction=clamp((finite(state.q,oldLimits.min)-oldLimits.min)/oldLimits.range,0,1);
  Object.assign(state,makeState(next,fraction));
  return state;
}

/**
 * Velocity-Verlet is a symplectic, second-order integration of the exact
 * one-degree-of-freedom constraint equations. It is exact for constant forces
 * on linear machines and bounded/low-drift for a lever. dt is capped during
 * inactive tabs; every physical substep is no longer than 1/240 second.
 */
export function step(state,config,dt) {
  const c=normalizeConfig(config),signature=massSignature(c),bound=limits(c);
  if(!state || !Number.isFinite(state.q) || !Number.isFinite(state.v)) return makeState(c);
  if(state.signature!==signature) {
    const fraction=clamp((state.q-bound.min)/bound.range,0,1);
    Object.assign(state,makeState(c,fraction));
  }
  dt=clamp(finite(dt,0),0,.1);
  if(!dt) return state;
  const maxStep=c.type==='lever'?1/1200:STEP;
  const count=Math.max(1,Math.ceil(dt/maxStep)),h=dt/count,M=inertia(c);
  state.atLimit=false;
  for(let i=0;i<count;i++) {
    const q0=state.q,v0=state.v;
    const a0=acceleration(q0,c);
    // Stops supply a reaction, so a machine resting against a stop cannot
    // acquire velocity farther into it. Forces reversed away from it do move.
    if((q0<=bound.min+1e-12&&v0<=0&&a0<=0)||(q0>=bound.max-1e-12&&v0>=0&&a0>=0)) {
      if(v0!==0)state.stopEnergyLoss+=.5*M*v0*v0;
      state.q=clamp(q0,bound.min,bound.max);state.v=0;state.atLimit=true;state.time+=h;continue;
    }
    const proposal=q0+v0*h+.5*a0*h*h;
    let q1=clamp(proposal,bound.min,bound.max);
    const before=coordinates(q0,c),after=coordinates(q1,c);
    const dsIn=after.input-before.input,dsOut=after.output-before.output;
    const workIn=(c.inputMass*GRAVITY+c.force)*dsIn,workOut=c.outputMass*GRAVITY*dsOut;
    state.workIn+=workIn;state.workOut+=workOut;
    state.appliedWork+=c.force*dsIn;state.inputGravityWork+=c.inputMass*GRAVITY*dsIn;
    if(proposal<bound.min || proposal>bound.max) {
      // Compute impact kinetic energy from the actual distance to the stop,
      // rather than crediting work along an overshot path. Collision is inelastic.
      const impactKE=Math.max(0,.5*M*v0*v0+workIn-workOut);
      state.stopEnergyLoss+=impactKE;state.impactCount++;state.v=0;state.atLimit=true;
    } else {
      const a1=acceleration(q1,c);
      state.v=v0+.5*(a0+a1)*h;
    }
    state.q=q1;state.time+=h;
  }
  state.lastForce=c.force;
  return state;
}

export function readout(state,config) {
  const c=normalizeConfig(config),bound=limits(c),R=rawRatio(c);
  const q=clamp(finite(state.q,bound.min),bound.min,bound.max),v=finite(state.v,0);
  const now=coordinates(q,c),start=coordinates(finite(state.q0,q),c);
  const inputWeight=c.inputMass*GRAVITY,outputWeight=c.outputMass*GRAVITY;
  const inputForce=inputWeight+c.force,requiredInputForce=outputWeight/R;
  const kineticEnergy=.5*inertia(c)*v*v;
  const workIn=finite(state.workIn,0),workOut=finite(state.workOut,0),stopEnergyLoss=finite(state.stopEnergyLoss,0);
  const residual=workIn-workOut-(kineticEnergy-finite(state.initialKineticEnergy,0))-stopEnergyLoss;
  const balanceError=inputForce-requiredInputForce;
  const inputSpeed=now.inJacobian*v,outputSpeed=now.outJacobian*v;
  const freeAcceleration=acceleration(q,c);
  const heldAtStop=Math.abs(v)<1e-10&&((q<=bound.min+1e-12&&freeAcceleration<0)||(q>=bound.max-1e-12&&freeAcceleration>0));
  const a=heldAtStop?0:freeAcceleration;
  const inputAcceleration=c.type==='lever'?c.rIn*(Math.cos(q)*a-Math.sin(q)*v*v):a;
  const outputAcceleration=c.type==='lever'?c.rOut*(Math.cos(q)*a-Math.sin(q)*v*v):a/R;
  const inputTension=c.type==='lever'?null:c.force+c.inputMass*(GRAVITY-inputAcceleration);
  return {
    q,velocity:v,positionFraction:(q-bound.min)/bound.range,
    inputDistance:now.input,outputDistance:now.output,
    displacementIn:now.input-start.input,displacementOut:now.output-start.output,
    inputSpeed,outputSpeed,inputAcceleration,outputAcceleration,inputForce,driveForce:inputForce,
    inputTension,appliedForce:c.force,inputWeight,outputWeight,
    inputMass:c.inputMass,outputMass:c.outputMass,requiredInputForce,
    additionalRequiredForce:requiredInputForce-inputWeight,
    ma:R,idealMechanicalAdvantage:R,balanceError,
    balanced:Math.abs(balanceError)<1e-8*Math.max(1,requiredInputForce),
    acceleration:a,freeAcceleration,kineticEnergy,workIn,workOut,
    appliedWork:finite(state.appliedWork,0),inputGravityWork:finite(state.inputGravityWork,0),
    stopEnergyLoss,energyResidual:residual,atLimit:!!state.atLimit,
    direction:Math.abs(outputSpeed)<1e-6?'still':outputSpeed>0?'lifting':'lowering',
    time:finite(state.time,0),gravity:GRAVITY,
    modelNote:c.type==='hydraulic'?'Incompressible liquid; fluid inertia and height-pressure differences ignored.':'Ideal massless machine and rope; no friction.',
  };
}
