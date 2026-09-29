/* UI and canvas rendering. No libraries or remote assets are required. */
(() => {
  'use strict';
  const {Track,Simulation,targetSpeed,clamp}=window.MotionPhysics;
  const $=id=>document.getElementById(id);
  const DT=1/240, SAMPLE_EVERY=12, MAX_TIME=120;
  const trackNames={flat:'Flat road',ramp:'Downhill',valley:'The valley',hill:'Over the hill'};
  const tips={flat:'Accelerate, then release the motor. Does the car need a force to keep moving?',ramp:'Start partway down the ramp and release the motor. What changes when you switch to Moon gravity?',valley:'Roll into the valley. Where is the car fastest? What do the two graphs do there?',hill:'Give the car a push uphill, then let go. Watch the graphs as it slows down and reverses.'};
  const config={kind:'valley',height:8,gravity:9.81,motor:2,initialV:0,startX:6};
  let track,sim,mode='explore',running=false,ticks=0,samples=[],completed=false,parkHold=0,matchError=0;
  let accumulator=0,lastFrame=0,lastPaint=0,hoverTime=null,cameraLeft=-3,view=null,dragPointer=null;
  const keySet=new Set(), pointerMap=new Map();
  let savedExplore=null;
  function input() {
    let left=keySet.has('ArrowLeft')||keySet.has('a'), right=keySet.has('ArrowRight')||keySet.has('d'), brake=keySet.has('ArrowDown')||keySet.has('s');
    for(const value of pointerMap.values()) {left ||= value==='left';right ||= value==='right';brake ||= value==='brake';}
    return {motor:Number(right)-Number(left),brake};
  }
  function clearInputs(){keySet.clear();pointerMap.clear();syncDrive();}
  function syncDrive(){const i=input();$('drive-left').classList.toggle('active',i.motor<0);$('drive-right').classList.toggle('active',i.motor>0);$('brake').classList.toggle('active',i.brake);$('drive-state').textContent=i.brake?'Braking':i.motor?'Motor on':'Release to coast';}
  function fmt(value,digits=2){return (Math.abs(value)<.5*10**-digits?0:value).toFixed(digits);}
  function setRunning(value){running=Boolean(value)&&!completed&&sim.t<MAX_TIME-1e-8;accumulator=0;lastFrame=0;syncControls();}
  function syncControls(){
    $('play').innerHTML=running?'<span aria-hidden="true">Ⅱ</span> Pause':'<span aria-hidden="true">▶</span> '+(sim.t>0?'Resume':'Run');
    $('play').disabled=completed||sim.t>=MAX_TIME-1e-8;
    $('step').disabled=running||completed||sim.t>=MAX_TIME-1e-8;
    $('run-status').textContent=completed?'Challenge complete':sim.t>=MAX_TIME-1e-8?'120 s · reset to try again':running?'Experiment running':sim.t>0?'Paused':'Ready to roll';
    $('run-status').classList.toggle('running',running);
    $('scene-note').textContent=sim.t===0&&!running?(mode==='match'?'Follow the dashed speed curve below':'Drag the car to set its starting point'):'← / → to drive · ↓ to brake · Space to pause';
  }
  function reset(){
    running=false;completed=false;parkHold=0;matchError=0;hoverTime=null;clearInputs();
    track=new Track(config.kind,config.height);sim=new Simulation(track,{gravity:config.gravity,motor:config.motor,brake:mode==='match'?2:6},config.startX,config.initialV);
    ticks=0;accumulator=0;lastFrame=0;samples=[sim.snapshot()];cameraLeft=-3;
    $('challenge').classList.remove('success');$('challenge-result').textContent=mode==='park'?'Find the parking zone':'7-second challenge';
    $('challenge-title').textContent=mode==='park'?'Precision parking':'Can you match the speed graph?';
    $('track-title').textContent=trackNames[config.kind];$('think-text').textContent=tips[config.kind];
    $('brake-explanation').textContent=(mode==='match'?'2':'6')+' m/s²';
    syncControls();syncSettings();paint();
  }
  function syncSettings(){
    document.querySelectorAll('[data-track]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.track===config.kind));b.disabled=mode==='match';});
    document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));
    $('height').value=config.height;$('height-output').textContent=config.height+' m';$('height').disabled=config.kind==='flat'||mode==='match';
    $('initial-speed').value=config.initialV;$('initial-speed-output').textContent=(config.initialV>0?'+':'')+config.initialV+' m/s';$('initial-speed').disabled=mode==='match';
    $('motor').value=config.motor;$('motor-output').textContent=config.motor.toFixed(1)+' m/s²';$('motor').disabled=mode==='match';
    $('gravity').value=config.gravity;$('gravity-output').textContent=config.gravity.toFixed(2)+' m/s²';$('gravity').disabled=mode==='match';
    $('settings-note').textContent=mode==='match'?'Flat road, zero initial velocity, 2 m/s² motor and brake. Reset to try again.':'Track, height, gravity, and initial velocity changes start a new run.';
    $('speed-caption').textContent=mode==='match'?'Dashed gold: target. Green: your speed.':'A horizontal line means constant speed.';
  }
  function selectMode(next){
    if(!['explore','park','match'].includes(next))throw new Error('Unknown activity');
    if(next===mode)return;
    if(next==='match'){savedExplore={...config};Object.assign(config,{kind:'flat',initialV:0,startX:6,motor:2});}
    else if(mode==='match'&&savedExplore){Object.assign(config,savedExplore);savedExplore=null;}
    mode=next;$('challenge').hidden=next==='explore';
    $('challenge-title').textContent=next==='park'?'Precision parking':'Can you match the speed graph?';
    $('challenge-description').textContent=next==='park'?'Stop in the gold zone at x = 34–38 m. Keep your speed below 0.25 m/s for 2 seconds.':'Accelerate from 0 to 4 m/s in 2 s, coast until 5 s, then brake to a stop at 7 s. Aim for at least 85%.';
    reset();
  }
  function advance(count){
    for(let j=0;j<count;j++){
      if(completed||sim.t>=MAX_TIME-1e-8)break;
      const control=input();sim.settings.motor=config.motor;sim.step(DT,control);ticks++;
      if(ticks%SAMPLE_EVERY===0)samples.push(sim.snapshot(control));
      if(mode==='park'){
        const p=track.atS(sim.s);parkHold=p.x>=34&&p.x<=38&&Math.abs(sim.v)<.25?parkHold+DT:0;
        if(parkHold>=2){completed=true;running=false;$('challenge').classList.add('success');$('challenge-result').textContent='Parked! '+fmt(sim.t,1)+' s';$('challenge-title').textContent='Perfect parking.';clearInputs();syncControls();}
      }
      if(mode==='match'){
        matchError+=(Math.abs(sim.v)-targetSpeed(sim.t))**2*DT;
        if(ticks>=7/DT){
          completed=true;running=false;const score=Math.round(Math.max(0,100*(1-Math.sqrt(matchError/7)/4)));
          $('challenge-result').textContent=score+'% match';$('challenge-title').textContent=score>=85?'Graph matched!':'Another experiment, another discovery.';
          $('challenge').classList.toggle('success',score>=85);clearInputs();syncControls();
        }
      }
    }
    if(sim.t>=MAX_TIME-1e-8){running=false;clearInputs();syncControls();}
    if(mode==='park'&&!completed)$('challenge-result').textContent=parkHold>0?'Hold it… '+fmt(parkHold,1)+' / 2.0 s':'Stop inside the gold zone';
  }
  function canvasContext(canvas){
    const rect=canvas.getBoundingClientRect(), dpr=Math.min(window.devicePixelRatio||1,2);
    const width=Math.max(1,rect.width),height=Math.max(1,rect.height);
    if(canvas.width!==Math.round(width*dpr)||canvas.height!==Math.round(height*dpr)){canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);}
    const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,width,height);return {ctx,w:width,h:height};
  }
  function rounded(ctx,x,y,w,h,r,fill){ctx.beginPath();ctx.roundRect(x,y,w,h,r);ctx.fillStyle=fill;ctx.fill();}
  function line(ctx,points,color,width=1){ctx.beginPath();for(let i=0;i<points.length;i++){i?ctx.lineTo(...points[i]):ctx.moveTo(...points[i]);}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke();}
  function renderScene(){
    const {ctx,w,h}=canvasContext($('scene')),p=track.atS(sim.s);
    const desiredSpan=clamp(w/11,40,80);
    const visibleHeight=config.kind==='flat'?0:config.height;
    const scale=Math.min((w-36)/desiredSpan,(h-104)/(visibleHeight+2.5));
    const span=(w-36)/scale;
    if(p.x>cameraLeft+span*.79)cameraLeft=p.x-span*.79;
    if(p.x<cameraLeft+span*.13)cameraLeft=p.x-span*.13;
    const X=x=>18+(x-cameraLeft)*scale,Y=y=>h-62-y*scale;
    view={w,h,scale,left:cameraLeft,X,Y};
    const sky=ctx.createLinearGradient(0,0,0,h);sky.addColorStop(0,'#122a41');sky.addColorStop(1,'#173950');ctx.fillStyle=sky;ctx.fillRect(0,0,w,h);
    const lo=Math.floor(cameraLeft/5)*5,hi=cameraLeft+span+5;
    ctx.font='11px ui-sans-serif, system-ui';ctx.textAlign='center';
    for(let x=lo;x<=hi;x+=5){line(ctx,[[X(x),22],[X(x),h]],'#284359',.6);}
    for(let y=-5;y<35;y+=5){line(ctx,[[0,Y(y)],[w,Y(y)]],'#284359',.6);}
    const road=[];for(let px=-10;px<=w+10;px+=3){const x=cameraLeft+(px-18)/scale;road.push([px,Y(track.atX(x).y)]);}
    ctx.beginPath();ctx.moveTo(road[0][0],h);for(const q of road)ctx.lineTo(...q);ctx.lineTo(w+10,h);ctx.closePath();
    const ground=ctx.createLinearGradient(0,h/2,0,h);ground.addColorStop(0,'#294a5a');ground.addColorStop(1,'#203b4b');ctx.fillStyle=ground;ctx.fill();
    line(ctx,road,'#496777',8);line(ctx,road,'#94b6ba',2);
    // Meter markers use horizontal x; total traveled distance follows the road.
    for(let x=lo;x<=hi;x+=5){const y=Y(track.atX(x).y);line(ctx,[[X(x),y+8],[X(x),y+13]],'#7e97a9');if(x%10===0){ctx.fillStyle='#a4b8c8';ctx.fillText(x+' m',X(x),y+29);}}
    if(mode==='park'){
      const zone=[];for(let x=34;x<=38.001;x+=.1)zone.push([X(x),Y(track.atX(x).y)-2]);line(ctx,zone,'#edb448',6);
      const zx=X(36),zy=Y(track.atX(36).y);rounded(ctx,zx-33,zy-52,66,24,5,'#edb448');ctx.fillStyle='#23364a';ctx.font='bold 10px ui-sans-serif, system-ui';ctx.fillText('PARK HERE',zx,zy-36);
    }
    const startY=Y(track.atX(config.startX).y);ctx.setLineDash([3,4]);line(ctx,[[X(config.startX),startY-45],[X(config.startX),startY-3]],'#7494b266');ctx.setLineDash([]);
    const angle=-Math.atan(p.slope), cx=X(p.x),cy=Y(p.y);
    ctx.save();ctx.translate(cx,cy);ctx.rotate(angle);ctx.scale(scale,scale);
    // Functional cart diagram in world units; wheel rotation follows signed path length.
    ctx.fillStyle='#0b1e2b55';ctx.beginPath();ctx.ellipse(0,.09,2.4,.15,0,0,Math.PI*2);ctx.fill();
    rounded(ctx,-1.95,-1.45,3.9,.84,.18,'#75a4ff');rounded(ctx,-.9,-2.18,1.97,1.05,.23,'#94bbff');
    rounded(ctx,-.68,-2.04,.65,.65,.07,'#1b3a60');rounded(ctx,.12,-2.04,.72,.65,.07,'#1b3a60');
    rounded(ctx,-1.88,-1.1,3.78,.24,.05,'#3e6bcb');rounded(ctx,1.72,-1.33,.25,.28,.05,'#fff3b3');rounded(ctx,-1.97,-1.33,.17,.26,.03,input().brake?'#ff746f':'#db8087');
    for(const wx of [-1.18,1.2]){
      ctx.save();ctx.translate(wx,-.43);ctx.fillStyle='#102234';ctx.beginPath();ctx.arc(0,0,.48,0,Math.PI*2);ctx.fill();ctx.fillStyle='#adbecb';ctx.beginPath();ctx.arc(0,0,.27,0,Math.PI*2);ctx.fill();ctx.rotate(sim.s/.48);line(ctx,[[-.22,0],[.22,0]],'#395365',.085);line(ctx,[[0,-.22],[0,.22]],'#395365',.085);ctx.restore();
    }
    ctx.restore();
    if(Math.abs(sim.v)>.05){
      const dir=Math.sign(sim.v),len=clamp(Math.abs(sim.v)*.45,2.6,8)*scale,ux=Math.cos(angle)*dir,uy=Math.sin(angle)*dir;
      const ax=cx-Math.sin(angle)*(-3.4*scale),ay=cy+Math.cos(angle)*(-3.4*scale),ex=ax+ux*len,ey=ay+uy*len;
      line(ctx,[[ax,ay],[ex,ey]],'#79e0d8',2);line(ctx,[[ex-ux*7-uy*4,ey-uy*7+ux*4],[ex,ey],[ex-ux*7+uy*4,ey-uy*7-ux*4]],'#79e0d8',2);
      ctx.fillStyle='#a6ece6';ctx.font='12px ui-sans-serif, system-ui';ctx.textAlign='center';ctx.fillText(fmt(Math.abs(sim.v),1)+' m/s',(ax+ex)/2,(ay+ey)/2-11);
    }
    ctx.textAlign='right';ctx.fillStyle='#9db6ce';ctx.font='11px ui-sans-serif, system-ui';ctx.fillText('g = '+config.gravity.toFixed(2)+' m/s²',w-17,15);
    $('scene').style.cursor=sim.t===0&&mode!=='match'?'grab':'default';
  }
  function niceMax(value){const power=10**Math.floor(Math.log10(Math.max(value,1e-9))),n=value/power;return (n<=1?1:n<=2?2:n<=4?4:n<=5?5:n<=8?8:10)*power;}
  function sampleAt(t){
    if(!samples.length)return sim.snapshot(input());
    const f=clamp(t/.05,0,samples.length-1),i=Math.floor(f),a=samples[i],b=samples[Math.min(i+1,samples.length-1)],w=f-i;
    return {t,distance:a.distance+(b.distance-a.distance)*w,speed:a.speed+(b.speed-a.speed)*w};
  }
  function renderGraph(id,key,color){
    const canvas=$(id),{ctx,w,h}=canvasContext(canvas),pad={l:48,r:19,t:28,b:37},pw=w-pad.l-pad.r,ph=h-pad.t-pad.b;
    const current=sim.snapshot(input()),maxTime=mode==='match'?8:Math.max(10,Math.ceil(sim.t/10)*10);
    let largest=key==='distance'?8:4;for(const s of samples)largest=Math.max(largest,s[key]);largest=Math.max(largest,current[key]);
    const maxValue=niceMax(largest*1.12),X=t=>pad.l+t/maxTime*pw,Y=v=>pad.t+ph-v/maxValue*ph;
    canvas.graphMapping={left:pad.l,width:pw,maxTime};
    ctx.font='11px ui-sans-serif, system-ui';ctx.lineWidth=1;
    for(let i=0;i<=4;i++){
      const y=pad.t+i/4*ph, v=maxValue*(1-i/4);line(ctx,[[pad.l,y],[w-pad.r,y]],'#e7ecf2');ctx.fillStyle='#728195';ctx.textAlign='right';ctx.fillText(Number(v.toFixed(2)),pad.l-9,y+4);
      const x=pad.l+i/4*pw;ctx.textAlign='center';ctx.fillText(fmt(i/4*maxTime,maxTime%4?1:0),x,h-pad.b+18);
    }
    ctx.fillStyle='#596d83';ctx.textAlign='left';ctx.fillText(key==='distance'?'Distance (m)':'Speed (m/s)',pad.l,pad.t-12);ctx.textAlign='center';ctx.fillText('Time (s)',pad.l+pw/2,h-4);
    line(ctx,[[pad.l,pad.t],[pad.l,h-pad.b],[w-pad.r,h-pad.b]],'#c9d3e0');
    ctx.save();ctx.beginPath();ctx.rect(pad.l-1,pad.t-1,pw+2,ph+2);ctx.clip();
    if(mode==='match'&&key==='speed'){ctx.setLineDash([5,5]);line(ctx,[[X(0),Y(0)],[X(2),Y(4)],[X(5),Y(4)],[X(7),Y(0)]],'#bc7c19',2);ctx.setLineDash([]);}
    const pts=samples.map(s=>[X(s.t),Y(s[key])]);if(current.t>samples.at(-1).t)pts.push([X(current.t),Y(current[key])]);
    if(pts.length>1){ctx.beginPath();ctx.moveTo(pts[0][0],Y(0));for(const p of pts)ctx.lineTo(...p);ctx.lineTo(pts.at(-1)[0],Y(0));ctx.closePath();const fill=ctx.createLinearGradient(0,pad.t,0,h-pad.b);fill.addColorStop(0,color+'20');fill.addColorStop(1,color+'03');ctx.fillStyle=fill;ctx.fill();line(ctx,pts,color,2.4);}
    ctx.beginPath();ctx.arc(X(current.t),Y(current[key]),3.4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();
    if(hoverTime!==null){const p=sampleAt(hoverTime),x=X(hoverTime),y=Y(p[key]);ctx.setLineDash([3,3]);line(ctx,[[x,pad.t],[x,h-pad.b]],'#6c7c91');ctx.setLineDash([]);ctx.beginPath();ctx.arc(x,y,4,0,Math.PI*2);ctx.fillStyle=color;ctx.fill();}
    ctx.restore();
    if(current.t===0&&mode!=='match'){ctx.fillStyle='#7f8b9c';ctx.font='12px ui-sans-serif, system-ui';ctx.textAlign='center';ctx.fillText('Your motion will appear here',pad.l+pw/2,pad.t+ph*.53);}
    const shown=hoverTime===null?current:sampleAt(hoverTime);$(key+'-graph-value').textContent=fmt(shown[key])+(key==='distance'?' m':' m/s');
  }
  function paint(){
    renderScene();renderGraph('distance-graph','distance','#3e5cf5');renderGraph('speed-graph','speed','#087e71');
    const s=sim.snapshot(input());
    for(const [id,val,unit] of [['time',s.t,'s'],['distance',s.distance,'m'],['speed',s.speed,'m/s'],['velocity',s.v,'m/s'],['acceleration',s.a,'m/s²']]){
      const text=(id==='velocity'||id==='acceleration')&&val>.005?'+'+fmt(val):fmt(val);$(id+'-value').innerHTML=text+' <small>'+unit+'</small>';
    }
    $('graph-hint').textContent=hoverTime===null?'Hover or touch a graph to inspect a moment.':'At '+fmt(hoverTime)+' s · distance '+fmt(sampleAt(hoverTime).distance)+' m · speed '+fmt(sampleAt(hoverTime).speed)+' m/s';
  }
  function frame(now){
    if(lastFrame&&running){accumulator+=Math.min((now-lastFrame)/1000,.1)*Number($('playback').value);const count=Math.min(48,Math.floor(accumulator/DT));if(count>0){advance(count);accumulator=Math.max(0,accumulator-count*DT);}}
    lastFrame=now;if(now-lastPaint>1000/45){paint();lastPaint=now;}requestAnimationFrame(frame);
  }
  $('play').addEventListener('click',()=>setRunning(!running));
  $('reset').addEventListener('click',reset);
  $('step').addEventListener('click',()=>{if(!running&&!completed){advance(24);syncControls();paint();}});
  document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',()=>selectMode(b.dataset.mode)));
  document.querySelectorAll('[data-track]').forEach(b=>b.addEventListener('click',()=>{config.kind=b.dataset.track;reset();}));
  for(const [id,key] of [['height','height'],['initial-speed','initialV'],['gravity','gravity']])$(id).addEventListener('input',e=>{config[key]=Number(e.target.value);reset();});
  $('motor').addEventListener('input',e=>{config.motor=Number(e.target.value);sim.settings.motor=config.motor;syncSettings();});
  for(const [id,action] of [['drive-left','left'],['drive-right','right'],['brake','brake']]){
    const b=$(id);
    b.addEventListener('pointerdown',e=>{if(e.button!==0||completed)return;e.preventDefault();b.setPointerCapture(e.pointerId);pointerMap.set(e.pointerId,action);syncDrive();if(!running)setRunning(true);});
    const release=e=>{pointerMap.delete(e.pointerId);syncDrive();};b.addEventListener('pointerup',release);b.addEventListener('pointercancel',release);b.addEventListener('lostpointercapture',release);
    b.addEventListener('keydown',e=>{if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();keySet.add(action==='left'?'a':action==='right'?'d':'s');syncDrive();if(!running)setRunning(true);}});
    b.addEventListener('keyup',e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();keySet.delete(action==='left'?'a':action==='right'?'d':'s');syncDrive();}});
  }
  window.addEventListener('keydown',e=>{
    if($('model-dialog').open||e.altKey||e.ctrlKey||e.metaKey||['INPUT','SELECT','TEXTAREA'].includes(e.target.tagName))return;
    const k=e.key.length===1?e.key.toLowerCase():e.key;
    if(['ArrowLeft','ArrowRight','ArrowDown','a','d','s'].includes(k)){e.preventDefault();if(e.repeat||completed)return;keySet.add(k);syncDrive();if(!running)setRunning(true);}
    else if(k===' '&&e.target.tagName!=='BUTTON'){e.preventDefault();if(!e.repeat){clearInputs();setRunning(!running);}}
    else if(k==='r'&&!e.repeat){e.preventDefault();reset();}
  });
  window.addEventListener('keyup',e=>{keySet.delete(e.key.length===1?e.key.toLowerCase():e.key);syncDrive();});
  window.addEventListener('blur',()=>{clearInputs();setRunning(false);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInputs();setRunning(false);}});
  $('scene').addEventListener('pointerdown',e=>{
    if(mode==='match'||sim.t>0||!view||e.button!==0)return;
    const r=$('scene').getBoundingClientRect(),p=track.atS(sim.s),sx=e.clientX-r.left,sy=e.clientY-r.top;
    if(Math.hypot(sx-view.X(p.x),sy-(view.Y(p.y)-view.scale))>Math.max(35,view.scale*3))return;
    dragPointer=e.pointerId;$('scene').setPointerCapture(e.pointerId);e.preventDefault();
  });
  $('scene').addEventListener('pointermove',e=>{if(dragPointer!==e.pointerId||!view)return;const r=$('scene').getBoundingClientRect();config.startX=clamp(view.left+(e.clientX-r.left-18)/view.scale,0,70);reset();});
  const endDrag=()=>{dragPointer=null;};$('scene').addEventListener('pointerup',endDrag);$('scene').addEventListener('pointercancel',endDrag);
  for(const id of ['distance-graph','speed-graph']){
    $(id).addEventListener('pointermove',e=>{const g=$(id).graphMapping;if(!g)return;const x=e.clientX-$(id).getBoundingClientRect().left;hoverTime=clamp((x-g.left)/g.width*g.maxTime,0,samples.at(-1).t);});
    $(id).addEventListener('pointerleave',()=>{hoverTime=null;});$(id).addEventListener('pointerup',e=>{if(e.pointerType==='touch')hoverTime=null;});
  }
  $('model-button').addEventListener('click',()=>{clearInputs();setRunning(false);$('model-dialog').showModal();});
  $('close-model').addEventListener('click',()=>$('model-dialog').close());
  $('model-dialog').addEventListener('click',e=>{if(e.target===$('model-dialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  window.addEventListener('resize',paint);
  reset();requestAnimationFrame(frame);
  // Optional browser agent tools use the exact same actions as the visible UI.
  if(document.modelContext?.registerTool){
    const lifecycle=new AbortController();
    const register=t=>{try{Promise.resolve(document.modelContext.registerTool(t,{signal:lifecycle.signal})).catch(()=>{});}catch{}};
    register({name:'read_motion_experiment',description:'Read the active experiment, model settings, and current SI measurements.',inputSchema:{type:'object',properties:{},additionalProperties:false},annotations:{readOnlyHint:true},execute:()=>({mode,running,settings:{...config},measurements:sim.snapshot(input())})});
    register({name:'control_motion_experiment',description:'Run, pause, reset, or step the current experiment by 0.1 simulated seconds.',inputSchema:{type:'object',properties:{action:{type:'string',enum:['run','pause','reset','step']}},required:['action'],additionalProperties:false},annotations:{readOnlyHint:false},execute:({action})=>{if(!['run','pause','reset','step'].includes(action))throw new Error('Invalid action');if(action==='run')setRunning(true);if(action==='pause'){clearInputs();setRunning(false);}if(action==='reset')reset();if(action==='step'){if(running||completed)throw new Error('Pause or reset before stepping');advance(24);syncControls();}paint();return {running,measurements:sim.snapshot(input())};}});
    window.addEventListener('pagehide',()=>lifecycle.abort(),{once:true});
  }
})();
