(() => {
  const navToggle = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#site-nav');
  function closeNav() {
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    navToggle.textContent = '菜单';
  }
  navToggle.addEventListener('click', () => {
    const open = navToggle.getAttribute('aria-expanded') !== 'true';
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.textContent = open ? '关闭' : '菜单';
    nav.classList.toggle('is-open', open);
  });
  nav.addEventListener('click', (event) => { if (event.target.closest('a')) closeNav(); });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && nav.classList.contains('is-open')) { closeNav(); navToggle.focus(); }
  });
  document.querySelector('[data-copy]').addEventListener('click', async (event) => {
    const number = event.currentTarget.dataset.copy;
    const status = document.querySelector('#copy-status');
    try { await navigator.clipboard.writeText(number); status.textContent = '微信号已复制'; }
    catch { status.textContent = `请长按或选中复制：${number}`; }
  });

  const dialog = document.querySelector('.photo-dialog');
  const photos = window.LIBAR_CONTENT.moments;
  let photoIndex = 0;
  let opener;
  function displayPhoto(index) {
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    dialog.querySelector('img').src = photo.src;
    dialog.querySelector('img').alt = photo.alt;
    dialog.querySelector('.photo-caption').textContent = photo.alt;
    dialog.querySelector('.photo-counter').textContent = `${photoIndex + 1} / ${photos.length}`;
  }
  document.querySelectorAll('[data-photo]').forEach((link) => link.addEventListener('click', (event) => {
    if (typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    opener = link;
    displayPhoto(Number(link.dataset.photo));
    dialog.showModal();
    document.body.style.overflow = 'hidden';
  }));
  dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-gallery-prev]').addEventListener('click', () => displayPhoto(photoIndex - 1));
  dialog.querySelector('[data-gallery-next]').addEventListener('click', () => displayPhoto(photoIndex + 1));
  dialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowRight') { event.preventDefault(); displayPhoto(photoIndex + 1); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); displayPhoto(photoIndex - 1); }
  });
  dialog.addEventListener('close', () => { document.body.style.overflow = ''; opener?.focus(); });

  // Every public section is readable before animation or if animation cannot load.
  if (!window.gsap || !window.ScrollTrigger || navigator.connection?.saveData) return;
  gsap.registerPlugin(ScrollTrigger);
  const media = gsap.matchMedia();
  media.add('(prefers-reduced-motion: no-preference)', () => {
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) if (entry.isIntersecting) {
        gsap.fromTo(entry.target, { y: 22, opacity: .35 }, { y: 0, opacity: 1, duration: .7, ease: 'power2.out', clearProps: 'all' });
        observer.unobserve(entry.target);
      }
    }, { threshold: .08 });
    document.querySelectorAll('[data-reveal]').forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  });
  media.add('(min-width: 1000px) and (prefers-reduced-motion: no-preference)', () => {
    document.documentElement.classList.add('motion-ready');
    const timeline = gsap.timeline({ scrollTrigger: { trigger: '.hero-story', start: 'top top', end: 'bottom bottom', scrub: .35, invalidateOnRefresh: true } });
    timeline.to('.hero-left', { x: -35, autoAlpha: 0, duration: .25 }, .15)
      .to('.hero-right', { x: 35, autoAlpha: 0, duration: .25 }, .15)
      .to('.hero-bottom', { autoAlpha: 0, duration: .2 }, .1)
      .to('.hero-image', { scale: 1.07, yPercent: -2, duration: .6, ease: 'none' }, .15)
      .to('.hero-image', { opacity: .13, scale: 1.02, duration: .25 }, .75)
      .fromTo('.hero-transition', { y: 25, autoAlpha: 0 }, { y: 0, autoAlpha: 1, duration: .25 }, .75);
    ScrollTrigger.refresh();
    return () => document.documentElement.classList.remove('motion-ready');
  });
  media.add('(max-width: 999px) and (prefers-reduced-motion: no-preference)', () => {
    gsap.to('.hero-image', { y: 24, scale: 1.025, ease: 'none', scrollTrigger: { trigger: '.hero-stage', start: 'top top', end: 'bottom top', scrub: .3 } });
  });
})();
