# Decisioni del 12 ottobre — motore 2.16.0-beta

Autorizzate da Niccolò. Le carriere nuove nascono su `2.16.0-beta`. Un save 2.15 (#86 awards v2), 2.14 (#78), entrambi già in produzione, 2.13 o più vecchio tiene le regole con cui è nato. Nessun merge, nessun deploy.

## 1. Ritiro 29–32 — accettato

La tabella di Lucille, già misurata su 4.000 Pro: barre infortunio `30 → 5.0`, `31 → 3.6`, `32 → 3.2`. Da 33 la regola di sempre. Non ho cambiato i numeri. Dettaglio in `A2-RETIREMENT-SPREAD.md`. La #78 è la stessa proposta; questo branch la include.

## 2. Il 36 accettato si gioca

Se il diario dice «Gioca a 36 anni», quella stagione viene simulata anche se l'estate è già un infortunio. Poi la carriera chiude. I cinque seed che prima la perdevano (4017, 23017, 49017, 65017, 74017) ora hanno la riga a 36. Un save 2.13 non viene riaperto. La nota nel diario resta, per un caso che sulle carriere nuove non dovrebbe più capitare.

## 3. Potenza delle franchigie — nessuna modifica

`regress` resta. OKC al 15,3% nei primi cinque anni resta un fatto, non un bug da chiudere oggi. `teams.ts` non è stato toccato.

## 4. Premi — tassi che ho fissato io

Il ROY era circa il 33% su tutte le difficoltà, perché il livello non entrava nel punteggio. Ora entra solo sul giocatore. Campione: 150–160 carriere per livello, seed G4.

| | Esordio | Pro | All-Star | Leggenda |
|---|---|---|---|---|
| ROY, % carriere | 45 | 27 | 15 | 9 |
| MVP, premi / 1000 | 67 | 25 | 6 | 0 su 160 |
| DPOY | vedi sotto | vedi sotto | 0 su 120 | 0 su 120 |

ROY è il numero solido. Il MVP Pro è 25/1000 (prima era circa 9). Esordio resta la difficoltà in cui un MVP si vede. All-Star ne ha avuti 6/1000 in 160 carriere: è un campione piccolo. Leggenda, in 160 carriere, zero MVP.

Il DPOY di Leggenda e All-Star resta quasi chiuso. Il motivo non è una soglia dimenticata: in 40 carriere Leggenda la stagione più difensiva è 0,8 palle rubate e 1,1 stoppate. Ho abbassato la soglia di conteggio (All-Star ×0,78, Leggenda ×0,62) e ho aggiunto un aiuto sul punteggio. In 120 carriere non è bastato a produrre un premio. Non ho abbassato ancora: a quel punto il premio non sarebbe più il box. Pro ed Esordio tengono la soglia NBA (×1). Il campione storico Pro è 55 DPOY / 1000; non l'ho rimisurato su 4.000 dopo questa soglia.

Lo streak DPOY nei campioni è rimasto sotto 5.

## 5. Bust di sviluppo — non acceso

La formula larga di Lucille (#81) alza i bust sopra il 15% e taglia All-Star e MVP di circa un quinto, e quasi non crea bust da potenziale ≥ 85. Ne ho provata una più stretta, solo sopra potenziale 86, solo se le scelte restano sotto una barra. Su 200 Pro: zero bust di laboratorio, e i premi scendono lo stesso (MVP 80→50, DPOY 75→30 su quel campione).

Resta spenta (`TUNING.bust = "current"`). Il codice c'è, gated su 2.16, e un test controlla che accendendola il drag colpisca solo un tetto alto rimasto indietro. Per un bust vero serve marcare le scelte rischiose. Non l'ho inventato.

## Cosa non è stato rifatto

I 7.000 G4. I numeri della tabella premi sono il campione scritto sopra, non un intervallo al 95%. La suite e2e completa non è stata rieseguita su questo branch.

## Nota di migrazione — gate 2.15.0 (approvato da Pello, 12 ott 2026, 18:33 UTC)

La #78 (A2, ritiro anticipato per infortuni) è in produzione come `2.14.0-beta`: esistono carriere 2.14 a metà. Per non cambiarne le regole, tutte le decisioni di questa PR sono spostate su `DECISIONS_SINCE = "2.15.0"` (`tuning.ts`, `usesDecisions`):

| Regola | 2.12 / 2.13 | 2.14 (#78) | 2.15 (questa PR) |
|---|---|---|---|
| A2 soglie infortunio 29–31 | no | sì | sì |
| Stagione a 36 anni accettata giocata anche con infortunio estivo | no | no | sì |
| Premi per difficoltà (`awardProfile`: ROY, MVP, All-Star, DPOY, `awardP` All-Star/Leggenda 0,8/0,62) | curva storica | curva storica (`awardP` 0,68/0,42) | nuova curva |
| D-08 opzione B (`BUST_SINCE`) | no | no | cablata, ma spenta (`TUNING.bust = "current"`) |

Nessuna migrazione del save: `engineVersion` resta quello di nascita, il formato non cambia (`bustLock` è opzionale). Prova: `version-gate.test.ts` rigioca 480 carriere (seed 9100 + 37·i, i = 0…39; esordio/pro/allstar/leggenda; 2.14.0-beta, 2.13.0-beta, 2.12.0-beta) e confronta l'impronta con quella generata su `main` @ `33f0ca2` (`scripts/version-gate-fingerprints.ts` → `src/lib/pivot/fixtures/version-gate-fp.json`): tutte identiche. Sulle stesse 160 combinazioni, la 2.15 cambia 33 carriere: le nuove regole sono attive. Prima del gate, sul branch, 33/160 carriere 2.14 differivano da main.

Solo presentazione, per tutte le versioni: età finale nel palmarès (`careerEndAge`) e nota «stagione a 36 anni non giocata» nel diario. Non cambiano esiti sportivi.

## Aggiornamento — gate spostato a 2.16.0 (12 ott 2026, sera)

Su `main` è entrata la #86 (awards v2, branch `grokbot/awards-v2`, commit `fc29b4b`, merge `6a425e5`) che porta il motore a `2.15.0-beta` e gate i premi v2 (AW-01…AW-06) su `RULES_215_SINCE`/`AWARDS_SINCE = "2.15.0"`. Il deploy di produzione di `6a425e5` e `cba5a29` è `success` (12 ott, 19:45–19:46 UTC) e il bundle servito contiene `2.15.0-beta`: esistono quindi carriere 2.15 in corso con awards v2 ma **senza** le regole #83. Per non cambiarle, le decisioni #83 passano a `DECISIONS_SINCE = "2.16.0"` e `ENGINE_VERSION = "2.16.0-beta"`. Una carriera 2.16 ha A2 (2.14) + awards v2 (2.15) + decisioni #83 (2.16).

| Regola | 2.12/2.13 | 2.14 | 2.15 | 2.16 |
|---|---|---|---|---|
| A2 infortuni 29–31 | no | sì | sì | sì |
| Awards v2 (#86) | no | no | sì | sì |
| Stagione a 36 anni accettata giocata | no | no | no | sì |
| Curva premi per difficoltà (`awardProfile`) | storica | storica | storica | nuova |
| D-08 opzione B (spenta) | no | no | no | cablata |

Interazione #83 × #86 risolta (vedi sotto): il bonus MVP positivo si dimezza per ogni MVP vinto, il ritocco ROY per difficoltà entra nel punteggio v2.

Prova: `version-gate.test.ts`, 640 carriere (seed 9100 + 37·i, i = 0…39; 4 difficoltà; 2.15.0-beta, 2.14.0-beta, 2.13.0-beta, 2.12.0-beta), impronte generate su `main` @ `cba5a29`: tutte identiche sul branch. Le 480 carriere 2.14/2.13/2.12 coincidono anche con `33f0ca2` (prima della #86). La classe rookie viene ridisegnata per la versione forzata, come in `awards-gate-fingerprints.ts`. Sulle stesse 160 combinazioni, la 2.16 cambia 14 carriere rispetto alla 2.15.

## Coerenza premi 2.16 (#83 × #86), 12 ott 2026, sera

Solo carriere ≥ 2.16.0. 2.15/2.14/2.13/2.12: 640 impronte identiche a `main` @ `cba5a29`.

- **MVP:** il bonus positivo per difficoltà (`mvpHelp`: Esordio +2,5, Leggenda +4,5) si dimezza a ogni MVP già vinto (`mvpHelpOf` in `league.ts`). Aiuta il primo premio, non si somma alla stanchezza v2 sui successivi. I malus (Pro −0,8, All-Star −1,2) restano fissi.
- **ROY:** il ritocco per difficoltà (`royDelta`) ora entra nel punteggio ROY v2 del giocatore (`royDeltaV2` = `royDelta` × 0,5, `ROY_DELTA_V2_SCALE`): a scala intera il ROY Esordio saliva a 14,8% e Leggenda scendeva a 1,1%.

2.000 carriere per difficoltà (seed (i+1)·1000+3, ruoli/percorsi a rotazione, draft random, classe rookie ridisegnata per la versione):

| Difficoltà | 2.15 MVP max / con MVP / tot | 2.16 prima max / con MVP / tot | 2.16 dopo max / con MVP / tot | ROY 2.15 | ROY 2.16 prima | ROY 2.16 dopo |
|---|---|---|---|---|---|---|
| Esordio | 6 / 11,0% / 480 | **7** / 12,4% / 595 | 6 / 12,4% / 517 | 7,2% | 7,2% | 10,4% |
| Pro | 4 / 4,8% / 150 | 5 / 6,3% / 216 | 5 / 6,3% / 216 | 8,4% | 8,4% | 7,3% |
| All-Star | 2 / 1,4% / 33 | 3 / 2,6% / 68 | 3 / 2,6% / 68 | 8,9% | 8,9% | 4,8% |
| Leggenda | 1 / 0,1% / 2 | 3 / 2,3% / 67 | 3 / 2,3% / 60 | 9,2% | 9,2% | 3,4% |

Il test `max MVP ≤ 6 su Esordio` (test:stats) torna verde senza modifiche. Dati grezzi: `/workspace/reports/mvp/`.
