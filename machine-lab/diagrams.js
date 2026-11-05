/* Geometry-driven, ideal-machine diagrams. Distances are measured along each force. */
const C={in:'#2563eb',out:'#c65b17',ink:'#334155',muted:'#64748b',line:'#cbd5e1',fill:'#e2e8f0',water:'#b9def7'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number(n.toFixed(4)).toString();
const val=(p,k)=>p.unknown===k?'?':fmt(p[k]);
const ln=(x1,y1,x2,y2,color=C.ink,w=2,extra='')=>`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${w}" ${extra}/>`;
const txt=(x,y,s,color=C.ink,size=16,anchor='start',extra='')=>`<text x="${x}" y="${y}" fill="${color}" font-size="${size}" text-anchor="${anchor}" ${extra}>${esc(s)}</text>`;
const rect=(x,y,w,h,fill=C.fill,stroke=C.ink,r=5)=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${fill}" stroke="${stroke}" stroke-width="2"/>`;
const circle=(x,y,r,fill=C.fill,stroke=C.ink,w=2)=>`<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"/>`;
const path=(d,color=C.ink,w=2,extra='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round" ${extra}/>`;
const poly=points=>points.map(p=>p.join(',')).join(' ');
function arrow(x1,y1,x2,y2,color=C.ink,w=2.5){const a=Math.atan2(y2-y1,x2-x1),l=8;return ln(x1,y1,x2,y2,color,w)+`<path d="M${x2-l*Math.cos(a-.45)},${y2-l*Math.sin(a-.45)} L${x2},${y2} L${x2-l*Math.cos(a+.45)},${y2-l*Math.sin(a+.45)}" stroke="${color}" stroke-width="${w}" fill="none"/>`;}
function dim(x1,y1,x2,y2,label,color,tx,ty,anchor='middle'){return arrow(x1,y1,x2,y2,color,1.7)+arrow(x2,y2,x1,y1,color,1.7)+txt(tx??(x1+x2)/2,ty??(y1+y2)/2-10,label,color,14,anchor);}
function curve(fn,end=1,steps=80){return Array.from({length:steps+1},(_,i)=>{const [x,y]=fn(end*i/steps);return `${i?'L':'M'}${x.toFixed(3)},${y.toFixed(3)}`;}).join(' ');}
function trail(fn,t,col,on){if(!on)return '';return path(curve(fn),col,2,'stroke-dasharray="6 6" opacity=".42"')+(t>0?path(curve(fn,t),col,3.5):'');}
function block(x,y,w=62,h=40){return rect(x-w/2,y-h,w,h,'#f6e8da',C.out)+ln(x-w/2+8,y-h+10,x+w/2-8,y-h+10,'#e2ba92',1.5);}
function footer(p){return txt(28,354,`d₁ = ${val(p,'d1')} m`,C.in,17)+txt(692,354,`d₂ = ${val(p,'d2')} m`,C.out,17,'end');}
function lever(p,t,tr){
 const s=440/(p.r1+p.r2),cx=140+p.r1*s,cy=172;
 const get=(r,u,side)=>{const a=Math.asin(Math.min(.8,u*p.d1/p.r1));return [cx+side*r*s*Math.cos(a),cy-side*r*s*Math.sin(a)];};
 const i=u=>get(p.r1,u,-1),o=u=>get(p.r2,u,1),[ix,iy]=i(t),[ox,oy]=o(t),[ix0]=i(0),[ox0]=o(0),[ix1,iy1]=i(1),[ox1,oy1]=o(1);
 let z=ln(cx-45,242,cx+45,242,C.line,2)+`<path d="M${cx},${cy+9} l-29,61 h58 Z" fill="#cbd5e1" stroke="${C.ink}" stroke-width="2"/>`+circle(cx,cy,9,'#fff');
 if(tr){z+=ln(ix0,cy,ix1-22,cy,C.line,1,'stroke-dasharray="3 4"')+ln(ox0,cy,ox1+28,cy,C.line,1,'stroke-dasharray="3 4"');
 z+=trail(i,t,C.in,true)+trail(o,t,C.out,true);
 z+=dim(93,cy,93,iy1,'',C.in)+txt(77,(cy+iy1)/2+5,'d₁',C.in,16,'end');
 z+=dim(632,cy,632,oy1,'',C.out)+txt(650,(cy+oy1)/2+5,'d₂',C.out,16);
 }
 z+=ln(ix,iy,ox,oy,C.ink,12,'stroke-linecap="round"')+block(ox,oy-7,54,40)+circle(ix,iy,6,C.in,'#fff')+circle(ox,oy,6,C.out,'#fff');
 z+=arrow(ix,iy-74,ix,iy-13,C.in)+arrow(ox+42,oy+58,ox+42,oy+3,C.out);
 z+=txt(cx,256,'fulcrum',C.muted,14,'middle');
 if(p.type==='seesaw'){
  z+=arrow(ox,oy-92,ox,oy-53,C.muted)+txt(ox+9,oy-77,`${fmt(p.F2)} N weight`,C.muted,13);
  z+=txt(360,318,t===0?'Balanced at rest: no motion, no work.':'Slow imagined tilt: equal input and output work.',C.ink,15,'middle');
 }else z+=txt(360,318,'Vertical arrows measure work distance; dashed curves show the path.',C.muted,14,'middle');
 z+=txt((ix0+cx)/2,276,`${fmt(p.r1)} m arm`,C.muted,14,'middle')+txt((ox0+cx)/2,276,`${fmt(p.r2)} m arm`,C.muted,14,'middle');
 return z;
}
function ramp(p,t,tr){
 const s=Math.min(440/p.d1,160/p.d2),run=Math.sqrt(Math.max(0,p.d1*p.d1-p.d2*p.d2))*s,rise=p.d2*s,x=360-run/2,y=266;
 const fn=u=>[x+run*u,y-rise*u], [px,py]=fn(t),a=-Math.atan2(rise,run)*180/Math.PI;
 let z=`<path d="M${x},${y} H${x+run} V${y-rise} Z" fill="#e2e8f0" stroke="${C.ink}" stroke-width="2"/>`+ln(83,y+5,642,y+5,C.line,2);
 z+=trail(fn,t,C.in,tr);
 z+=`<g transform="translate(${px} ${py}) rotate(${a})">${rect(-25,-46,50,42,'#f6e8da',C.out)}${arrow(-83,-25,-33,-25,C.in)}</g>`;
 z+=arrow(px+36,py-74,px+36,py-23,C.out)+txt(px+48,py-42,'weight',C.out,13);
 if(tr){const len=p.d1*s,dx=-rise/len*53,dy=-run/len*53;z+=dim(x+dx,y+dy,x+run+dx,y-rise+dy,'',C.in)+txt(x+run*.45+dx-8,y-rise*.45+dy-12,'d₁',C.in,14,'end')+dim(x+run+70,y,x+run+70,y-rise,'',C.out)+txt(x+run+83,y-rise*.5+4,'rise',C.out,14);}
 z+=txt(360,317,p.d1===p.d2?'Equal distances: direct vertical lift.':'Longer slope, smaller push for the same vertical rise.',C.muted,15,'middle');
 return z;
}
function pulley(p,t,tr){
 const moving=p.type==='movable'; let z=rect(175,53,340,14,'#cbd5e1',C.ink,2);
 if(!moving){
  const cx=360,cy=110,r=36,travel=110,free=151+t*travel,load=284-t*travel;
  z+=ln(cx,67,cx,cy,C.ink,5)+circle(cx,cy,r,'#f1f5f9')+circle(cx,cy,8,'#fff');
  const a=-t*travel/r; z+=ln(cx,cy,cx+27*Math.cos(a),cy+27*Math.sin(a),C.line,4);
  z+=path(`M${cx-r},${free} V${cy} A${r},${r} 0 0 1 ${cx+r},${cy} V${load-40}`,C.ink,4);
  z+=block(cx+r,load,62,40)+circle(cx-r,free,6,C.in,'#fff');
  z+=arrow(cx-r-22,free-28,cx-r-22,free+28,C.in)+arrow(cx+r+49,load+12,cx+r+49,load-39,C.out);
  z+=trail(u=>[cx-r,151+u*travel],t,C.in,tr)+trail(u=>[cx+r,284-u*travel],t,C.out,tr);
  if(tr)z+=dim(244,151,244,261,'d₁',C.in,225,207)+dim(482,284,482,174,'d₂',C.out,504,235);
  z+=txt(360,318,'One supporting rope segment. Pull down; load rises.',C.muted,15,'middle');
 }else{
  const cx=360,cy=249-t*78,r=34,free=236-t*156;
  z+=circle(cx-r,68,6,C.ink,C.ink)+path(`M${cx-r},68 V${cy} A${r},${r} 0 0 0 ${cx+r},${cy} V${free}`,C.ink,4);
  z+=circle(cx,cy,r-4,'#f1f5f9')+circle(cx,cy,7,'#fff')+ln(cx,cy+7,cx,cy+40,C.ink,4)+block(cx,cy+77,64,36);
  z+=circle(cx+r,free,6,C.in,'#fff')+arrow(cx+r+22,free+39,cx+r+22,free-16,C.in)+arrow(cx+62,cy+77,cx+62,cy+30,C.out);
  z+=trail(u=>[cx+r,236-u*156],t,C.in,tr)+trail(u=>[cx,326-u*78],t,C.out,tr);
  if(tr)z+=dim(482,236,482,80,'d₁',C.in,503,160)+dim(249,326,249,248,'d₂',C.out,227,290);
  z+=txt(275,105,'fixed end',C.muted,13,'end')+txt(525,273,'2 supporting',C.muted,14)+txt(525,292,'rope segments',C.muted,14);
 }
 return z;
}
function wheel(p,t,tr){
 const maxR=Math.max(p.r1,p.r2),s=Math.min(105/maxR,p.reverse?Infinity:88/p.d2),r1=p.r1*s,r2=p.r2*s,cx=310,cy=169,ang=p.d1/p.r1,th=-ang*t;
 let z=circle(cx,cy,Math.max(r1,r2),'#f8fafc',C.ink,4)+circle(cx,cy,Math.min(r1,r2),'#e2e8f0',C.ink,3);
 for(let k=0;k<6;k++){let a=th+k*Math.PI/3;z+=ln(cx+Math.min(r1,r2)*Math.cos(a),cy+Math.min(r1,r2)*Math.sin(a),cx+Math.max(r1,r2)*Math.cos(a),cy+Math.max(r1,r2)*Math.sin(a),C.line,3);}
 z+=circle(cx,cy,6,C.ink);
 const fi=u=>[cx+r1*Math.cos(-ang*u),cy+r1*Math.sin(-ang*u)];
 z+=trail(fi,t,C.in,tr);
 const [ix,iy]=fi(t);z+=ln(cx,cy,ix,iy,C.in,3)+circle(ix,iy,7,C.in,'#fff');
 const tang=[Math.sin(th),-Math.cos(th)];z+=arrow(ix-tang[0]*20,iy-tang[1]*20,ix+tang[0]*35,iy+tang[1]*35,C.in);
 if(!p.reverse){
  const loadStart=304,load=loadStart-p.d2*s*t;
  z+=ln(cx+r2,cy,cx+r2,load-38,C.out,3)+block(cx+r2,load,50,38)+arrow(cx+r2+38,load+2,cx+r2+38,load-43,C.out);
  z+=trail(u=>[cx+r2,loadStart-p.d2*s*u],t,C.out,tr);
  if(tr)z+=dim(492,loadStart,492,loadStart-p.d2*s,'d₂',C.out,513,loadStart-p.d2*s/2);
  z+=txt(490,114,'input: wheel rim',C.in,15)+txt(490,139,'output: axle rope',C.out,15);
 }else{
  const fo=u=>[cx+r2*Math.cos(-ang*u),cy+r2*Math.sin(-ang*u)],[ox,oy]=fo(t);z+=trail(fo,t,C.out,tr)+circle(ox,oy,7,C.out,'#fff');
  z+=arrow(ox-tang[0]*20,oy-tang[1]*20,ox+tang[0]*35,oy+tang[1]*35,C.out);
  z+=txt(490,114,'input: axle rim',C.in,15)+txt(490,139,'output: wheel rim',C.out,15);
 }
 z+=txt(490,191,`input radius: ${fmt(p.r1)} m`,C.muted,14)+txt(490,215,`output radius: ${fmt(p.r2)} m`,C.muted,14);
 z+=txt(360,329,'Both turn through the same angle; rim distances depend on radius.',C.muted,14,'middle');
 return z;
}
function gear(cx,cy,r,n,a){let pts=[];for(let i=0;i<n*4;i++){let rr=(i%4===0||i%4===3)?r-3:r+3,th=a+i*Math.PI*2/(n*4);pts.push([cx+rr*Math.cos(th),cy+rr*Math.sin(th)]);}return `<polygon points="${poly(pts)}" fill="#eef2f7" stroke="${C.ink}" stroke-width="1.7"/>`+circle(cx,cy,5,C.ink);}
function gears(p,t,tr){
 const s=285,toothScale=108/Math.max(p.teeth1,p.teeth2),rA=p.teeth1*toothScale,rB=p.teeth2*toothScale,c1=[360-rB,168],c2=[360+rA,168],rh=p.r1*s,rd=p.r2*s,angle=p.d1/p.r1;
 const a1=-angle*t,a2=angle*p.teeth1/p.teeth2*t;
 let z=gear(...c1,rA,p.teeth1,a1)+gear(...c2,rB,p.teeth2,a2+Math.PI/p.teeth2)+circle(...c2,rd,'#e2e8f0',C.out,2);
 const fi=u=>[c1[0]+rh*Math.cos(-angle*u),c1[1]+rh*Math.sin(-angle*u)],[ix,iy]=fi(t);
 z+=trail(fi,t,C.in,tr)+ln(...c1,ix,iy,C.in,3)+circle(ix,iy,6,C.in,'#fff');
 const load=316-p.d2*s*t,rx=c2[0]-rd;
 z+=ln(rx,c2[1],rx,load-36,C.out,3)+block(rx,load,50,36)+ln(c2[0],c2[1],c2[0]+rd*Math.cos(a2),c2[1]+rd*Math.sin(a2),C.out,3);
 z+=trail(u=>[rx,316-p.d2*s*u],t,C.out,tr)+arrow(ix-Math.sin(a1)*12,iy+Math.cos(a1)*12,ix+Math.sin(a1)*34,iy-Math.cos(a1)*34,C.in)+arrow(rx-42,load+2,rx-42,load-42,C.out);
 z+=txt(c1[0],53,`${p.teeth1} teeth`,C.in,14,'middle')+txt(c2[0],53,`${p.teeth2} teeth`,C.out,14,'middle');
 z+=txt(630,160,'equal-radius',C.muted,13,'middle')+txt(630,179,'crank + drum',C.muted,13,'middle');
 if(tr)z+=dim(620,316,620,316-p.d2*s,'d₂',C.out,641,290);
 z+=txt(360,338,'Gear teeth set the angle ratio; crank and drum set the force ratio.',C.muted,14,'middle');
 return z;
}
function screw(p,t,tr){
 // Plan and elevation use the same physical scale; side view is vertically offset.
 const s=Math.min(5000,88/p.r1,55/p.d2),R=p.r1*s,cx=179,cy=172,angle=2*Math.PI,fn=u=>[cx+R*Math.cos(-angle*u),cy+R*Math.sin(-angle*u)],[ix,iy]=fn(t);
 let z=circle(cx,cy,R,'#f8fafc',C.line,2)+circle(cx,cy,13,'#cbd5e1')+trail(fn,t,C.in,tr)+ln(cx,cy,ix,iy,C.ink,7)+circle(ix,iy,7,C.in,'#fff');
 const tang=[Math.sin(-angle*t),-Math.cos(-angle*t)];z+=arrow(ix-tang[0]*14,iy-tang[1]*14,ix+tang[0]*33,iy+tang[1]*33,C.in);
 z+=txt(cx,282,'Top view: handle makes one turn',C.muted,14,'middle');
 const sx=492,base=286,platform=207-p.d2*s*t;
 z+=rect(sx-86,base,172,12,'#cbd5e1',C.ink,2)+rect(sx-8,95,16,base-95,'#e2e8f0',C.ink,2);
 for(let y=101;y<base-8;y+=p.lead*s)z+=ln(sx-8,y,sx+8,y-7,C.muted,1.5);
 z+=ln(sx-62,112,sx-62,base,C.line,6)+ln(sx+62,112,sx+62,base,C.line,6)+rect(sx-78,platform,156,14,'#e7b98e',C.out,3)+block(sx,platform,68,40);
 z+=arrow(sx+93,platform+40,sx+93,platform-17,C.out)+trail(u=>[sx+78,207-p.d2*s*u],t,C.out,tr);
 z+=txt(sx,320,'Side view: platform cannot rotate',C.muted,14,'middle');
 if(tr)z+=ln(sx+81,207,665,207,C.line,1,'stroke-dasharray="3 4"')+ln(sx+81,207-p.d2*s,665,207-p.d2*s,C.line,1,'stroke-dasharray="3 4"')+dim(650,207,650,207-p.d2*s,'',C.out)+txt(655,180,'d₂',C.out,15);
 return z;
}
function wedge(p,t,tr){
 const s=Math.min(1450,170/p.d1),travel=p.d1*s,rise=p.d2*s,baseX=190,baseY=268,L=270,H=L*p.d2/p.d1;
 const x=baseX+travel*t,loadx=450,top=baseY-H+(loadx-x)*H/L,rollerY=top-8*Math.sqrt(1+(H/L)**2),loadY=rollerY-23;
 let z=ln(75,baseY+4,665,baseY+4,C.line,3)+`<path d="M${x},${baseY} V${baseY-H} L${x+L},${baseY} Z" fill="#dce6f2" stroke="${C.ink}" stroke-width="2"/>`;
 z+=ln(loadx-40,133,loadx-40,baseY,C.line,4)+ln(loadx+40,133,loadx+40,baseY,C.line,4)+block(loadx,loadY,68,51)+ln(loadx,loadY,loadx,rollerY-8,C.ink,3)+circle(loadx,rollerY,8,'#fff',C.ink,2);
 z+=arrow(x-68,baseY-18,x-9,baseY-18,C.in)+arrow(loadx+62,loadY+15,loadx+62,loadY-40,C.out)+circle(x,baseY-18,5,C.in,'#fff');
 const loadStart=baseY-H+(loadx-baseX)*H/L-8*Math.sqrt(1+(H/L)**2)-23;
 z+=trail(u=>[baseX+travel*u,baseY-18],t,C.in,tr)+trail(u=>[loadx,loadStart-rise*u],t,C.out,tr);
 if(tr)z+=dim(baseX,305,baseX+travel,305,'horizontal push',C.in,baseX+travel/2,329)+dim(587,loadStart,587,loadStart-rise,'',C.out)+txt(609,loadStart-rise/2+4,'rise',C.out,14);
 z+=txt(loadx,113,'vertical guides',C.muted,14,'middle');
 return z;
}
function hydraulic(p,t,tr){
 const scale=Math.min(750,110/p.d1,60/p.d2),di=p.d1*scale,doo=p.d2*scale,iy=182,smallx=145+di*t,largex=471+doo*t,h2=40*Math.sqrt(p.A2/p.A1);
 let z=path('M338,182 H368 V273 H416 V182 H441',C.ink,18)+path('M338,182 H368 V273 H416 V182 H441',C.water,13);
 // Same horizontal axis; large piston diameter is twice the small one (area four times).
 z+=rect(126,iy-20,212,40,'#f8fafc',C.ink,3)+rect(441,iy-h2/2,160,h2,'#f8fafc',C.ink,3);
 z+=`<rect x="${smallx+7}" y="${iy-17}" width="${338-smallx-10}" height="34" fill="${C.water}"/><rect x="444" y="${iy-h2/2+3}" width="${largex-444}" height="${h2-6}" fill="${C.water}"/>`;
 z+=rect(smallx,iy-18,8,36,'#b8c5d4',C.ink,1)+ln(smallx-135,iy,smallx,iy,C.ink,6)+ln(smallx-135,iy-15,smallx-135,iy+15,C.ink,5);
 z+=rect(largex,iy-h2/2+2,8,h2-4,'#b8c5d4',C.ink,1)+ln(largex+8,iy,largex+145,iy,C.ink,6)+ln(largex+145,iy-19,largex+145,iy+19,C.ink,5);
 z+=arrow(smallx-80,iy-53,smallx-24,iy-53,C.in)+arrow(largex+23,iy-h2/2-23,largex+79,iy-h2/2-23,C.out);
 z+=trail(u=>[145+di*u,iy-22],t,C.in,tr)+trail(u=>[471+doo*u,iy-h2/2-2],t,C.out,tr);
 z+=txt(225,92,'input piston: area A',C.in,15,'middle')+txt(521,92,`output piston: area ${fmt(p.A2/p.A1)}A`,C.out,15,'middle');
 if(tr)z+=dim(145,236,145+di,236,'d₁',C.in,205,258)+dim(471,248,471+doo,248,'d₂',C.out,486,270);
 z+=txt(360,314,'The same water volume leaves one syringe and enters the other.',C.muted,14,'middle');
 return z;
}
export function renderMachine(p,progress=0,showTrails=true){
 const t=Math.max(0,Math.min(1,Number(progress)||0));
 const fn={lever,seesaw:lever,ramp,fixed:pulley,movable:pulley,wheel,gears,screw,wedge,hydraulic}[p.type];
 const body=fn?fn(p,t,!!showTrails):txt(360,190,'Choose a machine',C.muted,20,'middle');
 return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 720 380" role="img" aria-label="${esc(p.title)}. Blue shows input; orange shows output. Motion shown at ${Math.round(t*100)} percent." style="display:block;width:100%;height:auto;background:#fff;border-radius:12px;font-family:system-ui,-apple-system,Segoe UI,sans-serif"><title>${esc(p.title)}</title><desc>${esc(p.input)} is the input. ${esc(p.output)} is the output. Dashed trails show a complete motion; solid trails show motion so far. Force arrows show direction, not force scale.</desc>${txt(28,31,`INPUT · F₁ = ${val(p,'F1')} N`,C.in,17,'start','font-weight="650"')}${txt(692,31,`OUTPUT · F₂ = ${val(p,'F2')} N`,C.out,17,'end','font-weight="650"')}${body}${footer(p)}</svg>`;
}
