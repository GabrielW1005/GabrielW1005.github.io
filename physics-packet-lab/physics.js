/* Analytic SI-unit teaching models. No frame-rate-dependent integration. */
const finite=(v,d=0)=>Number.isFinite(Number(v))?Number(v):d;
const positive=(v,d=1)=>Math.max(0.000001,finite(v,d));
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const q=(key,label,unit)=>({key,label,unit});
function pathLength(vi,a,t){const turn=a!==0?-vi/a:-1;const x=u=>vi*u+.5*a*u*u;return turn>0&&turn<t?Math.abs(x(turn))+Math.abs(x(t)-x(turn)):Math.abs(x(t));}
export const format=(value,digits=2)=>Number.isFinite(value)?Number(value.toFixed(digits)).toLocaleString('en-US',{maximumFractionDigits:digits}):'—';
function motion(p){
 const suppliedA=p.acceleration??p.a;let vi=p.vi??p.initialVelocity,vf=p.vf??p.finalVelocity,time=p.time;
 if(time===undefined&&suppliedA!==undefined&&finite(suppliedA)!==0)time=(finite(vf)-finite(vi))/finite(suppliedA);
 time=positive(time,5);
 if(vi===undefined&&vf!==undefined&&suppliedA!==undefined)vi=finite(vf)-finite(suppliedA)*time;
 vi=finite(vi);const a=suppliedA!==undefined?finite(suppliedA):(finite(vf,vi)-vi)/time;
 return {time,vi,a,vf:vi+a*time};
}
function forceMotion(p,kind){
 const suppliedNet=p.netForce??p.force;
 const candidate=suppliedNet!==undefined?finite(suppliedNet):finite(p.forwardForce)-finite(p.backwardForce);
 const mass=positive(p.mass,p.acceleration?candidate/p.acceleration:10);
 let forward=finite(p.forwardForce,suppliedNet??(p.acceleration!==undefined?mass*finite(p.acceleration):0)),backward=finite(p.backwardForce,p.kineticFriction??0),vi=finite(p.vi),net=forward-backward;
 const staticLimit=Math.max(0,finite(p.staticLimit,0));
 if(p.steady){backward=forward;net=0;}
 let stuck=kind==='friction'&&Math.abs(vi)<1e-9&&staticLimit>0&&Math.abs(forward)<=staticLimit;
 if(stuck){backward=forward;net=0;}
 if(suppliedNet!==undefined&&p.forwardForce===undefined){net=finite(suppliedNet);forward=net;backward=0;}
 const a=net/mass,frictionStop=kind==='friction'&&vi*a<0,stop=frictionStop?-vi/a:Infinity;
 return {mass,forward,backward,net,a,vi,stuck,stop,time:positive(p.time,5)};
}
function uniform(p){let time=p.time,speed=p.speed,distance=p.distance;if(time===undefined)time=finite(distance)/positive(speed);time=positive(time,5);if(speed===undefined)speed=finite(distance)/time;return{time,speed:finite(speed),distance:finite(speed)*time};}
function route(p){const start=finite(p.start),turn=finite(p.turn),end=finite(p.end),speed=positive(p.speed,1.5);const d1=Math.abs(turn-start),d2=Math.abs(end-turn);return{start,turn,end,speed,d1,d2,distance:d1+d2,duration:Math.max(.1,(d1+d2)/speed)};}
function piecewise(p){const times=p.times||[0,10,20,30],positions=p.positions||[0,12,12,30];return{times,positions,duration:positive(times.at(-1)-times[0]),distance:positions.slice(1).reduce((s,x,i)=>s+Math.abs(x-positions[i]),0)};}
function momentum(p){const m1=positive(p.mass1,2),m2=positive(p.mass2,2),v1=finite(p.velocity1,2),v2=finite(p.velocity2),rel=v1-v2,tc=2,bodyGap=.7;const gap=bodyGap+Math.max(0,rel)*tc;const vf=(m1*v1+m2*v2)/(m1+m2);return{m1,m2,v1,v2,vf,tc,gap,bodyGap,collides:rel>0,time:positive(p.time,5)};}
export function solve(problem,p,quantity=problem.numericAnswer?.quantity){
 let value=NaN,unit='',formula='',steps=[];const kind=problem.simulation.kind;
 if(kind==='route'){const r=route(p);if(/displacement/i.test(quantity)){value=r.end-r.start;unit='m';formula='displacement = final position − starting position';}else if(/velocity/i.test(quantity)){value=(r.end-r.start)/r.duration;unit='m/s';formula='average velocity = displacement ÷ total time';}else{value=r.distance;unit='m';formula='distance = first path length + second path length';}}
 else if(kind==='piecewise'){const r=piecewise(p);if(quantity==='distance'){value=r.distance;unit='m';formula='distance = sum of all path lengths';}else{value=r.distance/r.duration;unit='m/s';formula='average speed = total distance ÷ total time';}}
 else if(kind==='uniform'){
  if(quantity==='time'){value=uniform(p).distance/positive(uniform(p).speed);unit='s';formula='time = distance ÷ speed';}
  else if(quantity==='distance'){value=uniform(p).distance;unit='m';formula='distance = speed × time';}
  else{value=uniform(p).speed;unit='m/s';formula='speed = distance ÷ time';}
 }
 else if(kind==='acceleration'){
  const a=motion(p).a;
  if(['finalVelocity','vf'].includes(quantity)){value=motion(p).vf;unit='m/s';formula='final velocity = initial velocity + acceleration × time';}
  else if(['initialVelocity','vi'].includes(quantity)){value=motion(p).vi;unit='m/s';formula='initial velocity = final velocity − acceleration × time';}
  else if(quantity==='time'){value=motion(p).time;unit='s';formula='time = change in velocity ÷ acceleration';}
  else{value=motion(p).a;unit='m/s²';formula='acceleration = (final velocity − initial velocity) ÷ time';}
 }
 else if(kind==='gravity'){
  if(quantity==='mass'){value=finite(p.weight)/positive(p.g,9.8);unit='kg';formula='mass = weight ÷ gravitational field strength';}
  else{value=positive(p.mass)*positive(p.g,9.8);unit='N';formula='weight = mass × gravitational field strength';}
 }
 else if(['friction','netforce','newton2'].includes(kind)){
  const f=forceMotion(p,kind);
  if(quantity==='frictionForce'){value=f.forward;unit='N';formula='steady velocity: friction magnitude = applied force magnitude';}
  else if(quantity==='mass'){value=p.mass!==undefined?f.mass:f.net/positive(p.acceleration);unit='kg';formula='mass = net force ÷ acceleration';}
  else if(quantity==='acceleration'){value=f.net/f.mass;unit='m/s²';formula='acceleration = net force ÷ mass';}
  else{value=f.net;unit='N';formula='net force = forward force − backward force';}
 }
 else if(kind==='thirdlaw'){
  if(quantity==='acceleration1'){value=finite(p.force)/positive(p.mass1);unit='m/s²';formula='acceleration of object 1 = force ÷ mass of object 1';}
  else if(quantity==='acceleration2'){value=finite(p.force)/positive(p.mass2);unit='m/s²';formula='acceleration of object 2 = force ÷ mass of object 2';}
  else{value=finite(p.force);unit='N';formula='reaction force magnitude = action force magnitude';}
 }
 else if(kind==='momentum'){
  const m=momentum(p);
  if(quantity==='finalVelocity'){value=m.vf;unit='m/s';formula='final velocity = (m₁v₁ + m₂v₂) ÷ (m₁ + m₂)';}
  else if(quantity==='totalMomentum'){value=m.m1*m.v1+m.m2*m.v2;unit='kg·m/s';formula='total momentum = m₁v₁ + m₂v₂';}
  else{value=m.m1*m.v1;unit='kg·m/s';formula='momentum = mass × velocity';}
 }
 else if(kind==='circular'){value=positive(p.speed)**2/positive(p.radius);unit='m/s²';formula='inward acceleration = speed² ÷ radius (extension)';}
 return {value,unit,formula,steps};
}
export function evaluate(problem,p,time){
 const k=problem.simulation.kind;let t=Math.max(0,finite(time)),x=0,v=0,a=0,bodies=[],forces=[],readouts=[],axis='horizontal',extra={};
 if(k==='route'){
  if(problem.id==='P02')p={...p,turn:p.end};const r=route(p);t=Math.min(t,r.duration);const d=Math.min(r.distance,r.speed*t);
  if(d<r.d1){x=r.start+Math.sign(r.turn-r.start)*d;v=Math.sign(r.turn-r.start)*r.speed;}else{x=r.turn+Math.sign(r.end-r.turn)*(d-r.d1);v=Math.sign(r.end-r.turn)*r.speed;}
  if(t>=r.duration)v=0;extra={distance:d,displacement:x-r.start};
  readouts=[{label:'Position',value:x,unit:'m'},{label:'Distance traveled',value:d,unit:'m'},{label:'Displacement',value:x-r.start,unit:'m'}];
 }else if(k==='piecewise'){
  const r=piecewise(p);t=Math.min(t,r.duration);let i=r.times.findIndex((z,j)=>j<r.times.length-1&&t+r.times[0]<r.times[j+1]);if(i<0)i=r.times.length-2;
  v=(r.positions[i+1]-r.positions[i])/(r.times[i+1]-r.times[i]);x=r.positions[i]+v*(t+r.times[0]-r.times[i]);
  let distance=0;for(let j=0;j<i;j++)distance+=Math.abs(r.positions[j+1]-r.positions[j]);distance+=Math.abs(x-r.positions[i]);
  readouts=[{label:'Position',value:x,unit:'m'},{label:'Velocity',value:v,unit:'m/s'},{label:'Elapsed time',value:t,unit:'s'}];extra={distance};
 }else if(k==='uniform'){const u=uniform(p);t=Math.min(t,u.time);v=u.speed-finite(p.referenceSpeed);x=v*t;
  if(p.otherSpeed!==undefined)bodies=[{x:u.speed*t,v:u.speed,a:0,mass:1,label:'Eastbound'},{x:finite(p.otherSpeed)*t,v:finite(p.otherSpeed),a:0,mass:1,label:'Westbound'}];
  readouts=p.referenceSpeed!==undefined?[{label:'Relative velocity',value:v,unit:'m/s'},{label:'Train velocity',value:u.speed,unit:'m/s'},{label:'Frame velocity',value:finite(p.referenceSpeed),unit:'m/s'}]:[{label:'Distance',value:Math.abs(x),unit:'m'},{label:'Speed',value:Math.abs(v),unit:'m/s'},{label:'Elapsed time',value:t,unit:'s'}];
 }
 else if(k==='acceleration'){const m=motion(p);t=Math.min(t,m.time);a=m.a;v=m.vi+a*t;x=m.vi*t+.5*a*t*t;extra.distance=pathLength(m.vi,a,t);readouts=[{label:'Velocity',value:v,unit:'m/s'},{label:'Acceleration',value:a,unit:'m/s²'},{label:'Displacement',value:x,unit:'m'}];}
 else if(k==='gravity'){
  axis='vertical';const mass=positive(p.mass),g=positive(p.g,9.8),height=positive(p.height,2);const fallTime=Math.sqrt(2*height/g);const supported=p.supported===true;
  if(supported){x=height;forces=[{body:0,value:-mass*g,axis:'vertical',label:'Weight'},{body:0,value:mass*g,axis:'vertical',label:'Support'}];}
  else{t=Math.min(t,fallTime);x=Math.max(0,height-.5*g*t*t);v=t>=fallTime?0:-g*t;a=t>=fallTime?0:-g;forces=[{body:0,value:-mass*g,axis:'vertical',label:'Weight'}];if(t>=fallTime)forces.push({body:0,value:mass*g,axis:'vertical',label:'Ground'});}
  bodies=[{x,v,a,mass,label:'Object'}];readouts=p.compareG!==undefined?[{label:'Weight here',value:mass*g,unit:'N'},{label:'Weight on Earth',value:mass*finite(p.compareG),unit:'N'},{label:'Mass both places',value:mass,unit:'kg'}]:[{label:'Weight',value:mass*g,unit:'N'},{label:'Mass',value:mass,unit:'kg'},{label:'Height',value:x,unit:'m'}];extra={supported,height,distance:supported?0:height-x};
 }else if(['friction','netforce','newton2'].includes(k)){
  const f=forceMotion(p,k);t=Math.min(t,f.time);const stopped=t>=f.stop,mt=Math.min(t,f.stop);x=f.vi*mt+.5*f.a*mt*mt;v=stopped?0:f.vi+f.a*t;a=stopped?0:f.a;
  let fwd=f.forward,bwd=f.backward;if(stopped&&k==='friction')bwd=fwd;
  forces=[{body:0,value:fwd,axis:'horizontal',label:'Push'},{body:0,value:-bwd,axis:'horizontal',label:k==='friction'?'Friction':'Opposing force'}];
  bodies=[{x,v,a,mass:f.mass,label:'Cart'}];
  if(p.compareMass!==undefined){const m2=positive(p.compareMass),a2=f.net/m2;bodies.push({x:f.vi*t+.5*a2*t*t,v:f.vi+a2*t,a:a2,mass:m2,label:'Cart 2'});forces.push({body:1,value:f.net,axis:'horizontal',label:'Same net force'});}
  readouts=[{label:'Net force',value:fwd-bwd,unit:'N'},{label:'Acceleration',value:a,unit:'m/s²'},{label:'Velocity',value:v,unit:'m/s'}];extra={stuck:f.stuck,stopped,mass:f.mass,distance:pathLength(f.vi,f.a,mt)};
 }else if(k==='thirdlaw'){
  const pushTime=positive(p.pushDuration,p.time??.5),duration=pushTime+3;t=Math.min(t,duration);const f=finite(p.force,20),m1=positive(p.mass1,50),m2=positive(p.mass2,50),a1=-f/m1,a2=f/m2,pt=Math.min(t,pushTime),coast=Math.max(0,t-pushTime),contact=t<pushTime;
  bodies=[{x:-.6+.5*a1*pt*pt+a1*pt*coast,v:a1*pt,a:contact?a1:0,mass:m1,label:p.fixedSecond?'Swimmer':'Skater 1'},{x:.6+(p.fixedSecond?0:.5*a2*pt*pt+a2*pt*coast),v:p.fixedSecond?0:a2*pt,a:p.fixedSecond?0:contact?a2:0,mass:m2,label:p.fixedSecond?'Wall':'Skater 2'}];
  forces=contact?[{body:0,value:-f,axis:'horizontal',label:'Force on 1'},{body:1,value:f,axis:'horizontal',label:'Force on 2'}]:[];x=bodies[0].x;v=bodies[0].v;a=bodies[0].a;extra={contact,pushTime,distance:Math.abs(bodies[0].x+.6)};
  readouts=[{label:'Force on 1',value:contact?-f:0,unit:'N'},{label:'Force on 2',value:contact?f:0,unit:'N'},{label:'Acceleration 1',value:a,unit:'m/s²'}];
 }else if(k==='momentum'){
  const m=momentum(p);t=Math.min(t,m.time);
  if(p.single){x=m.v1*t;v=m.v1;bodies=[{x,v,a:0,mass:m.m1,label:'Bowling ball'}];extra={totalMomentum:m.m1*v};readouts=[{label:'Momentum',value:m.m1*v,unit:'kg·m/s'},{label:'Mass',value:m.m1,unit:'kg'},{label:'Velocity',value:v,unit:'m/s'}];}
  else{const coll=m.collides&&t>=m.tc;let x1,x2,v1,v2;
  if(coll){x1=-m.gap/2+m.v1*m.tc+m.vf*(t-m.tc);x2=m.gap/2+m.v2*m.tc+m.vf*(t-m.tc);v1=v2=m.vf;}else{x1=-m.gap/2+m.v1*t;x2=m.gap/2+m.v2*t;v1=m.v1;v2=m.v2;}
  bodies=[{x:x1,v:v1,a:0,mass:m.m1,label:'Cart 1'},{x:x2,v:v2,a:0,mass:m.m2,label:'Cart 2'}];x=x1;v=v1;extra={collided:coll,totalMomentum:m.m1*v1+m.m2*v2,collisionTime:m.tc,distance:Math.abs(m.v1)*Math.min(t,m.tc)+(coll?Math.abs(m.vf)*(t-m.tc):0)};
  readouts=[{label:'Momentum 1',value:m.m1*v1,unit:'kg·m/s'},{label:'Momentum 2',value:m.m2*v2,unit:'kg·m/s'},{label:'Total momentum',value:extra.totalMomentum,unit:'kg·m/s'}];}
 }else if(k==='circular'){
  const radius=positive(p.radius,4),speed=positive(p.speed,2),omega=speed/radius,theta=omega*t;x=radius*Math.cos(theta);v=-speed*Math.sin(theta);a=-speed*speed/radius*Math.cos(theta);extra={radius,speed,theta,distance:speed*t,y:radius*Math.sin(theta),vy:speed*Math.cos(theta),ay:-speed*speed/radius*Math.sin(theta)};
  readouts=[{label:'Speed',value:speed,unit:'m/s'},{label:'Radius',value:radius,unit:'m'},{label:'Direction',value:((theta*180/Math.PI)%360),unit:'°'}];
 }
 if(!bodies.length)bodies=[{x,v,a,mass:finite(p.mass,1),label:'Object'}];
 bodies.forEach((b,i)=>{
  if(k==='thirdlaw')b.distance=Math.abs(b.x-(i===0?-.6:.6));
  else if(k==='momentum'&&!p.single){const m=momentum(p);b.distance=Math.abs(i?m.v2:m.v1)*Math.min(t,m.tc)+(t>m.tc&&m.collides?Math.abs(m.vf)*(t-m.tc):0);}
  else if(k==='uniform')b.distance=Math.abs(b.v*t);
  else if(i===0)b.distance=extra.distance??Math.abs(x);
  else if(p.compareMass!==undefined)b.distance=pathLength(finite(p.vi),b.a,t);
  else b.distance=Math.abs(b.x);
 });
 return {t,x,v,a,speed:Math.abs(v),distance:extra.distance??Math.abs(x),bodies,forces,readouts,axis,...extra};
}
export function modelInfo(problem,p){
 const k=problem.simulation.kind;let duration=5,quantities=[];
 if(k==='route'){duration=route(p).duration;quantities=[q('distance','Total distance','m'),q('displacement','Displacement','m')];}
 else if(k==='piecewise'){duration=piecewise(p).duration;quantities=[q('averageSpeed','Average speed','m/s'),q('distance','Total distance','m')];}
 else if(k==='uniform'){duration=uniform(p).time;quantities=[q('speed','Speed','m/s'),q('distance','Distance','m'),q('time','Time','s')];}
 else if(k==='acceleration'){duration=motion(p).time;quantities=[q('acceleration','Acceleration','m/s²'),q('finalVelocity','Final velocity','m/s'),q('initialVelocity','Initial velocity','m/s'),q('time','Time','s')];}
 else if(k==='gravity'){duration=p.supported?5:Math.sqrt(2*positive(p.height,2)/positive(p.g,9.8));quantities=[q('weight','Weight','N')];}
 else if(['friction','netforce','newton2'].includes(k)){duration=positive(p.time,5);quantities=[q('netForce','Net force','N'),q('acceleration','Acceleration','m/s²')];if(k==='newton2')quantities.push(q('mass','Mass','kg'));if(p.steady)quantities.unshift(q('frictionForce','Sliding friction','N'));}
 else if(k==='thirdlaw'){duration=positive(p.pushDuration,p.time??.5)+3;quantities=[q('reactionForce','Reaction force magnitude','N'),q('acceleration1','Acceleration of object 1','m/s²'),q('acceleration2','Acceleration of object 2','m/s²')];}
 else if(k==='momentum'){duration=positive(p.time,5);quantities=p.single?[q('momentum1','Momentum','kg·m/s')]:[q('momentum1','Momentum of cart 1','kg·m/s'),q('finalVelocity','Combined final velocity','m/s'),q('totalMomentum','Total momentum','kg·m/s')];}
 else if(k==='circular'){duration=2*Math.PI*positive(p.radius,4)/positive(p.speed,2)*positive(p.laps,1);}
 const xs=[];for(let i=0;i<=80;i++){const s=evaluate(problem,p,duration*i/80);s.bodies.forEach(b=>xs.push(b.x));}
 let min=Math.min(0,...xs),max=Math.max(0,...xs);if(k==='route'){const r=route(p);min=Math.min(r.start,r.turn,r.end);max=Math.max(r.start,r.turn,r.end);}
 if(k==='circular'){min=-positive(p.radius,4);max=positive(p.radius,4);}
 if(Math.abs(max-min)<1){min-=1;max+=1;}const pad=(max-min)*.12;
 return {duration:Math.max(.1,duration),range:[min-pad,max+pad],quantities,notes:problem.simulation.notes||''};
}
