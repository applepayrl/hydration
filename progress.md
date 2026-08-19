# Progress

## Goal
Always run the app fullscreen (no mock iPhone frame). Home Screen / standalone on iPhone 17 Pro should look native and not overlap the status bar / Dynamic Island / home indicator. Redeploy to GitHub Pages.

## Status
- Visual tests passed. Ready to commit and redeploy.

## Done
- Removed `IPhoneFrame` and the fullscreen toggle; app is always `.app-shell` at `100dvh`
- Safe-area CSS vars (`--safe-top/bottom/left/right`) on header, dock, pour overlay, and modals
- iOS PWA: `apple-mobile-web-app-capable`, `black-translucent` status bar, `apple-mobile-web-app-title=AquaFlow`, manifest `display=standalone`, apple-touch-icon, 5 startup images
- Generated icons/splashes via `scripts/generate-pwa-assets.mjs`
- iPhone 17 Pro visual test (`scripts/test-iphone-17-pro.mjs`) ALL CHECKS PASSED:
  - header top 65 ≥ 62
  - dock bottom 840 ≤ 840
  - pour controls top 62 ≥ 62
  - no mock frame
  - PWA tags + standalone manifest
- Screenshots reviewed: home, settings, history, pour, desktop — no status-bar overlap

## Next
1. Commit and push `main`
2. Wait for Pages workflow
3. Verify live HTML has PWA tags and no IPhone frame

## Decisions / assumptions
- iPhone 17 Pro: 402×874 CSS px, portrait safe area top 62 / bottom 34
- Native look = edge-to-edge `#090d16` + translucent status bar + content inset, not an opaque status bar
- No browser MCP; Puppeteer + screenshots + geometry asserts

## Success criteria
1. No mock chassis / Fullscreen / iPhone Frame control. PASS
2. App root fills viewport. PASS
3. With insets 62/34, header ≥ 62 and dock bottom ≤ 840. PASS
4. PWA meta + icon + manifest present. PASS
5. Manifest display standalone. PASS
6. Screenshots show header below island and dock above home indicator. PASS
7. Live site updated. PENDING
