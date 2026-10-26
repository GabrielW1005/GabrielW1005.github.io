export function createAutoAdvance({onAdvance,schedule = setTimeout,unschedule = clearTimeout}) {
  let pending = null, timer = null;
  function cancel() {
    if (timer !== null) unschedule(timer);
    timer = null; pending = null;
  }
  function finish(expected) {
    if (!pending || pending !== expected) return false;
    const next = pending; cancel(); onAdvance(next); return true;
  }
  return {
    start(value,delay = 3000) { cancel(); pending = {...value}; const expected = pending; timer = schedule(()=>finish(expected),delay); return pending; },
    cancel,
    nextNow() { return finish(pending); },
    get pending() { return pending; }
  };
}
