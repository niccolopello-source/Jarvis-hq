# JARVIS HQ — PROJECT STATE

## 1. Purpose

This document records the current operational state of JARVIS HQ and its active project.

It is a living document.

It must describe the actual current state of the repository, systems, documentation, implementation and development progress.

It must not replace:

- the agent registry;
- the development workflow;
- project decisions;
- technical specifications.

Roles are not restated here. They live in [`AGENT-REGISTRY.md`](AGENT-REGISTRY.md).

Current facts that can go stale in a day are also kept in [`memory/FACTS.md`](memory/FACTS.md). If this file and FACTS.md disagree about a date, a URL or a merge, FACTS.md wins until this file is edited again.

---

## 2. Current Project

Primary project:

PIVOT 23 — Basketball Career Simulation Game

Status:

Public production build is live. It is a beta demo, not a launch.

Update 2026-10-04 (verified; older SHA notes below are history):

- `main` is `287850b062b43caf1e5b687ff8d04bf2d9fa139a`, the merge of pull request #37. Tree `6832fb0`.
- CI [run 37199500470](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/37199500470) succeeded on that SHA (production-build e2e job and the statistical job).
- Engine label `2.12.0-beta`. `SAVE_VERSION` 11. `LIVE_SAVE_VERSION` 2. Account, token and NFT flags are false.
- The numbers for P1-BUST, P1-WORLD and P1-ROLE on this tip are in [`memory/FACTS.md`](memory/FACTS.md). The tasks stay open. D-016 still names `89249ef` and has not been superseded.

- URL: https://pivot23.vercel.app
- Source of the game that was verified in production on 2026-09-28: `main` at `421a4a0`, then a document-only commit `228a748` was also deployed to production.
- Engine label in the bundle checked that day: `2.11.0-beta`

Update 2026-10-03, afternoon (demo-stability work, branch `grokbot/demo-stability`):

- Pull request #26 was merged by the owner as `ae67ac6` and deployed to production on Vercel. It contains: verified browser saves with backup of unreadable saves and no silent loss on "Nuova vita" (D-02, D-04, D-05, D-06), a local error boundary with bounded retry for the chart chunk (D-03), NBA-only DPOY (D-01), and default-off balance experiment flags.
- Not merged yet (same branch, needs a new pull request): Italian/English interface on every screen with axe-clean main screens (D-07, D-12), punctuation fix (D-14), security headers/CSP (D-13), CI on the production build with Node 24 actions (D-16, D-22), full-archive warning (D-20), docs.
- Root `src/` (D-18): an uploaded copy of root documents (`d8932a3`); `AI-GATEWAY-SPEC.md` and `gitignore.txt` are identical to the root ones, `README.md`, `agents.md`, `architecture.md` and `package.json` differ. Nothing builds from it (the app alias `@/` points at `apps/pivot23/src`). Not deleted; owner decision.
- Details: `docs/pivot23/SAVE-FORMAT-AND-MIGRATIONS.md`, `docs/pivot23/SECURITY-HEADERS.md`, `docs/pivot23/LEGAL-DISCLAIMER-PROPOSAL.md`, `docs/pivot23-balance-experiments.md`.

Verified later, on 2026-10-03, without replacing the note above:

- `main` is `1a1d928f76a3df1b907cf914b821104d4321a51c`, the merge of pull request #15.
- The game tree of that merge is the same as `15706456d0426e12123aff1d44e00a158f416c37`.
- Engine version in source is still `2.11.0-beta`. Save version in source is `11`.
- A 500-career sample was run on that tree. It is not in CI. See section 14.
- `docs/memory/FACTS.md` was not edited in that pass. Until it is, a disagreement about a SHA is unresolved.

The app lives in `/apps/pivot23`. It contains the career simulator, browser UI, browser-based saves, a deterministic engine test, and a Playwright smoke test. It runs without an account, database, or AI provider.

Known holes, not closed by the deploy: retirement is only `age>=36` in the bundle that was inspected, real NBA franchise names were in that client, the black/white screen cause is still unknown, and the career-distribution audit was not run on this commit. See [`memory/TASKS.md`](memory/TASKS.md) and [`pivot23/AUDIT-GROK-001.md`](pivot23/AUDIT-GROK-001.md). The tasks stay open. This status file does not close them.

---

## 3. JARVIS HQ Status

Current phase:

Software House Foundation

Completed foundation areas include:

- a single agent registry;
- a workflow that points at that registry;
- project DNA that points at that registry;
- an AI Gateway specification, not a runtime;
- shared project memory for PIVOT 23 (`docs/memory/`).

JARVIS HQ does not orchestrate agents at runtime. Coordination is the repository, the memory, branches, pull requests and CI.

The role documents on `main` were aligned with the registry in pull request #2, merged as `916c92e`. `src/agents.md` and `src/architecture.md` were not in that pull request and still carry the older text. They are not a role source.

---

## 4. Organizational State

Active agents are the five names in [`AGENT-REGISTRY.md`](AGENT-REGISTRY.md).

This file does not list their jobs.

OpenAI, Claude, Grok and Codex are execution resources. They are not a second roster. Codex is not an agent. See the registry, sections 10 and 11.

---

## 5. Architecture State

What exists is described in [`../architecture.md`](../architecture.md).

What is only specified is the AI Gateway. It has no process.

---

## 6. AI Model Infrastructure

No provider adapter is implemented.

No `.env.example` is required until a process reads a key.

---

## 7. Repository State

The repository is the project's technical source of truth.

`main` is the verified line. Work enters it through a pull request.

`src/` is an old copy of some foundation documents. It is not a role source. It was not deleted by pull request #2.

The root package exposes commands for starting and verifying PIVOT 23. It is not a house runtime.

---

## 8. Current Development Status

Current priority:

The document normalization is on `main`. The open simulation tasks are in [`memory/TASKS.md`](memory/TASKS.md). Do not treat the deploy as a launch.

Immediate objectives:

1. Review pull request #3 (P0-REPEAT). CI on that branch is green. The task stays open in TASKS.md until the fix is on `main`.
2. Re-measure career distributions on `main`, not on the sandbox tree.
3. Resolve P0-LIFE without making age 36 unreachable. The task is open.
4. Decide P-005 (franchise names) before any launch presentation. The owner has not accepted a rename. It stays proposed.
5. Do not implement the gateway until a task requires two providers.

---

## 9. Known Limitations

PIVOT 23 has a public production URL. It is not a finished launch.

A document-only commit on `main` currently produces a new Vercel production deployment. That happened for `228a748`. The ignored-build setting is not changed in the normalization work. It is a separate task, and it is not a git file.

The following are not implemented:

- production AI Gateway;
- provider adapters;
- automated agent orchestration;
- a runtime that loads this memory by itself;
- career-distribution tests in CI.

---

## 10. Current Risks

- `src/` still contains the old role text until a later pull request removes it, after references are checked.
- The 27 September reports describe a pre-merge world below their correction banners.
- Public use of real NBA franchise names, not yet an accepted decision.
- Treating a local save hash as proof of a career.
- Calling a P0 closed without the proof in the task.

---

## 11. Next Development Milestone

The next milestone for the game is a demo whose documents match the URL and whose careers are not all the same length.

The next milestone for the house is not a runtime. The governance documents on `main` now point at the registry. The older copies under `src/` are still there and are not a source.

A minimum runtime remains future work. It is not started.

---

## 12. Update Rules

This document must be updated when a significant project-state change occurs.

A status change that is only a fact (URL, SHA, test count) is also written to [`memory/FACTS.md`](memory/FACTS.md) in the same change.

It must not describe planned functionality as completed functionality.

It must not describe a proposed decision as an accepted one.

---

## 13. Core Principle

This document answers one question:

"What is the actual current state of JARVIS HQ?"

It must remain factual, current and synchronized with the repository.

---

## 14. Career sample, 2026-10-03

This section records one run. It does not change formulas, and it does not close a balancing task.

Method. `playCareerSim` on the tree above. Seeds `1000` through `1499`, one career each. Draft policy `random`. Nationality Italia, number 23, name `Sim500`. No custom potential. Positions cycle PG, SG, SF, PF, C (100 each). Paths cycle NCAA, Europa, G-League (170, 165, 165). Difficulties cycle Esordio, Pro, All-Star, Leggenda (135, 125, 120, 120). The built-in `simulateManyCareers` was not used: it does not take these seeds.

Result. 500 completed, 0 failed, 32.2 seconds, Node, Linux. A second run of seed `1000` with the same fixed options (PG, NCAA, Pro) matched the first. That is one deterministic check, not a replay of all 500.

Retirement age, last recorded season: 32 in 137 careers, 33 in 1, 34 in 15, 35 in 9, 36 in 338. Median age 36. Mean 34.8. The simulator recorded no choice titled `Ritiro`. Early exit versus a human choice is not stored. Of the 138 careers that ended before 34, all 138 still had `injuryDrag` of at least 2.5, and none had a final season at or under 11.5 minutes. The early signal in `careerEndingSignal` (`peak.ts`) allows injury or low minutes once age is at least 33. The minutes branch does not match this sample. That is an observation about the stored fields, not a new rule.

Difficulty separates outcomes. Esordio: 95.6% reach age 36, 34.8% win at least one title, median peak 79. Leggenda: 57.5% reach 36, 0.8% win a title, median peak 71. Position and path do not separate peak or titles by much. Peak overall median is 75. Twelve careers posted their highest season overall outside ages 26–28. Assigned `apexAge` stayed inside 26–28 for all 500.

Awards, share of 500: at least one title 18.2% (409 had zero; the highest was 6). MVP 4%. Finals MVP 13.8%. All-NBA 27.8%. All-Star 21.6%. Hall tier 9.4%. Final league EuroLeague 30 careers. Finals MVP is awarded in `resolvePlayoffRoundInner` with a base chance of 0.45 on a title. The higher Finals MVP rate matches that line. It is not, by itself, a defect.

Not run in this pass: ESLint, typecheck, the unit suite, Playwright, a phone, and a hand-played career. No pull request, merge, or deploy was made for this note. The file change is local until a later, separate review.

Demo blockers that this sample does not remove: a career played by hand to retirement, a phone check, and a decision on whether the age and award shapes are the intended game. No constant was changed.

---

## 15. Demo readiness pass, 2026-10-03

Branch `grok/demo-readiness`, started from `main` `1a1d928`. Not merged. Not deployed.

Verified in the current source, not taken from an older dump:

- The boot screen is already a static message inside `index.html`, replaced when React mounts. An error boundary already offers a reload and says the saved career remains. No black-screen bug was reproduced in this pass, and the 2.5 second welcome time was not measured.
- Retirement is a card at age 35: "Gioca a 36 anni" or "Chiudi ora". `onRetire` records the choice, then either continues or calls `finish`, which ignores a second finish with the same seed, length and age. No cap at 34 or 35 was added. The existing unit test for the age-35 path still passes.
- `saveLive` already refuses to delete the last good save when storage throws. The career screen ignored that false return. It now shows `saveMiss` when the write fails.
- There is no "play the next game" control. The career advances by cards and by season. That dashboard was not built, so it was not restyled.
- The year sheet always showed advanced rates. They now sit behind "Statistiche avanzate". PPG, RPG and APG have a one-line legend. Year chips and the season tabs use a 44px minimum height.
- The boot panel follows the system light or dark colors. It still has no motion.

Tests run on this tree after the edits, Linux, Node, 3 October 2026: `eslint . --max-warnings=0` pass, `tsc --noEmit` pass, unit tests 49 pass, 0 fail. Playwright, a phone, contrast measurement, and a hand-played career were not run.

One decision check, not a full career: 30 seeds, 1000–1029, a fresh Pro player, first playoff round, choice index 0 versus the last choice, same player state before the round. The series result changed in 4 of 30. The other 26 stayed the same. A full-career counterfactual is not available without an injection hook, which was not added.

Scenarios that retire a typical career at 34–35, or cap age at 35, were not simulated. They would change `careerEndingSignal` or `MAX_AGE`. That was not authorized.

Browser check on 2026-10-03, local Vite at `http://127.0.0.1:4179`, Playwright Chromium, not a phone. The suite against that server: 12 passed, including the three new checks and the existing end-to-end specs. ESLint, `tsc --noEmit` and 49 unit tests also passed on this tree.

What the browser showed:

- The first HTML is a static fallback. It has no keyframes. After React mounts, the home mark receives the sweep class. On this machine the sweep was turned off because `hardwareConcurrency` is 4 or less (`pivot-lean`). Removing that class in the test made `animationName` equal `markSweep`. Reduced motion leaves it at `none`. Dark mode sets `--color-bg` to `#1c1c1e`.
- A poisoned write shows the alert and a reload still opens "L'ultimo inverno". The previous save string was unchanged.
- "Gioca a 36 anni" leaves that card. The following season was not played through to the end.
- The year sheet was empty after season 1 because `SeasonSheet` was memoized over a mutated player. The memo is removed. The sheet then showed PPG, RPG and APG, the legend, and the advanced block closed. Opening it showed USG%. The swipe layer had been capturing the pointer on `summary`, so the block could not open. `summary` is now treated as a control, not a swipe. Tab buttons were at least 44px at 320 and 390. No physical device was used.

Pull request #16 is open. It is not merged. The public site was not deployed from this pass.

Later the same day, on the same branch, Playwright drove the age-35 retirement card. "Gioca a 36 anni" left that card. The next season was played through its recap. The screen then showed "Carriera conclusa", the text "36 anni", and the Career Card. The winter card did not return. The click loop stopped inside 16 steps, in 7.3 seconds. This used a constructed save, not a career played by hand from the draft. No retirement rule was changed.

Startup, headless Chromium, Linux, 2 CPU cores, viewport 390×844, localhost, no throttle. Dev server: the "Inizia" button accepted a trial click in 373 ms. First contentful paint 36 ms. Production preview on port 4180, three loads: 189 ms, then 87 ms, then 75 ms. First contentful paint on the cold production load was 72 ms. A phone was not measured. The public site was not measured.

The mark keeps the sweep class, but on this machine `pivot-lean` turns the animation off because the CPU count is 2. That was the same at 320, 390, 768 and 1440, in dev and in the production preview. Reduced motion was `none` at 320 and at the other widths. Removing the lean class in the existing boot test still reads `markSweep`. No new animation was added.

The result line for this one-season save reads "1 stagioni". That plural was seen and left unchanged.

---

## 16. Boot mark, 2026-10-03

Pull request #16 was merged to `main` as `d19ccc4`. GitHub records its head as `c2f4af9`. The year-sheet update and the age-36 browser test were not in that merge. They are on `grok/p0-boot`, which starts from `d19ccc4`.

This pass adds a boot mark in the first HTML. A sweep named `bootSweep` runs for 2.2 seconds while the script loads. React replaces that screen as soon as it mounts. There is no timer that holds the welcome. Reduced motion sets that animation to `none`, and the ring with "23" stays. Playwright confirmed both, with the module delayed only in the test, headless Chromium, local Vite `http://127.0.0.1:4179`.

On a machine with 2 cores the home mark no longer goes fully still. `pivot-lean` now plays a 0.45 second fade (`markLean`). The full `markSweep` still runs when that class is removed. The infinite save spinner stays off on lean devices.

The result and the Career Card now say "1 stagione" and "2 stagioni". The age-36 browser check saw "1 stagione". A unit test covers 0, 1 and 2.

Not done in this pass: a career played by hand from the draft, a phone, a new production timing, and any change to retirement or formulas. John, Al, Rebecca and James were not available as separate reviews.

---

## 17. Award names, 2026-10-03

Branch `grok/language` starts from `grok/p0-boot` `8cdc54a`. Pull request #17 is open on that boot branch and was not modified.

Award chips, the year sheet, the league boards and the Italian award lines now use one official English name. `All-League` and `Quintetto` are no longer substituted for All-NBA. The chrome dictionary has the same keys in Italian, English and Spanish, with no empty string. Spanish stays out of the language picker because the events are still Italian.

Details are in [`language-qa.md`](language-qa.md). No formula or save version changed.

---

## 18. Playable path, 2026-10-03

`main` at the start of this pass was `5d00647`. The work is on `grok/demo-visual-polish`.

The retirement fixture used by the browser tests now lives in `apps/pivot23/e2e/fixtures/make-retire-save.ts`. It no longer depends on `/tmp/make-retire-save.ts`. The generated JSON is not committed.

The first scripted card is titled `Rookie of the Year`. The closing commentary speaks to the player, and the award lines that still said "premio da matricola" or "difensore dell'anno" now use the official name. The choice effects are unchanged.

Playwright, headless Chromium, Linux, 2 cores, viewport 390×844, local Vite `http://127.0.0.1:4179`. A new player named Carriera Intera was created from Inizia, drafted, and played by always taking the first available choice. After 61 steps the screen showed Carriera conclusa and the archive listed that name. This is not a phone, and it is not every choice a person might make.

Spanish stays out of the picker. The story pools were not translated. No formula or save version changed. Al, Rebecca, John and James did not review this separately.

---

## 19. Branch 19, rebuilt, 2026-10-03

Pull request #19 is `grok/demo-readiness` at `65bdfc9`. It stays where it is. It was not deleted.

It does not merge into current `main` `5035f04`. Git reports conflicts in `apps/pivot23/e2e/demo-readiness.spec.ts` and `docs/project-state.md`. Its boot test requires the first HTML to contain no `@keyframes`. Current `main` has `bootSweep` in that HTML. Run against this tree, that assertion failed. The same file calls `/tmp/make-retire-save.ts` and `/tmp/pivot-a84fa7e`, which are not in the commit.

The useful part is already on `main`: the year sheet is not memoized, the swipe layer ignores `summary` and `details`, one season is written "1 stagione", and the browser tests live next to `e2e/fixtures/make-retire-save.ts`. This branch starts from that `main` and does not copy the old spec back.

Checked on this tree, Linux, 3 October 2026: ESLint pass, `tsc --noEmit` pass, unit tests 53/53, production build pass, Playwright `demo-readiness.spec.ts` 8/8. Headless Chromium, Vite `http://127.0.0.1:4179`, 2 cores. Not a phone. On branch 19 itself, earlier the same day: ESLint pass, `tsc` pass, unit tests 49/49. That older suite does not include the later copy tests.

No formula or save version changed. No merge and no deploy.

---

## 20. Intro granata, 2026-10-03

Branch `grok/intro-granata` starts from `main` `e69ff66`. The boot screen in `index.html` now draws the same mark as `CourtMark`: ring, two arcs, side ticks, and 23. It is not a new symbol.

The field is `#0c0b0d`. The existing token `--color-granata` is `#6C1320`. On that black field the mark uses `#A31D2E`, the darker-theme granata, so the stroke stays visible. One motion, `bootArc`, runs a light once along the real arcs for 2.2 seconds and then leaves. React still replaces the screen as soon as the module loads. There is no hold.

Reduced motion turns that light off. If the module never arrives, the mark, the startup sentence, and the reload link stay. The home mark, the lean rule, and the career engine were not changed.

Measured on Linux, headless Chromium, 2 cores, local Vite, not a phone. The mark was 281 px wide at 390×844 and 420 px at 768 and 1440, inside the viewport. Alone, 60 frames averaged 16 ms and peaked at 17 ms. While the unit suite was also running, one gap reached 83 ms. The Inizia button accepted a trial click in 487 ms. No JavaScript error was recorded in that boot check. Unit tests 53/53, ESLint, `tsc`, the production build, and 10 browser tests passed on this tree.

A phone was not used. Production was not deployed.

---

## 21. Intro in production, 2026-10-03

Pull request #24 was merged to `main` as `58e8365`. The head was `6abae43`. GitHub `verify` passed, including the browser suite. Locally, on that same head, ESLint, `tsc`, 53 unit tests and 10 browser tests passed. A first local run against port 8080 failed because that port was a different app, not PIVOT 23. Repeated against the PIVOT server, the same 10 tests passed.

Claude, Gemini and James did not send a review. None is recorded as an approval.

Production `https://pivot23.vercel.app` served the new intro after the merge. GitHub deployment `6827628745`, Vercel status success, inspector `https://vercel.com/jarvis-hq-vercel/pivot23/5aGq34HzfGxjXnaaL5qv4MpYnRFC`. The bundle was `index-CcXA-oDK.js`. On a delayed load the mark was 281 px wide, the background was `#0c0b0d`, and the gleam was `bootArc`. Reduced motion set that gleam to `none` and left the 23. After the script loaded, the home title was visible, the theme color was `#f5f5f7`, and there was no page error. The bundle still contains the Totem credit and the two-core lean rule.

A phone was not used. Vercel project settings were not changed. The API that lists deployments returned 403 for this token, so the deployment id above comes from GitHub, not from the Vercel API.

---

## 22. Chrome language and home premiere, 2026-10-03

Branch `grok/pivot23-master-improvement` starts from `main` `c7778cd`. It is not merged.

The setup, the guide, the difficulty names and the season count on the result now follow Italian or English. Spanish strings exist and the picker still hides Spanish. The numbers in `difficulty.ts` were not changed. Story pools were not rewritten.

On the home, the real mark plays one 4.8 second settle, `cineReveal`, with a granata light on the arcs. «Inizia» stays clickable. «Salta» ends it. Reduced motion does not start it. On 1 or 2 cores the same motion lasts 1.6 seconds. There is no timer that holds the buttons.

Checked on Linux, headless Chromium, 2 cores, local Vite, not a phone. ESLint pass, `tsc` pass, unit tests 54/54, production build pass. Browser: the new skip check plus the previous boot, year, save, age-36, career and four-core checks, 11/11. The career from Inizia took 66 first-choice steps. The mark during the boot shell was 281 px at 390 and 420 px at 768 and 1440. One frame gap during that boot sample reached 50 ms. The age-35 retirement fixture on disk was 19,796 bytes. A phone was not used. Production was not deployed from this branch.


---

## 23. Master cycle 1 — baseline, stability, engine, 2026-10-03

Branch `grokbot/demo-hardening` from `main` `1099511`. Not merged. Draft PR. Author Grok Bot.

### Baseline (verified on `1099511`, Linux, Node 20.19 locally; CI uses Node 24)

- `main` HEAD `1099511` = merge of PR #28 (intro animation). PR #26, #27, #28 merged by the account `niccolopello-source`. No open PR before this cycle except the parallel workers' branches (`grokbot/full-translation`, `grokbot/bundle-split`, `grokbot/balance-d11-d23`).
- CI on `main`: run 37136916431 success (lint, typecheck, unit, build, check:headers, e2e on `vite preview` with production headers; separate statistical job).
- Local re-run on `1099511`: ESLint pass, `tsc` pass, unit 84/84, build pass (main chunk 744.84 KB / 238.28 KB gzip, chart chunk 379.65 KB lazy), `check:headers` 6/6, e2e on production build 37/37.
- Commands: `pnpm install --frozen-lockfile`, `pnpm run lint`, `pnpm run typecheck`, `pnpm run test`, `pnpm run build`, `pnpm run check:headers`, `pnpm run test:e2e:preview` (all in `apps/pivot23`); `pnpm run test:stats` is the ~4-minute statistical suite. `E2E_PORT` (new) moves the e2e server off 4173/8080 when another worktree holds them.
- Vercel: `apps/pivot23/vercel.json` holds headers only (no build settings). Production serves the same asset hashes as a local build of `1099511` and the CSP header, so the project root is `apps/pivot23` (inferred, setting not read). Vercel settings were not touched.
- Versions: `ENGINE_VERSION` `2.11.0-beta`, `SAVE_VERSION` 11 (player schema), `LIVE_SAVE_VERSION` 2, no live migrations.
- Prior report reconciliation: `final-implementation-report.md` said 8 commits of `grokbot/demo-stability` were not on `main` and needed a new PR; they were merged as #27. «Root directory to verify» is now answered indirectly by the live headers. Its other claims (save safety, chunk retry, DPOY NBA-only, CSP) match the code on `1099511`.

### Home intro duration (owner request: +1500 ms)

- Where: `apps/pivot23/src/styles.css`, rule `.court-mark-live.is-premiere`, `animation: cineReveal …` (line 1099 on `main`, line 1100 on the branch). The premiere ends on `animationend` (`PivotApp.tsx`), no JS timer. The boot curtain (`index.html` `curtainWipe` 0.52 s, `intro.ts` fallback 1.5 s) runs in parallel and was not changed.
- Before: 4.8 s (4800 ms). After: 6.3 s (6300 ms). Measured on the production build in headless Chromium: 6358 ms and 6381 ms from mount to hand-off.
- Unchanged: lean devices (≤2 cores) and returning visits 1.6 s; reduced motion: no premiere. Decision P-013 asks whether those should change too.
- Bugs found and fixed while testing it: (1) going back to the home after leaving it mid-premiere replayed the premiere from 0; (2) at 1280×720 the «Salta» chip sat under the mark wrapper (`.intro-hero > *` forced `z-index: 1`) and the click never reached it.
- Tests: `e2e/home-premiere.spec.ts` (duration, Start mid-premiere + return home, skip, reduced motion), `src/components/pivot/premiere.test.ts` (configured values).

### Stability

- Error boundaries: app-level (`main.tsx`) and career view (`CareerGuard`) now share `CrashFallback`. New: when a saved career exists, a second button copies it to `pivot-v2-save-crashed` and opens a clean home (removes nothing it could not copy). Reason: a checksum-valid save that breaks rendering looped on «Ricarica» (reproduced, `e2e/init-failure.spec.ts`).
- Chunk load: `LazyChunk` (chart) bounded retry ×2 with cache-busting URL, stable fallback — verified by the existing `e2e/chunk-failure.spec.ts`; no change.
- Boot fallback: static boot screen with reload link if the entry script fails — existing e2e; `prepareIntro()` errors no longer stop the app from mounting.
- React duplicate keys on repeated milestone/award labels fixed (dev-only warning, could drop or duplicate chips).

### Persistence

- New `persistence.test.ts`: set-aside (copy then remove; storage full keeps the save), every season of 4 long careers saves/loads/resumes on the same RNG state (largest save well under 400 K chars), compaction under a quota, 120 truncation points, ARCHIVE_LIMIT order/eviction, archive backups.
- Bug fixed: `saveArchive()` silently overwrote an unreadable archive and dropped entries it could not read (e.g. newer version). Now backed up in `pivot-v2-archive-backup` first.
- Checksum scope documented in `pivot23/SAVE-FORMAT-AND-MIGRATIONS.md`.

### Engine randomness audit

| Source | Where | Seeded? | Action |
|---|---|---|---|
| `rand/pick/randInt/chance/gaussian/gaussTrim` | all of `src/lib/pivot` (simulation, playoffs, draft, awards, injuries, events, CPU market/world, progression, retirement, rosters) | yes, Mulberry32 per career, state saved as `rngState` | none |
| session fallback RNG in `rng.ts` | any draw outside `withPlayer`/`runWithRng` | no (fixed seed per page, shared) | counted by `fallbackDraws()`; 0 in simulations and 0 in 29 UI e2e flows (dev probe). `beginPlayoffs` now wraps itself (no outcome change: 300 careers hash-identical to `main`). Story `fx` closures still rely on the caller's context (UI and simulator both provide it). |
| `[...ROOKIE_NAMES].sort(() => rand() - 0.5)` | `league.ts` rookie class, career start | seeded but order and number of draws depend on the JS engine's sort | `RULES.rookieShuffle` (`rules.ts`), default `current`; `portable` = Fisher–Yates. Proven with a foreign merge sort in tests. Changes per-seed outcomes → needs an engine version bump (P-012). 1,000 careers current vs portable: peak 77.13 / 77.10, titles 0.363 / 0.368, hit90 0.097 / 0.099, ROY 0.030 / 0.038. |
| `Date.now() ^ Math.random()` | `newSeed()` | no, by design | only creates a seed when a career has none |
| `crypto.randomUUID`, `Date.now` | careerId, archive id, `savedAt`, backups | no, not gameplay | none |
| `performance.now`, `Date.now` | UI pacing, swipe | no, not gameplay | none |

Invariants (`engine-invariants.test.ts`, 320 careers across difficulties, paths and draft policies): no skipped/duplicate seasons or years, age +1 per season, no negative stats, overall 48–99, games ≤ season length and W+L = season length, no duplicate awards, at most one All-NBA team, no NBA awards in EuroLeague seasons, ROY only in the first NBA season, title/Finals-MVP/MVP/All-Star/DPOY counters match rows and milestones, one champion per league-year, |Δoverall| ≤ 6 per year and no rise after the apex age, attributes and hidden traits inside bounds, no active CPU star on two rosters, every career finishes in ≤ 21 steps. 0 violations on the current code. Interleaved careers equal careers run alone.

A phone and Safari/WebKit were not used. Nothing was deployed.
