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
  else if(cmd==='L'){x=+t[i++];y=+t[i++];total+=Math.hypot(x-old[0],y-old[1]);}
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


let rampStates=0;
for(const [length,height] of [[.3,.1],[1,1],[2,.5],[5,.1],[5,2],[2,1.8]])for(const mass of [1,20,200]){
 const c=normalizeConfig({...defaultConfig('ramp'),length,height,inputMass:mass,outputMass:mass});let previous;
 for(const fraction of [0,.25,.5,.75,1]){
  const state=makeState(c,fraction),svg=renderScene(c,state),start=svg.indexOf('<g data-ramp-rope='),assembly=attrs(svg.slice(start,svg.indexOf('>',start))),d=svg.slice(start).match(/<path d="([^"]+)"/)[1];
  const measured=ropeLength(d)/assembly['ramp-scale'];near(measured,assembly['rope-length'],1e-6);previous??=measured;near(measured,previous,1e-6);
  assert.equal((svg.match(/data-ramp-guide=/g)||[]).length,1,'Ramp has exactly one guide');
  const dx=assembly['entry-x']-assembly['guide-x'],dy=assembly['entry-y']-assembly['guide-y'],tx=Math.sqrt(1-(height/length)**2),ty=-height/length;
  near(Math.hypot(dx,dy),assembly['guide-radius']);near(dx*tx+dy*ty,0,1e-7);
  const capture=trajectoryGeometry(c,state);near(capture.input.fullPathDistance,capture.output.fullPathDistance);
  for(const body of [capture.input,capture.output])for(const point of body.points)assert.ok(point.every(Number.isFinite));
  rampStates++;
 }
}
let gearStates=0;
for(const teethIn of [8,24,96])for(const teethOut of [8,24,96])for(const mass of [1,20,200]){
 const c=normalizeConfig({...defaultConfig('gearArms'),teethIn,teethOut,inputMass:mass,outputMass:mass}),k=teethIn/teethOut;
 for(const fraction of [0,.25,.5,.75,1]){
  const state=makeState(c,fraction);state.q0=0;const svg=renderScene(c,state),capture=trajectoryGeometry(c,state),gears=[...svg.matchAll(/<g data-gear="(?:input|output)"[^>]+>/g)].map(m=>attrs(m[0]));
  assert.equal(gears.length,2);near(gears[0]['center-y'],gears[1]['center-y']);assert.ok(gears[0]['center-x']<gears[1]['center-x'],'Gears sit horizontally beside each other');near(Math.hypot(gears[1]['center-x']-gears[0]['center-x'],gears[1]['center-y']-gears[0]['center-y']),gears[0]['pitch-radius']+gears[1]['pitch-radius']);
  near(gears[0]['pitch-radius']/teethIn,gears[1]['pitch-radius']/teethOut);
  near(capture.input.pathDistance,c.rIn*Math.abs(state.q));near(capture.output.pathDistance,c.rOut*k*Math.abs(state.q));
  near(capture.input.signedWorkDistance,c.rIn*Math.sin(state.q));near(capture.output.signedWorkDistance,c.rOut*Math.sin(k*state.q));
  for(const [i,side] of ['input','output'].entries()){
   const points=capture[side];assert.ok(points.current[0]<gears[i]['center-x'],'Both bars point left');
   near((gears[i]['center-x']-points.current[0])/points.pxPerMeter,(side==='input'?c.rIn:c.rOut)*Math.cos(state.q*(side==='input'?1:k)));
   assert.ok(points.points.every(p=>p.every(Number.isFinite)));
  }
  const inputY=capture.input.current[1]-capture.input.start[1],outputY=capture.output.current[1]-capture.output.start[1];assert.ok(inputY*outputY<=1e-10,'Geared bars move masses in opposite vertical directions');
  gearStates++;
 }
}
for(const type of ['lever','ramp','pulley','wheel','gears','gearArms','screw','wedge','hydraulic']){
 const c=defaultConfig(type),state=makeState(c,.5),locked=renderScene(c,state,{}, {editableKey:'inputMass'});
 assert.ok(!locked.includes('data-drag="geometry"'),`${type}: geometry locked`);
 assert.equal((locked.match(/data-drag="resize"/g)||[]).length,6,`${type}: one mass has resize handles`);
 assert.ok(!/data-drag="resize" data-side="output"/.test(locked));
 if(type==='ramp')assert.ok(locked.includes('data-geo="rampRun"'),'Read-only ramp still exposes stable view metadata');
}
const gears=defaultConfig('gears'),gearSvg=renderScene(gears,makeState(gears));assert.ok(!/data-param="(?:crankRadius|drumRadius)"/.test(gearSvg),'Drums have no resize handles');
const pulley=defaultConfig('pulley'),pulleySvg=renderScene(pulley,makeState(pulley));assert.ok(!pulleySvg.includes('data-param="strands"'),'Supporting strands have no separate scene slider');
const arm=defaultConfig('gearArms'),armSvg=renderScene(arm,makeState(arm,.5),{}, {editableKey:'teethOut'});assert.equal((armSvg.match(/data-param="teethOut"/g)||[]).length,2);assert.ok(!armSvg.includes('data-drag="resize"'));
console.log(`Scene checks passed: ${pulleyStates} pulley states,42 hydraulic pairs,${rampStates} single-guide ramp states,${gearStates} geared-arm states,and balance handle restrictions.`);
// Each problem fits its own full stroke. Retaining that view during edits keeps
// the horizontal base anchor and scale stable; Fit can recompute the view.
for(const run of [0,.5,1.5,3,4.8])for(const mass of [1,20,200]){
 let initial,view;
 for(const height of [.1,.35,.6,1,1.5,2].filter(h=>Math.hypot(run,h)>=.3&&Math.hypot(run,h)<=5)){
  const c=normalizeConfig({...defaultConfig('ramp'),length:Math.hypot(run,height),height,inputMass:mass,outputMass:mass}),svg=renderScene(c,makeState(c,.5),{},view?{rampView:view}:{}),grip=attrs(svg.match(/<g[^>]*data-geo="rampRun"[^>]*>/)[0]);
  initial??=grip;view??={scale:grip.scale,x0:grip['base-x'],baseY:grip['base-y']};near(grip.scale,initial.scale);near(grip['base-x'],initial['base-x']);near(grip['base-y'],initial['base-y']);near(grip.run,run);
  const capture=trajectoryGeometry(c,makeState(c,.5));
  for(const [side,body] of Object.entries({input:capture.input,output:capture.output})){
   const half=5*Math.sqrt(mass),angle=Math.atan2(height,run),extent=side==='input'?half:half*(Math.cos(angle)+Math.sin(angle));
   for(const [x,y] of body.points)assert.ok(x-extent>=0&&x+extent<=900&&y-extent>=0&&y+extent<=540,`Ramp ${run},${height},${mass},${side} stays in view`);
  }
 }
}
console.log('Ramp height edits retain the base anchor and scale across 15 run/mass combinations.');

// A standard 3-4-5 classroom ramp fills the scene instead of reserving every
// possible future height. Its slope and the hanging rope use one metre scale.
for(const [inputMass,outputMass] of [[6,10],[12,20]]){
 const c=normalizeConfig({...defaultConfig('ramp'),length:.5,height:.3,inputMass,outputMass}),svg=renderScene(c,makeState(c,.5)),grip=attrs(svg.match(/<g[^>]*data-geo="rampRun"[^>]*>/)[0]);
 assert.ok(grip.run*grip.scale>=200,'Standard ramp base is at least 200 scene units wide');
}
console.log('Standard ramps are large and full-stroke geometry remains visible.');

// The initial steep 3-4-5 ramp also uses the enlarged fitting window.
{
 const c=normalizeConfig({...defaultConfig('ramp'),length:.5,height:.4,inputMass:5,outputMass:5}),svg=renderScene(c,makeState(c,.5)),grip=attrs(svg.match(/<g[^>]*data-geo="rampRun"[^>]*>/)[0]);
 assert.ok(c.length*grip.scale>=300,'Initial steep ramp has at least 300 scene units of slope');
 assert.ok(svg.includes('y="23"'),'Ramp dimension labels sit above the motion area');
}

// The diagonal and vertical measurements stay visible with paths/forces off.
// Their arrows use the actual ramp scale; there is no third base measurement.
for(const [length,height] of [[.5,.3],[.5,.4],[1,1],[5,.1],[2,1.5]])for(const dark of [false,true]){
 const c=normalizeConfig({...defaultConfig('ramp'),length,height}),svg=renderScene(c,makeState(c,.5),{}, {dark,paths:false,forces:false,editableKey:'length'}),grip=attrs(svg.match(/<g[^>]*data-geo="rampRun"[^>]*>/)[0]);
 for(const [name,metres] of [['length',length],['height',height]]){
  const dimension=svg.match(new RegExp(`<g data-ramp-dimension-guide="${name}"[^>]*><line x1="([^"]+)" y1="([^"]+)" x2="([^"]+)" y2="([^"]+)"`));
  assert.ok(dimension,`${name} dimension arrow present without trajectory overlay`);
  near(Math.hypot(Number(dimension[3])-Number(dimension[1]),Number(dimension[4])-Number(dimension[2]))/grip.scale,metres);
  assert.equal((svg.match(new RegExp(`data-ramp-dimension="${name}"`,'g'))||[]).length,1,`${name} value labelled once`);
 }
 assert.ok(svg.includes(`Ramp length L = ${length} m`));
 assert.ok(svg.includes(`Height h = ${height} m`));
 assert.ok(!svg.includes('extend base'),'No visible base label');
 assert.ok(svg.includes('aria-label="Drag to change ramp length"'),'Length target has a horizontal resize handle');
 assert.ok(!svg.includes('data-param="height"'),'Length questions keep height fixed');
 assert.ok(!svg.includes(' N</text>'),'Force values remain hidden when force overlay is off');
}
console.log('Ramp dimensions are clear, unique, to scale, and available with trajectories hidden.');
