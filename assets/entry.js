// Activate before the first paint; without JavaScript the static site remains accessible.
(() => {
  const root = document.documentElement;
  root.classList.add('entry-loading');
  const started = Date.now();
  let finishing = false;
  const watchdog = setTimeout(() => finish('fallback'), 45000);
  function finish(reason = 'ready') {
    if (finishing) return;
    finishing = true;
    clearTimeout(watchdog);
    if (reason === 'fallback') window.dispatchEvent(new Event('hero-fallback'));
    setTimeout(() => {
      const screen = document.querySelector('.entry-screen');
      screen?.setAttribute('aria-busy', 'false');
      screen?.classList.add('is-leaving');
      window.scrollTo({ top: 0, behavior: 'instant' });
      setTimeout(() => {
        if (screen) screen.hidden = true;
        root.classList.remove('entry-loading');
        root.dataset.entryState = reason;
        const app = document.querySelector('#app');
        if (app) app.inert = false;
        window.dispatchEvent(new Event('entry-open'));
      }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 650);
    }, Math.max(0, 1000 - (Date.now() - started)));
  }
  window.entryGate = { finish };
  document.addEventListener('DOMContentLoaded', () => {
    if (root.classList.contains('entry-loading')) document.querySelector('#app').inert = true;
  });
})();
