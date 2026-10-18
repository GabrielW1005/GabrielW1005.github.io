(function(root){'use strict';
const {TAU,TYPES,BIOMES,clamp,dist,engulfPhase}=root.MC;
class Renderer{
 constructor(canvas){this.canvas=canvas;this.ctx=canvas.getContext('2d');this.camera={x:1350,y:1050};this.zoom=1.65;this.width=1200;this.height=800;this.dpr=1;this.labels=false}
 resize(w,h,dpr=1){this.width=w;this.height=h;this.dpr=1;this.canvas.width=Math.round(w*this.dpr);this.canvas.height=Math.round(h*this.dpr)}
 screen(p){return {x:(p.x-this.camera.x)*this.zoom+this.width/2,y:(p.y-this.camera.y)*this.zoom+this.height/2}}
 world(x,y){return {x:(x-this.width/2)/this.zoom+this.camera.x,y:(y-this.height/2)/this.zoom+this.camera.y}}
 visible(p,margin=200){return Math.abs(p.x-this.camera.x)<this.width/2/this.zoom+margin&&Math.abs(p.y-this.camera.y)<this.height/2/this.zoom+margin}
 circle(x,y,r,fill,stroke,line=1){const c=this.ctx;c.beginPath();c.arc(x,y,Math.max(.1,r),0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
 ellipse(x,y,rx,ry,a,fill,stroke,line=1){const c=this.ctx;c.beginPath();c.ellipse(x,y,Math.max(.1,rx),Math.max(.1,ry),a,0,TAU);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=line;c.stroke()}}
 path(cell,cup=null){
  if(cup){this.cupPath(cell,cup);return}
  const c=this.ctx,N=cell.mem.length,step=2;const point=i=>({x:cell.x+Math.cos(i/N*TAU)*cell.mem[i].r,y:cell.y+Math.sin(i/N*TAU)*cell.mem[i].r});const first=point(0),last=point(N-step);c.beginPath();c.moveTo((last.x+first.x)/2,(last.y+first.y)/2);for(let i=0;i<N;i+=step){const p=point(i),n=point((i+step)%N);c.quadraticCurveTo(p.x,p.y,(p.x+n.x)/2,(p.y+n.y)/2)}c.closePath()
 }
 cup(cell,target){
  const phase=engulfPhase(clamp(cell.capture.progress,0,1)),inner=target.r*(target.type==='paramecium'?1.38:1)+4,start=cell.r*.65+inner*.9;
  return {...phase,angle:cell.capture.angle,d:start+(dist(cell,target)-start)*phase.reach,inner,outer:inner+7,gap:2.5*(1-phase.wrap),target};
 }
 cupPath(a,g){
  const c=this.ctx,b=g.angle,root=.72,point=t=>{const i=Math.round(((t+b)%TAU+TAU)%TAU/TAU*40)%40,r=a.mem[i].r;return {x:Math.cos(t)*r,y:Math.sin(t)*r}};
  // One continuous membrane: the forward edge splits into two curved pseudopods.
  c.save();c.translate(a.x,a.y);c.rotate(b);c.beginPath();const lower=point(root);c.moveTo(lower.x,lower.y);
  const step=(TAU-2*root)/17;for(let i=0;i<17;i++){const p=point(root+(i+.5)*step),n=point(root+(i+1)*step);c.quadraticCurveTo(p.x,p.y,n.x,n.y)}const upper=point(TAU-root);
  if(g.sealed){
   const front=Math.max(g.d+g.outer*(1-.4*g.pull),a.r*1.04),side=Math.max(g.outer*(1-.4*g.pull),a.r*.55);
   c.bezierCurveTo(upper.x+12,upper.y+10,front,-side,front,0);c.bezierCurveTo(front,side,lower.x+12,lower.y-10,lower.x,lower.y);
  }else{
   const {d,inner,outer,gap}=g,back=2.8;
   c.quadraticCurveTo(upper.x+12,upper.y+10,d+Math.cos(-back)*outer,Math.sin(-back)*outer);c.arc(d,0,outer,-back,-gap);
   const tipX=d+Math.cos(-gap)*(inner+3.5),tipY=Math.sin(-gap)*(inner+3.5);
   c.quadraticCurveTo(tipX+Math.sin(gap)*5,tipY+Math.cos(gap)*5,d+Math.cos(-gap)*inner,Math.sin(-gap)*inner);
   // The empty opening is part of the outline, so the food is visibly outside until closure.
   c.arc(d,0,inner,-gap,-TAU+gap,true);
   c.quadraticCurveTo(tipX+Math.sin(gap)*5,-tipY-Math.cos(gap)*5,d+Math.cos(gap)*outer,Math.sin(gap)*outer);
   c.arc(d,0,outer,gap,back);c.quadraticCurveTo(lower.x+12,lower.y-10,lower.x,lower.y);
  }
  c.closePath();c.restore();
 }

 draw(game,dt=.016,drag=null){
  const c=this.ctx,s=game.s,p=game.focus,w=this.width,h=this.height;
  if(p&&!this.freeCamera){const target=p;this.camera.x+=(target.x-this.camera.x)*(1-Math.exp(-dt*6));this.camera.y+=(target.y-this.camera.y)*(1-Math.exp(-dt*6))}
  c.setTransform(this.dpr,0,0,this.dpr,0,0);c.fillStyle='#06141d';c.fillRect(0,0,w,h);
  c.fillStyle='#0b222a';c.fillRect(0,0,w,h);
  c.save();c.translate(w/2,h/2);c.scale(this.zoom,this.zoom);c.translate(-this.camera.x,-this.camera.y);
  const left=this.camera.x-w/2/this.zoom,top=this.camera.y-h/2/this.zoom;
  for(let x=Math.floor(left/160)*160;x<left+w/this.zoom+160;x+=160)for(let y=Math.floor(top/160)*160;y<top+h/this.zoom+160;y+=160)this.circle(x+13*Math.sin(x+y),y,1,'#99d3cf18');
  c.strokeStyle='#7ca6bf40';c.lineWidth=3;c.strokeRect(0,0,s.w,s.h);
  for(const z of s.hazards)if(this.visible(z,z.r+30)){
   const color={acid:'#ff637a',hypoxia:'#9279d2',shear:'#73bfff'}[z.kind];this.circle(z.x,z.y,z.r,color+'10');c.setLineDash([3,10]);this.circle(z.x,z.y,z.r,null,color+'60',1);c.setLineDash([]);
   for(let i=0;i<4;i++){const a=i/4*TAU+s.time*.06,r=z.r*(.35+.5*Math.sin(i*2.3)**2);if(z.kind==='shear'){c.strokeStyle=color+'60';c.beginPath();c.arc(z.x,z.y,r,a,a+.6);c.stroke()}else this.circle(z.x+Math.cos(a)*r,z.y+Math.sin(a)*r,2,color+'70')}
   c.fillStyle=color+'aa';c.font='14px system-ui';c.textAlign='center';c.fillText(z.kind==='acid'?'!':z.kind==='hypoxia'?'O₂ ↓':'≈',z.x,z.y+5);if(this.labels){c.font='9px system-ui';c.fillText(z.kind,z.x,z.y+22)}
  }
  for(const r of s.rocks)if(this.visible(r)){
   const g='#213b43';c.beginPath();for(let i=0;i<9;i++){const a=i/9*TAU,rr=r.r*(.88+.12*Math.sin(i*8+r.seed*30));const x=r.x+Math.cos(a)*rr,y=r.y+Math.sin(a)*rr;if(!i)c.moveTo(x,y);else c.lineTo(x,y)}c.closePath();c.fillStyle=g;c.fill();c.strokeStyle='#6d95a050';c.lineWidth=1.5;c.stroke();c.strokeStyle='#c6e9f412';c.beginPath();c.moveTo(r.x-r.r*.45,r.y-r.r*.2);c.lineTo(r.x,r.y-r.r*.5);c.lineTo(r.x+r.r*.55,r.y-r.r*.25);c.stroke();
  }
  for(const q of s.clouds)if(this.visible(q,150)){const r=Math.sqrt(q.variance)*2.5,color=q.team===0?'#bd83ff':'#ff609b';c.save();c.globalAlpha=Math.min(1,q.life/2);this.circle(q.x,q.y,r,color+'18');c.setLineDash([3,8]);this.circle(q.x,q.y,r,null,color+'75',1);c.setLineDash([]);for(let i=0;i<5;i++){const a=i*2.4+q.age*.2,rr=Math.sqrt(q.variance)*Math.sqrt(i/3);this.circle(q.x+Math.cos(a)*rr,q.y+Math.sin(a)*rr,2,color+'b0')}c.restore()}

  for(const f of s.food)if(!f.capturedBy&&this.visible(f,25))this.food(f,s.time);
  for(const d of s.dna)if(this.visible(d,20)){c.save();c.translate(d.x,d.y);c.rotate(Math.sin(s.time+d.id)*.4);for(let k=0;k<2;k++){c.strokeStyle=k?'#ffb1ec':'#bd8dff';c.lineWidth=1.6;c.beginPath();for(let i=0;i<=14;i++){const x=i-7,y=Math.sin(i*.6+k*Math.PI)*4;if(i)c.lineTo(x,y);else c.moveTo(x,y)}c.stroke()}c.restore()}
  for(const a of s.cells)if(this.visible(a,130)&&!a.capturedBy)this.cell(a,game);
  for(const a of game.selected)if(a.order){c.strokeStyle=TYPES[a.type].color+'60';c.lineWidth=1/this.zoom;c.setLineDash([4,6]);c.beginPath();c.moveTo(a.x,a.y);for(const p of a.path)c.lineTo(p.x,p.y);c.lineTo(a.order.x,a.order.y);c.stroke();c.setLineDash([]);this.circle(a.order.x,a.order.y,9,null,TYPES[a.type].color,1)}
  for(const e of s.effects)if(this.visible(e,50)){c.globalAlpha=clamp(e.life*1.5,0,1);if(e.kind==='rupture'){this.circle(e.x,e.y,e.r+(1-e.life/.6)*12,null,e.color,1.8)}else this.circle(e.x,e.y,e.r,e.color)}c.globalAlpha=1;c.restore();
  if(drag&&Math.hypot(drag.x2-drag.x,drag.y2-drag.y)>8){c.fillStyle='#6de7ca12';c.strokeStyle='#72f2d0';c.lineWidth=1;c.setLineDash([5,4]);c.fillRect(drag.x,drag.y,drag.x2-drag.x,drag.y2-drag.y);c.strokeRect(drag.x,drag.y,drag.x2-drag.x,drag.y2-drag.y);c.setLineDash([])}

 }
 food(f,time){const c=this.ctx;if(f.kind==='alga'){this.circle(f.x,f.y,f.r,'#78c98a','#b8fc9e70',.7);this.ellipse(f.x,f.y,2,4,.7,'#236e51');this.circle(f.x+3,f.y-2,1.5,'#e4ffa5')}
  else if(f.kind==='bacterium'){this.ellipse(f.x,f.y,f.r*1.3,f.r*.6,f.seed+Math.sin(time+f.seed)*.1,'#f6db75','#fff0b7',.45);this.circle(f.x,f.y,1,'#ad8d39')}
  else if(f.kind==='detritus'){c.fillStyle='#c38d5f66';c.beginPath();c.moveTo(f.x-f.r,f.y);c.lineTo(f.x,f.y-f.r*.7);c.lineTo(f.x+f.r*.8,f.y);c.lineTo(f.x+2,f.y+f.r*.6);c.closePath();c.fill();for(let i=0;i<3;i++)this.circle(f.x+Math.sin(i*3+f.seed)*f.r,f.y+Math.cos(i*4)*f.r,1.3,'#e1b588')}
  else this.circle(f.x,f.y,f.r,'#90d7c5')
 }
 cell(a,game){const c=this.ctx,s=game.s,t=TYPES[a.type],selected=s.selection.includes(a.id),detail=selected||this.zoom>=1.4,color=a.team===0?t.color:a.team===1?'#f19387':a.team===2?'#d1a4fa':'#f1d27b',target=a.capture?game.findTarget(a,a.capture.id):null,cup=target&&a.type==='amoeba'?this.cup(a,target):null;
  if(selected)this.circle(a.x,a.y,a.r*1.5,null,color+'70',1/this.zoom);

  if(a.type==='paramecium'||a.type==='didinium'){c.strokeStyle=color+'85';c.lineWidth=.85;for(let i=0;i<40;i+=detail?3:5){if(a.type==='didinium'&&i%5>1)continue;const b=i/40*TAU,r=a.mem[i].r,beat=Math.sin(s.time*9+i*.8);c.beginPath();c.moveTo(a.x+Math.cos(b)*r,a.y+Math.sin(b)*r);c.quadraticCurveTo(a.x+Math.cos(b+.06*beat)*(r+4),a.y+Math.sin(b+.06*beat)*(r+4),a.x+Math.cos(b+.12*beat)*(r+8),a.y+Math.sin(b+.12*beat)*(r+8));c.stroke()}}
  if(TYPES[a.type].domain==='bacterium'){c.strokeStyle=color+'95';c.lineWidth=1;for(let k=0;k<1;k++){c.beginPath();for(let i=0;i<14;i++){const bx=-a.r-i*2,by=Math.sin(i*.5+s.time*8+k)*4+(k-1)*7,x=a.x+Math.cos(a.a)*bx-Math.sin(a.a)*by,y=a.y+Math.sin(a.a)*bx+Math.cos(a.a)*by;if(i)c.lineTo(x,y);else c.moveTo(x,y)}c.stroke()}}
  this.path(a,cup);c.fillStyle=color+(cup?'35':'22');c.fill();c.strokeStyle=color;c.lineWidth=cup?1.8:1.3;c.stroke();

  c.save();c.clip();for(let j=0;j<(detail?6:0);j++){const r=Math.sqrt((j+.5)/6)*a.r*.82,b=j*2.399+s.time*.12;this.circle(a.x+Math.cos(b)*r,a.y+Math.sin(b)*r,.65,color+'80')}
  for(let oi=0;oi<a.org.length;oi++){const o=a.org[oi];if(!detail&&o.kind!=='nucleus'&&o.kind!=='vacuole')continue;if(o.kind==='mitochondrion'&&oi%2===0)continue;const x=a.x+o.x,y=a.y+o.y;if(a.division&&o.kind.includes('nucleus')){const p=1-a.division/3.2;for(const sign of [-1,1]){const dx=Math.cos(a.a)*a.r*p*.65*sign,dy=Math.sin(a.a)*a.r*p*.65*sign;this.organelle(o,x+dx,y+dy,a,s,p)}c.strokeStyle='#f0dbfc66';c.lineWidth=.6;for(let j=-2;j<=2;j++){c.beginPath();c.moveTo(x-Math.cos(a.a)*a.r*p*.7,y-Math.sin(a.a)*a.r*p*.7);c.quadraticCurveTo(x+Math.sin(a.a)*j*4,y-Math.cos(a.a)*j*4,x+Math.cos(a.a)*a.r*p*.7,y+Math.sin(a.a)*a.r*p*.7);c.stroke()}}else this.organelle(o,x,y,a,s)}
  if(TYPES[a.type].domain==='bacterium'){c.strokeStyle='#f0deff';c.lineWidth=1.2;c.beginPath();for(let j=0;j<20;j++){const bx=Math.sin(j*.75)*7,by=(j-10)*.8,x=a.x+Math.cos(a.a)*by-Math.sin(a.a)*bx,y=a.y+Math.sin(a.a)*by+Math.cos(a.a)*bx;if(j)c.lineTo(x,y);else c.moveTo(x,y)}c.stroke();if(a.division){const p=1-a.division/3.2;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.moveTo(a.x+Math.sin(a.a)*a.r*(1-p),a.y-Math.cos(a.a)*a.r*(1-p));c.lineTo(a.x-Math.sin(a.a)*a.r*(1-p),a.y+Math.cos(a.a)*a.r*(1-p));c.stroke()}}
  for(const v of a.gut)this.vacuole(a,v,s.time);c.restore();
  if(a.type==='paramecium'){const x=a.x+Math.cos(a.a+.7)*a.r*.5,y=a.y+Math.sin(a.a+.7)*a.r*.5;this.ellipse(x,y,3,8,a.a+.4,'#04293099',color+'c0',.7)}
  if(a.type==='didinium'){const x=a.x+Math.cos(a.a)*a.r*1.05,y=a.y+Math.sin(a.a)*a.r*1.05;this.ellipse(x,y,7,4,a.a,color+'66',color,1);if(a.capture){const target=game.findTarget(a,a.capture.id);if(target){c.strokeStyle='#ffd9a3';c.lineWidth=1.5;c.beginPath();c.moveTo(x,y);c.lineTo(target.x,target.y);c.stroke()}}}
  if(target){const pull=cup?.pull||clamp(a.capture.progress,0,1),scale=target.type?1-.4*pull:1;
   if(cup?.sealed)this.circle(target.x,target.y,cup.inner*(1-.4*pull),'#09262e','#ffc5e8',1.4);
   this.preyIcon(target.type||target.kind,target.x,target.y,target.r*scale,target.a||target.seed||0,s.time);
   if(cup&&!cup.sealed){c.save();c.translate(a.x,a.y);c.rotate(cup.angle);for(const sign of [-1,1])this.circle(cup.d+Math.cos(cup.gap)*(cup.inner+3.5),Math.sin(cup.gap)*(cup.inner+3.5)*sign,1.8,'#d7fff0');c.restore()}
  }
  if(a.burst>0){if(a.type==='paramecium'){for(let i=0;i<12;i++){const b=i/12*TAU,r=a.mem[Math.floor(i/12*40)].r;c.strokeStyle=color+'bd';c.lineWidth=1.6;c.beginPath();c.moveTo(a.x+Math.cos(b)*r,a.y+Math.sin(b)*r);c.lineTo(a.x+Math.cos(b)*(r+40*a.burst/.7),a.y+Math.sin(b)*(r+40*a.burst/.7));c.stroke()}}else if(a.type==='injector'){const b=a.attackAngle??a.a,r=a.r,reach=a.attackLength||r+15;c.save();c.globalAlpha=Math.min(1,a.burst/.18);c.translate(a.x,a.y);c.rotate(b);c.strokeStyle='#fff0cf';c.lineWidth=2.4;c.beginPath();c.moveTo(r*.6,0);c.lineTo(reach,0);c.moveTo(reach-5,-3);c.lineTo(reach,0);c.lineTo(reach-5,3);c.stroke();c.restore()}else if(a.type==='bacillus'){c.save();c.globalAlpha=a.burst/.65;this.circle(a.x,a.y,a.r+24*(1-a.burst/.65),null,'#e4b6ff',2);c.restore()}}
  if(a.hurt>0){const fade=clamp(a.hurt/.6,0,1);c.save();c.globalAlpha=fade;this.path(a,cup);c.fillStyle='#ff526b30';c.fill();c.strokeStyle='#ff7488';c.lineWidth=2.2;c.stroke();if(Number.isFinite(a.hitAngle)){const b=a.hitAngle,i=Math.round(((b%TAU)+TAU)%TAU/TAU*40)%40,r=a.mem[i].r+3;c.translate(a.x+Math.cos(b)*r,a.y+Math.sin(b)*r);c.rotate(b);c.strokeStyle='#ffe5bd';c.lineWidth=1.8;c.beginPath();for(const sign of [-1,0,1]){c.moveTo(2,sign*3);c.lineTo(6+4*(a.hitSize||.3),sign*7)}c.stroke()}c.restore()}
  if(a.fed>0){const p=1-a.fed/.7;c.save();c.globalAlpha=1-p;for(let i=0;i<3;i++)this.circle(a.x-5+i*5,a.y-a.r*.55-p*15,1.7,'#b4ff98');c.restore()}
  if(a.competent){c.setLineDash([2,4]);this.circle(a.x,a.y,a.r*1.5,null,'#e8b4ff',1);c.setLineDash([])}
  if(a.mating){const partner=s.cells.find(v=>v.id===a.mate);if(partner){c.strokeStyle='#edb2ff';c.lineWidth=3;c.beginPath();c.moveTo(a.x,a.y);c.lineTo(partner.x,partner.y);c.stroke()}}
  if(a.hp<90||selected||a.hurt>0){const ww=a.r*1.6,x=a.x-ww/2,y=a.y+a.r*1.55;c.fillStyle='#061018';c.fillRect(x,y,ww,3);if(a.hurt>0){c.fillStyle='#ffd0a0';c.fillRect(x,y,ww*clamp(a.damageHP||a.hp,0,100)/100,3)}c.fillStyle=a.hurt>0||a.hp<=45?'#ff6987':color;c.fillRect(x,y,ww*a.hp/100,3)}
  if(a.team===0){this.circle(a.x,a.y-a.r*1.55,2.4,selected?'#e7fff8':color);if(this.labels){c.textAlign='center';c.font='8px system-ui';c.fillStyle='#d3e9e6';c.fillText(t.name+' · '+a.intent,a.x,a.y-a.r*1.8)}}
 }
 preyIcon(kind,x,y,r,angle,time){
  if(kind==='paramecium'){this.ellipse(x,y,r*1.38,r*.72,angle,'#f1938738','#ffd0af',1.2);this.ellipse(x,y,r*.25,r*.17,angle,'#ccb4ef');return}
  this.food({kind,x,y,r,seed:angle},time);
 }
 vacuole(a,v,time){
  const c=this.ctx,p=clamp(1-v.left/v.total,0,1),size=clamp(v.r||(v.kind==='paramecium'?15:7),3,30),r=(size*(v.kind==='paramecium'?1.38:1)+4)*(1-p*.65),x=a.x+v.x,y=a.y+v.y;
  this.circle(x,y,r,'#09262e','#f5a7d9',1.2);
  if(p<.4){c.save();c.globalAlpha=1-p*.8;this.preyIcon(v.kind,x,y,size*(1-p*.6),v.angle||0,time);c.restore()}
  else{for(let j=0;j<4;j++){const b=j*2.4,rr=r*.44*(1-p);this.circle(x+Math.cos(b)*rr,y+Math.sin(b)*rr,Math.max(.5,2.4*(1-p)),v.kind==='alga'?'#b5f59f':'#f1d48c')}}
  for(let j=0;j<3;j++){const b=j*TAU/3+time*.4;this.circle(x+Math.cos(b)*(r+2),y+Math.sin(b)*(r+2),1.6,'#ff9bd7');if(p>.65){const out=(p-.65)/.35*10;c.save();c.globalAlpha=(1-p)/.35;this.circle(x+Math.cos(b)*(r+out),y+Math.sin(b)*(r+out),1.3,'#c4ffa4');c.restore()}}
 }
 organelle(o,x,y,a,s,division=0){const c=this.ctx;
  if(o.kind==='nucleus'||o.kind==='micronucleus'){const r=o.r*(division?.8:1);this.ellipse(x,y,r,r*.8,a.a,'#b9a6eb66','#e6c6ffb0',.7);this.circle(x+1,y-1,r*.35,'#f4cefd88');c.strokeStyle='#f6dfff88';c.lineWidth=.6;c.beginPath();c.moveTo(x-r*.5,y);c.bezierCurveTo(x-r*.2,y-r*.6,x+r*.3,y+r*.5,x+r*.5,y-r*.1);c.stroke()}
  else if(o.kind==='mitochondrion'){this.ellipse(x,y,5,2.8,s.time*.1+o.x,'#f9b678b0','#ffdb98',.6);c.strokeStyle='#7f582b';c.lineWidth=.6;c.beginPath();c.moveTo(x-3,y);c.lineTo(x-1,y-1);c.lineTo(x+1,y+1);c.lineTo(x+3,y);c.stroke();if(a.energy>20&&a.oxygen>.35)this.circle(x+5,y,1,'#fff3aa'+(Math.sin(s.time*5+o.x)>.3?'cc':'30'))}
  else if(o.kind==='vacuole'){const r=3+4*(a.pump||0);this.circle(x,y,r,'#b1eeff14','#bef6ff9a',.6);if((a.pump||0)<.15)for(let i=0;i<4;i++)this.circle(x+Math.cos(i*TAU/4)*9,y+Math.sin(i*TAU/4)*9,1,'#c3f9ff')}
  else if(o.kind==='lysosome')this.circle(x,y,2.6,'#fb8bd599','#ffc2f0',.5);
  else{c.strokeStyle='#96dbbd85';c.lineWidth=1;for(let i=0;i<3;i++){c.beginPath();c.ellipse(x,y+i*2,7-i,2,.5,.2,Math.PI*1.4);c.stroke();this.circle(x-4+i,y+i*2,1,'#d2edc8')}}
 }
 minimap(game,canvas){const c=canvas.getContext('2d'),s=game.s,w=canvas.width,h=canvas.height,rx=w/s.w,ry=h/s.h;c.clearRect(0,0,w,h);c.fillStyle='#081724';c.fillRect(0,0,w,h);for(const b of BIOMES){c.fillStyle=b.color+'25';c.beginPath();c.ellipse(b.x*rx,b.y*ry,b.r*rx,b.r*ry,0,0,TAU);c.fill()}for(const z of s.hazards){c.fillStyle='#ff698b55';c.beginPath();c.arc(z.x*rx,z.y*ry,z.r*rx,0,TAU);c.fill()}for(const a of s.cells){c.fillStyle=a.team===0?'#a6ffe4':'#f4ac8790';c.beginPath();c.arc(a.x*rx,a.y*ry,a.team===0?2.8:1.1,0,TAU);c.fill()}c.strokeStyle='#d0fff5a0';c.lineWidth=1;c.strokeRect((this.camera.x-this.width/2/this.zoom)*rx,(this.camera.y-this.height/2/this.zoom)*ry,this.width/this.zoom*rx,this.height/this.zoom*ry)}
}
root.MCRenderer=Renderer;if(typeof module!=='undefined')module.exports=Renderer;
})(typeof window!=='undefined'?window:globalThis);
