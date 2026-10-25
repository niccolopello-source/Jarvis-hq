# PIVOT 23 — Audit della parte procedurale

Base: `main` a640e54 (motore 2.22.0-beta, SAVE_VERSION 11). Data: 25 ottobre 2026.
Richiesta di Pello: "controlla la parte procedurale del gioco".
Questa PR contiene solo questo documento e due script di misura in `apps/pivot23/scripts/`. Non tocca il motore, quindi fingerprint e golden restano identici per costruzione.

Codex: l'unico ramo `codex/*` è `origin/codex/demo-hardening`, fermo al 30 settembre e senza una base comune con `main`. Non ci sono modifiche di Codex su `main` da riconciliare.

## Come rifare le misure

```
cd apps/pivot23
node --import=tsx scripts/procedural-audit.ts 1000   # semi 900000 + i*7919, 1000 carriere per difficoltà
node --import=tsx scripts/procedural-texts.ts 100    # harness testi, semi 500000 + i*104729, 100 per difficoltà
```

## Numeri principali (1000 carriere per difficoltà, scelte casuali)

| | Esordio | Pro | All-Star | Leggenda |
|---|---|---|---|---|
| Eventi per carriera (media) | 17,11 | 15,59 | 15,29 | 15,46 |
| Eventi distinti per carriera | 17,11 | 15,59 | 15,29 | 15,46 |
| Percorsi squadra distinti su 1000 | 1000 | 999 | 1000 | 1000 |
| ID evento distinti visti | 308 | 312 | 315 | 315 |
| Eventi del pool mai usciti | rk1, rk5, rk8, rk10 | idem | idem | idem |
| Non deterministiche (stesso seme due volte, 50 carriere) | 0 | 0 | 0 | 0 |
| Stati non validi trovati* | 0 | 0 | 0 | 0 |

\* I controlli: squadra inesistente, MVP con OVR < 70, Rookie of the Year dopo la stagione 1, Finals MVP senza titolo, statistiche fuori scala (gp, minuti, record 82 NBA o 34 Euro), premi doppi, playoff senza seed, salti di età, rivale uguale a una squadra, segnaposto non compilati.

Da dove vengono gli eventi (Pro): pool scritto 28,6%, procedurali `proc-*` 26,1%, script fissi (rookie, rival, nation, injury) 26,0%, `late-*` 12,9%, anni tranquilli `quiet-*` 6,5%.

Uscite per fase del pool (Pro, totale su 1000 carriere): rookie 17 eventi e 144 uscite in tutto (mediana 10 per evento); prime 26 eventi, mediana 56; veteran 19 eventi, mediana 20; any 29 eventi, mediana 87.

Testi (harness, 1.739.458 stringhe, 400 carriere): nessun `undefined`, `NaN`, `null` o segnaposto non compilato. Le parole inglesi trovate sono nomi di premi voluti ("Rookie of the Year", "All-NBA") e note di squadra come "Grit and grind".

## Risultati

### P1 — Riprendere una partita salvata durante un evento `late-*` o `quiet-*` cambia l'evento e il suo effetto (VERIFIED)
- `engine.ts:1272-1293` (`storyEventById`) ricostruisce gli eventi `late-*` e `quiet-*` chiamando di nuovo `lateCareerEvent` / `quietYearEvent`, che usano `rand()`. Lo fanno con lo stato RNG già avanzato, mentre il pool, i `proc-*` e gli infortuni sono stabili.
- Prova (`/tmp/resume.mts`, 300 carriere Pro): l'evento ricostruito è diverso in **617 casi su 617** per `late` e in **394 su 394** per `quiet`; negli altri tipi è identico ogni volta. Esempio: `late-13-31` "Un giugno diverso, se serve" diventa "L'eliminazione che non si è sciolta", con scelte diverse.
- Conseguenza in UI, letta dal codice di `PivotApp.tsx:206-222` (`hydratePending`): il titolo e le etichette salvati restano, ma l'etichetta non trova corrispondenza e si ripiega su `runs[i]`. Il giocatore vede "Ascolti, non firmi" e riceve l'effetto della i-esima scelta di un altro evento.
- Inoltre ogni ricostruzione avanza `s.rngState` (`withPlayer`, `engine.ts:131-145`): **412 su 412** per `late` e **209 su 209** per `quiet`. Quindi ricaricare la pagina cambia il resto della carriera: stesso seme e stesse scelte non danno più lo stesso risultato.
- Non l'ho corretto qui: cambia i risultati delle carriere riprese e tocca il percorso dei salvataggi (zona di Dallak). **Proposta dietro 2.23.0:** salvare nel pending lo stato RNG di prima della scelta (oppure il seme dell'evento) e ricostruire con quello, senza avanzare `rngState`. Sotto 2.23.0 il comportamento resta com'è.

### P2 — Gli eventi rookie quasi non escono (VERIFIED)
- `phaseFor` (`engine.ts:760-764`) dà la fase "rookie" solo per n ≤ 2, e la stagione 1 è sempre lo script `roy-race` (100%). Così i 17 eventi rookie si contendono in pratica il solo slot della stagione 2, che spesso va a un procedurale o a uno script.
- Risultato: 144 uscite rookie su 1000 carriere, cioè circa l'1% per evento. rk4 e rk11 escono 5 volte su 1000, mentre rk1, rk5, rk8 e rk10 non escono mai (vedi #134).
- **Proposta dietro 2.23.0**, da coordinare con #134 senza toccarla: aprire la fase rookie anche alla stagione 3, oppure dare priorità al pool rookie nella stagione 2.

### P2 — La scelta degli eventi dipende ancora da regex sul testo italiano (VERIFIED, già in lavorazione)
- `memory.ts:243-262` (`TAG_RX`, `eventTags`, `excludedBy`). "ultimo anno" / "ultima stagione" può marcare come "veteran" anche eventi di contratto. La #130 sostituisce le regex con etichette esplicite a risultati invariati; la #134 corregge i quattro rookie marcati "veteran". Qui solo annotato.

### P3 — Script a finestre fisse e prevedibili (VERIFIED)
- `rival-5/6/7` escono ognuno in circa il 33% delle carriere, `nation-9/10/11` in circa il 30–45%. Le percentuali sono identiche su tutte le difficoltà perché lo slot dipende solo dal seme (`scriptSlotFor(s.seed, n, ...)`, `engine.ts:1537-1556`). Il rivale arriva sempre tra la stagione 5 e la 7. È una scelta di design, non un bug: valutare finestre più larghe in 2.23.

### P3 — Procedurali molto ripetuti tra una carriera e l'altra (VERIFIED)
- `proc-ruolo` e `proc-contratto` sono i due eventi più frequenti (in 300 carriere: 752 e 548 uscite). Il testo cambia solo per età, squadra e la riga sulla stagione prima (`engine.ts:799-803`, `buildProceduralIt`). Chi gioca più carriere li riconosce in fretta. Proposta: più varianti di testo (non cambia i risultati se si sceglie la riga senza consumare RNG), da fare dopo il riequilibrio delle statistiche.

### P3 — Limite di `usedEventIds` mai raggiunto (VERIFIED, codice morto)
- `engine.ts:1210` taglia la lista a 48 oltre i 64 elementi, ma il massimo misurato è 18. È innocuo; lo lascio com'è per non toccare il motore.

### Nessun problema trovato (VERIFIED con le misure sopra)
- Determinismo: stesso seme, stesso stato finale; nessun `Math.random` nel motore (solo `newSeed` e i timestamp dei salvataggi).
- Nessun evento ripetuto nella stessa carriera.
- Squadre, premi, record, seed e età sono sempre coerenti con i controlli elencati.
- Il ramo "La linea dei trentadue" è protetto da `age >= 32` (`story-late.ts:36`), quindi non esce a 31 anni.
- Le frasi su anelli e MVP (`feel.ts:215-225`, `feel.ts:456-473`, `story-late.ts:289`) sono legate a `row.awards`, `prev.playoff === "Campione"` o `titleCount`.

## Cose non coperte (NOT RUN)
- Simulazione con le scelte reali dell'UI (playoff e mercato interattivi): ho usato `advanceCareerSim` e l'harness dei testi, che seguono le stesse funzioni del motore ma con scelte casuali.
- La prova in UI del difetto P1: ho verificato il motore e letto il codice di `hydratePending`, ma non l'ho riprodotto nel browser.
- Coerenza delle statistiche e dell'OVR con le scelte: è il lavoro di `grokbot/stats-ovr-rebalance`, che qui non tocco.

## Zone non toccate
`engine` (statistiche/OVR, in lavorazione su `grokbot/stats-ovr-rebalance`), etichette rookie (#134), i file di Dallak (`src/save*`, storage, `legacy-report.ts`, UI Career Card e archivio). Nessun merge, deploy o cambio di impostazioni.
