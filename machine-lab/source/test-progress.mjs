import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {normalizeProgress,serializeProgress,parseProgress,encodeProgress,decodeProgress,recordAttempt,summarizeProgress,MAX_SHARE_LENGTH} from '../progress.js';
import {defaultConfig} from '../physics.js';
let checks=0;
assert.equal(normalizeProgress({}).session.view.forces,false);
assert.equal(normalizeProgress({session:{view:{forces:true}}}).session.view.forces,true);checks+=2;
const at=Date.UTC(2026,10,9,15,30);
const base={student:'Gabriel 🧪 — 班',savedAt:at,saved:{dark:false,serial:25,pathWidth:4.5,balanceVariants:{ramp:7},skills:{ramp:{force:2,balance:3,distance:1,acceleration:0}}},session:{mode:'balance',type:'ramp',task:'balance',topic:'mixed',variant:7,config:{...defaultConfig('ramp'),inputMass:7.5,height:1.2,length:3},answer:'15/2',camera:{zoom:1.2,cx:430,cy:255},rampView:{scale:150,baseY:370,x0:80},view:{paths:true,forces:false,plotKind:'force',speed:.5},credited:true},stats:{}};
let stats;
for(let i=0;i<75;i++)stats=recordAttempt(stats,{type:i%2?'ramp':'lever',mode:'balance',task:'balance',variable:i%2?'rampRun':'inputMass',level:i%4,variant:i,entry:String(i/2),correct:i%3===0,at:at+i*1000,signature:'test-'+i});
assert.equal(stats.attempts,75);assert.equal(stats.correct,25);assert.equal(stats.recent.length,50);assert.equal(stats.recent[0].variant,25);checks+=4;
const again=recordAttempt(stats,{...stats.recent.at(-1)});assert.deepEqual(again,stats);checks++;
const different=recordAttempt(stats,{...stats.recent.at(-1),signature:'new-setup'});assert.equal(different.attempts,76);checks++;
base.stats=stats;
const normalized=normalizeProgress(base);
assert.deepEqual(parseProgress(serializeProgress(base)),normalized);checks++;
const pretty=serializeProgress(base,{pretty:true});assert.ok(pretty.includes('\n'));assert.deepEqual(parseProgress('\uFEFF'+pretty),normalized);checks+=2;
const token=await encodeProgress(base),restored=await decodeProgress(token);
assert.ok(token.length<=MAX_SHARE_LENGTH);assert.equal(restored.student,base.student);assert.deepEqual(restored.session,normalized.session);assert.equal(restored.stats.attempts,75);assert.equal(restored.stats.correct,25);assert.deepEqual(restored.saved,normalized.saved);assert.deepEqual(restored,normalized);checks+=7;
const summary=summarizeProgress(base);assert.equal(summary.tests,75);assert.equal(summary.successfulTests,25);assert.equal(summary.accuracy,33);assert.equal(summary.machines.length,2);checks+=4;
for(const type of ['lever','ramp','pulley','wheel','gears','gearArms','screw','wedge','hydraulic'])for(const mode of ['balance','challenge','auto']){
 const snapshot={...base,session:{...base.session,type,mode,config:defaultConfig(type)}};
 const restored=await decodeProgress(await encodeProgress(snapshot));assert.equal(restored.session.type,type);assert.equal(restored.session.mode,type==='gearArms'?'balance':mode);assert.deepEqual(restored,normalizeProgress(snapshot));checks++;
}
// Bounds and whitelists preserve usable data without importing arbitrary properties.
const dirty=JSON.parse(JSON.stringify({...base,solution:12345,challenge:{answer:12345},session:{...base.session,solution:12345,feedback:{html:'<img onerror=evil>'},playing:true,camera:{zoom:99,cx:-100,cy:999},config:{...defaultConfig('ramp'),inputMass:999,outputMass:-999,force:Infinity,height:1000,unrecognized:'payload',answer:12345},rampView:{scale:99999,baseY:-99,x0:99999}},stats:{attempts:2,correct:99,byMachine:{lever:{attempts:3,correct:99}},recent:[{type:'unknown',correct:true}]}}));
const safe=normalizeProgress(dirty);
assert.equal(safe.session.config.inputMass,200);assert.equal(safe.session.config.outputMass,1);assert.ok(safe.session.config.height<=safe.session.config.length);assert.equal(safe.session.camera.zoom,3.5);assert.equal(safe.session.camera.cx,80);assert.equal(safe.session.camera.cy,510);assert.equal(safe.stats.attempts,3);assert.equal(safe.stats.correct,3);assert.equal(safe.stats.recent.length,0);checks+=9;
for(const property of ['solution','challenge','feedback','playing','unrecognized'])assert.ok(!serializeProgress(dirty).includes('"'+property+'"'));checks+=5;
assert.ok(!Object.hasOwn(safe.session.config,'answer'));assert.equal(normalizeProgress({...base,session:{...base.session,config:{...defaultConfig('ramp'),force:900}}}).session.config.force,0);checks+=2;
const poison=parseProgress('{"schema":"machine-lab-progress","version":1,"__proto__":{"polluted":true},"saved":{"skills":{"__proto__":{"polluted":true}}},"session":{"type":"lever","config":{"__proto__":{"polluted":true}}}}');
assert.equal({}.polluted,undefined);assert.ok(!serializeProgress(poison).includes('__proto__'));checks+=2;
for(const bad of ['', 'not json','null','[]','{}','{"schema":"machine-lab-progress","version":2}','{"schema":"other","version":1}',JSON.stringify({...normalized,session:{...normalized.session,type:'spaceship'}}),JSON.stringify({...normalized,session:{...normalized.session,mode:'admin'}}),' '.repeat(131073)]){assert.throws(()=>parseProgress(bad));checks++;}
for(const bad of ['', '!', 'a', 'a'.repeat(MAX_SHARE_LENGTH+1),'____','e30',encodeURIComponent(token)]){if(bad===token)continue;await assert.rejects(()=>decodeProgress(bad));checks++;}
// A tiny file containing invalid UTF-8 must not become replacement characters.
await assert.rejects(()=>decodeProgress('_w'));checks++;
// UTF-8 text keeps whole code points; compact sharing retains all recent tests and totals.
const noisy={...base,student:'🧪'.repeat(100),stats:{...stats,recent:Array.from({length:50},(_,i)=>({type:'ramp',mode:'balance',task:'balance',level:0,variant:i,variable:'rampRun',entry:'🧪'.repeat(48),correct:false,at,signature:'x'.repeat(79)+i%10}))}};
const limited=normalizeProgress(noisy),small=await decodeProgress(await encodeProgress(noisy));
assert.equal(Array.from(limited.student).length,80);assert.equal(limited.stats.recent.length,50);assert.equal(small.stats.recent.length,50);assert.equal(small.stats.attempts,75);assert.equal(small.stats.correct,25);assert.deepEqual(small.session,limited.session);assert.equal(small.student,limited.student);checks+=7;
// Neither decoder modifies caller objects or silently touches browser storage.
const original=JSON.stringify(base);await encodeProgress(base);normalizeProgress(base);recordAttempt(base.stats,{type:'lever',entry:'8',signature:'other',correct:true});assert.equal(JSON.stringify(base),original);checks++;
// Legacy links remain readable, including their original long field names.
const oldSnapshot=normalizeProgress({...base,stats:{...stats,recent:stats.recent.slice(-4)}});
const oldToken=Buffer.from(JSON.stringify(oldSnapshot),'utf8').toString('base64url');
assert.ok(oldToken.length<=MAX_SHARE_LENGTH);assert.deepEqual(await decodeProgress(oldToken),oldSnapshot);checks+=2;
// Compact JSON is also a portable fallback when native compression is unavailable.
const fallback=await encodeProgress(oldSnapshot,{compress:false});
assert.ok(fallback.startsWith('c2.'));assert.deepEqual(await decodeProgress(fallback),oldSnapshot);checks+=2;
const nativeCompression=globalThis.CompressionStream,nativeDecompression=globalThis.DecompressionStream;
try{
 globalThis.CompressionStream=undefined;
 assert.equal(await encodeProgress(oldSnapshot),fallback);checks++;
 globalThis.DecompressionStream=undefined;
 assert.deepEqual(await decodeProgress(fallback),oldSnapshot);assert.deepEqual(await decodeProgress(oldToken),oldSnapshot);
 await assert.rejects(()=>decodeProgress(token),/current browser/);checks+=3;
}finally{globalThis.CompressionStream=nativeCompression;globalThis.DecompressionStream=nativeDecompression;}
// Every supported field has a lossless representation, including non-default views and metadata.
const varied=normalizeProgress({...base,saved:{...base.saved,skills:Object.fromEntries(['lever','ramp','pulley','wheel','gears','gearArms','screw','wedge','hydraulic'].map(type=>[type,{force:4,balance:3,distance:2,acceleration:1}]))},session:{...base.session,type:'gears',mode:'challenge',task:'acceleration',topic:'distance',level:3,custom:true,credited:true,forceCorrect:true,attempts:6,resistance:.65,config:{...defaultConfig('gears'),force:173,inputMass:8.5,outputMass:61,rIn:.45,rOut:.25,teethIn:24,teethOut:40,length:2.2,height:1.4,pulleyTravel:2.4,pulleyRadius:.22,areaIn:2,areaOut:6},view:{paths:false,forces:false,accelerations:true,charts:true,graphToggle:true,pullTool:false,autoAdvance:false,compareKind:'force',plotKind:'acceleration',autoTarget:'geometry',speed:.25}}});
assert.deepEqual(await decodeProgress(await encodeProgress(varied)),varied);assert.deepEqual(await decodeProgress(await encodeProgress(varied,{compress:false})),varied);checks+=2;
assert.deepEqual(small,limited);assert.deepEqual(restored.stats.recent,normalized.stats.recent);checks+=2;
// No silently discarded recent tests when an uncompressed link would exceed the bound.
await assert.rejects(()=>encodeProgress(noisy,{compress:false}),/too large/);checks++;
const wire=JSON.parse(Buffer.from(fallback.slice(3),'base64url').toString('utf8'));
const makeCompact=value=>'c2.'+Buffer.from(JSON.stringify(value),'utf8').toString('base64url');
const makeCompressed=source=>'z2.'+deflateSync(source).toString('base64url');
const malformed=[];
for(const change of [w=>w.push('extra'),w=>w[3].pop(),w=>w[3][0]=99,w=>w[3][6][0]='mass',w=>w[3][8]=8,w=>w[3][13][0]=128,w=>w[3][13][2]=99,w=>w[3][12]={scale:20},w=>w[2][3].push(w[2][3][0]),w=>w[4][3][0][8]=4,w=>w[4][3][0][6]=99,w=>w[4][3][0][7]='x'.repeat(49)]){
 const bad=structuredClone(wire);change(bad);malformed.push(makeCompact(bad));
}
const truncated=token.slice(0,-4);
const packed=Buffer.from(token.slice(3),'base64url');packed[packed.length-1]^=1;
malformed.push('z2.','c2.','z3.'+fallback.slice(3),'c3.'+fallback.slice(3),truncated,'z2.'+packed.toString('base64url'),makeCompressed(Buffer.from([255])),makeCompact({schema:'fake'}));
for(const bad of malformed){await assert.rejects(()=>decodeProgress(bad));checks++;}
// Streaming inflation rejects an oversized payload before parsing a valid wire value.
const expansion=makeCompressed(' '.repeat(131073)+JSON.stringify(wire));
assert.ok(expansion.length<MAX_SHARE_LENGTH);await assert.rejects(()=>decodeProgress(expansion));checks+=2;
// Representative before/after sizes use the old full JSON encoding without history loss.
const fixtures=[['new session',normalizeProgress({savedAt:at})],['classroom session',oldSnapshot],['50 recent tests',normalized],['Unicode history',limited]];
const sizes=[];
for(const [name,p]of fixtures){
 const before=Buffer.from(JSON.stringify(p),'utf8').toString('base64url').length,after=(await encodeProgress(p)).length;
 assert.ok(after<before*.3,`${name}: expected at least 70% shorter (${before} to ${after})`);assert.deepEqual(await decodeProgress(await encodeProgress(p)),p);checks+=2;
 sizes.push({name,before,after,reduction:Math.round(100*(1-after/before))+'%'});
}
console.log(`Progress checks passed (${checks} assertions): compact and legacy links, full-history round trips, fallback, Unicode, bounds, malformed data and decompression limits.`);
console.table(sizes);
