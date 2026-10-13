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
| ENG-GATE-216 | P1 | in PR #83 | Decisioni #83 spostate su 2.16.0 (prima 2.15.0): 2.15 è già in produzione con awards v2 (#86, deploy `cba5a29`). 640 carriere 2.15/2.14/2.13/2.12 = main @ `cba5a29` (`version-gate.test.ts`). Nota in `ENGINE-DECISIONS.md`. Coerenza premi 2.16: bonus MVP positivo dimezzato per MVP vinto (Esordio max 7 → 6), ROY per difficoltà nel punteggio v2 |
| G1-R1 | P2 | in PR (G1) | Ultima decisione persa se la scheda viene uccisa senza `pagehide` entro 360 ms + idle (≤900 ms) dal click. Repro e2e `g1-persistence.spec.ts` (playoff/FA/scambio): storage ancora sulla carta vecchia 100 ms dopo il click. Fix: salvataggio sincrono quando la carta pendente cambia (decisione confermata); resto invariato, differito |
| G1-R2 | P3 | documentato | Due schede su carriere diverse: `flushLive` non sovrascrive l'altra carriera su `pagehide`; vale l'ultimo salvataggio (avviso `otherTab` già presente). Il salvataggio immediato di G1-R1 segue la stessa regola del differito. Nessun cambio |
| G1-D1 | P3 | in PR (G1) | Archivio: riepilogo (titoli, ppg, stagioni, nome) diverso dalla Career Card accettato in silenzio (repro: titles 99, ppg 99). Fix: segnalato in archivio («da verificare»), dati conservati |
| G1-D2 | P3 | in PR (G1) | Archivio: Career Card con impronta errata rimossa in silenzio e persa alla scrittura successiva. Fix: carta conservata e segnalata; carta illeggibile nascosta, segnalata e archivio grezzo salvato in `pivot-v2-archive-backup` prima della scrittura. L'impronta SHA-256 copre solo la carta e non ha chiave: rileva corruzione, non manomissione. Formato salvataggi invariato |
| P3-HTML-PROTO | P3 | aperto | `artifacts/pivot.html` e `2.html` non sono il prodotto |

Owner delle approvazioni: l'utente. Nessun merge implicito.
