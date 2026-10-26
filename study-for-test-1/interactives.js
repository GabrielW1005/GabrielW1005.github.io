/* Classroom geometry and proportion visualizations. All geometry is derived from
   mathematical units; the paper problem remains unchanged during exploration. */
const NS = 'http://www.w3.org/2000/svg';
const TAU = Math.PI * 2;
const clamp = (x,a=0,b=1) => Math.min(b,Math.max(a,x));
const lerp = (a,b,t) => a+(b-a)*t;
const ease = t => t*t*(3-2*t);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmt = (n,d=3) => Number.isFinite(n) ? Number(n.toFixed(d)).toLocaleString('en-US',{maximumFractionDigits:d}) : '';
const fixed = (n,d=6) => Number(n).toFixed(d);
const wrapAngle = a => ((a + Math.PI) % TAU + TAU) % TAU - Math.PI;
const svgText = (x,y,t,cls='',anchor='middle') => `<text x="${x}" y="${y}" class="${cls}" text-anchor="${anchor}">${esc(t)}</text>`;
const pts = p => p.map(v=>v.map(n=>+n.toFixed(4)).join(',')).join(' ');
const poly = (p,cls='piece',extra='') => `<polygon points="${pts(p)}" class="${cls}" ${extra}/>`;
const ln = (x1,y1,x2,y2,cls='edge',extra='') => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" class="${cls}" ${extra}/>`;

function styles(root) {
  const style = document.createElement('style');
  style.textContent = `
  .lessonviz{--lv-ink:var(--ink,#172b43);--lv-muted:var(--muted,#617084);--lv-accent:var(--accent,#315eaa);--lv-line:var(--border,#cbd4de);--lv-soft:var(--surface-soft,#edf2f8);color:var(--lv-ink);width:100%;font-family:inherit}
  .lessonviz *{box-sizing:border-box}.lessonviz .lv-toolbar{display:flex;flex-wrap:wrap;gap:7px;align-items:center;margin:0 0 10px}.lessonviz button,.lessonviz select{font:inherit;font-size:13px;border:1px solid var(--lv-line);border-radius:8px;background:var(--surface,#fff);color:var(--lv-ink);min-height:44px;padding:7px 12px;cursor:pointer}.lessonviz button:hover{border-color:var(--lv-accent)}.lessonviz button[aria-pressed=true]{background:var(--lv-accent);border-color:var(--lv-accent);color:white}.lessonviz button:focus-visible,.lessonviz input:focus-visible{outline:3px solid #88a9df;outline-offset:2px}.lessonviz button:disabled{opacity:.45;cursor:default}.lessonviz .lv-push{margin-left:auto}.lessonviz .lv-small{font-size:12px;color:var(--lv-muted)}.lessonviz .lv-status{min-height:20px;font-size:12px;color:var(--lv-muted);margin-bottom:5px}.lessonviz .lv-visual{width:100%;aspect-ratio:800/430;min-height:210px;overflow:hidden}.lessonviz svg{display:block;width:100%;height:100%;overflow:visible}.lessonviz svg text{font-family:inherit;font-size:19px;fill:var(--lv-ink)}.lessonviz svg .small{font-size:15px;fill:var(--lv-muted)}.lessonviz svg .tiny{font-size:13px;fill:var(--lv-muted)}.lessonviz svg .large{font-size:31px;font-weight:600}.lessonviz svg .number{font-size:39px;font-weight:550}.lessonviz svg .formula{font-size:26px;font-weight:500}.lessonviz svg .accenttext{fill:var(--lv-accent);font-weight:600}.lessonviz svg .edge{stroke:var(--lv-ink);stroke-width:1.8;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .minor{stroke:var(--lv-muted);stroke-width:1;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .guide{stroke:var(--lv-muted);stroke-width:1.4;stroke-dasharray:6 5;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .ghost{stroke:var(--lv-line);stroke-width:1.2;fill:none;stroke-dasharray:4 4;vector-effect:non-scaling-stroke}.lessonviz svg .piece{fill:#aac1e1;stroke:var(--lv-ink);stroke-width:1;vector-effect:non-scaling-stroke}.lessonviz svg .alternate{fill:#dee7f2;stroke:var(--lv-ink);stroke-width:1;vector-effect:non-scaling-stroke}.lessonviz svg .highlight{fill:#d4a85b;stroke:var(--lv-ink);stroke-width:1.4;vector-effect:non-scaling-stroke}.lessonviz svg .accentline{stroke:var(--lv-accent);stroke-width:3;fill:none;vector-effect:non-scaling-stroke}.lessonviz svg .softfill{fill:var(--lv-soft);stroke:var(--lv-line);stroke-width:1}.lessonviz svg .mutedfill{fill:var(--lv-line)}.lessonviz .lv-playbar{display:flex;align-items:center;gap:9px;margin-top:5px}.lessonviz .lv-playbar input{flex:1;min-width:60px;accent-color:var(--lv-accent);height:32px;touch-action:pan-x}.lessonviz .lv-metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:14px}.lessonviz .lv-metric{padding:10px 12px;border:1px solid var(--lv-line);border-radius:9px;background:var(--surface,#fff);line-height:1.4}.lessonviz .lv-metric span{display:block;font-size:11px;color:var(--lv-muted);margin-bottom:2px}.lessonviz .lv-metric strong{font-size:15px;font-weight:600}.lessonviz .lv-caption{font-size:13px;line-height:1.5;margin:10px 0 0;color:var(--lv-muted)}.lessonviz .lv-radius{display:flex;align-items:center;gap:7px;font-size:12px;color:var(--lv-muted)}.lessonviz .lv-radius input{width:90px;accent-color:var(--lv-accent)}.lessonviz .lv-check{margin-top:10px;font-size:12px;color:var(--lv-muted)}
  .lessonviz{position:relative;display:flex;flex-direction:column;flex:1;height:100%;min-height:0;min-width:0}
  .lessonviz .lv-status{flex:none;line-height:1.4;margin:0 0 5px;font-size:12px}
  .lessonviz .lv-visual{flex:1;width:100%;height:0;min-height:190px;aspect-ratio:auto;overflow:hidden}
  .lessonviz .lv-visual svg{width:100%;height:100%;min-height:0;overflow:hidden}
  .lessonviz .lv-footer{display:flex;align-items:center;gap:8px;flex:none;min-height:48px;padding-top:4px}
  .lessonviz .lv-playbar{flex:1;min-width:0;margin:0;gap:8px;order:1}.lessonviz .lv-footer>button{order:0}
  .lessonviz .lv-playbar input{height:44px;min-width:55px;touch-action:pan-x}
  .lessonviz input[type=range]{cursor:pointer;accent-color:var(--lv-accent)}
  .lessonviz input[type=range]::-webkit-slider-thumb{min-width:22px;min-height:22px}
  .lessonviz input[type=range]::-moz-range-thumb{width:22px;height:22px;border:2px solid white;border-radius:50%;background:var(--lv-accent)}
  .lessonviz .lv-options{flex:none;margin-left:auto;order:2}
  .lessonviz .lv-options>summary{display:flex;align-items:center;justify-content:center;gap:7px;min-height:44px;min-width:88px;padding:8px 12px;border:1px solid var(--lv-line);border-radius:8px;background:var(--surface,#fff);color:var(--lv-ink);font-size:13px;cursor:pointer;list-style:none;touch-action:manipulation}
  .lessonviz .lv-options>summary::-webkit-details-marker{display:none}
  .lessonviz .lv-options>summary::after{content:'⌃';font-size:16px}
  .lessonviz .lv-options[open]>summary{background:var(--lv-accent);border-color:var(--lv-accent);color:white}
  .lessonviz .lv-options[open]>summary::after{content:'⌄'}
  .lessonviz .lv-options>summary:focus-visible{outline:3px solid #88a9df;outline-offset:2px}
  .lessonviz .lv-options-panel{position:absolute;z-index:5;bottom:54px;left:0;right:0;max-height:calc(100% - 60px);overflow:auto;overscroll-behavior:contain;border:1px solid var(--lv-line);border-radius:12px;background:var(--surface,#fff);box-shadow:0 8px 30px #172b4330;padding:14px}
  .lessonviz .lv-options-panel .lv-toolbar{margin-bottom:0}
  .lessonviz .lv-options-panel .lv-metrics{margin-top:12px}
  .lessonviz .lv-options-panel .lv-caption{font-size:14px}
  .lessonviz .lv-options-panel .lv-radius input{height:44px;min-width:100px}
  @media(min-width:1600px) and (min-height:900px){.lessonviz .lv-status{font-size:16px}.lessonviz button,.lessonviz .lv-options>summary{font-size:16px;min-height:48px}.lessonviz .lv-footer{min-height:52px}.lessonviz .lv-options-panel{bottom:58px}.lessonviz .lv-metric strong{font-size:18px}.lessonviz .lv-metric span,.lessonviz .lv-radius{font-size:14px}.lessonviz .lv-options-panel .lv-caption{font-size:16px}}
  @media(max-width:600px){.lessonviz .lv-footer{flex-wrap:wrap}.lessonviz .lv-playbar{flex-basis:100%}.lessonviz .lv-toolbar{gap:5px}.lessonviz button{padding:7px 9px;min-height:44px}.lessonviz .lv-visual{min-height:0}.lessonviz .lv-push{margin-left:0}.lessonviz .lv-metric{padding:8px}.lessonviz .lv-metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.lessonviz .lv-radius{width:100%}.lessonviz .lv-radius input{flex:1}}
  `;
  root.append(style);
}
function svgViewport(svg){
  const W=800,H=430,pointers=new Map();let zoom=1,cx=W/2,cy=H/2,gesture=null;
  const rect=()=>svg.getBoundingClientRect();
  function render(){
    const vw=W/zoom,vh=H/zoom;
    if(zoom<=1){cx=W/2;cy=H/2;}else{cx=clamp(cx,vw/2,W-vw/2);cy=clamp(cy,vh/2,H-vh/2);}
    svg.setAttribute('viewBox',`${cx-vw/2} ${cy-vh/2} ${vw} ${vh}`);svg.setAttribute('data-zoom',String(zoom));
    svg.style.cursor=zoom>1?'grab':'default';
  }
  function scaleAt(factor,x=null,y=null){
    const before=zoom,next=clamp(zoom*factor,.75,6);
    if(x!==null){const r=rect(),scale=Math.min(r.width/(W/before),r.height/(H/before));const dx=(x-r.left-r.width/2)/scale,dy=(y-r.top-r.height/2)/scale;cx+=dx*(1-before/next);cy+=dy*(1-before/next);}
    zoom=next;render();
  }
  function action(which){if(which==='zoom-reset'){zoom=1;cx=W/2;cy=H/2;render();}else if(which==='zoom-in')scaleAt(1.25);else if(which==='zoom-out')scaleAt(.8);}
  function begin(){
    const ps=[...pointers.values()],r=rect(),a=ps[0],b=ps[1];
    gesture=ps.length>1?{x:(a.x+b.x)/2,y:(a.y+b.y)/2,d:Math.hypot(a.x-b.x,a.y-b.y),z:zoom,cx,cy,w:r.width,h:r.height,left:r.left,top:r.top}:{x:a.x,y:a.y,z:zoom,cx,cy,w:r.width,h:r.height,left:r.left,top:r.top};
  }
  svg.style.touchAction='none';svg.setAttribute('tabindex','0');svg.setAttribute('aria-label','Mathematical diagram. Use zoom buttons; drag or pinch to explore when enlarged.');
  svg.onpointerdown=e=>{if(e.pointerType==='mouse'&&(e.button!==0||zoom<=1))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});svg.setPointerCapture?.(e.pointerId);begin();};
  svg.onpointermove=e=>{
    if(!pointers.has(e.pointerId)||!gesture)return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});
    const ps=[...pointers.values()],a=ps[0],b=ps[1],g=gesture,scale=Math.min(g.w/(W/g.z),g.h/(H/g.z));
    if(ps.length>1&&g.d){const mx=(a.x+b.x)/2,my=(a.y+b.y)/2;zoom=clamp(g.z*Math.hypot(a.x-b.x,a.y-b.y)/g.d,.75,6);const nextScale=scale*zoom/g.z,centerX=g.left+g.w/2,centerY=g.top+g.h/2;cx=g.cx+(g.x-centerX)/scale-(mx-centerX)/nextScale;cy=g.cy+(g.y-centerY)/scale-(my-centerY)/nextScale;}
    else if(zoom>1){cx=g.cx-(a.x-g.x)/scale;cy=g.cy-(a.y-g.y)/scale;}
    render();if(zoom>1)svg.style.cursor='grabbing';
  };
  const end=e=>{pointers.delete(e.pointerId);if(pointers.size)begin();else{gesture=null;render();}};
  svg.onpointerup=end;svg.onpointercancel=end;svg.onlostpointercapture=end;
  svg.onwheel=e=>{if(!e.ctrlKey&&!e.metaKey)return;e.preventDefault();scaleAt(Math.exp(-e.deltaY*.008),e.clientX,e.clientY);};
  svg.onkeydown=e=>{if(e.key==='+'||e.key==='='){action('zoom-in');e.preventDefault();}else if(e.key==='-'){action('zoom-out');e.preventDefault();}else if(e.key==='0'){action('zoom-reset');e.preventDefault();}else if(zoom>1&&['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){cx+=({ArrowLeft:-40,ArrowRight:40}[e.key]||0)/zoom;cy+=({ArrowUp:-40,ArrowDown:40}[e.key]||0)/zoom;render();e.preventDefault();}};
  render();return{action,clean(){pointers.clear();svg.onpointerdown=svg.onpointermove=svg.onpointerup=svg.onpointercancel=svg.onlostpointercapture=svg.onwheel=svg.onkeydown=null;}};
}

function frame(container, options={}) {
  const root=document.createElement('section'); root.className='lessonviz';
  root.setAttribute('aria-label','Interactive lesson visualization');
  styles(root);
  const toolbar=document.createElement('div');toolbar.className='lv-toolbar';
  const status=document.createElement('div');status.className='lv-status';status.setAttribute('aria-live','polite');
  const visual=document.createElement('div');visual.className='lv-visual';
  const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 800 430');svg.setAttribute('role','img');svg.setAttribute('aria-label','Mathematical diagram');visual.append(svg);
  const playbar=document.createElement('div');playbar.className='lv-playbar';
  const metrics=document.createElement('div');metrics.className='lv-metrics';
  const caption=document.createElement('p');caption.className='lv-caption';
  const footer=document.createElement('div');footer.className='lv-footer';
  const optionsDrawer=document.createElement('details');optionsDrawer.className='lv-options';
  const optionsSummary=document.createElement('summary');optionsSummary.textContent='Explore';optionsSummary.setAttribute('aria-label','Explore: open controls, measurements, and explanation');
  const optionsPanel=document.createElement('div');optionsPanel.className='lv-options-panel';optionsPanel.append(toolbar,metrics,caption);
  optionsDrawer.append(optionsSummary,optionsPanel);footer.append(playbar,optionsDrawer);
  root.append(status,visual,footer);container.replaceChildren(root);
  root.onkeydown=event=>{if(event.key==='Escape'&&optionsDrawer.open){optionsDrawer.open=false;optionsSummary.focus();event.stopPropagation();}};
  let disposed=false, raf=0;
  const viewport=svgViewport(svg),allowSolutions=options.allowSolutions===true;
  const reduced=options.reducedMotion ?? (typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches);
  function animate(from,to,duration,render,done) {
    cancelAnimationFrame(raf);
    if(reduced){render(to);done?.();return;}
    const start=performance.now();
    function tick(now){if(disposed)return;const p=clamp((now-start)/duration);render(lerp(from,to,p));if(p<1)raf=requestAnimationFrame(tick);else{raf=0;done?.();}}
    raf=requestAnimationFrame(tick);
  }
  function stop(){cancelAnimationFrame(raf);raf=0;}
  function clean(){disposed=true;stop();viewport.clean();root.remove();}
  clean.zoom=viewport.action;
  const button=(label,callback,parent=toolbar)=>{const b=document.createElement('button');b.type='button';b.textContent=label;b.onclick=callback;if(parent===toolbar&&(label==='Next step'||label==='Place next piece'))parent=playbar;if(parent===toolbar&&label==='Show area calculation')parent=footer;parent.append(b);return b;};
  const setMetrics=entries=>metrics.innerHTML=entries.map(([label,value])=>`<div class="lv-metric"><span>${esc(label)}</span><strong>${esc(value)}</strong></div>`).join('');
  return{root,toolbar,status,svg,playbar,metrics,caption,animate,stop,clean,button,setMetrics,reduced,allowSolutions};
}
function transport(f, redraw, maximum=1, duration=2800) {
  let t=0,playing=false;
  const play=f.button('Play',()=>{if(playing){pause();return;}if(t>=maximum-.00001)t=0;playing=true;play.textContent='Pause';f.animate(t,maximum,duration*(maximum-t)/maximum,set,()=>{playing=false;play.textContent='Replay';});},f.playbar);
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max=String(maximum);slider.step='0.001';slider.value='0';slider.setAttribute('aria-label','Animation progress');f.playbar.append(slider);
  const reset=f.button('Reset',()=>{pause();set(0);},f.playbar);
  const pause=()=>{f.stop();playing=false;play.textContent=t>=maximum?'Replay':'Play';};
  function set(v){t=clamp(v,0,maximum);slider.value=t;redraw(t);}
  slider.oninput=()=>{pause();set(Number(slider.value));};
  return {get t(){return t;},set,pause,next(){pause();const next=Math.min(maximum,Math.floor(t+0.001)+1);f.animate(t,next,700,set);},reset(){pause();set(0);},dispose:pause};
}
function polygonSettings(f,d,onChange) {
  const origN=Number(d.n)||12,origR=Number(d.radius)||6;
  let n=origN,r=origR;
  const group=document.createElement('div');group.style.display='flex';group.style.gap='5px';group.setAttribute('aria-label','Number of polygon sides');f.toolbar.append(group);
  const buttons=[];
  for(const nn of [...new Set([6,12,24,48,origN])].sort((a,b)=>a-b)){const b=f.button(`${nn} sides`,()=>{n=nn;refresh();onChange(n,r);},group);buttons.push([nn,b]);}
  const lab=document.createElement('label');lab.className='lv-radius lv-push';lab.innerHTML=`Radius <input type="range" min="1" max="${Math.max(32,Math.ceil(origR))}" step="0.5" value="${origR}" aria-label="Exploration radius"><output>${fmt(origR)}</output>`;f.toolbar.append(lab);
  const input=lab.querySelector('input'),output=lab.querySelector('output');input.oninput=()=>{r=Number(input.value);refresh();onChange(n,r);};
  const original=f.button('Packet values',()=>{n=origN;r=origR;input.value=r;refresh();onChange(n,r);});
  function refresh(){buttons.forEach(([nn,b])=>b.setAttribute('aria-pressed',String(nn===n)));output.textContent=fmt(r);const changed=n!==origN||r!==origR;f.status.textContent=changed?'Exploration — packet values and saved answers stay unchanged.':'Packet values';original.disabled=!changed;}
  refresh();return {get n(){return n;},get r(){return r;}};
}

function mountPerimeter(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6;
  let tr;
  const settings=polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;tr.pause();draw(tr.t);});
  f.caption.textContent='Unroll the straight sides, then compare their total length with one diameter. More sides make the polygon’s perimeter approach the circle’s circumference.';
  function draw(t){
    const scale=640/(TAU*r),rp=r*scale,cx=400,cy=155,side=2*r*Math.sin(Math.PI/n),givenSide=(n===Number(d.n)&&r===Number(d.radius)&&Number.isFinite(Number(d.side_length)))?Number(d.side_length):Number(side.toFixed(9)),P=Number((n*givenSide).toFixed(6)),D=2*r,ratio=Math.round(Math.round(P*1e6)/D)/1e6;
    let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" class="guide"/>`;
    const verts=Array.from({length:n},(_,i)=>[cx+rp*Math.cos(i*TAU/n),cy-rp*Math.sin(i*TAU/n)]);
    g+=ln(cx-rp,cy,cx+rp,cy,'accentline')+svgText(cx,cy+27,`diameter = ${fmt(D)} ${d.unit||'cm'}`,'small');
    const rx=cx+rp*Math.cos(Math.PI/3),ry=cy-rp*Math.sin(Math.PI/3);
    g+=ln(cx,cy,rx,ry,'edge')+svgText(rx+8,ry+22,`r = ${fmt(r)}`,'small','start')+`<circle cx="${cx}" cy="${cy}" r="3.5" fill="var(--lv-ink)"/>`;
    for(let i=0;i<n;i++){
      const a=verts[i],b=verts[(i+1)%n],len=side*scale,sourceAngle=Math.atan2(b[1]-a[1],b[0]-a[0]);
      const targetX=80+i*len,targetY=300;
      const x=lerp(a[0],targetX,t),y=lerp(a[1],targetY,t),ang=sourceAngle+wrapAngle(-sourceAngle)*t;
      const x2=x+len*Math.cos(ang),y2=y+len*Math.sin(ang);
      g+=ln(x,y,x2,y2,i%2?'accentline':'edge');
    }
    g+=svgText(400,27,`${n}-gon inside the circle`,'small');
    if(t<.95)g+=svgText(400,285,`Each side = ${fixed(givenSide,9)} ${d.unit||'cm'}`,'small');
    if(t>.98){const op=(t-.98)/.02;g+=`<g opacity="${op}">${svgText(80,280,'Perimeter P','small','start')}${ln(80,354,80+D*scale,354,'accentline')}${svgText(80+D*scale/2,381,`One diameter: ${fmt(D)} ${d.unit||'cm'}`,'small')}`;
      for(let j=1;j<=3;j++)g+=ln(80+j*D*scale,290,80+j*D*scale,310,'guide')+svgText(80+j*D*scale,326,`${j}d`,'tiny');
      g+=svgText(400,414,f.allowSolutions?`P ÷ d = ${fixed(ratio)};   π ≈ 3.141593`:'Compare the unrolled boundary with one diameter.','accenttext')+'</g>';
    }
    f.svg.innerHTML=g;
    f.setMetrics(f.allowSolutions&&t>=.999 ? [['Polygon perimeter P',`${fixed(P)} ${d.unit||'cm'}`],['Diameter d',`${fmt(D)} ${d.unit||'cm'}`],['Perimeter ÷ diameter',fixed(ratio)],['Circle relationship','C = πd = 2πr']] : [['Number of equal sides',String(n)],['Length of each side',`${fixed(givenSide,9)} ${d.unit||'cm'}`],['Diameter d',`${fmt(D)} ${d.unit||'cm'}`],['Find the perimeter first','Number of sides × side length']]);
  }
  tr=transport(f,draw);tr.set(0);return f.clean;
}

function mountRearrange(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6;let tr;
  polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;tr.pause();draw(tr.t);});
  f.caption.textContent=f.allowSolutions?'Each triangle keeps its size. Together they form a parallelogram: base = half the polygon perimeter, height = the polygon’s center-to-side distance. As the number of sides increases, the base approaches πr and the height approaches r.':'Each triangle keeps its size. Compare the bottom edge with the polygon boundary. Compare the rearranged height with the original radius, and describe what changes as the number of sides grows.';
  function draw(t){
    const s=2*r*Math.sin(Math.PI/n),h=r*Math.cos(Math.PI/n),b=n*s/2,scale=138/r,originalValues=n===Number(d.n)&&r===Number(d.radius);
    const center=[400,228],left=400-(b+s/2)*scale/2,bottom=312;
    const phase=0,rad=r*scale;
    let g=`<circle cx="${center[0]}" cy="${center[1]}" r="${rad}" class="ghost" opacity="${1-t*.75}"/>`;
    if(t<.02)g+=ln(center[0],center[1],center[0]+rad,center[1],'accentline')+svgText(center[0]+rad/2,center[1]-12,`r = ${fmt(r)}`,'small');
    for(let i=0;i<n;i++){
      const a=phase+i*TAU/n,j=Math.floor(i/2),up=i%2===0;
      const targetApex=up?[(j+.5)*s,h]:[(j+1)*s,0];
      const targetAngle=up?Math.atan2(-h,-s/2):Math.atan2(h,s/2);
      const rotation=wrapAngle(targetAngle-a)*t;
      const apex=[lerp(center[0],left+targetApex[0]*scale,t),lerp(center[1],bottom-targetApex[1]*scale,t)];
      const angleA=a+rotation,angleB=a+TAU/n+rotation;
      const triangle=[apex,[apex[0]+rad*Math.cos(angleA),apex[1]-rad*Math.sin(angleA)],[apex[0]+rad*Math.cos(angleB),apex[1]-rad*Math.sin(angleB)]];
      g+=poly(triangle,up?'piece':'alternate');
    }
    if(t>.75){const op=(t-.75)/.25,top=bottom-h*scale,xright=left+(b+s/2)*scale;
      g+=`<g opacity="${op}">`+ln(left,bottom+25,left+b*scale,bottom+25,'accentline')+ln(left,bottom+19,left,bottom+31,'minor')+ln(left+b*scale,bottom+19,left+b*scale,bottom+31,'minor');
      g+=svgText(left+b*scale/2,bottom+53,f.allowSolutions?`base = P/2 = ${fixed(b)} ${d.unit||'cm'}`:d.label_dimensions&&originalValues?`base = ${fmt(Number(d.base),6)} ${d.unit||'cm'}`:'base','small');
      g+=ln(xright+22,bottom,xright+22,top,'accentline')+svgText(xright+36,(bottom+top)/2,'h','accenttext','start');
      g+=ln(left+s*scale/2, bottom-r*scale, xright+45,bottom-r*scale,'guide');
      g+=svgText(400,bottom-r*scale-14,f.allowSolutions?`dashed level: r = ${fmt(r)};   height gap r − h = ${fixed(r-h)}`:`dashed level: radius = ${fmt(r)}; compare the gap`,'small');
      g+=svgText(400,412,f.allowSolutions?'Base approaches πr. Height approaches r. Area approaches πr × r.':'Describe what the base and height approach.','small')+'</g>';
    } else g+=svgText(400,32,`${n} equal triangles — same pieces, new arrangement`,'small');
    f.svg.innerHTML=g;
    const estimating=(problem.fields||[]).some(field=>/estimated perimeter/i.test(field.label));
    f.setMetrics(!f.allowSolutions ? [['Radius',`${fmt(r)} ${d.unit||'cm'}`],...(d.label_dimensions&&originalValues?[['Given polygon base',`${fmt(Number(d.base),6)} ${d.unit||'cm'}`],['Given polygon height',`${fmt(Number(d.height),6)} ${d.unit||'cm'}`]]:[]),['Think about the change','Compare the edges and heights']] : estimating ? [['Circle estimate 2 × 3.14 × r',`${fmt(2*3.14*r,4)} ${d.unit||'cm'}`],['Estimated base: 3.14 × r',`${fmt(3.14*r,4)} ${d.unit||'cm'}`],['Finite polygon base P/2',`${fixed(b)} ${d.unit||'cm'}`],['Polygon height h',`${fixed(h)} ${d.unit||'cm'}`]] : [['Base b = P/2',`${fixed(b)} ${d.unit||'cm'}`],['Height h',`${fixed(h)} ${d.unit||'cm'}`],['Radius − height',`${fixed(r-h)} ${d.unit||'cm'}`],['Polygon area b × h',`${fixed(b*h)} square ${d.unit||'cm'}`]]);
  }
  tr=transport(f,draw,1,3200);tr.set(0);return f.clean;
}

function mountParallelogram(container,problem,options) {
  const f=frame(container,options),d=problem.diagram,b=Number(d.base),h=Number(d.height),shift=Number(d.shift)||Math.min(2,b/3);let tr;
  f.status.textContent='Cut along the dashed height, then slide the triangle to the other end.';
  f.caption.textContent=f.allowSolutions?'The rearranged rectangle has the same base and perpendicular height. Every piece is kept, so the area is unchanged: A = base × height.':'Follow the cut and compare the resulting rectangle with the original parallelogram. Which measurements stay the same? Use that comparison to explain your answer.';
  f.button('Cut and move',()=>{tr.pause();f.animate(tr.t,1,2200,tr.set);});
  f.button('Original shape',()=>tr.reset());
  function draw(t){
    const scale=Math.min(550/(b+shift),180/h),x=400-(b+shift)*scale/2,y=300;
    const map=([a,z])=>[x+a*scale,y-z*scale];
    let g=svgText(400,45,t>.98?'Same pieces form a rectangle':'A parallelogram can be rearranged','small');
    g+=poly([[shift,0],[b,0],[b+shift,h],[shift,h]].map(map),'alternate');
    const moving=[[0,0],[shift,0],[shift,h]].map(([a,z])=>map([a+b*t,z+Math.sin(Math.PI*t)*.38*h]));g+=poly(moving,'highlight');
    g+=ln(x+shift*scale,y,x+shift*scale,y-h*scale,'guide');
    if(t>.03&&t<.98)g+=`<path d="M ${x+shift*scale*.6} ${y-h*scale*.65} Q 400 ${y-h*scale-120} ${x+(b+shift*.6)*scale} ${y-h*scale*.65}" class="guide"/>`;
    const basex=x+shift*scale*t;
    g+=ln(basex,y+25,basex+b*scale,y+25,'accentline')+svgText(basex+b*scale/2,y+52,`base = ${fmt(b)} ${d.unit||'units'}`,'small');
    const hx=x+(b+shift)*scale+35;
    g+=ln(hx,y,hx,y-h*scale,'accentline')+svgText(hx+12,y-h*scale/2,`h = ${fmt(h)}`,'small','start');
    g+=svgText(400,405,f.allowSolutions?'No pieces added. No pieces lost. Same area.':'Compare the original shape and the rectangle.','accenttext');
    f.svg.innerHTML=g;f.setMetrics([['Original base',`${fmt(b)} ${d.unit||'units'}`],['Perpendicular height',`${fmt(h)} ${d.unit||'units'}`],['Corresponding rectangle',`${fmt(b)} by ${fmt(h)}`]]);
  }
  tr=transport(f,draw);tr.set(0);return f.clean;
}

function mountCentral(container,problem,options) {
  const f=frame(container,options),d=problem.diagram,r=Number(d.radius)||6,n=Number(d.n)||12;
  const base=Number(d.radial_base)||r,alt=Number(d.perpendicular_height)||r*Math.sin(TAU/n),unit=d.unit||'cm';let count=1,reveal=false;
  f.status.textContent='The enlarged triangle uses a radius as its base. Its marked height is perpendicular to that base.';
  const show=f.allowSolutions&&f.button('Show area calculation',()=>{reveal=!reveal;show.textContent=reveal?'Hide calculation':'Show area calculation';draw();});
  const label=document.createElement('label');label.className='lv-radius';label.innerHTML=`Triangles <input type="range" min="1" max="${n}" value="1" step="1" aria-label="Number of triangles counted"><output>1</output>`;f.toolbar.append(label);
  label.querySelector('input').oninput=e=>{count=Number(e.target.value);label.querySelector('output').textContent=count;draw();};
  f.caption.textContent='Use ½ × base × perpendicular height for one triangle. Add all 12 equal triangle areas to get the polygon’s exact area. The polygon stays slightly smaller than its surrounding circle.';
  function draw(){
    const cx=190,cy=210,rad=120,theta=TAU/n;
    const verts=Array.from({length:n},(_,i)=>[cx+rad*Math.cos(i*theta),cy-rad*Math.sin(i*theta)]);
    let g=`<circle cx="${cx}" cy="${cy}" r="${rad}" class="ghost"/>`;
    for(let i=0;i<n;i++)g+=poly([[cx,cy],verts[i],verts[(i+1)%n]],i<count?'highlight':'alternate');
    const scale=280/r,x=425,y=288,apexx=x+r*Math.cos(theta)*scale,apexy=y-alt*scale;
    g+=svgText(cx,47,'The 12-gon','small')+svgText(565,47,'One triangle, enlarged','small');
    g+=poly([[x,y],[x+r*scale,y],[apexx,apexy]],'piece');
    g+=ln(apexx,apexy,apexx,y,'guide')+ln(apexx-12,y,apexx-12,y-12,'minor')+ln(apexx-12,y-12,apexx,y-12,'minor');
    g+=svgText(x+r*scale/2,y+30,`base = ${fmt(base)} ${unit}`,'small');
    g+=svgText(745,(apexy+y)/2,`h = ${fmt(alt)} ${unit}`,'small');
    if(f.allowSolutions&&reveal){const one=.5*base*alt;g+=svgText(400,375,`One triangle: ½ × ${fmt(base)} × ${fmt(alt)} = ${fmt(one)} square ${unit}`,'formula');g+=svgText(400,410,`${count} ${count===1?'triangle':'triangles'}: ${count} × ${fmt(one)} = ${fmt(count*one)} square ${unit}`,'accenttext');}
    f.svg.innerHTML=g;f.setMetrics([['Counted triangles',`${count} of ${n}`],['Triangle base',`${fmt(base)} ${unit}`],['Triangle perpendicular height',`${fmt(alt)} ${unit}`],['Circle comparison',f.allowSolutions?`A ≈ 3.14 × ${fmt(r)}²`:'Use the given circle formula']]);
  }
  f.playbar.hidden=true;draw();return f.clean;
}

function mountRatioGuide(container,problem,options){
  const f=frame(container,options),d=problem.diagram,given=[d.a,d.b,d.c,d.d].map(String),hasX=given.some(v=>v.toLowerCase()==='x');let tr;
  f.status.textContent='The letters mark positions. Apply the same movement to your given numbers.';
  f.caption.textContent='Multiply across each diagonal. Compare the two products yourself. If a factor is unknown, use the inverse operation to isolate it.';
  f.button('Next step',()=>tr.next());f.button('Start again',()=>tr.reset());
  function draw(t){
    const initial=[[245,135],[245,220],[555,135],[555,220]],target=[[225,280],[490,280],[565,280],[300,280]],letters=['a','b','c','d'],p=clamp(t);
    let g=svgText(400,45,`${given[0]}/${given[1]} ${hasX?'=':'?'} ${given[2]}/${given[3]}`,'formula');
    if(t<1)g+=`<g opacity="${1-p}">${ln(208,170,282,170)}${ln(518,170,592,170)}${svgText(400,180,'?','large')}</g>`;
    if(t<1&&p>0)g+=`<g opacity="${Math.sin(p*Math.PI)}">${ln(260,140,540,208,'accentline')}${ln(260,208,540,140,'accentline')}</g>`;
    for(let i=0;i<4;i++)g+=svgText(lerp(initial[i][0],target[i][0],p),lerp(initial[i][1],target[i][1],p),letters[i],'number');
    g+=`<g opacity="${p}">${svgText(263,280,'×','large')}${svgText(528,280,'×','large')}${svgText(400,280,'?','large')}</g>`;
    g+=svgText(400,367,t>=1?'Find both products using your numbers.':'Watch how the two diagonals pair the positions.','small');
    g+=svgText(400,410,'The original problem stays yours to solve.','tiny');f.svg.innerHTML=g;f.metrics.hidden=true;
  }
  tr=transport(f,draw,1,1800);tr.set(0);return f.clean;
}

function mountRatio(container,problem,options) {
  if(options.allowSolutions!==true)return mountRatioGuide(container,problem,options);
  const f=frame(container,options),d=problem.diagram,raw=[d.a,d.b,d.c,d.d].map(String),unknown=raw.findIndex(x=>x.trim().toLowerCase()==='x');
  const v=raw.map(Number),hasX=unknown>=0;let tr;
  const max=hasX?4:3;
  const partner=[3,2,1,0][unknown],coeff=hasX?v[partner]:null;
  const rhs=hasX?([0,3].includes(unknown)?v[1]*v[2]:v[0]*v[3]):null;
  const result=hasX?rhs/coeff:null;
  const left=v[0]*v[3],right=v[1]*v[2],same=!hasX&&Math.abs(left-right)<1e-9;
  const titles=hasX?['Start with the proportion','Multiply across the diagonals','Simplify the products','Divide both sides by the coefficient','The value of x']:['Compare the two fractions','Multiply across the diagonals','Compare the cross-products','Decide whether the fractions are equal'];
  f.button('Next step',()=>tr.next());f.button('Start again',()=>tr.reset());
  f.caption.textContent='Cross-multiplication compares a × d with b × c. For a proportion, these products are equal. To find x, divide by the number multiplying x.';
  function draw(t){
    const step=Math.min(max,Math.floor(t+.00001));f.status.textContent=titles[step];
    let g='';
    const initial=[[245,126],[245,205],[555,126],[555,205]],product=[[230,260],[480,260],[555,260],[305,260]];
    if(t<1){
      const p=t;
      g+=`<g opacity="${1-p}">${ln(208,158,282,158)}${ln(518,158,592,158)}${svgText(400,169,hasX?'=':'?','large')}</g>`;
      if(p<.5)g+=`<g opacity="${Math.sin(p*2*Math.PI)}">${ln(260,130,540,194,'accentline')}${ln(260,194,540,130,'accentline')}</g>`;
      for(let i=0;i<4;i++)g+=svgText(lerp(initial[i][0],product[i][0],p),lerp(initial[i][1],product[i][1],p),raw[i],'number');
      g+=`<g opacity="${p}">${svgText(268,260,'×','large')}${svgText(517,260,'×','large')}${svgText(400,260,hasX?'=':'?','large')}</g>`;
      g+=svgText(400,365,'a × d      and      b × c','small');
    } else if(t<2){
      const p=t-1;
      g+=`<g opacity="${1-p}">`;
      for(let i=0;i<4;i++)g+=svgText(product[i][0],product[i][1],raw[i],'number');
      g+=svgText(268,260,'×','large')+svgText(517,260,'×','large')+'</g>';
      g+=svgText(400,260,hasX?'=':'?','large');
      const l=hasX&&[0,3].includes(unknown)?`${fmt(coeff)}x`:fmt(hasX?rhs:left);
      const rr=hasX&&[1,2].includes(unknown)?`${fmt(coeff)}x`:fmt(hasX?rhs:right);
      g+=`<g opacity="${p}">${svgText(267,260,l,'number')}${svgText(517,260,rr,'number')}</g>`;
      g+=svgText(400,365,'Multiply each pair.','small');
    } else if(hasX){
      const ul=[0,3].includes(unknown),ux=ul?267:517,nx=ul?517:267;
      if(t<3){
        const p=t-2;
        g+=svgText(lerp(ux-17,500,p),lerp(260,305,p),fmt(coeff),'number');
        g+=svgText(lerp(ux+22,270,p),260,'x','number');
        g+=svgText(lerp(nx,500,p),lerp(260,224,p),fmt(rhs),'number');
        g+=svgText(400,260,'=','large');
        g+=ln(460,249,540,249,'edge',`opacity="${p}"`);
        g+=svgText(400,365,`Divide both sides by ${fmt(coeff)}.`, 'small');
      }else{
        const p=t-3;
        g+=svgText(270,260,'x','number')+svgText(400,260,'=','large');
        g+=`<g opacity="${1-p}">${svgText(500,lerp(224,260,p),fmt(rhs),'number')}${svgText(500,lerp(305,260,p),fmt(coeff),'number')}${ln(460,249,540,249)}</g>`;
        g+=`<g opacity="${p}">${svgText(500,260,fmt(result,6),'number accenttext')}</g>`;
        g+=svgText(400,365,`${fmt(rhs)} ÷ ${fmt(coeff)} = ${fmt(result,6)}`,'small');
      }
    }else{
      const p=clamp(t-2);g+=svgText(267,260,fmt(left),'number')+svgText(517,260,fmt(right),'number');
      g+=svgText(400,260,p>.5?(same?'=':'≠'):'?','large');
      if(p>.5)g+=svgText(400,365,same?'Equal cross-products → equal fractions.':'Different cross-products → unequal fractions.','accenttext');
    }
    const original=`${raw[0]}/${raw[1]} ${hasX?'=':'?'} ${raw[2]}/${raw[3]}`;
    g+=svgText(400,50,original,'formula');
    const dots=Array.from({length:max+1},(_,i)=>`<circle cx="${400+(i-max/2)*27}" cy="410" r="4" fill="${i<=step?'var(--lv-accent)':'var(--lv-line)'}"/>`).join('');g+=dots;
    f.svg.innerHTML=g;
    f.metrics.hidden=true;
  }
  tr=transport(f,draw,max,6500);tr.set(0);return f.clean;
}

function mountGrid(container,problem,options) {
  const d=problem.diagram;if(d.shade_half)return false;
  const f=frame(container,options),w=Number(d.width),h=Number(d.height),half=d.piece==='half_square';
  if(!Number.isInteger(w)||!Number.isInteger(h)||w<1||h<1||w*h>120){f.clean();return false;}
  const total=w*h*(half?2:1);let tr;
  f.status.textContent=half?'Two half-square pieces have the same area as one unit square.':'Count the unit squares without leaving gaps or overlaps.';
  f.caption.textContent=half?'Each small triangle is half of one unit square. Cutting a unit square changes the number of pieces, not its total area.':'Area counts square units. A row-and-column arrangement helps us count by multiplication.';
  f.button('Count all pieces',()=>{tr.pause();f.animate(tr.t,total,Math.min(5000,total*150),tr.set);});
  function draw(t){
    const count=Math.min(total,Math.floor(t+.00001)),s=Math.min(550/w,250/h),x=400-w*s/2,y=80;
    let g='';let k=0;
    for(let row=0;row<h;row++)for(let col=0;col<w;col++){
      const xx=x+col*s,yy=y+row*s;
      if(half){g+=poly([[xx,yy],[xx+s,yy],[xx+s,yy+s]],k++<count?'piece':'softfill');g+=poly([[xx,yy],[xx+s,yy+s],[xx,yy+s]],k++<count?'highlight':'softfill');}
      else{g+=`<rect x="${xx}" y="${yy}" width="${s}" height="${s}" class="${k++<count?'piece':'softfill'}"/>`;}
    }
    g+=svgText(400,y+h*s+37,`${w} units across`,'small')+svgText(x-12,y+h*s/2,`${h}`,'small','end');
    g+=svgText(400,400,f.allowSolutions?`${count} ${half?'half-square pieces':'unit squares'} counted`:'Count the highlighted pieces yourself.','accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['One piece',half?'½ square unit':'1 square unit'],['Pieces counted',String(count)],['Area of counted pieces',`${fmt(count/(half?2:1))} square units`]]:[['One piece',half?'½ square unit':'1 square unit'],['Your task','Count the pieces and find their total area']]);
  }
  tr=transport(f,draw,total,Math.min(5000,total*150));tr.set(0);return f.clean;
}


function mountPolygonArea(container,problem,options) {
  const f=frame(container,options),d=problem.diagram;let n=Number(d.n)||12,r=Number(d.radius)||6,reveal=false;
  polygonSettings(f,d,(nn,rr)=>{n=nn;r=rr;draw();});
  const revealButton=f.allowSolutions&&f.button('Compare areas',()=>{reveal=!reveal;revealButton.textContent=reveal?'Hide area values':'Compare areas';draw();});
  f.playbar.hidden=true;
  f.caption.textContent='The polygon lies inside its corresponding circle. Use the radius of the surrounding circle in A ≈ 3.14r² to estimate the polygon’s area. More sides make the estimate closer.';
  function draw(){
    const cx=400,cy=214,rp=145;
    const vv=Array.from({length:n},(_,i)=>[cx+rp*Math.cos(i*TAU/n),cy-rp*Math.sin(i*TAU/n)]);
    let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" class="guide"/>`;
    for(let i=0;i<n;i++)g+=poly([[cx,cy],vv[i],vv[(i+1)%n]],i%2?'alternate':'piece');
    g+=ln(cx,cy,cx+rp,cy,'accentline')+svgText(cx+rp/2,cy-13,`r = ${fmt(r)} ${d.unit||'cm'}`,'small');
    g+=svgText(400,35,`${n}-gon and its surrounding circle`,'small');
    g+=svgText(400,410,`Circle formula: A = πr²`,'formula');
    f.svg.innerHTML=g;
    const actual=n*r*r*Math.sin(TAU/n)/2;
    f.setMetrics(f.allowSolutions&&reveal?[['Circle estimate using 3.14',`${fmt(3.14*r*r,4)} square ${d.unit||'cm'}`],['Polygon area from its triangles',`${fixed(actual)} square ${d.unit||'cm'}`]]:[['Radius',`${fmt(r)} ${d.unit||'cm'}`],['Circle estimate setup',f.allowSolutions?`3.14 × ${fmt(r)} × ${fmt(r)}`:'Use the radius in the given formula']]);
  }
  draw();return f.clean;
}

// Exact unit-cell clipping lets every cut piece keep its actual area or volume.
function signedArea(v){return v.reduce((sum,p,i)=>{const q=v[(i+1)%v.length];return sum+p[0]*q[1]-p[1]*q[0];},0)/2;}
function clipEdge(subject,a,b,keepLeft=true){
  if(!subject.length)return [];
  const side=p=>((b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0]))*(keepLeft?1:-1);
  const out=[];
  for(let i=0;i<subject.length;i++){
    const p=subject[i],q=subject[(i+1)%subject.length],cp=side(p),cq=side(q),pin=cp>=-1e-9,qin=cq>=-1e-9;
    if(pin)out.push(p);
    if(pin!==qin){const t=cp/(cp-cq);out.push([lerp(p[0],q[0],t),lerp(p[1],q[1],t)]);}
  }
  return out.filter((p,i)=>!i||Math.hypot(p[0]-out[i-1][0],p[1]-out[i-1][1])>1e-8);
}
function unitCells(shape){
  const cells=[],xmin=Math.floor(Math.min(...shape.map(p=>p[0]))),ymin=Math.floor(Math.min(...shape.map(p=>p[1]))),xmax=Math.ceil(Math.max(...shape.map(p=>p[0]))),ymax=Math.ceil(Math.max(...shape.map(p=>p[1])));
  for(let y=ymin;y<ymax;y++)for(let x=xmin;x<xmax;x++){
    const box=[[x,y],[x+1,y],[x+1,y+1],[x,y+1]];
    let p=shape;
    for(let i=0;i<4;i++)p=clipEdge(p,box[i],box[(i+1)%4]);
    const area=Math.abs(signedArea(p));
    if(area>1e-8)cells.push({x,y,points:p,local:p.map(v=>[v[0]-x,v[1]-y]),area});
  }
  return cells;
}
function complementPiece(piece){
  const square=[[0,0],[1,0],[1,1],[0,1]],left=signedArea(piece)>0;
  for(let i=0;i<piece.length;i++){
    const a=piece[i],b=piece[(i+1)%piece.length];
    const boundary=(Math.abs(a[0]-b[0])<1e-8&&(Math.abs(a[0])<1e-8||Math.abs(a[0]-1)<1e-8))||(Math.abs(a[1]-b[1])<1e-8&&(Math.abs(a[1])<1e-8||Math.abs(a[1]-1)<1e-8));
    if(!boundary)return clipEdge(square,a,b,!left);
  }
  return [];
}
function drawPrism(points,z0,z1,project,cls='piece',extra=''){
  if(!points.length)return '';
  // The front is z=0. Side faces are painted first and the front face last.
  let out='';
  const orient=signedArea(points)>=0?1:-1;
  for(let i=0;i<points.length;i++){
    const a=points[i],b=points[(i+1)%points.length],dx=b[0]-a[0],dy=b[1]-a[1];
    if(orient*(.55*dy-.35*dx)>-1e-8)out+=poly([project(a[0],a[1],z0),project(b[0],b[1],z0),project(b[0],b[1],z1),project(a[0],a[1],z1)],cls,extra);
  }
  return out+poly(points.map(p=>project(p[0],p[1],z0)),cls,extra);
}
function cutControls(f,draw,pieces){
  const cutMs=800,pieceMs=480,totalMs=cutMs+pieces*pieceMs;
  let clock=0,playing=false;
  const phase=ms=>ms<=cutMs?ms/cutMs:1+(ms-cutMs)/(pieces*pieceMs);
  function render(ms){clock=clamp(ms,0,totalMs);slider.value=phase(clock);draw(phase(clock));}
  function pause(){f.stop();playing=false;play.textContent=clock>=totalMs?'Replay':'Play';}
  function runTo(target){f.stop();playing=true;play.textContent='Pause';f.animate(clock,target,Math.abs(target-clock),render,()=>{playing=false;play.textContent=clock>=totalMs?'Replay':'Play';});}
  f.button('1 · Cut a unit',()=>{pause();render(0);runTo(cutMs);});
  f.button('2 · Fill the shape',()=>{pause();if(clock<cutMs||clock>=totalMs)render(cutMs);runTo(totalMs);});
  f.button('Place next piece',()=>{pause();const next=Math.min(pieces,Math.floor(Math.max(0,clock-cutMs)/pieceMs+1e-8)+1);runTo(cutMs+next*pieceMs);});
  const play=f.button('Play',()=>{if(playing){pause();return;}if(clock>=totalMs)render(0);runTo(totalMs);},f.playbar);
  const slider=document.createElement('input');slider.type='range';slider.min='0';slider.max='2';slider.step='0.001';slider.value='0';slider.setAttribute('aria-label','Animation progress');f.playbar.append(slider);
  f.button('Reset',()=>{pause();render(0);},f.playbar);
  function set(t){render(t<=1?t*cutMs:cutMs+(t-1)*pieces*pieceMs);}
  slider.oninput=()=>{pause();set(Number(slider.value));};
  return{get t(){return phase(clock);},set,pause,reset(){pause();render(0);}};
}
function mountLineUnits(container,problem,options){
  const d=problem.diagram,unit=d.unit||'cm',pieceUnit=Number(d.unit_length)||1;
  if(d.half_highlight)return false;
  const shape=d.type==='bent_path'?(d.points||[]).map(p=>p.map(Number)):[[0,0],[Number(d.length),0]];
  if(shape.length<2)return false;
  const edges=[],pieces=[];let fullLength=0;
  for(let i=0;i<shape.length-1;i++){
    const a=shape[i],b=shape[i+1],length=Math.hypot(b[0]-a[0],b[1]-a[1]);
    if(length<1e-8)continue;
    edges.push({a,b,length});fullLength+=length;
    for(let t=0;t<length-1e-8;t+=pieceUnit){const end=Math.min(length,t+pieceUnit);pieces.push({a:[lerp(a[0],b[0],t/length),lerp(a[1],b[1],t/length)],b:[lerp(a[0],b[0],end/length),lerp(a[1],b[1],end/length)],length:end-t});}
  }
  if(!pieces.length||pieces.length>80)return false;
  const f=frame(container,options),partial=pieces.find(p=>p.length<pieceUnit-1e-8),short=partial?.length||pieceUnit/2;
  const xmin=Math.min(...shape.map(p=>p[0])),xmax=Math.max(...shape.map(p=>p[0])),ymin=Math.min(...shape.map(p=>p[1])),ymax=Math.max(...shape.map(p=>p[1]));
  const scale=Math.min(560/Math.max(1,xmax-xmin),165/Math.max(1,ymax-ymin),90),tx=400-(xmax+xmin)*scale/2,ty=275+(ymax+ymin)*scale/2;
  const project=p=>[tx+p[0]*scale,ty-p[1]*scale],source=[140,115],sourceLength=pieceUnit*scale;
  const fullCount=pieces.filter(p=>Math.abs(p.length-pieceUnit)<1e-8).length,partCount=pieces.length-fullCount;
  f.caption.textContent='Length is measured along the whole path. Cut a unit line into shorter straight pieces when a full unit does not fit; keep the pieces the same length as they move.';
  f.status.textContent=partial?'A whole unit will not fit in the final gap. Cut it, then use the needed part.':'Place equal unit lengths end to end, with no gaps or overlaps.';
  function draw(t){
    const cutting=clamp(t),progress=clamp(t-1)*pieces.length,count=Math.min(pieces.length,Math.floor(progress+1e-8)),fraction=progress-count,active=pieces[count],placingWhole=t>1&&active?.length>=pieceUnit-1e-8;
    let g=svgText(140+sourceLength/2,45,`One ${fmt(pieceUnit)} ${unit} unit line`,'small');
    const cutAt=short*scale,space=18*cutting;
    if(placingWhole){g+=ln(source[0],source[1],source[0]+sourceLength,source[1],fraction>0?'ghost':'accentline');}
    else {if(!(t>1&&fraction>0))g+=ln(source[0],source[1],source[0]+cutAt,source[1],'accentline');
      g+=ln(source[0]+cutAt+space,source[1],source[0]+sourceLength+space,source[1],'edge');
      if(cutting>0)g+=ln(source[0]+cutAt+space/2,88,source[0]+cutAt+space/2,142,'guide');}
    g+=svgText(400,170,t<1?'Cut the unit where a shorter piece is needed.':'Move each straight piece into the path.','small');
    for(const e of edges){const a=project(e.a),b=project(e.b);g+=ln(...a,...b,'ghost');}
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i],a=project(p.a),b=project(p.b),half=p.length<pieceUnit-1e-8;
      if(i<count)g+=ln(...a,...b,half?'accentline':'edge',`stroke-width="${half?5:4}"`);
      if(i===count&&fraction>0){const angle=Math.atan2(b[1]-a[1],b[0]-a[0]),x=lerp(source[0],a[0],fraction),y=lerp(source[1],a[1],fraction),ang=angle*fraction;g+=ln(x,y,x+p.length*scale*Math.cos(ang),y+p.length*scale*Math.sin(ang),'accentline');}
      const delta=7,dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy);g+=ln(a[0]-dy/len*delta,a[1]+dx/len*delta,a[0]+dy/len*delta,a[1]-dx/len*delta,'minor');
      if(i===pieces.length-1)g+=ln(b[0]-dy/len*delta,b[1]+dx/len*delta,b[0]+dy/len*delta,b[1]-dx/len*delta,'minor');
    }
    const placedLength=pieces.slice(0,count).reduce((a,p)=>a+p.length,0);
    g+=svgText(400,410,!f.allowSolutions?'Count whole units and cut pieces to find the length.':count===pieces.length?`${fullCount} whole unit${fullCount===1?'':'s'}${partCount?` + ${partCount} cut piece${partCount===1?'':'s'}`:''} fill the path.`:`${count} piece${count===1?'':'s'} placed`,'accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['One full unit',`${fmt(pieceUnit)} ${unit}`],['Cut piece',`${fmt(short)} ${unit}`],['Length placed so far',`${fmt(placedLength)} ${unit}`],['Total length',count===pieces.length?`${fmt(fullLength)} ${unit}`:'Fill the path to reveal']]:[['One full unit',`${fmt(pieceUnit)} ${unit}`],['Cut piece',`${fmt(short)} ${unit}`],['Your task','Count and combine the pieces']]);
  }
  const tr=cutControls(f,draw,pieces.length);tr.set(0);return f.clean;
}
function mountAreaUnits(container,problem,options){
  const d=problem.diagram,unit=d.unit||'cm';
  let shape;
  if(d.type==='grid_triangle')shape=[[0,0],[Number(d.base),0],[0,Number(d.height)]];
  else if(d.type==='grid_polygon')shape=(d.points||[]).map(p=>p.map(Number));
  else shape=[[0,0],[Number(d.width),0],[Number(d.width),Number(d.height)],[0,Number(d.height)]];
  if(shape.length<3||shape.some(p=>p.some(x=>!Number.isFinite(x))))return false;
  const cells=unitCells(shape);if(!cells.length||cells.length>100)return false;
  const f=frame(container,options),whole=cells.filter(p=>Math.abs(p.area-1)<1e-8),parts=cells.filter(p=>p.area<1-1e-8),sample=parts[0]?.local||[[0,0],[1,0],[0,1]],other=complementPiece(sample);
  const ordered=[...whole,...parts],w=Math.max(...shape.map(p=>p[0])),h=Math.max(...shape.map(p=>p[1])),scale=Math.min(400/Math.max(w,1),230/Math.max(h,1),70),left=330+(400-w*scale)/2,bottom=325;
  const src=[115,220],map=(p,dx=0,dy=0)=>[left+(p[0]+dx)*scale,bottom-(p[1]+dy)*scale];
  const source=(p,dx=0)=>[src[0]+p[0]*scale+dx,src[1]-p[1]*scale];
  f.status.textContent='A cut piece keeps its area. Place whole squares first, then fill the remaining spaces with cut pieces.';
  f.caption.textContent='The source unit and the target figure use the same scale. Each highlighted piece comes from one unit square. Two triangular half-squares have the same area as one whole square.';
  function draw(t){
    const cut=clamp(t),progress=clamp(t-1)*ordered.length,count=Math.min(ordered.length,Math.floor(progress+1e-8)),fraction=progress-count,gap=18*cut,active=ordered[count],placingWhole=t>1&&active?.area>=1-1e-8;
    let g=svgText(150,45,`One 1 ${unit}² square`,'small')+svgText(535,45,'Fill without gaps or overlaps','small');
    if(placingWhole){g+=poly([[0,0],[1,0],[1,1],[0,1]].map(p=>source(p)),fraction>0?'ghost':'piece');}
    else {g+=poly(other.map(p=>source(p,-gap/2)),'alternate');if(!(t>1&&fraction>0))g+=poly(sample.map(p=>source(p,gap/2)),'highlight');}
    if(cut===0)g+=poly([[0,0],[1,0],[1,1],[0,1]].map(p=>source(p)),'edge');
    g+=svgText(150,255,placingWhole?'Use a new whole unit.':t>1&&active?'Repeat the cut for this piece.':cut<.5?'Start with a whole unit.':'Cut the unit into parts.','small');
    g+=svgText(150,281,'Pieces keep their area.','tiny');
    for(const c of cells)g+=poly(c.points.map(p=>map(p)),'softfill');
    for(let i=0;i<count;i++){const c=ordered[i];g+=poly(c.points.map(p=>map(p)),c.area<1-1e-8?'highlight':'piece');}
    if(count<ordered.length&&fraction>0){const c=ordered[count];g+=poly(c.local.map((p,i)=>{const a=source(p,c.area<1-1e-8?gap/2:0),b=map(c.points[i]);return[lerp(a[0],b[0],fraction),lerp(a[1],b[1],fraction)];}),c.area<1-1e-8?'highlight':'piece');}
    g+=poly(shape.map(p=>map(p)),'edge');
    const doneWhole=ordered.slice(0,count).filter(p=>Math.abs(p.area-1)<1e-8).length,doneParts=count-doneWhole,area=ordered.slice(0,count).reduce((s,c)=>s+c.area,0),total=cells.reduce((s,c)=>s+c.area,0);
    g+=svgText(400,392,f.allowSolutions?`${doneWhole} whole square${doneWhole===1?'':'s'} + ${doneParts} cut piece${doneParts===1?'':'s'} placed`:'Count whole squares and cut pieces to find the area.','accenttext');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['Whole squares placed',String(doneWhole)],['Cut pieces placed',String(doneParts)],['Area placed so far',`${fmt(area)} ${unit}²`],['Total area',count===ordered.length?`${fmt(total)} ${unit}²`:'Fill the shape to reveal']]:[['Unit square','1 square unit'],['Cut piece','One half of a unit square'],['Your task','Combine the areas of all pieces']]);
  }
  const tr=cutControls(f,draw,ordered.length);tr.set(0);return f.clean;
}
function prismShape(d){
  if(d.type==='triangular_prism')return{shape:[[0,0],[Number(d.base),0],[0,Number(d.triangle_height)]],depth:Number(d.length)};
  if(d.type==='l_prism')return{shape:[[0,0],[Number(d.width),0],[Number(d.width),Number(d.right_height)],[Number(d.top_width),Number(d.right_height)],[Number(d.top_width),Number(d.height)],[0,Number(d.height)]],depth:Number(d.length)};
  if(d.type==='t_prism'){
    const w=Number(d.width),h=Number(d.height),stem=Number(d.stem_width),bar=Number(d.top_height??d.bar_height),l=(w-stem)/2;
    return{shape:[[l,0],[l+stem,0],[l+stem,h-bar],[w,h-bar],[w,h],[0,h],[0,h-bar],[l,h-bar]],depth:Number(d.length)};
  }
  if(d.type==='cube_units'||d.type==='half_cubes')return{shape:[[0,0],[Number(d.side),0],[Number(d.side),Number(d.side)],[0,Number(d.side)]],depth:Number(d.side)};
  return{shape:[[0,0],[Number(d.length),0],[Number(d.length),Number(d.height)],[0,Number(d.height)]],depth:Number(d.width)};
}
function mountVolumeUnits(container,problem,options){
  const d=problem.diagram,{shape,depth}=prismShape(d),unit=d.unit||'cm';
  if(!Number.isFinite(depth)||depth<=0||shape.some(p=>p.some(v=>!Number.isFinite(v))))return false;
  const cells=unitCells(shape),pieces=[];
  for(let z=0;z<depth-1e-8;z++)for(const c of cells)pieces.push({...c,z,depth:Math.min(1,depth-z),volume:c.area*Math.min(1,depth-z)});
  if(!pieces.length||pieces.length>180)return false;
  const partial=pieces.find(p=>p.area<1-1e-8),sample=partial?.local||[[0,0],[1,0],[0,1]],other=complementPiece(sample);
  const ordered=[...pieces.filter(p=>Math.abs(p.volume-1)<1e-8),...pieces.filter(p=>p.volume<1-1e-8)],w=Math.max(...shape.map(p=>p[0])),h=Math.max(...shape.map(p=>p[1])),scale=Math.min(350/(w+.55*depth),230/(h+.35*depth),65),left=340+(350-(w+.55*depth)*scale)/2,bottom=330;
  const f=frame(container,options),src=[110,215];let layer=0;
  const project=(x,y,z)=>[left+scale*(x+.55*z),bottom-scale*(y+.35*z)],source=(x,y,z,shift=0)=>[src[0]+scale*(x+.55*z)+shift,src[1]-scale*(y+.35*z)];
  const layerButton=f.button('Show one depth layer',()=>{layer=layer?0:1;layerButton.textContent=layer?'Show all depth layers':'Show one depth layer';draw(tr.t);});
  f.status.textContent=partial?'One cube measures 1 unit in each direction. Cut pieces fill the spaces where a whole cube will not fit.':'One cube measures 1 unit in each direction. Count the cubes in every depth layer.';
  if(d.show_dimensions&&!d.show_fill_process){
    const measure=(label,value)=>`${label} ${fmt(Number(value))} ${unit}`;
    let givens=[];
    if(d.type==='triangular_prism')givens=[measure('triangle base',d.base),measure('triangle height',d.triangle_height),measure('prism depth',d.length)];
    if(d.type==='l_prism')givens=[measure('overall width',d.width),measure('overall height',d.height),measure('prism depth',d.length),measure('upright arm width',d.top_width),measure('lower arm height',d.right_height)];
    if(d.type==='t_prism')givens=[measure('overall width',d.width),measure('overall height',d.height),measure('prism depth',d.length),measure('stem width',d.stem_width),measure('top bar height',d.top_height??d.bar_height)];
    if(d.type==='rect_prism')givens=[measure('length',d.length),measure('width',d.width),measure('height',d.height)];
    if(givens.length){f.status.textContent=`Given: ${givens.join(' · ')}.`;f.status.style.lineHeight='1.6';}
  }
  f.caption.textContent=partial?'Each block is a real part of a unit cube. Blue blocks are whole cubes; gold blocks are cut pieces. Two half-cube pieces have the same volume as one whole cube. Count every depth layer.':'Count the unit cubes in every depth layer. The reference cube and the larger prism use the same scale, and each unit cube has volume 1 cubic unit.';
  function draw(t){
    const cut=clamp(t),progress=clamp(t-1)*ordered.length,count=Math.min(ordered.length,Math.floor(progress+1e-8)),fraction=progress-count,gap=18*cut,active=ordered[count],placingWhole=t>1&&active?.volume>=1-1e-8;
    let g=svgText(150,43,`One 1 ${unit}³ cube`,'small')+svgText(535,43,layer?'Front depth layer only':'Fill the complete prism','small');
    if(placingWhole||!partial){g+=drawPrism([[0,0],[1,0],[1,1],[0,1]],0,1,source,t>1&&fraction>0?'ghost':'piece');}
    else {g+=drawPrism(other,0,1,(x,y,z)=>source(x,y,z,-gap/2),'alternate');if(!(t>1&&fraction>0))g+=drawPrism(sample,0,1,(x,y,z)=>source(x,y,z,gap/2),'highlight');}
    g+=svgText(150,255,placingWhole?'Use a new whole cube.':!partial?'Use whole unit cubes.':t>1&&active?'Repeat the cut for this piece.':cut<.5?'Start with a whole cube.':'Cut into equal-volume parts.','small');
    g+=svgText(150,282,'Same scale as the larger prism','tiny');
    const visible=ordered.slice(0,count).filter(p=>!layer||p.z===0).sort((a,b)=>b.z-a.z||a.y-b.y||a.x-b.x);
    // Ghost unit boundaries expose the full container before any filling occurs.
    const ghosts=pieces.filter(p=>!layer||p.z===0).sort((a,b)=>b.z-a.z||a.y-b.y||a.x-b.x);
    for(const p of ghosts)g+=drawPrism(p.points,p.z,p.z+p.depth,project,'ghost');
    for(const p of visible)g+=drawPrism(p.points,p.z,p.z+p.depth,project,p.volume<1-1e-8?'highlight':'piece');
    if(count<ordered.length&&fraction>0){const p=ordered[count];if(!layer||p.z===0){const moving=(x,y,z)=>{const a=source(x-p.x,y-p.y,z-p.z,p.volume<1-1e-8?gap/2:0),b=project(x,y,z);return[lerp(a[0],b[0],fraction),lerp(a[1],b[1],fraction)];};g+=drawPrism(p.points,p.z,p.z+p.depth,moving,p.volume<1-1e-8?'highlight':'piece');}}
    const placed=ordered.slice(0,count),whole=placed.filter(p=>Math.abs(p.volume-1)<1e-8).length,partialCount=count-whole,volume=placed.reduce((s,p)=>s+p.volume,0),total=pieces.reduce((s,p)=>s+p.volume,0);
    g+=svgText(400,391,f.allowSolutions?`${whole} whole cube${whole===1?'':'s'} + ${partialCount} cut piece${partialCount===1?'':'s'} placed`:'Count whole cubes and cut pieces to find the volume.','accenttext');
    g+=svgText(400,418,layer?'Layer view changes the picture; counts still include all layers.':`${fmt(depth)} unit${depth===1?'':'s'} deep — cubes have 1-unit edges`,'tiny');
    f.svg.innerHTML=g;f.setMetrics(f.allowSolutions?[['Whole cubes placed',String(whole)],['Cut pieces placed',String(partialCount)],['Volume placed so far',`${fmt(volume)} ${unit}³`],['Total volume',count===ordered.length?`${fmt(total)} ${unit}³`:'Fill the prism to reveal']]:[['One whole cube','1 cubic unit'],['Your task','Count all depth layers and combine the pieces']]);
  }
  const tr=cutControls(f,draw,ordered.length,Math.min(9000,4000+pieces.length*65));tr.set(0);return f.clean;
}

function mountCompositeArea(container,problem,options){
  const d=problem.diagram,unit=d.unit||'units',kind=d.type==='L_area'||d.type==='lshape'?'L':d.type==='trapezoid'?'trapezoid':'house';
  let pieces,areas,bounds,givens,guide;
  if(kind==='L'){
    const w=Number(d.width),h=Number(d.height),tw=Number(d.top_width),rh=Number(d.right_height),gap=Math.min(w,h)*.35;
    if(!(w>tw&&h>rh&&tw>0&&rh>0))return false;
    pieces=[{v:[[0,0],[tw,0],[tw,h],[0,h]],dx:-gap/2,dy:0,label:'Rectangle A'},{v:[[tw,0],[w,0],[w,rh],[tw,rh]],dx:gap/2,dy:0,label:'Rectangle B'}];
    areas=[tw*h,(w-tw)*rh];bounds=[-gap/2,w+gap/2,h];
    givens=`Given: overall width ${fmt(w)} ${unit}; height ${fmt(h)} ${unit}; upright width ${fmt(tw)} ${unit}; lower height ${fmt(rh)} ${unit}.`;
    guide='Cut the L-shape into two rectangles. Find any missing side by subtraction, then add the two rectangle areas.';
  }else if(kind==='trapezoid'){
    const B=Number(d.bottom),b=Number(d.top),h=Number(d.height),q=(B-b)/2,gap=Math.min(B,h)*.35;
    if(!(B>b&&b>0&&h>0))return false;
    pieces=[{v:[[0,0],[q,0],[q,h]],dx:-gap,dy:0,label:'Triangle A'},{v:[[q,0],[q+b,0],[q+b,h],[q,h]],dx:0,dy:0,label:'Rectangle'},{v:[[q+b,0],[B,0],[q+b,h]],dx:gap,dy:0,label:'Triangle B'}];
    areas=[q*h/2,b*h,q*h/2];bounds=[-gap,B+gap,h];
    givens=`Given: lower base ${fmt(B)} ${unit}; upper base ${fmt(b)} ${unit}; perpendicular height ${fmt(h)} ${unit}.`;
    guide='Cut along the two perpendicular heights. The center is a rectangle and each end is a right triangle. The three areas add to the original area.';
  }else{
    const w=Number(d.width),h=Number(d.wall_height),rh=Number(d.roof_height),gap=Math.min(w,h+rh)*.35;
    if(!(w>0&&h>0&&rh>0))return false;
    pieces=[{v:[[0,0],[w,0],[w,h],[0,h]],dx:-(w+gap)/2,dy:0,label:'Rectangle'},{v:[[0,h],[w,h],[w/2,h+rh]],dx:(w+gap)/2,dy:-h,label:'Triangle'}];
    areas=[w*h,w*rh/2];bounds=[-(w+gap)/2,w+(w+gap)/2,h+rh];
    givens=`Given: width ${fmt(w)} ${unit}; wall height ${fmt(h)} ${unit}; roof height ${fmt(rh)} ${unit}.`;
    guide='Separate the roof triangle from the wall rectangle. Moving them preserves every length and area. Find each area, then add.';
  }
  const f=frame(container,options),scale=Math.min(620/(bounds[1]-bounds[0]),235/bounds[2]),x=400-(bounds[0]+bounds[1])*scale/2,y=325;let tr;
  f.status.textContent=givens;f.caption.textContent=guide;
  f.button('Next step',()=>tr.next());f.button('Put pieces back',()=>tr.reset());
  function draw(t){
    let g=svgText(400,35,t<.01?'Find the smaller shapes inside the figure':'Same pieces, separated for measuring','small');
    const map=([a,b])=>[x+a*scale,y-b*scale];
    for(let i=0;i<pieces.length;i++){
      const p=pieces[i],v=p.v.map(([a,b])=>[a+p.dx*t,b+p.dy*t]);
      g+=poly(v.map(map),i%2?'highlight':'piece',`data-composite-piece="${i}"`);
      if(t>.7){const mid=v.reduce((c,p)=>[c[0]+p[0]/v.length,c[1]+p[1]/v.length],[0,0]),xy=map(mid);g+=svgText(xy[0],xy[1],p.label,'small');}
    }
    g+=svgText(400,385,f.allowSolutions&&t>=.999?`${areas.map(a=>fmt(a)).join(' + ')} = ${fmt(areas.reduce((a,b)=>a+b,0))} square ${unit}`:'Find each piece’s area, then combine the areas.','accenttext');
    g+=svgText(400,416,'Rectangles: A = bh. Triangles: A = ½bh.','small');
    f.svg.innerHTML=g;
    f.setMetrics(f.allowSolutions&&t>=.999?[...areas.map((a,i)=>[pieces[i].label,`${fmt(a)} square ${unit}`]),['Total area',`${fmt(areas.reduce((a,b)=>a+b,0))} square ${unit}`]]:[['Pieces preserve area','No gaps, overlaps, or pieces lost'],['Try it','Use the given measurements for each smaller shape']]);
  }
  tr=transport(f,draw,1,2200);tr.set(0);return f.clean;
}
function mountCircle(container,problem,options){
  const f=frame(container,options),d=problem.diagram,r=Number(d.radius)||4,cx=400,cy=210,rp=142;
  const radiusLabel=d.radius_label||(d.given==='radius'?`r = ${d.label}`:'r = ?'),diameterLabel=d.diameter_label||(d.given==='diameter'?`d = ${d.label}`:'d = ?');
  f.status.textContent='A radius reaches from the center to the circle. A diameter passes through the center.';
  f.caption.textContent='Use the given information and the formula in your problem. Zoom in, drag to pan, or pinch with two fingers to inspect the diagram.';
  f.playbar.hidden=true;
  let g=`<circle cx="${cx}" cy="${cy}" r="${rp}" class="edge"/>`;
  if(d.show_diameter!==false)g+=ln(cx-rp,cy,cx+rp,cy,'accentline')+svgText(cx,cy+28,diameterLabel,'small');
  if(d.show_radius!==false){const a=-Math.PI/3,xx=cx+rp*Math.cos(a),yy=cy+rp*Math.sin(a);g+=ln(cx,cy,xx,yy,'edge')+svgText(xx+8,(cy+yy)/2,radiusLabel,'small','start');}
  g+=`<circle cx="${cx}" cy="${cy}" r="4" fill="var(--lv-ink)"/>`;
  if(d.given==='circumference')g+=svgText(cx,42,d.label,'formula');
  f.svg.innerHTML=g;f.metrics.hidden=true;return f.clean;
}

export function mountInteractive(container, problem, options={}) {
  if(!container||!problem?.diagram)return false;
  const type=problem.diagram.type;
  if(type==='circle')return mountCircle(container,problem,options);
  if(type==='L_area'||type==='trapezoid'||(type==='composite'&&problem.diagram.shape==='house')||(type==='lshape'&&/area/i.test((problem.topic||'')+' '+(problem.prompt||''))))return mountCompositeArea(container,problem,options);
  if(type==='polygon')return problem.diagram.show_radii&&!problem.diagram.show_diameter?mountPolygonArea(container,problem,options):mountPerimeter(container,problem,options);
  if(type==='polygon_rearrange')return mountRearrange(container,problem,options);
  if(type==='central_triangle')return mountCentral(container,problem,options);
  if(type==='parallelogram_cut')return mountParallelogram(container,problem,options);
  if(type==='ratio')return mountRatio(container,problem,options);
  if(type==='segment'||type==='bent_path')return mountLineUnits(container,problem,options);
  if(type==='grid_polygon'||type==='grid_triangle')return mountAreaUnits(container,problem,options);
  if(type==='grid_rectangle')return problem.diagram.show_fill_process||!Number.isInteger(Number(problem.diagram.width))?mountAreaUnits(container,problem,options):mountGrid(container,problem,options);
  if(type==='cube_units'||((type==='rect_prism'||type==='triangular_prism'||type==='l_prism'||type==='t_prism')&&problem.diagram.show_unit_cubes))return mountVolumeUnits(container,problem,options);
  return false;
}
