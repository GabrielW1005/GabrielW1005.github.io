/** Original short challenges. Hints deliberately stop before the final answers. */
import { defaultConfig, normalizeConfig, ratio, GRAVITY } from './physics.js';

const field=(key,label,min,max,step,unit)=>({key,label,min,max,step,unit});
export const machineCatalog=[
  {type:'lever',label:'Lever',shortNote:'A longer input arm travels farther and needs less force. Use vertical rise/fall for work. Loads are constrained to the arm endpoints; swinging is not modeled.',levels:['Equal arms','Longer arm','Longest arm'],geometry:[field('rIn','Input arm',.15,3,.05,'m'),field('rOut','Output arm',.15,3,.05,'m')]},
  {type:'ramp',label:'Ramp',shortNote:'The input rope travels along the ramp distance. The output work is weight × vertical rise.',levels:['Direct lift','Gentler slope','Long ramp'],geometry:[field('length','Ramp length',.3,5,.1,'m'),field('height','Ramp height',.1,2,.1,'m')]},
  {type:'pulley',label:'Pulley',shortNote:'Count the rope segments supporting the moving load. A fixed pulley changes direction; two supporting segments halve the required force.',levels:['One supporting rope','Two supporting ropes'],geometry:[field('strands','Supporting ropes',1,2,1,'')]},
  {type:'wheel',label:'Wheel & axle',shortNote:'The wheel and axle turn together. Rope travel equals radius × angle. A larger input radius gives a force advantage.',levels:['Equal radii','Larger wheel','Largest wheel'],geometry:[field('rIn','Input radius',.015,.5,.005,'m'),field('rOut','Output radius',.015,.5,.005,'m')]},
  {type:'gears',label:'Gears',shortNote:'Gear teeth change torque and rotation speed. The crank and drum radii determine the forces; tooth-contact forces are equal.',levels:['Equal gears','Larger driven gear','Largest driven gear'],geometry:[field('teethIn','Input teeth',8,96,1,''),field('teethOut','Output teeth',8,96,1,''),field('crankRadius','Input drum radius',.03,.3,.01,'m'),field('drumRadius','Output drum radius',.03,.3,.01,'m')]},
  {type:'screw',label:'Screw',shortNote:'One turn moves the input rim through a circumference and raises the guided platform by one lead. The screw does not move up or down.',levels:['Coarse lead','Smaller lead','Smallest lead'],geometry:[field('handleRadius','Input drum radius',.015,.15,.005,'m'),field('lead','Rise per turn',.003,.6,.003,'m')]},
  {type:'wedge',label:'Wedge',shortNote:'A horizontal push on the moving wedge raises the guided load. Compare horizontal advance with vertical rise.',levels:['Equal travel','Longer wedge','Longest wedge'],geometry:[field('length','Horizontal run',.06,.75,.01,'m'),field('height','Wedge rise',.01,.3,.01,'m')]},
  {type:'hydraulic',label:'Syringes',shortNote:'The same water volume leaves one piston and enters the other. A larger output area gives more force but less travel. Fluid head and friction are ignored.',levels:['Equal areas','Larger output piston','Largest output piston'],geometry:[field('areaIn','Input piston area',.25,10,.25,'cm²'),field('areaOut','Output piston area',.25,20,.25,'cm²')]}
];

const f=n=>Number(Number(n).toPrecision(6)).toString();
const baseMasses={lever:20,ramp:18,pulley:14,wheel:24,gears:16,screw:30,wedge:21,hydraulic:20};
const practiceMasses=[12,14,16,18,20,24,28,30,32,36,40,44,48,56,60];

function setup(type,level,variant){
  const machine=machineCatalog.find(m=>m.type===type)||machineCatalog[0];
  type=machine.type;
  const stage=Math.min(Math.max(0,Math.floor(Number(level)||0)),machine.levels.length-1);
  const version=Math.max(0,Math.floor(Number(variant)||0));
  const targetRatio=[1,2,4][stage];
  const c={...defaultConfig(type),inputMass:0,force:0};
  c.outputMass=version?practiceMasses[(machineCatalog.indexOf(machine)*3+version*5)%practiceMasses.length]:baseMasses[type];
  switch(type){
    case 'lever':c.rOut=version?.3+.1*(version%4):.5;c.rIn=c.rOut*targetRatio;break;
    case 'ramp':c.height=version?.4+.1*(version%6):.5;c.length=c.height*targetRatio;break;
    case 'pulley':c.strands=targetRatio;break;
    case 'wheel':c.rOut=version?.03+.01*(version%6):.05;c.rIn=c.rOut*targetRatio;break;
    case 'gears':c.teethIn=version?12+4*(version%4):12;c.teethOut=c.teethIn*targetRatio;c.crankRadius=c.drumRadius=version?.06+.02*(version%5):.1;break;
    case 'screw':{const circumference=version?.24+.06*(version%5):.3;c.handleRadius=circumference/(2*Math.PI);c.lead=circumference/targetRatio;break;}
    case 'wedge':c.height=version?.06+.02*(version%5):.1;c.length=c.height*targetRatio;break;
    case 'hydraulic':c.areaIn=version?.5+.25*(version%5):1;c.areaOut=c.areaIn*targetRatio;break;
  }
  return {machine,stage,version,config:normalizeConfig(c)};
}

/** Geometry numerators/denominators express d_input / d_output without evaluating MA. */
function geometrySetup(c){
  switch(c.type){
    case 'lever':return {num:c.rIn,den:c.rOut,ratioLine:`d₁ / d₂ = input arm / output arm = ${f(c.rIn)} / ${f(c.rOut)}`,given:`Arms: input ${f(c.rIn)} m; output ${f(c.rOut)} m`};
    case 'ramp':return {num:c.length,den:c.height,ratioLine:`d₁ / d₂ = ramp length / vertical rise = ${f(c.length)} / ${f(c.height)}`,given:`Ramp ${f(c.length)} m; rise ${f(c.height)} m`};
    case 'pulley':return {num:c.strands,den:1,ratioLine:`Input travel = ${c.strands} × load rise. MA = input travel / load rise.`,given:`${c.strands} supporting rope segment${c.strands===1?'':'s'}`};
    case 'wheel':return {num:c.rIn,den:c.rOut,ratioLine:`d₁ / d₂ = input radius / output radius = ${f(c.rIn)} / ${f(c.rOut)}`,given:`Input radius ${f(c.rIn)} m; output radius ${f(c.rOut)} m`};
    case 'gears':return {num:c.teethOut*c.crankRadius,den:c.teethIn*c.drumRadius,ratioLine:`d₁ / d₂ = (output teeth × input radius) / (input teeth × output radius) = (${c.teethOut} × ${f(c.crankRadius)}) / (${c.teethIn} × ${f(c.drumRadius)})`,given:`${c.teethIn} → ${c.teethOut} teeth; input/output drum radii ${f(c.crankRadius)}/${f(c.drumRadius)} m`};
    case 'screw':return {num:2*Math.PI*c.handleRadius,den:c.lead,ratioLine:`One turn: d₁ = 2πr = ${f(2*Math.PI*c.handleRadius)} m; d₂ = lead = ${f(c.lead)} m. MA = d₁ / d₂.`,given:`Per turn: input ${f(2*Math.PI*c.handleRadius)} m; rise ${f(c.lead)} m`};
    case 'wedge':return {num:c.length,den:c.height,ratioLine:`d₁ / d₂ = horizontal advance / vertical rise = ${f(c.length)} / ${f(c.height)}`,given:`Horizontal run ${f(c.length)} m; rise ${f(c.height)} m`};
    case 'hydraulic':return {num:c.areaOut,den:c.areaIn,ratioLine:`A₁d₁ = A₂d₂, so d₁ / d₂ = output area / input area = ${f(c.areaOut)} / ${f(c.areaIn)}`,given:`Input area ${f(c.areaIn)} cm²; output area ${f(c.areaOut)} cm²`};
  }
}

export function createChallenge(type,task='force',level=0,variant=0){
  const {machine,stage,version,config:c}=setup(type,level,variant);
  const balance=task==='balance'||task==='inputMass';
  const R=ratio(c),answer=balance?c.outputMass/R:c.outputMass*GRAVITY/R;
  if(balance){
    const starting=Math.max(1,Math.min(80,Math.round(answer*.6+1)));
    c.inputMass=Math.abs(starting-answer)<.01?starting+2:starting;
  }
  const geo=geometrySetup(c),sub=balance?`m₁ = (${f(c.outputMass)} × ${f(geo.den)}) / ${f(geo.num)}`:`F₁ = (${f(c.outputMass)} × ${GRAVITY} × ${f(geo.den)}) / ${f(geo.num)}`;
  const steps=balance?[
    'At balance: F₁d₁ = F₂d₂. Each weight is mass × g.',
    'm₁g d₁ = m₂g d₂. The same g cancels: m₁ = m₂d₂ / d₁.',
    geo.ratioLine,
    `${sub}. Complete the division yourself.`,
    'MA = F₂ / F₁ = d₁ / d₂. Use the geometry ratio above.'
  ]:[
    'Ideal machine at the threshold: F₁d₁ = F₂d₂.',
    `Output weight: F₂ = m₂g = ${f(c.outputMass)} × ${GRAVITY} N.`,
    geo.ratioLine,
    `F₁ = F₂d₂ / d₁. ${sub}. Complete the division yourself.`,
    'MA = F₂ / F₁ = d₁ / d₂. Use the geometry ratio above.'
  ];
  return {
    id:`${machine.type}-${balance?'balance':'force'}-${stage}-${version}`,
    type:machine.type,task:balance?'balance':'force',level:stage,variant:version,
    title:`${machine.label} · ${machine.levels[stage]}`,
    prompt:balance?`What input mass balances the ${f(c.outputMass)} kg output load? Also find MA.`:`What input force reaches the lifting threshold for the ${f(c.outputMass)} kg load? Also find MA.`,
    config:c,unknown:balance?'inputMass':'force',unit:balance?'kg':'N',answer,ma:R,steps,
    given:[`Output mass: ${f(c.outputMass)} kg`,geo.given,`g = ${GRAVITY} N/kg`],
    explanation:balance?'At balance the machine stays still. A heavier input moves the output up; a lighter input lets it move down.':
      'The threshold force balances the load. A slightly larger force starts lifting; the exact threshold can maintain steady motion.',
    note:machine.shortNote,
    mode:balance?'balance':'threshold',
    baseline:stage===0,
    practiceLabel:version?`Practice ${version}`:'Core challenge',
    geometryRatio:{numerator:geo.num,denominator:geo.den}
  };
}
