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
invalidateRenderingCache();const empty=getRenderingDiagnostics();assert.equal(empty.cachedSampleCount,0);assert.equal(empty.infoEntries,0);
console.log(`PASS: ${renders} scene/graph render pairs across all 32 packet and practice problems, correct/wrong trials, compact and large stages, all airplane control endpoints; finite drawing coordinates and bounded caches.`);
