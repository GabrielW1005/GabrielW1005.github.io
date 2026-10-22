/* Additional practice is generated from three reviewed variants per problem.
   These pure helpers never modify the printed packet or its saved answers. */
const copy=v=>Array.isArray(v)?v.map(copy):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([k,x])=>[k,copy(x)])):v;
const num=(v,fallback=0)=>Number.isFinite(Number(v))?Number(v):fallback;
const fmt=v=>{const n=num(v);return Number(n.toFixed(Math.abs(n)>0&&Math.abs(n)<.1?4:3)).toLocaleString('en-US',{maximumFractionDigits:Math.abs(n)>0&&Math.abs(n)<.1?4:3});};
const signed=v=>num(v)>0?`+${fmt(v)}`:fmt(v);
const velocity=(v,positive='east',negative='west')=>num(v)===0?'at rest':`${fmt(Math.abs(num(v)))} m/s ${num(v)>0?positive:negative}`;
const dir=v=>num(v)<0?'west':'east';
const nearly=(a,b)=>Math.abs(num(a)-num(b))<1e-8;
const path=p=>({times:(p.times||[0,10,20,30]).map(t=>num(t)*num(p.timeScale,1)),positions:(p.positions||[0,12,12,30]).map(x=>num(x)*num(p.distanceScale,1))});
const tableFor=p=>{const r=path(p);return{headers:['Time (s)','Total distance (m)'],rows:r.times.map((t,i)=>[t,r.positions[i]])};};
const duration=p=>p.startTime!==undefined&&p.endTime!==undefined?num(p.endTime)-num(p.startTime):num(p.time,1);
const weight=p=>p.weight!==undefined?num(p.weight):num(p.mass)*num(p.g,10);
const variants={
 P01:[{start:0,turn:15,end:9,speed:1.2},{start:0,turn:18,end:7,speed:1.4},{start:0,turn:10,end:4,speed:1}],
 P02:[{start:-4,turn:8,end:8,speed:1.4},{start:-9,turn:6,end:6,speed:1.2},{start:3,turn:11,end:11,speed:1.5}],
 P03:[{radius:12,speed:2,laps:1},{radius:25,speed:2.5,laps:2},{radius:30,speed:4,laps:1}],
 P04:[{speed:8,time:6,frame:0},{speed:12,time:10,frame:0},{speed:15,time:8,frame:0}],
 P05:[{distance:120,time:100},{distance:210,time:150},{distance:240,time:150}],
 P06:[{speed:3,time:30},{speed:5,time:20},{speed:4.5,time:40}],
 P07:[{speed:1.5,otherSpeed:-1.5,time:10},{speed:3,otherSpeed:-3,time:6},{speed:2.5,otherSpeed:-2.5,time:8}],
 P08:[{times:[0,8,16,24],positions:[0,12,12,24],distanceScale:1,timeScale:1},{times:[0,10,15,25],positions:[0,15,15,30],distanceScale:1,timeScale:1},{times:[0,12,18,30],positions:[0,24,24,48],distanceScale:1,timeScale:1}],
 P09:[{vi:3,vf:9,startTime:2,endTime:8,time:6},{vi:5,vf:11,startTime:4,endTime:8,time:4},{vi:2,vf:10,startTime:1,endTime:5,time:4}],
 P10:[{vi:1.5,acceleration:.5,time:3},{vi:2,acceleration:.25,time:4},{vi:3,acceleration:.5,time:2}],
 P11:[{vi:-.5,vf:-2,time:3},{vi:-1,vf:-2.5,time:3},{vi:-1.5,vf:-3,time:2}],
 P12:[{orbital:true,orbitAU:.8,laps:1},{orbital:true,orbitAU:1.2,laps:1},{orbital:true,orbitAU:1.5,laps:1}],
 P13:[{times:[0,8,16,24],positions:[0,8,8,24],distanceScale:1,timeScale:1},{times:[0,10,20,30],positions:[0,10,10,36],distanceScale:1,timeScale:1},{times:[0,12,18,30],positions:[0,18,18,36],distanceScale:1,timeScale:1}],
 P14:[{vi:1,vf:5,time:4},{vi:2,vf:5,time:6},{vi:3,vf:7,time:8}],
 P15:[{times:[0,10,20,30],positions:[0,16,24,28],distanceScale:1,timeScale:1},{times:[0,8,16,24],positions:[0,4,12,24],distanceScale:1,timeScale:1},{times:[0,6,12,18],positions:[0,3,15,21],distanceScale:1,timeScale:1}],
 P16:[{speed:2,otherSpeed:-2,time:8},{speed:4,otherSpeed:-4,time:5},{speed:5,otherSpeed:-5,time:6}],
 P17:[{mass:8,g:3.7,planet:'Mars'},{mass:12,g:3.7,planet:'Mars'},{mass:25,g:3.7,planet:'Mars'}],
 P18:[{mass:20,forwardForce:24,backwardForce:24,vi:.8,time:4,steady:true},{mass:20,forwardForce:40,backwardForce:40,vi:1.2,time:3,steady:true},{mass:20,forwardForce:30,backwardForce:30,vi:1.5,time:3,steady:true}],
 P19:[{mass:140,g:3.7,compareG:10,planet:'Mars'},{mass:180,g:3.7,compareG:10,planet:'Mars'},{mass:200,g:3.7,compareG:10,planet:'Mars'}],
 P20:[{mass:20,forwardForce:12,staticLimit:20,kineticFriction:15,vi:0,time:3},{mass:20,forwardForce:8,staticLimit:16,kineticFriction:12,vi:0,time:3},{mass:20,forwardForce:28,staticLimit:24,kineticFriction:18,vi:0,time:3}],
 P21:[{upwardForce:9200,weight:8000,g:10,vi:0,height:30,time:4},{upwardForce:13000,weight:14000,g:10,vi:0,height:30,time:4},{upwardForce:18000,weight:16000,g:10,vi:0,height:30,time:4}],
 P22:[{upwardForce:8800,weight:9000,g:10,vi:0,height:50,time:6},{upwardForce:12500,weight:12000,g:10,vi:0,height:50,time:6},{upwardForce:9900,weight:10000,g:10,vi:0,height:50,time:6}],
 P23:[{flight2D:true,balancedFlight:false,mass:1000,weight:10000,g:10,upwardForce:10000,forwardForce:2500,backwardForce:2500,vi:55,vy:0,height:250,time:5},{flight2D:true,balancedFlight:false,mass:1600,weight:16000,g:10,upwardForce:16000,forwardForce:4000,backwardForce:4000,vi:65,vy:0,height:250,time:5},{flight2D:true,balancedFlight:false,mass:800,weight:8000,g:10,upwardForce:8000,forwardForce:2000,backwardForce:2000,vi:45,vy:0,height:250,time:5}],
 P24:[{mass:.17,forwardForce:0,backwardForce:0,vi:2,time:5},{mass:.17,forwardForce:0,backwardForce:0,vi:4,time:3},{mass:.17,forwardForce:0,backwardForce:0,vi:5,time:4}],
 P25:[{axis:'vertical',mass:.3,g:10,upwardForce:3.6,vi:0,height:.2,time:2,ground:true},{axis:'vertical',mass:.8,g:10,upwardForce:10,vi:0,height:.2,time:2,ground:true},{axis:'vertical',mass:.2,g:10,upwardForce:2.3,vi:0,height:.2,time:2,ground:true}],
 P26:[{axis:'vertical',netForce:2,acceleration:1,g:10,vi:0,height:1,time:3,ground:true},{axis:'vertical',netForce:1.5,acceleration:1,g:10,vi:0,height:1,time:3,ground:true},{axis:'vertical',netForce:4,acceleration:2.5,g:10,vi:0,height:1,time:3,ground:true}],
 P27:[{flight2D:true,mass:.3,compareMass:.6,g:10,netForce:.6,backwardForce:.3,upwardForce:3,compareLift:6,vi:6,vy:0,height:100,time:3},{flight2D:true,mass:.5,compareMass:1,g:10,netForce:1,backwardForce:.5,upwardForce:5,compareLift:10,vi:7,vy:0,height:100,time:3},{flight2D:true,mass:.6,compareMass:1.2,g:10,netForce:.9,backwardForce:.3,upwardForce:6,compareLift:12,vi:8,vy:0,height:100,time:3}],
 P28:[{radius:8,speed:3,laps:1,mass:65},{radius:12,speed:4,laps:1,mass:70},{radius:15,speed:5,laps:1,mass:80}],
 P29:[{mass1:4,mass2:1.5,velocity1:4,velocity2:0,preImpact:true,collisionTime:1.2,time:1.2},{mass1:5,mass2:1.5,velocity1:2.5,velocity2:0,preImpact:true,collisionTime:1.2,time:1.2},{mass1:7,mass2:1.5,velocity1:5,velocity2:0,preImpact:true,collisionTime:1.2,time:1.2}],
 P30:[{mass1:.05,mass2:.1,velocity1:1,velocity2:0,radius1:.018,radius2:.023,restitution:0,collisionTime:1,contactDuration:.008,time:2},{mass1:.1,mass2:.2,velocity1:1.5,velocity2:0,radius1:.023,radius2:.029,restitution:0,collisionTime:1,contactDuration:.008,time:2},{mass1:.2,mass2:.1,velocity1:2,velocity2:0,radius1:.029,radius2:.023,restitution:0,collisionTime:1,contactDuration:.008,time:2}],
 P31:[{mass1:.01,mass2:.02,velocity1:.4,velocity2:0,radius1:.01,radius2:.012,restitution:1,collisionTime:1,contactDuration:.001,time:2.5},{mass1:.02,mass2:.03,velocity1:.6,velocity2:0,radius1:.012,radius2:.014,restitution:1,collisionTime:1,contactDuration:.001,time:2.5},{mass1:.03,mass2:.02,velocity1:.8,velocity2:0,radius1:.014,radius2:.012,restitution:1,collisionTime:1,contactDuration:.001,time:2.5}],
 P32:[{mass1:18,mass2:18,velocity1:.6,velocity2:0,restitution:1,collisionTime:1,contactDuration:.01,time:3},{mass1:19,mass2:19,velocity1:.8,velocity2:0,restitution:1,collisionTime:1,contactDuration:.01,time:3},{mass1:20,mass2:20,velocity1:1.2,velocity2:0,restitution:1,collisionTime:1,contactDuration:.01,time:3}]
};

/** Complete, current-value question. `table` is required onscreen for P13/P15.
 * `givens` is optional supporting metadata, not additional hidden information.
 */
export function getQuestion(problem,params=problem.simulation?.params||{},{practice=false}={}){
 const p={...copy(problem.simulation?.params||{}),...copy(params)},id=problem.id;
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

/** Choose a reviewed variant other than the immediately preceding variant. */
export function generatePractice(problem,previousParams={},rng=Math.random){
 const choices=variants[problem.id];
 if(!choices)throw new Error(`No practice variants for ${problem.id}`);
 const prior=previousParams?._practiceVariant;
 const available=choices.map((_,i)=>i).filter(i=>`${problem.id}-${i+1}`!==prior);
 const draw=Math.max(0,Math.min(.999999999999,num(rng(),0)));
 const index=available[Math.floor(draw*available.length)];
 const variantId=`${problem.id}-${index+1}`;
 const params={...copy(problem.simulation.params),...copy(choices[index]),_practiceVariant:variantId};
 if(problem.id==='P02')params.turn=params.end;
 if(problem.id==='P09')params.time=params.endTime-params.startTime;
 if(problem.id==='P12')params.radius=params.orbitAU*149600000000;
 if(problem.id==='P18')params.backwardForce=params.forwardForce;
 if(problem.id==='P23'){params.flight2D=true;params.balancedFlight=false;params.upwardForce=params.weight;params.backwardForce=params.forwardForce;params.vy=0;params.mass=params.weight/num(params.g,10);}
 if(problem.id==='P27'){params.flight2D=true;params.upwardForce=params.mass*num(params.g,10);params.compareLift=params.compareMass*num(params.g,10);params.forwardForce=num(params.netForce)+num(params.backwardForce);params.vy=0;}
 const question=getQuestion(problem,params,{practice:true});
 return{params,...question,variantId,title:problem.title};
}
