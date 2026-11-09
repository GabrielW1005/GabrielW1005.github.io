import assert from 'node:assert/strict';
import { renderScene, trajectoryGeometry } from '../scene.js';
import { defaultConfig, normalizeConfig, makeState } from '../physics.js';

const attrs=s=>Object.fromEntries([...s.matchAll(/data-([\w-]+)="([^"]+)"/g)].map(m=>[m[1],Number(m[2])]));
const near=(a,b,epsilon=1e-8)=>assert.ok(Math.abs(a-b)<epsilon,`${a} differs from ${b}`);

// Measure the SVG rope itself, including its circular tangent arcs. This
// independently checks the renderer's reported length and moving constraint.
function ropeLength(d){
 const t=d.match(/[A-Za-z]|[-+]?(?:\d*\.)?\d+(?:e[-+]?\d+)?/gi);let i=0,x=0,y=0,total=0;
 while(i<t.length){
  const cmd=t[i++],old=[x,y];
  if(cmd==='M'){x=+t[i++];y=+t[i++];}
  else if(cmd==='V'){y=+t[i++];total+=Math.abs(y-old[1]);}
  else if(cmd==='H'){x=+t[i++];total+=Math.abs(x-old[0]);}
  else if(cmd==='A'){
   const rx=+t[i++],ry=+t[i++];near(rx,ry);i++;const large=+t[i++];i++;
   x=+t[i++];y=+t[i++];const chord=Math.hypot(x-old[0],y-old[1]);
   assert.ok(chord<=2*rx+1e-7,'Impossible circular rope tangent');
   const angle=2*Math.asin(Math.min(1,chord/(2*rx)));total+=(large?2*Math.PI-angle:angle)*rx;
  }else throw Error(`Unexpected rope command ${cmd}`);
 }
 return total;
}

let pulleyStates=0;
for(const strands of [1,2,4,6])for(const pulleyRadius of [.08,.12,.18,.32])for(const pulleyTravel of [.6,1.2,1.8]){
 const c=normalizeConfig({...defaultConfig('pulley'),strands,pulleyRadius,pulleyTravel,inputMass:200,outputMass:200});let initialLength;
 for(const fraction of [0,.25,.5,.75,1]){
  const state=makeState(c,fraction);state.q0=0;const svg=renderScene(c,state),start=svg.indexOf('<g data-pulley-assembly='),assembly=attrs(svg.slice(start,svg.indexOf('>',start))),d=svg.slice(start).match(/<path d="([^"]+)"/)[1];
  const measured=ropeLength(d)/assembly['pulley-scale'];near(measured,assembly['rope-length'],1e-6);initialLength??=measured;near(measured,initialLength,1e-6);
  assert.equal((svg.match(/data-support-strand=/g)||[]).length,strands);
  const sheaves=[...svg.matchAll(/<g data-sheave="(fixed|moving)"[^>]+>/g)].map(m=>({kind:m[1],...attrs(m[0])}));
  assert.equal(sheaves.filter(s=>s.kind==='moving').length,strands===1?0:strands/2);
  for(let a=0;a<sheaves.length;a++)for(let b=a+1;b<sheaves.length;b++){
   const p=sheaves[a],q=sheaves[b];assert.ok(Math.hypot(p['center-x']-q['center-x'],p['center-y']-q['center-y'])+1e-7>=p['contact-radius']+q['contact-radius'],'Sheaves overlap');
  }
  const geo=trajectoryGeometry(c,state);near(geo.input.pathDistance,state.q);near(geo.output.pathDistance,state.q/strands);
  pulleyStates++;
 }
}

for(const areaIn of [.25,.5,1,2,5,10])for(const areaOut of [.25,.5,1,2,5,10,20]){
 const c=normalizeConfig({...defaultConfig('hydraulic'),areaIn,areaOut}),svg=renderScene(c,makeState(c));
 const bore=[...svg.matchAll(/<g data-bore="(?:input|output)"[^>]+>/g)].map(m=>attrs(m[0]));
 near(bore[0]['diameter-px'],36*Math.sqrt(areaIn));near(bore[1]['diameter-px'],36*Math.sqrt(areaOut));
 near((bore[1]['diameter-px']/bore[0]['diameter-px'])**2,areaOut/areaIn);
}
for(const [length,height] of [[1,1],[2,.5],[5,.1]]){
 const c=normalizeConfig({...defaultConfig('ramp'),length,height}),svg=renderScene(c,makeState(c));
 const grip=attrs(svg.match(/<g[^>]*data-geo="rampRun"[^>]*>/)[0]);near(Math.hypot(grip.run,grip.height),length);assert.ok(grip.scale>0);
}
console.log(`Scene layout checks passed: ${pulleyStates} pulley states, 42 hydraulic area pairs, 3 ramp geometries.`);
