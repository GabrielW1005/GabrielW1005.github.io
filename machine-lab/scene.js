import { ratio, limits } from './physics.js?v=progress-v1';
import {displayValue} from './value-steps.js?v=progress-v1';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const num=n=>Number.isFinite(n)?Number(n.toPrecision(4)).toString():'0';
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
const TAU=Math.PI*2;
const gearCache=new Map();
const rampLayoutCache=new Map();
// Fit this ramp and its complete rope stroke, not every possible future height.
// The app retains this view while editing so height changes keep the same base.
function rampLayout(c,run){
 const physicalRun=Number(run.toFixed(10)),key=`${physicalRun}:${c.height}:${c.inputMass}:${c.outputMass}`;
 if(rampLayoutCache.has(key))return rampLayoutCache.get(key);
 const halfIn=5*Math.sqrt(c.inputMass),halfOut=5*Math.sqrt(c.outputMass),tx=physicalRun/c.length,sin=c.height/c.length,extent=halfOut*(tx+sin),pad=Math.max(45,150*tx),r=Math.max(23,(halfOut+halfIn+26-pad*tx)/(1+sin)),offset=-pad*sin+(r-halfOut-2)*tx;
 const minX=Math.min(0,-sin*(halfOut+2)-extent),tail=pad*tx+(r-halfOut-2)*sin;
 const maxTail=Math.max(0,-sin*(halfOut+2)+extent,tail+r,tail+r+halfIn);
 const widthScale=physicalRun>1e-9?(760-maxTail+minX)/physicalRun:2000;
 const lowY=Math.min(0,-tx*(halfOut+2)-extent,offset-r,offset+r+18);
 const highY=scale=>Math.max(0,-tx*(halfOut+2)+extent,(c.length-c.height)*scale+offset+r+2*halfIn+18);
 let lo=0,hi=Math.max(1,Math.min(2000,widthScale));
 for(let i=0;i<45;i++){const mid=(lo+hi)/2,span=highY(mid)+c.height*mid-lowY;if(span<=400)lo=mid;else hi=mid;}
 const scale=Math.max(5,lo*.98),width=physicalRun*scale+maxTail-minX,minY=-c.height*scale+lowY,maxY=highY(scale);
 const result={scale,x0:(900-width)/2-minX,baseY:64+(400-(maxY-minY))/2-minY};
 if(rampLayoutCache.size>128)rampLayoutCache.clear();rampLayoutCache.set(key,result);return result;
}

/** DOM-free comparison geometry, in the same 900 × 540 SVG coordinates. */
export function trajectoryGeometry(config,state,readout={}){
 const capture={};
 renderScene(config,state,readout,{paths:false,_trajectoryCapture:capture});
 return capture;
}

export function renderScene(c,state,readout={},options={}){
 const dark=!!options.dark, paths=options.paths!==false, forces=!!options.forces;
 const editable=key=>options.editableKey==null||options.editableKey===key;
 const P={bg:dark?'#111b2c':'#ffffff',ink:dark?'#e3eaf6':'#27364c',muted:dark?'#a1b1c8':'#66758a',line:dark?'#74859d':'#b8c3d2',fill:dark?'#28384f':'#e7edf5',metal:dark?'#445a77':'#ccd8e6',blue:dark?'#72afff':'#2563eb',orange:dark?'#ffb16f':'#c65b17',water:dark?'#1f6488':'#bfe6fa'};
 const q=Number(state?.q)||0,q0=Number(state?.q0)||0,lim=limits(c),R=ratio(c),G=10;
 const visibleForces=forces?[c.inputMass*G,c.outputMass*G,c.force,readout.dampingOutputForce,options.actuatorForce]:[];
 if(forces&&c.type==='ramp'&&!readout.atLimit)visibleForces.push(Math.max(0,Number(readout.inputTension)||0),c.outputMass*G*Math.sqrt(Math.max(0,1-(c.height/c.length)**2)));
 if(options.pull&&Number.isFinite(options.pull.cursor?.x)&&Number.isFinite(options.pull.cursor?.y))visibleForces.push(Number(options.pull.force)||0);
 const forceScale=80/(Math.max(0,...visibleForces.map(f=>Math.abs(Number(f)||0)))||1);
 const sAttr='font-family="system-ui,-apple-system,Segoe UI,sans-serif"';
 const bodies={},trajectories={},foregroundPaths=[],foregroundLabels=[],foregroundHandles=[];let bodyScale=1;
 const pathWidth=clamp(Number(options.pathWidth)||3,1,12);
 const line=(x1,y1,x2,y2,color=P.ink,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
 const path=(d,color=P.ink,w=2,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" ${extra}/>`;
 const circle=(x,y,r,fill=P.fill,stroke=P.ink,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
 const rect=(x,y,w,h,fill=P.fill,stroke=P.ink,r=5)=>`<rect x="${x}" y="${y}" width="${Math.max(0,w)}" height="${Math.max(0,h)}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
 const text=(x,y,str,color=P.ink,size=18,anchor='middle',extra='')=>{foregroundLabels.push(`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${sAttr} style="paint-order:stroke;stroke:${P.bg};stroke-width:3;stroke-linejoin:round" pointer-events="none" ${extra}>${esc(str)}</text>`);return '';};
 function arrow(x1,y1,x2,y2,col=P.ink,w=2.5){const a=Math.atan2(y2-y1,x2-x1),l=Math.min(8,Math.hypot(x2-x1,y2-y1)*.35);return line(x1,y1,x2,y2,col,w)+path(`M${x2-l*Math.cos(a-.45)},${y2-l*Math.sin(a-.45)} L${x2},${y2} L${x2-l*Math.cos(a+.45)},${y2-l*Math.sin(a+.45)}`,col,w);}
 function geometrySurface(markup,param,units,label,axis='x',extra=''){if(!editable(param))return extra?`<g ${extra}>${markup}</g>`:markup;return `<g data-drag="geometry" data-param="${param}" data-units-per-px="${units}" data-axis="${axis}" data-name="${esc(label)}" role="button" aria-label="Drag to change ${esc(label)}" tabindex="0" style="cursor:${axis==='y'?'ns':'ew'}-resize" ${extra}>${markup}</g>`;}
 function handle(x,y,param,units,label,axis='x'){if(!editable(param))return '';foregroundHandles.push(geometrySurface(`${circle(x,y,21,'transparent','transparent',0)}${circle(x,y,10,P.bg,P.muted,2)}${axis==='y'?path(`M${x-4},${y-3} L${x},${y-7} L${x+4},${y-3} M${x-4},${y+3} L${x},${y+7} L${x+4},${y+3}`,P.muted,1.6):path(`M${x-3},${y-4} L${x-7},${y} L${x-3},${y+4} M${x+3},${y-4} L${x+7},${y} L${x+3},${y+4}`,P.muted,1.6)}`,param,units,label,axis));return '';}
 function dim(x1,y1,x2,y2,label,col,tx=(x1+x2)/2,ty=(y1+y2)/2-10){return arrow(x1,y1,x2,y2,col,1.4)+arrow(x2,y2,x1,y1,col,1.4)+text(tx,ty,label,col,17);}
 function trace(fn,col,key){
  const samples=(a,b)=>Array.from({length:33},(_,i)=>fn(a+(b-a)*i/32)),points=samples(lim.min,lim.max),livePoints=samples(q0,q);
  if(key)trajectories[key]={points,livePoints,start:fn(q0),end:fn(q),current:fn(q),rangeStart:fn(lim.min),rangeEnd:fn(lim.max),pxPerMeter:bodyScale};
  if(paths){const d=pts=>pts.map((pt,i)=>`${i?'L':'M'}${pt[0]},${pt[1]}`).join(' ');foregroundPaths.push(path(d(points),col,pathWidth*.7,'opacity=".48" stroke-dasharray="5 7"')+path(d(livePoints),col,pathWidth,'opacity=".98"'));}
  if(key==='output'&&Number.isFinite(options.targetQ)){const pt=fn(clamp(options.targetQ,lim.min,lim.max)),anchor=pt[0]>700?'end':'start';foregroundPaths.push(circle(pt[0],pt[1],9,'none',P.orange,2)+line(pt[0]-18,pt[1],pt[0]+18,pt[1],P.orange,2));text(clamp(pt[0]+(anchor==='end'?-28:28),40,860),clamp(pt[1]-18,60,510),`target +${num(options.targetRise)} m`,P.orange,16,anchor);}
  return '';
 }
 // Body metadata always uses world SVG coordinates and meters along the actual
 // constrained path. Work-distance projections are intentionally separate.
 function weight(x,y,m,side,{ropeTop=null,angle=0,tangent=side==='input'?[0,1]:[0,-1],labelLeft=false}={}){
  const col=side==='input'?P.blue:P.orange,sz=10*Math.sqrt(Math.max(0,m)),half=sz/2,frame=Math.max(40,sz),edge=frame/2,extent=half*(Math.abs(Math.cos(angle))+Math.abs(Math.sin(angle))),fill=dark?(side==='input'?'#244c7e':'#744b2c'):(side==='input'?'#d8e8ff':'#fae1cb');
  bodies[side]={x,y,size:sz,pxPerMeter:bodyScale,tangent,angle,extent};
  let z='';if(ropeTop!==null)z+=line(x,ropeTop,x,y-half,P.ink,3);
  z+=`<g data-body="${side}" data-drop="${side}" data-side="${side}" data-body-center-x="${x}" data-body-center-y="${y}" data-scale="${bodyScale}" data-tangent-x="${tangent[0]}" data-tangent-y="${tangent[1]}" data-size="${sz}" data-angle="${angle}">`;
  z+=`<g data-drag="pull" data-side="${side}" data-name="${side} mass" role="button" aria-label="${side} mass ${num(m)} kilograms. Drag to pull${editable(side+'Mass')?'; resize with the handles':''}." tabindex="0" style="cursor:grab"><g transform="rotate(${angle*180/Math.PI} ${x} ${y})">${rect(x-edge-9,y-edge-9,frame+18,frame+18,'transparent','transparent',4)}${m>0?rect(x-half,y-half,sz,sz,fill,col,3):rect(x-edge,y-edge,frame,frame,'none',col,3)}</g>`;
  z+=text(labelLeft?x-extent-22:x,labelLeft?y+7:Math.min(526,y+extent+30),`${displayValue(m)} kg`,col,21,labelLeft?'end':'middle','font-weight="750"')+'</g>';
  let handles=`<g transform="rotate(${angle*180/Math.PI} ${x} ${y})">`;
  for(const [sx,sy,axis] of [[-1,-1,'xy'],[1,-1,'xy'],[-1,1,'xy'],[1,1,'xy'],[1,0,'x'],[0,1,'y']]){
   const hx=x+sx*edge,hy=y+sy*edge;
   handles+=`<g data-drag="resize" data-side="${side}" data-base-size="${sz}" data-axis="${axis}" data-signx="${sx}" data-signy="${sy}" data-angle="${angle}" data-name="${side} mass resize" role="button" aria-label="Resize ${side} mass" tabindex="0" style="cursor:${axis==='x'?'ew-resize':axis==='y'?'ns-resize':sx===sy?'nwse-resize':'nesw-resize'}">${circle(hx,hy,10,'transparent','transparent',0)}${rect(hx-3.5,hy-3.5,7,7,P.bg,col,1)}</g>`;
  }
  if(editable(side+'Mass'))foregroundHandles.push(handles+'</g>');return z+'</g>';
 }
 // Every visible force shares one scale, preserving relative magnitudes.
 function forceVector(x,y,dx,dy,magnitude,label,col,labelAnchor=null,labelDy=-8){
  const f=Number(magnitude),norm=Math.hypot(dx,dy);if(!Number.isFinite(f)||!f||!norm)return '';
  const length=Math.abs(f)*forceScale,sx=dx/norm*Math.sign(f),sy=dy/norm*Math.sign(f),ex=x+sx*length,ey=y+sy*length;
  const anchor=labelAnchor||(ex>740?'end':'start'),lx=anchor==='end'?ex-12:ex+12;
  return `<g pointer-events="none">${arrow(x,y,ex,ey,col,3)}${text(clamp(lx,35,865),clamp(ey+labelDy,70,513),`${label} ${num(Math.abs(f))} N`,col,17,anchor)}</g>`;
 }
 function pulleyWheel(x,y,r=18,angle=0){const w=Math.min(3,r*.2);return circle(x,y,r,P.fill,P.ink,w)+line(x-r*.7*Math.cos(angle),y-r*.7*Math.sin(angle),x+r*.7*Math.cos(angle),y+r*.7*Math.sin(angle),P.muted,w)+circle(x,y,Math.min(4,r*.28),P.ink,P.ink,Math.min(1,r*.1));}
 // Fixed guides keep large bodies apart without changing rope travel or MA.
 function routedRope(x,shaftY,side,bodyY,mass,scale){
  const input=side==='input',inner=input?230:670,outer=input?130:770,band=input?335:355,top=85,r=Math.min(12,Math.abs(inner-x)/3),dir=input?-1:1,col=input?P.blue:P.orange,travel=q*scale/(input?1:R),center=(inner+outer)/2;
  return path(`M${x},${shaftY} V${band-r} Q${x},${band} ${x+dir*r},${band} H${inner-dir*r} Q${inner},${band} ${inner},${band-r} V${top} A50,50 0 0 ${input?0:1} ${outer},${top} V${bodyY-5*Math.sqrt(mass)}`,col,2.6)+pulleyWheel(x+dir*r,band-r,r-2,travel/r)+pulleyWheel(inner-dir*r,band-r,r-2,travel/r)+pulleyWheel(center,top,48,-travel/50);
 }
 function gear(x,y,r,n,a,param){const key=`${r}:${n}`;let pts=gearCache.get(key);if(!pts){pts=Array.from({length:n*4},(_,i)=>{const th=i*TAU/(n*4),rr=r+(i%4===1||i%4===2?3:-3);return `${rr*Math.cos(th)},${rr*Math.sin(th)}`;}).join(' ');if(gearCache.size>64)gearCache.clear();gearCache.set(key,pts);}return geometrySurface(`<g data-gear="${param==='teethIn'?'input':'output'}" data-teeth="${n}" data-center-x="${x}" data-center-y="${y}" data-pitch-radius="${r}"><polygon points="${pts}" transform="translate(${x} ${y}) rotate(${a*180/Math.PI})" fill="${P.fill}" stroke="${P.ink}" stroke-width="2"/></g>`+circle(x,y,r,'none','transparent',24),param,.5,param==='teethIn'?'input gear teeth':'output gear teeth');}
 function base(y=470,x1=90,x2=810){return line(x1,y,x2,y,P.line,3);}
 function sectionLabels(ix,ox){return text(ix,47,'INPUT',P.blue,15,'middle','font-weight="750" letter-spacing="2"')+text(ox,47,'OUTPUT',P.orange,15,'middle','font-weight="750" letter-spacing="2"');}
 let z='';
 if(c.type==='lever'){
  const scale=Math.min(590/(c.rIn+c.rOut),105/(Math.max(c.rIn,c.rOut)*Math.sin(.35))),cx=150+c.rIn*scale,cy=200,hangIn=Math.max(52,5*Math.sqrt(c.inputMass)+22),hangOut=Math.max(52,5*Math.sqrt(c.outputMass)+22);
  bodyScale=scale;
  const ip=a=>[cx-c.rIn*scale*Math.cos(a),cy+c.rIn*scale*Math.sin(a)+hangIn],op=a=>[cx+c.rOut*scale*Math.cos(a),cy-c.rOut*scale*Math.sin(a)+hangOut];
  const I=ip(q),O=op(q),ib=[I[0],I[1]-hangIn],ob=[O[0],O[1]-hangOut];
  z+=sectionLabels(185,715)+base(455)+`<path d="M${cx},${cy+5} L${cx-44},455 H${cx+44} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+circle(cx,cy,12,P.bg,P.ink,3);
  z+=trace(ip,P.blue,'input')+trace(op,P.orange,'output')+line(...ib,...ob,P.metal,15,'stroke-linecap="round"')+line(ib[0],ib[1],I[0],I[1]-5*Math.sqrt(c.inputMass),P.ink,3)+line(ob[0],ob[1],O[0],O[1]-5*Math.sqrt(c.outputMass),P.ink,3);
  z+=weight(...I,c.inputMass,'input',{tangent:[Math.sin(q),Math.cos(q)]})+weight(...O,c.outputMass,'output',{tangent:[-Math.sin(q),-Math.cos(q)]});
  z+=text((ib[0]+cx)/2,117,`${num(c.rIn)} m`,P.blue,21)+text((ob[0]+cx)/2,117,`${num(c.rOut)} m`,P.orange,21)+handle(ib[0],ib[1]-18,'rIn',-1/scale,'input arm')+handle(ob[0],ob[1]-18,'rOut',1/scale,'output arm');
  z+=text(cx,483,'fulcrum',P.muted,14);
  if(paths){const a=ip(lim.min),b=ip(lim.max),d=op(lim.min),e=op(lim.max);z+=dim(105,a[1],105,b[1],'vertical d₁',P.blue,100,(a[1]+b[1])/2-20)+dim(795,d[1],795,e[1],'vertical d₂',P.orange,795,(d[1]+e[1])/2-20);}
 } else if(c.type==='ramp'){
  const runMeters=Math.sqrt(Math.max(0,c.length*c.length-c.height*c.height)),angle=Math.atan2(c.height,runMeters),tx=Math.cos(angle),ty=-Math.sin(angle),nx=-Math.sin(angle),ny=-Math.cos(angle),loadHalf=5*Math.sqrt(c.outputMass),inputHalf=5*Math.sqrt(c.inputMass),pad=Math.max(45,150*tx),r=Math.max(23,(loadHalf+inputHalf+26-pad*tx)/(1-ty)),layout=options.rampView&&Number(options.rampView.scale)>0?options.rampView:rampLayout(c,runMeters);
  // A single top guide redirects the sloping rope into a vertical hanging end.
  // Its entry and exit are exact circle tangents, so rope length stays fixed.
  const scale=Number(options.rampScale)>0?Number(options.rampScale):layout.scale,run=runMeters*scale,rise=c.height*scale,x0=layout.x0,y0=layout.baseY;
  bodyScale=scale;
  const point=u=>[x0+u*scale*tx+nx*(loadHalf+2),y0+u*scale*ty+ny*(loadHalf+2)],B=point(q),contact=point(c.length+pad/scale),guide=[contact[0]-r*nx,contact[1]-r*ny],inputX=guide[0]+r,wi=u=>[inputX,guide[1]+r+inputHalf+18+u*scale],I=wi(q),inputTop=I[1]-inputHalf;
  const arcLength=r*(Math.PI/2+angle),ropeLength=(c.length-q)*scale+pad+arcLength+inputTop-guide[1];
  z+=sectionLabels(inputX,x0+run/2)+base(y0+18,80,x0+run+25)+geometrySurface(`<path d="M${x0},${y0} h${run} v${-rise} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+line(x0,y0,x0+run,y0-rise,'transparent',26)+line(x0,y0,x0+run,y0-rise,P.metal,6),'height',-1/scale,'ramp height','y');
  const runMetadata=`data-geo="rampRun" data-run="${runMeters}" data-height="${c.height}" data-scale="${scale}" data-base-x="${x0}" data-base-y="${y0}"`;
  z+=geometrySurface(line(x0,y0,x0+Math.max(60,run),y0,'transparent',24)+line(x0,y0,x0+run,y0,P.line,3),'rampRun',1/scale,'horizontal ramp run','x',runMetadata);
  const rope=`M${B[0]},${B[1]} L${contact[0]},${contact[1]} A${r},${r} 0 0 1 ${inputX},${guide[1]} V${inputTop}`;
  z+=`<g data-ramp-rope="single-guide" data-rope-length="${ropeLength/scale}" data-ramp-scale="${scale}" data-entry-x="${contact[0]}" data-entry-y="${contact[1]}" data-guide-x="${guide[0]}" data-guide-y="${guide[1]}" data-guide-radius="${r}">`+path(rope,P.ink,3)+`<g data-ramp-guide="fixed">`+pulleyWheel(...guide,r*.96,q*scale/r)+'</g></g>';
  z+=trace(wi,P.blue,'input')+trace(point,P.orange,'output')+weight(...B,c.outputMass,'output',{angle:-angle,tangent:[tx,ty]})+weight(...I,c.inputMass,'input');
  z+=text(Math.min(810,inputX+65),guide[1]+8,'fixed pulley',P.muted,16)+text(230,21,c.height===c.length?'vertical lift':`slope ${num(c.length)} m`,P.ink,19)+text(650,21,`height ${num(c.height)} m`,P.orange,19);
  const footX=x0+run,gripX=footX+29,gripY=y0+22;
  if(editable('rampRun')){const baseGrip=line(footX,y0,gripX,gripY,P.blue,1.7)+rect(gripX-24,gripY-15,48,30,P.bg,P.blue,8)+arrow(gripX-15,gripY,gripX+15,gripY,P.blue,2)+arrow(gripX+15,gripY,gripX-15,gripY,P.blue,2);foregroundHandles.push(geometrySurface(baseGrip,'rampRun',1/scale,'horizontal ramp run','x',runMetadata));z+=text(gripX+8,gripY+39,'extend base',P.blue,14);}
  z+=handle(x0+run,y0-rise,'height',-1/scale,'ramp height','y');
  if(paths){z+=text(Math.min(845,inputX+75),Math.min(445,I[1]+55),'rope d₁',P.blue,17)+text(450,514,'Box path = rope travel · output work uses vertical rise',P.muted,17)+dim(x0+run+28,y0,x0+run+28,y0-rise,'',P.orange);}
  if(forces&&!readout.atLimit){const T=Math.max(0,Number(readout.inputTension)||0),N=c.outputMass*G*Math.sqrt(Math.max(0,1-(c.height/c.length)**2));z+=forceVector(B[0]+nx*(loadHalf+16),B[1]+ny*(loadHalf+16),tx,ty,T,'T',P.orange)+forceVector(B[0],B[1],nx,ny,N,'N',P.muted);}
 } else if(c.type==='pulley'){
  const n=[1,2,4,6].includes(c.strands)?c.strands:2,radius=c.pulleyRadius||.18,top=125,anchorY=36,inputX=730,outputX=340,lowerBase=275;
  // One scale applies to both rope travel and real sheave radii. Its bounds
  // reserve room for the whole six-strand tackle and 200 kg square bodies.
  const scale=Math.min(170/lim.max,193/(radius+lim.max),n===1?94/radius:126/(2*radius+lim.max/n),n===1?Infinity:378/((n+3)*radius),n===1?Infinity:245/((n-1)*radius)),r=radius*scale,inputHalf=5*Math.sqrt(c.inputMass),outputHalf=5*Math.sqrt(c.outputMass);
  bodyScale=scale;
  const inputRest=top+r+12+inputHalf,outputRest=n===1?top+r+12+outputHalf+lim.max*scale:lowerBase+r+24+outputHalf;
  const ip=u=>[inputX,inputRest+u*scale],op=u=>[outputX,outputRest-u*scale/n],I=ip(q),O=op(q),inputTop=I[1]-inputHalf,outputTop=O[1]-outputHalf;
  z+=sectionLabels(inputX,outputX)+rect(85,24,705,12,P.metal,P.line,3)+text(490,47,`radius ${num(radius)} m`,P.muted,17);
  let rope='',wheels='',radiusGrab,ropeLength=0,supports='';
  const sheave=(x,y,angle,moving=false)=>`<g data-sheave="${moving?'moving':'fixed'}" data-center-x="${x}" data-center-y="${y}" data-contact-radius="${r}">${pulleyWheel(x,y,r*.96,angle)}</g>`;
  const support=(index,x,y1,y2)=>{
   const mid=(y1+y2)/2;
   supports+=`<line data-support-strand="${index}" x1="${x}" y1="${y1}" x2="${x}" y2="${y2}" stroke="none"/>`+circle(x,mid,10,P.bg,P.orange,1.2);
   text(x,mid+5,String(index),P.orange,14);
  };
  if(n===1){
   const left=[outputX+r,top],right=[inputX-r,top];radiusGrab=left;
   rope=`M${outputX},${outputTop} V${top} A${r},${r} 0 0 1 ${left[0]},${top-r} H${right[0]} A${r},${r} 0 0 1 ${inputX},${top} V${inputTop}`;
   for(const C of [left,right])wheels+=line(C[0],anchorY,C[0],top,P.line,2)+sheave(...C,q*scale/r);
   support(1,outputX,top,outputTop);
   ropeLength=outputTop+inputTop-2*top+Math.PI*r+inputX-outputX-2*r;
  } else {
   const count=n/2,spacing=4*r,first=outputX-(count-1)*spacing/2,my=lowerBase-q*scale/n;
   rope=`M${first-r},${anchorY} V${my}`;z+=circle(first-r,anchorY,4,P.ink,P.ink,1);
   for(let j=0;j<count;j++){
    const x=first+j*spacing;
    rope+=` A${r},${r} 0 0 0 ${x+r},${my} V${top}`;
    wheels+=line(x,my,x,my+r+12,P.line,2)+sheave(x,my,-(2*j+1)*q*scale/(n*r),true);
    support(2*j+1,x-r,j===0?anchorY:top,my);support(2*j+2,x+r,top,my);
    if(j<count-1){
     const fixed=[x+2*r,top];if(j===0)radiusGrab=fixed;
     rope+=` A${r},${r} 0 0 1 ${x+3*r},${top} V${my}`;
     wheels+=line(fixed[0],anchorY,fixed[0],top,P.line,2)+sheave(...fixed,2*(j+1)*q*scale/(n*r));
    } else {
     const left=[x+2*r,top],right=[inputX-r,top];if(!radiusGrab)radiusGrab=left;
     rope+=` A${r},${r} 0 0 1 ${left[0]},${top-r} H${right[0]} A${r},${r} 0 0 1 ${inputX},${top} V${inputTop}`;
     for(const C of [left,right])wheels+=line(C[0],anchorY,C[0],top,P.line,2)+sheave(...C,q*scale/r);
     ropeLength=n*my+inputTop-anchorY-n*top+n*Math.PI*r+inputX-x-3*r;
    }
   }
   const barY=my+r+12;
   z+=line(first-r-8,barY,first+(count-1)*spacing+r+8,barY,P.metal,6)+line(outputX,barY,outputX,outputTop,P.ink,2.5);
   z+=text(first-r-18,barY+5,`${count} moving`,P.muted,16,'end');
  }
  z+=`<g data-pulley-assembly="${n}" data-rope-length="${ropeLength/scale}" data-radius-px="${r}" data-pulley-scale="${scale}">`+path(rope,P.ink,2.6)+wheels+supports+'</g>'+trace(ip,P.blue,'input')+trace(op,P.orange,'output')+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');
  if(editable('pulleyRadius'))foregroundHandles.push(geometrySurface(circle(...radiusGrab,Math.max(24,r+10),'transparent','transparent',0),'pulleyRadius',1/scale,'pulley radius'));
  z+=handle(radiusGrab[0]+r+17,top,'pulleyRadius',1/scale,'pulley radius');
  z+=text(450,501,n===1?'1 numbered strand supports the load':`${n} numbered strands support the moving block`,P.muted,17);
 } else if(c.type==='wheel'){
  const scale=Math.min(112/Math.max(c.rIn,c.rOut),165/lim.max,165/(lim.max/R)),ri=c.rIn*scale,ro=c.rOut*scale,cx=450,cy=190,theta=-q/c.rIn;
  bodyScale=scale;
  const ip=u=>[130,245+u*scale],op=u=>[770,410-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(100,800)+circle(cx,cy,Math.max(ri,ro),P.fill,P.ink,4)+circle(cx,cy,Math.min(ri,ro),P.metal,P.ink,3);
  for(let k=0;k<6;k++){const a=theta+k*TAU/6;z+=line(cx+Math.min(ri,ro)*Math.cos(a),cy+Math.min(ri,ro)*Math.sin(a),cx+Math.max(ri,ro)*Math.cos(a),cy+Math.max(ri,ro)*Math.sin(a),P.line,3);}
  z+=circle(cx,cy,7,P.ink,P.ink)+routedRope(cx-ri,cy,'input',I[1],c.inputMass,scale)+routedRope(cx+ro,cy,'output',O[1],c.outputMass,scale)+trace(ip,P.blue,'input')+trace(op,P.orange,'output')+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');
  const fi=u=>[cx+ri*Math.cos(-u/c.rIn),cy+ri*Math.sin(-u/c.rIn)],fo=u=>[cx+ro*Math.cos(-u/c.rIn),cy+ro*Math.sin(-u/c.rIn)];
  z+=trace(fi,P.blue,'input-rim')+trace(fo,P.orange,'output-rim')+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1);
  z+=text(450,437,`input radius ${num(c.rIn)} m`,P.blue,20)+text(450,466,`output radius ${num(c.rOut)} m`,P.orange,20)+handle(cx-ri,cy-14,'rIn',-.002,'input radius')+handle(cx+ro,cy+16,'rOut',.002,'output radius');
  z+=text(450,531,paths?'Rim arcs = rope travel · fixed guides only redirect':'Wheel and axle rotate together.',P.muted,17);
 } else if(c.type==='gearArms'){
  // Both bars point left and sit in front of the gear faces. Opposite gear
  // rotations then move the two secured loads in opposite vertical directions.
  const k=c.teethIn/c.teethOut,toothModule=180/(c.teethIn+c.teethOut),r1=c.teethIn*toothModule,r2=c.teethOut*toothModule,c1=[510-r2,270],c2=[510+r1,270],halfIn=5*Math.sqrt(c.inputMass),halfOut=5*Math.sqrt(c.outputMass),armDifference=Math.max(0,c.rOut-c.rIn*Math.cos(lim.max)),scale=Math.min(95/Math.max(c.rIn,c.rOut),armDifference>0?Math.max(12,180-halfIn-halfOut-26)/armDifference:Infinity);
  bodyScale=scale;
  const ip=u=>[c1[0]-c.rIn*scale*Math.cos(u),c1[1]+c.rIn*scale*Math.sin(u)],op=u=>[c2[0]-c.rOut*scale*Math.cos(k*u),c2[1]-c.rOut*scale*Math.sin(k*u)],I=ip(q),O=op(q);
  z+=sectionLabels(c1[0]-75,c2[0]+75)+line(c1[0],270,c1[0],450,P.line,8)+line(c2[0],270,c2[0],450,P.line,8)+base(450,c1[0]-35,c2[0]+35);
  z+=gear(...c1,r1,c.teethIn,-q,'teethIn')+gear(...c2,r2,c.teethOut,k*q+Math.PI/c.teethOut,'teethOut');
  z+=line(...c1,...I,P.bg,18,'stroke-linecap="round"')+line(...c2,...O,P.bg,18,'stroke-linecap="round"')+line(...c1,...I,P.blue,10,'stroke-linecap="round"')+line(...c2,...O,P.orange,10,'stroke-linecap="round"')+circle(...c1,9,P.bg,P.blue,3)+circle(...c2,9,P.bg,P.orange,3);
  z+=trace(ip,P.blue,'input')+trace(op,P.orange,'output');
  z+=weight(...I,c.inputMass,'input',{tangent:[Math.sin(q),Math.cos(q)]})+weight(...O,c.outputMass,'output',{tangent:[Math.sin(k*q),-Math.cos(k*q)]});
  z+=text(c1[0],c1[1]-r1-22,`${c.teethIn} teeth`,P.blue,21)+text(c2[0],c2[1]-r2-22,`${c.teethOut} teeth`,P.orange,21)+text(c1[0]-50,410,`${num(c.rIn)} m arm`,P.blue,20)+text(c2[0]+50,410,`${num(c.rOut)} m arm`,P.orange,20);
  z+=handle(c2[0]+r2+16,c2[1],'teethOut',.5,'output gear teeth')+text(450,486,'Bars are fixed to the axles, in front of the gears',P.muted,18)+text(450,518,'Both bars point left. Test balance while horizontal.',P.muted,18);
 } else if(c.type==='gears'){
  const scale=Math.min(170/lim.max,170/(lim.max/R),70/Math.max(c.crankRadius,c.drumRadius)),module=Math.min(1.7,115/Math.max(c.teethIn,c.teethOut)),r1=c.teethIn*module,r2=c.teethOut*module,c1=[440-r2,185],c2=[440+r1,185],rh=c.crankRadius*scale,rd=c.drumRadius*scale,a1=-q/c.crankRadius,a2=q/c.crankRadius*c.teethIn/c.teethOut;
  bodyScale=scale;

  const ip=u=>[130,245+u*scale],op=u=>[770,410-u*scale/R],I=ip(q),O=op(q);
  z+=sectionLabels(100,800)+gear(...c1,r1,c.teethIn,a1,'teethIn')+gear(...c2,r2,c.teethOut,a2+Math.PI/c.teethOut,'teethOut')+circle(...c1,rh,'none',P.blue,3)+circle(...c2,rd,P.metal,P.orange,3);
  const fi=u=>[c1[0]+rh*Math.cos(-u/c.crankRadius),c1[1]+rh*Math.sin(-u/c.crankRadius)],fo=u=>[c2[0]+rd*Math.cos(u/c.crankRadius*c.teethIn/c.teethOut),c2[1]+rd*Math.sin(u/c.crankRadius*c.teethIn/c.teethOut)];
  z+=trace(fi,P.blue,'input-rim')+trace(fo,P.orange,'output-rim')+line(...c1,...fi(q),P.blue,4)+line(...c2,...fo(q),P.orange,4)+circle(...fi(q),5,P.blue,P.bg,1)+circle(...fo(q),5,P.orange,P.bg,1)+routedRope(c1[0]-rh,c1[1],'input',I[1],c.inputMass,scale)+routedRope(c2[0]-rd,c2[1],'output',O[1],c.outputMass,scale)+trace(ip,P.blue,'input')+trace(op,P.orange,'output')+weight(...I,c.inputMass,'input')+weight(...O,c.outputMass,'output');
  z+=text(c1[0],c1[1]-r1-22,`${c.teethIn} teeth`,P.blue,20)+text(c2[0],c2[1]-r2-22,`${c.teethOut} teeth`,P.orange,20)+handle(c2[0]+r2+15,c2[1],'teethOut',.5,'output gear teeth')+text(450,452,`Equal fixed drums: r = ${num(c.crankRadius)} m`,P.muted,19);
  z+=text(450,531,'Gears turn oppositely · fixed guides only redirect',P.muted,17);
 } else if(c.type==='screw'){
  // Rotation is a true top view, while weight travel and screw are shown in side view.
  const scale=Math.min(170/lim.max,170/(lim.max/R)),cr=c.handleRadius*scale,cx=225,cy=175,theta=-q/c.handleRadius,ip=u=>[440,240+u*scale],op=u=>[665,408-u*scale/R-5*Math.sqrt(c.outputMass)],I=ip(q),O=op(q),baseY=465;
  bodyScale=scale;
  z+=sectionLabels(275,690)+circle(cx,cy,cr,P.fill,P.ink,3)+circle(cx,cy,10,P.metal,P.ink,2);
  const rim=u=>[cx+cr*Math.cos(-u/c.handleRadius),cy+cr*Math.sin(-u/c.handleRadius)];z+=trace(rim,P.blue,'input-rim')+line(cx,cy,...rim(q),P.blue,6)+circle(...rim(q),7,P.blue,P.bg,2);
  z+=text(cx,70,'drum / handle: top view',P.muted,17)+text(cx,cy+cr+32,`radius ${num(c.handleRadius)} m`,P.blue,20)+handle(cx+cr,cy,'handleRadius',.001,'handle radius');
  z+=path(`M${cx+cr+25},${cy} H418 A22,22 0 0 1 440,${cy+22} V${I[1]-5*Math.sqrt(c.inputMass)}`,P.ink,3,'stroke-dasharray="4 5"')+text(360,150,'rope via guide',P.muted,13)+trace(ip,P.blue,'input')+weight(...I,c.inputMass,'input');
  z+=rect(570,baseY,190,12,P.metal,P.line,2)+rect(657,118,16,baseY-118,P.metal,P.line,2)+line(575,128,575,baseY,P.line,5)+line(755,128,755,baseY,P.line,5);
  const pitchPx=Math.max(.7,c.lead*scale),phase=((q/c.handleRadius)/TAU)*pitchPx;
  z+=`<defs><pattern id="screw-thread" x="657" y="${125+phase%pitchPx}" width="16" height="${pitchPx}" patternUnits="userSpaceOnUse"><path d="M0,${pitchPx} L16,${pitchPx-7} M0,${pitchPx+7} L16,${pitchPx} M0,7 L16,0" fill="none" stroke="${P.muted}" stroke-width="1.5"/></pattern></defs><rect x="657" y="125" width="16" height="${baseY-132}" fill="url(#screw-thread)"/>`;
  z+=rect(576,O[1]+5*Math.sqrt(c.outputMass)+2,178,12,P.fill,P.orange,3)+trace(op,P.orange,'output')+weight(...O,c.outputMass,'output',{pan:false})+text(815,240,`lead ${num(c.lead)} m`,P.orange,20)+handle(815,290,'lead',-.001,'screw lead','y');
  z+=text(665,93,'guided platform: side view',P.muted,17)+text(450,532,'One revolution moves the platform by one lead',P.muted,17);
  if(paths)z+=text(215,345,'circular input path',P.blue,14)+text(790,365,'output rise',P.orange,14);
 } else if(c.type==='wedge'){
  const scale=Math.min(175/c.length,150/c.height),L=c.length*scale,H=c.height*scale,baseX=210,baseY=410,x=baseX+q*scale,loadx=baseX+L,top=baseY-q*scale/R,sz=10*Math.sqrt(c.outputMass),op=u=>[loadx,baseY-u*scale/R-24-sz/2],ip=u=>[760,240+u*scale],I=ip(q),O=op(q);
  bodyScale=scale;
  const guideHalf=Math.max(55,sz/2+15);
  z+=sectionLabels(750,400)+base(420)+`<path d="M${x-12},${baseY} V${baseY-H-12*H/L} L${x+L},${baseY} Z" fill="${P.fill}" stroke="${P.line}" stroke-width="2"/>`+line(loadx-guideHalf,150,loadx-guideHalf,415,P.line,4)+line(loadx+guideHalf,150,loadx+guideHalf,415,P.line,4)+text(loadx,132,'vertical guide',P.muted,17);
  z+=line(loadx,O[1]+sz/2,loadx,top-8*Math.sqrt(1+(H/L)**2)-8,P.ink,3)+circle(loadx,top-8*Math.sqrt(1+(H/L)**2),8,P.bg,P.ink,2)+weight(...O,c.outputMass,'output',{pan:false})+trace(op,P.orange,'output');
  z+=path(`M${x+L-10},${baseY-8} H680 Q698,${baseY-8} 698,${baseY-26} V123 A31,31 0 0 1 760,123 V${I[1]-5*Math.sqrt(c.inputMass)}`,P.ink,3)+pulleyWheel(729,123,29,q*scale/31)+pulleyWheel(680,baseY-26,16,-q*scale/18)+trace(ip,P.blue,'input')+weight(...I,c.inputMass,'input');
  z+=text(620,90,'fixed rope guides',P.muted,17)+text(310,472,`horizontal travel ${num(c.length)} m`,P.blue,20)+text(550,345,`rise ${num(c.height)} m`,P.orange,20)+handle(x+L,baseY,'length',.0015,'wedge length')+handle(x,baseY-H,'height',-.001,'wedge height','y');
  const wedgePath=u=>[baseX+u*scale,baseY-12];z+=trace(wedgePath,P.blue,'wedge-path');
  if(paths)z+=text(275,498,'wedge travel = rope travel',P.blue,14);
 } else if(c.type==='hydraulic'){
  // Circular bores: D = 2 sqrt(A / pi). One fixed cross-section scale makes
  // absolute area changes visible, including equal-ratio configurations.
  const scale=Math.min(170/lim.max,170/(lim.max/R)),diam1=36*Math.sqrt(c.areaIn),diam2=36*Math.sqrt(c.areaOut),x1=250,x2=650,bottom=455,p1=230+q*scale,p2=400-q*scale/R,sz1=10*Math.sqrt(c.inputMass),sz2=10*Math.sqrt(c.outputMass),ip=u=>[x1,230+u*scale-sz1/2],op=u=>[x2,400-u*scale/R-sz2/2],I=ip(q),O=op(q);
  bodyScale=scale;
  z+=sectionLabels(250,650)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.line,22)+path(`M${x1},${bottom} V470 H${x2} V${bottom}`,P.water,16);
  for(const [side,x,diam,area,piston,col] of [['input',x1,diam1,c.areaIn,p1,P.blue],['output',x2,diam2,c.areaOut,p2,P.orange]]){
   z+=`<g data-bore="${side}" data-area="${area}" data-diameter-px="${diam}" data-diameter-cm="${2*Math.sqrt(area/Math.PI)}">`+rect(x-diam/2,120,diam,bottom-120,P.bg,P.line,3)+rect(x-diam/2+3,piston+8,diam-6,bottom-piston-11,P.water,'transparent',0)+rect(x-diam/2,piston,diam,9,P.metal,col,1)+line(x-diam/2-10,120,x+diam/2+10,120,P.line,3)+'</g>';
   z+=handle(x+diam/2+18,240,side==='input'?'areaIn':'areaOut',.05,`${side} piston area`);
  }
  z+=trace(ip,P.blue,'input')+trace(op,P.orange,'output')+weight(...I,c.inputMass,'input',{pan:false})+weight(...O,c.outputMass,'output',{pan:false})+text(112,196,`${num(c.areaIn)} cm²`,P.blue,20)+text(810,196,`${num(c.areaOut)} cm²`,P.orange,20);
  z+=text(450,460,'water',P.muted,14)+text(450,506,'Circular bores: diameter ∝ √area',P.muted,17)+text(450,530,'Same water volume moves through both cylinders',P.muted,16);
 } else z+=text(450,265,'Select a machine',P.muted,22);
 if(options._trajectoryCapture){
  const data={viewBox:[0,0,900,540],input:null,output:null,extras:{}};
  for(const [key,shape] of Object.entries(trajectories)){
   const side=key.startsWith('output')?'output':'input',body=key==='input'||key==='output',angular=c.type==='lever'||c.type==='gearArms',k=c.type==='gearArms'?c.teethIn/c.teethOut:1,angleRate=side==='output'?k:1,jacobian=angular?(side==='input'?c.rIn:c.rOut*k):(side==='input'||c.type==='ramp'?1:1/R),J=body?jacobian:(side==='output'?1/R:1),delta=q-q0;
   const signedWorkDistance=body?(angular?(side==='input'?c.rIn:c.rOut)*(Math.sin(angleRate*q)-Math.sin(angleRate*q0)):delta/(side==='input'?1:R)):delta*J;
   const direction=key==='wedge-path'?[1,0]:(side==='input'?[0,1]:[0,-1]);
   const item={...shape,pathDistance:Math.abs(delta)*J,fullPathDistance:lim.range*J,workDistance:Math.abs(signedWorkDistance),signedWorkDistance,workDirection:direction,workPoints:body?[shape.start,[shape.start[0],shape.start[1]+direction[1]*signedWorkDistance*shape.pxPerMeter]]:shape.livePoints};
   if(body)data[side]=item;else data.extras[key]=item;
  }
  Object.assign(options._trajectoryCapture,data);
 }
 const accelerationVectors={};
 for(const side of ['input','output']){
  const b=bodies[side];if(!b)continue;const a=Number(readout.acceleration)||0,v=Number(state?.v)||0;
  if(c.type==='lever'||c.type==='gearArms'){const rate=c.type==='gearArms'&&side==='output'?c.teethIn/c.teethOut:1,theta=q*rate,omega=v*rate,alpha=a*rate,r=side==='input'?c.rIn:-c.rOut,xr=c.type==='gearArms'&&side==='output'?c.rOut:r;accelerationVectors[side]=[xr*(Math.sin(theta)*alpha+Math.cos(theta)*omega*omega),r*(Math.cos(theta)*alpha-Math.sin(theta)*omega*omega)];}
  else {const pa=Number(readout[side==='input'?'inputPathAcceleration':'outputPathAcceleration'])||(side==='input'||c.type==='ramp'?a:a/R);accelerationVectors[side]=[b.tangent[0]*pa,b.tangent[1]*pa];}
 }
 const accelerationScale=80/(Math.max(0,...Object.values(accelerationVectors).map(a=>Math.hypot(...a)))||1);
 let overlays='';
 for(const side of ['input','output']){
  const b=bodies[side];if(!b)continue;const col=side==='input'?P.blue:P.orange,mass=c[side==='input'?'inputMass':'outputMass'];
  if(forces){
   overlays+=forceVector(b.x+b.extent+25,b.y-20,0,1,mass*G,'W',col,c.type==='ramp'&&side==='input'&&b.x+b.extent+25<800?'start':null);
   if(side==='input')overlays+=forceVector(b.x-b.extent-28,b.y-30,0,1,c.force,'applied',P.blue,b.x-b.extent>180?'end':'start');
   if(side==='input')overlays+=forceVector(b.x-b.extent-50,b.y-20,...b.tangent,Number(options.actuatorForce)||0,'actuator',P.blue,b.x-b.extent>180?'end':'start',44);
   if(side==='output')overlays+=forceVector(b.x-b.extent-28,b.y+12,...b.tangent,Number(readout.dampingOutputForce)||0,'resistance',P.muted,b.x-b.extent>180?'end':'start');
   if(c.type==='ramp'&&side==='input'&&!readout.atLimit)overlays+=forceVector(b.x-b.extent-24,b.y,0,-1,Math.max(0,Number(readout.inputTension)||0),'T',P.blue,'end');
  }
  if(options.accelerations){
   const [ax,ay]=accelerationVectors[side];
   const mag=Math.hypot(ax,ay),acol=dark?'#c4a4ff':'#7643b6';
   if(mag>1e-5){const length=mag*accelerationScale,start=[b.x,b.y-b.extent-35-Math.max(0,ay/mag*length)],end=[start[0]+ax/mag*length,start[1]+ay/mag*length],anchor=end[0]>730?'end':'start';overlays+=`<g pointer-events="none">${arrow(...start,...end,acol,3.5)}${text(clamp(end[0]+(anchor==='end'?-12:12),70,850),clamp(Math.min(start[1],end[1])-18,78,510),`${c.type==='lever'||c.type==='gearArms'?'a total':'a'} ${num(mag)} m/s²`,acol,17,anchor)}</g>`;}
  }
 }
 const pull=options.pull,b=pull&&bodies[pull.side];
 if(b&&Number.isFinite(pull.cursor?.x)&&Number.isFinite(pull.cursor?.y)){
  const col=pull.side==='input'?P.blue:P.orange,cursor=[clamp(pull.cursor.x,12,888),clamp(pull.cursor.y,12,528)],f=Number(pull.force)||0;
  overlays+=`<g pointer-events="none">${line(b.x,b.y,...cursor,col,2.2,'stroke-dasharray="5 5"')}${circle(...cursor,7,P.bg,col,2)}${forceVector(b.x,b.y,...b.tangent,f,'pull',col)}</g>`;
 }
 const grid=options.grid?`<defs><pattern id="scene-grid" width="30" height="30" patternUnits="userSpaceOnUse"><path d="M30 0H0V30" fill="none" stroke="${P.line}" stroke-width=".5" opacity=".15"/></pattern></defs><rect width="900" height="540" fill="url(#scene-grid)"/>`:'';
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 900 540" role="img" aria-label="${esc(c.type)} physics playground. Blue input mass ${num(c.inputMass)} kg; orange output mass ${num(c.outputMass)} kg. Drag a body to pull; use its handles to resize its mass." style="display:block;width:100%;height:100%;background:${P.bg};touch-action:none;user-select:none"><rect width="900" height="540" fill="${P.bg}"/>${grid}${z}<g data-layer="trajectories" pointer-events="none">${foregroundPaths.join('')}</g>${overlays}<g data-layer="labels">${foregroundLabels.join('')}</g><g data-layer="handles">${foregroundHandles.join('')}</g></svg>`;
}
