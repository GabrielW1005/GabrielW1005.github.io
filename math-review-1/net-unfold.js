// Rigid-face hinge models. The same vertices describe the solid and its flat net.
// Progress 0 = folded; progress 1 = unfolded. No face is stretched or translated away.
const EPS=1e-8;
const add=(a,b)=>a.map((x,i)=>x+b[i]),sub=(a,b)=>a.map((x,i)=>x-b[i]),mul=(a,s)=>a.map(x=>x*s);
const dot=(a,b)=>a.reduce((n,x,i)=>n+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const norm=a=>Math.hypot(...a),unit=a=>mul(a,1/(norm(a)||1));
const close=(a,b)=>norm(sub(a,b))<EPS;
const centroid=ps=>mul(ps.reduce((s,p)=>add(s,p),[0,0,0]),1/ps.length);
const area2=ps=>ps.reduce((s,p,i)=>{const q=ps[(i+1)%ps.length];return s+p[0]*q[1]-p[1]*q[0]},0);
const ccw=ps=>area2(ps)<0?[...ps].reverse():ps.map(p=>[...p]);
function normal(ps){for(let i=1;i<ps.length-1;i++){const n=cross(sub(ps[i],ps[0]),sub(ps[i+1],ps[0]));if(norm(n)>EPS)return unit(n);}throw Error('Degenerate net face');}
function rotate(q,a,b,angle){const u=unit(sub(b,a)),v=sub(q,a),c=Math.cos(angle),s=Math.sin(angle);return add(a,add(add(mul(v,c),mul(cross(u,v),s)),mul(u,dot(u,v)*(1-c))));}
function sharedEdge(a,b){for(let i=0;i<a.length;i++){const p=a[i],q=a[(i+1)%a.length];if(b.some(x=>close(x,p))&&b.some(x=>close(x,q)))return [p,q];}return null;}
function hinge(faces,parent,child,angle){const edge=sharedEdge(faces[parent].points,faces[child].points);if(!edge)throw Error('Net faces do not share a hinge');if(angle==null){const n1=normal(faces[child].points),n2=normal(faces[parent].points),axis=unit(sub(edge[1],edge[0]));angle=Math.atan2(dot(axis,cross(n1,n2)),dot(n1,n2));}return {parent,child,edge,angle};}
const palette=['#abc6f5','#c8b9ee','#f1cf9f','#a5d7e5','#edb9bf','#c4d3e7','#d5c5ac','#b9c9f3'];
function finish(kind,faces,hinges,reference,orient=q=>q){const model={kind,faces:faces.map((f,i)=>({...f,color:palette[i%palette.length]})),hinges,reference,orient};const points=[];for(let i=0;i<=24;i++)points.push(...netPose(model,i/24).flatMap(f=>f.points).map(project));let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;for(const q of points){minX=Math.min(minX,q[0]);minY=Math.min(minY,q[1]);maxX=Math.max(maxX,q[0]);maxY=Math.max(maxY,q[1]);}model.bounds={minX,minY,maxX,maxY};return model;}
export function createNetModel(v){
 if(v.type==='net'){
  if(!Array.isArray(v.faces)||v.faces.length<2)throw Error('Missing net faces');
  const faces=v.faces.map(f=>({points:ccw(f.points).map(([x,y])=>[x,0,y])})),hinges=[],seen=new Set([0]),queue=[0];
  while(queue.length){const parent=queue.shift();for(let child=0;child<faces.length;child++)if(!seen.has(child)&&sharedEdge(faces[parent].points,faces[child].points)){seen.add(child);queue.push(child);hinges.push(hinge(faces,parent,child,Math.PI/2));}}
  if(seen.size!==faces.length)throw Error('Disconnected net');
  return finish('rectangular-prism',faces,hinges,'flat');
 }
 const pyramid=v.type==='pyramid';
 let base=v.vertices3D?v.vertices3D.slice(0,-1).map(p=>p.slice(0,2)):v.base;
 if(!base){const w=Number(v.width||4),l=Number(v.length||3);base=v.centered?[[-w/2,-l/2],[w/2,-l/2],[w/2,l/2],[-w/2,l/2]]:[[0,0],[w,0],[w,l],[0,l]];}
 base=ccw(base);const n=base.length,depth=Number(v.depth??v.height??4);if(n<3||!Number.isFinite(depth)||depth<=0)throw Error('Invalid solid dimensions');
 const low=base.map(q=>[...q,0]),high=base.map(q=>[...q,depth]);
 if(pyramid){
  const apex=v.vertices3D?.at(-1)||[...centroid(low).slice(0,2),depth],faces=[{points:[...low].reverse(),role:'base'},...low.map((q,i)=>({points:[q,low[(i+1)%n],apex],role:'side'}))];
  const hinges=faces.slice(1).map((f,i)=>hinge(faces,0,i+1));
  return finish('pyramid',faces,hinges,'folded',(q,t)=>{const a=-Math.PI/3*(1-t),y=-q[2],z=q[1];return [q[0],y*Math.cos(a)-z*Math.sin(a),y*Math.sin(a)+z*Math.cos(a)];});
 }
 const faces=[{points:[...low].reverse(),role:'base'},...low.map((q,i)=>({points:[q,low[(i+1)%n],high[(i+1)%n],high[i]],role:'side'})),{points:high,role:'base'}];
 const hinges=[hinge(faces,0,1)];for(let i=2;i<=n;i++)hinges.push(hinge(faces,i-1,i));hinges.push(hinge(faces,1,n+1));
 return finish(n===3?'triangular-prism':n===4?'rectangular-prism':'irregular-prism',faces,hinges,'folded',q=>[q[0],q[2],q[1]]);
}
export function netPose(model,progress){
 const t=Math.max(0,Math.min(1,progress)),moves=new Map([[0,[]]]);
 for(const h of model.hinges)moves.set(h.child,[{...h,amount:h.angle*(model.reference==='flat'?1-t:t)},...(moves.get(h.parent)||[])]);
 return model.faces.map((f,i)=>({...f,id:i,points:f.points.map(p=>{let q=p;for(const h of moves.get(i)||[])q=rotate(q,h.edge[0],h.edge[1],h.amount);return model.orient(q,t);})}));
}
// Cabinet projection: the final net lies in x-z and remains uniformly scaled.
export const project=q=>[q[0]+.48*q[1],-q[2]-.30*q[1]];
const num=n=>Math.abs(n)<1e-8?'0':Number(n.toFixed(4)).toString();
export function renderNet(model,progress,{width=640,height=390,lateral=false}={}){
 const faces=netPose(model,progress),b=model.bounds,scale=Math.min((width-70)/Math.max(EPS,b.maxX-b.minX),(height-58)/Math.max(EPS,b.maxY-b.minY)),cx=(b.minX+b.maxX)/2,cy=(b.minY+b.maxY)/2;
 const screen=q=>{const p=project(q);return [width/2+(p[0]-cx)*scale,height/2+(p[1]-cy)*scale];};
 const order=[...faces].sort((a,b)=>{const x=centroid(a.points),y=centroid(b.points);return dot(y,[-.48,1,-.30])-dot(x,[-.48,1,-.30]);});
 let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Solid unfolding into a connected net"><title>Each face rotates around a shared edge. Face sizes stay unchanged.</title>`;
 for(const f of order){const points=f.points.map(screen).map(p=>p.map(num).join(',')).join(' ');svg+=`<polygon data-net-face="${f.id}" points="${points}" fill="${lateral&&f.role==='base'?'#e8edf4':f.color}" fill-opacity="1" stroke="#43546e" stroke-width="1.6" stroke-linejoin="round"/>`;}
 // Hinge lines are useful once the solid opens; they always remain attached.
 if(progress>.06){for(const h of model.hinges){const parent=faces[h.parent],indices=h.edge.map(q=>model.faces[h.parent].points.findIndex(p=>close(p,q))),a=screen(parent.points[indices[0]]),b=screen(parent.points[indices[1]]);svg+=`<path d="M${a.map(num).join(' ')}L${b.map(num).join(' ')}" fill="none" stroke="white" stroke-width="3.4"/><path d="M${a.map(num).join(' ')}L${b.map(num).join(' ')}" fill="none" stroke="#43546e" stroke-width="1.5" stroke-dasharray="5 4" opacity="${num(Math.min(1,progress*3))}"/>`;}}
 return svg+'</svg>';
}
export function netArea(points){return norm(points.reduce((s,p,i)=>add(s,cross(p,points[(i+1)%points.length])),[0,0,0]))/2;}
