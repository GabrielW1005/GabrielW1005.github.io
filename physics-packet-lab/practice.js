import {isExtension,getExtensionQuestion,getExtensionPractice,getExtensionAnswerUnit,listExtensionPracticeIds} from './extensions.js?v=20261026-2';
/* Additional practice has 24 deterministic, unit-varied parameter sets per problem.
   These pure helpers never modify the printed packet or its saved answers. */
const copy=v=>Array.isArray(v)?v.map(copy):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,copy(x)])):v;
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const fmt=v=>{const n=num(v);return Number(n.toFixed(Math.abs(n)>0&&Math.abs(n)<.1?4:3)).toLocaleString('en-US',{maximumFractionDigits:Math.abs(n)>0&&Math.abs(n)<.1?4:3});};
const baseFmt=fmt;
const signed=v=>num(v)>0?`+${fmt(v)}`:fmt(v);
const velocity=(v,positive='east',negative='west')=>num(v)===0?'at rest':`${fmt(Math.abs(num(v)))} m/s ${num(v)>0?positive:negative}`;
const dir=v=>num(v)<0?'west':'east';
const nearly=(a,b)=>Math.abs(num(a)-num(b))<1e-8;
const path=p=>({times:(p.times||[0,10,20,30]).map(t=>num(t)*num(p.timeScale,1)),positions:(p.positions||[0,12,12,30]).map(x=>num(x)*num(p.distanceScale,1))});
const tableFor=p=>{const r=path(p);return{headers:['Time (s)','Total distance (m)'],rows:r.times.map((t,i)=>[t,r.positions[i]])};};
const duration=p=>p.startTime!==undefined&&p.endTime!==undefined?num(p.endTime)-num(p.startTime):num(p.time,1);
const weight=p=>p.weight!==undefined?num(p.weight):num(p.mass)*num(p.g,10);
// Unit factors are SI units per displayed unit; all model parameters stay in SI.
const UNIT_FACTORS=Object.freeze({'m':1,'cm':.01,'km':1000,'s':1,'min':60,'h':3600,'m/s':1,'cm/s':.01,'km/h':1/3.6,'km/s':1000,'m/s²':1,'cm/s²':.01,'kg':1,'g':.001,'N':1,'kN':1000,'kg·m/s':1,'g·m/s':.001});
export function unitFactor(unit){if(!Object.hasOwn(UNIT_FACTORS,unit))throw new Error(`Unsupported unit: ${unit}`);return UNIT_FACTORS[unit];}
export function displayValue(si,unit){return Number((Number(si)/unitFactor(unit)).toPrecision(13));}
const SI_RESULT_UNITS={distance:'m',displacement:'m',speed:'m/s',averageSpeed:'m/s',finalVelocity:'m/s',acceleration:'m/s²',weight:'N',frictionForce:'N',netForce:'N',mass:'kg',totalMomentum:'kg·m/s'};
export function getAnswerUnit(problem,params=problem.simulation?.params||{}){if(isExtension(problem))return getExtensionAnswerUnit(problem,params);const unit=params._displayUnits?.answer||SI_RESULT_UNITS[problem.numericAnswer?.quantity]||'m';return{unit,factor:unitFactor(unit)};}
const round=v=>Number(v.toFixed(9));
const pick=(array,i)=>array[i%array.length];
const unitSet=(extra={})=>({distance:'m',time:'s',speed:'m/s',acceleration:'m/s²',mass:'kg',force:'N',momentum:'kg·m/s',...extra});
/** Twenty-four fixed parameter sets per type. Stable IDs let both pages share
 * exactly the same problem without putting generated values in a URL. */
function variantParams(id,i){
 const k=i+1,odd=i%2===1;
 let q={},u=unitSet();
 switch(id){
 case'P01':{const a=round(11.5+1.1*i),b=round(2.8+.2*i);q={start:0,turn:a,end:round(a-b),speed:pick([1.1,1.3,1.5],i)};u=unitSet({distance:pick(['m','cm','m'],i),answer:pick(['m','cm','m'],i)});break;}
 case'P02':{const sign=i%4===3?-1:1;q={start:round(sign*(-5-1.5*i)),end:round(sign*(8+.7*i)),speed:pick([1.2,1.4,1.6],i)};q.turn=q.end;u=unitSet({distance:pick(['m','m','km'],i),answer:pick(['m','cm','m','km'],i)});break;}
 case'P03':q={radius:round(15+.8*i),speed:round(2+.05*i),laps:1+i%3};u=unitSet({speed:odd?'km/h':'m/s'});break;
 case'P04':q={speed:round(7.5+.7*i),time:6+i%5,frame:0};u=unitSet({speed:odd?'km/h':'m/s'});break;
 case'P05':{const v=round(.65+.05*i),t=pick([80,120,150,180,200,240],i);q={distance:round(v*t),time:t};u=unitSet({distance:pick(['m','km','m'],i),time:odd?'min':'s',answer:pick(['m/s','km/h','cm/s'],i)});break;}
 case'P06':q={speed:round(2.8+.15*i),time:pick([60,90,120,180],i)};u=unitSet({speed:odd?'km/h':'m/s',time:pick(['s','min','min','h'],i),answer:odd?'km':'m'});break;
 case'P07':{const a=round(1.4+.055*i);q={speed:a,otherSpeed:round(-(i%3===2?a+.35:a)),time:7+i%6};u=unitSet({speed:pick(['m/s','km/h','cm/s'],i)});break;}
 case'P08':{const a=12+6*(i%3),b=6+6*(i%2),c=18+6*(i%4),v=round(1.1+.04*i);q={times:[0,a,a+b,a+b+c],positions:[0,round(a*v),round(a*v),round((a+c)*v)],distanceScale:1,timeScale:1};u=unitSet({time:odd?'min':'s',speed:odd?'km/h':'m/s'});break;}
 case'P09':{const a=round(.24+.07*i),t=5+i%4,vi=round(1.8+.2*(i%8)),start=2+i%6;q={vi,vf:round(vi+a*t),startTime:start,endTime:start+t,time:t};u=unitSet({speed:odd?'km/h':'m/s',answer:odd?'cm/s²':'m/s²'});break;}
 case'P10':q={vi:round(1+.1*(i%5)),acceleration:round(.2+.03*i),time:3+i%4};u=unitSet({speed:odd?'km/h':'m/s',acceleration:i%3===2?'cm/s²':'m/s²',answer:pick(['m/s','cm/s','km/h'],i)});break;
 case'P11':{const slow=round(.4+.045*i),fast=round(slow+.55+.04*i);q={vi:odd?-fast:-slow,vf:odd?-slow:-fast,time:2+i%4};u=unitSet({speed:odd?'cm/s':'m/s'});break;}
 case'P12':q={orbital:true,orbitAU:round(.4+.1*i),laps:1};q.radius=q.orbitAU*149600000000;break;
 case'P13':{const t=60+60*(i%3),total=round((.55+.04*i)*t);q={times:[0,t*.4,t*.6,t],positions:[0,round(total*.5),round(total*.5),total],distanceScale:1,timeScale:1};u=unitSet({distance:i%3===2?'km':'m',time:odd?'min':'s',answer:pick(['m/s','km/h','cm/s'],i)});break;}
 case'P14':{const vi=round(1.2+.1*(i%6)),t=4+i%4,a=round(.15+.035*i);q={vi,vf:round(vi+a*t),time:t};u=unitSet({speed:odd?'km/h':'m/s',answer:odd?'cm/s²':'m/s²'});break;}
 case'P15':{const dt=12+6*(i%5),speeds=[round(.55+.01*i),round(1.3+.025*i),round(.8+.015*i)];for(let r=0;r<i%3;r++)speeds.unshift(speeds.pop());q={times:[0,dt,2*dt,3*dt],positions:[0,round(dt*speeds[0]),round(dt*(speeds[0]+speeds[1])),round(dt*speeds.reduce((a,b)=>a+b))],distanceScale:1,timeScale:1};u=unitSet({time:odd?'min':'s',distance:i%3===2?'km':'m'});break;}
 case'P16':{const a=round(2.6+.13*i);q={speed:a,otherSpeed:round(-(i%3===2?a+.6:a)),time:12+6*(i%5)};u=unitSet({speed:odd?'km/h':'m/s',time:i%3===2?'min':'s'});break;}
 case'P17':{const planet=pick([{planet:'Moon',g:1.6},{planet:'Mars',g:3.7},{planet:'Venus',g:8.9},{planet:'Earth',g:9.8}],i);q={mass:round(.3+.17*i),...planet};u=unitSet({mass:odd?'g':'kg',answer:'N'});break;}
 case'P18':{const f=round(12.5+1.7*i);q={mass:18,forwardForce:f,backwardForce:f,vi:round(.6+.025*i),time:4,steady:true};u=unitSet({force:i%3===2?'kN':'N',answer:odd?'N':'kN'});break;}
 case'P19':{const planet=pick([{planet:'Mars',g:3.7},{planet:'Moon',g:1.6}],i);q={mass:round(112+2.5*i),...planet,compareG:9.8};u=unitSet();break;}
 case'P20':{const limit=round(16+1.1*i);q={mass:20,forwardForce:round(limit+(i%3===2?3.5:-5.5)),staticLimit:limit,kineticFriction:round(limit*.75),vi:0,time:3};u=unitSet({force:odd?'kN':'N'});break;}
 case'P21':{const w=9000+750*(i%8),net=(odd?-1:1)*(650+125*i);q={upwardForce:w+net,weight:w,g:10,vi:0,height:40,time:4};u=unitSet({force:odd?'kN':'N',answer:i%3===2?'kN':'N'});break;}
 case'P22':{const w=8500+400*(i%7),net=(odd?1:-1)*(80+35*i);q={upwardForce:w+net,weight:w,g:10,vi:0,height:60,time:6};u=unitSet({force:odd?'N':'kN',answer:odd?'kN':'N'});break;}
 case'P23':{const mass=800+35*i,thrust=round(1700+90*i);q={flight2D:true,balancedFlight:false,mass,weight:mass*10,g:10,upwardForce:mass*10,forwardForce:thrust,backwardForce:thrust,vi:round(40+1.2*i),vy:0,height:250,time:5};u=unitSet({speed:odd?'km/h':'m/s',force:odd?'kN':'N'});break;}
 case'P24':q={mass:.17,forwardForce:0,backwardForce:0,vi:round((i%4===3?-1:1)*(1.8+.19*i)),time:3+i%3};u=unitSet({speed:pick(['m/s','km/h','cm/s'],i)});break;
 case'P25':{const mass=pick([.2,.4,.6,.8],i),a=round(.4+.15*i);q={axis:'vertical',mass,g:10,upwardForce:round(mass*(10+a)),vi:0,height:.2,time:2,ground:true};u=unitSet({mass:odd?'kg':'g',answer:odd?'cm/s²':'m/s²'});break;}
 case'P26':{const mass=round(.4+.08*i),a=.5+.25*(i%5);q={axis:'vertical',netForce:round(mass*a),acceleration:a,g:10,vi:0,height:1,time:3,ground:true};u=unitSet({acceleration:odd?'cm/s²':'m/s²',answer:odd?'g':'kg'});break;}
 case'P27':{const small=round(.25+.015*i),large=round(small*pick([1.5,2,2.5],i)),reverse=i%4===3,mass=reverse?large:small,compareMass=reverse?small:large,netForce=round(.42+.035*i),drag=round(.22+.01*i);q={flight2D:true,mass,compareMass,g:10,netForce,backwardForce:drag,forwardForce:round(netForce+drag),upwardForce:round(mass*10),compareLift:round(compareMass*10),vi:6,vy:0,height:100,time:3};u=unitSet({mass:odd?'kg':'g'});break;}
 case'P28':q={radius:round(9+.55*i),speed:round(2.8+.08*i),laps:1,mass:60+i};u=unitSet({speed:odd?'km/h':'m/s'});break;
 case'P29':q={mass1:round(3+.15*i),mass2:round(1.45+.01*(i%8)),velocity1:round(1.8+.1*i),velocity2:0,preImpact:true,collisionTime:1.2,time:1.2};u=unitSet({speed:odd?'km/h':'m/s',answer:'kg·m/s'});break;
 case'P30':{const mass1=round(.04+.005*i),mass2=round(.06+.005*(i%9));q={mass1,mass2,velocity1:round(.6+.05*i),velocity2:0,radius1:round(.023*Math.cbrt(mass1/.1)),radius2:round(.023*Math.cbrt(mass2/.1)),restitution:0,collisionTime:1,contactDuration:.008,time:2};u=unitSet({mass:odd?'kg':'g',speed:odd?'cm/s':'m/s',answer:odd?'g·m/s':'kg·m/s',momentum:odd?'g·m/s':'kg·m/s'});break;}
 case'P31':q={mass1:round(.008+.001*i),mass2:round(.012+.001*(i%13)),velocity1:round(.25+.025*i),velocity2:0,radius1:round(.012*Math.cbrt((.008+.001*i)/.02)),radius2:round(.012*Math.cbrt((.012+.001*(i%13))/.02)),restitution:1,collisionTime:1,contactDuration:.001,time:2.5};u=unitSet({mass:odd?'kg':'g',speed:odd?'cm/s':'m/s'});break;
 case'P32':q={mass1:round(17.5+.09*i),mass2:round(18+.08*(i%12)),velocity1:round(.35+.045*i),velocity2:0,restitution:1,collisionTime:1,contactDuration:.01,time:3};u=unitSet({speed:odd?'cm/s':'m/s'});break;
 default:throw new Error(`No practice variants for ${id}`);
 }
 return{...q,_displayUnits:u};
}

/** Complete, current-value question. `table` is required onscreen for P13/P15.
 * `givens` is optional supporting metadata, not additional hidden information.
 */
function legacyQuestion(problem,params=problem.simulation?.params||{},{practice=false}={}){
 const p={...copy(problem.simulation?.params||{}),...copy(params)},id=problem.id;
 const fmt=params._displayUnits?displayFmt:baseFmt;
 const signed=v=>num(v)>0?`+${fmt(v)}`:fmt(v);
 const velocity=(v,positive='east',negative='west')=>num(v)===0?'at rest':`${fmt(Math.abs(num(v)))} m/s ${num(v)>0?positive:negative}`;
 let prompt='',hint='',givens=[],table;
 switch(id){
 case'P01':{
  const first=num(p.turn)-num(p.start),second=num(p.end)-num(p.turn);
  prompt=`A student carries a box ${fmt(Math.abs(first))} m ${dir(first)} to the office, then walks ${fmt(Math.abs(second))} m ${dir(second)} to the closet. What total distance does the student travel?`;
  hint='Distance counts every part of the route. Add the lengths, even when direction changes.';break;
 }
 case'P02':prompt=`A walker starts at position ${signed(p.start)} m and finishes at ${signed(p.end)} m. East is positive. Find the displacement, including its direction.`;hint='Displacement = final position − starting position. Keep the signs.';break;
 case'P03':{
  const laps=num(p.laps,1),complete=nearly(laps,Math.round(laps));
  prompt=`A runner travels ${fmt(laps)} ${laps===1?'lap':'laps'} around a circular track of radius ${fmt(p.radius)} m at ${fmt(p.speed)} m/s.${complete?' The runner finishes at the starting point.':''} Describe the distance traveled and the displacement after this run. Explain.`;
  hint='Distance follows the route. Displacement compares only the starting and finishing positions.';break;
 }
 case'P04':prompt=`A passenger stays seated while a train moves ${velocity(p.speed)}. Describe the passenger’s motion relative to the train and relative to the station platform. Why are the descriptions different?`;hint='Choose the reference point first. A seated passenger keeps the same position inside the train.';break;
 case'P05':prompt=`A student walks ${fmt(p.distance)} m in ${fmt(p.time)} s. What is the average speed, in m/s?`;hint='Average speed = total distance ÷ total elapsed time.';break;
 case'P06':prompt=`A cyclist travels ${velocity(p.speed)} at a steady speed for ${fmt(p.time)} s. How far does the cyclist travel?`;hint='Distance = speed × elapsed time.';break;
 case'P07':prompt=`Two joggers pass a fountain. One moves ${velocity(p.speed)}; the other moves ${velocity(p.otherSpeed)}. Compare their speeds and their velocities. Explain the role of direction.`;hint='Speed is the size of velocity. Velocity also includes direction.';break;
 case'P08':{
  const r=path(p),details=r.times.slice(1).map((t,i)=>{const dt=t-r.times[i],dx=r.positions[i+1]-r.positions[i];return nearly(dx,0)?`rests for ${fmt(dt)} s`:`moves at ${fmt(Math.abs(dx/dt))} m/s for ${fmt(dt)} s`;});
  prompt=`A dog ${details.join(', then ')}. How does the stop affect its average speed for the whole trip? Explain.`;
  hint='Include the stop in the total time. During a stop, no distance is added.';table=tableFor(p);break;
 }
 case'P09':prompt=`A bus moves ${velocity(p.vi)} when the stopwatch reads ${fmt(p.startTime??0)} s, and ${velocity(p.vf)} at ${fmt(p.endTime??p.time)} s. Find its average acceleration over that interval.`;hint='First subtract the stopwatch readings. Then divide the change in velocity by that elapsed time.';break;
 case'P10':prompt=`A runner ${num(p.vi)===0?'starts at rest':`initially moves ${velocity(p.vi)}`}. The runner’s acceleration is ${signed(p.acceleration)} m/s² for ${fmt(p.time)} s, with east positive. What is the final velocity?`;hint='Final velocity = initial velocity + acceleration × time.';break;
 case'P11':prompt=`A remote-control car changes velocity from ${signed(p.vi)} m/s to ${signed(p.vf)} m/s in ${fmt(duration(p))} s. East is positive. Is it speeding up or slowing down? What do the signs mean?`;hint='Compare the sizes of the two velocities to decide whether speed changes. Signs tell direction.';break;
 case'P12':prompt=`A model planet follows a circular orbit at ${fmt(p.orbitAU??1)} times Earth’s orbital radius. Its speed stays constant. Is it accelerating? Explain what changes and what force keeps the path curved.`;hint='Velocity can change when its direction changes, even if its speed stays the same.';break;
 case'P13':{
  const r=path(p);table=tableFor(p);
  prompt=`Use the current distance–time data. What is the walker’s average speed for the entire ${fmt(r.times.at(-1)-r.times[0])} s trip, including any pause?`;
  hint='Use the total distance traveled and the whole elapsed time, including time spent stopped.';break;
 }
 case'P14':prompt=`A scooter travels east throughout. Its speed–time graph rises from ${fmt(p.vi)} m/s at 0 s to ${fmt(p.vf)} m/s at ${fmt(p.time)} s. Find its acceleration over this interval.`;hint='Find the change in speed, then divide by the change in time.';break;
 case'P15':table=tableFor(p);prompt='Use the current distance–time data. Which interval has the greatest average speed? Support your choice using the change in distance and the change in time.';hint='Compare distance change ÷ time change for each interval. The steepest distance–time segment is fastest.';break;
 case'P16':prompt=`Two cyclists ride steadily for ${fmt(p.time)} s: one ${velocity(p.speed)}, the other ${velocity(p.otherSpeed)}. Compare their speed–time graphs. Could those graphs alone tell you their directions?`;hint='A speed graph shows speed, which is never negative. It does not include direction.';break;
 case'P17':prompt=`A science instrument has a mass of ${fmt(p.mass)} kg ${nearly(p.g,3.7)?'on Mars':'at this location'}, where g = ${fmt(p.g)} m/s². What is its weight, in newtons?`;hint='Weight = mass × gravitational acceleration. Mass and weight use different units.';break;
 case'P18':prompt=`A box slides right at steady velocity while a student pushes it with ${fmt(p.forwardForce)} N to the right. What is the sliding friction force? Give its size and direction.`;hint='Steady velocity means zero net force. The horizontal forces must balance.';break;
 case'P19':prompt=`An astronaut and suit have mass ${fmt(p.mass)} kg. Compare a location with g = ${fmt(p.compareG)} m/s² and another with g = ${fmt(p.g)} m/s². Would the mass change? How would the weight compare? Explain.`;hint='Mass is the amount of matter. Weight depends on both mass and local gravity.';break;
 case'P20':prompt=`A crate starts at rest. A ${fmt(p.forwardForce)} N pull acts right. Static friction can reach ${fmt(p.staticLimit)} N; sliding friction is ${fmt(p.kineticFriction)} N. Will it stay at rest? What friction force acts? Explain.`;hint='Static friction adjusts up to a limit. Once the pull exceeds that limit, use the sliding-friction value.';break;
 case'P21':prompt=`A helicopter has ${fmt(p.upwardForce)} N of upward lift and ${fmt(weight(p))} N of downward weight. Ignore other vertical forces. Find the vertical net force and its direction.`;hint='Choose up as positive: net vertical force = upward force − downward force.';break;
 case'P22':prompt=`A balloon has an upward buoyant force of ${fmt(p.upwardForce)} N and total weight of ${fmt(weight(p))} N. Ignore air resistance. Find the vertical net force, including its sign and direction. Up is positive.`;hint='Subtract the downward weight from the upward buoyant force. A negative result points down.';break;
 case'P23':{
  const lift=p.upwardForce??weight(p),thrust=num(p.forwardForce),drag=num(p.backwardForce),vy=num(p.vy);
  prompt=`An airplane moves forward at ${fmt(p.vi)} m/s${vy?` and ${fmt(Math.abs(vy))} m/s ${vy>0?'up':'down'}`:' with no initial vertical motion'}. Lift is ${fmt(lift)} N; weight ${fmt(weight(p))} N; thrust ${fmt(thrust)} N; drag ${fmt(drag)} N. Are the forces balanced horizontally and vertically? Explain how its velocity should change.`;
  hint='Check thrust minus drag, and lift minus weight, separately. Zero net force means unchanged velocity, not necessarily rest.';break;
 }
 case'P24':prompt=`A hockey puck glides ${velocity(p.vi,'right','left')} after contact with the stick ends. Ignore horizontal friction and air resistance. What happens to its velocity? Is a continuing forward push needed?`;hint='Use Newton’s first law: no net force means no change in velocity.';break;
 case'P25':prompt=`Just after leaving the ground, a ${fmt(p.mass)} kg bird has an average upward air force of ${fmt(p.upwardForce)} N and weight of ${fmt(weight(p))} N. Ignore other vertical forces. Find its average vertical acceleration.`;hint='Find the upward-minus-downward net force first. Then divide that net force by the bird’s mass.';break;
 case'P26':prompt=`A drone has a net upward force of ${fmt(p.netForce)} N and accelerates upward at ${fmt(p.acceleration)} m/s². Find its total mass, including its battery.`;hint='Use net force = mass × acceleration. Divide the net force by acceleration to find mass.';break;
 case'P27':prompt=`Two model airplanes have masses ${fmt(p.mass)} kg and ${fmt(p.compareMass)} kg. Each has the same forward net force of ${fmt(p.netForce??num(p.forwardForce)-num(p.backwardForce))} N. Which has greater forward acceleration? Explain how mass affects acceleration at the same net force.`;hint='Compare net force ÷ mass for the two planes. Compare forward acceleration separately from lift and weight.';break;
 case'P28':prompt=`A cyclist follows a circular turn of radius ${fmt(p.radius)} m at a steady ${fmt(p.speed)} m/s. Which way does the net horizontal force point? What force from the road can provide it?`;hint='Consider how the direction of velocity changes around the turn. The tires roll without skidding.';break;
 case'P29':prompt=`A ${fmt(p.mass1)} kg bowling ball moves ${velocity(p.velocity1,'forward','backward')} toward a ${fmt(p.mass2)} kg pin ${num(p.velocity2)===0?'at rest':`moving ${velocity(p.velocity2,'forward','backward')}`}. What is the total momentum of the ball-and-pin system just before impact?`;hint='Add the momentum of both objects: mass × velocity for each. Forward is positive.';break;
 case'P30':prompt=`A ${fmt(p.mass1)} kg clay ball moving ${velocity(p.velocity1,'right','left')} hits a ${fmt(p.mass2)} kg clay ball ${num(p.velocity2)===0?'at rest':`moving ${velocity(p.velocity2,'right','left')}`}.${num(p.restitution)===0?' They stick together.':''} Ignore external horizontal forces. Find the total system momentum before and immediately after the collision.`;hint='Add both initial momenta. With negligible external horizontal forces, the total is conserved during the collision.';break;
 case'P31':prompt=`A ${fmt(p.mass1)} kg marble moving ${velocity(p.velocity1,'right','left')} hits a ${fmt(p.mass2)} kg marble ${num(p.velocity2)===0?'at rest':`moving ${velocity(p.velocity2,'right','left')}`}. During contact, does either exert a larger force? Explain the forces’ directions and which marble each acts on.`;hint='Use Newton’s third law. Compare a force pair, not the two objects’ accelerations.';break;
 case'P32':prompt=`A ${fmt(p.mass1)} kg curling stone moving ${velocity(p.velocity1,'right','left')} hits a ${fmt(p.mass2)} kg stone ${num(p.velocity2)===0?'at rest':`moving ${velocity(p.velocity2,'right','left')}`}. Ignore external horizontal forces during impact. Explain how each stone’s momentum and the total system momentum change.`;hint='Treat both stones as one system. Momentum can transfer between them without changing the system total.';break;
 default:prompt=problem.prompt||'';hint='List the known values and decide what the question asks you to find.';
 }
 if(table)givens=table.headers.map((h,j)=>`${h}: ${table.rows.map(row=>fmt(row[j])).join(', ')}`);
 return{prompt,givens,hint,...(table?{table}:{}),practice:!!practice||!!p._practiceVariant};
}

const UNIT_KINDS={'m/s²':'acceleration','m/s':'speed','kg':'mass','N':'force','m':'distance','s':'time'};
const displayFmt=value=>Number(Number(value).toFixed(6)).toLocaleString('en-US',{maximumFractionDigits:6});
/** Build the same current-value question in its chosen display units. The
 * original packet and ordinary edited SI questions keep their exact wording. */
export function getQuestion(problem,params=problem.simulation?.params||{},options={}){
 if(isExtension(problem))return getExtensionQuestion(problem,params);
 const view=legacyQuestion(problem,params,options),units=params._displayUnits;
 if(units||params._practiceVariant)view.title=({P03:'Running laps around the track',P11:'Backing up: changing speed',P12:'A planet in orbit',P17:'A science instrument on another world',P19:'An astronaut on another world',P20:'Testing static friction'})[problem.id]||problem.title;
 if(!units)return view;
 const quantityPattern=/([+-]?(?:\d[\d,]*(?:\.\d+)?|\.\d+)) (m\/s²|m\/s|kg|N|m|s)(?![A-Za-z/²])/g;
 view.prompt=view.prompt.replace(quantityPattern,(whole,raw,source)=>{
  const target=units[UNIT_KINDS[source]]||source,value=Number(raw.replaceAll(',',''));
  return`${raw.startsWith('+')?'+':''}${displayFmt(displayValue(value*unitFactor(source),target))} ${target}`;
 });
 if(problem.id==='P17'&&params.planet)view.prompt=view.prompt.replace(/on Mars|at this location/,`on ${params.planet==='Moon'?'the Moon':params.planet}`);
 if(problem.numericAnswer){const answer=getAnswerUnit(problem,params).unit;view.prompt=view.prompt.replace(/, in m\/s\?|, in newtons\?/, '?');view.prompt+=` Give your answer in ${answer}${['displacement','finalVelocity','acceleration','netForce','frictionForce','totalMomentum'].includes(problem.numericAnswer.quantity)?', including direction':''}.`;}
 if(view.table){
  const t=units.time||'s',d=units.distance||'m';
  view.table={headers:[`Time (${t})`,`Total distance (${d})`],rows:view.table.rows.map(([time,distance])=>[displayValue(time,t),displayValue(distance,d)])};
  view.givens=view.table.headers.map((h,j)=>`${h}: ${view.table.rows.map(row=>displayFmt(row[j])).join(', ')}`);
 }
 view.unitNote='Convert units when needed. The simulation uses meters, seconds, kilograms, and newtons for its graph and measurement labels.';
 return view;
}
export function listPracticeIds(problem){if(isExtension(problem))return listExtensionPracticeIds(problem);const id=typeof problem==='string'?problem:problem?.id;if(!/^P(?:0[1-9]|[12]\d|3[0-2])$/.test(id||''))return[];return Array.from({length:24},(_,i)=>`${id}-v2-${String(i+1).padStart(2,'0')}`);}
export function getPractice(problem,variantId){
 if(isExtension(problem))return getExtensionPractice(problem,variantId);
 const index=listPracticeIds(problem).indexOf(variantId);if(index<0)throw new Error(`Unknown practice variant: ${variantId}`);
 const params={...copy(problem.simulation.params),...variantParams(problem.id,index),_practiceVariant:variantId};
 const question=getQuestion(problem,params,{practice:true});
 return{params,...question,variantId,title:question.title||problem.title};
}
/** A repeated random draw still walks through the bank instead of toggling
 * between just two variants. Immediate repetition is always excluded. */
export function generatePractice(problem,previousParams={},rng=Math.random){
 const ids=listPracticeIds(problem);if(!ids.length)throw new Error(`No practice variants for ${problem.id}`);
 const previous=ids.indexOf(previousParams?._practiceVariant),draw=Math.max(0,Math.min(.999999999999,num(rng(),0)));
 const index=previous<0?Math.floor(draw*ids.length):(previous+1+Math.floor(draw*(ids.length-1)))%ids.length;
 return getPractice(problem,ids[index]);
}
