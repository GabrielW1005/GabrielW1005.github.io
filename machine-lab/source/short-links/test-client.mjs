import {test} from 'node:test';
import assert from 'node:assert/strict';
import {newShareId, saveShortProgress, loadShortProgress, shortProgressLink} from './client.mjs';
import {normalizeProgress, encodeProgress, decodeProgress} from '../../progress.js';
const service = 'https://example.test';
const id = newShareId();
const json = (value, status=200) => new Response(JSON.stringify(value), {status, headers:{'content-type':'application/json'}});

test('128-bit IDs are canonical and links stay short regardless of progress size', () => {
  const values = Array.from({length:1000}, () => newShareId());
  assert.equal(new Set(values).size, 1000);
  for (const value of values) assert.match(value, /^[A-Za-z0-9_-]{21}[AQgw]$/);
  const link = shortProgressLink(id);
  assert.equal(link, 'https://gabrielw1005.github.io/machine-lab/?v=s3#s=' + id);
  assert.equal(link.length, 73);
});
test('roundtrip requires confirmed save, preserves token and sends no credentials or referrer', async () => {
  const token = 'z2.test'; let stored;
  const fetcher = async (url, options) => {
    assert.equal(url, service + '/v1/progress/' + id);
    assert.equal(options.credentials, 'omit'); assert.equal(options.redirect, 'error');
    assert.equal(options.referrerPolicy, 'no-referrer'); assert.equal(options.cache, 'no-store');
    if (options.method === 'PUT') { stored=JSON.parse(options.body).token; return json({id}, 201); }
    return json({token:stored});
  };
  assert.equal(await saveShortProgress(service, id, token, {fetcher}), id);
  assert.equal(await loadShortProgress(service, id, {fetcher}), token);
});
test('real compact progress preserves student, scores, recent attempts and current problem', async () => {
  const snapshot=normalizeProgress({student:'Test Student — Φ', savedAt:'2026-11-09T12:00:00Z',
    session:{mode:'balance',type:'ramp',variant:7,answer:'24',config:{type:'ramp',inputMass:24,outputMass:48,length:8,height:4}},
    stats:{attempts:50,correct:40,byMachine:{ramp:{attempts:50,correct:40}},
      recent:Array.from({length:50},(_,i)=>({at:1794225600000+i*1000,type:'ramp',mode:'balance',task:'balance',entry:String(i*2),correct:i<40,variant:i,variable:'inputMass'}))}});
  const token=await encodeProgress(snapshot); let stored;
  const fetcher=async(_,options)=>options.method==='PUT' ? (stored=JSON.parse(options.body).token,json({id},201)) : json({token:stored});
  await saveShortProgress(service,id,token,{fetcher});
  assert.deepEqual(await decodeProgress(await loadShortProgress(service,id,{fetcher})),snapshot);
});
test('rejects malformed IDs, origins and tokens before sending', async () => {
  const fetcher = () => { throw new Error('Unexpected network access'); };
  for (const origin of ['http://example.test', 'https://x:y@example.test', service+'/path', service+'?x=y'])
    await assert.rejects(loadShortProgress(origin,id,{fetcher}), /configured/);
  await assert.rejects(loadShortProgress(service,'bad',{fetcher}), /configured/);
  await assert.rejects(saveShortProgress(service,id,'invalid',{fetcher}), /cannot be shared/);
  await assert.rejects(saveShortProgress(service,id,'z2.'+'a'.repeat(12000),{fetcher}), /cannot be shared/);
});
test('does not accept login pages, corrupt content, oversized responses or missing records', async () => {
  await assert.rejects(loadShortProgress(service,id,{fetcher:async()=>new Response('<html>Sign in</html>')}), /unreadable/);
  await assert.rejects(loadShortProgress(service,id,{fetcher:async()=>json({token:'bad'})}), /cannot be shared/);
  await assert.rejects(loadShortProgress(service,id,{fetcher:async()=>json({token:'z2.'+'a'.repeat(15000)})}), /too large/);
  await assert.rejects(loadShortProgress(service,id,{fetcher:async()=>json({},404)}), /not found/);
  await assert.rejects(loadShortProgress(service,id,{fetcher:async()=>json({},429)}), /limit/);
  await assert.rejects(saveShortProgress(service,id,'z2.test',{fetcher:async()=>json({id:'wrong'})}), /verify/);
});
test('timeout aborts the request instead of leaving share pending', async () => {
  const fetcher = (_, {signal}) => new Promise((resolve,reject) => signal.addEventListener('abort',()=>reject(new Error('Aborted')),{once:true}));
  await assert.rejects(loadShortProgress(service,id,{fetcher, timeoutMs:5}), /Aborted/);
});
test('closing or replacing a preview can cancel its in-flight load', async () => {
  const controller = new AbortController();
  const fetcher = (_, {signal}) => new Promise((resolve,reject) => signal.addEventListener('abort',()=>reject(new Error('Cancelled')),{once:true}));
  const pending=loadShortProgress(service,id,{fetcher, signal:controller.signal});
  controller.abort();
  await assert.rejects(pending,/Cancelled/);
  await assert.rejects(loadShortProgress(service,id,{fetcher:()=>assert.fail('Must not send an already-cancelled request'),signal:controller.signal}), /abort/i);
});
