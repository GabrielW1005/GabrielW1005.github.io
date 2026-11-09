/**
 * Ideal constrained mechanics, SI units.
 * g = 10 N/kg is rounded Earth gravity for classroom arithmetic.
 * q is input rope/plunger travel (m), except a lever's angle (rad).
 * Shafts, ropes, pulleys, wedge and fluid have negligible inertia; the masses
 * shown on the machine supply the inertia. Optional, explicitly configured
 * viscous resistance acts on the output path; dissipated energy is tracked.
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
  const common={type,inputMass:0,outputMass:20,force:0,damping:0,rIn:1.2,rOut:.3,
    length:2,height:.5,teethIn:12,teethOut:48,crankRadius:.1,drumRadius:.1,
    handleRadius:.3/pi2,lead:.01,strands:2,pulleyTravel:1.2,pulleyRadius:.18,areaIn:1,areaOut:5};
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
  c.damping=clamp(finite(c.damping,0),0,10);
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
  const requestedStrands=clamp(finite(c.strands,d.strands),1,6);
  c.strands=[1,2,4,6].reduce((best,value)=>Math.abs(value-requestedStrands)<Math.abs(best-requestedStrands)?value:best,1);
  c.pulleyTravel=clamp(finite(c.pulleyTravel,d.pulleyTravel),.6,1.8);
  c.pulleyRadius=clamp(finite(c.pulleyRadius,d.pulleyRadius),.08,.32);
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
    case 'pulley':max=c.pulleyTravel;break;
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
  const clean={...c};delete clean.force;delete clean.damping;
  return JSON.stringify(clean);
}
function pointerForces(external={}) {
  return {input:clamp(finite(external?.input,0),-MAX_FORCE,MAX_FORCE),
    output:clamp(finite(external?.output,0),-MAX_FORCE,MAX_FORCE)};
}
function pathJacobian(c,R) {
  if(c.type==='lever')return {input:c.rIn,output:c.rOut};
  if(c.type==='ramp')return {input:1,output:1};
  return {input:1,output:1/R};
}
/** Actual body-path meters per unit q (q is radians only for a lever). */
export function bodyJacobian(config) {
  const c=normalizeConfig(config);
  return {...pathJacobian(c,rawRatio(c)),coordinateUnit:c.type==='lever'?'rad':'m'};
}
function coordinates(q,c,R) {
  if(c.type==='lever')return {input:c.rIn*Math.sin(q),output:c.rOut*Math.sin(q),
    inJacobian:c.rIn*Math.cos(q),outJacobian:c.rOut*Math.cos(q)};
  return {input:q,output:q/R,inJacobian:1,outJacobian:1/R};
}
function inertia(c,R) {
  if(c.type==='lever')return c.inputMass*c.rIn*c.rIn+c.outputMass*c.rOut*c.rOut;
  if(c.type==='ramp')return c.inputMass+c.outputMass;
  return c.inputMass+c.outputMass/(R*R);
}
function model(c,external={}) {
  const R=rawRatio(c),M=inertia(c,R),J=pathJacobian(c,R),requested=pointerForces(external);
  const rawRequested={input:finite(external?.input,0),output:finite(external?.output,0)};
  const drive=c.inputMass*GRAVITY+c.force,weight=c.outputMass*GRAVITY;
  const baseQ=c.type==='lever'?drive*c.rIn-weight*c.rOut:drive-weight/R;
  const requestedQ=requested.input*J.input+requested.output*J.output;
  let pointerForceScale=1;
  if(c.type!=='lever') {
    // A rope can pull, not push. Its input tension is affine in the two
    // pointer forces, so scaling both preserves direction and prevents slack.
    const baseTension=drive-c.inputMass*baseQ/M;
    const deltaTension=requested.input-c.inputMass*requestedQ/M;
    if(baseTension+deltaTension<0 && deltaTension<0)
      pointerForceScale=clamp(baseTension/(-deltaTension),0,1);
  }
  const capped=rawRequested.input!==requested.input||rawRequested.output!==requested.output;
  return {R,M,J,requested,rawRequested,pointerForceScale,capped,drive,weight,baseQ,
    type:c.type,inputMass:c.inputMass,damping:c.damping,
    acceleration:(q,pointerQ=0)=>(baseQ*(c.type==='lever'?Math.cos(q):1)+pointerQ)/M};
}
// The damper is attached to the output body: F_d,out = D/Jout. A descending
// output can otherwise be decelerated so strongly that the input rope would
// need to push. Limit this resistance instead of inventing compressive tension.
// Accepted pointer forces have priority and already satisfy the taut constraint.
function dampingCap(m,pointer) {
  return m.type==='lever'||m.inputMass===0?Infinity:
    Math.max(0,m.M*(m.drive+pointer.input)/m.inputMass-m.baseQ-pointer.Q);
}
function dampingForce(m,v,pointer) {
  const requested=-m.M*m.damping*v;
  const actual=requested>0?Math.min(requested,dampingCap(m,pointer)):requested;
  return {requested,actual,limited:actual<requested-1e-10};
}
function acceleration(m,q,v,pointer) {
  return m.acceleration(q,pointer.Q)+dampingForce(m,v,pointer).actual/m.M;
}
function actualPointer(m,q=0,v=0,bound=null) {
  let scale=m.pointerForceScale;
  const initialQ=scale*(m.requested.input*m.J.input+m.requested.output*m.J.output);
  const a=m.acceleration(q,initialQ);
  const held=bound&&Math.abs(v)<1e-10&&((q<=bound.min+1e-12&&a<0)||(q>=bound.max-1e-12&&a>0));
  if(m.type!=='lever'&&held&&m.requested.input<0&&m.drive+scale*m.requested.input<0)
    scale=Math.min(scale,clamp(m.drive/(-m.requested.input),0,1));
  const input=m.requested.input*scale,output=m.requested.output*scale;
  return {input,output,Q:input*m.J.input+output*m.J.output,
    scale,forceLimited:m.capped||scale<1-1e-12};
}
/** Free acceleration along the output path at rest, with a horizontal lever.
 * It deliberately ignores end-stop reactions. Caller supplies inputMass=0
 * when an exercise is intended to involve just an applied force and one load.
 */
export function initialOutputAcceleration(config,external={}) {
  const c=normalizeConfig(config),m=model(c,external);
  return m.J.output*m.acceleration(0,actualPointer(m).Q);
}

export function makeState(config,startFraction=.35) {
  const c=normalizeConfig(config),bound=limits(c),fraction=clamp(finite(startFraction,.35),0,1);
  const q=bound.min+fraction*bound.range;
  return {q,v:0,q0:q,v0:0,time:0,workIn:0,workOut:0,appliedWork:0,inputGravityWork:0,
    pointerWork:0,pathDistanceIn:0,pathDistanceOut:0,
    requestedExternal:{input:0,output:0},actualExternal:{input:0,output:0},
    forceLimited:false,pointerForceScale:1,
    stopEnergyLoss:0,dampingEnergyLoss:0,initialKineticEnergy:0,atLimit:false,impactCount:0,
    signature:massSignature(c),lastForce:c.force};
}
export const reset = makeState;

/** Geometry/mass changes restart the experiment. Force/damping edits preserve motion and energy. */
export function changeConfig(state,oldConfig,newConfig) {
  const old=normalizeConfig(oldConfig),next=normalizeConfig(newConfig);
  if(massSignature(old)===massSignature(next)) {state.lastForce=next.force;return state;}
  const oldLimits=limits(old),fraction=clamp((finite(state.q,oldLimits.min)-oldLimits.min)/oldLimits.range,0,1);
  Object.assign(state,makeState(next,fraction));
  return state;
}

// Solve the substep's quadratic path for the first boundary crossing. Checking
// just its endpoint would miss a fast out-and-back collision during live drag.
function firstImpact(q,v,a,h,bound) {
  let first=null;
  for(const boundary of [bound.min,bound.max]) {
    const A=.5*a,B=v,C=q-boundary;
    let roots=[];
    if(Math.abs(A)<1e-14) {
      if(Math.abs(B)>1e-14)roots=[-C/B];
    } else {
      const disc=B*B-4*A*C;
      if(disc>=0) {
        const root=Math.sqrt(disc);
        // Stable quadratic formula, including a near-zero second root.
        const Q=-.5*(B+(B>=0?root:-root));
        roots=Math.abs(Q)>1e-20?[Q/A,C/Q]:[-B/(2*A)];
      }
    }
    for(const t of roots) {
      if(t<=1e-12 || t>h+1e-12)continue;
      const hitSpeed=v+a*t;
      if(boundary===bound.min?hitSpeed>=-1e-12:hitSpeed<=1e-12)continue;
      if(!first||t<first.time)first={q:boundary,time:Math.min(h,t)};
    }
  }
  return first;
}
function actualTravel(q0,q1,v,a,duration) {
  const turn=Math.abs(a)>1e-14?-v/a:Infinity;
  if(turn>0&&turn<duration) {
    const qt=q0+v*turn+.5*a*turn*turn;
    return Math.abs(qt-q0)+Math.abs(q1-qt);
  }
  return Math.abs(q1-q0);
}

// Exact solution for a held force and linear viscous resistance. The positive
// damping cap is constant while the accepted pointer force is held. If needed,
// split at either direction of transition between the saturated and exponential
// branches. Gaussian
// quadrature integrates the nonnegative heat rate on the smooth branch; with
// lambda*h <= 1/24 its error is below floating-point display precision.
function linearDampedMotion(m,pointer,q0,v0,h) {
  const lambda=m.damping,A=(m.baseQ+pointer.Q)/m.M,cap=dampingCap(m,pointer);
  let q=q0,v=v0,loss=0,remaining=h;
  const threshold=-cap/(m.M*lambda),saturatedAcceleration=A+cap/m.M;
  const saturated=duration=>{
    const dq=v*duration+.5*saturatedAcceleration*duration*duration;
    q+=dq;v+=saturatedAcceleration*duration;loss-=cap*dq;
  };
  const exponential=duration=>{
    if(duration<=0)return;
    const phi1=x=>x===0?1:-Math.expm1(-x)/x;
    const phi2=x=>x<.001?.5-x/6+x*x/24-x*x*x/120+x*x*x*x/720:(x+Math.expm1(-x))/(x*x);
    const velocity=t=>v*Math.exp(-lambda*t)+A*t*phi1(lambda*t);
    let integral=0;
    for(const [fraction,weight] of [[.1127016653792583,5/18],[.5,4/9],[.8872983346207417,5/18]]) {
      const sample=velocity(fraction*duration);
      integral+=weight*sample*sample;
    }
    loss+=m.M*lambda*duration*integral;
    q+=v*duration*phi1(lambda*duration)+A*duration*duration*phi2(lambda*duration);
    v=velocity(duration);
  };
  if(v<threshold) {
    const transition=saturatedAcceleration>0?(threshold-v)/saturatedAcceleration:Infinity;
    const duration=Math.min(remaining,transition);
    saturated(duration);remaining-=duration;
    exponential(remaining);
  } else {
    // Accepted input pull may exceed its weight while rope tension remains
    // positive. Then the saturated acceleration is negative and an initially
    // exponential trajectory can enter the capped branch during this substep.
    const transition=saturatedAcceleration<0?
      Math.log1p(lambda*(v-threshold)/(-saturatedAcceleration))/lambda:Infinity;
    const duration=Math.min(remaining,transition);
    exponential(duration);remaining-=duration;
    if(remaining>0)saturated(remaining);
  }
  return {q,v,loss:Math.max(0,loss)};
}
function leverDampedMotion(m,pointer,q0,v0,h) {
  const derivative=(q,v)=>({q:v,v:acceleration(m,q,v,pointer),loss:m.M*m.damping*v*v});
  const a=derivative(q0,v0);
  const b=derivative(q0+.5*h*a.q,v0+.5*h*a.v);
  const c=derivative(q0+.5*h*b.q,v0+.5*h*b.v);
  const d=derivative(q0+h*c.q,v0+h*c.v);
  return {q:q0+h*(a.q+2*b.q+2*c.q+d.q)/6,
    v:v0+h*(a.v+2*b.v+2*c.v+d.v)/6,
    loss:h*(a.loss+2*b.loss+2*c.loss+d.loss)/6};
}
function dampedMotion(m,pointer,q0,v0,h) {
  return m.type==='lever'?leverDampedMotion(m,pointer,q0,v0,h):linearDampedMotion(m,pointer,q0,v0,h);
}
function bisectTime(fn,target,lo,hi,increasing) {
  for(let i=0;i<40;i++) {
    const mid=(lo+hi)/2,value=fn(mid);
    if((value<target)===increasing)lo=mid;else hi=mid;
  }
  return (lo+hi)/2;
}
// At most one reversal occurs in a substep of this bounded one-dimensional
// damped motion. Split there before finding a stop so a fast out-and-back
// excursion cannot pass through a stop unnoticed.
function boundedDampedMotion(m,pointer,q0,v0,h,bound) {
  const motion=t=>dampedMotion(m,pointer,q0,v0,t);
  const end=motion(h),segments=[];
  if(v0*end.v<0) {
    const turn=bisectTime(t=>motion(t).v,0,0,h,end.v>v0);
    segments.push({time:turn,...motion(turn)});
  }
  segments.push({time:h,...end});
  let previous={time:0,q:q0},travel=0;
  for(const point of segments) {
    const increasing=point.q>previous.q;
    const boundary=increasing?bound.max:bound.min;
    if(increasing?point.q>=boundary:point.q<=boundary) {
      const time=bisectTime(t=>motion(t).q,boundary,previous.time,point.time,increasing);
      const hit=motion(time);
      return {...hit,q:boundary,travel:travel+Math.abs(boundary-previous.q),impact:true};
    }
    travel+=Math.abs(point.q-previous.q);previous=point;
  }
  return {...end,travel,impact:false};
}

/**
 * Velocity-Verlet integrates the exact one-degree-of-freedom constraints.
 * With damping, linear machines use the exact piecewise exponential solution
 * and levers use RK4. Lever steps use 1/1200 s; other steps <= 1/240 s.
 * The caller may update signed tangent pointer forces each frame. The forces
 * are held constant during this call and the same samples calculate work.
 * Wdrive + Wpointer - gain in gravitational energy = ΔK + stop losses + heat.
 */
export function step(state,config,dt,external={input:0,output:0}) {
  const c=normalizeConfig(config),signature=massSignature(c),bound=limits(c);
  if(!state || !Number.isFinite(state.q) || !Number.isFinite(state.v))return makeState(c);
  if(state.signature!==signature) {
    const fraction=clamp((state.q-bound.min)/bound.range,0,1);
    Object.assign(state,makeState(c,fraction));
  }
  const m=model(c,external);
  state.requestedExternal={...m.rawRequested};
  const initialPointer=actualPointer(m,state.q,state.v,bound);
  state.actualExternal={input:initialPointer.input,output:initialPointer.output};
  state.forceLimited=initialPointer.forceLimited;state.pointerForceScale=initialPointer.scale;
  state.pointerWork=finite(state.pointerWork,0);
  state.dampingEnergyLoss=finite(state.dampingEnergyLoss,0);
  state.pathDistanceIn=finite(state.pathDistanceIn,Math.abs(state.q-state.q0)*m.J.input);
  state.pathDistanceOut=finite(state.pathDistanceOut,Math.abs(state.q-state.q0)*m.J.output);
  dt=clamp(finite(dt,0),0,.1);
  if(!dt)return state;
  // A tiny output inertia with a large lever force can cross the whole stroke
  // in milliseconds. Resolve that natural angular time scale, rather than
  // relying only on a fixed frame-rate subdivision.
  const angularRate=c.type==='lever'?Math.sqrt((Math.abs(m.baseQ)+Math.abs(m.requested.input*m.J.input+m.requested.output*m.J.output))/m.M):0;
  const maxStep=c.type==='lever'?(m.damping>0?Math.min(1/1200,.05/Math.max(1,angularRate),.05/Math.max(1,Math.abs(state.v))):1/1200):STEP;
  const count=Math.max(1,Math.ceil(dt/maxStep)),h=dt/count;
  state.atLimit=false;
  for(let i=0;i<count;i++) {
    const q0=clamp(state.q,bound.min,bound.max);
    let v0=state.v;
    // Resolve any outward velocity exactly at a stop before considering the
    // new pointer force. Reversing the force then releases the body normally.
    if((q0<=bound.min+1e-12&&v0<0)||(q0>=bound.max-1e-12&&v0>0)) {
      state.stopEnergyLoss+=.5*m.M*v0*v0;state.impactCount++;v0=0;
    }
    const pointer=actualPointer(m,q0,v0,bound);
    state.actualExternal={input:pointer.input,output:pointer.output};
    state.forceLimited=pointer.forceLimited;state.pointerForceScale=pointer.scale;
    const a0=acceleration(m,q0,v0,pointer);
    if((q0<=bound.min+1e-12&&v0===0&&a0<=0)||(q0>=bound.max-1e-12&&v0===0&&a0>=0)) {
      state.q=q0;state.v=0;state.atLimit=true;state.time+=h;continue;
    }
    const damped=m.damping>0?boundedDampedMotion(m,pointer,q0,v0,h,bound):null;
    const proposal=damped?damped.q:q0+v0*h+.5*a0*h*h;
    const impact=damped?damped.impact:firstImpact(q0,v0,a0,h,bound);
    const q1=damped?damped.q:impact?impact.q:clamp(proposal,bound.min,bound.max);
    const duration=impact&&!damped?impact.time:h;
    const before=coordinates(q0,c,m.R),after=coordinates(q1,c,m.R),dq=q1-q0;
    const dsIn=after.input-before.input,dsOut=after.output-before.output;
    const workIn=m.drive*dsIn,workOut=m.weight*dsOut,pointerWork=pointer.Q*dq;
    state.workIn+=workIn;state.workOut+=workOut;state.pointerWork+=pointerWork;
    const dampingLoss=damped?damped.loss:0;
    state.dampingEnergyLoss+=dampingLoss;
    state.appliedWork+=c.force*dsIn;state.inputGravityWork+=c.inputMass*GRAVITY*dsIn;
    const traveled=damped?damped.travel:actualTravel(q0,q1,v0,a0,duration);
    state.pathDistanceIn+=m.J.input*traveled;
    state.pathDistanceOut+=m.J.output*traveled;
    if(impact || proposal<bound.min || proposal>bound.max) {
      // Only work up to the actual stop is credited. The stop absorbs KE;
      // there is no bounce or energy gained from overshooting. Heat dissipated
      // before impact is accounted separately from the stop's absorbed energy.
      const impactKE=Math.max(0,.5*m.M*v0*v0+workIn+pointerWork-workOut-dampingLoss);
      state.stopEnergyLoss+=impactKE;state.impactCount++;state.v=0;state.atLimit=true;
    } else {
      state.v=damped?damped.v:v0+.5*(a0+m.acceleration(q1,pointer.Q))*h;
    }
    state.q=q1;state.time+=h;
  }
  state.lastForce=c.force;
  return state;
}

export function readout(state,config,external=undefined) {
  const c=normalizeConfig(config),bound=limits(c),m=model(c,external??state.requestedExternal??{});
  const q=clamp(finite(state.q,bound.min),bound.min,bound.max),v=finite(state.v,0);
  const q0=finite(state.q0,q),now=coordinates(q,c,m.R),start=coordinates(q0,c,m.R);
  const inputWeight=c.inputMass*GRAVITY,outputWeight=m.weight;
  const inputForce=m.drive,requiredInputForce=outputWeight/m.R;
  const kineticEnergy=.5*m.M*v*v;
  const workIn=finite(state.workIn,0),workOut=finite(state.workOut,0),pointerWork=finite(state.pointerWork,0),stopEnergyLoss=finite(state.stopEnergyLoss,0);
  const dampingEnergyLoss=finite(state.dampingEnergyLoss,0);
  const residual=workIn+pointerWork-workOut-(kineticEnergy-finite(state.initialKineticEnergy,0))-stopEnergyLoss-dampingEnergyLoss;
  const pointer=actualPointer(m,q,v,bound);
  const baseBalanceError=inputForce-requiredInputForce;
  const balanceError=baseBalanceError+pointer.Q/(c.type==='lever'?c.rIn*Math.cos(q):1);
  const inputSpeed=now.inJacobian*v,outputSpeed=now.outJacobian*v;
  const damper=dampingForce(m,v,pointer);
  const freeAcceleration=acceleration(m,q,v,pointer);
  const heldAtStop=Math.abs(v)<1e-10&&((q<=bound.min+1e-12&&freeAcceleration<0)||(q>=bound.max-1e-12&&freeAcceleration>0));
  const a=heldAtStop?0:freeAcceleration;
  const inputAcceleration=c.type==='lever'?c.rIn*(Math.cos(q)*a-Math.sin(q)*v*v):a;
  const outputAcceleration=c.type==='lever'?c.rOut*(Math.cos(q)*a-Math.sin(q)*v*v):a/m.R;
  const inputTension=c.type==='lever'?null:c.force+c.inputMass*(GRAVITY-inputAcceleration)+pointer.input;
  const pathDisplacementIn=m.J.input*(q-q0),pathDisplacementOut=m.J.output*(q-q0);
  return {
    q,velocity:v,positionFraction:(q-bound.min)/bound.range,
    inputDistance:now.input,outputDistance:now.output,
    displacementIn:now.input-start.input,displacementOut:now.output-start.output,
    pathDisplacementIn,pathDisplacementOut,
    pathDistanceIn:finite(state.pathDistanceIn,Math.abs(pathDisplacementIn)),
    pathDistanceOut:finite(state.pathDistanceOut,Math.abs(pathDisplacementOut)),
    inputPathSpeed:m.J.input*v,outputPathSpeed:m.J.output*v,
    inputPathAcceleration:m.J.input*a,outputPathAcceleration:m.J.output*a,
    inputSpeed,outputSpeed,inputAcceleration,outputAcceleration,inputForce,driveForce:inputForce,
    inputTension,appliedForce:c.force,inputWeight,outputWeight,
    externalInputForce:pointer.input,externalOutputForce:pointer.output,
    requestedInputForce:m.rawRequested.input,requestedOutputForce:m.rawRequested.output,
    pointerForceScale:pointer.scale,forceLimited:pointer.forceLimited,
    netGeneralizedForce:m.M*freeAcceleration,pointerGeneralizedForce:pointer.Q,
    damping:c.damping,dampingGeneralizedForce:damper.actual,
    requestedDampingGeneralizedForce:damper.requested,
    dampingOutputForce:damper.actual/m.J.output,dampingLimited:damper.limited,
    inputMass:c.inputMass,outputMass:c.outputMass,requiredInputForce,
    additionalRequiredForce:requiredInputForce-inputWeight,
    ma:m.R,idealMechanicalAdvantage:m.R,balanceError,baseBalanceError,
    balanced:Math.abs(balanceError)<1e-8*Math.max(1,requiredInputForce),
    acceleration:a,freeAcceleration,kineticEnergy,workIn,workOut,pointerWork,
    appliedWork:finite(state.appliedWork,0),inputGravityWork:finite(state.inputGravityWork,0),
    stopEnergyLoss,dampingEnergyLoss,energyResidual:residual,atLimit:heldAtStop||!!state.atLimit,
    direction:Math.abs(outputSpeed)<1e-6?'still':outputSpeed>0?'lifting':'lowering',
    time:finite(state.time,0),gravity:GRAVITY,
    modelNote:(c.type==='hydraulic'?'Incompressible liquid; fluid inertia and height-pressure differences ignored.':'Massless machine and rope.')+
      (c.damping>0?' Viscous output resistance converts motion energy to heat.'+
        (c.type==='lever'?'':' Resistance is limited to preserve tension or supported contact.'):' No friction.'),
  };
}
