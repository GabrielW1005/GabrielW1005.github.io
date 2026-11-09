import assert from 'node:assert/strict';
import {defaultConfig,normalizeConfig,ratio,limits,makeState,readout} from '../physics.js';
import {buildComparisonModel,renderComparison} from '../comparison.js';
let checks=0;
const near=(a,b,tol=1e-9)=>{assert.ok(Math.abs(a-b)<=tol*Math.max(1,Math.abs(a),Math.abs(b)),`${a} ≠ ${b}`);checks++;};
const finiteTree=v=>{if(typeof v==='number'){assert.ok(Number.isFinite(v));checks++;}else if(Array.isArray(v))v.forEach(finiteTree);else if(v&&typeof v==='object')Object.values(v).forEach(finiteTree);};

// Ramp body path and gravitational work distance are deliberately different.
let c=normalizeConfig({...defaultConfig('ramp'),inputMass:4.5,outputMass:18,length:2,height:.5});
let m=buildComparisonModel({config:c,state:{q0:.1,q:.4}});
near(m.pathIn,.3);near(m.pathOut,.3);near(m.distanceIn,.3);near(m.distanceOut,.075);near(m.productIn,1.35);near(m.productOut,1.35);assert.ok(m.equal&&m.massMode&&!m.reference);checks++;
near(m.productDrawIn.width*m.productDrawIn.height,m.productDrawOut.width*m.productDrawOut.height);

// A lever's arc must not be substituted for vertical work distance.
c=normalizeConfig({...defaultConfig('lever'),inputMass:5,outputMass:20,rIn:1.2,rOut:.3});
m=buildComparisonModel({config:c,state:{q0:-.1,q:.2}});
near(m.pathIn,.36);near(m.pathOut,.09);near(m.distanceIn,1.2*(Math.sin(.2)-Math.sin(-.1)));near(m.distanceIn/m.distanceOut,4);assert.ok(m.pathIn>m.distanceIn&&m.equal);checks++;

// A force-driven setup uses force products; zero input mass is not treated as
// zero input work when an applied input force acts.
c=normalizeConfig({...defaultConfig('ramp'),inputMass:0,outputMass:18,length:1,height:.5,force:90});
m=buildComparisonModel({config:c,state:{q0:.1,q:.3}});
assert.ok(!m.massMode&&m.equal);checks++;near(m.factorIn,90);near(m.factorOut,180);near(m.productIn,18);
const unequal=buildComparisonModel({config:{...c,force:100},state:{q0:.1,q:.3}});assert.ok(!unequal.equal&&unequal.productIn>unequal.productOut);checks++;
near(unequal.regularWorkDifference,2);
const tiny=buildComparisonModel({config:{...c,force:100},state:{q0:.1,q:.10000002}});assert.ok(!tiny.equal&&!tiny.reference);checks++;

// A reversal keeps signed work, while geometric rectangle dimensions stay
// positive. Historical cumulative distance must never replace displacement.
m=buildComparisonModel({config:c,state:{q0:.3,q:.1},readout:{pathDistanceIn:300,pathDistanceOut:300}});
near(m.distanceIn,.2);near(m.signedWorkIn,-18);near(m.signedWorkOut,-18);assert.ok(m.productDrawIn.width>=0&&m.productDrawIn.height>=0);checks++;

// A stationary machine shows an honestly labelled reference movement and
// still fits the valid stroke for every machine and supported pulley ratio.
const types=['lever','ramp','pulley','wheel','gears','screw','wedge','hydraulic'];
for(const type of types)for(const variant of [0,1,2,3]){
 c=defaultConfig(type);
 if(type==='pulley')c.strands=[1,2,4,6][variant];
 if(type==='ramp'){c.length=[.4,1.6,3,5][variant];c.height=[.2,.4,.5,1][variant];}
 if(type==='gears'){c.teethIn=[8,12,24,48][variant];c.teethOut=[48,24,12,8][variant];}
 c=normalizeConfig(c);c.inputMass=c.outputMass/ratio(c);
 // Some inverse-ratio gear fixtures require >200 kg: normalize and compare
 // their actual clamped value rather than falsely requiring balance.
 c=normalizeConfig(c);
 let state=makeState(c,.5),r=readout(state,c),model=buildComparisonModel({config:c,state,readout:r}),lim=limits(c);
 assert.ok(model.reference);assert.ok(model.q0>=lim.min&&model.q<=lim.max);checks+=2;
 near(model.distanceIn/model.distanceOut,ratio(c));
 near(model.productDrawIn.width*model.productDrawIn.height/model.productIn,model.productDrawOut.width*model.productDrawOut.height/model.productOut);
 finiteTree(model);
 for(const phase of [0,1,2])for(const dark of [false,true]){
  const html=renderComparison({config:c,state,readout:r,phase,dark,pathWidth:variant+1});
  assert.ok(html.includes('Reference movement'));assert.ok(html.includes('<svg'));assert.ok(!/NaN|Infinity|undefined/.test(html));checks+=3;
 }
 // Moving snapshot uses renderer geometry and measured displacement.
 state.q=lim.min+.8*lim.range;r=readout(state,c);model=buildComparisonModel({config:c,state,readout:r});assert.ok(!model.reference);checks++;
 for(const side of ['input','output']){const g=model.geometry[side],pts=g.livePoints;assert.ok(pts.length>=2);finiteTree(g);let length=0;for(let i=1;i<pts.length;i++)length+=Math.hypot(pts[i][0]-pts[i-1][0],pts[i][1]-pts[i-1][1]);near(length/g.pxPerMeter,side==='input'?model.pathIn:model.pathOut,2e-5);}
}

// Extra pointer work and damping remain separate, including an otherwise
// balanced mass arrangement; equality is never fabricated or suppressed.
c={...defaultConfig('lever'),inputMass:5,outputMass:20};
m=buildComparisonModel({config:c,state:{q0:0,q:.2},readout:{pointerWork:3,dampingEnergyLoss:1}});assert.ok(m.equal&&m.extraDynamics&&m.hadPull);near(m.dissipation,1);checks++;
const rendered=renderComparison({config:c,state:{q0:0,q:.2},readout:{pointerWork:3,dampingEnergyLoss:1},phase:2});assert.ok(rendered.includes('accounted for separately'));checks++;
// Manual step changes must keep the same physical scale, line positions and
// viewport. The work projection is a separate line, never a replacement path.
for(const type of ['lever','ramp','gears','pulley']){
 const conf=normalizeConfig({...defaultConfig(type),inputMass:5,outputMass:20});
 const lim=limits(conf),snapshot={q0:lim.min+.2*lim.range,q:lim.min+.7*lim.range};
 const model=buildComparisonModel({config:conf,state:snapshot});
 const views=[0,1,2].map(phase=>renderComparison({config:conf,state:snapshot,phase}));
 const paths=html=>html.match(/<line[^>]*data-comparison-path="[^"]+"[^>]*\/>/g);
 const work=html=>html.match(/<line[^>]*data-comparison-work="[^"]+"[^>]*\/>/g);
 assert.equal(paths(views[0]).length,2);assert.equal(work(views[0]).length,2);checks+=2;
 for(const view of views){
  assert.ok(view.includes('viewBox="0 0 900 400"'));assert.ok(!view.includes('<animate'));
  assert.deepEqual(paths(view),paths(views[0]));assert.deepEqual(work(view),work(views[0]));checks+=4;
 }
 near(model.productDrawIn.width,model.workDrawIn.width);
 near(model.productDrawOut.width,model.workDrawOut.width);
 near(model.pathDrawIn.width/model.pathIn,model.distanceScale);
 near(model.pathDrawOut.width/model.pathOut,model.distanceScale);
 if(type==='ramp')assert.ok(model.pathDrawOut.width>model.workDrawOut.width);
}
console.log(`Comparison checks passed: ${checks}`);
