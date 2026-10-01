# Facts

Updated: 2026-10-01. The 28 September deployment claims below are history, not the current tip.

## Repository

- Source of truth: `niccolopello-source/Jarvis-hq`, branch `main`, commit `89249efccdb1b86e7b84de801c46f9c6b544b4d0`. Decision D-016.
- That commit is the merge of pull request #12. Its tree matches `7fab910`. The frozen core branch `grok/demo-ready` is still `3ae09f75598e77c7bda3a83b7e841c64d1f6a2b1`.
- The game lives in `apps/pivot23`. Guest play only. No account, database, or AI provider. `FLAGS.account`, `tokens` and `nft` are false.
- Engine label: `2.11.0-beta`. Package version: `0.1.0`.
- Browser save schema: `LIVE_SAVE_VERSION` 2, key `pivot-v2-save`. `SAVE_VERSION` 11 is the player label in `config.ts`, not the JSON schema version.
- Demo languages on the selector: Italian and English. D-014. Spanish strings remain in `i18n.ts` and are not offered.
- GitHub Actions: `.github/workflows/pivot23.yml`. The workflow's browser job starts `pnpm dev`, not the production preview.

## Production

- Vercel project: `pivot23`.
- Public URL: https://pivot23.vercel.app
- On 2026-10-01 the public HTML, `index-19Qinw1n.js` and `index-BgTrIkhY.css` matched a local production build of `89249ef` byte for byte. That measurement was before the phase-b branch. The phase-b branch is not production until it is merged.
- The sentence «Avvio dell'applicazione…» is the HTML shell before React mounts. It is not, by itself, proof of a blank screen.

## What was true on 28 September and is not the current tip

- `main` was `421a4a0` after pull request #1. Later merges include the demo-ready core (`0b8174e`, pull request #11) and the UI (`89249ef`, pull request #12).
- The unit suite on `421a4a0` was smaller. On `89249ef` the script runs `engine.test.ts` and `presentation.test.ts`. The phase-b branch also runs `i18n.test.ts`.
- FACTS written on 28 September said retirement was only `age>=36` and that P0-LIFE was open without a passing distribution test. `89249ef` contains the test `1,000 Pro careers meet the P0-LIFE age distribution without changing the peak window`. Re-measure that test on the commit you are changing. Do not treat the September sentence as the live rule.

## Still true

- Real NBA franchise names are in the client. D-015 keeps them for the demo and requires a legal review before commercial distribution.
- The EuroLeague model is 16 teams and 34 games, with a best-of-five quarterfinal and a one-game Final Four. It is not the official 2026–27 format.
- A sandbox branch `demo/readiness` is not this repository. Do not copy it onto `main`.

## Checks already recorded on `89249ef` before phase-b

These were run on 2026-10-01 against that tree. They are not a substitute for the phase-b re-run.

- Typecheck, ESLint, 44 unit tests, production build, and 6 Playwright tests against `vite preview`: pass.
- Public site: intro, simulated career, archive reload, widths 375, 768, 1024, 1280, 1440: pass.
- Finals screens on the public site: NBA Finals and EuroLeague Final showed the gold accent. Conference finals did not. At 375 and 390 the dossier clipped «Oklahoma City Thunder». That clip is the phase-b UI fix.
