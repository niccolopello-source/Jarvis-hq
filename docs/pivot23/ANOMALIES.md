# Anomaly register

Updated 2026-10-01 on branch `grok/phase-b-demo`, based on `main` `89249ef`. Status is confirmed, hypothesized, or not verified. No formula or save-schema change is authorized.

| ID | Status | Class | What | Evidence | Action |
|---|---|---|---|---|---|
| A-01 | Confirmed, fix in this branch | P2 | «Oklahoma City Thunder» was clipped on the Finals dossier at 375 and 390 px. | Public-site screenshot, 2026-10-01. Cause: `.team-label-name` was `nowrap` plus hidden overflow. | Wrap the name inside `.team-dossier` only. Regression: `e2e/team-name.spec.ts`. |
| A-02 | Confirmed | P1 product, not a code defect | Real NBA franchise names ship in the demo. | `teams.ts` and the public bundle. | D-015: keep the names. Legal review before commercial distribution. No rename in this phase. |
| A-03 | Confirmed by code, coverage not verified line by line | P1 copy | Spanish was selectable. French was not present. | Selector listed `es`. D-014 removes it from the selector. Dictionary `es` remains. | Do not treat Spanish as a finished language. |
| A-04 | Confirmed | P3 | A loss prints the opponent score first in the sentence and the player score first on the series strip. | EuroLeague Final on the public site: strip `74-75`, sentence `75-74`. `engine.ts` uses `oppScore` for loss lines. | No copy rewrite in this phase. |
| A-05 | Confirmed | P3 | EuroLeague dossier can read «Eurolega · Eurolega» because division and conference render the same word. | Public Final screen, Real Madrid. | No change in this phase. |
| A-06 | Confirmed | P3 | A championship result card (`title-win`) always gets the gold class, outside the Finals-round predicate. | `PivotApp.tsx` log class. | No change in this phase. |
| A-07 | Not verified as a new measurement | P1 | Bust rate, title concentration, and whether role weights change the box score. | Open as P1-BUST, P1-WORLD, P1-ROLE. The phase-b unit run did not add those measurements. | Read only. Do not tune constants. |
| A-08 | Confirmed as process | P0 process | The App Builder tree is not `main`. | File diff of `src/lib/pivot` against `apps/pivot23`. | D-016. Do not copy it over the repository. |
| A-09 | Confirmed, historical doc | P2 | `FACTS.md` dated 28 September described `421a4a0`. | Replaced with the 1 October baseline in this branch. | Docs only. |
