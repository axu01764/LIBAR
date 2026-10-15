// Shared OffscreenCanvas worker/main-thread renderer, independent of DOM and scroll events.
self.createHeroRenderer = function (canvas, options, notify) {
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  if (!ctx) throw new Error('Canvas unavailable');
  const { baseUrl, count, mobile } = options;
  const limit = mobile ? 28 : 16, ahead = mobile ? 17 : 9, behind = mobile ? 8 : 4;
  const blobs = new Map(), bitmaps = new Map(), requests = new Map(), failed = new Map();
  const decoding = new Set(), abort = new AbortController();
  let desired = 0, painted = -1, direction = 1, disposed = false, queue = [];
  let drawCount = 0, missCount = 0;
  const frameUrl = i => `${baseUrl}/${String(i).padStart(3, '0')}.webp`;
  function fetchFrame(i) {
    if (blobs.has(i)) return Promise.resolve(blobs.get(i));
    if (Date.now() - (failed.get(i) || 0) < 1500) return Promise.reject(new Error('Retry deferred'));
    if (!requests.has(i)) requests.set(i, fetch(frameUrl(i), { signal: abort.signal })
      .then(response => { if (!response.ok) throw new Error('Frame unavailable'); return response.blob(); })
      .then(blob => { if (!disposed) blobs.set(i, blob); failed.delete(i); return blob; })
      .catch(error => { failed.set(i, Date.now()); throw error; })
      .finally(() => requests.delete(i)));
    return requests.get(i);
  }
  function trim() {
    while (bitmaps.size > limit) {
      const keys = [...bitmaps.keys()].filter(i => i !== desired && i !== painted);
      keys.sort((a, b) => Math.abs(b - desired) - Math.abs(a - desired));
      if (!keys.length) break;
      bitmaps.get(keys[0]).close(); bitmaps.delete(keys[0]);
    }
  }
  function paint(force = false) {
    if (disposed) return;
    let best = bitmaps.has(desired) ? desired : painted;
    if (!bitmaps.has(desired)) {
      // Advance through available frames toward the requested position; never rewind on a late decode.
      for (const i of bitmaps.keys()) {
        const between = painted < 0 || (i >= Math.min(painted, desired) && i <= Math.max(painted, desired));
        if (between && (best < 0 || Math.abs(i - desired) < Math.abs(best - desired))) best = i;
      }
    }
    if (!bitmaps.has(best) || (!force && painted === best)) return;
    const image = bitmaps.get(best);
    const scale = Math.max(canvas.width / image.width, canvas.height / image.height);
    ctx.drawImage(image, (canvas.width - image.width * scale) / 2, (canvas.height - image.height * scale) / 2, image.width * scale, image.height * scale);
    painted = best; drawCount++;
    notify({ type: 'paint', frame: painted, desired, cached: bitmaps.size, draws: drawCount, misses: missCount });
  }
  function plan() {
    const wanted = [desired];
    for (let i = 1; i <= Math.max(ahead, behind); i++) {
      if (i <= ahead) wanted.push(desired + i * direction);
      if (i <= behind) wanted.push(desired - i * direction);
    }
    queue = wanted.filter(i => i >= 0 && i < count && !bitmaps.has(i) && !decoding.has(i) && Date.now() - (failed.get(i) || 0) >= 1500);
    pump();
  }
  function pump() {
    while (!disposed && decoding.size < 2 && queue.length) {
      const i = queue.shift(); decoding.add(i);
      fetchFrame(i).then(blob => {
        if (disposed || Math.abs(i - desired) > ahead + behind) return null;
        return createImageBitmap(blob);
      }).then(bitmap => {
        if (!bitmap) return;
        if (disposed) { bitmap.close(); return; }
        bitmaps.set(i, bitmap); paint(); trim();
      }).catch(() => { /* Keep the poster or last valid frame. */ })
        .finally(() => { decoding.delete(i); pump(); });
    }
  }
  async function preload() {
    let next = 0;
    await Promise.all(Array.from({ length: 3 }, async () => {
      while (next < count && !disposed) {
        const i = next++;
        try { await fetchFrame(i); } catch { /* A future scroll may retry. */ }
      }
    }));
  }
  plan(); preload();
  return {
    setFrame(next) {
      if (disposed) return;
      next = Math.max(0, Math.min(count - 1, Math.round(next)));
      if (next === desired) return;
      direction = next > desired ? 1 : -1; desired = next;
      if (!bitmaps.has(desired)) missCount++;
      paint(); plan();
    },
    resize(width, height) {
      if (disposed || (canvas.width === width && canvas.height === height)) return;
      canvas.width = width; canvas.height = height; paint(true);
    },
    dispose() {
      disposed = true; queue = []; abort.abort();
      for (const bitmap of bitmaps.values()) bitmap.close();
      bitmaps.clear(); blobs.clear();
    }
  };
};
