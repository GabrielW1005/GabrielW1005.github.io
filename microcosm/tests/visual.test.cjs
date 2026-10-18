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
  for(const progress of [.12,.44,.68,.74,.85,.95]){a.capture.progress=progress;const pull=global.MC.engulfPhase(progress).pull,d=65+(a.r*.32-65)*pull;f.x=a.x+Math.cos(angle)*d;f.y=a.y+Math.sin(angle)*d;const cup=r.cup(a,f);r.path(a,cup);assert(r.ctx.isPointInPath(a.x,a.y),'body remains filled');assert.equal(r.ctx.isPointInPath(f.x,f.y),progress>=.72,kind+' '+angle+' '+progress)}
 }
});
test('drawing repeated capture and damage frames creates no simulation objects or state changes',()=>{
 const g=new Game('amoeba','garden',12),a=g.focus;g.s.cells=[a];g.s.food=[];g.s.rocks=[];g.s.hazards=[];g.addFood(a.x+60,a.y,'alga');g.ability(a);g.updateCapture(a,.8);a.invuln=0;g.hit(a,20,{x:a.x+50,y:a.y});const before=JSON.stringify(g.s),r=new Renderer(createCanvas(1366,768));r.resize(1366,768);r.camera={x:a.x,y:a.y};r.freeCamera=true;for(let i=0;i<90;i++)r.draw(g,1/30);assert.equal(JSON.stringify(g.s),before);
});
