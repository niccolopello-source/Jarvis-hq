# Punto 1 — Compatibilità vecchie carriere e diagnosi future save

7 novembre 2026, verifiche avviate alle 21:41 Europe/Rome. Solo punto 1; punto 2 non iniziato.

## Esito e confini

**PASS nel campione:** nessuna differenza tra main e ciascuna delle PR #152 e #153 per le 13 versioni 2.12–2.24, confrontando lo stato JSON completo, RNG e envelope, non solo fingerprint/statistiche.

**FAIL del criterio forte di identità ininterrotto/resume:** la compattazione già presente su main perde parte del giornale mondo e della cronologia titoli. Non è una regressione della 2.25. Non ho normalizzato via queste differenze né modificato la compattazione per far passare il test.

**FAIL rispetto alla protezione future richiesta:** engineVersion futura in schema valido viene accettata; è possibile una successiva scrittura sintetica sopra il primary. La protezione nuova non è implementata, perché introdurre un limite solo nel loader cambia recuperabilità e boot senza definire il percorso sicuro. Nessuna migrazione/policy è stata inventata.

**Stato complessivo: AUDIT COMPLETATO, ACCETTAZIONE PUNTO 1 INCOMPLETA.** Serve review indipendente prima di decidere la policy e qualsiasi seguito; non è un via libera al merge, alla demo o alla 2.25.

## Revisioni isolate

| Sorgente | SHA esatto |
|---|---|
| main | `33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f` |
| #152 curva 2.25 | `490bc861f44a48d9b22cdf1aec63bf8c30ec0705` |
| #153 cumulativa scelte/morale | `3393f524fd32c3f1b9a42a9341e7c9295ba54a03` |

Nuovo branch `grokbot/legacy-save-compatibility`, base #153. Worktree nuovi e isolati; i due file non tracciati già presenti nel vecchio checkout #153 non sono stati toccati. Processi distinti per ogni revisione, moduli/RNG/store distinti; oggetti delle carriere ininterrotte e riprese non condivisi.

Nessuna modifica a `src`, save/migrazioni, config, RNG, UI, soglie o test preesistenti. `ENGINE_VERSION` resta 2.24.0-beta; massimo 36 anni invariato. Nessun save reale, env, Vercel setting, annuncio, deploy manuale o produzione modificato. Solo nuovi strumenti di audit, comandi aggiuntivi e documentazione.

## Campione e confronto completo

312 scenari logici: 24 per versione × 13 versioni. Per ciascuna revisione, ogni scenario evolve due carriere indipendenti (ininterrotta e con save/load dopo ogni stagione non finale). Non sono “312 giocatori reali” o una prova su tutti i seed.

- 3 percorsi × 4 difficoltà × 2 policy esplicite prima/ultima scelta; ruoli PG/SG/SF/PF/C ruotati.
- Seed `61200 + indice*97`, indice 0–23: da 61200 a 63431. Manifest e digest finali tracciano tutte le 312 coppie.
- Draft random/mixed, scambi accept/refuse e pensionamento play36/retire ruotati: campione di copertura, non stima causale dei loro effetti.
- Checkpoint iniziale, ogni stagione e finale: PlayerState completo, stato effettivo RNG, contatore job e envelope completo (pending incluso). Prima del save, rngState è letto dal RNG effettivo di ciascun job (come nel test legacy esistente), mai copiato dall’altro job o reimpostato al seed; anche lo stato RNG indipendente è registrato.
- Nessuna esclusione di contratti, mondo, RNG o attributi di gameplay. Solo input sintetici fissati: careerId prima del checksum e Date.now per i timestamp di backup. JSON è il confine portabile; nessuna normalizzazione/arrotondamento di gameplay.
- Fixture extra: 195 condizioni di età 29/31/33/35/36 × minuti bassi/infortunio forzato/stella sana; non stime di frequenza.
- 26 sequenze appaiate di fase (2 seed per versione, 72101 e 72198): draft, chiamata, pending story, recap stagione, bracket playoff realmente raggiunto con seed forzato e assert, risoluzione postseason, FA, offseason, ritiro e continuazione. La fixture forza il ramo; non afferma che tutti questi stati siano raggiunti naturalmente.

| Versione | Scenari | Record worker | Record fasi appaiate | main→152 / main→153 |
|---|---:|---:|---:|---|
| 2.12.0-beta | 24 | 503 | 72 | PASS / PASS |
| 2.13.0-beta | 24 | 502 | 72 | PASS / PASS |
| 2.14.0-beta | 24 | 483 | 72 | PASS / PASS |
| 2.15.0-beta | 24 | 483 | 72 | PASS / PASS |
| 2.16.0-beta | 24 | 483 | 72 | PASS / PASS |
| 2.17.0-beta | 24 | 483 | 72 | PASS / PASS |
| 2.18.0-beta | 24 | 483 | 72 | PASS / PASS |
| 2.19.0-beta | 24 | 482 | 72 | PASS / PASS |
| 2.20.0-beta | 24 | 482 | 72 | PASS / PASS |
| 2.21.0-beta | 24 | 479 | 72 | PASS / PASS |
| 2.22.0-beta | 24 | 482 | 72 | PASS / PASS |
| 2.23.0-beta | 24 | 482 | 72 | PASS / PASS |
| 2.24.0-beta | 24 | 466 | 72 | PASS / PASS |

Record worker per versioni supportate: 6.293; record fasi appaiate: 936. **7.229 checkpoint di stato supportato identici per ciascun confronto.** Altri 161 record diagnostici (future/malformed/recovery) portano il totale a 7.390 confronti per PR. Identità con main nei diagnostici non significa che il comportamento sia sicuro.

| Confronto | Worker | Fasi appaiate | Differenze cross-revisione |
|---|---:|---:|---:|
| main vs #152 | 6.454 PASS | 936 PASS | 0 |
| main vs #153 | 6.454 PASS | 936 PASS | 0 |

Sono comparati tutti i campi JSON, con primo path divergente e digest SHA-256 per checkpoint. I digest finali di tutti i 312 scenari per confronto sono in `compatibility-2026-11-07/*-final-digests.jsonl`. Un controllo aggiuntivo sui raw finali conferma, in tutte e tre le revisioni: 24 finali per ciascuna delle 13 versioni, engineVersion conservata in entrambe le modalità, RNG effettivo/player/envelope concordanti e massima età finale 36.

## Ininterrotto vs serializza/load/resume — non nascondere la perdita di dati

Per **ogni singola revisione**, 4.915 checkpoint di carriere naturali:

| Criterio | PASS | FAIL |
|---|---:|---:|
| Full PlayerState + envelope + RNG | 503 | 4.412 |
| Envelope effettivamente persistito | 4.915 | 0 |
| Stato RNG effettivo | 4.915 | 0 |

Prime differenze documentate: `$.player.world.events.10`, `$.player.world.events.15` e `$.player.championLog.0.yearLabel`. `compactPlayer` limita world.events a 10 e championLog a 16; l’ininterrotto conserva più storia in memoria. Il confronto dell’envelope è una verifica aggiuntiva della rappresentazione realmente scritta: **non** sostituisce il full-state FAIL.

Nelle fasi appaiate, per revisione: 936 checkpoint, 858 full-state PASS e 78 FAIL (primo path world.events.10), envelope e RNG 936/936 PASS. Dopo il caricamento viene eseguita la successiva azione engine; non solo letto il JSON.

I risultati sono gli stessi su main, #152 e #153. Nessuna divergenza aggiunta dalla 2.25 nel campione. Per promettere uguaglianza assoluta della memoria dopo resume servirebbe cambiare la politica di compattazione/quota: non è stato fatto per non alterare il comportamento storico. L’eventuale requisito va definito come “rappresentazione persistita identica” oppure affrontato separatamente senza spacciare il requisito più debole per quello forte.

### RNG mancante, caso distinto

Save sintetico 2.24, seed 81003 dopo quattro stagioni: stream effettivo `3596199287`, rngState rimosso prima di ricalcolare un envelope valido. Il loader riapre con rngState=81003 (fallback al seed) e non modifica il raw nel primary. Comportamento uguale nelle tre revisioni. **Non** è possibile affermare parità col flusso casuale perso; nessun restamp o ricostruzione inventata.

## Future schema, future engine e versioni malformate

`LIVE_SAVE_VERSION=2` è lo schema del contenitore, diverso da `player.engineVersion`.

| Input engineVersion in envelope valido v2 | Caricato | ≥2.25 numerico | Esito rispetto alla protezione proposta |
|---|---|---|---|
| 2.25.0-beta | sì | sì | FAIL: futuro accettato |
| 2.25.0 | sì | sì | FAIL: futuro accettato |
| 3.0.0 | sì | sì | FAIL: futuro accettato |
| 2.9.0 | sì | no | Diagnosi: confronto numerico corretto, non lessicografico |
| 2.24.0-beta | sì | no | PASS: versione conservata |
| assente / null / numero | no | no | Diagnosi: corrupt, raw conservato/backuppato |
| stringa vuota / garbage | sì | no | FAIL della validazione semantica stretta; oggi stringhe trattate come regole vecchie |

Le tre engineVersion future rimangono tali in memoria (non vengono promosse da 2.24): `save.ts` non ha upper bound. In #152/#153 il gate `usesOvrCurve225` usa `versionAtLeast(..., '2.25.0')`, quindi un record futuro accettato può usare tuning 2.25 anche con ENGINE_VERSION attivo 2.24. **Non** c’è promozione spontanea dei salvataggi 2.12–2.24.

Il solo caricamento mantiene intatti i bytes primary in tutti questi casi. La prova sintetica successiva con `saveLive` accetta invece una nuova scrittura; per i tre engine futuri il primary non resta identico e non era stato classificato come future/backup. Non è una prova di perdita di dati di utenti reali: è la dimostrazione dell’assenza della protezione al confine di scrittura.

## Recovery: 150 celle per revisione, tre cicli ciascuna

Primary legacy/corrupt/schema futuro/engine futuro/checksum stale/incompleto × session none/legacy/corrupt/schema futuro/engine futuro × backup none/legacy/corrupt/schema futuro/engine futuro.

**PASS byte preservation del solo load:** 450 controlli primary intatto per revisione. Sequenza di tre riavvii simulati tramite invalidazione della cache live, mantenendo le copie storage sintetiche; non è una prova di riavvio browser. `restoreLiveBackup` viene chiamato esplicitamente solo dopo avere registrato i controlli load: mai ripristino automatico del BACKUP_KEY.

Riscontri significativi, già presenti su main:

- Primary schema futuro + nessuna copia session: load=null, report=future, raw conservato e copiato nel backup quando possibile.
- Primary schema futuro + session legacy: si carica la session legacy e il report finale torna ok. **FAIL del criterio “nessun fallback silenzioso in presenza di un futuro”**, anche se il primary rimane intatto durante il load.
- Primary engine futuro: load riuscito, report ok, nessuna quarantena come future.
- Backup legacy non viene automaticamente letto quando il primary non apre. Non confondere il BACKUP_KEY con la copia session: il fallback osservato è alla session, non un ripristino automatico del backup.
- I test recovery preesistenti coprono anche quota/SecurityError e backup precedente. La logica attuale permette un nuovo write dopo aver protetto uno schema futuro nel backup: cambiare questa policy senza definire l’uscita utente è rischioso.

Esiti compatti per ogni cella e i tre tentativi: `compatibility-2026-11-07/future-recovery-observations.json`. Nessun raw save reale è stato letto o incluso.

## Architettura ispezionata e decisione necessaria

Flusso osservato: `PivotApp` chiama `loadLive` al boot; `save.ts/classify` controlla lo schema v prima di `isLiveSave`; `isLiveSave` valida che engineVersion sia stringa ma non limite/semantica; `revive` ripristina RNG dal seed se assente e compatta; il boot può tornare all’intro senza un live. Il layer write/remove ha protezioni di backup/quota, non una barriera generale per engine future.

**Nessun fix parziale introdotto.** Aggiungere soltanto `engineVersion > ENGINE_VERSION → null` consentirebbe comunque intro/reset/autosave o scelta silenziosa di un’altra copia se non viene cambiato anche il protocollo boot/write/recovery. Inoltre i test/lab devono poter continuare a simulare la 2.25 prima dell’attivazione.

Proposta per decisione/review, non implementazione approvata:

1. Distinguere future-schema e future-engine con un esito di blocco/read-only dedicato, senza migrazione, modifica del seed o restamp.
2. Primary e ogni altra copia raw restano intatti: nessun autosave, clear o reset automatico; niente nuova carriera/fallback legacy silenzioso come sostituto del futuro.
3. Scelta esplicita solo dopo aver garantito conservazione recuperabile delle copie; non affidarsi a due slot di backup che possono essere ruotati da un errore successivo.
4. Separare il confine persistito dal laboratorio in-memory, senza rifiutare le versioni supportate 2.12–2.24 o rompere i test 2.25.
5. Definire policy per vuota/garbage/versione precedente non elencata prima di rendere più restrittivo il parser.

Finché non è definita questa policy e verificato il boot, il criterio di protezione future non è soddisfatto. Nessun intervento sugli altri punti o bilanciamento gameplay.

## Test effettivi e limiti

- PASS: unit main 427/427; unit branch cumulativo 427/427, comprese legacy/version-gate, archive e recovery esistenti.
- PASS: lint, typecheck, build e check:headers su main e branch cumulativo (6 header).
- PASS: 3 test del comparatore, verifica tipi stretta dei due worker e lint degli script.
- PASS: suite statistiche main 42/42 e branch cumulativo 49/49; eseguite in sequenza, nessuna soglia modificata. Completate il 7 novembre alle 21:58 Europe/Rome. Il verde delle bande non smentisce i limiti di campione e bilanciamento descritti nei report precedenti.
- NOT RUN: e2e browser/React hydratePending, Safari/mobile, storage reale, fixture di tutti gli stati possibili o tutti i seed, parità impossibile quando rngState è perduto.
- NOT RUN: suite complete standalone #152; per #152 sono stati eseguiti i confronti completi cross-main e tutte le fixture dell’audit.
- NOT RUN in questo audit: CI remota del nuovo branch; verrà eventualmente avviata dalle normali automazioni dopo push/PR. Non attribuire i vecchi check #153 a questa nuova PR.

La prima versione della fixture paired postseason non raggiungeva un bracket nei due seed scelti: è stata corretta forzando esplicitamente il seed nel solo input sintetico e aggiungendo assert. I risultati consegnati delle fasi usano i file `*-final`, non la prova preliminare. Nel worker generale `pending-playoff-forced` è soltanto il nome di un pending sintetico; la copertura del bracket effettivo è garantita dal paired worker.

## Comandi, file e tracce

Ambiente osservato: Node `v24.22.1`, pnpm `10.34.6`, lockfile installato in modalità frozen.

Strumenti nel repository: `apps/pivot23/scripts/compatibility/{worker.ts,phases-worker.ts,compare.mjs,json-diff.mjs,json-diff.test.mjs,run.mjs,README.md}`. Comandi package aggiunti: `test:compat`, `test:compat:types`, `test:compat:tools`. Nessun comando esistente rimosso o soglia allargata.

Riproduzione e accettazione: vedere il README della cartella. Comandi principali eseguiti (dalla app branch, percorsi assoluti sintetici):

```sh
node scripts/compatibility/run.mjs /workspace/pivot23-point1-main/apps/pivot23 /workspace/pivot23-point1-evidence
node --import=tsx scripts/compatibility/worker.ts /workspace/pivot23-point1-152/apps/pivot23 /workspace/point1-152-final.jsonl.gz
node scripts/compatibility/compare.mjs /workspace/pivot23-point1-evidence/main.jsonl.gz /workspace/point1-152-final.jsonl.gz /workspace/point1-152-final
node --import=tsx scripts/compatibility/phases-worker.ts ROOT OUT.jsonl.gz
node scripts/compatibility/compare.mjs MAIN_PHASES TARGET_PHASES OUT_PREFIX
pnpm run test:compat:tools
pnpm run test:compat:types
pnpm run test
pnpm run lint
pnpm run typecheck
pnpm run build
pnpm run check:headers
pnpm run test:stats
```

Il wrapper è stato poi esteso all’opzione #152 e alle fasi: queste operazioni sono state eseguite anche separatamente con i comandi riportati. Le invocazioni esatte e gli output shell completi sono conservati nei log locali; i placeholder ROOT/OUT sopra descrivono le tre invocazioni per main, #153 e #152, non un quarto test.

Tracce locali per la review indipendente:

- `/workspace/pivot23-point1-evidence/`: raw gzip main/#153, manifest, comparison-summary/checkpoints/resume/mismatches.
- `/workspace/point1-152-final*`: raw gzip e confronto #152.
- `/workspace/point1-phases-{main,draft,152}-final.jsonl.gz` e `/workspace/point1-phases-final-*`, `/workspace/point1-phases-152-final-*`: fixture corrette e confronti.
- Log completi con comandi/output: `/workspace/pivot23-point1-evidence/logs/`, file `unit-static-build-draft.log`, `unit-static-build-main.log`, `campaign-main-vs153.log`, `campaign-main-vs152.log`, `paired-phases-final.log`, `stats-main-then-draft.log`, `final-invariants.log`.
- Snapshot preliminari hanno nomi diversi e non sostituiscono quelli finali.

`compatibility-2026-11-07/summary.json`, digest finali per scenario e hash degli strumenti consentono il riscontro senza committare grandi raw snapshot. Tutti i dati sono sintetici, nessuna credenziale o dato personale/fiscale/bancario.
