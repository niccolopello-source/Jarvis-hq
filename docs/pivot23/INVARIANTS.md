# PIVOT 23 simulation invariants

These are rules. Where the code on `main` breaks one, the break is a defect, not a new rule.

## Kept on purpose

1. The assigned peak age is 26, 27 or 28. The overall does not rise after that year, and it does not sit on 99 after it.
2. Displayed overall stays inside 48–99.
3. A career that is still going can reach age 36. D-001.
4. Difficulty changes the height of the career. It does not invent a second sport: Esordio, Pro, All-Star and Leggenda use the same life, the same peak window and the same retirement rule.
5. Draft noise and season noise do not share one random stream if a test needs to isolate the draft. If they still share one stream, say so in the test. Do not pretend the draft was isolated.
6. A playoff series is not created for a team that has no real seed.
7. A games penalty is applied once. Injury risk does not multiply it again.
8. Award targets written in config and read by nobody are not a balance system. Wire them or delete them. Do not cite them as the live rate.
9. The career card hash in the browser is a fingerprint of local data. It is not a signature. It does not prove rarity.

## Broken on the production bundle of `421a4a0`

1. Retirement is `age>=36` only. Nothing else ends a career. This violates the intent of P0-LIFE. It does not violate D-001: reaching 36 is still possible, and today it is unavoidable.
2. Real NBA franchise names ship in the public JavaScript. See P-005. Not an accepted rename.

## Not measured on `421a4a0`

Peak age locked to the assigned year, award streaks, bust rate and Boston's title share were measured on the sandbox tree. Treat them as likely, and re-measure on `main` before calling them fixed or confirmed. The method and the numbers are in AUDIT-GROK-001.md.
