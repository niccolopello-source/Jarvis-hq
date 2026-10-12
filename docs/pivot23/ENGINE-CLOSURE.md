# Chiusura motore — riverifica G4 su `main`

**Autore:** Grok Bot, 2026-10-12. **Nessuna formula, soglia o costante di gioco è stata cambiata.**
File del motore di Lucille non toccati: `engine.ts`, `config.ts`, `tuning.ts`, `world.ts`, `teams.ts`, `peak.ts`, `bust.ts`.

| | |
|---|---|
| SHA del codice misurato | `3bb757bab75a18726bfc6b08756651238ed8fd68` |
| `main` su cui è basato il branch | `3c5ad92d8f584c4775b6f45025af62ecd6754c61` (include #77, solo suoni dell'intro). `git diff 3bb757b 3c5ad92 -- apps/pivot23/src/lib/pivot` è vuoto: la misura dei 7.000 non è stata ripetuta, e non c'è nulla da ripetere sul motore |
| Motore | `2.13.0-beta` su 7.000/7.000 carriere |
| Ambiente | Node v22.23.3, `tsx` da `apps/pivot23/node_modules` |
| Comando | da `apps/pivot23`: `scripts/g4/collect.ts <difficulty> <from> <count> <out.jsonl>` poi `scripts/g4/analyze.ts` |
| Campione | Pro i = 0..3999 (4.000); Esordio, All-Star, Leggenda i = 0..999. Seed `(i+1)·1000+17`, ruolo `i % 5`, percorso `i % 3`, draft `random`. 0 errori |
| Confronto | Identico, cifra per cifra, al report G4 pinato su `f7ca03d` (merge #66). Il diff `f7ca03d..3bb757` su `engine.ts` è solo l'archivio G3-B02 |
| Determinismo | `collect.ts pro 0 40` eseguito due volte: JSONL identici byte per byte |
| Numeri | [`g4-results/reverify-3bb757.json`](g4-results/reverify-3bb757.json) |

Il JSONL grezzo (circa 50 MB) non è nel repository. Si rigenera con lo stesso comando.

## Esiti

| ID | Esito | Cosa è stato verificato |
|---|---|---|
| P0-LIFE soglie | **PASS** | 321/1000 Pro finiscono prima dei 34 (29,3–35,1%); 598/1000 arrivano a 36. Picco assegnato e osservato 26–28: 1000/1000. Sui 4.000: 1342 prima dei 34 (33,6%), 2332 a 36. Chunk 32,1–34,8%. Esordio 1,0% prima dei 34, All-Star 47,4%, Leggenda 48,0% |
| P0-LIFE coerenza età | **PASS** | `careerEndAge` = ultima riga 4000/4000. Nessun buco, nessun doppione, nessuna riga oltre i 36. `PlayerState.age − endAge` è 0 in 615/1000 e 1 in 385/1000 (l'età di stato è già quella della stagione successiva) |
| A2 cliff a 32 | **FAIL di design, non corretto** | 1323/4000 finiscono a 32, 0 sotto i 32, 19 a 33. Tutte le chiusure prima dei 34 sono infortuni (1342/1342). Causa in `careerEndingSignal`: con `TUNING.retirement = "current"` il segnale è `null` finché `age < 33`. Vedi proposta D-1 |
| A1 «Gioca a 36» senza stagione | **FAIL di coerenza, nota UI sì, regola no** | 71/4000 (1,8%), tutte con segnale `injury` e `injuryDrag ≥ 2,5`. Sul campione gate: 17/1000. Seed fissati: 4017, 23017, 49017, 65017, 74017. Vedi D-2 |
| P1-BUST laboratorio | **PASS come misura, 0%** | 0/419 Pro con potenziale ≥ 85 e picco ≤ potenziale − 8 (0–0,9%). Gap massimo potenziale−picco: 6,9. Non è un bust di sviluppo |
| D-08 option A | **PASS al bordo** | 595/4000 = 14,9% (13,8–16,0). Di questi, 528/595 (88,7%) sono bust di opportunità (picco entro 2 punti dal potenziale) e 67/595 (11,3%) di progressione. Campione confrontabile 1.200: 13,1%. L'etichetta ufficiale non è stata cambiata |
| D-09 / P1-WORLD | **PARTIAL** | Gini titoli simulati 0,303 (era 0,369 prima di `regress`). OKC 11,4% stabile; stagioni 1–5: OKC 3.051/20.000 = 15,3%, Gini 0,529. Vedi D-3 |
| D-11 | **PASS** | 21 calendari distinti. 4.000/4.000 sequenze di eventi distinte. 4.000/4.000 percorsi di scelta distinti |
| D-23 | **PASS** | Streak DPOY massima: Pro 4, Esordio 3, All-Star 1, Leggenda 1. Soglia ≤ 5 |
| D-ROLE / P1-ROLE | **PASS** | Minuti mediani 21,2–21,6 su tutti i ruoli. Il box score si separa (tabella sotto). I pesi sono vivi |
| Premi / playoff | **PASS sui test esistenti, non rieseguiti qui gli e2e** | Coerenza premi: MVP mediana 28,3 PPG non ricalcolata in questa tabella; i conteggi premi coincidono con G4 (MVP 35, DPOY 218, ROY 1224 sui 4.000 Pro). Test già su `main`: `awards.test.ts` (DPOY NBA non va a una squadra non NBA), `playoff-engine.test.ts`, `engine-invariants.test.ts` |
| O-1 DPOY duro | **NOTA, non un bug** | All-Star 12 DPOY / 1.000, Leggenda 1/1.000. Proposta D-4, nessuna modifica |
| O-2 ROY | **NOTA** | 1224/4000 Pro (30,6%). Identico al report precedente. Il protagonista è un rookie forte per disegno |

### Ruoli (Pro, stagioni NBA con GP ≥ 20, circa 12.000 per ruolo)

| Ruolo | PPG media · mediana | RPG mediana | APG mediana | Minuti mediana | OVR 80+ PPG/RPG/APG |
|---|---|---|---|---|---|
| PG | 8,11 · 7,0 | 1,7 | 3,3 | 21,4 | 19,2 / 3,1 / 7,7 |
| SG | 10,54 · 9,3 | 2,0 | 1,9 | 21,6 | 24,6 / 3,7 / 4,2 |
| SF | 9,31 · 8,1 | 2,6 | 1,9 | 21,5 | 23,0 / 5,0 / 4,5 |
| PF | 8,28 · 7,3 | 4,2 | 1,3 | 21,5 | 19,8 / 8,0 / 3,0 |
| C | 6,89 · 6,0 | 5,3 | 1,0 | 21,2 | 16,9 / 10,4 / 2,5 |

### D-08 per segmento (option A, Pro 4.000)

| Taglio | Tasso |
|---|---|
| Potenziale < 70 | 14,8% |
| 70–75 | 23,1% |
| 75–80 | 15,3% |
| 80–85 | 1,1% (2/186) |
| 85+ | 0/419 |
| NCAA / Europa / G-League | 25,3% / 16,4% / 2,9% |
| Scelte 1–14 / 15–30 | 3/48 (6,3%, n piccolo) / 48,1% |
| PG SG SF PF C | 18,9 · 16,4 · 12,9 · 11,9 · 14,4 |
| Esordio / Pro / All-Star / Leggenda | 7,7 / 14,9 / 17,7 / 15,7 |

Il percorso spiega il draft: NCAA finisce molto più spesso al primo giro. Il bust option A è soprattutto una scelta 15–30 che non ottiene minuti da titolare, non un talento alto che non cresce. I minuti NBA in età 25–29 salgono con il potenziale (già nel report G4). Le variabili che spiegano la «mancata esplosione» dell'etichetta ufficiale sono quindi opportunità (pick, percorso, minuti), non la formula di picco.

## Cause radice

**A2.** `careerEndingSignal` (`peak.ts`) con retirement `current` esce subito se `age < MAX_AGE − 3` (33). Un infortunio a 29, 30 o 31 non chiude la carriera. La prima estate in cui il segnale può scattare è dopo la stagione da 32 anni: per questo i ritiri precoci si ammassano lì. È strutturale, non un caso del campione.

**A1.** L'offerta scatta a età 35 se il segnale è ancora nullo (`shouldOfferExtraYear`). Il simulatore accetta «Gioca a 36 anni», mette `extraSeason = true` e registra la scelta. Poi `applyAging` porta l'età a 36 e, sopra i 33, somma `injuryDrag`. All'inizio della stagione successiva `advanceCareerSim` chiama `isCareerOver` prima di simulare: a 36 il segnale di infortunio (≥ 2,5) è vero, quindi la stagione non viene scritta. La carta usa già `careerEndAge` (ultima riga), quindi l'età mostrata è onesta. Il diario delle scelte no: dice che il 36 è stato accettato.

**A3.** `peak.ts` realizza il picco vicino al potenziale con `TUNING.bust = "current"`. Il laboratorio (potenziale ≥ 85 e picco ≤ potenziale − 8) non può scattare: il gap massimo osservato è 6,9. `careerBust()` non guarda il potenziale. Per questo l'etichetta e il laboratorio non descrivono la stessa cosa.

**A4.** La quota OKC viene dalla tabella di potenza iniziale in `teams.ts` e decade sotto `regress` (Gini 0,529 → 0,292 → 0,155 → 0,117 per era). Non è una dinastia costruita dal mondo. `TASKS.md` vieta di togliere punti a una franchigia e chiamarlo chiuso.

## Correzioni fatte

Solo coerenza di lettura, zero esiti sportivi cambiati.

- `career-coherence.ts`: `extraYearVoided` e `bustDiagnosis`. Il secondo non sostituisce `careerBust()`.
- Diario scelte (carriera in corso e archivio): accanto a «Gioca a 36 anni», se quella stagione non c'è, la riga aggiunge «Accettata, ma la stagione a 36 anni non risulta giocata.» / inglese equivalente. Non inventa la causa. Decisione autorizzata: la nota resta.
- Riga finale del risultato (`palmares.endAge` in `legacy.ts`): prima usava `PlayerState.age`, già l'estate successiva. Sul seed 4017 diceva 36 mentre l'ultima stagione, la carta e il report dicevano 35. Ora usa `careerEndAge`, cioè l'ultima stagione giocata. Sul seed 1017, dove il 36 si gioca, resta 36. Non cambia chi gioca e chi chiude.
- Test sui percorsi adiacenti, stessi seed G4: 1017 gioca il 36; 1017 con «Chiudi ora» finisce a 35 senza nota; 4017 accetta e non gioca (nota sì, età 35 ovunque); 4017 con «Chiudi ora» non ha la nota; 6017 chiude a 32 per infortunio prima di ogni offerta, e l'età mostrata è 32 anche se lo stato è già a 33.
- Test veloci sui cinque seed G4 e sulla soglia d'età del segnale.
- Il test statistico dei 1.000 Pro, che già girava, ora blocca anche l'istogramma misurato (32:317, 33:4, 34:51, 35:30, 36:598), i 17 trentasei annullati e lo split bust 128 opportunità / 13 progressione / 0 miss di laboratorio. Sono conteggi, non obiettivi di bilanciamento: una modifica approvata del motore deve sostituirli con una misura nuova.

## Decisioni autorizzate il 12 ottobre

1. Tenere la nota quando «Gioca a 36 anni» non ha una stagione corrispondente. Fatta.
2. Non cambiare ritiro, crescita, soglie bust, potenza delle franchigie, tassi DPOY/ROY. Non fatto.
3. Non toccare i file di Lucille. Non toccati.
4. Niente merge e niente deploy.

## Decisioni che restano aperte

Nessuna di queste è in questo branch. Lucille ha già due bozze, non unite: [#78](https://github.com/niccolopello-source/Jarvis-hq/pull/78) (ritiro 29–32, spento, gated 2.14.0) e [#81](https://github.com/niccolopello-source/Jarvis-hq/pull/81) (bust option B, spento, gated 2.14.0). Non le ho modificate.

### D-1 — A2, ritiro prima dei 33 (era P-2 / D-10)

- **Oggi:** nessuno chiude prima dei 32; quasi tutti i ritiri precoci sono esattamente a 32, per infortunio.
- **Da decidere:** se un infortunio grave può chiudere anche a 29–31.
- **Alternativa 1:** lasciare `current`. La demo resta stabile. Il difetto resta: le carriere corte si somigliano tutte.
- **Alternativa 2:** `TUNING.retirement = "graded"` è già nel codice (`peak.ts`, soglia minuti che sale dai 31, infortunio più severo sotto i 33). Va acceso solo dietro una versione motore nuova, con lo stesso harness G4. Gate da tenere: ≥ 150/1000 prima dei 34 e almeno una carriera a 36.
- **Impatto gameplay:** le carriere corte si distribuiscono. Alcuni save vivi cambierebbero esito se non si versiona.
- **Impatto test:** l'istogramma bloccato in `engine.stats.test.ts` va rimisurato, non allentato.
- **Raccomandazione:** dopo la demo del 18 ottobre. La bozza è [#78](https://github.com/niccolopello-source/Jarvis-hq/pull/78), non questo branch.

### D-2 — A1, il 36 accettato e non giocato (era P-1)

- **Oggi:** 71/4000 accettano e non giocano. Carta, report e — con questa PR — anche la riga finale del risultato usano l'ultima stagione. Il diario tiene la scelta e aggiunge la nota.
- **Alternativa 1 (autorizzata, questa PR):** solo lettura. Gli esiti restano.
- **Alternativa 2:** non registrare l'accettazione finché la stagione da 36 non inizia; se l'invecchiamento fa scattare l'infortunio, scrivere una chiusura diversa. Tocca `engine.ts` (Lucille) e il testo del choice log. Gli esiti delle stagioni non cambiano.
- **Alternativa 3:** giocare comunque il 36 se l'accettazione è già avvenuta. Cambia chi arriva a 36. Serve versione motore e rimisura di P0-LIFE.
- **Raccomandazione:** tenere l'alternativa 1 per la demo. L'alternativa 3 è una decisione di design, non un fix.

### D-3 — A4, OKC e i primi cinque anni (P1-WORLD)

- **Oggi:** Gini simulato 0,303, ma i primi cinque anni restano concentrati (OKC 15,3%).
- **Alternativa 1:** tenere `regress`. Plausibile come dinastia iniziale, il bias si dimezza dopo.
- **Alternativa 2:** misurare la tabella di potenza e l'emivita, poi decidere. Vietato sottrarre punti a una franchigia in `teams.ts` senza quel passaggio.
- **Raccomandazione:** non toccare prima della demo. P1-WORLD resta aperto.

### D-4 — DPOY sulle difficoltà alte e ROY al 30% (O-1, O-2)

- **Oggi:** su Leggenda il DPOY quasi non esiste (1/1000). Il ROY Pro è 30,6% perché il protagonista è scritto come rookie forte.
- **Da decidere:** se è il senso della difficoltà o un buco.
- **Raccomandazione:** nessun cambio senza un tasso obiettivo. I test premi esistenti restano la rete.

### D-5 — bust di sviluppo (A3 / option B)

Già scritto in `D-08-OPTION-B-FOLLOWUP.md` e proposto in [#81](https://github.com/niccolopello-source/Jarvis-hq/pull/81). Non applicato qui. L'etichetta option A resta quella ufficiale. `bustDiagnosis` serve a non confonderla con il laboratorio.

## Problemi ancora aperti

- A2, A4, option B, O-1, O-2: decisioni di prodotto. Fermati qui. Le bozze #78 e #81 non fanno parte di questa PR.
- Il choice log salvato resta «Gioca a 36 anni». La nota è solo in lettura. Cambiare il log è l'alternativa 2 di D-2 e tocca `engine.ts`.
- `TASKS.md` è di John/James: non riscritto.

## Verifica di chiusura

Ambiente: Node v22.23.3, da `apps/pivot23`, 12 ottobre 2026. Base `3c5ad92`.

| Comando | Esito |
|---|---|
| `pnpm exec eslint` sui file toccati, poi `pnpm run lint` | **PASS** |
| `pnpm run typecheck` | **PASS** |
| `pnpm test` (244 test, include coerenza 36, premi, playoff, invarianti) | **PASS**, 0 fail |
| `node --import=tsx --test --test-name-pattern "1,000 Pro careers"` | **PASS** (istogramma 317/4/51/30/598, 17 trentasei annullati) |
| `pnpm run build` | **PASS**, 1,34 s |
| `playwright test e2e/demo-readiness.spec.ts -g "the age-36 season is played once"` sul dev server Vite :8080 | **PASS** (8,1 s). Carta e report restano a 36 quando la stagione si gioca |
| Suite e2e completa, `test:stats` dei 2.000 Esordio, ascolto device, i 7.000 ricampionati su `3c5ad92` | **NOT RUN**. Il diff del motore tra `3bb757` e `3c5ad92` è vuoto, quindi il campione vecchio resta valido per le formule |

Il secondo test di `engine.stats.test.ts` (MVP su 2.000 Esordio) non è stato rieseguito: questo diff non tocca i premi.

## Prossime azioni

1. Approvare o rifiutare D-2 alternativa 2/3. L'alternativa 1 è già nella PR.
2. Dopo il 18 ottobre, Lucille valuta D-10 `graded` (D-1) dietro versione nuova.
3. Non toccare `teams.ts` finché non c'è una misura di emivita accettata (D-3).
4. Option B solo post-demo, versionata, con l'etichetta option A ancora unica (D-5).
5. Non fare merge di questa PR né deploy: lo decide il proprietario del repository.
