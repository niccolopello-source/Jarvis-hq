# Facts

Updated: 2026-09-28. Replaces the deployment claims in the 27 September reports.

## Repository

- Source of truth: `niccolopello-source/Jarvis-hq`, branch `main`.
- Merge of PR #1 (`demo/pivot23-readiness`) landed as `421a4a0` on 2026-09-28 13:52 UTC.
- The game lives in `apps/pivot23`. It is a guest browser app. No account, database or AI provider.
- Engine label in the production bundle: `2.11.0-beta`.
- Package version: `0.1.0`.
- GitHub Actions workflow: `.github/workflows/pivot23.yml`. Codex recorded a green run on the PR head before the merge (run `36326001307`). That run covers lint, typecheck, 13 unit tests, build, and a Chromium smoke through the first season, save and reload. It does not cover a full career distribution.

## Production

- Vercel project: `pivot23`.
- Deployment of `421a4a0` is `READY`, target production.
- Public URL: https://pivot23.vercel.app
- On 2026-09-28 the HTML, the JS bundle and the CSS returned HTTP 200. The JS file was 694334 bytes and contained `2.11.0-beta`, `Boston Celtics` and `age>=36`.
- The sentence «Avvio dell'applicazione…» is the HTML shell shown before React mounts. It is not, by itself, proof of a blank screen.

## What is not true anymore

These sentences in `docs/project-state.md`, `apps/pivot23/DEMO-READINESS-REPORT.md` and `apps/pivot23/DIAGNOSTIC-REPORT.md` were true on 2026-09-27 and false after the merge:

- PR #1 is open and not merged.
- There is no public URL.
- Deployment is blocked because no provider is configured.

The rest of those reports stands: black/white root cause unknown, smoke stops at the first season, no Lighthouse score, EuroLeague in the game is not the official 2026–27 format, mobile visuals and touch are unverified.

## Two trees

A sandbox checkout on branch `demo/readiness`, tip `160b109`, is not this repository's history. Measurements made there are labeled as sandbox measurements in the audit. They are not measurements of `421a4a0`.

## Still true in the production bundle

- Retirement is implemented as `age>=36`.
- Real NBA franchise names are in the client, including Boston Celtics and Los Angeles Lakers.

Neither fact has been accepted as a product decision to keep or to remove. See DECISIONS.md.
