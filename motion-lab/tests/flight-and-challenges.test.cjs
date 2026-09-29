const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Track,Simulation}=require('../physics.js');
const {levels,assess}=require('../challenges.js');
const dt=1/240;
function near(actual,expected,tol=1e-7){assert.ok(Math.abs(actual-expected)<tol,`${actual} != ${expected}`);}
function advance(s,t,input={motor:0,brake:false}){for(let i=0;i<Math.round(t/dt);i++)s.step(dt,input);return s.snapshot();}
test('flight follows x = x0 + vx*t and y = y0 + vy*t - g*t²/2; wheels cannot push in air',()=>{
 const track=new Track('flat');track.hasGround=()=>false;
 const sim=new Simulation(track,{allowFlight:true},0,8);sim.air.y=10;
 const p=advance(sim,.75,{motor:1,brake:true});
 near(p.x,6);near(p.y,10-.5*9.81*.75**2);near(p.vx,8);near(p.vy,-9.81*.75);near(p.ax,0);near(p.ay,-9.81);
 assert.ok(p.distance>6);assert.ok(p.airborne);
});
test('leaving a gap edge launches at the edge with no boost or speed cap',()=>{
 const track=new Track('flat');track.hasGround=x=>x<20;
 const sim=new Simulation(track,{allowFlight:true},18,8),p=advance(sim,.5);
 assert.ok(p.airborne);near(p.x,22,1e-6);near(p.y,-.5*9.81*.25**2,1e-6);near(p.vy,-9.81*.25,1e-6);
});
test('fast motion over a crest detaches when the road would need to pull the cart down',()=>{
 const track=new Track('hill',7),sim=new Simulation(track,{allowFlight:true},29,35);
 const before=sim.snapshot();sim.step(dt);const after=sim.snapshot();
 assert.ok(after.airborne);near(after.vx,before.vx);near(after.vy,before.vy-9.81*dt,1e-6);
});
test('inelastic flat landing removes downward velocity and preserves horizontal velocity',()=>{
 const track=new Track('flat'),sim=new Simulation(track,{allowFlight:true,gravity:10},0,6);
 sim.launch();sim.air.y=10;const p=advance(sim,1.5);
 assert.ok(!p.airborne);assert.equal(sim.landed,1);near(p.y,0);near(p.vx,6);near(p.vy,0);near(p.x,9,1e-6);
 near(.5*p.speed**2,18);assert.ok(p.distance>p.x);
});
test('a missed landing face ends the run instead of teleporting the car upward',()=>{
 const track=new Track('flat');track.hasGround=x=>x<0||x>=2;
 const sim=new Simulation(track,{allowFlight:true,gravity:0},1,4);sim.air.y=-1;sim.air.vy=1;
 advance(sim,.4);assert.ok(sim.crashed);near(sim.air.x,2,1e-6);assert.ok(sim.air.y<0);
});
test('the default adventure course is driveable and contains multiple launches and landings',()=>{
 const sim=new Simulation(new Track('adventure',7),{allowFlight:true,motor:3.5},6,0);
 const p=advance(sim,15,{motor:1});assert.ok(!sim.crashed);assert.ok(p.x>180);assert.ok(sim.jumps>=3);assert.ok(sim.landed>=3);
});
test('periodic tracks map arc length correctly far beyond the original screen',()=>{
 for(const kind of ['adventure','rollers']){
  const t=new Track(kind,7);
  for(const x of [-5001,-221,-84.75,0,23.6,140,220,250.3,5012])near(t.atS(t.sAtX(x)).x,x,1e-8);
 }
});
test('turning jumps off provides a continuous guide over gaps',()=>{
 const s=new Simulation(new Track('adventure',7),{allowFlight:false,motor:3.5},6,0);advance(s,15,{motor:1});
 assert.equal(s.jumps,0);assert.equal(s.crashed,false);assert.equal(s.snapshot().airborne,false);
});
function samples(level,speed){
 const data=[];let distance=0,previous=speed(0);
 for(let i=0;i<=Math.round(level.duration*20);i++){const t=i/20,v=Math.max(0,speed(t));if(i)distance+=(previous+v)/2*.05;data.push({t,speed:v,distance});previous=v;}
 return data;
}
test('all seven intended graph shapes pass',()=>{
 for(const l of levels){const r=assess(l,samples(l,l.speed));assert.ok(r.passed,`${l.id}: ${JSON.stringify(r)}`);}
});
test('rough shape matches with different heights, moderate timing error, and a little wiggle pass',()=>{
 for(const l of levels){
  const data=samples(l,t=>.7*l.speed(Math.max(0,t-.35))+.035*Math.sin(t*4));
  const r=assess(l,data);assert.ok(r.passed,`${l.id}: ${JSON.stringify(r)}`);
 }
});
test('stationary or flat graphs do not pass rising, falling, or curved challenges',()=>{
 for(const l of levels){assert.ok(!assess(l,samples(l,()=>0)).passed);assert.ok(!assess(l,samples(l,()=>4)).passed);}
});
test('a straight rising speed line does not pass either speed-concavity challenge',()=>{
 for(const l of levels.slice(-2))assert.ok(!assess(l,samples(l,t=>2*t)).passed);
});
test('opposite concavity and an omitted phase are rejected',()=>{
 assert.ok(!assess(levels[5],samples(levels[5],levels[6].speed)).passed);
 assert.ok(!assess(levels[6],samples(levels[6],levels[5].speed)).passed);
 const l=levels[2];assert.ok(!assess(l,samples(l,t=>t<3?2*t:6)).passed);
});
test('incomplete or invalid runs cannot unlock a challenge',()=>{
 const l=levels[0];assert.ok(!assess(l,samples(l,l.speed).slice(0,-20)).passed);
 assert.ok(!assess(l,[]).passed);assert.ok(!assess(l,[{t:0,speed:NaN,distance:0}]).passed);
});
