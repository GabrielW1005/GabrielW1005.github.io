import { ratio, limits } from './physics.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?Number(n.toPrecision(4)).toString():'0';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const TAU=Math.PI*2;
const gearCache=new Map();

export function renderScene(c,state,readout={},options={}){
 const dark=!!options.dark, paths=options.paths!==false, forces=!!options.forces;
 const P={bg:dark?'#111b2c':'#ffffff',ink:dark?'#e3eaf6':'#27364c',muted:dark?'#a1b1c8':'#66758a',line:dark?'#74859d':'#b8c3d2',fill:dark?'#28384f':'#e7edf5',metal:dark?'#445a77':'#ccd8e6',blue:dark?'#72afff':'#2563eb',orange:dark?'#ffb16f':'#c65b17',water:dark?'#1f6488':'#bfe6fa'};
 const q=Number(state?.q)||0,q0=Number(state?.q0)||0,lim=limits(c),R=ratio(c),G=10;
 const visibleForces=forces?[c.inputMass*G,c.outputMass*G,c.force]:[];
 if(forces&&c.type==='ramp'&&!readout.atLimit)visibleForces.push(Math.max(0,Number(readout.inputTension)||0),c.outputMass*G*Math.sqrt(Math.max(0,1-(c.height/c.length)**2)));
 if(options.pull&&Number.isFinite(options.pull.cursor?.x)&&Number.isFinite(options.pull.cursor?.y))visibleForces.push(Number(options.pull.force)||0);
 const forceScale=80/(Math.max(0,...visibleForces.map(f=>Math.abs(Number(f)||0)))||1);
 const sAttr='font-family="system-ui,-apple-system,Segoe UI,sans-serif"';
 const bodies={};let bodyScale=1;
 const line=(x1,y1,x2,y2,color=P.ink,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
 const path=(d,color=P.ink,w=2,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const circle=(x,y,r,fill=P.fill,stroke=P.ink,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
 const rect=(x,y,w,h,fill=P.fill,stroke=P.ink,r=5)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
 const text=(x,y,str,color=P.ink,size=18,anchor='middle',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${sAttr} style="paint-order:stroke;stroke:${P.bg};stroke-width:3;stroke-linejoin:round" ${extra}>${esc(str)}</text>`;
 function arrow(x1,y1,x2,y2,col=P.ink,w=2.5){const a=Math.atan2(y2-y1,x2-x1),l=Math.min(8,Math.hypot(x2-x1,y2-y1)*.35);return line(x1,y1,x2,y2,col,w)+path(`M${x2-l*Math.cos(a-.45)},${y2-l*Math.sin(a-.45)} L${x2},${y2} L${x2-l*Math.cos(a+.45)},${y2-l*Math.sin(a+.45)}`,col,w);}
 function handle(x,y,param,units,label,axis='x'){return `<g data-drag="geometry" data-param="${param}" data-units-per-px="${units}" data-axis="${axis}" data-name="${esc(label)}" role="button" aria-label="Drag to change ${esc(label)}" tabindex="0" style="cursor:${axis==='y'?'ns':'ew'}-resize">${circle(x,y,21,'transparent','transparent',0)}${circle(x,y,10,P.bg,P.muted,2)}${axis==='y'?path(`M${x-4},${y-3} L${x},${y-7} L${x+4},${y-3} M${x-4},${y+3} L${x},${y+7} L${x+4},${y+3}`,P.muted,1.6):path(`M${x-3},${y-4} L${x-7},${y} L${x-3},${y+4} M${x+3},${y-4} L${x+7},${y} L${x+3},${y+4}`,P.muted,1.6)}</g>`;}
 function dim(x1,y1,x2,y2,label,col,tx=(x1+x2)/2,ty=(y1+y2)/2-10){return arrow(x1,y1,x2,y2,col,1.4)+arrow(x2,y2,x1,y1,col,1.4)+text(tx,ty,label,col,17);}
 function trace(fn,col){if(!paths)return '';const points=(a,b)=>Array.from({length:33},(_,i)=>{const pt=fn(a+(b-a)*i/32);return `${i?'L':'M'}${pt[0]},${pt[1]}`;}).join(' ');return path(points(lim.min,lim.max),col,2.2,'opacity=".42" stroke-dasharray="5 7"')+path(points(q0,q),col,3.5,'opacity=".95"');}
 // Body metadata always uses world SVG coordinates and meters along the actual
 // constrained path. Work-distance projections are intentionally separate.
 function weight(x,y,m,side,{ropeTop=null,pan=true,angle=0,tangent=side==='input'?[0,1]:[0,-1]}={}){
  const col=side==='input'?P.blue:P.orange,sz=10*Math.sqrt(Math.max(0,m)),half=sz/2,frame=Math.max(40,sz),edge=frame/2,panW=Math.max(52,sz+15),extent=half*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle))),fill=dark?(side==='input'?'#244c7e':'#744b2c'):(side==='input'?'#d8e8ff':'#fae1cb');
  bodies[side]={x,y,size:sz,pxPerMeter:bodyScale,tangent,angle,extent};
  let z='';if(ropeTop!==null)z+=line(x,ropeTop,x,y-half-10,P.ink,3);
  z+=`<g data-body="${side}" data-drop="${side}" data-side="${side}" data-body-center-x="${x}" data-body-center-y="${y}" data-scale="${bodyScale}" data-tangent-x="${tangent[0]}" data-tangent-y="${tangent[1]}" data-size="${sz}" data-angle="${angle}">`;
  z+=`<g data-drag="pull" data-side="${side}" data-name="${side} mass" role="button" aria-label="${side} mass ${num(m)} kilograms. Drag to pull; resize with the handles." tabindex="0" style="cursor:grab"><g transform="rotate(${angle*180/Math.PI} ${x} ${y})">${rect(x-edge-9,y-edge-9,frame+18,frame+18,'transparent','transparent',4)}${m>0?rect(x-half,y-half,sz,sz,fill,col,3):rect(x-edge,y-edge,frame,frame,'none',col,3)}</g>`;
  if(pan){z+=line(x-panW/2,y+half+6,x+panW/2,y+half+6,col,4)+line(x-panW/2,y+half+6,x-8,y-half-8,col,1.4)+line(x+panW/2,y+half+6,x+8,y-half-8,col,1.4)+circle(x,y-half-10,5,P.bg,col,2);}
  z+=text(x,Math.min(526,y+extent+30),`${num(m)} kg`,col,21,'middle','font-weight="750"')+'</g>';
  z+=`<g transform="rotate(${angle*180/Math.PI} ${x} ${y})">`;
  for(const [sx,sy,axis] of [[-1,-1,'xy'],[1,-1,'xy'],[-1,1,'xy'],[1,1,'xy'],[1,0,'x'],[0,1,'y']]){
   const hx=x+sx*edge,hy=y+sy*edge;
   z+=`<g data-drag="resize" data-side="${side}" data-base-size="${sz}" data-axis="${axis}" data-signx="${sx}" data-signy="${sy}" data-angle="${angle}" data-name="${side} mass resize" role="button" aria-label="Resize ${side} mass" tabindex="0" style="cursor:${axis==='x'?'ew-resize':axis==='y'?'ns-resize':sx===sy?'nwse-resize':'nesw-resize'}">${circle(hx,hy,10,'transparent','transparent',0)}${rect(hx-3.5,hy-3.5,7,7,P.bg,col,1)}</g>`;
  }
  return z+'</g></g>';
 }
 // Every visible force shares one scale, preserving relative magnitudes.
 function forceVector(x,y,dx,dy,magnitude,label,col,labelAnchor=null){
  const f=Number(magnitude),norm=Math.hypot(dx,dy);if(!Number.isFinite(f)||!f||!norm)return '';
  const length=Math.abs(f)*forceScale,sx=dx/norm*Math.sign(f),sy=dy/norm*Math.sign(f),ex=x+sx*length,ey=y+sy*length;
  const anchor=labelAnchor||(ex>740?'end':'start'),lx=anchor==='end'?ex-12:ex+12;
  return `<g pointer-events="none">${arrow(x,y,ex,ey,col,3)}${text(clamp(lx,35,865),clamp(ey-8,70,513),`${label} ${num(Math.abs(f))} N`,col,17,anchor)}</g>`;
 }
 function pulleyWheel(x,y,r=18,angle=0){return circle(x,y,r,P.fill,P.ink,3)+line(x-r*.7*Math.cos(angle),y-r*.7*Math.sin(angle),x+r*.7*Math.cos(angle),y+r*.7*Math.sin(angle),P.muted,3)+circle(x,y,4,P.ink,P.ink,1);}
 // Fixed guides keep large bodies apart without changing rope travel or MA.
 function routedRope(x,shaftY,side,bodyY,mass,scale){
  const input=side==='input',inner=input?230:670,outer=input?130:770,band=input?335:355,top=85,r=Math.min(12,Math.abs(inner-x)/3),dir=input?-1:1,col=input?P.blue:P.orange,travel=q*scale/(input?1:R),center=(inner+outer)/2;
  return path(`M${x},${shaftY} V${band-r} Q${x},${band} ${x+dir*r},${band} H${inner-dir*r} Q${inner},${band} ${inner},${band-r} V${top} A50,50 0 0 ${input?0:1} ${outer},${top} V${bodyY-5*Math.sqrt(mass)-10}`,col,2.6)+pulleyWheel(x+dir*r,band-r,r-2,travel/r)+pulleyWheel(inner-dir*r,band-r,r-2,travel/r)+pulleyWheel(center,top,48,-travel/50);
 }
 function base(y=470,x1=90,x2=810){return line(x1,y,x2,y,P.line,3);}
 function sectionLabels(ix,ox){return text(ix,47,'INPUT',P.blue,15,'middle','font-weight="750" letter-spacing="2"')+text(ox,47,'OUTPUT',P.orange,15,'middle','font-weight="750" letter-spacing="2"');}
 let z='';
 if(c.type==='lever'){
  const scale=Math.min(590/(c.rIn+c.rOut),105/(Math.max(c.rIn,c.rOut)*Math.sin(.35))),cx=150+c.rIn*scale,cy=200,hangIn=Math.max(52,5*Math.sqrt(c.inputMass)+22),hangOut=Math.max(52,5*Math.sqrt(c.outputMass)+22);
  bodyScale=scale;
  const ip=a=>[cx-c.rIn*scale*Math.cos(a),cy+c.rIn*scale*Math.sin(a)+hangIn],op=a=>[cx+c.rOut*scale*Math.cos(a),cy-c.rOut*scale*Math.sin(a)+hangOut];
  const I=ip(q),O=op(q),ib=[I[0],I[1]-hangIn],ob=[O[0],O[1]-hangOut];
  z+=sectionLabels(185,715)+base(455)+`<path d="M${cx},${cy+5} L${cx-44},455 H${cx+44} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+circle(cx,cy,12,P.bg,P.ink,3);
  z+=trace(ip,P.blue)+trace(op,P.orange)+line(...ib,...ob,P.metal,15,'stroke-linecap="round"')+line(ib[0],ib[1],I[0],I[1]-10*Math.sqrt(c.inputMass)/2-10,P.ink,3)+line(ob[0],ob[1],O[0],O[1]-10*Math.sqrt(c.outputMass)/2-10,P.ink,3);
  z+=weight(...I,c.inputMass,'input',{tangent:[Math.sin(q),Math.cos(q)]})+weight(...O,c.outputMass,'output',{tangent:[-Math.sin(q),-Math.cos(q)]});
  z+=text((ib[0]+cx)/2,117,`${num(c.rIn)} m`,P.blue,21)+text((ob[0]+cx)/2,117,`${num(c.rOut)} m`,P.orange,21)+handle(ib[0],ib[1]-18,'rIn',-1/scale,'input arm')+handle(ob[0],ob[1]-18,'rOut',1/scale,'output arm');
  z+=text(cx,483,'fulcrum',P.muted,14);
  if(paths){const a=ip(lim.min),b=ip(lim.max),d=op(lim.min),e=op(lim.max);z+=dim(105,a[1],105,b[1],'vertical d₁',P.blue,100,(a[1]+b[1])/2-20)+dim(795,d[1],795,e[1],'vertical d₂',P.orange,795,(d[1]+e[1])/2-20);}
 } else if(c.type==='ramp'){
  const scale=Math.min(260/c.length,220/c.height),run=Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height))*scale,rise=c.height*scale,angle=Math.atan2(c.height,Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height))),tx=Math.cos(angle),ty=-Math.sin(angle),nx=-Math.sin(angle),ny=-Math.cos(angle),x0=155,y0=410;
  bodyScale=scale;
  const loadHalf=5*Math.sqrt(c.outputMass),point=u=>[x0+u*scale*tx+nx*(loadHalf+2),y0+u*scale*ty+ny*(loadHalf+2)];
  const B=point(q),contact=point(c.length+Math.max(44,loadHalf+28)/scale),upper=[722,90],r1=18,r2=23,wi=u=>[upper[0]+r2,175+u*scale],I=wi(q);
  // The first guide turns the rope along a genuine circle tangent. Steep
  // inclines turn clockwise; shallow ones use the opposite wrap direction.
  const turn=tx*(upper[1]-contact[1])-ty*(upper[0]-contact[0])>=0?1:-1;
  const guide=[contact[0]-turn*nx*r1,contact[1]-turn*ny*r1],dx=upper[0]-guide[0],dy=upper[1]-guide[1],d=Math.hypot(dx,dy),ux=dx/d,uy=dy/d,k=(r1-(turn===1?r2:-r2))/d,h=Math.sqrt(Math.max(0,1-k*k)),wx=k*ux+turn*h*uy,wy=k*uy-turn*h*ux;
  const first=[guide[0]+r1*wx,guide[1]+r1*wy],second=[upper[0]+turn*r2*wx,upper[1]+turn*r2*wy];
  const arc=(center,r,a,b,sweep)=>{const aa=Math.atan2(a[1]-center[1],a[0]-center[0]),bb=Math.atan2(b[1]-center[1],b[0]-center[0]),delta=((sweep?bb-aa:aa-bb)%TAU+TAU)%TAU;return `A${r},${r} 0 ${delta>Math.PI?1:0} ${sweep} ${b[0]},${b[1]}`;};
  z+=sectionLabels(780,270)+base(430,100,820)+`<path d="M${x0},${y0} h${run} v${-rise} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+line(x0,y0,x0+run,y0-rise,P.metal,6);
  z+=path(`M${B[0]},${B[1]} L${contact[0]},${contact[1]} ${arc(guide,r1,contact,first,turn===1?1:0)} L${second[0]},${second[1]} ${arc(upper,r2,second,[upper[0]+r2,upper[1]],1)} V${I[1]-5*Math.sqrt(c.inputMass)-10}`,P.ink,3);
  z+=pulleyWheel(...guide,r1-2,turn*q*scale/r1)+pulleyWheel(...upper,r2-2,q*scale/r2)+trace(wi,P.blue)+trace(point,P.orange);
  z+=weight(...B,c.outputMass,'output',{pan:false,angle:-angle,tangent:[tx,ty]})+weight(...I,c.inputMass,'input');
  z+=text(555,82,'fixed guides',P.muted,17)+text(x0+Math.max(run/2,45),465,c.height===c.length?'vertical lift':`length ${num(c.length)} m`,P.ink,20)+text(545,370,`height ${num(c.height)} m`,P.orange,20);
  z+=handle(x0+run,y0-rise,'length',1/scale,'ramp length')+handle(x0+run+32,y0-rise,'height',-1/scale,'ramp height','y');
  if(paths){z+=text(825,265,'rope d₁',P.blue,17)+text(330,505,'Box path = rope travel',P.orange,17)+dim(x0+run+44,y0,x0+run+44,y0-rise,'',P.orange)+text(550,398,'vertical work d₂',P.orange,17);}
  if(forces&&!readout.atLimit){const T=Math.max(0,Number(readout.inputTension)||0),N=c.outputMass*G*Math.sqrt(Math.max(0,1-(c.height/c.length)**2));z+=forceVector(B[0]+nx*(loadHalf+16),B[1]+ny*(loadHalf+16),tx,ty,T,'T',P.orange)+forceVector(B[0],B[1],nx,ny,N,'N',P.muted);}
 } else if(c.type==='pulley'){
  const scale=120/lim.max,n=c.strands>=2?2:1;bodyScale=scale;
  z+=sectionLabels(650,300)+rect(215,74,475,15,P.metal,P.line,3);
  if(n===1){const cx=450,cy=125,r=80,ip=u=>[cx+r,285+u*scale],op=u=>[cx-r,405-u*scale],I=ip(q),O=op(q);z+=line(cx,89,cx,cy,P.ink,5)+path(`M${O[0]},${O[1]-5*Math.sqrt(c.outputMass)-10} V${cy} A${r},${r} 0 0 1 ${cx+r},${cy} V${I[1]-5*Math.sqrt(c.inputMass)-10}`,P.ink,3)+pulleyWheel(cx,cy,r-2,q*scale/r)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');z+=text(690,165,'one strand',P.muted,19);}
  else {const r=45,movable=u=>[320,265-u*scale/2],ip=u=>[495,280+u*scale],op=u=>[320,430-u*scale/2],M=movable(q),I=ip(q),O=op(q);z+=circle(275,91,6,P.ink,P.ink)+path(`M275,91 V${M[1]} A${r},${r} 0 0 0 365,${M[1]} V125 A65,65 0 0 1 495,125 V${I[1]-5*Math.sqrt(c.inputMass)-10}`,P.ink,3)+pulleyWheel(320,M[1],43,-q*scale/90)+pulleyWheel(430,125,63,q*scale/65)+line(M[0],M[1]+8,O[0],O[1]-5*Math.sqrt(c.outputMass)-10,P.ink,4)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');z+=text(660,180,'2 supporting strands',P.muted,19)+text(430,51,'fixed',P.muted,16);}

  z+=text(450,498,n===1?'Fixed pulley · equal travel':'Movable pulley · pull twice the load distance',P.muted,16);
 } else if(c.type==='wheel'){
  const scale=Math.min(112/Math.max(c.rIn,c.rOut),165/lim.max,165/(lim.max/R)),ri=c.rIn*scale,ro=c.rOut*scale,cx=450,cy=190,theta=-q/c.rIn;
  bodyScale=scale;
  const ip=u=>[130,245+u*scale],op=u=>[770,410-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(100,800)+circle(cx,cy,Math.max(ri,ro),P.fill,P.ink,4)+circle(cx,cy,Math.min(ri,ro),P.metal,P.ink,3);
  for(let k=0;k<6;k++){const a=theta+k*TAU/6;z+=line(cx+Math.min(ri,ro)*Math.cos(a),cy+Math.min(ri,ro)*Math.sin(a),cx+Math.max(ri,ro)*Math.cos(a),cy+Math.max(ri,ro)*Math.sin(a),P.line,3);}
  z+=circle(cx,cy,7,P.ink,P.ink)+routedRope(cx-ri,cy,'input',I[1],c.inputMass,scale)+routedRope(cx+ro,cy,'output',O[1],c.outputMass,scale)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');
  const fi=u=>[cx+ri*Math.cos(-u/c.rIn),cy+ri*Math.sin(-u/c.rIn)],fo=u=>[cx+ro*Math.cos(-u/c.rIn),cy+ro*Math.sin(-u/c.rIn)];
  z+=trace(fi,P.blue)+trace(fo,P.orange)+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1);
  z+=text(450,437,`input radius ${num(c.rIn)} m`,P.blue,20)+text(450,466,`output radius ${num(c.rOut)} m`,P.orange,20)+handle(cx-ri,cy-14,'rIn',-.002,'input radius')+handle(cx+ro,cy+16,'rOut',.002,'output radius');
  z+=text(450,531,paths?'Rim arcs = rope travel · fixed guides only redirect':'Wheel and axle rotate together.',P.muted,17);
 } else if(c.type==='gears'){
  const scale=Math.min(170/lim.max,170/(lim.max/R),70/Math.max(c.crankRadius,c.drumRadius)),module=Math.min(1.7,115/Math.max(c.teethIn,c.teethOut)),r1=c.teethIn*module,r2=c.teethOut*module,c1=[440-r2,185],c2=[440+r1,185],rh=c.crankRadius*scale,rd=c.drumRadius*scale,a1=-q/c.crankRadius,a2=q/c.crankRadius*c.teethIn/c.teethOut;
  bodyScale=scale;
  const gear=(x,y,r,n,a)=>{const key=`${r}:${n}`;let pts=gearCache.get(key);if(!pts){pts=Array.from({length:n*4},(_,i)=>{const th=i*TAU/(n*4),rr=r+(i%4===1||i%4===2?3:-3);return `${rr*Math.cos(th)},${rr*Math.sin(th)}`;}).join(' ');if(gearCache.size>64)gearCache.clear();gearCache.set(key,pts);}return `<polygon points="${pts}" transform="translate(${x} ${y}) rotate(${a*180/Math.PI})" fill="${P.fill}" stroke="${P.ink}" stroke-width="2"/>`;};
  const ip=u=>[130,245+u*scale],op=u=>[770,410-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(100,800)+gear(...c1,r1,c.teethIn,a1)+gear(...c2,r2,c.teethOut,a2+Math.PI/c.teethOut)+circle(...c1,rh,'none',P.blue,3)+circle(...c2,rd,P.metal,P.orange,3);
  const fi=u=>[c1[0]+rh*Math.cos(-u/c.crankRadius),c1[1]+rh*Math.sin(-u/c.crankRadius)],fo=u=>[c2[0]+rd*Math.cos(u/c.crankRadius*c.teethIn/c.teethOut),c2[1]+rd*Math.sin(u/c.crankRadius*c.teethIn/c.teethOut)];
  z+=trace(fi,P.blue)+trace(fo,P.orange)+line(...c1,...fi(q),P.blue,4)+line(...c2,...fo(q),P.orange,4)+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1)+routedRope(c1[0]-rh,c1[1],'input',I[1],c.inputMass,scale)+routedRope(c2[0]-rd,c2[1],'output',O[1],c.outputMass,scale)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');
  z+=text(c1[0],c1[1]-r1-22,`${c.teethIn} teeth`,P.blue,20)+text(c2[0],c2[1]-r2-22,`${c.teethOut} teeth`,P.orange,20)+handle(c2[0]+r2+15,c2[1],'teethOut',.5,'output gear teeth')+text(450,437,`input drum r = ${num(c.crankRadius)} m`,P.blue,20)+text(450,466,`output drum r = ${num(c.drumRadius)} m`,P.orange,20);
  z+=text(450,531,'Gears turn oppositely · fixed guides only redirect',P.muted,17);
 } else if(c.type==='screw'){
  // Rotation is a true top view, while weight travel and screw are shown in side view.
  const scale=Math.min(170/lim.max,170/(lim.max/R)),cr=c.handleRadius*scale,cx=225,cy=175,theta=-q/c.handleRadius,ip=u=>[440,240+u*scale],op=u=>[665,408-u*scale/R-5*Math.sqrt(c.outputMass)],I=ip(q),O=op(q),baseY=465;
  bodyScale=scale;
  z+=sectionLabels(275,690)+circle(cx,cy,cr,P.fill,P.ink,3)+circle(cx,cy,10,P.metal,P.ink,2);
  const rim=u=>[cx+cr*Math.cos(-u/c.handleRadius),cy+cr*Math.sin(-u/c.handleRadius)];z+=trace(rim,P.blue)+line(cx,cy,...rim(q),P.blue,6)+circle(...rim(q),7,P.blue,P.bg,2);
  z+=text(cx,70,'drum / handle: top view',P.muted,17)+text(cx,cy+cr+32,`radius ${num(c.handleRadius)} m`,P.blue,20)+handle(cx+cr,cy,'handleRadius',.001,'handle radius');
  z+=path(`M${cx+cr+25},${cy} H418 A22,22 0 0 1 440,${cy+22} V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3,'stroke-dasharray="4 5"')+text(360,150,'rope via guide',P.muted,13)+trace(ip,P.blue)+weight(...I,c.inputMass,'input');
  z+=rect(570,baseY,190,12,P.metal,P.line,2)+rect(657,118,16,baseY-118,P.metal,P.line,2)+line(575,128,575,baseY,P.line,5)+line(755,128,755,baseY,P.line,5);
  const pitchPx=Math.max(.7,c.lead*scale),phase=((q/c.handleRadius)/TAU)*pitchPx;
  z+=`<defs><pattern id="screw-thread" x="657" y="${125+phase%pitchPx}" width="16" height="${pitchPx}" patternUnits="userSpaceOnUse"><path d="M0,${pitchPx} L16,${pitchPx-7} M0,${pitchPx+7} L16,${pitchPx} M0,7 L16,0" fill="none" stroke="${P.muted}" stroke-width="1.5"/></pattern></defs><rect x="657" y="125" width="16" height="${baseY-132}" fill="url(#screw-thread)"/>`;
  z+=rect(576,O[1]+5*Math.sqrt(c.outputMass)+2,178,12,P.fill,P.orange,3)+trace(op,P.orange)+weight(...O,c.outputMass,'output',{pan:false})+text(815,240,`lead ${num(c.lead)} m`,P.orange,20)+handle(815,290,'lead',-.001,'screw lead','y');
  z+=text(665,93,'guided platform: side view',P.muted,17)+text(450,532,'One revolution moves the platform by one lead',P.muted,17);
  if(paths)z+=text(215,345,'circular input path',P.blue,14)+text(790,365,'output rise',P.orange,14);
 } else if(c.type==='wedge'){
  const scale=Math.min(175/c.length,150/c.height),L=c.length*scale,H=c.height*scale,baseX=210,baseY=410,x=baseX+q*scale,loadx=baseX+L,top=baseY-q*scale/R,sz=10*Math.sqrt(c.outputMass),op=u=>[loadx,baseY-u*scale/R-24-sz/2],ip=u=>[760,240+u*scale],I=ip(q),O=op(q);
  bodyScale=scale;
  const guideHalf=Math.max(55,sz/2+15);
  z+=sectionLabels(750,400)+base(420)+`<path d="M${x-12},${baseY} V${baseY-H-12*H/L} L${x+L},${baseY} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+line(loadx-guideHalf,150,loadx-guideHalf,415,P.line,4)+line(loadx+guideHalf,150,loadx+guideHalf,415,P.line,4)+text(loadx,132,'vertical guide',P.muted,17);
  z+=line(loadx,O[1]+sz/2,loadx,top-8*Math.sqrt(1+(H/L)**2)-8,P.ink,3)+circle(loadx,top-8*Math.sqrt(1+(H/L)**2),8,P.bg,P.ink,2)+weight(...O,c.outputMass,'output',{pan:false})+trace(op,P.orange);
  z+=path(`M${x+L-10},${baseY-8} H680 Q698,${baseY-8} 698,${baseY-26} V123 A31,31 0 0 1 760,123 V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3)+pulleyWheel(729,123,29,q*scale/31)+pulleyWheel(680,baseY-26,16,-q*scale/18)+trace(ip,P.blue)+weight(...I,c.inputMass,'input');
  z+=text(620,90,'fixed rope guides',P.muted,17)+text(310,472,`horizontal travel ${num(c.length)} m`,P.blue,20)+text(550,345,`rise ${num(c.height)} m`,P.orange,20)+handle(x+L,baseY,'length',.0015,'wedge length')+handle(x,baseY-H,'height',-.001,'wedge height','y');
  if(paths){const fn=u=>[baseX+u*scale,baseY-12];z+=trace(fn,P.blue)+text(275,498,'wedge travel = rope travel',P.blue,14);}
 } else if(c.type==='hydraulic'){
  const scale=Math.min(170/lim.max,170/(lim.max/R)),diam1=Math.min(66,160/Math.sqrt(R)),diam2=diam1*Math.sqrt(R),x1=250,x2=650,bottom=455,p1=230+q*scale,p2=400-q*scale/R,sz1=10*Math.sqrt(c.inputMass),sz2=10*Math.sqrt(c.outputMass),ip=u=>[x1,230+u*scale-sz1/2],op=u=>[x2,400-u*scale/R-sz2/2],I=ip(q),O=op(q);
  bodyScale=scale;
  z+=sectionLabels(250,650)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.line,22)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.water,16);
  z+=rect(x1-diam1/2,120,diam1,bottom-120,P.bg,P.line,3)+rect(x2-diam2/2,120,diam2,bottom-120,P.bg,P.line,3)+rect(x1-diam1/2+3,p1+8,diam1-6,bottom-p1-11,P.water,'transparent',0)+rect(x2-diam2/2+3,p2+8,diam2-6,bottom-p2-11,P.water,'transparent',0)+rect(x1-diam1/2,p1,diam1,9,P.metal,P.blue,1)+rect(x2-diam2/2,p2,diam2,9,P.metal,P.orange,1);
  z+=trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input',{pan:false})+weight(...O,c.outputMass,'output',{pan:false})+text(115,200,`area ${num(c.areaIn)}`,P.blue,20)+text(800,200,`area ${num(c.areaOut)}`,P.orange,20)+handle(x2+diam2/2+18,240,'areaOut',.05,'output piston area');
  z+=text(450,460,'water',P.muted,14)+text(450,515,'Same water volume moves between the two cylinders',P.muted,15);
 } else z+=text(450,265,'Select a machine',P.muted,22);
 const accelerationVectors={};
 for(const side of ['input','output']){
  const b=bodies[side];if(!b)continue;const a=Number(readout.acceleration)||0,v=Number(state?.v)||0;
  if(c.type==='lever'){const r=side==='input'?c.rIn:-c.rOut;accelerationVectors[side]=[r*(Math.sin(q)*a+Math.cos(q)*v*v),r*(Math.cos(q)*a-Math.sin(q)*v*v)];}
  else {const pa=Number(readout[side==='input'?'inputPathAcceleration':'outputPathAcceleration'])||(side==='input'||c.type==='ramp'?a:a/R);accelerationVectors[side]=[b.tangent[0]*pa,b.tangent[1]*pa];}
 }
 const accelerationScale=80/(Math.max(0,...Object.values(accelerationVectors).map(a=>Math.hypot(...a)))||1);
 let overlays='';
 for(const side of ['input','output']){
  const b=bodies[side];if(!b)continue;const col=side==='input'?P.blue:P.orange,mass=c[side==='input'?'inputMass':'outputMass'];
  if(forces){
   overlays+=forceVector(b.x+b.extent+25,b.y-20,0,1,mass*G,'W',col,c.type==='ramp'&&side==='input'&&b.x+b.extent+25<800?'start':null);
   if(side==='input')overlays+=forceVector(b.x-b.extent-28,b.y-30,0,1,c.force,'applied',P.blue,b.x-b.extent>180?'end':'start');
   if(c.type==='ramp'&&side==='input'&&!readout.atLimit)overlays+=forceVector(b.x-b.extent-24,b.y,0,-1,Math.max(0,Number(readout.inputTension)||0),'T',P.blue,'end');
  }
  if(options.accelerations){
   const [ax,ay]=accelerationVectors[side];
   const mag=Math.hypot(ax,ay),acol=dark?'#c4a4ff':'#7643b6';
   if(mag>1e-5){const length=mag*accelerationScale,start=[b.x,b.y-b.extent-35-Math.max(0,ay/mag*length)],end=[start[0]+ax/mag*length,start[1]+ay/mag*length],anchor=end[0]>730?'end':'start';overlays+=`<g pointer-events="none">${arrow(...start,...end,acol,3.5)}${text(clamp(end[0]+(anchor==='end'?-12:12),70,850),clamp(end[1]-8,78,510),`${c.type==='lever'?'a total':'a'} ${num(mag)} m/s²`,acol,17,anchor)}</g>`;}
  }
 }
 const pull=options.pull,b=pull&&bodies[pull.side];
 if(b&&Number.isFinite(pull.cursor?.x)&&Number.isFinite(pull.cursor?.y)){
  const col=pull.side==='input'?P.blue:P.orange,cursor=[clamp(pull.cursor.x,12,888),clamp(pull.cursor.y,12,528)],f=Number(pull.force)||0;
  overlays+=`<g pointer-events="none">${line(b.x,b.y,...cursor,col,2.2,'stroke-dasharray="5 5"')}${circle(...cursor,7,P.bg,col,2)}${forceVector(b.x,b.y,...b.tangent,f,'pull',col)}</g>`;
 }
 const grid=options.grid?`<defs><pattern id="scene-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${P.line}" stroke-width=".5" opacity=".15"/></pattern></defs><rect width="900" height="540" fill="url(#scene-grid)"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(c.type)} physics playground. Blue input mass ${num(c.inputMass)} kg; orange output mass ${num(c.outputMass)} kg. Drag a body to pull; use its handles to resize its mass." style="display:block;width:100%;height:100%;background:${P.bg};touch-action:none;user-select:none"><rect width="900" height="540" fill="${P.bg}"/>${grid}${z}${overlays}</svg>`;
}
