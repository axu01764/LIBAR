const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

test('scroll frame selection reverses, clamps and disposes decoded resources', async () => {
  const drawn = [], closed = [], fetched = [];
  const canvas = { width: 0, height: 0, dataset: {},
    classList: { add() {}, remove() {} }, getBoundingClientRect: () => ({ width: 1440, height: 1000 }),
    getContext: () => ({ drawImage: bitmap => drawn.push(bitmap.id) }) };
  const context = { window: {}, matchMedia: () => ({ matches: false }), devicePixelRatio: 1, AbortController,
    ResizeObserver: class { observe() {} disconnect() {} },
    fetch: async url => { fetched.push(url); return { ok: true, blob: async () => Number(url.match(/(\d+)\.webp/)[1]) }; },
    createImageBitmap: async id => ({ id, width: 1440, height: 1000, close: () => closed.push(id) }) };
  context.window.createImageBitmap = context.createImageBitmap;
  vm.runInNewContext(fs.readFileSync('assets/hero-sequence.js', 'utf8'), context);
  const sequence = context.window.createHeroSequence(canvas);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle();
  assert.equal(canvas.dataset.frame, '0');
  sequence.setProgress(1); await settle(); assert.equal(canvas.dataset.frame, '59');
  sequence.setProgress(.5); await settle(); assert.equal(canvas.dataset.frame, '30');
  sequence.setProgress(-1); await settle(); assert.equal(canvas.dataset.frame, '0');
  assert.ok(fetched.every(url => url.includes('/desktop/')));
  sequence.dispose();
  const previous = drawn.length;
  sequence.setProgress(.7); await settle();
  assert.equal(drawn.length, previous);
  assert.ok(closed.length > 0);
});

test('a late frame cannot overwrite the position selected by reverse scroll', async () => {
  const pending = new Map();
  const canvas = { dataset: {}, classList: { add() {}, remove() {} },
    getBoundingClientRect: () => ({ width: 390, height: 450 }),
    getContext: () => ({ drawImage() {} }) };
  const context = { window: {}, matchMedia: () => ({ matches: true }), devicePixelRatio: 2, AbortController,
    ResizeObserver: class { observe() {} disconnect() {} },
    fetch: async url => ({ ok: true, blob: async () => Number(url.match(/(\d+)\.webp/)[1]) }),
    createImageBitmap: id => new Promise(resolve => pending.set(id, () => resolve({ id, width: 864, height: 600, close() {} }))) };
  context.window.createImageBitmap = context.createImageBitmap;
  vm.runInNewContext(fs.readFileSync('assets/hero-sequence.js', 'utf8'), context);
  const sequence = context.window.createHeroSequence(canvas);
  const settle = () => new Promise(resolve => setImmediate(resolve));
  await settle(); pending.get(0)(); await settle();
  sequence.setProgress(1); await settle();
  sequence.setProgress(.2); await settle();
  pending.get(7)(); await settle(); assert.equal(canvas.dataset.frame, '7');
  pending.get(35)(); await settle(); assert.equal(canvas.dataset.frame, '7');
  sequence.dispose();
});

test('unavailable frames leave the static poster visible without rejecting', async () => {
  let shown = false;
  const canvas = { dataset: {}, classList: { add() { shown = true; }, remove() {} },
    getBoundingClientRect: () => ({ width: 1440, height: 900 }), getContext: () => ({ drawImage() {} }) };
  const context = { window: {}, matchMedia: () => ({ matches: false }), devicePixelRatio: 1, AbortController,
    ResizeObserver: class { observe() {} disconnect() {} },
    fetch: async () => ({ ok: false }), createImageBitmap: async () => { throw new Error('Must not decode missing frames'); } };
  context.window.createImageBitmap = context.createImageBitmap;
  vm.runInNewContext(fs.readFileSync('assets/hero-sequence.js', 'utf8'), context);
  const sequence = context.window.createHeroSequence(canvas);
  await new Promise(resolve => setImmediate(resolve));
  sequence.setProgress(.8);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(shown, false);
  assert.equal(canvas.dataset.frame, undefined);
  sequence.dispose();
});
