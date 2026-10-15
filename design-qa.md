# LI BAR redesign — design QA

final result: passed

## Source and evidence

- Source visual truth: `C:/Users/axu01/AppData/Local/Temp/codex-clipboard-341b0dc0-1acc-4db3-8b87-43b30eecd731.png` (3067 × 1704).
- User brief: the supplied visual/scroll plan, with event name 复活, October 22 at 19:00 till late, 奉贤风檐广场, four specified drinks, and UTC+8 countdown.
- Implementation: `http://localhost:4173/`, desktop CSS viewport 1440 × 800; browser-rendered final screenshot `qa/desktop-final.png` (1425 × 792 output pixels). The browser's capture scales CSS pixels slightly; comparison normalizes both images to 1000 × 556 without altering UI content.
- Full-view comparison: `qa/final-comparison.jpg`, opened as a single side-by-side comparison input. Initial comparison: `qa/hero-comparison.jpg`.
- Focused evidence: full-resolution desktop hero opened separately; `qa/desktop-menu-browser.png`, `qa/desktop-event-browser.png`, `qa/mobile-menu-browser.png`, `qa/mobile-small-final.png`.
- Responsive viewports: 390 × 844 and 375 × 667 CSS pixels. Narrow page has no horizontal document overflow; the photo strip deliberately scrolls horizontally.
- States: default hero; desktop scroll transition and reverse; event countdown; menu; expanded mobile navigation; photo lightbox and next image; POS entry, increment and completed order; reduced motion; no JavaScript; countdown at target instant.
- Additional evidence: `qa/desktop-scroll.png`, `qa/no-javascript.png`. Local screenshots are ignored by Git and excluded from the deployed output.

## Fidelity surfaces

- Typography: locally hosted Cormorant provides the editorial English serif; Songti/SimSun stack supplies the Chinese display title. Chinese event copy intentionally replaces the reference's English promotional text. Date/time, location and menu entry are legible; long cocktail names wrap instead of truncating.
- Layout rhythm: brand upper left, minimal navigation upper right, hero title left, real glass centered, introduction and underlined menu entry right. Mobile independently stacks date, title, glass and CTA. Small-height treatment keeps the CTA within the 375 × 667 first viewport (bottom approximately 615 CSS px).
- Colors: burgundy shadows, warm ivory text and muted copper details match the source direction. The light warm menu surface intentionally retains the existing menu's reading format.
- Images: generated photorealistic hero is a separate 1672 × 941 WebP asset, about 70 KB; no screenshot-as-UI or code-drawn glass. Six gallery assets are optimized copies of existing real bar photographs. No broken visible images found.
- Content: event name, date, time and place follow user instructions. Only four public menu entries and four POS drinks: Long Island Iced Tea 48, Zombie 48, Chocolate Coffee Martini 48, Diablo 38. Diablo description, 13% ABV and long-drink label use the user's supplied details.

## Interaction and technical checks

- Desktop and mobile menu anchors tested; mobile menu expands and closes after navigation.
- Photo lightbox opens, advances from 1/6 to 2/6 and closes to its opener.
- Original POS entry works; adding Diablo increments total to 1, and its order can be marked completed. Test data was on a local origin, not the production domain. The existing native clear-data confirmation could not be completed through the browser automation bridge; its implementation is unchanged.
- Scroll transition shows the event title as the original text fades, and scrolling back to zero restores the hero. Uses GSAP ScrollTrigger with native scrolling, no fake Y-axis rotation.
- Reduced-motion emulation removes extended sticky duration and keeps content visible. Disabling JavaScript leaves the static public hero and content readable.
- Countdown tested in browser at the target instant: timer hidden, “复活已开场” visible. Test override removed by reloading.
- `npm test`: target equals 2026-10-22T11:00:00Z; Shanghai, London and Los Angeles yield identical remaining durations; one-second boundary, exact start, after-start and invalid input covered.
- Build passed. Static output anchors and referenced files verified; development dependencies and scripts excluded from `dist/`.
- Browser console check on final local preview returned no application errors or warnings. Vercel telemetry endpoints are only meaningful on deployment.

## Comparison history and findings

1. Initial full-view comparison confirmed the supplied hero's composition, palette and photography direction. Replaced copy and serif Chinese heading are intentional adaptations, not drift.
2. Mobile review prompted an additional short-viewport CSS treatment; the final 375 × 667 screenshot and CTA bounds verify that the menu entry is visible. Menu wrapping, lightbox navigation and document width were checked in the rendered browser.
3. Final side-by-side comparison and full-resolution review found no actionable P0/P1/P2 visual issues.

## Accepted scope and remaining checks

- This release implements phases 1–2 of the supplied plan: layout plus reversible low-load transitions. True 3D turntable frames require separately modeled/rendered assets and are not included.
- iOS Safari, WeChat's browser and real mobile/campus network performance have not been tested on physical devices. No production Core Web Vitals percentile claim is made.
- Existing missing recipe-image behavior remains; the repository lacks recipe images for current activity-specific IDs.
- P3: Chinese display-font appearance may vary with device fonts; a dedicated licensed Chinese subset could further standardize it later.

## Implementation checklist

- [x] User-approved event and drink content
- [x] Source-to-implementation comparison
- [x] Responsive first-screen CTA and complete menu names
- [x] Gallery, navigation and POS core interactions
- [x] UTC+8 countdown and finished state
- [x] Reduced-motion/static fallback
- [x] Build, static output and countdown tests
- [x] No outstanding P0/P1/P2 findings


## 2026-10-15 requested refinements

final result: passed

- Followed the user's explicit text deletion list. Removed all four section labels, visible timezone and countdown unit labels, the extra menu slogan and currency note. Footer is now Find Us with no repeated event date/time. No new promotional text was added.
- Replaced the first two gallery assets with the two user-provided photographs. Captions and lightbox labels are exactly 芭乐 and 白葡萄酒.
- Countdown title and numbers enlarged, with colon separators. Unit descriptions remain accessible to screen readers without visible label clutter. UTC+8 target and calculation are unchanged.
- Unified the complete scroll timeline for mobile and desktop; removed the mobile-only parallax branch and the CSS rule hiding the transition. Active scroll distance doubled from 80svh to 160svh (260svh total scene including the screen height).
- Browser checks: 390 × 844 mobile scene measured 2194 px with 844 px sticky stage; at scroll 1200 the title transition is visible, and returning to zero restores the original hero. Desktop 1440 × 800 active distance measured 1280 px. No horizontal overflow on mobile.
- Opened and inspected updated browser screenshots: qa/mobile-motion-updated.png, qa/countdown-updated.png, qa/gallery-updated.png, qa/find-us-updated.png. New photos loaded; captions match; Find Us has no date/time. No console errors.
- Countdown tests and build pass. Static visible-text assertions pass for every requested deletion. Existing earlier design comparison remains the baseline for untouched layout; the explicit latest user instructions supersede its copy and motion constraints.


## Cycles scroll sequence · 2026-10-15

- Scripted Blender 4.5 Cycles scene: hollow crystal coupe, liquid meniscus, two textured olives, metal pick, strip lights and seamless burgundy studio. Camera advances and rises while the cocktail rotates clockwise 180 degrees.
- Desktop: 60 WebP frames at 1280 × 888, 1.19 MiB total. Mobile: 36 frames at 864 × 600, 0.37 MiB total. Poster is approximately 23 KB.
- Canvas is driven by the same GSAP scrub timeline as text. Decoded bitmap cache is bounded (12 desktop / 10 mobile). Stale asynchronous results cannot overwrite a later scroll selection. Poster is hidden only after a valid canvas frame is painted.
- Verified mobile CSS viewport 390 × 844: frame 0 → 32 → 12 → 0, text returns to opacity 1, no horizontal overflow. Reduced-motion uses the mobile poster and no visible canvas.
- Verified desktop CSS viewport 1440 × 900: frame 0 → 54, correct leftward pick position, and correct frame 54 when reloading at the same scroll position. Absolute trigger start remains 0 after browser scroll restoration. Returning to the top restores frame 0 and original text.
- Visible page text matches the previously published version. No extra page copy introduced.
- Build validates existence of every desktop/mobile frame. Node tests cover reverse selection, clamping, resource disposal, late-frame races, unavailable-image fallback and the existing timezone countdown.
- Screenshots: qa/hero-cycles-final.png, qa/hero-cycles-desktop-turn.png, qa/hero-mobile-rotation.png. Mobile validation is browser emulation, not a physical iPhone or WeChat device test.
