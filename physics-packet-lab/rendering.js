import {evaluate as rawEvaluate,modelInfo as rawModelInfo,format as baseFormat} from './physics.js?v=20261025-2';
const format=(value,digits)=>baseFormat(value,digits??(Math.abs(value)>0&&Math.abs(value)<.1?Math.min(7,Math.ceil(-Math.log10(Math.abs(value)))+2):2));


// Bounded caches retain only the current base graph and current comparison.
// Parameter signatures catch in-place input changes; a new trial releases its old samples.
const renderingStats={evaluations:0,modelInfoBuilds:0,baseGraphBuilds:0,comparisonBuilds:0,comparisonGraphBuilds:0};
let infoCache=[],baseGraphCache=null,comparisonCache=null,baseTickCache=null;
function evaluate(problem,params,time){renderingStats.evaluations++;return rawEvaluate(problem,params,time);}
function modelInfo(problem,params){const signature=JSON.stringify(params);let entry=infoCache.find(x=>x.problem===problem&&x.signature===signature);if(!entry){renderingStats.modelInfoBuilds++;entry={problem,signature,info:rawModelInfo(problem,params)};infoCache.push(entry);if(infoCache.length>4)infoCache.shift();}return entry.info;}
function tickState(problem,params,time){const signature=JSON.stringify(params);if(!baseTickCache||baseTickCache.problem!==problem||baseTickCache.signature!==signature||baseTickCache.time!==time)baseTickCache={problem,signature,time,state:evaluate(problem,params,time)};return baseTickCache.state;}
export function invalidateRenderingCache(){infoCache=[];baseGraphCache=null;comparisonCache=null;baseTickCache=null;}
export function getRenderingDiagnostics(reset=false){const result={...renderingStats,infoEntries:infoCache.length,baseGraphEntries:baseGraphCache?1:0,comparisonEntries:comparisonCache?1:0,comparisonGraphEntries:comparisonCache?.graph?1:0,cachedSampleCount:(baseGraphCache?.times.length||0)+(comparisonCache?.samples?.times.length||0)*2};if(reset)for(const key of Object.keys(renderingStats))renderingStats[key]=0;return result;}

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
function gravityName(g){const value=num(g);return Math.abs(value-1.6)<.01?'Moon':Math.abs(value-3.7)<.01?'Mars':Math.abs(value-8.9)<.01?'Venus':Math.abs(value-9.8)<.01||Math.abs(value-10)<.01?'Earth':'Custom gravity';}
function scaleScene(pal,problem,p,s,arrows){
 const {c,w,h}=pal,compare=p.compareG!==undefined,mass=num(p.mass,1),gs=compare?[num(p.compareG),num(p.g)]:[num(p.g)],planetLabel=gravityName(p.g),labels=compare?[gravityName(p.compareG),planetLabel]:[planetLabel];
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
 if(orbital){ellipse(c,cx,cy,25,25,pal.orange);text(c,'Sun',cx,cy+42,pal.muted,12,'center');ellipse(c,xx,yy,15,15,pal.blue);ellipse(c,xx-3,yy-3,7,5,pal.green);ellipse(c,xx+4,yy+5,4,7,pal.green);text(c,Math.abs(num(p.orbitAU,1)-1)<1e-6?'Earth':'Model planet',xx,yy+28,pal.blue,12,'center',true);}
 else if(problem.id==='P28'){topBike(c,xx,yy,pal.blue,Math.atan2(-Math.cos(theta),-Math.sin(theta)));ellipse(c,cx,cy,3,3,pal.muted);}
 else{person(c,xx,yy+25,pal.blue,s.t*5,-Math.sin(theta)>=0?1:-1);ellipse(c,cx+r,cy,4,4,pal.orange);text(c,'start / finish',cx+r+12,cy+39,pal.muted,11,'center');}
 if(problem.id==='P03'){c.strokeStyle=pal.blue;c.lineWidth=4;c.beginPath();c.arc(cx,cy,r,0,-Math.min(TAU,theta),true);c.stroke();if(Math.abs(num(s.displacement))>.001)arrow(c,cx+r,cy,xx-(cx+r),yy-cy,pal.orange);text(c,'blue arc: distance · orange arrow: displacement',w/2,25,pal.muted,12,'center');}
 if(arrows&&problem.id!=='P03'){arrow(c,xx,yy,-Math.sin(theta)*65,-Math.cos(theta)*65,pal.blue);arrow(c,xx,yy,-Math.cos(theta)*54,Math.sin(theta)*54,pal.orange);}
 line(c,cx,cy,cx+r*.75,cy,pal.line,1,[4,4]);const radius=orbital?`${format(num(s.radius)/1e9,1)} million km`:`radius ${format(num(s.radius))} m`;text(c,radius,cx+r*.42,cy+(orbital?67:17),pal.muted,11,'center');
 text(c,orbital?`Speed ${format(num(s.speed)/1000,2)} km/s`:`Speed ${format(num(s.speed))} m/s`,20,problem.id==='P03'?51:24,pal.ink,13,'left',true);
 if(arrows&&problem.id!=='P03'){line(c,22,54,46,54,pal.blue,3);text(c,'velocity: tangent',55,54,pal.blue,12);line(c,22,79,46,79,pal.orange,3);text(c,orbital?'gravity: inward':problem.id==='P28'?'net force: inward':'acceleration: inward',55,79,pal.orange,12);}
 caption(pal,orbital?'Simplified circular orbit · sizes enlarged · gravity changes the direction of velocity.':problem.id==='P03'?'Distance follows the whole path; displacement connects the start and current position.':'View from above · tire–road friction supplies the inward net force.');
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
function planeRun(pal,problem,params,state,info,{arrows=true,color=pal.blue,comparison=false}={}){
 const{c,w,h}=pal,[min,max]=info.range,yr=info.rangeY||[num(params.height)-10,num(params.height)+10],ymin=yr[0],ymax=yr[1],L=comparison?44:68,R=w-(comparison?34:54),T=comparison?115:110,B=h-(comparison?92:85),X=x=>L+(x-min)/(max-min)*(R-L),Y=y=>B-(y-ymin)/(ymax-ymin)*(B-T),many=state.bodies.length>1,scale=comparison?.57:.9,forceScale=info.forceScale??Math.max(1,...state.forces.map(f=>Math.abs(f.value)));
 text(c,'↑ lift   ↓ weight   → thrust   ← drag',w/2,comparison?48:23,pal.muted,11,'center');
 state.bodies.forEach((body,i)=>{const col=many?(i?pal.orange:pal.blue):color,forceRow=`${many?(i?'Orange: ':'Blue: '):''}↑${format(body.lift)}  ↓${format(body.weight)}  →${format(body.thrust)}  ←${format(body.drag)} N`;text(c,forceRow,w/2,(comparison?69:48)+i*20,col,comparison?11:13,'center',true,w-24);});
 for(let i=0;i<=3;i++){const value=ymin+(ymax-ymin)*i/3,yy=Y(value);line(c,L,yy,R,yy,pal.line,.8,[4,5]);text(c,format(value,1),L-7,yy,pal.muted,10,'right');}text(c,'altitude (m)',L,comparison?102:90,pal.muted,10);
 state.bodies.forEach((body,i)=>{const col=many?(i?pal.orange:pal.blue):color,x=X(body.x),y=Y(body.y);airplane(c,x,y+8,col,scale,Math.sign(body.v)||1);
  if(arrows){for(const force of state.forces.filter(f=>f.body===i)){if(Math.abs(force.value)<1e-9)continue;const sign=Math.sign(force.value);if(force.axis==='horizontal'){const len=Math.abs(force.value)/forceScale*30;arrow(c,x+sign*15,y,sign*len,0,force.label==='Thrust'?pal.green:pal.muted);}else{const len=Math.abs(force.value)/forceScale*30;arrow(c,x+(sign>0?-34:34),y,0,-sign*len,sign>0?pal.green:pal.orange);}}}
  text(c,`${format(body.y)} m`,clamp(x,50,w-50),y+26,col,10,'center',true);
 });
 const axisY=h-(comparison?80:72);line(c,L,axisY,R,axisY,pal.line,1);for(let i=0;i<=3;i++){const xx=L+(R-L)*i/3;text(c,format(min+(max-min)*i/3,1),xx,axisY+12,pal.muted,10,'center');}text(c,'horizontal position (m)',w/2,h-(comparison?53:42),pal.muted,10,'center');
 if(!comparison)caption(pal,'Forces act along the fixed world axes. Changing lift can produce a climb or descent.');
}
function experimentPlanes(pal,e,arrows){
 const info={range:e.range,rangeY:e.rangeY,forceScale:Math.max(1,...e.reference.forces.concat(e.proposal.forces).map(f=>Math.abs(f.value)))};[[e.reference,e.referenceProblem,e.referenceParams],[e.proposal,e.proposalProblem,e.proposalParams]].forEach(([state,problem,p],index)=>comparisonPanel(pal,index,panel=>planeRun(panel,problem,p,state,info,{arrows,color:index?pal.orange:pal.blue,comparison:true})));
}
export function drawScene(canvas,problem,p,t,{arrows=true,hideAnswers=false,theme='light'}={}){
 const pal=setup(canvas,theme),s=tickState(problem,p,t),info=modelInfo(problem,p),k=problem.simulation.kind,scene=problem.simulation.scene;
 if(s.axis==='2d')planeRun(pal,problem,p,s,info,{arrows});
 else if(scene==='train'||p.referenceSpeed!==undefined)trainScene(pal,problem,p,t,s,arrows);
 else if(k==='gravity')scaleScene(pal,problem,p,s,arrows);
 else if(k==='circular')orbitScene(pal,problem,p,s,arrows);
 else if(k==='momentum'||k==='thirdlaw')collisionScene(pal,problem,p,t,s,info,arrows);
 else if(s.axis==='vertical')verticalScene(pal,problem,p,t,s,info,arrows);
 else motionScene(pal,problem,p,t,s,info,arrows);
 const timeUnit=info.timeUnit==='days'?'days':'s',timeValue=t/(num(info.timeScale,1));text(pal.c,`elapsed ${format(timeValue)} ${timeUnit}`,pal.w-18,20,pal.muted,11,'right');
 canvas.setAttribute('aria-label',`${problem.title}. ${s.readouts.map(r=>`${r.label}: ${format(r.value)} ${r.unit}`).join('. ')}. ${s.contact?`Objects are touching. Force on object 1: ${format(num(s.force1))} N; force on object 2: ${format(num(s.force2))} N.`:''}`);
}
function forceBars(pal,problem,p,s,quantity){
 const {c,w,h}=pal,gravity=problem.simulation.kind==='gravity',items=gravity?(p.compareG!==undefined?[{label:gravityName(p.compareG),value:num(s.compareWeight,num(p.mass)*num(p.compareG)),color:pal.blue},{label:gravityName(p.g),value:num(s.weight,num(p.mass)*num(p.g)),color:pal.orange}]:[{label:'Weight',value:num(s.weight,num(p.mass)*num(p.g)),color:pal.blue}]):s.forces.map((f,i)=>({label:f.label,value:f.value,color:i?pal.orange:pal.blue}));
 const L=45,R=w-15,T=46,B=h-34,lo=gravity?0:Math.min(0,...items.map(x=>x.value)),hi=Math.max(1,...items.map(x=>x.value)),span=hi-lo,Y=v=>B-(v-lo)/span*(B-T);for(let i=0;i<=3;i++){const val=lo+span*i/3;line(c,L,Y(val),R,Y(val),pal.line);text(c,format(val,1),L-7,Y(val),pal.muted,10,'right');}line(c,L,Y(0),R,Y(0),pal.muted);items.forEach((item,i)=>{const xx=L+(R-L)*(i+.5)/items.length,bw=Math.min(60,(R-L)/items.length*.5),yy=Y(item.value),zero=Y(0);round(c,xx-bw/2,Math.min(yy,zero),bw,Math.max(2,Math.abs(zero-yy)),3,item.color);text(c,`${format(item.value)} N`,xx,yy+(item.value<0?15:-12),item.color,12,'center',true);text(c,item.label,xx,B+19,pal.muted,11,'center',false,(R-L)/items.length-8);});text(c,gravity?'Scale reading (N)':'Signed force (N)',L,13,pal.muted,11);
}
const graphUnits={x:'m',y:'m',distance:'m',v:'m/s',vy:'m/s',speed:'m/s',a:'m/s²',ay:'m/s²',netForce:'N',netForceX:'N',netForceY:'N',force:'N',force1:'N',force2:'N',weight:'N',totalMomentum:'kg·m/s',momentum1:'kg·m/s',momentum2:'kg·m/s'};
const graphNames={x:'Horizontal position',y:'Altitude',distance:'Distance',v:'Horizontal velocity',vy:'Vertical velocity',speed:'Speed',a:'Horizontal acceleration',ay:'Vertical acceleration',netForce:'Net force',netForceX:'Horizontal net force',netForceY:'Vertical net force',force:'Contact force',force1:'Force on 1',force2:'Force on 2',weight:'Spring reading',totalMomentum:'System momentum',momentum1:'Individual momenta',momentum2:'Object 2 momentum'};
function graphTitle(quantity,state){return (state?.axis==='vertical'?{x:'Height',v:'Vertical velocity',a:'Vertical acceleration'}[quantity]:null)||graphNames[quantity]||quantity;}
function graphField(state,key,bodyIndex){
 if(bodyIndex!==undefined){const b=state.bodies[bodyIndex];if(!b)return NaN;if(key==='speed')return b.speed??Math.hypot(b.v,num(b.vy));if(['totalMomentum','momentum1','momentum2'].includes(key))return b.mass*b.v;if(key==='force')return state.forces.find(f=>f.body===bodyIndex)?.value??0;return b[key];}
 if(key==='momentum1')return state.bodies[0].mass*state.bodies[0].v;if(key==='momentum2')return state.bodies[1]?state.bodies[1].mass*state.bodies[1].v:0;if(key==='force')return state.force1??0;
 return state[key];
}
function sampleTimes(duration,states){let times=Array.from({length:151},(_,i)=>duration*i/150);for(const state of states)if(state?.collisionTime!==undefined)for(let i=0;i<=24;i++)times.push(state.collisionTime+num(state.contactDuration,.01)*i/24);return Float64Array.from(times.filter(x=>x>=0&&x<=duration).sort((a,b)=>a-b));}
function boundsFor(traces,guide=[]){let lo=0,hi=0;for(const values of traces.map(t=>t.values).concat(guide.length?[guide]:[]))for(const value of values)if(Number.isFinite(value)){lo=Math.min(lo,value);hi=Math.max(hi,value);}if(hi-lo<1e-9){hi+=.5;lo-=.5;}const pad=(hi-lo)*.12;return[lo-pad,hi+pad];}
function baseGraphData(problem,params,quantity){
 const signature=JSON.stringify(params);let entry=baseGraphCache;
 if(!entry||entry.problem!==problem||entry.signature!==signature){const info=modelInfo(problem,params),initial=tickState(problem,params,0),times=sampleTimes(info.duration,[initial]);entry=baseGraphCache={problem,signature,info,times,states:Array.from(times,t=>evaluate(problem,params,t)),quantity:null};renderingStats.baseGraphBuilds++;}
 if(entry.quantity!==quantity){const convert=params.orbital?(['x','y','distance'].includes(quantity)?1e9:['v','vy','speed'].includes(quantity)?1e3:1):1,make=(body,color,dash,label)=>({color,dash,label,values:Float64Array.from(entry.states,s=>graphField(s,quantity,body)/convert)}),traces=[make(undefined,quantity==='totalMomentum'?'green':'blue',[],quantity==='totalMomentum'?'system':'object 1')];
  if(quantity==='totalMomentum'){traces.push(make(0,'blue',[6,4],'object 1'),make(1,'orange',[2,4],'object 2'));}else if(entry.states[0].bodies.length>1&&['x','y','v','vy','a','ay','speed','distance','momentum1','force'].includes(quantity))traces.push(make(1,'orange',[6,4],'object 2'));
  const[lo,hi]=boundsFor(traces);Object.assign(entry,{quantity,convert,traces,lo,hi,unit:convert===1e9?'million km':convert===1e3?'km/s':graphUnits[quantity]||''});}
 return entry;
}
function paintGraph(pal,data,clock,{reveal=false,interval=null,guide=[],title,unit,timeScale=1,timeUnit='s'}={}){
 const {c,w,h}=pal,{times,traces,lo,hi,duration}=data,L=w<290?43:50,R=w-13,T=traces.length>1?(h<180?45:52):30,B=h-34,X=t=>L+(R-L)*t/duration,Y=value=>B-(value-lo)/(hi-lo)*(B-T);
 if(interval){c.globalAlpha=.12;c.fillStyle=pal.blue;c.fillRect(X(interval.expectedStart),T,X(interval.expectedEnd)-X(interval.expectedStart),B-T);c.fillStyle=pal.orange;c.fillRect(X(interval.start),T,X(interval.end)-X(interval.start),B-T);c.globalAlpha=1;}
 for(let i=0;i<=3;i++){const value=lo+(hi-lo)*i/3;line(c,L,Y(value),R,Y(value),pal.line);text(c,format(value,hi-lo<.1?4:1),L-6,Y(value),pal.muted,10,'right');}for(let i=0;i<=4;i++){const t=duration*i/4;line(c,X(t),T,X(t),B,pal.line,.7);text(c,format(t/timeScale,1),X(t),B+14,pal.muted,10,'center');}line(c,L,B,R,B,pal.muted);if(lo<0&&hi>0)line(c,L,Y(0),R,Y(0),pal.muted,.7);
 text(c,`${title} (${unit})`,L,13,pal.muted,11,'left',false,w-L-10);text(c,`elapsed ${timeUnit==='days'?'days':'seconds'}`,R,h-7,pal.muted,9,'right');
 if(guide.length){c.strokeStyle=pal.muted;c.globalAlpha=.35;c.lineWidth=2;c.beginPath();for(let i=0;i<guide.length;i++){if(i===0)c.moveTo(X(times[i]),Y(guide[i]));else c.lineTo(X(times[i]),Y(guide[i]));}c.stroke();c.globalAlpha=1;}
 traces.forEach((trace,index)=>{const color=pal[trace.color]||trace.color;if(traces.length>1){const lx=L+(trace.legendIndex??index)*(R-L)/traces.length;line(c,lx,32,lx+16,32,color,2.5,trace.dash);text(c,trace.label,lx+21,32,color,9);}
  c.strokeStyle=color;c.lineWidth=index?2.4:3.2;c.setLineDash(trace.dash);c.beginPath();let started=false;for(let i=0;i<times.length;i++){if(reveal&&times[i]>clock+.00001)break;const value=trace.values[i];if(!Number.isFinite(value)){started=false;continue;}if(!started){c.moveTo(X(times[i]),Y(value));started=true;}else c.lineTo(X(times[i]),Y(value));}c.stroke();c.setLineDash([]);
  if(Number.isFinite(trace.current))ellipse(c,X(trace.currentTime??clock),Y(trace.current),4,4,color);
 });line(c,X(clock),T,X(clock),B,pal.muted,1,[3,4]);
}
export function drawGraph(canvas,problem,params,time,{quantity='x',theme='light'}={}){
 const pal=setup(canvas,theme),state=tickState(problem,params,time);if(problem.simulation.kind==='gravity'&&['weight','force','forces'].includes(quantity)||quantity==='forces'){forceBars(pal,problem,params,state,quantity);return;}
 const data=baseGraphData(problem,params,quantity);data.duration=data.info.duration;data.traces.forEach((trace,i)=>{const body=quantity==='totalMomentum'?(i?i-1:undefined):(i?1:undefined);trace.current=graphField(state,quantity,body)/data.convert;});
 paintGraph(pal,data,Math.min(time,data.duration),{title:graphTitle(quantity,state),unit:data.unit,timeScale:data.info.timeScale||1,timeUnit:data.info.timeUnit});canvas.setAttribute('aria-label',`${graphTitle(quantity,state)} against time, using the physical model.`);
}

/* Physics arrays stay [reference, test]; this one mapping puts the test on the left. */
const comparisonSlot=run=>1-run;
const comparisonX=(pal,run,slots=[.25,.75])=>pal.w*slots[comparisonSlot(run)];
/* Prediction playback: both experiments use one clock and one spatial scale. */
function experimentState(problem,params,time,opts){
 const trial=opts.trial,signature=JSON.stringify([trial.params||trial.trialParams,trial.referenceParams,trial.duration,trial.sampleTime,trial.referenceSampleTime,trial.overlay,trial.value,trial.expected,trial.referenceProblem?.simulation.kind,trial.problem?.simulation.kind]);
 if(!comparisonCache||comparisonCache.trial!==trial||comparisonCache.signature!==signature){
  const referenceProblem=trial.referenceProblem||problem,referenceParams=trial.referenceParams||params,proposalProblem=trial.problem||trial.trialProblem||problem,proposalParams=trial.params||trial.trialParams||params,ri=modelInfo(referenceProblem,referenceParams),pi=modelInfo(proposalProblem,proposalParams),duration=Math.max(.01,num(trial.duration,Math.max(ri.duration,pi.duration))),refEnd=Math.min(ri.duration,num(trial.referenceSampleTime,ri.duration)),proposalEnd=Math.min(pi.duration,num(trial.sampleTime,pi.duration));
  comparisonCache={trial,signature,referenceProblem,referenceParams,proposalProblem,proposalParams,ri,pi,duration,refEnd,proposalEnd,range:[Math.min(ri.range[0],pi.range[0]),Math.max(ri.range[1],pi.range[1])],rangeY:[Math.min(ri.rangeY?.[0]??0,pi.rangeY?.[0]??0),Math.max(ri.rangeY?.[1]??1,pi.rangeY?.[1]??1)],lastClock:NaN,samples:null,graph:null};renderingStats.comparisonBuilds++;
 }
 const e=comparisonCache,clock=Number.isFinite(opts.progress)?clamp(opts.progress,0,1)*e.duration:clamp(time,0,e.duration);
 if(clock!==e.lastClock){e.clock=clock;e.progress=clock/e.duration;e.rt=Math.min(clock,e.refEnd);e.pt=Math.min(clock,e.proposalEnd);e.reference=evaluate(e.referenceProblem,e.referenceParams,e.rt);e.proposal=evaluate(e.proposalProblem,e.proposalParams,e.pt);e.lastClock=clock;}
 return e;
}
function experimentLegend(pal,e){
 const {c,w}=pal,labels=[e.trial.referenceLabel||'Reference',e.trial.proposalLabel||(e.trial.overlay?.type==='vector'?'Your prediction':'Your test')];
 labels.forEach((label,run)=>{const x=comparisonSlot(run)*w*.5+20,color=run?pal.orange:pal.blue;line(c,x,23,x+22,23,color,4,run?[]:[5,4]);text(c,label,x+31,23,color,15,'left',true,w*.5-64);});
}
function experimentResult(pal,e){
 const {c,w,h}=pal,t=e.trial,hasNumbers=Number.isFinite(t.value)&&Number.isFinite(t.expected),difference=t.value-t.expected;
 const result=hasNumbers?`Your test: ${format(t.value)} ${t.unit||''}    ${e.referenceProblem.numericAnswer?'Given':'Goal'}: ${format(t.expected)} ${t.unit||''}    Difference: ${difference>0?'+':''}${format(difference)} ${t.unit||''}`:(t.comparisonLabel||'Compare the physical situation with your test.');
 if(e.progress>=.995){round(c,13,h-42,w-26,32,7,pal.fill);text(c,result,w/2,h-26,t.correct?pal.green:pal.ink,13,'center',true,w-44);}
 else text(c,`Testing both situations · elapsed ${format(e.clock/(e.ri.timeScale||1))} ${e.ri.timeUnit||'s'}`,w/2,h-22,pal.muted,12,'center');
}
function experimentValue(state,quantity,params={}){
 if(['finalVelocity','initialVelocity','velocity','vf','vi'].includes(quantity))return state.v;
 if(quantity==='acceleration')return state.a;
 if(quantity==='mass')return state.mass??state.bodies[0]?.mass??params.mass;
 if(quantity==='displacement')return state.displacement??state.x-num(params.start);
 if(quantity==='averageSpeed')return state.t>0?state.distance/state.t:0;
 if(quantity==='frictionForce')return Math.abs(state.forces.find(f=>/friction/i.test(f.label))?.value??0);
 if(quantity==='time')return state.t;
 if(quantity==='momentum1')return state.bodies[0]?.mass*state.bodies[0]?.v;
 if(quantity==='momentum2')return state.bodies[1]?.mass*state.bodies[1]?.v;
 if(quantity==='force')return state.force1??state.forces.find(f=>f.body===0)?.value??0;
 return state[quantity];
}
function experimentReadout(pal,e,state,params,x,y,color){
 const value=comparisonValue(state,e.trial.quantity,params,e.referenceProblem),label={distance:'distance',displacement:'displacement',finalVelocity:'v',velocity:'v',acceleration:'a',netForce:'net force',frictionForce:'friction now',mass:'mass',totalMomentum:'system p',speed:'speed',averageSpeed:'average speed'}[e.trial.quantity]||'';if(Number.isFinite(value))text(pal.c,`${label} ${format(value)} ${e.trial.unit||''}`,x,y,color,13,'right',true);
}
function comparisonValue(state,quantity,params,problem){
 const second=['P07','P16','P27'].includes(problem.id)?state.bodies[1]:null;
 if(second){if(['velocity','v','finalVelocity'].includes(quantity))return second.v;if(quantity==='speed')return second.speed??Math.hypot(second.v,num(second.vy));if(['acceleration','a'].includes(quantity))return second.a;if(['x','y','vy','ay','netForceX','netForceY'].includes(quantity))return second[quantity];if(quantity==='distance')return second.distance;}
 return experimentValue(state,quantity,params);
}
function comparisonRange(e){let [min,max]=e.range;if(!Number.isFinite(min)||!Number.isFinite(max)||max-min<1e-9){min=-1;max=1;}return[min,max];}
function comparisonPanel(pal,index,draw){const {c,w,h}=pal,gap=16,pw=(w-gap)/2,x=comparisonSlot(index)*(pw+gap);c.save();c.beginPath();c.rect(x+5,43,pw-10,h-90);c.clip();c.translate(x,0);draw({...pal,w:pw},x);c.restore();}
function panelAxis(pal,min,max,y,label='position (m)'){const{c,w}=pal,L=49,R=w-42;line(c,L,y,R,y,pal.line,2);for(let i=0;i<=3;i++){const xx=L+(R-L)*i/3;line(c,xx,y-3,xx,y+4,pal.muted);text(c,format(min+(max-min)*i/3,1),xx,y+17,pal.muted,10,'center');}text(c,label,w/2,y+36,pal.muted,11,'center');}
function experimentMotion(pal,e,arrows){
 const[min,max]=comparisonRange(e);
 [[e.reference,e.referenceProblem,e.referenceParams,e.rt,e.refEnd],[e.proposal,e.proposalProblem,e.proposalParams,e.pt,e.proposalEnd]].forEach(([state,problem,p,t,end],run)=>comparisonPanel(pal,run,panel=>{
  const{c,w,h}=panel,color=run?pal.orange:pal.blue,L=49,R=w-42,X=z=>L+(z-min)/(max-min)*(R-L),ground=h-94,multiple=state.bodies.length>1,scale=h<360?.68:.9;
  experimentReadout(panel,e,state,p,w-18,65,color);panelAxis(panel,min,max,ground);
  state.bodies.forEach((b,i)=>{const y=multiple?ground-i*Math.min(82,(h-140)*.45):ground,xx=X(b.x),bodyColor=multiple?(i?pal.orange:pal.blue):color;c.save();c.translate(xx,y);c.scale(scale,scale);object(c,0,0,bodyColor,problem,t,b.v);c.restore();
   if(arrows&&Math.abs(b.v)>.001)arrow(c,xx,y-67*scale,Math.sign(b.v)*34,0,bodyColor,`${format(b.v)} m/s`,10);
   if(multiple)text(c,`${b.label||`Object ${i+1}`} · ${format(b.mass)} kg`,w/2,y+13,bodyColor,10,'center',false,w-36);
  });
  if(state.forces.length&&state.bodies.length===1)text(c,`net force ${format(state.netForce??0)} N`,w/2,87,color,11,'center');
  if(e.clock>end+.001)text(c,`paused at ${format(end)} s`,w/2,h-54,color,10,'center');
 }));
}
function experimentTrain(pal,e,arrows){
 const[min,max]=comparisonRange(e);
 [[e.reference,e.referenceParams,e.rt],[e.proposal,e.proposalParams,e.pt]].forEach(([state,p,t],run)=>comparisonPanel(pal,run,panel=>{
  const{c,w,h}=panel,color=run?pal.orange:pal.blue,L=65,R=w-65,X=z=>L+(z-min)/(max-min)*(R-L),y=h*.57,cw=Math.min(122,w*.40),ch=77,passengerX=X(state.x),center=passengerX-6,observer=num(state.referenceSpeed),step=Math.max(10,Math.ceil((max-min)/80)*20);
  text(c,`observer ${format(observer)} m/s east`,w/2,65,color,12,'center',true);text(c,`passenger ${format(state.v)} m/s in this frame`,w/2,87,color,11,'center');line(c,15,y+ch/2+8,w-15,y+ch/2+8,pal.line,3);
  for(let j=-10;j<20;j++){const point=j*step,xx=X(point-observer*t);if(xx>18&&xx<w-18){line(c,xx,y+ch/2+8,xx,y+ch/2+14,pal.muted);text(c,`${format(point)} m`,xx,y+ch/2+27,pal.muted,9,'center');}}
  round(c,center-cw/2,y-ch/2,cw,ch,9,pal.fill,color);round(c,center-cw/2+6,y-ch/2+7,cw-12,ch-21,4,pal.white);for(const dx of[-cw*.3,cw*.3])ellipse(c,center+dx,y+ch/2+3,7,7,color);
  c.save();c.translate(passengerX,y+24);c.scale(.82,.82);person(c,0,0,color,0,1,true);line(c,-6,-41,-6,-17,pal.orange,4);line(c,-6,-17,24,-17,pal.orange,4);c.restore();if(arrows&&Math.abs(state.v)>.001)arrow(c,passengerX,y-ch/2-12,Math.sign(state.v)*37,0,color);
 }));
}
function experimentVertical(pal,e,arrows){
 const {c,w,h}=pal,[min,max]=comparisonRange(e),top=h<420?111:135,bottom=h-72,Y=value=>bottom-(value-min)/(max-min)*(bottom-top),xs=[w*.31,w*.73],maxForce=Math.max(1,...e.reference.forces.concat(e.proposal.forces).map(f=>Math.abs(f.value))),spriteScale=h<420?.65:.9;
 for(let i=0;i<=4;i++){const value=min+(max-min)*i/4,yy=Y(value);line(c,60,yy,w-25,yy,pal.line,.8,[4,6]);text(c,format(value,1),49,yy,pal.muted,11,'right');}text(c,'height (m) · up +',20,50,pal.muted,11);
 [[e.reference,e.referenceProblem,e.referenceParams,e.rt],[e.proposal,e.proposalProblem,e.proposalParams,e.pt]].forEach(([state,problem,p,t],run)=>{
  const color=run?pal.orange:pal.blue,x=xs[comparisonSlot(run)],y=Y(state.x);c.save();c.translate(x,y);c.scale(spriteScale,spriteScale);flightObject(c,0,0,color,problem.simulation.scene||'drone',t,pal);c.restore();
  if(arrows){state.forces.filter(f=>f.axis==='vertical').forEach(f=>{const len=Math.abs(f.value)/maxForce*(h<420?52:82),xx=x+(f.value>0?-62:62)*spriteScale;arrow(c,xx,y,0,-Math.sign(f.value)*len,f.value>0?pal.green:color);});if(Math.abs(state.v)>.001)arrow(c,x+105*spriteScale,y,0,-Math.sign(state.v)*35,color);}
  text(c,`height ${format(state.x)} m`,x,71,color,12,'center',true);text(c,`net ${format(state.netForce)} N · v ${format(state.v)} m/s`,x,92,color,11,'center');
 });
}
function experimentCircular(pal,e,arrows){
 const maxRadius=Math.max(num(e.reference.radius,1),num(e.proposal.radius,1));
 [[e.reference,e.referenceProblem,e.referenceParams,e.rt,e.refEnd],[e.proposal,e.proposalProblem,e.proposalParams,e.pt,e.proposalEnd]].forEach(([state,problem,p,t,end],run)=>comparisonPanel(pal,run,panel=>{
  const{c,w,h}=panel,color=run?pal.orange:pal.blue,cx=w*.5,cy=h*.51,r=Math.min(w*.34,(h-142)*.44)*num(state.radius)/maxRadius,theta=num(state.theta),x=cx+r*Math.cos(theta),y=cy-r*Math.sin(theta);
  c.strokeStyle=pal.line;c.lineWidth=7;c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();if(p.orbital){ellipse(c,cx,cy,15,15,pal.orange);text(c,'Sun',cx,cy+26,pal.muted,10,'center');}else ellipse(c,cx,cy,3,3,pal.muted);
  if(problem.id==='P03'){c.strokeStyle=color;c.lineWidth=4;c.beginPath();c.arc(cx,cy,r,0,-Math.min(TAU,theta),true);c.stroke();ellipse(c,cx+r,cy,5,5,null,pal.green);if(arrows&&state.displacement>.001)arrow(c,cx+r,cy,x-cx-r,y-cy,color);}
  if(problem.id==='P28')topBike(c,x,y,color,Math.atan2(-Math.cos(theta),-Math.sin(theta)));else ellipse(c,x,y,8,8,color);
  text(c,`distance ${format(state.distance)} m`,w/2,67,color,12,'center',true);if(problem.id==='P03')text(c,`displacement ${format(state.displacement)} m`,w/2,h-68,color,11,'center');if(e.clock>end+.001)text(c,'your chosen finish',w/2,h-51,color,11,'center');
 }));
}
function comparisonCollisionGeometry(pal,e,state){
 const {w}=pal,[min,max]=comparisonRange(e),b=state.bodies,R=b.map(o=>num(o.radius,.03)),compression=Math.max(0,num(state.compression)),factor=clamp(1-compression/(R[0]+R[1]),.3,1),base=pal.h<420?21:30,radii=[base*factor,base*factor],gap=Math.max(0,b[1].x-b[0].x-R[0]-R[1])*(w-210)/(max-min),sep=radii[0]+radii[1]+gap,m=b[0].mass+b[1].mass,center=(b[0].x*b[0].mass+b[1].x*b[1].mass)/m,raw=95+(center-min)*(w-190)/(max-min),mid=clamp(raw,55+sep*b[1].mass/m,w-55-sep*b[0].mass/m);
 return {xs:[mid-sep*b[1].mass/m,mid+sep*b[0].mass/m],radii,base,factor};
}
function experimentCollision(pal,e,arrows){
 [[e.reference,e.referenceProblem,e.rt],[e.proposal,e.proposalProblem,e.pt]].forEach(([state,problem,t],run)=>comparisonPanel(pal,run,panel=>{
  const{c,w,h}=panel,color=run?pal.orange:pal.blue,b=state.bodies,[min,max]=comparisonRange(e),base=clamp(w*.065,17,26),R=b.map(o=>num(o.radius,.03)),factor=clamp(1-num(state.compression)/(R[0]+R[1]),.3,1),radii=[base*factor,base*factor],ppm=(w-124)/(max-min),gap=Math.max(0,b[1].x-b[0].x-R[0]-R[1])*ppm,sep=radii[0]+radii[1]+gap,m=b[0].mass+b[1].mass,cm=(b[0].x*b[0].mass+b[1].x*b[1].mass)/m,raw=62+(cm-min)*ppm,mid=clamp(raw,32+sep*b[1].mass/m,w-32-sep*b[0].mass/m),xs=[mid-sep*b[1].mass/m,mid+sep*b[0].mass/m],y=h*.58;
  text(c,`system p ${format(state.totalMomentum)} kg·m/s`,w/2,66,color,12,'center',true);line(c,14,y+base,w-14,y+base,pal.line,2);
  b.forEach((body,i)=>{const col=i?pal.green:color;collisionObject(c,xs[i],y,radii[i],base/Math.sqrt(factor),col,problem.simulation.scene||'clay',i,pal);text(c,`${format(body.mass)} kg`,w*(i?.73:.27),y+base+24,col,11,'center');line(c,xs[i],y+base+2,w*(i?.73:.27),y+base+13,col,1);
   if(arrows&&state.contact){const force=state.forces.find(f=>f.body===i);if(force&&Math.abs(force.value)>.00001)arrow(c,xs[i],y-base-16,Math.sign(force.value)*32,0,col);}
   else if(arrows&&Math.abs(body.v)>.001)arrow(c,xs[i],y-base-16,Math.sign(body.v)*31,0,col,`${format(body.v)} m/s`,10);
  });
  text(c,state.collisionPhase==='contact'?'CONTACT':state.collisionPhase==='together'?'STUCK TOGETHER':state.collisionPhase==='separated'?'AFTER CONTACT':'BEFORE CONTACT',w/2,h-66,pal.muted,11,'center');
 }));
}
/* A damped spring scale: m x'' + c x' + k x = mg, released unstretched. */
function loadedScale(params,t){const mass=Math.max(.000001,num(params.mass,1)),g=Math.max(0,num(params.g,10)),k=Math.max(.000001,num(params.springK,500)),zeta=.45,omega=Math.sqrt(k/mass),d=Math.sqrt(1-zeta*zeta),wd=omega*d,tt=Math.max(0,t),decay=Math.exp(-zeta*omega*tt),eq=mass*g/k,x=eq*(1-decay*(Math.cos(wd*tt)+zeta/d*Math.sin(wd*tt))),v=eq*omega/d*decay*Math.sin(wd*tt);return {mass,g,k,weight:mass*g,x,v,force:k*x,equilibrium:eq};}
function experimentScale(pal,e,arrows){
 const {c,w,h}=pal,rs=loadedScale(e.referenceParams,e.clock),ps=loadedScale(e.proposalParams,e.clock),maxExtension=Math.max(.001,rs.equilibrium,ps.equilibrium)*1.24,span=Math.max(55,h-220),ppm=span/maxExtension,beam=75,rest=32,xs=[w*.28,w*.72],astronaut=e.referenceProblem.simulation.scene==='astronaut';
 [[rs,e.referenceParams],[ps,e.proposalParams]].forEach(([s,p],i)=>{const x=xs[comparisonSlot(i)],color=i?pal.orange:pal.blue;
  if(astronaut){const floor=h-82,neutral=floor-Math.max(80,h*.30),compression=s.x/maxExtension*Math.max(55,h*.17),plate=neutral+compression;round(c,x-53,floor,106,10,3,pal.line);spring(c,x,plate+5,floor,color,18);line(c,x-57,plate,x+57,plate,color,4);c.save();c.translate(x,plate);c.scale(h<420?.85:1.3,h<420?.85:1.3);person(c,0,0,color,0,1);ellipse(c,0,-53,10,10,null,color);c.restore();text(c,`${format(s.mass)} kg`,x,58,color,13,'center',true);}
  else{const end=beam+rest+s.x*ppm;line(c,x-65,beam-6,x+65,beam-6,pal.line,5);spring(c,x,beam,end,color,14);line(c,x,end,x,end+8,color,2);round(c,x-29,end+8,58,37,5,color);text(c,`${format(s.mass)} kg`,x,end+27,pal.white,12,'center',true);const eqY=beam+rest+s.equilibrium*ppm;line(c,x-72,eqY,x+72,eqY,color,1,[4,4]);}
  text(c,`spring reading ${format(s.force)} N`,x,h-63,color,13,'center',true);text(c,`weight ${format(s.weight)} N`,x,astronaut?78:49,color,12,'center');
 });
 text(c,'Damped scales: spring readings settle to the weights.',w/2,62,pal.muted,10,'center',false,w-36);
}
function originalCollisionOrigin(pal,problem,s,info,index){
 const {w,h}=pal,b=s.bodies,R=b.map(o=>num(o.radius,.1)),sumR=R[0]+R[1],factor=clamp(1-num(s.compression)/sumR,.3,1),baseSize=clamp(Math.min(h*.067,w*.055),25,43),baseR=problem.simulation.scene==='bowling'?[baseSize,baseSize*.55]:problem.simulation.scene==='curling'?[baseSize*1.12,baseSize*1.12]:[baseSize,baseSize],radii=baseR.map(r=>r*factor),gap=Math.max(0,b[1].x-b[0].x-sumR)*(w-210)/(info.range[1]-info.range[0]),sep=radii[0]+radii[1]+gap,m=b[0].mass+b[1].mass,cm=(b[0].x*b[0].mass+b[1].x*b[1].mass)/m,raw=100+(cm-info.range[0])*(w-210)/(info.range[1]-info.range[0]),mid=clamp(raw,70+sep*b[1].mass/m,w-70-sep*b[0].mass/m),xs=[mid-sep*b[1].mass/m,mid+sep*b[0].mass/m],Y=h*(h<430?.52:.60);
 return{x:xs[index],y:Y+37-baseR[index]/Math.sqrt(factor),radius:baseR[index]/Math.sqrt(factor)};
}
function vectorReveal(e){const start=e.trial.overlay.origin==='body'&&e.referenceProblem.simulation.kind==='momentum'?e.refEnd:0;return clamp((e.clock-start)/Math.max(.01,e.duration-start),0,1);}
function experimentVector(canvas,pal,e,opts){
 const o=e.trial.overlay,max=Math.max(.000001,Math.abs(o.magnitude),Math.abs(o.expectedMagnitude)),reveal=vectorReveal(e),ready=e.referenceProblem.simulation.kind!=='momentum'||e.clock>=e.refEnd;
 experimentLegend(pal,e);line(pal.c,pal.w/2,43,pal.w/2,pal.h-48,pal.line,1);
 [0,1].forEach(run=>comparisonPanel(pal,run,panel=>{
  const {c,w,h}=panel,color=run?pal.orange:pal.blue,state=run?e.proposal:e.reference,problem=run?e.proposalProblem:e.referenceProblem,params=run?e.proposalParams:e.referenceParams,angle=run?o.angle:o.expectedAngle,magnitude=run?o.magnitude:o.expectedMagnitude,extent=Math.min(w*.23,h*.22,105);let origin,contactOrigin=null;
  text(c,run?o.label:o.expectedLabel,w/2,63,color,11,'center',true,w-22);
  if(o.origin==='orbit'||o.origin==='turn'){
   const cx=w*.43,cy=h*.56,r=Math.max(35,Math.min(w*.24,(h-138)*.35)),theta=num(state.theta),x=cx+r*Math.cos(theta),y=cy-r*Math.sin(theta);c.strokeStyle=pal.line;c.lineWidth=o.origin==='orbit'?2:7;c.beginPath();c.arc(cx,cy,r,0,TAU);c.stroke();
   if(o.origin==='orbit'){ellipse(c,cx,cy,14,14,pal.orange);text(c,'Sun',cx,cy+26,pal.muted,10,'center');ellipse(c,x,y,11,11,pal.blue);ellipse(c,x-3,y-2,5,4,pal.green);text(c,Math.abs(num(params.orbitAU,1)-1)<1e-6?'Earth':'Model planet',x,y+24,pal.muted,10,'center');}else{ellipse(c,cx,cy,3,3,pal.muted);topBike(c,x,y,pal.blue,Math.atan2(-Math.cos(theta),-Math.sin(theta)));}
   origin={x,y};arrow(c,x,y,-Math.sin(theta)*35,-Math.cos(theta)*35,pal.green);text(c,'green: tangent velocity',w/2,h-62,pal.green,10,'center');
  }else if(problem.simulation.kind==='momentum'){
   const b=state.bodies,R=b.map(body=>num(body.radius,.03)),factor=clamp(1-num(state.compression)/(R[0]+R[1]),.3,1),base=22,rx=base*factor,ry=base/Math.sqrt(factor),ppm=(w-124)/(e.range[1]-e.range[0]),gap=Math.max(0,b[1].x-b[0].x-R[0]-R[1])*ppm,sep=2*rx+gap,m=b[0].mass+b[1].mass,cm=(b[0].x*b[0].mass+b[1].x*b[1].mass)/m,raw=62+(cm-e.range[0])*ppm,mid=clamp(raw,32+sep*b[1].mass/m,w-32-sep*b[0].mass/m),xs=[mid-sep*b[1].mass/m,mid+sep*b[0].mass/m],y=h*.58;
   line(c,18,y+ry,w-18,y+ry,pal.line,2);b.forEach((body,i)=>{const col=i?pal.orange:pal.blue;collisionObject(c,xs[i],y,rx,ry,col,'marbles',i,panel);text(c,`${format(body.mass)} kg`,w*(i?.74:.26),y+ry+22,col,10,'center');line(c,xs[i],y+ry+2,w*(i?.74:.26),y+ry+11,col,1);});
   contactOrigin={x:xs[o.body??1],y:y-ry};origin={x:contactOrigin.x,y:contactOrigin.y-17};
   if(ready&&!run){const partner={x:xs[0],y:y-ry-17};line(c,partner.x,y-ry,partner.x,partner.y,pal.muted,1.5);arrow(c,partner.x,partner.y,-Math.abs(o.expectedMagnitude)/max*extent,0,pal.blue);}
   text(c,ready?'Objects touching':'Approaching contact',w/2,h-62,pal.muted,10,'center');
  }else{
   const x=w*.5,y=h*.62;object(c,x,y,pal.blue,problem,0,0);line(c,23,y,w-23,y,pal.line,2);origin={x,y:y-80};line(c,x,y-52,x,origin.y+5,pal.muted,1.5);
   text(c,state.stuck?'Crate remains at rest':'Frozen at start; unbalanced pull begins motion',w/2,h-62,pal.muted,10,'center',false,w-20);
   if(!run){const applied=state.forces.find(force=>!/friction/i.test(force.label)&&force.axis==='horizontal');if(applied)arrow(c,x,y-25,Math.sign(applied.value)*Math.abs(applied.value)/max*extent,0,pal.green);}
  }
  if(ready){if(contactOrigin)line(c,contactOrigin.x,contactOrigin.y,origin.x,origin.y,pal.muted,1.5);const growth=run?reveal:1,rad=angle*Math.PI/180,length=magnitude/max*extent*growth;if(magnitude<.000001){ellipse(c,origin.x,origin.y,6,6,null,color);text(c,'0 N',origin.x,origin.y-16,color,11,'center',true);}else arrow(c,origin.x,origin.y,Math.cos(rad)*length,-Math.sin(rad)*length,color);}
  text(c,o.origin==='orbit'||o.origin==='turn'?`${format(angle)}° from right`:`${format(magnitude)} N ${Math.cos(angle*Math.PI/180)<0?'left':'right'}`,w/2,84,color,11,'center');
 }));
 experimentResult(pal,e);
}
export function drawExperiment(canvas,problem,params,time,opts={}){
 if(!opts.trial||opts.trial.ok===false){drawScene(canvas,problem,params,time,opts);return;}
 const e=experimentState(problem,params,time,opts),pal=setup(canvas,opts.theme),kind=e.referenceProblem.simulation.kind;
 canvas.setAttribute('aria-label',`Comparison: your test on the left, reference on the right. Both use the same physical scales. ${e.trial.comparisonLabel||''} ${e.progress>=.995?`Your test ${e.trial.value} ${e.trial.unit}; reference result ${e.trial.expected} ${e.trial.unit}.`:''}`);
 if(e.trial.overlay?.type==='vector'){experimentVector(canvas,pal,e,opts);return;}
 experimentLegend(pal,e);line(pal.c,pal.w/2,43,pal.w/2,pal.h-48,pal.line,1);
 if(kind==='gravity')experimentScale(pal,e,opts.arrows!==false);
 else if(e.referenceProblem.simulation.scene==='train')experimentTrain(pal,e,opts.arrows!==false);
 else if(kind==='circular')experimentCircular(pal,e,opts.arrows!==false);
 else if(kind==='momentum')experimentCollision(pal,e,opts.arrows!==false);
 else if(e.reference.axis==='2d'||e.proposal.axis==='2d')experimentPlanes(pal,e,opts.arrows!==false);
 else if(e.reference.axis==='vertical'||e.proposal.axis==='vertical')experimentVertical(pal,e,opts.arrows!==false);
 else experimentMotion(pal,e,opts.arrows!==false);
 experimentResult(pal,e);

}
function vectorGraph(pal,e){
 const {c,w,h}=pal,o=e.trial.overlay,cy=h*.62,extent=Math.max(20,Math.min(w*.13,h*.25)),max=Math.max(.000001,Math.abs(o.magnitude),Math.abs(o.expectedMagnitude)),reveal=vectorReveal(e),ready=e.referenceProblem.simulation.kind!=='momentum'||e.clock>=e.refEnd;
 text(c,'Force vectors: same scale',12,13,pal.muted,11);
 [0,1].forEach(run=>{const cx=comparisonX(pal,run),color=run?pal.orange:pal.blue;line(c,cx-extent-7,cy,cx+extent+7,cy,pal.line);line(c,cx,cy-extent-7,cx,cy+extent+7,pal.line);text(c,run?'your test':'reference',cx,34,color,10,'center',true);text(c,'right +',cx+extent+7,cy+14,pal.muted,9,'right');if(!ready){text(c,'approaching',cx,cy,pal.muted,10,'center');return;}const angle=run?o.angle:o.expectedAngle,magnitude=run?o.magnitude:o.expectedMagnitude,rad=angle*Math.PI/180,len=magnitude/max*extent*(run?reveal:1);if(magnitude<.000001)ellipse(c,cx,cy,5,5,null,color);else arrow(c,cx,cy,Math.cos(rad)*len,-Math.sin(rad)*len,color);});
}
function comparisonGraphData(e,quantity){
 if(!e.samples){const times=sampleTimes(e.duration,[e.reference,e.proposal]),gravity=e.referenceProblem.simulation.kind==='gravity';e.samples={times,gravity,states:gravity?null:[Array.from(times,t=>t<=e.refEnd+1e-9?evaluate(e.referenceProblem,e.referenceParams,t):null),Array.from(times,t=>t<=e.proposalEnd+1e-9?evaluate(e.proposalProblem,e.proposalParams,t):null)]};}
 if(!e.graph||e.graph.quantity!==quantity){const {times,gravity,states}=e.samples,convert=e.referenceParams.orbital?(['x','y','distance'].includes(quantity)?1e9:['v','vy','speed'].includes(quantity)?1e3:1):1,params=[e.referenceParams,e.proposalParams],problems=[e.referenceProblem,e.proposalProblem],labels=[e.trial.referenceLabel?.startsWith('Earth')?'Earth':'reference',e.trial.proposalLabel?.startsWith('Other')?'other planet':'your test'];
  const traces=[0,1].map(index=>({color:index?'orange':'blue',dash:index?[]:[5,4],label:labels[index],legendIndex:comparisonSlot(index),values:Float64Array.from(times,(t,i)=>gravity?loadedScale(params[index],t).force:states[index][i]?comparisonValue(states[index][i],quantity,params[index],problems[index])/convert:NaN)})),guide=e.trial.overlay?.type==='interval'?Float64Array.from(times,t=>comparisonValue(evaluate(e.referenceProblem,e.referenceParams,t),quantity,e.referenceParams,e.referenceProblem)/convert):[];
  const[lo,hi]=boundsFor(traces,guide);e.graph={quantity,convert,times,traces,guide,lo,hi,duration:e.duration,unit:convert===1e9?'million km':convert===1e3?'km/s':graphUnits[quantity]||e.trial.unit||''};renderingStats.comparisonGraphBuilds++;}
 return e.graph;
}
export function drawExperimentGraph(canvas,problem,params,time,opts={}){
 if(!opts.trial||opts.trial.ok===false){drawGraph(canvas,problem,params,time,opts);return;}const e=experimentState(problem,params,time,opts),pal=setup(canvas,opts.theme);if(e.trial.overlay?.type==='vector'){vectorGraph(pal,e);canvas.setAttribute('aria-label','Force comparison: your proposed force on the left in orange; physical reference on the right in blue. Both use the same force scale.');return;}
 const gravity=e.referenceProblem.simulation.kind==='gravity',quantity=gravity?'weight':opts.quantity||e.ri.graphKey||'x',data=comparisonGraphData(e,quantity),states=[e.reference,e.proposal],parameters=[e.referenceParams,e.proposalParams],problems=[e.referenceProblem,e.proposalProblem];data.traces.forEach((trace,index)=>{trace.currentTime=gravity?e.clock:index?e.pt:e.rt;trace.current=gravity?loadedScale(parameters[index],e.clock).force:comparisonValue(states[index],quantity,parameters[index],problems[index])/data.convert;});
 paintGraph(pal,data,e.clock,{reveal:true,interval:e.trial.overlay?.type==='interval'?e.trial.overlay:null,guide:data.guide,title:graphTitle(quantity,e.reference),unit:data.unit,timeScale:e.ri.timeScale||1,timeUnit:e.ri.timeUnit});canvas.setAttribute('aria-label',`Comparison graph: ${graphTitle(quantity,e.reference)}. Orange is your test, listed first; dashed blue is the reference. Both use the same axes.`);
}

