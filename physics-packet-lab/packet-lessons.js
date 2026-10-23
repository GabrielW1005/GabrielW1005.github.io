/* Optional help and answer fields for the original printed packet only.
   Keep the original question, title, and data table in data.js unchanged.
   Concept explanations are self-reviewed against criteria, never auto-graded. */
const number=(key,label,expected,unit='',accepted)=>({key,label,type:'number',expected,tolerance:expected===0?1e-9:Math.min(.005,Math.abs(expected)*.0025),...(unit?{unit}:{}),...(accepted?{accepted}:{})});
const direction=(key,label,expected)=>({key,label,type:'direction',expected,accepted:{
 east:['east','e','eastward','to the east'],
 left:['left','leftward','to the left'],
 right:['right','rightward','to the right'],
 up:['up','upward','upwards'],
 down:['down','downward','downwards'],
 forward:['forward','forwards','ahead','down the lane']
}[expected]});
const lesson=(hint,steps,why,criteria,fields=[])=>({hint,steps,why,criteria,fields});

export const lessons={
 P01:lesson(
  'Count the full length of both parts of the walk, even after the turn.',
  ['The first part of the route is 12 m long; the second part is 5 m long.','Total distance = 12 + 5 = 17 m.','Use meters. Direction is not part of a distance answer.'],
  'Distance measures the entire path traveled. Walking west does not erase the distance already traveled east.',
  ['I counted both parts of the path.','I added the lengths and used meters.'],
  [number('distance','Total distance',17,'m')]),
 P02:lesson(
  'Displacement is final position minus starting position. Keep the negative starting position in parentheses.',
  ['Use displacement = final position − starting position.','Substitute: +9 − (−6) = 9 + 6 = +15 m.','East is positive, so the displacement is 15 m east.'],
  'Displacement measures the signed change in position. Subtracting a negative starting position is the same as adding its opposite.',
  ['I used finish minus start.','I kept the sign of −6 correctly.','I included the eastward direction.'],
  [number('displacement','Signed displacement',15,'m'),direction('direction','Direction of displacement','east')]),
 P03:lesson(
  'Compare the entire route with the difference between the starting and finishing positions.',
  ['The runner travels around the track, so the distance traveled is greater than zero.','The final position is the same as the starting position.','Displacement = final position − starting position = 0.'],
  'Distance depends on the path. Displacement depends only on where the trip begins and ends.',
  ['I said the distance is not zero.','I said the displacement is zero.','I explained that the start and finish are the same.']),
 P04:lesson(
  'Describe the passenger once using the train as the reference point and once using the platform.',
  ['Relative to the train, the passenger stays in the same seat: velocity is 0 m/s.','Relative to the platform, the passenger moves with the train at 10 m/s east.','The descriptions differ because the reference points are different.'],
  'Motion is a change in position relative to a reference point. Two moving reference points can give different descriptions.',
  ['I described the passenger as at rest relative to the train.','I described 10 m/s east relative to the platform.','I explained the role of the reference point.']),
 P05:lesson(
  'Average speed compares the total distance with the whole elapsed time.',
  ['Use average speed = total distance ÷ elapsed time.','Substitute: 180 m ÷ 120 s = 1.5 m/s.','Check the unit: meters divided by seconds gives meters per second.'],
  'A speed of 1.5 m/s means the student averages 1.5 meters of travel for each second of the trip.',
  ['I divided distance by time.','I included m/s.'],
  [number('speed','Average speed',1.5,'m/s')]),
 P06:lesson(
  'At steady speed, multiply the distance traveled each second by the number of seconds.',
  ['Use distance = speed × elapsed time.','Substitute: 4 m/s × 45 s = 180 m.','The seconds cancel, leaving meters.'],
  'At 4 m/s, the cyclist covers 4 meters in each second. There are 45 seconds of travel.',
  ['I multiplied speed by time.','I gave a distance in meters.'],
  [number('distance','Distance traveled',180,'m')]),
 P07:lesson(
  'Speed describes how fast. Velocity also includes a direction.',
  ['The first jogger’s speed is 2 m/s and the second jogger’s speed is also 2 m/s.','Their directions are opposite: one east and one west.','They have the same speed but different velocities.'],
  'Equal speed does not guarantee equal velocity. A direction change is enough to make velocities different.',
  ['I identified equal speeds of 2 m/s.','I identified different velocities.','I used east versus west to explain the difference.']),
 P08:lesson(
  'The stop adds to the trip’s time, even though no distance is traveled during it.',
  ['Each moving part covers 2 m/s × 10 s = 20 m. The total distance is 20 + 20 = 40 m.','Include all three intervals: total time = 10 + 10 + 10 = 30 s.','Average speed = 40 ÷ 30 ≈ 1.33 m/s, which is less than 2 m/s.'],
  'Average speed uses the whole trip. Including time spent stopped lowers the average compared with the speed while moving.',
  ['I said the average is less than 2 m/s.','I included the 10-second stop in the total time.','I explained that the stop adds time but no distance.']),
 P09:lesson(
  'First find how much time passes between the two stopwatch readings.',
  ['Elapsed time = 8 s − 3 s = 5 s.','Change in velocity = 14 − 4 = +10 m/s east.','Average acceleration = change in velocity ÷ elapsed time = 10 ÷ 5 = 2 m/s² east.'],
  'Acceleration is the rate of change of velocity. The final stopwatch reading alone is not the elapsed time.',
  ['I used an elapsed time of 5 s.','I subtracted the initial velocity from the final velocity.','I gave acceleration in m/s² and included east.'],
  [number('acceleration','Average acceleration',2,'m/s²'),direction('direction','Direction of acceleration','east')]),
 P10:lesson(
  'Find the velocity change from acceleration × time, then add it to the starting velocity.',
  ['Change in velocity = 0.5 m/s² × 4 s = 2 m/s east.','Final velocity = initial velocity + change = 2 + 2 = 4 m/s.','The runner continues east, so the final velocity is 4 m/s east.'],
  'Acceleration adds 0.5 m/s of eastward velocity each second. Over four seconds, that adds 2 m/s.',
  ['I multiplied acceleration by time.','I added the change to the initial velocity.','I included east in the final velocity.'],
  [number('velocity','Final velocity',4,'m/s'),direction('direction','Direction of velocity','east')]),
 P11:lesson(
  'Compare the sizes of the velocities to decide whether speed is increasing.',
  ['The initial speed is the size of −1 m/s: 1 m/s.','The final speed is the size of −3 m/s: 3 m/s, so the car is speeding up.','The negative signs indicate west. They do not mean that speed itself is negative.'],
  'A negative velocity tells direction. Speed is the nonnegative size of velocity, so it rises from 1 to 3 m/s here.',
  ['I said the car is speeding up.','I compared speeds of 1 m/s and 3 m/s.','I explained that the negative sign means west.']),
 P12:lesson(
  'Velocity can change even when its speed stays constant.',
  ['In the circular model, Earth’s direction of motion changes continuously.','Velocity includes direction, so changing direction means Earth is accelerating.','The Sun’s gravity supplies the inward force and acceleration that keep the path curved.'],
  'Constant speed does not mean constant velocity. The circular orbit is a simplified model used to study a continuously changing direction.',
  ['I said Earth is accelerating in this model.','I explained that velocity changes direction.','I identified the Sun’s gravity as the inward force.']),
 P13:lesson(
  'Use the first and last table entries for the entire trip, including the pause.',
  ['The table starts at 0 m and ends at 30 m, so the total distance is 30 m.','The whole trip lasts 30 − 0 = 30 s. Keep the pause in this time.','Average speed = 30 m ÷ 30 s = 1 m/s.'],
  'The repeated 12 m entries show a pause. The clock keeps running during that pause, so it still belongs in the average.',
  ['I used the total distance of 30 m.','I included all 30 s.','I used distance ÷ time and m/s.'],
  [number('speed','Average speed for the whole trip',1,'m/s')]),
 P14:lesson(
  'Find the change in speed between two graph points, then divide by the elapsed time.',
  ['Read the endpoints: 2 m/s at 0 s and 8 m/s at 6 s.','Change in speed = 8 − 2 = 6 m/s; elapsed time = 6 − 0 = 6 s.','Acceleration = 6 ÷ 6 = 1 m/s² east.'],
  'The scooter keeps traveling east. For this fixed positive direction, the slope of the speed–time graph gives its acceleration.',
  ['I used the difference between the speeds.','I divided by the elapsed time.','I included m/s² and east.'],
  [number('acceleration','Acceleration',1,'m/s²'),direction('direction','Direction of acceleration','east')]),
 P15:lesson(
  'Compare how much distance is added during each interval, not the total distance shown at its endpoint.',
  ['From 0–10 s: distance added = 8 − 0 = 8 m. From 10–20 s: 24 − 8 = 16 m.','From 20–30 s: distance added = 28 − 24 = 4 m. All intervals last 10 s.','The 10–20 s interval is fastest: 16 ÷ 10 = 1.6 m/s. It has the steepest graph segment.'],
  'For equal time intervals, the greatest distance increase gives the greatest average speed. The largest total-distance reading need not mark the fastest interval.',
  ['I chose 10–20 s.','I compared distance changes of 8 m, 16 m, and 4 m over equal times.','I linked the greatest average speed with the steepest graph segment.']),
 P16:lesson(
  'A speed–time graph records how fast an object moves, not which direction it moves.',
  ['Both cyclists have a speed of 3 m/s for the full 6 s.','Both speed–time graphs are horizontal lines at 3 m/s, so the graphs are identical.','Those graphs cannot show east versus west. A signed velocity–time graph could show the difference.'],
  'Opposite directions produce different velocities, but they can still have the same nonnegative speed.',
  ['I said the speed–time graphs are identical.','I described horizontal lines at 3 m/s.','I explained that speed graphs do not show direction.']),
 P17:lesson(
  'Use the gravity value given for Mars, not the value used for Earth.',
  ['Use weight = mass × gravitational acceleration.','Substitute the Mars values: 20 kg × 3.7 m/s² = 74 N.','Weight is a gravitational force, directed downward toward Mars.'],
  'Mass tells how much matter the instrument contains. Weight depends on the gravitational field where that mass is located.',
  ['I used g = 3.7 m/s².','I multiplied mass by gravity.','I reported a force in newtons, directed down.'],
  [number('weight','Weight on Mars',74,'N'),direction('direction','Direction of weight','down')]),
 P18:lesson(
  'Steady straight-line motion means the horizontal forces balance.',
  ['The box moves at steady velocity, so its horizontal acceleration and net force are zero.','The push is 35 N right, so friction must be 35 N in the opposite direction.','The sliding friction force is 35 N left.'],
  'The rightward push and leftward friction cancel, so the net force is zero and the box’s velocity does not change.',
  ['I used steady motion to conclude zero horizontal net force.','I gave a friction size of 35 N.','I placed friction to the left, opposite the sliding.'],
  [number('friction','Friction force size',35,'N'),direction('direction','Direction of friction','left')]),
 P19:lesson(
  'Ask separately about the amount of matter and the strength of gravity pulling on it.',
  ['The same astronaut and suit contain the same matter, so the mass stays 150 kg.','Weight = mass × local gravitational acceleration.','Mars has weaker surface gravity than Earth, so the weight is smaller on Mars.'],
  'Changing planets changes the gravitational pull, not the amount of matter in the astronaut and suit.',
  ['I said the mass remains 150 kg.','I said the weight is smaller on Mars.','I connected the weight change to weaker gravity.']),
 P20:lesson(
  'The maximum static friction is a limit, not a force that always acts at full strength.',
  ['The crate stays at rest, so the horizontal forces balance.','The pull is 10 N right, so the actual static friction is 10 N left.','The 18 N value is the maximum available static friction. Only 10 N is needed here.'],
  'Static friction adjusts to prevent sliding, up to its limit. It does not automatically equal the largest force it could provide.',
  ['I gave the actual friction as 10 N left.','I explained that it balances the pull.','I distinguished the 18 N maximum from the actual force.']),
 P21:lesson(
  'The upward and downward forces oppose each other. Choose up as positive.',
  ['Write the vertical net force as upward lift minus downward weight.','Fnet = 15,000 − 12,000 = +3,000 N.','The positive result means 3,000 N upward.'],
  'Net force is the combined effect of all forces on the same object. The larger upward force leaves an upward result.',
  ['I subtracted the opposing forces.','I gave 3,000 N.','I included the upward direction.'],
  [number('netForce','Vertical net force (up is positive)',3000,'N'),direction('direction','Direction of net force','up')]),
 P22:lesson(
  'Keep upward positive and give the downward weight a negative sign.',
  ['Add the signed forces: Fnet = +9,800 + (−10,000).','Fnet = −200 N. The negative sign must remain in the signed answer.','Because up is positive, −200 N means a net force of 200 N downward.'],
  'The downward weight is 200 N larger than the upward buoyant force. A downward net force describes acceleration, not necessarily the balloon’s current motion.',
  ['I gave the signed net force as −200 N.','I identified the direction as down.','I used the stated upward-positive convention.'],
  [number('netForce','Signed net force (up is positive)',-200,'N'),direction('direction','Direction of net force','down')]),
 P23:lesson(
  'Zero net force means no change in velocity. It does not mean zero velocity.',
  ['Lift and weight balance vertically; thrust and drag balance horizontally.','The total net force is zero, so the acceleration is zero.','The airplane keeps its current velocity: it continues straight and level at constant speed.'],
  'Forces change velocity. Balanced forces let an object remain at rest or keep moving at constant velocity.',
  ['I said the airplane does not have to stop.','I explained that zero net force gives zero acceleration.','I said its existing constant velocity continues.']),
 P24:lesson(
  'Once contact ends, the stick no longer pushes on the puck.',
  ['After the stick lets go, there is no continuing force from the stick.','Ignoring horizontal friction and air resistance gives zero horizontal net force.','By Newton’s first law, the puck keeps the same horizontal velocity without an ongoing forward push.'],
  'An object’s inertia keeps its motion unchanged unless a net force acts. A push is needed to change velocity, not to maintain it in this idealized glide.',
  ['I said the horizontal velocity stays constant.','I said a continuing forward force is not required.','I used the assumption that horizontal friction and air resistance are ignored.']),
 P25:lesson(
  'Combine the vertical forces before dividing by the bird’s mass.',
  ['Average net vertical force = 6 N upward − 5 N downward = 1 N upward.','Use average acceleration = average net force ÷ mass.','a = 1 N ÷ 0.50 kg = 2 m/s² upward.'],
  'Only the net force causes the acceleration. Using the full 6 N upward force would incorrectly ignore the opposing weight.',
  ['I found the 1 N upward net force first.','I divided by 0.50 kg.','I gave 2 m/s² upward.'],
  [number('acceleration','Average vertical acceleration',2,'m/s²'),direction('direction','Direction of acceleration','up')]),
 P26:lesson(
  'Rearrange net force = mass × acceleration to find the unknown mass.',
  ['Start with Fnet = m × a. Divide both sides by a: m = Fnet ÷ a.','Substitute: m = 3 N ÷ 1.5 m/s² = 2 kg.','Check: 2 kg × 1.5 m/s² = 3 N, matching the given net force.'],
  'The question already gives the net force. Do not subtract the weight again. Mass is a scalar, so it has no direction.',
  ['I divided the given net force by acceleration.','I did not subtract weight from an already-net force.','I gave mass in kilograms.'],
  [number('mass','Total mass',2,'kg')]),
 P27:lesson(
  'Use the same net force in both calculations, but each plane’s own mass.',
  ['For the 0.4 kg airplane: a = 0.8 ÷ 0.4 = 2 m/s² forward.','For the 0.8 kg airplane: a = 0.8 ÷ 0.8 = 1 m/s² forward.','The lighter airplane accelerates more. With net force unchanged, doubling mass halves acceleration.'],
  'Acceleration equals net force divided by mass. A greater mass has more inertia and changes velocity less quickly under the same net force.',
  ['I chose the 0.4 kg airplane as having greater acceleration.','I explained that both have the same forward net force.','I stated that doubling mass halves acceleration.']),
 P28:lesson(
  'Think about what must change the direction of the cyclist’s velocity.',
  ['A constant-speed turn still changes the direction of velocity, so the cyclist accelerates.','For a circular path, the acceleration and net horizontal force point toward the center.','Static friction from the pavement on the tires supplies that inward force when the tires do not skid.'],
  '“Centripetal” describes an inward net force, not an extra type of force. Here road–tire friction provides it.',
  ['I said the net horizontal force points toward the center.','I named static friction from the road on the tires.','I explained that changing direction requires acceleration even at constant speed.']),
 P29:lesson(
  'Find each object’s momentum, including the stationary pin, then add them.',
  ['Ball momentum = mass × velocity = 6 × 3 = 18 kg·m/s forward.','Pin momentum = 1.5 × 0 = 0 kg·m/s because the pin is stationary.','Total system momentum before impact = 18 + 0 = 18 kg·m/s forward.'],
  'System momentum is the sum of the momenta of every object in the chosen system. The pin has mass, but zero velocity gives it zero momentum.',
  ['I included both the ball and the pin.','I used zero momentum for the stationary pin.','I gave total momentum in kg·m/s, forward.'],
  [number('totalMomentum','Total momentum before impact',18,'kg·m/s'),direction('direction','Direction of total momentum','forward')]),
 P30:lesson(
  'Add the initial momenta of both balls. Then apply conservation of total momentum during the collision.',
  ['Moving ball momentum = 0.10 × 2 = 0.20 kg·m/s right; stationary ball momentum = 0.10 × 0 = 0.','Total momentum before collision = 0.20 + 0 = 0.20 kg·m/s right.','External horizontal forces are ignored during the collision, so total momentum afterward is also 0.20 kg·m/s right.','Report both totals. The question asks for system momentum, not the balls’ shared velocity.'],
  'Forces between the balls transfer momentum within the system. With negligible external horizontal forces, the total stays unchanged even when the balls stick together.',
  ['I gave the total before as 0.20 kg·m/s right.','I gave the total after as 0.20 kg·m/s right.','I used conservation of total momentum for the two-ball system.'],
  [number('before','Total momentum before',.2,'kg·m/s'),number('after','Total momentum immediately after',.2,'kg·m/s'),direction('direction','Direction before and after','right')]),
 P31:lesson(
  'Compare the two interaction forces during the same collision, not the marbles’ initial speeds.',
  ['Identify the pair: marble 1 pushes marble 2, and marble 2 pushes marble 1.','Newton’s third law says these forces are equal in size and opposite in direction.','Each force acts on a different marble. They therefore do not cancel in the net force on one marble.'],
  'The stationary marble also exerts a force during contact. Equal interaction forces do not require the marbles to have equal initial velocities.',
  ['I said the force sizes are equal.','I said the directions are opposite.','I identified a different marble as the object receiving each force.']),
 P32:lesson(
  'Treat both curling stones together as one system during the brief collision.',
  ['The first stone slows, so its momentum changes; the second starts moving, so its momentum also changes.','The contact forces transfer momentum between the two stones.','With external horizontal forces ignored, the two-stone system’s total momentum before and after is unchanged.'],
  'Momentum can move from one object to another without disappearing. Conservation applies to the combined system, not to each stone separately.',
  ['I described momentum transferring between the stones.','I said each stone’s momentum changes.','I said the combined total stays unchanged under the stated assumption.'])
};

/* Math-only warmups use the exact values printed in each section. */
export const warmupLessons={
 W1a:lesson('Add the two positive numbers.',['12 + 5 means start at 12 and add 5.','12 + 5 = 17.'],'Adding positive amounts increases the total.',['I added both numbers.','My answer is positive.'],[number('answer','Sum',17)]),
 W1b:lesson('Subtracting a negative is the same as adding its opposite.',['Rewrite 9 − (−6) as 9 + 6.','9 + 6 = 15.'],'The two minus signs have different jobs: one subtracts, and the other belongs to −6.',['I changed subtraction of −6 into addition of 6.','I calculated the sum.'],[number('answer','Result',15)]),
 W1c:lesson('A number minus itself is zero.',['The starting amount and the amount subtracted are both 18.','18 − 18 = 0.'],'Removing the entire amount leaves nothing.',['I subtracted equal amounts.','I included zero as a valid answer.'],[number('answer','Difference',0)]),
 W2a:lesson('Simplify the division or divide directly.',['180 ÷ 120 = 18 ÷ 12 = 3 ÷ 2.','3 ÷ 2 = 1.5.'],'A quotient can be a decimal; it need not be a whole number.',['I divided 180 by 120 in that order.','I kept the decimal part.'],[number('answer','Quotient',1.5)]),
 W2b:lesson('Break 45 into 40 + 5 if that helps.',['4 × 45 = (4 × 40) + (4 × 5).','160 + 20 = 180.'],'Multiplication distributes over addition.',['I multiplied 4 by the whole 45.','I combined the partial products.'],[number('answer','Product',180)]),
 W2c:lesson('Undo multiplication by 3 by dividing both sides by 3.',['3t = 90, so 3t ÷ 3 = 90 ÷ 3.','t = 30; check that 3 × 30 = 90.'],'Doing the same operation to both sides keeps the equation balanced.',['I divided both sides by 3.','I checked the solution in the original equation.'],[number('answer','t',30)]),
 W3a:lesson('Subtract the smaller reading from the larger one.',['Find the difference between 8 and 3.','8 − 3 = 5.'],'A difference tells how far apart two values are.',['I used 8 minus 3.','I calculated a positive difference.'],[number('answer','Difference',5)]),
 W3b:lesson('Do the subtraction inside parentheses before dividing.',['14 − 4 = 10.','Then 10 ÷ 5 = 2.'],'Parentheses group the entire subtraction as the amount being divided.',['I completed the parentheses first.','I divided the result by 5.'],[number('answer','Result',2)]),
 W3c:lesson('Multiply inside the parentheses, then add.',['0.5 × 4 = 2.','Then 2 + 2 = 4.'],'Multiplication comes before the outside addition.',['I multiplied before adding.','I added the initial 2 afterward.'],[number('answer','Result',4)]),
 W4a:lesson('Calculate the top and bottom separately.',['The numerator is 30 − 0 = 30; the denominator is also 30 − 0 = 30.','30 ÷ 30 = 1.'],'Any nonzero number divided by itself equals 1.',['I grouped the numerator and denominator correctly.','I divided their results.'],[number('answer','Quotient',1)]),
 W4b:lesson('Finish both subtractions before dividing.',['The numerator is 8 − 2 = 6; the denominator is 6 − 0 = 6.','6 ÷ 6 = 1.'],'The fraction bar divides the whole numerator by the whole denominator.',['I calculated both changes.','I divided 6 by 6.'],[number('answer','Quotient',1)]),
 W4c:lesson('All three fractions have the same positive denominator. Compare their numerators.',['The numerators are 8, 16, and 4; 16 is the greatest.','The greatest fraction is 16/10, which equals 1.6.'],'With equal positive denominators, more equal-sized pieces make the larger value.',['I compared fractions with the same denominator.','I gave the greatest value as a fraction or decimal.'],[number('answer','Greatest value (fraction or decimal)',1.6,'',['16/10','8/5','1.6'])]),
 W5a:lesson('Multiply by 2, then by 10.',['3.7 × 2 = 7.4.','7.4 × 10 = 74.'],'Multiplying by 20 is the same as multiplying by 2 and then by 10.',['I kept track of the decimal place.','I multiplied by the full 20.'],[number('answer','Product',74)]),
 W5b:lesson('Undo subtracting 35 by adding 35 to both sides.',['f − 35 = 0, so f − 35 + 35 = 0 + 35.','f = 35; check that 35 − 35 = 0.'],'Adding the same amount to both sides preserves equality.',['I added 35 to both sides.','I checked the result.'],[number('answer','f',35)]),
 W5c:lesson('You can break 150 into 100 + 50.',['3.7 × 100 = 370, and 3.7 × 50 = 185.','370 + 185 = 555.'],'The product for 150 is the sum of the products for 100 and 50.',['I handled the decimal correctly.','I multiplied by the whole 150.'],[number('answer','Product',555)]),
 W6a:lesson('Treat the values as 15 thousands and 12 thousands.',['15 − 12 = 3.','15,000 − 12,000 = 3,000.'],'The shared thousands place scales the difference by 1,000.',['I subtracted the thousands.','I kept the correct place value.'],[number('answer','Difference',3000)]),
 W6b:lesson('Adding a negative is subtraction. The larger-sized amount is negative.',['9,800 + (−10,000) = 9,800 − 10,000.','The difference in size is 200; keep the negative sign: −200.'],'The negative amount is 200 larger in size than the positive amount.',['I kept the negative sign.','I found the difference between the sizes.'],[number('answer','Signed result',-200)]),
 W6c:lesson('A number minus itself is zero.',['The two values are both 12,000.','12,000 − 12,000 = 0.'],'Equal positive and negative amounts cancel.',['I subtracted equal values.','I gave zero.'],[number('answer','Difference',0)]),
 W7a:lesson('Subtract first, then divide by one-half.',['6 − 5 = 1.','1 ÷ 0.50 = 2, because two halves fit into 1.'],'Dividing by a number smaller than 1 can make the result larger.',['I completed the parentheses first.','I divided by 0.50 rather than multiplying by it.'],[number('answer','Result',2)]),
 W7b:lesson('Divide both sides by 1.5.',['1.5m = 3 gives m = 3 ÷ 1.5.','m = 2; check that 1.5 × 2 = 3.'],'Division undoes multiplication by the coefficient of the unknown.',['I divided by 1.5.','I checked the value in the equation.'],[number('answer','m',2)]),
 W7c:lesson('For each division, move both decimal points the same amount.',['0.8 ÷ 0.4 = 8 ÷ 4 = 2.','0.8 ÷ 0.8 = 8 ÷ 8 = 1.'],'Scaling both dividend and divisor by the same nonzero factor leaves the quotient unchanged.',['I entered both quotients in order.','I shifted both decimal points together.'],[number('first','0.8 ÷ 0.4',2),number('second','0.8 ÷ 0.8',1)]),
 W8a:lesson('Calculate both products before adding.',['6 × 3 = 18; 1.5 × 0 = 0.','18 + 0 = 18.'],'A quantity multiplied by zero contributes zero to the sum.',['I multiplied before adding.','I included the second product as zero.'],[number('answer','Result',18)]),
 W8b:lesson('One tenth multiplied by 2 is two tenths.',['0.10 × 2 = 0.20.','0.20 and 0.2 name the same value.'],'A trailing zero after a decimal does not change its value.',['I kept the decimal in the correct place.','I recognized 0.20 and 0.2 as equal.'],[number('answer','Product',.2)]),
 W8c:lesson('Adding zero leaves the value unchanged.',['Start with 0.20.','0.20 + 0 = 0.20.'],'Zero adds no amount to the total.',['I kept the original value.','I recognized 0.20 and 0.2 as equal.'],[number('answer','Sum',.2)])
};
