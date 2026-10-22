import assert from 'node:assert/strict';
import fs from 'node:fs';
import packet from '../data.js';
import {evaluate,modelInfo,solve} from '../physics.js';
const all=packet.sections.flatMap(s=>s.problems),by=id=>all.find(p=>p.id===id),near=(a,b,tol=1e-8)=>assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);
assert.equal(all.length,32);assert.equal(all.filter(p=>p.numericAnswer).length,16);
let samples=0;
for(const p of all){
 const base=p.simulation.params,cases=[base];
 for(const field of p.simulation.adjustable||[])for(const v of [field.min,field.max])cases.push({...base,[field.key]:v});
 for(const v of cases){
  const m=modelInfo(p,v);assert.ok(Number.isFinite(m.duration)&&m.duration>0,p.id);
  for(const t of [0,m.duration/2,m.duration,...m.eventTimes.map(e=>e.time)]){
   const s=evaluate(p,v,t);for(const n of [s.x,s.v,s.a,s.speed,s.distance,...s.bodies.flatMap(b=>[b.x,b.v,b.a,b.mass,b.distance]),...s.readouts.map(r=>r.value)])assert.ok(Number.isFinite(n),`${p.id}: nonfinite state`);
   assert.ok(s.distance>=-1e-9,p.id);samples++;
  }
 }
 if(p.numericAnswer)near(solve(p,base).value,p.numericAnswer.value);
 else assert.ok(!p.choices,`${p.id}: conceptual tasks must not use multiple choice`);
}
// Source synchronization prevents the simulation from silently answering an older packet.
const sourceUrl=new URL('../maintainer/content/packet.json',import.meta.url);
if(fs.existsSync(sourceUrl)){const printed=JSON.parse(fs.readFileSync(sourceUrl)).sections.flatMap(s=>s.problems);for(const p of all){const s=printed.find(q=>q.id===p.id);assert.equal(p.prompt,s.prompt,p.id);if(s.numericAnswer)assert.deepEqual(p.numericAnswer,s.numericAnswer,p.id);}}
// Every contact model conserves total momentum throughout compression, not just at endpoints.
for(const id of ['P30','P31','P32']){
 const problem=by(id),base=problem.simulation.params;
 for(const masses of [[base.mass1,base.mass2],[base.mass1*.5,base.mass2*2],[base.mass1*2,base.mass2*.5]]){
  const p={...base,mass1:masses[0],mass2:masses[1]},initial=evaluate(problem,p,0),target=p.mass1*p.velocity1+p.mass2*p.velocity2,info=modelInfo(problem,p),tc=p.collisionTime;
  for(const t of [0,tc-1e-6,...Array.from({length:11},(_,i)=>tc+p.contactDuration*i/10),info.duration]){
   const s=evaluate(problem,p,t);near(s.totalMomentum,target);near(s.bodies.reduce((sum,b)=>sum+b.mass*b.v,0),target);
   const edgeGap=s.bodies[1].x-s.bodies[0].x-(s.bodies[0].radius+s.bodies[1].radius)+s.compression;
   assert.ok(edgeGap>=-1e-8,`${id}: bodies interpenetrate beyond modeled deformation`);
   if(s.contact)near(edgeGap,0);
   if(s.forces.length){near(s.forces[0].value,-s.forces[1].value);near(s.forces[0].value,s.bodies[0].mass*s.bodies[0].a);near(s.forces[1].value,s.bodies[1].mass*s.bodies[1].a);assert.equal(s.collisionPhase,'contact');}
   if(p.restitution===1) {const elasticEnergy=s.kineticEnergy+.5*((p.mass1*p.mass2/(p.mass1+p.mass2))*(Math.PI/p.contactDuration)**2)*s.compression**2;near(elasticEnergy,initial.kineticEnergy);}
  }
  const final=evaluate(problem,p,info.duration);if(id==='P30'){near(final.bodies[0].v,final.bodies[1].v);assert.ok(final.kineticEnergy<initial.kineticEnergy);assert.equal(final.forces.length,0);}else{near(final.kineticEnergy,initial.kineticEnergy);assert.equal(final.forces.length,0);}
 }
}
const bowling=by('P29'),bowlingEnd=evaluate(bowling,bowling.simulation.params,10);near(bowlingEnd.totalMomentum,18);near(bowlingEnd.bodies[1].v,0);assert.equal(bowlingEnd.collided,false);assert.equal(bowlingEnd.forces.length,0);
// Vertical force signs and mass inference agree with Fnet = ma; airforces are not netforces.
for(const id of ['P21','P22','P25','P26']){const p=by(id),s=evaluate(p,p.simulation.params,0);near(s.forces.reduce((sum,f)=>sum+f.value,0),s.mass*s.a);near(s.weight,s.mass*10);}
const balloon=by('P22'),rising=evaluate(balloon,{...balloon.simulation.params,vi:2},1);assert.ok(rising.v>0&&rising.a<0,'Downward acceleration does not imply downward velocity');
const bird=by('P25'),landed=evaluate(bird,{...bird.simulation.params,upwardForce:3},2);assert.equal(landed.grounded,true);near(landed.x,0);near(landed.v,0);near(landed.forces.reduce((sum,f)=>sum+f.value,0),0);
const drone=by('P26'),dr=evaluate(drone,drone.simulation.params,0);near(dr.mass,2);near(dr.upwardForce,23);near(dr.netForce,3);
for(const id of ['P17','P19']){const p=by(id),s=evaluate(p,p.simulation.params,0);near(s.weight,p.simulation.params.mass*p.simulation.params.g);near(s.springExtension,s.weight/p.simulation.params.springK);near(s.forces.reduce((sum,f)=>sum+f.value,0),0);near(s.a,0);}
const astronaut=by('P19'),as=evaluate(astronaut,astronaut.simulation.params,0);near(as.compareWeight,1500);near(as.weight,555);near(as.compareSpringExtension/as.springExtension,10/3.7);
// Reference-frame changes preserve the physical trip and change only relative velocity.
const train=by('P04');for(const speed of [2,10,20]){const ground=evaluate(train,{...train.simulation.params,speed,frame:0},3),moving=evaluate(train,{...train.simulation.params,speed,frame:1},3);near(ground.v,speed);near(moving.v,0);near(ground.groundX,moving.groundX);}
const crate=by('P20');for(const force of [0,10,18]){const s=evaluate(crate,{...crate.simulation.params,forwardForce:force},2);near(s.a,0);near(s.x,0);near(s.forces.reduce((n,f)=>n+f.value,0),0);}near(evaluate(crate,{...crate.simulation.params,forwardForce:20},1).a,.3);
const planes=by('P27'),pair=evaluate(planes,planes.simulation.params,2);near(pair.bodies[0].a,2);near(pair.bodies[1].a,1);assert.ok(pair.bodies.every(b=>b.v>=5));
const bus=by('P09'),b=evaluate(bus,bus.simulation.params,5);near(b.v,14);near(b.x,45);near(solve(bus,{...bus.simulation.params,endTime:10}).value,10/7);
const runner=by('P10'),run=evaluate(runner,runner.simulation.params,4);near(run.v,4);near(run.x,12);
// Circular speed is vector magnitude, velocity and acceleration are perpendicular.
for(const id of ['P03','P12','P28']){const p=by(id),info=modelInfo(p,p.simulation.params),s=evaluate(p,p.simulation.params,info.duration*.21);near(Math.hypot(s.v,s.vy),s.speed);near(s.v*s.a+s.vy*s.ay,0,1e-6);near(Math.hypot(s.a,s.ay),s.speed*s.speed/s.radius);if(id==='P12'){assert.ok(info.duration/86400>365&&info.duration/86400<366);near(s.inwardAcceleration,1.3271244e20/s.radius**2);}}
const lap=by('P03'),finish=evaluate(lap,lap.simulation.params,modelInfo(lap,lap.simulation.params).duration);near(finish.displacement,0);near(finish.distance,40*Math.PI);
const graph=by('P13');near(solve(graph,{...graph.simulation.params,distanceScale:1.2,timeScale:2}).value,.6);
// Aircraft obey independent component equations, including simultaneous climb and acceleration.
for(const id of ['P23','P27']){
 const problem=by(id),base=problem.simulation.params;
 const cases=[base,{...base,upwardForce:base.upwardForce*1.3,forwardForce:4500}, {...base,upwardForce:base.upwardForce*.6,vy:3}, {...base,upwardForce:0,compareLift:0,vy:-2}, {...base,upwardForce:base.upwardForce*1.1,compareLift:(base.compareLift||0)*.7,vy:-1}];
 for(const p of cases){const initial=evaluate(problem,p,0),info=modelInfo(problem,p);assert.equal(info.flight2D,true);assert.ok(info.graphQuantities.some(q=>q.key==='vy'));
  for(const t of [0,.4,1.5,p.time]){const state=evaluate(problem,p,t);assert.equal(state.axis,'2d');
   state.bodies.forEach((b,i)=>{const b0=initial.bodies[i],fx=state.forces.filter(f=>f.body===i&&f.axis==='horizontal').reduce((sum,f)=>sum+f.value,0),fy=state.forces.filter(f=>f.body===i&&f.axis==='vertical').reduce((sum,f)=>sum+f.value,0);
    near(fx,b.mass*b.ax);near(fy,b.mass*b.ay);near(b.weight,b.mass*10);near(b.x,b0.x+b0.vx*t+.5*b.ax*t*t);near(b.y,b0.y+b0.vy*t+.5*b.ay*t*t);near(b.vx,b0.vx+b.ax*t);near(b.vy,b0.vy+b.ay*t);near(b.speed,Math.hypot(b.vx,b.vy));
    const work=fx*(b.x-b0.x)+fy*(b.y-b0.y);near(b.kineticEnergy-b0.kineticEnergy,work);
    assert.ok(b.y>=info.rangeY[0]-1e-8&&b.y<=info.rangeY[1]+1e-8);assert.ok(b.x>=info.range[0]-1e-8&&b.x<=info.range[1]+1e-8);assert.ok(b.distance+1e-7>=Math.hypot(b.x-b0.x,b.y-b0.y));
   });
  }
 }
}
const aircraft=by('P23'),limits=Object.fromEntries(aircraft.simulation.adjustable.map(f=>[f.key,f]));const slowestFlight=evaluate(aircraft,{...aircraft.simulation.params,vi:limits.vi.min,weight:limits.weight.min,forwardForce:limits.forwardForce.min,backwardForce:limits.backwardForce.max},aircraft.simulation.params.time);assert.ok(slowestFlight.vx>0,'Allowed fixed leftward drag must not accelerate a reversed plane.');
const plane=by('P23'),upButSlowing=evaluate(plane,{...plane.simulation.params,upwardForce:10800,vy:3},1);assert.ok(upButSlowing.vy>0&&upButSlowing.ay<0,'An upward-moving plane can accelerate downward.');
const blueOrange=by('P27'),separate=evaluate(blueOrange,{...blueOrange.simulation.params,upwardForce:6,compareLift:6},1);assert.ok(separate.bodies[0].vy>0&&separate.bodies[1].vy<0,'Independent lift controls produce a blue climb and orange descent.');
// Exact path length agrees with independent quadrature for a curved accelerated flight.
const flightP={...plane.simulation.params,forwardForce:4200,backwardForce:3000,upwardForce:14400,vy:-1},flightState=evaluate(plane,flightP,5),n=400,dt=5/n;let integral=0;
for(let i=0;i<=n;i++){const state=evaluate(plane,flightP,i*dt);integral+=(i===0||i===n?1:i%2?4:2)*Math.hypot(state.vx,state.vy);}near(flightState.distance,integral*dt/3);
// An inelastic ground touch cannot hold an object down when the remaining net force is upward.
const liftAfterImpact=evaluate(bird,{...bird.simulation.params,vi:-2,upwardForce:6},1);assert.equal(liftAfterImpact.grounded,false);assert.ok(liftAfterImpact.x>0&&liftAfterImpact.v>0);near(liftAfterImpact.forces.reduce((sum,f)=>sum+f.value,0),liftAfterImpact.mass*liftAfterImpact.a);
console.log(`PASS: all 32 current packet models; 16 numeric answers; ${samples} state snapshots; source prompt sync; collision contact, force, energy and momentum; vertical forces and landing; 2D flight components and work–energy; spring-scale comparison; reference frames; circular vectors; edited graph scales.`);
