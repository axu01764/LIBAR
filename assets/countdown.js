// Explicit +08:00 event time; calculations do not depend on the visitor's timezone.
(function (root) {
  function remaining(target, now) {
    const milliseconds = Date.parse(target) - now;
    if (!Number.isFinite(milliseconds)) return null;
    const started = milliseconds <= 0;
    const seconds = started ? Math.floor(Math.abs(milliseconds) / 1000) : Math.ceil(milliseconds / 1000);
    return {
      started,
      days: Math.floor(seconds / 86400),
      hours: Math.floor(seconds % 86400 / 3600),
      minutes: Math.floor(seconds % 3600 / 60),
      seconds: seconds % 60
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { remaining };
  if (!root.document) return;
  const timer = document.querySelector('.countdown');
  const status = document.querySelector('.countdown-status');
  const target = root.LIBAR_CONTENT.event.startsAt;
  function update() {
    const state = remaining(target, Date.now());
    if (!state) return;
    timer.hidden = false;
    const mode = state.started ? 'elapsed' : 'remaining';
    if (timer.dataset.mode !== mode) {
      timer.dataset.mode = mode;
      status.textContent = state.started ? 'EVENT IN PROGRESS' : '距离复活';
      status.classList.toggle('is-live', state.started);
      timer.setAttribute('aria-label', state.started ? '活动已开始时长' : '活动倒计时');
      document.querySelector('.entry-screen').setAttribute('aria-label', state.started ? '活动正向计时' : '活动倒计时');
    }
    for (const unit of ['days', 'hours', 'minutes', 'seconds']) {
      const field = timer.querySelector(`[data-count="${unit}"]`);
      field.textContent = String(state[unit]).padStart(2, '0');
      field.setAttribute('aria-label', `${state[unit]}${{ days: '天', hours: '小时', minutes: '分钟', seconds: '秒' }[unit]}`);
    }
  }
  setInterval(update, 1000);
  update();
  document.addEventListener('visibilitychange', () => { if (!document.hidden) update(); });
})(typeof window === 'undefined' ? globalThis : window);
