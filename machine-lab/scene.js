import { ratio, limits } from './physics.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?Number(n.toPrecision(4)).toString():'0';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const TAU=Math.PI*2;

export function renderScene(c,state,readout={},options={}){
 const dark=!!options.dark, paths=options.paths!==false, forces=!!options.forces;
 const P={bg:dark?'#111b2c':'#ffffff',ink:dark?'#e3eaf6':'#27364c',muted:dark?'#a1b1c8':'#66758a',line:dark?'#74859d':'#b8c3d2',fill:dark?'#28384f':'#e7edf5',metal:dark?'#445a77':'#ccd8e6',blue:dark?'#72afff':'#2563eb',orange:dark?'#ffb16f':'#c65b17',water:dark?'#1f6488':'#bfe6fa'};
 const q=Number(state?.q)||0,q0=Number(state?.q0)||0,lim=limits(c),R=ratio(c),G=10;
 const sAttr='font-family="system-ui,-apple-system,Segoe UI,sans-serif"';
 const line=(x1,y1,x2,y2,color=P.ink,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
 const path=(d,color=P.ink,w=2,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const circle=(x,y,r,fill=P.fill,stroke=P.ink,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
 const rect=(x,y,w,h,fill=P.fill,stroke=P.ink,r=5)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
 const text=(x,y,str,color=P.ink,size=16,anchor='middle',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${sAttr} style="paint-order:stroke;stroke:${P.bg};stroke-width:3;stroke-linejoin:round" ${extra}>${esc(str)}</text>`;
 function arrow(x1,y1,x2,y2,col=P.ink,w=2.5){const a=Math.atan2(y2-y1,x2-x1),l=8;return line(x1,y1,x2,y2,col,w)+path(`M${x2-l*Math.cos(a-.45)},${y2-l*Math.sin(a-.45)} L${x2},${y2} L${x2-l*Math.cos(a+.45)},${y2-l*Math.sin(a+.45)}`,col,w);}
 function handle(x,y,param,units,label,axis='x'){return `<g data-drag="geometry" data-param="${param}" data-units-per-px="${units}" data-axis="${axis}" data-name="${esc(label)}" role="button" aria-label="Drag to change ${esc(label)}" tabindex="0" style="cursor:${axis==='y'?'ns':'ew'}-resize">${circle(x,y,21,'transparent','transparent',0)}${circle(x,y,10,P.bg,P.muted,2)}${axis==='y'?path(`M${x-4},${y-3} L${x},${y-7} L${x+4},${y-3} M${x-4},${y+3} L${x},${y+7} L${x+4},${y+3}`,P.muted,1.6):path(`M${x-3},${y-4} L${x-7},${y} L${x-3},${y+4} M${x+3},${y-4} L${x+7},${y} L${x+3},${y+4}`,P.muted,1.6)}</g>`;}
 function dim(x1,y1,x2,y2,label,col,tx=(x1+x2)/2,ty=(y1+y2)/2-10){return arrow(x1,y1,x2,y2,col,1.4)+arrow(x2,y2,x1,y1,col,1.4)+text(tx,ty,label,col,14);}
 function trace(fn,col){if(!paths)return '';const points=(a,b)=>Array.from({length:65},(_,i)=>{const pt=fn(a+(b-a)*i/64);return `${i?'L':'M'}${pt[0]},${pt[1]}`;}).join(' ');return path(points(lim.min,lim.max),col,2,'opacity=".38" stroke-dasharray="5 7"')+path(points(q0,q),col,3.4,'opacity=".9"');}
 function weight(x,y,m,side,{ropeTop=null,labelSide='center',pan=true}={}){
  const col=side==='input'?P.blue:P.orange,sz=10*Math.sqrt(Math.max(0,m)),half=sz/2,panW=Math.max(52,sz+15),body=m>0?rect(x-half,y-half,sz,sz,dark?(side==='input'?'#244c7e':'#744b2c'):(side==='input'?'#d8e8ff':'#fae1cb'),col,4):'';
  let z='';if(ropeTop!==null)z+=line(x,ropeTop,x,y-half-10,P.ink,3);
  z+=`<g data-drop="${side}" data-drag="mass" data-side="${side}" data-name="${side} mass" role="button" aria-label="${side} mass ${num(m)} kilograms. Drop a weight here." tabindex="0" style="cursor:grab">${rect(x-Math.max(50,half+20),y-Math.max(50,half+22),Math.max(100,sz+40),Math.max(118,sz+60),'transparent','transparent',4)}${body}`;
  if(pan){z+=line(x-panW/2,y+half+6,x+panW/2,y+half+6,col,4)+line(x-panW/2,y+half+6,x-8,y-half-8,col,1.4)+line(x+panW/2,y+half+6,x+8,y-half-8,col,1.4)+circle(x,y-half-10,5,P.bg,col,2);}
  z+=text(x,y+half+29,`${num(m)} kg`,col,17,'middle','font-weight="700"');
  if(forces&&m>0){z+=arrow(x+half+20,y-25,x+half+20,y+25,col)+text(x+half+31,y+4,`${num(m*G)} N`,col,13,'start');}
  z+='</g>';return z;
 }
 function applied(x,y){if(!forces||!c.force)return '';return arrow(x-60,y-45,x-60,y+12,P.blue,4)+text(x-70,y-53,`push ${num(c.force)} N`,P.blue,14,'end');}
 function pulleyWheel(x,y,r=18,angle=0){return circle(x,y,r,P.fill,P.ink,3)+line(x-r*.7*Math.cos(angle),y-r*.7*Math.sin(angle),x+r*.7*Math.cos(angle),y+r*.7*Math.sin(angle),P.muted,3)+circle(x,y,4,P.ink,P.ink,1);}
 function base(y=470,x1=90,x2=810){return line(x1,y,x2,y,P.line,3);}
 function sectionLabels(ix,ox){return text(ix,47,'INPUT',P.blue,15,'middle','font-weight="750" letter-spacing="2"')+text(ox,47,'OUTPUT',P.orange,15,'middle','font-weight="750" letter-spacing="2"');}
 let z='';
 if(c.type==='lever'){
  const scale=Math.min(590/(c.rIn+c.rOut),120/(Math.max(c.rIn,c.rOut)*Math.sin(.35))),cx=150+c.rIn*scale,cy=240;
  const ip=a=>[cx-c.rIn*scale*Math.cos(a),cy+c.rIn*scale*Math.sin(a)+52],op=a=>[cx+c.rOut*scale*Math.cos(a),cy-c.rOut*scale*Math.sin(a)+52];
  const I=ip(q),O=op(q),ib=[I[0],I[1]-52],ob=[O[0],O[1]-52];
  z+=sectionLabels(185,715)+base(455)+`<path d="M${cx},${cy+5} L${cx-44},455 H${cx+44} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+circle(cx,cy,12,P.bg,P.ink,3);
  z+=trace(ip,P.blue)+trace(op,P.orange)+line(...ib,...ob,P.metal,15,'stroke-linecap="round"')+line(ib[0],ib[1],I[0],I[1]-10*Math.sqrt(c.inputMass)/2-10,P.ink,3)+line(ob[0],ob[1],O[0],O[1]-10*Math.sqrt(c.outputMass)/2-10,P.ink,3);
  z+=weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output')+applied(...I);
  z+=text((ib[0]+cx)/2,153,`${num(c.rIn)} m`,P.blue,18)+text((ob[0]+cx)/2,153,`${num(c.rOut)} m`,P.orange,18)+handle(ib[0],ib[1]-18,'rIn',-1/scale,'input arm')+handle(ob[0],ob[1]-18,'rOut',1/scale,'output arm');
  z+=text(cx,483,'fulcrum',P.muted,14);
  if(paths){const a=ip(lim.min),b=ip(lim.max),d=op(lim.min),e=op(lim.max);z+=dim(105,a[1],105,b[1],'vertical d₁',P.blue,100,(a[1]+b[1])/2-20)+dim(795,d[1],795,e[1],'vertical d₂',P.orange,795,(d[1]+e[1])/2-20);}
 } else if(c.type==='ramp'){
  const scale=230/c.length,run=Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height))*scale,rise=c.height*scale,angle=Math.atan2(c.height,Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height))),nx=-Math.sin(angle),ny=-Math.cos(angle),x0=170,y0=413;
  const loadHalf=5*Math.sqrt(c.outputMass),point=u=>[x0+u*scale*Math.cos(angle)+nx*(loadHalf+2),y0-u*scale*Math.sin(angle)+ny*(loadHalf+2)];
  const B=point(q),guide=point(c.length+70/scale),upper=[650,100],wi=u=>[upper[0]+22,205+u*scale],I=wi(q);
  z+=sectionLabels(680,270)+base(420)+`<path d="M${x0},${y0} h${run} v${-rise} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`;
  z+=path(`M${B[0]},${B[1]} L${guide[0]},${guide[1]} L${upper[0]-22},${upper[1]} A22,22 0 0 1 ${upper[0]+22},${upper[1]} V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3);
  z+=pulleyWheel(...guide,16,-q*scale/16)+pulleyWheel(...upper,20,-q*scale/20)+trace(wi,P.blue)+trace(point,P.orange);
  // The box center moves parallel to the incline; the box rests on the slope.
  const sz=10*Math.sqrt(c.outputMass),contactY=-sz/2;
  z+=`<g transform="translate(${B[0]} ${B[1]}) rotate(${-angle*180/Math.PI})" data-drop="output" data-drag="mass" data-side="output" data-name="ramp load" role="button" aria-label="Output load ${num(c.outputMass)} kilograms" tabindex="0" style="cursor:grab">${rect(-55,-60,110,120,'transparent','transparent')}${rect(-sz/2,-sz/2,sz,sz,dark?'#744b2c':'#fae1cb',P.orange,4)}</g>`+text(B[0]-sz/2-14,B[1]+5,`${num(c.outputMass)} kg`,P.orange,17,'end','font-weight="700"');
  z+=weight(...I,c.inputMass,'input')+applied(...I);
  if(forces)z+=arrow(B[0]+52,B[1]-24,B[0]+52,B[1]+38,P.orange)+text(B[0]+65,B[1]+7,`${num(c.outputMass*G)} N`,P.orange,14,'start');
  z+=text(450,132,'fixed guide pulleys',P.muted,14)+text(x0+run/2,455,`ramp ${num(c.length)} m`,P.ink,17)+text(x0+run+80,y0-rise/2,`rise ${num(c.height)} m`,P.ink,16);
  z+=handle(x0+run,y0-rise,'length',.015,'ramp length')+handle(x0+run+30,y0-rise,'height',-.01,'ramp height','y');
  if(paths){z+=text(780,285,'input rope path d₁',P.blue,14)+text(x0+run/2,490,'Box path along slope = input rope travel',P.orange,13)+dim(x0+run+42,y0,x0+run+42,y0-rise,'',P.orange)+text(x0+run+70,y0-rise/2+25,'output work d₂',P.orange,13);}
 } else if(c.type==='pulley'){
  const scale=165/lim.max,n=c.strands>=2?2:1;
  z+=sectionLabels(650,300)+rect(215,74,475,15,P.metal,P.line,3);
  if(n===1){const cx=460,cy=130,r=30,ip=u=>[cx+r,235+u*scale],op=u=>[cx-r,410-u*scale],I=ip(q),O=op(q);z+=line(cx,89,cx,cy,P.ink,5)+path(`M${O[0]},${O[1]-10*Math.sqrt(c.outputMass)/2-10} V${cy} A${r},${r} 0 0 1 ${cx+r},${cy} V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3)+pulleyWheel(cx,cy,r-2,q*scale/r)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output')+applied(...I);z+=text(660,165,'one supporting strand',P.muted,15);}
  else {const r=45,movable=u=>[320,290-u*scale/2],ip=u=>[455,225+u*scale],op=u=>[320,440-u*scale/2],M=movable(q),I=ip(q),O=op(q);z+=circle(275,91,6,P.ink,P.ink)+path(`M275,91 V${M[1]} A${r},${r} 0 0 0 365,${M[1]} V130 A45,45 0 0 1 455,130 V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3)+pulleyWheel(320,M[1],43,-q*scale/90)+pulleyWheel(410,130,43,q*scale/45)+line(M[0],M[1]+8,O[0],O[1]-10*Math.sqrt(c.outputMass)/2-10,P.ink,4)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output')+applied(...I);z+=text(640,180,'2 supporting strands',P.muted,16)+text(410,71,'fixed',P.muted,13);}

  z+=text(450,498,n===1?'Fixed pulley · equal travel':'Movable pulley · pull twice the load distance',P.muted,16);
 } else if(c.type==='wheel'){
  const scale=Math.min(112/Math.max(c.rIn,c.rOut),165/lim.max,165/(lim.max/R)),ri=c.rIn*scale,ro=c.rOut*scale,cx=450,cy=190,theta=-q/c.rIn;
  const ip=u=>[cx-ri,255+u*scale],op=u=>[cx+ro,430-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(225,680)+circle(cx,cy,Math.max(ri,ro),P.fill,P.ink,4)+circle(cx,cy,Math.min(ri,ro),P.metal,P.ink,3);
  for(let k=0;k<6;k++){const a=theta+k*TAU/6;z+=line(cx+Math.min(ri,ro)*Math.cos(a),cy+Math.min(ri,ro)*Math.sin(a),cx+Math.max(ri,ro)*Math.cos(a),cy+Math.max(ri,ro)*Math.sin(a),P.line,3);}
  z+=circle(cx,cy,7,P.ink,P.ink)+line(cx-ri,cy,I[0],I[1]-10*Math.sqrt(c.inputMass)/2-10,P.blue,3)+line(cx+ro,cy,O[0],O[1]-10*Math.sqrt(c.outputMass)/2-10,P.orange,3)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output')+applied(...I);
  const fi=u=>[cx+ri*Math.cos(-u/c.rIn),cy+ri*Math.sin(-u/c.rIn)],fo=u=>[cx+ro*Math.cos(-u/c.rIn),cy+ro*Math.sin(-u/c.rIn)];
  z+=trace(fi,P.blue)+trace(fo,P.orange)+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1);
  z+=text(220,138,`input radius ${num(c.rIn)} m`,P.blue,17)+text(695,138,`output radius ${num(c.rOut)} m`,P.orange,17)+handle(cx-ri,cy-14,'rIn',-.002,'input radius')+handle(cx+ro,cy+16,'rOut',.002,'output radius');
  z+=text(450,506,paths?'Rim-point arcs and rope paths have matching lengths.':'Wheel and axle rotate together.',P.muted,15);
 } else if(c.type==='gears'){
  const scale=Math.min(170/lim.max,170/(lim.max/R),70/Math.max(c.crankRadius,c.drumRadius)),module=Math.min(1.7,115/Math.max(c.teethIn,c.teethOut)),r1=c.teethIn*module,r2=c.teethOut*module,c1=[440-r2,185],c2=[440+r1,185],rh=c.crankRadius*scale,rd=c.drumRadius*scale,a1=-q/c.crankRadius,a2=q/c.crankRadius*c.teethIn/c.teethOut;
  const gear=(x,y,r,n,a)=>{const pts=[];for(let i=0;i<n*4;i++){const th=a+i*TAU/(n*4),rr=r+(i%4===1||i%4===2?3:-3);pts.push(`${x+rr*Math.cos(th)},${y+rr*Math.sin(th)}`);}return `<polygon points="${pts.join(' ')}" fill="${P.fill}" stroke="${P.ink}" stroke-width="2"/>`;};
  const ip=u=>[c1[0]-rh,245+u*scale],op=u=>[c2[0]-rd,435-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(200,700)+gear(...c1,r1,c.teethIn,a1)+gear(...c2,r2,c.teethOut,a2+Math.PI/c.teethOut)+circle(...c1,rh,'none',P.blue,3)+circle(...c2,rd,P.metal,P.orange,3);
  const fi=u=>[c1[0]+rh*Math.cos(-u/c.crankRadius),c1[1]+rh*Math.sin(-u/c.crankRadius)],fo=u=>[c2[0]+rd*Math.cos(u/c.crankRadius*c.teethIn/c.teethOut),c2[1]+rd*Math.sin(u/c.crankRadius*c.teethIn/c.teethOut)];
  z+=trace(fi,P.blue)+trace(fo,P.orange)+line(...c1,...fi(q),P.blue,4)+line(...c2,...fo(q),P.orange,4)+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1)+line(I[0],c1[1],I[0],I[1]-10*Math.sqrt(c.inputMass)/2-10,P.blue,3)+line(O[0],c2[1],O[0],O[1]-10*Math.sqrt(c.outputMass)/2-10,P.orange,3)+trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output')+applied(...I);
  z+=text(c1[0],c1[1]-r1-22,`${c.teethIn} teeth`,P.blue,17)+text(c2[0],c2[1]-r2-22,`${c.teethOut} teeth`,P.orange,17)+handle(c2[0]+r2+15,c2[1],'teethOut',.5,'output gear teeth')+text(725,204,`input drum r = ${num(c.crankRadius)} m`,P.blue,14)+text(725,230,`output drum r = ${num(c.drumRadius)} m`,P.orange,14);
  z+=text(450,510,'Gears turn oppositely · compare the drum and rope paths',P.muted,15);
 } else if(c.type==='screw'){
  // Rotation is a true top view, while weight travel and screw are shown in side view.
  const scale=Math.min(170/lim.max,170/(lim.max/R)),cr=c.handleRadius*scale,cx=225,cy=175,theta=-q/c.handleRadius,ip=u=>[440,260+u*scale],op=u=>[665,385-u*scale/R],I=ip(q),O=op(q),baseY=465;
  z+=sectionLabels(275,690)+circle(cx,cy,cr,P.fill,P.ink,3)+circle(cx,cy,10,P.metal,P.ink,2);
  const rim=u=>[cx+cr*Math.cos(-u/c.handleRadius),cy+cr*Math.sin(-u/c.handleRadius)];z+=trace(rim,P.blue)+line(cx,cy,...rim(q),P.blue,6)+circle(...rim(q),7,P.blue,P.bg,2);
  z+=text(cx,70,'drum / handle: top view',P.muted,15)+text(cx,cy+cr+32,`radius ${num(c.handleRadius)} m`,P.blue,15)+handle(cx+cr,cy,'handleRadius',.001,'handle radius');
  z+=path(`M${cx+cr+25},${cy} H418 A22,22 0 0 1 440,${cy+22} V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3,'stroke-dasharray="4 5"')+text(360,150,'rope via guide',P.muted,13)+trace(ip,P.blue)+weight(...I,c.inputMass,'input')+applied(...I);
  z+=rect(590,baseY,150,12,P.metal,P.line,2)+rect(657,118,16,baseY-118,P.metal,P.line,2)+line(600,128,600,baseY,P.line,5)+line(730,128,730,baseY,P.line,5);
  const pitchPx=Math.max(.7,c.lead*scale),phase=((q/c.handleRadius)/TAU)*pitchPx;
  for(let yy=120-pitchPx;yy<baseY+pitchPx;yy+=pitchPx){const y=yy+phase%pitchPx;if(y>125&&y<baseY-7)z+=line(657,y,673,y-7,P.muted,1.5);}
  z+=rect(591,O[1]+10*Math.sqrt(c.outputMass)/2+2,148,12,P.fill,P.orange,3)+trace(op,P.orange)+weight(...O,c.outputMass,'output',{pan:false})+text(790,240,`lead ${num(c.lead)} m`,P.orange,15)+handle(770,290,'lead',-.001,'screw lead','y');
  z+=text(665,93,'guided platform: side view',P.muted,15)+text(450,515,'Linked views · one revolution moves the platform by one lead',P.muted,15);
  if(paths)z+=text(215,345,'circular input path',P.blue,14)+text(790,365,'output rise',P.orange,14);
 } else if(c.type==='wedge'){
  const scale=Math.min(175/c.length,150/c.height),L=c.length*scale,H=c.height*scale,baseX=210,baseY=410,x=baseX+q*scale,loadx=baseX+L,top=baseY-q*scale/R,sz=10*Math.sqrt(c.outputMass),op=u=>[loadx,baseY-u*scale/R-24-sz/2],ip=u=>[760,240+u*scale],I=ip(q),O=op(q);
  z+=sectionLabels(750,400)+base(420)+`<path d="M${x-12},${baseY} V${baseY-H-12*H/L} L${x+L},${baseY} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+line(loadx-55,150,loadx-55,415,P.line,4)+line(loadx+55,150,loadx+55,415,P.line,4)+text(loadx,132,'vertical guide',P.muted,14);
  z+=line(loadx,O[1]+sz/2,loadx,top-8*Math.sqrt(1+(H/L)**2)-8,P.ink,3)+circle(loadx,top-8*Math.sqrt(1+(H/L)**2),8,P.bg,P.ink,2)+weight(...O,c.outputMass,'output',{pan:false})+trace(op,P.orange);
  z+=path(`M${x+L-10},${baseY-8} H680 Q698,${baseY-8} 698,${baseY-26} V123 A31,31 0 0 1 760,123 V${I[1]-10*Math.sqrt(c.inputMass)/2-10}`,P.ink,3)+pulleyWheel(729,123,29,q*scale/31)+pulleyWheel(680,baseY-26,16,-q*scale/18)+trace(ip,P.blue)+weight(...I,c.inputMass,'input')+applied(...I);
  z+=text(620,90,'fixed rope guides',P.muted,14)+text(310,472,`horizontal travel ${num(c.length)} m`,P.blue,16)+text(530,345,`rise ${num(c.height)} m`,P.orange,16)+handle(x+L,baseY,'length',.0015,'wedge length')+handle(x,baseY-H,'height',-.001,'wedge height','y');
  if(paths){const fn=u=>[baseX+u*scale,baseY-12];z+=trace(fn,P.blue)+text(275,498,'wedge travel = rope travel',P.blue,14);}
 } else if(c.type==='hydraulic'){
  const scale=Math.min(170/lim.max,170/(lim.max/R)),diam1=Math.min(66,160/Math.sqrt(R)),diam2=diam1*Math.sqrt(R),x1=250,x2=650,bottom=455,p1=230+q*scale,p2=400-q*scale/R,sz1=10*Math.sqrt(c.inputMass),sz2=10*Math.sqrt(c.outputMass),ip=u=>[x1,230+u*scale-sz1/2],op=u=>[x2,400-u*scale/R-sz2/2],I=ip(q),O=op(q);
  z+=sectionLabels(250,650)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.line,22)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.water,16);
  z+=rect(x1-diam1/2,120,diam1,bottom-120,P.bg,P.line,3)+rect(x2-diam2/2,120,diam2,bottom-120,P.bg,P.line,3)+rect(x1-diam1/2+3,p1+8,diam1-6,bottom-p1-11,P.water,'transparent',0)+rect(x2-diam2/2+3,p2+8,diam2-6,bottom-p2-11,P.water,'transparent',0)+rect(x1-diam1/2,p1,diam1,9,P.metal,P.blue,1)+rect(x2-diam2/2,p2,diam2,9,P.metal,P.orange,1);
  z+=trace(ip,P.blue)+trace(op,P.orange)+weight(...I,c.inputMass,'input',{pan:false})+weight(...O,c.outputMass,'output',{pan:false})+applied(...I)+text(115,200,`area ${num(c.areaIn)}`,P.blue,16)+text(800,200,`area ${num(c.areaOut)}`,P.orange,16)+handle(x2+diam2/2+18,240,'areaOut',.05,'output piston area');
  z+=text(450,460,'water',P.muted,14)+text(450,515,'Same water volume moves between the two cylinders',P.muted,15);
 } else z+=text(450,265,'Select a machine',P.muted,22);
 const grid=options.grid?`<defs><pattern id="scene-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${P.line}" stroke-width=".5" opacity=".15"/></pattern></defs><rect width="900" height="540" fill="url(#scene-grid)"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(c.type)} physics playground. Blue input mass ${num(c.inputMass)} kg; orange output mass ${num(c.outputMass)} kg. Drag weights or geometry handles." style="display:block;width:100%;height:100%;background:${P.bg};touch-action:none;user-select:none"><rect width="900" height="540" fill="${P.bg}"/>${grid}${z}</svg>`;
}
