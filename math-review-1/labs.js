import { renderDiagram } from './diagrams.js?v=numbering-6';
import {createNetModel,renderNet} from './net-unfold.js?v=numbering-6';
import {mathHTML} from './math-format.js?v=learning-4';
import {guidanceFor} from './guidance.js?v=learning-4';

// All lab state is local to the selected problem. No canonical problem is mutated.
const NS='http://www.w3.org/2000/svg';
const BLUE='#3978dc', TEAL='#139c91', CORAL='#db6f60', GRAY='#657688';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt=n=>Number.isFinite(+n)?(+n).toFixed(8).replace(/\.?0+$/,'')||'0':String(n);
const num=s=>{s=String(s??'').trim().replace(/−/g,'-');if(/^[-+]?\d*\.?\d+\s*\/\s*[-+]?\d*\.?\d+$/.test(s)){let[a,b]=s.split('/').map(Number);return b?a/b:NaN;}return Number(s);};
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const polyArea=ps=>Math.abs(ps.reduce((a,p,i)=>{const q=ps[(i+1)%ps.length];return a+p[0]*q[1]-q[0]*p[1];},0))/2;
const header=(w=600,h=320)=>`<svg xmlns="${NS}" viewBox="0 0 ${w} ${h}" role="img">`;
const text=(x,y,s,size=15,color=GRAY,extra='')=>/^[−-]?(?:\d+|[a-z])\/\d+$/.test(String(s))?`<g fill="${color}" font-family="Times New Roman,serif" font-size="${size*.85}" text-anchor="middle"><text x="${x}" y="${y-size*.5}">${esc(String(s).split('/')[0])}</text><path d="M${x-size*.65} ${y-size*.24}h${size*1.3}" stroke="${color}" stroke-width="1"/><text x="${x}" y="${y+size*.62}">${esc(String(s).split('/')[1])}</text></g>`:`<text x="${x}" y="${y}" text-anchor="middle" font-size="${size}" fill="${color}" ${extra}>${esc(s)}</text>`;
const poly=(ps,fill=BLUE,opacity=.2,stroke=BLUE)=>`<polygon points="${ps.map(p=>p.join(',')).join(' ')}" fill="${fill}" fill-opacity="${opacity}" stroke="${stroke}" stroke-width="2" stroke-linejoin="round"/>`;
const path=(d,color=BLUE,width=2,more='')=>`<path d="${d}" fill="none" stroke="${color}" stroke-width="${width}" ${more}/>`;
function el(tag,cls,txt){const e=document.createElement(tag);if(cls)e.className=cls;if(txt!=null)e.textContent=txt;return e;}
function btn(label,fn,pressed=false){const b=el('button','',label);b.type='button';b.setAttribute('aria-pressed',String(pressed));b.addEventListener('click',fn);return b;}
function plain(s){return String(s??'').replace(/<[^>]*>/g,'');}
function normalizeProblem(p){return {...p,visual:p.visual?structuredClone(p.visual):null,description:[p.blockTitle,p.category,p.block?.title,p.block?.prompt,p.prompt].filter(Boolean).join(' ')};}

export function mountLab(host,problem,onChange=()=>{}){
  const p=normalizeProblem(problem);
  p.allowSolutions=problem.allowSolutions===true||(problem.allowSolutions==null&&!!problem.originalKey);
  if(!p.allowSolutions)p.steps=[]; // Printed work never receives a worked solution in a lab.
  host.innerHTML='';host.classList.add('math-lab');
  const stage=el('div','lab-stage'),readout=el('div','lab-readout'),controls=el('div','lab-controls'),caption=el('div','lab-caption');
  host.append(stage,readout,controls,caption);
  let stopped=false,raf=0,timer=0,assisted=false;const cleanups=[];
  const ctx={host,stage,readout,controls,caption,p,onChange,
    // Report actual worked help once; exploratory controls and student input stay independent.
    assist(){if(p.allowSolutions&&!assisted){assisted=true;onChange({kind:'assistance'});}},
    cleanup(fn){cleanups.push(fn);},
    listen(target,event,fn,opts){target.addEventListener(event,fn,opts);cleanups.push(()=>target.removeEventListener(event,fn,opts));},
    animate(draw,duration=1250){cancelAnimationFrame(raf);if(matchMedia('(prefers-reduced-motion: reduce)').matches){draw(1);return;}const start=performance.now();function frame(now){if(stopped)return;let t=clamp((now-start)/duration,0,1);draw(t<.5?2*t*t:1-Math.pow(-2*t+2,2)/2);if(t<1)raf=requestAnimationFrame(frame);}raf=requestAnimationFrame(frame);},
    stop(){cancelAnimationFrame(raf);clearTimeout(timer);},
    slider(label,min,max,value,step,change){const row=el('label','lab-slider-row');const input=el('input');input.type='range';input.min=min;input.max=max;input.step=step;input.value=value;input.setAttribute('aria-label',label);const out=el('output','',fmt(value));row.append(el('span','',label),input,out);ctx.listen(input,'input',()=>{ctx.stop();out.textContent=fmt(input.value);change(+input.value);});controls.append(row);return {input,out,set(n){input.value=n;out.textContent=fmt(n);}};}
  };
  const type=p.visual?.type;
  try{
    if((type==='grid'||type==='coordinate')&&!(p.visual.targets||[]).length&&p.input!=='plot') inspectGridLab(ctx);
    else if(type==='grid'||type==='coordinate') gridLab(ctx);
    else if(['order-rational','absolute-opposite','number-distance'].includes(p.family)) rationalLineLab(ctx);
    else if(type==='angle'||type==='angles') angleLab(ctx);
    else if(type==='numberline'||/inequal/i.test(p.description)||/[<>≤≥]/.test(p.prompt)) inequalityLab(ctx);
    else if(p.family==='measure-unit'||p.visual?.measureLength) measureLab(ctx);
    else if(type==='segments') segmentLab(ctx);
    else if(type==='circle') circleLab(ctx);
    else if(type==='prism'||type==='pyramid'||type==='net'||type==='crossSection'||type==='cross-section') solidLab(ctx);
    else if(p.family==='perimeter-rectangle') perimeterLab(ctx);
    else if(p.family==='triangle-angle-conditions') fallbackLab(ctx);
    else if(type==='polygon'||type==='composite'||type==='triangle'||type==='construction') areaLab(ctx);
    else if(/sequence|pattern/i.test(p.description)) sequenceLab(ctx);
    else if(/^unit-rate/.test(p.family||'')) rateLab(ctx);
    else if(['proportion-constant','proportion-equation','proportion-check','proportion-table'].includes(p.family)) proportionLab(ctx);
    else if(!p.visual&&p.block?.parts?.some(q=>q.visual?.type==='grid')) referenceGridLab(ctx);
    else if(/expression|combine like|expand|factor/i.test(p.description)&&!/[=<>≤≥]/.test(p.prompt)) expressionLab(ctx);
    else if(/equation|expression|combine like|expand|factor|solve.*[=<>≤≥]|[xyn]\s*[+−\-÷×*/].*[=<>]/i.test(p.description)||/[=<>≤≥]/.test(p.prompt)&&/[a-z]/i.test(p.prompt)) algebraLab(ctx);
    else if(['integer-multiply','integer-divide'].includes(p.family)||/integer multiplication|integer division/i.test(p.description)) multiplyLab(ctx);
    else if(p.family==='decimal-multiply'||p.family==='decimal-divide') decimalLab(ctx);
    else if(/percent|%/i.test(p.description)) percentLab(ctx);
    else if(['fraction-multiply','signed-fraction-multiply'].includes(p.family)) fractionProductLab(ctx);
    else if(/\d\s*\/\s*\d/.test(p.prompt)||/fraction|ratio/i.test(p.description)) fractionLab(ctx);
    else if(/sequence|pattern/i.test(p.description)) sequenceLab(ctx);
    else if(p.visual) fallbackLab(ctx);
    else numberLab(ctx);
  }catch(e){console.warn('Visual lab fallback',p.key,e);fallbackLab(ctx);}
  return ()=>{stopped=true;ctx.stop();for(const fn of cleanups)fn();host.innerHTML='';host.classList.remove('math-lab');};
}

function addAnimation(ctx,draw,{start=0,end=1,label='Animate',duration=1500}={}){const play=btn(label,()=>ctx.animate(t=>draw(start+(end-start)*t),duration));const reset=btn('Reset',()=>{ctx.stop();draw(start);});ctx.controls.append(play,reset);}

function gridLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,v=p.visual||{};
  const xmin=Number(v.xMin??v.min??-5),xmax=Number(v.xMax??v.max??5),ymin=Number(v.yMin??v.min??-5),ymax=Number(v.yMax??v.max??5),step=Number(v.step??1);
  const scale=Math.min(480/(xmax-xmin),260/(ymax-ymin)),left=(600-(xmax-xmin)*scale)/2,top=(340-(ymax-ymin)*scale)/2,bottom=top+(ymax-ymin)*scale,right=left+(xmax-xmin)*scale;
  const X=x=>left+(x-xmin)*scale,Y=y=>bottom-(y-ymin)*scale;
  const pt=q=>Array.isArray(q)?{x:q[0],y:q[1]}:q;
  const targets=(v.targets||[]).map(pt),given=(v.points||[]).map(pt);let placed={},active=0,connected=false,xControl,yControl;
  const labels=targets.length?targets.map((a,i)=>a.label||String.fromCharCode(65+i)):['P'];
  const snap=targets.some(a=>+a.x%1||+a.y%1)?.5:step,palette=[BLUE,CORAL,TEAL,'#a76bc8'];
  if(p.placedPoints)labels.forEach((l,i)=>{if(p.placedPoints[l])placed[i]={...p.placedPoints[l]};});
  if(!Object.keys(placed).length&&p.userAnswer&&p.input==='plot'){const qs=[...String(p.userAnswer).matchAll(/\(\s*([-−]?\d+(?:\.\d+)?)\s*,\s*([-−]?\d+(?:\.\d+)?)\s*\)/g)];qs.forEach((m,i)=>{if(i<labels.length)placed[i]={x:num(m[1]),y:num(m[2])};});}
  const tabs=el('div','lab-tabs');labels.forEach((label,i)=>tabs.append(btn(label,()=>{active=i;draw();})));controls.append(tabs);
  function dot(q,color,draggable=false){return `<circle cx="${X(q.x)}" cy="${Y(q.y)}" r="${draggable?8:5}" fill="${color}" stroke="white" stroke-width="2"/>${text(X(q.x)+13,Y(q.y)-12,q.label||'',13,color)}`;}
  function draw(){let s=header(600,340),axisY=Y(clamp(0,ymin,ymax)),axisX=X(clamp(0,xmin,xmax));
    for(let x=Math.ceil(xmin/step)*step;x<=xmax+1e-9;x+=step){s+=path(`M${X(x)} ${top}V${bottom}`,x===0?'#7a8c9d':'#dce5ed',x===0?1.8:.7);if(x!==0)s+=text(X(x),axisY+17,fmt(x),10);}
    for(let y=Math.ceil(ymin/step)*step;y<=ymax+1e-9;y+=step){s+=path(`M${left} ${Y(y)}H${right}`,y===0?'#7a8c9d':'#dce5ed',y===0?1.8:.7);if(y!==0)s+=text(axisX-16,Y(y)+4,fmt(y),10);}
    s+=text(right+14,axisY+5,v.xLabel||'x',14)+text(axisX,top-13,v.yLabel||'y',14)+text(axisX-9,axisY+16,'0',10);
    if(v.connectPoints&&given.length>=2){const points=given.map(q=>[X(q.x),Y(q.y)]);s+=v.closedPoints?poly(points,GRAY,.04,GRAY):path('M'+points.map(q=>q.join(' ')).join('L'),GRAY,1.8);}
    const userPoints=Object.values(placed),allPoints=[...given,...userPoints];
    if(connected&&allPoints.length>=2){
      if(v.targetEdges){const ps=targets.length>=3?userPoints:allPoints;if(ps.length>=2)s+=poly(ps.map(q=>[X(q.x),Y(q.y)]),TEAL,.08,TEAL);}
      else{const sorted=[...allPoints].sort((a,b)=>a.x-b.x),a=sorted[0],b=sorted.at(-1);if(a.x===b.x)s+=path(`M${X(a.x)} ${top}V${bottom}`,TEAL,2.5);else{const k=(b.y-a.y)/(b.x-a.x),intercept=a.y-k*a.x;let ends=[];for(const x of[xmin,xmax]){const y=k*x+intercept;if(y>=ymin&&y<=ymax)ends.push({x,y});}if(k!==0)for(const y of[ymin,ymax]){const x=(y-intercept)/k;if(x>=xmin&&x<=xmax)ends.push({x,y});}if(ends.length>=2)s+=path(`M${X(ends[0].x)} ${Y(ends[0].y)}L${X(ends.at(-1).x)} ${Y(ends.at(-1).y)}`,TEAL,2.5);}}
    }
    for(const q of given)s+=dot(q,GRAY);Object.entries(placed).forEach(([i,q])=>s+=dot({...q,label:labels[i]},palette[i%4],+i===active));
    stage.innerHTML=s+'</svg>';[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(i===active)));const q=placed[active];if(xControl)xControl.set(q?.x??0);if(yControl)yControl.set(q?.y??0);readout.textContent=q?`${labels[active]} = (${fmt(q.x)}, ${fmt(q.y)})`:`Place ${labels[active]}`;
  }
  function emitPoints(){const points=Object.fromEntries(labels.map((l,i)=>[l,placed[i]]).filter(([,q])=>q));ctx.onChange(p.input==='plot'?{kind:'answer',value:labels.map((l,i)=>placed[i]?`(${fmt(placed[i].x)}, ${fmt(placed[i].y)})`:'').join('; '),points}:{kind:'parameters',points});}
  function setFromPointer(e){const svg=stage.querySelector('svg'),rect=svg.getBoundingClientRect(),sx=(e.clientX-rect.left)/rect.width*600,sy=(e.clientY-rect.top)/rect.height*340,x=clamp(Math.round((xmin+(sx-left)/scale)/snap)*snap,xmin,xmax),y=clamp(Math.round((ymin+(bottom-sy)/scale)/snap)*snap,ymin,ymax);placed[active]={x,y};draw();emitPoints();}
  xControl=ctx.slider('x coordinate',xmin,xmax,placed[active]?.x??0,snap,n=>{placed[active]={x:n,y:placed[active]?.y??0};draw();emitPoints();});
  yControl=ctx.slider('y coordinate',ymin,ymax,placed[active]?.y??0,snap,n=>{placed[active]={x:placed[active]?.x??0,y:n};draw();emitPoints();});
  let dragging=false;ctx.listen(stage,'pointerdown',e=>{dragging=true;stage.setPointerCapture(e.pointerId);setFromPointer(e);});ctx.listen(stage,'pointermove',e=>{if(dragging)setFromPointer(e);});ctx.listen(stage,'pointerup',()=>dragging=false);ctx.listen(stage,'pointercancel',()=>dragging=false);
  if(v.answerLine||v.line||v.targetEdges||v.connectPoints)controls.append(btn(v.targetEdges?'Join vertices':'Draw line through my points',()=>{connected=!connected;draw();}));
  controls.append(btn('Clear points',()=>{placed={};connected=false;draw();ctx.onChange(p.input==='plot'?{kind:'answer',value:'',points:{}}:{kind:'parameters',points:{}});}));
  connected=Object.keys(placed).length===labels.length&&!!(v.answerLine||v.targetEdges);
  caption.textContent=p.input==='plot'?'Tap or drag on the grid. Select a label to place the next point.':'Plot the scaled figure to inspect it; enter its measurements in the answer box.';draw();
}

function referenceGridLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,v=structuredClone(p.block.parts.find(q=>q.visual?.type==='grid').visual);let reveal=false;
  function draw(){const shown={...v,points:[...(v.points||[]),...(reveal?(v.targets||[]):[])],line:reveal?(v.answerLine||v.line):v.line};stage.innerHTML=`<div class="lab-static">${renderDiagram(shown,{answer:false})}</div>`;readout.textContent='The same coordinate plane as this packet problem';caption.textContent=reveal?'Inspect the ordered pairs and their locations.':p.allowSolutions?'Read the given coordinates, then reveal the completed graph if needed.':'Read the given coordinates and place your own points.';}
  if(p.allowSolutions)controls.append(btn('Show plotted points',()=>{ctx.assist();reveal=true;draw();}));controls.append(btn('Given grid',()=>{reveal=false;draw();}));draw();
}

function angleLab(ctx){const {p,stage,readout,caption}=ctx,v=p.visual;let original=(v.rays||[0,90]).map(r=>typeof r==='number'?r:+r.deg),selected=Math.max(0,original.length-1),rotation=original[selected]||0;
  const slider=ctx.slider('Ray',0,360,rotation,1,a=>{rotation=a;draw();});
  function draw(){const rays=[...original];rays[selected]=rotation;const center=[290,190],r=130;let s=header(600,350);for(let deg=0;deg<=360;deg+=10){const a=deg*Math.PI/180;const inner=deg%30?145:139;s+=path(`M${center[0]+Math.cos(a)*inner} ${center[1]-Math.sin(a)*inner}L${center[0]+Math.cos(a)*151} ${center[1]-Math.sin(a)*151}`,'#c5d1dd',1);if(deg%30===0&&deg<360)s+=text(center[0]+Math.cos(a)*165,center[1]-Math.sin(a)*165+4,deg+'°',10);}
    rays.forEach((a,i)=>{const rad=a*Math.PI/180;s+=path(`M${center[0]} ${center[1]}L${center[0]+Math.cos(rad)*r} ${center[1]-Math.sin(rad)*r}`,i===selected?BLUE:GRAY,i===selected?4:2.5);s+=`<circle cx="${center[0]+Math.cos(rad)*r}" cy="${center[1]-Math.sin(rad)*r}" r="${i===selected?8:4}" fill="${i===selected?BLUE:GRAY}"/>`;});
    const a0=original[0]||0,diff=((rotation-a0)%360+360)%360,small=diff>180?360-diff:diff;const start=a0*Math.PI/180,end=rotation*Math.PI/180,ar=46;s+=path(`M${center[0]+Math.cos(start)*ar} ${center[1]-Math.sin(start)*ar} A${ar} ${ar} 0 ${diff>180?1:0} 0 ${center[0]+Math.cos(end)*ar} ${center[1]-Math.sin(end)*ar}`,TEAL,3);s+=`<circle cx="${center[0]}" cy="${center[1]}" r="4" fill="${GRAY}"/>`;s+='</svg>';stage.innerHTML=s;if(p.allowSolutions)ctx.assist();readout.textContent=p.allowSolutions?`Smaller angle: ${fmt(small)}°`:'Compare the rays with the protractor.';slider.set(rotation);}
  let dragging=false;function move(e){const svg=stage.querySelector('svg'),r=svg.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*600-290,y=190-(e.clientY-r.top)/r.height*350;rotation=(Math.round(Math.atan2(y,x)*180/Math.PI)+360)%360;draw();}
  ctx.listen(stage,'pointerdown',e=>{dragging=true;stage.setPointerCapture(e.pointerId);move(e);});ctx.listen(stage,'pointermove',e=>{if(dragging)move(e);});ctx.listen(stage,'pointerup',()=>dragging=false);
  ctx.controls.append(btn('Given diagram',()=>{rotation=original[selected];draw();}));addAnimation(ctx,t=>{rotation=original[selected]+(360-original[selected])*t;draw();});caption.textContent='Drag the blue ray. Use the given diagram to return to the exact problem.';draw();
}

function circleLab(ctx){const {p,stage,readout,controls,caption}=ctx,v=p.visual;const r=Number(v.r??v.radius??4);let mode=/area/.test(p.family||'')?'sectors':/radius|diameter/.test(p.family||'')?'radius':'unroll',t=0;const tabs=el('div','lab-tabs');
  ['unroll','sectors','radius'].forEach(m=>tabs.append(btn(m==='unroll'?'Unroll circumference':m==='sectors'?'Rearrange area':'Radius & diameter',()=>{mode=m;t=0;draw();})));controls.append(tabs);const slider=ctx.slider('Move',0,1,0,.01,n=>{t=n;draw();});
  function draw(){const R=65,cx=110,cy=130;let s=header(600,320);
    if(mode==='unroll'){s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="${BLUE}" fill-opacity=".06" stroke="#d9e4ed" stroke-width="2"/>`;const circumference=2*Math.PI*R,remaining=circumference*(1-t);s+=`<circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="${BLUE}" stroke-width="5" stroke-dasharray="${remaining} ${circumference}" transform="rotate(90 ${cx} ${cy})"/>`;s+=path(`M${cx} ${cy+R}H${cx+circumference*t}`,BLUE,5);s+=path(`M${cx-R} ${cy}H${cx+R}`,CORAL,2.5);s+=text(cx,cy-10,'d = 2r',14,CORAL);s+=text(300,270,t>.98?'C = π × d = 2πr':'One complete edge becomes a straight length',17);readout.textContent=v.label||(p.allowSolutions?`Radius ${fmt(r)} ${v.unit||'units'}`:'Use the given circle measurements.');
    }else if(mode==='radius'){s+=`<circle cx="300" cy="150" r="105" fill="${BLUE}" fill-opacity=".08" stroke="${BLUE}" stroke-width="3"/>`;s+=path('M195 150H405',CORAL,4);s+=path('M300 150L'+(300+105*Math.cos(t*2*Math.PI))+' '+(150-105*Math.sin(t*2*Math.PI)),TEAL,4);s+=`<circle cx="300" cy="150" r="4" fill="${GRAY}"/>`;s+=text(300,181,'diameter = 2 × radius',15,CORAL);s+=text(300,287,'Every point on the circle is the same distance from the center.',13);readout.textContent=v.label||(p.allowSolutions?`r = ${fmt(r)} ${v.unit||''}`:'Compare one radius with a full diameter.');
    }else{const n=16,rr=78,sector=2*Math.PI/n;for(let i=0;i<n;i++){const ang=i*sector;const initial=[170,142],chord=2*rr*Math.sin(sector/2),height=rr*Math.cos(sector/2),final=[180+i*chord/2,i%2?120+height:120];const rot0=ang,rot1=i%2?-Math.PI/2-sector/2:Math.PI/2-sector/2,rot=rot0+(rot1-rot0)*t;const x=initial[0]+(final[0]-initial[0])*t,y=initial[1]+(final[1]-initial[1])*t;const p1=[x+rr*Math.cos(rot),y+rr*Math.sin(rot)],p2=[x+rr*Math.cos(rot+sector),y+rr*Math.sin(rot+sector)];s+=`<path d="M${x} ${y}L${p1.join(' ')}A${rr} ${rr} 0 0 1 ${p2.join(' ')}Z" fill="${i%2?TEAL:BLUE}" fill-opacity=".5" stroke="white" stroke-width="1"/>`;}
      s+=text(300,285,t>.9?'Approximate base: πr     Height: r     Area: πr²':'Move the sectors to see the area relationship.',14);readout.textContent='Cut, alternate, and rearrange';
    }
    stage.innerHTML=s+'</svg>';slider.set(t);[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(['unroll','sectors','radius'][i]===mode)));}
  addAnimation(ctx,n=>{t=n;draw();},{duration:2200});caption.textContent='The quantities belong to this problem. The movement reveals the relationship.';draw();
}

function areaLab(ctx){const {p,stage,readout,controls,caption}=ctx,v=p.visual;const ps=v.points||v.vertices||[[0,0],[6,0],[6,4],[0,4]];let t=0,mode='partition';const xs=ps.map(x=>x[0]),ys=ps.map(x=>x[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);const w=xmax-xmin||1,h=ymax-ymin||1;const scale=Math.min(380/w,190/h),origin=[100+(380-w*scale)/2,265];const P=q=>[origin[0]+(q[0]-xmin)*scale,origin[1]-(q[1]-ymin)*scale];
  const slider=ctx.slider('Reveal',0,1,0,.01,n=>{t=n;draw();});
  function draw(){let s=header(600,340);const screen=ps.map(P);const isPara=ps.length===4&&Math.abs((ps[0][0]+ps[2][0])-(ps[1][0]+ps[3][0]))<1e-6&&Math.abs((ps[0][1]+ps[2][1])-(ps[1][1]+ps[3][1]))<1e-6;const isTri=ps.length===3;
    if(mode==='rearrange'&&isPara&&Math.abs(ps[0][1]-ps[1][1])<1e-6){const sorted=[...ps].sort((a,b)=>a[1]-b[1]||a[0]-b[0]);const bottom=sorted.slice(0,2).sort((a,b)=>a[0]-b[0]),top=sorted.slice(2).sort((a,b)=>a[0]-b[0]);const shift=top[0][0]-bottom[0][0],base=bottom[1][0]-bottom[0][0];if(shift>=0&&shift<=base){const a=bottom[0],b=bottom[1],c=top[1],d=top[0],foot=[d[0],a[1]];s+=poly([foot,b,c,d].map(P),BLUE,.2);const piece=[a,foot,d].map(q=>P([q[0]+base*t,q[1]]));s+=poly(piece,TEAL,.4);s+=path(`M${P(foot).join(' ')}L${P(d).join(' ')}`,TEAL,1.8,'stroke-dasharray="5 4"');}else s+=poly(screen,BLUE,.2);readout.textContent=t>.95?'Same area. New arrangement.':'Move the triangle to make a rectangle.';
    }else if(mode==='rearrange'&&isTri){const triScreen=screen.map(q=>[(q[0]-300)*.7+300,(q[1]-265)*.7+170]);s+=poly(triScreen,BLUE,.25);const a=triScreen[0],b=triScreen[1],c=triScreen[2],center=[(a[0]+b[0])/2,(a[1]+b[1])/2];const rot=180*t*Math.PI/180;const dup=triScreen.map(q=>[center[0]+(q[0]-center[0])*Math.cos(rot)-(q[1]-center[1])*Math.sin(rot),center[1]+(q[0]-center[0])*Math.sin(rot)+(q[1]-center[1])*Math.cos(rot)]);s+=poly(dup,TEAL,.25*t);readout.textContent='Two equal triangles make a parallelogram.';
    }else{s+=`<defs><clipPath id="area-clip"><polygon points="${screen.map(q=>q.join(',')).join(' ')}"/></clipPath></defs>`;s+=poly(screen,BLUE,.1);const cell=Math.max(1,Math.ceil(Math.max(w,h)/20));let cells=[];for(let y=ymin;y<ymax;y+=cell)for(let x=xmin;x<xmax;x+=cell)cells.push([x,y]);const count=Math.round(cells.length*t);s+='<g clip-path="url(#area-clip)">';cells.slice(0,count).forEach((q,i)=>{const a=P(q);s+=`<rect x="${a[0]}" y="${a[1]-cell*scale}" width="${cell*scale}" height="${cell*scale}" fill="${i%2?BLUE:TEAL}" fill-opacity=".2" stroke="white" stroke-width="1"/>`;});s+='</g>'+poly(screen,'none',0,BLUE);for(let i=2;i<ps.length-1;i++){const a=P(ps[0]),b=P(ps[i]);s+=path(`M${a.join(' ')}L${b.join(' ')}`,CORAL,2,`stroke-dasharray="5 4" opacity="${t}"`);}readout.textContent=t>.9?'Count whole units and combine partial units.':'Reveal square units and simpler pieces.';}
    for(const l of v.labels||[]){if(l.x!=null&&l.y!=null){const q=P([l.x,l.y]);s+=text(q[0],q[1],l.text,13);}}
    s+=text(300,318,mode==='rearrange'?'Area is preserved when pieces move.':`1 small square = ${fmt(Math.max(1,Math.ceil(Math.max(w,h)/20))**2)} square ${v.unit||'unit'}${v.unit?'':'s'}`,12);stage.innerHTML=s+'</svg>';slider.set(t);
  }
  controls.append(btn('Square units',()=>{mode='partition';t=0;draw();}));if(ps.length===3||ps.length===4)controls.append(btn('Rearrange',()=>{mode='rearrange';t=0;draw();}));addAnimation(ctx,n=>{t=n;draw();},{duration:1800});caption.textContent='Use the exact shape to connect a formula to its area.';draw();
}

function unfoldNetLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,model=createNetModel(p.visual);
  let progress=0,direction=1,playing=false,frame=0,last=0,closed=false;
  const duration=3300,lateral=/lateral/.test(p.family||'');
  stage.classList.add('lab-net-stage');
  function pause(){playing=false;cancelAnimationFrame(frame);frame=0;play.textContent='Play';play.setAttribute('aria-pressed','false');}
  function draw(){stage.innerHTML=renderNet(model,progress,{lateral});slider.set(Math.round(progress*100));
    readout.textContent=progress<.001?'Folded solid':progress>.999?'Flat net':direction>0?'Unfolding along shared edges':'Folding along shared edges';
    reverse.textContent=progress>=1||direction>0?'Fold back':'Unfold';reverse.disabled=progress<=0;
    caption.textContent=lateral?'The pale base faces stay attached; the colored side faces form the lateral surface.':'The colors follow the same faces. Dashed edges are hinges; the faces keep their size.';
  }
  function tick(now){if(closed||!playing)return;if(last)progress=clamp(progress+direction*(now-last)/duration,0,1);last=now;draw();if((direction>0&&progress>=1)||(direction<0&&progress<=0)){pause();return;}frame=requestAnimationFrame(tick);}
  function start(){if(progress<=0&&direction<0)direction=1;if(progress>=1&&direction>0)direction=-1;
    if(matchMedia('(prefers-reduced-motion: reduce)').matches){progress=direction>0?1:0;draw();pause();return;}
    playing=true;last=0;play.textContent='Pause';play.setAttribute('aria-pressed','true');frame=requestAnimationFrame(tick);
  }
  const slider=ctx.slider('Unfold',0,100,0,1,n=>{pause();progress=n/100;draw();});
  slider.input.setAttribute('aria-label','Unfold solid into net');
  const play=btn('Play',()=>playing?pause():start());
  const reverse=btn('Fold back',()=>{pause();direction=progress<=0?1:progress>=1?-1:-direction;start();});
  const reset=btn('Reset solid',()=>{pause();progress=0;direction=1;draw();});
  const flat=btn('Flat net',()=>{pause();progress=1;direction=-1;draw();});
  controls.append(play,reverse,reset,flat);
  if(p.visual.type==='prism')controls.append(btn('Build volume',()=>{pause();stage.classList.remove('lab-net-stage');controls.innerHTML='';solidLab(ctx,true);}));
  controls.append(btn('Given diagram',()=>{pause();stage.innerHTML=`<div class="lab-static">${renderDiagram(p.visual,{answer:false})}</div>`;readout.textContent='Exact problem dimensions';caption.textContent='Move the unfolding slider or select Play to return to the model.';}));
  ctx.cleanup(()=>{closed=true;pause();stage.classList.remove('lab-net-stage');});draw();
}

function solidLab(ctx,forceVolume=false){
  const {p,stage,readout,controls,caption}=ctx,v=p.visual;
  if(!forceVolume&&(v.type==='net'||v.type==='pyramid'||(/surface|lateral|net-/.test(p.family||'')||/surface area/i.test(p.blockTitle||p.block?.title||'')))&&!v.crossSection&&!v.slice){unfoldNetLab(ctx);return;}
  const isPyramid=v.type==='pyramid',isSlice=!!v.crossSection||!!v.slice;let t=0,mode=isSlice?'slice':/surface|lateral/.test(p.family||'')?'faces':'layers';
  let base=v.vertices3D?v.vertices3D.slice(0,-1).map(q=>q.slice(0,2)):(v.base||[[0,0],[Number(v.width||4),0],[Number(v.width||4),Number(v.length||3)],[0,Number(v.length||3)]]);
  const depth=Number(v.vertices3D?v.vertices3D.at(-1)[2]:v.depth??v.height??4);
  const center=base.reduce((a,q)=>[a[0]+q[0]/base.length,a[1]+q[1]/base.length],[0,0]);
  const apex=v.vertices3D?v.vertices3D.at(-1):[...center,depth];
  const iso=q=>base.length>4?[Math.sqrt(3)/2*(q[0]-q[2]),q[1]-(q[0]+q[2])/2]:[Math.sqrt(3)/2*(q[0]-q[1]),q[2]-(q[0]+q[1])/2];
  const all=[...base.map(q=>[...q,0]),...(isPyramid?[apex]:base.map(q=>[...q,depth]))].map(iso);
  const xs=all.map(q=>q[0]),ys=all.map(q=>q[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
  const scale=Math.min(420/(xmax-xmin||1),215/(ymax-ymin||1));
  const P=q=>{const z=iso(q);return[300+(z[0]-(xmin+xmax)/2)*scale,155-(z[1]-(ymin+ymax)/2)*scale];};
  const slider=ctx.slider(isSlice?'Slice position':v.type==='net'?'Faces':'Fill / separate',0,1,0,.01,n=>{t=n;draw();});
  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function verticalCuts(origin,dir){let cuts=[];for(let i=0;i<base.length;i++){const a=base[i],b=base[(i+1)%base.length],edge=[b[0]-a[0],b[1]-a[1]],den=cross(edge,dir);if(Math.abs(den)<1e-8)continue;const rel=[origin[0]-a[0],origin[1]-a[1]],u=cross(rel,dir)/den;if(u>=-1e-8&&u<=1+1e-8){const q=[a[0]+edge[0]*u,a[1]+edge[1]*u];if(!cuts.some(c=>Math.hypot(c[0]-q[0],c[1]-q[1])<1e-7))cuts.push(q);}}cuts.sort((a,b)=>a[0]*dir[0]+a[1]*dir[1]-b[0]*dir[0]-b[1]*dir[1]);return cuts;}
  function draw(){
    if(v.type==='net'){
      if(p.family==='net-faces')ctx.assist();const count=Math.round((v.faces?.length||0)*t),nv={...v,faces:(v.faces||[]).map((f,i)=>({...f,fill:i<count?'#b6e6df':'#edf2f7'}))};
      stage.innerHTML=`<div class="lab-static">${renderDiagram(nv,{answer:false})}</div>`;readout.textContent=p.allowSolutions||p.family!=='net-faces'?`${count} of ${v.faces?.length||0} faces highlighted`:'Follow each face as the net folds.';caption.textContent='A net has exactly the same faces as the solid. Add each face once.';slider.set(t);return;
    }
    if(base.length>4&&mode==='layers'&&t===0){stage.innerHTML=`<div class="lab-static">${renderDiagram(v,{answer:false})}</div>`;readout.textContent='Build layers from the L-shaped base';slider.set(t);return;}
    let s=header(600,340);const front=base.map(q=>P([...q,0])),back=base.map(q=>P([...q,depth]));
    if(isPyramid&&mode==='faces'){
      const includeBase=!/lateral/.test(p.family||''),faces=[...front.map((q,i)=>[q,front[(i+1)%front.length],P(apex)]),...(includeBase?[front]:[])],count=Math.round(faces.length*t);
      faces.forEach((face,i)=>{const c=face.reduce((a,q)=>[a[0]+q[0]/face.length,a[1]+q[1]/face.length],[0,0]),dx=(c[0]-300)*.25*t,dy=(c[1]-155)*.25*t;s+=poly(face.map(q=>[q[0]+dx,q[1]+dy]),i===front.length?TEAL:BLUE,i<count?.35:.05,i<count?BLUE:GRAY);});readout.textContent=`${count} of ${faces.length} ${includeBase?'faces':'side faces'} highlighted`;
    }else if(isPyramid){
      s+=poly(front,BLUE,.09);front.forEach((q,i)=>s+=poly([q,front[(i+1)%front.length],P(apex)],i%2?TEAL:BLUE,.10));
      if(v.crossSection==='vertical'){
        const cuts=verticalCuts(apex.slice(0,2),[Math.cos(t*Math.PI),Math.sin(t*Math.PI)]);
        if(cuts.length>=2)s+=poly([P([...cuts[0],0]),P([...cuts.at(-1),0]),P(apex)],CORAL,.35,CORAL);
        readout.textContent='A vertical plane through the apex';
      }else{
        const slice=base.map(q=>P([q[0]+(apex[0]-q[0])*t,q[1]+(apex[1]-q[1])*t,depth*t]));s+=poly(slice,CORAL,.35,CORAL);
        readout.textContent=`Parallel slice: ${Math.round(t*100)}% of the height`;
      }
    }else if(mode==='slice'){
      s+=poly(front,BLUE,.06)+poly(back,BLUE,.06);front.forEach((q,i)=>s+=path(`M${q.join(' ')}L${back[i].join(' ')}`,GRAY,1.5));
      if(v.crossSection==='vertical'){
        const ys=base.map(q=>q[1]),y=Math.min(...ys)+(Math.max(...ys)-Math.min(...ys))*clamp(t,.01,.99),cuts=verticalCuts([0,y],[1,0]);
        if(cuts.length>=2){const a=cuts[0],b=cuts.at(-1);s+=poly([P([...a,0]),P([...b,0]),P([...b,depth]),P([...a,depth])],CORAL,.3,CORAL);}
        readout.textContent='Move a vertical slicing plane through the prism.';
      }else{s+=poly(base.map(q=>P([...q,depth*t])),CORAL,.35,CORAL);readout.textContent='Every slice parallel to the base has the same shape.';}
    }else if(mode==='layers'){
      const layers=Math.max(1,Math.min(24,Math.ceil(Math.abs(depth))));
      for(let i=0;i<layers;i++)if(t*layers>i){const z=depth*i/layers,za=Math.min(depth*(i+1)/layers,depth*t),low=base.map(q=>P([...q,z])),high=base.map(q=>P([...q,za]));
        for(let j=0;j<base.length;j++)s+=poly([low[j],low[(j+1)%base.length],high[(j+1)%base.length],high[j]],i%2?TEAL:BLUE,.11);
        s+=poly(high,i%2?TEAL:BLUE,.17);
      }
      s+=poly(front,'none',0,GRAY)+poly(back,'none',0,GRAY);front.forEach((q,i)=>s+=path(`M${q.join(' ')}L${back[i].join(' ')}`,GRAY,1.4));
      readout.textContent=`Base area × height: build ${Math.round(t*100)}% of the solid`;
    }else{
      const faces=[front,back,...front.map((q,i)=>[q,front[(i+1)%front.length],back[(i+1)%back.length],back[i]])];
      faces.forEach((face,i)=>{const c=face.reduce((a,q)=>[a[0]+q[0]/face.length,a[1]+q[1]/face.length],[0,0]),dx=(c[0]-300)*.4*t,dy=(c[1]-155)*.4*t;const moved=face.map(q=>[q[0]+dx,q[1]+dy]);s+=poly(moved,i<2?TEAL:BLUE,.16);s+=text(c[0]+dx,c[1]+dy+4,i<2?'base':'side',12,i<2?TEAL:BLUE);});
      readout.textContent='Add the area of each exposed face.';
    }
    s+=text(300,320,'Equal scale along all three isometric axes.',12);stage.innerHTML=s+'</svg>';slider.set(t);
  }
  if(isPyramid)controls.append(btn('Inspect faces',()=>{mode='faces';t=0;draw();}),btn('Slice',()=>{mode='slice';t=.5;draw();}));
  if(!isPyramid&&v.type!=='net')controls.append(btn('Fill layers',()=>{mode='layers';t=0;draw();}),btn('Unfold net',()=>{ctx.stop();controls.innerHTML='';unfoldNetLab(ctx);}),btn('Slice',()=>{mode='slice';t=.5;draw();}));
  addAnimation(ctx,n=>{t=n;draw();},{duration:2100});controls.append(btn('Given diagram',()=>{ctx.stop();stage.innerHTML=`<div class="lab-static">${renderDiagram(v,{answer:false})}</div>`;readout.textContent='Exact problem dimensions';}));
  caption.textContent='Move the slider to inspect the actual solid. Dimensions do not change.';draw();
}
function algebraLab(ctx){const {p,stage,readout,controls,caption}=ctx;const steps=(p.steps||[]).map(plain);let index=-1;
  function draw(){const current=index<0?p.prompt:steps[index];let equation=String(current).match(/[^.;]*[=≤≥<>][^.;]*/)?.[0]||p.prompt;equation=plain(equation).replace(/^Solve\s*:?\s*/i,'').trim();const sides=equation.split(/=|≤|≥|<|>/);const left=sides[0]||'left',right=sides[1]||'right';let s=header(600,290);s+=path('M300 105V235M230 235H370',GRAY,5);s+=path('M150 100H450',BLUE,5);s+=path('M150 100L115 183H185ZM450 100L415 183H485Z','#8ba0b8',1.8);s+=path('M105 185Q150 210 195 185M405 185Q450 210 495 185',BLUE,3);s+=`<circle cx="300" cy="100" r="8" fill="${BLUE}"/>`;s+=text(150,160,left.trim(),Math.min(18,170/Math.max(1,left.length)*1.7),BLUE);s+=text(450,160,right.trim(),Math.min(18,170/Math.max(1,right.length)*1.7),BLUE);s+=text(300,55,equation,17);s+=text(300,270,index<0?'Start with the given equation.':'Keep both sides equivalent.',13);stage.innerHTML=s+'</svg>';readout.textContent=index<0?'Both sides in balance':`Step ${index+1} of ${steps.length}`;caption.textContent=index<0?(p.allowSolutions?'Advance one operation at a time.':guidanceFor(p).steps[0]):steps[index];back.disabled=index<0;next.disabled=index>=steps.length-1;}
  const back=btn('← Back',()=>{index--;draw();}),next=btn('Next step →',()=>{ctx.assist();index++;ctx.animate(t=>{stage.style.opacity=.45+.55*t;},250);draw();});if(p.allowSolutions)controls.append(back,next);controls.append(btn('Reset',()=>{index=-1;draw();}));draw();
}

function expressionLab(ctx){
  const {p,stage,readout,controls,caption}=ctx;let progress=0,index=-1;
  function draw(){
    let source=String(index<0?p.prompt:p.steps?.[index]||p.prompt).replace(/−/g,'-').replace(/^[^:]+:\s*/,'');
    if(source.includes('='))source=source.split('=').at(-1).trim();
    const terms=/[()]/.test(source)?[]:[...source.matchAll(/(?:^|(?=[+-]))([+-]?\s*(?:\d+(?:\/\d+)?|\d*\.\d+)?)\s*([a-z])(?![a-z])/gi)].map(m=>({coefficient:num(m[1].replace(/\s/g,'')||'1'),variable:m[2]})).filter(x=>Number.isFinite(x.coefficient));
    let s=header(600,310);s+=text(300,40,p.prompt,16);const tiles=[];
    for(const term of terms){const count=Math.min(12,Math.ceil(Math.abs(term.coefficient)));for(let i=0;i<count;i++)tiles.push({variable:term.variable,sign:term.coefficient<0?-1:1,amount:Math.min(1,Math.abs(term.coefficient)-i)});}
    tiles.slice(0,28).forEach((tile,i)=>{const start=[55+(i%10)*49,90+Math.floor(i/10)*61],positiveIndex=tiles.slice(0,i).filter(q=>q.sign===tile.sign).length,finish=tile.sign>0?[55+(positiveIndex%7)*49,95+Math.floor(positiveIndex/7)*58]:[365+(positiveIndex%4)*49,95+Math.floor(positiveIndex/4)*58],x=start[0]+(finish[0]-start[0])*progress,y=start[1]+(finish[1]-start[1])*progress;s+=`<rect x="${x}" y="${y}" width="38" height="42" rx="6" fill="${tile.sign<0?CORAL:BLUE}" fill-opacity=".25" stroke="${tile.sign<0?CORAL:BLUE}"/>`+text(x+19,y+27,(tile.sign<0?'−':'+')+(tile.amount===1?'':fmt(tile.amount))+tile.variable,13,tile.sign<0?CORAL:BLUE);});
    if(!tiles.length)s+=text(300,155,index<0?'First, rewrite the expression.':source,18);
    stage.innerHTML=s+'</svg>';readout.textContent=tiles.length?(progress>.98?'Group matching variables and opposite signs.':'Variable tiles; constants stay in the expression.'):'Inspect each equivalent form.';
    caption.textContent=index<0?(p.allowSolutions?'Reveal an algebra step, then inspect or group its variable terms.':guidanceFor(p).steps[0]):p.steps?.[index]||'';
  }
  controls.append(btn('Group tiles',()=>ctx.animate(t=>{progress=t;draw();},1000)));if(p.allowSolutions)controls.append(btn('Next algebra step',()=>{ctx.assist();index=Math.min((p.steps?.length||1)-1,index+1);progress=0;draw();}));controls.append(btn('Reset',()=>{progress=0;index=-1;draw();}));draw();
}

function fractionLab(ctx){const {p,stage,readout,controls,caption}=ctx;const raw=p.prompt||'',matches=[...raw.matchAll(/([-−]?\d+)\s*\/\s*(\d+)/g)].slice(0,3);let fs=matches.map(m=>({n:Number(m[1].replace('−','-')),d:+m[2]}));if(!fs.length){const ns=[...raw.matchAll(/[-−]?\d+(?:\.\d+)?/g)].map(m=>num(m[0]));const pct=/percent|%/i.test(p.description);fs=[{n:ns[0]||25,d:pct?100:10}];}
  let t=0;const denominator=fs.reduce((a,f)=>lcm(a,f.d),1);const common=denominator<=36?denominator:null;const slider=ctx.slider('Partition',0,1,0,.01,n=>{t=n;draw();});
  function draw(){if(common&&t>.5)ctx.assist();let s=header(600,Math.max(260,fs.length*75+70));fs.forEach((f,row)=>{const y=48+row*78,parts=common&&t>.5?common:f.d,numUnits=Math.max(1,Math.ceil(Math.abs(f.n/f.d))),maxUnits=Math.max(...fs.map(g=>Math.max(1,Math.ceil(Math.abs(g.n/g.d))))),unitWidth=410/maxUnits;const cols=Math.min(parts,100);for(let unit=0;unit<numUnits;unit++){for(let k=0;k<cols;k++){const x=100+unit*unitWidth+k*unitWidth/cols,filled=clamp(Math.abs(f.n/f.d)-unit,0,1)*cols>k;const fraction=clamp((Math.abs(f.n/f.d)-unit)*cols-k,0,1);s+=`<rect x="${x}" y="${y}" width="${unitWidth/cols}" height="40" fill="white" stroke="#bfcddb" stroke-width="1"/>`;if(filled)s+=`<rect x="${x+1}" y="${y+1}" width="${Math.max(0,(unitWidth/cols-2)*fraction)}" height="38" fill="${f.n<0?CORAL:row%2?TEAL:BLUE}" fill-opacity=".5"/>`;}}
      const n=common&&t>.5?f.n*common/f.d:f.n,d=common&&t>.5?common:f.d;s+=text(52,y+27,`${fmt(n)}/${d}`,17,f.n<0?CORAL:BLUE);});s+=text(300,fs.length*78+40,common&&t>.5?'Same amounts. Matching-size pieces.':'Each strip uses the same whole.',14);stage.innerHTML=s+'</svg>';readout.textContent=common&&t>.5?`Common denominator: ${common}`:'Equivalent partitions';slider.set(t);}
  addAnimation(ctx,n=>{t=n;draw();});controls.append(btn('Matching pieces',()=>{t=1;draw();}));caption.textContent=fs.some(f=>f.n<0)?'Coral represents a negative amount; length shows its magnitude.':'Repartitioning changes the number of pieces, not the amount.';draw();}
function gcd(a,b){while(b){[a,b]=[b,a%b];}return Math.abs(a)||1;}function lcm(a,b){return Math.abs(a*b)/gcd(a,b);}

function numberLab(ctx){const {p,stage,readout,controls,caption}=ctx;const raw=String(p.prompt||'').replace(/−/g,'-');const ns=[...raw.matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>+m[0]);let a=ns[0]??0,b=ns[1]??0;const isAdd=/[+]/.test(raw),isSubtract=/-/.test(raw.slice(raw.indexOf(String(a))+String(a).length)),op=isAdd?'+':isSubtract?'−':/[×*]/.test(raw)?'×':/[÷]/.test(raw)?'÷':null;let result=op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:op==='÷'&&b?a/b:a;const simple=(op==='+'||op==='−')&&ns.length===2&&/^[\s()\d.+−\-]+$/.test(String(p.prompt));let t=0;const low=Math.floor(Math.min(0,a,result,...ns.slice(0,8))-2),high=Math.ceil(Math.max(0,a,result,...ns.slice(0,8))+2),span=high-low;const X=n=>45+(n-low)/span*510;const slider=simple?ctx.slider('Move',0,1,0,.01,n=>{t=n;draw();}):{set(){}};
  function draw(){if(simple&&t>.98)ctx.assist();let s=header(600,280),step=span>30?Math.ceil(span/15):1;s+=path('M40 180H560',GRAY,2);for(let n=Math.ceil(low/step)*step;n<=high;n+=step){s+=path(`M${X(n)} 173V187`,'#9baebf',1);s+=text(X(n),206,fmt(n),11);}if(simple){const end=a+(result-a)*t;const dir=result>=a?1:-1;s+=path(`M${X(a)} 158Q${(X(a)+X(end))/2} ${80-Math.abs(X(end)-X(a))*.05} ${X(end)} 158`,BLUE,3);s+=`<circle cx="${X(a)}" cy="180" r="5" fill="${GRAY}"/><circle cx="${X(end)}" cy="180" r="8" fill="${BLUE}"/>`;s+=text(X(a),238,'start '+fmt(a),13);readout.textContent=t>.98&&p.allowSolutions?`${fmt(a)} ${op} ${fmt(b)} = ${fmt(result)}`:`${fmt(a)} ${op} ${fmt(b)}`;caption.textContent=`Move ${dir>0?'right':'left'} ${fmt(Math.abs(result-a))} units.`;}else{const sorted=ns.slice(0,8);sorted.forEach((n,i)=>{const y=140-i%2*35;s+=`<circle cx="${X(clamp(n,low,high))}" cy="180" r="6" fill="${i%2?TEAL:BLUE}"/>`+text(X(clamp(n,low,high)),y,fmt(n),15,i%2?TEAL:BLUE);});readout.textContent='Inspect the quantities';caption.textContent='The horizontal scale shows order and distance.';}stage.innerHTML=s+'</svg>';slider.set(t);}
  if(simple)addAnimation(ctx,n=>{t=n;draw();});if(p.allowSolutions&&!simple&&p.steps?.length){controls.append(btn('Reveal next step',()=>{ctx.assist();const old=controls.dataset.step?+controls.dataset.step:0;caption.textContent=p.steps[old%p.steps.length];controls.dataset.step=old+1;}));}draw();}

function sequenceLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,prefix=String(p.prompt).split(/…|\.\.\.|:/)[0];
  if(!p.allowSolutions&&/^Rule:/i.test(String(p.prompt))){fallbackLab(ctx);return;}
  const given=[...prefix.replace(/−/g,'-').matchAll(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/g)].map(m=>num(m[0]));
  const ns=!p.allowSolutions?given:p.sequence?Array.from({length:6},(_,i)=>p.sequence.kind==='geometric'?p.sequence.first*Math.pow(p.sequence.ratio,i):p.sequence.first+i*p.sequence.difference):Array.isArray(p.terms)?p.terms:[...prefix.replace(/−/g,'-').matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>Number(m[0])).slice(0,6);let count=Math.min(2,ns.length);
  function draw(){if(count>given.length)ctx.assist();const shown=ns.slice(0,count),negative=shown.some(n=>n<0),positive=shown.some(n=>n>0),baseline=negative?(positive?150:65):230,max=Math.max(1,...shown.map(Math.abs)),height=negative&&positive?90:155;let s=header(600,330);s+=path(`M50 ${baseline}H550`,GRAY,1.2)+text(36,baseline+4,'0',12);shown.forEach((n,i)=>{const h=Math.abs(n)/max*height,y=n<0?baseline:baseline-h;s+=`<rect x="${65+i*78}" y="${y}" width="48" height="${h}" rx="3" fill="${n<0?CORAL:BLUE}" fill-opacity=".45"/>`+text(89+i*78,298,String(i+1),12)+text(89+i*78,n<0?y+h+19:y-10,fmt(n),16);});s+=text(300,320,'Position in the sequence',12);stage.innerHTML=s+'</svg>';readout.textContent='Look for the repeated change';caption.textContent=p.allowSolutions?'Reveal one term at a time. Compare adding with multiplying.':'Compare the given terms. Use their repeated change to predict the next term.';}
  controls.append(btn(p.allowSolutions?'Next term':'Inspect next given term',()=>{count=Math.min(ns.length,count+1);draw();}),btn('Reset',()=>{count=Math.min(2,ns.length);draw();}));draw();
}

function inequalityLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,v=p.visual||{};
  const min=Number(v.min??-12),max=Number(v.max??12);let boundary=0,relation='>';const saved=String(p.userAnswer||'').match(/[a-z]\s*([<>≤≥])\s*([−-]?\d+(?:\.\d+)?)/i);if(saved){relation=saved[1];boundary=clamp(num(saved[2]),min,max);}
  const X=x=>45+(x-min)/(max-min)*510;
  const slider=ctx.slider('Boundary',min,max,boundary,.5,n=>{boundary=n;draw();});
  const tabs=el('div','lab-tabs');['<','≤','>','≥'].forEach(r=>tabs.append(btn(`x ${r} boundary`,()=>{relation=r;draw();})));controls.append(tabs);
  function draw(){let s=header(600,250);s+=path('M40 140H560',GRAY,2);const step=max-min>24?2:1;for(let n=min;n<=max;n+=step){s+=path(`M${X(n)} 134V146`,GRAY,1);s+=text(X(n),165,fmt(n),11);}const right=relation==='>'||relation==='≥',end=right?555:45,closed=relation==='≤'||relation==='≥';s+=path(`M${X(boundary)} 140H${end}`,BLUE,5);s+=path(`M${end+(right?-9:9)} 134L${end} 140L${end+(right?-9:9)} 146`,BLUE,3);s+=`<circle cx="${X(boundary)}" cy="140" r="7" stroke="${BLUE}" stroke-width="3" fill="${closed?BLUE:'white'}"/>`;s+=text(300,70,`x ${relation} ${fmt(boundary)}`,23,BLUE);stage.innerHTML=s+'</svg>';readout.textContent=closed?'Filled circle: boundary is included.':'Open circle: boundary is excluded.';[...tabs.children].forEach((b,i)=>b.setAttribute('aria-pressed',String(['<','≤','>','≥'][i]===relation)));slider.set(boundary);}
  controls.append(btn('Use my graph',()=>ctx.onChange({kind:'answer',value:`x ${relation} ${fmt(boundary)}`})),btn('Reset',()=>{boundary=0;relation='>';draw();}));caption.textContent='Solve the given inequality, then set its boundary and direction.';draw();
}

function segmentLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,v=p.visual;const lengths=(v.lengths||[]).map(s=>Number(s.length));const [a,b,c]=lengths.length>=3?lengths:[2,3,6];const longest=Math.max(a,b,c),scale=340/(Math.max(a+b,c)||1);let angle=35;
  const slider=ctx.slider('Hinge',0,180,angle,1,n=>{angle=n;draw();});
  function draw(){const start=[100,230],end=[100+c*scale,230],ar=angle*Math.PI/180,tip=[start[0]+a*scale*Math.cos(ar),start[1]-a*scale*Math.sin(ar)];const dx=tip[0]-end[0],dy=tip[1]-end[1],dist=Math.hypot(dx,dy)||1,tip2=[end[0]+dx/dist*b*scale,end[1]+dy/dist*b*scale];let s=header(600,320);s+=path(`M${start.join(' ')}L${end.join(' ')}`,GRAY,4);s+=path(`M${start.join(' ')}L${tip.join(' ')}`,BLUE,5);s+=path(`M${end.join(' ')}L${tip2.join(' ')}`,TEAL,5);s+=path(`M${tip.join(' ')}L${tip2.join(' ')}`,CORAL,2,'stroke-dasharray="5 4"');[start,end,tip,tip2].forEach(q=>s+=`<circle cx="${q[0]}" cy="${q[1]}" r="5" fill="${GRAY}"/>`);s+=text((start[0]+end[0])/2,255,c+' units',14);s+=text((start[0]+tip[0])/2-14,(start[1]+tip[1])/2-12,a+' units',14,BLUE);s+=text((end[0]+tip2[0])/2+14,(end[1]+tip2[1])/2-12,b+' units',14,TEAL);stage.innerHTML=s+'</svg>';const gap=Math.abs(dist-b)/scale;readout.textContent=gap<.08?'The segments meet.':`Gap: ${fmt(gap)} units`;slider.set(angle);}
  addAnimation(ctx,t=>{angle=180*t;draw();},{duration:2500});caption.textContent='The three lengths stay fixed. Move the hinge to test whether the endpoints can meet.';draw();
}

function percentLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,raw=String(p.prompt||'');const m=raw.match(/([-−]?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?)\s*%/);const given=m?num(m[1]):0;let percent=given,step=-1;
  const slider=ctx.slider('Percent',0,100,percent,.5,n=>{percent=n;draw();});
  function draw(){if(given||step>=0)ctx.assist();let s=header(600,315);for(let i=0;i<100;i++){const x=185+(i%10)*23,y=25+Math.floor(i/10)*23,amount=clamp(percent-i,0,1);s+=`<rect x="${x}" y="${y}" width="21" height="21" rx="2" fill="#e9eef3"/>`;if(amount)s+=`<rect x="${x}" y="${y}" width="${21*amount}" height="21" rx="2" fill="${BLUE}"/>`;}s+=text(300,285,'100 equal parts = one whole',14);stage.innerHTML=s+'</svg>';readout.textContent=p.allowSolutions?`${fmt(percent)}% = ${fmt(percent)}/100 = ${fmt(percent/100)}`:`${fmt(percent)}% · 100 equal parts make one whole`;slider.set(percent);caption.textContent=step<0?'Use the grid to connect a percent, a fraction, and a decimal.':p.steps?.[step]||'';}
  controls.append(btn('Given percent',()=>{percent=given;step=-1;draw();}));if(p.allowSolutions)controls.append(btn('Next calculation step',()=>{ctx.assist();step=Math.min((p.steps?.length||1)-1,step+1);draw();}));addAnimation(ctx,t=>{percent=given?given*t:100*t;draw();});draw();
}

function multiplyLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,raw=String(p.prompt).replace(/−/g,'-'),ns=[...raw.matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>+m[0]);
  const a=ns[0]??0,b=ns[1]??1,divide=/÷/.test(raw),answer=divide?a/b:a*b,groups=divide?Math.abs(b):Math.abs(a),per=divide?Math.abs(a/b):Math.abs(b);let t=0;
  if(!Number.isInteger(groups)||!Number.isInteger(per)||groups>16||per>30||groups===0){numberLab(ctx);return;}
  const slider=ctx.slider(divide?'Share equally':'Build groups',0,1,0,.01,n=>{t=n;draw();});
  function draw(){if(t>.99)ctx.assist();const cols=Math.min(groups,4),rows=Math.ceil(groups/cols),cellW=120,cellH=Math.min(90,220/rows);let s=header(600,330);const visible=Math.round(groups*per*t);for(let g=0;g<groups;g++){const x=60+(g%cols)*cellW,y=35+Math.floor(g/cols)*cellH;s+=`<rect x="${x}" y="${y}" width="110" height="${cellH-9}" rx="9" fill="none" stroke="#c9d5e1"/>`;for(let k=0;k<per;k++){const index=divide?k*groups+g:g*per+k;if(index>=visible)continue;const cx=x+12+(k%6)*16,cy=y+14+Math.floor(k/6)*13;s+=`<circle cx="${cx}" cy="${cy}" r="5.5" fill="${answer<0?CORAL:BLUE}"/>`;s+=text(cx,cy+2.8,answer<0?'−':'+',9,'white');}}s+=text(300,294,divide?`${fmt(a)} shared into ${groups} equal groups`:`${groups} groups of ${per}; ${answer<0?'negative':'positive'} product`,15);stage.innerHTML=s+'</svg>';readout.textContent=p.allowSolutions?(t>.99?`${fmt(a)} ${divide?'÷':'×'} ${fmt(b)} = ${fmt(answer)}`:`${visible} counters placed`):'Count the counters in equal groups to find the result.';slider.set(t);}
  addAnimation(ctx,n=>{t=n;draw();},{duration:2000});caption.textContent='Counters show magnitude; their signs show whether the result is positive or negative.';draw();
}

function fallbackLab(ctx){const {p,stage,controls,readout,caption}=ctx;let step=-1;function draw(){stage.innerHTML=p.visual?`<div class="lab-static">${renderDiagram(p.visual,{answer:false})}</div>`:`<div class="lab-equation math-copy">${mathHTML(p.prompt)}</div>`;readout.textContent=step<0?'Inspect the problem':`Step ${step+1}`;caption.textContent=step<0?(p.allowSolutions?'Reveal a step when you need it.':guidanceFor(p).steps[0]):p.steps?.[step]||'';}if(p.allowSolutions)controls.append(btn('Next step',()=>{ctx.assist();step=Math.min((p.steps?.length||1)-1,step+1);draw();}));controls.append(btn('Reset',()=>{step=-1;draw();}));draw();}

function measureLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,v=p.visual,L=Number(v.measureLength),unit=v.unit||p.unit||'unit';let count=0;const X=x=>60+x/L*480;
  const slider=ctx.slider('Count intervals',0,L,0,1,n=>{count=n;draw();});
  function draw(){if(count===L)ctx.assist();let s=header(600,280);s+=path('M60 135H540',GRAY,3);for(let i=0;i<=L;i++){s+=path(`M${X(i)} 120V150`,GRAY,2);if(i<count)s+=path(`M${X(i)+2} 135H${X(i+1)-2}`,i%2?TEAL:BLUE,7);if(i>0&&i<=count)s+=text((X(i-1)+X(i))/2,104,i,16,i%2?BLUE:TEAL);}s+=text(300,205,`1 interval = 1 ${unit}`,18);stage.innerHTML=s+'</svg>';readout.textContent=count?(p.allowSolutions?`${count} equal interval${count===1?'':'s'}`:'Count each highlighted interval once.'):'Start at the first tick mark';slider.set(count);}
  controls.append(btn('One more interval',()=>{count=Math.min(L,count+1);draw();}));addAnimation(ctx,t=>{count=Math.round(L*t);draw();},{duration:1800});caption.textContent='Count the spaces between the marks. Every interval has the same length.';draw();
}

function decimalLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,ns=[...String(p.prompt).replace(/−/g,'-').matchAll(/-?\d+(?:\.\d+)?/g)].map(m=>+m[0]);const a=ns[0],b=ns[1],division=p.family==='decimal-divide';let t=0,index=-1;
  if(!Number.isFinite(a)||!Number.isFinite(b)||b===0){numberLab(ctx);return;}
  const slider=ctx.slider(division?'Equal groups':'Cover area',0,1,0,.01,n=>{t=n;draw();});
  function draw(){if(t>.99||index>=0)ctx.assist();let s=header(600,330);if(division){const count=Math.abs(a/b),max=Math.max(Math.abs(a),Math.abs(b)),scale=480/max;const visible=count*t;s+=`<rect x="60" y="110" width="${Math.abs(a)*scale}" height="55" fill="#e9eef3" stroke="${GRAY}"/>`;for(let i=0;i<Math.min(60,Math.ceil(visible));i++){const amount=Math.min(1,visible-i),w=Math.min(Math.abs(b),Math.abs(a)-i*Math.abs(b))*scale;if(w>0)s+=`<rect x="${60+i*Math.abs(b)*scale}" y="110" width="${w*amount}" height="55" fill="${i%2?TEAL:BLUE}" fill-opacity=".45" stroke="white"/>`;}s+=text(300,82,`${fmt(Math.abs(a))} units`,18)+text(300,210,`Each group: ${fmt(Math.abs(b))}`,17);readout.textContent=t>.99&&p.allowSolutions?`${fmt(count)} groups by magnitude`:'Measure how many groups fit';}
    else{const w=Math.abs(a),h=Math.abs(b),scale=Math.min(400/(w||1),180/(h||1)),left=(600-w*scale)/2,top=(250-h*scale)/2;let step=.1;while((w/step)*(h/step)>900)step*=10;s+=`<rect x="${left}" y="${top}" width="${w*scale}" height="${h*scale}" fill="#edf2f6"/>`;s+=`<rect x="${left}" y="${top}" width="${w*scale*t}" height="${h*scale}" fill="${a*b<0?CORAL:BLUE}" fill-opacity=".4"/>`;for(let x=0;x<=w+1e-7;x+=step)s+=path(`M${left+x*scale} ${top}v${h*scale}`,'#b8c7d4',.6);for(let y=0;y<=h+1e-7;y+=step)s+=path(`M${left} ${top+y*scale}h${w*scale}`,'#b8c7d4',.6);s+=`<rect x="${left}" y="${top}" width="${w*scale}" height="${h*scale}" fill="none" stroke="${BLUE}" stroke-width="2"/>`;s+=text(300,top+h*scale+25,fmt(w),18)+text(left-25,top+h*scale/2+5,fmt(h),18)+text(300,295,`Each small square: ${fmt(step)} × ${fmt(step)} = ${fmt(step*step)}`,15);readout.textContent=t>.99&&p.allowSolutions?`${fmt(a)} × ${fmt(b)} = ${fmt(a*b)}`:'Side lengths multiply to give area';}
    stage.innerHTML=s+'</svg>';slider.set(t);caption.textContent=index<0?(a*b<0?'The model shows magnitude. Opposite signs give a negative result.':'Use equal-size pieces to track decimal places.'):p.steps?.[index]||'';}
  if(p.allowSolutions)controls.append(btn('Next calculation step',()=>{ctx.assist();index=Math.min((p.steps?.length||1)-1,index+1);draw();}));addAnimation(ctx,n=>{t=n;draw();},{duration:1800});draw();
}

function perimeterLab(ctx){
  const {p,stage,readout,caption}=ctx,v=p.visual,ps=v.points||v.vertices;const lengths=ps.map((q,i)=>Math.hypot(q[0]-ps[(i+1)%ps.length][0],q[1]-ps[(i+1)%ps.length][1])),total=lengths.reduce((a,b)=>a+b,0),xs=ps.map(q=>q[0]),ys=ps.map(q=>q[1]),scale=Math.min(400/(Math.max(...xs)-Math.min(...xs)),180/(Math.max(...ys)-Math.min(...ys))),X=x=>300+(x-(Math.min(...xs)+Math.max(...xs))/2)*scale,Y=y=>150-(y-(Math.min(...ys)+Math.max(...ys))/2)*scale;let t=0;
  const slider=ctx.slider('Trace boundary',0,1,0,.01,n=>{t=n;draw();});
  function draw(){if(t>.99)ctx.assist();let s=header(600,340)+poly(ps.map(q=>[X(q[0]),Y(q[1])]),BLUE,.05,GRAY),remaining=total*t;ps.forEach((q,i)=>{const r=ps[(i+1)%ps.length],amount=clamp(remaining/lengths[i],0,1);remaining-=lengths[i];if(amount)s+=path(`M${X(q[0])} ${Y(q[1])}L${X(q[0]+(r[0]-q[0])*amount)} ${Y(q[1]+(r[1]-q[1])*amount)}`,i%2?TEAL:BLUE,5);s+=text((X(q[0])+X(r[0]))/2+(q[0]===r[0]?(q[0]>Math.min(...xs)?20:-20):0),(Y(q[1])+Y(r[1]))/2+(q[1]===r[1]?(q[1]===Math.min(...ys)?25:-15):0),fmt(lengths[i]),17);});s+=text(300,304,'Perimeter = the complete boundary',16);stage.innerHTML=s+'</svg>';readout.textContent=t>.99&&p.allowSolutions?`${lengths.map(fmt).join(' + ')} = ${fmt(total)} ${v.unit||p.unit||'units'}`:'Follow each edge exactly once';slider.set(t);}
  addAnimation(ctx,n=>{t=n;draw();},{duration:2400});caption.textContent='The size of the shape stays fixed. Add the lengths around its outside.';draw();
}

function inspectGridLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,v=p.visual;let marker=null;
  function draw(){if(marker)ctx.assist();stage.innerHTML=`<div class="lab-static">${renderDiagram(marker?{...v,points:[...(v.points||[]),marker]}:v,{answer:false})}</div>`;readout.textContent=marker?(p.allowSolutions?`${marker.label} = (${fmt(marker.x)}, ${fmt(marker.y)})`:`${marker.label}: read horizontal position, then vertical position.`):'Inspect the given coordinates';}
  for(const [i,q]of(v.points||[]).entries()){const point=Array.isArray(q)?{x:q[0],y:q[1],label:String.fromCharCode(65+i)}:q;controls.append(btn(point.label||`Point ${i+1}`,()=>{marker=point;draw();}));}
  if(v.line){const k=v.line.k??v.line.slope??1,b=v.line.b??0,xmin=v.xMin??v.min??-5,xmax=v.xMax??v.max??5,ymin=v.yMin??v.min??-5,ymax=v.yMax??v.max??5,lo=k?Math.max(xmin,Math.min((ymin-b)/k,(ymax-b)/k)):xmin,hi=k?Math.min(xmax,Math.max((ymin-b)/k,(ymax-b)/k)):xmax;ctx.slider('Move along line',lo,hi,clamp(0,lo,hi),.1,x=>{marker={x,y:k*x+b,label:'P'};draw();});}
  controls.append(btn('Given graph',()=>{marker=null;draw();}));caption.textContent=v.line?'Move a point along the given line. Read x first, then y.':'Select a label to inspect its ordered pair. Horizontal position is x; vertical position is y.';draw();
}

function rationalLineLab(ctx){
  const {p,stage,controls,readout,caption}=ctx,kind=p.family,raw=String(p.prompt).replace(/−/g,'-');const tokens=[...raw.matchAll(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/g)].map(m=>({n:num(m[0]),label:m[0].replace(/-/g,'−')}));const unique=tokens.filter((q,i)=>tokens.findIndex(r=>r.n===q.n)===i),a=tokens[0]?.n??0,b=tokens[1]?.n??0;let t=0,mode='given',count=0;
  const values=kind==='absolute-opposite'?[a,-a,0]:unique.map(q=>q.n),lo=Math.floor(Math.min(0,...values)-1),hi=Math.ceil(Math.max(0,...values)+1),X=x=>50+(x-lo)/(hi-lo)*500,sorted=[...unique].sort((a,b)=>a.n-b.n);let slider;
  function draw(){if((kind==='number-distance'&&t>.99)||(kind==='absolute-opposite'&&mode!=='given'))ctx.assist();let s=header(600,300),step=hi-lo>22?Math.ceil((hi-lo)/14):1;s+=path('M45 175H555',GRAY,2);for(let n=Math.ceil(lo/step)*step;n<=hi;n+=step){s+=path(`M${X(n)} 169V181`,GRAY,1);s+=text(X(n),204,fmt(n),12);}if(kind==='order-rational'){unique.forEach((q,i)=>{s+=`<circle cx="${X(q.n)}" cy="175" r="6" fill="${i%2?TEAL:BLUE}"/>`+text(X(q.n),143-(i%2)*30,q.label,18,i%2?TEAL:BLUE);});if(count&&p.allowSolutions)s+=text(300,265,sorted.slice(0,count).map(q=>q.label).join(' < '),19);readout.textContent='Smaller numbers lie farther left';}
    else if(kind==='number-distance'){const x=a+(b-a)*t;s+=path(`M${X(a)} 145H${X(x)}`,TEAL,5)+`<circle cx="${X(a)}" cy="175" r="6" fill="${GRAY}"/><circle cx="${X(x)}" cy="175" r="8" fill="${BLUE}"/>`;s+=text(X(a),240,'start '+fmt(a),14);readout.textContent=t>.99&&p.allowSolutions?`Distance = ${fmt(Math.abs(b-a))}`:'Distance measures the length between two points';}
    else{const target=mode==='opposite'?-a:mode==='absolute'?Math.abs(a):a;s+=`<circle cx="${X(a)}" cy="175" r="6" fill="${GRAY}"/>`;s+=path(`M${X(0)} 145H${X(target)}`,TEAL,4);s+=`<circle cx="${X(target)}" cy="175" r="8" fill="${BLUE}"/>`+text(X(target),112,p.allowSolutions||mode==='given'?fmt(target):'?',21,BLUE);readout.textContent=mode==='opposite'?(p.allowSolutions?`Opposite of ${fmt(a)}: ${fmt(-a)}`:'Reflect across zero to find the opposite.'):mode==='absolute'?(p.allowSolutions?`|${fmt(a)}| = ${fmt(Math.abs(a))}`:'Measure the distance from zero.'):`Given number: ${fmt(a)}`;}
    stage.innerHTML=s+'</svg>';slider?.set(t);}
  if(kind==='order-rational'){if(p.allowSolutions)controls.append(btn('Read from left to right',()=>{ctx.assist();count=Math.min(sorted.length,count+1);draw();}));controls.append(btn('Reset',()=>{count=0;draw();}));caption.textContent='Each point uses its actual value, including fractions and decimals.';}
  else if(kind==='number-distance'){slider=ctx.slider('Move between points',0,1,0,.01,n=>{t=n;draw();});addAnimation(ctx,n=>{t=n;draw();});caption.textContent='Distance is nonnegative. Count the total length, even when the points are on opposite sides of zero.';}
  else{controls.append(btn('Given number',()=>{mode='given';draw();}),btn('Reflect: opposite',()=>{mode='opposite';draw();}),btn('Distance: absolute value',()=>{mode='absolute';draw();}));caption.textContent='Opposites reflect across zero. Absolute value is the distance from zero.';}draw();
}

function fractionProductLab(ctx){
  const {p,stage,readout,caption}=ctx,fs=[...String(p.prompt).matchAll(/([-−]?\d+)\s*\/\s*(\d+)/g)].map(m=>({n:num(m[1]),d:+m[2]}));if(fs.length!==2){fractionLab(ctx);return;}const a=fs[0],b=fs[1],w=Math.abs(a.n/a.d),h=Math.abs(b.n/b.d),W=Math.max(1,Math.ceil(w)),H=Math.max(1,Math.ceil(h)),scale=Math.min(380/W,190/H),left=(600-W*scale)/2,top=45;let t=0;
  const slider=ctx.slider('Overlap the factors',0,1,0,.01,n=>{t=n;draw();});
  function draw(){if(t>.99)ctx.assist();let s=header(600,340);s+=`<rect x="${left}" y="${top}" width="${W*scale}" height="${H*scale}" fill="#f3f6f8"/><rect x="${left}" y="${top}" width="${w*scale}" height="${H*scale}" fill="${BLUE}" fill-opacity=".16"/><rect x="${left}" y="${top}" width="${W*scale}" height="${h*scale*t}" fill="${TEAL}" fill-opacity=".16"/><rect x="${left}" y="${top}" width="${w*scale}" height="${h*scale*t}" fill="${a.n*b.n<0?CORAL:TEAL}" fill-opacity=".38"/>`;for(let i=0;i<=W*a.d;i++){s+=path(`M${left+i/a.d*scale} ${top}v${H*scale}`,i%a.d?'#b9cbd6':GRAY,i%a.d?.6:1.7)}for(let j=0;j<=H*b.d;j++){s+=path(`M${left} ${top+j/b.d*scale}h${W*scale}`,j%b.d?'#b9cbd6':GRAY,j%b.d?.6:1.7)}s+=text(left+w*scale/2,top-18,`${a.n}/${a.d}`,18,BLUE)+text(left-28,top+h*scale/2,`${b.n}/${b.d}`,18,TEAL)+text(300,295,`Each small part = 1/${a.d*b.d} of a whole square`,16);stage.innerHTML=s+'</svg>';readout.textContent=t>.99&&p.allowSolutions?`${Math.abs(a.n*b.n)} overlapping parts; ${a.n*b.n<0?'negative':'positive'} product`:'One factor across, one factor down; count the overlap.';slider.set(t);}
  addAnimation(ctx,n=>{t=n;draw();},{duration:1800});caption.textContent='Count the overlapping parts. The diagram shows magnitude; use the factor signs for the result.';draw();
}

function rateLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,tokens=[...String(p.prompt).matchAll(/[-−]?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/g)].map(m=>num(m[0])),comparison=p.family==='unit-rate-compare';const pairs=comparison?[[tokens[0],tokens[1]],[tokens[2],tokens[3]]]:[[tokens[0],tokens[1]]];if(pairs.some(([a,b])=>!Number.isFinite(a)||!Number.isFinite(b)||b<=0)){fractionLab(ctx);return;}const timeMax=Math.max(1,...pairs.map(q=>q[1])),distanceMax=Math.max(...pairs.map(([a,b])=>a/b*timeMax)),X=x=>60+x/distanceMax*480;let time=0;
  const slider=ctx.slider('Shared time',0,timeMax,0,timeMax/100,n=>{time=n;draw();});
  function draw(){if(time>0&&pairs.some(([,duration])=>Math.abs(time-duration)>1e-8))ctx.assist();let s=header(600,310);pairs.forEach(([amount,duration],i)=>{const y=100+i*105,distance=amount/duration*time;s+=path(`M60 ${y}H540`,GRAY,1.4)+path(`M60 ${y}H${X(distance)}`,i?TEAL:BLUE,5);s+=`<circle cx="${X(distance)}" cy="${y}" r="10" fill="${i?TEAL:BLUE}"/>`;s+=text(300,y-33,`${comparison?(i?'B: ':'A: '):''}${fmt(amount)} per ${fmt(duration)} time units`,17)+text(X(distance),y+29,p.allowSolutions||Math.abs(time-duration)<1e-8?fmt(distance):'?',17);});s+=text(300,285,`Elapsed time: ${fmt(time)}`,17);stage.innerHTML=s+'</svg>';readout.textContent=time===1?'At one time unit, the distance shows the unit rate.':'Compare equal time intervals';slider.set(time);}
  controls.append(btn('One time unit',()=>{time=1;draw();}),btn('Given time',()=>{time=pairs[0][1];draw();}));addAnimation(ctx,n=>{time=timeMax*n;draw();},{duration:2000});caption.textContent='The dots move at the rates in this problem. One shared scale makes comparison possible.';draw();
}

function proportionLab(ctx){
  const {p,stage,readout,controls,caption}=ctx,raw=String(p.prompt).replace(/−/g,'-'),parse=s=>[...s.matchAll(/-?\d+(?:\.\d+)?(?:\s*\/\s*\d+(?:\.\d+)?)?/g)].map(m=>num(m[0]));let xs=[],ys=[];const tables=raw.match(/x\s*:\s*([^;]+);\s*y\s*:\s*(.+)/i);if(tables){xs=parse(tables[1]);ys=parse(tables[2]);}else{const equation=raw.match(/y\s*=\s*\(?([−-]?\d+(?:\.\d+)?(?:\/\d+)?)\)?\s*x/i),values=raw.match(/when\s*x\s*=\s*(.+)/i);if(equation&&values){xs=parse(values[1]);ys=xs.map(x=>x*num(equation[1]));}}
  if(!xs.length||xs.length!==ys.length){algebraLab(ctx);return;}let selected=0,showRatio=false;const calculated=!tables;const max=Math.max(1,...xs.map(Math.abs),...ys.map(Math.abs)),scale=420/max;
  function draw(){if(calculated||showRatio)ctx.assist();let s=header(600,310);const x=xs[selected],y=ys[selected];[[x,BLUE,'x'],[y,TEAL,'y']].forEach(([v,color,name],i)=>{const yy=95+i*85;s+=text(50,yy+24,name,22,color)+`<rect x="80" y="${yy}" width="${Math.abs(v)*scale}" height="34" fill="${color}" fill-opacity=".35"/>`+text(80+Math.abs(v)*scale+25,yy+23,!p.allowSolutions&&calculated&&name==='y'?'?':fmt(v),20,color);});s+=text(300,265,`Pair ${selected+1}: (${fmt(x)}, ${!p.allowSolutions&&calculated?'?':fmt(y)})`,18);stage.innerHTML=s+'</svg>';readout.textContent=showRatio&&p.allowSolutions?(x===0?'At x = 0, inspect whether y is also 0.':`y ÷ x = ${fmt(y)} ÷ ${fmt(x)} = ${fmt(y/x)}`):'Compare each pair using the same scale';caption.textContent='A proportional relationship keeps y ÷ x constant and passes through (0, 0).';}
  xs.forEach((x,i)=>controls.append(btn(`Pair ${i+1}`,()=>{selected=i;showRatio=false;draw();})));if(p.allowSolutions)controls.append(btn('Inspect this ratio',()=>{ctx.assist();showRatio=true;draw();}));draw();
}
