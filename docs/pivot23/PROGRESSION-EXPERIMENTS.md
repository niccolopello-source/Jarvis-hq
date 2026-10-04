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

Non eseguiti in questa sessione oltre al ciclo di ruolo nel lab. Minuti, work ethic, coach e infortunio non sono argomenti di `playCareerSim`: isolarli richiede un gancio nell'engine, non uno script parallelo. Proposta: un flag di esperimento in `TUNING`, spento di default, con lo stesso seed. Non attivato.
