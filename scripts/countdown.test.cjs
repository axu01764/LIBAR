const assert = require('node:assert/strict');
const { remaining } = require('../assets/countdown.js');
const { event } = require('../site-content.json');
const target = '2026-10-20T19:00:00+08:00';
assert.equal(event.startsAt, target);
assert.equal(Date.parse(target), Date.parse('2026-10-20T11:00:00Z'));
for (const timezone of ['Asia/Shanghai', 'America/Los_Angeles', 'Europe/London']) {
  process.env.TZ = timezone;
  assert.deepEqual(remaining(target, Date.parse('2026-10-19T10:59:59Z')), {
    started: false, days: 1, hours: 0, minutes: 0, seconds: 1
  });
}
assert.deepEqual(remaining(target, Date.parse('2026-10-20T10:59:59.500Z')), {
  started: false, days: 0, hours: 0, minutes: 0, seconds: 1
});
for (const [offset, expected] of [
  [0, { days: 0, hours: 0, minutes: 0, seconds: 0 }],
  [999, { days: 0, hours: 0, minutes: 0, seconds: 0 }],
  [1000, { days: 0, hours: 0, minutes: 0, seconds: 1 }],
  [86400000, { days: 1, hours: 0, minutes: 0, seconds: 0 }],
  [95707000, { days: 1, hours: 2, minutes: 35, seconds: 7 }]
]) {
  assert.deepEqual(remaining(target, Date.parse(target) + offset), { started: true, ...expected });
}
assert.equal(remaining('invalid date', Date.now()), null);
// A page left open across 19:00 switches direction and keeps ticking.
const vm = require('node:vm');
const fs = require('node:fs');
let now = Date.parse(target) - 500, tick;
const fields = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map(unit => [unit, { setAttribute() {} }]));
const timer = { hidden: true, dataset: {}, setAttribute() {}, querySelector: selector => fields[selector.match(/"(.*?)"/)[1]] };
const status = { textContent: '', classList: { toggle() {} } };
const screen = { setAttribute() {} };
const document = { querySelector: selector => ({ '.countdown': timer, '.countdown-status': status, '.entry-screen': screen }[selector]), addEventListener() {} };
vm.runInNewContext(fs.readFileSync('assets/countdown.js', 'utf8'), {
  window: { document, LIBAR_CONTENT: { event: { startsAt: target } } }, document,
  Date: { parse: Date.parse, now: () => now }, setInterval: callback => { tick = callback; }
});
assert.equal(timer.dataset.mode, 'remaining');
assert.equal(fields.seconds.textContent, '01');
now = Date.parse(target); tick();
assert.equal(timer.dataset.mode, 'elapsed');
assert.equal(timer.hidden, false);
assert.equal(status.textContent, 'EVENT IN PROGRESS');
now += 2000; tick();
assert.equal(fields.seconds.textContent, '02');
console.log('Countdown passed: UTC+8, visitor timezones, countdown-to-elapsed boundary, elapsed days, and continued browser updates.');
