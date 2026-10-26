import assert from 'node:assert/strict';
import packet from '../data.js';
import {evaluate,modelInfo,solve,springScaleState,format} from '../physics.js';
import {getPractice,listPracticeIds} from '../practice.js';
import {createPrediction,getPredictionBounds} from '../experiments.js';
import {drawScene,drawGraph,drawExperiment,drawExperimentGraph,invalidateRenderingCache,getRenderingDiagnostics} from '../rendering.js';

globalThis.window={devicePixelRatio:1};
let current='';
function canvas(w,h){
 const text=[],ellipses=[],attrs={};
 const target={measureText:s=>({width:String(s).length*6}),fillText:(s,x,y)=>text.push({text:String(s),x,y}),ellipse:(...args)=>{ellipses.push(args);check('ellipse',args);}};
 const check=(name,args)=>{for(const a of args)if(typeof a==='number')assert.ok(Number.isFinite(a)&&Math.abs(a)<1e12,`${current}: ${name} finite bounded coordinate ${a}`);};
 const context=new Proxy(target,{get:(o,k)=>k in o?o[k]:(...a)=>check(k,a),set:(o,k,v)=>(o[k]=v,true)});
 return{width:w,height:h,text,ellipses,attrs,getBoundingClientRect:()=>({width:w,height:h}),getContext:()=>context,setAttribute:(k,v)=>attrs[k]=v};
}
const all=packet.sections.flatMap(s=>s.problems),extensions=all.filter(p=>p.extension);assert.equal(extensions.length,18);
let versions=0,renders=0;
for(const problem of extensions){
 for(const id of [null,...listPracticeIds(problem)]){
  current=`${problem.id}/${id||'original'}`;const params=id?getPractice(problem,id).params:problem.simulation.params,info=modelInfo(problem,params),stage=canvas(690,300),graph=canvas(262,150);
  for(const t of[0,info.duration/2,info.duration]){drawScene(stage,problem,params,t);drawGraph(graph,problem,params,t,{quantity:info.graphKey});renders++;}
  const bounds=getPredictionBounds(problem,params);
  for(const value of[bounds.min,bounds.max]){
   const trial=createPrediction(problem,params,value);assert.equal(trial.ok,true,`${current}: ${trial.error}`);
   const opts={trial,progress:1,quantity:info.graphKey};drawExperiment(stage,problem,params,trial.duration,opts);drawExperimentGraph(graph,problem,params,trial.duration,opts);renders++;
  }
  const cache=getRenderingDiagnostics();assert.ok(cache.infoEntries<=4&&cache.cachedSampleCount<=700,current+' bounded renderer caches');versions++;
 }
}
// The clay collision tests conservation/sticking; it no longer teaches deformation by squashing the sprites.
const clay=all.find(p=>p.id==='P30'),p=clay.simulation.params,info=modelInfo(clay,p);
for(const t of[p.collisionTime+.001,info.duration]){
 const stage=canvas(690,300);current='clay circular bodies';drawScene(stage,clay,p,t);
 assert.equal(stage.ellipses.length,2);for(const ellipse of stage.ellipses)assert.equal(ellipse[2],ellipse[3],'Clay sprite stays circular');
}
const trial=createPrediction(clay,p,solve(clay,p).value*1.3),stage=canvas(690,300);drawExperiment(stage,clay,p,trial.duration,{trial,progress:1});assert.equal(stage.ellipses.length,4);for(const ellipse of stage.ellipses)assert.equal(ellipse[2],ellipse[3],'Comparison clay sprites stay circular');
// Base and comparison scales share the model, with the same time-dependent spring reading.
for(const id of['P17','P19']){
 const problem=all.find(p=>p.id===id),params=problem.simulation.params;current=id+' shared scale physics';
 for(const time of[0,.37,1.3]){
  const result=evaluate(problem,params,time),physical=springScaleState(params,time),view=canvas(690,300);drawScene(view,problem,params,time);
  assert.ok(Math.abs(result.currentScaleForce-physical.force)<1e-9);
  assert.ok(view.text.some(x=>x.text===`spring reading ${format(physical.force)} N`),`${id}: displayed spring reading matches same model`);
  assert.ok(Math.abs(result.netForce-(physical.supportForce-physical.weight))<1e-9);
 }
}
invalidateRenderingCache();assert.equal(getRenderingDiagnostics().cachedSampleCount,0);
console.log(`PASS: ${versions} extension originals/practice versions, ${renders} finite draw/graph pairs including both input bounds, bounded caches, circular clay, and shared gravity scale physics.`);
