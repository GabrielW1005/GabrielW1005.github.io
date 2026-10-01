const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Track,Simulation,rampMotor,externalAcceleration}=require('../physics.js');
const {levels,assess,environment,makeSimulation,referenceSamples}=require('../challenges.js');
const dt=1/240;
function near(a,b,tolerance=1e-7){assert.ok(Math.abs(a-b)<tolerance,`${a} != ${b} within ${tolerance}`);}
function advance(sim,seconds,input={}){for(let i=0;i<Math.round(seconds/dt);i++)sim.step(dt,input);return sim.snapshot(input);}
function flight(settings={},vx=0){return new Simulation(new Track('flat'),{allowFlight:true,thrustersEnabled:true,mass:100,thrust:1200,startY:100,...settings},0,vx);}

test('horizontal and vertical jets follow F/m, vector addition, and gravity',()=>{
 const sim=flight({},3),p=advance(sim,2,{thrustX:1,thrustY:1,motor:-1,brake:true});
 near(p.ax,12);near(p.ay,2.19);near(p.vx,27);near(p.vy,4.38);
 near(p.x,30);near(p.y,104.38);near(p.speed,Math.hypot(27,4.38));
 const magnitude=Math.hypot(12,2.19),parallel=36/magnitude,perpendicular=Math.sqrt(9-parallel**2);
 const integral=u=>(u*Math.hypot(u,perpendicular)+perpendicular**2*Math.asinh(u/perpendicular))/2;
 near(p.distance,(integral(parallel+2*magnitude)-integral(parallel))/magnitude,2e-6);
 const doubledMass=flight({mass:200});near(advance(doubledMass,1,{thrustX:1}).vx,6);
});
test('opposing jets cancel and disabling thrusters removes their force',()=>{
 const settings={mass:100,thrust:1200,gravity:3.71,thrustersEnabled:true};
 assert.deepEqual(externalAcceleration(settings,{thrustX:0,thrustY:0}),{ax:0,ay:-3.71});
 assert.deepEqual(externalAcceleration({...settings,thrustersEnabled:false},{thrustX:1,thrustY:1}),{ax:0,ay:-3.71});
 assert.throws(()=>flight({mass:0}));
});
test('upward thrust must exceed weight to leave level ground',()=>{
 for(const thrust of [500,981]){
  const sim=new Simulation(new Track('flat'),{allowFlight:true,thrustersEnabled:true,thrust},0,0);
  const p=advance(sim,1,{thrustY:1});assert.equal(p.airborne,false);near(p.y,0);near(p.speed,0);near(p.ay,0);
 }
 const sim=new Simulation(new Track('flat'),{allowFlight:true,thrustersEnabled:true,thrust:1200},0,0);
 const p=advance(sim,1,{thrustY:1});assert.equal(p.airborne,true);near(p.y,1.095);near(p.vy,2.19);
});
test('incline motion projects both components of thrust and gravity onto the road',()=>{
 const track=new Track('ramp',8),sim=new Simulation(track,{thrustersEnabled:true,thrust:300},25,0),p=track.atS(sim.s);
 near(sim.snapshot({thrustX:1,thrustY:1}).a,3*p.tx+(3-9.81)*p.ty);
});
test('a vertical reversal inside a timestep adds both legs to total distance',()=>{
 const sim=flight({gravity:0,thrust:200,initialVy:.003});
 const p=advance(sim,1,{thrustY:-1}),turn=.003/2;
 near(p.vy,.003-2);near(p.distance,.003**2/4+(1-turn)**2);
});
test('switching gravity changes acceleration without an impulse in velocity',()=>{
 const sim=flight({gravity:1.62,thrust:371,initialVy:-2});
 const first=advance(sim,2);near(first.vy,-5.24);
 sim.settings.gravity=3.71;near(sim.snapshot().vy,first.vy);
 const balanced=advance(sim,2.5,{thrustY:1});near(balanced.vy,first.vy);near(balanced.ay,0);
 sim.settings.gravity=9.81;const last=advance(sim,1,{thrustY:1});near(last.vy,-11.34);
});
test('a linear gravity ramp gives the analytical quadratic velocity and cubic position',()=>{
 const l={id:'vertical-ramp-regression',duration:6,initialV:0,motor:2,brake:2,thrusters:true,thrust:162,startY:100,initialVy:-3,gravityRamp:{from:1.62,to:3.71,label:'Test ramp'}},sim=makeSimulation(l),jerk=(3.71-1.62)/6;
 for(let i=0;i<6/dt;i++){sim.settings.gravity=environment(l,(i+.5)*dt).value;sim.step(dt,{thrustY:1});}
 const p=sim.snapshot();near(p.vy,-3-jerk*6**2/2);near(p.y,100-3*6-jerk*6**3/6,5e-6);
 near(p.distance,100-p.y,1e-7);
});
test('motor changes continuously at 0.5 m/s² per second and clamps at its endpoints',()=>{
 near(rampMotor(2,1,.37),2.185);near(rampMotor(2,-1,.37),1.815);
 near(rampMotor(.3,-1,1),.25);near(rampMotor(5.9,1,1),6);near(rampMotor(2,0,1),2);
 const sim=new Simulation(new Track('flat'),{motor:.5},0,0);let strength=.5;
 for(let i=0;i<7/dt;i++){const next=rampMotor(strength,1,dt);sim.settings.motor=(strength+next)/2;sim.step(dt,{motor:1});strength=next;}
 const p=sim.snapshot();near(p.v,.5*7+.25*7**2);near(p.distance,.25*7**2+7**3/12,6e-6);
});
test('a pit wall supports inward thrust while permitting upward recovery and landing',()=>{
 const track=new Track('flat');track.hasGround=x=>x<0||x>=2;
 const sim=new Simulation(track,{allowFlight:true,thrustersEnabled:true,gravity:2,thrust:600,startY:-1},1,4);
 advance(sim,.4,{thrustX:1});assert.ok(sim.missed);near(sim.snapshot({thrustX:1}).vx,0);near(sim.snapshot({thrustX:1}).ax,0);
 const below=sim.snapshot();advance(sim,.1,{thrustX:1});near(sim.snapshot().x,below.x);
 const up=advance(sim,1.4,{thrustX:1,thrustY:1});assert.ok(up.x>2);assert.ok(up.y>0);assert.ok(!sim.crashed);
 advance(sim,6);assert.ok(sim.landed>0);assert.ok(!sim.missed);assert.ok(!sim.crashed);
});
test('all new reference runs stay finite and match distance to integrated speed',()=>{
 for(const l of levels.slice(14)){
  const trace=referenceSamples(l);let area=0;
  for(let i=0;i<trace.length;i++){
   const p=trace[i];assert.ok(!p.crashed,l.id);near(p.speed,Math.hypot(p.vx,p.vy));
   if(i){const previous=trace[i-1];assert.ok(p.distance>=previous.distance);area+=(p.t-previous.t)*(p.speed+previous.speed)/2;}
  }
  near(trace.at(-1).distance,area,.003);assert.ok(assess(l,trace,100).passed,l.id);
 }
});
test('the scoring threshold is limited to 90–100 and thruster phases need the specified control',()=>{
 const l=levels.find(l=>l.id==='track-boost-coast-brake'),trace=referenceSamples(l);
 assert.equal(assess(l,trace,1).threshold,90);assert.equal(assess(l,trace,120).threshold,100);
 assert.equal(assess(l,trace,NaN).threshold,90);
 const fake=trace.map(p=>({...p,thrustX:0,thrustY:0}));assert.ok(!assess(l,fake,90).passed);
 assert.ok(!assess(l,trace.slice(0,-10),90).passed);
 assert.equal(levels[5].motor,.5);assert.equal(levels[6].motor,4);
});


test('every thruster challenge starts on the road and completes traveling right with A/D only',()=>{
 for(const l of levels.slice(14)){
  assert.ok(l.horizontalOnly,l.id);assert.equal(l.startY,undefined,l.id);
  const data=referenceSamples(l);assert.ok(data.at(-1).x>data[0].x+20,l.id);
  for(const p of data){assert.ok(p.vx>=-1e-8,l.id);assert.equal(p.airborne,false,l.id);assert.equal(p.thrustY||0,0,l.id);}
 }
});
test('long downhill arc coordinates and tangential forces remain exact beyond the lookup bounds',()=>{
 const track=new Track('incline',24),norm=Math.hypot(1,.2);
 for(const x of [-1000,-20,6,90,1000]){const p=track.atS(track.sAtX(x));near(p.x,x);near(p.y,24-.2*x);near(p.tx,1/norm);near(p.ty,-.2/norm);}
 const sim=new Simulation(track,{allowFlight:true,thrustersEnabled:true,thrust:74.2,gravity:3.71},6,6);
 const initial=sim.snapshot(),p=advance(sim,4,{thrustX:-1});near(p.speed,6);near(p.distance,24);near(p.a,0);near(p.x,initial.x+24/norm);
});
test('the two driving gravity ramps match analytical speed and distance on a constant slope',()=>{
 for(const id of ['track-gravity-ramp-up','track-gravity-ramp-down']){
  const l=levels.find(l=>l.id===id),data=referenceSamples(l),p=data.at(-1),norm=Math.hypot(1,.2),u=l.reference(0);
  const a0=(u.motor||0)*l.motor+(u.thrustX*l.thrust/100+.2*l.gravityRamp.from)/norm;
  const jerk=.2*(l.gravityRamp.to-l.gravityRamp.from)/(norm*l.duration),t=l.duration;
  near(p.speed,l.initialV+a0*t+.5*jerk*t*t);
  near(p.distance,l.initialV*t+.5*a0*t*t+jerk*t*t*t/6,4e-6);
 }
});
test('combined motor/thruster phases require both controls, with a physically balanced cruise',()=>{
 const l=levels.find(l=>l.id==='track-motor-counterthrust'),data=referenceSamples(l);
 for(const p of data.filter(p=>p.t>3.05&&p.t<5.95)){near(p.speed,8);near(p.ax,0);assert.equal(p.motor,1);assert.equal(p.thrustX,-1);}
 assert.ok(!assess(l,data.map(p=>({...p,motor:0})),90).passed);
 assert.ok(!assess(l,data.map(p=>({...p,thrustX:0})),90).passed);
});
test('a matching speed shape cannot pass by driving backward',()=>{
 const l=levels[14],backward=referenceSamples(l).map(p=>({...p,x:12-p.x,vx:-p.vx}));
 const r=assess(l,backward,90);assert.equal(r.passed,false);assert.match(r.feedback,/traveling right/);
});
