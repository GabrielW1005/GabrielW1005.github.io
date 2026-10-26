import assert from 'node:assert/strict';
import packet from '../data.js';
import {modelInfo,solve} from '../physics.js';
import {createPrediction,createExploration,getExploration} from '../experiments.js';
import {generatePractice} from '../practice.js';
import {drawScene,drawGraph,drawExperiment,drawExperimentGraph,invalidateRenderingCache,getRenderingDiagnostics} from '../rendering.js';

globalThis.window={devicePixelRatio:1};
let problemId='',renders=0;
const check=(name,args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),`${problemId}: ${name} received ${arg}`);};
const fn=()=>{};
function canvas(width,height){const ctx=new Proxy({measureText:s=>({width:String(s).length*6})},{get:(target,key)=>key in target?target[key]:(...args)=>check(key,args),set:(target,key,value)=>(target[key]=value,true)});return{width,height,getBoundingClientRect:()=>({width,height}),getContext:()=>ctx,setAttribute:fn};}
const stages=[canvas(690,300),canvas(1024,650)],graph=canvas(262,150),problems=packet.sections.flatMap(s=>s.problems);
function render(p,params){problemId=p.id;const info=modelInfo(p,params);for(const stage of stages)for(const t of [0,info.duration/2,info.duration]){drawScene(stage,p,params,t);drawGraph(graph,p,params,t,{quantity:info.graphKey});renders++;}
 let trials;if(p.numericAnswer){const value=solve(p,params).value;trials=[createPrediction(p,params,value),createPrediction(p,params,value===0?1:value*1.5)];}else{const spec=getExploration(p,params),wrong=createExploration(p,params,spec.initial),values=p.id==='P23'?{proposedThrust:params.backwardForce,proposedLift:params.weight}:{[spec.controls[0].key]:wrong.expected};trials=[wrong,createExploration(p,params,values)];}
 for(const trial of trials){assert.equal(trial.ok,true,trial.error);for(const stage of stages)for(const progress of [0,.25,.5,.75,1]){const opts={trial,progress,quantity:info.graphKey};drawExperiment(stage,p,params,trial.duration*progress,opts);drawExperimentGraph(graph,p,params,trial.duration*progress,opts);renders++;}}
 const cache=getRenderingDiagnostics();assert.ok(cache.infoEntries<=4&&cache.baseGraphEntries<=1&&cache.comparisonEntries<=1&&cache.comparisonGraphEntries<=1);assert.ok(cache.cachedSampleCount<=700);
}
for(const p of problems){render(p,p.simulation.params);render(p,generatePractice(p,p.simulation.params,()=>.5).params);}
for(const id of ['P23','P27']){const p=problems.find(p=>p.id===id);for(const f of p.simulation.adjustable||[])for(const value of [f.min,f.max])render(p,{...p.simulation.params,[f.key]:value});}
// Capture transformed labels and panel clips: the orange test must actually render
// on the left, while the blue reference remains physically unchanged on the right.
function recordingCanvas(width,height){
 const labels=[],clips=[],attrs={};let matrix=[1,0,0,1,0,0],stack=[],pathRect=null;
 const point=(x,y)=>[matrix[0]*x+matrix[2]*y+matrix[4],matrix[1]*x+matrix[3]*y+matrix[5]];
 const target={
  measureText:s=>({width:String(s).length*6}),
  setTransform:(...m)=>{matrix=m;},
  save(){stack.push({matrix:[...matrix],fillStyle:this.fillStyle});},
  restore(){const prior=stack.pop();matrix=prior.matrix;this.fillStyle=prior.fillStyle;},
  translate(x,y){const p=point(x,y);matrix[4]=p[0];matrix[5]=p[1];},
  scale(x,y){matrix[0]*=x;matrix[1]*=x;matrix[2]*=y;matrix[3]*=y;},
  rotate(angle){const[a,b,c,d,e,f]=matrix,cos=Math.cos(angle),sin=Math.sin(angle);matrix=[a*cos+c*sin,b*cos+d*sin,c*cos-a*sin,d*cos-b*sin,e,f];},
  beginPath(){pathRect=null;},
  rect(x,y,w,h){const p=point(x,y);pathRect={x:p[0],y:p[1],width:w,height:h};},
  clip(){if(pathRect)clips.push(pathRect);},
  fillText(value,x,y){const p=point(x,y);labels.push({text:String(value),x:p[0],y:p[1],color:this.fillStyle});},
 };
 const ctx=new Proxy(target,{get:(o,k)=>k in o?o[k]:(...args)=>check(k,args),set:(o,k,v)=>(o[k]=v,true)});
 return{width,height,labels,clips,attrs,getBoundingClientRect:()=>({width,height}),getContext:()=>ctx,setAttribute:(key,value)=>{attrs[key]=value;}};
}
for(const p of problems){
 problemId=p.id;const params=p.simulation.params,info=modelInfo(p,params),trial=p.numericAnswer?createPrediction(p,params,solve(p,params).value===0?1:solve(p,params).value*1.5):createExploration(p,params,getExploration(p,params).initial),stage=recordingCanvas(690,300),plot=recordingCanvas(262,150),options={trial,progress:1,quantity:info.graphKey};
 drawExperiment(stage,p,params,trial.duration,options);drawExperimentGraph(plot,p,params,trial.duration,options);
 const legend=stage.labels.filter(label=>label.y===23),test=legend.find(label=>label.color==='#ad6905'),reference=legend.find(label=>label.color==='#2475cf');
 assert.ok(test&&reference&&test.x<345&&reference.x>345,`${p.id}: test legend left, reference right`);
 assert.match(stage.attrs['aria-label'],/your test on the left, reference on the right/);
 assert.ok(stage.labels.some(label=>label.text.startsWith('Your test:')&&label.y===274),`${p.id}: result starts with student value`);
 const graphLegend=plot.labels.filter(label=>label.y===(trial.overlay?.type==='vector'?34:32)),graphTest=graphLegend.find(label=>label.color==='#ad6905'),graphReference=graphLegend.find(label=>label.color==='#2475cf');
 assert.ok(graphTest&&graphReference&&graphTest.x<graphReference.x,`${p.id}: graph test legend comes first`);
 if(p.simulation.kind==='gravity'){
  const readings=stage.labels.filter(label=>label.text.startsWith('spring reading'));
  assert.ok(readings.find(label=>label.color==='#ad6905').x<345&&readings.find(label=>label.color==='#2475cf').x>345,`${p.id}: springs swapped, not just headers`);
 }else if(!p.extension&&p.simulation.params.axis==='vertical'){
  const heights=stage.labels.filter(label=>label.text.startsWith('height '));
  assert.ok(heights.find(label=>label.color==='#ad6905').x<345&&heights.find(label=>label.color==='#2475cf').x>345,`${p.id}: vertical actors swapped, not just headers`);
 }else{
  const panels=stage.clips.filter(clip=>clip.y===43&&clip.height===210);
  assert.equal(panels.length,2,`${p.id}: exactly two full comparison panels`);
  assert.ok(panels[0].x>345&&panels[1].x<345,`${p.id}: reference draws right, student draws left`);
 }
}
invalidateRenderingCache();const empty=getRenderingDiagnostics();assert.equal(empty.cachedSampleCount,0);assert.equal(empty.infoEntries,0);
console.log(`PASS: ${renders} scene/graph render pairs across all 50 packet and extension problems with practice, correct/wrong trials, compact and large stages, all airplane control endpoints; finite drawing coordinates, bounded caches, and all50 focused test-left/reference-right placement assertions.`);
