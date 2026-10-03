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

- URL: https://pivot23.vercel.app
- Source of the game that was verified in production on 2026-09-28: `main` at `421a4a0`, then a document-only commit `228a748` was also deployed to production.
- Engine label in the bundle checked that day: `2.11.0-beta`

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
