/** Snapshot comparison of real paths, force-aligned distances and work products. */
import {normalizeConfig, ratio, limits, GRAVITY} from './physics.js';
import {trajectoryGeometry} from './scene.js';

const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const finite=(n,fallback=0)=>Number.isFinite(Number(n))?Number(n):fallback;
const fmt=n=>Number.isFinite(n)?(Math.abs(n)<1e-10?'0':Number(n.toPrecision(4)).toString()):'—';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const eq=(a,b)=>Math.abs(a-b)<=1e-9*Math.max(1e-12,Math.abs(a),Math.abs(b));
const positive=n=>Math.max(0,finite(n));

/** Pure numerical model; signed work is retained and drawing lengths are positive. */
export function buildComparisonModel({config,state={},readout={}}={}) {
 const c=normalizeConfig(config),lim=limits(c),R=ratio(c);
 let q0=clamp(finite(state.q0,finite(state.q,lim.min)),lim.min,lim.max),q=clamp(finite(state.q,q0),lim.min,lim.max);
 const reference=Math.abs(q-q0)<1e-8;
 if(reference){q0=c.type==='lever'?0:lim.min+.15*lim.range;q=c.type==='lever'?Math.min(.22,lim.max):lim.min+.55*lim.range;}
 const dq=q-q0,vertical=c.type==='lever'?Math.sin(q)-Math.sin(q0):dq;
 const signedIn=c.type==='lever'?c.rIn*vertical:dq,signedOut=c.type==='lever'?c.rOut*vertical:dq/R;
 const distanceIn=Math.abs(signedIn),distanceOut=Math.abs(signedOut);
 const pathIn=c.type==='lever'?c.rIn*Math.abs(dq):Math.abs(dq);
 const pathOut=c.type==='lever'?c.rOut*Math.abs(dq):c.type==='ramp'?Math.abs(dq):Math.abs(dq)/R;
 const forceIn=c.inputMass*GRAVITY+c.force,forceOut=c.outputMass*GRAVITY;
 const massMode=c.force<=1e-10;
 const factorIn=massMode?c.inputMass:forceIn,factorOut=massMode?c.outputMass:forceOut;
 const productIn=factorIn*distanceIn,productOut=factorOut*distanceOut;
 const equal=eq(productIn,productOut),signedWorkIn=forceIn*signedIn,signedWorkOut=forceOut*signedOut;
 const hadPull=Math.abs(finite(readout.pointerWork))>1e-8||Math.abs(finite(readout.externalInputForce))>1e-8||Math.abs(finite(readout.externalOutputForce))>1e-8;
 const dissipation=positive(readout.dampingEnergyLoss)+positive(readout.stopEnergyLoss);
 const extraDynamics=hadPull||dissipation>1e-8;
 const geometry=trajectoryGeometry(c,{...state,q0,q},readout);
 const factorScale=122/Math.max(1,factorIn,factorOut),distanceScale=560/Math.max(distanceIn,distanceOut,1e-12);
 const massAreaScale=125**2/Math.max(c.inputMass,c.outputMass,1);
 return {config:c,R,q0,q,reference,geometry,pathIn,pathOut,distanceIn,distanceOut,
  signedIn,signedOut,forceIn,forceOut,massMode,factorIn,factorOut,productIn,productOut,equal,
  signedWorkIn,signedWorkOut,regularWorkDifference:signedWorkIn-signedWorkOut,extraDynamics,hadPull,dissipation,
  factorScale,distanceScale,massAreaScale,
  productDrawIn:{width:distanceIn*distanceScale,height:factorIn*factorScale},
  productDrawOut:{width:distanceOut*distanceScale,height:factorOut*factorScale},
  sourceLabel:reference?'Reference movement · current and starting positions match':'Measured movement · starting position to current position',
  workNote:c.type==='lever'?'Lever ends follow arcs. Weight does work through vertical rise or fall, so use the vertical distances.':c.type==='ramp'?'The box travels along the slope. Its weight acts vertically, so output work uses vertical rise.':'Rope or piston travel gives the distance along the applied force.',
 };
}

function palette(dark){return dark?{bg:'#111b2c',ink:'#edf3ff',muted:'#a8b8cf',grid:'#35455f',blue:'#80b6ff',orange:'#ffb777'}:{bg:'#ffffff',ink:'#22334b',muted:'#5b6d85',grid:'#c8d2df',blue:'#2161b9',orange:'#b85713'};}
const txt=(x,y,s,color,size=20,anchor='start',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const line=(x1,y1,x2,y2,color,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
const pathD=points=>points.map((p,i)=>`${i?'L':'M'}${fmt(p[0])} ${fmt(p[1])}`).join(' ');
function svg(body,p,label,height=440){return `<svg class="mc-visual" viewBox="0 0 900 ${height}" role="img" aria-label="${esc(label)}" xmlns="http://www.w3.org/2000/svg" style="background:${p.bg}"><g font-family="system-ui,-apple-system,Segoe UI,sans-serif">${body}</g></svg>`;}
function sourcePoints(model,side){
 const shape=model.geometry?.[side];
 if(Array.isArray(shape?.livePoints)&&shape.livePoints.length>1&&shape.livePoints.every(p=>p.every(Number.isFinite)))return {points:shape.livePoints,pxPerMeter:Math.max(1e-9,finite(shape.pxPerMeter,1))};
 // Analytical straight path fallback is only used for missing renderer metadata.
 const length=side==='input'?model.pathIn:model.pathOut;
 return {points:[[0,0],[0,length]],pxPerMeter:1};
}
function pathPanel(m,p,pathWidth){
 const max=Math.max(m.pathIn,m.pathOut,1e-9),scale=600/max;
 let z=txt(38,35,'Move both paths to the same starting line',p.ink,24);
 z+=txt(38,65,'Rotate, straighten and align the paths. Both use the same metre scale.',p.muted,17);
 for(const [side,row,col,length]of[['input',170,p.blue,m.pathIn],['output',320,p.orange,m.pathOut]]){
  const s=sourcePoints(m,side),first=s.points[0],last=s.points.at(-1),dx=last[0]-first[0],dy=last[1]-first[1];
  // Rotate the real curve so its chord is horizontal, preserving its physical
  // length at the same metre scale used by the final straight segments.
  const angle=-Math.atan2(dy,dx),cs=Math.cos(angle),sn=Math.sin(angle);
  const original=s.points.map(pt=>{const x=(pt[0]-first[0])/s.pxPerMeter*scale,y=(pt[1]-first[1])/s.pxPerMeter*scale;return [205+x*cs-y*sn,row-24+x*sn+y*cs];});
  const aligned=s.points.map((_,i)=>[230+length*scale*i/(s.points.length-1),row]);
  const a=pathD(aligned),b=pathD(original);
  z+=txt(38,row-12,side==='input'?'INPUT':'OUTPUT',col,19,'start','font-weight="700"')+txt(38,row+20,`${fmt(length)} m`,col,25,'start','font-weight="750"');
  z+=line(230,row+18,830,row+18,p.grid,1)+line(230,row-40,230,row+32,p.grid,1,'stroke-dasharray="4 5"');
  z+=`<path d="${a}" fill="none" stroke="${col}" stroke-width="${pathWidth}" stroke-linecap="round" stroke-linejoin="round"><animate attributeName="d" from="${b}" to="${a}" dur="1.25s" fill="freeze"/></path>`;
  z+=`<circle cx="${230+length*scale}" cy="${row}" r="4" fill="${col}" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="1.25s" dur=".15s" fill="freeze"/></circle>`;
 }
 z+=txt(38,398,m.config.type==='ramp'?'Ramp: rope travel = box travel along the slope.':m.config.type==='lever'?'Lever: both ends turn through the same angle.':'Compare the paths of the attached masses.',p.muted,18);
 const note=m.config.type==='wheel'||m.config.type==='gears'||m.config.type==='screw'?'These are the attached masses’ paths. At a drum, unwound rope length equals the corresponding rim arc length.':m.workNote;
 return svg(z,p,`Input path ${fmt(m.pathIn)} metres; output path ${fmt(m.pathOut)} metres, shown on one scale.`)+`<p class="mc-note">${esc(note)}</p>`;
}
function factorsPanel(m,p,pathWidth){
 let z=txt(38,35,'Compare mass area and work distance',p.ink,24)+txt(38,65,'A square’s area represents its mass. Distance bars share one scale.',p.muted,17);
 const scale=460/Math.max(m.distanceIn,m.distanceOut,1e-12);
 for(const [side,row,col,mass,distance]of[['input',175,p.blue,m.config.inputMass,m.distanceIn],['output',340,p.orange,m.config.outputMass,m.distanceOut]]){
  const size=Math.sqrt(mass*m.massAreaScale),x=112-size/2,y=row-size/2;
  z+=`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="2" fill="${col}" fill-opacity=".23" stroke="${col}" stroke-width="2" data-mass="${mass}" data-mass-area="${mass*m.massAreaScale}"/>`;
  if(!mass)z+=txt(112,row,'0',col,24,'middle');
  z+=txt(112,row+size/2+30,`${fmt(mass)} kg`,col,23,'middle','font-weight="750"');
  z+=txt(270,row-30,side==='input'?'INPUT WORK DISTANCE d₁':'OUTPUT WORK DISTANCE d₂',col,18,'start','font-weight="650"');
  z+=line(270,row,270+distance*scale,row,col,pathWidth,'stroke-linecap="round"')+line(270,row-12,270,row+12,col,2)+line(270+distance*scale,row-12,270+distance*scale,row+12,col,2);
  z+=txt(270,row+38,`${fmt(distance)} m`,col,25,'start','font-weight="750"');
 }
 z+=txt(38,478,m.massMode?'Mass × vertical work distance: the same g appears on both sides.':`Input also has ${fmt(m.config.force)} N applied force. Next compare total force × distance.`,p.muted,17);
 return svg(z,p,'Mass squares with proportional areas, beside force-aligned distance bars.',510)+`<p class="mc-note">${esc(m.workNote)}</p>`;
}
function productPanel(m,p){
 const label=m.massMode?'Mass':'Force',unit=m.massMode?'kg':'N',productUnit=m.massMode?'kg·m':'J',word=m.massMode?'Mass × work distance':'Force × work distance';
 let z=txt(38,35,word,p.ink,24)+txt(38,65,`Rectangle height = ${label.toLowerCase()} (${unit}); width = work distance (m). Same scales for both.`,p.muted,17);
 for(const [side,base,col,factor,distance,product,draw]of[['input',226,p.blue,m.factorIn,m.distanceIn,m.productIn,m.productDrawIn],['output',429,p.orange,m.factorOut,m.distanceOut,m.productOut,m.productDrawOut]]){
  const x=245,y=base-draw.height;
  z+=txt(38,base-77,side==='input'?'INPUT':'OUTPUT',col,18,'start','font-weight="700"');
  z+=txt(38,base-43,`${fmt(factor)} ${unit}`,col,23,'start','font-weight="750"');
  z+=txt(38,base-10,`× ${fmt(distance)} m`,col,21);
  z+=line(x,base,x+570,base,p.grid,1.5)+line(x,base,x,base-133,p.grid,1.5);
  z+=`<rect x="${x}" y="${y}" width="${draw.width}" height="${draw.height}" fill="${col}" fill-opacity=".28" stroke="${col}" stroke-width="2" data-product="${product}" data-product-area="${draw.width*draw.height}"><animate attributeName="width" from="0" to="${draw.width}" dur="1s" fill="freeze"/></rect>`;
  z+=txt(245,base+27,`Area represents ${fmt(product)} ${productUnit}`,col,20,'start','font-weight="700"');
 }
 const relationship=m.equal?'Equal products · the regular input and load balance':m.productIn>m.productOut?'Input product is larger · it can raise the load':'Output product is larger · the load tends to lower';
 const displayIn=Number(fmt(m.factorIn))*Number(fmt(m.distanceIn)),displayOut=Number(fmt(m.factorOut))*Number(fmt(m.distanceOut)),equalMark=Math.abs(displayIn-displayOut)<1e-8*Math.max(1,Math.abs(displayIn),Math.abs(displayOut))?'=':'≈';
 let explanation=m.massMode?`${fmt(m.factorIn)} × ${fmt(m.distanceIn)} ${m.equal?equalMark:'≠'} ${fmt(m.factorOut)} × ${fmt(m.distanceOut)}. Multiplying both sides by g converts kg·m to joules.`:`${fmt(m.forceIn)} × ${fmt(m.distanceIn)} ${m.equal?equalMark:'≠'} ${fmt(m.forceOut)} × ${fmt(m.distanceOut)} J.`;
 if(m.extraDynamics)explanation+=' Extra pulling work and energy lost to damping or stops are accounted for separately in the simulator.';
 else if(!m.equal)explanation+=' The difference in regular work changes kinetic energy or is dissipated by damping/stops.';
 else if(m.reference)explanation+=' At rest these are reference distances; no actual work is done without movement.';
 else explanation+=' The regular input and load transfer equal amounts of work over this movement.';
 return svg(z,p,`${word}: input ${fmt(m.productIn)} ${productUnit}, output ${fmt(m.productOut)} ${productUnit}.`,470)+`<p class="mc-result ${m.equal?'mc-equal':''}">${esc(relationship)}</p><p class="mc-note">${esc(explanation)}</p>`;
}

/** Mount once per phase, using a snapshot. Re-mounting replays the alignment. */
export function renderComparison({config,state={},readout={},phase=0,dark=true,pathWidth=4,reducedMotion=false}={}) {
 const m=buildComparisonModel({config,state,readout}),p=palette(dark),step=clamp(Math.trunc(finite(phase)),0,2),width=clamp(finite(pathWidth,4),1,12);
 const labels=['1. Align paths','2. Masses & distances','3. Compare products'];
 const html=`<section class="mc-comparison ${dark?'mc-dark':'mc-light'}" data-comparison-phase="${step}"><div class="mc-step-title">${labels.map((label,i)=>`<span class="${i===step?'mc-active':''}">${label}</span>`).join('')}</div><p class="mc-source">${esc(m.sourceLabel)}</p>${step===0?pathPanel(m,p,width):step===1?factorsPanel(m,p,width):productPanel(m,p)}</section>`;
 return reducedMotion?html.replace(/<animate\b[^>]*\/>/g,''):html;
}
