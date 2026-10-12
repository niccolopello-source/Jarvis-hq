# ISSUE REGISTER — 2026-10-04

Aggiornamento 2026-10-12 su `main` `3bb757b` (motore 2.13.0-beta). Dettaglio e campioni: `ENGINE-CLOSURE.md`. Nessuna soglia di gioco è stata spostata.

| ID | Sev | Stato | Note |
|---|---|---|---|
| P0-LIFE | P0 | PASS, con A2 aperto | Riverificato: 321/1000 Pro < 34, 598 a 36, picchi 26–28. Il cliff a 32 anni non è stato corretto: è una decisione di design (D-1) |
| P0-BLACK | P1 | non riprodotto | Schermo nero storico. Fallback di boot presenti, causa non chiusa. Non rieseguito qui |
| P1-BUST | P1 | misurato, aperto come prodotto | Laboratorio 0/419 su potenziale ≥ 85. Option A 14,9% Pro, di cui 88,7% opportunità e non progressione |
| P1-WORLD | P1 | PARTIAL | Gini titoli simulati 0,303. OKC 11,4% complessivo, 15,3% nelle stagioni 1–5. Aperto |
| P1-ROLE | P1 | PASS | I ruoli separano il box score a minuti uguali. Tabella in ENGINE-CLOSURE.md |
| P1-IP | P1 | aperto | Nomi franchigia NBA nel bundle. Rischio commerciale. Fuori da questo passaggio |
| P1-INTRO | P1 | in bozza #77 | Suoni dell'intro. Non è questo branch |
| P2-ROBOTS | P2 | non rieseguito | Voce del 4 ottobre. Non verificata di nuovo |
| P2-CANONICAL | P2 | non rieseguito | Voce del 4 ottobre. Non verificata di nuovo |
| P2-VERCEL-SCOPE | P2 | aperto | Lista domini ok; alcuni endpoint team rispondono 403 |
| G3-B01 | P1 | unito #74 | Doppio invio da tastiera. Fix in `takeGesture` |
| G3-B02 | P1 | unito #74 | `archiveSchema` futuro non viene più riscritto. Rivisto con Lucille nel commit `25d8dfa` |
| G3-F03 | P3 | documentato | Il save tiene solo gli ultimi 16 campioni di lega. Esiti sportivi identici |
| G3-F04 | P2 | limite noto | Checksum locale ricalcolabile. Non è una prova di autenticità |
| A1-EXTRA36 | P2 | nota in lettura | 71/4000 accettano il 36 e non lo giocano. Carta, report e riga finale usano l'ultima stagione. Il diario lo dice. La regola non è cambiata |
| P3-HTML-PROTO | P3 | aperto | `artifacts/pivot.html` e `2.html` non sono il prodotto |

Owner delle approvazioni: l'utente. Nessun merge implicito.
