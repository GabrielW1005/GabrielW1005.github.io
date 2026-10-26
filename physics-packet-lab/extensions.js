/* Numerical extensions to the digital packet only. Original printed pages stay unchanged.
 * All physical parameters are SI. Display units and the requested unknown may vary. */
const clone=v=>JSON.parse(JSON.stringify(v));
const fmt=v=>Number(Number(v).toFixed(6)).toLocaleString('en-US',{maximumFractionDigits:6});
const rnd=v=>Number(v.toFixed(9));
const factors={'m':1,'cm':.01,'km':1000,'s':1,'min':60,'h':3600,'m/s':1,'cm/s':.01,'km/h':1/3.6,'km/s':1000,'m/s²':1,'cm/s²':.01,'kg':1,'g':.001,'N':1,'kN':1000,'kg·m/s':1,'g·m/s':.001};
const baseUnits={distance:'m',time:'s',speed:'m/s',acceleration:'m/s²',mass:'kg',force:'N',momentum:'kg·m/s'};
const quantityUnit={reactionForce:'N',netForce:'N',buoyancy:'N',mass:'kg',acceleration:'m/s²',momentum:'kg·m/s',velocity:'m/s'};
const quantityDimension={reactionForce:'force',netForce:'force',buoyancy:'force',mass:'mass',acceleration:'acceleration',momentum:'momentum',velocity:'speed'};
const labels={reactionForce:'Force on the other object',netForce:'Signed net force',buoyancy:'Required upward water force',mass:'Mass',acceleration:'Acceleration',momentum:'Momentum',velocity:'Velocity'};
const configs=[
 {id:'P33',title:'Skaters push apart',kind:'interaction',scene:'skaters',object:'skater',other:'second skater',mass1:48,mass2:72,force:42,q:'reactionForce'},
 {id:'P34',title:'Astronauts push away',kind:'interaction',scene:'astronauts',object:'astronaut (including equipment)',other:'second astronaut and equipment',mass1:118,mass2:90,force:63,q:'acceleration'},
 {id:'P35',title:'Two small boats push apart',kind:'interaction',scene:'boats',object:'boat with its passenger',other:'second boat and passenger',mass1:145,mass2:115,force:69,q:'mass'},
 {id:'P36',title:'A boat and its load',kind:'buoyancy',scene:'boat',object:'small boat and its load',mass:100,g:9.8,buoyancy:882,q:'netForce'},
 {id:'P37',title:'A research submarine underwater',kind:'buoyancy',scene:'submarine',object:'small research submarine',mass:240,g:9.8,buoyancy:2496,q:'acceleration'},
 {id:'P38',title:'A research buoy in water',kind:'buoyancy',scene:'buoy',object:'research buoy',mass:14.5,g:9.8,buoyancy:142.1,q:'mass'},
 {id:'P39',title:'Designing a floating instrument',kind:'buoyancy',scene:'boat',object:'waterproof instrument with its float',mass:7.4,g:9.8,buoyancy:72.52,q:'buoyancy'},
 {id:'P40',title:'A rover accelerates on the Moon',kind:'force',scene:'moonrover',object:'Moon rover',mass:180,acceleration:.25,netForce:45,g:1.6,q:'netForce'},
 {id:'P41',title:'A Mars rover’s motion',kind:'force',scene:'marsrover',object:'Mars rover',mass:64,acceleration:.6,netForce:38.4,g:3.7,q:'mass'},
 {id:'P42',title:'A small space probe’s thruster',kind:'force',scene:'spacecraft',object:'deep-space probe',mass:30,acceleration:.006,netForce:.18,g:0,q:'acceleration'},
 {id:'P43',title:'A lunar lander lifts off',kind:'force',scene:'lunarlander',object:'lunar lander',mass:900,acceleration:.1,netForce:90,g:1.6,axis:'vertical',upwardForce:1530,q:'netForce'},
 {id:'P44',title:'A probe near Jupiter',kind:'force',scene:'jupiterprobe',object:'probe near Jupiter',mass:410,acceleration:.14,netForce:57.4,g:0,q:'mass'},
 {id:'P45',title:'A satellite’s orbital momentum',kind:'momentum',scene:'satellite',object:'satellite in Earth orbit',mass:120,velocity:7600,q:'momentum'},
 {id:'P46',title:'A cargo spacecraft approaches',kind:'momentum',scene:'spacecargo',object:'cargo spacecraft approaching a space station',mass:8400,velocity:1.7,q:'mass'},
 {id:'P47',title:'Tracking a small asteroid',kind:'momentum',scene:'asteroid',object:'small asteroid',mass:320,velocity:12000,q:'velocity'},
 {id:'P48',title:'A deep-space probe coasts',kind:'momentum',scene:'probe',object:'deep-space probe',mass:240,velocity:18500,q:'momentum'},
 {id:'P49',title:'A comet fragment in space',kind:'momentum',scene:'comet',object:'comet fragment',mass:20000,velocity:34000,q:'mass'},
 {id:'P50',title:'A service pod approaches a station',kind:'momentum',scene:'spacestation',object:'robotic service pod approaching a space station',mass:360,velocity:.35,q:'velocity'}
];
const configMap=new Map(configs.map(x=>[x.id,x]));
export const isExtension=problem=>!!problem?.extension||configMap.has(typeof problem==='string'?problem:problem?.id);
const config=problem=>configMap.get(typeof problem==='string'?problem:problem.id);
export function extensionAnswer(problem,p){
 const q=p._quantity||problem.numericAnswer?.quantity,c=config(problem),k=c?.kind||problem.simulation.kind.replace('extension-','');
 if(k==='interaction')return q==='mass'?p.mass2:q==='acceleration'?p.force/p.mass2:p.force;
 if(k==='buoyancy')return q==='mass'?p.buoyancy/p.g:q==='buoyancy'?p.mass*p.g:q==='acceleration'?(p.buoyancy-p.mass*p.g)/p.mass:p.buoyancy-p.mass*p.g;
 if(k==='force'){const net=p.axis==='vertical'&&p.upwardForce!==undefined?p.upwardForce-p.mass*p.g:p.netForce;return q==='mass'?net/p.acceleration:q==='acceleration'?net/p.mass:net;}
 return q==='mass'?p.mass:q==='velocity'?p.velocity:p.mass*p.velocity;
}
export function getExtensionAnswerUnit(problem,p){const q=p._quantity||problem.numericAnswer?.quantity,unit=p._displayUnits?.answer||quantityUnit[q];return{unit,factor:factors[unit]};}
const measure=(p,v,d)=>`${fmt(v/factors[p._displayUnits?.[d]||baseUnits[d]])} ${p._displayUnits?.[d]||baseUnits[d]}`;
const positiveText=(p,v,d)=>measure(p,Math.abs(v),d);
function paramsFor(c,i=-1){
 const variation=i>=0,n=i+1,slot=Number(c.id.slice(1))-33;
 let p={time:4,vi:0};
 if(c.kind==='interaction'){
  p={...p,mass1:c.mass1,mass2:c.mass2,force:c.force,pushDuration:.35};
  if(variation){p.mass1=Math.round(c.mass1*(.72+.025*n));p.mass2=Math.round(c.mass2*(.65+.037*n));const a=rnd(.25+.03*n+.02*slot);p.force=rnd(p.mass2*a);}
  p._quantity=variation?['reactionForce','mass','acceleration'][(i+slot)%3]:c.q;
 }else if(c.kind==='buoyancy'){
  p={...p,mass:c.mass,g:c.g,buoyancy:c.buoyancy,height:-3,time:3};
  if(variation){p.mass=Number((c.mass*(.55+.041*n)).toFixed(1));p._quantity=['netForce','acceleration','mass','buoyancy'][(i+slot)%4];const a=rnd((i%2?1:-1)*(.12+.03*n));p.buoyancy=rnd(p.mass*(p.g+a));}
  else p._quantity=c.q;
  if(['mass','buoyancy'].includes(p._quantity))p.buoyancy=rnd(p.mass*p.g);
 }else if(c.kind==='force'){
  p={...p,mass:c.mass,netForce:c.netForce,acceleration:c.acceleration,g:c.g,axis:c.axis||'horizontal',height:c.axis==='vertical'?1:0,time:c.id==='P42'?20:4};
  if(variation){p.mass=Math.round(c.mass*(.63+.043*n));p.acceleration=Number((c.acceleration*(.55+.061*n)).toFixed(c.acceleration<.01?4:2));p.netForce=rnd(p.mass*p.acceleration);}
  if(c.axis==='vertical')p.upwardForce=rnd(p.mass*p.g+p.netForce);
  p._quantity=variation?['netForce','mass','acceleration'][(i+slot)%3]:c.q;
 }else{
  p={...p,mass:c.mass,velocity:c.velocity,time:c.velocity>1000?.002:4};
  if(variation){p.mass=Math.round(c.mass*(.61+.047*n));p.velocity=c.velocity>1000?Math.round(c.velocity*(.66+.031*n)/10)*10:Number((c.velocity*(.66+.031*n)).toFixed(2));}
  p.momentum=rnd(p.mass*p.velocity);p._quantity=variation?['momentum','mass','velocity'][(i+slot)%3]:c.q;
 }
 const u={...baseUnits};
 if(variation){
  if(p.mass&&p.mass<12&&i%2)u.mass='g';
  if((c.kind==='force'||c.kind==='interaction'||c.kind==='buoyancy')&&i%4===1&&Math.abs(p.buoyancy??p.netForce??p.force)>=100)u.force='kN';
  if((c.kind==='force'||c.kind==='interaction'||c.kind==='buoyancy')&&i%3===1)u.acceleration='cm/s²';
  if(c.kind==='momentum')u.speed=p.velocity>1000?(i%2?'km/s':'m/s'):(i%3===1?'cm/s':'m/s');
 }
 if(c.kind==='momentum'&&p.velocity>=1000)u.speed='km/s';
 u.answer=u[quantityDimension[p._quantity]]||quantityUnit[p._quantity];
 p._displayUnits=u;
 if(variation)p._practiceVariant=`${c.id}-v2-${String(i+1).padStart(2,'0')}`;
 return p;
}
function forceQuestion(c,p,q){
 const mass=measure(p,p.mass,'mass'),force=measure(p,p.netForce,'force'),a=measure(p,p.netForce/p.mass,'acceleration');
 const subject='A '+c.object;
 if(c.axis==='vertical'){
  const w=measure(p,p.mass*p.g,'force'),up=measure(p,p.upwardForce,'force');
  if(q==='netForce')return `${subject} has mass ${mass}. Its engines provide ${up} upward thrust; lunar gravity is ${fmt(p.g)} m/s² downward. Find the vertical net force. Up is positive.`;
  if(q==='mass')return `${subject} has a measured net upward force of ${force} and upward acceleration of ${a}. Find its mass. The net force already includes both thrust and gravity.`;
  return `${subject} has mass ${mass}, upward thrust ${up}, and downward weight ${w}. Find its vertical acceleration. Up is positive.`;
 }
 const context=c.scene==='moonrover'||c.scene==='marsrover'?'It travels on level ground. The stated force is the net horizontal force after resistance.':'Consider a short interval with constant mass. The stated net force includes all forces in the measured direction.';
 const known=q==='netForce'?`has mass ${mass} and accelerates at ${a}`:q==='mass'?`has net force ${force} and acceleration ${a}`:`has mass ${mass} and net force ${force}`;
 return `${subject} ${known}. ${context} Find its ${q==='netForce'?'net force':q==='mass'?'mass':'acceleration'}.`;
}
export function getExtensionQuestion(problem,p=problem.simulation.params){
 const c=config(problem),q=p._quantity||problem.numericAnswer.quantity,target=getExtensionAnswerUnit(problem,p);let prompt='',hint='';
 if(c.kind==='interaction'){
  const context=c.scene==='skaters'?'Two skaters begin at rest with their hands touching. Ignore horizontal friction.':c.scene==='astronauts'?'Two astronauts begin at rest relative to each other, with their hands touching. Consider their brief push; other forces have negligible effect on their relative motion.':'Two passengers in small boats push against each other with their hands touching. Consider the short horizontal push; water resistance is neglected.';
  const force=measure(p,p.force,'force'),mass=measure(p,p.mass2,'mass'),a=measure(p,p.force/p.mass2,'acceleration');
  const ask=q==='reactionForce'?`The second ${c.object} pushes the first left with ${force}. What is the size of the force exerted on the second ${c.object}, toward the right?`:q==='mass'?`The second ${c.object} is pushed right with ${force} and accelerates right at ${a}. Find the mass of the second ${c.object}.`:`The second ${c.object} has mass ${mass}. It pushes the first left with ${force}. Find the acceleration magnitude of the second ${c.object}, which moves right.`;
  prompt=`${context} ${ask}`;hint=q==='reactionForce'?'The two interaction forces have equal sizes and opposite directions. Each acts on a different object.':'First use the equal-and-opposite force pair. Then apply F = ma to the second object only.';
 }else if(c.kind==='buoyancy'){
  const mass=measure(p,p.mass,'mass'),B=measure(p,p.buoyancy,'force'),g=fmt(p.g);
  if(q==='mass')prompt=`A ${c.object} stays at the same depth without a tether or engine force. Water pushes upward with ${B}, balancing its weight. Use g = ${g} m/s². Find its total mass.`;
  else if(q==='buoyancy')prompt=`A ${c.object} has mass ${mass}. It must remain at the same depth or float at rest. Use g = ${g} m/s². What upward force from the water is required to balance its weight?`;
  else{const scene=c.id==='P36'?`${p.buoyancy<p.mass*p.g?'An overloaded small boat':'A small boat and its load'} is just fully submerged.`:'A '+c.object+' is released fully underwater.';prompt=`${scene} Its total mass is ${mass}, and the water pushes upward with ${B}. Use g = ${g} m/s². Ignore water resistance at this initial instant. Find its initial ${q==='netForce'?'vertical net force':'vertical acceleration'}. Up is positive; a negative answer means down.`;}
  hint='Find weight = mass × g. Upward water force minus downward weight gives net force. For acceleration, divide that net force by mass.';
 }else if(c.kind==='force'){prompt=forceQuestion(c,p,q);hint=q==='mass'?'Use F = ma. Divide BOTH sides by a: F/a = ma/a, so m = F/a.':q==='acceleration'?'Use F = ma. Divide BOTH sides by m: F/m = ma/m, so a = F/m.':'Multiply mass by acceleration to find net force. For a vertical launch, upward thrust and downward weight must be combined first.';}
 else{
  const frame=['spacecargo','spacestation'].includes(c.scene)?'relative to the space station':c.scene==='satellite'?'relative to Earth':'relative to the Sun';
  const mass=measure(p,p.mass,'mass'),v=measure(p,p.velocity,'speed'),mom=measure(p,p.mass*p.velocity,'momentum');
  const lead=`A ${c.object}`;
  prompt=q==='momentum'?`${lead} has mass ${mass} and velocity ${v} ${frame}. Find its momentum at this instant.`:q==='mass'?`${lead} has momentum ${mom} and velocity ${v} ${frame}. Find its mass.`:`${lead} has mass ${mass} and momentum ${mom} ${frame}. Find its velocity.`;
  prompt+=' Take the direction of motion as positive.';
  hint=q==='mass'?'Use p = mv. Divide BOTH sides by v: p/v = mv/v, so m = p/v.':q==='velocity'?'Use p = mv. Divide BOTH sides by m: p/m = mv/m, so v = p/m.':'Multiply mass by velocity. Use kilograms and meters per second, or convert carefully to the requested units.';
 }
 prompt+=` Give your answer in ${target.unit}.`;
 return{title:c.title,prompt,hint,givens:[],practice:!!p._practiceVariant,unitNote:'Graphs use SI units: meters, seconds, kilograms, and newtons.'};
}
export function getExtensionPractice(problem,variantId){const ids=listExtensionPracticeIds(problem),index=ids.indexOf(variantId);if(index<0)throw new Error(`Unknown practice variant: ${variantId}`);const params=paramsFor(config(problem),index);return{params,...getExtensionQuestion(problem,params),variantId,title:problem.title};}
export function listExtensionPracticeIds(problem){return isExtension(problem)?Array.from({length:24},(_,i)=>`${typeof problem==='string'?problem:problem.id}-v2-${String(i+1).padStart(2,'0')}`):[];}
function unitConversions(problem,p){
 const c=config(problem),q=p._quantity,entries=c.kind==='interaction'?q==='reactionForce'?[['force',p.force]]:q==='mass'?[['force',p.force],['acceleration',p.force/p.mass2]]:[['force',p.force],['mass',p.mass2]]:c.kind==='momentum'?q==='momentum'?[['mass',p.mass],['speed',p.velocity]]:q==='mass'?[['momentum',p.mass*p.velocity],['speed',p.velocity]]:[['momentum',p.mass*p.velocity],['mass',p.mass]]:c.kind==='force'?q==='netForce'?[['mass',p.mass],['acceleration',p.netForce/p.mass]]:q==='mass'?[['force',p.netForce],['acceleration',p.netForce/p.mass]]:[['force',p.netForce],['mass',p.mass]]:[['mass',p.mass],['force',p.buoyancy]];
 return entries.filter(([d])=>factors[p._displayUnits?.[d]||baseUnits[d]]!==1).map(([d,value])=>`Convert first: ${measure(p,value,d)} = ${fmt(value)} ${baseUnits[d]}.`);
}
export function getExtensionLesson(problem,p=problem.simulation.params){
 const c=config(problem),q=p._quantity||problem.numericAnswer.quantity,result=extensionAnswer(problem,p),target=getExtensionAnswerUnit(problem,p),expected=result/target.factor,steps=unitConversions(problem,p);let why='',formula='';
 if(c.kind==='interaction'){
  steps.push(`The first object is pushed left with ${fmt(p.force)} N. Newton’s third law gives ${fmt(p.force)} N right on the second object.`);
  if(q==='mass'){formula='F = ma → m = F/a';steps.push(`${fmt(p.force)} = m × ${fmt(p.force/p.mass2)}.`,`Divide BOTH sides by ${fmt(p.force/p.mass2)}: ${fmt(p.force)} / ${fmt(p.force/p.mass2)} = (m × ${fmt(p.force/p.mass2)}) / ${fmt(p.force/p.mass2)}.`,`m = ${fmt(p.mass2)} kg.`);}
  else if(q==='acceleration'){formula='F = ma → a = F/m';steps.push(`${fmt(p.force)} = ${fmt(p.mass2)} × a.`,`Divide BOTH sides by ${fmt(p.mass2)}: ${fmt(p.force)} / ${fmt(p.mass2)} = (${fmt(p.mass2)} × a) / ${fmt(p.mass2)}.`,`a = ${fmt(result)} m/s² right.`);}
  else formula='Force on A from B = − force on B from A';
  why='The pair acts on two different objects. Equal force sizes do not require equal accelerations: each object’s acceleration also depends on its own mass.';
 }else if(c.kind==='buoyancy'){
  if(q==='mass'){formula='B = mg → m = B/g';steps.push(`At rest, upward water force B equals downward weight mg: ${fmt(p.buoyancy)} = m × ${fmt(p.g)}.`,`Divide BOTH sides by ${fmt(p.g)}: ${fmt(p.buoyancy)} / ${fmt(p.g)} = (m × ${fmt(p.g)}) / ${fmt(p.g)}.`,`m = ${fmt(result)} kg.`);}
  else{steps.push(`Weight = mg = ${fmt(p.mass)} × ${fmt(p.g)} = ${fmt(p.mass*p.g)} N downward.`);if(q==='buoyancy'){formula='B = mg';steps.push(`For rest, water force must balance weight: B = ${fmt(result)} N upward.`);}else{formula=q==='acceleration'?'a = (B − mg)/m':'Fnet = B − mg';steps.push(`Up is positive: Fnet = ${fmt(p.buoyancy)} − ${fmt(p.mass*p.g)} = ${fmt(p.buoyancy-p.mass*p.g)} N.`);if(q==='acceleration')steps.push(`${fmt(p.buoyancy-p.mass*p.g)} = ${fmt(p.mass)} × a.`,`Divide BOTH sides by ${fmt(p.mass)}: ${fmt(p.buoyancy-p.mass*p.g)} / ${fmt(p.mass)} = (${fmt(p.mass)} × a) / ${fmt(p.mass)}.`,`a = ${fmt(result)} m/s².`);steps.push(result<0?'The negative sign means the initial acceleration is downward.':result>0?'The positive sign means the initial acceleration is upward.':'The forces balance, so the initial acceleration is zero.');}}
  why='Buoyancy is the upward force from the water. If weight exceeds the available buoyant force, the object initially sinks. A floating object can displace more water until forces balance; it cannot float if its fully submerged buoyant force is still smaller than its weight.';
 }else if(c.kind==='force'){
  if(q==='netForce'){formula='F = ma';if(c.axis==='vertical')steps.push(`Weight = ${fmt(p.mass)} × ${fmt(p.g)} = ${fmt(p.mass*p.g)} N downward.`,`Net upward force = ${fmt(p.upwardForce)} − ${fmt(p.mass*p.g)} = ${fmt(p.netForce)} N.`);else steps.push(`Fnet = m × a = ${fmt(p.mass)} × ${fmt(p.netForce/p.mass)} = ${fmt(p.netForce)} N.`);}
  else if(q==='mass'){formula='F = ma → m = F/a';steps.push(`${fmt(p.netForce)} = m × ${fmt(p.netForce/p.mass)}.`,`Divide BOTH sides by ${fmt(p.netForce/p.mass)}: ${fmt(p.netForce)} / ${fmt(p.netForce/p.mass)} = (m × ${fmt(p.netForce/p.mass)}) / ${fmt(p.netForce/p.mass)}.`,`m = ${fmt(result)} kg.`);}
  else{formula='F = ma → a = F/m';if(c.axis==='vertical')steps.push(`Fnet = thrust − weight = ${fmt(p.upwardForce)} − ${fmt(p.mass*p.g)} = ${fmt(p.netForce)} N.`);steps.push(`${fmt(p.netForce)} = ${fmt(p.mass)} × a.`,`Divide BOTH sides by ${fmt(p.mass)}: ${fmt(p.netForce)} / ${fmt(p.mass)} = (${fmt(p.mass)} × a) / ${fmt(p.mass)}.`,`a = ${fmt(result)} m/s².`);}
  why='F = ma uses the net force on one object. For the same net force, greater mass gives less acceleration. Space objects still obey Newton’s laws; gravity may be part of the stated net force.';
 }else{
  const momentum=p.mass*p.velocity;
  if(q==='momentum'){formula='p = mv';steps.push(`p = m × v = ${fmt(p.mass)} × ${fmt(p.velocity)} = ${fmt(momentum)} kg·m/s.`);}
  else if(q==='mass'){formula='p = mv → m = p/v';steps.push(`${fmt(momentum)} = m × ${fmt(p.velocity)}.`,`Divide BOTH sides by ${fmt(p.velocity)}: ${fmt(momentum)} / ${fmt(p.velocity)} = (m × ${fmt(p.velocity)}) / ${fmt(p.velocity)}.`,`m = ${fmt(p.mass)} kg.`);}
  else{formula='p = mv → v = p/m';steps.push(`${fmt(momentum)} = ${fmt(p.mass)} × v.`,`Divide BOTH sides by ${fmt(p.mass)}: ${fmt(momentum)} / ${fmt(p.mass)} = (${fmt(p.mass)} × v) / ${fmt(p.mass)}.`,`v = ${fmt(p.velocity)} m/s.`);}
  why='Momentum depends on mass and velocity in the stated reference frame. This is an instantaneous or short local measurement; it does not mean that gravity vanishes or that a real orbit is straight.';
 }
 if(target.factor!==1)steps.push(`Convert to the requested unit: ${fmt(result)} ${quantityUnit[q]} ÷ ${fmt(target.factor)} = ${fmt(expected)} ${target.unit}.`);
 return{hint:getExtensionQuestion(problem,p).hint,steps,why,criteria:[],fields:[{key:'value',label:labels[q],type:'number',unit:target.unit,expected,tolerance:expected===0?1e-9:Math.max(1e-9,Math.min(.005000001,Math.abs(expected)*.0025))}],answer:`${fmt(expected)} ${target.unit}`,formula};
}
/** Math-only warm-ups deliberately use different values from the physics question. */
export function getEquationWarmups(problem,p=problem?.simulation?.params||{}){
 const kind=problem?.simulation?.kind||'',id=problem?.id||'',momentum=kind.includes('momentum')||['P29','P30','P31','P32'].includes(id),force=isExtension(problem)||['P17','P25','P26','P27'].includes(id);
 if(!momentum&&!force)return[];
 const seed=Number(id.replace(/\D/g,''))||1,variant=Number(p._practiceVariant?.split('-').at(-1)||0),k=seed+variant;
 const coefficient1=2+k%8,answer1=Number((1.5+.25*(k%25)).toFixed(2)),total1=rnd(coefficient1*answer1);
 const coefficient2=3+(k*3)%7,answer2=Number((.8+.2*((k*2)%19)).toFixed(2)),total2=rnd(coefficient2*answer2);
 const factor1=Number((1.2+.2*(k%11)).toFixed(1)),factor2=Number((2.1+.3*((k+4)%9)).toFixed(1));
 const symbol1='m',symbol2=momentum?'v':'a',product=momentum?'p':'F',known1=momentum?'v':'a',known2='m';
 const divide=(coefficient,total,answer,symbol,known,suffix)=>({id:`${id}-algebra-${suffix}`,title:'Solve a one-step equation',prompt:`Solve ${fmt(total)} = ${fmt(coefficient)}${symbol}.`,formula:`${product} = ${momentum?'mv':'ma'} → ${symbol} = ${product}/${known}`,answer:`${symbol} = ${fmt(answer)}`,steps:[`Divide BOTH sides by ${fmt(coefficient)}: ${fmt(total)}/${fmt(coefficient)} = ${fmt(coefficient)}${symbol}/${fmt(coefficient)}.`,`Since ${fmt(coefficient)}/${fmt(coefficient)} = 1, the right side becomes ${symbol}.`,`${fmt(answer)} = ${symbol}. The same step in the physics formula gives ${product}/${known} = ${symbol}.`]});
 return[divide(coefficient1,total1,answer1,symbol1,known1,'mass'),divide(coefficient2,total2,answer2,symbol2,known2,symbol2),{id:`${id}-algebra-product`,title:'Multiply the known values',prompt:`Evaluate ${product} = ${fmt(factor1)} × ${fmt(factor2)}.`,formula:momentum?'p = mv':'F = ma',answer:`${product} = ${fmt(rnd(factor1*factor2))}`,steps:[`Multiply the two known factors: ${fmt(factor1)} × ${fmt(factor2)} = ${fmt(rnd(factor1*factor2))}.`,'No division is needed when finding the product.']}];
}
export const getEquationWarmup=(problem,p)=>getEquationWarmups(problem,p)[0]||null;
function problemFrom(c){
 const params=paramsFor(c),problem={id:c.id,title:c.title,type:'quantitative',extension:true,prompt:'',answer:'',steps:[],numericAnswer:{quantity:params._quantity,unit:quantityUnit[params._quantity],value:0},goal:{quantity:params._quantity,prompt:'Find the requested numerical value, then run your prediction.'},simulation:{kind:`extension-${c.kind}`,scene:c.scene,params,adjustable:[],notes:c.kind==='interaction'?'A brief push begins with contact. Forces on the two objects are equal and opposite during contact; after release both coast. Friction and changes in mass are neglected.':c.kind==='buoyancy'?'Questions ask about the initial instant at rest, fully submerged: water resistance is then zero. During playback, water resistance opposes motion and buoyancy decreases as the object emerges. A supported object can settle with only part of its volume underwater; an object whose weight exceeds maximum buoyancy sinks. Bottom contact adds support.':c.kind==='momentum'?'Momentum is measured in the reference frame stated in the question. The animation shows a short local motion segment, not a full orbital path. Mass and velocity are constant during this short measurement.':'Constant mass and constant net force over a short interval. For a rover, vertical support balances weight; the given force is horizontal. For the lander, upward thrust and downward weight are shown separately.'}};
 const q=getExtensionQuestion(problem,params),l=getExtensionLesson(problem,params);Object.assign(problem,{prompt:q.prompt,answer:l.answer,steps:l.steps});problem.numericAnswer.value=extensionAnswer(problem,params);return problem;
}
const built=configs.map(problemFrom);
export const extensionSections=[
 {number:9,title:'Extension: Newton’s third law',subtitle:'Equal force pairs; different masses and accelerations.',extension:true,formulas:['F = ma','m = F/a','a = F/m'],warmups:[],problems:built.slice(0,3)},
 {number:10,title:'Extension: Boats, sinking & buoyancy',subtitle:'Compare upward water force and downward weight.',extension:true,formulas:['W = mg','Fnet = B − W','a = Fnet/m'],warmups:[],problems:built.slice(3,7)},
 {number:11,title:'Extension: Forces on other worlds',subtitle:'Find net force, mass, or acceleration.',extension:true,formulas:['F = ma','m = F/a','a = F/m'],warmups:[],problems:built.slice(7,12)},
 {number:12,title:'Extension: Momentum in space',subtitle:'Find momentum, mass, or velocity in the stated reference frame.',extension:true,formulas:['p = mv','m = p/v','v = p/m'],warmups:[],problems:built.slice(12)}
];
