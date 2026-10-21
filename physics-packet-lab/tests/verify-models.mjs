import assert from 'node:assert/strict';
import packet from '../data.js';
import {evaluate,modelInfo,solve} from '../physics.js';
const all=packet.sections.flatMap(s=>s.problems), by=id=>all.find(p=>p.id===id), near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} != ${b}`);
assert.equal(all.length,32);assert.equal(all.filter(p=>p.numericAnswer).length,16);
let samples=0;
for(const p of all){
 const base=p.simulation.params, cases=[base];
 for(const field of p.simulation.adjustable||[]) for(const v of [field.min,field.max])cases.push({...base,[field.key]:v});
 for(const v of cases){const m=modelInfo(p,v);assert.ok(Number.isFinite(m.duration)&&m.duration>0,p.id);for(const t of [0,m.duration/2,m.duration]){const s=evaluate(p,v,t); for(const n of [s.x,s.v,s.a,s.speed,s.distance,...s.readouts.map(r=>r.value)])assert.ok(Number.isFinite(n),p.id);assert.ok(s.distance>=-1e-9,p.id);samples++;}}
 if(p.numericAnswer)near(solve(p,base).value,p.numericAnswer.value);
}
// A latch conserves momentum both across contact and during the shared glide.
const collision=by('P30');for(const m of [.25,.5,2])for(const v of [.4,1.2,2]){const p={...collision.simulation.params,mass1:m,velocity1:v};for(const t of [0,1.999,2,2.001,5]){const s=evaluate(collision,p,t);near(s.bodies.reduce((a,b)=>a+b.mass*b.v,0),m*v);if(t>=2)near(s.bodies[0].v,s.bodies[1].v);}}
// Internal push conserves total momentum; contact force must cease after release.
const skaters=by('P31');for(const t of [0,.25,.5,2,3.5]){const s=evaluate(skaters,skaters.simulation.params,t);near(s.bodies.reduce((a,b)=>a+b.mass*b.v,0),0);if(t>=.5){assert.equal(s.forces.length,0);near(s.a,0);}}
const crate=by('P20');for(const force of [0,10,18]){const s=evaluate(crate,{...crate.simulation.params,forwardForce:force},2);near(s.a,0);near(s.x,0);near(s.forces.reduce((n,f)=>n+f.value,0),0);}near(evaluate(crate,{...crate.simulation.params,forwardForce:20},1).a,.3);
const train=by('P04');near(evaluate(train,{...train.simulation.params,referenceSpeed:10},3).v,0);near(evaluate(train,{...train.simulation.params,referenceSpeed:0},3).v,10);
const carts=by('P27'), pair=evaluate(carts,carts.simulation.params,2);near(pair.bodies[0].a,2);near(pair.bodies[1].a,1);
const bus=by('P09'), b=evaluate(bus,bus.simulation.params,5);near(b.v,14);near(b.x,45);
const brake=by('P10'), br=evaluate(brake,brake.simulation.params,5);near(br.v,2);near(br.x,20);
const circle=by('P12'), cr=evaluate(circle,circle.simulation.params,1);near(Math.hypot(cr.v,cr.vy),3);near(cr.v*cr.a+cr.vy*cr.ay,0);
console.log(`PASS: 32 models, 16 packet answers, ${samples} endpoint snapshots, momentum conservation, static friction, reference frames, acceleration and circular-motion invariants.`);
