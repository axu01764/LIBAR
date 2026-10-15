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
