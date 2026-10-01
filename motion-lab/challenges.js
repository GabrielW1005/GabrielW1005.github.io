(function(root){
 'use strict';
 const Physics=typeof module!=='undefined'&&module.exports?require('./physics.js'):root.MotionPhysics;
 const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
 const levels=[
  {id:'rise-coast',title:'Speed up, then coast',graph:'speed',duration:7,initialV:0,motor:2,brake:2,
   instruction:'Hold Right to make the speed graph rise. When the shaded phase changes, release to coast.',
   phases:[{from:0,to:3,type:'rise',label:'Speed up'},{from:3,to:7,type:'flat',label:'Coast'}],
   speed:t=>t<3?2*t:6},
  {id:'fall-coast',title:'Slow down, then coast',graph:'speed',duration:7,initialV:9,motor:2,brake:2,
   instruction:'Hold Brake to make the speed graph fall. Release after 3 seconds and keep rolling.',
   phases:[{from:0,to:3,type:'fall',label:'Slow down'},{from:3,to:7,type:'flat',label:'Coast'}],
   speed:t=>t<3?9-2*t:3},
  {id:'up-flat-down',title:'Up, level, down',graph:'speed',duration:10,initialV:0,motor:2,brake:1.5,
   instruction:'Speed up, coast, then slow down. Aim for the three shapes; small timing differences are okay.',
   phases:[{from:0,to:3,type:'rise',label:'Speed up'},{from:3,to:6,type:'flat',label:'Coast'},{from:6,to:10,type:'fall',label:'Slow down'}],
   speed:t=>t<3?2*t:t<6?6:Math.max(0,6-1.5*(t-6))},
  {id:'distance-up',title:'Distance: concave up',graph:'distance',duration:6,initialV:1,motor:1.5,brake:1.5,
   instruction:'Make the distance graph get steeper. Hold Right: increasing speed makes distance bend upward.',
   phases:[{from:0,to:6,type:'distance-up',label:'Get faster · steeper distance graph'}],speed:t=>1+1.5*t,distance:t=>t+.75*t*t},
  {id:'distance-down',title:'Distance: concave down',graph:'distance',duration:6,initialV:12,motor:1.5,brake:1.5,
   instruction:'Make the distance graph get less steep. Hold Brake while the car keeps moving forward.',
   phases:[{from:0,to:6,type:'distance-down',label:'Get slower · flatter distance graph'}],speed:t=>12-1.5*t,distance:t=>12*t-.75*t*t},
  {id:'speed-up-bend',title:'Speed: concave up',graph:'speed',duration:7,initialV:0,motor:.5,brake:2,
   instruction:'Hold Right and hold L to smoothly raise Motor strength. The speed graph should get steeper and steeper.',
   phases:[{from:0,to:7,type:'speed-up',label:'Increase motor strength gradually'}],speed:t=>.5*t+.25*t*t},
  {id:'speed-down-bend',title:'Speed: concave down',graph:'speed',duration:7,initialV:0,motor:4,brake:2,
   instruction:'Hold Right and hold J to smoothly lower Motor strength. Keep speeding up, but more and more slowly.',
   phases:[{from:0,to:7,type:'speed-down',label:'Reduce motor strength gradually'}],speed:t=>4*t-.25*t*t},
  {id:'coast-rise-coast',title:'Cruise, boost, cruise',graph:'speed',duration:9,initialV:3,motor:1.5,brake:2,
   instruction:'Press Run and coast first. Hold Right for the rising middle section, then release to cruise faster.',
   phases:[{from:0,to:3,type:'flat',label:'Coast'},{from:3,to:6,type:'rise',label:'Speed up'},{from:6,to:9,type:'flat',label:'Coast faster'}],
   speed:t=>t<3?3:t<6?3+1.5*(t-3):7.5},
  {id:'down-up',title:'Slow, cruise, speed up',graph:'speed',duration:8,initialV:9,motor:2,brake:2,
   instruction:'Brake, release to coast at a lower speed, then hold Right to speed up again.',
   phases:[{from:0,to:3,type:'fall',label:'Slow down'},{from:3,to:5,type:'flat',label:'Coast'},{from:5,to:8,type:'rise',label:'Speed up again'}],
   speed:t=>t<3?9-2*t:t<5?3:3+2*(t-5)},
  {id:'stop-go',title:'Stop, wait, go',graph:'speed',duration:9,initialV:6,motor:1.5,brake:2,
   instruction:'Brake to a stop, wait through the middle section, then hold Right. A flat line at zero means stopped.',
   phases:[{from:0,to:3,type:'fall',label:'Brake to a stop'},{from:3,to:5,type:'stop',label:'Stay stopped'},{from:5,to:9,type:'rise',label:'Start moving again'}],
   speed:t=>t<3?Math.max(0,6-2*t):t<5?0:1.5*(t-5)},
  {id:'distance-coast-bend',title:'Distance: straight, bend, straight',graph:'distance',duration:9,initialV:2,motor:1.5,brake:2,
   instruction:'Press Run and coast. Speed up in the middle, then coast again to make a steeper straight distance line.',
   phases:[{from:0,to:3,type:'flat',label:'Coast · straight distance line'},{from:3,to:6,type:'distance-up',label:'Speed up · bend upward'},{from:6,to:9,type:'flat',label:'Coast · steeper straight line'}],
   speed:t=>t<3?2:t<6?2+1.5*(t-3):6.5,
   distance:t=>t<3?2*t:t<6?6+2*(t-3)+.75*(t-3)**2:18.75+6.5*(t-6)},
  {id:'distance-bend-switch',title:'Distance: switch the bend',graph:'distance',duration:8,initialV:2,motor:1.5,brake:1.5,
   instruction:'Hold Right, then Brake. Make distance bend upward first and downward second, while still moving.',
   phases:[{from:0,to:4,type:'distance-up',label:'Speed up · concave up'},{from:4,to:8,type:'distance-down',label:'Slow down · concave down'}],
   speed:t=>t<4?2+1.5*t:8-1.5*(t-4),distance:t=>t<4?2*t+.75*t*t:20+8*(t-4)-.75*(t-4)**2},
  {id:'speed-bend-coast',title:'Curve up, then cruise',graph:'speed',duration:9,initialV:0,motor:.5,brake:2,
   instruction:'Hold Right and hold L to increase strength. At the coast phase, release Right and keep rolling.',
   phases:[{from:0,to:6,type:'speed-up',label:'Right + L · bend upward'},{from:6,to:9,type:'flat',label:'Release Right · coast'}],
   speed:t=>t<6?.5*t+.25*t*t:12},
  {id:'speed-two-bends',title:'Speed: switch the bend',graph:'speed',duration:10,initialV:0,motor:.5,brake:2,
   instruction:'Keep holding Right. Hold L to raise strength in the first half, then J to lower it in the second half.',
   phases:[{from:0,to:5,type:'speed-up',label:'Right + L · concave up'},{from:5,to:10,type:'speed-down',label:'Right + J · concave down'}],
   speed:t=>t<5?.5*t+.25*t*t:8.75+3*(t-5)-.25*(t-5)**2}
 ];
 const phase=(from,to,type,label,control,hint)=>({from,to,type,label,control,hint});
 const jetLevel=(id,title,gravity,thrust,duration,startY,initialVy,phases,reference,instruction,extra={})=>({id,title,gravity,thrust,duration,startY,initialVy,initialV:0,motor:2,brake:2,graph:'speed',thrusters:true,phases,reference,instruction,...extra});
 levels.push(
  jetLevel('moon-balance','Moon: fall, then steady',1.62,162,7,100,-4,
   [phase(0,3,'rise','Release jets · speed up falling'),phase(3,7,'flat','Hold W · balance Moon gravity','up','Hold W: 162 N balances the 100 kg car’s weight on the Moon.')],
   t=>({thrustY:t>=3?1:0}),
   'Press Run. Fall freely for 3 s, then hold W. The preset 162 N upward thrust balances Moon gravity: the car keeps falling at a constant speed.'),
  jetLevel('mars-balance','Mars: fall, then steady',3.71,371,6,140,-3,
   [phase(0,2,'rise','Release jets · fall faster'),phase(2,6,'flat','Hold W · balance Mars gravity','up','Hold W: 371 N balances the car’s weight on Mars.')],
   t=>({thrustY:t>=2?1:0}),
   'Press Run, then hold W after 2 s. Mars gravity is stronger, so this challenge presets 371 N of thrust to keep the falling speed constant.'),
  jetLevel('earth-balance','Earth: fall, then steady',9.81,981,6,180,-2,
   [phase(0,2,'rise','Release jets · Earth free fall'),phase(2,6,'flat','Hold W · balance Earth gravity','up','Hold W: 981 N balances the car’s weight on Earth.')],
   t=>({thrustY:t>=2?1:0}),
   'Press Run and watch Earth gravity steepen the speed graph. After 2 s, hold W: 981 N upward balances gravity without stopping the falling car.'),
  jetLevel('moon-launch','Moon: rocket up, then release',1.62,400,6,undefined,0,
   [phase(0,3,'rise','Hold W · accelerate upward','up'),phase(3,6,'fall','Release W · gravity slows the climb')],
   t=>({thrustY:t<3?1:0}),
   'Hold W for 3 s, then release. The 400 N jet lifts the car against Moon gravity. Its speed falls after release even while it is still going up.'),
  jetLevel('mars-launch','Mars: rocket up, then release',3.71,800,6,undefined,0,
   [phase(0,3,'rise','Hold W · launch on Mars','up'),phase(3,6,'fall','Release W · slow the climb')],
   t=>({thrustY:t<3?1:0}),
   'Hold W for 3 s, then release. This Mars launch uses 800 N. The target includes Mars gravity during both powered flight and the unpowered climb.'),
  jetLevel('earth-launch','Earth: a stronger launch',9.81,1600,4.5,undefined,0,
   [phase(0,3,'rise','Hold W · launch on Earth','up'),phase(3,4.5,'fall','Release W · gravity slows the climb')],
   t=>({thrustY:t<3?1:0}),
   'Hold W for 3 s, then release for 1.5 s. The preset 1600 N jet lifts this 100 kg car on Earth. Gravity keeps acting while the jet fires.'),
  jetLevel('space-push-coast','Zero gravity: push, coast, brake',0,200,9,12,0,
   [phase(0,3,'rise','Hold D · push right','right'),phase(3,6,'flat','Release all jets · coast'),phase(6,9,'fall','Hold A · oppose the motion','left')],
   t=>({thrustX:t<3?1:t<6?0:-1}),
   'Use D to push right for 3 s, release all jets for 3 s, then use A to slow down. In zero gravity, no thrust means constant velocity.'),
  jetLevel('space-reverse','Zero gravity: reverse horizontally',0,200,4,12,0,
   [phase(0,2,'distance-down','Hold A · slow rightward motion','left'),phase(2,4,'distance-up','Keep A held · speed up to the left','left')],
   ()=>({thrustX:-1}),
   'The car starts moving right at 4 m/s. Hold A throughout: it stops, reverses, and speeds up leftward. Total distance keeps increasing through the reversal.',{initialV:4,graph:'distance'}),
  jetLevel('space-down','Zero gravity: up, stop, down',0,200,6,60,6,
   [phase(0,3,'fall','Hold S · slow the upward motion','down'),phase(3,6,'rise','Keep S held · speed up downward','down')],
   ()=>({thrustY:-1}),
   'The car starts moving upward at 6 m/s. Hold S throughout. A downward force first reduces its speed, then increases its speed after it reverses.'),
  jetLevel('gravity-switch','Gravity lab: Moon → Mars → Earth',1.62,371,7.5,250,-2,
   [phase(0,2,'rise','Moon · release jets'),phase(2,4.5,'flat','Mars · hold W','up','Hold W when Mars gravity begins; 371 N balances it.'),phase(4.5,7.5,'rise','Earth · keep W held','up')],
   t=>({thrustY:t>=2?1:0}),
   'A simulated gravity switch happens at 2 s and 4.5 s. Start with no jets, then hold W from 2 s onward. The same 371 N balances Mars gravity but cannot balance Earth gravity.',
   {gravitySchedule:[{at:0,value:1.62,name:'Moon'},{at:2,value:3.71,name:'Mars'},{at:4.5,value:9.81,name:'Earth'}]}),
  jetLevel('gravity-ramp-up','Gravity lab: increasing gravity',1.62,162,6,100,-3,
   [phase(0,6,'speed-up','Hold W · gravity grows stronger','up','Keep W held as simulated gravity increases; the falling speed should bend upward.')],
   ()=>({thrustY:1}),
   'Hold W throughout. In this artificial gravity experiment, g rises smoothly from Moon to Mars strength. The preset 162 N initially balances gravity, then becomes insufficient.',
   {gravityRamp:{from:1.62,to:3.71,label:'Moon → Mars'}}),
  jetLevel('gravity-ramp-down','Gravity lab: decreasing gravity',9.81,200,6,220,-3,
   [phase(0,6,'speed-down','Hold S · gravity gets weaker','down','Hold S while gravity decreases: falling speed still rises, but less steeply.')],
   ()=>({thrustY:-1}),
   'Hold S throughout. Simulated gravity gradually decreases from Earth to Mars strength. Your constant downward thrust and the weakening gravity make speed rise less and less steeply.',
   {gravityRamp:{from:9.81,to:3.71,label:'Earth → Mars'}}),
  jetLevel('earth-descent-brake','Earth: brake a descent with thrust',9.81,1200,6,120,-12,
   [phase(0,4,'fall','Hold W · slow the descent','up'),phase(4,6,'rise','Release W · fall faster again')],
   t=>({thrustY:t<4?1:0}),
   'The car starts falling at 12 m/s. Hold W for 4 s: the upward thrust is stronger than its weight, so it slows down. Release W to accelerate downward again.'),
  jetLevel('mars-dive-brake','Mars: dive, then brake',3.71,800,6,160,-2,
   [phase(0,2,'rise','Hold S · downward thrust','down'),phase(2,6,'fall','Hold W · upward thrust','up')],
   t=>({thrustY:t<2?-1:1}),
   'Hold S for 2 s to add downward thrust to Mars gravity. Then hold W for 4 s to reduce the falling speed. Watch the signed vertical velocity as well as speed.')
 );
 function gravityName(g){return Math.abs(g-9.81)<.001?'Earth':Math.abs(g-1.62)<.001?'Moon':Math.abs(g-3.71)<.001?'Mars':g===0?'Zero gravity':'Custom gravity';}
 function environment(level,t=0){
  if(level.gravityRamp){const r=level.gravityRamp;return {value:r.from+(r.to-r.from)*clamp(t/level.duration),name:r.label,note:'Simulated gravity ramp · '+r.from.toFixed(2)+' → '+r.to.toFixed(2)+' m/s²'};}
  if(level.gravitySchedule){const schedule=level.gravitySchedule,current=schedule.filter(p=>p.at<=t+1e-8).at(-1),next=schedule.find(p=>p.at>t+1e-8);return {...current,note:next?'Next: '+next.name+' at '+next.at+' s':'Simulated gravity switches'};}
  const value=level.gravity??9.81;return {value,name:gravityName(value),note:'Gravity acts downward'};
 }
 function makeSimulation(level){
  return new Physics.Simulation(new Physics.Track(level.kind||'flat',level.height||7),{gravity:environment(level,0).value,motor:level.motor,brake:level.brake,mass:100,thrust:level.thrust||1200,thrustersEnabled:Boolean(level.thrusters),allowFlight:Boolean(level.thrusters),startY:level.startY,initialVy:level.initialVy||0},6,level.initialV);
 }
 const traces=new Map();
 function referenceSamples(level){
  if(traces.has(level.id))return traces.get(level.id);
  const sim=makeSimulation(level),first=level.reference(0),data=[{...sim.snapshot(first),...first}];
  for(let i=0;i<Math.round(level.duration*240);i++){
   const t=i/240,command=level.reference(t);
   sim.settings.gravity=environment(level,t+1/480).value;sim.step(1/240,command);
   sim.settings.gravity=environment(level,(i+1)/240).value;
   if((i+1)%12===0)data.push({...sim.snapshot(command),...command});
  }
  traces.set(level.id,data);return data;
 }
 function referenceValue(level,t,key){
  const points=referenceSamples(level),u=clamp(t,0,level.duration)*20,i=Math.min(points.length-2,Math.floor(u)),f=u-i;
  return points[i][key]*(1-f)+points[i+1][key]*f;
 }
 for(const l of levels.filter(l=>l.reference)){l.speed=t=>referenceValue(l,t,'speed');l.distance=t=>referenceValue(l,t,'distance');}
 function target(level,t){t=clamp(t,0,level.duration);return level.graph==='speed'?level.speed(t):level.distance(t);}
 function regression(points,key='speed'){
  if(points.length<2)return 0;
  const mt=points.reduce((a,p)=>a+p.t,0)/points.length,mv=points.reduce((a,p)=>a+p[key],0)/points.length;
  let covariance=0,variance=0;for(const p of points){covariance+=(p.t-mt)*(p[key]-mv);variance+=(p.t-mt)**2;}
  return variance?covariance/variance:0;
 }
 function phaseScore(phase,all){
  const duration=phase.to-phase.from,trim=Math.min(.65,duration*.17),start=phase.from+trim,end=phase.to-trim;
  const points=all.filter(p=>p.t>=start&&p.t<=end);
  if(points.length<6)return 0;
  const bins=[];for(let i=0;i<4;i++)bins.push(points.filter(p=>p.t>=start+(end-start)*i/4&&p.t<=start+(end-start)*(i+1)/4));
  const slopes=bins.map(p=>regression(p)),total=regression(points)*(end-start),mean=points.reduce((a,p)=>a+p.speed,0)/points.length;
  const increasing=sign=>clamp(sign*total/1.1)*(0.55+0.45*slopes.filter(s=>sign*s>.06).length/4);
  if(phase.type==='rise'||phase.type==='distance-up')return increasing(1);
  if(phase.type==='fall'||phase.type==='distance-down')return increasing(-1);
  if(phase.type==='stop')return clamp(1-Math.max(...points.map(p=>p.speed))/.8);
  if(phase.type==='flat'){
   const range=Math.max(...points.map(p=>p.speed))-Math.min(...points.map(p=>p.speed));
   const allowance=Math.max(.45,.13*mean);
   return clamp(mean/.8)*clamp(1-(Math.max(0,range-allowance)/(allowance*3)));
  }
  const sign=phase.type==='speed-up'?1:-1;
  const bend=sign*((slopes[2]+slopes[3])/2-(slopes[0]+slopes[1])/2);
  const keepsRising=slopes.filter(s=>s>=-.08).length/4;
  return increasing(1)*clamp(bend/.65)*keepsRising;
 }
 function assess(level,samples,passingScore=90){
  const threshold=clamp(Number.isFinite(passingScore)?passingScore:90,90,100);
  const valid=Array.isArray(samples)&&samples.length>2&&samples.every(p=>Number.isFinite(p.t)&&Number.isFinite(p.speed)&&p.speed>=0&&Number.isFinite(p.distance));
  if(!valid)return {score:0,passed:false,parts:[],feedback:'Try making a complete graph.'};
  const parts=level.phases.map(p=>{
   let score=phaseScore(p,samples);
   if(p.control){
    const trim=Math.min(.65,(p.to-p.from)*.17),section=samples.filter(s=>s.t>=p.from+trim&&s.t<=p.to-trim);
    const correct=s=>p.control==='up'?s.thrustY>0:p.control==='down'?s.thrustY<0:p.control==='right'?s.thrustX>0:s.thrustX<0;
    score*=section.length?clamp(section.filter(correct).length/section.length/.6):0;
   }
   return {label:p.label,type:p.type,score,hint:p.hint||(p.control?'Use the '+{up:'W',down:'S',left:'A',right:'D'}[p.control]+' thruster during this phase.':null)};
  });
  const score=Math.round(100*parts.reduce((sum,p)=>sum+p.score,0)/parts.length);
  const complete=samples.at(-1).t>=level.duration-.1;
  const passed=complete&&score>=threshold&&parts.every(p=>p.score>=.25);
  const weak=parts.reduce((a,b)=>a.score<b.score?a:b);
  const tips={rise:'Try making the rising part climb a little more.',fall:'Try slowing down more during the falling part.',flat:'Release both motor and brake during the coasting part, and keep rolling.',stop:'Brake all the way to zero and wait through the stopped section.','distance-up':'Speed up so your distance graph gets steeper.','distance-down':'Slow down while moving so your distance graph gets less steep.','speed-up':'Hold L to raise strength while holding Right, so your speed graph bends upward.','speed-down':'Hold J to lower strength while holding Right, so your speed keeps rising more gently.'};
  return {score,passed,parts,threshold,feedback:passed?'Close enough — you made the right shape!':!complete?'Finish the whole graph before checking your match.':weak.hint||tips[weak.type]};
 }
 const api={levels,target,assess,phaseScore,gravityName,environment,makeSimulation,referenceSamples};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotionChallenges=api;
})(typeof globalThis==='undefined'?this:globalThis);
