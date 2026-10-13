# QA execution plan — Bot C

Candidate: `ae9f1d0228cad53a2e9d0b2a5112d3d131055f98` (`main`, production).
Checked again 2026-10-13, after 22:43 CEST. Production etag `6eee7648efc9264ded0536fe9b1d7c39`, last-modified 20:18:15 GMT. Boot assets still `index-6wnsWQXd.js` / `narrative-CsQjyxez.js`.
Engine `2.19.0-beta`. Save version 11.
This file does not edit `ISSUE-REGISTER.md`, `DEMO-READINESS.md` or `WORK-OWNERSHIP.md` (PR #92 and #93).

## Conflict map

| PR | State | Files Bot C must not touch |
|---|---|---|
| #92 | draft, audit of `39129c9` | `DEMO-READINESS.md`, `INDEPENDENT-DEMO-GATE-REPORT.md`, `ISSUE-REGISTER.md`, `WORK-OWNERSHIP.md` |
| #93 | draft, mergeable, copy IT/EN | `i18n.ts`, `narrative/en/*` listed on the PR, `e2e/a11y-i18n.spec.ts`, `e2e/g5-smoke.spec.ts`, `e2e/save-safety.spec.ts`, `WORK-OWNERSHIP.md` |
| #94 | draft, mergeable, EN follow-up | `narrative/en/league.ts`, `narrative/en/awards-helpers.ts`, `narrative.test.ts`, `LOC-AUDIT-B-2026-10-13.md` |

No open engine PR. #90 and #91 are already in this SHA.

## Done in this pass

| Gap | Result | Evidence |
|---|---|---|
| Perf probe `PERF=1` | executed, 2/2 | `QA-EVIDENCE.md` |
| Season timing | executed | p50 1.7 ms, under the 1.2 s checklist line |
| Corrupt save and quota | executed in unit + two production e2e | simulated `QuotaExceededError`, not a full disk |
| English career, live site | executed, completed | one Chromium run |
| Axe IT/EN | executed on production, 0 violations | not a phone |
| `g5-smoke` flake | 3/3 pass tonight on production | does not prove it never flakes |

## Still open

| Priority | Action | Owner | Done when |
|---|---|---|---|
| 1 | iPhone Safari and Android Chrome, checklist below | Pello | Each step PASS or a named FAIL with a screenshot |
| 2 | Do not merge #92 as written | Pello | The register names `ae9f1d0` or a newer SHA that is actually in production |
| 3 | #93 / #94 stay owner decisions | Pello, Bot B | Merged only after an English smoke on the combined SHA |
| 4 | Real storage-full on a device | Pello, only if a phone is already full | Notice shown, previous career still there |

## Manual checklist (not executed here)

Mark every line PASS, FAIL or BLOCKED. One device per column. Desktop Chromium headless is already recorded in `QA-EVIDENCE.md` and is not a substitute.

| Step | iPhone Safari | Android Chrome | Desktop |
|---|---|---|---|
| Portrait: logo, then Inizia/Start without a blank screen | BLOCKED | BLOCKED | PASS only in headless Chromium |
| Landscape phone: Inizia fully on screen, no horizontal scroll | BLOCKED | BLOCKED | PASS only at 844×390 emulated, earlier audit |
| Start a career (name, role, draft, one path) | BLOCKED | BLOCKED | PASS, IT and EN, headless |
| Play at least two seasons, reload, resume the same name and season count | BLOCKED | BLOCKED | PASS |
| Reach the Career Card and open it again from the archive | BLOCKED | BLOCKED | PASS |
| Switch IT → EN on the home screen | BLOCKED | BLOCKED | PASS |
| Damaged save shows a notice and does not wipe a good backup | BLOCKED | BLOCKED | PASS in headless, simulated quota |

Do not write PASS in those device columns until that device has been used.
