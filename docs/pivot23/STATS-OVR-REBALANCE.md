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
