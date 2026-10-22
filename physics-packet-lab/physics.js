/* SI-unit analytic models. Rendering and playback never change the calculations. */
const finite=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const positive=(v,d=1)=>Math.max(1e-9,finite(v,d));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const q=(key,label,unit)=>({key,label,unit});
export const format=(value,digits)=>{if(!Number.isFinite(value))return '—';const precision=digits??(Math.abs(value)>0&&Math.abs(value)<.1?4:2);return Number(value.toFixed(precision)).toLocaleString('en-US',{maximumFractionDigits:precision});};
function pathLength(vi,a,t){const turn=a!==0?-vi/a:-1;const x=u=>vi*u+.5*a*u*u;return turn>0&&turn<t?Math.abs(x(turn))+Math.abs(x(t)-x(turn)):Math.abs(x(t));}
function motion(p){
 let time=p.startTime!==undefined&&p.endTime!==undefined?finite(p.endTime)-finite(p.startTime):p.time;
 const suppliedA=p.acceleration??p.a;let vi=p.vi??p.initialVelocity,vf=p.vf??p.finalVelocity;
 if(time===undefined&&suppliedA!==undefined&&finite(suppliedA)!==0)time=(finite(vf)-finite(vi))/finite(suppliedA);
 time=positive(time,5);if(vi===undefined&&vf!==undefined&&suppliedA!==undefined)vi=finite(vf)-finite(suppliedA)*time;
 vi=finite(vi);const a=suppliedA!==undefined?finite(suppliedA):(finite(vf,vi)-vi)/time;
 return {time,vi,a,vf:vi+a*time};
}
function uniform(p){let time=p.time,speed=p.speed,distance=p.distance;if(time===undefined)time=finite(distance)/positive(speed);time=positive(time,5);if(speed===undefined)speed=finite(distance)/time;return{time,speed:finite(speed),distance:finite(speed)*time};}
function route(p,id){const start=finite(p.start),end=finite(p.end),turn=id==='P02'?end:finite(p.turn),speed=positive(p.speed,1.5);const d1=Math.abs(turn-start),d2=Math.abs(end-turn);return{start,turn,end,speed,d1,d2,distance:d1+d2,duration:Math.max(.1,(d1+d2)/speed)};}
function piecewise(p){const ts=positive(p.timeScale,1),ds=positive(p.distanceScale,1),times=(p.times||[0,10,20,30]).map(x=>x*ts),positions=(p.positions||[0,12,12,30]).map(x=>x*ds);return{times,positions,duration:positive(times.at(-1)-times[0]),distance:positions.slice(1).reduce((s,x,i)=>s+Math.abs(x-positions[i]),0)};}
function circular(p){const radius=p.orbital?positive(p.orbitAU,1)*149600000000:positive(p.radius,4),speed=p.orbital?Math.sqrt(1.3271244e20/radius):positive(p.speed,2);return{radius,speed,omega:speed/radius,duration:2*Math.PI*radius/speed*positive(p.laps,1)};}
const isFlight=(problem,p)=>p.flight2D===true||['airplane','modelplanes'].includes(problem.simulation.scene);
function planeSpec(problem,p,index=0){
 const g=positive(p.g,10),mass=index?positive(p.compareMass):p.weight!==undefined?positive(p.weight)/g:positive(p.mass,1200),weight=mass*g;
 const drag=Math.max(0,finite(p.backwardForce,p.drag??0)),thrust=p.netForce!==undefined?drag+finite(p.netForce):finite(p.forwardForce,p.thrust??0);
 const lift=index?finite(p.compareLift,p.upwardForce2??weight):finite(p.upwardForce,p.lift??weight),fx=thrust-drag,fy=lift-weight;
 const vx0=finite(index?p.compareVi??p.vi:p.vi),vy0=finite(index?p.compareVy??p.vy:p.vy),x0=finite(index?p.compareX??p.x0:p.x0),y0=finite(index?p.compareHeight??(finite(p.height,100)+20):p.height,problem.simulation.scene==='airplane'?250:100);
 return{mass,weight,lift,thrust,drag,fx,fy,ax:fx/mass,ay:fy/mass,vx0,vy0,x0,y0};
}
// Exact integral of |v0 + a t| for a fixed two-dimensional acceleration.
function planePathLength(vx,vy,ax,ay,t){
 const A=Math.hypot(ax,ay);if(A<1e-12)return Math.hypot(vx,vy)*t;
 const u0=(vx*ax+vy*ay)/A,u1=u0+A*t,b2=Math.max(0,vx*vx+vy*vy-u0*u0);
 if(A*t<1e-6*Math.max(1,Math.abs(u0)))return Math.hypot(vx+ax*t/2,vy+ay*t/2)*t;
 const integral=u=>b2<1e-16?.5*u*Math.abs(u):.5*(u*Math.hypot(u,Math.sqrt(b2))+b2*Math.asinh(u/Math.sqrt(b2)));
 return Math.max(0,(integral(u1)-integral(u0))/A);
}
function planeBody(problem,p,index,t){
 const f=planeSpec(problem,p,index),x=f.x0+f.vx0*t+.5*f.ax*t*t,y=f.y0+f.vy0*t+.5*f.ay*t*t,vx=f.vx0+f.ax*t,vy=f.vy0+f.ay*t;
 return{x,y,vx,vy,ax:f.ax,ay:f.ay,v:vx,a:f.ax,vX:vx,vY:vy,aX:f.ax,aY:f.ay,speed:Math.hypot(vx,vy),mass:f.mass,weight:f.weight,lift:f.lift,thrust:f.thrust,drag:f.drag,netForce:f.fx,netForceX:f.fx,netForceY:f.fy,verticalNet:f.fy,altitude:y,distance:planePathLength(f.vx0,f.vy0,f.ax,f.ay,t),label:index?'Orange plane':'Blue plane',kineticEnergy:.5*f.mass*(vx*vx+vy*vy)};
}
function forceMotion(p,kind){
 const vertical=p.axis==='vertical',g=positive(p.g,10),givenNet=p.netForce??p.force;
 let mass,forward,backward,net;
 if(vertical){
  mass=p.mass!==undefined?positive(p.mass):p.weight!==undefined?positive(p.weight)/g:positive(finite(givenNet)/positive(p.acceleration));
  backward=p.weight!==undefined?positive(p.weight):mass*g;
  forward=p.upwardForce!==undefined?finite(p.upwardForce):backward+finite(givenNet,mass*finite(p.acceleration));net=forward-backward;
 }else{
  const candidate=givenNet!==undefined?finite(givenNet):finite(p.forwardForce)-finite(p.backwardForce);
  mass=p.balancedFlight?positive(p.weight,12000)/g:positive(p.mass,p.acceleration?candidate/p.acceleration:10);
  forward=finite(p.forwardForce,givenNet??mass*finite(p.acceleration));backward=finite(p.backwardForce,p.kineticFriction??0);
  if(p.steady||p.balancedFlight)backward=forward;
  net=forward-backward;
 }
 const vi=finite(p.vi),staticLimit=Math.max(0,finite(p.staticLimit)),stuck=kind==='friction'&&Math.abs(vi)<1e-9&&staticLimit>0&&Math.abs(forward)<=staticLimit;
 if(stuck){backward=forward;net=0;}
 const a=net/mass,frictionStop=kind==='friction'&&vi*a<0,stop=frictionStop?-vi/a:Infinity;
 return{mass,forward,backward,net,a,vi,stuck,stop,time:positive(p.time,5),vertical,height:Math.max(0,finite(p.height))};
}
function landingTime(height,vi,a){
 if(height<=0&&vi<=0&&a<=0)return 0;
 if(Math.abs(a)<1e-12)return vi<0?-height/vi:Infinity;
 const disc=vi*vi-2*a*height;if(disc<0)return Infinity;
 const roots=[(-vi-Math.sqrt(disc))/a,(-vi+Math.sqrt(disc))/a].filter(t=>t>=0&&vi+a*t<0);
 return roots.length?Math.min(...roots):Infinity;
}
function collision(p){
 const m1=positive(p.mass1,.1),m2=positive(p.mass2,.1),v1=finite(p.velocity1,2),v2=finite(p.velocity2),rel=v1-v2;
 const r1=positive(p.radius1,.1),r2=positive(p.radius2,.1),R=r1+r2,tc=positive(p.collisionTime,1),M=m1+m2,mu=m1*m2/M,vcm=(m1*v1+m2*v2)/M;
 const e=clamp(finite(p.restitution),0,1),contactDuration=Math.min(positive(p.contactDuration,.01),rel>0?.4*R/rel:1),duration=p.preImpact?tc:positive(p.time,3);
 const initial1=-(R+Math.max(0,rel)*tc)/2,initial2=-initial1;
 return{m1,m2,v1,v2,rel,r1,r2,R,tc,M,mu,vcm,e,contactDuration,duration,initial1,initial2,collides:rel>0};
}
function collisionState(p,t){
 const m=collision(p),tt=clamp(t,0,m.duration),tau=tt-m.tc;let x1=m.initial1+m.v1*tt,x2=m.initial2+m.v2*tt,v1=m.v1,v2=m.v2,a1=0,a2=0,compression=0,F=0,contact=false,phase=p.preImpact?'pre-impact':'approach';
 if(m.collides&&!p.preImpact&&tau>=0){
  const d=m.contactDuration,cm0=(m.m1*(m.initial1+m.v1*m.tc)+m.m2*(m.initial2+m.v2*m.tc))/m.M;
  if(tau<d){
   contact=true;phase='contact';let relV;
   if(m.e===0){compression=m.rel*tau-.5*m.rel*tau*tau/d;relV=m.rel*(1-tau/d);F=m.mu*m.rel/d;}
   else{const omega=Math.PI/d;compression=m.rel/omega*Math.sin(omega*tau);relV=m.rel*Math.cos(omega*tau);F=m.mu*omega*omega*compression;}
   x1=cm0+m.vcm*tau-m.m2/m.M*(m.R-compression);x2=cm0+m.vcm*tau+m.m1/m.M*(m.R-compression);
   v1=m.vcm+m.m2/m.M*relV;v2=m.vcm-m.m1/m.M*relV;a1=-F/m.m1;a2=F/m.m2;
  }else{
   const vf1=m.vcm-m.e*m.m2/m.M*m.rel,vf2=m.vcm+m.e*m.m1/m.M*m.rel;
   compression=m.e===0?.5*m.rel*d:0;const sep=m.R-compression;
   x1=cm0+m.vcm*d-m.m2/m.M*sep+vf1*(tau-d);x2=cm0+m.vcm*d+m.m1/m.M*sep+vf2*(tau-d);v1=vf1;v2=vf2;
   contact=m.e===0;phase=contact?'together':'separated';
  }
 }
 const bodies=[{x:x1,v:v1,a:a1,mass:m.m1,radius:m.r1,label:p.bodyLabels?.[0]||'Object 1'},{x:x2,v:v2,a:a2,mass:m.m2,radius:m.r2,label:p.bodyLabels?.[1]||'Object 2'}];
 bodies.forEach((b,i)=>{const v0=i?m.v2:m.v1,initial=i?m.initial2:m.initial1;b.distance=Math.abs(b.x-initial);if(tt>m.tc&&v0*b.v<0){const omega=Math.PI/m.contactDuration,cross=Math.acos(clamp((i?1:-1)*m.vcm*m.M/((i?m.m1:m.m2)*m.rel),-1,1))/omega;if(cross>=0&&cross<=m.contactDuration&&tt>m.tc+cross){const turn=collisionState(p,m.tc+cross).bodies[i].x;b.distance=Math.abs(turn-initial)+Math.abs(b.x-turn);}}});
 return{...m,t:tt,bodies,contact,collisionPhase:phase,compression,contactForce:F,collided:!p.preImpact&&tt>=m.tc,collisionTime:m.tc,contactDuration:m.contactDuration,totalMomentum:m.m1*v1+m.m2*v2,momentum1:m.m1*v1,momentum2:m.m2*v2,kineticEnergy:.5*m.m1*v1*v1+.5*m.m2*v2*v2};
}
export function solve(problem,p,quantity=problem.numericAnswer?.quantity){
 let value=NaN,unit='',formula='',steps=[];const kind=problem.simulation.kind;
 if(kind==='route'){const r=route(p,problem.id);if(/displacement/i.test(quantity)){value=r.end-r.start;unit='m';formula='displacement = final position − starting position';steps=[`${format(r.end)} − (${format(r.start)}) = ${format(value)} m`];}else{value=r.distance;unit='m';formula='distance = first path length + second path length';steps=[`${format(r.d1)} + ${format(r.d2)} = ${format(value)} m`];}}
 else if(kind==='piecewise'){const r=piecewise(p);value=quantity==='distance'?r.distance:r.distance/r.duration;unit=quantity==='distance'?'m':'m/s';formula=quantity==='distance'?'distance = sum of path lengths':'average speed = total distance ÷ total elapsed time';steps=quantity==='distance'?[`Add the path lengths: ${r.positions.slice(1).map((x,i)=>format(Math.abs(x-r.positions[i]))).join(' + ')} = ${format(r.distance)} m.`]:[`${format(r.distance)} m ÷ ${format(r.duration)} s = ${format(r.distance/r.duration)} m/s`];}
 else if(kind==='uniform'){const u=uniform(p);
  if(quantity==='time'){value=u.time;unit='s';formula='time = distance ÷ speed';steps=u.speed!==0?[`${format(u.distance)} m ÷ ${format(u.speed)} m/s = ${format(u.time)} s.`]:[`Elapsed time is given as ${format(u.time)} s. Zero distance at zero speed cannot determine time by division.`];}
  else if(quantity==='distance'){value=u.distance;unit='m';formula='distance = speed × time';steps=[`${format(u.speed)} m/s × ${format(u.time)} s = ${format(u.distance)} m.`];}
  else{value=u.speed;unit='m/s';formula='speed = distance ÷ time';steps=[`${format(u.distance)} m ÷ ${format(u.time)} s = ${format(u.speed)} m/s.`];}
 }
 else if(kind==='acceleration'){const m=motion(p);if(['finalVelocity','vf'].includes(quantity)){value=m.vf;unit='m/s';formula='final velocity = initial velocity + acceleration × time';steps=[`${format(m.vi)} + ${format(m.a)} × ${format(m.time)} = ${format(value)} m/s`];}else if(['initialVelocity','vi'].includes(quantity)){value=m.vi;unit='m/s';formula='initial velocity = final velocity − acceleration × time';}else if(quantity==='time'){value=m.time;unit='s';formula='time = change in velocity ÷ acceleration';}else{value=m.a;unit='m/s²';formula='acceleration = (final velocity − initial velocity) ÷ elapsed time';steps=[`Elapsed time = ${p.startTime!==undefined?`${format(p.endTime)} − ${format(p.startTime)} = `:''}${format(m.time)} s.`,`(${format(m.vf)} − ${format(m.vi)}) ÷ ${format(m.time)} = ${format(value)} m/s²`];}}
 else if(kind==='gravity'){value=positive(p.mass)*positive(p.g,10);unit='N';formula='weight = mass × gravitational field strength';steps=[`${format(p.mass)} × ${format(p.g)} = ${format(value)} N downward.`,`At rest, the scale provides ${format(value)} N upward, so net force is zero.`];}
 else if(isFlight(problem,p)){
  const f=planeSpec(problem,p,0),vertical=['verticalNet','netForceY','verticalAcceleration','ay'].includes(quantity);
  if(['mass'].includes(quantity)){value=f.mass;unit='kg';formula='mass = weight ÷ gravitational field strength';}
  else if(['acceleration','ax','verticalAcceleration','ay'].includes(quantity)){value=vertical?f.ay:f.ax;unit='m/s²';formula=vertical?'vertical acceleration = (lift − weight) ÷ mass':'horizontal acceleration = (thrust − drag) ÷ mass';}
  else{value=vertical?f.fy:f.fx;unit='N';formula=vertical?'vertical net force = lift − weight':'horizontal net force = thrust − drag';}
  steps=[`Horizontal: (${format(f.thrust)} − ${format(f.drag)}) ÷ ${format(f.mass)} = ${format(f.ax)} m/s².`,`Vertical: (${format(f.lift)} − ${format(f.weight)}) ÷ ${format(f.mass)} = ${format(f.ay)} m/s².`];
 }
 else if(['friction','netforce','newton2'].includes(kind)){const f=forceMotion(p,kind);if(quantity==='frictionForce'){value=f.backward;unit='N';
   if(p.steady){formula='steady velocity: friction magnitude = push magnitude';steps=['Steady straight-line velocity means acceleration is zero, so net force is 0 N.',`${format(f.forward)} N right − friction = 0 N.`,`Friction = ${format(f.forward)} N left.`];}
   else{formula='net force = push − sliding friction';steps=[`Proposed sliding friction: ${format(f.backward)} N left.`,`Net force = ${format(f.forward)} − ${format(f.backward)} = ${format(f.net)} N.`];}
  }else if(quantity==='mass'){value=f.mass;unit='kg';formula='mass = net force ÷ acceleration';steps=[`${format(f.net)} ÷ ${format(f.a)} = ${format(value)} kg`];}else if(quantity==='acceleration'){value=f.a;unit='m/s²';formula='acceleration = net force ÷ mass';steps=[`Net force = ${format(f.forward)} − ${format(f.backward)} = ${format(f.net)} N.`,`${format(f.net)} ÷ ${format(f.mass)} = ${format(value)} m/s²`];}else{value=f.net;unit='N';formula=f.vertical?'net force = upward force − weight':'net force = positive-direction force − opposing force';steps=[`${format(f.forward)} − ${format(f.backward)} = ${format(value)} N (${f.vertical?'up':'right'} is positive).`];}}
 else if(kind==='momentum'){const m=collision(p);value=quantity==='momentum1'?m.m1*m.v1:quantity==='momentum2'?m.m2*m.v2:m.m1*m.v1+m.m2*m.v2;unit='kg·m/s';formula='total system momentum = m₁v₁ + m₂v₂';steps=[`(${format(m.m1)} × ${format(m.v1)}) + (${format(m.m2)} × ${format(m.v2)}) = ${format(m.m1*m.v1+m.m2*m.v2)} kg·m/s.`,p.preImpact?'The stationary pin contributes zero momentum.':'With no external horizontal force, total momentum has the same value before and after.'];}
 else if(kind==='circular'){const c=circular(p);value=c.speed*c.speed/c.radius;unit='m/s²';formula='inward acceleration = speed² ÷ radius';}
 return{value,unit,formula,steps};
}
export function evaluate(problem,p,time){
 const k=problem.simulation.kind;let t=Math.max(0,finite(time)),x=0,v=0,a=0,bodies=[],forces=[],readouts=[],axis='horizontal',extra={};
 if(k==='route'){
  const r=route(p,problem.id);t=Math.min(t,r.duration);const d=Math.min(r.distance,r.speed*t);
  if(d<r.d1){x=r.start+Math.sign(r.turn-r.start)*d;v=Math.sign(r.turn-r.start)*r.speed;}else{x=r.turn+Math.sign(r.end-r.turn)*(d-r.d1);v=Math.sign(r.end-r.turn)*r.speed;}
  extra={distance:d,displacement:x-r.start};readouts=[{label:'Position',value:x,unit:'m'},{label:'Distance traveled',value:d,unit:'m'},{label:'Displacement',value:x-r.start,unit:'m'}];
 }else if(k==='piecewise'){
  const r=piecewise(p);t=Math.min(t,r.duration);let i=r.times.findIndex((z,j)=>j<r.times.length-1&&t+r.times[0]<r.times[j+1]);if(i<0)i=r.times.length-2;
  v=(r.positions[i+1]-r.positions[i])/(r.times[i+1]-r.times[i]);x=r.positions[i]+v*(t+r.times[0]-r.times[i]);
  let distance=0;for(let j=0;j<i;j++)distance+=Math.abs(r.positions[j+1]-r.positions[j]);distance+=Math.abs(x-r.positions[i]);
  extra={distance,interval:i,averageSpeed:r.distance/r.duration};readouts=[{label:'Distance traveled',value:distance,unit:'m'},{label:'Speed',value:Math.abs(v),unit:'m/s'},{label:'Trip average speed',value:r.distance/r.duration,unit:'m/s'}];
 }else if(k==='uniform'){
  const u=uniform(p);t=Math.min(t,u.time);const ref=p.frame!==undefined?(Number(p.frame)===1?u.speed:0):finite(p.referenceSpeed);v=u.speed-ref;x=v*t;
  if(p.otherSpeed!==undefined)bodies=[{x:u.speed*t,v:u.speed,a:0,mass:1,label:'Blue'},{x:finite(p.otherSpeed)*t,v:finite(p.otherSpeed),a:0,mass:1,label:'Orange'}];
  const train=problem.simulation.scene==='train';extra={distance:Math.abs(v*t),referenceSpeed:ref,trainSpeed:u.speed,groundX:u.speed*t,frame:p.frame??(ref===u.speed?1:0)};
  readouts=train?[{label:'Passenger vs. platform',value:u.speed,unit:'m/s'},{label:'Passenger vs. train',value:0,unit:'m/s'},{label:'In selected frame',value:v,unit:'m/s'}]:[{label:'Distance',value:Math.abs(x),unit:'m'},{label:'Speed',value:Math.abs(v),unit:'m/s'},{label:'Velocity',value:v,unit:'m/s'}];
 }else if(k==='acceleration'){
  const m=motion(p);t=Math.min(t,m.time);a=m.a;v=m.vi+a*t;x=m.vi*t+.5*a*t*t;extra={distance:pathLength(m.vi,a,t),clockTime:finite(p.startTime)+t};readouts=[{label:'Velocity',value:v,unit:'m/s'},{label:'Acceleration',value:a,unit:'m/s²'},{label:'Elapsed time',value:t,unit:'s'}];
 }else if(k==='gravity'){
  axis='vertical';const mass=positive(p.mass),g=positive(p.g,10),weight=mass*g,springK=positive(p.springK,500);t=Math.min(t,5);x=0;
  forces=[{body:0,value:-weight,axis:'vertical',label:'Weight'},{body:0,value:weight,axis:'vertical',label:'Scale force'}];
  bodies=[{x:0,v:0,a:0,mass,label:problem.simulation.scene==='astronaut'?'Astronaut':'Instrument'}];extra={supported:true,mass,weight,compareWeight:p.compareG!==undefined?mass*positive(p.compareG):undefined,springK,springExtension:weight/springK,compareSpringExtension:p.compareG!==undefined?mass*positive(p.compareG)/springK:undefined,netForce:0,distance:0};
  readouts=p.compareG!==undefined?[{label:'Weight on other planet',value:weight,unit:'N'},{label:'Weight on Earth',value:extra.compareWeight,unit:'N'},{label:'Mass in both places',value:mass,unit:'kg'}]:[{label:'Scale reading',value:weight,unit:'N'},{label:'Mass',value:mass,unit:'kg'},{label:'Net force at rest',value:0,unit:'N'}];
 }else if(isFlight(problem,p)){
  t=Math.min(t,positive(p.time,5));axis='2d';bodies=[planeBody(problem,p,0,t)];if(p.compareMass!==undefined)bodies.push(planeBody(problem,p,1,t));
  bodies.forEach((b,i)=>forces.push({body:i,value:b.thrust,axis:'horizontal',label:'Thrust'},{body:i,value:-b.drag,axis:'horizontal',label:'Drag'},{body:i,value:b.lift,axis:'vertical',label:'Lift'},{body:i,value:-b.weight,axis:'vertical',label:'Weight'}));
  const b=bodies[0];x=b.x;v=b.vx;a=b.ax;extra={flight2D:true,y:b.y,vx:b.vx,vy:b.vy,ax:b.ax,ay:b.ay,vX:b.vx,vY:b.vy,aX:b.ax,aY:b.ay,speed:b.speed,altitude:b.y,mass:b.mass,weight:b.weight,upwardForce:b.lift,netForce:b.netForceX,netForceX:b.netForceX,netForceY:b.netForceY,verticalNet:b.netForceY,distance:b.distance,kineticEnergy:bodies.reduce((sum,body)=>sum+body.kineticEnergy,0)};
  readouts=bodies.length>1?[{label:'Blue horizontal a',value:b.ax,unit:'m/s²'},{label:'Orange horizontal a',value:bodies[1].ax,unit:'m/s²'},{label:'Orange vertical velocity',value:bodies[1].vy,unit:'m/s'}]:[{label:'Horizontal net force',value:b.netForceX,unit:'N'},{label:'Vertical net force',value:b.netForceY,unit:'N'},{label:'Vertical velocity',value:b.vy,unit:'m/s'}];
 }else if(['friction','netforce','newton2'].includes(k)){
  const f=forceMotion(p,k);t=Math.min(t,f.time);axis=f.vertical?'vertical':'horizontal';const landing=f.vertical&&p.ground?landingTime(f.height,f.vi,f.a):Infinity,stop=Math.min(f.stop,landing),hitGround=t>=landing,relaunch=hitGround&&f.a>0,stopped=t>=stop&&!relaunch,mt=Math.min(t,stop);
  x=(f.vertical?f.height:0)+f.vi*mt+.5*f.a*mt*mt;v=stopped?0:f.vi+f.a*t;a=stopped?0:f.a;
  if(relaunch){const after=t-landing;x=.5*f.a*after*after;v=f.a*after;a=f.a;}
  let forward=f.forward,backward=f.backward;forces=[{body:0,value:forward,axis,label:f.vertical?(problem.simulation.scene==='balloon'?'Buoyancy':problem.simulation.scene==='bird'?'Air force':'Rotor force'):p.balancedFlight?'Thrust':problem.simulation.scene==='modelplanes'?'Net force':'Push'},{body:0,value:-backward,axis,label:f.vertical?'Weight':k==='friction'?'Friction':p.balancedFlight?'Drag':'Opposing force'}];
  if(stopped&&f.vertical){x=0;forces.push({body:0,value:Math.max(0,backward-forward),axis,label:'Ground support'});}else if(stopped&&k==='friction'){backward=forward;forces[1].value=-backward;}
  bodies=[{x,v,a,mass:f.mass,label:problem.simulation.scene||'Object'}];
  if(p.compareMass!==undefined){const mass=positive(p.compareMass),a2=f.net/mass;bodies.push({x:f.vi*t+.5*a2*t*t,v:f.vi+a2*t,a:a2,mass,label:'Plane 2'});forces.push({body:1,value:f.net,axis:'horizontal',label:'Same net force'});}
  if(p.balancedFlight){const weight=positive(p.weight,12000);forces.push({body:0,value:weight,axis:'vertical',label:'Lift'},{body:0,value:-weight,axis:'vertical',label:'Weight'});}
  const net=stopped?0:forward-backward;extra={stuck:f.stuck,stopped,grounded:stopped&&f.vertical,mass:f.mass,netForce:net,weight:f.vertical?backward:finite(p.weight),upwardForce:f.vertical?forward:finite(p.weight),verticalNet:f.vertical?net:0,distance:pathLength(f.vi,f.a,mt)+(relaunch?.5*f.a*(t-landing)**2:0)};
  readouts=p.balancedFlight?[{label:'Horizontal net force',value:0,unit:'N'},{label:'Vertical net force',value:0,unit:'N'},{label:'Forward velocity',value:v,unit:'m/s'}]:p.compareMass!==undefined?[{label:'Same net force (each)',value:f.net,unit:'N'},{label:'Blue acceleration',value:a,unit:'m/s²'},{label:'Orange acceleration',value:bodies[1].a,unit:'m/s²'}]:[{label:'Net force',value:net,unit:'N'},{label:'Acceleration',value:a,unit:'m/s²'},{label:problem.id==='P26'?'Mass':f.vertical?'Vertical velocity':'Velocity',value:problem.id==='P26'?f.mass:v,unit:problem.id==='P26'?'kg':'m/s'}];
 }else if(k==='momentum'){
  const s=collisionState(p,t);t=s.t;bodies=s.bodies;x=bodies[0].x;v=bodies[0].v;a=bodies[0].a;
  forces=s.contactForce>0?[{body:0,value:-s.contactForce,axis:'horizontal',label:'Force on 1'},{body:1,value:s.contactForce,axis:'horizontal',label:'Force on 2'}]:[];
  extra={contact:s.contact,collided:s.collided,collisionTime:s.collisionTime,contactDuration:s.contactDuration,collisionPhase:s.collisionPhase,compression:s.compression,totalMomentum:s.totalMomentum,momentum1:s.momentum1,momentum2:s.momentum2,kineticEnergy:s.kineticEnergy,force:s.contactForce,force1:-s.contactForce,force2:s.contactForce,distance:bodies[0].distance};
  readouts=[{label:'Momentum 1',value:s.momentum1,unit:'kg·m/s'},{label:'Momentum 2',value:s.momentum2,unit:'kg·m/s'},{label:'Total system momentum',value:s.totalMomentum,unit:'kg·m/s'}];
 }else if(k==='circular'){
  const c=circular(p);t=Math.min(t,c.duration);const theta=c.omega*t;x=c.radius*Math.cos(theta);v=-c.speed*Math.sin(theta);a=-c.speed*c.speed/c.radius*Math.cos(theta);
  extra={radius:c.radius,speed:c.speed,theta,distance:c.speed*t,displacement:Math.hypot(x-c.radius,c.radius*Math.sin(theta)),y:c.radius*Math.sin(theta),vy:c.speed*Math.cos(theta),ay:-c.speed*c.speed/c.radius*Math.sin(theta),inwardAcceleration:c.speed*c.speed/c.radius,orbitDays:t/86400};
  readouts=p.orbital?[{label:'Orbital speed',value:c.speed/1000,unit:'km/s'},{label:'Elapsed time',value:t/86400,unit:'days'},{label:'Inward acceleration',value:c.speed*c.speed/c.radius,unit:'m/s²'}]:problem.id==='P03'?[{label:'Distance traveled',value:extra.distance,unit:'m'},{label:'Displacement size',value:extra.displacement,unit:'m'},{label:'Speed',value:c.speed,unit:'m/s'}]:[{label:'Speed',value:c.speed,unit:'m/s'},{label:'Radius',value:c.radius,unit:'m'},{label:'Inward net force',value:positive(p.mass,75)*c.speed*c.speed/c.radius,unit:'N'}];
 }
 if(!bodies.length)bodies=[{x,v,a,mass:finite(p.mass,1),label:'Object'}];
 bodies.forEach((b,i)=>{if(b.distance===undefined)b.distance=k==='uniform'?Math.abs(b.v*t):i===0?(extra.distance??Math.abs(x)):pathLength(finite(p.vi),b.a,t);});
 return{t,x,v,a,speed:Math.abs(v),distance:extra.distance??Math.abs(x),bodies,forces,readouts,axis,...extra};
}
export function modelInfo(problem,p){
 const k=problem.simulation.kind;let duration=5,quantities=[],graphQuantities=[q('x','Position','m'),q('v','Velocity','m/s'),q('speed','Speed','m/s'),q('distance','Distance','m'),q('a','Acceleration','m/s²')],graphKey='x',isStatic=false,eventTimes=[];
 if(k==='route'){duration=route(p,problem.id).duration;quantities=[q('distance','Total distance','m'),q('displacement','Displacement','m')];graphKey='distance';}
 else if(k==='piecewise'){duration=piecewise(p).duration;quantities=[q('averageSpeed','Average speed','m/s'),q('distance','Total distance','m')];graphKey='distance';graphQuantities=graphQuantities.filter(q=>q.key!=='a');}
 else if(k==='uniform'){duration=uniform(p).time;quantities=[q('speed','Speed','m/s'),q('distance','Distance','m'),q('time','Time','s')];graphKey=['P07','P16'].includes(problem.id)?'speed':'x';}
 else if(k==='acceleration'){duration=motion(p).time;quantities=[q('acceleration','Acceleration','m/s²'),q('finalVelocity','Final velocity','m/s'),q('initialVelocity','Initial velocity','m/s'),q('time','Time','s')];graphKey=problem.id==='P14'?'speed':'v';}
 else if(k==='gravity'){duration=5;quantities=[q('weight','Weight','N')];isStatic=true;graphKey='weight';graphQuantities=[q('weight','Weight comparison','N')];}
 else if(['friction','netforce','newton2'].includes(k)){duration=positive(p.time,5);quantities=[q('netForce','Net force','N'),q('acceleration','Acceleration','m/s²')];if(k==='newton2')quantities.push(q('mass','Mass','kg'));if(p.steady)quantities.unshift(q('frictionForce','Sliding friction','N'));graphQuantities.unshift(q('netForce','Net force','N'));graphKey=p.axis==='vertical'?'v':k==='friction'?'netForce':'v';}
 else if(k==='momentum'){const m=collision(p);duration=m.duration;quantities=[q('totalMomentum','Total system momentum','kg·m/s')];graphKey='totalMomentum';graphQuantities=[q('totalMomentum','System momentum','kg·m/s'),q('momentum1','Individual momenta','kg·m/s'),q('v','Velocities','m/s'),q('force','Contact force pair','N')];if(!p.preImpact&&m.collides)eventTimes=[{label:'Contact',time:m.tc+m.contactDuration/2},{label:'After',time:Math.min(duration,m.tc+m.contactDuration+.25)}];}
 else if(k==='circular'){const c=circular(p);duration=c.duration;graphKey=problem.id==='P03'?'distance':'speed';graphQuantities=p.orbital?[q('speed','Orbital speed','km/s'),q('v','East–west velocity','km/s'),q('a','East–west acceleration','m/s²')]:graphQuantities;}
 const times=new Set([0,duration]),add=t=>{if(Number.isFinite(t)&&t>0&&t<duration)times.add(t);};
 if(k==='route'){const r=route(p,problem.id);add(r.d1/r.speed);}
 else if(k==='piecewise'){const r=piecewise(p);r.times.forEach(t=>add(t-r.times[0]));}
 else if(k==='acceleration'){const m=motion(p);add(-m.vi/m.a);}
 else if(isFlight(problem,p)){for(let i=0;i<(p.compareMass!==undefined?2:1);i++){const f=planeSpec(problem,p,i);add(-f.vx0/f.ax);add(-f.vy0/f.ay);}}
 else if(['friction','netforce','newton2'].includes(k)){const f=forceMotion(p,k);add(-f.vi/f.a);add(f.stop);if(f.vertical&&p.ground)add(landingTime(f.height,f.vi,f.a));}
 else if(k==='momentum'){const m=collision(p);add(m.tc);add(m.tc+m.contactDuration);add(m.tc+m.contactDuration/2);if(m.e===1&&m.rel>0){for(const [sign,mass] of [[-1,m.m2],[1,m.m1]]){const cosine=sign*m.vcm*m.M/(mass*m.rel);if(Math.abs(cosine)<=1)add(m.tc+Math.acos(cosine)*m.contactDuration/Math.PI);}}}
 const xs=[],ys=[];
 if(k==='circular'){const c=circular(p);xs.push(-c.radius,c.radius);ys.push(-c.radius,c.radius);}
 else for(const time of times){const s=evaluate(problem,p,time);s.bodies.forEach(b=>{xs.push(b.x-(b.radius||0),b.x+(b.radius||0));if(Number.isFinite(b.y))ys.push(b.y);});}
 let min=Math.min(0,...xs),max=Math.max(0,...xs);if(k==='route'){const r=route(p,problem.id);min=Math.min(r.start,r.turn,r.end);max=Math.max(r.start,r.turn,r.end);}
 if(max-min<1){min-=.5;max+=.5;}const pad=(max-min)*.12;
 const flight=isFlight(problem,p);let rangeY;
 if(ys.length){let low=Math.min(...ys),high=Math.max(...ys);const minimumSpan=flight?(problem.simulation.scene==='airplane'?40:20):1;if(high-low<minimumSpan){const center=(low+high)/2;low=center-minimumSpan/2;high=center+minimumSpan/2;}const margin=(high-low)*.15;rangeY=[low-margin,high+margin];}
 if(flight){graphQuantities=[q('y','Altitude','m'),q('vy','Vertical velocity','m/s'),q('ay','Vertical acceleration','m/s²'),q('v','Horizontal velocity','m/s'),q('a','Horizontal acceleration','m/s²'),q('netForceY','Vertical net force','N'),q('netForceX','Horizontal net force','N'),q('speed','Speed','m/s')];graphKey=problem.id==='P23'?'y':'a';quantities=[q('netForceX','Horizontal net force','N'),q('netForceY','Vertical net force','N'),q('acceleration','Horizontal acceleration','m/s²'),q('verticalAcceleration','Vertical acceleration','m/s²')];}

 return{duration:Math.max(.1,duration),range:[min-pad,max+pad],rangeY,flight2D:flight,quantities,graphQuantities,graphKey,static:isStatic,eventTimes,timeScale:p.orbital?86400:1,timeUnit:p.orbital?'days':'s',playbackScale:p.orbital?duration/24:duration>30?duration/20:1,notes:problem.simulation.notes||''};
}
