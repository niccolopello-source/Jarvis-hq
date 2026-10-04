# Facts

Updated: 2026-10-04 (tip `88ba7dc`). The sections below the first one are history unless they say otherwise.

## 2026-10-04 — tip after the docs merges

- `main` is `88ba7dc`, the merge of PR #42 (15:06 +0200). PR #40, #41 and #42 are docs only. `git diff d8fa56d 88ba7dc -- apps/pivot23` is empty. No open pull requests at the time of this note.
- Those three merges did not start GitHub Actions. The workflow only listens to `apps/pivot23/**`. The last Actions run on the game tree is [run 37203654421](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/37203654421) on `d8fa56d`, success, both jobs.
- Rechecked locally on that same game tree, 4 October, headless Chromium, production preview: ESLint, `tsc`, 133 unit tests, `vite build`, 6 security headers, and 54/54 Playwright tests. The statistical job was not repeated. Detail is in the addendum.
- Production `https://pivot23.vercel.app/`, read 2026-10-04 13:07 UTC: HTTP 200, the security headers are present, and the HTML names `assets/index-DStmhF_B.js`, `assets/react-vendor-CyDUuctK.js`, `assets/narrative-D8IjwUY_.js`, `assets/rolldown-runtime-hePW80VL.js` and `assets/index-xPL1_15-.css`. Those names match a production build of this game tree. The site was not played.
- P-014 is in `DECISIONS.md` as a proposal. D-016 was not rewritten and is not superseded. D-017 does not exist until the owner accepts P-014.
- Player and CPU names are assembled from fixed fictional lists (`world.ts` `FIRST`/`LAST`, `teams.ts` `ROOKIE_NAMES` and the face names). No external roster or stats feed is fetched. Team names and colours are the real franchises. Marks are original SVG, not league logos. Figtree is named in CSS and is not shipped as a file. Detail: `docs/pivot23/RELEASE-ADDENDUM-2026-10-04.md`. This is not a legal clearance.

## 2026-10-04 — tip after the dossier fix

## 2026-10-04 — current tip

Verified on `main` `287850b062b43caf1e5b687ff8d04bf2d9fa139a` (merge of PR #37, 2026-10-04 13:39 +0200). Tree `6832fb0`, same tree as the PR head `201d1e5`. No open pull requests at the time of this note.

- GitHub Actions on that SHA: [run 37199500470](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/37199500470), success. Jobs: `lint, types, unit, build, e2e (production build)` and `statistical engine checks (~4 min)`.
- Engine label in source: `2.12.0-beta` (`apps/pivot23/src/lib/pivot/config.ts`). `SAVE_VERSION` 11. `LIVE_SAVE_VERSION` 2. `FLAGS.account`, `tokens` and `nft` are false.
- First-visit premiere in source: `PREMIERE_MS` 12000. Returning visit and a lean device: 1600. The 9.2 s note below describes an older cut, not this tip.
- Italian/English narrative is on this tip (PR #37). The English catalog is a separate chunk. Spanish is still in the dictionary and not offered (D-014).
- Production `https://pivot23.vercel.app`, read 2026-10-04 12:24 UTC: `Last-Modified` is after the merge, and the HTML names `assets/index-DDwv2i6l.js`, `assets/index-xPL1_15-.css` and `assets/narrative-D8IjwUY_.js`. Those names match a production build of this same tree. The Vercel project setting itself was not read.
- D-016 still names `89249ef` as the demo source. That decision has not been superseded. The git tip and D-016 disagree; this file does not resolve it.

P1 remeasured on this tree, shipped tuning, engine `2.12.0-beta`. Not a closure of the tasks in TASKS.md.

- P1-BUST: 1,500 Pro careers, seeds `200000`–`201499`, roles and paths cycled, random draft. 190 had potential ≥ 85. **0** peaked 8 or more under that potential. 8 peaked under it at all. Gap peak−potential: min −2, p10 +0.8, median +2.9, p90 +4.4. `SIM.development.bustRate` is applied to CPU stars (`world.ts`), not to the player's peak. The player's peak is capped at potential+8 (`peak.ts`).
- P1-WORLD: same 1,500 careers, NBA titles only. Including the three `TITLE_SEED` rows (two of them Boston), Boston is 15.9% and Gini is 0.366. Excluding those rows: 23,333 simulated titles, OKC 7.7%, CLE 6.4%, BOS 6.1%, Gini 0.256, HHI 410. Spearman of the static power constant against that share: 0.95. Mean absolute drift of team power from its constant: 12.0. OKC is not the power leader at the end in 1,229 of 1,500 worlds. The 15% Boston figure is the seeded history, not the power constant.
- P1-ROLE: 200 seeds (`500000`–`500199`), each played as PG, SG, SF, PF and C. Held: Pro, NCAA, random draft. Games-weighted NBA seasons. Mean PPG 14.0 / 12.5 / 11.2 / 10.6 / 9.3 (SG, SF, PF, PG, C). RPG 6.8 / 5.4 / 3.3 / 2.5 / 2.1 (C, PF, SF, SG, PG). APG 4.6 / 2.7 / 2.6 / 1.9 / 1.5 (PG, SF, SG, PF, C). Minutes sit at about 25 for every role. Mean peak overall is 78.1 for every role. The role weights are not dead. Equal peak overall is what `TUNING.rolePeak = "current"` does.

## 2026-10-04 — intro più lunga, pallone e suoni sullo stesso montaggio

- Prima visita: `cineReveal` **9,2 s** (era 6,3 s). Visita di ritorno e dispositivo lento: 1,6 s. Movimento ridotto: niente premiere.
- Il marchio non è più solo uno zoom. Un pallone palleggia tre volte (1,15 s, 2,05 s, 2,80 s), sale in arco ed entra nel segno a **4,85 s**, insieme allo swish e al bagliore degli archi. I tempi vivono nelle custom property `--beat-*`.
- I suoni restano sintesi Web Audio, zero file. Terzo palleggio (gather) più grave; ciuffo con due fruscii della retina e un po' più di room, così sta nella stessa palestra dei palleggi.
- `main` prima di questo taglio: `522f895` (merge della PR #33). Questa nota descrive il sorgente del taglio, non un deploy finché non è su `main`.

## 2026-10-03 evening — previous tip

- `main` = `1099511` (merge of PR #28, intro animation). PRs #26, #27 and #28 are all merged into `main` by the account `niccolopello-source`. The 2026-10-03 afternoon note «later commits are not on main» is no longer true.
- GitHub Actions on `main` `1099511`: run 37136916431, success.
- Production `https://pivot23.vercel.app` serves `assets/index-DJ5dytNN.js` and `assets/index-DtcPs_gF.css`, byte-identical names to a local `vite build` of `1099511`, and answers with the CSP and the other `vercel.json` headers. So the Vercel project uses `apps/pivot23` as root directory (inferred from the headers; the setting itself was not read).
- Engine label `2.11.0-beta`, player schema `SAVE_VERSION` 11, live save `LIVE_SAVE_VERSION` 2, no live-save migrations registered.
- Home premiere `cineReveal` on `main`: 4.8 s (styles.css). Branch `grokbot/demo-hardening` sets 6.3 s on owner request (+1.5 s). Lean (≤2 cores) and returning visits: 1.6 s. Reduced motion: none.
- All gameplay randomness goes through the seeded Mulberry32 in `rng.ts`. Non-seeded sources: `newSeed()` (Date.now ^ Math.random, only to create a career seed), `crypto.randomUUID` (careerId and archive ids), Date.now (timestamps), performance.now (UI pacing). See `docs/project-state.md` §23.
- Save format, backup keys and checksum scope: `pivot23/SAVE-FORMAT-AND-MIGRATIONS.md`. Security headers: `pivot23/SECURITY-HEADERS.md` (D-21: every push also builds the `jarvis-hq` Vercel project). Balance measurements: `pivot23-balance-experiments.md`.

## Repository

- Source of truth: `niccolopello-source/Jarvis-hq`, branch `main`, commit `89249efccdb1b86e7b84de801c46f9c6b544b4d0`. Decision D-016.
- That commit is the merge of pull request #12. Its tree matches `7fab910`. The frozen core branch `grok/demo-ready` is still `3ae09f75598e77c7bda3a83b7e841c64d1f6a2b1`.
- The game lives in `apps/pivot23`. Guest play only. No account, database, or AI provider. `FLAGS.account`, `tokens` and `nft` are false.
- Engine label: `2.11.0-beta`. Package version: `0.1.0`.
- Browser save schema: `LIVE_SAVE_VERSION` 2, key `pivot-v2-save`. `SAVE_VERSION` 11 is the player label in `config.ts`, not the JSON schema version.
- Demo languages on the selector: Italian and English. D-014. Spanish strings remain in `i18n.ts` and are not offered.
- GitHub Actions: `.github/workflows/pivot23.yml`. On `main` the browser job starts `pnpm dev`, not the production preview; the branch `grokbot/demo-stability` changes it to `vite preview` (see the 2026-10-03 section).

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
