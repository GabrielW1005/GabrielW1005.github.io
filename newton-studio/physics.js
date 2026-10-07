/* Newton Studio — SI-unit adapter around Planck 1.5 / Box2D. */
(function(root){
'use strict';
const pl=root.planck || (typeof require==='function'?require('./vendor/planck.min.js'):null);
const V=pl.Vec2, DT=1/240, copy=x=>JSON.parse(JSON.stringify(x));
// CCD remains enabled. A larger safety cap permits verified orbital-speed flight.
pl.Settings.maxTranslation=100;
const EARTH_RADIUS=6371000, EARTH_MU=9.81*EARTH_RADIUS*EARTH_RADIUS;
let serial=0;
function gravityAt(scene,p){if(scene.gravityModel!=='earth')return {x:0,y:-scene.gravity};const y=p.y+EARTH_RADIUS,r=Math.max(1,Math.hypot(p.x,y)),k=-EARTH_MU/(r*r*r);return {x:k*p.x,y:k*y};}
function equipment(kind,x,y,extra={}){const defaults={fuel:{mass:2,contents:8,specificEnergy:120,color:'#d69240'},oxygen:{mass:2,contents:64,color:'#5799d4'},thruster:{mass:3,thrusters:[{force:500,angle:90,key:'w',always:false,offsetX:0,offsetY:0,limited:true,exhaustSpeed:4500,oxygenRatio:8,efficiency:.8}],color:'#dc714d'},gearbox:{mass:2,ratio:3,color:'#aa7bcc'}};return body(kind,x,y,{w:.7,h:.7,...defaults[kind],...extra});}
function resourceMass(s){return s.mass+(['fuel','oxygen'].includes(s.kind)?s.contents||0:0);}

const uid=()=>`b${Date.now().toString(36)}${++serial}`;
function body(kind,x,y,extra={}){return {id:uid(),kind,x,y,angle:0,w:1.6,h:1,r:.65,mass:2,friction:.4,restitution:.15,vx:0,vy:0,omega:0,fx:0,fy:0,dragK:.12,color:'#5f86ff',teeth:20,thrusters:[],...extra};}
function empty(){return {version:1,gravity:9.81,air:false,bodies:[],joints:[]};}
function demo(){const s=empty();s.bodies=[body('ground',0,-.4,{w:30,h:.8,color:'#526276'}),body('rectangle',-4,3,{color:'#5f86ff'}),body('circle',-.8,5,{r:.7,mass:3,color:'#ffa64d'}),body('triangle',3,3.5,{w:1.8,h:1.6,color:'#35bba3'})];return s;}
function area(b){return ['circle','gear'].includes(b.kind)?Math.PI*b.r*b.r:b.kind==='triangle'?b.w*b.h/2:b.w*b.h;}
function terrain(x=0,y=0,w=40,segments=160){return body('terrain',x,y,{w,h:12,base:-12,profile:Array(segments+1).fill(0),friction:.7,restitution:0,color:'#58755f'});}
function terrainVertices(b){const pts=b.profile.map((y,i)=>({x:-b.w/2+i*b.w/(b.profile.length-1),y}));return [...pts,{x:b.w/2,y:b.base},{x:-b.w/2,y:b.base}];}
function terrainHeight(b,x){const i=(x+b.w/2)/b.w*(b.profile.length-1);if(i<0||i>b.profile.length-1)return null;const lo=Math.floor(i),hi=Math.min(b.profile.length-1,lo+1);return b.profile[lo]+(b.profile[hi]-b.profile[lo])*(i-lo);}
function sculpt(b,x,radius,delta){for(let i=0;i<b.profile.length;i++){const px=-b.w/2+i*b.w/(b.profile.length-1),q=Math.abs(px-x)/radius;if(q<1)b.profile[i]=Math.max(b.base+.15,Math.min(30,b.profile[i]+delta*.5*(1+Math.cos(Math.PI*q))));}}
function muzzleDistance(b,dynamic){const angle=b.launchAngle*Math.PI/180,clearance=Math.min((b.w/2+b.projectileRadius+.02)/Math.max(.000001,Math.abs(Math.cos(angle))),(b.h/2+b.projectileRadius+.02)/Math.max(.000001,Math.abs(Math.sin(angle))));return dynamic?Math.max(clearance,b.muzzleOffset??1.1):(b.muzzleOffset??0);}
function gearsAdjacent(a,b){return !!a&&!!b&&a.kind==='gear'&&b.kind==='gear'&&Math.abs(Math.hypot(a.x-b.x,a.y-b.y)-a.r-b.r)<.015&&Math.abs(a.r/a.teeth-b.r/b.teeth)<.0001;}
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.bodies)||!Array.isArray(s.joints)||s.bodies.length>180||s.joints.length>250)throw Error('This is not a supported Newton Studio scene (maximum 180 objects).');
 if(s.gravityModel!==undefined&&!['uniform','earth'].includes(s.gravityModel))throw Error('Invalid gravity model.');
 if(typeof s.air!=='boolean')throw Error('Air resistance must be on or off.');
 if(!Number.isFinite(s.gravity)||Math.abs(s.gravity)>30)throw Error('Gravity must be between −30 and 30 m/s².');
 const ids=new Set();const kinds=['circle','gear','rectangle','triangle','ground','launcher','terrain','fuel','oxygen','thruster','gearbox'];
 for(const b of s.bodies){if(!b.id||ids.has(b.id)||!kinds.includes(b.kind))throw Error('Invalid object.');ids.add(b.id);
 for(const k of ['x','y','angle','w','h','r','mass','friction','restitution','vx','vy','omega','fx','fy','dragK'])if(!Number.isFinite(b[k]))throw Error(`Invalid ${k}.`);
 if(Math.abs(b.x)>10000||Math.abs(b.y)>10000||b.w<.1||b.w>100||b.h<.1||b.h>100||b.r<.05||b.r>20||b.mass<.01||b.mass>1000||b.friction<0||b.friction>2||b.restitution<0||b.restitution>1||b.dragK<0||b.dragK>10||Math.hypot(b.vx,b.vy)>(s.gravityModel==='earth'?20000:100)||Math.abs(b.omega)>100||Math.hypot(b.fx,b.fy)>10000||!/^#[0-9a-f]{6}$/i.test(b.color))throw Error('Object values exceed the supported range.');
 if(b.kind==='terrain'&&(!Array.isArray(b.profile)||b.profile.length<3||b.profile.length>401||b.w/(b.profile.length-1)<.025||!Number.isFinite(b.base)||b.base< -50||b.base>29||b.profile.some(v=>!Number.isFinite(v)||v<b.base+.1||v>30)))throw Error('Invalid terrain profile.');
 if(['fuel','oxygen'].includes(b.kind)&&(!Number.isFinite(b.contents)||b.contents<0||b.contents>5000||b.kind==='fuel'&&(!Number.isFinite(b.specificEnergy)||b.specificEnergy<1||b.specificEnergy>150)))throw Error('Invalid resource tank.');
 if(b.kind==='gearbox'&&(!Number.isFinite(b.ratio)||b.ratio<.25||b.ratio>12))throw Error('Invalid gearbox reduction.');
 if(b.kind==='gear'&&(!Number.isInteger(b.teeth)||b.teeth<6||b.teeth>100))throw Error('Gear teeth must be 6–100.');
 if(!Array.isArray(b.thrusters)||b.thrusters.length>8)throw Error('Invalid thrusters.');
 for(const t of b.thrusters)if(!Number.isFinite(t.force)||Math.abs(t.force)>1000000||!Number.isFinite(t.angle)||!Number.isFinite(t.offsetX)||!Number.isFinite(t.offsetY)||Math.hypot(t.offsetX,t.offsetY)>100||typeof t.key!=='string'||t.key.length>12)throw Error('Invalid thruster.');
 for(const t of b.thrusters)if(t.limited&&(!Number.isFinite(t.exhaustSpeed)||t.exhaustSpeed<10||t.exhaustSpeed>4500||!Number.isFinite(t.oxygenRatio)||t.oxygenRatio<.1||t.oxygenRatio>10||!Number.isFinite(t.efficiency)||t.efficiency<=0||t.efficiency>1))throw Error('Invalid fueled thruster.');
 if(b.kind==='launcher'&&(['aimPositiveKey','aimNegativeKey'].some(k=>b[k]!==undefined&&(typeof b[k]!=='string'||b[k].length>1))||b.aimRate!==undefined&&(!Number.isFinite(b.aimRate)||b.aimRate<1||b.aimRate>180)))throw Error('Invalid aiming controls.');
 if(b.kind==='launcher'&&b.fixed!==undefined&&typeof b.fixed!=='boolean')throw Error('Invalid launcher support.');
 if(b.kind==='launcher'&&b.muzzleOffset!==undefined&&(!Number.isFinite(b.muzzleOffset)||b.muzzleOffset<0||b.muzzleOffset>20))throw Error('Invalid muzzle distance.');
 if(b.kind==='launcher'&&(!Number.isFinite(b.launchSpeed)||b.launchSpeed<.1||b.launchSpeed>100||!Number.isFinite(b.launchAngle)||!Number.isFinite(b.projectileMass)||b.projectileMass<.01||b.projectileMass>1000||!Number.isFinite(b.projectileRadius)||b.projectileRadius<.05||b.projectileRadius>2||typeof b.fireKey!=='string'))throw Error('Invalid launcher.');
 }
 for(const b of s.bodies.filter(b=>b.mountId)){const host=s.bodies.find(a=>a.id===b.mountId);if(b.fixed===true||!['launcher','fuel','oxygen','thruster','gearbox'].includes(b.kind)||!host||['terrain','ground','launcher','fuel','oxygen','thruster','gearbox'].includes(host.kind)||host.fixed)throw Error('Mounted equipment needs a moving shape.');}
 for(const j of s.joints)if(j.gearboxId&&!s.bodies.some(b=>b.id===j.gearboxId&&b.kind==='gearbox'))throw Error('Missing gearbox.');
 const jointIds=new Set();for(const j of s.joints){if(!j.id||jointIds.has(j.id)||!['axle','rod','weld','gear'].includes(j.kind))throw Error('Invalid joint.');jointIds.add(j.id);if(j.releaseKey!==undefined&&(typeof j.releaseKey!=='string'||j.releaseKey.length>12||j.releaseKey&&!['weld','rod'].includes(j.kind)))throw Error('Invalid release key.');if(j.lowerAngle!==undefined&&(!Number.isFinite(j.lowerAngle)||!Number.isFinite(j.upperAngle)||j.lowerAngle>=j.upperAngle))throw Error('Invalid axle limits.');if(!ids.has(j.b)||j.a&&!ids.has(j.a))throw Error('A joint refers to a missing object.');if(j.kind==='gear'){if(!Number.isFinite(j.ratio)||Math.abs(j.ratio)<.01||Math.abs(j.ratio)>100)throw Error('Invalid gear ratio.');}else{if(!Number.isFinite(j.x)||!Number.isFinite(j.y)||Math.abs(j.x)>10000||Math.abs(j.y)>10000)throw Error('Invalid anchor.');if(j.kind==='rod'&&(!Number.isFinite(j.length)||j.length<.01||j.length>200))throw Error('Invalid rod length.');if(j.kind==='axle'&&(!Number.isFinite(j.rpm)||Math.abs(j.rpm)>600||!Number.isFinite(j.torque)||j.torque<0||j.torque>10000||typeof j.keyPositive!=='string'||typeof j.keyNegative!=='string'))throw Error('Invalid motor.');}}
 for(const j of s.joints.filter(j=>j.kind==='gear'))if(!s.joints.some(k=>k.id===j.joint1&&k.kind==='axle')||!s.joints.some(k=>k.id===j.joint2&&k.kind==='axle'))throw Error('Gears require two axles.');
 return copy(s);
}
class Simulation{
 constructor(scene){this.scene=copy(scene);this.world=new pl.World(V(0,scene.gravityModel==='earth'?0:-scene.gravity));this.world.setAllowSleeping(true);this.world.setContinuousPhysics(true);this.anchor=this.world.createBody();this.bodies=new Map();this.joints=new Map();this.time=0;this.keys=new Set();this.projectileCount=0;this.samples=[];this.shots=[];this.released=new Set();this.build();this.cacheResources();}
 build(){for(const spec of this.scene.bodies)this.add(spec);for(const b of this.scene.bodies.filter(b=>b.mountId)){const host=this.bodies.get(b.mountId)?.body,e=this.bodies.get(b.id);if(host&&e){const j={id:'mount:'+b.id,kind:'weld',a:b.mountId,b:b.id,x:b.x,y:b.y,mount:true};this.joints.set(j.id,{spec:j,joint:this.world.createJoint(pl.WeldJoint({collideConnected:false},host,e.body,e.body.getPosition()))});}}for(const j of this.scene.joints.filter(j=>j.kind!=='gear')){
 const a=j.a?this.bodies.get(j.a).body:this.anchor,b=this.bodies.get(j.b).body;let q;
 if(j.kind==='axle')q=pl.RevoluteJoint({enableLimit:Number.isFinite(j.lowerAngle),lowerAngle:j.lowerAngle||0,upperAngle:j.upperAngle||0,enableMotor:!!j.motor,motorSpeed:j.rpm*Math.PI/30,maxMotorTorque:j.torque,collideConnected:false},a,b,V(j.x,j.y));
 if(j.kind==='weld')q=pl.WeldJoint({collideConnected:false},a,b,V(j.x,j.y));
 if(j.kind==='rod')q=pl.DistanceJoint({length:j.length,frequencyHz:0,dampingRatio:0,collideConnected:false},a,b,a.getPosition(),b.getPosition());
 if(q)this.joints.set(j.id,{joint:this.world.createJoint(q),spec:j});
 }for(const j of this.scene.joints.filter(j=>j.kind==='gear')){const j1=this.joints.get(j.joint1)?.joint,j2=this.joints.get(j.joint2)?.joint;const a=this.bodies.get(j.a)?.spec,b=this.bodies.get(j.b)?.spec,s1=this.joints.get(j.joint1)?.spec,s2=this.joints.get(j.joint2)?.spec;if(j1&&j2&&gearsAdjacent(a,b)&&!s1.a&&!s2.a&&s1.b===a.id&&s2.b===b.id&&Math.hypot(s1.x-a.x,s1.y-a.y)<.015&&Math.hypot(s2.x-b.x,s2.y-b.y)<.015)this.joints.set(j.id,{spec:j,joint:this.world.createJoint(pl.GearJoint({ratio:b.teeth/a.teeth,joint1:j1,joint2:j2,bodyA:this.bodies.get(j.a).body,bodyB:this.bodies.get(j.b).body}))});}}
 add(spec){const fixed=spec.kind==='ground'||spec.kind==='terrain'||spec.kind==='launcher'&&spec.fixed!==false&&!spec.mountId||spec.fixed===true;
 const b=this.world.createBody({type:fixed?'static':'dynamic',position:V(spec.x,spec.y),angle:spec.angle,linearVelocity:V(spec.vx,spec.vy),angularVelocity:spec.omega,bullet:true,linearDamping:0,angularDamping:0});let shape;
 if(spec.kind==='terrain')shape=pl.Chain(terrainVertices(spec).map(p=>V(p.x,p.y)),true);
 else if(['circle','gear'].includes(spec.kind))shape=pl.Circle(spec.r);
 else if(spec.kind==='triangle')shape=pl.Polygon([V(-spec.w/2,-spec.h/3),V(spec.w/2,-spec.h/3),V(0,2*spec.h/3)]);
 else shape=pl.Box(spec.w/2,spec.h/2);
 b.createFixture(shape,{density:resourceMass(spec)/area(spec),friction:spec.friction,restitution:spec.restitution,filterMaskBits:spec.kind==='launcher'&&fixed?0:65535});b.setUserData(spec.id);
 const e={body:b,spec,acc:V(),net:V(),applied:V(),drag:V(),gravity:V(),thrust:V(),reaction:V(),distance:0,renderRadius:spec.kind==='terrain'?Math.hypot(spec.w,Math.max(Math.abs(spec.base),...spec.profile.map(Math.abs))):['circle','gear'].includes(spec.kind)?spec.r:Math.hypot(spec.w,spec.h)/2,renderVertices:spec.kind==='terrain'?terrainVertices(spec):null,start:V(spec.x,spec.y),activeThrusters:[],last:V(spec.x,spec.y),bornAt:this.time,renderPosition:V(spec.x,spec.y),renderAngle:spec.angle,previousAngle:spec.angle,renderLaunchAngle:spec.launchAngle,previousLaunchAngle:spec.launchAngle,previous:V(spec.x,spec.y),oldVelocity:V(),gravitySample:V(),fuelRemaining:0,oxygenRemaining:0,energyRemaining:0};this.bodies.set(spec.id,e);return e;}
 fire(id){
 const launch=this.bodies.get(id);if(!launch||launch.spec.kind!=='launcher'||this.shots.length>=100)return null;
 const s=launch.spec,a=s.launchAngle*Math.PI/180+launch.body.getAngle(),direction=V(Math.cos(a),Math.sin(a));
 const offset=muzzleDistance(s,launch.body.isDynamic()),center=launch.body.getPosition(),p=V(center.x+offset*direction.x,center.y+offset*direction.y),inherited=launch.body.getLinearVelocityFromWorldPoint(p);
 const shot=body('circle',p.x,p.y,{r:s.projectileRadius,mass:s.projectileMass,vx:inherited.x+s.launchSpeed*direction.x,vy:inherited.y+s.launchSpeed*direction.y,color:'#ffba52',friction:.2,restitution:.2,dragK:s.dragK,projectile:true});
 this.projectileCount++;const e=this.add(shot);this.shots.push(shot.id);if(launch.body.isDynamic())launch.body.applyLinearImpulse(V(-s.projectileMass*s.launchSpeed*direction.x,-s.projectileMass*s.launchSpeed*direction.y),p,true);return e;
 }
 release(key){let count=0;for(const [id,e] of [...this.joints]){if(e.spec.releaseKey?.toLowerCase()===key.toLowerCase()){this.world.destroyJoint(e.joint);this.joints.delete(id);this.released.add(id);count++;}}if(count)this.cacheResources();return count;}
 cacheResources(){
  // Tanks can feed engines only through rigid welds, including equipment mounts.
  const links=new Map([...this.bodies.keys()].map(id=>[id,[]]));
  for(const {spec:j} of this.joints.values())if(j.kind==='weld'&&j.a){links.get(j.a)?.push(j.b);links.get(j.b)?.push(j.a);}
  for(const [id,e] of this.bodies){const seen=new Set([id]),queue=[id];for(let n=0;n<queue.length;n++)for(const k of links.get(queue[n])||[])if(!seen.has(k)){seen.add(k);queue.push(k);}for(const k of queue){let f=this.bodies.get(k).body.getFixtureList();for(;f;f=f.getNext())f.setFilterGroupIndex(-1-[...this.bodies.keys()].indexOf(queue.slice().sort()[0]));}e.assemblyIds=seen;e.fuelTanks=queue.map(k=>this.bodies.get(k)).filter(e=>e.spec.kind==='fuel');e.oxygenTanks=queue.map(k=>this.bodies.get(k)).filter(e=>e.spec.kind==='oxygen');}
 }
 consumeThrust(e,t,h){
  if(!t.limited||t.force===0)return t.force;
  let fuel=0,oxygen=0,energy=0;for(const q of e.fuelTanks){fuel+=q.spec.contents;energy+=q.spec.contents*q.spec.specificEnergy*1e6;}for(const q of e.oxygenTanks)oxygen+=q.spec.contents;
  e.fuelRemaining=fuel;e.oxygenRemaining=oxygen;e.energyRemaining=energy;
  if(fuel<=0||oxygen<=0){e.thrustStatus='Out of fuel / oxygen';return 0;}
  // Constant effective exhaust velocity; energy available limits achievable thrust.
  const heat=energy/fuel,ve=Math.min(t.exhaustSpeed,Math.sqrt(2*heat*t.efficiency/(1+t.oxygenRatio)));
  e.effectiveExhaustSpeed=ve;
  const requested=Math.abs(t.force)*h/ve,neededFuel=requested/(1+t.oxygenRatio),neededOxygen=neededFuel*t.oxygenRatio;
  const actual=Math.min(1,fuel/neededFuel,oxygen/neededOxygen);
  for(const q of e.fuelTanks){const take=Math.min(q.spec.contents,q.spec.contents*neededFuel*actual/fuel);q.spec.contents=Math.max(0,q.spec.contents-take);this.updateTankMass(q);}
  for(const q of e.oxygenTanks){const take=Math.min(q.spec.contents,q.spec.contents*neededOxygen*actual/oxygen);q.spec.contents=Math.max(0,q.spec.contents-take);this.updateTankMass(q);}
  e.thrustStatus=actual<.999?'Energy / supply limited':'Burning';return t.force*actual;
 }
 updateTankMass(e){const v=e.body.getLinearVelocity(),x=v.x,y=v.y;e.body.getFixtureList().setDensity(resourceMass(e.spec)/area(e.spec));e.body.resetMassData();e.body.setLinearVelocity(V(x,y));}
 step(h=DT){
  for(const e of this.bodies.values()){const b=e.body,v=b.getLinearVelocity(),p=b.getPosition();e.oldVelocity.set(v);e.previous.set(p);e.previousAngle=b.getAngle();e.previousLaunchAngle=e.spec.launchAngle;e.activeThrusters.length=0;e.thrust.setZero();e.applied.set(e.spec.fx,e.spec.fy);e.drag.setZero();e.thrustStatus='Off';}
  // Aiming changes the barrel, independently of the carrier orientation.
  for(const e of this.bodies.values()){const s=e.spec;if(s.kind==='launcher'){const dir=(this.keys.has((s.aimPositiveKey||'').toLowerCase())?1:0)-(this.keys.has((s.aimNegativeKey||'').toLowerCase())?1:0);if(dir)s.launchAngle=Math.max(-180,Math.min(180,s.launchAngle+dir*(s.aimRate||30)*h));}}
  for(const e of this.bodies.values()){const b=e.body;if(!b.isDynamic())continue;const s=e.spec;
   for(const t of s.thrusters)if(t.always||this.keys.has(t.key.toLowerCase())){const force=this.consumeThrust(e,t,h);if(!force)continue;const a=b.getAngle()+t.angle*Math.PI/180,f=V(force*Math.cos(a),force*Math.sin(a)),point=b.getWorldPoint(V(t.offsetX,t.offsetY));b.applyForce(f,point,true);e.thrust.add(f);e.activeThrusters.push(t);}
  }
  for(const e of this.bodies.values()){const b=e.body;if(!b.isDynamic())continue;const s=e.spec,v=b.getLinearVelocity(),g=gravityAt(this.scene,b.getPosition()),m=b.getMass();e.gravity.set(m*g.x,m*g.y);
   if(this.scene.air){const k=s.dragK*v.length();e.drag.set(-k*v.x,-k*v.y);}
   const fx=e.applied.x+e.drag.x+(this.scene.gravityModel==='earth'?e.gravity.x:0),fy=e.applied.y+e.drag.y+(this.scene.gravityModel==='earth'?e.gravity.y:0);
   if(fx||fy)b.applyForceToCenter(V(fx,fy),true);
  }
  for(const {joint:j,spec:s} of this.joints.values())if(s.kind==='axle'&&s.motor){const dir=(this.keys.has(s.keyPositive.toLowerCase())?1:0)-(this.keys.has(s.keyNegative.toLowerCase())?1:0),box=this.bodies.get(s.gearboxId),ratio=box?.assemblyIds?.has(s.a)?box.spec.ratio:1;j.enableMotor(!!s.auto||dir!==0);j.setMotorSpeed((s.auto&&dir===0?1:dir)*s.rpm*Math.PI/30/ratio);j.setMaxMotorTorque(s.torque*ratio);}
  this.world.step(h,12,8);this.time+=h;
  for(const e of this.bodies.values()){const b=e.body,v=b.getLinearVelocity(),p=b.getPosition();e.acc.set((v.x-e.oldVelocity.x)/h,(v.y-e.oldVelocity.y)/h);e.net.set(e.acc.x*b.getMass(),e.acc.y*b.getMass());e.reaction.set(e.net.x-e.gravity.x-e.applied.x-e.thrust.x-e.drag.x,e.net.y-e.gravity.y-e.applied.y-e.thrust.y-e.drag.y);e.distance+=Math.hypot(p.x-e.last.x,p.y-e.last.y);e.last.set(p);}
 }
 interpolate(alpha=1){
  // Rendering alone trails the authoritative solver by at most one fixed step.
  // Interpolate the same poses for bodies, mounts, vectors and camera tracking.
  const a=Math.max(0,Math.min(1,alpha));
  for(const e of this.bodies.values()){const p=e.body.getPosition();e.renderPosition.set(e.previous.x+(p.x-e.previous.x)*a,e.previous.y+(p.y-e.previous.y)*a);e.renderAngle=e.previousAngle+(e.body.getAngle()-e.previousAngle)*a;if(e.spec.kind==='launcher')e.renderLaunchAngle=e.previousLaunchAngle+(e.spec.launchAngle-e.previousLaunchAngle)*a;}
 }
 resources(id){const e=this.bodies.get(id);if(!e)return {fuel:0,oxygen:0,energy:0};let fuel=0,oxygen=0,energy=0;for(const q of e.fuelTanks||[]){fuel+=q.spec.contents;energy+=q.spec.contents*q.spec.specificEnergy;}for(const q of e.oxygenTanks||[])oxygen+=q.spec.contents;return {fuel,oxygen,energy};}
 removeProjectile(id){const e=this.bodies.get(id);if(!e?.spec.projectile)return false;if(e.body.getJointList())return false;this.world.destroyBody(e.body);this.bodies.delete(id);this.shots=this.shots.filter(k=>k!==id);return true;}
 advance(seconds){const n=Math.round(seconds/DT);for(let i=0;i<n;i++)this.step();}
 state(id){const e=this.bodies.get(id);if(!e)return null;const b=e.body,p=b.getPosition(),v=b.getLinearVelocity();return {t:this.time,x:p.x,y:p.y,vx:v.x,vy:v.y,speed:v.length(),ax:e.acc.x,ay:e.acc.y,acceleration:e.acc.length(),distance:e.distance,displacement:Math.hypot(p.x-e.start.x,p.y-e.start.y),angle:b.getAngle(),omega:b.getAngularVelocity(),mass:b.getMass(),...(e.spec.kind==='launcher'?{launchAngle:e.spec.launchAngle}:{}),fx:e.net.x,fy:e.net.y};}
}
root.Newton={Simulation,body,empty,demo,validate,uid,copy,DT,area,gearsAdjacent,terrain,terrainVertices,terrainHeight,sculpt,muzzleDistance,equipment,resourceMass,gravityAt,EARTH_RADIUS,EARTH_MU};if(typeof module!=='undefined')module.exports=root.Newton;
})(typeof window!=='undefined'?window:globalThis);
