/* Printed questions offer guidance; worked solutions belong to changed practice
   questions and online extensions. This is an instructional display policy. */
const handoutId=/^P(?:0[1-9]|[12]\d|3[0-2])$/;
const givenKeys={
 P01:['start','turn','end'],P02:['start','end'],P03:['radius','speed','laps'],P04:['speed'],
 P05:['distance','time'],P06:['speed','time'],P07:['speed','otherSpeed'],P08:['times','positions','distanceScale','timeScale'],
 P09:['vi','vf','startTime','endTime','time'],P10:['vi','acceleration','time'],P11:['vi','vf','time'],P12:['orbitAU','radius'],
 P13:['times','positions','distanceScale','timeScale'],P14:['vi','vf','time'],P15:['times','positions','distanceScale','timeScale'],P16:['speed','otherSpeed','time'],
 P17:['mass','g'],P18:['forwardForce'],P19:['mass','g','compareG'],P20:['forwardForce','staticLimit','kineticFriction'],
 P21:['upwardForce','weight'],P22:['upwardForce','weight'],P23:['forwardForce','backwardForce','upwardForce','weight','vi','vy'],P24:['vi','forwardForce','backwardForce'],
 P25:['upwardForce','mass','g','weight'],P26:['netForce','acceleration'],P27:['mass','compareMass','netForce'],P28:['radius','speed'],
 P29:['mass1','mass2','velocity1','velocity2'],P30:['mass1','mass2','velocity1','velocity2','restitution'],P31:['mass1','mass2','velocity1','velocity2'],P32:['mass1','mass2','velocity1','velocity2']
};
function same(a,b){if(typeof a==='number'&&typeof b==='number')return Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<=1e-10*Math.max(1,Math.abs(a),Math.abs(b));if(Array.isArray(a)||Array.isArray(b))return Array.isArray(a)&&Array.isArray(b)&&a.length===b.length&&a.every((v,i)=>same(v,b[i]));return a===b;}
/** Ignore display metadata and animation-only settings. Merely relabeling an
 * original as practice/custom, or changing its spring stiffness, reveals no key. */
export function isHandoutOriginal(problem,params={}){
 if(!problem||problem.extension)return false;
 if(problem.warmup||/^W[1-8][a-c]$/.test(problem.id||''))return true;
 if(!handoutId.test(problem.id||''))return false;
 const original=problem.simulation?.params||{},active={...original,...params};
 return(givenKeys[problem.id]||Object.keys(original).filter(k=>!k.startsWith('_'))).every(key=>same(active[key],original[key]));
}
const hints={
 P01:['Trace each part of the route separately.','Distance measures the length of the whole route, regardless of its direction. Add the lengths of its parts.','Did I count every part of the walk?'],
 P02:['Use final position minus starting position.','Keep the sign of each position when subtracting. Interpret the sign of your result using the direction defined in the question.','Did I keep the starting position’s sign inside parentheses?'],
 P03:['Compare the route traveled with the start and finish.','Distance concerns the whole path. Displacement concerns only the change from the starting position to the finishing position.','Did I discuss distance and displacement separately?'],
 P04:['Choose one reference point at a time.','Motion is described by how an object’s position changes relative to a chosen observer. Use both observers named in the question.','Did I explain what each observer would measure?'],
 P05:['Use average speed = total distance ÷ total time.','Write the distance and elapsed time with their units before dividing. The speed unit combines a distance unit with a time unit.','Did I divide distance by time in that order?'],
 P06:['Use distance = speed × elapsed time.','A steady speed describes the distance covered in each unit of time. Match the time units before multiplying.','Do the units of my product describe a distance?'],
 P07:['Consider speed and direction separately.','Speed describes how fast an object moves. Velocity describes both how fast it moves and its direction. Apply both definitions to each jogger.','Did I compare velocities as well as speeds?'],
 P08:['Use the whole trip when finding an average.','Average speed compares all the distance traveled with all the time elapsed. Account for each part of the timeline, including pauses.','Did I include every interval of time?'],
 P09:['Find elapsed time and change in velocity separately.','Average acceleration is change in velocity divided by elapsed time. Subtract initial from final for both changes, then check the units.','Did I use elapsed time rather than a stopwatch reading?'],
 P10:['Find the velocity change before finding the final velocity.','Acceleration multiplied by elapsed time gives a change in velocity. Combine that change with the initial velocity, keeping the direction signs.','Did I account for the initial velocity?'],
 P11:['Separate the size of a velocity from its sign.','The magnitude of a velocity tells speed. A sign locates its direction on the chosen axis. Compare the magnitudes before describing the speed change.','Did I explain magnitude and direction separately?'],
 P12:['Track the direction of motion at several points in the orbit.','Acceleration describes a change in velocity. Check both speed and direction, then identify the interaction that could change the motion.','Did I consider direction as well as speed?'],
 P13:['Use the entire distance and entire elapsed time.','The slope over the whole trip gives its average speed. Read the first and last table entries and include the time spent paused.','Did I use the whole trip rather than just a moving section?'],
 P14:['Choose two points on the graph and subtract their coordinates.','On a speed–time graph for motion in a fixed direction, change in speed divided by change in time gives acceleration. Check each axis’s unit.','Did I divide a vertical change by a horizontal change?'],
 P15:['Calculate a rate for each interval.','Compare distance change divided by elapsed time for each graph segment. Use the change during the interval, not its final total-distance reading.','Did I compare all intervals using the same calculation?'],
 P16:['Check what the vertical axis actually measures.','A graph contains only the information represented by its axes. Consider whether the plotted quantity includes direction before comparing the cyclists.','Did I distinguish a speed graph from a velocity graph?'],
 P17:['Use weight = mass × gravitational acceleration.','Mass is measured in kilograms; weight is a gravitational force measured in newtons. Use the gravitational acceleration for the stated location.','Did I use the given location’s gravity?'],
 P18:['Relate steady velocity to acceleration.','Draw the horizontal forces on the box. Use Newton’s laws to decide what their combined effect must be for the stated motion.','Did I include both force size and direction?'],
 P19:['Ask separately about mass and gravitational force.','Mass measures the amount of matter. Weight is calculated using mass and the local gravitational acceleration. Compare which quantities are specified to change.','Did I explain mass and weight separately?'],
 P20:['Distinguish the available friction limit from the friction acting now.','Static friction can adjust while surfaces remain at rest relative to each other. Draw the forces and use the stated motion to decide how they combine.','Did I distinguish an actual force from its maximum possible value?'],
 P21:['Choose a positive vertical direction before combining forces.','Net force is the signed sum of forces acting on one object. Forces pointing in opposite directions have opposite signs.','Did I state a direction as well as a force size?'],
 P22:['Use upward as positive, as the question requests.','Add the vertical forces with signs that match their directions. Interpret the sign of your result after carrying out the calculation.','Did I include both a sign and a direction?'],
 P23:['Check the horizontal and vertical directions separately.','Net force determines change in velocity. First identify the velocity already present, then use the net force to reason about any change.','Did I distinguish velocity from change in velocity?'],
 P24:['Identify the horizontal forces after contact ends.','Use Newton’s first law to connect the combined force with any change in the puck’s existing motion. Apply the question’s friction and air-resistance assumptions.','Did I discuss the motion after the stick stops touching the puck?'],
 P25:['Find net force before using a = Fnet ÷ m.','Use a sign for each vertical force. The force in Newton’s second law is the combined force on the bird, rather than a single force acting on it.','Did I combine the vertical forces before dividing by mass?'],
 P26:['Start with Fnet = ma and isolate the mass.','Use the same operation on both sides of the equation to leave mass by itself. Check that the resulting unit is kilograms.','Did I divide both sides by the same quantity?'],
 P27:['Use a = Fnet ÷ m for each airplane.','Keep the net force fixed and compare what changing only the mass does to the quotient. Compare the same direction of acceleration for both planes.','Did I keep force fixed while comparing masses?'],
 P28:['Sketch the velocity direction at nearby points on the turn.','A force changes velocity in its own direction. Use the change in velocity to reason about the net force, then identify which contact can supply it.','Did I connect the force direction to a change in velocity?'],
 P29:['Calculate a momentum for each member of the system.','Use p = mv for each object, with a consistent positive direction. Then add the momenta of all objects in the specified system.','Did I include both objects and use the stated instant?'],
 P30:['Treat both balls as one system.','Use p = mv for each ball and add with direction signs. Identify whether external horizontal forces act during the collision before comparing the system totals.','Did I distinguish each ball’s momentum from the system’s momentum?'],
 P31:['Identify both bodies involved in the contact.','Use Newton’s third law to compare the interaction forces. Label each arrow with the object exerting the force and the object receiving it.','Did I keep force and acceleration as separate quantities?'],
 P32:['Compare each stone with the two-stone system.','Use p = mv to track each object. Then consider the combined momentum and whether an external horizontal force acts during impact.','Did I discuss both individual momenta and the system total?']
};
export function getHandoutGuidance(problem){
 const row=hints[problem?.id];if(row)return{hint:row[0],explanation:row[1],prompts:[row[2],'Did I use the stated measurements, directions, and assumptions to support my reasoning?']};
 const prompt=String(problem?.prompt||'');
 if(problem?.warmup||/^W[1-8][a-c]$/.test(problem?.id||'')){
  const equation=/Solve:/i.test(prompt),fraction=/Compare:/.test(prompt);
  return equation?{hint:'Use inverse operations to isolate the unknown.',explanation:'Apply the same operation to both sides of the equation. If the unknown is multiplied by a coefficient, divide both sides by that coefficient.',prompts:['Did I perform the same operation on both sides?','Does substitution make the original equation true?']}:fraction?{hint:'Compare the fractions using a common denominator.',explanation:'When denominators match, compare numerators. Otherwise, first write equivalent fractions with the same denominator.',prompts:['Did I compare equal-sized parts?']}: {hint:'Work inside parentheses first, then multiply or divide before adding or subtracting.',explanation:'Keep track of negative signs. When dividing decimals, multiplying both numbers by the same power of ten leaves the quotient unchanged.',prompts:['Did I follow the order of operations?','Does an estimate support my calculation?']};
 }
 return{hint:'List what is given and what you need to find.',explanation:'Choose a relationship between the known and unknown quantities, keep units consistent, and explain the reasoning behind your calculation.',prompts:['Did I explain why my method fits the question?']};
}
