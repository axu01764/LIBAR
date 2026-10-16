import { readFileSync, writeFileSync, mkdirSync, copyFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
for (const [device, count] of [['desktop', 120], ['mobile', 120]]) {
  for (let i = 0; i < count; i++) {
    const frame = `images/hero-sequence/v2/${device}/${String(i).padStart(3, '0')}.webp`;
    if (!existsSync(frame)) throw new Error(`Missing rendered hero frame: ${frame}`);
  }
}
const content = JSON.parse(readFileSync('site-content.json', 'utf8'));
const { event, drinks, moments } = content;
const [year, month, day] = event.date.split('-').map(Number);
const dateChinese = `${month} 月 ${day} 日`;
const dateShort = `${month}/${day}`;
const dateEnglish = new Intl.DateTimeFormat('en-US', {month: 'short', timeZone: 'Asia/Shanghai'}).format(new Date(event.startsAt)).toUpperCase() + '. ' + day;
const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
const e = Object.fromEntries(Object.entries(event).map(([key, value]) => [key, esc(value)]));
mkdirSync('assets/vendor', { recursive: true });
for (const [source, target] of [
  ['vue/dist/vue.global.prod.js', 'vue.js'],
  ['gsap/dist/gsap.min.js', 'gsap.js'],
  ['gsap/dist/ScrollTrigger.min.js', 'ScrollTrigger.js'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-normal.woff2', 'cormorant-regular.woff2'],
  ['@fontsource/cormorant-garamond/files/cormorant-garamond-latin-400-italic.woff2', 'cormorant-italic.woff2']
]) copyFileSync(`node_modules/${source}`, `assets/vendor/${target}`);
writeFileSync('assets/content.js', `// Generated from site-content.json by npm run build.\nwindow.LIBAR_CONTENT = ${JSON.stringify(content).replace(/</g, '\\u003c')};\n`);

const menu = drinks.map((drink, i) => `<article class="menu-item" data-reveal>
  <div class="menu-item-border">
    <h3><span class="drink-name">${esc(drink.name)}</span><span class="drink-name-cn">${esc(drink.subName)}</span></h3>
    <span class="drink-price" aria-label="${esc(drink.price)}元">${esc(drink.price)}</span>
  </div>
  <p class="drink-type">${esc(drink.tags)}</p>
  <p class="drink-description">${esc(drink.desc).replace(/\n/g, '<br>')}</p>
</article>`).join('\n');
const gallery = moments.map((photo, i) => `<figure class="moment" data-reveal>
  <a class="photo-link" href="${esc(photo.src)}" data-photo="${i}" aria-label="放大照片：${esc(photo.alt)}">
    <img src="${esc(photo.src)}" alt="${esc(photo.alt)}" loading="lazy" decoding="async" width="800" height="1000">
  </a>
  <figcaption>${esc(photo.caption)}</figcaption>
</figure>`).join('\n');

const publicPage = `<div class="public-site" :class="{'site-hidden': showPos || showWheel}">
<a class="skip-link" href="#menu">跳至酒单</a>
<header class="site-header">
  <a href="#home" class="brand" aria-label="理 BAR 首页">理 <span>BAR</span></a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav">菜单</button>
  <nav id="site-nav" aria-label="主导航">
    <a href="#event">本次活动<span>THE EVENT</span></a>
    <a href="#menu">酒单<span>OUR MENU</span></a>
    <a href="#moments">片刻<span>MOMENTS</span></a>
    <a href="#visit">找到我们<span>FIND US</span></a>
  </nav>
</header>
<main>
  <section id="home" class="hero-story" aria-labelledby="hero-title">
    <div class="hero-stage">
      <picture><source media="(max-width: 699px)" srcset="images/hero-sequence/v2/poster-mobile.webp"><img class="hero-image" src="images/hero-sequence/v2/poster.webp" alt="深酒红光影中，一只盛着清澈酒液与橄榄的高脚鸡尾酒杯" width="1440" height="1000" fetchpriority="high" decoding="async"></picture>
      <canvas class="hero-canvas" aria-hidden="true"></canvas>
      <div class="hero-left">
        <h1 id="hero-title"><span class="hero-chinese">${e.name}</span><span class="hero-english">${e.english}.</span></h1>
        <p class="hero-tagline">${e.intro}</p>
      </div>
      <div class="hero-right">
        <p class="hero-invitation">夜色里相聚，<br>杯盏间重逢。</p>
        <a class="text-link hero-cta" href="#menu">查看酒单 <span>OUR MENU</span></a>
      </div>
      <div class="hero-transition" aria-hidden="true"><p class="eyebrow">LI BAR · BACK TO THE NIGHT</p><p class="transition-title">${e.name}</p><p>${e.displayDate} &nbsp; / &nbsp; ${e.time}</p><p>${e.location}</p></div>
      <div class="hero-bottom"><span>ALAN</span><a href="#event">向下探索 <span class="scroll-rule" aria-hidden="true"></span> SCROLL TO DISCOVER</a><span>GIN</span></div>
    </div>
  </section>

  <section id="event" class="event-section section-pad" aria-labelledby="event-title">
    <div class="event-grid">
      <div data-reveal><h2 id="event-title">${e.name}<em>${e.english}.</em></h2></div>
      <div class="event-copy" data-reveal><h3>${e.intro}</h3><p>${e.description}</p>
        <dl class="event-details"><div><dt class="sr-only">时间</dt><dd><time datetime="${e.date}">${dateChinese}</time><small>${e.time}</small></dd></div><div><dt class="sr-only">地点</dt><dd>${e.location}<small>华东理工大学 · 奉贤校区</small></dd></div></dl>

      </div>
    </div>
  </section>

  <section id="menu" class="menu-section section-pad" aria-labelledby="menu-title">
    <div class="menu-heading" data-reveal><h2 id="menu-title">The Menu</h2></div>
    <div class="menu-grid">${menu}</div>
    <div class="menu-footnote"><span>欢迎与我们沟通风味偏好。</span></div>
  </section>

  <section class="bartender-section" aria-label="调酒师介绍">
    <figure class="bartender-portrait" data-reveal>
      <p class="bartender-label">new bartender</p>
      <div class="portrait-frame"><img src="images/jill-st.jpg" alt="调酒师 Jill.St" width="1080" height="1920" loading="lazy" decoding="async"></div>
      <figcaption>Jill.St</figcaption>
    </figure>
  </section>

  <section id="moments" class="moments-section section-pad" aria-labelledby="moments-title">
    <div class="moments-heading" data-reveal><h2 id="moments-title">A little of<br><em>the night.</em></h2></div>
    <div class="moments-grid">${gallery}</div>
    <p class="gallery-hint">往期活动记录</p>
  </section>

  <section id="visit" class="visit-section section-pad" aria-labelledby="visit-title">
    <div class="visit-grid"><div data-reveal><h2 id="visit-title">Find Us</h2></div>
      <div class="visit-info" data-reveal>
        <button class="text-link copy-wechat" type="button" data-copy="17601382093">微信 17601382093 <span>点击复制</span></button>
        <p id="copy-status" class="copy-status" role="status" aria-live="polite"></p>
        <div class="social-links"><a href="https://b23.tv/KLiRgD0" target="_blank" rel="noopener noreferrer">bilibili</a><a href="https://xhslink.com/m/9IN1QDcfLlw" target="_blank" rel="noopener noreferrer">小红书</a><a href="#menu">酒单</a></div>
      </div>
    </div>
    <footer class="site-footer"><button @click="enterPos" class="pos-entry" type="button" aria-label="打开点单系统">© ${year} LI BAR</button><p>Synchronicity is an ever-present reality.</p><a href="#home">回到顶部 / BACK TO TOP</a></footer>
  </section>
</main>
<dialog class="photo-dialog" aria-label="往期活动照片"><div class="photo-dialog-content"><img alt=""><p class="photo-caption"></p></div><div class="photo-navigation"><button type="button" data-gallery-prev>上一张</button><span class="photo-counter" aria-live="polite"></span><button type="button" data-gallery-next>下一张</button></div></dialog>
</div>`;

const pos = readFileSync('scripts/pos-template.html', 'utf8');
const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <script src="assets/entry.js"></script>
  <meta name="theme-color" content="#260c0b">
  <meta name="description" content="理 BAR 本期活动「${e.name}」：${dateChinese}，${e.time}，华东理工大学${e.location}。查看本期四款鸡尾酒酒单。">
  <title>${e.name} · ${dateShort} — 理 BAR</title>
  <link rel="icon" href="favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="favicon.png">
  <link rel="preload" href="images/hero-sequence/v2/poster.webp" as="image" media="(min-width:700px)" fetchpriority="high">
  <link rel="preload" href="images/hero-sequence/v2/poster-mobile.webp" as="image" media="(max-width:699px)" fetchpriority="high">
  <link rel="preload" href="assets/vendor/cormorant-regular.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="assets/utilities.css">
  <link rel="stylesheet" href="assets/site.css">
  <link rel="stylesheet" href="assets/pos.css">
  <script>window.va=window.va||function(){(window.vaq=window.vaq||[]).push(arguments)};window.si=window.si||function(){(window.siq=window.siq||[]).push(arguments)};</script>
  <script defer src="/_vercel/insights/script.js"></script>
  <script defer src="/_vercel/speed-insights/script.js"></script>
  <script defer src="assets/content.js"></script>
  <script defer src="assets/vendor/vue.js"></script>
  <script defer src="assets/pos.js"></script>
  <script defer src="assets/vendor/gsap.js"></script>
  <script defer src="assets/vendor/ScrollTrigger.js"></script>
  <script defer src="assets/countdown.js"></script>
  <script defer src="assets/hero-renderer.js"></script>
  <script defer src="assets/hero-sequence.js"></script>
  <script defer src="assets/site.js"></script>
</head>
<body>
<div class="entry-screen" aria-label="活动倒计时" aria-busy="true">
    <div class="countdown-row">
      <p class="countdown-status" role="status" hidden></p>
      <div class="countdown" role="timer" aria-label="活动倒计时" aria-live="off" hidden>
        <span><strong data-count="days" aria-label="天">00</strong><small>DAYS</small></span><span><strong data-count="hours" aria-label="小时">00</strong><small>HRS</small></span><span><strong data-count="minutes" aria-label="分钟">00</strong><small>MINS</small></span><span><strong data-count="seconds" aria-label="秒">00</strong><small>SECS</small></span>
      </div>
    </div>
</div>
<div id="app">${publicPage}\n${pos}</div>
</body>
</html>\n`;
writeFileSync('index.html', page.replace(/\r\n/g, '\n'));
console.log(`Built ${event.name}: ${drinks.length} drinks, ${moments.length} photos. Static public content and local runtime assets ready.`);
