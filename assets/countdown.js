// Explicit +08:00 event time; calculations do not depend on the visitor's timezone.
(function (root) {
  function remaining(target, now) {
    const milliseconds = Date.parse(target) - now;
    if (!Number.isFinite(milliseconds)) return null;
    const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
    return {
      ended: milliseconds <= 0,
      days: Math.floor(seconds / 86400),
      hours: Math.floor(seconds % 86400 / 3600),
      minutes: Math.floor(seconds % 3600 / 60),
      seconds: seconds % 60
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { remaining };
  if (!root.document) return;
  const timer = document.querySelector('.countdown');
  const ended = document.querySelector('.countdown-ended');
  const target = root.LIBAR_CONTENT.event.startsAt;
  let interval;
  function update() {
    const state = remaining(target, Date.now());
    if (!state) return;
    timer.hidden = state.ended;
    ended.hidden = !state.ended;
    if (state.ended) {
      clearInterval(interval);
      return;
    }
    for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
      const field = timer.querySelector(`[data-count="${unit}"]`);
      field.textContent = String(state[unit]).padStart(2, '0');
      field.setAttribute('aria-label', `${state[unit]}${{ days: '天', hours: '小时', minutes: '分钟', seconds: '秒' }[unit]}`);
    }
  }
  interval = setInterval(update, 1000);
  update();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})(typeof window === 'undefined' ? globalThis : window);
