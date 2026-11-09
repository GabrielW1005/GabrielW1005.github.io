import {defaultConfig,normalizeConfig,ratio,makeState,step,readout,changeConfig,limits,MAX_FORCE,MAX_MASS,bodyJacobian,initialOutputAcceleration} from './physics.js';
import {machineCatalog,taskCatalog,createChallenge} from './challenges.js';
import {renderScene} from './scene.js';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Number.isFinite(n)?(Math.abs(n)<1e-8?'0':Number(n.toPrecision(4)).toString()):'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=s=>{const t=String(s).trim(),m=t.match(/^([-+]?\d*\.?\d+)\s*\/\s*([-+]?\d*\.?\d+)$/);return m?(+m[2]?+m[1]/+m[2]:NaN):/^[-+]?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(t)?Number(t):NaN;};
const taskIds=['force','balance','distance','acceleration'];
let saved={dark:true,skills:{},serial:0};try{saved={...saved,...JSON.parse(localStorage.getItem('machine-lab-adaptive-v3')||'{}')};}catch{}
let type='lever',task='force',topic='mixed',mode='challenge',level=0,challenge,config,state;
let custom=false,attempts=0,credited=false,forceCorrect=false,playing=false,frame=0,lastTime=0,lastDraw=0,drawFrame=0,editFrame=0;
let history=[],bodyInfo={},drag=null,pull=null,pointers=new Map(),pinch=null,pendingResize=null,advanceTimer=0;
let autoAnimating=false,autoFrame=0,autoStart=0,autoNotice='',distanceDemo=false;
let camera={zoom:1,cx:450,cy:270};
const machine=()=>machineCatalog.find(m=>m.type===type);
function save(){try{localStorage.setItem('machine-lab-adaptive-v3',JSON.stringify(saved));}catch{$('saveStatus').textContent='Progress saving unavailable.';}}
function skills(){if(!saved.skills[type])saved.skills[type]={force:0,balance:0,distance:0,acceleration:0};return saved.skills[type];}
function maxStage(){return machine().levels.length;}
function totalScore(){return Object.values(skills()).reduce((a,b)=>a+Math.min(b,maxStage()),0);}
function cancelAdvance(){clearTimeout(advanceTimer);advanceTimer=0;$('advanceNotice').textContent='';}
function stopAuto(){autoAnimating=false;cancelAnimationFrame(autoFrame);$('autoAnimate').textContent='▶ Compare balanced setups';}
function stop(){playing=false;cancelAnimationFrame(frame);lastTime=0;$('playBtn').textContent='▶ Run';queueDraw();}
function external(){return pull?pull.force:{input:0,output:0};}
function start(){if(playing)return;stopAuto();playing=true;lastTime=0;$('playBtn').textContent='Ⅱ Pause';frame=requestAnimationFrame(tick);}
function tick(t){if(!playing)return;const dt=lastTime?Math.min((t-lastTime)/1000,.05):0;lastTime=t;
 if(pull)updatePull();
 const speed=Number($('speed').value);let simDt=dt*speed;if(distanceDemo&&challenge?.motion&&state.v>0)simDt=Math.min(simDt,Math.max(0,(challenge.motion.targetQ-state.q)/state.v));step(state,config,simDt,external());
 const r=readout(state,config,external());
 if(!history.length||r.time-history.at(-1).t>=.04){history.push({t:r.time,i:r.displacementIn,o:r.displacementOut,fi:r.inputForce,fo:r.outputWeight,ai:r.inputPathAcceleration,ao:r.outputPathAcceleration,pi:r.pathDistanceIn,po:r.pathDistanceOut});if(history.length>360)history.shift();}
 if(distanceDemo&&challenge?.motion&&state.q>=challenge.motion.targetQ-1e-10){distanceDemo=false;stop();$('feedback').textContent+=' Target rise reached; motion paused.';}
 if(t-lastDraw>=1000/30||!playing){draw();lastDraw=t;}
 if(!pull&&((r.atLimit&&Math.abs(r.velocity)<1e-7)||(r.balanced&&Math.abs(r.velocity)<1e-7))){stop();draw();return;}
 if(playing)frame=requestAnimationFrame(tick);
}
function queueDraw(){if(drawFrame)return;drawFrame=requestAnimationFrame(()=>{drawFrame=0;draw();});}
function restart(){stop();pull=null;distanceDemo=false;state=makeState(config,challenge?.startFraction??.25);history=[];draw();}
function balanceAuto(edited=''){
 autoNotice='';config.force=0;
 let R=ratio(config);
 if($('autoTarget').value==='mass'){
  if(edited==='inputMass'){config.outputMass=clamp(config.inputMass*R,1,MAX_MASS);config.inputMass=config.outputMass/R;}
  else {if(config.outputMass/R>MAX_MASS){config.outputMass=MAX_MASS*R;autoNotice='Mass limited to keep both sides within 200 kg.';}config.inputMass=config.outputMass/R;}
 }else{
  if(type==='pulley'){$('autoTarget').value='mass';config.inputMass=config.outputMass/R;autoNotice='Rope counts are whole numbers; input mass adjusts instead.';return;}
  config.inputMass=Math.max(.1,config.inputMass);const target=config.outputMass/config.inputMass;
  switch(type){case'lever':case'wheel':config.rIn=config.rOut*target;break;case'ramp':case'wedge':config.length=config.height*target;break;case'gears':config.crankRadius=config.drumRadius*target*config.teethIn/config.teethOut;break;case'screw':config.handleRadius=config.lead*target/(2*Math.PI);break;case'hydraulic':config.areaOut=config.areaIn*target;break;}
  config=normalizeConfig(config);R=ratio(config);
  if(Math.abs(R-target)>1e-6){config.outputMass=clamp(config.inputMass*R,1,MAX_MASS);config.inputMass=config.outputMass/R;autoNotice='Geometry reached its limit; mass adjusted to keep balance.';}
 }
 config=normalizeConfig(config);
}
function setConfig(next,{edited='',mark=true}={}){
 stopAuto();stop();pull=null;distanceDemo=false;cancelAdvance();const old=config;config=normalizeConfig(next);
 if(mode==='auto')balanceAuto(edited);
 const oldBounds=limits(old),fraction=(state.q-oldBounds.min)/oldBounds.range;changeConfig(state,old,config);if(old.force!==config.force)state=makeState(config,fraction);history=[];
 if(mode==='challenge'&&mark){custom=true;forceCorrect=false;$('nudgeBtn').hidden=true;$('setupNotice').hidden=false;$('testBtn').textContent='Test edited machine →';}
 $('feedback').textContent='';syncControls();if(custom)renderQuestion();queueDraw();
}
function resetCamera(){camera={zoom:1,cx:450,cy:270};queueDraw();}
function buildControls(){
 $('geometryControls').innerHTML=machine().geometry.map(f=>`<label class="geometry-row"><span>${esc(f.label)}${f.unit?' ('+esc(f.unit)+')':''}</span><input type="number" data-geometry="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" aria-label="${esc(f.label)}"></label>`).join('');
}
function syncControls(){
 if(!config)return;for(const[id,key]of[['inputMass','inputMass'],['outputMass','outputMass'],['appliedForce','force']])if(document.activeElement!==$(id))$(id).value=fmt(config[key]);
 $('appliedForce').disabled=mode==='auto';
 for(const f of machine().geometry){const el=document.querySelector(`[data-geometry="${f.key}"]`);if(el&&document.activeElement!==el)el.value=fmt(config[f.key]);}
 $('autoNotice').textContent=autoNotice;
}
function chooseAdaptive(preferAfter=task){
 const s=skills(),remaining=taskIds.filter(k=>s[k]<maxStage());
 if(!remaining.length){const index=machineCatalog.findIndex(m=>m.type===type);type=machineCatalog[(index+1)%machineCatalog.length].type;task=topic==='mixed'?'force':topic;level=Math.min(skills()[task]||0,maxStage()-1);return;}
 if(topic!=='mixed'){task=topic;level=Math.min(s[task]||0,maxStage()-1);return;}
 const min=Math.min(...remaining.map(k=>s[k]||0));const order=taskIds.slice(taskIds.indexOf(preferAfter)+1).concat(taskIds.slice(0,taskIds.indexOf(preferAfter)+1));
 task=order.find(k=>remaining.includes(k)&&(s[k]||0)===min)||remaining[0];level=Math.min(s[task]||0,maxStage()-1);
}
function loadChallenge({newNumbers=false}={}){
 cancelAdvance();stopAuto();stop();pull=null;drag=null;distanceDemo=false;pointers.clear();pinch=null;pendingResize=null;cancelAnimationFrame(editFrame);editFrame=0;
 if(newNumbers)saved.serial++;save();
 challenge=createChallenge(type,task,level,saved.serial);level=challenge.level;config={...challenge.config};
 custom=false;attempts=0;credited=false;forceCorrect=false;history=[];
 if(mode==='auto'){config={...defaultConfig(type)};balanceAuto();}
 state=makeState(config,challenge.startFraction??.25);$('answerValue').value='';$('maValue').value='';$('feedback').textContent='';$('steps').hidden=true;$('stepsBtn').textContent='Show steps';$('setupNotice').hidden=true;$('nudgeBtn').hidden=true;$('testBtn').textContent='Test my answer →';
 buildControls();syncControls();renderQuestion();renderTabs();resetCamera();draw();
}
function factValues(){
 if(!custom)return challenge.given;
 const dims=machine().geometry.map(f=>`${f.label}: ${fmt(config[f.key])}${f.unit?' '+f.unit:''}`);
 return [`Output mass: ${fmt(config.outputMass)} kg`,...dims,`Applied input force: ${fmt(config.force)} N`,`g = 10 m/s²`];
}
function renderQuestion(){
 $('problemLabel').textContent=custom?'EDITED MACHINE':'ADAPTIVE PRACTICE';$('score').textContent=`${totalScore()} / ${maxStage()*4}`;
 $('taskChoices').innerHTML=[{id:'mixed',label:'Mixed'},...taskCatalog].map(t=>`<button data-topic="${t.id}" class="${topic===t.id?'selected':''}">${esc(({mixed:'Mixed',force:'Force',balance:'Mass',distance:'Distance',acceleration:'Acceleration'})[t.id]||t.label)}</button>`).join('');
 $('mastery').innerHTML=taskIds.map(k=>`<div class="mastery-skill"><span>${{force:'Force',balance:'Mass',distance:'Distance',acceleration:'Acceleration'}[k]}</span><progress max="${maxStage()}" value="${skills()[k]||0}" aria-label="${k} mastery"></progress></div>`).join('');
 $('levels').innerHTML=machine().levels.map((name,i)=>`<button data-level="${i}" class="${i===level?'selected':''}">${i+1}. ${esc(name)}</button>`).join('');
 $('challengeTitle').textContent=challenge.title;
 $('question').textContent=custom?'Machine edited. Test your value, or restore the original problem to continue practice.':challenge.prompt;
 $('challengeFacts').innerHTML=factValues().map(s=>`<span>${esc(s)}</span>`).join('');
 $('answerName').textContent={force:'Input force (N)',balance:'Input mass (kg)',distance:'Input work distance d₁ (m)',acceleration:type==='ramp'?'Acceleration along ramp (m/s²)':'Initial output acceleration (m/s²)'}[task];
 $('machineNote').textContent=machine().shortNote;
}
function renderTabs(){
 document.querySelectorAll('[data-machine]').forEach(b=>b.classList.toggle('selected',b.dataset.machine===type));
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
 $('challengePanel').hidden=mode!=='challenge';$('autoPanel').hidden=mode!=='auto';$('controls').open=mode==='auto';
 $('stageTitle').textContent=machine().label+(mode==='auto'?' · Auto balance':'');
 $('restoreBtn').textContent=mode==='auto'?'Reset machine':'Restore this problem';
}
function cacheBodyInfo(){
 bodyInfo={};document.querySelectorAll('#scene [data-body]').forEach(el=>{const d=el.dataset;bodyInfo[d.body]={x:Number(d.bodyCenterX),y:Number(d.bodyCenterY),scale:Number(d.scale),tangent:[Number(d.tangentX),Number(d.tangentY)],size:Number(d.size),q:state.q};});
}
function draw(){
 if(!state)return;const r=readout(state,config,external());
 const pullView=pull?{side:pull.side,force:pull.side==='input'?r.externalInputForce:r.externalOutputForce,cursor:pull.cursor}:null;
 $('scene').innerHTML=renderScene(config,state,r,{dark:saved.dark,paths:$('paths').checked,forces:$('forces').checked,accelerations:$('accelerations').checked,pull:pullView});
 const svg=$('scene').firstElementChild;if(svg)svg.setAttribute('viewBox',`${camera.cx-450/camera.zoom} ${camera.cy-270/camera.zoom} ${900/camera.zoom} ${540/camera.zoom}`);
 $('zoomReset').textContent=Math.round(camera.zoom*100)+'%';cacheBodyInfo();
 updateCompare(r);if($('graphToggle').checked)drawGraph();
 $('accelerationReadout').hidden=!$('accelerations').checked;
 if($('accelerations').checked)$('accelerationReadout').innerHTML=`<b>Mass and motion</b><div class="blue">Input: ${fmt(config.inputMass)} kg · path a = ${fmt(r.inputPathAcceleration)} m/s²</div><div class="orange">Output: ${fmt(config.outputMass)} kg · path a = ${fmt(r.outputPathAcceleration)} m/s²</div><small>Signed acceleration along each path. Lever arrows also include acceleration toward the pivot. Gravity g = 10 m/s² is different from actual acceleration a.</small>`;
 if(mode==='auto'){$('autoExplanation').innerHTML=`<span class="blue">${fmt(config.inputMass)} kg</span> ↔ <span class="orange">${fmt(config.outputMass)} kg</span><br><b>Ideal MA = ${fmt(r.ma)}</b><br><small>m₁g d₁ = m₂g d₂<br>g cancels → m₁d₁ = m₂d₂</small>`;$('autoNotice').textContent=autoNotice;}
 let status=r.atLimit?'Travel stop · reset or pull back':Math.abs(r.outputPathSpeed)>.0001?(r.outputPathSpeed>0?'Output moving up ↑':'Output moving down ↓'):r.balanced?'Balanced · no acceleration':r.balanceError>0?'Input can lift the load':'Input cannot hold the load';
 if(mode==='challenge'&&!playing&&state.time===0&&!r.balanced&&!forceCorrect)status='Ready · calculate, resize, or pull';
 if(!playing&&state.time>0&&!r.atLimit&&Math.abs(r.velocity)>1e-7)status='Paused · '+status.toLowerCase();if(autoAnimating)status='Comparing balanced setups';
 $('motionStatus').textContent=status;
 $('pullStatus').textContent=pull?`${fmt(Math.abs(pull.side==='input'?r.externalInputForce:r.externalOutputForce))} N pull${r.forceLimited?' · limited to keep contact':''}`:'';
}
function updateCompare(r){
 const kind=$('compareKind').value;let a,b,u,li,lo;
 if(kind==='path'){a=r.pathDistanceIn;b=r.pathDistanceOut;u='m';li='Input path length';lo='Output path length';}
 else if(kind==='force'){a=r.inputForce;b=r.outputWeight;u='N';li='Input weight + applied';lo='Output weight';}
 else{a=Math.abs(r.displacementIn);b=Math.abs(r.displacementOut);u='m';li='Input work distance d₁';lo='Output work distance d₂';}
 const scale=Math.max(a,b,.00001);$('inputCompareLabel').textContent=li;$('outputCompareLabel').textContent=lo;$('inputCompareValue').textContent=fmt(a)+' '+u;$('outputCompareValue').textContent=fmt(b)+' '+u;$('inputBar').style.width=100*a/scale+'%';$('outputBar').style.width=100*b/scale+'%';
 const equal=r.balanced&&!pull;const lhs=`${fmt(r.inputForce)} N × ${fmt(r.displacementIn)} m`,rhs=`${fmt(r.outputWeight)} N × ${fmt(r.displacementOut)} m`;
 $('workEquation').innerHTML=`<span class="blue">${lhs}</span> ${equal?'=':'vs.'} <span class="orange">${rhs}</span>`;
 const deltaK=r.kineticEnergy-(state.initialKineticEnergy||0);
 $('energyText').textContent=`Work: ${fmt(r.workIn)} J + pull ${fmt(r.pointerWork)} J − load ${fmt(r.workOut)} J = ΔK ${fmt(deltaK)} J${r.stopEnergyLoss>.0001?' + stop '+fmt(r.stopEnergyLoss)+' J':''}`;
}
function drawGraph(){
 const canvas=$('graph'),w=canvas.clientWidth||280,h=canvas.clientHeight||115,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const kind=$('plotKind').value,data=history.length?history:[{t:0,i:0,o:0,fi:config.force,fo:config.outputMass*10,ai:0,ao:0}];
 const keys=kind==='acceleration'?['ai','ao']:kind==='force'?['fi','fo']:kind==='path'?['pi','po']:['i','o'];
 const xvals=data.flatMap(d=>kind==='force'?[d.i,d.o]:[d.t]),xmin=Math.min(0,...xvals),xmax=Math.max(xmin+.01,...xvals),ys=data.flatMap(d=>keys.map(k=>d[k]||0));
 const ymin=Math.min(0,...ys),ymax=Math.max(ymin+.01,...ys),L=35,T=13,B=h-22,W=w-L-7,H=B-T;
 ctx.strokeStyle=saved.dark?'#42516a':'#a8b5c7';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(L,T);ctx.lineTo(L,B);ctx.lineTo(w-6,B);ctx.stroke();ctx.fillStyle=saved.dark?'#b9c7da':'#4b5e78';ctx.font='10px system-ui';ctx.fillText(fmt(ymax),1,12);ctx.fillText(fmt(ymin),1,B);ctx.fillText(fmt(xmax)+(kind==='force'?' m':' s'),w-60,h-3);if(xmin<0)ctx.fillText(fmt(xmin),L,h-3);
 if(kind==='force'){const d=data.at(-1),x0=L+(0-xmin)/(xmax-xmin)*W,y0=B-(0-ymin)/(ymax-ymin)*H;for(const [j,dx,fy]of[[0,d.i,d.fi],[1,d.o,d.fo]]){const xx=L+(dx-xmin)/(xmax-xmin)*W,yy=B-(fy-ymin)/(ymax-ymin)*H;ctx.fillStyle=j?'rgba(255,177,111,.17)':'rgba(114,175,255,.17)';ctx.fillRect(Math.min(x0,xx),Math.min(y0,yy),Math.abs(xx-x0),Math.abs(yy-y0));}}
 keys.forEach((k,j)=>{ctx.beginPath();ctx.strokeStyle=j?(saved.dark?'#ffb16f':'#c65b17'):(saved.dark?'#72afff':'#2563eb');ctx.lineWidth=2;data.forEach((d,i)=>{const xValue=kind==='force'?(j?d.o:d.i):d.t,x=L+(xValue-xmin)/(xmax-xmin)*W,y=B-((d[k]||0)-ymin)/(ymax-ymin)*H;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.stroke();});
 $('plotLegend').textContent=kind==='force'?'Blue input · orange output · area = work (J)':kind==='path'?'Total path length (m) · blue input · orange output':kind==='acceleration'?'Path acceleration (m/s²) · blue input · orange output':'Work displacement (m) · blue input · orange output';
}
function currentAnswer(){
 if(!custom)return challenge.answer;
 const R=ratio(config);if(task==='force')return config.outputMass*10/R;if(task==='balance')return config.outputMass/R;if(task==='distance')return challenge.motionDistance*R;return initialOutputAcceleration(config);
}
function markCorrect(){
 if(credited||custom)return;credited=true;
 const expected=Math.min(skills()[task]||0,maxStage()-1);
 if(level===expected&&skills()[task]<maxStage())skills()[task]++;save();renderQuestion();
}
function nextProblem(){cancelAdvance();chooseAdaptive();loadChallenge({newNumbers:true});}
function scheduleAdvance(correct){
 if(!$('autoAdvance').checked||custom)return;
 const seconds=correct?6:7;$('advanceNotice').textContent=correct?`Correct. Next adaptive problem in ${seconds} seconds; turn off adaptation to stay.`:`A new ${task==='balance'?'mass':task} problem at the same or easier stage follows in ${seconds} seconds.`;
 advanceTimer=setTimeout(()=>{advanceTimer=0;if(correct)nextProblem();else{skills()[task]=Math.max(0,(skills()[task]||0)-1);level=Math.min(skills()[task],maxStage()-1);loadChallenge({newNumbers:true});}},seconds*1000);
}
function demonstrateDistance(){
 state=makeState(config,challenge.startFraction);state.v=(challenge.motion.targetQ-state.q)/(2.8*Number($('speed').value));state.v0=state.v;state.initialKineticEnergy=readout(state,config).kineticEnergy;history=[];distanceDemo=!custom;start();
}
function applyTest(e){
 e.preventDefault();cancelAdvance();stopAuto();pull=null;const value=parse($('answerValue').value),ma=parse($('maValue').value);
 if(!Number.isFinite(value)||value<0){feedback('Enter a positive value or fraction, such as 25/2.',false);return;}
 const cap=task==='force'?MAX_FORCE:task==='balance'?MAX_MASS:task==='distance'?100:100;
 if(value>cap){feedback(`Keep this value at or below ${cap} ${challenge.unit}.`,false);return;}
 stop();distanceDemo=false;const target=currentAnswer(),valueOK=Math.abs(value-target)<=Math.max(task==='distance'?.000001:.005,Math.abs(target)*.001),maOK=Number.isFinite(ma)&&Math.abs(ma-ratio(config))<=Math.max(.005,ratio(config)*.001);
 if(task==='force'){config.force=valueOK?target:value;config.inputMass=0;}
 else if(task==='balance'){config.inputMass=valueOK?target:value;config.force=0;}
 state=makeState(config,challenge.startFraction);history=[];syncControls();
 if(custom)feedback('Testing the edited machine. Restore the original problem to earn progress.',false);
 else if(valueOK&&maOK){markCorrect();feedback(task==='force'?'✓ Correct balance threshold. Add 2% to start lifting.':task==='balance'?'✓ Correct. The machine balances.':task==='distance'?'✓ Correct. Watch the two work distances change together.':'✓ Correct initial acceleration. Watch the load speed up.',true);forceCorrect=task==='force';$('nudgeBtn').hidden=!forceCorrect;scheduleAdvance(true);}
 else{attempts++;forceCorrect=false;$('nudgeBtn').hidden=true;let message=valueOK?'Your value is correct. Recheck ideal MA.':task==='force'||task==='balance'?(value<target?'Too small to hold the load. Watch it lower.':'Too large for exact balance. Watch it rise.'):task==='distance'?'Recheck d₁ = d₂ × ideal MA.':'Use net force divided by mass; distinguish weight mg from net force.';feedback(message,false);if(attempts>=2)scheduleAdvance(false);}
 draw();if(task==='distance'){if(valueOK)demonstrateDistance();}else start();
}
function feedback(text,good){$('feedback').className=good?'good':'bad';$('feedback').textContent=text;}
function screenPoint(x,y){
 const rect=$('scene').getBoundingClientRect(),scale=Math.min(rect.width/900,rect.height/540)*camera.zoom;
 return {x:camera.cx+(x-(rect.left+rect.width/2))/scale,y:camera.cy+(y-(rect.top+rect.height/2))/scale};
}
function zoomBy(factor,anchor){
 const old=screenPoint(anchor?.x??($('scene').getBoundingClientRect().left+$('scene').clientWidth/2),anchor?.y??($('scene').getBoundingClientRect().top+$('scene').clientHeight/2));
 camera.zoom=clamp(camera.zoom*factor,.6,3.5);
 if(anchor){const after=screenPoint(anchor.x,anchor.y);camera.cx+=old.x-after.x;camera.cy+=old.y-after.y;}
 camera.cx=clamp(camera.cx,80,820);camera.cy=clamp(camera.cy,30,510);queueDraw();
}
function effectiveMass(side){
 const R=ratio(config),M=type==='lever'?config.inputMass*config.rIn**2+config.outputMass*config.rOut**2:type==='ramp'?config.inputMass+config.outputMass:config.inputMass+config.outputMass/R**2;
 const J=type==='lever'?(side==='input'?config.rIn:config.rOut):side==='input'||type==='ramp'?1:1/R;
 return M/J**2;
}
function updatePull(){
 if(!pull)return;const info=bodyInfo[pull.side];if(!info||!Number.isFinite(info.scale)||info.scale<=0){pull.force={input:0,output:0};return;}
 const r=readout(state,config),speed=pull.side==='input'?r.inputPathSpeed:r.outputPathSpeed;
 let tangent=info.tangent,x=info.x,y=info.y;const J=bodyJacobian(config)[pull.side];if(type==='lever'){const rad=pull.side==='input'?config.rIn:config.rOut,sign=pull.side==='input'?1:-1;x+=sign*rad*info.scale*(Math.cos(info.q)-Math.cos(state.q));y+=sign*rad*info.scale*(Math.sin(state.q)-Math.sin(info.q));tangent=[sign*Math.sin(state.q),sign*Math.cos(state.q)];}else{x+=tangent[0]*J*(state.q-info.q)*info.scale;y+=tangent[1]*J*(state.q-info.q)*info.scale;}const stretch=((pull.cursor.x-x)*tangent[0]+(pull.cursor.y-y)*tangent[1])/info.scale;
 const cursorSpeed=clamp((pull.velocity.x*tangent[0]+pull.velocity.y*tangent[1])/(info.scale*Number($('speed').value)),-5,5);
 const mass=effectiveMass(pull.side),k=Math.min(800,25*mass),damping=1.6*Math.sqrt(k*mass);
 const R=ratio(config),Qbase=type==='lever'?((config.inputMass*10+config.force)*config.rIn-config.outputMass*10*config.rOut)*Math.cos(state.q):config.inputMass*10+config.force-config.outputMass*10/R;const support=-Qbase/J;
 const F=clamp(support+k*stretch+damping*(cursorSpeed-speed),-MAX_FORCE,MAX_FORCE);
 pull.force={input:0,output:0,[pull.side]:F};pull.velocity.x*=.75;pull.velocity.y*=.75;
}
function beginPointer(e){
 if(e.button!==undefined&&e.button!==0)return;
 const scene=e.target.closest('#scene');if(!scene)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){pull=null;drag=null;const pts=[...pointers.values()];pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),zoom:camera.zoom};return;}
 const handle=e.target.closest('[data-drag]'),p=screenPoint(e.clientX,e.clientY);stopAuto();cancelAdvance();
 if(handle?.dataset.drag==='resize'){
  stop();const d=handle.dataset;drag={kind:'resize',side:d.side,size:Number(d.baseSize||d.size)||bodyInfo[d.side]?.size||0,axis:d.axis||'xy',sx:Number(d.signx??d.signX??1),sy:Number(d.signy??d.signY??1),angle:Number(d.angle)||0,p};
 }else if(handle?.dataset.drag==='geometry'){
  stop();const d=handle.dataset;drag={kind:'geometry',key:d.param,axis:d.axis||'x',units:Number(d.unitsPerPx)||.01,value:config[d.param],p};
 }else if(handle?.dataset.drag==='pull'&&$('pullTool').checked){
  const side=handle.dataset.side;if(!bodyInfo[side])return;const offset={x:p.x-bodyInfo[side].x,y:p.y-bodyInfo[side].y},target={x:p.x-offset.x,y:p.y-offset.y};pull={side,cursor:target,offset,velocity:{x:0,y:0},previous:target,time:performance.now(),force:{input:0,output:0}};distanceDemo=false;start();
 }else drag={kind:'pan',p:{x:e.clientX,y:e.clientY},camera:{...camera}};
 try{$('scene').setPointerCapture(e.pointerId);}catch{}
}
function movePointer(e){
 if(!pointers.has(e.pointerId))return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&pointers.size>=2){const pts=[...pointers.values()],dist=Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y);camera.zoom=clamp(pinch.zoom*dist/Math.max(1,pinch.dist),.6,3.5);queueDraw();return;}
 const p=screenPoint(e.clientX,e.clientY);
 if(pull){const target={x:p.x-pull.offset.x,y:p.y-pull.offset.y},now=performance.now(),dt=Math.max(.008,(now-pull.time)/1000);pull.velocity={x:(target.x-pull.previous.x)/dt,y:(target.y-pull.previous.y)/dt};pull.previous=target;pull.cursor=target;pull.time=now;return;}
 if(!drag)return;
 if(drag.kind==='pan'){const rect=$('scene').getBoundingClientRect(),s=Math.min(rect.width/900,rect.height/540)*camera.zoom;camera.cx=clamp(drag.camera.cx-(e.clientX-drag.p.x)/s,80,820);camera.cy=clamp(drag.camera.cy-(e.clientY-drag.p.y)/s,30,510);queueDraw();return;}
 if(drag.kind==='geometry'){const delta=drag.axis==='y'?p.y-drag.p.y:p.x-drag.p.x;pendingResize={next:{...config,[drag.key]:drag.value+delta*drag.units},edited:drag.key};}
 else{
  const dx=p.x-drag.p.x,dy=p.y-drag.p.y,c=Math.cos(drag.angle),s=Math.sin(drag.angle),lx=dx*c+dy*s,ly=-dx*s+dy*c;
  const amount=drag.axis==='x'?lx*drag.sx:drag.axis==='y'?ly*drag.sy:(lx*drag.sx+ly*drag.sy)/2;
  const size=clamp(drag.size+2*amount,drag.side==='input'?0:10,10*Math.sqrt(MAX_MASS));const key=drag.side==='input'?'inputMass':'outputMass';
  pendingResize={next:{...config,[key]:Math.round(size*size)/100},edited:key};
 }
 if(!editFrame)editFrame=requestAnimationFrame(applyPendingEdit);
}
function applyPendingEdit(){cancelAnimationFrame(editFrame);editFrame=0;if(!pendingResize)return;const update=pendingResize;pendingResize=null;const isGuess=mode==='challenge'&&task==='balance'&&update.edited==='inputMass';setConfig(update.next,{edited:update.edited,mark:!isGuess});if(isGuess)$('answerValue').value=fmt(config.inputMass);}
function endPointer(e){
 pointers.delete(e.pointerId);if(pinch){if(pointers.size<2)pinch=null;return;}
 if(pendingResize)applyPendingEdit();if(pull){pull=null;queueDraw();}drag=null;
 try{$('scene').releasePointerCapture(e.pointerId);}catch{}
}
$('machines').innerHTML=machineCatalog.map(m=>`<button data-machine="${m.type}">${esc(m.label)}</button>`).join('');
$('machines').onclick=e=>{const b=e.target.closest('[data-machine]');if(!b)return;type=b.dataset.machine;task=topic==='mixed'?'force':topic;level=Math.min(skills()[task]||0,maxStage()-1);loadChallenge();};
 document.querySelector('.modes').onclick=e=>{const b=e.target.closest('[data-mode]');if(b){mode=b.dataset.mode;loadChallenge();}};
$('taskChoices').onclick=e=>{const b=e.target.closest('[data-topic]');if(!b)return;topic=b.dataset.topic;if(topic==='mixed')chooseAdaptive('acceleration');else{task=topic;level=Math.min(skills()[task]||0,maxStage()-1);}loadChallenge();};
$('levels').onclick=e=>{const b=e.target.closest('[data-level]');if(b){level=+b.dataset.level;loadChallenge();}};
$('answerForm').onsubmit=applyTest;$('nextBtn').onclick=nextProblem;$('practiceBtn').onclick=()=>loadChallenge({newNumbers:true});$('autoAdvance').onchange=cancelAdvance;
$('stepsBtn').onclick=()=>{$('steps').hidden=!$('steps').hidden;$('stepsBtn').textContent=$('steps').hidden?'Show steps':'Hide steps';$('steps').innerHTML=(custom?['F₁d₁ = F₂d₂ at balance or steady speed.','MA = d₁/d₂ from the current machine geometry.','For acceleration, calculate the net force and divide by the mass.','Restore the original problem for its numerical setup.']:challenge.steps).map((s,i)=>`<p><b>${i+1}.</b> ${esc(s)}</p>`).join('');};
$('playBtn').onclick=()=>{cancelAdvance();if(playing)stop();else{if(readout(state,config).atLimit)restart();start();}};
$('resetBtn').onclick=()=>{cancelAdvance();stopAuto();restart();};$('nudgeBtn').onclick=()=>{cancelAdvance();config.force=clamp(currentAnswer()*1.02,0,MAX_FORCE);config.inputMass=0;restart();syncControls();feedback('Testing 2% above the balance threshold. Extra work becomes kinetic energy.',true);start();};
$('restoreBtn').onclick=()=>loadChallenge();
for(const id of ['inputMass','outputMass','appliedForce']){const commit=e=>{const key=id==='appliedForce'?'force':id,value=parse(e.target.value),isGuess=mode==='challenge'&&((task==='balance'&&key==='inputMass')||(task==='force'&&key==='force'));if(Number.isFinite(value)&&Math.abs(value-config[key])>1e-8)setConfig({...config,[key]:value},{edited:key,mark:!isGuess});e.target.value=fmt(config[key]);if(isGuess)$('answerValue').value=fmt(config[key]);};$(id).onchange=commit;$(id).onblur=commit;$(id).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit(e);}};}
function commitGeometry(e){const key=e.target.dataset.geometry;if(!key)return;const value=parse(e.target.value);if(Number.isFinite(value)&&Math.abs(value-config[key])>1e-8)setConfig({...config,[key]:value},{edited:key});e.target.value=fmt(config[key]);}
$('geometryControls').onchange=commitGeometry;$('geometryControls').addEventListener('blur',commitGeometry,true);$('geometryControls').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commitGeometry(e);}};
$('autoTarget').onchange=()=>setConfig({...config},{mark:false});
$('autoAnimate').onclick=()=>{
 if(autoAnimating){stopAuto();return;}stop();pull=null;$('autoTarget').value='mass';autoAnimating=true;autoStart=0;$('autoAnimate').textContent='Ⅱ Pause comparison';
 const animate=t=>{if(!autoAnimating||mode!=='auto')return;if(!autoStart)autoStart=t;const wave=(1-Math.cos((t-autoStart)/2400))/2,R=type==='screw'?10+30*wave:type==='ramp'?2+4*wave:1+3*wave;let c={...config,force:0};switch(type){case'lever':case'wheel':c.rIn=c.rOut*R;break;case'ramp':case'wedge':c.length=c.height*R;break;case'pulley':c.strands=wave<.5?1:2;break;case'gears':c.crankRadius=c.drumRadius*R*c.teethIn/c.teethOut;break;case'screw':c.handleRadius=c.lead*R/(2*Math.PI);break;case'hydraulic':c.areaOut=c.areaIn*R;break;}config=normalizeConfig(c);balanceAuto();state=makeState(config,.3);history=[];if(t-lastDraw>1000/30){syncControls();draw();lastDraw=t;}autoFrame=requestAnimationFrame(animate);};autoFrame=requestAnimationFrame(animate);
};
for(const id of ['paths','forces','accelerations','compareKind','plotKind'])$(id).onchange=queueDraw;
$('charts').onchange=()=>{$('comparePanel').hidden=!$('charts').checked;queueDraw();};$('graphToggle').onchange=()=>{$('plotPanel').hidden=!$('graphToggle').checked;queueDraw();};
$('pullTool').onchange=()=>{pull=null;queueDraw();};$('zoomIn').onclick=()=>zoomBy(1.2);$('zoomOut').onclick=()=>zoomBy(1/1.2);$('zoomReset').onclick=resetCamera;
$('scene').addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(-clamp(e.deltaY,-150,150)*.003),{x:e.clientX,y:e.clientY});},{passive:false});
$('scene').addEventListener('pointerdown',beginPointer);$('scene').addEventListener('pointermove',movePointer,{passive:false});$('scene').addEventListener('pointerup',endPointer);$('scene').addEventListener('pointercancel',endPointer);
window.addEventListener('blur',()=>{pull=null;drag=null;pointers.clear();stop();stopAuto();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopAuto();cancelAdvance();pull=null;}});window.addEventListener('resize',queueDraw);
function theme(){document.body.classList.toggle('dark',saved.dark);$('themeBtn').textContent=saved.dark?'☀':'☾';queueDraw();}$('themeBtn').onclick=()=>{saved.dark=!saved.dark;save();theme();};
$('fullscreenBtn').onclick=async()=>{try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{}};$('helpBtn').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();
const hash=location.hash.match(/machine=(\w+)/);if(hash&&machineCatalog.some(m=>m.type===hash[1]))type=hash[1];level=Math.min(skills()[task]||0,maxStage()-1);loadChallenge();theme();
