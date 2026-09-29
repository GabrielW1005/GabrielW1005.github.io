(function(root){
 'use strict';
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
  {id:'up-flat-down',title:'Up, level, down',graph:'speed',duration:10,initialV:0,motor:2,brake:2,
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
   instruction:'Hold Right and use D to gradually raise Motor strength. The speed graph should get steeper and steeper.',
   phases:[{from:0,to:7,type:'speed-up',label:'Increase motor strength gradually'}],speed:t=>.5*t+.18*t*t},
  {id:'speed-down-bend',title:'Speed: concave down',graph:'speed',duration:7,initialV:0,motor:3,brake:2,
   instruction:'Hold Right and use A to gradually lower Motor strength. Keep speeding up, but more and more slowly.',
   phases:[{from:0,to:7,type:'speed-down',label:'Reduce motor strength gradually'}],speed:t=>3*t-.16*t*t},
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
   instruction:'Hold Right and gradually press D to increase strength. At the coast phase, release Right and keep rolling.',
   phases:[{from:0,to:6,type:'speed-up',label:'Right + D · bend upward'},{from:6,to:9,type:'flat',label:'Release Right · coast'}],
   speed:t=>t<6?.5*t+.25*t*t:12},
  {id:'speed-two-bends',title:'Speed: switch the bend',graph:'speed',duration:10,initialV:0,motor:.5,brake:2,
   instruction:'Keep holding Right. Use D to raise strength in the first half, then A to lower it in the second half.',
   phases:[{from:0,to:5,type:'speed-up',label:'Right + D · concave up'},{from:5,to:10,type:'speed-down',label:'Right + A · concave down'}],
   speed:t=>t<5?.5*t+.25*t*t:8.75+3*(t-5)-.25*(t-5)**2}
 ];
 function target(level,t){
  t=clamp(t,0,level.duration);
  if(level.graph==='speed')return level.speed(t);
  return level.distance(t);
 }
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
 function assess(level,samples,passingScore=65){
  const threshold=clamp(Number.isFinite(passingScore)?passingScore:65,1,100);
  const valid=Array.isArray(samples)&&samples.length>2&&samples.every(p=>Number.isFinite(p.t)&&Number.isFinite(p.speed)&&p.speed>=0&&Number.isFinite(p.distance));
  if(!valid)return {score:0,passed:false,parts:[],feedback:'Try making a complete graph.'};
  const parts=level.phases.map(p=>({label:p.label,type:p.type,score:phaseScore(p,samples)}));
  const score=Math.round(100*parts.reduce((sum,p)=>sum+p.score,0)/parts.length);
  const complete=samples.at(-1).t>=level.duration-.1;
  const passed=complete&&score>=threshold&&parts.every(p=>p.score>=.25);
  const weak=parts.reduce((a,b)=>a.score<b.score?a:b);
  const tips={rise:'Try making the rising part climb a little more.',fall:'Try slowing down more during the falling part.',flat:'Release both motor and brake during the coasting part, and keep rolling.',stop:'Brake all the way to zero and wait through the stopped section.','distance-up':'Speed up so your distance graph gets steeper.','distance-down':'Slow down while moving so your distance graph gets less steep.','speed-up':'Use D to raise strength while holding Right, so your speed graph bends upward.','speed-down':'Use A to lower strength while holding Right, so your speed keeps rising more gently.'};
  return {score,passed,parts,threshold,feedback:passed?'Close enough — you made the right shape!':!complete?'Finish the whole graph before checking your match.':tips[weak.type]};
 }
 const api={levels,target,assess,phaseScore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotionChallenges=api;
})(typeof globalThis==='undefined'?this:globalThis);
