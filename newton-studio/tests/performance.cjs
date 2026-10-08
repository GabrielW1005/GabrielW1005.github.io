/* Observational benchmark, not a hardware-dependent pass/fail test.
   Optional: NEWTON_BASELINE=/absolute/path/to/previous-physics.js node tests/performance.cjs */
const fs=require('fs'),path=require('path'),vm=require('vm'),{performance}=require('perf_hooks');
const N=require('../physics.js'),C=require('../challenges.js'),planck=require('../vendor/planck.min.js');
function loadBaseline(file){const context={planck,console};vm.createContext(context);vm.runInContext(fs.readFileSync(file,'utf8'),context,{filename:file});return context.Newton;}
const versions=process.env.NEWTON_BASELINE?[['before',loadBaseline(path.resolve(process.env.NEWTON_BASELINE))],['updated',loadBaseline(path.join(__dirname,'../physics.js'))]]:[['updated',N]];
function assembly(count){const scene=N.empty();scene.gravity=0;for(let i=0;i<count;i++)scene.bodies.push(N.body('circle',i*.7,3,{r:.3,mass:1}));for(let i=1;i<count;i++)scene.joints.push({id:'weld'+i,kind:'weld',a:scene.bodies[i-1].id,b:scene.bodies[i].id,x:i*.7,y:3});return scene;}
function dense(){const scene=N.empty();scene.bodies=[N.body('ground',0,-.5,{w:100,h:1,restitution:0})];for(let i=0;i<179;i++)scene.bodies.push(N.body('circle',(i%20-10)*1.3,1+Math.floor(i/20)*1.3,{r:.5,restitution:0}));return scene;}
const median=values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)];
// Alternate version order to reduce warmup and machine-load bias.
for(const count of [30,90,180]){
 const runs=versions.map(([version,engine])=>({version,sim:new engine.Simulation(assembly(count)),times:[]}));
 for(let trial=0;trial<5;trial++)for(const run of trial%2?[...runs].reverse():runs){const start=performance.now();run.sim.cacheResources();run.times.push(performance.now()-start);}
 for(const {version,sim,times} of runs){const sets=new Set([...sim.bodies.values()].map(e=>e.assemblyIds));console.log(JSON.stringify({version,test:'welded assembly cache',bodies:count,medianMs:median(times),membershipEntries:[...sets].reduce((n,s)=>n+s.size,0)}));}
}
for(const [name,scene,steps,key] of [['long-road rover',C.example('longRoad'),600,'d'],['dense contacts',dense(),600,null]]){
 const runs=versions.map(([version,engine])=>({version,engine,times:[]}));
 for(const {engine} of runs){const sim=new engine.Simulation(scene);if(key)sim.keys.add(key);for(let i=0;i<1200;i++)sim.step();}
 for(let trial=0;trial<5;trial++)for(const run of trial%2?[...runs].reverse():runs){const sim=new run.engine.Simulation(scene);if(key)sim.keys.add(key);for(let i=0;i<60;i++)sim.step();const start=performance.now();for(let i=0;i<steps;i++)sim.step();run.times.push(performance.now()-start);}
 for(const {version,times} of runs)console.log(JSON.stringify({version,test:name,bodies:scene.bodies.length,steps,medianMs:median(times),samplesMs:times}));
}
