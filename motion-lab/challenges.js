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
 const driveLevel=(id,title,gravity,thrust,duration,initialV,phases,reference,instruction,extra={})=>({id,title,gravity,thrust,duration,initialV,motor:2,brake:2,graph:'speed',thrusters:true,horizontalOnly:true,phases,reference,instruction,...extra});
 levels.push(
  driveLevel('track-boost-coast-brake','Thrust right, coast, slow down',9.81,200,9,2,
   [phase(0,3,'rise','Hold D · boost right','right'),phase(3,6,'flat','Release all controls · coast','coast'),phase(6,9,'fall','Hold A · slow down, still moving right','left')],
   t=>({thrustX:t<3?1:t<6?0:-1}),
   'Drive left to right: hold D for 3 s, release for 3 s, then hold A for 3 s. A pushes left to slow the car while it keeps rolling right. No wheel motor is needed.'),
  driveLevel('track-cruise-boost','Moon road: cruise, boost, cruise',1.62,150,9,3,
   [phase(0,3,'flat','Press Run · coast','coast'),phase(3,6,'rise','Hold D · speed up','right'),phase(6,9,'flat','Release D · cruise faster','coast')],
   t=>({thrustX:t>=3&&t<6?1:0}),
   'Press Run, coast for 3 s, hold D for 3 s, then release. The car travels right along a flat road. Moon gravity acts downward, so it does not change horizontal acceleration here.'),
  driveLevel('track-a-braking','Mars road: brake with A',3.71,200,7,12,
   [phase(0,3,'fall','Hold A · reduce rightward speed','left'),phase(3,7,'flat','Release A · keep rolling right','coast')],
   t=>({thrustX:t<3?-1:0}),
   'The car starts moving right at 12 m/s. Hold A for 3 s, then release and coast. A is a leftward force, not a command to instantly move left.'),
  driveLevel('track-distance-boost','Distance: boost, then cruise',9.81,150,8,2,
   [phase(0,4,'distance-up','Hold D · distance gets steeper','right'),phase(4,8,'flat','Release D · straight distance line','coast')],
   t=>({thrustX:t<4?1:0}),
   'Hold D for 4 s, then release. Keep traveling right: increasing speed curves the distance graph upward, then coasting makes it straight.',{graph:'distance'}),
  driveLevel('track-distance-slow-boost','Distance: slow, then boost',1.62,150,6,10,
   [phase(0,3,'distance-down','Hold A · flatten the distance curve','left'),phase(3,6,'distance-up','Switch to D · steepen the distance curve','right')],
   t=>({thrustX:t<3?-1:1}),
   'Start rolling right at 10 m/s. Hold A for 3 s, then switch to D for 3 s. The car keeps moving right while the distance graph changes from concave down to concave up.',{graph:'distance'}),
  driveLevel('track-motor-boost','Motor, extra thrust, then coast',9.81,150,9,0,
   [phase(0,3,'rise','Hold Right arrow · wheel motor','motor-right'),phase(3,6,'rise','Right arrow + D · combine both forces',['motor-right','right']),phase(6,9,'flat','Release both · coast','coast')],
   t=>({motor:t<6?1:0,thrustX:t>=3&&t<6?1:0}),
   'Hold Right arrow for 3 s. Keep it held and add D for the next 3 s to make the speed graph steeper. Release both for the final 3 s. The motor starts at 1.50 m/s².',{motor:1.5}),
  driveLevel('track-motor-counterthrust','Motor versus a braking thruster',3.71,200,9,2,
   [phase(0,3,'rise','Hold Right arrow · speed up','motor-right'),phase(3,6,'flat','Right arrow + A · balance the forces',['motor-right','left']),phase(6,9,'fall','Release Right; keep A · slow down','left')],
   t=>({motor:t<6?1:0,thrustX:t>=3?-1:0}),
   'Hold Right arrow for 3 s, then add A for 3 s. The preset motor and leftward jet balance, so the car keeps moving right at constant speed. Finally release Right but keep A for 3 s.',{motor:2}),
  driveLevel('track-motor-curve-up','Motor + D: bend speed upward',9.81,100,7,1,
   [phase(0,7,'speed-up','Right arrow + D + L · increase motor strength',['motor-right','right'])],
   ()=>({motor:1,thrustX:1,power:1}),
   'Hold Right arrow and D throughout. Also hold L to smoothly increase motor strength from its preset 0.50 m/s². Both forces push right; increasing motor strength makes speed concave up.',{motor:.5}),
  driveLevel('track-motor-curve-down','Motor + A: bend speed downward',9.81,100,7,1,
   [phase(0,7,'speed-down','Right arrow + A + J · reduce motor strength',['motor-right','left'])],
   ()=>({motor:1,thrustX:-1,power:-1}),
   'Hold Right arrow and A throughout, and hold J to reduce motor strength from 5.00 m/s². The motor still overcomes the leftward jet, so speed rises more and more slowly.',{motor:5}),
  driveLevel('track-moon-downhill','Moon ramp: roll, then boost',1.62,200,9,2,
   [phase(0,5,'rise','Press Run · roll downhill under gravity','coast'),phase(5,9,'rise','Hold D · add a rightward boost','right')],
   t=>({thrustX:t>=5?1:0}),
   'Press Run and roll down the ramp for 5 s, then hold D for 4 s. Even with the motor off, Moon gravity speeds the car up downhill. D adds a horizontal force.',{kind:'incline',height:18}),
  driveLevel('track-mars-downhill','Mars ramp: D, then A',3.71,200,8,6,
   [phase(0,4,'rise','Hold D · boost down the ramp','right'),phase(4,8,'fall','Switch to A · slow the descent','left')],
   t=>({thrustX:t<4?1:-1}),
   'Hold D for 4 s down the Mars ramp, then switch to A for 4 s. The 200 N leftward jet is strong enough to reduce speed despite downhill gravity. Keep moving right.',{kind:'incline',height:24}),
  driveLevel('track-gravity-switch','Ramp: Moon → Mars → Earth',1.62,74.2,10,6,
   [phase(0,4,'fall','Moon · hold A to slow down','left'),phase(4,7,'flat','Mars · keep A held to balance the slope','left'),phase(7,10,'rise','Earth · keep A held as gravity wins','left')],
   ()=>({thrustX:-1}),
   'Hold A throughout while driving right down a 1-in-5 ramp. This artificial gravity lab switches to Mars at 4 s and Earth at 7 s. The preset 74.2 N jet slows you on the Moon, balances the Mars slope, and cannot balance the Earth slope.',
   {kind:'incline',height:24,gravitySchedule:[{at:0,value:1.62,name:'Moon'},{at:4,value:3.71,name:'Mars'},{at:7,value:9.81,name:'Earth'}]}),
  driveLevel('track-gravity-ramp-up','Ramp: stronger gravity, steeper speed',1.62,100,8,2,
   [phase(0,8,'speed-up','Right arrow + D · gravity grows stronger',['motor-right','right'])],
   ()=>({motor:1,thrustX:1}),
   'Hold Right arrow and D down the ramp. Motor strength and thrust stay fixed while simulated gravity rises smoothly from Moon to Earth strength. The increasing downhill pull bends the speed graph upward.',
   {kind:'incline',height:24,motor:1,gravityRamp:{from:1.62,to:9.81,label:'Moon → Earth'}}),
  driveLevel('track-gravity-ramp-down','Ramp: weaker gravity, gentler speed',9.81,100,8,2,
   [phase(0,8,'speed-down','Hold D · gravity grows weaker','right')],
   ()=>({thrustX:1}),
   'Hold D while rolling right down the ramp. In this artificial experiment, gravity decreases smoothly from Earth to Moon strength. Speed still rises, but less steeply, making the graph concave down.',
   {kind:'incline',height:24,gravityRamp:{from:9.81,to:1.62,label:'Earth → Moon'}})
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
   const t=i/240,command=level.reference(t),motor=sim.settings.motor,nextMotor=Physics.rampMotor(motor,command.power||0,1/240);
   sim.settings.motor=(motor+nextMotor)/2;
   sim.settings.gravity=environment(level,t+1/480).value;sim.step(1/240,command);
   sim.settings.motor=nextMotor;sim.settings.gravity=environment(level,(i+1)/240).value;
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
    const controls=Array.isArray(p.control)?p.control:[p.control];
    const correct=s=>controls.every(c=>c==='motor-right'?s.motor>0:c==='coast'?!(s.motor||s.brake||s.thrustX||s.thrustY):c==='up'?s.thrustY>0:c==='down'?s.thrustY<0:c==='right'?s.thrustX>0:s.thrustX<0);
    score*=section.length?clamp(section.filter(correct).length/section.length/.6):0;
   }
   return {label:p.label,type:p.type,score,hint:p.hint||(p.control?'During this phase: '+p.label+'.':null)};
  });
  const score=Math.round(100*parts.reduce((sum,p)=>sum+p.score,0)/parts.length);
  const complete=samples.at(-1).t>=level.duration-.1;
  const forward=!level.horizontalOnly||(samples.every(p=>Number.isFinite(p.x)&&Number.isFinite(p.vx))&&samples.at(-1).x>samples[0].x+1&&samples.filter(p=>p.vx<-.2).length<=samples.length*.02);
  const passed=complete&&forward&&score>=threshold&&parts.every(p=>p.score>=.25);
  const weak=parts.reduce((a,b)=>a.score<b.score?a:b);
  const tips={rise:'Try making the rising part climb a little more.',fall:'Try slowing down more during the falling part.',flat:'Release both motor and brake during the coasting part, and keep rolling.',stop:'Brake all the way to zero and wait through the stopped section.','distance-up':'Speed up so your distance graph gets steeper.','distance-down':'Slow down while moving so your distance graph gets less steep.','speed-up':'Hold L to raise strength while holding Right, so your speed graph bends upward.','speed-down':'Hold J to lower strength while holding Right, so your speed keeps rising more gently.'};
  return {score,passed,parts,threshold,feedback:passed?'Close enough — you made the right shape!':!complete?'Finish the whole graph before checking your match.':!forward?'Keep traveling right along the track. Release A before the car reverses.':weak.hint||tips[weak.type]};
 }
 const api={levels,target,assess,phaseScore,gravityName,environment,makeSimulation,referenceSamples};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotionChallenges=api;
})(typeof globalThis==='undefined'?this:globalThis);
