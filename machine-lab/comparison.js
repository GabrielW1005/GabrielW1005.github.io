/** Snapshot comparison of real paths, force-aligned distances and work products. */
import {normalizeConfig, ratio, limits, GRAVITY, isAngularMachine, verticalCoordinates, bodyJacobian} from './physics.js?v=balance-v1';
import {trajectoryGeometry} from './scene.js?v=balance-v1';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const fmt=n=>Number.isFinite(n)?(Math.abs(n)<1e-10?'0':Number(n.toPrecision(4)).toString()):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eq=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1e-12,Math.abs(a),Math.abs(b));
const positive=n=>Math.max(0,finite(n));

/** Pure numerical model; signed work is retained and drawing lengths are positive. */
export function buildComparisonModel({config,state={},readout={}}={}) {
 const c=normalizeConfig(config),lim=limits(c),R=ratio(c),angular=isAngularMachine(c);
 let q0=clamp(finite(state.q0,finite(state.q,lim.min)),lim.min,lim.max),q=clamp(finite(state.q,q0),lim.min,lim.max);
 const reference=Math.abs(q-q0)<1e-8;
 if(reference){q0=angular?0:lim.min+.15*lim.range;q=angular?Math.min(.22,lim.max):lim.min+.55*lim.range;}
 const dq=q-q0,start=verticalCoordinates(c,q0),end=verticalCoordinates(c,q),J=bodyJacobian(c);
 const signedIn=end.input-start.input,signedOut=end.output-start.output;
 const distanceIn=Math.abs(signedIn),distanceOut=Math.abs(signedOut);
 const pathIn=J.input*Math.abs(dq),pathOut=J.output*Math.abs(dq);
 const forceIn=c.inputMass*GRAVITY+c.force,forceOut=c.outputMass*GRAVITY;
 const massMode=c.force<=1e-10;
 const factorIn=massMode?c.inputMass:forceIn,factorOut=massMode?c.outputMass:forceOut;
 const productIn=factorIn*distanceIn,productOut=factorOut*distanceOut;
 const equal=eq(productIn,productOut),signedWorkIn=forceIn*signedIn,signedWorkOut=forceOut*signedOut;
 const hadPull=Math.abs(finite(readout.pointerWork))>1e-8||Math.abs(finite(readout.externalInputForce))>1e-8||Math.abs(finite(readout.externalOutputForce))>1e-8;
 const dissipation=positive(readout.dampingEnergyLoss)+positive(readout.stopEnergyLoss);
 const extraDynamics=hadPull||dissipation>1e-8;
 const geometry=trajectoryGeometry(c,{...state,q0,q},readout);
 const factorScale=66/Math.max(1,factorIn,factorOut),distanceScale=560/Math.max(pathIn,pathOut,distanceIn,distanceOut,1e-12);
 const massAreaScale=84**2/Math.max(c.inputMass,c.outputMass,1);
 return {config:c,R,q0,q,reference,geometry,pathIn,pathOut,distanceIn,distanceOut,
  signedIn,signedOut,forceIn,forceOut,massMode,factorIn,factorOut,productIn,productOut,equal,
  signedWorkIn,signedWorkOut,regularWorkDifference:signedWorkIn-signedWorkOut,extraDynamics,hadPull,dissipation,
  factorScale,distanceScale,massAreaScale,
  pathDrawIn:{width:pathIn*distanceScale},pathDrawOut:{width:pathOut*distanceScale},
  workDrawIn:{width:distanceIn*distanceScale},workDrawOut:{width:distanceOut*distanceScale},
  productDrawIn:{width:distanceIn*distanceScale,height:factorIn*factorScale},
  productDrawOut:{width:distanceOut*distanceScale,height:factorOut*factorScale},
  sourceLabel:reference?'Reference movement · current and starting positions match':'Measured movement · starting position to current position',
  workNote:angular?'Arm ends follow arcs. Weight does work through vertical rise or fall, so use the vertical distances.':c.type==='ramp'?'The box travels along the slope. Its weight acts vertically, so output work uses vertical rise.':'Rope or piston travel gives the distance along the applied force.',
 };
}

function palette(dark){return dark?{bg:'#111b2c',ink:'#edf3ff',muted:'#a8b8cf',grid:'#35455f',blue:'#80b6ff',orange:'#ffb777'}:{bg:'#ffffff',ink:'#22334b',muted:'#5b6d85',grid:'#c8d2df',blue:'#2161b9',orange:'#b85713'};}
const txt=(x,y,s,color,size=20,anchor='start',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const line=(x1,y1,x2,y2,color,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
const VIEWBOX='0 0 900 400';
const BAR_X=280;
function svg(body,p,label){return `<svg class="mc-visual" viewBox="${VIEWBOX}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg" style="background:${p.bg}"><g font-family="system-ui,-apple-system,Segoe UI,sans-serif">${body}</g></svg>`;}

/** Identical path/work bars, coordinates and scale in every manually selected step. */
function commonDistances(m,p,pathWidth){
 let z=txt(28,27,'Same distance scale in every step',p.ink,22);
 z+=txt(28,48,'Actual path length and distance along the force',p.muted,16);
 for(const [side,pathY,workY,col,pathLength,workLength]of[
  ['input',77,106,p.blue,m.pathIn,m.distanceIn],['output',143,172,p.orange,m.pathOut,m.distanceOut]]){
  const name=side==='input'?'Input':'Output',sub=side==='input'?'₁':'₂',pathEnd=BAR_X+pathLength*m.distanceScale,workEnd=BAR_X+workLength*m.distanceScale;
  z+=txt(28,pathY+5,`${name} path: ${fmt(pathLength)} m`,col,18,'start','font-weight="700"');
  z+=txt(28,workY+5,`Work distance d${sub}: ${fmt(workLength)} m`,col,17);
  z+=line(BAR_X,pathY,BAR_X+560,pathY,p.grid,1)+line(BAR_X,workY,BAR_X+560,workY,p.grid,1);
  z+=line(BAR_X,pathY,pathEnd,pathY,col,pathWidth,`stroke-linecap="round" data-comparison-path="${side}" data-distance-m="${pathLength}" data-pixel-length="${pathLength*m.distanceScale}"`);
  z+=line(BAR_X,workY,workEnd,workY,col,Math.max(1.5,pathWidth*.65),`stroke-linecap="butt" data-comparison-work="${side}" data-distance-m="${workLength}" data-pixel-length="${workLength*m.distanceScale}"`);
  z+=line(BAR_X,pathY-8,BAR_X,pathY+8,col,1.5)+line(pathEnd,pathY-8,pathEnd,pathY+8,col,1.5);
  z+=line(BAR_X,workY-6,BAR_X,workY+6,col,1.2)+line(workEnd,workY-6,workEnd,workY+6,col,1.2);
 }
 return z+line(28,194,872,194,p.grid,1);
}
function pathPanel(m,p,pathWidth){
 let z=commonDistances(m,p,pathWidth);
 const different=!eq(m.pathIn,m.distanceIn)||!eq(m.pathOut,m.distanceOut);
 z+=txt(28,236,different?'Path length and work distance are different here.':'Here, path length and work distance are equal.',p.ink,23,'start','font-weight="700"');
 if(m.config.type==='ramp'){
  z+=txt(28,274,'The input rope and box travel the same distance.',p.muted,20);
  z+=txt(28,306,'The box’s weight acts vertically: output work uses its vertical rise.',p.muted,20);
 }else if(isAngularMachine(m.config)){
  z+=txt(28,274,'Arm ends follow arcs. The weights act vertically.',p.muted,20);
  z+=txt(28,306,'Work uses vertical rise or fall, not the curved path length.',p.muted,20);
 }else{
  z+=txt(28,274,'The attached masses move along the direction of the driving forces.',p.muted,20);
  z+=txt(28,306,'Compare their path lengths from the same starting line.',p.muted,20);
 }
 z+=txt(28,360,'Next adds mass squares. These four distance bars stay exactly the same.',p.ink,19);
 return {visual:svg(z,p,`Input path ${fmt(m.pathIn)} metres and work distance ${fmt(m.distanceIn)} metres; output path ${fmt(m.pathOut)} metres and work distance ${fmt(m.distanceOut)} metres. The scale stays fixed across steps.`),caption:m.config.type==='wheel'||m.config.type==='gears'||m.config.type==='screw'?'These are the attached masses’ paths. Unwound rope length equals the corresponding drum-rim arc length.':'Choose each step yourself. The same measured or reference movement is used throughout.'};
}
function factorsPanel(m,p,pathWidth){
 let z=commonDistances(m,p,pathWidth);
 z+=txt(28,225,'Square area represents mass',p.ink,22,'start','font-weight="700"');
 for(const [side,cx,col,mass]of[['input',250,p.blue,m.config.inputMass],['output',680,p.orange,m.config.outputMass]]){
  const size=Math.sqrt(mass*m.massAreaScale),cy=292;
  z+=txt(cx,246,side==='input'?'INPUT':'OUTPUT',col,16,'middle','font-weight="700"');
  z+=`<rect x="${cx-size/2}" y="${cy-size/2}" width="${size}" height="${size}" rx="2" fill="${col}" fill-opacity=".23" stroke="${col}" stroke-width="2" data-mass="${mass}" data-mass-area="${mass*m.massAreaScale}"/>`;
  if(!mass)z+=txt(cx,cy+7,'0',col,22,'middle');
  z+=txt(cx,355,`${fmt(mass)} kg`,col,23,'middle','font-weight="750"');
 }
 z+=txt(28,389,'Twice the mass → twice the square area. Distance bars above have not changed.',p.muted,17);
 const caption=m.massMode?'Next multiplies mass by the work distance. The same gravitational acceleration g appears on both sides.':`There is also ${fmt(m.config.force)} N of applied input force. Next uses total input force × work distance, rather than mass alone.`;
 return {visual:svg(z,p,'Mass squares with proportional areas, beneath the unchanged path and work-distance bars.'),caption};
}
function productPanel(m,p,pathWidth){
 const unit=m.massMode?'kg':'N',productUnit=m.massMode?'kg·m':'J',word=m.massMode?'Mass × work distance':'Force × work distance';
 let z=commonDistances(m,p,pathWidth);
 for(const [side,base,col,factor,distance,product,draw]of[['input',279,p.blue,m.factorIn,m.distanceIn,m.productIn,m.productDrawIn],['output',379,p.orange,m.factorOut,m.distanceOut,m.productOut,m.productDrawOut]]){
  const y=base-draw.height;
  z+=txt(28,base-47,`${side==='input'?'INPUT':'OUTPUT'}: ${fmt(factor)} ${unit}`,col,18,'start','font-weight="700"');
  z+=txt(28,base-21,`× ${fmt(distance)} m`,col,18);
  z+=txt(28,base+5,`= ${fmt(product)} ${productUnit}`,col,20,'start','font-weight="750"');
  z+=line(BAR_X,base,BAR_X+560,base,p.grid,1.5)+line(BAR_X,base,BAR_X,base-70,p.grid,1.5);
  z+=`<rect x="${BAR_X}" y="${y}" width="${draw.width}" height="${draw.height}" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-width="2" data-product="${product}" data-product-area="${draw.width*draw.height}" data-product-width="${draw.width}"/>`;
 }
 const relationship=m.config.type==='gearArms'?(m.equal?'The products are equal over this turn.':'The products differ over this turn.'):(m.equal?'Equal products: the regular input and load balance.':m.productIn>m.productOut?'Input product is larger: it can raise the load.':'Output product is larger: the load tends to lower.');
 let caption=m.config.type==='gearArms'?`${relationship} Gear arms can balance at one angle without staying balanced through a finite turn.`:`${relationship} Rectangle width is the unchanged work distance; height represents ${m.massMode?'mass':'force'}.`;
 if(m.extraDynamics)caption+=' Extra pulling work and losses are accounted for separately.';
 else if(m.massMode)caption+=' Multiplying by g gives work in joules.';
 return {visual:svg(z,p,`${word}: input ${fmt(m.productIn)} ${productUnit}, output ${fmt(m.productOut)} ${productUnit}. Product widths use the same physical-distance scale as all other steps.`),caption,equal:m.equal};
}

/** All phases are manual and static. A captured snapshot keeps dimensions fixed. */
export function renderComparison({config,state={},readout={},phase=0,dark=true,pathWidth=4,reducedMotion=false}={}) {
 const m=buildComparisonModel({config,state,readout}),p=palette(dark),step=clamp(Math.trunc(finite(phase)),0,2),width=clamp(finite(pathWidth,4),1,12);
 const labels=['1. Compare paths','2. Add masses','3. Compare products'];
 const panel=step===0?pathPanel(m,p,width):step===1?factorsPanel(m,p,width):productPanel(m,p,width);
 return `<section class="mc-comparison ${dark?'mc-dark':'mc-light'}" data-comparison-phase="${step}"><div class="mc-step-title">${labels.map((label,i)=>`<span class="${i===step?'mc-active':''}">${label}</span>`).join('')}</div><p class="mc-source">${esc(m.sourceLabel)}</p>${panel.visual}<p class="mc-caption ${panel.equal?'mc-equal':''}">${esc(panel.caption)}</p></section>`;
}
