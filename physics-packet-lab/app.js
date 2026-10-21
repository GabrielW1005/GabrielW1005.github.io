import packet from './data.js';
import {evaluate,modelInfo,solve} from './physics.js';
import {drawScene,drawGraph} from './rendering.js';
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>typeof n==='number'?(Math.abs(n)<1e-9?'0':Number(n.toFixed(3)).toLocaleString('en-US',{maximumFractionDigits:3})):String(n);
const problems=packet.sections.flatMap(s=>s.problems.map(p=>({...p,section:s})));
const clone=o=>JSON.parse(JSON.stringify(o));
const storage={get(k,def){try{return JSON.parse(localStorage.getItem(k))??def}catch{return def}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch{}}};
let solved=new Set(storage.get('motion-lab-progress-v1',[])), theme=storage.get('motion-lab-theme','light');
let index=Math.max(0,problems.findIndex(p=>p.id===location.hash.slice(1))),mode='demo',params={},time=0,playing=false,lastFrame=0,info={},target='',lastAnswerCorrect=false;
let p=problems[index];
document.body.classList.toggle('dark',theme==='dark');
$('sectionSelect').innerHTML=packet.sections.map(s=>`<option value="${s.number}">${s.number}. ${esc(s.title)}</option>`).join('');
function saveProgress(){storage.set('motion-lab-progress-v1',[...solved]);renderNav()}
function renderNav(){
 $('sectionSelect').value=p.section.number;
 $('problemList').innerHTML=p.section.problems.map(q=>`<button class="problem-button${q.id===p.id?' active':''}${solved.has(q.id)?' solved':''}" data-id="${q.id}" aria-label="${q.id}: ${esc(q.title)}${solved.has(q.id)?', completed':''}" ${q.id===p.id?'aria-current="true"':''}><span class="problem-number">${solved.has(q.id)?'✓':Number(q.id.slice(1))}</span><span>${esc(q.title)}</span></button>`).join('');
 $('progressText').textContent=`${solved.size} of ${problems.length} solved`;$('progressBar').style.width=`${solved.size/problems.length*100}%`;
 $('prevBtn').disabled=index===0;$('nextBtn').disabled=index===problems.length-1;
}
function defaultTarget(){return p.numericAnswer?.quantity||modelInfo(p,params).quantities?.[0]?.key||''}
function selectProblem(i){
 index=Math.max(0,Math.min(problems.length-1,i));p=problems[index];params=clone(p.simulation.params);time=0;playing=false;lastAnswerCorrect=false;target=defaultTarget();if(mode==='explore')prepareSolverParams();
 $('graphSelect').value=['P14','P16'].includes(p.id)?'speed':['P13','P15'].includes(p.id)?'distance':'x';if(p.section.number===4)$('graphToggle').checked=true;
 history.replaceState(null,'',`#${p.id}`);$('stepsDetails').open=false;
 $('eyebrow').textContent=`PAGE ${p.section.number} · ${p.type==='quantitative'?'CALCULATE':'EXPLAIN'} · ${p.id}`;
 $('problemTitle').textContent=p.title;$('problemPrompt').innerHTML=String(p.prompt).split('\n').filter(Boolean).map(t=>`<p>${esc(t)}</p>`).join('');
 renderTable();$('footerTopic').textContent=p.section.title;refreshInfo();renderNav();renderMode();draw();
}
function renderTable(){
 const tab=p.table;if(!tab){$('problemTable').innerHTML='';return}
 const heads=tab.headers||tab.columns||[],rows=tab.rows||[];
 $('problemTable').innerHTML=`<table class="data-table"><thead><tr>${heads.map(h=>`<th>${esc(h)}</th>`).join('')}</tr></thead><tbody>${rows.map(r=>`<tr>${(Array.isArray(r)?r:Object.values(r)).map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
}
function refreshInfo(){
 info=modelInfo(p,params);info.duration=Math.max(.1,Number(info.duration)||10);time=Math.min(time,info.duration);
 const txt=p.simulation.notes;const notes=Array.isArray(txt)?txt.join(' '):txt;
 $('modelNotes').textContent=notes||info.notes||'Idealized model. Values use SI units; motion is shown on a scaled view.';
 const opts=[.25,.5,1,2,4,10,30,60];const old=Number($('rateSelect').value)||1;
 $('rateSelect').innerHTML=opts.filter(v=>v<=4||info.duration>30).map(v=>`<option value="${v}">${v===.25?'¼':v===.5?'½':v}×</option>`).join('');
 $('rateSelect').value=opts.includes(old)&&($('rateSelect').querySelector(`option[value="${old}"]`))?old:1;
}
function setMode(next){mode=next;params=clone(p.simulation.params);target=defaultTarget();if(mode==='explore')prepareSolverParams();time=0;playing=false;lastAnswerCorrect=false;$('stepsDetails').open=false;refreshInfo();renderMode();draw()}
function renderMode(){
 document.querySelectorAll('[data-mode]').forEach(b=>{const active=b.dataset.mode===mode;b.classList.toggle('active',active);b.setAttribute('aria-selected',active)});
 $('stageLabel').textContent=mode==='explore'?'YOUR EXPERIMENT':'PACKET MODEL';
 $('parameters').innerHTML='';$('solver').innerHTML='';$('challenge').innerHTML='';
 if(mode==='demo'){
  $('modeIntro').innerHTML='<h3>Watch it happen</h3><p>Predict the motion, then press <strong>Run</strong>. Pause or move the time slider to inspect any instant.</p>';
  renderKnown();
  if(p.numericAnswer){const r=safeSolve();$('solver').innerHTML=solutionMarkup(r)}
 }else if(mode==='explore'){
  $('modeIntro').innerHTML='<h3>Change the experiment</h3><p>The question above keeps the packet values. These controls create your own version.</p>';
  renderParameters();renderSolver();
 }else{
  $('modeIntro').innerHTML='<h3>Your turn</h3><p>Use the simulation as evidence. Solve the packet question, then check your answer.</p>';
  renderChallenge();
 }
 renderSteps();
}
function renderKnown(){
 const adjustable=p.simulation.adjustable||[];
 const rows=adjustable.filter(a=>Number.isFinite(params[a.key])).map(a=>`<div><span>${esc(a.label)}</span><strong>${fmt(params[a.key])} ${esc(a.unit||'')}</strong></div>`);
 $('parameters').innerHTML=rows.length?`<div class="known-list">${rows.join('')}</div>`:'';
}
function safeSolve(q=target){try{return solve(p,params,q)}catch{return {value:NaN,unit:'',formula:'',steps:[]}}}
function validCalculation(r){return !!r&&Number.isFinite(r.value)&&(!['mass','time'].includes(target)||r.value>0)}
function solutionMarkup(r){if(!validCalculation(r))return '<p class="notice">Choose valid measurements to calculate this quantity.</p>';return `<div class="result-box">${esc(quantityLabel(target))}<strong>${fmt(r.value)} <small>${esc(r.unit||'')}</small></strong></div>${r.formula?`<div class="formula-box">${esc(r.formula)}</div>`:''}`}
function quantityLabel(q){return info.quantities?.find(v=>v.key===q)?.label||q.replace(/([A-Z])/g,' $1').replace(/^./,x=>x.toUpperCase())}
function renderParameters(){
 let fields=(p.simulation.adjustable||[]).map(a=>({...a}));
 if(p.simulation.kind==='piecewise'){params.distanceScale??=1;params.timeScale??=1;fields=[{key:'distanceScale',label:'All path distances ×',unit:'',min:.25,max:3,step:.25},{key:'timeScale',label:'All time intervals ×',unit:'',min:.25,max:3,step:.25}];}
 // Inverse calculations have exactly the known quantities editable.
 if(p.simulation.kind==='uniform'&&p.numericAnswer){
  const specs={distance:{label:'Distance',unit:'m',min:0,max:1000,step:1},speed:{label:'Speed',unit:'m/s',min:0.1,max:40,step:.1},time:{label:'Elapsed time',unit:'s',min:.1,max:300,step:.1}};
  fields=['distance','speed','time'].filter(k=>k!==target).map(key=>({key,...specs[key],...(p.simulation.adjustable||[]).find(a=>a.key===key)}));
 }else if(p.numericAnswer&&p.simulation.kind==='acceleration'&&['acceleration','finalVelocity','initialVelocity','time'].includes(target)){
  const targetKey={acceleration:'acceleration',finalVelocity:'vf',initialVelocity:'vi',time:'time'}[target];
  const specs={vi:{label:'Initial velocity',unit:'m/s',min:-30,max:30,step:.1},vf:{label:'Final velocity',unit:'m/s',min:-30,max:30,step:.1},acceleration:{label:'Acceleration',unit:'m/s²',min:-10,max:10,step:.1},time:{label:'Elapsed time',unit:'s',min:.1,max:30,step:.1}};
  fields=['vi','vf','acceleration','time'].filter(k=>k!==targetKey).map(key=>({key,...specs[key],...(p.simulation.adjustable||[]).find(a=>a.key===key)}));
  if(p.id==='P10')for(const f of fields){if(f.key==='vf'){f.min=0;f.max=10}if(f.key==='time'){f.min=1;f.max=5}}
 }
 if(p.simulation.kind==='newton2'&&p.numericAnswer){
  const specs={mass:{label:'Mass',unit:'kg',min:.1,max:200,step:.1},force:{label:'Net force (signed)',unit:'N',min:-500,max:500,step:.1},acceleration:{label:'Acceleration (signed)',unit:'m/s²',min:-10,max:10,step:.1}};
  const targetKey=target==='netForce'?'force':target;
  fields=['mass','force','acceleration'].filter(k=>k!==targetKey).map(key=>({key,...specs[key]}));
 }
 $('parameters').innerHTML=fields.filter(a=>Number.isFinite(params[a.key])).map(a=>{
  const v=params[a.key],lo=Math.min(a.min??0,v),hi=Math.max(a.max??Math.max(10,v*2),v);return `<div class="parameter"><label for="num-${a.key}"><span>${esc(a.label)}</span><span><input class="number-field" id="num-${a.key}" data-param="${a.key}" type="number" min="${lo}" max="${hi}" step="${a.step||.1}" value="${v}" aria-label="${esc(a.label)}"><span class="param-unit"> ${esc(a.unit||'')}</span></span></label><input type="range" data-range="${a.key}" min="${lo}" max="${hi}" step="${a.step||.1}" value="${v}" aria-label="Adjust ${esc(a.label)}"></div>`
 }).join('')+'<button id="packetResetBtn" class="packet-reset">↺ Restore packet values</button>';
 $('packetResetBtn').onclick=()=>{params=clone(p.simulation.params);target=defaultTarget();prepareSolverParams();time=0;playing=false;refreshInfo();renderMode();draw()};
}
function prepareSolverParams(){
 if(p.simulation.kind==='uniform'&&p.numericAnswer){
  const d=params.distance??safeSolve('distance').value,v=params.speed??safeSolve('speed').value,t=params.time??safeSolve('time').value;
  params={...params,distance:d,speed:v,time:t};delete params[target];
 }
 if(p.simulation.kind==='acceleration'&&p.numericAnswer){
  const vi=params.vi??safeSolve('initialVelocity').value,vf=params.vf??safeSolve('finalVelocity').value,a=params.acceleration??safeSolve('acceleration').value,t=params.time??safeSolve('time').value;
  params={...params,vi,vf,acceleration:a,time:t};delete params[{acceleration:'acceleration',finalVelocity:'vf',initialVelocity:'vi',time:'time'}[target]];delete params.startTime;delete params.endTime;
 }
 if(p.simulation.kind==='newton2'&&p.numericAnswer){
  const mass=params.mass??safeSolve('mass').value,force=params.force??safeSolve('netForce').value,acceleration=params.acceleration??safeSolve('acceleration').value;
  params={...params,mass,force,acceleration};delete params.forwardForce;delete params.backwardForce;delete params.netForce;delete params[target==='netForce'?'force':target];
 }
}
function renderSolver(){
 if(!p.numericAnswer){$('solver').innerHTML='<p class="notice">Explore how the motion or force arrows change, then explain why.</p>';return}
 const qs=info.quantities||[];
 $('solver').innerHTML=`<label for="solveTarget" class="solver-label">SOLVE FOR</label><select id="solveTarget" class="solver-select">${qs.map(q=>`<option value="${q.key}" ${q.key===target?'selected':''}>${esc(q.label)} (${esc(q.unit)})</option>`).join('')}</select><div id="solverResult">${solutionMarkup(safeSolve())}</div>`;
 $('solveTarget').onchange=e=>{target=e.target.value;prepareSolverParams();time=0;playing=false;refreshInfo();renderParameters();renderSolver();renderSteps();draw()};
}
function calculationSteps(){
 const n=q=>safeSolve(q).value,f=fmt,k=p.simulation.kind;
 if(k==='uniform'){const d=n('distance'),v=n('speed'),t=n('time');return target==='speed'?[`Distance = ${f(d)} m; elapsed time = ${f(t)} s.`,`${f(d)} ÷ ${f(t)} = ${f(v)} m/s.`]:target==='distance'?[`Speed = ${f(v)} m/s; elapsed time = ${f(t)} s.`,`${f(v)} × ${f(t)} = ${f(d)} m.`]:[`Distance = ${f(d)} m; speed = ${f(v)} m/s.`,`${f(d)} ÷ ${f(v)} = ${f(t)} s.`]}
 if(k==='acceleration'){const vi=n('initialVelocity'),vf=n('finalVelocity'),a=n('acceleration'),t=n('time');return [`Initial velocity = ${f(vi)} m/s; final velocity = ${f(vf)} m/s.`,`Change in velocity = ${f(vf)} − (${f(vi)}) = ${f(vf-vi)} m/s.`,`Elapsed time = ${f(t)} s; acceleration = ${f(a)} m/s². Use the selected formula to isolate the unknown.`]}
 if(k==='route')return [`First leg: |${f(params.turn)} − (${f(params.start)})| = ${f(Math.abs(params.turn-params.start))} m.`,`Second leg: |${f(params.end)} − (${f(params.turn)})| = ${f(Math.abs(params.end-params.turn))} m.`,`Distance adds path lengths. Displacement uses final position minus starting position: ${f(params.end-params.start)} m.`];
 if(k==='gravity')return [`Mass = ${f(params.mass)} kg; gravitational field strength = ${f(params.g)} m/s².`,`${f(params.mass)} × ${f(params.g)} = ${f(n('weight'))} N.`];
 if(['newton2','netforce','friction'].includes(k)){const net=n('netForce'),a=n('acceleration'),mass=params.mass??n('mass');return params.steady?[`Steady straight-line velocity means acceleration is zero.`,`Friction balances the applied ${f(params.forwardForce)} N force in the opposite direction.`]:[`Use the signed net force: ${f(net)} N.`,`Mass = ${f(mass)} kg. From F = ma, acceleration = ${f(net)} ÷ ${f(mass)} = ${f(a)} m/s².`,`A negative result points left; the mass stays positive.`]}
 if(k==='momentum'){const m1=params.mass1,v1=params.velocity1;if(params.single)return [`Mass = ${f(m1)} kg; velocity = ${f(v1)} m/s.`,`${f(m1)} × ${f(v1)} = ${f(n('momentum1'))} kg·m/s.`];const m2=params.mass2,v2=params.velocity2??0;return [`Initial total momentum = (${f(m1)} × ${f(v1)}) + (${f(m2)} × ${f(v2)}) = ${f(n('totalMomentum'))} kg·m/s.`,`Combined mass = ${f(m1+m2)} kg.`,`Divide total momentum by combined mass: ${f(n('finalVelocity'))} m/s.`]}
 if(k==='piecewise'){const d=n('distance'),t=params.times.at(-1)-params.times[0];return [`Add all path lengths: ${f(d)} m.`,`Use the entire elapsed time, including stops: ${f(t)} s.`,`Average speed = ${f(d)} ÷ ${f(t)} = ${f(n('averageSpeed'))} m/s.`]}
 return [];
}
function renderSteps(){
 const modified=mode==='explore';const r=modified&&p.numericAnswer?safeSolve():null;
 const lines=modified?(r?.steps?.length?r.steps:p.numericAnswer?calculationSteps():[]):p.steps||[];
 $('stepsContent').innerHTML=modified?`<p><strong>For your current values</strong></p>${r?.formula?`<p>${esc(r.formula)}</p>`:''}${Number.isFinite(r?.value)?`<p>${esc(quantityLabel(target))} = <strong>${fmt(r.value)} ${esc(r.unit)}</strong></p>`:''}${lines.length?`<ol>${lines.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}${!p.numericAnswer?`<p><strong>Packet explanation (original values)</strong></p><p>${esc(p.answer)}</p>`:''}`:`<p><strong>${esc(p.answer)}</strong></p>${lines.length?`<ol>${lines.map(s=>`<li>${esc(s)}</li>`).join('')}</ol>`:''}`;
}
function renderChallenge(){
 if(p.numericAnswer){$('challenge').innerHTML=`<label class="solver-label" for="answerInput">${esc(quantityLabel(p.numericAnswer.quantity)).toUpperCase()}</label><div class="answer-row"><input id="answerInput" type="number" inputmode="decimal" step="any" placeholder="Enter a number"><span>${esc(p.numericAnswer.unit)}</span></div><button id="checkBtn" class="primary check-button">Check answer</button><p id="feedback" class="feedback hide" role="status"></p>`;}
 else if(p.choices?.length){$('challenge').innerHTML=`<div>${p.choices.map((c,i)=>({c,i})).sort((a,b)=>((a.i+Number(p.id.slice(1)))%p.choices.length)-((b.i+Number(p.id.slice(1)))%p.choices.length)).map(({c,i})=>`<label class="choice"><input name="answerChoice" type="radio" value="${i}"><span>${esc(c.text)}</span></label>`).join('')}</div><button id="checkBtn" class="primary check-button">Check reasoning</button><p id="feedback" class="feedback hide" role="status"></p>`}
 else{$('challenge').innerHTML='<p class="notice">Explain your answer aloud or on paper. Then compare it with the explanation.</p><button id="checkBtn" class="primary check-button">I explained my reasoning</button><p id="feedback" class="feedback hide" role="status"></p>'}
 $('checkBtn').onclick=checkAnswer;
 $('answerInput')?.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
}
function checkAnswer(){
 let correct=false,msg='';
 if(p.numericAnswer){const raw=$('answerInput').value,value=Number(raw),goal=p.numericAnswer.value;if(!raw||!Number.isFinite(value)){msg='Enter a numerical answer first.'}else{correct=Math.abs(value-goal)<=Math.max(.015,Math.abs(goal)*.005);msg=correct?'Correct. Now explain what the sign and units mean.':'Not yet. Check the formula, subtraction order, and units. You can open the steps for help.'}}
 else if(p.choices?.length){const selection=document.querySelector('input[name="answerChoice"]:checked');if(!selection)msg='Choose an explanation first.';else{correct=!!p.choices[Number(selection.value)].correct;msg=correct?'Correct. Can you point to evidence in the simulation?':'Try again. Watch the motion and identify which object each force acts on.'}}
 else{correct=true;msg='Reasoning recorded. Compare your response with the explanation below.';$('stepsDetails').open=true}
 const fb=$('feedback');fb.textContent=msg;fb.className=`feedback ${correct?'good':'try'}`;lastAnswerCorrect=correct;if(correct){solved.add(p.id);saveProgress()}draw();
}
function parameterChange(key,val){
 if(!Number.isFinite(val))return;params[key]=val;
 if(p.id==='P02'&&key==='end')params.turn=val;
 if(params.steady&&key==='forwardForce')params.backwardForce=val;
 if(p.simulation.kind==='piecewise'&&(key==='distanceScale'||key==='timeScale')){params.positions=p.simulation.params.positions.map(v=>v*(params.distanceScale??1));params.times=p.simulation.params.times.map(v=>v*(params.timeScale??1));}
 if(key==='startTime'||key==='endTime')params.time=Math.max(.1,params.endTime-params.startTime);
 time=0;playing=false;refreshInfo();
 const num=document.querySelector(`[data-param="${key}"]`),slider=document.querySelector(`[data-range="${key}"]`);if(num)num.value=val;if(slider)slider.value=val;
 if($('solverResult'))$('solverResult').innerHTML=solutionMarkup(safeSolve());renderSteps();draw();
}
$('parameters').addEventListener('input',e=>{
 const key=e.target.dataset.range||e.target.dataset.param;if(!key)return;
 const raw=e.target.value;if(raw.trim()==='')return;
 const val=Number(raw),lo=Number(e.target.min),hi=Number(e.target.max);
 // Keep incomplete/temporarily out-of-range typing intact until blur.
 if(Number.isFinite(val)&&val>=lo&&val<=hi)parameterChange(key,val);
});
$('parameters').addEventListener('change',e=>{const key=e.target.dataset.param;if(!key)return;const val=Number(e.target.value),lo=Number(e.target.min),hi=Number(e.target.max);parameterChange(key,Number.isFinite(val)?Math.max(lo,Math.min(hi,val)):lo)});
function draw(){
 if(mode==='explore'&&p.numericAnswer&&!validCalculation(safeSolve())){
  playing=false;const c=$('stage'),ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);ctx.fillStyle=document.body.classList.contains('dark')?'#e6edf6':'#152b43';ctx.font=`${Math.max(16,c.width/40)}px system-ui`;ctx.textAlign='center';ctx.fillText('Choose physically consistent measurements.',c.width/2,c.height/2);$('readouts').innerHTML='<div class="readout"><small>Check measurements</small><strong>No valid solution</strong></div>';$('playBtn').textContent='▶ Run';$('graphWrap').classList.add('hide');return;
 }
 const opts={arrows:$('vectorsToggle').checked,hideAnswers:mode==='challenge'&&!lastAnswerCorrect,theme:document.body.classList.contains('dark')?'dark':'light'};
 try{drawScene($('stage'),p,params,time,opts);if($('graphToggle').checked)drawGraph($('graph'),p,params,time,{...opts,quantity:$('graphSelect').value});
 const state=evaluate(p,params,time);const values=state.readouts||[];
 $('readouts').innerHTML=values.map(r=>`<div class="readout"><small>${esc(r.label)}</small><strong>${opts.hideAnswers?'—':fmt(r.value)} <span>${esc(r.unit||'')}</span></strong></div>`).join('');
 }catch(error){console.error('Model error',p.id,error);$('readouts').innerHTML='<div class="readout"><small>Check measurements</small><strong>Invalid model input</strong></div>'}
 $('timeLabel').textContent=`${fmt(time)} s`;$('timeSlider').value=Math.round(time/info.duration*1000);$('playBtn').textContent=playing?'Ⅱ Pause':'▶ Run';
 $('graphWrap').classList.toggle('hide',!$('graphToggle').checked);
 $('graphTitle').textContent=({x:'POSITION vs TIME',v:'VELOCITY vs TIME',speed:'SPEED vs TIME',distance:'DISTANCE vs TIME',a:'ACCELERATION vs TIME'})[$('graphSelect').value];
}
function frame(ts){if(playing){const dt=lastFrame?Math.min((ts-lastFrame)/1000,.1):0;time+=dt*Number($('rateSelect').value);if(time>=info.duration){time=info.duration;playing=false}draw()}lastFrame=ts;requestAnimationFrame(frame)}
$('playBtn').onclick=()=>{if(time>=info.duration)time=0;playing=!playing;draw()};$('restartBtn').onclick=()=>{time=0;playing=false;draw()};
$('timeSlider').oninput=e=>{playing=false;time=Number(e.target.value)/1000*info.duration;draw()};
$('vectorsToggle').onchange=draw;$('graphToggle').onchange=()=>{draw();requestAnimationFrame(draw)};$('graphSelect').onchange=draw;
$('sectionSelect').onchange=e=>selectProblem(problems.findIndex(q=>q.section.number===Number(e.target.value)));
$('problemList').onclick=e=>{const b=e.target.closest('[data-id]');if(b)selectProblem(problems.findIndex(q=>q.id===b.dataset.id))};
$('prevBtn').onclick=()=>selectProblem(index-1);$('nextBtn').onclick=()=>selectProblem(index+1);
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>setMode(b.dataset.mode);
$('themeBtn').onclick=()=>{document.body.classList.toggle('dark');theme=document.body.classList.contains('dark')?'dark':'light';storage.set('motion-lab-theme',theme);draw()};
$('fullBtn').onclick=async()=>{try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen()}catch{showModal('<h2>Full screen</h2><p>Your browser controls full screen. Use its full-screen option to expand the lab.</p>')}};
$('resetProgress').onclick=()=>showModal('<h2>Reset your progress?</h2><p>This clears completed checkmarks on this device.</p><button id="confirmReset" class="primary">Reset progress</button>');
function showModal(html){$('modalContent').innerHTML=html;$('modal').showModal();$('confirmReset')?.addEventListener('click',()=>{solved.clear();saveProgress();$('modal').close()})}
$('closeModal').onclick=()=>$('modal').close();$('modal').onclick=e=>{if(e.target===$('modal'))$('modal').close()};
$('warmupBtn').onclick=()=>{
 const warm=p.section.warmups||[];
 showModal(`<div class="eyebrow">PAGE ${p.section.number} · MATH FIRST</div><h2>Warm up your math</h2><p>Practice the calculation without the physics words.</p>${warm.map((w,i)=>`<div class="warmup-row"><label for="warm${i}">${esc(w.prompt)}</label><input id="warm${i}" placeholder="Your answer" aria-label="Answer to warm-up ${i+1}"><small class="warm-answer hide">Answer: ${esc(w.answer)}</small></div>`).join('')}<button id="revealWarm" class="primary">Show answers</button>`);
 $('revealWarm').onclick=()=>document.querySelectorAll('.warm-answer').forEach(e=>e.classList.remove('hide'));
};
$('helpBtn').onclick=()=>showModal(`<div class="eyebrow">WELCOME TO MOTION LAB</div><h2>Make the physics visible.</h2><ol class="help-list"><li>Pick the page and problem that match your packet.</li><li><strong>Demonstrate:</strong> watch the given situation. Pause and scrub time. Arrows show direction.</li><li><strong>Explore & solve:</strong> change measurements, choose a quantity to find, and watch the model update.</li><li><strong>Challenge:</strong> solve the original packet problem and check your answer.</li></ol><p>Graphs use the same model as the animation. Distances and time are labeled; objects are schematic. Models state their simplifying assumptions below the graph.</p><p>For long trips, increase playback speed. Your progress saves only in this browser.</p><h3>Printable materials</h3><div class="download-links"><a href="downloads/Physical_Science_Packet.pdf" target="_blank">8-page packet</a><a href="downloads/Physics_Quick_Guide.pdf" target="_blank">Physics guide</a><a href="downloads/Math_Review_Guide.pdf" target="_blank">Math review</a></div>`);
window.addEventListener('resize',()=>requestAnimationFrame(draw));
window.addEventListener('hashchange',()=>{const next=problems.findIndex(q=>q.id===location.hash.slice(1));if(next>=0&&next!==index)selectProblem(next)});
document.addEventListener('keydown',e=>{if(e.code==='Space'&&!['INPUT','SELECT','TEXTAREA','BUTTON','SUMMARY'].includes(document.activeElement.tagName)&&!$('modal').open){e.preventDefault();$('playBtn').click()}});
if(window.innerHeight<800&&window.innerWidth>900)$('graphToggle').checked=false;
selectProblem(index);requestAnimationFrame(frame);
// Exposed read-only snapshot for classroom diagnostics and deterministic QA.
window.motionLab={getState:()=>({id:p.id,mode,time,params:clone(params),solved:[...solved]}),select:id=>{const i=problems.findIndex(q=>q.id===id);if(i>=0)selectProblem(i)}};
