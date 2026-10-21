import {evaluate,modelInfo,format} from './physics.js';
function setup(canvas,theme){const r=canvas.getBoundingClientRect(),dpr=Math.min(window.devicePixelRatio||1,2),w=Math.max(150,r.width),h=Math.max(100,r.height);if(canvas.width!==Math.round(w*dpr)||canvas.height!==Math.round(h*dpr)){canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}const c=canvas.getContext('2d');c.setTransform(dpr,0,0,dpr,0,0);c.clearRect(0,0,w,h);const dark=theme==='dark';return {c,w,h,ink:dark?'#dfebfa':'#18364e',muted:dark?'#a7bdd4':'#647c91',line:dark?'#2b4054':'#dbe6f1',blue:dark?'#79b7ff':'#2475cf',orange:dark?'#f7c568':'#c27c10',green:dark?'#77d6b1':'#16816a',fill:dark?'#1b334b':'#dbeaf9',panel:dark?'#101e2c':'#f8fbff'};}
function text(c,s,x,y,color,size=12,align='left',bold=false){c.fillStyle=color;c.font=`${bold?'650':'400'} ${size}px system-ui,sans-serif`;c.textAlign=align;c.textBaseline='middle';c.fillText(String(s),x,y);}
function line(c,x1,y1,x2,y2,color,width=1,dash=[]){c.strokeStyle=color;c.lineWidth=width;c.setLineDash(dash);c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();c.setLineDash([]);}
function arrow(c,x,y,dx,dy,color,label,scale=1){const len=Math.hypot(dx,dy);if(len<1)return;const ux=dx/len,uy=dy/len;line(c,x,y,x+dx,y+dy,color,3*scale);c.fillStyle=color;c.beginPath();c.moveTo(x+dx,y+dy);c.lineTo(x+dx-ux*9*scale-uy*5*scale,y+dy-uy*9*scale+ux*5*scale);c.lineTo(x+dx-ux*9*scale+uy*5*scale,y+dy-uy*9*scale-ux*5*scale);c.closePath();c.fill();if(label)text(c,label,x+dx*.5-uy*15,y+dy*.5+ux*(-15),color,11,'center',true);}
function round(c,x,y,w,h,r,fill,stroke){c.beginPath();c.roundRect(x,y,w,h,r);if(fill){c.fillStyle=fill;c.fill();}if(stroke){c.strokeStyle=stroke;c.lineWidth=1.5;c.stroke();}}
function cart(c,x,y,color,label,w=46){round(c,x-w/2,y-29,w,23,5,color);line(c,x-w/2+5,y-6,x+w/2-5,y-6,color,3);for(const dx of [-w*.28,w*.28]){c.fillStyle=color;c.beginPath();c.arc(x+dx,y-3,6,0,Math.PI*2);c.fill();c.fillStyle='#fff';c.beginPath();c.arc(x+dx,y-3,2,0,Math.PI*2);c.fill();}if(label)text(c,label,x,y-43,color,11,'center',true);}
function person(c,x,y,color,phase=0,kind='walk'){const stride=Math.sin(phase)*6;line(c,x,y-12,x,y-38,color,4);c.fillStyle=color;c.beginPath();c.arc(x,y-47,7,0,Math.PI*2);c.fill();line(c,x,y-14,x-8-stride,y,color,3);line(c,x,y-14,x+8+stride,y,color,3);line(c,x,y-31,x-10+stride,y-21,color,3);line(c,x,y-31,x+10-stride,y-20,color,3);if(kind==='skate'){line(c,x-18,y+2,x+18,y+2,color,3);for(const dx of [-12,12]){c.beginPath();c.arc(x+dx,y+6,3,0,Math.PI*2);c.fill();}}}
function bike(c,x,y,color,phase){for(const dx of [-20,20]){c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.arc(x+dx,y-11,12,0,Math.PI*2);c.stroke();line(c,x+dx,y-11,x+dx+9*Math.cos(phase),y-11+9*Math.sin(phase),color,1);}line(c,x-20,y-11,x-5,y-30,color,2);line(c,x-5,y-30,x+4,y-11,color,2);line(c,x-20,y-11,x+4,y-11,color,2);line(c,x-5,y-30,x+14,y-30,color,2);line(c,x+14,y-30,x+20,y-11,color,2);line(c,x+14,y-30,x+14,y-37,color,2);line(c,x-5,y-31,x-6,y-50,color,3);c.fillStyle=color;c.beginPath();c.arc(x-6,y-57,6,0,Math.PI*2);c.fill();line(c,x-6,y-46,x+12,y-37,color,3);line(c,x-6,y-31,x+5,y-21,color,3);}
function vehicle(c,x,y,color,problem,t,label){
 const title=problem.title.toLowerCase(),all=(problem.title+' '+problem.prompt).toLowerCase();
 if(/box|crate|backpack/.test(title)){round(c,x-23,y-42,46,40,4,color);line(c,x-13,y-34,x+13,y-34,'#ffffff88',2);line(c,x,y-42,x,y-2,'#ffffff55',2);}
 else if(/puck|hockey/.test(title)){c.fillStyle=color;c.beginPath();c.ellipse(x,y-6,22,8,0,0,Math.PI*2);c.fill();}
 else if(/bus|train/.test(title)){round(c,x-47,y-42,94,34,5,color);for(let i=0;i<4;i++)round(c,x-38+i*20,y-35,15,14,2,'#cce7f9');for(const dx of [-30,30]){c.fillStyle=color;c.beginPath();c.arc(x+dx,y-5,7,0,Math.PI*2);c.fill();}}
 else if(/cart|trolley|car/.test(title)){cart(c,x,y,color,label);}
 else if(/bicycl|cyclist|bike|cycling/.test(all))bike(c,x,y,color,t*5);
 else if(/scooter/.test(title)){person(c,x,y-7,color,0,'skate');line(c,x+16,y-6,x+16,y-36,color,3);line(c,x+10,y-36,x+21,y-36,color,3);}
 else if(/dog/.test(title)){round(c,x-18,y-25,36,15,6,color);line(c,x-12,y-11,x-15,y,color,3);line(c,x+12,y-11,x+15,y,color,3);c.fillStyle=color;c.beginPath();c.arc(x+23,y-26,10,0,Math.PI*2);c.fill();line(c,x-17,y-21,x-28,y-31,color,3);}
 else if(/walk|runner|run |jog|student|skater|skateboard/.test(all))person(c,x,y,color,t*5,/skat/.test(all)?'skate':'walk');
 else cart(c,x,y,color,label);
}
function axis(c,Y,min,max,W,pal){line(c,40,Y,W-30,Y,pal.line,2);const n=5;for(let i=0;i<=n;i++){const x=40+(W-70)*i/n;line(c,x,Y-4,x,Y+5,pal.line,1);text(c,format(min+(max-min)*i/n,1),x,Y+18,pal.muted,10,'center');}text(c,'position (m) · positive →',W-30,Y+37,pal.muted,10,'right');}
export function drawScene(canvas,problem,p,t,{arrows=true,hideAnswers=false,theme='light'}={}){
 const pal=setup(canvas,theme),{c,w,h}=pal,s=evaluate(problem,p,t),info=modelInfo(problem,p),k=problem.simulation.kind;let [min,max]=info.range;const X=x=>40+(x-min)/(max-min)*(w-70);const Y=h-66;
 text(c,problem.title,17,20,pal.muted,11,'left',true);
 if(k==='circular'){
  const cx=w*.45,cy=h*.51,r=Math.min(h*.3,w*.28),angle=s.theta,x=cx+r*Math.cos(angle),y=cy-r*Math.sin(angle);
  c.strokeStyle=pal.line;c.lineWidth=2;c.setLineDash([5,5]);c.beginPath();c.arc(cx,cy,r,0,Math.PI*2);c.stroke();c.setLineDash([]);line(c,cx,cy,cx+r,cy,pal.line,1);text(c,`${format(s.radius)} m`,cx+r*.5,cy+14,pal.muted,11,'center');c.fillStyle=pal.blue;c.beginPath();c.arc(x,y,12,0,Math.PI*2);c.fill();c.fillStyle=pal.muted;c.beginPath();c.arc(cx,cy,3,0,Math.PI*2);c.fill();
  if(arrows){arrow(c,x,y,-Math.sin(angle)*56,-Math.cos(angle)*56,pal.blue,'velocity');arrow(c,x,y,-Math.cos(angle)*48,Math.sin(angle)*48,pal.orange,'inward acceleration');}
  text(c,hideAnswers?'Which part of velocity changes?':'Constant speed; changing direction',w/2,h-22,pal.ink,12,'center',true);
 }else if(k==='gravity'&&p.compareG!==undefined){
  const yy=h-84,gs=[Number(p.g),Number(p.compareG)],labels=['Selected location','Earth'];
  [w*.28,w*.73].forEach((xx,i)=>{line(c,xx-65,yy+24,xx+65,yy+24,pal.line,3);person(c,xx,yy+22,i?pal.orange:pal.blue,0);text(c,labels[i],xx,54,pal.ink,12,'center',true);text(c,`g = ${format(gs[i])} m/s²`,xx,75,pal.muted,11,'center');text(c,`${format(Number(p.mass))} kg`,xx,yy+43,pal.muted,11,'center',true);if(arrows){const size=20+50*gs[i]/Math.max(...gs);arrow(c,xx+26,yy-13,0,size,i?pal.orange:pal.blue,hideAnswers?'weight':`${format(Number(p.mass)*gs[i])} N`);arrow(c,xx-27,yy+17,0,-size,pal.green,'support');}});
  text(c,'Same mass in both places · both supported at rest',w/2,h-17,pal.muted,11,'center');
 }else if(k==='gravity'){
  const supported=p.supported===true,height=Math.max(1,Number(p.height)||2),ground=h-45,top=48,unit=(ground-top)/(height*1.25),xx=w*.47,yy=ground-s.x*unit;
  line(c,55,ground,w-35,ground,pal.line,3);for(let i=0;i<5;i++){const val=height*i/4,y=ground-val*unit;line(c,45,y,53,y,pal.muted);text(c,`${format(val,1)} m`,37,y,pal.muted,10,'right');}
  if(supported){round(c,xx-42,yy+20,84,8,3,pal.muted);line(c,xx-32,yy+28,xx-32,ground,pal.line,6);line(c,xx+32,yy+28,xx+32,ground,pal.line,6);}
  round(c,xx-24,yy-20,48,40,5,pal.blue);text(c,`${format(Number(p.mass)||1)} kg`,xx,yy,'#fff',12,'center',true);
  if(arrows){arrow(c,xx+31,yy,0,50,pal.orange,hideAnswers?'weight':`weight ${format((Number(p.mass)||1)*(Number(p.g)||9.8))} N`);if(supported||s.x===0)arrow(c,xx-31,yy+10,0,-50,pal.green,hideAnswers?'support':'support force');}
  text(c,supported?'Object held at rest':'Released from rest · air resistance neglected',w/2,h-20,pal.muted,11,'center');
 }else{
  axis(c,Y,min,max,w,pal);
  if(k==='route'){
   for(const [value,label] of [[p.start,'START'],...(Number(p.turn)===Number(p.end)?[]:[[p.turn,'TURN']]),[p.end,'FINISH']]){const xx=X(Number(value));line(c,xx,Y-64,xx,Y+3,pal.line,1,[3,3]);text(c,label,xx,Y-74,pal.muted,9,'center',true);}
   const sx=X(Number(p.start)),tx=X(Number(p.turn)),ex=X(Number(p.end));line(c,sx,Y-102,tx,Y-102,pal.blue,3,[5,4]);line(c,tx,Y-90,ex,Y-90,pal.orange,3,[5,4]);
  }
  if(k==='piecewise'){text(c,'A straight route, including any stops',w/2,48,pal.muted,11,'center');}
  if(k==='momentum'&&!p.single){
   const pixelSeparation=Math.abs(X(s.bodies[1].x)-X(s.bodies[0].x));const bw=Math.max(16,Math.min(46,pixelSeparation-2));
   s.bodies.forEach((b,i)=>{const xx=X(b.x);cart(c,xx,Y-1,i?pal.orange:pal.blue,`${format(b.mass)} kg`,bw);if(arrows&&Math.abs(b.v)>.001)arrow(c,xx,Y-65,Math.sign(b.v)*Math.min(72,25+Math.abs(b.v)*10),0,i?pal.orange:pal.blue,hideAnswers?'velocity':`${format(b.v)} m/s`);});
   text(c,s.collided?'Coupled carts move together':'Before coupling',w/2,49,pal.ink,12,'center',true);
  }else if(k==='momentum'&&p.single){
   const xx=X(s.x);c.fillStyle=pal.blue;c.beginPath();c.arc(xx,Y-16,16,0,Math.PI*2);c.fill();c.fillStyle=pal.panel;for(const [dx,dy] of [[-4,-4],[3,-5],[1,2]]){c.beginPath();c.arc(xx+dx,Y-16+dy,2,0,Math.PI*2);c.fill();}if(arrows)arrow(c,xx,Y-54,Math.sign(s.v)*65,0,pal.blue,hideAnswers?'velocity':`${format(s.v)} m/s`);text(c,'Short steady roll before reaching the pins',w/2,48,pal.muted,11,'center');
  }else if(k==='thirdlaw'){
   s.bodies.forEach((b,i)=>{const xx=X(b.x);if(p.fixedSecond&&i===1){round(c,xx-8,Y-92,19,92,2,pal.muted);for(let j=0;j<6;j++)line(c,xx+12,Y-87+j*15,xx+22,Y-97+j*15,pal.line,2);text(c,'POOL WALL',xx,Y-108,pal.muted,10,'center',true);}else if(p.fixedSecond){line(c,xx-24,Y-28,xx+20,Y-28,pal.blue,8);c.fillStyle=pal.blue;c.beginPath();c.arc(xx-30,Y-28,7,0,Math.PI*2);c.fill();line(c,xx+10,Y-28,xx+27,Y-17,pal.blue,3);line(c,xx-12,Y-28,xx+2,Y-14,pal.blue,3);text(c,'Swimmer',xx,Y-65,pal.blue,11,'center',true);}else{person(c,xx,Y-2,i?pal.orange:pal.blue,0,'skate');text(c,`${format(b.mass)} kg`,xx,Y-71,i?pal.orange:pal.blue,11,'center',true);}if(arrows&&s.contact){const f=s.forces[i];arrow(c,xx,Y-38,Math.sign(f.value)*55,0,i?pal.orange:pal.blue,hideAnswers?`force on ${i+1}`:`${format(Math.abs(f.value))} N`);}});
   text(c,s.contact?'During contact: force pair acts on separate objects':'After release: contact forces are zero; motion continues',w/2,47,pal.muted,11,'center');
  }else if(s.bodies.length>1){
   s.bodies.forEach((b,i)=>{const xx=X(b.x),yy=Y-i*70,col=i?pal.orange:pal.blue;if(p.compareMass!==undefined){cart(c,xx,yy,col,`${format(b.mass)} kg`);if(arrows)arrow(c,xx,yy-37,60,0,col,hideAnswers?'same net force':`${format(Number(p.forwardForce))} N`);}else{vehicle(c,xx,yy,col,problem,t);if(arrows)arrow(c,xx,yy-65,Math.sign(b.v)*45,0,col,hideAnswers?'velocity':`${format(b.v)} m/s`);}});
   if(p.compareMass!==undefined)text(c,'Two parallel tracks · same force on each cart',w/2,48,pal.muted,11,'center');
  }else{
   const xx=X(s.x);vehicle(c,xx,Y-1,pal.blue,problem,t);
   if(p.referenceSpeed!==undefined){text(c,Number(p.referenceSpeed)===Number(p.speed)?'Train frame: seated passenger stays still':'Position measured in selected moving frame',w/2,48,pal.muted,11,'center');round(c,xx-30,Y-56,60,44,6,null,pal.blue);text(c,'Passenger',xx,Y-70,pal.blue,11,'center');}

   if(arrows&&s.forces.length){const fmax=Math.max(1,...s.forces.map(f=>Math.abs(f.value)));s.forces.forEach((f,i)=>{if(Math.abs(f.value)<.0001)return;const len=Math.abs(f.value)/fmax*72;arrow(c,xx,Y-24-i*37,Math.sign(f.value)*len,0,i?pal.orange:pal.blue,hideAnswers?f.label:`${f.label} ${format(Math.abs(f.value))} N`);});}
   else if(arrows&&Math.abs(s.v)>.001){arrow(c,xx,Y-83,Math.sign(s.v)*60,0,pal.blue,hideAnswers?'velocity':`${format(s.v)} m/s`);if(Math.abs(s.a)>.001)arrow(c,xx,Y-114,Math.sign(s.a)*44,0,pal.orange,hideAnswers?'acceleration':`${format(s.a)} m/s²`);}
   if(s.stuck)text(c,'Static friction adjusts to the push',w/2,48,pal.muted,11,'center');else if(s.stopped)text(c,'Stopped · friction no longer slows it',w/2,48,pal.muted,11,'center');
  }
 }
 if(!hideAnswers)text(c,`t = ${format(t,2)} s`,w-16,20,pal.muted,11,'right');
}
export function drawGraph(canvas,problem,p,t,{quantity='x',hideAnswers=false,theme='light'}={}){
 const pal=setup(canvas,theme),{c,w,h}=pal,info=modelInfo(problem,p),samples=151,values=[];for(let i=0;i<samples;i++)values.push(evaluate(problem,p,info.duration*i/(samples-1))[quantity]);
 const second=[];for(let i=0;i<samples;i++){const b=evaluate(problem,p,info.duration*i/(samples-1)).bodies[1];if(b)second.push(quantity==='speed'?Math.abs(b.v):quantity==='distance'?b.distance:b[quantity]);}const valid=[...values,...second].filter(Number.isFinite);let lo=Math.min(0,...valid),hi=Math.max(0,...valid);if(hi-lo<1e-6){hi=lo+1;lo-=1;}const pad=(hi-lo)*.13;lo-=pad;hi+=pad;
 const L=48,R=w-13,T=22,B=h-29,X=x=>L+(R-L)*x/info.duration,Y=y=>B-(y-lo)/(hi-lo)*(B-T);
 for(let i=0;i<4;i++){const val=lo+(hi-lo)*i/3,y=Y(val);line(c,L,y,R,y,pal.line,.8);if(!hideAnswers)text(c,format(val,1),L-7,y,pal.muted,9,'right');}
 for(let i=0;i<=4;i++){const time=info.duration*i/4,x=X(time);line(c,x,T,x,B,pal.line,.8);text(c,format(time,1),x,B+13,pal.muted,9,'center');}
 line(c,L,B,R,B,pal.muted,1);line(c,L,T,L,B,pal.muted,1);if(lo<0&&hi>0)line(c,L,Y(0),R,Y(0),pal.muted,.8);
 const units={x:'m',v:'m/s',a:'m/s²',speed:'m/s',distance:'m'},names={distance:'Total distance',speed:'Speed',x:problem.simulation.kind==='circular'?'Horizontal position':'Position',v:problem.simulation.kind==='circular'?'Horizontal velocity':'Velocity',a:problem.simulation.kind==='circular'?'Horizontal acceleration':'Acceleration'};
 text(c,`${names[quantity]} (${units[quantity]})`,L,10,pal.muted,10);text(c,'time (s)',R,B+26,pal.muted,9,'right');
 c.strokeStyle=pal.blue;c.lineWidth=2.5;c.beginPath();for(let i=0;i<samples;i++){const x=X(info.duration*i/(samples-1)),y=Y(values[i]);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();
 if(evaluate(problem,p,0).bodies.length>1){c.strokeStyle=pal.orange;c.lineWidth=2;c.setLineDash([5,4]);c.beginPath();for(let i=0;i<samples;i++){const ss=evaluate(problem,p,info.duration*i/(samples-1)),b=ss.bodies[1],val=quantity==='speed'?Math.abs(b.v):quantity==='distance'?b.distance:b[quantity];const x=X(info.duration*i/(samples-1)),y=Y(val);if(i===0)c.moveTo(x,y);else c.lineTo(x,y);}c.stroke();c.setLineDash([]);text(c,'blue: object 1   dashed: object 2',R,w<390?T+12:10,pal.muted,9,'right');}
 if(quantity==='a'&&problem.simulation.kind==='momentum'&&!p.single)text(c,'Brief collision acceleration is not resolved',w/2,T+17,pal.muted,10,'center',true);
 if(quantity==='a'&&problem.simulation.kind==='piecewise')text(c,'Instant transitions are not resolved; a = 0 between them',w/2,T+17,pal.muted,10,'center',true);
 const tt=Math.min(t,info.duration),s=evaluate(problem,p,tt),xx=X(tt),yy=Y(s[quantity]);line(c,xx,T,xx,B,pal.orange,1.4,[3,3]);c.fillStyle=pal.orange;c.beginPath();c.arc(xx,yy,4,0,Math.PI*2);c.fill();
 canvas.setAttribute('aria-label',`${names[quantity]} against time, from 0 to ${format(info.duration)} seconds. Current ${names[quantity].toLowerCase()} is ${hideAnswers?'hidden':format(s[quantity])+' '+units[quantity]}.`);
}
