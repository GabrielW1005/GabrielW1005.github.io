/* Newton Studio — SI-unit adapter around Planck 1.5 / Box2D. */
(function(root){
'use strict';
const pl=root.planck || (typeof require==='function'?require('./vendor/planck.min.js'):null);
const V=pl.Vec2, DT=1/240, copy=x=>JSON.parse(JSON.stringify(x));
let serial=0;
const uid=()=>`b${Date.now().toString(36)}${++serial}`;
function body(kind,x,y,extra={}){return {id:uid(),kind,x,y,angle:0,w:1.6,h:1,r:.65,mass:2,friction:.4,restitution:.15,vx:0,vy:0,omega:0,fx:0,fy:0,dragK:.12,color:'#5f86ff',teeth:20,thrusters:[],...extra};}
function empty(){return {version:1,gravity:9.81,air:false,bodies:[],joints:[]};}
function demo(){const s=empty();s.bodies=[body('ground',0,-.4,{w:30,h:.8,color:'#526276'}),body('rectangle',-4,3,{color:'#5f86ff'}),body('circle',-.8,5,{r:.7,mass:3,color:'#ffa64d'}),body('triangle',3,3.5,{w:1.8,h:1.6,color:'#35bba3'})];return s;}
function area(b){return ['circle','gear'].includes(b.kind)?Math.PI*b.r*b.r:b.kind==='triangle'?b.w*b.h/2:b.w*b.h;}
function validate(s){
 if(!s||s.version!==1||!Array.isArray(s.bodies)||!Array.isArray(s.joints)||s.bodies.length>180||s.joints.length>250)throw Error('This is not a supported Newton Studio scene (maximum 180 objects).');
 if(typeof s.air!=='boolean')throw Error('Air resistance must be on or off.');
 if(!Number.isFinite(s.gravity)||Math.abs(s.gravity)>30)throw Error('Gravity must be between −30 and 30 m/s².');
 const ids=new Set();const kinds=['circle','gear','rectangle','triangle','ground','launcher'];
 for(const b of s.bodies){if(!b.id||ids.has(b.id)||!kinds.includes(b.kind))throw Error('Invalid object.');ids.add(b.id);
 for(const k of ['x','y','angle','w','h','r','mass','friction','restitution','vx','vy','omega','fx','fy','dragK'])if(!Number.isFinite(b[k]))throw Error(`Invalid ${k}.`);
 if(Math.abs(b.x)>10000||Math.abs(b.y)>10000||b.w<.1||b.w>100||b.h<.1||b.h>100||b.r<.05||b.r>20||b.mass<.01||b.mass>1000||b.friction<0||b.friction>2||b.restitution<0||b.restitution>1||b.dragK<0||b.dragK>10||Math.hypot(b.vx,b.vy)>100||Math.abs(b.omega)>100||Math.hypot(b.fx,b.fy)>10000||!/^#[0-9a-f]{6}$/i.test(b.color))throw Error('Object values exceed the supported range.');
 if(b.kind==='gear'&&(!Number.isInteger(b.teeth)||b.teeth<6||b.teeth>100))throw Error('Gear teeth must be 6–100.');
 if(!Array.isArray(b.thrusters)||b.thrusters.length>8)throw Error('Invalid thrusters.');
 for(const t of b.thrusters)if(!Number.isFinite(t.force)||Math.abs(t.force)>10000||!Number.isFinite(t.angle)||!Number.isFinite(t.offsetX)||!Number.isFinite(t.offsetY)||Math.hypot(t.offsetX,t.offsetY)>100||typeof t.key!=='string'||t.key.length>12)throw Error('Invalid thruster.');
 if(b.kind==='launcher'&&(!Number.isFinite(b.launchSpeed)||b.launchSpeed<.1||b.launchSpeed>100||!Number.isFinite(b.launchAngle)||!Number.isFinite(b.projectileMass)||b.projectileMass<.01||b.projectileMass>1000||!Number.isFinite(b.projectileRadius)||b.projectileRadius<.05||b.projectileRadius>2||typeof b.fireKey!=='string'))throw Error('Invalid launcher.');
 }
 const jointIds=new Set();for(const j of s.joints){if(!j.id||jointIds.has(j.id)||!['axle','rod','weld','gear'].includes(j.kind))throw Error('Invalid joint.');jointIds.add(j.id);if(!ids.has(j.b)||j.a&&!ids.has(j.a))throw Error('A joint refers to a missing object.');if(j.kind==='gear'){if(!Number.isFinite(j.ratio)||Math.abs(j.ratio)<.01||Math.abs(j.ratio)>100)throw Error('Invalid gear ratio.');}else{if(!Number.isFinite(j.x)||!Number.isFinite(j.y)||Math.abs(j.x)>10000||Math.abs(j.y)>10000)throw Error('Invalid anchor.');if(j.kind==='rod'&&(!Number.isFinite(j.length)||j.length<.01||j.length>200))throw Error('Invalid rod length.');if(j.kind==='axle'&&(!Number.isFinite(j.rpm)||Math.abs(j.rpm)>600||!Number.isFinite(j.torque)||j.torque<0||j.torque>10000||typeof j.keyPositive!=='string'||typeof j.keyNegative!=='string'))throw Error('Invalid motor.');}}
 for(const j of s.joints.filter(j=>j.kind==='gear'))if(!s.joints.some(k=>k.id===j.joint1&&k.kind==='axle')||!s.joints.some(k=>k.id===j.joint2&&k.kind==='axle'))throw Error('Gears require two axles.');
 return copy(s);
}
class Simulation{
 constructor(scene){this.scene=copy(scene);this.world=new pl.World(V(0,-scene.gravity));this.world.setAllowSleeping(false);this.world.setContinuousPhysics(true);this.anchor=this.world.createBody();this.bodies=new Map();this.joints=new Map();this.time=0;this.keys=new Set();this.projectileCount=0;this.samples=[];this.shots=[];this.build();}
 build(){for(const spec of this.scene.bodies)this.add(spec);for(const j of this.scene.joints.filter(j=>j.kind!=='gear')){
 const a=j.a?this.bodies.get(j.a).body:this.anchor,b=this.bodies.get(j.b).body;let q;
 if(j.kind==='axle')q=pl.RevoluteJoint({enableMotor:!!j.motor,motorSpeed:j.rpm*Math.PI/30,maxMotorTorque:j.torque,collideConnected:false},a,b,V(j.x,j.y));
 if(j.kind==='weld')q=pl.WeldJoint({collideConnected:false},a,b,V(j.x,j.y));
 if(j.kind==='rod')q=pl.DistanceJoint({length:j.length,frequencyHz:0,dampingRatio:0,collideConnected:false},a,b,a.getPosition(),b.getPosition());
 if(q)this.joints.set(j.id,{joint:this.world.createJoint(q),spec:j});
 }for(const j of this.scene.joints.filter(j=>j.kind==='gear')){const j1=this.joints.get(j.joint1)?.joint,j2=this.joints.get(j.joint2)?.joint;if(j1&&j2)this.joints.set(j.id,{spec:j,joint:this.world.createJoint(pl.GearJoint({ratio:j.ratio,joint1:j1,joint2:j2,bodyA:this.bodies.get(j.a).body,bodyB:this.bodies.get(j.b).body}))});}}
 add(spec){const fixed=spec.kind==='ground'||spec.kind==='launcher'||spec.fixed;
 const b=this.world.createBody({type:fixed?'static':'dynamic',position:V(spec.x,spec.y),angle:spec.angle,linearVelocity:V(spec.vx,spec.vy),angularVelocity:spec.omega,bullet:true,linearDamping:0,angularDamping:0});let shape;
 if(['circle','gear'].includes(spec.kind))shape=pl.Circle(spec.r);
 else if(spec.kind==='triangle')shape=pl.Polygon([V(-spec.w/2,-spec.h/3),V(spec.w/2,-spec.h/3),V(0,2*spec.h/3)]);
 else shape=pl.Box(spec.w/2,spec.h/2);
 b.createFixture(shape,{density:spec.mass/area(spec),friction:spec.friction,restitution:spec.restitution,filterMaskBits:spec.kind==='launcher'?0:65535});b.setUserData(spec.id);
 const e={body:b,spec,acc:V(),net:V(),applied:V(),drag:V(),gravity:V(),thrust:V(),reaction:V(),distance:0,start:V(spec.x,spec.y),activeThrusters:[],last:V(spec.x,spec.y)};this.bodies.set(spec.id,e);return e;}
 fire(id){const launch=this.bodies.get(id);if(!launch||launch.spec.kind!=='launcher'||this.projectileCount>=100)return null;const s=launch.spec,a=s.launchAngle*Math.PI/180+launch.body.getAngle(),p=launch.body.getPosition();const shot=body('circle',p.x,p.y,{r:s.projectileRadius,mass:s.projectileMass,vx:s.launchSpeed*Math.cos(a),vy:s.launchSpeed*Math.sin(a),color:'#ffba52',friction:.2,restitution:.2,dragK:s.dragK,projectile:true});this.projectileCount++;const e=this.add(shot);this.shots.push(shot.id);return e;}
 step(h=DT){
 const old=new Map();for(const [id,e] of this.bodies){const b=e.body,v=b.getLinearVelocity();old.set(id,V(v.x,v.y));e.previous=V(b.getPosition().x,b.getPosition().y);if(!b.isDynamic())continue;
 const s=e.spec,m=b.getMass();e.gravity=V(0,-this.scene.gravity*m);e.applied=V(s.fx,s.fy);e.thrust=V();e.activeThrusters=[];
 for(const t of s.thrusters){if(t.always||this.keys.has(t.key.toLowerCase())){const a=b.getAngle()+t.angle*Math.PI/180,f=V(t.force*Math.cos(a),t.force*Math.sin(a)),point=b.getWorldPoint(V(t.offsetX,t.offsetY));b.applyForce(f,point,true);e.thrust.add(f);e.activeThrusters.push(t);}}
 const speed=v.length();e.drag=this.scene.air?V(-s.dragK*speed*v.x,-s.dragK*speed*v.y):V();b.applyForceToCenter(V(e.applied.x+e.drag.x,e.applied.y+e.drag.y),true);
 }
 for(const {joint:j,spec:s} of this.joints.values()){if(s.kind==='axle'&&s.motor){const pos=this.keys.has(s.keyPositive.toLowerCase()),neg=this.keys.has(s.keyNegative.toLowerCase());const dir=(pos?1:0)-(neg?1:0);j.enableMotor(!!s.auto||dir!==0);j.setMotorSpeed((s.auto&&dir===0?1:dir)*s.rpm*Math.PI/30);j.setMaxMotorTorque(s.torque);}}
 this.world.step(h,12,8);this.time+=h;
 for(const [id,e] of this.bodies){const b=e.body,v=b.getLinearVelocity(),o=old.get(id),p=b.getPosition();e.acc=V((v.x-o.x)/h,(v.y-o.y)/h);e.net=V(e.acc.x*b.getMass(),e.acc.y*b.getMass());e.reaction=V(e.net.x-e.gravity.x-e.applied.x-e.thrust.x-e.drag.x,e.net.y-e.gravity.y-e.applied.y-e.thrust.y-e.drag.y);e.distance+=Math.hypot(p.x-e.last.x,p.y-e.last.y);e.last=V(p.x,p.y);}
 }
 advance(seconds){const n=Math.round(seconds/DT);for(let i=0;i<n;i++)this.step();}
 state(id){const e=this.bodies.get(id);if(!e)return null;const b=e.body,p=b.getPosition(),v=b.getLinearVelocity();return {t:this.time,x:p.x,y:p.y,vx:v.x,vy:v.y,speed:v.length(),ax:e.acc.x,ay:e.acc.y,acceleration:e.acc.length(),distance:e.distance,displacement:Math.hypot(p.x-e.start.x,p.y-e.start.y),angle:b.getAngle(),omega:b.getAngularVelocity(),mass:b.getMass(),fx:e.net.x,fy:e.net.y};}
}
root.Newton={Simulation,body,empty,demo,validate,uid,copy,DT,area};if(typeof module!=='undefined')module.exports=root.Newton;
})(typeof window!=='undefined'?window:globalThis);
