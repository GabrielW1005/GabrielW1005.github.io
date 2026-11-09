/** One editable quantity, exact equilibrium targets, no answer-revealing feedback. */
import {defaultConfig,normalizeConfig,ratio,MAX_MASS} from './physics.js?v=progress-v1';
import {machineCatalog} from './challenges.js?v=progress-v1';
const f=n=>Number(n.toPrecision(8)).toString();
const clean=n=>Number(n.toFixed(10));
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const integer=n=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;
const onGrid=(n,step)=>Math.abs(n/step-Math.round(n/step))<1e-7;
const grid=(a,b,step)=>Array.from({length:Math.floor((b-a)/step+1e-8)+1},(_,i)=>clean(a+i*step));
const choose=(list,n)=>list[n%list.length];
export const horizontalRun=c=>Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height));
export const balanceValue=(c,key)=>key==='rampRun'?horizontalRun(c):c[key];

/** Ramp dimensions are independent: editing height preserves its horizontal base. */
export function applyBalanceValue(config,key,value){
 const c={...config};
 if(c.type==='ramp'&&key==='rampRun'){
  const run=clamp(value,0,Math.sqrt(Math.max(0,25-c.height*c.height)));
  c.length=Math.hypot(run,c.height);
 }else if(c.type==='ramp'&&key==='height'){
  const run=horizontalRun(c);
  c.height=clamp(value,.1,Math.min(2,Math.sqrt(Math.max(0,25-run*run))));
  c.length=Math.hypot(run,c.height);
 }else c[key]=value;
 return normalizeConfig(c);
}

const ratios=[.5,1,1.5,2,2.5,3,4];
const triangles=[[3,4,5],[4,3,5],[5,12,13],[12,5,13],[8,15,17],[15,8,17]];
const gearPairs=[[8,24],[16,16],[24,8],[16,40],[24,40],[12,48],[20,60],[40,24],[24,36],[8,40],[24,48],[16,32]];
const pulleys=[1,2,4,6];
function targetGeometry(type,n){
 const c={...defaultConfig(type),force:0,damping:0},R=choose(ratios,n);
 switch(type){
  case 'lever':{
   const output=grid(.2,1,.05).filter(r=>r*R>=.15&&r*R<=3&&onGrid(r*R,.05));
   c.rOut=choose(output,Math.floor(n/ratios.length));c.rIn=clean(c.rOut*R);break;
  }
  case 'wheel':{
   const output=grid(.03,.2,.005).filter(r=>r*R>=.015&&r*R<=.5&&onGrid(r*R,.005));
   c.rOut=choose(output,Math.floor(n/ratios.length));c.rIn=clean(c.rOut*R);break;
  }
  case 'ramp':{
   const [base,height]=choose(triangles,n),scales=[.1,.2,.3,.4,.5].filter(s=>height*s<=2&&Math.hypot(base,height)*s<=5);
   const scale=choose(scales,Math.floor(n/triangles.length));
   c.height=clean(height*scale);c.length=Math.hypot(clean(base*scale),c.height);break;
  }
  case 'pulley':c.strands=choose(pulleys,n);c.pulleyRadius=choose([.14,.16,.18,.2,.22,.24],n);c.pulleyTravel=choose([.8,1,1.2,1.4,1.6,1.8],n+2);break;
  case 'gears':case 'gearArms':{
   [c.teethIn,c.teethOut]=choose(gearPairs,n);c.crankRadius=c.drumRadius=.1;
   if(type==='gearArms')c.rIn=c.rOut=choose([.25,.3,.35,.4],Math.floor(n/gearPairs.length));break;
  }
  case 'screw':{
   const R=choose([3,4,5,6,8,10],n),circumference=choose([.18,.24,.3,.36,.42,.48].filter(d=>onGrid(d/R,.001)),Math.floor(n/6));
   c.handleRadius=circumference/(2*Math.PI);c.lead=clean(circumference/R);break;
  }
  case 'wedge':{
   const R=choose([1,1.5,2,2.5,3,4,5],n),heights=grid(.04,.2,.01).filter(h=>h*R<=.75&&h*R>=.06&&onGrid(h*R,.01));
   c.height=choose(heights,Math.floor(n/7));c.length=clean(c.height*R);break;
  }
  case 'hydraulic':{
   const areas=grid(.5,5,.25).filter(a=>a*R<=20&&a*R>=.25&&onGrid(a*R,.25));
   c.areaIn=choose(areas,Math.floor(n/ratios.length));c.areaOut=clean(c.areaIn*R);break;
  }
 }
 return normalizeConfig(c);
}
const choices={
 lever:['inputMass','rIn','outputMass','rOut'],
 wheel:['inputMass','rIn','outputMass','rOut'],
 ramp:['inputMass','rampRun','outputMass','height'],
 pulley:['inputMass','outputMass'],
 gears:['inputMass','teethOut','outputMass','teethIn'],
 gearArms:['inputMass','teethOut','outputMass','teethIn'],
 screw:['inputMass','lead','outputMass','lead'],
 wedge:['inputMass','length','outputMass','height'],
 hydraulic:['inputMass','areaOut','outputMass','areaIn']
};
const massFields={inputMass:{label:'Input mass',unit:'kg',min:.5,max:MAX_MASS,step:.5},outputMass:{label:'Output mass',unit:'kg',min:1,max:MAX_MASS,step:.5}};
function fieldFor(c,machine,key){
 if(massFields[key])return {...massFields[key]};
 if(key==='rampRun')return {label:'Horizontal ramp length',unit:'m',min:.1,max:Math.floor(Math.sqrt(25-c.height*c.height)*10+1e-8)/10,step:.1};
 const field={...machine.geometry.find(item=>item.key===key)};
 if(c.type==='ramp'&&key==='height')field.max=Math.min(field.max,Math.floor(Math.sqrt(25-horizontalRun(c)**2)/field.step+1e-8)*field.step);
 if(c.type==='wedge'&&key==='height')field.max=Math.min(field.max,c.length);
 if(c.type==='wedge'&&key==='length')field.min=Math.max(field.min,c.height);
 return field;
}
function givens(c,key){
 const values=[];
 if(key!=='inputMass')values.push(`Input mass: ${f(c.inputMass)} kg`);
 if(key!=='outputMass')values.push(`Output mass: ${f(c.outputMass)} kg`);
 const item=(field,label,value,unit)=>{if(key!==field)values.push(`${label}: ${f(value)}${unit?' '+unit:''}`);};
 switch(c.type){
  case 'lever':item('rIn','Input arm',c.rIn,'m');item('rOut','Output arm',c.rOut,'m');break;
  case 'wheel':item('rIn','Input radius',c.rIn,'m');item('rOut','Output radius',c.rOut,'m');break;
  case 'ramp':item('rampRun','Horizontal length',horizontalRun(c),'m');item('height','Height',c.height,'m');if(key==='inputMass'||key==='outputMass')item('length','Slope length',c.length,'m');break;
  case 'pulley':values.push(`${c.strands} supporting rope segment${c.strands===1?'':'s'}`);break;
  case 'gears':case 'gearArms':item('teethIn','Input gear',c.teethIn,'teeth');item('teethOut','Output gear',c.teethOut,'teeth');values.push(c.type==='gears'?'Equal fixed drums: radius 0.1 m':`Equal fixed arms: ${f(c.rIn)} m · starts horizontal`);break;
  case 'screw':values.push(`Input travel per turn: ${f(2*Math.PI*c.handleRadius)} m`);item('lead','Rise per turn',c.lead,'m');break;
  case 'wedge':item('length','Horizontal run',c.length,'m');item('height','Rise',c.height,'m');break;
  case 'hydraulic':item('areaIn','Input piston area',c.areaIn,'cm²');item('areaOut','Output piston area',c.areaOut,'cm²');break;
 }
 return values;
}
function hintsFor(type){
 const ratioHint={lever:'Compare input arm length / output arm length.',ramp:'Compare slope length / vertical height. Slope length² = horizontal length² + height².',pulley:'Count the rope segments that support the moving load.',wheel:'Compare input radius / output radius.',gears:'The drums are equal. Compare output gear teeth / input gear teeth.',gearArms:'Start with both arms horizontal. Equal arm lengths leave the output-teeth / input-teeth ratio.',screw:'Compare input rim travel per turn / rise per turn.',wedge:'Compare horizontal run / vertical rise.',hydraulic:'Compare output piston area / input piston area.'}[type];
 return ['At balance, input weight × input work distance = output weight × output work distance.','Each weight is mass × g. The same g cancels.',ratioHint,'Adjust only the highlighted quantity, then run from rest to test it.'];
}

export function createBalanceChallenge(type='lever',variant=0){
 const machine=machineCatalog.find(m=>m.type===type)||machineCatalog[0],n=integer(variant);type=machine.type;
 const c=targetGeometry(type,n),R=ratio(c),key=choose(choices[type],n+(type==='pulley'?Math.floor(n/4):0));
 const massPool=grid(4,32,.5).filter(m=>m*R>=4&&m*R<=80&&onGrid(m*R,.5));
 if(!massPool.length)throw new Error(`No clean balance masses for ${type}.`);
 c.inputMass=choose(massPool,n*7+Math.floor(n/5));c.outputMass=clean(c.inputMass*R);
 const field=fieldFor(c,machine,key),answer=clean(balanceValue(c,key));
 const candidates=grid(field.min,field.max,field.step).filter(v=>Math.abs(v-answer)>field.step*.51);
 // A visible imbalance, not an answer already filled into the control.
 const preferred=candidates.filter(v=>v>=answer*.45&&v<=answer*1.65&&Math.abs(v-answer)>=Math.max(field.step,answer*.15));
 const pool=preferred.length?preferred:candidates;
 if(!pool.length)throw new Error(`No initial guess for ${type}/${key}.`);
 const start=choose(pool,n*11+3),config=applyBalanceValue(c,key,start),kind=key.endsWith('Mass')?'mass':'geometry';
 const position=type==='gearArms'?' with both arms horizontal':'';
 return {id:`balance-${type}-${n}`,type,variant:n,config,key,...field,answer,kind,
  title:`${machine.label} · balance`,prompt:`Adjust the ${field.label.toLowerCase()} to balance the machine${position}.`,
  given:givens(c,key),hints:hintsFor(type),startFraction:type==='lever'||type==='gearArms'?.5:.4,
  goalLabel:'Balance from rest',note:type==='gearArms'?'This tests balance at the horizontal position. Turning unequal gears changes the arms’ angles by different amounts.':''};
}
