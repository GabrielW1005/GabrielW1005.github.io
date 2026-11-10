/** Original short challenges. Worked hints stop before evaluating either answer. */
import { defaultConfig, normalizeConfig, ratio, GRAVITY, limits } from './physics.js?v=progress-v1';

const field=(key,label,min,max,step,unit)=>({key,label,min,max,step,unit});
export const machineCatalog=[
  {type:'lever',label:'Lever',shortNote:'A longer input arm travels farther and needs less force; a shorter input arm gives more output travel but needs more force. Use vertical rise/fall for work. Loads stay at the arm endpoints.',levels:['Shorter input arm','Equal arms','Longer input arm','Much longer input arm'],geometry:[field('rIn','Input arm',.15,3,.05,'m'),field('rOut','Output arm',.15,3,.05,'m')]},
  {type:'ramp',label:'Ramp',shortNote:'For balance, hanging mass × diagonal ramp length = mass on ramp × vertical height. A longer ramp needs a smaller hanging mass.',levels:['Short ramp','Gentler slope','Long ramp'],geometry:[field('length','Ramp length',.3,5,.1,'m'),field('height','Ramp height',.1,2,.05,'m')]},
  {type:'pulley',label:'Pulley',shortNote:'Count the rope segments supporting the moving load. A fixed pulley changes direction; more supporting segments reduce the balance force and increase input travel. Pulley diameter does not change this ratio.',levels:['Fixed guides · 1 strand','One moving pulley · 2 strands','Two moving pulleys · 4 strands','Three moving pulleys · 6 strands'],geometry:[field('pulleyTravel','Input travel span',.6,1.8,.1,'m'),field('pulleyRadius','Pulley radius',.08,.32,.01,'m')]},
  {type:'wheel',label:'Wheel & axle',shortNote:'The wheel and axle turn together. Rope travel equals radius × angle. A larger input radius gives a force advantage; a smaller one gives more output travel.',levels:['Smaller input radius','Equal radii','Larger input radius','Much larger input radius'],geometry:[field('rIn','Input radius',.015,.5,.005,'m'),field('rOut','Output radius',.015,.5,.005,'m')]},
  {type:'gears',label:'Gears',shortNote:'The two drum radii stay equal and fixed. The output/input tooth ratio determines the ideal force and travel advantage.',levels:['More output travel','Equal overall ratio','More output force','High force advantage'],geometry:[field('teethIn','Input teeth',8,96,1,''),field('teethOut','Output teeth',8,96,1,'')]},
  {type:'gearArms',label:'Gear arms',balanceOnly:true,shortNote:'Equal arms attach to the gear axles. At the horizontal position, the tooth ratio determines the balancing masses. Unequal gears turn the arms through different angles, so balance can change when displaced.',levels:['Horizontal balance'],geometry:[field('teethIn','Input teeth',8,96,1,''),field('teethOut','Output teeth',8,96,1,'')]},
  {type:'screw',label:'Screw',shortNote:'One turn moves the input rim through a circumference and raises the guided platform by one lead. The screw does not move up or down.',levels:['Coarse lead','Smaller lead','Smallest lead'],geometry:[field('handleRadius','Input drum radius',.015,.15,.005,'m'),field('lead','Rise per turn',.003,.6,.001,'m')]},
  {type:'wedge',label:'Wedge',shortNote:'A horizontal push on the moving wedge raises the guided load. Compare horizontal advance with vertical rise.',levels:['Steep wedges','Gentler wedges','Shallow wedges'],geometry:[field('length','Horizontal run',.06,.75,.01,'m'),field('height','Wedge rise',.01,.3,.01,'m')]},
  {type:'hydraulic',label:'Syringes',shortNote:'The same water volume leaves one piston and enters the other. A larger output area gives more force but less travel; a smaller output area gives more travel but less force. Fluid head and friction are ignored.',levels:['Smaller output piston','Equal piston areas','Larger output piston','Much larger output piston'],geometry:[field('areaIn','Input piston area',.25,10,.25,'cm²'),field('areaOut','Output piston area',.25,20,.25,'cm²')]}
];
export const taskCatalog=[
  {id:'force',label:'Start lifting'},
  {id:'balance',label:'Balance weights'},
  {id:'distance',label:'Find distance'},
  {id:'acceleration',label:'Find acceleration'}
];

const f=n=>Number(Number(n).toPrecision(6)).toString();
const integer=n=>Number.isFinite(Number(n))?Math.max(0,Math.floor(Number(n))):0;
const baseMasses={lever:20,ramp:18,pulley:14,wheel:24,gears:16,screw:30,wedge:21,hydraulic:20};
const practiceMasses=[12,12.5,14,16,17.5,18,20,22,22.5,24,26,27.5,28,30,32,36,40,44,48,52,56,60];
const accelerations=[.4,.5,.6,.8,1.2,1.5,1.6,2.4,2.5,3.2,4,4.8,5,6];
const defaultDistances={lever:.05,ramp:.2,pulley:.2,wheel:.04,gears:.04,screw:.02,wedge:.02,hydraulic:.02};
const onGrid=(n,step)=>Math.abs(n/step-Math.round(n/step))<1e-7;
const grid=(min,max,step)=>Array.from({length:Math.floor((max-min)/step+1e-8)+1},(_,i)=>Number((min+i*step).toFixed(10)));
const bounded=(n,min,max)=>n>=min-1e-9&&n<=max+1e-9;

// Hash the complete variant identifier. Multiplying a variant by 5 modulo a
// 15-value pool would repeat masses every three questions; this does not.
function randomFor(type,version,salt='setup'){
  let seed=2166136261;
  for(const c of `${type}:${version}:${salt}`)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  return ()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const choose=(list,rnd)=>list[Math.floor(rnd()*list.length)];
const ratioBands=[[1,1.25,1.5],[2,2.5,3],[4,5,6]];
const reversibleMachines=new Set(['lever','wheel','gears','hydraulic']);
const reversibleRatioBands=[[.5,.625,.75],[1],[2,2.5,3],[4,5,6]];
const rampRatioBands=[[2,2.5,3],[3.5,4,4.5],[5,6,8]];
const gearChoices=new Map();
const pulleySetups=[
  {label:'Compact',travel:.6,radius:.12},
  {label:'Short travel',travel:.8,radius:.14},
  {label:'Medium travel',travel:1,radius:.16},
  {label:'Standard',travel:1.2,radius:.18},
  {label:'Long travel',travel:1.4,radius:.2},
  {label:'Extended travel',travel:1.6,radius:.22},
  {label:'Longest travel',travel:1.8,radius:.24}
];
const scaleFor=(list,version,core)=>{
  if(!list.length)throw new Error('No compatible geometry on the control grid.');
  return !version&&list.some(n=>Math.abs(n-core)<1e-9)?core:list[(Math.max(1,version)-1)%list.length];
};

function forceForAcceleration(c,R,a){
  return c.type==='ramp'?c.outputMass*(GRAVITY/R+a):c.outputMass*(GRAVITY+a)/R;
}
function cleanAccelerations(c,R){
  return accelerations.filter(a=>onGrid(forceForAcceleration(c,R,a),.01)&&forceForAcceleration(c,R,a)<=1000+1e-9);
}
// Choose compatible givens, rather than rounding an answer after solving.
// Force comparisons retain the same load across levels. Other tasks use
// nearby half-kilogram loads when needed to make the exact result clean.
function setCompatibleMass(c,R,task){
  if(task==='force')return;
  const accepts=m=>task==='acceleration'?
    onGrid(m/R,.01)&&cleanAccelerations({...c,outputMass:m},R).length>0:onGrid(m/R,.5);
  if(accepts(c.outputMass))return;
  const pool=grid(12,reversibleMachines.has(c.type)?30:60,.5).filter(accepts);
  if(!pool.length)throw new Error(`No clean mass for ${c.type}, ratio ${R}.`);
  pool.sort((a,b)=>Math.abs(a-c.outputMass)-Math.abs(b-c.outputMass)||a-b);
  c.outputMass=pool[0];
}
function distanceChoices(R,available,precision){
  const step=10**-precision;
  return grid(step,available*.75,step).filter(d=>onGrid(d*R,step)&&![1,2,3].some(n=>Math.abs(d*R-n)<1e-8));
}

// Equal fixed drums isolate the gear-tooth ratio.
function gearsFor(targetRatio){
  if(gearChoices.has(targetRatio))return gearChoices.get(targetRatio);
  const options=[];
  for(let teethIn=8;teethIn<=96;teethIn++){
    const teethOut=teethIn*targetRatio;
    if(teethOut>=8&&teethOut<=96&&onGrid(teethOut,1))options.push({teethIn,teethOut:Math.round(teethOut),crankRadius:.1,drumRadius:.1});
  }
  gearChoices.set(targetRatio,options);
  return options;
}
function setup(type,level,variant){
  const machine=machineCatalog.find(m=>m.type===type)||machineCatalog[0];
  type=machine.type;
  const stage=Math.min(integer(level),machine.levels.length-1),version=integer(variant);
  const reversible=reversibleMachines.has(type);
  const band=type==='ramp'?rampRatioBands[stage]:reversible?reversibleRatioBands[stage]:ratioBands[stage];
  // Successive practice setups change geometry even if a mass happens to
  // repeat. The same variant across levels still increases advantage.
  const targetRatio=type==='pulley'?[1,2,4,6][stage]:band[(version+(type==='ramp'&&stage>0?1:0))%band.length];
  const rnd=randomFor(type,version),c={...defaultConfig(type),inputMass:0,force:0,damping:0};
  // At MA<1 the input force is larger. A 30 kg maximum keeps even the
  // fastest acceleration question below the simulator's 1000 N cap.
  c.outputMass=version?choose(reversible?practiceMasses.filter(m=>m<=30):practiceMasses,rnd):baseMasses[type];
  let sublevelLabel;
  switch(type){
    case 'lever':c.rOut=scaleFor(grid(.15,3,.05).filter(r=>bounded(r*targetRatio,.15,3)&&onGrid(r*targetRatio,.05)),version,.5);c.rIn=c.rOut*targetRatio;break;
    case 'ramp':c.height=scaleFor(grid(.1,2,.05).filter(h=>bounded(h*targetRatio,.3,5)&&onGrid(h*targetRatio,.1)),version,.5);c.length=c.height*targetRatio;break;
    case 'pulley':{const p=pulleySetups[version?(version-1)%pulleySetups.length:3];c.strands=targetRatio;c.pulleyTravel=p.travel;c.pulleyRadius=p.radius;sublevelLabel=p.label;break;}
    case 'wheel':c.rOut=scaleFor(grid(.015,.5,.005).filter(r=>bounded(r*targetRatio,.015,.5)&&onGrid(r*targetRatio,.005)),version,.05);c.rIn=c.rOut*targetRatio;break;
    case 'gears':{const options=gearsFor(targetRatio);Object.assign(c,options[version?(Math.floor((version-1)/band.length)+stage*3)%options.length:Math.floor(options.length/3)]);break;}
    case 'screw':{const circumference=scaleFor([.18,.24,.3,.36,.42,.48,.54,.6].filter(d=>onGrid(d/targetRatio,.001)),version,.3);c.handleRadius=circumference/(2*Math.PI);c.lead=circumference/targetRatio;break;}
    case 'wedge':c.height=scaleFor(grid(.04,.3,.01).filter(h=>bounded(h*targetRatio,.06,.75)&&onGrid(h*targetRatio,.01)),version,.1);c.length=c.height*targetRatio;break;
    case 'hydraulic':{
      const areas=grid(.25,10,.25).filter(a=>bounded(a*targetRatio,.25,20)&&onGrid(a*targetRatio,.25));
      c.areaIn=scaleFor(areas,version,stage===0?2:1);c.areaOut=c.areaIn*targetRatio;break;
    }
  }
  return {machine,stage,version,sublevelLabel,config:normalizeConfig(c)};
}

/** Numerator/denominator are the geometry ratio d_input / d_output. */
function geometrySetup(c){
  switch(c.type){
    case 'lever':return {num:c.rIn,den:c.rOut,ratioLine:`Ideal MA = input arm / output arm = ${f(c.rIn)} / ${f(c.rOut)}.`,given:`Arms: input ${f(c.rIn)} m; output ${f(c.rOut)} m`};
    case 'ramp':return {num:c.length,den:c.height,ratioLine:`Ideal MA = ramp length / vertical rise = ${f(c.length)} / ${f(c.height)}.`,given:`Ramp length ${f(c.length)} m; vertical rise ${f(c.height)} m`};
    case 'pulley':return {num:c.strands,den:1,ratioLine:`Input travel = ${c.strands} × load rise. Ideal MA = input travel / load rise.`,given:`${c.strands} supporting rope segment${c.strands===1?'':'s'}; input span ${f(c.pulleyTravel)} m; pulley radius ${f(c.pulleyRadius)} m`};
    case 'wheel':return {num:c.rIn,den:c.rOut,ratioLine:`Ideal MA = input radius / output radius = ${f(c.rIn)} / ${f(c.rOut)}.`,given:`Input radius ${f(c.rIn)} m; output radius ${f(c.rOut)} m`};
    case 'gears':return {num:c.teethOut,den:c.teethIn,ratioLine:`Equal fixed drum radii cancel. Ideal MA = output teeth / input teeth = ${c.teethOut} / ${c.teethIn}.`,given:`${c.teethIn} → ${c.teethOut} teeth; equal fixed drum radius 0.1 m`};
    case 'screw':return {num:2*Math.PI*c.handleRadius,den:c.lead,ratioLine:`Per turn, input travel = 2πr = ${f(2*Math.PI*c.handleRadius)} m; rise = ${f(c.lead)} m. Ideal MA = input travel / rise.`,given:`Per turn: input rim travel ${f(2*Math.PI*c.handleRadius)} m; rise ${f(c.lead)} m`};
    case 'wedge':return {num:c.length,den:c.height,ratioLine:`Ideal MA = horizontal advance / vertical rise = ${f(c.length)} / ${f(c.height)}.`,given:`Horizontal run ${f(c.length)} m; vertical rise ${f(c.height)} m`};
    case 'hydraulic':return {num:c.areaOut,den:c.areaIn,ratioLine:`A₁d₁ = A₂d₂. Ideal MA = d₁ / d₂ = output area / input area = ${f(c.areaOut)} / ${f(c.areaIn)}.`,given:`Input area ${f(c.areaIn)} cm²; output area ${f(c.areaOut)} cm²`};
  }
}
function canonicalTask(task){
  if(task==='balance'||task==='inputMass')return 'balance';
  if(task==='distance'||task==='d1'||task==='inputDistance')return 'distance';
  if(task==='acceleration'||task==='a')return 'acceleration';
  return 'force';
}

export function createChallenge(type,task='force',level=0,variant=0){
  if(type==='gearArms'){const c={...defaultConfig(type),rIn:.35,rOut:.35,teethIn:24,teethOut:48,inputMass:6,outputMass:20,force:0,damping:0};return {id:`gearArms-balance-${integer(variant)}`,type,task:'balance',level:0,variant:integer(variant),title:'Gear arms · horizontal balance',prompt:'Find the input mass that balances the horizontal arms.',config:c,unknown:'inputMass',unit:'kg',answer:10,ma:2,idealMechanicalAdvantage:2,goalLabel:'Balance horizontally',setupLabel:'24 → 48 teeth; equal 0.35 m arms',balanceForce:40,answerPrecision:1,answerStep:.5,steps:['Start with both arms horizontal.','Equal arm lengths leave output teeth / input teeth as the balancing ratio.','m₁ × output teeth = m₂ × input teeth.','Substitute the two masses and tooth counts, then solve.'],given:['Output mass: 20 kg','Input gear: 24 teeth; output gear: 48 teeth','Equal fixed arms: 0.35 m'],mode:'balance',startFraction:.5,geometryRatio:{numerator:48,denominator:24}};}
  const {machine,stage,version,sublevelLabel,config:c}=setup(type,level,variant);
  // The ramp activity now asks only for a balancing mass or diagonal length.
  // Its UI uses createBalanceChallenge for both kinds. Keep older callers and
  // saved task selections on a valid mass question instead of resurfacing a
  // force, acceleration, or rope-travel question.
  task=c.type==='ramp'?'balance':canonicalTask(task);
  const R=ratio(c);
  setCompatibleMass(c,R,task);
  const geo=geometrySetup(c),balance=task==='balance',balanceForce=c.outputMass*GRAVITY/R;
  const acceleration=task==='acceleration',distance=task==='distance';
  let answer,unknown,unit,mode,prompt,explanation,steps,goalLabel,startFraction=c.type==='lever'?.5:.15;
  const given=[`Output mass: ${f(c.outputMass)} kg`,geo.given,`g = ${GRAVITY} N/kg`];
  let motionDistance,accelerationFrame,accelerationLabel,motion,answerPrecision=task==='force'?0:1;

  if(distance){
    unknown='distance';unit='m';mode='distance';goalLabel='Reach the marked rise';
    startFraction=c.type==='lever'?.5:.1;
    c.inputMass=c.outputMass/R;c.force=0;
    const lim=limits(c),startQ=lim.min+startFraction*lim.range;
    const available=c.type==='lever'?c.rOut*(Math.sin(lim.max)-Math.sin(startQ)):(lim.max-startQ)/R;
    const hundredths=distanceChoices(R,available,2);
    answerPrecision=hundredths.length?2:3;
    const fitting=hundredths.length?hundredths:distanceChoices(R,available,3);
    if(!fitting.length)throw new Error(`No clean distance fits ${c.type}, ratio ${R}.`);
    const visible=fitting.filter(d=>d>=available*.25-1e-10),choices=visible.length?visible:fitting.slice(-1);
    const wanted=version?choose(choices,randomFor(c.type,version,`distance-${stage}`)):defaultDistances[c.type];
    motionDistance=choices.includes(wanted)?wanted:choices[Math.floor(choices.length/2)];
    answer=motionDistance*R;
    const targetQ=c.type==='lever'?Math.asin(Math.sin(startQ)+motionDistance/c.rOut):startQ+answer;
    motion={outputDistance:motionDistance,inputDistance:answer,startFraction,startQ,targetQ,qtarget:targetQ};
    prompt=`The output rises ${f(motionDistance)} m. Find input ${c.type==='lever'?'vertical fall':'travel'} d₁.`;
    given.push(`Requested output rise d₂: ${f(motionDistance)} m`,'The weights are balanced. Test your calculated input travel.');
    explanation=c.type==='lever'?'Use the vertical fall and rise for work. The endpoints follow curved arcs, whose lengths are different from these work distances.':'Balanced weights allow a slow comparison of the connected input and output movements.';
    steps=[
      'For an ideal machine in balance or steady motion, F₁d₁ = F₂d₂.',
      geo.ratioLine,
      'd₁ / d₂ = ideal MA, so d₁ = d₂ × ideal MA.',
      `d₁ = ${f(motionDistance)} × (${f(geo.num)} / ${f(geo.den)}) m. Complete the calculation yourself.`,
      c.type==='lever'?'These are vertical work distances, not arc lengths.':'Use the same units for both distances.'
    ];
  }else if(acceleration){
    unknown='acceleration';unit='m/s²';mode='acceleration';goalLabel='Find initial acceleration';
    c.inputMass=0;
    const options=cleanAccelerations(c,R),core=[2.4,3.2,4.8,6][stage];
    answer=!version&&options.includes(core)?core:choose(options,randomFor(c.type,version,`acceleration-${stage}`));
    c.force=forceForAcceleration(c,R,answer);
    accelerationFrame=c.type==='ramp'?'alongRamp':'vertical';
    accelerationLabel=c.type==='ramp'?'Initial acceleration along the ramp':'Initial vertical output acceleration';
    prompt=c.type==='ramp'?`From rest, an input force of ${f(c.force)} N pulls the load up the ramp. Find its initial acceleration along the ramp.`:
      c.type==='lever'?`Starting horizontal and at rest, apply ${f(c.force)} N. Find the output's initial upward acceleration.`:
      `From rest, apply an input force of ${f(c.force)} N. Find the output's initial upward acceleration.`;
    given.push(`Applied input force F₁: ${f(c.force)} N`,'No hanging input mass; machine and rope are massless.');
    if(c.type==='lever')given.push('Starts horizontal, with zero speed.');
    explanation='Extra input work changes kinetic energy and, with resistance enabled, also produces heat. Do not set input work equal to the increase in gravitational potential energy while accelerating.'+(c.type==='lever'?' This answer is the initial acceleration; it changes as the lever tilts.':'');
    steps=[
      'Before travel stops: input work − gravitational energy gained = kinetic energy gained + heat (zero with resistance off).',
      geo.ratioLine,
      c.type==='ramp'?'Initially, with zero drag at rest, along the slope: Fnet = F₁ − mg / ideal MA. Then a = Fnet / m.':
        'Initially, with zero drag at rest, the massless machine delivers force F₁ × ideal MA. Net upward force = F₁ × ideal MA − mg; a = Fnet / m.',
      c.type==='ramp'?`a = [${f(c.force)} − (${f(c.outputMass)} × ${GRAVITY} × ${f(geo.den)} / ${f(geo.num)})] / ${f(c.outputMass)} m/s².`:
        `a = [${f(c.force)} × (${f(geo.num)} / ${f(geo.den)}) − ${f(c.outputMass)} × ${GRAVITY}] / ${f(c.outputMass)} m/s².`,
      c.type==='lever'?'This expression applies at the horizontal starting position. Calculate the result yourself.':'Do not cancel g from the net-force equation. Calculate the result yourself.'
    ];
  }else{
    unknown=balance?'inputMass':'force';unit=balance?'kg':'N';mode=balance?'balance':'minimum';
    goalLabel=balance?'Balance exactly':'Start lifting';
    answer=balance?c.outputMass/R:Math.floor(balanceForce+1e-9)+1;
    if(balance){const starting=Math.max(1,Math.min(80,Math.round(answer*.6+1)));c.inputMass=Math.abs(starting-answer)<.01?starting+2:starting;}
    const sub=balance?`m₁ = (${f(c.outputMass)} × ${f(geo.den)}) / ${f(geo.num)}`:`F₁ = (${f(c.outputMass)} × ${GRAVITY} × ${f(geo.den)}) / ${f(geo.num)}`;
    steps=balance?[
      'At balance: F₁d₁ = F₂d₂. Each weight is mass × g.',
      'm₁g d₁ = m₂g d₂. The same g cancels: m₁ = m₂d₂ / d₁.',
      geo.ratioLine,
      `${sub}. Complete the division yourself.`,
      'Ideal MA is the geometry ratio d₁ / d₂ above.'
    ]:[
      'At the ideal balance threshold: F₁d₁ = F₂d₂.',
      `Output weight: F₂ = m₂g = ${f(c.outputMass)} × ${GRAVITY} N.`,
      geo.ratioLine,
      `Balance force = F₂d₂ / d₁. ${sub}. Complete the division yourself.`,
      'The exact balance force does not start motion. Choose the smallest whole number of newtons strictly greater than that force.',
      'Ideal MA comes from geometry, not from dividing the weight by your slightly larger lifting force.'
    ];
    prompt=balance?`What input mass exactly balances the ${f(c.outputMass)} kg output load?`:'From rest, find the smallest whole-number input force (N) that starts lifting the load.';
    explanation=balance?'At balance the machine stays still. A heavier input moves the output up; a lighter input lets it move down.':'The exact balance force leaves a resting load still. The smallest whole-number force above it starts lifting; larger forces also lift, but are not the requested minimum.';
    if(!balance)given.push(`Reference: direct steady lifting needs ${f(c.outputMass*GRAVITY)} N.`);
  }
  return {
    id:`${machine.type}-${task}-${stage}-${version}`,type:machine.type,task,level:stage,variant:version,
    title:`${machine.label} · ${machine.levels[stage]}`,
    prompt,config:normalizeConfig(c),unknown,unit,answer,ma:R,idealMechanicalAdvantage:R,
    goalLabel,setupLabel:sublevelLabel?`${sublevelLabel} · ${geo.given}`:geo.given,sublevelLabel,balanceForce,
    answerPrecision,answerStep:task==='balance'?.5:10**-answerPrecision,
    steps,given,explanation,note:machine.shortNote,mode,startFraction,motionDistance,motion,
    ...(distance?{targetInputDistance:answer,targetOutputDistance:motionDistance}:{}),
    ...(acceleration?{accelerationFrame,accelerationLabel,initialAcceleration:answer}:{}),
    baseline:Math.abs(R-1)<1e-9,
    practiceLabel:version?`Practice ${version}`:'Core challenge',
    geometryRatio:{numerator:geo.num,denominator:geo.den}
  };
}
