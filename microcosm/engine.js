/* Microcosm 2 — deterministic, fixed-step ecological game model. No remote dependencies. */
(function(root){
'use strict';
const TAU=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y), angle=(a,b)=>Math.atan2(b.y-a.y,b.x-a.x);
const delta=(a,b)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
const smooth=v=>{v=clamp(v,0,1);return v*v*(3-2*v)};
// A few timed curves describe the cup; no fluid solver or extra moving particles.
const engulfPhase=p=>({reach:smooth(p/.38),wrap:smooth((p-.12)/.68),sealed:p>=.8,pull:smooth((p-.84)/.16)});
// These relative radii are game tuning in an exaggerated 2D scale, not biological constants.
const FEEDING={amoeba:{prey:['bacillus','injector','paramecium'],limit:.85,mode:'engulf'},paramecium:{prey:['bacillus','injector'],limit:.55,mode:'graze'},didinium:{prey:['paramecium'],limit:1.65,mode:'capture'}};
const TYPES={
 amoeba:{name:'Amoeba',color:'#5df6c5',r:39,speed:62,ability:'Engulf',icon:'◉',cost:3,cool:1.1,domain:'eukaryote',diet:['alga','bacterium'],description:'Flow around prey. Seal a food vacuole. Digest inside.'},
 paramecium:{name:'Paramecium',color:'#56caff',r:33,speed:100,ability:'Escape',icon:'✳',cost:10,cool:5,domain:'eukaryote',diet:['bacterium'],description:'Cilia sweep bacteria inward. Swim out of an open cup; extrusomes are not universal armor.'},
 didinium:{name:'Didinium',color:'#ffab63',r:32,speed:86,ability:'Capture',icon:'↠',cost:7,cool:2.4,domain:'eukaryote',diet:[],description:'Contact a ciliate with the proboscis. Immobilize and ingest it.'},
 bacillus:{name:'Bacillus-like',color:'#c8a0ff',r:20,speed:75,ability:'Bacteriocin',icon:'⁙',cost:13,cool:10,domain:'bacterium',diet:['nutrient'],description:'Absorb dissolved nutrients. Release a selective toxin. Take up compatible DNA.'},
 injector:{name:'T6SS bacterium',color:'#ff7498',r:21,speed:78,ability:'Contact injector',icon:'↣',cost:5,cool:3.5,domain:'bacterium',diet:['nutrient'],description:'A composite Gram-negative model. Touch a rival to inject a toxin; no long-range harpoon.'}
};
const TRAITS={
 motility:{name:'Motility',icon:'➟',text:'Faster movement and stronger escape from an open amoeba cup; higher movement energy cost.',all:true},
 membrane:{name:'Membrane repair',icon:'⬡',text:'Faster repair and less membrane damage; higher maintenance.',all:true},
 metabolism:{name:'Respiration',icon:'ϟ',text:'More energy from food when oxygen is available; greater oxygen demand.',all:true},
 sensing:{name:'Sensing',icon:'◎',text:'Find food and threats farther away.',all:true},
 digestion:{name:'Digestion',icon:'◉',text:'Faster vacuole digestion through greater lysosomal activity.',types:['amoeba','paramecium','didinium']},
 osmosis:{name:'Water balance',icon:'◌',text:'More effective water regulation; pumping uses energy.',all:true},
 extrusome:{name:'Extrusomes',icon:'✳',text:'Faster replenishment of contact or defensive organelles.',types:['paramecium','didinium','injector']},
 toxin:{name:'Bacteriocin output',icon:'⁙',text:'More local toxin activity; release consumes more energy.',types:['bacillus']},
 immunity:{name:'Toxin resistance',icon:'◇',text:'Less damage from modeled bacterial clouds and contact injection; upkeep costs energy.',all:true},
 uptake:{name:'Transporters',icon:'⇥',text:'More efficient dissolved nutrient uptake.',types:['bacillus','injector']},
 competence:{name:'Competence',icon:'⧖',text:'Faster uptake of compatible extracellular DNA.',types:['bacillus','injector']}
};
const BIOMES=[
 {id:'garden',name:'Algal garden',icon:'✺',color:'#64e5ab',x:1350,y:1050,r:1000,oxygen:1,water:.2,light:1,subtitle:'Food-rich · bright · forgiving'},
 {id:'silt',name:'Silt labyrinth',icon:'◈',color:'#ab8be9',x:4320,y:1050,r:1100,oxygen:.3,water:.3,light:.15,subtitle:'Low oxygen · narrow passages'},
 {id:'brine',name:'Saline edge',icon:'≈',color:'#62bde9',x:4350,y:3150,r:1050,oxygen:.75,water:1.7,light:.7,subtitle:'Osmotic stress · exposed currents'},
 {id:'bloom',name:'Bacterial bloom',icon:'⁙',color:'#ff917d',x:1350,y:3100,r:1050,oxygen:.6,water:.5,light:.5,subtitle:'Crowded · chemical competition'}
];
const eligible=(t,k)=>TRAITS[k]&&(TRAITS[k].all||TRAITS[k].types.includes(t));
const baseTraits=()=>Object.fromEntries(Object.keys(TRAITS).map(k=>[k,0]));
class Game{
 constructor(type='amoeba',biome='garden',seed=Date.now(),gentle=false){
  if(!TYPES[type])throw Error('Unknown organism');
  this.s={format:'microcosm-colony',version:2,w:6000,h:4200,seed:seed|0,nextId:0,time:0,type,gentle,cells:[],food:[],dna:[],clouds:[],rocks:[],hazards:[],effects:[],selection:[],focus:0,score:0,meals:0,kills:0,divisions:0,transfers:0,mutationPoints:2,mutationProgress:0,discovered:[biome],paceRevision:1,autoAbility:false,speed:1,mode:'hold',dead:false};
  this.events=[];this.navCache=new Map();this.tickCount=0;this.ecologyClock=0;this.routeBudget=2;this.byId=null;
  this.generate(biome);
 }
 rand(a=0,b=1){let t=this.s.seed=(this.s.seed+0x6D2B79F5)|0;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return a+(b-a)*((t^t>>>14)>>>0)/4294967296}
 id(){return ++this.s.nextId}
 pick(a){return a[Math.floor(this.rand(0,a.length))]}
 get colony(){return this.s.cells.filter(c=>c.team===0&&c.hp>0)}
 get focus(){return this.s.cells.find(c=>c.id===this.s.focus&&c.hp>0)||this.colony[0]}
 get selected(){return this.colony.filter(c=>this.s.selection.includes(c.id))}
 emit(text){this.events.push(text);if(this.events.length>10)this.events.shift()}
 biome(p){return BIOMES.reduce((a,b)=>dist(p,a)/a.r<dist(p,b)/b.r?a:b)}
 flow(p){return {x:3*Math.sin(p.y/380+this.s.time*.05),y:2*Math.cos(p.x/420-this.s.time*.04)}}
 cell(type,x,y,team=1){
  const c={id:this.id(),type,x,y,vx:0,vy:0,a:this.rand(0,TAU),r:TYPES[type].r,seed:this.rand(0,TAU),team,hp:100,energy:90,mass:team===0?72:55,oxygen:1,water:0,cool:0,stun:0,invuln:team===0?10:0,age:0,gen:1,traits:baseTraits(),pending:null,gut:[],capture:null,capturedBy:0,division:0,mating:0,mate:0,competent:false,samples:{},integrating:null,order:null,path:[],think:0,target:0,intent:'forage',org:[],mem:[],burst:0};
  if(TYPES[type].domain==='eukaryote'){
   c.org.push({kind:'nucleus',x:-5,y:0,vx:0,vy:0,r:type==='paramecium'?9:10});
   if(type==='paramecium')c.org.push({kind:'micronucleus',x:8,y:5,vx:0,vy:0,r:3});
   for(let j=0;j<5;j++)c.org.push({kind:'mitochondrion',x:this.rand(-20,20),y:this.rand(-20,20),vx:0,vy:0,r:4});
   for(let j=0;j<3;j++)c.org.push({kind:'lysosome',x:this.rand(-20,20),y:this.rand(-20,20),vx:0,vy:0,r:3});
   c.org.push({kind:'vacuole',x:15,y:-12,vx:0,vy:0,r:7});
   c.org.push({kind:'er',x:-10,y:10,vx:0,vy:0,r:8});
  }
  for(let i=0;i<40;i++)c.mem.push({r:c.r,v:0});
  return c;
 }
 generate(biome){
  const b=BIOMES.find(v=>v.id===biome)||BIOMES[0],s=this.s;
  const p=this.cell(s.type,b.x,b.y,0);s.cells.push(p);s.focus=p.id;s.selection=[p.id];
  for(let i=0;i<48;i++){const r={x:this.rand(70,s.w-70),y:this.rand(70,s.h-70),r:this.rand(24,75),seed:this.rand()};if(dist(r,p)>230)s.rocks.push(r)}
  // Silt passages: obstacles belong to one continuous world, not separate levels.
  for(let i=0;i<18;i++)s.rocks.push({x:3650+(i%7)*160,y:500+Math.floor(i/7)*270,r:55+this.rand(0,20),seed:this.rand()});
  s.rocks=s.rocks.filter(r=>dist(r,p)>160);
  for(let i=0;i<10;i++){const q=BIOMES[i%4];const h={id:this.id(),x:clamp(q.x+this.rand(-800,800),150,s.w-150),y:clamp(q.y+this.rand(-700,700),150,s.h-150),r:this.rand(85,150),kind:i%3===0?'acid':i%3===1?'hypoxia':'shear',phase:this.rand(0,TAU)};if(dist(h,p)>500)s.hazards.push(h)}
  for(let i=0;i<360;i++)this.addFood();
  for(let i=0;i<24;i++){const a=this.rand(0,TAU),r=this.rand(55,270);this.addFood(p.x+Math.cos(a)*r,p.y+Math.sin(a)*r,TYPES[s.type].domain==='bacterium'?'nutrient':i%3?'bacterium':'alga')}
  const bacterial=TYPES[s.type].domain==='bacterium';
  for(let i=0;i<36;i++){
   const q=BIOMES[i%4],t=bacterial?(i%12===0?'amoeba':i%9===0?'paramecium':i%3===0?'injector':'bacillus'):(i%12===0?'didinium':i%7===0?'amoeba':i%3===0?(i%2?'injector':'bacillus'):'paramecium');
   const c=this.cell(t,clamp(q.x+this.rand(-820,820),100,s.w-100),clamp(q.y+this.rand(-760,760),100,s.h-100),i%3+1);
   c.energy=this.rand(t==='didinium'?45:60,85);if(dist(c,p)>520&&this.clear(c,c.r))s.cells.push(c);
  }
  // Peaceful feeding space first; occasional encounters appear farther away.
  for(let i=0;i<2;i++){const t=bacterial?'bacillus':'paramecium';const c=this.cell(t,p.x+360+i*130,p.y+this.rand(-160,160),i+1);c.energy=90;if(this.clear(c,c.r))s.cells.push(c)}
  if(bacterial)for(let i=0;i<24;i++)this.addDNA(p.x+this.rand(-450,450),p.y+this.rand(-450,450),i%3===0?'injector':s.type);
 }
 clear(p,r=25){return p.x>r&&p.y>r&&p.x<this.s.w-r&&p.y<this.s.h-r&&!this.s.rocks.some(k=>dist(p,k)<k.r+r)}
 addFood(x,y,kind){
  if(this.s.food.length>=550)return;
  const b=this.pick(BIOMES);if(x===undefined){x=clamp(b.x+this.rand(-1100,1100),30,this.s.w-30);y=clamp(b.y+this.rand(-950,950),30,this.s.h-30)}
  if(!kind)kind=TYPES[this.s.type].domain==='bacterium'?'nutrient':this.rand()<.28?'alga':this.rand()<.16?'detritus':'bacterium';
  this.s.food.push({id:this.id(),x,y,kind,r:kind==='alga'?7:kind==='detritus'?10:kind==='nutrient'?2.8:4,seed:this.rand(0,TAU),capturedBy:0,life:kind==='detritus'?this.rand(10,25):300});
 }
 addDNA(x,y,type,trait){if(this.s.dna.length<100)this.s.dna.push({id:this.id(),x,y,type,trait:trait||this.pick(Object.keys(TRAITS).filter(k=>eligible(type,k))),life:130,amount:0})}
 fx(kind,x,y,color,n=8){
  if(kind==='lysis'){const cell=this.s.cells.find(c=>c.x===x&&c.y===y);this.s.effects.push({kind:'rupture',x,y,vx:0,vy:0,life:.6,color,r:cell?.r||20})}
  n=Math.min(n,7);for(let i=0;i<n;i++){const a=this.rand(0,TAU),v=this.rand(5,28);this.s.effects.push({kind,x,y,vx:Math.cos(a)*v,vy:Math.sin(a)*v,life:this.rand(.3,1),color,r:this.rand(1,3)})}
  if(this.s.effects.length>90)this.s.effects.splice(0,this.s.effects.length-90);
 }
 select(ids,add=false){const valid=this.colony.map(c=>c.id);this.s.selection=[...new Set((add?this.s.selection:[]).concat(ids))].filter(id=>valid.includes(id));if(this.s.selection.length)this.s.focus=this.s.selection[0]}
 command(x,y,target=0){const a=this.selected;for(let i=0;i<a.length;i++){const c=a[i],offset=a.length>1?Math.sqrt(i)*c.r*2:0;c.order={x:clamp(x+Math.cos(i*2.4)*offset,40,this.s.w-40),y:clamp(y+Math.sin(i*2.4)*offset,40,this.s.h-40),target};c.path=[];c.think=0;c.target=0;c.aiGoal=null;c.routeAt=0;c.intent=target?'hunt':'move'}this.fx('order',x,y,'#c3fff0',10)}
 queueMutation(trait){let n=0;for(const c of this.selected){if(!eligible(c.type,trait)||c.pending||c.traits[trait]>=3||this.s.mutationPoints<1)continue;c.pending=trait;this.s.mutationPoints--;n++}if(n)this.emit('Variant selected: inherited when this cell divides.');return n}
 tryIntegrate(trait){let n=0;for(const c of this.selected){if(TYPES[c.type].domain!=='bacterium'||!c.competent||c.integrating||!c.samples[trait]||c.energy<12||c.traits[trait]>=3)continue;c.samples[trait]--;c.energy-=10;c.integrating={trait,left:3.5};n++}return n}
 toggleCompetence(){for(const c of this.selected)if(TYPES[c.type].domain==='bacterium'&&!c.division&&!c.integrating)c.competent=!c.competent}
 conjugate(){const a=this.selected.filter(c=>c.type==='paramecium'&&!c.division&&!c.mating&&c.energy>=20);if(a.length<2){this.emit('Select two nearby Paramecia to pair.');return false}const [c,d]=a;if(dist(c,d)>c.r+d.r+80){this.emit('Move the two cells together first.');return false}for(const [p,q] of [[c,d],[d,c]]){p.mating=6;p.mate=q.id;p.order=null;p.energy-=12}this.emit('Conjugation: a simplified exchange of nuclear variants, not another cell.');return true}
 divisionReady(c){return c.mass>=100&&c.energy>=35&&c.hp>=50&&!c.capture&&!c.division&&!c.competent&&!c.integrating&&!c.mating}
 divide(ids=this.s.selection){let n=0;for(const c of this.s.cells.filter(c=>ids.includes(c.id))){if(!this.divisionReady(c))continue;if(c.team===0&&this.colony.length+this.colony.filter(q=>q.division>0).length>=24){this.emit('Colony capacity: 24 cells.');break}if(c.team!==0&&this.s.cells.length+this.s.cells.filter(q=>q.division>0).length>=64)continue;c.division=3.2;c.energy-=5;c.order=null;n++}if(!n)this.emit('Division: 100 biomass · 35 energy · 50 integrity · no active capture.');return n}
 finishDivision(c){
  // Conservation at cytokinesis: both daughters share reserves and area.
  const d=this.cell(c.type,c.x,c.y,c.team),a=c.a;c.mass*=.5;c.energy*=.5;d.mass=c.mass;d.energy=c.energy;d.hp=c.hp;d.gen=++c.gen;d.traits={...c.traits};const vacuoles=c.gut;c.gut=vacuoles.filter((_,i)=>i%2===0);d.gut=vacuoles.filter((_,i)=>i%2===1);
  if(c.pending){c.traits[c.pending]=clamp(c.traits[c.pending]+1,0,3);d.traits={...c.traits};c.pending=null}
  const rr=TYPES[c.type].r*Math.sqrt(Math.max(20,c.mass)/72);c.r=rr;d.r=rr;
  for(const p of [c,d]){p.mem.forEach(m=>{m.r=rr;m.v=0});p.invuln=2;p.cool=1;p.division=0;p.capture=null;p.order=null}
  c.x=clamp(c.x+Math.cos(a)*rr,rr,this.s.w-rr);c.y=clamp(c.y+Math.sin(a)*rr,rr,this.s.h-rr);d.x=clamp(d.x-Math.cos(a)*rr,rr,this.s.w-rr);d.y=clamp(d.y-Math.sin(a)*rr,rr,this.s.h-rr);
  this.s.cells.push(d);if(c.team===0){this.s.divisions++;this.s.mutationPoints++;if(this.s.selection.includes(c.id))this.s.selection.push(d.id);this.emit('Two daughters. Both belong to your colony.');this.fx('division',c.x,c.y,TYPES[c.type].color,22)}
 }
 feeding(c,target){
  const fail=reason=>({ok:false,reason,mode:'none'}),rule=FEEDING[c.type];
  if(!target||target.consumed||target.hp===0)return fail('Target gone');
  if(target.type&&target.team===c.team)return fail('Same colony');
  if(target.capturedBy&&target.capturedBy!==c.id)return fail('Already captured');
  if(target.escapeGrace>0)return fail('Escaping');
  const diet=target.type?rule?.prey.includes(target.type):TYPES[c.type].diet.includes(target.kind);
  if(!diet)return fail(TYPES[c.type].domain==='bacterium'?'Absorbs dissolved nutrients':'Outside this organism’s diet');
  const ratio=target.r/c.r,limit=rule?.limit||1;
  if(ratio>limit)return fail('Too large to swallow');
  const duration=c.type==='amoeba'?(2.8+ratio*2.6)*(c.energy<25?1.25:1):c.type==='didinium'?1.7+ratio*.8:1.5;
  return {ok:true,mode:rule?.mode||'absorb',reason:'Edible',ratio,limit,duration};
 }
 edible(c,f){return this.feeding(c,f).ok}
 prey(c,d){return !!d.type&&this.feeding(c,d).ok}
 interaction(c,target){
  const meal=this.feeding(c,target);if(meal.ok)return {...meal,glyph:'◉',text:meal.mode==='absorb'?'Absorb nutrients':meal.mode==='graze'?'Small enough for the oral groove':meal.mode==='capture'?'Ciliate prey · contact capture':target.type==='paramecium'?'Edible · fast swimmers can escape':'Edible · surround and digest'};
  const rival=target?.type&&target.team!==c.team&&target.hp>0;
  if(rival&&TYPES[c.type].domain==='bacterium'&&TYPES[target.type].domain==='bacterium')return {ok:true,mode:'attack',glyph:'↣',text:c.type==='injector'?'Contact injection · resistance reduces damage':'Local toxin · resistance reduces damage'};
  return {...meal,glyph:'⊘',text:meal.reason};
 }
 canDefend(c){const captor=this.s.cells.find(d=>d.id===c.capturedBy);return c.type==='paramecium'&&c.hp>0&&!c.division&&!c.mating&&!c.capture&&(!captor||(captor.type==='amoeba'&&captor.capture?.progress<.8))}
 threat(c,d){return d.team!==c.team&&d.hp>0&&(this.prey(d,c)||(TYPES[c.type].domain==='bacterium'&&TYPES[d.type].domain==='bacterium'))}
 findTarget(c,id){if(!id)return null;const cached=this.byId?.get(id);if(cached)return !cached.consumed&&cached.hp!==0?cached:null;return this.s.food.find(f=>f.id===id&&!f.consumed)||this.s.cells.find(f=>f.id===id&&f.hp>0)}
 capture(c,target){const meal=this.feeding(c,target);if(!meal.ok||c.capture||target.capturedBy||c.gut.length>=6)return false;const isCell=!!target.type;c.capture={id:target.id,isCell,progress:0,angle:angle(c,target),distance:clamp(dist(c,target),c.r*.9+target.r,c.r+target.r+30),duration:meal.duration,struggle:0,kind:isCell?(TYPES[target.type].domain==='bacterium'?'bacterium':target.type):target.kind};target.capturedBy=c.id;if(isCell){target.defendAt=this.s.time+.55;target.stun=c.type==='amoeba'?0:meal.duration+.5}return true}
 release(c){if(!c.capture)return;const f=this.findTarget(c,c.capture.id);if(f){f.capturedBy=0;if(f.type)f.stun=.4}c.capture=null}
 escape(prey,predator){
  const away=angle(predator,prey);this.release(predator);prey.stun=0;prey.escapeGrace=2;prey.escapeTime=.6;prey.escapeAngle=away;prey.defended=1;prey.energy=Math.max(0,prey.energy-4);predator.cool=Math.max(predator.cool,2);predator.stun=.65;predator.order=null;predator.target=0;predator.path=[];predator.aiGoal=null;
  if(prey.team===0||predator.team===0)this.emit('Escaped before the membrane closed.');
 }
 ability(c,auto=false){
  if(c.cool>0||c.stun>0||c.division||c.mating||c.capture||c.competent||c.integrating||(c.capturedBy&&!this.canDefend(c))||c.hp<=0)return false;
  if(auto&&c.team!==0&&(c.rest>0||((c.type==='amoeba'||c.type==='didinium'||TYPES[c.type].domain==='bacterium')&&c.energy>=72)))return false;
  const t=TYPES[c.type],cost=t.cost+(c.type==='bacillus'?c.traits.toxin*2:0);if(c.energy<cost+4)return false;let success=false;
  if(c.type==='amoeba'){
   const candidates=this.s.food.filter(f=>!f.capturedBy&&this.edible(c,f)&&dist(c,f)<c.r+f.r+29).concat(this.s.cells.filter(d=>!d.capturedBy&&this.prey(c,d)&&dist(c,d)<c.r+d.r*.6+20)),preferred=c.order?.target||c.target;
   const q=candidates.find(f=>f.id===preferred)||candidates.sort((a,b)=>dist(c,a)-dist(c,b))[0];
   if(q)success=this.capture(c,q);
  }else if(c.type==='didinium'){
   const p={x:c.x+Math.cos(c.a)*c.r,y:c.y+Math.sin(c.a)*c.r};const q=this.s.cells.find(d=>this.prey(c,d)&&dist(p,d)<d.r+18&&Math.abs(delta(angle(c,d),c.a))<.95);
   if(q){success=this.capture(c,q);this.fx('puncture',q.x,q.y,t.color,12)}
  }else if(c.type==='paramecium'){
   const enemies=this.s.cells.filter(d=>d.team!==c.team&&(d.type==='amoeba'||d.type==='didinium')&&dist(c,d)<c.r+d.r+45);if(!auto||enemies.length){const captor=enemies.find(d=>d.id===c.capturedBy),danger=captor||enemies[0];
    // Amoeba avoidance is primarily ciliary swimming, not a trichocyst stun attack.
    if(captor?.type==='amoeba'&&captor.capture.progress<.8){captor.capture.struggle=clamp((captor.capture.struggle||0)+.28,0,1);c.escapeBoost=1.2;c.escapeEffort=1}
    else{c.burst=.7;if(danger){c.escapeTime=.6;c.escapeAngle=angle(danger,c)}}
    c.ciliaBurst=.8;c.defended=1;success=true;
   }
  }else if(c.type==='bacillus'){
   if(!auto||this.s.cells.some(d=>d.team!==c.team&&TYPES[d.type].domain==='bacterium'&&dist(c,d)<145)){this.s.clouds.push({x:c.x,y:c.y,age:0,life:7,variance:350,team:c.team,type:c.type,power:1+c.traits.toxin*.4});c.burst=.65;success=true;this.fx('chemical',c.x,c.y,t.color,4)}
  }else{
   const q=this.s.cells.filter(d=>d.team!==c.team&&TYPES[d.type].domain==='bacterium'&&!d.capturedBy&&dist(c,d)<c.r+d.r+9).sort((a,b)=>dist(c,a)-dist(c,b))[0];if(q){this.hit(q,23/(1+q.traits.immunity*.5),c);q.stun=.28;c.burst=.42;c.attackAngle=angle(c,q);c.attackLength=Math.max(c.r+6,dist(c,q)-q.r*.5);success=true}
  }
  if(success){if(c.team!==0&&(c.type==='bacillus'||c.type==='injector'))c.rest=4; c.energy-=cost;c.cool=t.cool/(1+c.traits.extrusome*.2);if(c.team===0)this.s.score++}return success;
 }
 hit(c,n,source){if(c.invuln>0||c.hp<=0||n<=0)return;const factor=(c.team===0&&this.s.gentle)?.45:1,before=c.hp;c.hp=Math.max(0,c.hp-n*factor/(1+c.traits.membrane*.15));c.damageHP=Math.max(c.damageHP||0,before);c.hurt=.6;c.hitAngle=source?angle(c,source):null;c.hitSize=clamp(n/18,.25,1);if(c.capture&&c.capture.progress<.8&&n>=12){this.release(c);c.cool=Math.max(c.cool,1.5)}if(c.hp<=0&&source?.team===0)this.s.kills++}
 route(c,goal){
  // A* on a spatial grid, with clearance and hazard costs. Replan only when intent changes.
  const size=95,cols=Math.ceil(this.s.w/size),rows=Math.ceil(this.s.h/size),index=(x,y)=>y*cols+x;
  const sx=clamp(Math.floor(c.x/size),0,cols-1),sy=clamp(Math.floor(c.y/size),0,rows-1),gx=clamp(Math.floor(goal.x/size),0,cols-1),gy=clamp(Math.floor(goal.y/size),0,rows-1),start=index(sx,sy),end=index(gx,gy);
  const direct=this.s.rocks.every(r=>segmentDistance(r,c,goal)>r.r+c.r*.8);
  if(direct&&!this.s.hazards.some(h=>segmentDistance(h,c,goal)<h.r*.8))return [{x:goal.x,y:goal.y}];
  const clearance=Math.ceil(c.r/10)*10;let map=this.navCache.get(clearance);
  if(!map){map=new Uint8Array(cols*rows);for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){const p={x:(x+.5)*size,y:(y+.5)*size};if(!this.clear(p,clearance+15))map[index(x,y)]=1}this.navCache.set(clearance,map)}
  const open=[{id:start,f:0}],g=new Map([[start,0]]),parent=new Map(),closed=new Set();let found=false,limit=0;
  while(open.length&&limit++<650){let best=0;for(let j=1;j<open.length;j++)if(open[j].f<open[best].f)best=j;const cur=open.splice(best,1)[0].id;if(closed.has(cur))continue;if(cur===end){found=true;break}closed.add(cur);const x=cur%cols,y=Math.floor(cur/cols);
   for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows)continue;const id=index(nx,ny);if((map[id]&&id!==end)||closed.has(id)||dx&&dy&&(map[index(nx,y)]||map[index(x,ny)]))continue;const p={x:(nx+.5)*size,y:(ny+.5)*size},risk=this.s.hazards.some(h=>dist(p,h)<h.r)?5:0,score=g.get(cur)+Math.hypot(dx,dy)+risk;if(score<(g.get(id)??Infinity)){g.set(id,score);parent.set(id,cur);open.push({id,f:score+Math.hypot(nx-gx,ny-gy)})}}
  }
  if(!found)return [];
  const path=[];let id=end;while(id!==start&&parent.has(id)){path.unshift({x:(id%cols+.5)*size,y:(Math.floor(id/cols)+.5)*size});id=parent.get(id)}path.push({x:goal.x,y:goal.y});return path;
 }
 brain(c,dt){
  c.think-=dt;
  // A selected cell never hands movement back to AI after releasing a key.
  if(c.team===0&&!c.order&&(this.s.selection.includes(c.id)||this.s.mode==='hold')){c.intent='hold';c.target=0;c.aiGoal=null;c.path=[];return {x:0,y:0}}
  let goal=null;
  if(c.order){
   const target=this.findTarget(c,c.order.target);
   if(c.order.target&&!target){c.order=null;c.target=0;c.path=[];return {x:0,y:0}}
   if(target&&!this.interaction(c,target).ok){if(c.team===0)this.emit(this.interaction(c,target).text);c.order=null;c.target=0;c.path=[];return {x:0,y:0}}
   goal=target||c.order;
   if(!target&&dist(c,goal)<12){c.order=null;c.target=0;c.path=[];c.intent='hold';return {x:0,y:0}}
   if(target&&dist(c,target)<c.r+target.r+18){c.a=angle(c,target);this.ability(c,true)}
  }
  const radius=240+c.traits.sensing*75;
  if(!c.order&&c.think<=0){
   c.think=1.1+this.rand(0,.6);const old=c.target;
   let danger=null,bestDanger=radius;
   for(const d of this.s.cells){if(!this.threat(c,d))continue;const dd=dist(c,d);if(dd<bestDanger){bestDanger=dd;danger=d}}
   if(danger&&(c.hp<40||this.prey(danger,c))){c.intent='flee';c.target=0;const a=angle(danger,c);c.aiGoal={x:clamp(c.x+Math.cos(a)*150,50,this.s.w-50),y:clamp(c.y+Math.sin(a)*150,50,this.s.h-50)}}
   else{
    let chosen=null,best=Infinity;
    if(c.energy<72&&!c.rest)for(const d of this.s.cells){const dd=dist(c,d),score=dd+(c.type==='amoeba'&&d.type==='paramecium'&&d.energy>25?160:0)+d.traits.motility*25;if(this.prey(c,d)&&dd<radius&&score<best){chosen=d;best=score}}
    // Chemical fighting is local competition, not perpetual pursuit.
    if(TYPES[c.type].domain==='bacterium'&&c.energy<72&&c.energy>25&&!c.rest&&danger&&bestDanger<100){chosen=danger;best=bestDanger}
    if(!chosen||TYPES[c.type].domain==='eukaryote')for(const f of this.s.food){if(f.capturedBy||f.consumed||!this.edible(c,f))continue;const dd=Math.abs(c.x-f.x)+Math.abs(c.y-f.y);if(dd>radius*1.6||dd>best)continue;const score=dist(c,f)+this.risk(f)*70;if(score<best){best=score;chosen=f}}
    if(chosen){c.target=chosen.id;c.aiGoal=null;c.intent=chosen.type?'hunt':'forage'}else{c.target=0;c.intent='explore';if(!c.aiGoal||dist(c,c.aiGoal)<30)c.aiGoal={x:clamp(c.x+this.rand(-210,210),80,this.s.w-80),y:clamp(c.y+this.rand(-210,210),80,this.s.h-80)}}
   }
   if(c.target!==old){c.path=[];c.routeAt=0}
  }
  goal=goal||this.findTarget(c,c.target)||c.aiGoal;if(!goal)return {x:0,y:0};
  // Cache paths, including failed searches; bound pathfinding work per tick.
  if(!c.path.length&&dist(c,goal)>70&&this.s.time>=(c.routeAt||0)&&this.routeBudget>0){this.routeBudget--;c.routeAt=this.s.time+2;c.path=this.route(c,goal)}
  let next=c.path[0]||goal;if(dist(c,next)<28){c.path.shift();next=c.path[0]||goal}
  const a=angle(c,next);let dx=Math.cos(a),dy=Math.sin(a);
  for(const r of this.s.rocks){const xx=c.x-r.x,yy=c.y-r.y,reach=r.r+c.r+25;if(Math.abs(xx)>reach||Math.abs(yy)>reach)continue;const d=Math.hypot(xx,yy);if(d<reach){dx+=xx/Math.max(d,1)*(reach-d)/35;dy+=yy/Math.max(d,1)*(reach-d)/35}}
  for(const h of this.s.hazards){const xx=c.x-h.x,yy=c.y-h.y;if(Math.abs(xx)>h.r+40||Math.abs(yy)>h.r+40)continue;const d=Math.hypot(xx,yy);if(d<h.r+40){dx+=xx/Math.max(d,1);dy+=yy/Math.max(d,1)}}
  if((!c.order||c.order.target)&&dist(c,goal)<c.r*.45)return {x:0,y:0};if(c.order&&!c.order.target){const slow=clamp(dist(c,goal)/35,.2,1);dx*=slow;dy*=slow}return {x:dx,y:dy};
 }
 risk(p){let n=0;for(const h of this.s.hazards)if(dist(p,h)<h.r+40)n+=2;for(const q of this.s.clouds)if(dist(p,q)<Math.sqrt(q.variance)*2)n++;return n}
 move(c,dx,dy,dt){
  if(c.escapeTime>0&&!c.capturedBy){dx=Math.cos(c.escapeAngle);dy=Math.sin(c.escapeAngle)}
  const n=Math.hypot(dx,dy);if(n>1){dx/=n;dy/=n}if(n>.03)c.a+=delta(Math.atan2(dy,dx),c.a)*(1-Math.exp(-10*dt));
  let speed=TYPES[c.type].speed*(1+c.traits.motility*.18)*(c.energy<10?.55:1)*(c.competent?.3:1)*(c.escapeTime>0?1.45:1);if(c.stun||c.division||c.mating||c.capture||c.capturedBy||c.integrating)speed=0;
  const flow=c.type==='amoeba'?{x:0,y:0}:this.flow(c),damp=1-Math.exp(-38*dt);
  c.vx+=(dx*speed+flow.x-c.vx)*damp;c.vy+=(dy*speed+flow.y-c.vy)*damp;c.x+=c.vx*dt;c.y+=c.vy*dt;
  c.x=clamp(c.x,c.r,this.s.w-c.r);c.y=clamp(c.y,c.r,this.s.h-c.r);
  for(const r of this.s.rocks){const d=dist(c,r),min=c.r*.83+r.r;if(d<min){const a=angle(r,c);c.x=r.x+Math.cos(a)*min;c.y=r.y+Math.sin(a)*min;c.contactAngle=a+Math.PI;c.contactDepth=min-d}}
 }
 physiology(c,dt){
  const b=this.biome(c),s=this.s,oxygen=b.oxygen*(this.s.hazards.some(h=>h.kind==='hypoxia'&&dist(c,h)<h.r)?.08:1);
  c.oxygen=clamp(c.oxygen+(oxygen-c.oxygen)*dt*.55-dt*.015*(1+c.traits.metabolism*.3),0,1);
  const demand=(.075+Math.hypot(c.vx,c.vy)*.00085)*(1+c.traits.motility*.12)+c.traits.membrane*.025+c.traits.immunity*.025;
  c.energy=clamp(c.energy-demand*dt,0,100);
  const regulator=c.traits.osmosis,saline=b.id==='brine';
  // Positive water imbalance is freshwater influx; negative is saline dehydration.
  const influx=saline?-.07/(1+regulator*.5):.032/(1+regulator*.25);
  c.water=clamp(c.water+dt*(influx-c.water*.015),-1,1);
  c.pump=(Math.sin(s.time*2.7+c.seed)+1)/2;
  if(!saline&&TYPES[c.type].domain==='eukaryote'&&c.energy>0&&c.pump<.08){c.water=Math.max(0,c.water-dt*.8);c.energy=Math.max(0,c.energy-dt*.06)}
  if(TYPES[c.type].domain==='bacterium'&&!saline)c.water=Math.max(0,c.water-dt*.035);
  if(Math.abs(c.water)>.72)this.hit(c,(Math.abs(c.water)-.7)*6*dt);
  if(c.energy<.1)this.hit(c,2*dt);
  if(c.hp<100&&c.energy>20){c.hp=Math.min(100,c.hp+dt*(.5+c.traits.membrane*.25));c.energy-=dt*.1}
  for(const h of s.hazards)if(dist(c,h)<h.r){const exposure=1-dist(c,h)/h.r;if(h.kind==='acid')this.hit(c,exposure*4*dt,h);if(h.kind==='shear'&&Math.sin(s.time*1.5+h.phase)>.45)this.hit(c,exposure*3*dt,h)}
  for(const cloud of s.clouds)if(cloud.team!==c.team&&TYPES[c.type].domain==='bacterium'){const d2=(c.x-cloud.x)**2+(c.y-cloud.y)**2,concentration=cloud.power*600/cloud.variance*Math.exp(-d2/(2*cloud.variance));if(concentration>.003)this.hit(c,concentration*9*dt/(1+c.traits.immunity*.75),cloud)}
  // Energy from digestion depends on oxygen; biomass is material, not ATP.
  for(const g of c.gut){const old=g.left,rate=(1+c.traits.digestion*.3)*dt;g.left=Math.max(0,g.left-rate);const fraction=(old-g.left)/g.total;
   c.energy=clamp(c.energy+g.energy*fraction*(.22+.78*c.oxygen)*(1+c.traits.metabolism*.16),0,100);
   if(!c.competent)c.mass=clamp(c.mass+g.mass*fraction,0,125);
   if(old>0&&g.left===0)c.fed=.7;
  }
  c.gut=c.gut.filter(g=>g.left>0);
  if(c.integrating){c.integrating.left-=dt;if(c.integrating.left<=0){const trait=c.integrating.trait;if(this.rand()<.8){c.traits[trait]=clamp(c.traits[trait]+1,0,3);if(c.team===0){s.transfers++;this.emit('Compatible DNA integrated. Daughters inherit this variant.')}}else if(c.team===0)this.emit('DNA degraded before integration. Try another fragment.');c.integrating=null}}
  if(c.competent&&!c.integrating)for(let i=s.dna.length-1;i>=0;i--){const d=s.dna[i];if(dist(c,d)<c.r+10){d.amount+=dt*(1+c.traits.competence*.4);if(d.amount>=1){if(d.type===c.type&&eligible(c.type,d.trait)){c.samples[d.trait]=(c.samples[d.trait]||0)+1;if(c.team===0)this.emit('Compatible DNA collected. Open variants to integrate.')}else{c.energy=clamp(c.energy+1,0,100);if(c.team===0)this.emit('Unrelated DNA degraded; no trait gained.')}s.dna.splice(i,1)}}}
 }
 digest(c,kind,prey=null){const large=kind==='paramecium',total=large?4:kind==='alga'?2.6:1.8;c.gut.push({kind,left:total,total,energy:large?75:kind==='alga'?24:10,mass:large?65:kind==='alga'?24:10,x:prey?clamp(prey.x-c.x,-c.r*.5,c.r*.5):this.rand(-c.r*.4,c.r*.4),y:prey?clamp(prey.y-c.y,-c.r*.5,c.r*.5):this.rand(-c.r*.4,c.r*.4),r:prey?clamp(prey.r*(prey.type?.6:1),3,30):large?15:kind==='alga'?7:4,angle:prey?(prey.a||prey.seed||0):0});if(c.team===0){this.s.meals++;this.s.mutationProgress++;if(this.s.mutationProgress>=7){this.s.mutationProgress=0;this.s.mutationPoints++;this.emit('Variant choice earned. Select a mutation for the next division.')}}}
 updateCapture(c,dt){
  if(!c.capture)return;const cap=c.capture,t=this.findTarget(c,cap.id);if(!t||t.hp<=0||c.hp<=0){this.release(c);return}
  if(!cap.duration)cap.duration=this.feeding(c,t).duration||3.5;
  if(c.type==='amoeba'&&t.type&&cap.progress<.8){
   const effort=t.escapeBoost>0?1:t.escapeEffort||0,grip=.45+c.hp*.0035+c.energy*.0025,power=((t.type==='paramecium'?1.15:.65)+t.traits.motility*.28+(t.r/c.r)*.4+(t.escapeBoost>0?.8:0))*(.15+.85*Math.min(1,t.energy/50))*(.35+t.hp*.0065);
   cap.struggle=clamp((cap.struggle||0)+dt*(effort?Math.max(.02,power-grip)*1.6:-.35),0,1);t.energy=Math.max(0,t.energy-dt*effort*.9);
   if(cap.struggle>=1){this.escape(t,c);return}
  }
  cap.progress+=dt/cap.duration;const progress=clamp(cap.progress,0,1);c.a+=delta(cap.angle,c.a)*dt*4;
  if(c.type==='amoeba'){
   const phase=engulfPhase(progress);if(!Number.isFinite(cap.distance))cap.distance=clamp(dist(c,t),c.r*.9+t.r,c.r+t.r+30);
   // Hold prey at the cup mouth until it closes; only then move the sealed vesicle inward.
   const targetR=cap.distance+(c.r*.32-cap.distance)*phase.pull,wriggle=t.type&&!phase.sealed?Math.sin(this.s.time*6+t.seed)*Math.min(4,t.r*.13)*(t.escapeEffort||0):0;t.x=c.x+Math.cos(cap.angle)*targetR-Math.sin(cap.angle)*wriggle;t.y=c.y+Math.sin(cap.angle)*targetR+Math.cos(cap.angle)*wriggle;
  }else{const targetR=c.r*(1.3-progress);t.x+=(c.x+Math.cos(cap.angle)*targetR-t.x)*Math.min(1,dt*7);t.y+=(c.y+Math.sin(cap.angle)*targetR-t.y)*Math.min(1,dt*7)}
  if(progress>=1){this.digest(c,cap.kind,t);if(c.team!==0)c.rest=15;t.consumed=true;if(cap.isCell){t.ingested=true;t.hp=0;if(c.team===0)this.s.kills++}else this.s.food=this.s.food.filter(f=>f.id!==t.id);c.capture=null}
 }
 membrane(c,dt){
  const target=TYPES[c.type].r*Math.sqrt(Math.max(20,c.mass)/72),moving=Math.hypot(c.vx,c.vy)/TYPES[c.type].speed;c.r+=(target-c.r)*dt*3;
  const N=c.mem.length,targets=[];let sum=0;
  for(let i=0;i<N;i++){const a=i/N*TAU,da=delta(a,c.a);let r=c.r;
   if(c.type==='amoeba')r*=1+.16*Math.sin(a*3+this.s.time*.32+c.seed)+.08*Math.sin(a*5-this.s.time*.45)+moving*.18*Math.cos(da);
   else if(c.type==='paramecium'||TYPES[c.type].domain==='bacterium')r*=1/Math.sqrt((Math.cos(da)/1.38)**2+(Math.sin(da)/.72)**2);
   else r*=1+.06*Math.cos(da*2);
   // Engulfing uses one open cup outline in the renderer; the body remains a small spring ring.
   if(c.division){const p=1-c.division/3.2;const elong=1+p*.55,waist=1-.68*Math.sin(p*Math.PI/2);r*=Math.sqrt((Math.cos(da)*elong)**2+(Math.sin(da)*waist)**2)}
   if(c.contactDepth){r-=Math.min(c.r*.25,c.contactDepth)*Math.exp(-((delta(a,c.contactAngle)/.5)**2))}targets.push(r);sum+=r*r;
  }
  const areaScale=c.capture?1:clamp(Math.sqrt(N*c.r*c.r/sum),.8,1.2);
  for(let i=0;i<N;i++){const m=c.mem[i],neighbor=(c.mem[(i+N-1)%N].r+c.mem[(i+1)%N].r)*.5;m.v+=((targets[i]*areaScale-m.r)*85+(neighbor-m.r)*16-m.v*18)*dt;m.r=clamp(m.r+m.v*dt,c.r*.35,c.r*2.1)}c.contactDepth=0;
  for(const o of c.org){const n=Math.sin(this.s.time*.5+o.x),flow=Math.sin(this.s.time*.35+c.seed+o.y*.1);o.vx+=(flow*3-o.vx)*dt*4;o.vy+=(n*5-o.vy)*dt*4;o.x+=o.vx*dt-c.vx*dt*.035;o.y+=o.vy*dt-c.vy*dt*.035;const a=Math.atan2(o.y,o.x),idx=Math.floor((a+TAU)%TAU/TAU*N),limit=c.mem[idx].r-o.r-5,d=Math.hypot(o.x,o.y);if(d>limit){o.x=Math.cos(a)*limit;o.y=Math.sin(a)*limit;o.vx*=.2;o.vy*=.2}}

 }
 step(dt,input={x:0,y:0}){
  if(this.s.dead)return;dt=clamp(dt,0,1/30);const s=this.s;s.time+=dt;this.tickCount++;this.ecologyClock=(this.ecologyClock||0)+dt;const ecology=this.ecologyClock>=2;if(ecology)this.ecologyClock=0;this.routeBudget=2;this.byId=new Map();for(const f of s.food)this.byId.set(f.id,f);for(const c of s.cells)this.byId.set(c.id,c);
  const before=[...s.cells],colony=this.colony;const frameDt=dt;
  for(const c of before){if(c.hp<=0)continue;const view=this.view,visible=view?Math.abs(c.x-view.x)<view.w/2+150&&Math.abs(c.y-view.y)<view.h/2+150:false;const active=c.team===0||visible||colony.some(p=>Math.abs(c.x-p.x)<650&&Math.abs(c.y-p.y)<650);c.simWait=(c.simWait||0)+frameDt;if(!active&&c.simWait<.2)continue;dt=c.simWait;c.simWait=0;c.age+=dt;c.rest=Math.max(0,(c.rest||0)-dt);for(const k of ['cool','stun','invuln','burst','hurt','fed','escapeGrace','escapeTime','defended','escapeBoost','ciliaBurst'])c[k]=Math.max(0,(c[k]||0)-dt);if(!c.hurt)c.damageHP=c.hp;
   if(c.capturedBy){const captor=this.s.cells.find(d=>d.id===c.capturedBy),manual=c.team===0&&s.selection.includes(c.id);c.escapeEffort=manual&&captor?Math.max(0,input.x*Math.cos(angle(captor,c))+input.y*Math.sin(angle(captor,c))):1;if((!manual||s.autoAbility)&&s.time>=(c.defendAt||0)&&this.canDefend(c))this.ability(c,true);if(active)this.membrane(c,Math.min(dt,1/30));continue}
   this.physiology(c,dt);this.updateCapture(c,dt);
   if(c.division){c.division=Math.max(0,c.division-dt);if(!c.division)this.finishDivision(c)}
   if(c.mating){c.mating=Math.max(0,c.mating-dt);const partner=s.cells.find(d=>d.id===c.mate&&d.hp>0);if(!partner){c.mating=0;c.mate=0}else if(c.mating===0){for(const k of Object.keys(TRAITS))if(eligible(c.type,k))c.traits[k]=Math.max(c.traits[k],partner.traits[k]);c.mate=0;if(c.team===0)s.transfers++}}
   let dir={x:0,y:0};const manual=c.team===0&&s.selection.includes(c.id)&&(input.x||input.y);
   if(manual){dir=input;c.order=null;c.target=0;c.aiGoal=null;c.path=[];c.intent='manual'}else dir=this.brain(c,dt);
   this.move(c,dir.x,dir.y,dt);
   if(c.team!==0||s.autoAbility)this.ability(c,true);
   if(!c.division&&!c.mating&&!c.capture&&!c.capturedBy&&c.gut.length<6){
    if(TYPES[c.type].domain==='bacterium'){
     for(let i=s.food.length-1;i>=0;i--){const f=s.food[i];if(f.kind==='nutrient'&&!f.capturedBy&&dist(c,f)<c.r+5){c.energy=clamp(c.energy+7*(.25+.75*c.oxygen)*(1+c.traits.uptake*.2),0,100);if(!c.competent)c.mass=clamp(c.mass+6*(1+c.traits.uptake*.2),0,125);c.fed=.7;f.consumed=true;s.food.splice(i,1);this.fx('absorb',f.x,f.y,TYPES[c.type].color,3);if(c.team===0){s.meals++;if(s.meals%10===0)s.mutationPoints++}}}
    }else if(c.type==='paramecium'){
     const mouth={x:c.x+Math.cos(c.a+.7)*c.r*.5,y:c.y+Math.sin(c.a+.7)*c.r*.5};for(const f of s.food){if(f.kind!=='bacterium'||f.capturedBy)continue;const d=dist(f,mouth);if(d<c.r+24){f.x+=(mouth.x-f.x)*dt*2.5;f.y+=(mouth.y-f.y)*dt*2.5;if(d<8){this.capture(c,f);break}}}
     if(!c.capture){const prey=s.cells.find(d=>!d.capturedBy&&this.prey(c,d)&&dist(d,c)<c.r+d.r+14&&Math.abs(delta(angle(c,d),c.a+.7))<1.2);if(prey)this.capture(c,prey)}
    }
   }
   if(c.team!==0&&this.divisionReady(c)&&c.age>50&&s.cells.length<64)this.divide([c.id]);
   if(active){c.visualWait=(c.visualWait||0)+dt;if(c.visualWait>=1/15){this.membrane(c,Math.min(c.visualWait,1/15));c.visualWait=0}}else c.r+=(TYPES[c.type].r*Math.sqrt(Math.max(20,c.mass)/72)-c.r)*Math.min(1,dt*3);
  }
  dt=frameDt;
  // Overdamped contact constraints: no billiard-ball bounce at cell scale.
  for(let i=0;i<s.cells.length;i++)for(let j=i+1;j<s.cells.length;j++){const a=s.cells[i],b=s.cells[j];if(a.hp<=0||b.hp<=0||a.capturedBy||b.capturedBy||a.capture?.id===b.id||b.capture?.id===a.id)continue;const broad=(a.r+b.r)*1.5;if(Math.abs(a.x-b.x)>broad||Math.abs(a.y-b.y)>broad)continue;const d=dist(a,b),ang=d>.001?angle(a,b):a.seed,ia=Math.floor((ang+TAU)%TAU/TAU*40),ib=(ia+20)%40,min=(a.mem[ia].r+b.mem[ib].r)*.95;if(d<min){const push=(min-d)*.5;a.x-=Math.cos(ang)*push;a.y-=Math.sin(ang)*push;b.x+=Math.cos(ang)*push;b.y+=Math.sin(ang)*push;a.contactAngle=ang;b.contactAngle=ang+Math.PI;a.contactDepth=b.contactDepth=min-d}}
  for(const f of s.food){if(f.capturedBy)continue;if(this.tickCount%3!==f.id%3)continue;const particleDt=dt*3;const flow=this.flow(f),D=f.kind==='nutrient'?12:f.kind==='bacterium'?4:1,noise=Math.sqrt(2*D*particleDt)*1.732;
   f.x=clamp(f.x+flow.x*particleDt+this.rand(-noise,noise),8,s.w-8);f.y=clamp(f.y+flow.y*particleDt+this.rand(-noise,noise),8,s.h-8);
   if(f.kind==='detritus'){f.life-=particleDt;f.r=Math.max(2,f.r-particleDt*.15);if(ecology)this.addFood(f.x+this.rand(-20,20),f.y+this.rand(-20,20),'nutrient')}
  }s.food=s.food.filter(f=>f.life>0);
  for(const d of s.dna){d.life-=dt;const f=this.flow(d);d.x=clamp(d.x+f.x*dt+this.rand(-1,1)*Math.sqrt(dt)*2,5,s.w-5);d.y=clamp(d.y+f.y*dt+this.rand(-1,1)*Math.sqrt(dt)*2,5,s.h-5)}s.dna=s.dna.filter(d=>d.life>0);
  for(const q of s.clouds){const f=this.flow(q);q.x+=f.x*dt;q.y+=f.y*dt;q.age+=dt;q.life-=dt;q.variance+=180*dt;q.power*=Math.exp(-.1*dt)}s.clouds=s.clouds.filter(c=>c.life>0).slice(-80);
  for(const e of s.effects){e.life-=dt;e.x+=e.vx*dt;e.y+=e.vy*dt;e.vx*=Math.exp(-7*dt);e.vy*=Math.exp(-7*dt)}s.effects=s.effects.filter(e=>e.life>0);
  for(const c of s.cells)if(c.hp<=0){this.release(c);if(!c.ingested){this.fx('lysis',c.x,c.y,TYPES[c.type].color,20);for(let j=0;j<5;j++)this.addFood(c.x+this.rand(-25,25),c.y+this.rand(-25,25),TYPES[c.type].domain==='bacterium'?'nutrient':'detritus');if(TYPES[c.type].domain==='bacterium')this.addDNA(c.x,c.y,c.type)}if(c.team===0)this.emit('A colony cell was lost.')}
  s.cells=s.cells.filter(c=>c.hp>0);
  if(ecology){this.addFood();if(s.cells.length<34&&this.rand()<.12){const b=this.pick(BIOMES),type=TYPES[s.type].domain==='bacterium'?this.pick(['bacillus','injector','bacillus','amoeba']):this.pick(['amoeba','paramecium','didinium','bacillus','injector']);const c=this.cell(type,b.x+this.rand(-700,700),b.y+this.rand(-500,500),1+Math.floor(this.rand(0,3)));if(this.colony.every(p=>dist(p,c)>650)&&this.clear(c,c.r))s.cells.push(c)}}
  const alive=this.colony;if(!alive.length){s.dead=true;s.selection=[];this.emit('The colony has ended. Your last save is available.')}else{
   if(!alive.some(c=>c.id===s.focus))s.focus=alive[0].id;s.selection=s.selection.filter(id=>alive.some(c=>c.id===id));if(!s.selection.length)s.selection=[s.focus];
   const b=this.biome(this.focus);if(!s.discovered.includes(b.id)){s.discovered.push(b.id);s.mutationPoints+=2;this.emit(b.name+' discovered · two variant choices earned.')}
  }
 }
 snapshot(){const s=JSON.parse(JSON.stringify(this.s));s.effects=[];for(const c of s.cells){c.path=[];c.think=0}return s}
 static fromSave(data){
  const s=JSON.parse(JSON.stringify(data));
  const num=(n,a,b)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  if(!s||s.format!=='microcosm-colony'||s.version!==2||!TYPES[s.type]||s.w!==6000||s.h!==4200||!num(s.time,0,1e10)||!num(s.seed,-2147483648,2147483647)||!num(s.nextId,0,1e12))throw Error('Not a compatible Microcosm colony save.');
  const limits={cells:150,food:1200,dna:100,clouds:80,rocks:150,hazards:40,selection:24,discovered:4};for(const [k,n] of Object.entries(limits))if(!Array.isArray(s[k])||s[k].length>n)throw Error('Invalid '+k);
  const point=(p)=>p&&num(p.x,-300,6300)&&num(p.y,-300,4500),ids=new Set();
  for(const c of s.cells){if(!point(c)||!TYPES[c.type]||!num(c.id,1,s.nextId)||ids.has(c.id)||!num(c.hp,0,100)||!num(c.energy,0,100)||!num(c.mass,0,125)||!num(c.r,10,90)||!num(c.team,0,3)||!num(c.a,-1e12,1e12)||!num(c.vx,-2000,2000)||!num(c.vy,-2000,2000))throw Error('Invalid cell');ids.add(c.id);
   for(const k of ['cool','stun','invuln','age','gen','oxygen','division','mating','burst','seed'])if(!num(c[k],0,1e10))throw Error('Invalid cell process');
   if(!num(c.water,-1,1))throw Error('Invalid water balance');
   if(!c.traits||Object.keys(TRAITS).some(k=>!Number.isInteger(c.traits[k])||c.traits[k]<0||c.traits[k]>3)||c.pending&&!eligible(c.type,c.pending))throw Error('Invalid variants');
   if(!Array.isArray(c.gut)||c.gut.length>8||c.gut.some(g=>!['alga','bacterium','paramecium'].includes(g.kind)||!num(g.left,0,5)||!num(g.total,.1,5)||!num(g.energy,0,100)||!num(g.mass,0,100)||!num(g.x,-100,100)||!num(g.y,-100,100)))throw Error('Invalid digestion');
   if(!Array.isArray(c.mem)||c.mem.length!==40||c.mem.some(m=>!num(m.r,1,200)||!num(m.v,-3000,3000)))throw Error('Invalid membrane');
   if(!Array.isArray(c.org)||c.org.length>20||c.org.some(o=>!['nucleus','micronucleus','mitochondrion','lysosome','vacuole','er'].includes(o.kind)||!num(o.x,-200,200)||!num(o.y,-200,200)||!num(o.r,1,20)||!num(o.vx,-1000,1000)||!num(o.vy,-1000,1000)))throw Error('Invalid organelles');
   if(!c.samples||Object.entries(c.samples).some(([k,v])=>!eligible(c.type,k)||!Number.isInteger(v)||v<0||v>10000))throw Error('Invalid DNA samples');
   if(c.integrating&&(!eligible(c.type,c.integrating.trait)||!num(c.integrating.left,0,4)))throw Error('Invalid DNA integration');
   if(c.order&&(!point(c.order)||!num(c.order.target,0,s.nextId)))throw Error('Invalid order');
   if(c.capture&&c.capture.distance!==undefined&&!num(c.capture.distance,0,300))throw Error('Invalid capture reach');
   if(c.capture&&((c.capture.duration!==undefined&&!num(c.capture.duration,1,10))||(c.capture.struggle!==undefined&&!num(c.capture.struggle,0,1))))throw Error('Invalid capture process');
   for(const k of ['escapeGrace','escapeTime','defended','escapeEffort','escapeBoost','ciliaBurst']){if(c[k]===undefined)c[k]=0;if(!num(c[k],0,5))throw Error('Invalid escape process')}
   if(c.escapeAngle===undefined)c.escapeAngle=0;if(!num(c.escapeAngle,-1e12,1e12))throw Error('Invalid escape direction');
   if(c.gut.some(g=>(g.r!==undefined&&!num(g.r,1,30))||(g.angle!==undefined&&!num(g.angle,-1e10,1e10))))throw Error('Invalid food vacuole');
   c.hurt=0;c.fed=0;c.damageHP=c.hp;c.hitAngle=null;
   if(c.capture&&(!num(c.capture.id,1,s.nextId)||!num(c.capture.progress,0,1.1)||!num(c.capture.angle,-1e10,1e10)||!['alga','bacterium','paramecium'].includes(c.capture.kind)))throw Error('Invalid capture');
   if(!num(c.capturedBy,0,s.nextId)||!num(c.mate,0,s.nextId)||typeof c.competent!=='boolean')throw Error('Invalid cell state');
   c.path=[];c.think=0;c.target=0;c.aiGoal=null;
  }
  for(const f of s.food)if(!point(f)||!num(f.id,1,s.nextId)||!['nutrient','alga','bacterium','detritus'].includes(f.kind)||!num(f.r,1,15)||!num(f.seed,0,TAU)||!num(f.life,0,400)||!num(f.capturedBy,0,s.nextId))throw Error('Invalid food');
  for(const d of s.dna)if(!point(d)||!TYPES[d.type]||!eligible(d.type,d.trait)||!num(d.life,0,150)||!num(d.amount,0,10)||!num(d.id,1,s.nextId))throw Error('Invalid DNA');
  for(const q of s.clouds)if(!point(q)||!num(q.life,0,10)||!num(q.age,0,10)||!num(q.variance,1,10000)||!num(q.power,0,5)||!num(q.team,0,3))throw Error('Invalid chemical field');
  for(const r of s.rocks)if(!point(r)||!num(r.r,1,100)||!num(r.seed,0,1))throw Error('Invalid rock');
  for(const h of s.hazards)if(!point(h)||!num(h.r,1,200)||!num(h.phase,0,TAU)||!['acid','hypoxia','shear'].includes(h.kind))throw Error('Invalid habitat');
  for(const k of ['score','meals','kills','divisions','transfers','mutationPoints','mutationProgress'])if(!num(s[k],0,1e10))throw Error('Invalid progression');
  if(!s.discovered.every(id=>BIOMES.some(b=>b.id===id))||!['hold','forage'].includes(s.mode)||!num(s.speed,.5,2)||typeof s.autoAbility!=='boolean'||typeof s.gentle!=='boolean'||typeof s.dead!=='boolean'||!s.selection.every(id=>Number.isInteger(id)))throw Error('Invalid game settings');
  s.effects=[];const game=Object.create(Game.prototype);game.s=s;game.events=[];game.navCache=new Map();game.tickCount=0;game.ecologyClock=0;game.routeBudget=2;game.byId=null;
  if(!game.colony.length&&!s.dead)throw Error('Save has no living colony');if(game.colony.length>24)throw Error('Colony is too large');if(game.colony.length&&!game.colony.some(c=>c.id===s.focus))s.focus=game.colony[0].id;
  if(s.paceRevision!==1){s.paceRevision=1;s.speed=1;s.autoAbility=false;s.mode='hold';for(const c of s.cells){c.rest=c.team===0?0:18;if(c.team===0){c.order=null;c.target=0;c.path=[]}}}
  s.selection=s.selection.filter(id=>game.colony.some(c=>c.id===id));if(!s.selection.length&&game.colony.length)s.selection=[s.focus];return game;
 }
 static migrate(old){
  if(!old||old.format!=='microcosm-save'||old.version!==1||!TYPES[old.species]||!old.player||!Number.isFinite(old.player.mass))throw Error('Invalid old save');
  const g=new Game(old.species,'garden',old.rng,!!old.gentle),c=g.focus;
  for(const k of ['hp','energy','mass'])c[k]=clamp(Number(old.player[k])||0,0,100);c.gen=Math.max(1,Math.floor(old.generation)||1);
  if(c.hp<=0)c.hp=100;
  for(const k of ['meals','kills','divisions','transformations'])if(Number.isFinite(old[k]))g.s[k==='transformations'?'transfers':k]=Math.max(0,old[k]);
  for(const k of old.genes||[])if(eligible(c.type,k))c.traits[k]=1;
  for(const sibling of (old.cells||[]).filter(x=>x.faction==='kin').slice(0,23)){const d=g.cell(c.type,c.x+g.rand(-150,150),c.y+g.rand(-150,150),0);d.gen=c.gen;d.traits={...c.traits};g.s.cells.push(d)}
  g.emit('Old lineage carried into the larger world. Your original v1 save is preserved.');return g;
 }
}
function segmentDistance(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,t=clamp(((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy||1),0,1);return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy)}
const api={Game,TYPES,TRAITS,BIOMES,FEEDING,TAU,clamp,dist,delta,eligible,segmentDistance,engulfPhase,smooth};if(typeof module!=='undefined')module.exports=api;root.MC=api;
})(typeof window!=='undefined'?window:globalThis);
