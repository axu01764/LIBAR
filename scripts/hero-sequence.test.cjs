const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const settle = () => new Promise(resolve => setImmediate(resolve));
function setup({ mobile = false, deferred = false, fail = false } = {}) {
  const pending = new Map(), drawn = [], closed = [], messages = [], events = [];
  const canvas = { width: 1440, height: 1000, getContext: () => ({ drawImage: bitmap => drawn.push(bitmap.id) }) };
  const context = { self: {}, AbortController,
    fetch: async () => ({ ok: !fail, blob: async () => ({}) }),
    createImageBitmap: async () => ({ width: 1440, height: 1000, close() {} }) };
  context.fetch = async url => ({ ok: !fail, blob: async () => Number(url.match(/(\d+)\.webp/)[1]) });
  context.createImageBitmap = id => {
    const make = () => ({ id, width: 1440, height: 1000, close: () => closed.push(id) });
    return deferred ? new Promise(resolve => pending.set(id, () => resolve(make()))) : Promise.resolve(make());
  };
  vm.runInNewContext(fs.readFileSync('assets/hero-renderer.js','utf8'),context);
  const renderer = context.self.createHeroRenderer(canvas, { baseUrl: '/frames', count: 120, mobile }, message => { events.push(message); if(message.type === "paint") messages.push(message); });
  return { renderer, canvas, pending, drawn, closed, messages, events };
}
test('120-frame selection reverses, clamps, avoids redundant drawing and disposes resources', async () => {
  const t = setup(); await settle(); assert.equal(t.drawn.at(-1), 0);
  t.renderer.setFrame(119); await settle(); assert.equal(t.drawn.at(-1),119);
  t.renderer.setFrame(60); await settle(); assert.equal(t.drawn.at(-1),60);
  t.renderer.setFrame(-20); await settle(); assert.equal(t.drawn.at(-1),0);
  const before = t.drawn.length; t.renderer.setFrame(0); await settle(); assert.equal(t.drawn.length,before);
  t.renderer.dispose(); t.renderer.setFrame(90); await settle(); assert.equal(t.drawn.length,before); assert.ok(t.closed.length>0);
});
test('prefetch warms both directions while decoded memory remains bounded', async () => {
  const t = setup({mobile:true}); await settle();
  t.renderer.setFrame(40); await settle();
  const misses = t.messages.at(-1).misses;
  t.renderer.setFrame(41); await settle(); t.renderer.setFrame(39); await settle();
  assert.equal(t.messages.at(-1).misses, misses);
  for(let frame=0;frame<120;frame+=5){t.renderer.setFrame(frame);await settle();}
  assert.ok(t.messages.every(x=>x.cached<=29)); // One newly decoded frame, then immediately trimmed to 28.
  t.renderer.dispose();
});
test('a decode completed after reversal cannot drag the image back to the old position', async () => {
  const t = setup({deferred:true}); await settle();
  t.pending.get(0)(); t.pending.get(1)(); await settle();
  t.renderer.setFrame(119);
  // Finish the two old prefetch jobs to allow the new priority queue to start.
  for(const [i,finish] of [...t.pending]) if(i<10)finish(); await settle();
  t.renderer.setFrame(25);
  for(const [i,finish] of [...t.pending]) finish(); await settle();
  for(const [i,finish] of [...t.pending]) if(i===25 || i===26)finish(); await settle();
  assert.equal(t.drawn.at(-1),25);
  for(const [i,finish] of [...t.pending]) if(i>100)finish(); await settle();
  assert.equal(t.drawn.at(-1),25); t.renderer.dispose();
});
test('failed assets preserve the poster; redundant resizes do not clear the canvas', async () => {
  const t = setup({fail:true}); await settle(); t.renderer.setFrame(90);await settle();
  assert.equal(t.drawn.length,0);t.renderer.dispose();
  const good=setup();await settle(); const draws=good.drawn.length;
  good.renderer.resize(1440,1000);assert.equal(good.drawn.length,draws);
  good.renderer.resize(720,500);assert.equal(good.drawn.length,draws+1);good.renderer.dispose();
});

test('entry readiness waits for all downloads and reports incomplete assets', async () => {
  const good=setup(); await settle(); assert.ok(good.events.some(e=>e.type==='loaded' && e.complete)); good.renderer.dispose();
  const bad=setup({fail:true}); await settle(); assert.ok(bad.events.some(e=>e.type==='loaded' && !e.complete)); bad.renderer.dispose();
});
