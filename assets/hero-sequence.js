window.createHeroSequence = function (canvas) {
  if (!window.createImageBitmap || !window.createHeroRenderer) return null;
  const mobile = matchMedia('(max-width: 699px)').matches;
  const count = 120;
  const options = { mobile, count, baseUrl: new URL(`images/hero-sequence/v2/${mobile ? 'mobile' : 'desktop'}`, document.baseURI).href };
  let worker, renderer, disposed = false, transferred = false, raf = 0, pending = 0, sent = -1;
  let loaded = false, painted = false;
  const ready = () => { if (loaded && painted) window.entryGate?.finish(); };
  function restoreCanvas() {
    if (!transferred) return;
    // A transferred canvas cannot be transferred a second time after motion preferences change.
    const fresh = canvas.cloneNode(false);
    fresh.removeAttribute('style');
    for (const key of ['frame', 'cache', 'draws', 'misses', 'renderer']) delete fresh.dataset[key];
    canvas.replaceWith(fresh);
  }
  function onPaint(data) {
    if (disposed) return;
    if (data.type === 'loaded') {
      loaded = data.complete;
      if (!loaded) fallback();
      else ready();
      return;
    }
    if (data.type !== 'paint') return;
    painted = true;
    canvas.dataset.frame = String(data.frame);
    canvas.dataset.cache = String(data.cached);
    canvas.dataset.draws = String(data.draws);
    canvas.dataset.misses = String(data.misses);
    canvas.classList.add('is-ready');
    canvas.parentElement?.classList.add('sequence-ready');
    ready();
  }
  function fallback() {
    worker?.terminate();
    renderer?.dispose();
    canvas.classList.remove('is-ready');
    canvas.parentElement?.classList.remove('sequence-ready');
    canvas.dataset.renderer = 'poster';
    window.entryGate?.finish('fallback');
  }
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(devicePixelRatio || 1, mobile ? 1.25 : 1.5);
  canvas.width = Math.round(rect.width * dpr); canvas.height = Math.round(rect.height * dpr);
  if (window.Worker && canvas.transferControlToOffscreen) {
    try {
      worker = new Worker('assets/hero-worker.js');
      worker.onmessage = event => onPaint(event.data);
      worker.onerror = fallback;
      const surface = canvas.transferControlToOffscreen();
      transferred = true;
      worker.postMessage({ type: 'init', canvas: surface, options }, [surface]);
      canvas.dataset.renderer = 'worker';
    } catch { fallback(); restoreCanvas(); return null; }
  } else {
    try { renderer = window.createHeroRenderer(canvas, options, onPaint); canvas.dataset.renderer = 'main'; }
    catch { return null; }
  }
  let width = canvas.width, height = canvas.height;
  const observer = new ResizeObserver(() => {
    const box = canvas.getBoundingClientRect();
    const w = Math.round(box.width * dpr), h = Math.round(box.height * dpr);
    if (w === width && h === height) return;
    width = w; height = h;
    if (worker) worker.postMessage({ type: 'resize', width, height });
    else renderer?.resize(width, height);
  });
  observer.observe(canvas);
  window.addEventListener('hero-fallback', fallback);
  return {
    setProgress(progress) {
      if (disposed) return;
      pending = Math.round(Math.max(0, Math.min(1, progress)) * (count - 1));
      if (raf || pending === sent) return;
      raf = requestAnimationFrame(() => {
        raf = 0; if (disposed || pending === sent) return;
        sent = pending;
        if (worker) worker.postMessage({ type: 'frame', frame: sent });
        else renderer?.setFrame(sent);
      });
    },
    dispose() {
      disposed = true; cancelAnimationFrame(raf); observer.disconnect();
      window.removeEventListener('hero-fallback', fallback);
      renderer?.dispose(); worker?.terminate();
      canvas.classList.remove('is-ready'); canvas.parentElement?.classList.remove('sequence-ready');
      restoreCanvas();
    }
  };
};
