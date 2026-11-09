# PIVOT 23 — Punto 1: protezione non distruttiva della persistenza

**Stato: bozza per review indipendente, NON chiusura del punto 1. Punto 2 non iniziato.**

Evidenze osservate il 7 novembre 2026, 22:39 Europe/Rome / Europe/Amsterdam (CET). Solo fixture sintetiche sul box. Nessun save reale letto/modificato. Nessun merge, attivazione, deploy manuale, modifica env/settings/ads o messaggio a terzi. L'unico push e il draft PR avvengono dopo queste verifiche; eventuali preview automatiche sono CI, non produzione.

## Revisioni e confini

- main di confronto: `33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f`.
- Motore #152: `490bc861f44a48d9b22cdf1aec63bf8c30ec0705`; cumulativo #153: `3393f524fd32c3f1b9a42a9341e7c9295ba54a03`.
- Base audit [draft #154](https://github.com/niccolopello-source/Jarvis-hq/pull/154): `394af85fd154868d45b213efce0be10e883abea0`.
- Branch `grokbot/future-save-protection`; runtime verificato: `6cef874ed4919890340bed4834fc226aa2da4126`. Il commit successivo aggiunge solo questo report/artefatti documentali e un ulteriore test browser del boot illeggibile, senza modificare codice eseguibile: SHA pubblicato e URL numerico della nuova PR sono nel riscontro operativo. Non si inventa un numero prima della creazione.
- **ENGINE_VERSION resta `2.24.0-beta`; età massima 36; nessuna soglia o regola gameplay indebolita.** `engine.ts`, config, RNG, league e compattazione legacy non modificati.
- Questo seguito aggiorna la diagnosi di [LEGACY-COMPATIBILITY-2026-11-07.md](LEGACY-COMPATIBILITY-2026-11-07.md), senza trasformare risultati storici in nuovi test o certificazione demo.

## Implementato / verificato / non introdotto

| Ambito | Implementato in bozza | Verifica / limite |
|---|---|---|
| Classificazione | Tutti gli 8 slot local/session: primary, backup, backup-prev, crash; prima di revive, MEM, fallback e rotazione | Future header prevale su checksum/shape incompleti; unit + Chromium |
| Versioni | Parser numerico della sola persistenza; prerelease/build suffix confrontati per major/minor/patch; nessun restamp | 2.9 < 2.24; 2.25 beta/release e 3.0 bloccati. Gate storici intatti |
| Guardia | Rilettura effettiva degli slot a ogni commit mutante; load/MEM, save, clear, rotation, crash, restore legacy, reset/new, finalizzazione UI, gesture, callback e pagehide | Cache solo se il raw riletto coincide; non sostituisce un errore di lettura |
| Boot | PivotApp/CrashFallback non montati prima di lease e classificazione sicure; unmount e cancellazione/invalidazione timer al lock | Boot/refresh/focus/storage/pageshow/pagehide e pending autosave sintetici |
| Concorrenza | Web Lock esclusivo per durata documento, `ifAvailable`, nessuna coda/fallback scrivente; un writer per origine anche stesso careerId | Seconda scheda read-only. Snapshot precedente: rilascio tramite microtask; il presunto ordine flush→release è smentito dal test nativo RED della review #155. Superato dal follow-up sincrono; ripresa su focus/pageshow |
| Errori lock | API assente, getter negato, throw sincrono o rejection diventano read-only, non crash | RED sul candidato precedente e GREEN con nuovo handler; controlli browser |
| Recovery | Solo conservazione + export esplicito raw, hash atteso anti-scelta-stale; messaggi IT/EN nei dizionari esistenti | Download UTF-16LE senza BOM, conserva esattamente code unit DOMString, anche surrogate isolate; NON stringify |
| Restore/import | Nessun nuovo restore sostitutivo, import, archivio rotante o reset distruttivo nella recovery nuova | Non applicabili restore futuro con quota/hash/copia verificata: non esiste tale operazione. Il vecchio restore API resta solo dove nessuno slot è futuro/ambiguo/illeggibile |
| DEV/lab | Nessuna deroga alle chiavi live; payload futuro non ottiene nemmeno una prima scrittura; override DEV futuro si ferma prima della nuova carriera | Simulazioni 2.25 pure/in memoria restano possibili; suite statistiche 2.25 eseguite |

### Semantica conservativa esplicita

- `absent` e `supported` non bloccano dati, ma in browser serve sempre il lease.
- `future-schema`, `future-engine`, `missing`, `malformed`, `unreadable` bloccano **tutto il live**, anche se il primary è legacy e il problema è solo in session/backup/crash.
- Assente/null engine metadata: `missing`; numero/stringa vuota/garbage: `malformed`. Nessuna coercizione alla versione attuale. Wrapper senza metadata valido non abilita scritture.
- Uno storage illeggibile **non è assente**: niente fallback a MEM/session che possa abilitare una nuova carriera o sovrascrivere la copia non leggibile.
- Corruzione ordinaria riconoscibile (JSON non parsabile, checksum errato, shape incompleta senza header futuro riconoscibile) conserva i percorsi legacy di backup/ripristino. Schema numerico precedente continua nel pipeline legacy. Non si afferma di riconoscere una versione futura da JSON troncato non parsabile.
- Un primary futuro non è trattato come corrotto, non viene ruotato, ripristinato da backup legacy, cancellato o rimpiazzato. Nemmeno liberare quota sblocca la scrittura.
- L'export legge stringhe originali: localStorage non conserva “byte file” originari. UTF-16LE è una rappresentazione lossless delle code unit, documentata, non un nuovo formato importabile dal gioco.

## Test e comandi effettivi

| Comando / insieme | Esito osservato |
|---|---|
| `pnpm run test` | **PASS 456/456**, zero skip/fail; include headers, version gate, i18n/copy e regressioni legacy |
| `pnpm run test:stats` | **PASS 49/49**, soglie invariate; non è un nuovo benchmark 48.600 carriere |
| `pnpm run typecheck`, `lint`, `build` | **PASS** tutti; build produzione soltanto locale |
| `test:compat:types`, `test:compat:tools` | **PASS**, 7 test tool (3 json-diff + 4 comparatore), incluso gate diagnostico esplicito |
| E2E produzione locale, batch sei spec | **PASS 52/52** |
| Successivo E2E spec protezione con boot illeggibile aggiuntivo | **PASS 30/30**; 53 test distinti complessivi |
| Campagna main→patch | **9 comandi exit 0**; interpretazione distinta nelle tabelle sotto |
| Piena memoria / controesempio RNG legacy | **FAIL preesistenti**, non normalizzati e non corretti |
| Intera suite E2E del repo / browser reali / produzione | **NOT RUN** localmente in questa milestone |

La suite mantiene i 427 test precedenti e aggiunge 29 test di protezione. Le aspettative precedenti che autorizzavano overwrite/rotazione di future save o fallback da storage illeggibile sono sostituite con invarianti più forti: raw intatto, nessun fallback/mutazione. Recovery/rotazione della corruzione compatibile continuano a essere testate positivamente; nessun test saltato o soglia gameplay abbassata.

I 29 test includono 8 posizioni future-engine, 8 posizioni future-schema, wrapper futuro anche incompleto, versioni mancanti/malformate, stale MEM, quota/read/export failure e hash stale. La matrice aggiuntiva ha **130 combinazioni con almeno una copia futura**, 3 restart simulati ciascuna: tutti i raw degli store devono restare identici dopo load/save/clear/crash/restore. Questi sono 390 cicli, non 390 carriere.

I 53 test browser distinti sono 30 di protezione e 23 legacy (batch iniziale 52 PASS; successivo run protezione 30 PASS con un caso aggiuntivo, 29 sovrapposti): produzione locale Chromium headless, export reale, errori API, tab concorrenti stesso careerId, future insert prima del flush, draft/stagione/archivio e hydrate pending FA/trade/playoff, story reload/idempotenza, lifecycle e quiet-resume. Non sono una certificazione di tutta la UI su tutte le 13 versioni.

## Main contro patch: stato completo, non statistiche aggregate

| Gruppo | Checkpoint supportati main→patch | Esito |
|---|---:|---|
| Naturali + phase/boundary worker, 13 versioni | 6.293 | **PASS 6.293/6.293** |
| Paired phase/resume, 13 versioni | 936 | **PASS 936/936** |
| Fixture compattazione forzata 2.24, prima/dopo | 2 | **PASS 2/2** revisioni, non continuo/reload |
| Totale supportato | **7.231** | **PASS 7.231/7.231** pieno stato e RNG cross-revision |
| Diagnostici separati | 161 | 39 identici, 122 differenze policy **FAIL cross-revision** conservati |

13 versioni `2.12.0-beta`–`2.24.0-beta`, 24 scenari/versione = **312 coppie/finali** tracciati nei digest. Tre percorsi × quattro difficoltà × first/last policy; ruoli ruotati; seed `61200 + index*97` (0–23). Processi e store separati, oggetti non condivisi; PlayerState completo, envelope/checksum, RNG effettivo, contatore `n` e opzioni JSON del job. Callback non serializzabile esplicitata come policy nell'id. Nessun campo gameplay eliminato/arrotondato; solo input sintetici fissi (careerId e Date.now), non normalizzazione degli esiti.

I 161 diagnostici sono caratterizzazione, NON identità legacy supportata: 39 righe identiche, 122 differenti (FAIL cross-revision attesi dalla nuova policy, da revieware; non trasformati in PASS). Il caso `missing-rng` è separato: nessuna promessa di ricostruire lo stream assente o di parità con il flusso perduto. Ogni riga mantiene PASS/FAIL, hash completi e primo JSON path. Il default del comparatore resta strict. `--allow-diagnostic-changes` consente solo differenze nei prefissi diagnostici espliciti, mai uno stato supportato differente; quattro test del comparatore lo verificano. Non si chiama questo “tutto verde”: i FAIL di differenza policy restano leggibili negli artefatti.

## Continuo vs save/reload: baseline e nuovo controesempio, NON nascosti

Valori **per revisione**, uguali su main e patch; non si sommano due revisioni come carriere nuove.

| Gruppo continuo→reload | Checkpoint/revisione | Piena memoria | Envelope persistibile | RNG effettivo |
|---|---:|---|---|---|
| Carriere naturali | 4.915 | 503 PASS / **4.412 FAIL** | **4.915 PASS** | **4.915 PASS** |
| Paired phase | 936 | 858 PASS / **78 FAIL** | **936 PASS** | **936 PASS** |
| Fixture forzata compattazione | 2 | **2 FAIL** | 1 PASS / **1 FAIL** | 1 PASS / **1 FAIL** |

La perdita preesistente di memoria completa non viene corretta per far passare i test: `world.events` persistito al massimo 10 contro cap runtime 16, `championLog` conservato a 16. La baseline persistibile equivalente osservata nelle carriere naturali/paired è distinta dalla piena memoria e non è una proprietà universale.

**Nuova diagnosi condizionale rilevante:** fixture forzata 2.24, seed **89081**, roster CPU vuoto, tre titoli NBA dello stesso team sintetico e evento dinastia all'indice 10. Il reale save/load perde quell'evento; il successivo `tickWorld` lo riemette, consuma RNG diversamente e può cambiare anche lo stato persistibile. Primo mismatch full `$.rngState`; persistibile `$.player.rngState`; RNG diverso. Riprodotto identico su main e patch, con confronto integrale prima/dopo: **preesistente, non regressione della protezione**. Non è una carriera naturale, né misura frequenza/gravità in produzione. Non è corretto dire che la compattazione ha effetti soltanto visivi, né promettere parità universale. Nessuna modifica gameplay applicata a questo comportamento.

## Provenienza e riproduzione

Artefatti compatti: [future-save-protection-2026-11-07/](future-save-protection-2026-11-07/). Manifest con SHA/tree, file hash e aggregate source hash, versioni runtime/tool, hash harness, comando/exit per run, lunghezza/SHA-256 raw gzip e output confronto. Recheck finale delle sorgenti rispetto agli hash registrati: **PASS**, tutti i file sorgente/probe registrati ancora byte-identici; ulteriore spec E2E tracciata separatamente nel test manifest.

Raw completi, tutti i checkpoint/PASS/FAIL/seed/path, primi mismatch e log restano sul box: `/workspace/pivot23-future-guard-final-evidence/`. Log qualità: `/workspace/future-guard-quality-final.log`; E2E `/workspace/future-guard-e2e-final.log` e `/workspace/future-guard-e2e-protection-last.log`; statistiche `/workspace/future-guard-stats-final.log`; build `/workspace/future-guard-build-last.log`. Tutti sintetici, nessuna credenziale o dato personale.

Da `apps/pivot23`, dopo installazione frozen del lockfile:

```sh
pnpm run test
pnpm run test:stats
pnpm run typecheck
pnpm run lint
pnpm run build
pnpm run test:compat:types
pnpm run test:compat:tools
pnpm run test:compat /absolute/main-33810f7/apps/pivot23 /absolute/new-output --allow-diagnostic-changes
E2E_PREVIEW=1 E2E_PORT=4197 pnpm exec playwright test e2e/future-save-protection.spec.ts e2e/lifecycle-flush.spec.ts e2e/g1-persistence.spec.ts e2e/g1-story-reload.spec.ts e2e/resume-late-quiet.spec.ts e2e/demo.spec.ts --workers=1
```

Le dipendenze Chromium del runner sono state installate sul box; il primo tentativo E2E senza eseguibile non aveva eseguito il prodotto. RED specifico API: guard di `0845126`, getter `navigator.locks` negato, `assert.doesNotThrow` fallisce (`/workspace/future-guard-api-red.log`); unit/browser finali verificano il GREEN senza indebolire l'assert.

## Rischi, NOT RUN e decisioni di review

1. **Web Locks protegge solo writer cooperanti.** Read-check-write localStorage non è atomicamente protetto contro vecchie build/tab/script che ignorano il protocollo. Rilettura prima di ogni write riduce la finestra, non elimina quel limite. Le vecchie tab devono essere chiuse/aggiornate; protocollo lock da mantenere tra build.
2. Scelta conservativa con costo UX: un writer per origine, anche carriere diverse; browser senza API sicura restano read-only. Qualsiasi copia futura/metadata ambiguo blocca anche una carriera legacy altrimenti valida. Non si inventa una migrazione o una scelta distruttiva per sbloccarla.
3. Nessun nuovo restore/import futuro. Servono review e policy separata se si vuole un recupero sostitutivo con scelta esplicita, hash atteso e copia verificata. Export fallito mantiene copie/lock.
4. **NOT RUN:** intera suite E2E del repo, Safari/Firefox/dispositivi reali, freeze BFCache reale (testati gli eventi sintetici), quota/permessi reali OS/browser anziché fault injection, garanzia contro writer vecchi non cooperanti, save utente, produzione/deploy. Nessun claim di equivalenza per ogni seed/stato o versione non esplicitamente supportata.
5. **Criterio non soddisfatto universalmente:** piena memoria dopo reload e, nel controesempio forzato, persino stato persistibile/RNG. Baseline/patch identiche nei campioni; non equivale a certificare demo pronta o risolvere il difetto legacy.
6. Review indipendente Dallak ancora necessaria sul candidato, policy conservativa e limiti sopra. Il go-ahead implementativo non è approvazione merge/deploy. **Nessun punto successivo avviato.**

## CI e stato finale della milestone

[Draft #154](https://github.com/niccolopello-source/Jarvis-hq/pull/154) **OPEN / DRAFT**, head `394af85fd154868d45b213efce0be10e883abea0`: tutti i 10 check osservati **SUCCESS** (quality/E2E, statistiche, Vercel preview). Main remoto ancora `33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f`. Osservazione in sola lettura, non una promozione in produzione.

Nuovo draft protezione: apertura a valle dell'unico push; CI della nuova PR **non ancora avviata in questo snapshot pre-push**. Il riscontro operativo riporta URL/stato effettivamente osservati dopo l'apertura. Nessuna attestazione anticipata di CI verde o demo pronta.

**Conclusione:** implementazione coesa in bozza, prove riproducibili e limiti negativi espliciti; pronta da sottoporre a Dallak, NON punto 1 dichiarato chiuso, NON autorizzazione merge, NON demo certificata. Ordine eventuale dello stack solo proposto dopo review; nessuna attivazione 2.25.


## Errata e seguito review #155

Il conteggio harness precedente **8 era errato: sono 7 test**, 3 json-diff + 4 comparatore; i log/hash originali restano immutati. I test browser sintetici precedenti NON provavano l'ordine fra listener di un evento nativo. La review ha portato a una riproduzione runtime reale (round solo RAM perso all'uscita sul codice 8d84ec7) e correzione sincrona: vedere [FUTURE-SAVE-REVIEW155-2026-11-07.md](FUTURE-SAVE-REVIEW155-2026-11-07.md). La protezione si valuta separatamente dal [limite legacy aperto](issues/LEGACY-SAVE-COMPACTION-RNG.md).
