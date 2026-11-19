import {HABITATS,TRAITS,ANIMALS,geneLevel,clamp,rng} from './data.js';

const TAU=Math.PI*2, NIMBLE_CAP=48, ENTITY_CAP=150;
const WEATHER=new Set(['clear','rain','storm','snow','heat','fog']);
const severe=type=>['storm','snow','heat'].includes(type);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const alive=e=>e.hp>0;
const nimbles=s=>s.entities.filter(e=>e.type==='nimble'&&alive(e));
const predator=e=>ANIMALS[e.type]?.role==='predator';
const prey=e=>ANIMALS[e.type]?.role==='prey';
const blankGenes=()=>Object.fromEntries(TRAITS.map(t=>[t.key,[0,0]]));
const maxHP=e=>e.type==='nimble'?100+geneLevel(e,'armor')*13:ANIMALS[e.type]?.hp||100;
const maxEnergy=e=>100+geneLevel(e,'fat')*20;
function event(s,text){s.events.unshift({text,time:s.time});s.events.length=Math.min(s.events.length,8);}
function effect(s,e,text,color='#fff2bd'){s.effects.push({x:e.x,y:e.y-23,text,color,life:1.6});if(s.effects.length>80)s.effects.splice(0,s.effects.length-80);}
function makeEntity(s,type,x,y,random=Math.random){const e={id:s.nextId++,type,x,y,vx:0,vy:0,angle:random()*TAU,hp:100,energy:90,age:30+random()*30,sex:random()<.5?'F':'M',genes:blankGenes(),action:'roaming',attack:0,flash:0,cooldown:0,defendCooldown:0,dashCooldown:0,hitCooldown:0,aiTimer:random()*3,auto:true,generation:1,spawnX:x,spawnY:y,phaseTime:0,respawnIn:0};e.hp=maxHP(e);return e;}
function randomGenes(random){return Object.fromEntries(TRAITS.map(t=>[t.key,[random()<.56?1:0,random()<.48?1:0]]));}
function insidePond(s,e,expansion=1){return s.world.ponds.find(p=>((e.x-p.x)/(p.rx*expansion))**2+((e.y-p.y)/(p.ry*expansion))**2<1);}
function sheltered(s,e){return s.world.shelters.some(p=>distance(p,e)<p.r*.85);}
function pickNearest(e,items,test=()=>true){let found=null,d=Infinity;for(const p of items){if(!test(p))continue;const dd=(p.x-e.x)**2+(p.y-e.y)**2;if(dd<d){d=dd;found=p;}}return found;}
function randomPoint(s,random=Math.random,margin=100){return{x:margin+random()*(s.world.w-margin*2),y:margin+random()*(s.world.h-margin*2)};}
function preyPoint(s,type,random=Math.random){if(type==='fish'||type==='frog'){const p=s.world.ponds[Math.floor(random()*s.world.ponds.length)];const a=random()*TAU,r=Math.sqrt(random())*(type==='fish'?.8:1.15);return{x:p.x+Math.cos(a)*p.rx*r,y:p.y+Math.sin(a)*p.ry*r};}return randomPoint(s,random);}
function placePredator(s,e,random=Math.random){let p;if(e.type==='croc'){const water=s.world.ponds[Math.floor(random()*s.world.ponds.length)],a=random()*TAU;p={x:water.x+Math.cos(a)*water.rx*.85,y:water.y+Math.sin(a)*water.ry*.85};}else{const a=random()*TAU,r=620+random()*550;p={x:clamp(s.world.w/2+Math.cos(a)*r,100,s.world.w-100),y:clamp(s.world.h/2+Math.sin(a)*r,100,s.world.h-100)};}e.x=e.spawnX=p.x;e.y=e.spawnY=p.y;e.vx=e.vy=0;e.hp=maxHP(e);e.action=e.type==='snake'?'waiting':'roaming';e.phaseTime=0;e.target=null;e.respawnIn=0;}

export function createState(level=0,previous=null){
 level=clamp(Math.floor(Number(level)||0),0,HABITATS.length-1);const habitat=HABITATS[level];const seed=Math.floor(Math.random()*0x7fffffff),random=rng(seed);
 const s={version:1,time:0,level,unlocked:Math.max(level,previous?.unlocked||0),habitat,weather:{type:'clear',intensity:0,remaining:30,age:0,cycle:0},world:{w:3200,h:2200,seed,ponds:[],shelters:[],bushes:[],trees:[],rocks:[]},entities:[],effects:[],beacon:null,stats:{births:0,kills:0,forage:0,defends:0,elapsed:0,weatherTime:0,deaths:0,generation:previous?.stats?.generation||1},events:[],nextId:1,completed:false,autoBreed:false,mode:'sexual',mutation:true};
 const w=s.world;
 // The colony starts beside food and a refuge, with several larger resource patches farther out.
 w.ponds=[{x:1070,y:790,rx:205,ry:136},{x:2270,y:1390,rx:290,ry:175},{x:660,y:1660,rx:150,ry:100},{x:2570,y:490,rx:160,ry:115}];
 if([1,5,8].includes(level)){w.ponds[0].rx+=95;w.ponds[0].ry+=60;w.ponds.push({x:1660,y:1770,rx:220,ry:115});}
 w.shelters=[{x:1535,y:1170,r:84},{x:730,y:760,r:78},{x:2450,y:1630,r:86},{x:2040,y:510,r:76},{x:1080,y:1820,r:82}];
 for(let i=0;i<86;i++){let p;if(i<26){const a=random()*TAU,r=90+random()*450;p={x:1600+Math.cos(a)*r,y:1100+Math.sin(a)*r};}else p=randomPoint(s,random);if(!insidePond(s,p))w.bushes.push({...p,food:5+random()*4});}
 for(let i=0;i<habitat.trees;i++){const p=randomPoint(s,random,60);if(!insidePond(s,p)&&distance(p,{x:1600,y:1100})>150)w.trees.push({...p,r:25+random()*23});}
 for(let i=0;i<38;i++){const p=randomPoint(s,random,70);if(!insidePond(s,p))w.rocks.push({...p,r:15+random()*22});}
 const survivors=previous?nimbles(previous).slice(0,16):[];
 for(let i=0;i<Math.max(10,survivors.length);i++){const a=i*2.399,r=45+random()*85,e=makeEntity(s,'nimble',1600+Math.cos(a)*r,1100+Math.sin(a)*r,random);e.genes=survivors[i]?Object.fromEntries(TRAITS.map(t=>[t.key,[...survivors[i].genes[t.key]]])):randomGenes(random);e.sex=i%2?'M':'F';e.age=30+random()*20;e.generation=survivors[i]?.generation||s.stats.generation;e.hp=maxHP(e);e.energy=maxEnergy(e)*.84;s.entities.push(e);}
 // Every habitat contains its own prey mix; small groups make feeding grounds legible.
 for(let i=0;i<35;i++){const type=habitat.prey[i%habitat.prey.length];let p=preyPoint(s,type,random);if(i<20&&type!=='fish'&&type!=='frog'){const a=random()*TAU,r=180+random()*350;p={x:1600+Math.cos(a)*r,y:1100+Math.sin(a)*r};}s.entities.push(makeEntity(s,type,p.x,p.y,random));}
 for(let i=0;i<habitat.count;i++){const type=habitat.predators[i%habitat.predators.length],e=makeEntity(s,type,0,0,random);placePredator(s,e,random);s.entities.push(e);}
 if(level!==0)setWeather(s,habitat.weather[0]);event(s,`${habitat.name}: find food, raise offspring, and keep the colony safe.`);return s;
}

export function createChild(s,mode,parentA,parentB=null){
 if(!s||!parentA||parentA.type!=='nimble'||parentA.hp<=0||parentA.age<18||parentA.energy<35||parentA.cooldown>0||nimbles(s).length>=NIMBLE_CAP)return null;
 mode=mode==='asexual'?'asexual':'sexual';if(mode==='sexual'&&(!parentB||parentB.id===parentA.id||parentB.type!=='nimble'||parentB.sex===parentA.sex||parentB.hp<=0||parentB.age<18||parentB.energy<35||parentB.cooldown>0))return null;
 
 const child=makeEntity(s,'nimble',parentA.x+Math.random()*30-15,parentA.y+Math.random()*30-15);child.age=0;child.generation=Math.max(parentA.generation||1,parentB?.generation||1)+1;child.birthMode=mode;if(mode==='asexual')child.sex=parentA.sex;child.cooldown=24;child.mutations=[];
 for(const t of TRAITS){const a=parentA.genes[t.key],b=parentB?.genes[t.key]||a;const pair=mode==='asexual'?[...a]:[a[Math.random()<.5?0:1],b[Math.random()<.5?0:1]];if(s.mutation&&Math.random()<.025){const i=Math.random()<.5?0:1;pair[i]=1-pair[i];child.mutations.push(t.name);}child.genes[t.key]=pair;}
 child.hp=maxHP(child);child.energy=maxEnergy(child)*.78;return child;
}
export function addChild(s,child,parentA,parentB=null,mode='sexual'){
 if(!child||!parentA||parentA.hp<=0||s.entities.some(e=>e.id===child.id)||nimbles(s).length>=NIMBLE_CAP||s.entities.length>=ENTITY_CAP)return false;
 if(mode==='sexual'&&(!parentB||parentB.hp<=0))return false;
 child.x=clamp(parentA.x+Math.random()*48-24,30,s.world.w-30);child.y=clamp(parentA.y+Math.random()*48-24,30,s.world.h-30);s.entities.push(child);
 for(const p of mode==='sexual'?[parentA,parentB]:[parentA]){p.energy=Math.max(12,p.energy-(mode==='sexual'?20:30));p.cooldown=24;p.action='nurturing';effect(s,p,'♥','#ffd1d4');}
 s.stats.births++;s.stats.generation=Math.max(s.stats.generation,child.generation||1);effect(s,child,'New Nimble!','#ffe4ad');event(s,`${mode==='sexual'?'Two parents welcomed':'One parent budded'} a generation ${child.generation} offspring${child.mutations?.length?` · mutation: ${child.mutations.join(', ')}`:''}.`);return true;
}
export function defend(s,e){
 if(!e||e.type!=='nimble'||e.hp<=0||e.defendCooldown>0)return false;
 const horns=geneLevel(e,'horns'),claws=geneLevel(e,'claws');e.defendCooldown=4.6-horns*.45;e.attack=.5;e.energy=Math.max(0,e.energy-2);let hits=0;
 for(const p of s.entities){if(!predator(p)||p.hp<=0||distance(e,p)>76+horns*18)continue;const d=Math.max(1,distance(e,p));p.vx+=(p.x-e.x)/d*(150+horns*100);p.vy+=(p.y-e.y)/d*(150+horns*100);p.hp-=8+horns*12+claws*6;p.flash=.35;p.fleeUntil=s.time+3.5+horns;p.target=null;p.action='repelled';p.phaseTime=0;hits++;if(p.hp<=0){p.hp=0;p.respawnIn=16+Math.random()*10;effect(s,p,'Driven off','#ffdbaf');}}
 if(hits){s.stats.defends+=hits;effect(s,e,horns?'Horn charge!':'Defensive strike','#ffe6b0');if(s.time-(s.lastRepelEvent||-99)>4){event(s,`${hits} predator${hits>1?'s':''} repelled. Horns and claws help protect the colony.`);s.lastRepelEvent=s.time;}}else effect(s,e,'Defend','#fce4b8');return true;
}
export function dash(s,e){if(!e||e.type!=='nimble'||e.hp<=0||e.dashCooldown>0||e.energy<8)return false;e.dashCooldown=5.5;e.dashTime=.9;e.energy-=7;const a=e.target?Math.atan2(e.target.y-e.y,e.target.x-e.x):e.angle;e.vx+=Math.cos(a)*140;e.vy+=Math.sin(a)*140;e.action='dashing';effect(s,e,'Dash','#d5f4e1');return true;}
export function setWeather(s,type){if(!WEATHER.has(type))return false;s.weather={type,intensity:{clear:0,rain:.65,storm:1,snow:.85,heat:.9,fog:.7}[type],remaining:type==='clear'?35:45,age:0,cycle:s.weather?.cycle||0};event(s,{clear:'The sky clears. Feeding grounds recover.',rain:'Rain arrives. Ponds and wet ground slow unwebbed feet.',storm:'Storm warning: shelter reduces exposure and hawk attacks.',snow:'Snow is falling. Thick fur and shelter conserve energy.',heat:'Heat wave: shade and large ears help release heat.',fog:'Fog rolls in. Nearby predators become harder to detect.'}[type]);return true;}

// Small entity counts allow direct nearest-neighbor queries without allocations per pair.
function move(s,e,dx,dy,speed,dt,acceleration=5){const len=Math.hypot(dx,dy);let tx=0,ty=0;if(len>1){tx=dx/len*speed;ty=dy/len*speed;}const blend=1-Math.exp(-acceleration*dt);e.vx+=(tx-e.vx)*blend;e.vy+=(ty-e.vy)*blend;e.x=clamp(e.x+e.vx*dt,28,s.world.w-28);e.y=clamp(e.y+e.vy*dt,28,s.world.h-28);if(Math.hypot(e.vx,e.vy)>3){const desired=Math.atan2(e.vy,e.vx),diff=Math.atan2(Math.sin(desired-e.angle),Math.cos(desired-e.angle));e.angle+=diff*Math.min(1,dt*(5+geneLevel(e,'tail')*2));}}
function damage(s,attacker,target,amount){if(!target||target.hp<=0||target.hitCooldown>0)return;const armor=target.type==='nimble'?geneLevel(target,'armor'):0;const evasion=target.type==='nimble'?geneLevel(target,'tail')*.07:0;if(Math.random()<evasion){target.hitCooldown=.45;effect(s,target,'Dodge','#d7f4d7');return;}target.hp=Math.max(0,target.hp-amount*(1-armor*.19));target.flash=.4;target.hitCooldown=1.1;attacker.attack=.38;effect(s,target,`−${Math.round(amount*(1-armor*.19))}`,'#ffd0b7');if(target.hp<=0){target.action='fallen';target.vx=target.vy=0;if(target.type==='nimble'){s.stats.deaths++;event(s,'A Nimble was lost. Shelter, food, and defensive traits help the survivors.');}else{target.respawnIn=prey(target)?8+Math.random()*8:18+Math.random()*10;}}}
function eatPrey(s,e,p,dt){e.action='hunting';if(distance(e,p)<32+geneLevel(e,'claws')*3&&e.huntCooldown<=0){e.huntCooldown=.7;e.attack=.4;p.flash=.3;p.hp-=8+geneLevel(e,'claws')*9;if(p.hp<=0){p.hp=0;p.respawnIn=9+Math.random()*9;e.energy=clamp(e.energy+ANIMALS[p.type].energy,0,maxEnergy(e));e.hp=Math.min(maxHP(e),e.hp+4);s.stats.kills++;effect(s,e,`+${ANIMALS[p.type].energy} food`,'#e8f3b4');if(s.stats.kills===1||s.stats.kills%5===0)event(s,`Prey captured: ${ANIMALS[p.type].name}. Claws and speed improve hunting.`);}}}
function nimbleStep(s,e,dt,input,group,predators,preys){
 const legs=geneLevel(e,'legs'),armor=geneLevel(e,'armor'),fat=geneLevel(e,'fat'),fur=geneLevel(e,'fur'),ears=geneLevel(e,'ears'),web=geneLevel(e,'webbing');const inWater=insidePond(s,e,s.weather.type==='storm'?1.14:1),safe=sheltered(s,e),temp=s.habitat.temp+(s.weather.type==='heat'?12:s.weather.type==='snow'?-9:0);
 const cold=Math.max(0,12-temp-fur*10),heat=Math.max(0,temp-26-ears*6+fur*4);const weatherDrain=(cold*.035+heat*.055+(s.weather.type==='storm'?.28:0))*(safe?.18:1);
 const moving=Math.hypot(e.vx,e.vy)>15;e.energy=clamp(e.energy-dt*((moving?.23+legs*.055:.12)+weatherDrain)*(1-fat*.09),0,maxEnergy(e));
 if(e.energy<=0)e.hp=Math.max(0,e.hp-dt*(1.25-fat*.3));else if(e.energy>42)e.hp=Math.min(maxHP(e),e.hp+dt*(safe?1.7:.75));
 if(e.hp<=0){s.stats.deaths++;e.action='fallen';event(s,'A Nimble ran out of energy. Keep food within reach.');return;}
 let speed=(76+legs*14-armor*6-fat*3)*(e.age<18?.85:1);if(inWater)speed*=.47+web*.24;if(e.dashTime>0)speed*=2.2;
 const manual=input.selectedId===e.id&&Math.hypot(input.dx||0,input.dy||0)>.01;
 let threat=null,nearestDist=Infinity;for(const p of predators){if(p.hp<=0)continue;const dd=distance(e,p);const detect=225+ears*42-(s.weather.type==='fog'?55:0);if(dd<detect&&dd<nearestDist){nearestDist=dd;threat=p;}}
 if(manual){e.target=null;e.action='exploring';move(s,e,input.dx*100,input.dy*100,speed,dt);return;}
 if(e.target){const d=distance(e,e.target);if(d<24){e.target=null;move(s,e,0,0,0,dt);e.action='resting';}else{e.action='exploring';move(s,e,e.target.x-e.x,e.target.y-e.y,speed,dt);}return;}
 if(!e.auto){e.action='resting';move(s,e,0,0,0,dt);return;}
 if(threat&&!safe){if(nearestDist<85+geneLevel(e,'horns')*12&&e.defendCooldown<=0)defend(s,e);if(nearestDist<90&&e.dashCooldown<=0&&e.energy>25)dash(s,e);e.action='fleeing';let dx=e.x-threat.x,dy=e.y-threat.y;const shelter=pickNearest(e,s.world.shelters);if(shelter&&distance(e,shelter)<230){dx+=(shelter.x-e.x)*.6;dy+=(shelter.y-e.y)*.6;}move(s,e,dx,dy,speed*1.1,dt);return;}
 if(severe(s.weather.type)&&e.energy>48){const shelter=pickNearest(e,s.world.shelters);if(shelter){e.action='sheltering';const d=distance(e,shelter);move(s,e,d<45?0:shelter.x-e.x,d<45?0:shelter.y-e.y,speed*.88,dt);return;}}
 const hungry=e.energy<Math.min(99,maxEnergy(e)*.88),claws=geneLevel(e,'claws');let food=null,hunt=null;
 if(hungry){food=pickNearest(e,s.world.bushes,b=>b.food>=1);if(claws>0)hunt=pickNearest(e,preys,p=>p.hp>0&&(p.type!=='fish'||web>0)&&(p.type!=='rabbit'||claws>1||legs>0));if(hunt&&(!food||distance(e,hunt)<distance(e,food)*2.8)&&distance(e,hunt)<550){eatPrey(s,e,hunt,dt);move(s,e,hunt.x-e.x,hunt.y-e.y,speed*(1+claws*.025),dt);return;}if(food){const d=distance(e,food);e.action='foraging';if(d<31){move(s,e,0,0,0,dt);if(e.feedCooldown<=0){food.food-=1;e.energy=Math.min(maxEnergy(e),e.energy+19);e.hp=Math.min(maxHP(e),e.hp+3);e.feedCooldown=1.9;s.stats.forage++;effect(s,e,'+19 berries','#edf3bb');if(s.stats.forage===1||s.stats.forage%12===0)event(s,'The colony is feeding. Berry patches slowly regrow.');}}else move(s,e,food.x-e.x,food.y-e.y,speed*.92,dt);return;}}
 if(s.beacon&&distance(e,s.beacon)>105){e.action='rallying';move(s,e,s.beacon.x-e.x,s.beacon.y-e.y,speed*.72,dt);return;}
 // Gentle wandering breaks up the colony without constant jitter or teleporting.
 e.aiTimer=Math.max(0,e.aiTimer-dt);if(e.aiTimer<=0||!e.wander){const a=Math.random()*TAU,r=60+Math.random()*130;e.wander={x:clamp(e.x+Math.cos(a)*r,80,s.world.w-80),y:clamp(e.y+Math.sin(a)*r,80,s.world.h-80)};e.aiTimer=4+Math.random()*5;}
 e.action=e.energy>105?'resting':'roaming';const d=distance(e,e.wander);move(s,e,d<22?0:e.wander.x-e.x,d<22?0:e.wander.y-e.y,speed*.38,dt);
}
function animalStep(s,e,dt,group,predators){
 const spec=ANIMALS[e.type];if(!spec)return;let speed=spec.speed;
 if(prey(e)){const danger=pickNearest(e,s.entities,p=>p.hp>0&&(predator(p)||(p.type==='nimble'&&geneLevel(p,'claws')>0&&p.energy<105)));const d=danger?distance(e,danger):Infinity;e.aiTimer=Math.max(0,e.aiTimer-dt);let dx=0,dy=0;
 if(d<175){e.action='fleeing';const wiggle=e.type==='rabbit'?Math.sin(s.time*8+e.id)*.65:e.type==='grasshopper'?Math.sin(s.time*12+e.id)*.35:0;const a=Math.atan2(e.y-danger.y,e.x-danger.x)+wiggle;dx=Math.cos(a)*200;dy=Math.sin(a)*200;if(e.type==='grasshopper')speed*=1.1+Math.max(0,Math.sin(s.time*5+e.id))*.45;}
 else{e.action='grazing';if(e.aiTimer<=0||!e.wander){const p=preyPoint(s,e.type);const a=Math.random()*TAU;e.wander=e.type==='fish'||e.type==='frog'?p:{x:clamp(e.x+Math.cos(a)*180,45,s.world.w-45),y:clamp(e.y+Math.sin(a)*180,45,s.world.h-45)};e.aiTimer=3+Math.random()*7;}dx=e.wander.x-e.x;dy=e.wander.y-e.y;speed*=.35;}
 if(e.type==='fish'){const p=pickNearest(e,s.world.ponds),norm=((e.x-p.x)/(p.rx*.84))**2+((e.y-p.y)/(p.ry*.84))**2;if(norm>.95){dx=p.x-e.x;dy=p.y-e.y;speed=spec.speed;}}move(s,e,dx,dy,speed,dt,4);return;}
 if(e.fleeUntil>s.time){e.action='repelled';const near=pickNearest(e,group);move(s,e,near?e.x-near.x:Math.cos(e.angle)*100,near?e.y-near.y:Math.sin(e.angle)*100,speed*1.25,dt,2);return;}
 // Camouflage lowers detection at a distance; a nearby hunter still notices movement.
 let target=pickNearest(e,group,n=>{if(n.hp<=0||sheltered(s,n))return false;const coat=geneLevel(n,'coat'),match=coat===(s.level===6?2:[1,2,8].includes(s.level)?1:0);const radius=spec.range*(match?.67:1)*(s.weather.type==='fog'?.76:1);return distance(e,n)<radius;});
 const menu=e.type==='croc'?['fish','frog','rabbit']:e.type==='hawk'?['rabbit','frog','grasshopper']:e.type==='snake'?['frog','rabbit']:['rabbit','frog','beetle'];
 const wildPrey=pickNearest(e,s.entities,p=>p.hp>0&&menu.includes(p.type)&&distance(e,p)<spec.range*.85);
 if(wildPrey&&(!target||distance(e,wildPrey)<distance(e,target)*.65))target=wildPrey;
 if(e.type==='hawk'){
   if(e.action==='warning'){e.phaseTime=Math.max(0,e.phaseTime-dt);move(s,e,(e.target?.x||e.x)+Math.cos(s.time*3)*50-e.x,(e.target?.y||e.y)+Math.sin(s.time*3)*50-e.y,speed*.7,dt);if(e.phaseTime<=0){e.action='swooping';e.phaseTime=1.7;}return;}
   if(e.action==='swooping'&&e.target){e.phaseTime=Math.max(0,e.phaseTime-dt);const d=distance(e,e.target);move(s,e,e.target.x-e.x,e.target.y-e.y,speed*2.65,dt,7);if(d<45){const victim=s.entities.find(n=>n.id===e.targetId&&n.hp>0&&!sheltered(s,n))||pickNearest(e,s.entities,n=>n.hp>0&&(n.type==='nimble'||menu.includes(n.type))&&!sheltered(s,n));if(victim&&distance(e,victim)<52)damage(s,e,victim,spec.damage);e.action='circling';e.aiTimer=5;e.target=null;}if(e.phaseTime<=0){e.action='circling';e.aiTimer=4;e.target=null;}return;}
   e.aiTimer=Math.max(0,e.aiTimer-dt);if(target&&e.aiTimer<=0){e.action='warning';e.phaseTime=1.65;e.targetId=target.id;e.target={x:target.x,y:target.y};effect(s,target,'Hawk overhead!','#ffe3a5');return;}
   e.action='circling';const a=s.time*.16+e.id,center=target||{x:e.spawnX,y:e.spawnY};move(s,e,center.x+Math.cos(a)*180-e.x,center.y+Math.sin(a)*135-e.y,speed*.65,dt);return;
 }
 let victim=target;
 if(e.type==='wolf'&&!victim){const mate=pickNearest(e,predators,p=>p.type==='wolf'&&p.id!==e.id&&p.action==='chasing'&&p.targetId);if(mate&&distance(e,mate)<520)victim=group.find(n=>n.id===mate.targetId)||null;}
 if(e.type==='fox'&&target?.type==='nimble'){let best=target,score=Infinity;for(const n of group){if(sheltered(s,n)||distance(e,n)>spec.range)continue;let neighbors=0;for(const other of group)if(n!==other&&distance(n,other)<125)neighbors++;const value=distance(e,n)+(n.age<18?-150:0)+neighbors*80;if(value<score){score=value;best=n;}}victim=best;}
 if(e.type==='croc'){const pond=pickNearest(e,s.world.ponds);if(distance(e,pond)>Math.max(pond.rx,pond.ry)+120){victim=null;e.action='returning to water';move(s,e,pond.x-e.x,pond.y-e.y,speed*.7,dt);return;}if(victim&&!insidePond(s,victim,1.65))victim=null;speed*=insidePond(s,e)?1.35:.65;}
 if(e.type==='snake'){
   if(victim&&distance(e,victim)<115&&e.phaseTime<=0){e.phaseTime=1.3;e.action='lunging';}
   if(e.phaseTime>0){e.phaseTime=Math.max(0,e.phaseTime-dt);speed*=2.2;}else if(!victim||distance(e,victim)>115){e.action='waiting';e.aiTimer=Math.max(0,e.aiTimer-dt);if(!victim&&(e.aiTimer<=0||!e.wander)){const a=Math.random()*TAU;e.wander={x:clamp(e.x+Math.cos(a)*100,40,s.world.w-40),y:clamp(e.y+Math.sin(a)*100,40,s.world.h-40)};e.aiTimer=12;}move(s,e,!victim&&e.wander?e.wander.x-e.x:0,!victim&&e.wander?e.wander.y-e.y:0,7,dt);return;}
 }
 if(victim){e.action=e.type==='snake'?'lunging':'chasing';e.targetId=victim.id;const d=distance(e,victim);move(s,e,victim.x-e.x,victim.y-e.y,speed,dt);if(d<(e.type==='croc'?43:34))damage(s,e,victim,spec.damage);return;}
 e.targetId=null;e.action=e.type==='croc'?'lurking':'patrolling';e.aiTimer=Math.max(0,e.aiTimer-dt);if(e.aiTimer<=0||!e.wander){const center=e.type==='croc'?pickNearest(e,s.world.ponds):{x:s.world.w/2,y:s.world.h/2};const a=Math.random()*TAU,r=e.type==='croc'?80:250+Math.random()*650;e.wander={x:clamp(center.x+Math.cos(a)*r,75,s.world.w-75),y:clamp(center.y+Math.sin(a)*r,75,s.world.h-75)};e.aiTimer=6+Math.random()*5;}move(s,e,e.wander.x-e.x,e.wander.y-e.y,speed*.55,dt);
}

export function step(s,dt,input={}){
 if(!s||!Number.isFinite(dt)||dt<=0)return;dt=Math.min(dt,.1);s.time+=dt;s.stats.elapsed+=dt;s.weather.age+=dt;s.weather.remaining-=dt;if(severe(s.weather.type))s.stats.weatherTime+=dt;
 if(s.weather.remaining<=0){s.weather.cycle=(s.weather.cycle||0)+1;const cycle=s.weather.cycle;setWeather(s,s.habitat.weather[cycle%s.habitat.weather.length]);s.weather.cycle=cycle;}
 for(const b of s.world.bushes)b.food=Math.min(9,b.food+dt*(s.weather.type==='heat'?.018:s.weather.type==='rain'?.09:.045));
 for(const ef of s.effects){ef.life-=dt;ef.y-=dt*13;}s.effects=s.effects.filter(ef=>ef.life>0);
 let group=nimbles(s),predators=s.entities.filter(e=>predator(e)&&alive(e)),preys=s.entities.filter(e=>prey(e)&&alive(e));
 for(const e of s.entities){
  if(e.hp<=0){if(e.type!=='nimble'){e.respawnIn=Math.max(0,e.respawnIn-dt);if(e.respawnIn<=0){if(predator(e))placePredator(s,e);else{const p=preyPoint(s,e.type);e.x=p.x;e.y=p.y;e.vx=e.vy=0;e.hp=maxHP(e);e.action='grazing';}}}continue;}
  e.age+=dt;for(const key of ['attack','flash','cooldown','defendCooldown','dashCooldown','hitCooldown','dashTime','huntCooldown','feedCooldown'])e[key]=Math.max(0,(e[key]||0)-dt);
  if(e.type==='nimble')nimbleStep(s,e,dt,input,group,predators,preys);else animalStep(s,e,dt,group,predators);
 }
 // Keep corpses only briefly; population caps count living Nimbles and leave room for recovery.
 s.entities=s.entities.filter(e=>e.type!=='nimble'||e.hp>0||s.time-(e.deathAt??(e.deathAt=s.time))<6);
 if(s.autoBreed){group=nimbles(s);for(const a of group){if(a.age<18||a.energy<78||a.cooldown>0||group.length>=NIMBLE_CAP)continue;const mode=s.mode==='asexual'?'asexual':'sexual';if(mode==='sexual'&&a.sex!=='F')continue;const b=mode==='sexual'?pickNearest(a,group,n=>n.sex!==a.sex&&n.age>=18&&n.energy>74&&n.cooldown<=0):null;if(mode==='sexual'&&(!b||distance(a,b)>180))continue;const child=createChild(s,mode,a,b);if(child&&addChild(s,child,a,b,mode)){group.push(child);break;}}}
}

// Saved files and URL payloads are untrusted. Rebuild only the supported schema.
export function validateState(obj){
 const fail=()=>{throw new Error('This is not a valid Nimbles Updated save file.');};if(!obj||typeof obj!=='object'||obj.version!==1)fail();
 const num=(v,min,max,fallback)=>{if(v===undefined&&fallback!==undefined)return fallback;if(typeof v!=='number'||!Number.isFinite(v)||v<min||v>max)fail();return v;};
 const int=(v,min,max,fallback)=>{const n=num(v,min,max,fallback);if(!Number.isInteger(n))fail();return n;};
 const str=(v,max,fallback='')=>typeof v==='string'?v.slice(0,max):fallback;
 const level=int(obj.level,0,HABITATS.length-1),world=obj.world;if(!world||!Array.isArray(obj.entities)||obj.entities.length>ENTITY_CAP)fail();
 const point=(p,extras={})=>{if(!p||typeof p!=='object')fail();return{x:num(p.x,0,3200),y:num(p.y,0,2200),...extras};};
 const list=(v,max,fn)=>{if(!Array.isArray(v)||v.length>max)fail();return v.map(fn);};
 const w={w:num(world.w,3200,3200),h:num(world.h,2200,2200),seed:int(world.seed,0,0xffffffff),ponds:list(world.ponds,16,p=>point(p,{rx:num(p.rx,10,700),ry:num(p.ry,10,500)})),shelters:list(world.shelters,30,p=>point(p,{r:num(p.r,10,200)})),bushes:list(world.bushes,200,p=>point(p,{food:num(p.food,0,12)})),trees:list(world.trees,300,p=>point(p,{r:num(p.r,5,120)})),rocks:list(world.rocks,160,p=>point(p,{r:num(p.r,5,120)}))};if(!w.ponds.length||!w.shelters.length||!w.bushes.length)fail();
 const ids=new Set();let count=0,maxId=0;const entities=obj.entities.map(e=>{if(!e||(!ANIMALS[e.type]&&e.type!=='nimble'))fail();if(e.type==='nimble'&&e.hp>0&&++count>NIMBLE_CAP)fail();const id=int(e.id,1,1e9);if(ids.has(id))fail();ids.add(id);maxId=Math.max(maxId,id);if(!e.genes||typeof e.genes!=='object')fail();const genes={};for(const t of TRAITS){const g=e.genes[t.key];if(!Array.isArray(g)||g.length!==2||g.some(a=>a!==0&&a!==1))fail();genes[t.key]=[...g];}if(e.sex!=='F'&&e.sex!=='M')fail();const en={...point(e),id,type:e.type,genes,sex:e.sex,vx:num(e.vx,-1500,1500,0),vy:num(e.vy,-1500,1500,0),angle:num(e.angle,-1e8,1e8,0),hp:num(e.hp,0,160),energy:num(e.energy,0,145),age:num(e.age,0,1e9),action:str(e.action,40,'roaming'),auto:e.auto!==false,generation:int(e.generation,1,1e6,1),spawnX:num(e.spawnX,0,3200,e.x),spawnY:num(e.spawnY,0,2200,e.y),target:e.target?point(e.target):null,wander:e.wander?point(e.wander):null,birthMode:e.birthMode==='asexual'?'asexual':'sexual'};for(const key of ['attack','flash','cooldown','defendCooldown','dashCooldown','hitCooldown','dashTime','huntCooldown','feedCooldown','aiTimer','phaseTime','respawnIn'])en[key]=num(e[key],0,1e5,0);en.fleeUntil=num(e.fleeUntil,0,1e9,0);en.targetId=e.targetId===undefined||e.targetId===null?null:int(e.targetId,1,1e9);if(e.deathAt!==undefined)en.deathAt=num(e.deathAt,0,1e9);return en;});
 if(!obj.stats||!obj.weather||!WEATHER.has(obj.weather.type))fail();const stats={};for(const k of ['births','kills','forage','defends','elapsed','weatherTime','deaths'])stats[k]=num(obj.stats[k],0,1e9,0);stats.generation=int(obj.stats.generation,1,1e6,1);
 const s={version:1,time:num(obj.time,0,1e9),level,unlocked:int(obj.unlocked,level,HABITATS.length-1,level),habitat:HABITATS[level],world:w,entities,effects:list(obj.effects||[],80,e=>({x:num(e.x,0,3200),y:num(e.y,-200,2200),text:str(e.text,90),color:/^#[0-9a-f]{3,8}$/i.test(e.color)?e.color:'#fff2bd',life:num(e.life,0,10)})),beacon:obj.beacon?point(obj.beacon):null,stats,events:list(obj.events||[],8,e=>({text:str(e.text,200),time:num(e.time,0,1e9)})),nextId:int(obj.nextId,maxId+1,1e9),completed:obj.completed===true,autoBreed:obj.autoBreed===true,mode:obj.mode==='asexual'?'asexual':'sexual',mutation:obj.mutation!==false,weather:{type:obj.weather.type,intensity:num(obj.weather.intensity,0,1),remaining:num(obj.weather.remaining,0,180),age:num(obj.weather.age,0,1e9),cycle:int(obj.weather.cycle,0,1e8,0)}};if(obj.lastRepelEvent!==undefined)s.lastRepelEvent=num(obj.lastRepelEvent,-100,1e9);return s;
}
