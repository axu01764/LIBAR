const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
function setup() {
  let now = 0, id = 0;
  const timers = new Map(), events = [], classes = new Set();
  const root = { classList: { add: x => classes.add(x), remove: x => classes.delete(x), contains: x => classes.has(x) }, dataset: {} };
  const app = { inert: false }, screen = { hidden: false, setAttribute() {}, classList: { add() {} } };
  const document = { documentElement: root, querySelector: s => s === '#app' ? app : screen, addEventListener: (_, fn) => fn() };
  const window = { scrollTo() {}, dispatchEvent: e => events.push(e.type) };
  vm.runInNewContext(fs.readFileSync('assets/entry.js', 'utf8'), {
    document, window, Date: { now: () => now }, Event: class { constructor(type) { this.type = type; } },
    matchMedia: () => ({ matches: false }),
    setTimeout: (fn, delay) => { timers.set(++id, { fn, due: now + delay }); return id; }, clearTimeout: id => timers.delete(id)
  });
  function advance(end) {
    while (true) {
      const next = [...timers].sort((a,b)=>a[1].due-b[1].due)[0];
      if (!next || next[1].due > end) break;
      now = next[1].due; timers.delete(next[0]); next[1].fn();
    }
    now = end;
  }
  return { root, app, screen, events, advance, finish: window.entryGate.finish };
}
test('entry remains locked until ready, then releases once after the fade', () => {
  const t=setup(); t.advance(5000); assert.equal(t.app.inert,true); assert.equal(t.screen.hidden,false);
  t.finish(); t.advance(5649); assert.equal(t.app.inert,true);
  t.advance(5650); assert.equal(t.app.inert,false); assert.equal(t.screen.hidden,true); assert.equal(t.root.dataset.entryState,'ready');
  t.finish(); t.advance(60000); assert.deepEqual(t.events,['entry-open']);
});
test('stalled loading falls back to a usable static page', () => {
  const t=setup(); t.advance(45000); assert.deepEqual(t.events,['hero-fallback']);
  t.advance(45650); assert.equal(t.app.inert,false); assert.equal(t.root.dataset.entryState,'fallback'); assert.equal(t.screen.hidden,true);
});
