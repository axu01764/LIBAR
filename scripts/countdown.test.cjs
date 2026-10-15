const assert = require('node:assert/strict');
const { remaining } = require('../assets/countdown.js');
const { event } = require('../site-content.json');
const target = '2026-10-20T19:00:00+08:00';
assert.equal(event.startsAt, target);
assert.equal(Date.parse(target), Date.parse('2026-10-20T11:00:00Z'));
for (const timezone of ['Asia/Shanghai', 'America/Los_Angeles', 'Europe/London']) {
  process.env.TZ = timezone;
  assert.deepEqual(remaining(target, Date.parse('2026-10-19T10:59:59Z')), {
    ended: false, days: 1, hours: 0, minutes: 0, seconds: 1
  });
}
assert.deepEqual(remaining(target, Date.parse('2026-10-20T10:59:59.500Z')), {
  ended: false, days: 0, hours: 0, minutes: 0, seconds: 1
});
for (const now of [Date.parse(target), Date.parse(target) + 1000, Date.parse(target) + 86400000]) {
  assert.deepEqual(remaining(target, now), { ended: true, days: 0, hours: 0, minutes: 0, seconds: 0 });
}
assert.equal(remaining('invalid date', Date.now()), null);
console.log('Countdown passed: UTC+8 target, three visitor timezones, second boundary, at/after start, invalid input.');
