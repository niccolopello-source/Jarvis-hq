# PIVOT 23 — Ribilanciamento statistiche → OVR (gate 2.23.0, dormiente)

Richiesta di Pello (25 ott 2026): partenza fissa a 50, ogni scelta della carriera modifica le statistiche,
e l'OVR deve essere collegato direttamente alle statistiche. Correggere il pavimento 48 del percorso prudente.

Stato: **gate dormiente**. `ENGINE_VERSION` resta `2.22.0-beta` in questa PR: nessuna carriera nuova o
salvata cambia finché un PR separato non porta il motore a 2.23.0 (proposta sotto). Le regole nuove si
attivano solo per carriere con `engineVersion >= 2.23.0` (`STATS_OVR_SINCE`, condiviso con `ROOKIE_TAGS_SINCE`).

## 1. Diagnosi (main bab4e62, file:riga)

| # | Problema | Dove |
|---|---|---|
| D1 | La partenza non era 50 ma **60** | `peak.ts:10` `START_OVERALL = 60` |
| D2 | L'OVR è una curva d'età (spina) + traccia scelte `choiceOvr`; gli attributi **non** entrano nell'OVR | `peak.ts` `computeOverall` (curva), `engine.ts:188` `imprint` scrive solo `choiceOvr` |
| D3 | Molte scelte muovono solo `choiceOvr`/hidden/rischio, non gli attributi: ~62% delle opzioni muove le statistiche | misura sotto (2.22) |
| D4 | Correlazione annua Δskill ↔ ΔOVR bassa (0,42–0,52) | misura sotto (2.22) |
| D5 | Pavimento 48: twilight `clamp(peak×0,54, 48, 68)` + `SIM.overall.min 48` → il 17–50% delle carriere tocca 48 (prudente peggio del casuale) | `peak.ts:279`, `config.ts:16` |

## 2. Modello 2.23 (implementato)

- **Partenza 50**: `startOverallOf(s)` = 50 su 2.23, 60 prima (`peak.ts:18`). Alla creazione l'OVR letto dagli
  attributi vale esattamente 50 per ogni ruolo/nazionalità (`baseSkillOf`, `peak.ts:333`, nessun campo di salvataggio nuovo).
- **OVR dagli attributi**: `statsOverall = start + k × (skill pesata per ruolo − skill iniziale)` (`peak.ts:346`),
  più forma/infortuni; `computeOverallStats` (`peak.ts:358`) miscela con la curva storica tramite `lambda`.
- **Ogni scelta muove gli attributi**: `imprint` (`engine.ts:188`) riversa l'impulso sugli attributi con
  `spreadOnAttrs` (`engine.ts:203`, per peso di ruolo, senza RNG); `statsPulse` (`engine.ts:354`) dà un impulso
  anche alle scelte senza `attrs`.
- **Crescita/declino naturali come budget annuo di attributi** (`applyNaturalBudget`, `engine.ts:429`), con recupero
  limitato verso il picco realizzato (`catchUpMax`, `peakShift`).
- **Pavimento**: twilight 2.23 `clamp(peak×0,74, 52, 72)` (`peak.ts:291`).
- **Draft**: riferimento stock 62 su 2.23 (`engine.ts:798`), così la quota di primo giro non esplode con la partenza a 50.
- **Rookie CPU** seguono le regole della carriera (`league.ts`); carriere pre-2.23 identiche.
- **Log della sim**: su 2.23 le etichette delle scelte salvate hanno i segnaposto riempiti (`simLogLabel`, `engine.ts:306`)
  come già fa la UI; prima restava `__COACH__` grezzo (trovato dal test i18n su una carriera 2.23).
- Correzione `-0` → `0` in plusMinus (round-trip legacy-report), senza toccare `legacy-report.ts`.
- Parametri: `TUNING.statsOvr` (`tuning.ts:85`): start 50, **lambda 0,5**, k 0,55, pulseToAttrs 0,6,
  twilight 0,74/52/72, draftStockRef 62, catchUpMax 1,5, peakShift −2,5.

## 3. Opzioni misurate (1000 carriere × 4 difficoltà × casuale/prudente, set A=910000 e B=920000)

Metodo: `scripts/measure-stats-ovr.ts` con `ENGINE=2.23.0-beta` (la versione entra **prima** del draft).
r = carriere con ultima stagione a 29–32 ‹/1000›; fl = quota che tocca OVR 48; mv = quota opzioni di scelta che
muove gli attributi; c = correlazione annua Δskill↔ΔOVR. Picco: mediana@età.

**2.22 (riferimento)**: Pro casuale picco 71@27, r 304/321, fl 0,25/0,24, mv 0,62, c 0,46; prudente fl 0,17–0,50.

**Opzione A — ibrida (lambda 0,5) — RACCOMANDATA, default**

| set | casuale Esordio | Pro | All-Star | Leggenda | prudente fl max |
|---|---|---|---|---|---|
| A | 75@27 r12 | 73@27 r305 | 70@27 r324 | 69@27 r308 | 0,101 (Leggenda) |
| B | 75@27 r14 | 73@27 r326 | 70@27 r320 | 69@27 r347 | 0,093 |

mv 0,993–0,998; c 0,949–0,954. Obiettivi r: 7/8 celle nel 300–340, Leggenda set B 347 (IC 95% Wilson include 340: HYPOTHESIS rumore),
Esordio < 20 ✔. Bust Pro (300 carriere P0-LIFE) 34/300 = 11,3% (2.22: 14%), nessun "lab bust".

**Opzione B — pura (lambda 1)**

| set | Esordio | Pro | All-Star | Leggenda | prudente fl max |
|---|---|---|---|---|---|
| A | 75@27 r18 | 72@26 r327 | 69@26 r375 | 68@26 r385 | 0,018 |
| B | 75@27 r11 | 72@27 r352 | 69@26 r368 | 68@26 r362 | 0,013 |

mv ≥ 0,993; c ≈ 0,97 (collegamento più diretto), pavimento quasi azzerato, ma ritiri 29–32 **fuori** banda su
All-Star/Leggenda (362–385) e Pro set B (352): serve un'ulteriore taratura del declino. Per questo raccomando A ora,
B come passo successivo.

Nota: con k 0,35 (prima taratura) l'OVR massimo raggiungibile dagli attributi era ~76 → i potenziali ≥85 finivano
13 punti sotto (131 "lab bust" su 1000). k 0,55 risolve.

## 4. Compatibilità (evidenze)

- fp1200 (2.20/2.21/2.22 × 4 difficoltà × 100 seed, versione passata a `openCareerSim`):
  `4d949edf…5f73c2a` su main bab4e62 **=** branch → VERIFIED bit-identico. (Il vecchio hash e5b585ba… usava un metodo
  errato: il draft girava col motore corrente prima dell'override.)
- Golden/fixture invariati (ENGINE resta 2.22). SAVE_VERSION 11 invariato. RNG deterministico (test `stats-ovr.test.ts`).
- File di Dallak (save*, storage, legacy-report.ts, Career Card/archivio) non toccati.

## 5. Limiti noti

- Dopo il draft (eventi di draft con `attrs`) l'OVR mediano alla prima stagione è ~60: la partenza è 50 alla
  creazione, ma il pre-draft la alza. Se Pello vuole 50 anche al debutto, ridurre l'effetto degli `attrs` del draft su 2.23.
- Test statistici (ROY, DPOY, bust D-08) misurati su 2.22 (default); su 2.23 completi = NOT RUN, da fare nel PR del bump.

## 6. PR separato proposto (bump)

`config.ts`: `ENGINE_VERSION = "2.23.0-beta"`; aggiornare version-gate/ovr-balance-gate, golden `GOLDEN_2_22` +
nuovo `GOLDEN`, fp di experiment fissati a 2.22, bande 2.23 in injury-retire.stats. Attiva insieme anche ROOKIE_TAGS (2.23.0).

## 7. Decisione di Pello e rimisura dopo il merge di main 99762f6 (26 ott 2026)

**Decisione (Pello, 26 ott 2026): OVR al debutto ≈ 60.** Tuning invariato in questo PR (start 50, lambda 0,5).
Misura: con start 50 l'OVR della stagione 1 su 2.23 è **mediana 55** (p10 54, p90 55, 400 carriere, tutte le
difficoltà), non ~60 come scritto al §5. Prova esplorativa (non applicata) con `start: 60` → mediana 65.
Per arrivare a ≈60 serve quindi start ≈55 oppure un pre-draft più forte: da tarare e rimisurare prima del bump.
Su 2.22 il debutto è 59 (mediana).

Merge: commit merge normale di main (rookie events #134/#138/#139, stesso gate 2.23.0). Conflitto solo nello script
`test` di `package.json`: tenuti tutti i file di entrambe le parti. Rookie events e statsOvr non si sovrappongono:
il rookie slot cambia solo *quale* carta esce (stagioni 2–3), gli effetti passano da `applyChoiceFx` come ogni
altra carta, quindi niente doppia applicazione. ENGINE_VERSION resta 2.22.0-beta.

Compatibilità: `fp-evtags.mts` → `e5b585ba…d1ae` = main; `scripts/fp1200.mts` → `4d949edf…5f73c2a` = main. VERIFIED.

Rimisura 2.23 (con rookie events), `measure-stats-ovr.ts`, 1000 carriere/cella:

| set | Esordio | Pro | All-Star | Leggenda | prudente fl max | mv | c |
|---|---|---|---|---|---|---|---|
| A | 75@26 r10 | 73@27 r324 | 70@27 r331 | 68@27 r337 | 0,106 | ≥0,994 | 0,950–0,953 |
| B | 75@27 r10 | 73@27 r334 | 70@27 r346 | 69@27 r324 | 0,088 | ≥0,991 | 0,950–0,952 |

Leggenda set B ora 324 (nella banda); All-Star B 346 fuori banda 300–340 (IC 317–376).

Premi su 2.23 (stessi campioni e soglie di `awards-v2.stats` e D-23, versione impostata all'apertura):
- ROY: quota giocatore **0,028** (soglia ≥0,03) → **FAIL** (2.22: 0,055). Quote ruolo OK (min PG 0,12, max SG 0,34).
  Stagioni MVP 109 vs 45 su 2.22, max MVP 6 (limite 6).
- DPOY: striscia massima **11** (limite 5) → **FAIL** (2.22: 2).

Raccomandazione: **non** fare il bump 2.23 finché ROY, DPOY e OVR al debutto non sono sistemati.

### 7.1 Opzione A applicata (26 ott 2026): debutto ≈60 con start 50

Causa misurata: con k 0,55 servono molti più punti attributo per lo stesso OVR (a 27 anni skill 66 vs 46 su 2.22),
quindi box score, MVP, DPOY e ROY si gonfiano. Modifiche (solo gate 2.23, `TUNING.statsOvr`):
- `k` 0,55 → **1,4**: le carte del draft muovono abbastanza l'OVR da portare il debutto a ≈60 senza toccare lo start
  (niente `preDraftSkill`, scartato). Attributi a 27 anni tornano vicini a 2.22 (skill 49,6 vs 46).
- `pulseToAttrs` 0,6 → **0,3**: leva principale sulle stagioni MVP (0,6 → 67; 0,35 → 55; 0,3 → 50).
- `peakShift` -2,5 → **-8** (effetto piccolo; -2,5 peggiora MVP 79 e DPOY 6).
- Nuovo `cpuRookieLift` **1,5**: la classe rookie CPU su 2.23 è generata con le regole attributi 2.22 (stesso mix di
  ruoli e box) e poi alzata di 1,5 OVR oltre al lottery lift, per debuttare al livello del giocatore. Senza questo
  passaggio il ruolo SG supera la quota massima (0,47 > 0,45). 2.22 non entra mai nel ramo.

| metrica (2.23) | prima | ora | 2.22 | soglia |
|---|---|---|---|---|
| OVR debutto mediana (tutte le difficoltà) | 55 | 61 (Leggenda 60) | 59 | ≈60 |
| ROY giocatore | 0,028 | **0,060** | 0,055 | ≥0,03 |
| quote ruolo ROY | OK | OK (max SG ≤0,40) | OK | 0,06–0,45 |
| stagioni MVP / max per carriera | 109 / 6 | **50 / 4** | 45 / 4 | ≤6 |
| DPOY striscia max | 11 | **3** | 2 | ≤5 |

`measure-stats-ovr.ts`, 1000/cella, random: picco@età r(ritiri 29–32 /1000)

| set | Esordio | Pro | All-Star | Leggenda | floor48 | mv picked | c |
|---|---|---|---|---|---|---|---|
| A | 76@26 r16 | 74@26 r368 | 71@26 r362 | 70@26 r379 | 0 | ≥0,918 | 0,837–0,863 |
| B | 76@26 r14 | 74@26 r355 | 71@26 r374 | 70@26 r386 | 0 | ≥0,929 | 0,844–0,869 |

Ritiri All-Star B 29–32: **374, fuori banda 300–340** (prima 346). Anche Leggenda B esce dalla banda (324 → 386).
Provati twilightFloorK/Min, peakShift, lambda, pulseToAttrs: nessuno porta i ritiri in banda senza rompere i premi
(peakShift -2,5: B All-Star 382). Non fattibile in questo giro: serve una leva dedicata sulla fine carriera.

Fingerprint gate off invariati: `e5b585ba…d1ae`, `4d949edf…5f73c2a`. Unit 421/421, stats 24/24, lint, typecheck,
build, e2e 153 passed / 4 skipped.

Raccomandazione: **non** fare ancora il bump: premi e debutto a posto, ritiri 29–32 fuori banda.

### 7.2 Leva fine carriera (26 ott 2026): ritiri 29–32 in banda

Causa misurata (set B, All-Star, 300 carriere): quasi tutte le uscite a 29–32 sono per infortunio (`injuryDrag` ≥ barra),
soprattutto nell'estate dei 31 anni. Alzare solo le barre 29–32 non basta: oltre ×1,4 il dato resta fermo perché
l'uscita si sposta all'estate dei 33 (barra 2,5) e l'ultima stagione giocata resta 32.

Modifica (solo gate 2.23, `TUNING.statsOvr.retireBarScale`, funzione `retireBarScaleOf` in `tuning.ts`, usata da
`careerEndingSignal`): moltiplicatore sulla barra infortuni alle età **29–33** per difficoltà.
Valori: Esordio 1, Pro 1, **All-Star 1,12**, **Leggenda 1,25**. È una soglia deterministica: nessun numero casuale in
più, 2.22 non entra mai nel ramo (scala 1). Le tabelle `injuryRetireBars221` restano identiche.

Taratura (1000/cella, casuale, All-Star/Leggenda): ×1,05 → A 354/375, B 367/383; ×1,10 → A 326/354, B 340/370;
×1,15 → A 304/339, B 316/345; ×1,20 → A 302/332, B 307/341.

`measure-stats-ovr.ts`, 1000/cella, ritiri 29–32 /1000 (IC 95% Wilson):

| set | Esordio | Pro | All-Star prima → ora | Leggenda prima → ora | prudente (Pro/AS/Leg) |
|---|---|---|---|---|---|
| A | 16 | 368 | 362 → **316** (288–346) | 379 → **319** (291–349) | 64 / 85 / 115 |
| B | 14 | 355 | 374 → **331** (303–361) | 386 → **330** (302–360) | 71 / 79 / 114 |

Picco OVR invariato (A/B: 76, 74, 71, 70 a 26 anni), floor48 0. Premi e debutto invariati: debutto mediana 61
(Leggenda 60), ROY giocatore 0,060, quote ruolo OK (max SG 0,398), stagioni MVP 50 / max 4, DPOY striscia max 3.
Pro resta fuori banda (368/355), come prima: non toccato in questo giro.

Fingerprint gate off invariati: `e5b585ba…d1ae`, `4d949edf…5f73c2a`. Unit 421/421, stats 24/24, lint, typecheck,
build, e2e Chromium 153 passed / 4 skipped.

Raccomandazione: All-Star e Leggenda ora in banda su A e B, premi e debutto a posto. Il bump 2.23 si può fare
con l'ok di Pello; unico punto aperto: Pro 29–32 sopra banda (se va sistemato, stessa leva con Pro ≈1,15).

### 7.3 Pro in banda e prova di bump (26 ott 2026)

Pro: le `injuryDrag` Pro si ammucchiano appena sotto la barra dei 32 anni (2,25 × scala ≈ 2,5). Con una scala
uniforme il dato salta da ~350 (×1,08–1,11) a ~292 (×1,12); alzare 30 o 31 non cambia nulla. Leva scelta (solo 2.23):
Pro scala **1,08** a 29–33, più `retireBarSplit` Pro: a 32 anni metà delle carriere (scelta con `seedHash`, nessun
numero casuale) usa **1,12**. Taratura quota: 0,4 → A 328 / B 333; **0,5 → A 322 / B 327**; 0,6 → A 316 / B 316.

| set | Esordio | Pro | All-Star | Leggenda | prudente Pro/AS/Leg |
|---|---|---|---|---|---|
| A | 16 | **322** (294–352) | 316 | 319 | 24 / 85 / 115 |
| B | 14 | **327** (299–357) | 331 | 330 | 26 / 79 / 114 |

Debutto 61 (Leggenda 60), ROY 0,060, MVP 50 / max 4, DPOY 3 (script `s141-awards`, versione all'apertura).
Fingerprint invariati. Unit 421/421, stats 24/24, lint, typecheck, build: PASS (con ENGINE_VERSION 2.22).

**Prova di bump a 2.23.0-beta (non committata): FAIL.** Unit 414/421, stats 16/24. Oltre ai test che fissano la
versione corrente (golden, pin 2.21/2.22: andrebbero aggiornati, non è permesso in questo giro), falliscono tre
controlli reali sulla nuova versione: ROY giocatore **0,015** (soglia ≥0,03, `awards-v2.stats`), bust ufficiali
**93/1000** fuori banda 12–18% (P0-LIFE Pro), max MVP **8** su Esordio (limite 6). Bump **non** fatto.
