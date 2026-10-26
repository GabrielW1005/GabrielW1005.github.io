/* Shared vector diagrams. Mathematical lengths use a single scale in 2D;
   solids use an equal-axis orthographic projection of their 3D coordinates. */
const INK='#233d50', BLUE='#dceaf0', GRID='#dce3e7', RED='#c83232', ACCENT='#247a89';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const n=x=>Math.round(Number(x)*1000)/1000;
const pt=p=>Array.isArray(p)?p:[p.x,p.y];
const iso=p=>[Math.sqrt(3)/2*(p[0]+p[1]),p[2]+(p[1]-p[0])/2];
const isRectilinearL=ps=>ps?.length===6&&ps.every((p,i)=>{const q=ps[(i+1)%ps.length];return Math.abs(p[0]-q[0])<1e-9||Math.abs(p[1]-q[1])<1e-9;})&&new Set(ps.map(p=>p[0])).size===3&&new Set(ps.map(p=>p[1])).size===3;
const uprightIso=p=>iso([p[0],p[2],p[1]]);
const center=ps=>ps.reduce((a,p)=>[a[0]+p[0]/ps.length,a[1]+p[1]/ps.length],[0,0]);

export function renderDiagram(v,opts={}){
  if(!v)return '';
  const answer=!!opts.answer,W=v.svgWidth||400,H=v.svgHeight||(v.type==='grid'?300:220);
  let shapes=[],labels=[],bounds=[];
  const addPoint=p=>{if(p&&p.length>=2&&p.every(Number.isFinite))bounds.push(p);};
  const line=(a,b,extra={})=>{a=pt(a);b=pt(b);addPoint(a);addPoint(b);shapes.push({kind:'line',a,b,...extra});};
  const poly=(ps,extra={})=>{ps=ps.map(pt);ps.forEach(addPoint);shapes.push({kind:'poly',ps,...extra});};
  const dot=(p,extra={})=>{p=pt(p);addPoint(p);shapes.push({kind:'dot',p,...extra});};
  const label=(p,text,extra={})=>{p=pt(p);addPoint(p);labels.push({p,text,...extra});};
  const segment=(s)=>{const a=s.from||s.a||s.start,b=s.to||s.b||s.end;if(!a||!b)return;line(a,b,{dashed:s.dashed,color:s.color||INK,width:s.width});if(s.label)label(s.labelPosition||center([pt(a),pt(b)]),s.label,{dy:s.labelDy??-9,dx:s.labelDx??0});};
  const customLabels=(ls)=>{for(const l of ls||[])label([l.x,l.y],l.text??l.label,{anchor:l.anchor,dx:l.dx,dy:l.dy,color:l.color});};

  if(v.type==='polygon'){
    poly(v.points||[],{fill:v.fill||BLUE,width:isRectilinearL(v.points)?2.2:1.8});
    if(v.highlight?.points)poly(v.highlight.points,{fill:'#f3d696',color:'#a57931'});
    for(const p of v.polygons||[])poly(p.points||p,{fill:p.fill||BLUE,dashed:p.dashed});
    for(const s of v.segments||[])segment(isRectilinearL(v.points)&&s.dashed?{...s,color:'#879ca5',width:1.1}:s);
    for(const l of v.pointLabels||[])label([l.x,l.y],l.text||l.label,{dx:7,dy:-7});
    if(v.rightAngles)for(const a of v.rightAngles){const p=a.at||a;const r=a.size||.3;poly([[p[0],p[1]+r],[p[0]+r,p[1]+r],[p[0]+r,p[1]]],{open:true,fill:'none'});}
  }else if(v.type==='circle'){
    const r=Number(v.r||1);addPoint([-r,-r]);addPoint([r,r]);shapes.push({kind:'circle',p:[0,0],r,fill:BLUE});dot([0,0]);
    if(v.given==='diameter'){line([-r,0],[r,0]);label([0,0],v.label||`d = ${2*r} ${v.unit||''}`,{dy:17});}
    else if(v.given==='radius'||!v.given){line([0,0],[r,0]);label([r/2,0],v.label||`r = ${r} ${v.unit||''}`,{dy:-10});}
    else if(v.label)label([0,-r],v.label,{dy:23});
    if(v.showRadius&&v.given!=='radius'){line([0,0],[r,0]);if(v.radiusLabel)label([r/2,0],v.radiusLabel,{dy:-12});}
    if(v.showDiameter&&v.given!=='diameter'){line([-r,0],[r,0]);if(v.diameterLabel)label([0,0],v.diameterLabel,{dy:15});}
    if(v.centerLabel)label([0,0],v.centerLabel,{dx:-9,dy:12});
    for(const s of v.segments||[])segment(s);
  }else if(v.type==='angle'){
    const radius=v.radius||5;
    for(const r of v.rays||[]){const deg=typeof r==='number'?r:r.deg;const p=[radius*Math.cos(deg*Math.PI/180),radius*Math.sin(deg*Math.PI/180)];line([0,0],p);if(typeof r==='object'&&r.label)label(p,r.label,{dx:8,dy:-6});}
    dot([0,0]);if(v.vertex)label([0,0],v.vertex,{dx:-12,dy:16});
    for(const [i,a] of (v.arcs||[]).entries()){
      const r=a.radius||radius*.27;let span=a.to-a.from;if(span<0)span+=360;let ps=[];for(let j=0;j<=28;j++){let t=(a.from+span*j/28)*Math.PI/180;ps.push([r*Math.cos(t),r*Math.sin(t)]);}poly(ps,{open:true,fill:'none',width:1.3,color:ACCENT});
      let mid=(a.from+span/2)*Math.PI/180;let lr=a.labelRadius||radius*.53;label([lr*Math.cos(mid),lr*Math.sin(mid)],answer&&a.answer?a.answer:a.label,{color:answer&&a.answer?RED:INK});
    }
    if(v.rightAngle){const d=v.rightAngle.direction||0,r=radius*.2;const tr=p=>[p[0]*Math.cos(d)-p[1]*Math.sin(d),p[0]*Math.sin(d)+p[1]*Math.cos(d)];poly([[r,0],[r,r],[0,r]].map(tr),{open:true,fill:'none'});}
    customLabels(v.rayLabels);
  }else if(v.type==='numberline'){
    const lo=v.min??-8,hi=v.max??8,step=v.step||1;addPoint([lo,-1]);addPoint([hi,1]);line([lo,0],[hi,0]);
    for(let x=lo;x<=hi+.00001;x+=step){line([x,-.10],[x,.10],{width:1});label([x,-.25],n(x),{fontSize:14,dy:10});}
    if(answer&&v.solution){const b=v.solution.boundary,end=v.solution.direction==='left'?lo:hi;line([b,0],[end,0],{color:RED,width:3.5});shapes.push({kind:'boundary',p:[b,0],closed:v.solution.closed});const dir=end===lo?-1:1;line([end,0],[end-dir*.35,.17],{color:RED,width:2.5});line([end,0],[end-dir*.35,-.17],{color:RED,width:2.5});}
  }else if(v.type==='grid'){
    const xmin=v.xMin??v.min??-5,xmax=v.xMax??v.max??5,ymin=v.yMin??v.min??-5,ymax=v.yMax??v.max??5,step=v.step||1;
    addPoint([xmin,ymin]);addPoint([xmax,ymax]);
    for(let x=xmin;x<=xmax+.00001;x+=step){line([x,ymin],[x,ymax],{color:GRID,width:.7});if(Math.abs(x)>1e-9)label([x,0>=ymin&&0<=ymax?0:ymin],n(x),{dy:13,fontSize:14});}
    for(let y=ymin;y<=ymax+.00001;y+=step){line([xmin,y],[xmax,y],{color:GRID,width:.7});if(Math.abs(y)>1e-9)label([0>=xmin&&0<=xmax?0:xmin,y],n(y),{dx:-11,dy:3,fontSize:14});}
    if(ymin<=0&&ymax>=0)line([xmin,0],[xmax,0],{width:1.5});
    if(xmin<=0&&xmax>=0)line([0,ymin],[0,ymax],{width:1.5});
    label([xmax,0>=ymin&&0<=ymax?0:ymin],v.xLabel||'x',{dx:17,dy:4});label([0>=xmin&&0<=xmax?0:xmin,ymax],v.yLabel||'y',{dx:0,dy:-13});
    const plotLine=v.line&&(!v.line.answerOnly||answer)?v.line:answer?v.answerLine:null;
    if(plotLine){const k=plotLine.k??plotLine.slope??1,b=plotLine.b??0;let pts=[];for(const x of [xmin,xmax]){const y=k*x+b;if(y>=ymin&&y<=ymax)pts.push([x,y]);}if(k!==0)for(const y of [ymin,ymax]){const x=(y-b)/k;if(x>=xmin&&x<=xmax)pts.push([x,y]);}if(pts.length>=2)line(pts[0],pts[pts.length-1],{color:answer?RED:ACCENT,width:2.4});}
    for(const p of v.points||[]){dot(pt(p),{color:INK});if(p.label)label(pt(p),p.label,{dx:9,dy:-9});}
    if(answer)for(const p of v.targets||[]){dot(pt(p),{color:RED,radius:4});if(p.label)label(pt(p),p.label,{dx:9,dy:-9,color:RED});}
    if(v.connectPoints&&v.points?.length>1)poly(v.points.map(pt),{open:!v.closedPoints,fill:'none',color:ACCENT});
    if(answer&&v.targetEdges&&(v.targets?.length||0)+(v.points?.length||0)>2)poly((v.targets?.length>=3?v.targets:[...(v.points||[]),...(v.targets||[])]).map(pt),{fill:'none',color:RED,width:2.4});
  }else if(v.type==='prism'&&isRectilinearL(v.base)){
    // Present an L-shaped cross section upright. All three spatial axes retain
    // the same projected scale; the depth recedes behind the readable front.
    // Only opaque visible faces are drawn, so hidden base edges cannot look
    // like extra cuts across the notch.
    const base=v.base.map(pt),d=Number(v.depth||1),front=base.map(p=>uprightIso([...p,0])),back=base.map(p=>uprightIso([...p,d]));
    const signed=base.reduce((sum,a,i)=>{const b=base[(i+1)%base.length];return sum+a[0]*b[1]-b[0]*a[1];},0),winding=Math.sign(signed)||1;
    const faces=[];
    for(let i=0;i<base.length;i++){
      const j=(i+1)%base.length,a=base[i],b=base[j],dx=b[0]-a[0],dy=b[1]-a[1];
      if(winding*(dy-dx)>1e-9)faces.push({i,j,order:(a[0]+b[0]+a[1]+b[1])/2-d/2,fill:Math.abs(dy)>1e-9?'#dceaf0':'#edf4f7'});
    }
    faces.sort((a,b)=>a.order-b.order);
    for(const f of faces)poly([front[f.i],front[f.j],back[f.j],back[f.i]],{fill:f.fill,width:1.6});
    poly(front,{fill:'#f5f9fa',width:2.2});
    const xs=base.map(p=>p[0]),ys=base.map(p=>p[1]),xmin=Math.min(...xs),xmax=Math.max(...xs),ymin=Math.min(...ys),ymax=Math.max(...ys);
    const rightTop=base.filter(p=>Math.abs(p[0]-xmax)<1e-9).reduce((a,b)=>a[1]>b[1]?a:b);
    const depthPoint=uprightIso([rightTop[0],rightTop[1],d/2]),depthLabelPoint=uprightIso([rightTop[0],rightTop[1],d]);
    const custom=v.labels3D||[];
    for(const l of custom){
      const q=l.point||[l.x,l.y,l.z];
      if(q[2]>1e-9&&q[2]<d-1e-9){label(depthLabelPoint,l.text,{dx:14,dy:-20,anchor:'start',leader:true,leaderFrom:depthPoint});continue;}
      const p=uprightIso([q[0],q[1],0]);
      if(Math.abs(q[0]-xmin)<1e-9)label(p,l.text,{dx:-16,anchor:'end'});
      else if(Math.abs(q[1]-ymin)<1e-9)label(p,l.text,{dy:23});
      else if(Math.abs(q[1]-ymax)<1e-9)label(uprightIso([q[0],q[1],d]),l.text,{dy:-24});
      else if(Math.abs(q[0]-xmax)<1e-9)label(uprightIso([q[0],q[1],d]),l.text,{dx:17,anchor:'start'});
      else label(p,l.text,{dx:l.dx,dy:l.dy,anchor:l.anchor});
    }
    if(!custom.length&&v.dimensionLabels!==false){
      for(let i=0;i<base.length;i++){const j=(i+1)%base.length,txt=v.baseLabels?.[i];if(txt)label(center([front[i],front[j]]),txt,{dy:17});}
      label(depthLabelPoint,v.depthLabel||`${n(d)} ${v.unit||''}`,{dx:14,dy:-20,anchor:'start',leader:true,leaderFrom:depthPoint});
    }
    for(const s of v.segments3D||[]){line(uprightIso(s.from),uprightIso(s.to),{dashed:s.dashed,color:s.color,width:s.width});if(s.label)label(uprightIso(s.labelPosition||s.from.map((x,i)=>(x+s.to[i])/2)),s.label,{dx:s.dx,dy:s.dy});}
  }else if(v.type==='prism'){
    const base=v.base||[[0,0],[4,0],[4,3],[0,3]],d=Number(v.depth||1),front=base.map(p=>iso([p[0],p[1],0])),back=base.map(p=>iso([p[0],p[1],d]));
    poly(front,{fill:'#eff5f7',dashed:true});
    let sides=[];for(let i=0;i<base.length;i++){let j=(i+1)%base.length;const a=base[i],b=base[j];if((b[1]-a[1])+(b[0]-a[0])>=-1e-9)sides.push({i,j,order:(a[0]+b[0]-a[1]-b[1])/2});}sides.sort((a,b)=>a.order-b.order);for(const {i,j}of sides)poly([front[i],front[j],back[j],back[i]],{fill:i%2?'#dceaf0':'#edf4f7'});
    poly(back,{fill:'#f5f9fa'});
    const sideVisible=i=>{const a=base[i],b=base[(i+1)%base.length];return b[0]-a[0]+b[1]-a[1]>=-1e-9;};
    for(let i=0;i<base.length;i++){const j=(i+1)%base.length,visible=sideVisible(i);line(front[i],front[j],{dashed:!visible,color:visible?INK:'#9aafb8',width:visible?1.8:1});const vertVisible=visible||sideVisible((i-1+base.length)%base.length);line(front[i],back[i],{dashed:!vertVisible,color:vertVisible?INK:'#9aafb8',width:vertVisible?1.8:1});}

    if(v.showUnitGrid&&base.length===4){const xs=base.map(p=>p[0]),ys=base.map(p=>p[1]),x0=Math.min(...xs),x1=Math.max(...xs),y0=Math.min(...ys),y1=Math.max(...ys);const gridLine=(a,b)=>line(iso(a),iso(b),{color:'#7d9ca8',width:.8});for(let x=x0+1;x<x1;x++){gridLine([x,y0,d],[x,y1,d]);gridLine([x,y0,0],[x,y0,d]);}for(let y=y0+1;y<y1;y++){gridLine([x0,y,d],[x1,y,d]);gridLine([x1,y,0],[x1,y,d]);}for(let z=1;z<d;z++){gridLine([x0,y0,z],[x1,y0,z]);gridLine([x1,y0,z],[x1,y1,z]);}}

    if(v.dimensionLabels!==false){
      for(let i=0;i<base.length;i++){const j=(i+1)%base.length;const len=Math.hypot(base[j][0]-base[i][0],base[j][1]-base[i][1]);const automatic=(base.length===4?(i===0||i===1):base.length===3);const txt=v.baseLabels?.[i]??(automatic?`${n(len)} ${v.unit||''}`:null);if(txt)label(center([front[i],front[j]]),txt,{dy:19,dx:base.length===4?(i===1?18:-18):0});}
      const left=front.reduce((best,p,i)=>p[0]<front[best][0]?i:best,0);label(center([front[left],back[left]]),v.depthLabel||`${n(d)} ${v.unit||''}`,{dx:-28,dy:0});
    }
    for(const original of v.segments3D||[]){const s=base.length===3&&!original.label&&original.from[2]===0&&original.to[2]===0?{...original,from:[original.from[0],original.from[1],d],to:[original.to[0],original.to[1],d]}:original;line(iso(s.from),iso(s.to),{dashed:s.dashed,color:s.color});if(s.label)label(iso(s.labelPosition||s.from.map((x,i)=>(x+s.to[i])/2)),s.label,{dx:s.dx,dy:s.dy});}
    for(const l of v.labels3D||[]){let q=[...(l.point||[l.x,l.y,l.z])];if(Math.abs(q[2])<1e-9){for(let i=0;i<base.length;i++){const a=base[i],b=base[(i+1)%base.length],ex=b[0]-a[0],ey=b[1]-a[1],cross=(q[0]-a[0])*ey-(q[1]-a[1])*ex,dot=(q[0]-a[0])*ex+(q[1]-a[1])*ey;if(Math.abs(cross)<1e-6&&dot>=-1e-6&&dot<=ex*ex+ey*ey+1e-6&&ex+ey<0){q[2]=d;break;}}}label(iso(q),l.text,{dx:l.dx,dy:l.dy,anchor:l.anchor,leader:true});}
    if(v.crossSection==='parallel-base'&&!v.slice)v={...v,slice:{fraction:.5}};
    if(v.crossSection==='vertical'){const level=(Math.min(...base.map(p=>p[1]))+Math.max(...base.map(p=>p[1])))/2;let cuts=[];for(let i=0;i<base.length;i++){let a=base[i],b=base[(i+1)%base.length];if((a[1]<=level&&b[1]>=level)||(b[1]<=level&&a[1]>=level)){if(a[1]!==b[1]){let t=(level-a[1])/(b[1]-a[1]);cuts.push([a[0]+t*(b[0]-a[0]),level]);}}}cuts.sort((a,b)=>a[0]-b[0]);if(cuts.length>1){const a=cuts[0],b=cuts[cuts.length-1];poly([iso([...a,0]),iso([...b,0]),iso([...b,d]),iso([...a,d])],{fill:'#f2dca5',color:'#a96b00',opacity:.65});}}
    if(v.slice){const z=d*(v.slice.fraction??.5),ps=base.map(p=>iso([p[0],p[1],z]));poly(ps,{fill:'#f2dca5',color:'#a96b00',opacity:.65});}
  }else if(v.type==='pyramid'){
    const w=Number(v.width||6),l=Number(v.length||w),h=Number(v.height||4);const x0=v.centered?-w/2:0,y0=v.centered?-l/2:0,cx=x0+w/2,cy=y0+l/2;const verts=v.vertices3D||[[x0,y0,0],[x0+w,y0,0],[x0+w,y0+l,0],[x0,y0+l,0],[cx,cy,h]];const faces=v.faces||[[0,1,4],[1,2,4],[2,3,4],[3,0,4]];
    const pp=verts.map(iso),solidCenter=[0,1,2].map(k=>verts.reduce((t,p)=>t+p[k],0)/verts.length);let visible=[];
    for(const f of faces){const a=verts[f[0]],b=verts[f[1]],c=verts[f[2]],u=b.map((x,i)=>x-a[i]),q=c.map((x,i)=>x-a[i]);let nn=[u[1]*q[2]-u[2]*q[1],u[2]*q[0]-u[0]*q[2],u[0]*q[1]-u[1]*q[0]];const fc=[0,1,2].map(k=>f.reduce((t,j)=>t+verts[j][k],0)/f.length);if(nn.reduce((t,x,i)=>t+x*(fc[i]-solidCenter[i]),0)<0)nn=nn.map(x=>-x);if(nn[0]-nn[1]+nn[2]>1e-8)visible.push(f);}
    for(const f of visible)poly(f.map(i=>pp[i]),{fill:'#e8f1f4'});
    let edges=new Map();for(const f of faces)for(let j=0;j<f.length;j++){const a=f[j],b=f[(j+1)%f.length],key=[a,b].sort((a,b)=>a-b).join(',');const old=edges.get(key);edges.set(key,{a,b,vis:(old?.vis||false)||visible.includes(f)});}for(const e of edges.values())line(pp[e.a],pp[e.b],{dashed:!e.vis,width:e.vis?1.8:1.1,color:e.vis?INK:'#9aafb8'});
    if(!v.vertices3D&&v.dimensionLabels!==false){label(center([pp[0],pp[1]]),v.widthLabel||`${w} ${v.unit||''}`,{dy:19,dx:-10});if(l!==w||v.showLength)label(center([pp[1],pp[2]]),v.lengthLabel||`${l} ${v.unit||''}`,{dy:19,dx:13});
      if(v.showHeight){const p=iso([cx,cy,0]);line(pp[4],p,{dashed:true});label(center([pp[4],p]),`${h} ${v.unit||''}`,{dx:-19});}
      if(v.slant){const p=iso([cx,y0,0]);line(pp[4],p,{dashed:true});label(center([pp[4],p]),v.slantLabel||`${v.slant} ${v.unit||''}`,{dx:16,dy:-3});}
    }
    for(const s of v.segments3D||[]){line(iso(s.from),iso(s.to),{dashed:s.dashed,color:s.color});if(s.label)label(center([iso(s.from),iso(s.to)]),s.label,{dx:s.dx,dy:s.dy});}
    for(const l of v.labels3D||[])label(iso(l.point||[l.x,l.y,l.z]),l.text,{dx:l.dx,dy:l.dy,anchor:l.anchor,leader:true});
    if(v.crossSection==='parallel-base'&&!v.slice)v={...v,slice:{fraction:.5}};
    if(v.crossSection==='vertical'&&!v.vertices3D)poly([[cx,y0,0],[cx,y0+l,0],[cx,cy,h]].map(iso),{fill:'#f2dca5',color:'#a96b00',opacity:.65});
    if(v.slice&&!v.vertices3D){const f=v.slice.fraction??.5,z=h*f,dx=w*f/2,dy=l*f/2;poly([[x0+dx,y0+dy,z],[x0+w-dx,y0+dy,z],[x0+w-dx,y0+l-dy,z],[x0+dx,y0+l-dy,z]].map(iso),{fill:'#f2dca5',color:'#a96b00',opacity:.65});}
  }else if(v.type==='net'){
    for(const f of v.faces||[]){poly(f.points,{fill:f.fill||BLUE,dashed:f.dashed});if(f.label)label(center(f.points),f.label,{fontSize:13});}
    for(const s of v.segments||[])segment(s);
  }else if(v.type==='segments'){
    if(v.lengths)for(const [i,s]of v.lengths.entries()){const a=[0,-i*2.5],b=[Number(s.length),-i*2.5];line(a,b,{width:3});dot(a);dot(b);label(center([a,b]),s.label||String(s.length),{dy:-12});}
    for(const s of v.segments||[])segment(s);
  }else if(v.type==='composite3d'){
    for(const solid of v.solids||[]){const o=solid.origin||[0,0,0],w=solid.width,l=solid.length,h=solid.height;const ps=[[0,0,0],[w,0,0],[w,l,0],[0,l,0],[0,0,h],[w,0,h],[w,l,h],[0,l,h]].map(p=>iso(p.map((x,i)=>x+o[i])));for(const f of [[0,1,5,4],[1,2,6,5],[4,5,6,7]])poly(f.map(i=>ps[i]),{fill:BLUE});}
    for(const l of v.labels3D||[])label(iso(l.point),l.text,{dx:l.dx,dy:l.dy});
    for(const s of v.segments3D||[]){line(iso(s.from),iso(s.to),{dashed:s.dashed});if(s.label)label(center([iso(s.from),iso(s.to)]),s.label,{dy:s.dy??15,dx:s.dx});}
  }else if(v.type==='custom'){
    for(const p of v.polygons||[])poly(p.points||p,{fill:p.fill||BLUE});for(const s of v.segments||[])segment(s);for(const p of v.points||[])dot(pt(p));
  }
  if(['polygon','net'].includes(v.type)&&bounds.length){const bx0=Math.min(...bounds.map(p=>p[0])),bx1=Math.max(...bounds.map(p=>p[0]));for(const l of v.labels||[]){const anchor=l.anchor||(l.x>bx1?'start':l.x<bx0?'end':'middle');label([l.x,l.y],l.text??l.label,{anchor,dx:l.dx??(anchor==='start'?4:anchor==='end'?-4:0),dy:l.dy,color:l.color});}}else customLabels(v.labels);
  if(!bounds.length){return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"></svg>`;}
  let xmin=Math.min(...bounds.map(p=>p[0])),xmax=Math.max(...bounds.map(p=>p[0])),ymin=Math.min(...bounds.map(p=>p[1])),ymax=Math.max(...bounds.map(p=>p[1]));
  if(xmin===xmax){xmin-=1;xmax+=1;}if(ymin===ymax){ymin-=1;ymax+=1;}
  const mx=v.type==='grid'?46:56,my=v.type==='grid'?36:35;let scale=Math.min((W-2*mx)/(xmax-xmin),(H-2*my)/(ymax-ymin)),offsetX=0,offsetY=0;
  const X=x=>W/2+(x-(xmin+xmax)/2)*scale+offsetX,Y=y=>H/2-(y-(ymin+ymax)/2)*scale+offsetY;
  for(let iteration=0;iteration<5;iteration++){let lx=X(xmin),rx=X(xmax),ty=Y(ymax),by=Y(ymin);for(const l of labels){const tx=X(l.p[0])+(l.dx||0),yy=Y(l.p[1])+(l.dy||0),fs=l.fontSize||18,tw=String(l.text).length*fs*.55;lx=Math.min(lx,tx-(l.anchor==='start'?0:l.anchor==='end'?tw:tw/2)-3);rx=Math.max(rx,tx+(l.anchor==='end'?0:l.anchor==='start'?tw:tw/2)+3);ty=Math.min(ty,yy-fs*.7);by=Math.max(by,yy+fs*.7);}const limitH=v.caption?H-23:H-4;if(rx-lx>W-8||by-ty>limitH-4){scale*=Math.min((W-8)/(rx-lx),(limitH-4)/(by-ty))*.97;offsetX=0;offsetY=0;}else{if(lx<4)offsetX+=4-lx;if(rx>W-4)offsetX-=rx-W+4;if(ty<4)offsetY+=4-ty;if(by>limitH)offsetY-=by-limitH;}}

  let out=`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(v.alt||v.type+' diagram')}"><rect width="${W}" height="${H}" fill="white"/>`;
  for(const s of shapes){const stroke=s.color||INK,width=s.width||1.8,dash=s.dashed?' stroke-dasharray="5 4"':'',opacity=s.opacity?` opacity="${s.opacity}"`:'';
    if(s.kind==='line')out+=`<line x1="${n(X(s.a[0]))}" y1="${n(Y(s.a[1]))}" x2="${n(X(s.b[0]))}" y2="${n(Y(s.b[1]))}" stroke="${stroke}" stroke-width="${width}"${dash}/>`;
    else if(s.kind==='poly')out+=`<${s.open?'polyline':'polygon'} points="${s.ps.map(p=>`${n(X(p[0]))},${n(Y(p[1]))}`).join(' ')}" fill="${s.fill||'none'}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"${dash}${opacity}/>`;
    else if(s.kind==='dot')out+=`<circle cx="${n(X(s.p[0]))}" cy="${n(Y(s.p[1]))}" r="${s.radius||3}" fill="${s.color||INK}"/>`;
    else if(s.kind==='boundary')out+=`<circle cx="${n(X(s.p[0]))}" cy="${n(Y(s.p[1]))}" r="5" fill="${s.closed?RED:'white'}" stroke="${RED}" stroke-width="2"/>`;
    else if(s.kind==='circle')out+=`<circle cx="${n(X(s.p[0]))}" cy="${n(Y(s.p[1]))}" r="${n(s.r*scale)}" fill="${s.fill||'none'}" stroke="${stroke}" stroke-width="${width}"/>`;
  }
  for(const l of labels){const lx=X(l.p[0])+(l.dx||0),ly=Y(l.p[1])+(l.dy||0),fs=l.fontSize||18,tw=String(l.text).length*fs*.53;
    if(l.leader&&(l.dx||l.dy))out+=`<line x1="${n(X((l.leaderFrom||l.p)[0]))}" y1="${n(Y((l.leaderFrom||l.p)[1]))}" x2="${n(lx)}" y2="${n(ly)}" stroke="#91a4ad" stroke-width=".8"/>`;
    if(l.leader)out+=`<rect x="${n(lx-(l.anchor==='start'?0:l.anchor==='end'?tw:tw/2)-2)}" y="${n(ly-fs*.58)}" width="${n(tw+4)}" height="${n(fs*1.15)}" fill="white"/>`;
    out+=`<text x="${n(X(l.p[0])+(l.dx||0))}" y="${n(Y(l.p[1])+(l.dy||0))}" text-anchor="${l.anchor||'middle'}" dominant-baseline="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="${l.fontSize||18}" fill="${l.color||INK}">${esc(l.text)}</text>`;}
  if(v.caption)out+=`<text x="${W/2}" y="${H-7}" text-anchor="middle" font-family="DejaVu Sans,Arial,sans-serif" font-size="11" fill="#687881">${esc(v.caption)}</text>`;
  return out+'</svg>';
}

export const project3D=iso;
