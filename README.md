# 理 BAR / LI BAR

华东理工大学奉贤校区学生自运营鸡尾酒活动网站。公开页面为预生成 HTML；Vue 3 保留原有隐藏点单系统，GSAP ScrollTrigger 负责首屏滚动过渡。部署于 Vercel，自定义域名为 https://www.alanbar.site/。

## 当前活动

果韵三味 · 2026-10-27 · 19:00 till late · 奉贤风檐广场。

酒单保留原有中英文名称、价格、饮品类型、描述和 ABV 排版：金汤力 38 元、莫斯科骡子 38 元、乌梅酸 48 元、海盐荔枝玛格丽特 48 元、青提菲士 38 元。

## 更新活动

编辑 `site-content.json` 中的 `event`、`drinks` 和 `moments`，然后运行 `npm run build`。`index.html` 和 `assets/content.js` 是生成文件，请勿直接修改。

- `event.startsAt` 必须包含明确时区，例如 `2026-10-27T19:00:00+08:00`。倒计时按绝对时间计算，到点后自动正向计时并显示 EVENT IN PROGRESS。
- `event.date` 用于活动日期，`event.time` 用于展示时段；二者应与 `startsAt` 对齐。
- 修改酒单时保留已有饮品的 `id`，避免影响点单记录。`desc` 中以换行分隔描述和 ABV。
- 公开酒单在构建时生成，点单系统使用同一个数据源。无 JavaScript 时活动资料与酒单仍然可读。

## 本地开发与部署

### 搜索引擎配置

- `seo-config.json` 保存主域名、站点名 `alanbar`、别名、Google Search Console 验证标签以及公开的 IndexNow 验证 key。验证信息需要持续保留。
- 构建会生成品牌标题、描述、canonical、分享预览及 WebSite / WebPage 结构化数据，并导出 `robots.txt`、`sitemap.xml` 和 IndexNow key 文件。页面正文不因 SEO 配置而增加文案。
- 主网址为 `https://www.alanbar.site/`，站点地图只包含实际存在的首页，不把页内锚点当作独立页面。
- Google Search Console 使用该 HTTPS URL prefix，验证后提交 `https://www.alanbar.site/sitemap.xml`，并对首页请求编入索引。
- 发布后运行 `npm run seo:submit` 可通知 Bing 的 IndexNow 接口首页已更新。HTTP 200 / 202 仅表示接收，收录和排名由搜索引擎决定。
- Google 抓取说明：https://developers.google.com/search/docs/crawling-indexing/ask-google-to-recrawl 。IndexNow 文档：https://www.indexnow.org/documentation 。

```sh
npm ci
npm run build
npm test
npm run dev
```

本地预览：http://localhost:4173/。修改源文件后重新运行构建并刷新。

`vercel.json` 指定 `npm run build` 和 `dist/`。推送 `main` 后由现有 GitHub–Vercel 集成自动发布。构建输出只含网站和静态素材，不包含开发脚本、依赖目录或 QA 截图。

## 文件结构

- `scripts/build.mjs`：页面结构和静态内容生成；复制已锁定版本的 Vue、GSAP 和字体到本地资源目录。
- `scripts/pos-template.html`、`assets/pos.js`、`assets/pos.css`：原有隐藏点单系统。
- `assets/site.css`、`assets/site.js`：响应式样式、导航、照片灯箱、微信复制与滚动过渡。
- `assets/entry.js`：开场全屏倒计时与素材就绪门控；`assets/countdown.js`：东八区倒计时；`scripts/countdown.test.cjs` 覆盖跨时区和到点边界。
- `images/hero-sequence/v2/`：Cycles 渲染的首帧，桌面与手机各 120 帧 WebP 序列。
- `assets/hero-sequence.js`、`hero-renderer.js`、`hero-worker.js`：Canvas 帧选择、后台绘制、压缩帧预取、有限解码缓存与回收。
- `scripts/blender/hero_scene.py`、`pack_frames.py`：可重复生成的 Blender 场景和 WebP 打包脚本。
- `images/moment-*.webp`：现有真实吧台照片的压缩版本，懒加载。
- `assets/vendor/`：随站点托管的运行库及字体，避免访客加载外部运行时 CDN。

## 动效与兼容

桌面与手机端均为 260svh 滚动容器和粘性首屏（动画滚动距离 160svh，是原来的两倍），滚动控制文案淡出、真实酒杯旋转镜头、活动信息进入。向上滚动可逆。手机端使用相同的可逆动画；`prefers-reduced-motion` 或省流量模式使用静态展示。

主视觉由 Blender 4.5 Cycles 离线渲染（1440 × 1000、64 samples，手机输出 864 × 600）：顺时针 180° 旋转、镜头推进和微俯视均包含在帧中。首段 15% 保持构图，15%–85% 推进镜头，85%–90% 保留完整近景，末段再转入原有活动信息。GSAP 同一个进度值控制 Canvas 和 DOM，向上滚动沿相同路径倒放。压缩帧按需预取，支持时通过 OffscreenCanvas Worker 解码和绘制，不支持时使用主线程 Canvas；解码缓存上限为桌面 16 帧、手机 28 帧，方向预取同时照顾反向回滚。绘制按浏览器刷新节奏合并，同一帧不重复绘制；不创建持续空转的绘制循环。加载失败保留海报或最后有效帧。

重新生成素材（本地需要 Blender 和 Python Pillow，Vercel 不运行 Blender；默认尝试 oneAPI GPU，可用 `--cpu` 强制 CPU）：

```powershell
blender --background --python scripts/blender/hero_scene.py -- --frames all
python scripts/blender/pack_frames.py
npm run build
```

`--preview --frames 0,60,119` 可先生成半分辨率关键帧。场景 `.blend` 和原始 PNG 输出至忽略的 `render-output/v2/`；公开部署仅使用压缩后资源。

照片支持点击放大、上一张/下一张、左右方向键和 Escape 关闭；手机照片区支持横向滑动。导航和入口具备可见键盘焦点，页面允许缩放。

## 隐藏点单系统

点击页脚版权进入。双击饮品计数，双击订单切换完成状态，数据继续使用原来的 localStorage 键保存；服务日期以 14:00 为分界。原有配方图候选路径、导出和清空功能保留。当前四款沿用活动酒单 ID；仓库没有对应配方图时，预览仍显示原来的缺图提示。

## 验证范围

已检查桌面和手机尺寸、菜单导航、酒单完整文字、照片灯箱、点单计数与完成状态、减少动态效果、倒计时到点状态。倒计时自动测试覆盖上海、伦敦、洛杉矶时区与秒级边界。设计截图与比较记录见 `design-qa.md`；本地证据在忽略的 `qa/` 目录。

iOS Safari、微信内置浏览器和真实校园网络需要实机复测；未宣称达到生产环境 Core Web Vitals 百分位指标。

打开页面先显示全屏倒计时，当前设备的 120 帧下载完成且首帧绘制成功后，自动淡出并解锁滚动。加载失败或超过 45 秒则降级为静态海报；减少动态效果及省流量模式直接等待海报后进入。无 JavaScript 时展示静态页面。酒单下方为原图及细线框组成的 Jill.St 人物板块。
