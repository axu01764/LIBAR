// Offline Cycles frames. Scroll position is the only playback clock, in either direction.
window.createHeroSequence = function (canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  if (!ctx || !window.createImageBitmap) return null;
  const mobile = matchMedia('(max-width: 699px)').matches;
  const count = mobile ? 36 : 60;
  const folder = mobile ? 'mobile' : 'desktop';
  const blobs = new Map();
  const bitmaps = new Map();
  const requests = new Map();
  const decodes = new Map();
  const failedAt = new Map();
  let desired = 0, painted = -1, disposed = false, ready = false;
  const abort = new AbortController();
  const url = (i) => `images/hero-sequence/${folder}/${String(i).padStart(3, '0')}.webp`;

  function fetchFrame(i) {
    if (blobs.has(i)) return Promise.resolve(blobs.get(i));
    if (Date.now() - (failedAt.get(i) || 0) < 1500) return Promise.reject(new Error('Frame retry deferred'));
    if (!requests.has(i)) requests.set(i, fetch(url(i), { signal: abort.signal })
      .then(response => { if (!response.ok) throw new Error('Frame unavailable'); return response.blob(); })
      .then(blob => { if (!disposed) blobs.set(i, blob); failedAt.delete(i); return blob; })
      .catch(error => { failedAt.set(i, Date.now()); throw error; })
      .finally(() => requests.delete(i)));
    return requests.get(i);
  }
  function trim() {
    // Bound decoded RGBA memory: at most 12 desktop or 10 mobile frames.
    const limit = mobile ? 10 : 12;
    while (bitmaps.size > limit) {
      const candidates = [...bitmaps.keys()].filter(i => i !== desired && i !== painted);
      candidates.sort((a, b) => Math.abs(b - desired) - Math.abs(a - desired));
      const key = candidates[0];
      if (key === undefined) break;
      bitmaps.get(key).close(); bitmaps.delete(key);
    }
  }
  function paint(force = false) {
    if (disposed || !bitmaps.has(desired) || (!force && painted === desired)) return;
    const image = bitmaps.get(desired);
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    ctx.drawImage(image, (canvas.width - image.width * scale) / 2, (canvas.height - image.height * scale) / 2, image.width * scale, image.height * scale);
    painted = desired;
    canvas.dataset.frame = String(painted);
    if (!ready) {
      ready = true;
      canvas.classList.add('is-ready');
      canvas.parentElement?.classList.add('sequence-ready');
    }
  }
  function decode(i) {
    if (disposed || i < 0 || i >= count) return Promise.resolve();
    if (bitmaps.has(i)) { if (i === desired) paint(); return Promise.resolve(); }
    if (!decodes.has(i)) decodes.set(i, fetchFrame(i).then(blob => {
      // Fast scroll may supersede a network request before it finishes.
      if (disposed || (i !== 0 && Math.abs(i - desired) > 4)) return null;
      return createImageBitmap(blob);
    }).then(bitmap => {
      if (!bitmap) return;
      if (disposed) { bitmap.close(); return; }
      bitmaps.set(i, bitmap); paint(); trim();
    }).catch(() => { /* Keep the poster/current frame on slow or failed requests. */ })
      .finally(() => decodes.delete(i)));
    return decodes.get(i);
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(rect.width * dpr);
    canvas.height = Math.round(rect.height * dpr);
    paint(true);
  }
  const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
  // Download compressed frames with three workers, never decode the whole sequence at once.
  async function preload() {
    let next = 1;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < count && !disposed) {
        const i = next++;
        try { await fetchFrame(i); } catch { /* On-demand decode may retry later. */ }
      }
    }));
  }
  decode(0).then(() => { if (!disposed) { decode(1); preload(); } });
  return {
    setProgress(progress) {
      const next = Math.round(Math.max(0, Math.min(1, progress)) * (count - 1));
      const direction = next >= desired ? 1 : -1;
      desired = next;
      decode(desired);
      // Prioritize the requested frame; decode its neighbors only after it is ready.
      decode(desired).then(() => {
        if (!disposed && desired === next) for (let step = 1; step <= 3; step++) decode(next + step * direction);
      });
    },
    dispose() {
      disposed = true; abort.abort(); observer.disconnect();
      for (const bitmap of bitmaps.values()) bitmap.close();
      bitmaps.clear(); blobs.clear(); canvas.classList.remove('is-ready');
      canvas.parentElement?.classList.remove('sequence-ready');
    }
  };
};
