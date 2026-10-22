import {evaluate,modelInfo,format as baseFormat} from './physics.js?v=20261022-2';
const format=(value,digits)=>baseFormat(value,digits??(Math.abs(value)>0&&Math.abs(value)<.1?Math.min(7,Math.ceil(-Math.log10(Math.abs(value)))+2):2));

const TAU=Math.PI*2;
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
function setup(canvas,theme){
 const box=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(180,box.width),h=Math.max(120,box.height);
 if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
 const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);const dark=theme==='dark';
 return {c,w,h,ink:dark?'#e1ecf8':'#17364e',muted:dark?'#a8bdd0':'#627c90',line:dark?'#31485d':'#d9e5ef',blue:dark?'#7eb9ff':'#2475cf',orange:dark?'#ffc46f':'#ad6905',green:dark?'#7cddba':'#15816c',fill:dark?'#203b54':'#e6f0fa',panel:dark?'#122436':'#f7fbff',white:dark?'#122436':'#ffffff'};
}
function text(c,s,x,y,color,size=13,align='left',bold=false,maxWidth){c.fillStyle=color;c.font=`${bold?'650':'400'} ${size}px system-ui,sans-serif`;c.textAlign=align;c.textBaseline='middle';if(maxWidth)c.fillText(String(s),x,y,maxWidth);else c.fillText(String(s),x,y);}
function line(c,x1,y1,x2,y2,color,width=1,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.lineCap='round';c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function ellipse(c,x,y,rx,ry,fill,stroke){c.beginPath();c.ellipse(x,y,Math.max(.2,rx),Math.max(.2,ry),0,0,TAU);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=2;c.stroke();}}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function arrow(c,x,y,dx,dy,color,label,size=12){const len=Math.hypot(dx,dy);if(len<.8)return;const ux=dx/len,uy=dy/len;line(c,x,y,x+dx,y+dy,color,3);c.fillStyle=color;c.beginPath();c.moveTo(x+dx,y+dy);c.lineTo(x+dx-ux*9-uy*4.5,y+dy-uy*9+ux*4.5);c.lineTo(x+dx-ux*9+uy*4.5,y+dy-uy*9-ux*4.5);c.closePath();c.fill();if(label){if(Math.abs(dy)>Math.abs(dx))text(c,label,x+14,y+dy*.5,color,size,'left',true);else text(c,label,x+dx*.5,y-15,color,size,'center',true);}}
function chip(c,label,x,y,pal,color=pal.ink){c.font='600 12px system-ui,sans-serif';const width=c.measureText(label).width+20;round(c,x-width/2,y-13,width,26,13,pal.fill);text(c,label,x,y,color,12,'center',true);}
function caption(pal,label){text(pal.c,label,pal.w/2,pal.h-19,pal.muted,12,'center',false,pal.w-32);}
function spring(c,x,y1,y2,color,width=15){line(c,x,y1,x,y1+7,color,2.2);const top=y1+7,bottom=y2-7,n=16;let px=x,py=top;for(let i=1;i<n;i++){const nx=x+(i%2?width:-width),ny=top+(bottom-top)*i/n;line(c,px,py,nx,ny,color,2.2);px=nx;py=ny;}line(c,px,py,x,bottom,color,2.2);line(c,x,bottom,x,y2,color,2.2);}
function person(c,x,y,color,phase=0,direction=1,seated=false){c.save();c.translate(x,y);c.scale(direction||1,1);ellipse(c,0,-53,7.5,7.5,color);line(c,0,-44,0,-20,color,5);if(seated){line(c,0,-22,16,-22,color,4);line(c,16,-22,16,0,color,4);line(c,0,-38,16,-29,color,3.5);line(c,-5,-42,-5,-17,color,4);line(c,-5,-17,21,-17,color,4);}else{const stride=Math.sin(phase)*7;line(c,0,-20,-10-stride,0,color,4);line(c,0,-20,10+stride,0,color,4);line(c,0,-37,12+stride,-24,color,3.5);line(c,0,-37,-9-stride,-24,color,3.5);}c.restore();}
function bike(c,x,y,color,phase,direction=1){c.save();c.translate(x,y);c.scale(direction||1,1);for(const dx of [-24,24]){ellipse(c,dx,-13,14,14,null,color);line(c,dx,-13,dx+11*Math.cos(phase),-13+11*Math.sin(phase),color,1);}for(const [a,b,d,e]of[[-24,-13,-6,-34],[-6,-34,5,-13],[-24,-13,5,-13],[-6,-34,17,-34],[17,-34,24,-13],[17,-34,17,-42],[-13,-35,0,-35]])line(c,a,b,d,e,color,2.3);line(c,-6,-35,0,-55,color,4);ellipse(c,4,-64,7,7,color);line(c,0,-52,17,-42,color,3.5);line(c,-6,-35,7,-24,color,3.5);line(c,7,-24,5,-13,color,3);c.restore();}
function topBike(c,x,y,color,angle){c.save();c.translate(x,y);c.rotate(angle);round(c,-24,-3,15,6,3,color);round(c,10,-3,15,6,3,color);line(c,-14,0,18,0,color,3);line(c,11,-12,11,12,color,3);ellipse(c,2,0,9,6,color);line(c,4,-4,11,-11,color,3);line(c,4,4,11,11,color,3);ellipse(c,10,0,5,5,color);c.restore();}
function airplane(c,x,y,color,scale=1,direction=1){c.save();c.translate(x,y);c.scale(scale*direction,scale);c.fillStyle=color;c.beginPath();c.moveTo(51,-9);c.quadraticCurveTo(45,-19,26,-19);c.lineTo(-28,-19);c.lineTo(-41,-38);c.lineTo(-49,-38);c.lineTo(-44,-12);c.lineTo(-51,-7);c.lineTo(12,-5);c.lineTo(4,13);c.lineTo(16,13);c.lineTo(32,-5);c.lineTo(49,-6);c.closePath();c.fill();round(c,27,-17,12,5,2,'#c8e6f9');c.restore();}
function flightObject(c,x,y,color,scene,t,pal){
 if(scene==='helicopter'){round(c,x-47,y-25,78,39,18,color);ellipse(c,x+22,y-12,22,20,color);round(c,x+14,y-24,25,18,6,pal.fill);line(c,x-42,y-14,x-88,y-30,color,7);line(c,x-88,y-39,x-88,y-21,color,3);line(c,x-98,y-30,x-78,y-30,color,3);line(c,x-9,y-27,x-9,y-39,color,4);line(c,x-70,y-40,x+53,y-40,color,3);line(c,x-28,y+15,x-28,y+27,color,3);line(c,x+19,y+15,x+19,y+27,color,3);line(c,x-45,y+27,x+40,y+27,color,4);}
 else if(scene==='balloon'){ellipse(c,x,y-40,40,51,color);c.strokeStyle=pal.fill;c.lineWidth=2;c.beginPath();c.ellipse(x,y-40,18,51,0,0,TAU);c.stroke();line(c,x-23,y+3,x-14,y+24,color,2);line(c,x+23,y+3,x+14,y+24,color,2);round(c,x-17,y+22,34,22,4,pal.orange);}
 else if(scene==='bird'){ellipse(c,x,y,21,10,color);ellipse(c,x+22,y-6,10,9,color);c.fillStyle=pal.orange;c.beginPath();c.moveTo(x+30,y-9);c.lineTo(x+41,y-4);c.lineTo(x+30,y-2);c.fill();const lift=10+17*Math.sin(t*14);line(c,x-2,y-4,x-28,y-28-lift,color,7);line(c,x-3,y-4,x+13,y-26-lift,color,6);line(c,x-17,y,x-36,y-10,color,5);ellipse(c,x+25,y-9,1.8,1.8,pal.white);}
 else if(scene==='drone'){round(c,x-24,y-10,48,22,8,color);for(const dx of[-50,50]){line(c,x+Math.sign(dx)*18,y,x+dx,y-16,color,5);line(c,x+dx,y-16,x+dx,y-24,color,3);ellipse(c,x+dx,y-25,24,4,null,color);}line(c,x-16,y+12,x-21,y+26,color,3);line(c,x+16,y+12,x+21,y+26,color,3);}
 else airplane(c,x,y,color,1,1);
}
function object(c,x,y,color,problem,t,v=1){
 const scene=problem.simulation.scene||'',all=`${problem.title} ${problem.prompt}`.toLowerCase(),dir=Math.sign(v)||1;
 if(scene==='modelplanes'||scene==='airplane'){airplane(c,x,y-20,color,.85,dir);return;}
 if(/bicycl|cyclist|cycling/.test(all)){bike(c,x,y,color,t*5*dir,dir);return;}
 if(/hockey|puck/.test(all)){ellipse(c,x,y-8,25,9,color);return;}
 if(/bus/.test(all)){c.save();c.translate(x,y);c.scale(dir,1);round(c,-54,-49,108,38,6,color);for(let i=0;i<4;i++)round(c,-44+i*23,-42,18,17,2,'#cce7f9');for(const dx of[-34,34])ellipse(c,dx,-8,9,9,color);line(c,53,-39,58,-39,color,3);c.restore();return;}
 if(scene==='car'||/remote.control|\bcar\b/.test(all)){c.save();c.translate(x,y);c.scale(dir,1);round(c,-36,-28,72,21,7,color);round(c,-21,-42,39,21,8,color);round(c,-14,-38,24,12,3,'#cce7f9');for(const dx of[-23,24])ellipse(c,dx,-6,9,9,color);round(c,29,-23,7,7,2,'#fcecbf');c.restore();return;}
 if(/equipment box|crate/.test(all)){round(c,x-28,y-52,56,49,4,color);line(c,x,y-51,x,y-3,'#ffffff60',2);line(c,x-19,y-40,x-4,y-40,'#ffffffa0',3);return;}
 if(/dog/.test(all)){c.save();c.translate(x,y);c.scale(dir,1);round(c,-23,-34,42,21,8,color);ellipse(c,25,-35,12,12,color);line(c,-16,-13,-20+(Math.abs(v)<.001?0:Math.sin(t*6)*4),0,color,4);line(c,12,-13,17-(Math.abs(v)<.001?0:Math.sin(t*6)*4),0,color,4);line(c,-20,-30,-34,-44,color,4);line(c,20,-43,15,-48,color,4);c.restore();return;}
 if(/scooter/.test(all)){person(c,x,y-8,color,0,dir);line(c,x-24,y,x+25,y,color,3);line(c,x+dir*22,y,x+dir*22,y-46,color,3);line(c,x+dir*16,y-46,x+dir*28,y-46,color,3);ellipse(c,x-20,y+3,5,5,color);ellipse(c,x+20,y+3,5,5,color);return;}
 person(c,x,y,color,Math.abs(v)<.001?0:t*5,dir);if(/carries a box/.test(all))round(c,x+dir*4-(dir<0?22:0),y-39,22,20,3,color,palFallback(color));
}
const palFallback=()=> '#ffffffaa';
function horizontalAxis(pal,Y,min,max){const {c,w}=pal;line(c,58,Y,w-58,Y,pal.line,2);for(let i=0;i<=4;i++){const x=58+(w-116)*i/4;line(c,x,Y-4,x,Y+5,pal.muted);text(c,format(min+(max-min)*i/4,1),x,Y+20,pal.muted,11,'center');}text(c,'position (m) · east / right →',w-58,Y+42,pal.muted,11,'right');}
function trainScene(pal,problem,p,t,s,arrows){
 const {c,w,h}=pal,speed=num(p.speed),tw=clamp(w*.27,Math.min(170,w*.48),270),th=92,margin=clamp(w*.09,20,82),travel=Math.max(20,w-tw-margin*2),duration=Math.max(.1,num(p.time,8)),maxSpeed=num(problem.simulation.adjustable.find(a=>a.key==='speed')?.max,20),ppm=travel/(maxSpeed*duration),origin=margin+tw/2,groundCenter=origin+speed*t*ppm-10,trainCenter=w*.5;
 const drawView=(cy,ground)=>{const y=cy,center=ground?groundCenter:trainCenter,markerOrigin=ground?origin:trainCenter+10-speed*t*ppm;
  text(c,ground?'PLATFORM FRAME':'TRAIN FRAME',20,y-66,pal.muted,11,'left',true);line(c,30,y+49,w-30,y+49,pal.line,3);
  for(let i=-30;i<31;i++){const meters=i*20,xx=markerOrigin+meters*ppm;if(xx>35&&xx<w-35){line(c,xx,y+49,xx,y+59,pal.muted,2);if(i%2===0){line(c,xx,y+49,xx,y-5,pal.line,3);round(c,xx-20,y-17,40,20,3,pal.fill);text(c,`${meters} m`,xx,y-7,pal.muted,10,'center');}}}
  round(c,center-tw/2,y-th/2,tw,th,10,pal.fill,pal.blue);round(c,center-tw/2+8,y-th/2+9,tw-16,th-24,5,pal.white);for(const dx of[-tw*.32,tw*.32])ellipse(c,center+dx,y+th/2+4,9,9,pal.blue);
  const seatx=center+10;person(c,seatx,y+26,pal.blue,0,1,true);line(c,seatx-7,y-11,seatx-7,y+13,pal.orange,5);line(c,seatx-7,y+13,seatx+26,y+13,pal.orange,5);line(c,seatx-7,y+14,seatx-7,y+30,pal.orange,3);text(c,'seated passenger',center-tw*.24,y-20,pal.blue,10,'center');
  const vx=ground?speed:0;chip(c,ground?`Passenger: ${format(speed)} m/s east`:'Passenger: 0 m/s',w-156,y-66,pal,pal.blue);if(arrows&&ground&&vx)arrow(c,center+tw*.12,y-57,Math.min(70,tw*.25),0,pal.blue);
  if(!ground&&arrows&&speed)arrow(c,w-100,y+28,-55,0,pal.orange,'platform west',10);
 };
 const cy1=h*.29,cy2=h*.70;drawView(cy1,true);drawView(cy2,false);line(c,22,h*.49,w-22,h*.49,pal.line,1,[5,5]);
 const ref=num(s.referenceSpeed,num(p.referenceSpeed));caption(pal,`Same passenger, two viewpoints. Graph: ${Math.abs(ref-speed)<.001?'train frame':Math.abs(ref)<.001?'platform frame':`frame moving at ${format(ref)} m/s`}.`);
}
function scaleScene(pal,problem,p,s,arrows){
 const {c,w,h}=pal,compare=p.compareG!==undefined,mass=num(p.mass,1),gs=compare?[num(p.compareG),num(p.g)]:[num(p.g)],planetLabel=Math.abs(num(p.g)-3.7)<.01?'Mars':'Custom gravity',labels=compare?['Earth',planetLabel]:[planetLabel];
 const adjustable=problem.simulation.adjustable||[],maxMass=num(adjustable.find(a=>a.key==='mass')?.max,mass),maxG=Math.max(10,num(adjustable.find(a=>a.key==='g')?.max,10));const maxWeight=Math.max(1,maxMass*maxG),top=70,space=Math.max(95,h-180),plateBase=h-112;
 const cols=compare?[w*.28,w*.72]:[w*.45];
 cols.forEach((x,i)=>{const col=i?pal.orange:pal.blue,weight=mass*gs[i],compression=weight/maxWeight*Math.min(space*.35,95);text(c,labels[i],x,24,pal.ink,17,'center',true);text(c,`g = ${format(gs[i])} m/s²`,x,48,pal.muted,12,'center');
  if(compare){const base=h-95,initialLength=Math.min(220,h*.36),plate=base-initialLength+weight/maxWeight*initialLength*.45,figureScale=clamp((h-100)/220,1,2.1);round(c,x-70,base,140,13,4,pal.line);spring(c,x,plate+9,base,col,25);line(c,x-68,plate,x+68,plate,col,5);c.save();c.translate(x,plate-2);c.scale(figureScale,figureScale);person(c,0,0,col,0,1);round(c,-11,-51,22,28,7,col);ellipse(c,0,-64,10,10,null,col);c.restore();text(c,`${format(mass)} kg`,x,plate-82*figureScale,col,15,'center',true);
   if(arrows){const len=Math.max(4,weight/maxWeight*95);arrow(c,x-110,plate-20,0,-len,pal.green,'support',11);arrow(c,x+100,plate-50,0,len,col,'weight',11);}
   round(c,x-45,base+17,90,29,6,pal.fill);text(c,`${format(weight)} N`,x,base+31,col,16,'center',true);
  }else{const springTop=top+19,baseLength=40,extension=weight/maxWeight*Math.max(55,h-300),end=springTop+baseLength+extension;line(c,x-79,springTop-10,x+79,springTop-10,pal.line,7);line(c,x,springTop-10,x,springTop,col,3);spring(c,x,springTop,end,col,17);line(c,x,end,x,end+16,col,2);round(c,x-32,end+16,64,42,5,col);round(c,x-11,end+7,22,10,3,null,col);text(c,`${format(mass)} kg`,x,end+38,pal.white,13,'center',true);
   const ry=springTop+baseLength;line(c,x+60,ry,x+60,ry+Math.max(55,h-300),pal.line,2);for(let j=0;j<=4;j++){const yy=ry+Math.max(55,h-300)*j/4;line(c,x+55,yy,x+66,yy,pal.muted);text(c,`${format(maxWeight*j/4)} N`,x+74,yy,pal.muted,11);}
   arrow(c,x+26,end,29,0,col);chip(c,`Scale reading: ${format(weight)} N`,x,h-57,pal,col);
   if(arrows){const len=Math.max(4,weight/maxWeight*75);arrow(c,x-62,end+36,0,-len,pal.green,'spring force',11);arrow(c,x-62,end+45,0,len,pal.orange,'weight',11);}
  }
 });
 caption(pal,compare?'Same mass. Greater gravity compresses the spring more. Scales at rest.':'Hanging at rest: spring force balances weight. Spring mechanism enlarged.');
}
function orbitScene(pal,problem,p,s,arrows){
 const {c,w,h}=pal,orbital=!!p.orbital,cx=w*.49,cy=h*.50,r=Math.max(45,Math.min(h*.32,w*.32)),theta=num(s.theta),xx=cx+r*Math.cos(theta),yy=cy-r*Math.sin(theta);
 c.strokeStyle=pal.line;c.lineWidth=orbital?2:10;c.setLineDash(orbital?[6,6]:[]);c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();c.setLineDash([]);
 if(orbital){ellipse(c,cx,cy,25,25,pal.orange);text(c,'Sun',cx,cy+42,pal.muted,12,'center');ellipse(c,xx,yy,15,15,pal.blue);ellipse(c,xx-3,yy-3,7,5,pal.green);ellipse(c,xx+4,yy+5,4,7,pal.green);text(c,'Earth',xx,yy+28,pal.blue,12,'center',true);}
 else if(problem.id==='P28'){topBike(c,xx,yy,pal.blue,Math.atan2(-Math.cos(theta),-Math.sin(theta)));ellipse(c,cx,cy,3,3,pal.muted);}
 else{person(c,xx,yy+25,pal.blue,s.t*5,-Math.sin(theta)>=0?1:-1);ellipse(c,cx+r,cy,4,4,pal.orange);text(c,'start / finish',cx+r+12,cy+39,pal.muted,11,'center');}
 if(problem.id==='P03'){c.strokeStyle=pal.blue;c.lineWidth=4;c.beginPath();c.arc(cx,cy,r,0,-Math.min(TAU,theta),true);c.stroke();if(Math.abs(num(s.displacement))>.001)arrow(c,cx+r,cy,xx-(cx+r),yy-cy,pal.orange);text(c,'blue arc: distance · orange arrow: displacement',w/2,25,pal.muted,12,'center');}
 if(arrows&&problem.id!=='P03'){arrow(c,xx,yy,-Math.sin(theta)*65,-Math.cos(theta)*65,pal.blue);arrow(c,xx,yy,-Math.cos(theta)*54,Math.sin(theta)*54,pal.orange);}
 line(c,cx,cy,cx+r*.75,cy,pal.line,1,[4,4]);const radius=orbital?`${format(num(s.radius)/1e9,1)} million km`:`radius ${format(num(s.radius))} m`;text(c,radius,cx+r*.42,cy+17,pal.muted,11,'center');
 text(c,orbital?`Speed ${format(num(s.speed)/1000,2)} km/s`:`Speed ${format(num(s.speed))} m/s`,20,problem.id==='P03'?51:24,pal.ink,13,'left',true);
 if(arrows&&problem.id!=='P03'){line(c,22,54,46,54,pal.blue,3);text(c,'velocity: tangent',55,54,pal.blue,12);line(c,22,79,46,79,pal.orange,3);text(c,orbital?'gravity: inward':problem.id==='P28'?'net force: inward':'acceleration: inward',55,79,pal.orange,12);}
 caption(pal,orbital?'Simplified circular orbit · sizes enlarged · gravity changes the direction of velocity.':problem.id==='P03'?'Follow one full lap: the path has length, but start and finish coincide.':'View from above · tire–road friction supplies the inward net force.');
}
function verticalScene(pal,problem,p,t,s,info,arrows){
 const {c,w,h}=pal,scene=problem.simulation.scene||'drone',min=info.range[0],max=info.range[1],top=100,bottom=h-85,Y=z=>bottom-(z-min)/(max-min)*(bottom-top),x=w*.43,y=Y(s.x);
 line(c,57,top,57,bottom,pal.line,2);for(let i=0;i<=4;i++){const yy=bottom-(bottom-top)*i/4;line(c,51,yy,64,yy,pal.muted);text(c,format(min+(max-min)*i/4,1),43,yy,pal.muted,11,'right');line(c,75,yy,w-40,yy,pal.line,.7,[3,6]);}text(c,'height (m)',20,27,pal.muted,12);arrow(c,57,79,0,-30,pal.muted);text(c,'up = positive',77,64,pal.muted,12);
 flightObject(c,x,y,pal.blue,scene,t,pal);
 if(arrows){const vertical=s.forces.filter(f=>f.axis==='vertical'),fmax=Math.max(1,...vertical.map(f=>Math.abs(f.value)));vertical.forEach((f,i)=>{const xx=x+(f.value>=0?120:-120),length=Math.abs(f.value)/fmax*Math.min(95,(h-150)*.28);arrow(c,xx,y,0,-Math.sign(f.value)*length,f.value>=0?pal.green:pal.orange,`${f.label} ${format(Math.abs(f.value))} N`,11);});
  const net=vertical.reduce((a,f)=>a+f.value,0);if(Math.abs(net)>.00001)arrow(c,w-125,h*.42,0,-Math.sign(net)*54,pal.blue,`net ${format(Math.abs(net))} N`,12);
  if(Math.abs(s.v)>.001)arrow(c,w-125,h*.71,0,-Math.sign(s.v)*43,pal.ink,`v ${format(s.v)} m/s`,11);
 }
 caption(pal,'Upward force and weight act on the same object. Their difference changes its velocity.');
}
function collisionObject(c,x,y,rx,ry,color,scene,index,pal){
 if(scene==='bowling'&&index===1){c.fillStyle=color;c.beginPath();c.moveTo(x-rx,y+ry);c.quadraticCurveTo(x-rx*1.25,y+ry*.3,x-rx*.44,y-ry*.5);c.lineTo(x-rx*.3,y-ry*1.1);c.bezierCurveTo(x-rx*.8,y-ry*2.2,x+rx*.8,y-ry*2.2,x+rx*.3,y-ry*1.1);c.lineTo(x+rx*.44,y-ry*.5);c.quadraticCurveTo(x+rx*1.25,y+ry*.3,x+rx,y+ry);c.closePath();c.fill();line(c,x-rx*.34,y-ry*.85,x+rx*.34,y-ry*.85,pal.white,4);return;}
 if(scene==='curling'){round(c,x-rx,y-ry*.72,rx*2,ry*1.45,ry*.55,color);line(c,x-rx*.38,y-ry*.78,x-rx*.38,y-ry*1.12,color,5);line(c,x-rx*.38,y-ry*1.12,x+rx*.4,y-ry*1.12,color,5);return;}
 ellipse(c,x,y,rx,ry,color);if(scene==='bowling'){for(const [dx,dy]of[[-.2,-.22],[.13,-.3],[.06,.04]])ellipse(c,x+dx*rx,y+dy*ry,rx*.09,ry*.09,pal.white);}else if(scene==='marbles'){c.save();c.beginPath();c.ellipse(x,y,rx,ry,0,0,TAU);c.clip();line(c,x-rx,y+ry*.5,x+rx,y-ry*.3,pal.white,5);ellipse(c,x-rx*.3,y-ry*.35,rx*.2,ry*.16,'#ffffff99');c.restore();}
}
function collisionScene(pal,problem,p,t,s,info,arrows){
 const {c,w,h}=pal,scene=problem.simulation.scene||'clay',b=s.bodies;if(b.length<2)return;const R=b.map(o=>num(o.radius,.1)),sumR=R[0]+R[1],compression=Math.max(0,num(s.compression)),factor=clamp(1-compression/sumR,.3,1),baseSize=clamp(Math.min(h*.067,w*.055),25,43),baseR=scene==='bowling'?[baseSize,baseSize*.55]:scene==='curling'?[baseSize*1.12,baseSize*1.12]:[baseSize,baseSize],visualR=baseR.map(r=>r*factor),physicalGap=Math.max(0,b[1].x-b[0].x-sumR),scale=(w-210)/(info.range[1]-info.range[0]),gap=physicalGap*scale;
 const separation=visualR[0]+visualR[1]+gap,totalM=b[0].mass+b[1].mass,cm=(b[0].x*b[0].mass+b[1].x*b[1].mass)/totalM,raw=100+(cm-info.range[0])*scale,minC=70+separation*b[1].mass/totalM,maxC=w-70-separation*b[0].mass/totalM,center=clamp(raw,minC,maxC),xs=[center-separation*b[1].mass/totalM,center+separation*b[0].mass/totalM],Y=h*(h<430?.52:.60);
 line(c,30,Y+38,w-30,Y+38,pal.line,3);const phase=s.collisionPhase||(s.contact?'contact':s.collided?'separated':'approach');chip(c,phase==='contact'?'CONTACT':phase==='together'?'STUCK TOGETHER':phase==='separated'?'AFTER CONTACT':scene==='bowling'?'BEFORE IMPACT':'APPROACH',w/2,28,pal,phase==='contact'?pal.orange:pal.ink);
 b.forEach((o,i)=>{const col=i?pal.orange:pal.blue,ry=baseR[i]/Math.sqrt(factor),yy=Y+37-ry;collisionObject(c,xs[i],yy,visualR[i],ry,col,scene,i,pal);const labelX=w*(i?.75:.25);line(c,xs[i],Y+42,labelX,Y+64,col,1);text(c,o.label||`Object ${i+1}`,labelX,Y+78,col,13,'center',true);text(c,`${format(o.mass)} kg`,labelX,Y+98,col,12,'center');if(arrows&&!s.contact&&Math.abs(o.v)>.001)arrow(c,xs[i],Y-65,Math.sign(o.v)*Math.min(80,40+Math.abs(o.v)*10),0,col,`${format(o.v)} m/s`,11);
  if(arrows&&s.contact){const f=s.forces.find(f=>f.body===i&&f.axis==='horizontal');if(f&&Math.abs(f.value)>.00001)arrow(c,xs[i],Math.max(122,Y-142),Math.sign(f.value)*65,0,col,`${format(Math.abs(f.value),2)} N`,12);}
 });
 if(arrows&&phase==='together'&&Math.abs(b[0].v)>.001)arrow(c,(xs[0]+xs[1])/2,Y-65,Math.sign(b[0].v)*72,0,pal.green,`both ${format(b[0].v)} m/s`,11);
 if(s.contact){const x=(xs[0]+visualR[0]+xs[1]-visualR[1])/2;line(c,x,Y+41,x,Y+50,pal.orange,2);}
 if(scene!=='bowling'){const p1=b[0].mass*b[0].v,p2=b[1].mass*b[1].v;const yy=81;text(c,`p₁ ${format(p1)}   +   p₂ ${format(p2)}   =   ${format(num(s.totalMomentum,p1+p2))} kg·m/s`,w/2,yy,pal.ink,14,'center',true,w-36);}
 caption(pal,scene==='bowling'?'Both objects belong to the system; the stationary pin has zero momentum.':'Close-up; object sizes enlarged. Contact forces act on different objects.');
}
function motionScene(pal,problem,p,t,s,info,arrows){
 const {c,w,h}=pal,[min,max]=info.range,X=z=>58+(z-min)/(max-min)*(w-116),Y=h-93,k=problem.simulation.kind,scene=problem.simulation.scene;
 horizontalAxis(pal,Y,min,max);
 if(k==='route'){const start=num(p.start),turn=problem.id==='P02'?num(p.end):num(p.turn),end=num(p.end);for(const [value,label]of[[start,'START'],...(turn===end?[]:[[turn,'TURN']]),[end,'FINISH']]){line(c,X(value),Y-80,X(value),Y+3,pal.line,1,[4,5]);text(c,label,X(value),Y-95,pal.muted,10,'center',true);}arrow(c,X(start),Y-130,X(turn)-X(start),0,pal.blue);if(turn!==end)arrow(c,X(turn),Y-110,X(end)-X(turn),0,pal.orange);}
 const multi=s.bodies.length>1;
 if(multi){const lanes=[h*.40,h*.70];s.bodies.forEach((b,i)=>{const yy=lanes[i],col=i?pal.orange:pal.blue;line(c,58,yy,w-58,yy,pal.line,1,[4,6]);object(c,X(b.x),yy,col,problem,t,b.v);text(c,b.label||`Object ${i+1}`,22,yy-82,col,12,'left',true);if(p.compareMass!==undefined)text(c,`${format(b.mass)} kg`,22,yy-61,col,12);if(arrows&&Math.abs(b.v)>.001)arrow(c,X(b.x),yy-92,Math.sign(b.v)*53,0,col,`${format(b.v)} m/s`,11);const f=s.forces.find(f=>f.body===i&&f.axis==='horizontal');if(arrows&&f&&Math.abs(f.value)>.001)arrow(c,X(b.x),yy-118,Math.sign(f.value)*55,0,pal.green,`${format(Math.abs(f.value))} N net`,11);});}
 else{const xx=X(s.x);object(c,xx,Y,pal.blue,problem,t,s.v);if(arrows&&s.forces.length){const force=s.forces.filter(f=>f.axis==='horizontal'),fm=Math.max(1,...force.map(f=>Math.abs(f.value)));force.forEach((f,i)=>{if(Math.abs(f.value)>.00001)arrow(c,xx,Y-77-i*38,Math.sign(f.value)*Math.abs(f.value)/fm*80,0,i?pal.orange:pal.green,`${f.label} ${format(Math.abs(f.value))} N`,11);});if(scene==='airplane'){const vert=s.forces.filter(f=>f.axis==='vertical'),vm=Math.max(1,...vert.map(f=>Math.abs(f.value)));vert.forEach(f=>arrow(c,xx+(f.value>0?-78:78),Y-30,0,-Math.sign(f.value)*Math.abs(f.value)/vm*68,f.value>0?pal.green:pal.orange,`${f.label} ${format(Math.abs(f.value))} N`,11));}}
  else if(arrows&&k!=='route'){if(Math.abs(s.v)>.001)arrow(c,xx,Y-100,Math.sign(s.v)*70,0,pal.blue,`${format(s.v)} m/s`,12);if(Math.abs(s.a)>.001)arrow(c,xx,Y-137,Math.sign(s.a)*55,0,pal.orange,`${format(s.a)} m/s²`,12);}}
 let note='Right / east is positive. Arrows show direction.';if(k==='route')note='Position marks the object’s center; route arrows show each part of the trip.';if(k==='piecewise')note=Math.abs(s.v)<.001?'Stopped: time passes, but distance does not increase.':'The route is straight; the graph records movement and stops.';if(s.stuck)note='Static friction matches the applied force. The crate stays at rest.';if(p.steady)note='Equal opposing forces: the box keeps moving at constant velocity.';if(scene==='airplane')note='Lift balances weight; thrust balances drag. Constant velocity, zero net force.';if(scene==='modelplanes')note='Parallel flight paths · same forward net force · smaller mass, greater acceleration.';caption(pal,note);
}
export function drawScene(canvas,problem,p,t,{arrows=true,hideAnswers=false,theme='light'}={}){
 const pal=setup(canvas,theme),s=evaluate(problem,p,t),info=modelInfo(problem,p),k=problem.simulation.kind,scene=problem.simulation.scene;
 if(scene==='train'||p.referenceSpeed!==undefined)trainScene(pal,problem,p,t,s,arrows);
 else if(k==='gravity')scaleScene(pal,problem,p,s,arrows);
 else if(k==='circular')orbitScene(pal,problem,p,s,arrows);
 else if(k==='momentum'||k==='thirdlaw')collisionScene(pal,problem,p,t,s,info,arrows);
 else if(s.axis==='vertical')verticalScene(pal,problem,p,t,s,info,arrows);
 else motionScene(pal,problem,p,t,s,info,arrows);
 const timeUnit=info.timeUnit==='days'?'days':'s',timeValue=t/(num(info.timeScale,1));text(pal.c,`elapsed ${format(timeValue)} ${timeUnit}`,pal.w-18,20,pal.muted,11,'right');
 canvas.setAttribute('aria-label',`${problem.title}. ${s.readouts.map(r=>`${r.label}: ${format(r.value)} ${r.unit}`).join('. ')}. ${s.contact?`Objects are touching. Force on object 1: ${format(num(s.force1))} N; force on object 2: ${format(num(s.force2))} N.`:''}`);
}
function forceBars(pal,problem,p,s,quantity){
 const {c,w,h}=pal,gravity=problem.simulation.kind==='gravity',items=gravity?(p.compareG!==undefined?[{label:'Earth',value:num(s.compareWeight,num(p.mass)*num(p.compareG)),color:pal.blue},{label:Math.abs(num(p.g)-3.7)<.01?'Mars':'Other planet',value:num(s.weight,num(p.mass)*num(p.g)),color:pal.orange}]:[{label:'Weight',value:num(s.weight,num(p.mass)*num(p.g)),color:pal.blue}]):s.forces.map((f,i)=>({label:f.label,value:f.value,color:i?pal.orange:pal.blue}));
 const L=45,R=w-15,T=46,B=h-34,lo=gravity?0:Math.min(0,...items.map(x=>x.value)),hi=Math.max(1,...items.map(x=>x.value)),span=hi-lo,Y=v=>B-(v-lo)/span*(B-T);for(let i=0;i<=3;i++){const val=lo+span*i/3;line(c,L,Y(val),R,Y(val),pal.line);text(c,format(val,1),L-7,Y(val),pal.muted,10,'right');}line(c,L,Y(0),R,Y(0),pal.muted);items.forEach((item,i)=>{const xx=L+(R-L)*(i+.5)/items.length,bw=Math.min(60,(R-L)/items.length*.5),yy=Y(item.value),zero=Y(0);round(c,xx-bw/2,Math.min(yy,zero),bw,Math.max(2,Math.abs(zero-yy)),3,item.color);text(c,`${format(item.value)} N`,xx,yy+(item.value<0?15:-12),item.color,12,'center',true);text(c,item.label,xx,B+19,pal.muted,11,'center',false,(R-L)/items.length-8);});text(c,gravity?'Scale reading (N)':'Signed force (N)',L,13,pal.muted,11);
}
export function drawGraph(canvas,problem,p,t,{quantity='x',hideAnswers=false,theme='light'}={}){
 const pal=setup(canvas,theme),{c,w,h}=pal,info=modelInfo(problem,p),now=evaluate(problem,p,t),k=problem.simulation.kind;
 if((k==='gravity'&&['weight','force','forces'].includes(quantity))||quantity==='forces'){forceBars(pal,problem,p,now,quantity);canvas.setAttribute('aria-label',k==='gravity'?'Weight comparison in newtons; bar heights use the same scale.':'Signed forces acting on the object.');return;}
 const orbital=!!p.orbital,timeScale=num(info.timeScale,1),duration=info.duration,convert=orbital?(['x','distance'].includes(quantity)?1e9:['v','speed'].includes(quantity)?1e3:1):1;
 const unitNames={x:'m',v:'m/s',speed:'m/s',distance:'m',a:'m/s²',totalMomentum:'kg·m/s',momentum1:'kg·m/s',momentum2:'kg·m/s',momentum:'kg·m/s',netForce:'N',force:'N',force1:'N',force2:'N',weight:'N'};
 const names={x:k==='circular'?'Horizontal position':'Position',v:k==='circular'?'Horizontal velocity':'Velocity',a:k==='circular'?'Horizontal acceleration':'Acceleration',speed:'Speed',distance:'Total distance',totalMomentum:'Momentum',momentum:'Momentum',momentum1:'Individual momenta',momentum2:'Object 2 momentum',netForce:'Net force',force:'Contact force',force1:'Force on 1',force2:'Force on 2',weight:'Weight'};
 const unit=convert===1e9?'million km':convert===1e3?'km/s':unitNames[quantity]||'',title=names[quantity]||quantity;
 const field=(state,key,bodyIndex)=>{const b=bodyIndex===undefined?null:state.bodies[bodyIndex];if(b){if(key==='speed')return Math.abs(b.v);if(['momentum','totalMomentum','momentum1','momentum2'].includes(key))return b.mass*b.v;if(key==='distance')return b.distance;return b[key];}if(key==='momentum1')return state.bodies[0].mass*state.bodies[0].v;if(key==='momentum2')return state.bodies[1]?state.bodies[1].mass*state.bodies[1].v:0;if(key==='momentum')return state.totalMomentum;if(key==='netForce')return state.netForce??state.forces.filter(f=>f.body===0).reduce((a,f)=>a+f.value,0);if(['force','force1','force2'].includes(key))return state.forces.filter(f=>f.body===(key==='force2'?1:0)).reduce((a,f)=>a+f.value,0);return state[key];};
 let times=Array.from({length:161},(_,i)=>duration*i/160);if(now.collisionTime!==undefined){const tc=now.collisionTime,ct=num(now.contactDuration,.1);times.push(tc,Math.min(duration,tc+ct));for(let i=0;i<=40;i++)times.push(tc+ct*i/40);times=times.filter(x=>x>=0&&x<=duration).sort((a,b)=>a-b);}
 const states=times.map(tt=>evaluate(problem,p,tt));const traces=[{color:quantity==='totalMomentum'?pal.green:pal.blue,dash:[],label:quantity==='totalMomentum'?'system':'object 1',values:states.map(s=>field(s,quantity)/convert)}];
 if(quantity==='totalMomentum'){traces.push({color:pal.blue,dash:[6,4],label:'object 1',values:states.map(s=>field(s,quantity,0)/convert)},{color:pal.orange,dash:[2,4],label:'object 2',values:states.map(s=>field(s,quantity,1)/convert)});}
 else if(now.bodies.length>1&&quantity==='momentum1')traces.push({color:pal.orange,dash:[6,4],label:'object 2',values:states.map(s=>field(s,'momentum2')/convert)});
 else if(now.bodies.length>1&&quantity==='force')traces.push({color:pal.orange,dash:[6,4],label:'object 2',values:states.map(s=>field(s,'force2')/convert)});
 else if(now.bodies.length>1&&['x','v','a','speed','distance'].includes(quantity))traces.push({color:pal.orange,dash:[6,4],label:'object 2',values:states.map(s=>field(s,quantity,1)/convert)});
 const all=traces.flatMap(x=>x.values).filter(Number.isFinite);let lo=Math.min(0,...all),hi=Math.max(0,...all);if(Math.abs(hi-lo)<1e-9){lo-=.5;hi+=.5;}const pad=(hi-lo)*.14;lo-=pad;hi+=pad;
 const L=w<290?43:50,R=w-14,T=traces.length>1?51:30,B=h-39,X=tt=>L+(R-L)*tt/duration,Y=value=>B-(value-lo)/(hi-lo)*(B-T);
 for(let i=0;i<4;i++){const val=lo+(hi-lo)*i/3,y=Y(val);line(c,L,y,R,y,pal.line);text(c,format(val,Math.abs(hi-lo)<.1?4:1),L-7,y,pal.muted,10,'right');}
 for(let i=0;i<=4;i++){const tt=duration*i/4,x=X(tt);line(c,x,T,x,B,pal.line,.8);text(c,format(tt/timeScale,1),x,B+14,pal.muted,10,'center');}line(c,L,B,R,B,pal.muted);line(c,L,T,L,B,pal.muted);if(lo<0&&hi>0)line(c,L,Y(0),R,Y(0),pal.muted,.8);
 text(c,`${title} (${unit})`,L,14,pal.muted,11,'left',false,w-L-10);text(c,`${info.timeUnit==='days'?'time (days)':'elapsed time (s)'}`,R,h-8,pal.muted,10,'right');
 traces.forEach((trace,j)=>{c.strokeStyle=trace.color;c.lineWidth=j?2:2.6;c.setLineDash(trace.dash);c.beginPath();let started=false;trace.values.forEach((val,i)=>{if(!Number.isFinite(val)){started=false;return;}if(!started){c.moveTo(X(times[i]),Y(val));started=true;}else c.lineTo(X(times[i]),Y(val));});c.stroke();c.setLineDash([]);if(traces.length>1){const xx=L+j*(R-L)/traces.length;line(c,xx,34,xx+14,34,trace.color,2,trace.dash);text(c,trace.label,xx+19,34,pal.muted,9);}});
 const cursor=clamp(t,0,duration),current=field(now,quantity)/convert;line(c,X(cursor),T,X(cursor),B,pal.orange,1.5,[3,4]);if(Number.isFinite(current))ellipse(c,X(cursor),Y(current),4,4,pal.orange);
 canvas.setAttribute('aria-label',`${title} against time. Current value ${format(current)} ${unit}. ${quantity==='totalMomentum'?'The system total is the sum of the two individual momenta.':''}`);
}
