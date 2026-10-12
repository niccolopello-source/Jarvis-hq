# ISSUE REGISTER — 2026-10-04

| ID | Sev | Stato | Note |
|---|---|---|---|
| P0-LIFE | P0 | sorvegliato | Soglie in `TASKS.md`. Non rieseguite su `fde5b74` |
| P0-BLACK | P1 | non riprodotto | Schermo nero storico. Fallback di boot presenti, causa non chiusa |
| P1-BUST | P1 | aperto | Definizione adottata dal lab, tasso non misurato su 1.000 |
| P1-WORLD | P1 | aperto | Non toccato |
| P1-ROLE | P1 | aperto | Il lab stampa la tabella. Non è una chiusura |
| P1-IP | P1 | aperto | Nomi franchigia NBA nel bundle. Rischio commerciale |
| P1-INTRO | P1 | aperto | Direzione a due palleggi non implementata. Manca l'audio da misurare |
| P2-ROBOTS | P2 | in PR | 404 in produzione. File aggiunto, non deployato |
| P2-CANONICAL | P2 | in PR | Canonical e OG aggiunti, non deployati |
| P2-VERCEL-SCOPE | P2 | aperto | Lista domini ok; alcuni endpoint team rispondono 403. Riconnessione non richiesta per il resto del lavoro |
| G3-B01 | P1 | in PR (G3) | Decisione di storia applicata due volte da tastiera durante la pausa (bottone solo `pointer-events:none`). Riprodotto in E2E, fix in `takeGesture` |
| G3-B02 | P1 | in PR (G3) | Archivio: `archiveSchema` futuro marcato come corrente e riscritto al salvataggio successivo. Fix minimo in `engine.ts`, da rivedere con Lucille |
| G3-F03 | P3 | documentato | Il save tiene solo gli ultimi 16 campioni di lega: dopo un reload l'albo d'oro è più corto. Esiti sportivi identici (test di replay) |
| G3-F04 | P2 | limite noto | Checksum locale ricalcolabile: un save modificato a mano si apre (anche overall 9999). Solo corruzione accidentale, mai prova di autenticità |
| P3-HTML-PROTO | P3 | aperto | `artifacts/pivot.html` e `2.html` non sono il prodotto |

Owner delle approvazioni: l'utente. Nessun merge implicito.
