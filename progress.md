# Progress

## Goal
Publish this Vite/React hydration app to GitHub Pages at https://applepayrl.github.io/hydration/

## Status
- Done. Site is live.

## Done
- Public repo: https://github.com/applepayrl/hydration
- Pages: https://applepayrl.github.io/hydration/
- First Actions run `32308000285` succeeded (build 24s, deploy 10s)
- Verified HTTP 200 for `/hydration/`, `/hydration/assets/index-CUyV7bC0.js`, `/hydration/assets/index-CbRbBvYA.css`, `/hydration/water-drop.svg`
- Vite `base` is `/hydration/` on `build` only, `/` during `vite` so local/LAN still works
- Favicon uses `%BASE_URL%water-drop.svg`; `public/.nojekyll` present
- Workflow: `.github/workflows/deploy-pages.yml` (push to `main` republishes)

## Next
- None for publish. Later source changes: commit + push `main`.

## Decisions / assumptions
- Assumption: public project repo `applepayrl/hydration` (not a user site).
- GitHub Actions Pages deploy; no `gh-pages` npm package.
- Local git identity in this repo: `applepayrl` / `278465442+applepayrl@users.noreply.github.com` (no global git user was set).

## Success criteria
1. `https://applepayrl.github.io/hydration/` returns HTTP 200 with the app HTML. PASS
2. Built JS/CSS URLs are under `/hydration/assets/…`. PASS
3. Favicon resolves under `/hydration/water-drop.svg`. PASS
4. Repo exists at `https://github.com/applepayrl/hydration` and is public. PASS
