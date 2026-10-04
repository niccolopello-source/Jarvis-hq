# ENGINE VALIDATION — 2026-10-04

Baseline di partenza: `main` `fde5b74`. Il lab non duplica la progressione: chiama `playCareerSim`.

## Risultato misurato

Node v20.20.2, `npm install` locale, non il runner CI.

`lab.test.ts`: 3 pass, 0 fail, 1,56 s.

`lab-runner.ts 12 23000`: 12 carriere, 0 mismatch, 0 integrità rotta, 2206 ms. Tra i potenziali ≥ 85 del campione (conteggio nel JSON, non una popolazione) la quota bust è 0. Superstar 2/12. TPR medio 1,03. Età di fine carriera osservate: 32, 34, 36. Box score medio, n=2 o 3 per ruolo: PG 8,5/1,8/3,9, SG 16,3/2,7/2,9, SF 11/3,2/2,5, PF 12,8/6,1/2,1, C 9,8/6,9/1,5. Campione troppo piccolo per chiudere P1-ROLE. I rimbalzi salgono verso il centro, gli assist verso il play. Non è una taratura.

## Cosa il lab controlla

- Due esecuzioni con stesso seed, ruolo, percorso e difficoltà producono lo stesso SHA-256 del fingerprint (stagioni, eventi, scelte, premi, record).
- Niente NaN, niente stagione duplicata, `gp` nel range, `apexAge` 26–28 come imposto dal tipo.
- Tabella PPG/RPG/APG per ruolo sugli stessi seed. È evidenza per P1-ROLE, non una taratura.

## Cosa non è stato eseguito

- Salvataggio e ripresa dentro il lab. La compatibilità save resta coperta da `save.test.ts`, non rilanciato qui.
- Popolazione da 1.000 carriere. Non dichiarata.
- Soglia «100 carriere in meno di 5 secondi». Non misurata come gate.
- Confronto log-normale. Non implementato: il mandato chiede una dimostrazione prima di adottarlo.

## Definizioni usate

Allineate a `DEFINITIONS` in `src/lab/lab.ts` e a P1-BUST in `docs/memory/TASKS.md`. Non sono obiettivi di frequenza. Il modulo sta fuori da `src/lib/pivot` perché lo scanner i18n tratta ogni stringa letterale come prosa da tradurre.
