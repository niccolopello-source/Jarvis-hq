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
| AW-01 | P1 | in PR (awards v2) | MVP: stanchezza dei votanti solo sul giocatore, permanente (−7 per ogni MVP, −2,5 per ogni titolo) e margine +2 da battere. Repro 2.14: Esordio seed 57919 stagione 8, giocatore primo nel voto (85,4 vs 84,8) e MVP a Ilija Costa; 22 casi su 1.000 carriere. Fix 2.15: stessa stanchezza per tutti, dalla striscia (letta dai premi di lega), niente titoli, niente margine |
| AW-02 | P1 | in PR (awards v2) | ROY: `settleRoy` riassegna a ogni rookie CPU minuti e partite del giocatore; classe sempre di 5 nomi fissi con ruoli e squadre fissi (5,2 punti di media). Fix 2.15: classe seminata (24 nomi, ruoli, scelte 1–14, squadre, partite), ogni rookie con la sua riga |
| AW-03 | P2 | in PR (awards v2) | ROY per ruolo su 1.000 carriere 2.14: SG 62,2%, C 1,1%. 2.15: SG 34,4%, SF 24,1%, PF 16,1%, PG 14,5%, C 10,9% |
| AW-04 | P2 | in PR (awards v2) | Soglie partite incoerenti (6MOY 52, All-NBA/MVP 58). 2.14: 31 Sixth Man e 21 All-NBA sotto 65 partite su 1.000 carriere (repro: Pro seed 65838 stagione 7, 6MOY con 52 partite). 2.15: regola NBA delle 65 partite per MVP, All-NBA, ROY, DPOY, MIP, 6MOY |
| AW-05 | P3 | in PR (awards v2) | All-NBA Primo/Secondo quintetto senza All-Star: 40 su 564 (repro: All-Star seed 57919 stagione 7). 2.15: Primo/Secondo quintetto implica All-Star |
| AW-06 | P3 | in PR (awards v2) | DPOY assegnato alla star della miglior difesa, fuori dalla corsa, quando il giocatore guida la corsa ma non passa un requisito: 11 casi (repro: Esordio seed 57919 stagione 6). 2.15: vince il miglior CPU della corsa |
| AW-07 | P3 | documentato | `RULES.rookieShuffle` non è letto da nessuna parte (la classe non usa più un sort casuale). Flag morto, lasciato per non toccare `rules.ts` |
| AW-08 | P3 | documentato | DPOY: striscia massima 3 su 1.000 carriere sia in 2.14 sia in 2.15 (D-23 invariato, non toccato) |
| P3-HTML-PROTO | P3 | aperto | `artifacts/pivot.html` e `2.html` non sono il prodotto |

Owner delle approvazioni: l'utente. Nessun merge implicito.
