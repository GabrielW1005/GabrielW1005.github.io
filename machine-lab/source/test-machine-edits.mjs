import assert from 'node:assert/strict';
import {defaultConfig,normalizeConfig,readout,makeState} from '../physics.js';
import {editSetup,setupValue,horizontalRun,setupEntry} from '../machine-edits.js';
import {createBalanceChallenge} from '../balance-challenges.js';
import {machineCatalog} from '../challenges.js';
let checks=0;
for(const initialHeight of [.1,.4,1,1.7])for(const base of [.3,1,2.4,4.5]){
 let c=editSetup({...defaultConfig('ramp'),height:initialHeight},'rampRun',base);
 const fixed=horizontalRun(c);
 for(const height of [.2,.5,1,1.5,2,.3]){
  c=editSetup(c,'height',height);assert.ok(Math.abs(horizontalRun(c)-fixed)<1e-10,'height edit preserves extended base');assert.ok(c.length<=5+1e-10);checks++;
 }
}
for(const m of machineCatalog)for(let variant=0;variant<80;variant++){
 const p=createBalanceChallenge(m.type,variant),entered=Number(setupEntry(p.answer)),c=editSetup(p.config,p.key,entered);
 assert.ok(Math.abs(Number(setupEntry(setupValue(p.config,p.key)))-setupValue(p.config,p.key))<1e-9,'initial field preserves fine increments');
 assert.ok(readout(makeState(c,p.startFraction),c).balanced,`${m.type}/${variant}: exact answer balances`);
 assert.ok(Math.abs(setupValue(c,p.key)-p.answer)<1e-8);
 assert.equal(c.force,0);checks++;
}
console.log(`Machine edit checks passed (${checks} cases): independent ramp dimensions and every balance answer through the app edit path.`);
