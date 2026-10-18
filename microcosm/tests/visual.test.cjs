// Geometry and draw-cost checks on native Canvas, not browser/Chromebook QA.
const test=require('node:test'),assert=require('node:assert/strict');
const {createCanvas}=require(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/@napi-rs/canvas');
const {Game}=require('../engine.js'),Renderer=require('../render.js');
test('cup outline surrounds the prey only after closure at all headings and supported prey sizes',()=>{
 const canvas=createCanvas(500,500),r=new Renderer(canvas);
 for(const kind of ['alga','bacterium','paramecium'])for(const angle of [0,.7,1.57,2.5,3.14,4.9]){
  const g=new Game('amoeba','garden',77),a=g.focus;a.x=200;a.y=200;a.a=angle;
  const f={id:999,x:a.x+Math.cos(angle)*65,y:a.y+Math.sin(angle)*65,r:kind==='paramecium'?22:kind==='alga'?7:4,...(kind==='paramecium'?{type:kind}:{kind})};
  a.capture={id:f.id,progress:0,angle};
  for(const progress of [.12,.44,.68,.78,.82,.95]){a.capture.progress=progress;const pull=global.MC.engulfPhase(progress).pull,d=65+(a.r*.32-65)*pull;f.x=a.x+Math.cos(angle)*d;f.y=a.y+Math.sin(angle)*d;const cup=r.cup(a,f);r.path(a,cup);assert(r.ctx.isPointInPath(a.x,a.y),'body remains filled');assert.equal(r.ctx.isPointInPath(f.x,f.y),progress>=.8,kind+' '+angle+' '+progress)}
 }
});
test('drawing repeated capture and damage frames creates no simulation objects or state changes',()=>{
 const g=new Game('amoeba','garden',12),a=g.focus;g.s.cells=[a];g.s.food=[];g.s.rocks=[];g.s.hazards=[];g.addFood(a.x+60,a.y,'alga');g.ability(a);g.updateCapture(a,2.8);a.invuln=0;g.hit(a,20,{x:a.x+50,y:a.y});const before=JSON.stringify(g.s),r=new Renderer(createCanvas(1366,768));r.resize(1366,768);r.camera={x:a.x,y:a.y};r.freeCamera=true;for(let i=0;i<90;i++)r.draw(g,1/30);assert.equal(JSON.stringify(g.s),before);
});

test('pseudopods advance asymmetrically and fit elongated prey without a circular arc',()=>{const g=new Game('amoeba','garden',7),a=g.focus,r=new Renderer(createCanvas(500,500));a.capture={progress:.42,angle:0};const prey={x:a.x+65,y:a.y,r:20,type:'paramecium',a:0};const cup=r.cup(a,prey);assert(Math.abs(cup.u-cup.v)>.15);assert(cup.rx>cup.ry);let arcs=0;const original=r.ctx.arc;r.ctx.arc=(...args)=>{arcs++;return original.apply(r.ctx,args)};r.path(a,cup);assert.equal(arcs,0)});

test('every organism renders its action stages without changing the model or making particles',()=>{
 const r=new Renderer(createCanvas(1366,768));r.resize(1366,768);r.freeCamera=true;
 for(const type of ['paramecium','didinium','bacillus','injector'])for(const progress of [.1,.55,.92]){
  const g=new Game(type,'garden',77),a=g.focus;g.s.cells=[a];g.s.food=[];g.s.rocks=[];g.s.hazards=[];g.s.dna=[];g.s.clouds=[];a.a=0;r.camera={x:a.x,y:a.y};
  if(type==='paramecium'||type==='didinium'){const p=g.cell(type==='didinium'?'paramecium':'bacillus',a.x+60,a.y,1);p.r=type==='didinium'?26:12;p.mass=type==='didinium'?45:26;g.s.cells.push(p);assert(g.capture(a,p));a.capture.progress=progress;g.updateCapture(a,0)}else{a.burst=type==='injector'?.4:.5;a.uptake=.4;a.uptakeAngle=.7;a.attackAngle=0;a.attackLength=a.r+3;a.division=1.4}
  const before=JSON.stringify(g.s);for(let i=0;i<5;i++)r.draw(g,1/30);assert.equal(JSON.stringify(g.s),before);
 }
});
test('species color is retained across factions and the contact spike remains short',()=>{
 const g=new Game('injector','garden',7),a=g.focus,r=new Renderer(createCanvas(400,300));a.x=100;a.y=100;a.a=0;a.burst=.45;a.attackAngle=0;a.attackLength=200;
 const calls=[],original=r.ctx.lineTo;r.ctx.lineTo=(x,y)=>{calls.push([x,y]);return original.call(r.ctx,x,y)};r.injection(a,'#ff7498');assert(Math.max(...calls.map(p=>p[0]))<=global.MC.surfaceRadius(a,0)+7);
 const strokes=[],appendages=r.appendages;r.appendages=function(cell,s,color,detail){strokes.push(color);return appendages.call(this,cell,s,color,detail)};for(const team of [0,1,2,3]){a.team=team;r.cell(a,g)}assert(strokes.every(c=>c===global.MC.TYPES.injector.color));
});
