# Progress

## Goal
Publish this Vite/React hydration app to GitHub Pages at https://applepayrl.github.io/hydration/

## Status
- In progress: create repo, push, enable Pages, wait for first deploy
- Local production build verified

## Done
- Confirmed `gh` is logged in as `applepayrl`
- Confirmed `applepayrl/hydration` did not exist
- Added `.gitignore`, `base: '/hydration/'`, `%BASE_URL%` favicon, `public/.nojekyll`, `.github/workflows/deploy-pages.yml`
- `npm run build` succeeded; `dist/index.html` uses `/hydration/assets/…` and `/hydration/water-drop.svg`

## In progress
- git init, first commit, `gh repo create`, enable Pages

## Next
1. `git init -b main`, local commit identity, commit source (not `node_modules`/`dist`)
2. `gh repo create applepayrl/hydration --public --source=. --remote=origin --push`
3. Enable Pages `build_type=workflow`
4. Wait for Actions deploy
5. Fetch https://applepayrl.github.io/hydration/ and confirm HTML/assets load

## Decisions / assumptions
- Assumption: public repo named `hydration` under `applepayrl` (project site, not a user site).
- Deploy via GitHub Actions (`actions/deploy-pages`) so later pushes to `main` republish automatically.
- Token-efficient: no extra npm deploy packages (`gh-pages`); CI builds `dist/` from source.

## Success criteria
1. `https://applepayrl.github.io/hydration/` returns HTTP 200 with the app HTML.
2. Built JS/CSS URLs are under `/hydration/assets/…` (not `/assets/…`).
3. Favicon resolves under `/hydration/water-drop.svg`.
4. Repo exists at `https://github.com/applepayrl/hydration` and is public.

## Open questions
- None that block publish. Local `npm run dev` still works; `base` only affects asset URLs in production (and when visiting `/hydration/` locally).
