import { readFileSync, writeFileSync, mkdirSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

process.chdir(resolve(dirname(fileURLToPath(import.meta.url)), '..'));
const content = JSON.parse(readFileSync('site-content.json', 'utf8'));
const { event, drinks, moments } = content;
const [year, month, day] = event.date.split('-').map(Number);
const dateChinese = `${month} 月 ${day} 日`;
const dateShort = `${month}/${day}`;
const dateDot = `${month}.${String(day).padStart(2, '0')}`;
const dateEnglish = new Intl.DateTimeFormat('en-US', {month: 'short', timeZone: 'Asia/Shanghai'}).format(new Date(event.startsAt)).toUpperCase() + '. ' + day;
const startClock = new Intl.DateTimeFormat('en-GB', {hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Shanghai'}).format(new Date(event.startsAt));
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
    <span class="photo-open">查看照片</span>
  </a>
  <figcaption>${esc(photo.caption)}</figcaption>
</figure>`).join('\n');

const publicPage = `<div class="public-site" :class="{'site-hidden': showPos || showWheel}">
<a class="skip-link" href="#menu">跳至酒单</a>
<header class="site-header">
  <a href="#home" class="brand" aria-label="理 BAR 首页">理 <span>BAR</span><small>ECUST · STUDENT RUN</small></a>
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
      <img class="hero-image" src="images/resurrection-hero.webp" alt="深酒红光影中，一只盛着清澈酒液与橄榄的高脚鸡尾酒杯" width="1672" height="941" fetchpriority="high" decoding="async">
      <div class="hero-left">
        <p class="eyebrow hero-date"><time datetime="${e.date}">${dateEnglish}</time><span>${e.time}</span></p>
        <h1 id="hero-title"><span class="hero-chinese">${e.name}</span><span class="hero-english">${e.english}.</span></h1>
        <p class="hero-tagline">${e.intro}</p>
      </div>
      <div class="hero-right">
        <p class="hero-invitation">在夜色里相聚，<br>在一杯之间重逢。</p>
        <p class="hero-location">华东理工大学 · ${e.location}</p>
        <a class="text-link hero-cta" href="#menu">查看本期酒单 <span>OUR MENU</span></a>
      </div>
      <div class="hero-transition" aria-hidden="true"><p class="eyebrow">LI BAR · BACK TO THE NIGHT</p><p class="transition-title">${e.name}</p><p>${e.displayDate} &nbsp; / &nbsp; ${e.time}</p><p>${e.location}</p></div>
      <div class="hero-bottom"><span>COCKTAILS & GOOD COMPANY</span><a href="#event">向下探索 <span class="scroll-rule" aria-hidden="true"></span> SCROLL TO DISCOVER</a><span>SHANGHAI · FENGXIAN</span></div>
    </div>
  </section>

  <section id="event" class="event-section section-pad" aria-labelledby="event-title">
    <div class="section-kicker" data-reveal><span>01 / THE GATHERING</span><span>本期活动</span></div>
    <div class="countdown-row" data-reveal>
      <div><p class="eyebrow copper" id="countdown-label">距离复活 / THE NIGHT AWAITS</p><p class="countdown-target"><time datetime="${e.startsAt}">${dateChinese} · ${startClock}</time><span>北京时间 UTC+8</span></p></div>
      <div class="countdown" role="timer" aria-labelledby="countdown-label" aria-live="off" hidden>
        <span><strong data-count="days">00</strong><small>天 / DAYS</small></span><span><strong data-count="hours">00</strong><small>时 / HRS</small></span><span><strong data-count="minutes">00</strong><small>分 / MIN</small></span><span><strong data-count="seconds">00</strong><small>秒 / SEC</small></span>
      </div>
      <p class="countdown-ended" role="status" hidden>复活已开场</p>
    </div>
    <div class="event-grid">
      <div data-reveal><p class="eyebrow copper">AUTUMN, TOGETHER AGAIN.</p><h2 id="event-title">${e.name}<em>${e.english}.</em></h2></div>
      <div class="event-copy" data-reveal><h3>${e.intro}</h3><p>${e.description}</p>
        <dl class="event-details"><div><dt>WHEN / 时间</dt><dd><time datetime="${e.date}">${dateChinese}</time><small>${e.time}</small></dd></div><div><dt>WHERE / 地点</dt><dd>${e.location}<small>华东理工大学 · 奉贤校区</small></dd></div></dl>
        <a href="#menu" class="text-link">先选一杯 <span>EXPLORE THE MENU</span></a>
      </div>
    </div>
  </section>

  <section id="menu" class="menu-section section-pad" aria-labelledby="menu-title">
    <div class="section-kicker" data-reveal><span>02 / THE SELECTION</span><span>本期酒单</span></div>
    <div class="menu-heading" data-reveal><p class="eyebrow">FOUR DRINKS. ONE NIGHT.</p><h2 id="menu-title">The Menu</h2><p>四杯酒，四种重逢的方式。</p></div>
    <div class="menu-grid">${menu}</div>
    <div class="menu-footnote"><span>价格单位：人民币 / 杯</span><span>欢迎与我们沟通风味偏好。</span></div>
  </section>

  <section id="moments" class="moments-section section-pad" aria-labelledby="moments-title">
    <div class="section-kicker" data-reveal><span>03 / AFTER HOURS</span><span>往期片刻</span></div>
    <div class="moments-heading" data-reveal><h2 id="moments-title">A little of<br><em>the night.</em></h2><p>杯中的风味会散去，<br>相聚的片刻会留下。</p></div>
    <div class="moments-grid">${gallery}</div>
    <p class="gallery-hint">往期活动记录 · 点击照片放大<span>手机端可左右滑动浏览</span></p>
  </section>

  <section id="visit" class="visit-section section-pad" aria-labelledby="visit-title">
    <div class="section-kicker" data-reveal><span>04 / FIND YOUR WAY</span><span>关于与到场</span></div>
    <div class="visit-grid"><div data-reveal><p class="eyebrow copper">A SMALL BAR. A SHARED NIGHT.</p><h2 id="visit-title">夜晚有处，<br><em>相聚有时。</em></h2><p class="about-copy">理 BAR，学生自运营的校园鸡尾酒活动。<br>从一杯酒开始，让熟悉的校园多一种相遇。</p></div>
      <div class="visit-info" data-reveal><p class="eyebrow">NEXT GATHERING</p><p class="visit-date">${dateDot} <span>${e.time}</span></p><p class="visit-location">${e.location}</p><p class="muted">华东理工大学 · 上海</p>
        <button class="text-link copy-wechat" type="button" data-copy="17601382093">微信 17601382093 <span>点击复制</span></button>
        <p id="copy-status" class="copy-status" role="status" aria-live="polite"></p>
        <div class="social-links"><a href="https://b23.tv/KLiRgD0" target="_blank" rel="noopener noreferrer">bilibili</a><a href="https://xhslink.com/m/9IN1QDcfLlw" target="_blank" rel="noopener noreferrer">小红书</a><a href="#menu">本期酒单</a></div>
      </div>
    </div>
    <footer class="site-footer"><button @click="enterPos" class="pos-entry" type="button" aria-label="打开点单系统">© ${year} LI BAR</button><p>Synchronicity is an ever-present reality.</p><a href="#home">回到顶部 / BACK TO TOP</a></footer>
  </section>
</main>
<dialog class="photo-dialog" aria-label="往期活动照片"><button type="button" class="dialog-close">关闭 / CLOSE</button><div class="photo-dialog-content"><img alt=""><p class="photo-caption"></p></div><div class="photo-navigation"><button type="button" data-gallery-prev>上一张</button><span class="photo-counter" aria-live="polite"></span><button type="button" data-gallery-next>下一张</button></div></dialog>
</div>`;

const pos = readFileSync('scripts/pos-template.html', 'utf8');
const page = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <meta name="theme-color" content="#260c0b">
  <meta name="description" content="理 BAR 本期活动「${e.name}」：${dateChinese}，${e.time}，华东理工大学${e.location}。查看本期四款鸡尾酒酒单。">
  <title>${e.name} · ${dateShort} — 理 BAR</title>
  <link rel="icon" href="favicon.png" type="image/png">
  <link rel="apple-touch-icon" href="favicon.png">
  <link rel="preload" href="images/resurrection-hero.webp" as="image" fetchpriority="high">
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
  <script defer src="assets/site.js"></script>
</head>
<body>
<div id="app">${publicPage}\n${pos}</div>
</body>
</html>\n`;
writeFileSync('index.html', page.replace(/\r\n/g, '\n'));
console.log(`Built ${event.name}: ${drinks.length} drinks, ${moments.length} photos. Static public content and local runtime assets ready.`);
