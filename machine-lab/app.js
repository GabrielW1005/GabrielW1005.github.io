import {defaultConfig,normalizeConfig,ratio,makeState,step,readout,changeConfig,limits,MAX_FORCE,MAX_MASS,bodyJacobian,initialOutputAcceleration,isAngularMachine,generalizedDrive} from './physics.js?v=progress-v1';
import {machineCatalog,taskCatalog,createChallenge} from './challenges.js?v=progress-v1';
import {createBalanceChallenge} from './balance-challenges.js?v=progress-v1';
import {horizontalRun,setupValue,editSetup,setupEntry as entryValue} from './machine-edits.js?v=progress-v1';
import {renderScene} from './scene.js?v=progress-v1';
import {renderComparison} from './comparison.js?v=progress-v1';
import {initPanels} from './panels.js?v=progress-v1';
import {snapValue,answerRounding,displayValue,matchesRoundedAnswer} from './value-steps.js?v=progress-v1';
import {normalizeProgress,serializeProgress,parseProgress,encodeProgress,decodeProgress,recordAttempt} from './progress.js?v=progress-v1';
const $=id=>document.getElementById(id),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const fmt=n=>Number.isFinite(n)?(Math.abs(n)<1e-8?'0':Number(n.toPrecision(4)).toString()):'—';
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const parse=s=>{const t=String(s).trim(),m=t.match(/^([-+]?\d*\.?\d+)\s*\/\s*([-+]?\d*\.?\d+)$/);return m?(+m[2]?+m[1]/+m[2]:NaN):/^[-+]?\d*\.?\d+(?:e[-+]?\d+)?$/i.test(t)?Number(t):NaN;};
const taskIds=['force','balance','distance','acceleration'];
let saved={dark:true,skills:{},serial:0,pathWidth:3};try{saved={...saved,...JSON.parse(localStorage.getItem('machine-lab-adaptive-v3')||'{}')};}catch{}
let resistance=0;
let type='lever',task='balance',topic='mixed',mode='balance',level=0,challenge,config,state;
let custom=false,attempts=0,credited=false,forceCorrect=false,playing=false,frame=0,lastTime=0,lastDraw=0,drawFrame=0,editFrame=0;
let history=[],bodyInfo={},drag=null,pull=null,pointers=new Map(),pinch=null,pendingResize=null,advanceTimer=0;
let autoAnimating=false,autoFrame=0,autoStart=0,autoNotice='',distanceDemo=false;
let camera={zoom:1,cx:450,cy:270},rampView=null;
const PROGRESS_KEY='machine-lab-progress-v1',RELEASE='progress-v1';
let progressReady=false,saveTimer=0,student='',progressStats={},sharedPreview=null;
let testedEntry='',movementTest=null,comparisonSnapshot=null,comparisonPhase=0;
const machine=()=>machineCatalog.find(m=>m.type===type);
const editable=key=>mode!=='balance'||key===challenge?.key;
const balanceVariant=()=>saved.balanceVariants?.[type]||0;
function nextBalance(){saved.balanceVariants={...saved.balanceVariants,[type]:balanceVariant()+1};save();loadChallenge();}

function save(){queueAutoSave();}
function skills(){if(!saved.skills[type])saved.skills[type]={force:0,balance:0,distance:0,acceleration:0};return saved.skills[type];}
function maxStage(){return machine().levels.length;}
function totalScore(){return Object.values(skills()).reduce((a,b)=>a+Math.min(b,maxStage()),0);}
function cancelAdvance(){clearTimeout(advanceTimer);advanceTimer=0;$('advanceNotice').textContent='';}
function stopAuto(){const changed=autoAnimating;autoAnimating=false;cancelAnimationFrame(autoFrame);$('autoAnimate').textContent='▶ Compare balanced setups';if(changed)queueAutoSave();}
function stop(){playing=false;cancelAnimationFrame(frame);lastTime=0;$('playBtn').textContent='▶ Run';queueDraw();}
function external(){
 if(pull)return pull.force;
 if(!movementTest)return {input:0,output:0};
 const J=bodyJacobian(config).input,mass=effectiveMass('input'),k=Math.min(700,36*mass),d=2*Math.sqrt(k*mass);
 const error=(movementTest.targetQ-state.q)*J,speed=state.v*J;
 const Qbase=generalizedDrive(config,state.q);
 return {input:clamp(-Qbase/J+k*error-d*speed,-MAX_FORCE,MAX_FORCE),output:0};
}
function start(){if(playing)return;stopAuto();playing=true;lastTime=0;$('playBtn').textContent='Ⅱ Pause';frame=requestAnimationFrame(tick);}
function tick(t){if(!playing)return;const dt=lastTime?Math.min((t-lastTime)/1000,.05):0;lastTime=t;
 if(pull)updatePull();
 const speed=Number($('speed').value);step(state,config,dt*speed,external());
 const r=readout(state,config,external());
 if(!history.length||r.time-history.at(-1).t>=.04){history.push({t:r.time,i:r.displacementIn,o:r.displacementOut,fi:r.inputForce,fo:r.outputWeight,ai:r.inputPathAcceleration,ao:r.outputPathAcceleration,pi:r.pathDistanceIn,po:r.pathDistanceOut});if(history.length>360)history.shift();}
 if(movementTest&&!movementTest.reported&&Math.abs((state.q-movementTest.targetQ)*bodyJacobian(config).input)<.0002&&Math.abs(r.inputPathSpeed)<.0005){movementTest.reported=true;const measured=Math.abs(r.displacementOut);$('feedback').insertAdjacentHTML('beforeend',`<span class="measured-result">Output: ${fmt(measured)} m · target: ${fmt(challenge.motionDistance)} m.</span>`);}
 if(t-lastDraw>=1000/30||!playing){draw();lastDraw=t;}
 if(playing)frame=requestAnimationFrame(tick);
}
function queueDraw(){if(drawFrame)return;drawFrame=requestAnimationFrame(()=>{drawFrame=0;draw();});}
function restart(){stop();pull=null;distanceDemo=false;movementTest=null;testedEntry='';state=makeState(config,challenge?.startFraction??.25);history=[];draw();}
function balanceAuto(edited=''){
 autoNotice='';config.force=0;
 let R=ratio(config);
 if($('autoTarget').value==='mass'){
  if(edited==='inputMass'){config.outputMass=clamp(config.inputMass*R,1,MAX_MASS);config.inputMass=config.outputMass/R;}
  else {if(config.outputMass/R>MAX_MASS){config.outputMass=MAX_MASS*R;autoNotice='Mass limited to keep both sides within 200 kg.';}config.inputMass=config.outputMass/R;}
 }else{
  if(type==='pulley'){$('autoTarget').value='mass';config.inputMass=config.outputMass/R;autoNotice='Rope counts are whole numbers; input mass adjusts instead.';return;}
  config.inputMass=Math.max(.1,config.inputMass);const target=config.outputMass/config.inputMass;
  switch(type){case'lever':case'wheel':config.rIn=config.rOut*target;break;case'ramp':case'wedge':config.length=config.height*target;break;case'gears':config.teethOut=Math.round(config.teethIn*target);break;case'screw':config.handleRadius=config.lead*target/(2*Math.PI);break;case'hydraulic':config.areaOut=config.areaIn*target;break;}
  config=normalizeConfig(config);R=ratio(config);
  if(Math.abs(R-target)>1e-6){config.outputMass=clamp(config.inputMass*R,1,MAX_MASS);config.inputMass=config.outputMass/R;autoNotice='Geometry reached its limit; mass adjusted to keep balance.';}
 }
 config=normalizeConfig(config);
}
function setConfig(next,{edited='',mark=true}={}){
 if(!editable(edited))return;
 const resume=playing&&mode!=='balance';stopAuto();stop();pull=null;distanceDemo=false;movementTest=null;testedEntry='';cancelAdvance();const old=config;config=normalizeConfig(next);
 if(mode==='auto')balanceAuto(edited);
 const oldBounds=limits(old),fraction=(state.q-oldBounds.min)/oldBounds.range;changeConfig(state,old,config);if(old.force!==config.force)state=makeState(config,fraction);history=[];
 if(mode==='challenge'&&mark){custom=true;forceCorrect=false;$('nudgeBtn').hidden=true;$('setupNotice').hidden=false;$('testBtn').textContent='Test edited machine →';}
 $('feedback').textContent='';syncControls();if(mode==='balance'){$('answerValue').value=entryValue(setupValue(config,challenge.key));}if(custom)renderQuestion();queueDraw();queueAutoSave();if(resume&&!drag)start();
}
function resetCamera(){camera={zoom:1,cx:450,cy:270};rampView=null;queueDraw();queueAutoSave();}
function rampRun(c=config){return horizontalRun(c);}
function lengthForRun(run,height){const lo=Math.sqrt(Math.max(0,.3**2-height**2)),hi=Math.sqrt(Math.max(0,5**2-height**2));return Math.hypot(clamp(run,lo,hi),height);}
function snapGeometry(key,value){const f=machine().geometry.find(f=>f.key===key);if(!f)return value;if(f.values)return f.values.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best,f.values[0]);let max=f.max;if(type==='ramp'&&key==='height')max=Math.min(max,Math.sqrt(Math.max(0,25-rampRun()**2)));return snapValue(value,f.step,f.min,max);}
function buildControls(){
 $('geometryControls').innerHTML=machine().geometry.map(f=>`<label class="geometry-row"><span>${esc(f.label)}${f.unit?' ('+esc(f.unit)+')':''}</span>${f.values?`<select data-geometry="${f.key}" aria-label="${esc(f.label)}">${f.values.map(v=>`<option value="${v}">${v}</option>`).join('')}</select>`:`<input type="number" data-geometry="${f.key}" min="${f.min}" max="${f.max}" step="${f.step}" title="Drag increment: ${f.step}${f.unit?' '+esc(f.unit):''}" aria-label="${esc(f.label)}">`}</label>`).join('');
 if(type==='ramp')$('geometryControls').insertAdjacentHTML('afterbegin','<label class="geometry-row"><span>Horizontal run (m)</span><input type="number" data-geometry="rampRun" min="0" max="5" step="0.1" aria-label="Horizontal ramp run"></label>');
}
function syncControls(){
 if(!config)return;const runControl=document.querySelector('[data-geometry="rampRun"]');if(runControl&&document.activeElement!==runControl){runControl.value=fmt(rampRun());runControl.dataset.renderedValue=runControl.value;}for(const[id,key]of[['inputMass','inputMass'],['outputMass','outputMass'],['appliedForce','force']])if(document.activeElement!==$(id)){$(id).value=answerRounding(config[key]).text;$(id).dataset.renderedValue=$(id).value;$(id).title=answerRounding(config[key]).approximate?'Rounded display; the simulation keeps the exact value.':'';}
 $('inputMass').disabled=!editable('inputMass');$('outputMass').disabled=!editable('outputMass');$('appliedForce').disabled=mode==='auto'||mode==='balance';if(runControl)runControl.disabled=!editable('rampRun');
 for(const f of machine().geometry){const el=document.querySelector(`[data-geometry="${f.key}"]`);if(el)el.disabled=!editable(f.key);if(el&&document.activeElement!==el){el.value=fmt(config[f.key]);el.dataset.renderedValue=el.value;}}
 $('autoNotice').textContent=autoNotice;
}
function chooseAdaptive(preferAfter=task){
 const s=skills(),remaining=taskIds.filter(k=>s[k]<maxStage());
 if(!remaining.length){const available=machineCatalog.filter(m=>!m.balanceOnly),index=available.findIndex(m=>m.type===type);type=available[(index+1)%available.length].type;task=topic==='mixed'?'force':topic;level=Math.min(skills()[task]||0,maxStage()-1);return;}
 if(topic!=='mixed'){task=topic;level=Math.min(s[task]||0,maxStage()-1);return;}
 const min=Math.min(...remaining.map(k=>s[k]||0));const order=taskIds.slice(taskIds.indexOf(preferAfter)+1).concat(taskIds.slice(0,taskIds.indexOf(preferAfter)+1));
 task=order.find(k=>remaining.includes(k)&&(s[k]||0)===min)||remaining[0];level=Math.min(s[task]||0,maxStage()-1);
}
function loadChallenge({newNumbers=false}={}){
 cancelAdvance();stopAuto();stop();pull=null;drag=null;distanceDemo=false;movementTest=null;pointers.clear();pinch=null;pendingResize=null;cancelAnimationFrame(editFrame);editFrame=0;
 if(mode==='balance'){task='balance';if(newNumbers)saved.balanceVariants={...saved.balanceVariants,[type]:balanceVariant()+1};challenge=createBalanceChallenge(type,balanceVariant());level=0;}else{if(newNumbers)saved.serial++;challenge=createChallenge(type,task,level,saved.serial);level=challenge.level;}save();config={...challenge.config};
 custom=false;attempts=0;credited=false;forceCorrect=false;history=[];testedEntry='';
 if(mode==='auto'){config={...defaultConfig(type),damping:resistance};balanceAuto();}else config.damping=resistance;
 syncResistance();
 state=makeState(config,challenge.startFraction??.25);$('answerValue').value='';$('feedback').textContent='';$('steps').hidden=true;$('stepsBtn').textContent='Show steps';$('setupNotice').hidden=true;$('nudgeBtn').hidden=true;$('testBtn').textContent='Check & run →';
 buildControls();syncControls();renderQuestion();renderTabs();if(mode==='balance')$('answerValue').value=entryValue(setupValue(config,challenge.key));resetCamera();draw();queueAutoSave();
}
function factValues(){
 if(!custom)return challenge.given;
 const dims=machine().geometry.map(f=>`${f.label}: ${fmt(config[f.key])}${f.unit?' '+f.unit:''}`),groups=[];for(let i=0;i<dims.length;i+=2)groups.push(dims.slice(i,i+2).join(' · '));
 return [task==='balance'?`Output mass: ${fmt(config.outputMass)} kg`:`Masses: input ${fmt(config.inputMass)} kg · output ${fmt(config.outputMass)} kg`,...groups,task==='force'?'g = 10 m/s²':`Applied force: ${fmt(config.force)} N · g = 10 m/s²`];
}
function renderQuestion(){
 if(mode==='balance'){
  $('problemLabel').textContent='BALANCE';$('score').textContent='';$('taskChoices').innerHTML='';$('levels').innerHTML='';$('challengeTitle').textContent=challenge.title;$('challengeGoal').textContent=type==='gearArms'?'BALANCE AT HORIZONTAL':'MAKE IT BALANCE';$('question').textContent=challenge.prompt;$('challengeFacts').innerHTML=challenge.given.map(s=>`<span>${esc(s)}</span>`).join('');$('answerName').textContent=challenge.label+(challenge.unit?' ('+challenge.unit+')':'');$('answerValue').placeholder='Enter a value';$('answerValue').dataset.step=challenge.step;$('testBtn').textContent='Run & test →';$('setupNotice').hidden=true;$('balanceEditHint').textContent=`Drag the marked ${challenge.kind==='mass'?'mass':'machine handle'} or enter a value. Run tests your setup; it does not show the answer.`;$('machineNote').textContent=machine().shortNote;return;
 }
 $('problemLabel').textContent=custom?'EDITED MACHINE':'ADAPTIVE PRACTICE';$('score').textContent=`${totalScore()} / ${maxStage()*4}`;
 $('taskChoices').innerHTML=[{id:'mixed',label:'Mixed'},...taskCatalog].map(t=>`<button data-topic="${t.id}" class="${topic===t.id?'selected':''}">${esc(({mixed:'Mixed',force:'Force',balance:'Mass',distance:'Distance',acceleration:'Acceleration'})[t.id]||t.label)}</button>`).join('');
 $('mastery').innerHTML=taskIds.map(k=>`<div class="mastery-skill"><span>${{force:'Force',balance:'Mass',distance:'Distance',acceleration:'Acceleration'}[k]}</span><progress max="${maxStage()}" value="${skills()[k]||0}" aria-label="${k} mastery"></progress></div>`).join('');
 $('levels').innerHTML=machine().levels.map((name,i)=>`<button data-level="${i}" class="${i===level?'selected':''}">${i+1}. ${esc(name)}</button>`).join('');
 $('challengeTitle').textContent=challenge.title;$('challengeGoal').textContent=custom?'Test edited setup':challenge.goalLabel||({force:'Start lifting',balance:'Find balance',distance:'Make a specified movement',acceleration:'Predict initial motion'}[task]);
 $('question').textContent=custom?({force:'Find the smallest whole-number input force that starts lifting from rest.',balance:'Find the input mass that exactly balances this setup.',distance:`Find input work distance d₁ for an output rise of ${fmt(challenge.motionDistance)} m.`,acceleration:type==='ramp'?'Find the initial acceleration along the ramp from rest.':'Find the initial output acceleration from rest.'}[task]):challenge.prompt;
 $('challengeFacts').innerHTML=factValues().map(s=>`<span>${esc(s)}</span>`).join('');
 $('answerName').textContent={force:'Smallest whole-number force (N)',balance:'Input mass (kg)',distance:'Input work distance d₁ (m)',acceleration:type==='ramp'?'Acceleration along ramp (m/s²)':'Initial output acceleration (m/s²)'}[task];
 const rounded=answerRounding(currentAnswer(),task);if(rounded.approximate)$('question').textContent+=` Round to ${rounded.places} decimal places.`;
 $('machineNote').textContent=machine().shortNote;
}
function renderTabs(){
 document.body.dataset.mode=mode;if(mode==='balance')$('stepsWindow').hidden=true;$('taskChoices').hidden=mode==='balance';$('stepsBtn').hidden=mode==='balance';$('adaptLabel').hidden=mode==='balance';$('balanceEditHint').hidden=mode!=='balance';$('mastery').hidden=mode==='balance';$('advanceNotice').hidden=mode==='balance';$('nextBtn').textContent='Next problem →';document.querySelectorAll('[data-mode]').forEach(b=>{b.disabled=machine().balanceOnly&&b.dataset.mode!=='balance';b.title=b.disabled?'Gear arms is a Balance activity. Choose another machine for this mode.':'';});
 document.querySelectorAll('[data-machine]').forEach(b=>b.classList.toggle('selected',b.dataset.machine===type));
 document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
 $('challengePanel').hidden=mode==='auto';$('autoPanel').hidden=mode!=='auto';
 $('stageTitle').textContent=machine().label+(mode==='auto'?' · Auto balance':'');
 $('restoreBtn').textContent=mode==='auto'?'Reset machine':'Restore this problem';
}
function cacheBodyInfo(){
 bodyInfo={};document.querySelectorAll('#scene [data-body]').forEach(el=>{const d=el.dataset;bodyInfo[d.body]={x:Number(d.bodyCenterX),y:Number(d.bodyCenterY),scale:Number(d.scale),tangent:[Number(d.tangentX),Number(d.tangentY)],size:Number(d.size),q:state.q};});
}
function draw(){
 if(!state)return;const r=readout(state,config,external());
 const targetInput=task==='distance'?challenge.motionDistance*ratio(config):0,targetQ=mode==='challenge'&&task==='distance'?(type==='lever'?Math.asin(clamp(Math.sin(state.q0)+targetInput/config.rIn,-1,1)):state.q0+targetInput):null;
 const pullView=pull?{side:pull.side,force:pull.side==='input'?r.externalInputForce:r.externalOutputForce,cursor:pull.cursor}:null;
 $('scene').innerHTML=renderScene(config,state,r,{dark:saved.dark,rampView,rampScale:drag&&(drag.kind==='rampRun'||(type==='ramp'&&drag.key==='height'))?drag.scale:undefined,editableKey:mode==='balance'?challenge.key:null,paths:$('paths').checked,forces:$('forces').checked,accelerations:$('accelerations').checked,pathWidth:Number($('pathWidth').value),pull:pullView,actuatorForce:movementTest?r.externalInputForce:0,targetQ,targetRise:challenge.motionDistance});
 if(type==='ramp'&&!rampView){const d=$('scene').querySelector('[data-geo="rampRun"]')?.dataset;if(d&&Number(d.scale)>0)rampView={scale:Number(d.scale),x0:Number(d.baseX),baseY:Number(d.baseY)};}
 const svg=$('scene').firstElementChild;if(svg)svg.setAttribute('viewBox',`${camera.cx-450/camera.zoom} ${camera.cy-270/camera.zoom} ${900/camera.zoom} ${540/camera.zoom}`);
 $('zoomReset').textContent=Math.round(camera.zoom*100)+'%';cacheBodyInfo();
 updateCompare(r);if($('graphToggle').checked)drawGraph();
 $('accelerationReadout').hidden=!$('accelerations').checked;
 if($('accelerations').checked)$('accelerationReadout').innerHTML=`<b>Mass and motion</b><div class="blue">Input: ${fmt(config.inputMass)} kg · path a = ${fmt(r.inputPathAcceleration)} m/s²</div><div class="orange">Output: ${fmt(config.outputMass)} kg · path a = ${fmt(r.outputPathAcceleration)} m/s²</div><small>Signed acceleration along each path. Lever and gear-arm arrows also include acceleration toward the axle. Gravity g = 10 m/s² is different from actual acceleration a.</small>`;
 if(mode==='auto'){$('autoExplanation').innerHTML=`<span class="blue">${displayValue(config.inputMass)} kg</span> ↔ <span class="orange">${displayValue(config.outputMass)} kg</span><br><b>Ideal MA ${displayValue(r.ma).startsWith('≈')?'':'= '}${displayValue(r.ma)}</b><br><small>m₁g d₁ = m₂g d₂<br>g cancels → m₁d₁ = m₂d₂</small>`;$('autoNotice').textContent=autoNotice;}
 let status=r.atLimit?'Resting at travel stop · pull back to move':Math.abs(r.outputPathSpeed)>.0001?(r.outputPathSpeed>0?'Output moving up ↑':'Output moving down ↓'):r.balanced?(config.damping?'Balanced · at rest · pull to disturb':'Balanced · no acceleration'):r.balanceError>0?'Input can lift the load':'Input cannot hold the load';
 if(mode!=='auto'&&!playing&&state.time===0&&!r.balanced&&!forceCorrect)status='Ready · calculate, resize, or pull';
 if(!playing&&state.time>0&&!r.atLimit&&Math.abs(r.velocity)>1e-7)status='Paused · '+status.toLowerCase();if(autoAnimating)status='Comparing balanced setups';else if(playing&&Math.abs(r.outputPathSpeed)<.0001)status='Running · '+status.toLowerCase();
 $('motionStatus').textContent=status;
 $('pullStatus').textContent=pull?`${fmt(Math.abs(pull.side==='input'?r.externalInputForce:r.externalOutputForce))} N pull${r.forceLimited?' · limited to keep contact':''}`:'';
}
function updateCompare(r){
 const kind=$('compareKind').value;let a,b,u,li,lo;
 if(kind==='path'){a=r.pathDistanceIn;b=r.pathDistanceOut;u='m';li='Input path length';lo='Output path length';}
 else if(kind==='force'){a=r.inputForce;b=r.outputWeight;u='N';li='Input weight + applied';lo='Output weight';}
 else{a=Math.abs(r.displacementIn);b=Math.abs(r.displacementOut);u='m';li='Input work distance d₁';lo='Output work distance d₂';}
 const scale=Math.max(a,b,.00001);$('inputCompareLabel').textContent=li;$('outputCompareLabel').textContent=lo;$('inputCompareValue').textContent=fmt(a)+' '+u;$('outputCompareValue').textContent=fmt(b)+' '+u;$('inputBar').style.width=100*a/scale+'%';$('outputBar').style.width=100*b/scale+'%';
 const productIn=r.inputForce*r.displacementIn,productOut=r.outputWeight*r.displacementOut,equal=r.balanced&&!pull&&Math.abs(productIn-productOut)<=1e-8*Math.max(1,Math.abs(productIn),Math.abs(productOut)),roundedIn=Number(fmt(r.inputForce))*Number(fmt(r.displacementIn)),roundedOut=Number(fmt(r.outputWeight))*Number(fmt(r.displacementOut)),equalMark=Math.abs(roundedIn-roundedOut)<1e-8*Math.max(1,Math.abs(roundedIn),Math.abs(roundedOut))?'=':'≈';const lhs=`${fmt(r.inputForce)} N × ${fmt(r.displacementIn)} m`,rhs=`${fmt(r.outputWeight)} N × ${fmt(r.displacementOut)} m`;
 $('workEquation').innerHTML=`<span class="blue">${lhs}</span> ${equal?equalMark:'vs.'} <span class="orange">${rhs}</span>`;
 const deltaK=r.kineticEnergy-(state.initialKineticEnergy||0);
 $('energyText').textContent=`Work: ${fmt(r.workIn)} J + extra ${fmt(r.pointerWork)} J − load ${fmt(r.workOut)} J ≈ ΔK ${fmt(deltaK)} J${r.dampingEnergyLoss>.0001?' + heat '+fmt(r.dampingEnergyLoss)+' J':''}${r.stopEnergyLoss>.0001?' + stop '+fmt(r.stopEnergyLoss)+' J':''}`;
}
function drawGraph(){
 const canvas=$('graph'),w=canvas.clientWidth||280,h=canvas.clientHeight||115,dpr=Math.min(devicePixelRatio||1,2);
 if(canvas.width!==w*dpr||canvas.height!==h*dpr){canvas.width=w*dpr;canvas.height=h*dpr;}
 const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);
 const live=readout(state,config,external()),last={t:live.time,i:live.displacementIn,o:live.displacementOut,fi:live.inputForce,fo:live.outputWeight,ai:live.inputPathAcceleration,ao:live.outputPathAcceleration,pi:live.pathDistanceIn,po:live.pathDistanceOut};
 const kind=$('plotKind').value,data=history.length?[...history,last]:[last];
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
 const R=ratio(config);if(task==='force'){const threshold=config.outputMass*10/R-config.inputMass*10;return threshold< -1e-9?0:Math.floor(Math.max(0,threshold)+1e-9)+1;}if(task==='balance'){const mass=config.outputMass/R-config.force/10;return Math.abs(mass)<1e-10?0:Math.abs(mass-MAX_MASS)<1e-10?MAX_MASS:mass;}if(task==='distance')return challenge.motionDistance*R;return initialOutputAcceleration(config);
}
function markCorrect(){
 if(credited||custom)return;credited=true;
 const expected=Math.min(skills()[task]||0,maxStage()-1);
 if(level===expected&&skills()[task]<maxStage())skills()[task]++;save();renderQuestion();
}
function nextProblem(){cancelAdvance();if(mode==='balance'){nextBalance();return;}chooseAdaptive();loadChallenge({newNumbers:true});}
function scheduleAdvance(correct){
 if(!$('autoAdvance').checked||custom)return;
 const seconds=correct?6:7;$('advanceNotice').textContent=correct?`Correct. Next adaptive problem in ${seconds} seconds; turn off adaptation to stay.`:`A new ${task==='balance'?'mass':task} problem at the same or easier stage follows in ${seconds} seconds.`;
 advanceTimer=setTimeout(()=>{advanceTimer=0;if(correct)nextProblem();else{skills()[task]=Math.max(0,(skills()[task]||0)-1);level=Math.min(skills()[task],maxStage()-1);loadChallenge({newNumbers:true});}},seconds*1000);
}
function demonstrateDistance(value){
 state=makeState(config,challenge.startFraction);history=[];
 const bound=limits(config),raw=type==='lever'?Math.asin(clamp(Math.sin(state.q)+value/config.rIn,-1,1)):state.q+value;
 movementTest={targetQ:clamp(raw,bound.min,bound.max),reported:false};distanceDemo=true;
 if(raw<bound.min||raw>bound.max)$('feedback').insertAdjacentHTML('beforeend','<span>The entered distance exceeds the available travel.</span>');
 start();
}
function applyTest(e){
 e?.preventDefault();if(mode==='balance'){applyBalanceTest();return;}cancelAdvance();stopAuto();pull=null;movementTest=null;
 const value=parse($('answerValue').value),target=currentAnswer();
 if(!Number.isFinite(value)){feedback('Enter one value, such as 25 or 25/2.',false);return;}
 if(custom&&task==='balance'&&target<0){feedback('No nonnegative input mass can balance this setup. Reduce the applied input force.',false);return;}
 if(custom&&task==='balance'&&target>MAX_MASS){feedback('This setup needs more than the 200 kg mass limit to balance. Reduce the output load or increase leverage.',false,target);return;}
 const cap=task==='force'?MAX_FORCE:task==='balance'?MAX_MASS:100;
 if(task!=='acceleration'&&(value<0||value>cap)){feedback(`Use a value from 0 to ${cap} ${challenge.unit}.`,false,target);return;}
 testedEntry=$('answerValue').value;stop();distanceDemo=false;
 const valueOK=matchesRoundedAnswer(value,target,task);
 if(task==='force'){config.force=value;if(!custom)config.inputMass=0;}
 else if(task==='balance'){config.inputMass=valueOK?target:value;if(!custom)config.force=0;}
 state=makeState(config,challenge.startFraction);history=[];syncControls();
 if(valueOK){
  if(!custom)markCorrect();
  feedback(task==='force'?'✓ Correct. This force starts lifting.':task==='balance'?'✓ Correct. The machine balances.':task==='distance'?'✓ Correct. Watch the output reach its target.':'✓ Correct initial acceleration.',true);
  if(custom)$('feedback').textContent+=' Edited setup; no progress credit.';
  forceCorrect=task==='force';$('nudgeBtn').hidden=true;if(!custom)scheduleAdvance(true);
 }else{
  attempts++;forceCorrect=false;$('nudgeBtn').hidden=true;
  const balanceForce=config.outputMass*10/ratio(config)-config.inputMass*10;
  const message=task==='force'?(value>balanceForce+1e-9?'Your force lifts, but is not the smallest whole-number force.':Math.abs(value-balanceForce)<1e-9?'Your force balances; it does not start lifting.':'Your force is too small; watch the load lower.'):
   task==='balance'?(value<target?'Your mass is too small; watch the load lower.':'Your mass is too large; watch the load rise.'):
   task==='distance'?'Watch the rise produced by your distance.':'The simulation shows the actual acceleration.';
  feedback(task==='force'&&target>MAX_FORCE?'This setup needs more than the 1000 N limit. Reduce the load or increase leverage.':message,false,target);
  if(attempts===2&&!custom){skills()[task]=Math.max(0,(skills()[task]||0)-1);save();}
  $('advanceNotice').textContent='Correction stays visible. Choose Next problem when ready.';
 }
 recordCurrentTest(valueOK);draw();if(task==='distance')demonstrateDistance(valueOK?target:value);else start();
}
function applyBalanceTest(){
 cancelAdvance();stopAuto();pull=null;movementTest=null;distanceDemo=false;
 const value=parse($('answerValue').value);
 if(!Number.isFinite(value)){feedback('Enter one value or drag the marked handle.',false);return;}
 if(value<challenge.min-1e-9||value>challenge.max+1e-9){feedback(`Use a value from ${fmt(challenge.min)} to ${fmt(challenge.max)} ${challenge.unit}.`,false);return;}
 if((challenge.key==='teethIn'||challenge.key==='teethOut')&&!Number.isInteger(value)){feedback('Use a whole number of gear teeth.',false);return;}
 stop();config=editSetup(config,challenge.key,value);config.force=0;
 state=makeState(config,challenge.startFraction??.5);history=[];testedEntry=$('answerValue').value;
 const r=readout(state,config),balanced=r.balanced;
 feedback(balanced?(type==='gearArms'?'✓ Balanced at horizontal. Run continues; you can pull an arm to explore.':'✓ Balanced. Neither side starts moving.'):`Not balanced. The output ${r.balanceError>0?'rises':'lowers'}. Adjust ${challenge.label.toLowerCase()} and try again.`,balanced);
 syncControls();$('answerValue').value=entryValue(setupValue(config,challenge.key));recordCurrentTest(balanced);draw();start();
}
function feedback(text,good,correctValue){
 $('feedback').className=good?'good':'bad';
 $('feedback').innerHTML=(Number.isFinite(correctValue)?`<strong class="correct-answer">Correct value: ${esc(displayValue(correctValue,task))} ${esc(challenge.unit)}</strong>`:'')+`<span>${esc(text)}</span>`;
}
function screenPoint(x,y){
 const rect=$('scene').getBoundingClientRect(),scale=Math.min(rect.width/900,rect.height/540)*camera.zoom;
 return {x:camera.cx+(x-(rect.left+rect.width/2))/scale,y:camera.cy+(y-(rect.top+rect.height/2))/scale};
}
function zoomBy(factor,anchor){
 const old=screenPoint(anchor?.x??($('scene').getBoundingClientRect().left+$('scene').clientWidth/2),anchor?.y??($('scene').getBoundingClientRect().top+$('scene').clientHeight/2));
 camera.zoom=clamp(camera.zoom*factor,.6,3.5);
 if(anchor){const after=screenPoint(anchor.x,anchor.y);camera.cx+=old.x-after.x;camera.cy+=old.y-after.y;}
 camera.cx=clamp(camera.cx,80,820);camera.cy=clamp(camera.cy,30,510);queueDraw();queueAutoSave();
}
function effectiveMass(side){
 const J=bodyJacobian(config),M=config.inputMass*J.input**2+config.outputMass*J.output**2;
 return M/J[side]**2;
}
function updatePull(){
 if(!pull)return;const info=bodyInfo[pull.side];if(!info||!Number.isFinite(info.scale)||info.scale<=0){pull.force={input:0,output:0};return;}
 const r=readout(state,config),speed=pull.side==='input'?r.inputPathSpeed:r.outputPathSpeed;
 let tangent=info.tangent,x=info.x,y=info.y;const J=bodyJacobian(config)[pull.side];if(isAngularMachine(config)){const rad=pull.side==='input'?config.rIn:config.rOut,sign=pull.side==='input'?1:-1,k=type==='gearArms'&&pull.side==='output'?config.teethIn/config.teethOut:1,a=state.q*k,old=info.q*k;const xs=type==='gearArms'?1:sign;x+=xs*rad*info.scale*(Math.cos(old)-Math.cos(a));y+=sign*rad*info.scale*(Math.sin(a)-Math.sin(old));tangent=[xs*Math.sin(a),sign*Math.cos(a)];}else{x+=tangent[0]*J*(state.q-info.q)*info.scale;y+=tangent[1]*J*(state.q-info.q)*info.scale;}const stretch=((pull.cursor.x-x)*tangent[0]+(pull.cursor.y-y)*tangent[1])/info.scale;
 const cursorSpeed=clamp((pull.velocity.x*tangent[0]+pull.velocity.y*tangent[1])/(info.scale*Number($('speed').value)),-5,5);
 const mass=effectiveMass(pull.side),k=Math.min(800,25*mass),damping=1.6*Math.sqrt(k*mass);
 const Qbase=generalizedDrive(config,state.q);const support=-Qbase/J;
 const F=clamp(support+k*stretch+damping*(cursorSpeed-speed),-MAX_FORCE,MAX_FORCE);
 pull.force={input:0,output:0,[pull.side]:F};pull.velocity.x*=.75;pull.velocity.y*=.75;
}
function beginPointer(e){
 if(e.button!==undefined&&e.button!==0)return;
 const scene=e.target.closest('#scene');if(!scene)return;e.preventDefault();pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pointers.size===2){pull=null;drag=null;const pts=[...pointers.values()];pinch={dist:Math.hypot(pts[0].x-pts[1].x,pts[0].y-pts[1].y),zoom:camera.zoom};return;}
 const handle=e.target.closest('[data-drag]'),p=screenPoint(e.clientX,e.clientY),resume=playing&&mode!=='balance';stopAuto();cancelAdvance();
 if(handle?.dataset.drag==='resize'&&!editable(handle.dataset.side==='input'?'inputMass':'outputMass'))return;
 if(handle?.dataset.drag==='geometry'&&!editable(handle.dataset.geo==='rampRun'?'rampRun':handle.dataset.param))return;
 if(handle?.dataset.drag==='resize'){
  stop();const d=handle.dataset;drag={kind:'resize',resume,side:d.side,size:Number(d.baseSize||d.size)||bodyInfo[d.side]?.size||0,axis:d.axis||'xy',sx:Number(d.signx??d.signX??1),sy:Number(d.signy??d.signY??1),angle:Number(d.angle)||0,p};
 }else if(handle?.dataset.drag==='geometry'){
  stop();const d=handle.dataset;if(d.geo==='rampRun'){drag={kind:'rampRun',resume,run:rampRun(),height:config.height,scale:Number(d.scale)||100,p};}else drag={kind:'geometry',resume,key:d.param,axis:d.axis||'x',units:Number(d.unitsPerPx)||.01,scale:1/Math.abs(Number(d.unitsPerPx)||.01),value:config[d.param],p};
 }else if(handle?.dataset.drag==='pull'&&$('pullTool').checked){
  const side=handle.dataset.side;if(!bodyInfo[side])return;const offset={x:p.x-bodyInfo[side].x,y:p.y-bodyInfo[side].y},target={x:p.x-offset.x,y:p.y-offset.y};pull={side,cursor:target,offset,velocity:{x:0,y:0},previous:target,time:performance.now(),force:{input:0,output:0}};distanceDemo=false;movementTest=null;start();
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
 if(drag.kind==='rampRun'){pendingResize={next:{...config,...editSetup(config,'rampRun',snapValue(drag.run+(p.x-drag.p.x)/drag.scale,.1,Math.sqrt(Math.max(0,.3**2-drag.height**2)),Math.sqrt(Math.max(0,5**2-drag.height**2))))},edited:'rampRun'};}
 else if(drag.kind==='geometry'){const delta=drag.axis==='y'?p.y-drag.p.y:p.x-drag.p.x;pendingResize={next:editSetup(config,drag.key,snapGeometry(drag.key,drag.value+delta*drag.units)),edited:drag.key};}
 else{
  const dx=p.x-drag.p.x,dy=p.y-drag.p.y,c=Math.cos(drag.angle),s=Math.sin(drag.angle),lx=dx*c+dy*s,ly=-dx*s+dy*c;
  const amount=drag.axis==='x'?lx*drag.sx:drag.axis==='y'?ly*drag.sy:(lx*drag.sx+ly*drag.sy)/2;
  const size=clamp(drag.size+2*amount,drag.side==='input'?0:10,10*Math.sqrt(MAX_MASS));const key=drag.side==='input'?'inputMass':'outputMass';
  pendingResize={next:{...config,[key]:snapValue(size*size/100,.5,drag.side==='input'?0:1,MAX_MASS)},edited:key};
 }
 if(!editFrame)editFrame=requestAnimationFrame(applyPendingEdit);
}
function applyPendingEdit(){cancelAnimationFrame(editFrame);editFrame=0;if(!pendingResize)return;const update=pendingResize;pendingResize=null;if(Object.entries(update.next).every(([key,value])=>value===config[key]))return;const isGuess=mode==='challenge'&&task==='balance'&&update.edited==='inputMass';setConfig(update.next,{edited:update.edited,mark:!isGuess});if(isGuess)$('answerValue').value=fmt(config.inputMass);}
function endPointer(e){
 pointers.delete(e.pointerId);if(pinch){if(pointers.size<2)pinch=null;queueAutoSave();return;}
 if(pendingResize)applyPendingEdit();if(pull){pull=null;queueDraw();}const resume=drag?.resume;drag=null;if(resume)start();
 try{$('scene').releasePointerCapture(e.pointerId);}catch{}queueAutoSave();
}
$('machines').innerHTML=machineCatalog.map(m=>`<button data-machine="${m.type}">${esc(m.label)}</button>`).join('');
$('machines').onclick=e=>{const b=e.target.closest('[data-machine]');if(!b)return;type=b.dataset.machine;if(machine().balanceOnly)mode='balance';task=mode==='balance'?'balance':topic==='mixed'?'force':topic;level=Math.min(skills()[task]||0,maxStage()-1);loadChallenge();};
 document.querySelector('.modes').onclick=e=>{const b=e.target.closest('[data-mode]');if(b&&!b.disabled){mode=b.dataset.mode;task=mode==='balance'?'balance':topic==='mixed'?'force':topic;level=Math.min(skills()[task]||0,maxStage()-1);loadChallenge();}};
$('taskChoices').onclick=e=>{const b=e.target.closest('[data-topic]');if(!b)return;topic=b.dataset.topic;if(topic==='mixed')chooseAdaptive('acceleration');else{task=topic;level=Math.min(skills()[task]||0,maxStage()-1);}loadChallenge();};
$('levels').onclick=e=>{const b=e.target.closest('[data-level]');if(b){level=+b.dataset.level;loadChallenge();}};
$('answerForm').onsubmit=applyTest;$('nextBtn').onclick=nextProblem;$('practiceBtn').onclick=()=>loadChallenge({newNumbers:true});$('autoAdvance').onchange=cancelAdvance;
$('stepsBtn').onclick=()=>{$('steps').hidden=!$('steps').hidden;$('stepsBtn').textContent=$('steps').hidden?'Show steps':'Hide steps';$('steps').innerHTML=(custom?['In the ideal setting, F₁d₁ = F₂d₂ at balance or steady speed.','MA = d₁/d₂ from the current machine geometry.','For acceleration, calculate the net force and divide by the mass.','Restore the original problem for its numerical setup.']:challenge.steps).map((s,i)=>`<p><b>${i+1}.</b> ${esc(s)}</p>`).join('');};
$('playBtn').onclick=()=>{cancelAdvance();if(playing)stop();else if(mode==='balance')applyBalanceTest();else if(mode==='challenge'&&$('answerValue').value.trim()&&testedEntry!==$('answerValue').value){applyTest();}else start();};
$('resetBtn').onclick=()=>{cancelAdvance();stopAuto();restart();};$('nudgeBtn').onclick=()=>{cancelAdvance();config.force=clamp(currentAnswer()*1.02,0,MAX_FORCE);config.inputMass=0;restart();syncControls();feedback('Testing 2% above the balance threshold. Extra work becomes kinetic energy and, with resistance enabled, heat.',true);start();};
$('restoreBtn').onclick=()=>loadChallenge();
for(const id of ['inputMass','outputMass','appliedForce']){const commit=e=>{const key=id==='appliedForce'?'force':id;if(!editable(key))return;const value=parse(e.target.value),isGuess=mode==='challenge'&&((task==='balance'&&key==='inputMass')||(task==='force'&&key==='force'));if(e.target.value!==e.target.dataset.renderedValue&&Number.isFinite(value)&&Math.abs(value-config[key])>1e-8)setConfig({...config,[key]:value},{edited:key,mark:!isGuess});e.target.value=answerRounding(config[key]).text;e.target.dataset.renderedValue=e.target.value;if(isGuess)$('answerValue').value=fmt(config[key]);};$(id).onchange=commit;$(id).onblur=commit;$(id).onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commit(e);}};}
function commitGeometry(e){const key=e.target.dataset.geometry;if(!key||!editable(key))return;const value=parse(e.target.value),prior=key==='rampRun'?rampRun():config[key];if(e.target.value!==e.target.dataset.renderedValue&&Number.isFinite(value)&&Math.abs(value-prior)>1e-8){const next=editSetup(config,key,value);setConfig(next,{edited:key});}e.target.value=fmt(key==='rampRun'?rampRun():config[key]);e.target.dataset.renderedValue=e.target.value;}
$('geometryControls').onchange=commitGeometry;$('geometryControls').addEventListener('blur',commitGeometry,true);$('geometryControls').onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();commitGeometry(e);}};
$('autoTarget').onchange=()=>setConfig({...config},{mark:false});
$('autoAnimate').onclick=()=>{
 if(autoAnimating){stopAuto();return;}stop();pull=null;$('autoTarget').value='mass';autoAnimating=true;autoStart=0;$('autoAnimate').textContent='Ⅱ Pause comparison';
 const animate=t=>{if(!autoAnimating||mode!=='auto')return;if(!autoStart)autoStart=t;const wave=(1-Math.cos((t-autoStart)/2400))/2,R=type==='screw'?10+30*wave:type==='ramp'?2+4*wave:1+3*wave;let c={...config,force:0};switch(type){case'lever':case'wheel':c.rIn=c.rOut*R;break;case'ramp':case'wedge':c.length=c.height*R;break;case'pulley':c.strands=[1,2,4,6][Math.min(3,Math.floor(wave*4))];break;case'gears':c.teethOut=Math.round(c.teethIn*R);break;case'screw':c.handleRadius=c.lead*R/(2*Math.PI);break;case'hydraulic':c.areaOut=c.areaIn*R;break;}config=normalizeConfig(c);balanceAuto();state=makeState(config,.3);history=[];if(t-lastDraw>1000/30){syncControls();draw();lastDraw=t;}autoFrame=requestAnimationFrame(animate);};autoFrame=requestAnimationFrame(animate);
};
for(const id of ['paths','forces','accelerations','compareKind','plotKind'])$(id).onchange=queueDraw;
$('charts').onchange=()=>{$('comparePanel').hidden=!$('charts').checked;queueDraw();};$('graphToggle').onchange=()=>{$('plotPanel').hidden=!$('graphToggle').checked;queueDraw();};
$('pullTool').onchange=()=>{pull=null;queueDraw();};$('zoomIn').onclick=()=>zoomBy(1.2);$('zoomOut').onclick=()=>zoomBy(1/1.2);$('zoomReset').onclick=resetCamera;
$('scene').addEventListener('wheel',e=>{e.preventDefault();zoomBy(Math.exp(-clamp(e.deltaY,-150,150)*.003),{x:e.clientX,y:e.clientY});},{passive:false});
$('scene').addEventListener('pointerdown',beginPointer);$('scene').addEventListener('pointermove',movePointer,{passive:false});$('scene').addEventListener('pointerup',endPointer);$('scene').addEventListener('pointercancel',endPointer);
window.addEventListener('blur',()=>{pull=null;drag=null;pointers.clear();stop();stopAuto();});document.addEventListener('visibilitychange',()=>{if(document.hidden){stop();stopAuto();cancelAdvance();pull=null;}});window.addEventListener('resize',queueDraw);
function theme(){document.body.classList.toggle('dark',saved.dark);$('themeBtn').textContent=saved.dark?'☀':'☾';queueDraw();}$('themeBtn').onclick=()=>{saved.dark=!saved.dark;save();theme();};
$('fullscreenBtn').onclick=async()=>{try{document.fullscreenElement?await document.exitFullscreen():await document.documentElement.requestFullscreen();}catch{}};$('helpBtn').onclick=()=>$('help').showModal();$('closeHelp').onclick=()=>$('help').close();

function renderComparisonStep(){
 if(!comparisonSnapshot)return;
 $('comparisonStage').innerHTML=renderComparison({...comparisonSnapshot,phase:comparisonPhase,dark:saved.dark,pathWidth:Number($('pathWidth').value),reducedMotion:true});
 $('comparisonStep').textContent=['1 / 3 · Compare distances','2 / 3 · Compare masses','3 / 3 · Compare areas'][comparisonPhase];
 $('comparisonPrev').disabled=comparisonPhase===0;$('comparisonNext').disabled=comparisonPhase===2;
}
function playComparison(){comparisonPhase=0;renderComparisonStep();}
$('comparePathsBtn').onclick=()=>{cancelAdvance();stopAuto();comparisonSnapshot={config:{...config},state:{...state},readout:readout(state,config,external())};stop();$('comparisonDialog').showModal();playComparison();};
$('comparisonPrev').onclick=()=>{comparisonPhase=Math.max(0,comparisonPhase-1);renderComparisonStep();};
$('comparisonNext').onclick=()=>{comparisonPhase=Math.min(2,comparisonPhase+1);renderComparisonStep();};
$('comparisonReplay').onclick=playComparison;$('closeComparison').onclick=()=>$('comparisonDialog').close();$('comparisonDialog').onclose=()=>{comparisonSnapshot=null;};
$('pathWidth').value=clamp(Number(saved.pathWidth)||3,1,10);$('pathWidthValue').textContent=$('pathWidth').value;
$('pathWidth').oninput=()=>{$('pathWidthValue').textContent=$('pathWidth').value;saved.pathWidth=Number($('pathWidth').value);save();queueDraw();};
function syncResistance(){
 const label=resistance===0?'Off · ideal':resistance<=.5?'Light':resistance<=1.5?'Medium':'Strong';
 $('resistance').value=resistance;$('resistanceValue').textContent=label;
 $('resistance').setAttribute('aria-valuetext',`${label}; damping rate ${fmt(resistance)} per second`);
}
$('resistance').oninput=()=>{const old={...config};resistance=clamp(Number($('resistance').value)||0,0,3);config={...config,damping:resistance};changeConfig(state,old,config);syncResistance();queueDraw();};

const checkViews=['paths','forces','accelerations','charts','graphToggle','pullTool','autoAdvance'];
const selectViews=['compareKind','plotKind','speed','autoTarget'];
function progressSnapshot(){
 const view=Object.fromEntries([...checkViews.map(id=>[id,$(id).checked]),...selectViews.map(id=>[id,$(id).value])]);
 return normalizeProgress({schema:'machine-lab-progress',version:1,savedAt:new Date().toISOString(),student,saved,
  session:{mode,type,task,topic,level,variant:mode==='balance'?balanceVariant():saved.serial,config,answer:$('answerValue').value,custom,attempts,credited,forceCorrect,resistance,camera,rampView,view},stats:progressStats});
}
function progressStatus(message,bad=false){$('progressStatus').textContent=message;$('progressStatus').classList.toggle('save-error',bad);$('saveStatus').textContent=message;}
function queueAutoSave(){
 if(!progressReady||!config)return;
 clearTimeout(saveTimer);progressStatus('Saving…');saveTimer=setTimeout(()=>saveProgressNow(),350);
}
function saveProgressNow(manual=false){
 clearTimeout(saveTimer);saveTimer=0;if(!progressReady||!config)return false;
 try{const snapshot=progressSnapshot();localStorage.setItem(PROGRESS_KEY,serializeProgress(snapshot));localStorage.setItem('machine-lab-adaptive-v3',JSON.stringify(snapshot.saved));progressStatus((manual?'Saved':'Autosaved')+' on this device · '+new Date(snapshot.savedAt).toLocaleTimeString([],{hour:'numeric',minute:'2-digit'}));return true;}
 catch{progressStatus('Unable to save on this device. Use Share or Download backup.',true);return false;}
}
function recordCurrentTest(correct){
 const entry=$('answerValue').value,source=JSON.stringify([mode,type,task,level,mode==='balance'?balanceVariant():saved.serial,config,entry]);
 let h=2166136261;for(const char of source)h=Math.imul(h^char.charCodeAt(0),16777619);
 progressStats=recordAttempt(progressStats,{type,mode,task,level,custom,variable:mode==='balance'?challenge.key:task,variant:mode==='balance'?balanceVariant():saved.serial,correct,entry,at:new Date().toISOString(),signature:(h>>>0).toString(36)});
 queueAutoSave();
}
function restoreProgress(snapshot,persist=true){
 const p=normalizeProgress(snapshot),a=p.session,wasReady=progressReady;progressReady=false;clearTimeout(saveTimer);saveTimer=0;
 cancelAdvance();stopAuto();stop();if($('comparisonDialog').open)$('comparisonDialog').close();
 saved=p.saved;student=p.student;progressStats=p.stats;mode=a.mode;type=a.type;task=a.task;topic=a.topic;level=a.level;resistance=a.resistance;
 if(machine().balanceOnly){mode='balance';task='balance';}
 if(mode==='balance')saved.balanceVariants={...saved.balanceVariants,[type]:a.variant};else saved.serial=a.variant;
 for(const id of checkViews)$(id).checked=a.view[id];for(const id of selectViews)$(id).value=a.view[id];
 loadChallenge();
 if(mode==='balance')config=editSetup(challenge.config,challenge.key,setupValue(a.config,challenge.key));
 else if(mode==='auto'||a.custom)config=normalizeConfig(a.config);
 else {config={...challenge.config};if(task==='force')config.force=a.config.force;if(task==='balance')config.inputMass=a.config.inputMass;}
 config.damping=resistance;if(mode==='balance')config.force=0;if(mode==='auto')balanceAuto();
 custom=mode==='challenge'&&a.custom;attempts=a.attempts;credited=a.credited;forceCorrect=a.forceCorrect;
 state=makeState(config,challenge.startFraction??.5);history=[];testedEntry='';camera={...a.camera};rampView=a.rampView;
 $('answerValue').value=a.answer;$('feedback').textContent='';$('pathWidth').value=saved.pathWidth;$('pathWidthValue').textContent=saved.pathWidth;
 $('comparePanel').hidden=!$('charts').checked;$('plotPanel').hidden=!$('graphToggle').checked;$('accelerationWindow').hidden=!$('accelerations').checked;
 buildControls();syncControls();syncResistance();renderQuestion();renderTabs();theme();draw();
 progressReady=wasReady;if(persist){progressReady=true;saveProgressNow(true);}return p;
}
function renderProgressReport(snapshot){
 const p=normalizeProgress(snapshot),recent=p.stats.recent||[];
 $('studentName').value=p.student;
 const successful=p.stats.correct||0,total=p.stats.attempts||0;
 $('progressSummary').innerHTML=`<div><strong>${total}</strong><span>Tests</span></div><div><strong>${successful}</strong><span>Successful tests</span></div><div><strong>${total?Math.round(100*successful/total):0}%</strong><span>Success rate</span></div>`;
 const machineName=key=>machineCatalog.find(m=>m.type===key)?.label||key;
 const variableName=key=>({inputMass:'Input mass',outputMass:'Output mass',rampRun:'Ramp base',rIn:'Input arm/radius',rOut:'Output arm/radius',teethIn:'Input teeth',teethOut:'Output teeth',areaIn:'Input area',areaOut:'Output area',height:'Height',length:'Length',lead:'Rise per turn',balance:'Input mass',force:'Force',distance:'Distance',acceleration:'Acceleration'}[key]||key);
 $('progressHistory').innerHTML=recent.length?`<table><caption>Recent tests · newest first</caption><thead><tr><th>Machine</th><th>Your entry</th><th>Result</th></tr></thead><tbody>${[...recent].reverse().map(row=>`<tr><td>${esc(machineName(row.type))}<small>${esc(row.mode==='balance'?'Balance':row.custom?'Edited practice':'Practice')} · ${esc(variableName(row.variable||row.task))}</small></td><td>${esc(row.entry)}</td><td class="${row.correct?'test-success':'test-retry'}">${row.correct?'Successful':'Try again'}</td></tr>`).join('')}</tbody></table>`:'<p>No tests recorded yet. Run a test to start your progress.</p>';
 const current=machineName(p.session.type),date=new Date(p.savedAt).toLocaleString();
 $('progressMessage').textContent=`${current} · ${p.session.mode==='balance'?'Balance':p.session.mode==='auto'?'Auto balance':'Practice'} · saved ${date}. Progress links are snapshots, not live updates.`;
}
function openProgress(snapshot=progressSnapshot(),preview=false){
 stop();stopAuto();cancelAdvance();sharedPreview=preview?normalizeProgress(snapshot):null;
 $('progressTitle').textContent=preview?'Shared progress':'Save & share progress';$('sharedNotice').hidden=!preview;
 $('resumeShared').hidden=!preview;$('keepMyProgress').hidden=!preview;$('studentName').disabled=preview;
 for(const id of ['copyProgressLink','downloadProgress','loadProgress'])$(id).hidden=preview;
 $('shareLinkBox').hidden=true;renderProgressReport(snapshot);if(!$('progressDialog').open)$('progressDialog').showModal();
}
function clearSharedLink(){if(new URLSearchParams(location.hash.slice(1)).has('progress'))historyReplaceWithoutShare();}
function historyReplaceWithoutShare(){const url=new URL(location.href);url.hash='';window.history.replaceState(null,'',url.toString());}
$('saveProgressBtn').onclick=()=>saveProgressNow(true);
$('shareProgressBtn').onclick=()=>{saveProgressNow();openProgress();};
$('closeProgress').onclick=()=>$('progressDialog').close();
$('progressDialog').addEventListener('close',()=>{sharedPreview=null;clearSharedLink();});
$('studentName').oninput=()=>{if(sharedPreview)return;student=$('studentName').value.slice(0,80);queueAutoSave();};
$('copyProgressLink').onclick=async()=>{
 try{saveProgressNow();const token=encodeProgress(progressSnapshot()),url=new URL(location.href);url.searchParams.set('v',RELEASE);url.hash='progress='+token;const link=url.toString();$('progressLink').value=link;
  try{await navigator.clipboard.writeText(link);$('progressMessage').textContent='Progress link copied. Paste it into Classroom, a message, or a document.';}
  catch{$('shareLinkBox').hidden=false;$('progressLink').focus();$('progressLink').select();$('progressMessage').textContent='Copy the selected progress link below.';}
 }catch{$('progressMessage').textContent='Could not create this link. Use Download backup instead.';}
};
$('downloadProgress').onclick=()=>{try{saveProgressNow();const blob=new Blob([serializeProgress(progressSnapshot())],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='machine-lab-progress.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);$('progressMessage').textContent='Backup download requested. You can reopen it with Open saved file.';}catch{$('progressMessage').textContent='Could not create the backup. Try copying a progress link.';}};
$('loadProgress').onclick=()=>$('progressFile').click();
$('progressFile').onchange=async e=>{const file=e.target.files?.[0];e.target.value='';if(!file)return;try{if(file.size>128000)throw Error('size');const p=parseProgress(await file.text());openProgress(p,true);}catch{$('progressMessage').textContent='That file is not a valid Machine Lab progress backup.';}};
$('resumeShared').onclick=()=>{if(!sharedPreview)return;const p=sharedPreview;restoreProgress(p,false);$('progressDialog').close();if(saveProgressNow(true))progressStatus('Shared progress saved on this device. Run starts from rest.');};
$('keepMyProgress').onclick=()=>$('progressDialog').close();
document.addEventListener('input',e=>{if(e.target.closest('.app')&&e.target.id!=='progressFile')queueAutoSave();});
document.addEventListener('change',e=>{if(e.target.closest('.app'))queueAutoSave();});
window.addEventListener('pagehide',()=>saveProgressNow());
document.addEventListener('visibilitychange',()=>{if(document.hidden)saveProgressNow();});
let storedProgress=null;try{const raw=localStorage.getItem(PROGRESS_KEY);if(raw)storedProgress=parseProgress(raw);}catch{}
if(storedProgress)restoreProgress(storedProgress,false);else{const hash=location.hash.match(/machine=(\w+)/);if(hash&&machineCatalog.some(m=>m.type===hash[1]))type=hash[1];level=Math.min(skills()[task]||0,maxStage()-1);loadChallenge();theme();}
initPanels();progressReady=true;
if(storedProgress)progressStatus('Progress restored on this device. Run starts from rest.');else queueAutoSave();
function openSharedLink(){
 const sharedToken=new URLSearchParams(location.hash.slice(1)).get('progress');
 if(sharedToken){try{openProgress(decodeProgress(sharedToken),true);}catch{openProgress();$('progressMessage').textContent='This progress link is invalid or incomplete. Your saved work is unchanged.';}}
}
window.addEventListener('hashchange',openSharedLink);openSharedLink();

