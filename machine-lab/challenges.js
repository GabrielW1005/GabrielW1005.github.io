/** Original short challenges. Worked hints stop before evaluating either answer. */
import { defaultConfig, normalizeConfig, ratio, GRAVITY, limits } from './physics.js';

const field=(key,label,min,max,step,unit)=>({key,label,min,max,step,unit});
export const machineCatalog=[
  {type:'lever',label:'Lever',shortNote:'A longer input arm travels farther and needs less force. Use vertical rise/fall for work. Loads are constrained to the arm endpoints; swinging is not modeled.',levels:['Short input arms','More leverage','Long input arms'],geometry:[field('rIn','Input arm',.15,3,.05,'m'),field('rOut','Output arm',.15,3,.05,'m')]},
  {type:'ramp',label:'Ramp',shortNote:'The input rope travels along the ramp distance. The output work is weight × vertical rise. Acceleration questions measure motion along the slope.',levels:['Short ramp','Gentler slope','Long ramp'],geometry:[field('length','Ramp length',.3,5,.1,'m'),field('height','Ramp height',.1,2,.1,'m')]},
  {type:'pulley',label:'Pulley',shortNote:'Count the rope segments supporting the moving load. A fixed pulley changes direction; more supporting segments reduce the balance force and increase input travel.',levels:['One supporting rope','Two supporting ropes','Four supporting ropes','Six supporting ropes'],geometry:[{...field('strands','Supporting ropes',1,6,1,''),values:[1,2,4,6]},field('pulleyTravel','Input travel span',.6,1.8,.1,'m'),field('pulleyRadius','Pulley radius',.04,.12,.005,'m')]},
  {type:'wheel',label:'Wheel & axle',shortNote:'The wheel and axle turn together. Rope travel equals radius × angle. A larger input radius gives a force advantage.',levels:['Similar radii','Larger input wheel','High radius ratios'],geometry:[field('rIn','Input radius',.015,.5,.005,'m'),field('rOut','Output radius',.015,.5,.005,'m')]},
  {type:'gears',label:'Gears',shortNote:'Gear teeth change torque and rotation speed. The drum radii determine the forces; tooth-contact forces are equal.',levels:['Low overall ratio','Medium overall ratio','High overall ratio'],geometry:[field('teethIn','Input teeth',8,96,1,''),field('teethOut','Output teeth',8,96,1,''),field('crankRadius','Input drum radius',.03,.3,.01,'m'),field('drumRadius','Output drum radius',.03,.3,.01,'m')]},
  {type:'screw',label:'Screw',shortNote:'One turn moves the input rim through a circumference and raises the guided platform by one lead. The screw does not move up or down.',levels:['Coarse lead','Smaller lead','Smallest lead'],geometry:[field('handleRadius','Input drum radius',.015,.15,.005,'m'),field('lead','Rise per turn',.003,.6,.003,'m')]},
  {type:'wedge',label:'Wedge',shortNote:'A horizontal push on the moving wedge raises the guided load. Compare horizontal advance with vertical rise.',levels:['Steep wedges','Gentler wedges','Shallow wedges'],geometry:[field('length','Horizontal run',.06,.75,.01,'m'),field('height','Wedge rise',.01,.3,.01,'m')]},
  {type:'hydraulic',label:'Syringes',shortNote:'The same water volume leaves one piston and enters the other. A larger output area gives more force but less travel. Fluid head and friction are ignored.',levels:['Similar piston areas','Larger output pistons','High area ratios'],geometry:[field('areaIn','Input piston area',.25,10,.25,'cm²'),field('areaOut','Output piston area',.25,20,.25,'cm²')]}
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
const distances=[.005,.008,.01,.012,.015,.02,.025,.03,.04,.05,.06,.075,.08,.09,.1,.12,.15,.18,.2,.24,.25,.3,.4,.5,.6];
const defaultDistances={lever:.05,ramp:.2,pulley:.2,wheel:.04,gears:.04,screw:.02,wedge:.02,hydraulic:.02};

// Hash the complete variant identifier. Multiplying a variant by 5 modulo a
// 15-value pool would repeat masses every three questions; this does not.
function randomFor(type,version,salt='setup'){
  let seed=2166136261;
  for(const c of `${type}:${version}:${salt}`)seed=Math.imul(seed^c.charCodeAt(0),16777619);
  return ()=>{seed+=0x6D2B79F5;let t=seed;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296;};
}
const choose=(list,rnd)=>list[Math.floor(rnd()*list.length)];
const ratioBands=[[1,1.25,1.5],[2,2.5,3],[4,5,6]];
const rampRatioBands=[[2,2.5,3],[3.5,4,4.5],[5,6,8]];
const gearChoices=new Map();

// Teeth have a common module; drum radii are independent of gear radii.
// Enumerate whole-centimeter drums and integer tooth counts that produce
// the selected overall force/travel ratio exactly, including unequal drums.
function gearsFor(targetRatio){
  if(gearChoices.has(targetRatio))return gearChoices.get(targetRatio);
  const options=[];
  for(const [small,large] of [[1,1],[3,4],[2,3],[1,2],[2,5],[1,3],[1,4],[1,5],[1,6]]){
    for(let scale=1;large*scale<=96;scale++){
      const teethIn=small*scale,teethOut=large*scale;
      if(teethIn<8||teethOut<8)continue;
      for(let outputCm=3;outputCm<=30;outputCm++){
        const inputCm=targetRatio*teethIn/teethOut*outputCm;
        if(inputCm<3-1e-9||inputCm>30+1e-9||Math.abs(inputCm-Math.round(inputCm))>1e-9)continue;
        options.push({teethIn,teethOut,crankRadius:Math.round(inputCm)/100,drumRadius:outputCm/100});
      }
    }
  }
  gearChoices.set(targetRatio,options);
  return options;
}
function setup(type,level,variant){
  const machine=machineCatalog.find(m=>m.type===type)||machineCatalog[0];
  type=machine.type;
  const stage=Math.min(integer(level),machine.levels.length-1),version=integer(variant);
  const band=type==='ramp'?rampRatioBands[stage]:ratioBands[stage];
  // Successive practice setups change geometry even if a mass happens to
  // repeat. The same variant across levels still increases advantage.
  const targetRatio=type==='pulley'?[1,2,4,6][stage]:band[(version+(type==='ramp'&&stage>0?1:0))%band.length];
  const rnd=randomFor(type,version),c={...defaultConfig(type),inputMass:0,force:0,damping:0};
  c.outputMass=version?choose(practiceMasses,rnd):baseMasses[type];
  switch(type){
    case 'lever':c.rOut=version?choose([.2,.25,.3,.35,.4,.45,.5],rnd):.5;c.rIn=c.rOut*targetRatio;break;
    case 'ramp':c.height=version?choose([.2,.25,.3,.35,.4,.5,.6],rnd):.5;c.length=c.height*targetRatio;break;
    case 'pulley':c.strands=targetRatio;c.pulleyTravel=version?[.6,.8,1,1.2,1.4,1.6,1.8][(version-1)%7]:1.2;c.pulleyRadius=version?[.04,.05,.06,.075,.09,.1,.12][(version-1)%7]:.06;break;
    case 'wheel':c.rOut=version?choose([.025,.03,.04,.05,.06,.075,.08],rnd):.05;c.rIn=c.rOut*targetRatio;break;
    case 'gears':if(version)Object.assign(c,choose(gearsFor(targetRatio),rnd));else{c.teethIn=12;c.teethOut=12*targetRatio;c.crankRadius=c.drumRadius=.1;}break;
    case 'screw':{const circumference=version?choose([.18,.24,.3,.36,.42,.48],rnd):.3;c.handleRadius=circumference/(2*Math.PI);c.lead=circumference/targetRatio;break;}
    case 'wedge':c.height=version?choose([.06,.075,.08,.1,.12],rnd):.1;c.length=c.height*targetRatio;break;
    case 'hydraulic':c.areaIn=version?choose([.5,.75,1,1.25,1.5,2,2.5,3],rnd):1;c.areaOut=c.areaIn*targetRatio;break;
  }
  return {machine,stage,version,config:normalizeConfig(c)};
}

/** Numerator/denominator are the geometry ratio d_input / d_output. */
function geometrySetup(c){
  switch(c.type){
    case 'lever':return {num:c.rIn,den:c.rOut,ratioLine:`Ideal MA = input arm / output arm = ${f(c.rIn)} / ${f(c.rOut)}.`,given:`Arms: input ${f(c.rIn)} m; output ${f(c.rOut)} m`};
    case 'ramp':return {num:c.length,den:c.height,ratioLine:`Ideal MA = ramp length / vertical rise = ${f(c.length)} / ${f(c.height)}.`,given:`Ramp length ${f(c.length)} m; vertical rise ${f(c.height)} m`};
    case 'pulley':return {num:c.strands,den:1,ratioLine:`Input travel = ${c.strands} × load rise. Ideal MA = input travel / load rise.`,given:`${c.strands} supporting rope segment${c.strands===1?'':'s'}; input span ${f(c.pulleyTravel)} m; pulley radius ${f(c.pulleyRadius)} m`};
    case 'wheel':return {num:c.rIn,den:c.rOut,ratioLine:`Ideal MA = input radius / output radius = ${f(c.rIn)} / ${f(c.rOut)}.`,given:`Input radius ${f(c.rIn)} m; output radius ${f(c.rOut)} m`};
    case 'gears':return {num:c.teethOut*c.crankRadius,den:c.teethIn*c.drumRadius,ratioLine:`Ideal MA = (output teeth × input radius) / (input teeth × output radius) = (${c.teethOut} × ${f(c.crankRadius)}) / (${c.teethIn} × ${f(c.drumRadius)}).`,given:`${c.teethIn} → ${c.teethOut} teeth; input/output drum radii ${f(c.crankRadius)}/${f(c.drumRadius)} m`};
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
  const {machine,stage,version,config:c}=setup(type,level,variant);
  task=canonicalTask(task);
  const R=ratio(c),geo=geometrySetup(c),balance=task==='balance',balanceForce=c.outputMass*GRAVITY/R;
  const acceleration=task==='acceleration',distance=task==='distance';
  let answer,unknown,unit,mode,prompt,explanation,steps,goalLabel,startFraction=c.type==='lever'?.5:.15;
  const given=[`Output mass: ${f(c.outputMass)} kg`,geo.given,`g = ${GRAVITY} N/kg`];
  let motionDistance,accelerationFrame,accelerationLabel,motion;

  if(distance){
    unknown='distance';unit='m';mode='distance';goalLabel='Reach the marked rise';
    startFraction=c.type==='lever'?.5:.1;
    c.inputMass=c.outputMass/R;c.force=0;
    const lim=limits(c),startQ=lim.min+startFraction*lim.range;
    const available=c.type==='lever'?c.rOut*(Math.sin(lim.max)-Math.sin(startQ)):(lim.max-startQ)/R;
    const fitting=distances.filter(d=>d<=available*.75+1e-10&&![1,2,3].some(n=>Math.abs(d*R-n)<1e-8));
    const visible=fitting.filter(d=>d>=available*.25-1e-10),choices=visible.length?visible:fitting.slice(-1);
    const wanted=version?choose(choices,randomFor(c.type,version,`distance-${stage}`)):defaultDistances[c.type];
    motionDistance=choices.includes(wanted)?wanted:choices[Math.floor(choices.length/2)];
    answer=motionDistance*R;
    const targetQ=c.type==='lever'?Math.asin(Math.sin(startQ)+motionDistance/c.rOut):startQ+answer;
    motion={outputDistance:motionDistance,inputDistance:answer,startFraction,startQ,targetQ,qtarget:targetQ};
    prompt=`The output rises ${f(motionDistance)} m. Find input ${c.type==='lever'?'vertical fall':'travel'} d₁ and ideal MA.`;
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
    answer=version?choose(accelerations,randomFor(c.type,version,`acceleration-${stage}`)):[2.4,3.2,4.8,6][stage];
    c.force=c.type==='ramp'?c.outputMass*(GRAVITY/R+answer):c.outputMass*(GRAVITY+answer)/R;
    accelerationFrame=c.type==='ramp'?'alongRamp':'vertical';
    accelerationLabel=c.type==='ramp'?'Initial acceleration along the ramp':'Initial vertical output acceleration';
    prompt=c.type==='ramp'?`From rest, an input force of ${f(c.force)} N pulls the load up the ramp. Find its initial acceleration along the ramp and ideal MA.`:
      c.type==='lever'?`Starting horizontal and at rest, apply ${f(c.force)} N. Find the output's initial upward acceleration and ideal MA.`:
      `From rest, apply an input force of ${f(c.force)} N. Find the output's initial upward acceleration and ideal MA.`;
    given.push(`Applied input force F₁: ${f(c.force)} N`,'No hanging input mass; machine and rope are massless.');
    if(c.type==='lever')given.push('Starts horizontal, with zero speed.');
    explanation='The unbalanced force changes kinetic energy. Input work exceeds the increase in gravitational potential energy; do not set those two amounts equal.'+(c.type==='lever'?' This answer is the initial acceleration; it changes as the lever tilts.':'');
    steps=[
      'When speed changes: input work − gravitational energy gained = kinetic energy gained.',
      geo.ratioLine,
      c.type==='ramp'?'Along the slope: Fnet = F₁ − mg / ideal MA. Then a = Fnet / m.':
        'The massless machine delivers force F₁ × ideal MA. Net upward force = F₁ × ideal MA − mg; a = Fnet / m.',
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
    prompt=balance?`What input mass exactly balances the ${f(c.outputMass)} kg output load? Also find ideal MA.`:'From rest, find the smallest whole-number input force (N) that starts lifting the load. Also find ideal MA.';
    explanation=balance?'At balance the machine stays still. A heavier input moves the output up; a lighter input lets it move down.':'The exact balance force leaves a resting load still. The smallest whole-number force above it starts lifting; larger forces also lift, but are not the requested minimum.';
    if(!balance)given.push(`Reference: direct steady lifting needs ${f(c.outputMass*GRAVITY)} N.`);
  }
  return {
    id:`${machine.type}-${task}-${stage}-${version}`,type:machine.type,task,level:stage,variant:version,
    title:`${machine.label} · ${machine.levels[stage]}`,
    prompt,config:normalizeConfig(c),unknown,unit,answer,ma:R,idealMechanicalAdvantage:R,
    goalLabel,setupLabel:geo.given,balanceForce,
    steps,given,explanation,note:machine.shortNote,mode,startFraction,motionDistance,motion,
    ...(distance?{targetInputDistance:answer,targetOutputDistance:motionDistance}:{}),
    ...(acceleration?{accelerationFrame,accelerationLabel,initialAcceleration:answer}:{}),
    baseline:Math.abs(R-1)<1e-9,
    practiceLabel:version?`Practice ${version}`:'Core challenge',
    geometryRatio:{numerator:geo.num,denominator:geo.den}
  };
}
