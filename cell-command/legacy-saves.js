'use strict';
window.CellSavesLegacy=(()=>{
  const E={...window.CellEngine,fresh:window.CellEngine.legacyFresh},C=window.CellContent,KEY='cell-command-v1',MAX_BYTES=1024*1024;
  const finite=(x,min,max)=>typeof x==='number'&&Number.isFinite(x)&&x>=min&&x<=max;
  const integer=(x,min,max)=>Number.isInteger(x)&&finite(x,min,max);
  const check=(condition)=>{if(!condition)throw new Error('This save contains missing or invalid game data.');};
  function validate(raw){
    check(raw&&raw.format==='cell-command-save'&&raw.formatVersion===1&&raw.state);
    const a=raw.state,s=E.fresh();check(a.version===1&&finite(a.elapsed,0,1e8)&&['playing','won','rescue'].includes(a.status));
    check(finite(a.health,0,100)&&integer(a.nextId,1,1e8)&&integer(a.seed,0,4294967295));
    for(const k of Object.keys(s.resources)){check(a.resources&&finite(a.resources[k],0,1200));s.resources[k]=a.resources[k];}
    const ids=new Set();const base=(b)=>{check(b&&integer(b.id,1,a.nextId-1)&&!ids.has(b.id)&&finite(b.x,0,E.WORLD.w)&&finite(b.y,0,E.WORLD.h));ids.add(b.id);};
    check(Array.isArray(a.buildings)&&a.buildings.length>=8&&a.buildings.length<=30);
    s.buildings=a.buildings.map(b=>{base(b);check(Object.hasOwn(C.buildings,b.type)&&finite(b.progress,0,1)&&finite(b.clock,0,1e5)&&typeof b.auto==='boolean'&&Array.isArray(b.queue)&&b.queue.length<=4);const queue=b.queue.map(q=>{check(q&&['antiviral','vesicle'].includes(q.kind)&&finite(q.remaining,0,8));check(q.kind==='antiviral'?b.type==='ribosome':b.type==='golgi');return {kind:q.kind,remaining:q.remaining};});return {id:b.id,type:b.type,x:b.x,y:b.y,progress:b.progress,clock:b.clock,queue,auto:b.auto,infected:false};});
    for(const type of ['nucleus','mitochondrion','ribosome','roughER','smoothER','golgi','lysosome','centrosome'])check(s.buildings.some(b=>b.type===type&&b.progress===1));
    for(const type of Object.keys(C.buildings))check(s.buildings.filter(b=>b.type===type).length<=C.buildings[type].limit);
    check(Array.isArray(a.units)&&a.units.length<=26);
    s.units=a.units.map(u=>{base(u);check(['vesicle','antiviral'].includes(u.type)&&['auto','move','hold','attack'].includes(u.order)&&finite(u.cargo,0,1));let target=null;if(u.target){check(['move','focus'].includes(u.target.kind));if(u.target.kind==='move'){check(finite(u.target.x,0,E.WORLD.w)&&finite(u.target.y,0,E.WORLD.h));target={kind:'move',x:u.target.x,y:u.target.y};}else {check(integer(u.target.id,1,a.nextId-1));target={kind:'focus',id:u.target.id};}}return {id:u.id,type:u.type,x:u.x,y:u.y,target,order:u.order,site:Number.isInteger(u.site)?u.site:null,cargo:u.cargo,phase:u.cargo?'deliver':'collect',clock:0,fx:0,building:null};});
    check(Array.isArray(a.ports)&&a.ports.length===3);s.ports=a.ports.map(p=>{base(p);check(integer(p.stock,0,4)&&finite(p.clock,0,16));return {id:p.id,x:p.x,y:p.y,stock:p.stock,clock:p.clock};});
    check(Array.isArray(a.foci)&&a.foci.length<=8);s.foci=a.foci.map(f=>{base(f);check(finite(f.health,0,75)&&finite(f.replication,0,55));return {id:f.id,x:f.x,y:f.y,health:f.health,replication:f.replication};});
    check(Array.isArray(a.viruses)&&a.viruses.length<=8);s.viruses=a.viruses.map(v=>{base(v);check(finite(v.entryX,0,E.WORLD.w)&&finite(v.entryY,0,E.WORLD.h)&&finite(v.angle,-Math.PI,Math.PI));return {id:v.id,x:v.x,y:v.y,entryX:v.entryX,entryY:v.entryY,angle:v.angle};});
    check(a.ai&&integer(a.ai.reserve,0,12)&&finite(a.ai.next,0,1e9)&&integer(a.ai.spawned,0,1e8)&&integer(a.ai.replications,0,1e8));s.ai={reserve:a.ai.reserve,next:a.ai.next,spawned:a.ai.spawned,replications:a.ai.replications};
    for(const k of Object.keys(s.stats)){check(a.stats&&integer(a.stats[k],0,1e8));s.stats[k]=a.stats[k];}
    check(Array.isArray(a.learned)&&a.learned.length<=C.questions.length&&a.learned.every(id=>C.questions.some(q=>q.id===id))&&new Set(a.learned).size===a.learned.length);s.learned=[...a.learned];
    check(a.quiz&&integer(a.quiz.index,0,C.questions.length)&&finite(a.quiz.next,0,1e9));check(a.quiz.pending===null||integer(a.quiz.pending,0,C.questions.length-1));if(a.quiz.pending!==null)check(a.quiz.pending===a.quiz.index);
    s.quiz={index:a.quiz.index,pending:a.quiz.pending,next:a.quiz.next,tries:integer(a.quiz.tries,0,1e8)?a.quiz.tries:0};
    check(a.settings&&[.65,1,1.35].includes(a.settings.speed)&&typeof a.settings.reducedMotion==='boolean');s.settings={speed:a.settings.speed,reducedMotion:a.settings.reducedMotion};
    for(const k of Object.keys(s.tutorial)){check(a.tutorial&&typeof a.tutorial[k]==='boolean');s.tutorial[k]=a.tutorial[k];}
    s.version=1;s.elapsed=a.elapsed;s.status=a.status;s.health=a.health;s.nextId=a.nextId;s.seed=a.seed;s.repairClock=finite(a.repairClock,0,10)?a.repairClock:0;s.victorySeen=a.victorySeen===true;
    s.studentName=typeof a.studentName==='string'?a.studentName.slice(0,60):'';s.startedAt=typeof a.startedAt==='string'?a.startedAt.slice(0,40):s.startedAt;
    s.events=[];E.event(s,'Save loaded. Your cell is ready to continue.','good');return s;
  }
  const envelope=s=>({format:'cell-command-save',formatVersion:1,savedAt:new Date().toISOString(),state:E.clone(s)});
  function save(s){try{localStorage.setItem(KEY,JSON.stringify(envelope(s)));return true;}catch{return false;}}
  function load(){try{const str=localStorage.getItem(KEY);return str?validate(JSON.parse(str)):null;}catch{return null;}}
  function download(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function exportSave(s){download('cell-command-save.json',JSON.stringify(envelope(s),null,2));}
  async function importFile(file){if(!file||file.size>MAX_BYTES)throw new Error('Choose a Cell Command save smaller than 1 MB.');return validate(JSON.parse(await file.text()));}
  function encodeReport(r){const bytes=new TextEncoder().encode(JSON.stringify(r));return btoa(Array.from(bytes,b=>String.fromCharCode(b)).join('')).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');}
  function decodeReport(encoded){check(typeof encoded==='string'&&encoded.length<=12000&&/^[\w-]+$/.test(encoded));const str=atob(encoded.replace(/-/g,'+').replace(/_/g,'/'));const r=JSON.parse(new TextDecoder().decode(Uint8Array.from(str,c=>c.charCodeAt(0))));check(r&&r.format==='cell-command-report'&&r.version===1&&typeof r.name==='string'&&r.name.length<=60&&typeof r.created==='string'&&r.created.length<=40&&['Cell stabilized','Recovery needed','In progress'].includes(r.status));for(const key of ['seconds','deliveries','organelles','defenders','infections','questions','attempts','firstTry'])check(integer(r[key],0,1e8));check(integer(r.growth,0,100)&&integer(r.health,0,100));check(Array.isArray(r.concepts)&&r.concepts.length<=C.questions.length&&r.concepts.every(v=>typeof v==='string'&&v.length<=80));return r;}
  return {KEY,MAX_BYTES,validate,envelope,save,load,download,exportSave,importFile,encodeReport,decodeReport};
})();
