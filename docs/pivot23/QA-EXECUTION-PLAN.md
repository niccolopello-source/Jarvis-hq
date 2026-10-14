# QA execution plan — Bot C

SHA `21764f3c6de01c447191f98c3f45a211aad008fc` (main = production). Engine 2.19.0-beta, save version 11. Freeze from 17/10, demo 18/10.

## Conflict map

| PR / branch | State | Files | Bot C rule |
|---|---|---|---|
| #92 grokbot/bot2-independent-gate | draft, conflicting, being merged with Pello's approval | DEMO-READINESS.md, INDEPENDENT-DEMO-GATE-REPORT.md, ISSUE-REGISTER.md, WORK-OWNERSHIP.md | not touched |
| #93 lucille/copy-review-it-en (0ef6563) | draft, CI failing | i18n.ts, narrative/en/*, data.ts, a11y-i18n/g5-smoke/save-safety specs, tests, glossary, WORK-OWNERSHIP.md | not touched |
| #95 grokbot/qa-execution-ae9f1d0 | draft, this PR, main merged in | the four QA docs only | owner |
| grokbot/freeze-readiness | parallel task (freeze doc) | its own doc | not touched |

Overlap risk: WORK-OWNERSHIP.md shared by #92 and #93 (not ours).

## Decisions already taken (not reopened)
A-PEAK fix post-demo (2.20); neutral +0.05 stays; All-NBA 3rd without All-Star OK; Leggenda retirements ~285–320 accepted; freeze 17/10.

## Priorities

| # | Task | Owner | Depends on | Acceptance | Status |
|---|---|---|---|---|---|
| 1 | Physical device checklist below | Pello | none | every row ticked on 21764f3c6de01c447191f98c3f45a211aad008fc (or the final SHA) | BLOCKED |
| 2 | Merge #92 then #95 | Pello | — | both on main | in progress |
| 3 | Analyse prod e2e failures (QA-07) | prod-e2e task | its run | each failure explained or reproduced | INCONCLUSIVE |
| 4 | Fix #93 CI (QA-08), then re-verify fingerprint/e2e | Lucille, then verify-93-94 task | #93 | CI green, fingerprint unchanged | OPEN |
| 5 | Re-run this suite on the final pre-freeze SHA | Bot C | 2, 4 | same results as QA-EVIDENCE | NOT RUN |

## Manual checklist (Pello, ~15 min per device, on www.pivot23.com)

Before starting, note the device, OS and browser version. A failure = screenshot + what you tapped.

| # | Step | iPhone Safari | Android Chrome | Desktop |
|---|---|---|---|---|
| 1 | Open the site cold: logo then home, no blank screen > 3 s | ☐ | ☐ | ☐ |
| 2 | Rotate portrait ↔ landscape on home and in career: nothing cut off, no sideways scroll | ☐ | ☐ | n/a |
| 3 | Inizia → name, role, path → Draft → first season | ☐ | ☐ | ☐ |
| 4 | Play 3 cards, close the tab/app fully, reopen: same card, same season | ☐ | ☐ | ☐ |
| 5 | Play to retirement (or "Chiudi ora"): Career Card shows name, years, seasons; export PNG | ☐ | ☐ | ☐ |
| 6 | Archivio: the finished career is there and opens | ☐ | ☐ | ☐ |
| 7 | Switch to English, reload: home and career text in English; switch back | ☐ | ☐ | ☐ |
| 8 | Storage error: Safari private window (iPhone) / site data blocked (Chrome settings) → the "saving is off" notice appears, game still playable | ☐ | ☐ | ☐ |
| 9 | Reopen normal window: previous career still there | ☐ | ☐ | ☐ |

Not PASS until Pello ticks it. Agents mark these BLOCKED.
