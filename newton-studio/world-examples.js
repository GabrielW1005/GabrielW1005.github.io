/* Fictional nearby worlds and a finite jumping course, with unlimited camera travel. */
(function(root){
'use strict';
root.Workshop.example=function(type){
 const N=root.Newton,s=N.empty(),B=N.body,E=N.equipment;
 function station(x,y,fuel=50){return B('refuel',x,y,{w:1,h:1.5,mass:3,fixed:true,color:'#3aa78e',fuelStore:fuel,oxygenStore:fuel*8,fuelRate:1,oxygenRate:8,refuelRadius:4,name:'Refueling station'});}
 function tank(hull,kind,x,y,contents){return E(kind,x,y,{w:.45,h:.5,mass:.3,contents,capacity:contents,mountId:hull.id,angle:hull.angle});}
 function engine(hull,x,y,angle,key,force=160){const b=E('thruster',x,y,{w:.5,h:.5,mass:.3,mountId:hull.id,name:key.toUpperCase()+' thruster'});b.thrusters[0]={...b.thrusters[0],force,angle,key,exhaustSpeed:600};return b;}
 if(type==='spaceTour'){
  s.gravity=0;s.gravityModel='planets';s.follow=true;s.camera={scale:18};
  const planets=[B('planet',0,-12,{r:8,mass:.6*64/N.G,fixed:true,color:'#6d8cc4',name:'Aster'}),B('planet',65,10,{r:10,mass:.35*100/N.G,fixed:true,color:'#a975bd',name:'Ember'}),B('planet',140,-18,{r:12,mass:.45*144/N.G,fixed:true,color:'#50a68d',name:'Moss'})];
  const hull=B('rectangle',0,0,{w:2.4,h:1,mass:5,color:'#8498bc',name:'Explorer',friction:.6});
  const fuel=tank(hull,'fuel',-.65,0,2),oxygen=tank(hull,'oxygen',.65*(2.3/16.3),0,16);
  s.bodies=[...planets,hull,fuel,oxygen,engine(hull,0,-.8,90,'w'),engine(hull,0,.8,-90,'s'),engine(hull,-1.5,0,0,'d'),engine(hull,1.5,0,180,'a'),station(3,1),station(65,22),station(140,-4)];
  const point=B('point',0,0,{r:.05,w:.1,h:.1,mass:.01,mountId:hull.id,color:'#d46cff',trace:{enabled:true,color:'#d46cff',width:2,fade:0}});s.bodies.push(point);s.subject=hull.id;
  s.description='Fictional miniature worlds. Hold W/A/S/D to thrust up/left/down/right relative to the ship. Follow tracks Explorer; zoom out to see Aster, Ember and Moss. Slow below 2 m/s near green stations to refuel. Gravity uses the displayed masses and inverse-square law, with fixed planet centers.';
  return s;
 }
 if(type==='roughCourse'){
  s.follow=true;s.camera={scale:35};const profiles=[[-15,80],[95,175],[191,271],[290,370],[389,469]];
  for(const [lo,hi] of profiles){const t=N.terrain((lo+hi)/2,0,hi-lo,Math.round((hi-lo)/.25));t.base=-14;t.friction=.85;t.profile=t.profile.map((_,i)=>{const x=lo+i*(hi-lo)/(t.profile.length-1);return .4*Math.sin(x*.3)+.18*Math.sin(x*1.4)+(x>hi-12?(x-(hi-12))*.35:0);});s.bodies.push(t);}
  const car=B('rectangle',0,1.7,{w:3.2,h:.55,mass:5,color:'#35bba3',name:'Trail rover'}),a=B('circle',-1.05,.8,{r:.6,mass:1,friction:1.1,color:'#526276',name:'Rear tire'}),b=B('circle',1.05,.8,{r:.6,mass:1,friction:1.1,color:'#526276',name:'Front tire'});
  s.bodies.push(car,a,b,tank(car,'fuel',-.65,2.1,1),tank(car,'oxygen',.65*1.3/8.3,2.1,8),engine(car,0,1.15,90,'w',220),engine(car,-1.85,1.7,0,'e',90),station(5,2),station(115,2),station(315,2));
  s.joints=[a,b].map(w=>({id:N.uid(),kind:'axle',a:car.id,b:w.id,x:w.x,y:w.y,motor:true,auto:false,rpm:-360,torque:35,keyPositive:'d',keyNegative:'a'}));
  for(const j of s.joints){const m=B('motor',j.x,j.y,{r:.18,w:.36,h:.36,mass:.5,mountId:car.id,color:'#d69f43',motorTorque:j.torque});j.motorBodyId=m.id;s.bodies.push(m);}
  s.subject=car.id;s.description='Hold D/A for wheel motors, W for upward thrust and E for forward boost. Release keys to coast. Ride the hills, launch from ramps and cross the open gaps. Green stations replenish finite fuel and oxygen when tanks pass within reach below 2 m/s. The course is about 500 m long; the camera can follow beyond it.';return s;
 }
 return null;
};
})(typeof window!=='undefined'?window:globalThis);
