/* Student predictions are counterfactual physical experiments, never overwritten readouts. */
import {evaluate,modelInfo,solve,format} from './physics.js?v=20261022-5';
const clone=o=>JSON.parse(JSON.stringify(o));
const finite=Number.isFinite;
export const closeEnough=(value,goal)=>finite(value)&&finite(goal)&&Math.abs(value-goal)<=(goal===0?.005:Math.max(1e-6,Math.abs(goal)*.005));
const fail=error=>({ok:false,error});
const field=(key,label,unit,min,max,step,value)=>({key,label,unit,min,max,step,value});
const angleError=(a,b)=>Math.abs(((a-b+540)%360+360)%360-180);
const positive=(n,label)=>!finite(n)||n<=0?`${label} must be greater than zero for this experiment.`:null;
function withKind(problem,kind){const p=clone(problem);p.simulation.kind=kind;return p;}
function envelope(problem,referenceParams,trialParams,value,expected,unit,explanation,options={}){
 const trialProblem=options.problem||problem;
 const referenceInfo=modelInfo(problem,referenceParams),trialInfo=modelInfo(trialProblem,trialParams);
 let duration=options.duration??Math.max(referenceInfo.duration,trialInfo.duration);
 if(problem.simulation.kind==='gravity'&&options.duration===undefined){const k=Number(trialParams.springK||500),slowest=Math.min(Math.sqrt(k/Number(referenceParams.mass)),Math.sqrt(k/Number(trialParams.mass)));duration=Math.max(duration,9/(.45*slowest));}
 const correct=options.correct??closeEnough(value,expected);
 for(const t of [0,Math.min(duration,trialInfo.duration)/2,Math.min(duration,trialInfo.duration)]){const state=evaluate(trialProblem,trialParams,t);if(![state.x,state.v,state.a,...state.readouts.map(r=>r.value),...state.bodies.flatMap(b=>[b.x,b.v,b.a,...(b.y!==undefined?[b.y,b.vy,b.ay]:[])])].every(finite))return fail('That prediction exceeds the numerical range of this model. Try a closer estimate.');if(state.bodies.some(b=>Math.hypot(b.v,b.vy||0)>1e6))return fail('That prediction requires speeds beyond this Newtonian classroom model. Try a closer estimate.');}
 return {ok:true,problem:trialProblem,params:clone(trialParams),referenceProblem:problem,referenceParams:clone(referenceParams),quantity:options.quantity||problem.numericAnswer?.quantity||'observation',value,expected,unit,explanation,comparisonLabel:options.comparisonLabel||'Your prediction compared with the given situation',duration,correct,...options,
  trialProblem,trialParams:clone(trialParams),predictedValue:value,referenceValue:expected,success:correct,feedback:explanation};
}
function validNumber(value){return finite(value)&&Math.abs(value)<=1e9;}
export function createPrediction(problem,params,value){
 value=Number(value);if(!validNumber(value))return fail('Enter a finite number between −1 billion and 1 billion.');
 if(!problem.numericAnswer)return fail('Use this problem’s exploration controls.');
 const reference=clone(params),trial=clone(params),quantity=problem.numericAnswer.quantity,result=solve(problem,params,quantity),expected=result.value,unit=result.unit||problem.numericAnswer.unit;
 let explanation='',trialProblem=problem;
 if(!finite(expected))return fail('The given measurements do not define a valid experiment.');
 switch(problem.id){
  case 'P01':{
   if(value<0)return fail('Total distance cannot be negative. Try zero or a positive distance.');
   const start=Number(params.start),turn=Number(params.turn),first=Math.abs(turn-start),direction=Math.sign(turn-start)||1;
   const secondDirection=Math.sign(Number(params.end)-turn)||-direction;trial.turn=value<=first?start+direction*value:turn;trial.end=value<=first?trial.turn:turn+secondDirection*(value-first);
   explanation=`Your ${format(value)} m prediction traces that much of the route. The two stated path segments total ${format(expected)} m. A shorter prediction stops early; a longer one continues beyond the stated finish.`;break;
  }
  case 'P02':trial.end=Number(params.start)+value;trial.turn=trial.end;explanation=`A displacement of ${format(value)} m places the finish at ${format(trial.end)} m. Compare that point with the given finish at ${format(params.end)} m.`;break;
  case 'P05':
   if(value<0)return fail('Speed is a magnitude, so it cannot be negative.');
   delete trial.distance;trial.speed=value;explanation=`At your predicted ${format(value)} m/s, the walker covers ${format(value*params.time)} m in ${format(params.time)} s. The given trip covers ${format(params.distance)} m.`;break;
  case 'P06':
   if(value<0)return fail('Distance cannot be negative.');
   trial.speed=value/Number(params.time);delete trial.distance;explanation=`Your ${format(value)} m prediction would require ${format(trial.speed)} m/s for ${format(params.time)} s. The reference cyclist uses the given ${format(params.speed)} m/s.`;break;
  case 'P09':case 'P14':{
   trial.acceleration=value;delete trial.vf;const elapsed=params.startTime!==undefined?params.endTime-params.startTime:params.time;
   explanation=`Your acceleration makes the final velocity ${format(params.vi+value*elapsed)} m/s after ${format(elapsed)} s. The given final velocity is ${format(params.vf)} m/s.`;break;
  }
  case 'P10':trial.acceleration=(value-Number(params.vi))/Number(params.time);delete trial.vf;explanation=`Reaching your predicted ${format(value)} m/s would require ${format(trial.acceleration)} m/s². The given acceleration is ${format(params.acceleration)} m/s².`;break;
  case 'P13':{
   if(value<0)return fail('Average speed cannot be negative.');
   const elapsed=modelInfo(problem,params).duration,scale=expected?value/expected:0;
   trial.positions=params.positions.map(x=>x*Number(params.distanceScale??1)*scale);trial.distanceScale=1;
   explanation=`Your average speed corresponds to ${format(value*elapsed)} m in ${format(elapsed)} s. The reference follows the table’s route, including its pause.`;break;
  }
  case 'P17':{
   const error=positive(value,'Weight');if(error)return fail(error);if(value<1e-6)return fail('Use a weight of at least 0.000001 N in this numerical model.');
   trial.mass=value/Number(params.g);explanation=`At the given gravity, ${format(value)} N would be the weight of ${format(trial.mass)} kg. The actual instrument is ${format(params.mass)} kg. The scales load and settle to these two weights.`;break;
  }
  case 'P18':
   if(value<0)return fail('Enter the friction force’s size as a nonnegative number; its direction is left.');
   trial.steady=false;trial.backwardForce=value;trial.kineticFriction=value;trial.staticLimit=0;
   explanation=`Your friction is ${format(value)} N left against a ${format(params.forwardForce)} N rightward push. Watch whether the box speeds up, slows, or keeps the stated steady velocity. If it stops, static friction then balances the push.`;break;
  case 'P21':case 'P22':{
   trial.upwardForce=Number(params.weight)+value;
   if(trial.upwardForce<0)return fail(`With only upward lift and downward weight, net force cannot be below −${format(params.weight)} N. That prediction would require an additional downward force.`);
   explanation=`Your net force would require ${format(trial.upwardForce)} N upward against ${format(params.weight)} N of weight. Compare its vertical motion with the given upward force of ${format(params.upwardForce)} N.`;break;
  }
  case 'P25':{
   const weight=Number(params.mass)*Number(params.g);trial.upwardForce=weight+Number(params.mass)*value;
   if(trial.upwardForce<0)return fail(`That acceleration would require a downward air force. This model has only upward air force and weight; try an acceleration of at least −${format(params.g)} m/s².`);
   explanation=`Your acceleration would need an upward air force of ${format(trial.upwardForce)} N. The given air force is ${format(params.upwardForce)} N, with ${format(weight)} N of weight downward.`;break;
  }
  case 'P26':{
   const error=positive(value,'Mass');if(error)return fail(error);if(value<1e-6)return fail('Use a mass of at least 0.000001 kg in this numerical model.');
   trial.mass=value;delete trial.acceleration;explanation=`With the given ${format(params.netForce)} N net force, your ${format(value)} kg drone accelerates at ${format(params.netForce/value)} m/s². Compare with the stated ${format(params.acceleration)} m/s².`;break;
  }
  case 'P29':case 'P30':
   trial.velocity1=(value-Number(params.mass2)*Number(params.velocity2))/Number(params.mass1);
   explanation=`Your total momentum implies a blue-object velocity of ${format(trial.velocity1)} m/s; the given velocity is ${format(params.velocity1)} m/s. ${problem.id==='P30'?'For a collision, the total remains the same before and after the balls stick. A backward-moving prediction will not collide with the object ahead.':'The stationary pin contributes zero momentum. This model ends before impact.'}`;break;
  default:return fail('This question does not yet have a prediction experiment.');
 }
 return envelope(problem,reference,trial,value,expected,unit,explanation,{problem:trialProblem,quantity});
}
function actualFriction(problem,p){return evaluate(problem,p,0).forces.find(f=>f.label==='Friction')?.value??0;}
function intervals(p){const ts=Number(p.timeScale??1),ds=Number(p.distanceScale??1);return p.times.slice(0,-1).map((start,i)=>({start:start*ts,end:p.times[i+1]*ts,speed:Math.abs(p.positions[i+1]-p.positions[i])*ds/((p.times[i+1]-start)*ts)}));}
function contactInfo(problem,p){const event=modelInfo(problem,p).eventTimes.find(e=>e.label==='Contact');const time=event?.time??p.collisionTime;const state=evaluate(problem,p,time);return{time,force:state.forces.find(f=>f.body===1)?.value||0};}
export function getExploration(problem,params){
 const p=params;let instruction='',controls=[],goal='Compare your proposed result with the physical reference.';
 switch(problem.id){
  case 'P03':{const laps=Number(p.laps||1);instruction=`Choose where the runner should finish after the stated ${format(laps)} full ${laps===1?'lap':'laps'}. Displacement should be zero, while traveled distance is not zero.`;controls=[field('finishLap','Finish after this many laps','lap',0,laps,.05,Math.min(.25,laps/4))];break;}
  case 'P04':instruction='Set the observer’s eastward velocity so the seated passenger appears stationary. Compare this with the stationary platform view.';controls=[field('referenceVelocity','Observer velocity','m/s',0,Math.max(20,p.speed*2),.5,0)];break;
  case 'P07':instruction=`Make the orange jogger move in the opposite direction at the blue jogger’s speed of ${format(Math.abs(p.speed))} m/s. Use the sign to choose direction.`;controls=[field('velocity','Orange jogger velocity','m/s',-Math.max(6,p.speed*2),Math.max(6,p.speed*2),.1,Math.abs(p.speed))];break;
  case 'P08':{
   const ts=Number(p.timeScale??1),pause=(p.times[2]-p.times[1])*ts;
   instruction=`Set the dog’s stop so the journey takes the full ${format((p.times.at(-1)-p.times[0])*ts)} s, while both moving portions keep their given speeds. Watch how waiting changes average speed.`;controls=[field('pauseTime','Time stopped','s',0,Math.max(30,pause*2),1,0)];break;
  }
  case 'P11':{
   const a=solve(problem,p,'acceleration').value;instruction=`Set acceleration so the westbound car changes from ${format(p.vi)} to ${format(p.vf)} m/s in ${format(p.time)} s. Notice whether a negative acceleration can increase speed.`;controls=[field('acceleration','Proposed acceleration','m/s²',-5,5,.1,Math.abs(a)||1)];break;
  }
  case 'P12':instruction='The model planet is shown to the right of the Sun. Aim the Sun’s gravitational force to keep its path curved. Angle: 0° right, 90° up, 180° left, 270° down.';controls=[field('angle','Gravity arrow direction','°',0,360,5,0)];break;
  case 'P15':{
   const list=intervals(p),width=list[0].end-list[0].start,total=p.times.at(-1)*Number(p.timeScale??1),best=list.reduce((a,b)=>b.speed>a.speed?b:a),initial=(list.find(interval=>interval.speed<best.speed-1e-9)||list.at(-1)).start;instruction=`Slide a ${format(width)} s window to the interval with the greatest average speed. Compare distance covered in equal times and graph steepness.`;controls=[field('windowStart','Start of your time window','s',list[0].start,total-width,Number(p.timeScale??1),initial)];break;
  }
  case 'P16':instruction='Make the cyclists’ speed graphs overlap while they ride in opposite directions. Adjust the orange cyclist’s signed velocity; speed is never negative.';controls=[field('velocity','Orange cyclist velocity','m/s',-Math.max(6,p.speed*2),Math.max(6,p.speed*2),.1,Math.abs(p.speed))];break;
  case 'P19':instruction=`The same astronaut and suit have mass ${format(p.mass)} kg before the trip. Set their mass on the other planet, then compare the scale readings. Gravity changes weight, not the amount of matter.`;controls=[field('mass','Mass on the other planet','kg',Math.max(1,p.mass*.25),p.mass*2,5,p.mass*.5)];break;
  case 'P20':{
   const f=actualFriction(problem,p),max=Math.max(p.staticLimit||18,Math.abs(f))*1.5;
   instruction=`Draw the friction force for the current ${format(p.forwardForce)} N rightward pull. Right is positive; left is negative. The ${format(p.staticLimit)} N static-friction value is a limit, not an automatic force.`;controls=[field('frictionForce','Your friction arrow','N',-max,max,1,Math.abs(f)<.01?-Number(p.staticLimit):0)];break;
  }
  case 'P23':{
   const drag=Number(p.backwardForce),weight=Number(p.weight);instruction=`Set thrust and lift so the airplane keeps its velocity unchanged: horizontal ${format(p.vi)} m/s and vertical ${format(p.vy||0)} m/s. Balance each force component. ${Number(p.vy||0)===0?'With zero initial vertical velocity, this gives level flight.':'Zero vertical net force preserves the existing climb or descent; it does not instantly stop it.'}`;
   controls=[field('proposedThrust','Your thrust','N',0,Math.max(6000,drag*2),100,drag+1000),field('proposedLift','Your lift','N',0,Math.max(24000,weight*2),500,weight*.75)];break;
  }
  case 'P24':instruction='After the stick releases the puck, choose the ongoing horizontal force needed to keep its velocity unchanged. Friction and air resistance are neglected.';controls=[field('netForce','Proposed ongoing force','N',-.5,.5,.01,.17)];break;
  case 'P27':{
   const expected=Number(p.netForce)/Number(p.compareMass);instruction=`Set the orange plane’s horizontal acceleration under the same ${format(p.netForce)} N net force. Compare the acceleration of the ${format(p.mass)} kg blue plane with the ${format(p.compareMass)} kg orange plane.`;controls=[field('acceleration','Orange acceleration','m/s²',.1,Math.max(6,expected*3),.1,expected*2)];break;
  }
  case 'P28':instruction='The cyclist is at the right side of the turn. Aim the horizontal force from the road to keep the path curved at constant speed. This force is static friction at the tires.';controls=[field('angle','Road-force direction','°',0,360,5,0)];break;
  case 'P31':{
   const c=contactInfo(problem,p);instruction=`At contact, the orange marble pushes the blue marble left with ${format(c.force)} N. Set the force on the orange marble. Positive points right; negative points left.`;controls=[field('forceN','Your force on orange','N',-Math.ceil(c.force*2),Math.ceil(c.force*2),.01,Number((c.force*.5).toFixed(2)))];break;
  }
  case 'P32':{
   const momentum=Number(p.mass1)*Number(p.velocity1)+Number(p.mass2)*Number(p.velocity2);instruction=`The system has ${format(momentum)} kg·m/s of momentum before impact. Set the total that should remain after the collision, then watch how momentum is shared between the stones.`;controls=[field('totalMomentum','Total momentum after collision','kg·m/s',-Math.max(40,momentum*2),Math.max(40,momentum*2),1,momentum/2)];break;
  }
  default:return null;
 }
 return{instruction,controls,initial:Object.fromEntries(controls.map(c=>[c.key,c.value])),goal};
}
export function createExploration(problem,params,values){
 const spec=getExploration(problem,params);if(!spec)return fail('This question uses a numerical prediction.');
 const control=spec.controls[0],input=Number(values?.[control.key]);
 for(const c of spec.controls){const entered=Number(values?.[c.key]);if(!validNumber(entered))return fail(`Enter a finite number for ${c.label.toLowerCase()}.`);if(entered<c.min-1e-9||entered>c.max+1e-9)return fail(`Choose ${c.label.toLowerCase()} from ${format(c.min)} to ${format(c.max)} ${c.unit}.`);}
 const reference=clone(params),trial=clone(params);let trialProblem=problem,value=input,expected=0,unit=control.unit,explanation='',options={quantity:control.key};
 switch(problem.id){
  case 'P03':{
   const duration=modelInfo(problem,params).duration,laps=Number(params.laps||1);expected=laps;options={...options,correct:Math.abs(input-laps)<1e-6,sampleTime:input/laps*duration,referenceSampleTime:duration,duration};explanation=input===0?'At the start, both distance and displacement are zero. The stated journey must include nonzero distance.':`After ${format(input)} ${input===1?'lap':'laps'}, compare the finish with the start. Completing ${format(laps)} full ${laps===1?'lap':'laps'} returns to the start with nonzero traveled distance and zero displacement.`;break;
  }
  case 'P04':expected=Number(params.speed);reference.frame=0;delete reference.referenceSpeed;delete trial.frame;trial.referenceSpeed=input;explanation=`In your observer’s frame, the passenger’s velocity is ${format(params.speed-input)} m/s. It becomes zero when the observer moves with the train. Relative to the platform, the passenger still moves at ${format(params.speed)} m/s.`;break;
  case 'P07':case 'P16':options.observedBody=1;expected=-Math.abs(Number(params.speed));trial.otherSpeed=input;reference.otherSpeed=expected;explanation=`Blue speed: ${format(Math.abs(params.speed))} m/s. Orange speed: ${format(Math.abs(input))} m/s. ${input<0?'Their velocities point in opposite directions.':'Your orange velocity currently points in the same direction as blue.'} Equal speeds can still mean different velocities.`;break;
  case 'P08':{
   const ts=Number(params.timeScale??1),ds=Number(params.distanceScale??1),t1=(params.times[1]-params.times[0])*ts,t2=(params.times[3]-params.times[2])*ts;expected=(params.times[2]-params.times[1])*ts;
   trial.times=[0,t1,t1+input,t1+input+t2];trial.timeScale=1;trial.positions=params.positions.map(x=>x*ds);trial.distanceScale=1;
   const avg=solve(problem,trial,'averageSpeed').value;explanation=`Your stop lasts ${format(input)} s, so the trip takes ${format(t1+input+t2)} s and averages ${format(avg)} m/s. Waiting adds time without adding distance.`;break;
  }
  case 'P11':expected=solve(problem,params,'acceleration').value;trial.acceleration=input;delete trial.vf;explanation=`Your final velocity is ${format(params.vi+input*params.time)} m/s. Acceleration toward the west is negative; when velocity also points west, that acceleration increases speed.`;break;
  case 'P12':case 'P28':{
   expected=180;const state=evaluate(problem,params,0),magnitude=problem.id==='P12'?state.inwardAcceleration:Number(params.mass)*state.inwardAcceleration;
   options={...options,correct:angleError(input,expected)<=3,duration:4,sampleTime:0,referenceSampleTime:0,overlay:{type:'vector',angle:input,magnitude,expectedAngle:180,expectedMagnitude:magnitude,body:0,label:problem.id==='P12'?'Your gravity direction':'Your road-force direction',expectedLabel:'Physical inward direction',origin:problem.id==='P12'?'orbit':'turn',axis:'horizontal'}};
   explanation='At the right-hand point of the circle, inward is left (180°). The force changes velocity’s direction. A tangential force would change speed; an outward force would not keep this circular path.';break;
  }
  case 'P15':{
   const list=intervals(params),best=list.reduce((a,b)=>b.speed>a.speed?b:a),width=list[0].end-list[0].start;expected=best.start;options={...options,sampleTime:input+width,referenceSampleTime:best.end,duration:modelInfo(problem,params).duration,overlay:{type:'interval',start:input,end:input+width,expectedStart:best.start,expectedEnd:best.end}};
   const a=evaluate(problem,params,input),b=evaluate(problem,params,input+width);explanation=`Your window covers ${format(b.distance-a.distance)} m in ${format(width)} s. The steepest segment, ${format(best.start)}–${format(best.end)} s, has the greatest speed.`;break;
  }
  case 'P19':expected=Number(params.mass);reference.g=Number(params.compareG||10);reference.planet='Earth';delete reference.compareG;trial.mass=input;delete trial.compareG;options.referenceLabel='Earth: same astronaut';options.proposalLabel='Other planet: your mass';explanation=`Your chosen mass would weigh ${format(input*params.g)} N here. The same astronaut and suit keep their ${format(params.mass)} kg mass; changing gravity changes the scale’s force reading.`;break;
  case 'P20':{
   expected=actualFriction(problem,params);options={...options,duration:4,sampleTime:0,referenceSampleTime:0,overlay:{type:'vector',angle:input<0?180:0,magnitude:Math.abs(input),expectedAngle:expected<0?180:0,expectedMagnitude:Math.abs(expected),body:0,label:'Your predicted friction',expectedLabel:'Physical friction',origin:'body',axis:'horizontal'}};
   explanation=Math.abs(params.forwardForce)<=params.staticLimit?`Static friction adjusts to ${format(Math.abs(expected))} N left, balancing the pull. Your arrow is a prediction, not an extra force on the crate. Friction does not pull a resting crate backward by exceeding the pull.`:`This pull exceeds the ${format(params.staticLimit)} N static limit, so the model uses ${format(Math.abs(expected))} N of sliding friction left. Your arrow is compared with that force.`;break;
  }
  case 'P23':{
   expected=0;unit='N';trial.flight2D=true;delete trial.balancedFlight;trial.forwardForce=input;trial.upwardForce=Number(values.proposedLift);
   reference.forwardForce=Number(params.backwardForce);reference.upwardForce=Number(params.weight);reference.flight2D=true;delete reference.balancedFlight;
   const fx=input-Number(params.backwardForce),fy=Number(values.proposedLift)-Number(params.weight);value=Math.hypot(fx,fy);options.quantity='netForceMagnitude';options.correct=closeEnough(fx,0)&&closeEnough(fy,0);
   explanation=`Your horizontal net force is ${format(fx)} N; your vertical net force is ${format(fy)} N. Thrust must equal the ${format(params.backwardForce)} N drag, and lift must equal the ${format(params.weight)} N weight, to keep both velocity components unchanged. ${Number(params.vy||0)===0?'Balanced vertical forces preserve level flight here.':`The existing ${format(params.vy)} m/s vertical velocity continues even when vertical forces balance.`}`;break;
  }
  case 'P24':expected=0;trial.forwardForce=input;trial.backwardForce=0;explanation=`Your ongoing force gives ${format(input/params.mass)} m/s² of acceleration. With no ongoing horizontal force, the released puck keeps its velocity in this friction-free model.`;break;
  case 'P27':{
   options.observedBody=1;const error=positive(input,'Acceleration');if(error)return fail(error);expected=Number(params.netForce)/Number(params.compareMass);trial.compareMass=Number(params.netForce)/input;
   explanation=`At the same ${format(params.netForce)} N force, your acceleration would imply an orange mass of ${format(trial.compareMass)} kg. The given orange mass is ${format(params.compareMass)} kg. At equal horizontal net force, doubling mass halves horizontal acceleration. Lift is held at ${format(params.compareLift??params.compareMass*(params.g||10))} N, so changing the proposed mass also changes weight and can make this trial climb or descend.`;break;
  }
  case 'P31':{
   const c=contactInfo(problem,params);value=input;expected=c.force;unit='N';options={...options,correct:closeEnough(input,c.force),duration:Math.max(2,c.time+.5),sampleTime:c.time,referenceSampleTime:c.time,overlay:{type:'vector',angle:value<0?180:0,magnitude:Math.abs(value),expectedAngle:0,expectedMagnitude:c.force,body:1,label:'Your force on orange',expectedLabel:'Physical force on orange',origin:'body',axis:'horizontal'}};
   explanation=`Your orange force is ${format(value)} N (${value<0?'left':'right'}). The physical contact force is ${format(expected)} N right, opposite the force on blue. The forces act on different marbles; unequal guesses are prediction arrows, not physically possible internal force pairs.`;break;
  }
  case 'P32':expected=Number(params.mass1)*Number(params.velocity1)+Number(params.mass2)*Number(params.velocity2);trial.velocity1=(input-params.mass2*params.velocity2)/params.mass1;explanation=`A system with your predicted total would need an initial blue-stone velocity of ${format(trial.velocity1)} m/s. For the given initial velocities, the total remains ${format(expected)} kg·m/s while momentum transfers between the stones.`;break;
  default:return fail('This exploration is unavailable.');
 }
 return envelope(problem,reference,trial,value,expected,unit,explanation,{...options,problem:trialProblem,comparisonLabel:problem.id==='P20'||problem.id==='P31'?'Your force arrow compared with the physical force':'Your experiment compared with the goal'});
}
