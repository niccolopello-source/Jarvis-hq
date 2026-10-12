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
| G5-F01 | P3 | documentato | Il chunk `narrative` (88 kB gzip) è in `modulepreload` nell'`index.html`: JS iniziale reale ≈249 kB gzip, non ≈155 kB come scritto l'11 ott. Sotto il budget di 350 kB; nessun controllo automatico del budget in CI. Owner: release eng. (misura), frontend (eventuale lazy-load) |
| G5-F02 | P3 | documentato | Il campo nome ha `maxLength=20`: «Massimiliano Della Valle-Giordano» diventa «Massimiliano Della V». Comportamento voluto, non bug; protocollo dispositivi aggiornato. Decisione UX a Pello |
| G5-F03 | P2 | aperto | Vercel MCP: `list_deployments` 403 sullo scope `jarvis-hq-vercel`. Provenienza ricavata da GitHub Deployments + confronto hash asset (identici). Nessuna riconnessione fatta |
| P3-HTML-PROTO | P3 | aperto | `artifacts/pivot.html` e `2.html` non sono il prodotto |

Owner delle approvazioni: l'utente. Nessun merge implicito.
