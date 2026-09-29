const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Track,Simulation,targetSpeed}=require('../physics.js');
const dt=1/240;
function near(actual,expected,tolerance=1e-7){assert.ok(Math.abs(actual-expected)<tolerance,`${actual} != ${expected} within ${tolerance}`);}
function advance(sim,seconds,input={motor:0,brake:false}){for(let i=0;i<Math.round(seconds/dt);i++)sim.step(dt,input);return sim.snapshot(input);}
test('constant acceleration: v = v0 + at and distance = v0*t + a*t²/2',()=>{
 const s=new Simulation(new Track('flat'),{motor:2},6,3),r=advance(s,5,{motor:1});
 near(r.v,13);near(r.distance,40);near(r.x,46);near(r.a,2);
});
test('coasting requires no net force; changing gravity cannot accelerate a horizontal cart',()=>{
 const s=new Simulation(new Track('flat'),{gravity:9.81},6,-4),r=advance(s,10);
 near(r.v,-4);near(r.speed,4);near(r.distance,40);near(r.displacement,-40);near(r.a,0);
});
test('brake stops at v0²/(2b), without reversing or adding extra distance',()=>{
 for(const v of [5,-5]){
  const s=new Simulation(new Track('flat'),{brake:6},6,v),r=advance(s,3,{brake:true});
  near(r.v,0);near(r.distance,25/12);near(r.x,6+Math.sign(v)*25/12);
 }
});
test('distance includes both halves of a direction reversal within a step',()=>{
 const s=new Simulation(new Track('flat'),{motor:2},6,1),r=advance(s,1.003,{motor:-1});
 const t=Math.round(1.003/dt)*dt;
 near(r.distance,.25+(t-.5)**2);near(r.displacement,t-t*t);assert.ok(r.v<0);
});
test('incline acceleration follows the local g sin(theta)',()=>{
 const t=new Track('ramp',8),s=new Simulation(t,{},25,0),p=t.atS(s.s);
 near(s.snapshot().a,-9.81*p.slope/Math.hypot(1,p.slope));assert.ok(s.snapshot().a>0);
});
test('conservative valley: kinetic + gravitational potential energy stays constant',()=>{
 const t=new Track('valley',8),s=new Simulation(t,{},18,0),e0=9.81*t.atS(s.s).y;
 let maxError=0,negative=false,positive=false;
 for(let i=0;i<45/dt;i++){s.step(dt);const e=.5*s.v*s.v+9.81*t.atS(s.s).y;maxError=Math.max(maxError,Math.abs(e-e0));negative ||= s.v<-.1;positive ||= s.v>.1;}
 assert.ok(negative&&positive,'The car should reverse and oscillate');assert.ok(maxError<2e-4,`Energy error: ${maxError}`);
});
test('a frictionless downhill reaches sqrt(2*g*height loss)',()=>{
 const t=new Track('ramp',8),s=new Simulation(t,{},20,0),y0=t.atS(s.s).y;
 while(t.atS(s.s).x<45)s.step(dt);
 near(s.v,Math.sqrt(2*9.81*y0),2e-5);
});
test('braking can hold at rest on a slope, but yields if gravity exceeds brake capacity',()=>{
 const track=new Track('ramp',12);
 const held=new Simulation(track,{brake:6},26,0);const h=advance(held,2,{brake:true});near(h.v,0);near(h.x,26);
 const weak=new Simulation(track,{brake:.1},26,0);assert.ok(advance(weak,.5,{brake:true}).v>0);
});
test('zero gravity coasts on curved tracks at constant speed, with normal acceleration',()=>{
 const s=new Simulation(new Track('valley'),{gravity:0},15,3);const r=advance(s,2);
 near(r.v,3);near(r.distance,6);near(r.a,0);assert.ok(Math.hypot(r.ax,r.ay)>.01);
});
test('graph challenge is physically reachable with the stated motor and brake',()=>{
 const s=new Simulation(new Track('flat'),{motor:2,brake:2},6,0);let error=0;
 for(let i=0;i<1680;i++){s.step(dt,{motor:i<480?1:0,brake:i>=1200});error+=(Math.abs(s.v)-targetSpeed(s.t))**2*dt;}
 near(s.v,0);near(s.distance,20);assert.ok(Math.sqrt(error/7)<1e-8);
});
test('arc-length lookup and its inverse agree, including flat track extensions',()=>{
 const t=new Track('hill',12);for(const x of [-300,-20,0,14.42,28,45.783,70,90,900])near(t.atS(t.sAtX(x)).x,x,1e-9);
 assert.ok(t.sAtX(70)>70);
});
