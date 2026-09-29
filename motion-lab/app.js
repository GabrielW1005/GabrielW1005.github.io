/* Motion Lab: full-window driving, live graphs, and approximate shape challenges. */
(() => {
 'use strict';
 const {Track,Simulation,clamp}=window.MotionPhysics;
 const {levels,target,assess}=window.MotionChallenges;
 const $=id=>document.getElementById(id),DT=1/240,MAX_TIME=120;
 const trackNames={adventure:'Adventure course',rollers:'Rolling hills',flat:'Flat road',ramp:'Downhill',valley:'The valley',hill:'Over the hill'};
 const config={kind:'adventure',height:7,gravity:9.81,motor:3.5,initialV:0,startX:6,allowFlight:true};
 let track,sim,mode='explore',running=false,ended=false,ticks=0,samples=[],parkHold=0;
 let levelIndex=0,unlocked=0,passedLevels=new Set(),lastResult=null,savedExplore=null;
 let passingScore=65;
 try{const saved=localStorage.getItem('motion-lab-passing-score');if(saved!==null&&Number.isFinite(Number(saved)))passingScore=clamp(Math.round(Number(saved)),1,100);}catch{}
 let accumulator=0,lastFrame=0,lastPaint=0,hoverTime=null,cameraLeft=-5,cameraBottom=-6,view=null,dragPointer=null;
 const keySet=new Set(),pointerMap=new Map();
 const level=()=>levels[levelIndex];
 const fmt=(value,n=2)=>(Math.abs(value)<.5*10**-n?0:value).toFixed(n);
 function input(){
  let left=keySet.has('ArrowLeft'),right=keySet.has('ArrowRight'),brake=keySet.has('ArrowDown')||keySet.has('s');
  for(const a of pointerMap.values()){left ||= a==='left';right ||= a==='right';brake ||= a==='brake';}
  return {motor:Number(right)-Number(left),brake};
 }
 function syncDrive(){
  const i=input();$('drive-left').classList.toggle('active',i.motor<0);$('drive-right').classList.toggle('active',i.motor>0);$('brake').classList.toggle('active',i.brake);
  $('drive-state').textContent=sim?.crashed?'Missed landing · reset to retry':sim?.missed?(config.gravity?'Missed jump · falling into the pit':'Missed jump · drifting without gravity'):sim?.air?'Airborne · gravity only':i.brake?'Braking':i.motor?'Motor on · A less strength / D more':'Hold ←/→ to drive · release to coast · ↓ to brake';
 }
 function clearInputs(){keySet.clear();pointerMap.clear();syncDrive();}
 function setRunning(value){running=Boolean(value)&&!ended;if(!running)clearInputs();accumulator=0;lastFrame=0;syncControls();}
 function syncControls(){
  $('play').textContent=running?'Ⅱ Pause':'▶ '+(sim.t>0?'Resume':'Run');$('play').disabled=ended;$('step').disabled=running||ended;
  $('run-status').textContent=sim.crashed?'Missed landing':ended?'Run complete':!running&&sim.t>0?'Paused':sim.missed?(config.gravity?'Falling into pit':'Drifting'):running?'Running':'Ready to roll';
  $('run-status').classList.toggle('running',running);
  $('scene-note').textContent=sim.crashed?'Reset and try a little more speed for the jump.':sim.missed?'Missed the landing — watch what gravity does.':ended?'Reset to try again, or choose your next challenge.':mode==='match'?'Follow the graph shape and the shaded time phases.':sim.t===0&&!running?'Hold Right to drive · drag the car before starting':'← / → drive · A / D strength · ↓ brake';
 }
 function syncMotor(){config.motor=clamp(config.motor,.25,6);$('motor').value=config.motor;$('motor-output').textContent=fmt(config.motor,2).replace(/0$/,'')+' m/s²';if(sim)sim.settings.motor=config.motor;}
 function syncSettings(){
  document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
  document.querySelectorAll('[data-track]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.track===config.kind));b.disabled=mode==='match';});
  $('height').value=config.height;$('height-output').textContent=config.height+' m';$('height').disabled=mode==='match'||config.kind==='flat';
  $('initial-speed').value=config.initialV;$('initial-speed-output').textContent=(config.initialV>0?'+':'')+config.initialV+' m/s';$('initial-speed').disabled=mode==='match';
  $('gravity').value=config.gravity;$('gravity').disabled=mode==='match';$('allow-jumps').checked=config.allowFlight;$('allow-jumps').disabled=mode==='match';
  $('settings-note').textContent=mode==='match'?'This challenge uses a flat road and a fixed starting velocity. Adjust Motor strength while driving.':'Changing these settings starts a new run. Motor strength can be adjusted while driving.';
  $('track-title').textContent=trackNames[config.kind];syncMotor();
 }
 function syncChallenge(){
  $('challenge').hidden=mode!=='match';$('parking').hidden=mode!=='park';
  $('distance-card').classList.toggle('target',mode==='match'&&level().graph==='distance');$('speed-card').classList.toggle('target',mode==='match'&&level().graph==='speed');
  $('distance-caption').textContent=mode==='match'&&level().graph==='distance'?'Gold dashes: example shape. Blue: your distance.':'Steeper means faster. Distance always adds up.';
  $('speed-caption').textContent=mode==='match'&&level().graph==='speed'?'Gold dashes: example shape. Green: your speed.':'Up: faster. Down: slower. Level: constant speed.';
  $('passing-score').value=passingScore;$('passing-score-output').textContent=passingScore+'%';
  $('target-hint').textContent=mode==='match'?'Match the shape. Exact heights are flexible; '+passingScore+'% unlocks the next challenge.':'Time is on the horizontal axis of both graphs.';
  if(mode!=='match')return;
  const l=level();$('challenge-count').textContent='CHALLENGE '+(levelIndex+1)+' / '+levels.length;$('challenge-title').textContent=l.title;$('challenge-description').textContent=l.instruction;
  $('challenge').classList.toggle('success',Boolean(lastResult?.passed));
  $('challenge-result').textContent=lastResult?lastResult.score+'% · '+lastResult.feedback+(passedLevels.has(levelIndex)&&!lastResult.passed?' (Previously unlocked.)':''):'Match the shape, roughly.';
  $('next-challenge').disabled=!passedLevels.has(levelIndex);$('next-challenge').textContent=levelIndex===levels.length-1?'Explore the course':'Next challenge';
  $('challenge-progress').replaceChildren();
  levels.forEach((l,i)=>{const b=document.createElement('button');b.textContent=passedLevels.has(i)?'✓':i+1;b.className=(i===levelIndex?'current ':'')+(passedLevels.has(i)?'passed':'');b.disabled=i>unlocked;b.title=l.title;b.setAttribute('aria-label','Challenge '+(i+1)+': '+l.title);if(i===levelIndex)b.setAttribute('aria-current','step');b.addEventListener('click',()=>selectLevel(i));$('challenge-progress').append(b);});
 }
 function reset(){
  running=false;ended=false;parkHold=0;lastResult=null;hoverTime=null;clearInputs();
  if(mode==='match'){const l=level();Object.assign(config,{kind:'flat',initialV:l.initialV,motor:l.motor,startX:6,allowFlight:false});}
  track=new Track(config.kind,config.height);sim=new Simulation(track,{gravity:config.gravity,motor:config.motor,brake:mode==='match'?level().brake:6,allowFlight:config.allowFlight},config.startX,config.initialV);
  ticks=0;accumulator=0;lastFrame=0;samples=[sim.snapshot()];cameraLeft=-5;cameraBottom=-6;
  $('parking-result').textContent='Find the zone';$('notice').textContent='Space pauses · R resets';
  syncSettings();syncChallenge();syncControls();paint();
 }
 function selectMode(next){
  if(!['explore','match','park'].includes(next))throw new Error('Unknown activity');if(next===mode)return;
  if(next==='match')savedExplore={...config};else if(mode==='match'&&savedExplore){Object.assign(config,savedExplore);savedExplore=null;}
  mode=next;if(mode==='park')config.startX=6;reset();
 }
 function selectLevel(i){if(!Number.isInteger(i)||i<0||i>=levels.length||i>unlocked)throw new Error('Challenge is locked');levelIndex=i;reset();}
 function appendFinalSample(){if(Math.abs(samples.at(-1).t-sim.t)>1e-8)samples.push(sim.snapshot(input()));}
 function gradeAttempt(){
  lastResult=assess(level(),samples,passingScore);
  if(lastResult.passed){passedLevels.add(levelIndex);unlocked=Math.min(levels.length-1,Math.max(unlocked,levelIndex+1));}
  syncChallenge();
 }
 function finishRun(){
  appendFinalSample();running=false;ended=true;clearInputs();
  if(mode==='match')gradeAttempt();
  syncControls();
 }
 function advance(count){
  for(let j=0;j<count&&!ended;j++){
   const wasMissed=sim.missed;
   sim.settings.motor=config.motor;sim.step(DT,input());ticks++;if(ticks%12===0)samples.push(sim.snapshot(input()));
   if(sim.missed!==wasMissed)syncControls();
   if(sim.crashed){finishRun();break;}
   if(mode==='park'){
    const s=sim.snapshot();parkHold=!s.airborne&&s.x>=34&&s.x<=38&&s.speed<.25?parkHold+DT:0;
    $('parking-result').textContent=parkHold>0?'Hold it… '+fmt(parkHold,1)+' / 2 s':'Stop in the gold zone';
    if(parkHold>=2){$('parking-result').textContent='Parked! '+fmt(sim.t,1)+' s';finishRun();}
   }
   if(mode==='match'&&ticks>=Math.round(level().duration/DT))finishRun();
   if(sim.t>=MAX_TIME-1e-8)finishRun();
  }
 }
 function canvasContext(canvas){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(1,r.width),h=Math.max(1,r.height);
  if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
  const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);return {ctx,w,h};
 }
 function line(ctx,pts,color,width=1){if(!pts.length)return;ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
 function rounded(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
 function renderScene(s){
  const {ctx,w,h}=canvasContext($('scene')),wantedSpan=clamp(w/13,42,85),scale=Math.max(2,Math.min((w-36)/wantedSpan,(h-55)/25)),span=(w-36)/scale;
  if(s.x>cameraLeft+span*.7)cameraLeft=s.x-span*.7;if(s.x<cameraLeft+span*.13)cameraLeft=s.x-span*.13;
  const top=cameraBottom+(h-36)/scale;if(s.y>top-5)cameraBottom=s.y+5-(h-36)/scale;if(s.y<cameraBottom+2)cameraBottom=s.y-2;
  const X=x=>18+(x-cameraLeft)*scale,Y=y=>h-36-(y-cameraBottom)*scale;view={X,Y,scale,left:cameraLeft,w,h};
  const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#122a41');sky.addColorStop(1,'#17394f');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
  const lo=Math.floor(cameraLeft/5)*5,hi=cameraLeft+span+5;ctx.font='11px ui-sans-serif,system-ui';ctx.textAlign='center';
  for(let x=lo;x<=hi;x+=5)line(ctx,[[X(x),0],[X(x),h]],'#284359',.6);
  for(let y=Math.floor(cameraBottom/5)*5;y<cameraBottom+h/scale+5;y+=5)line(ctx,[[0,Y(y)],[w,Y(y)]],'#284359',.6);
  const ground=ctx.createLinearGradient(0,0,0,h);ground.addColorStop(0,'#31596a');ground.addColorStop(1,'#203b4b');
  function roadSection(pts){if(pts.length<2)return;ctx.beginPath();ctx.moveTo(pts[0][0],h);for(const p of pts)ctx.lineTo(...p);ctx.lineTo(pts.at(-1)[0],h);ctx.closePath();ctx.fillStyle=ground;ctx.fill();line(ctx,pts,'#416777',8);line(ctx,pts,'#9cbdc0',2);}
  let road=[];
  for(let px=-8;px<=w+8;px+=2){const x=cameraLeft+(px-18)/scale;if(track.hasGround(x)){road.push([px,Y(track.atX(x).y)]);}else{roadSection(road);road=[];}}
  roadSection(road);
  if(!config.allowFlight&&config.kind==='adventure'){
   let guide=[];for(let px=-8;px<=w+8;px+=2){const x=cameraLeft+(px-18)/scale;if(!track.hasGround(x))guide.push([px,Y(track.atX(x).y)]);else if(guide.length){ctx.setLineDash([4,5]);line(ctx,guide,'#aec6d4',2);ctx.setLineDash([]);guide=[];}}
   if(guide.length){ctx.setLineDash([4,5]);line(ctx,guide,'#aec6d4',2);ctx.setLineDash([]);}
  }
  for(let x=lo;x<=hi;x+=5){if(!track.hasGround(x))continue;const y=Y(track.atX(x).y);line(ctx,[[X(x),y+9],[X(x),y+14]],'#7c98a9');if(x%10===0){ctx.fillStyle='#acc0ce';ctx.fillText(x+' m',X(x),y+29);}}
  for(const x of track.gapEdges(cameraLeft,cameraLeft+span)){
   const local=((x%220)+220)%220,y=Y(track.atX(x).y);line(ctx,[[X(x),y-2],[X(x),y-28]],'#e5b664',2);
   if(local===54||local===140){ctx.fillStyle='#e5b664';ctx.textAlign='right';ctx.font='bold 10px ui-sans-serif,system-ui';ctx.fillText('JUMP',X(x)-6,y-20);ctx.textAlign='center';}
  }
  const flightTrail=samples.filter(p=>p.airborne&&p.t>s.t-2.5);
  if(flightTrail.length){ctx.setLineDash([2,5]);line(ctx,flightTrail.map(p=>[X(p.x),Y(p.y)]),'#dab67899',1.5);ctx.setLineDash([]);}
  if(mode==='park'){
   const pts=[];for(let x=34;x<=38.01;x+=.1)pts.push([X(x),Y(track.atX(x).y)-2]);line(ctx,pts,'#efbb52',6);
   const zx=X(36),zy=Y(track.atX(36).y);rounded(ctx,zx-32,zy-51,64,23,5,'#efbb52');ctx.font='bold 10px ui-sans-serif,system-ui';ctx.fillStyle='#23374b';ctx.fillText('PARK HERE',zx,zy-36);
  }
  const cx=X(s.x),cy=Y(s.y),angle=-s.angle;
  ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.scale(scale,scale);
  if(!s.airborne){ctx.fillStyle='#081e2d55';ctx.beginPath();ctx.ellipse(0,.1,2.3,.15,0,0,Math.PI*2);ctx.fill();}
  rounded(ctx,-1.95,-1.45,3.9,.84,.18,'#75a4ff');rounded(ctx,-.9,-2.18,1.97,1.05,.23,'#9bc1ff');
  rounded(ctx,-.68,-2.04,.65,.65,.07,'#1b3a60');rounded(ctx,.12,-2.04,.72,.65,.07,'#1b3a60');
  rounded(ctx,-1.88,-1.1,3.78,.24,.05,'#3e6bcb');rounded(ctx,1.72,-1.33,.25,.28,.05,'#fff1b1');rounded(ctx,-1.97,-1.33,.17,.26,.03,input().brake&&!s.airborne?'#ff706a':'#d47d82');
  for(const wx of [-1.18,1.2]){ctx.save();ctx.translate(wx,-.43);ctx.beginPath();ctx.arc(0,0,.48,0,Math.PI*2);ctx.fillStyle='#0b1e2f';ctx.fill();ctx.beginPath();ctx.arc(0,0,.27,0,Math.PI*2);ctx.fillStyle='#b6c7d6';ctx.fill();ctx.rotate(sim.s/.48);line(ctx,[[-.22,0],[.22,0]],'#395365',.085);line(ctx,[[0,-.22],[0,.22]],'#395365',.085);ctx.restore();}ctx.restore();
  if(s.speed>.05){
   const ux=s.vx/s.speed,uy=-s.vy/s.speed,len=clamp(s.speed*.4,2.8,8)*scale,ax=cx,ay=cy-3.5*scale,ex=ax+ux*len,ey=ay+uy*len;
   line(ctx,[[ax,ay],[ex,ey]],'#86e5dd',2);line(ctx,[[ex-ux*7-uy*4,ey-uy*7+ux*4],[ex,ey],[ex-ux*7+uy*4,ey-uy*7-ux*4]],'#86e5dd',2);
   ctx.fillStyle='#aaece7';ctx.font='12px ui-sans-serif,system-ui';ctx.textAlign='center';ctx.fillText(fmt(s.speed,1)+' m/s',(ax+ex)/2,(ay+ey)/2-10);
  }
  ctx.textAlign='right';ctx.font='11px ui-sans-serif,system-ui';ctx.fillStyle='#9fb8ce';ctx.fillText('g = '+config.gravity.toFixed(2)+' m/s²',w-16,18);
  $('position-label').textContent='x = '+fmt(s.x,1)+' m';$('flight-status').hidden=!s.airborne;$('flight-status').textContent=s.crashed?'Missed landing':s.missed?(config.gravity?'Falling':'Drifting'):'Airborne';
  $('scene').style.cursor=sim.t===0&&!running&&mode==='explore'?'grab':'default';
 }
 function niceMax(value){const pow=10**Math.floor(Math.log10(Math.max(value,1e-9))),n=value/pow;return (n<=1?1:n<=2?2:n<=4?4:n<=5?5:n<=8?8:10)*pow;}
 function sampleAt(t){
  let lo=0,hi=samples.length-1;while(hi-lo>1){const mid=(hi+lo)>>1;if(samples[mid].t<=t)lo=mid;else hi=mid;}
  const a=samples[lo],b=samples[hi],f=b.t===a.t?0:clamp((t-a.t)/(b.t-a.t),0,1);return {t,distance:a.distance+(b.distance-a.distance)*f,speed:a.speed+(b.speed-a.speed)*f};
 }
 function renderGraph(id,key,color,current){
  const canvas=$(id),{ctx,w,h}=canvasContext(canvas),pad={l:w<250?39:47,r:16,t:27,b:34},pw=Math.max(10,w-pad.l-pad.r),ph=Math.max(10,h-pad.t-pad.b);
  const isTarget=mode==='match'&&level().graph===key,maxTime=mode==='match'?level().duration:Math.max(10,Math.ceil(sim.t/10)*10);
  let largest=key==='distance'?8:4;for(const s of samples)largest=Math.max(largest,s[key]);largest=Math.max(largest,current[key]);
  if(isTarget)for(let t=0;t<=level().duration+.001;t+=.05)largest=Math.max(largest,target(level(),t));
  const maxValue=niceMax(largest*1.1),X=t=>pad.l+t/maxTime*pw,Y=v=>pad.t+ph-v/maxValue*ph;canvas.graphMapping={left:pad.l,width:pw,maxTime};
  ctx.font=(w<250?'10':'11')+'px ui-sans-serif,system-ui';
  if(isTarget){
   const phase=level().phases.find(p=>current.t<p.to)||level().phases.at(-1);ctx.fillStyle='#fcf1d780';ctx.fillRect(X(phase.from),pad.t,X(phase.to)-X(phase.from),ph);
   for(const p of level().phases.slice(1)){ctx.setLineDash([3,4]);line(ctx,[[X(p.from),pad.t],[X(p.from),h-pad.b]],'#d8bf8d',1);ctx.setLineDash([]);}
  }
  for(let i=0;i<=4;i++){
   const y=pad.t+i/4*ph,v=maxValue*(1-i/4);line(ctx,[[pad.l,y],[w-pad.r,y]],'#e5ebf2');ctx.textAlign='right';ctx.fillStyle='#687c92';ctx.fillText(Number(v.toFixed(2)),pad.l-8,y+4);
   ctx.textAlign='center';ctx.fillText(Number((i*maxTime/4).toFixed(2)),pad.l+i/4*pw,h-pad.b+17);
  }
  ctx.fillStyle='#596e85';ctx.textAlign='left';ctx.fillText(key==='distance'?'Distance (m)':'Speed (m/s)',pad.l,pad.t-11);ctx.textAlign='center';ctx.fillText('Time (s)',pad.l+pw/2,h-3);
  line(ctx,[[pad.l,pad.t],[pad.l,h-pad.b],[w-pad.r,h-pad.b]],'#c6d3e1');ctx.save();ctx.beginPath();ctx.rect(pad.l-1,pad.t-1,pw+2,ph+2);ctx.clip();
  if(isTarget){const pts=[];for(let t=0;t<=level().duration+.0001;t+=.035)pts.push([X(t),Y(target(level(),t))]);pts.push([X(level().duration),Y(target(level(),level().duration))]);ctx.setLineDash([5,5]);line(ctx,pts,'#b98020',2.2);ctx.setLineDash([]);}
  const pts=samples.map(p=>[X(p.t),Y(p[key])]);if(current.t>samples.at(-1).t)pts.push([X(current.t),Y(current[key])]);
  if(pts.length>1){ctx.beginPath();ctx.moveTo(pts[0][0],Y(0));for(const p of pts)ctx.lineTo(...p);ctx.lineTo(pts.at(-1)[0],Y(0));ctx.closePath();const gradient=ctx.createLinearGradient(0,pad.t,0,h-pad.b);gradient.addColorStop(0,color+'23');gradient.addColorStop(1,color+'04');ctx.fillStyle=gradient;ctx.fill();line(ctx,pts,color,2.5);}
  ctx.beginPath();ctx.arc(X(current.t),Y(current[key]),3.4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
  if(hoverTime!==null){const s=sampleAt(hoverTime),x=X(hoverTime);ctx.setLineDash([3,3]);line(ctx,[[x,pad.t],[x,h-pad.b]],'#728199');ctx.setLineDash([]);ctx.beginPath();ctx.arc(x,Y(s[key]),4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
  ctx.restore();
  if(current.t===0&&!isTarget){ctx.fillStyle='#8a98aa';ctx.textAlign='center';ctx.font=(w<250?'10':'12')+'px ui-sans-serif,system-ui';ctx.fillText('Drive to draw your graph',pad.l+pw/2,pad.t+ph*.54);}
  const shown=hoverTime===null?current:sampleAt(hoverTime);$(key+'-graph-value').textContent=fmt(shown[key])+(key==='distance'?' m':' m/s');
 }
 function paint(){
  if(!sim)return;const s=sim.snapshot(input());renderScene(s);renderGraph('distance-graph','distance','#3e5cf5',s);renderGraph('speed-graph','speed','#087e71',s);
  for(const [id,value,unit] of [['time',s.t,'s'],['distance',s.distance,'m'],['speed',s.speed,'m/s'],['vx',s.vx,'m/s'],['vy',s.vy,'m/s'],['acceleration',Math.hypot(s.ax,s.ay),'m/s²']]){
   const sign=(id==='vx'||id==='vy')&&value>.005?'+':'';$(id+'-value').innerHTML=sign+fmt(value)+' <small>'+unit+'</small>';
  }
  $('graph-hint').textContent=hoverTime===null?'Hover or touch either graph to inspect a moment.':'At '+fmt(hoverTime)+' s · '+fmt(sampleAt(hoverTime).distance)+' m · '+fmt(sampleAt(hoverTime).speed)+' m/s';
  $('phase-cue').hidden=mode!=='match'||ended;
  if(mode==='match'&&!ended){const phase=level().phases.find(p=>s.t<p.to)||level().phases.at(-1);$('phase-cue').textContent=phase.label+' · '+Math.max(0,Math.ceil(phase.to-s.t))+' s';}
  syncDrive();
 }
 function frame(now){
  if(lastFrame&&running){accumulator+=Math.min((now-lastFrame)/1000,.1)*Number($('playback').value);const count=Math.min(48,Math.floor(accumulator/DT));if(count){advance(count);accumulator=Math.max(0,accumulator-count*DT);}}
  lastFrame=now;if(now-lastPaint>1000/40){paint();lastPaint=now;}requestAnimationFrame(frame);
 }
 $('play').addEventListener('click',()=>setRunning(!running));$('reset').addEventListener('click',reset);$('step').addEventListener('click',()=>{if(!running&&!ended){advance(24);syncControls();paint();}});
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));
 document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{config.kind=b.dataset.track;config.startX=6;reset();}));
 for(const [id,key] of [['height','height'],['initial-speed','initialV'],['gravity','gravity']])$(id).addEventListener('input',e=>{config[key]=Number(e.target.value);reset();});
 $('allow-jumps').addEventListener('change',e=>{config.allowFlight=e.target.checked;reset();});
 $('motor').addEventListener('input',e=>{config.motor=Number(e.target.value);syncMotor();});
 $('passing-score').addEventListener('input',e=>{
  passingScore=clamp(Math.round(Number(e.target.value)),1,100);
  try{localStorage.setItem('motion-lab-passing-score',String(passingScore));}catch{}
  if(mode==='match'&&ended)gradeAttempt();else syncChallenge();
 });
 $('next-challenge').addEventListener('click',()=>{if(!passedLevels.has(levelIndex))return;if(levelIndex===levels.length-1)selectMode('explore');else selectLevel(levelIndex+1);});
 for(const [id,action] of [['drive-left','left'],['drive-right','right'],['brake','brake']]){
  const b=$(id);
  b.addEventListener('pointerdown',e=>{if(e.button!==0||ended)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointerMap.set(e.pointerId,action);syncDrive();if(!running)setRunning(true);});
  const release=e=>{pointerMap.delete(e.pointerId);syncDrive();};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
  b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat&&!ended){e.preventDefault();keySet.add(action==='left'?'ArrowLeft':action==='right'?'ArrowRight':'s');syncDrive();if(!running)setRunning(true);}});
  b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keySet.delete(action==='left'?'ArrowLeft':action==='right'?'ArrowRight':'s');syncDrive();}});
 }
 window.addEventListener('keydown',e=>{
  if($('model-dialog').open||$('settings-dialog').open||e.altKey||e.ctrlKey||e.metaKey)return;
  const k=e.key.length===1?e.key.toLowerCase():e.key;
  // Arrow keys still adjust a focused slider; A/D always adjust motor power.
  if(['SELECT','TEXTAREA'].includes(e.target.tagName))return;
  if(['a','d','[',']'].includes(k)){e.preventDefault();config.motor+=k==='a'||k==='['?-.25:.25;syncMotor();return;}
  if(e.target.tagName==='INPUT')return;
  if(['ArrowLeft','ArrowRight','ArrowDown','s'].includes(k)){e.preventDefault();if(e.repeat||ended)return;keySet.add(k);syncDrive();if(!running)setRunning(true);}
  else if(k===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat)setRunning(!running);}
  else if(k==='r'&&!e.repeat){e.preventDefault();reset();}
 });
 window.addEventListener('keyup',e=>{keySet.delete(e.key.length===1?e.key.toLowerCase():e.key);syncDrive();});
 window.addEventListener('blur',()=>setRunning(false));document.addEventListener('visibilitychange',()=>{if(document.hidden)setRunning(false);});
 $('scene').addEventListener('pointerdown',e=>{
  if(mode!=='explore'||sim.t>0||running||!view||e.button!==0)return;const r=$('scene').getBoundingClientRect(),s=sim.snapshot();
  if(Math.hypot(e.clientX-r.left-view.X(s.x),e.clientY-r.top-(view.Y(s.y)-view.scale))>Math.max(30,view.scale*3))return;
  dragPointer=e.pointerId;$('scene').setPointerCapture(e.pointerId);e.preventDefault();
 });
 $('scene').addEventListener('pointermove',e=>{if(dragPointer!==e.pointerId||!view)return;const r=$('scene').getBoundingClientRect(),x=view.left+(e.clientX-r.left-18)/view.scale;if(config.allowFlight&&!track.hasGround(x))return;config.startX=x;reset();});
 const endDrag=()=>{dragPointer=null;};$('scene').addEventListener('pointerup',endDrag);$('scene').addEventListener('pointercancel',endDrag);
 for(const id of ['distance-graph','speed-graph']){
  $(id).addEventListener('pointermove',e=>{const m=$(id).graphMapping;if(!m)return;hoverTime=clamp((e.clientX-$(id).getBoundingClientRect().left-m.left)/m.width*m.maxTime,0,samples.at(-1).t);});
  $(id).addEventListener('pointerleave',()=>{hoverTime=null;});$(id).addEventListener('pointerup',e=>{if(e.pointerType==='touch')hoverTime=null;});
 }
 for(const [button,dialog,close] of [['settings-button','settings-dialog','close-settings'],['model-button','model-dialog','close-model']]){
  $(button).addEventListener('click',()=>{setRunning(false);$(dialog).showModal();});$(close).addEventListener('click',()=>$(dialog).close());
  $(dialog).addEventListener('click',e=>{if(e.target!==$(dialog))return;const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();});
 }
 $('fullscreen').addEventListener('click',async()=>{
  try{if(document.fullscreenElement)await document.exitFullscreen();else if(document.documentElement.requestFullscreen)await document.documentElement.requestFullscreen();else $('notice').textContent='Use your browser’s full-screen option.';}catch{$('notice').textContent='Use F11 or your browser’s full-screen option.';}
 });
 document.addEventListener('fullscreenchange',()=>{const active=Boolean(document.fullscreenElement);$('fullscreen').setAttribute('aria-label',active?'Exit full screen':'Enter full screen');$('fullscreen').title=active?'Exit full screen':'Enter full screen';document.querySelector('.fullscreen-text').textContent=active?'Exit full screen':'Full screen';paint();});
 window.addEventListener('resize',paint);reset();requestAnimationFrame(frame);
 if(document.modelContext?.registerTool){
  const lifecycle=new AbortController(),register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
  register({name:'read_motion_experiment',description:'Read the active experiment, current SI measurements, challenge result, and unlocked progress.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode,running,settings:{...config},measurements:sim.snapshot(input()),challenge:mode==='match'?{index:levelIndex+1,total:levels.length,unlocked:unlocked+1,passingScore,result:lastResult}:null})});
  register({name:'control_motion_experiment',description:'Run, pause, reset, or step the current experiment by 0.1 simulated seconds.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['run','pause','reset','step']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({action})=>{if(!['run','pause','reset','step'].includes(action))throw new Error('Invalid action');if(action==='run')setRunning(true);if(action==='pause')setRunning(false);if(action==='reset')reset();if(action==='step'){if(running||ended)throw new Error('Pause or reset before stepping');advance(24);syncControls();}paint();return {running,measurements:sim.snapshot(input())};}});
  window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
 }
})();
