import assert from 'node:assert/strict';
import packet from '../data.js';
import {modelInfo,solve} from '../physics.js';
import {createPrediction,createExploration,getExploration} from '../experiments.js';
import {drawScene,drawGraph,drawExperiment,drawExperimentGraph,invalidateRenderingCache} from '../rendering.js';
globalThis.window={devicePixelRatio:1};
function canvas(width=690,height=300){
 const labels=[],attrs={},operations=[];
 const context=new Proxy({measureText:s=>({width:String(s).length*6}),fillText:(s,x,y)=>labels.push({text:String(s),x,y})},{get:(o,k)=>k in o?o[k]:(...args)=>{for(const arg of args)if(typeof arg==='number')assert.ok(Number.isFinite(arg),`Nonfinite ${String(k)} coordinate`);operations.push(k);},set:(o,k,v)=>(o[k]=v,true)});
 return{width,height,labels,attrs,operations,getBoundingClientRect:()=>({width,height}),getContext:()=>context,setAttribute:(k,v)=>attrs[k]=v};
}
const problems=packet.sections.flatMap(s=>s.problems).filter(p=>!p.extension);
let renders=0;
for(const problem of problems){
 const params=problem.simulation.params,info=modelInfo(problem,params),targetQuantity=problem.numericAnswer?.quantity;
 const trial=problem.numericAnswer?createPrediction(problem,params,solve(problem,params).value*1.4||1):createExploration(problem,params,getExploration(problem,params).initial);
 for(const progress of [0,.5,1]){
  const stage=canvas(),graph=canvas(262,150),options={hideAnswer:true,targetQuantity,quantity:info.graphKey};
  drawScene(stage,problem,params,info.duration*progress,options);drawGraph(graph,problem,params,info.duration*progress,options);
  assert.match(stage.attrs['aria-label'],/use the problem measurements/);
  assert.ok(!stage.labels.some(x=>/^(spring reading|weight|system p|p₁) [\d−-]/.test(x.text)),`${problem.id}: base result label`);
  assert.ok(!stage.labels.some(x=>/velocity: tangent|gravity: inward|net force: inward/.test(x.text)),`${problem.id}: answer direction in base label`);
  const comparison=canvas();drawExperiment(comparison,problem,params,trial.duration*progress,{...options,trial,progress});drawExperimentGraph(graph,problem,params,trial.duration*progress,{...options,trial,progress});
  assert.doesNotMatch(comparison.attrs['aria-label'],/reference result|Difference:/);
  assert.ok(!comparison.labels.some(x=>/Difference:|\sGiven:|\sGoal:|^system p |^p₁ |^spring reading [-\d]|^weight [-\d]/.test(x.text)),`${problem.id}: comparison answer label`);
  if(progress===1){const result=comparison.labels.find(x=>x.text.startsWith('Your test:'));assert.ok(result,`${problem.id}: student result is still shown`);assert.ok(/Correct\.|Try again/.test(result.text));}
  assert.ok(stage.operations.includes('stroke')&&comparison.operations.includes('stroke'),`${problem.id}: physical visual still drawn`);
  renders++;
 }
}
// Unknown-value graph scales are omitted, while the speed graph used to work
// out acceleration remains readable. Practice retains its full result labels.
for(const [id,quantity] of [['P05','speed'],['P06','x'],['P09','a'],['P17','currentScaleForce'],['P29','totalMomentum'],['P30','momentum1']]){
 const p=problems.find(p=>p.id===id),params=p.simulation.params,t=modelInfo(p,params).duration,hidden=canvas(262,150),shown=canvas(262,150);
 drawGraph(hidden,p,params,t,{hideAnswer:true,quantity});drawGraph(shown,p,params,t,{quantity});
 assert.equal(hidden.labels.filter(x=>x.x===37).length,0,`${id}: unknown y-axis not labeled`);
 assert.equal(shown.labels.filter(x=>x.x===37).length,4,`${id}: practice y-axis labeled`);
}
const acc=problems.find(p=>p.id==='P14'),speed=canvas(262,150);drawGraph(speed,acc,acc.simulation.params,6,{hideAnswer:true,quantity:'v'});assert.equal(speed.labels.filter(x=>x.x===37).length,4,'Speed graph retains the given data for acceleration calculation');
for(const id of ['P17','P29','P30']){
 const p=problems.find(p=>p.id===id),params=p.simulation.params,trial=createPrediction(p,params,solve(p,params).value*1.4),shown=canvas();drawExperiment(shown,p,params,trial.duration,{trial,progress:1});
 assert.match(shown.attrs['aria-label'],/reference result/);assert.ok(shown.labels.some(x=>x.text.includes('Difference:')));
}
invalidateRenderingCache();
console.log(`PASS: ${renders} protected original scene/comparison pairs; hidden result labels, ARIA and unknown graph scales; useful speed graphs and practice solutions preserved.`);
