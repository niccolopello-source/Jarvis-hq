# PROGRESSION EXPERIMENTS — 2026-10-04

Nessuna costante di aging, bust o minuti è stata cambiata. `docs/memory/TASKS.md` vieta la taratura finché il test nominato non fallisce su `main`.

## Definizioni operative di questa sessione

| Termine | Definizione usata | Stato |
|---|---|---|
| Bust | potenziale ≥ 85 e picco ≤ potenziale − 8 | Ipotesi già in P1-BUST. Non è un tasso obiettivo |
| Superstar | `peakOverall >= 90` | Proxy già usato da `hit90`. Non è All-NBA |
| Peak OVR | `PlayerState.peakOverall` | Campo esistente |
| Età del picco | `apexAge`, vincolata a 26–28 dal codice | Non è l'età del massimo osservato se divergono |
| TPR | picco / potenziale | Calcolato dal lab, non mostrato in UI |
| Crescita netta | picco − overall della prima stagione | Non ancora nel report CLI |
| Breakout | non definito | Ipotesi Gemini non adottata |
| Declino fisico / cognitivo | non separati | `applyAging` esiste; il lab non lo isola |

## Conflitto con i report Gemini

Picco fisico 22–24 e cognitivo 27–31 non è il comportamento del codice. Il codice tiene `apexAge` in 26–28 per tutti. Registrato, non sovrascritto.

La log-normale proposta non è stata implementata. Manca la dimostrazione che il campionamento sia corretto e migliore delle regole attuali.

## Controfattuali

Eseguiti sul gancio `SimOpts.experiment`, spento se assente. Commit di lavoro: branch `grokbot/experiment-hook`. Baseline del percorso giocato invariata: fingerprint `14b5a0cf46fb45b5`, `faf83fdfa7a6894c`, `6c6b0ee4331b6c0e` sui seed 23017, 23034, 23102.

Campione: 24 seed `90000+i*19`, Pro, draft random, ITA, numero 23. Non è una taratura.

| Confronto | Risultato | Stato |
|---|---|---|
| Minuti 10 contro 28 | picco medio −0,4 per i 28 minuti; +2,5 stagioni | VERIFIED sul campione. Non è una causa grande del picco |
| Work ethic 20 contro 90 | picco medio +2,3 per l'etica alta; lock finale vero su 24/24 | VERIFIED. Effetto piccolo |
| Infortunio off contro forced (18 partite) | +17,6 gp/anno senza infortunio; picco medio −0,2 | VERIFIED sul miss forzato. Il picco non si muove |

Il potenziale resta un argomento già esistente. Sul commit precedente, 70 contro 92 muoveva il picco di circa 23,8 e cambiava il consumo del PRNG. Non è stato rifatto qui come controfattuale pulito.
