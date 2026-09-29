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
   phases:[{from:0,to:6,type:'distance-up',label:'Get faster · steeper distance graph'}],speed:t=>1+1.5*t},
  {id:'distance-down',title:'Distance: concave down',graph:'distance',duration:6,initialV:12,motor:1.5,brake:1.5,
   instruction:'Make the distance graph get less steep. Hold Brake while the car keeps moving forward.',
   phases:[{from:0,to:6,type:'distance-down',label:'Get slower · flatter distance graph'}],speed:t=>12-1.5*t},
  {id:'speed-up-bend',title:'Speed: concave up',graph:'speed',duration:7,initialV:0,motor:.5,brake:2,
   instruction:'Hold Right and gradually raise Motor strength. The speed graph should get steeper and steeper.',
   phases:[{from:0,to:7,type:'speed-up',label:'Increase motor strength gradually'}],speed:t=>.5*t+.18*t*t},
  {id:'speed-down-bend',title:'Speed: concave down',graph:'speed',duration:7,initialV:0,motor:3,brake:2,
   instruction:'Hold Right and gradually lower Motor strength. Keep speeding up, but more and more slowly.',
   phases:[{from:0,to:7,type:'speed-down',label:'Reduce motor strength gradually'}],speed:t=>3*t-.16*t*t}
 ];
 function target(level,t){
  t=clamp(t,0,level.duration);
  if(level.graph==='speed')return level.speed(t);
  return level.id==='distance-up'?t+.75*t*t:12*t-.75*t*t;
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
 function assess(level,samples){
  const valid=Array.isArray(samples)&&samples.length>2&&samples.every(p=>Number.isFinite(p.t)&&Number.isFinite(p.speed)&&p.speed>=0&&Number.isFinite(p.distance));
  if(!valid)return {score:0,passed:false,parts:[],feedback:'Try making a complete graph.'};
  const parts=level.phases.map(p=>({label:p.label,type:p.type,score:phaseScore(p,samples)}));
  const score=Math.round(100*parts.reduce((sum,p)=>sum+p.score,0)/parts.length);
  const complete=samples.at(-1).t>=level.duration-.1;
  const passed=complete&&score>=65&&parts.every(p=>p.score>=.25);
  const weak=parts.reduce((a,b)=>a.score<b.score?a:b);
  const tips={rise:'Try making the rising part climb a little more.',fall:'Try slowing down more during the falling part.',flat:'Release both motor and brake during the coasting part, and keep rolling.','distance-up':'Speed up so your distance graph gets steeper.','distance-down':'Slow down while moving so your distance graph gets less steep.','speed-up':'Increase motor strength while holding Right, so your speed graph bends upward.','speed-down':'Reduce motor strength while holding Right, so your speed keeps rising more gently.'};
  return {score,passed,parts,feedback:passed?'Close enough — you made the right shape!':tips[weak.type]};
 }
 const api={levels,target,assess,phaseScore};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MotionChallenges=api;
})(typeof globalThis==='undefined'?this:globalThis);
