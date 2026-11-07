# PIVOT23 — seguito review #155, solo punto 1

**Bozza per review indipendente finale. Punto 1 NON dichiarato tutto verde; punto 2 NON iniziato.**

PR: https://github.com/niccolopello-source/Jarvis-hq/pull/155 — branch `grokbot/future-save-protection`, base audit #154. Follow-up normale, nessun amend/rebase/force. Runtime candidato immutabile: `36d67df0f82be6b6f4ab5e84e68bb490ee4de7a5`; i commit successivi aggiungono solo test browser/documentazione/evidenze. Baseline main: `33810f74ebfb3e1a9ffd5daa0db646993ebb3d7f`.

Solo fixture sintetiche su workspace. Nessun save reale, merge, deploy manuale, attivazione, env/settings/ads. ENGINE_VERSION 2.24.0-beta, età massima 36 e soglie gameplay invariati. Nessuna modifica a compattazione, world, RNG o gameplay per rendere verdi i test. Le eventuali preview automatiche del push non sono produzione.

## P1: riproduzione runtime e correzione

Il rischio statico è stato **riprodotto prima del fix** sul runtime `8d84ec7`: avvio draft UI, raw persistito round 0, autosave 360 ms posticipato artificialmente a 60 s, scelta carta che porta la UI a Round 2 e il round RAM a 1, navigazione nativa `page.goto` verso un altro documento. `pagehide.isTrusted === true`; nel documento successivo il round persistito era **0, atteso 1: FAIL runtime**, non semplice HYPOTHESIS. La destinazione iniziale era HTML route-fulfilled; nessun `dispatchEvent` sintetico per produrre il lifecycle.

Il boundary ora è **unico proprietario** di `pagehide`: nello stesso callback sincrono `finishLiveDocument(stop)` esegue verifica, flush registrato dell'app, rilascio in `finally`. Rimossi il `queueMicrotask(stop)` e i listener pagehide/visibility duplicati di PivotApp. La registrazione usa identità propria: anche un disposer vecchio dello stesso callback non rimuove una registrazione nuova. visibilitychange è gestito dal boundary; focus/pageshow/storage e cleanup conservano il confine di protezione.

La stessa sequenza è GREEN dopo il fix; il test definitivo usa `/robots.txt` reale, senza routing: round 1 nella pagina successiva, lease 0 fuori app, ritorno history con round 1 e un solo writer, reload ancora un solo writer. Il controllo riguarda una mutazione realmente solo RAM con autosave pendente, non una scrittura diretta del raw da parte del test.

**BFCache — PASS supplementare successivo, non suite committed:** il primo runner headless-shell sopra aveva `pageshow.persisted=false`, reason `masked`, quindi non provava freeze/restore. Un ulteriore test con full Chromium headless già installato (`channel:"chromium"`) ha osservato e asserito **pageshow.persisted=true, notRestoredReasons=null**, round1 conservato, lease0 fuori app/1 al ritorno e dopo reload. Primo tentativo full Chromium: timeout30s di `goBack()` in attesa di un nuovo load, snapshot già Round2; conservato come FAIL test-driver. Variante corretta usa `goBack({waitUntil:"commit"})`, mantiene tutti gli assert e aggiunge assert persisted=true: **PASS1**. Non conta fra i58 test della suite committed e non certifica tutti i browser/device. Fonte, comando, SHA256 config/spec/log: [supplemento immutato](review155-bfcache-supplement/review155-bfcache-supplement.json); [log PASS](review155-bfcache-supplement/review155-bfcache-full-chromium-commit.log). Runtime155 invariato. Safari/Firefox/device reali/HTTP LAN/vecchie tab NON certificati.

## P2: metadata wrapper prima del raw

Contratto, per wrapper riconoscibili negli slot backup/crash local/session:

| Forma | Prima del follow-up | Ora | Blocca live |
|---|---|---|---|
| `{v:"2",raw:42}` | corrupt | malformed | sì |
| `{raw:42}` | corrupt | missing | sì |
| `{v:2,raw:42}` | future-schema | future-schema | sì, già prima |
| `{v:1,raw:42}` | corrupt | corrupt | no blocco dati nuovo: percorso legacy |
| wrapper malformed ma inner raw con header futuro riconoscibile | future | future | sì |

Quindi **non esisteva un bypass della versione numerica futura**: v=2 era già bloccata. La correzione è l'ordine conservativo di metadata mancanti/malformati prima del raw invalido. Il relativo RED mirato ha rilevato l'aspettativa malformed contro corrupt; le nuove forme sono testate su tutti gli slot wrapper. Malformed non viene chiamato future. Header futuro riconoscibile continua a prevalere su checksum/shape invalidi.

## Supporto e recovery, senza nuova operazione distruttiva

- Web Locks richiede browser compatibile **e secure context HTTPS/localhost**. HTTP LAN può bloccare anche un browser aggiornato. Nessun fallback scrivente è introdotto: fail-closed mantenuto.
- Export dello **slot INTERO**, wrapper e whitespace compresi, non solo inner raw. Rappresentazione UTF-16LE senza BOM, lossless sulle code unit originali, comprese surrogate isolate. Non è un normale JSON UTF-8 né un formato di import universale del gioco.
- Nessun restore sostitutivo/wipe/rotazione archivio nuovo. Future in qualsiasi slot, storage illeggibile, missing/malformed conservano lock globale; nessun fallback silenzioso legacy che abiliti scritture.
- Web Locks coordina solo build cooperanti sulla stessa origine: vecchie tab/build non cooperanti restano un limite. Dispositivi/browser non provati non vengono certificati.

## Test effettivi del follow-up

Evidenze locali concluse il **7 novembre 2026, 23:01 CET Europe/Rome = Europe/Amsterdam** (timestamp dettagliati nel manifest).

| Verifica | Esito osservato |
|---|---|
| Native pre-fix / metadata pre-fix | **RED attesi**, exit 1; conservati separatamente |
| `pnpm run test` | **PASS 461/461**, zero fail/skip; 427 precedenti +34 protezione |
| `test:stats` | **PASS 49/49**, soglie invariate; non benchmark 48.600 |
| typecheck / lint / build locale | **PASS**, exit 0 |
| compat types / tools | **PASS**, **7/7** tool (3+4) |
| Browser batch finale | **PASS 47/47** (30 future +7 lifecycle +1 native +9 legacy) |
| Recovery/safety, 2 spec disgiunte | **PASS 11/11**, compresi i 3 assert aggiornati per CI |
| Browser distinti complessivi di questa fase | **58**, non si sommano rerun sovrapposti |
| Native static receiver isolato | **PASS 1/1**, incluso nei 47 finali |

Un tentativo operativo ha usato per errore lo script inesistente `test:types` dopo lint PASS: exit 1 di comando, non test prodotto. Corretto con i comandi supportati `typecheck` e `lint`, entrambi PASS; nessun errore nascosto come PASS.

I tre test browser che facevano fallire la CI precedente non sono stati saltati: sono stati aggiornati dal vecchio contratto home/session-fallback al contratto più forte read-only. Ora verificano assenza di Inizia, export, raw intatto, nessun backup/session fallback, quota liberata che non sblocca il futuro, navigazione nativa e reload; storage getter negato resta lock invece di diventare store assente. I test di recovery della corruzione compatibile e archivio/quota supportati restano positivi.

**Errata esplicita:** i test harness sono **7, non 8**: 3 json-diff + 4 comparatore. Anche la precedente affermazione operativa di 8 era errata. Log/hash storici non riscritti.

## Parità legacy e limite distinto

Campagna nuova main→runtime36d: **9 comandi exit 0**; source recheck **204/204 file main e218/218 candidato byte-identici** agli hash iniziali.

| Confronto | Esito |
|---|---|
| Worker supportati | **PASS 6.293/6.293** |
| Paired phase/resume | **PASS 936/936** |
| Fixture compattazione cross-revision | **PASS 2/2** |
| Totale main→patch supportato | **PASS 7.231/7.231**, full stato/envelope/RNG |
| Finali 13 versioni | **PASS 312/312** |
| Diagnostici separati | 161:39 identici, **122 differenze policy FAIL**, non cancellate |
| Continuo→reload naturale, per revisione | full503 PASS/4.412 FAIL; envelope/RNG4.915 PASS |
| Continuo→reload paired, per revisione | full858 PASS/78 FAIL; envelope/RNG936 PASS |
| Continuo→reload forzato, per revisione | full2 FAIL; envelope1 PASS/1 FAIL; RNG1 PASS/1 FAIL |

Il comparatore default resta strict. Il flag esplicito permette soltanto differenze diagnostiche nei prefissi dedicati, mai un mismatch supportato. Le righe diagnostiche mantengono status e primo JSON path; RNG mancante rimane distinto, senza promessa di ricostruzione.

Il campione ripete tutte le 13 versioni 2.12–2.24, 24 scenari/versione =312 coppie/finali: 3 percorsi ×4 difficoltà ×first/last, ruoli ruotati, seed `61200 + index*97`. Processi/store isolati, stato completo/envelope/RNG a checkpoint e finale, input sintetici fissi e **nessuna normalizzazione gameplay**. Le fixture phase/pending/trade/ritiro e compattazione aggiungono rami non garantiti dal campione naturale. Non è una prova universale.

**Obiettivo persistibile equivalente alla baseline esistente, non identità piena memoria continuo→reload.** La [issue locale OPEN sulla compattazione/RNG](issues/LEGACY-SAVE-COMPACTION-RNG.md) distingue i FAIL preesistenti: seed sintetico 89081, evento dynasty perso dalla compattazione e riemesso da world.ts con consumo RNG. Non è solo perdita visiva; la fixture forzata diverge anche su envelope/RNG dopo resume, ugualmente su main e patch. Nessuna correzione silenziosa del legacy. Protezione e chiusura di questo limite sono due valutazioni separate.

## CI, provenienza e comandi

CI precedente head `8d84ec7`: **FAILURE conclusa**, non più in progress. Run reale https://github.com/niccolopello-source/Jarvis-hq/actions/runs/42416977462 : tre aspettative E2E obsolete sopra descritte; i due mirror falliscono il docs-only guard a causa dello stesso check reale. Stats e preview risultavano SUCCESS. Nuova CI sul push del follow-up da osservare separatamente; nessun verde anticipato. Le evidenze qui sono precedenti al push finale, e non si spacciano per CI remota della nuova SHA.

Artefatti nuovi, separati dagli storici: [review155-2026-11-07/](review155-2026-11-07/). Manifest raw per-run/exit, SHA/tree/file/harness hash; recheck sorgenti; digest finali; summary per gruppi; hash log e spec E2E. Raw completi e JSON path/seed/checkpoint sul box in `/workspace/pivot23-review155-evidence/`. Gli assert E2E aggiustati dopo il runtime 36d sono tracciati separatamente: runtime e harness del confronto restano byte-identici alla campagna.

```sh
# da apps/pivot23, dipendenze frozen già installate
pnpm run test
pnpm run test:stats
pnpm run typecheck && pnpm run lint && pnpm run build
pnpm run test:compat:types && pnpm run test:compat:tools
pnpm run test:compat /workspace/pivot23-point1-main/apps/pivot23 /workspace/pivot23-review155-evidence --allow-diagnostic-changes
E2E_PREVIEW=1 E2E_PORT=4197 pnpm exec playwright test e2e/future-save-protection.spec.ts e2e/lifecycle-flush.spec.ts e2e/native-lifecycle-protection.spec.ts e2e/g1-persistence.spec.ts e2e/demo.spec.ts e2e/resume-late-quiet.spec.ts --workers=1
E2E_PREVIEW=1 E2E_PORT=4197 pnpm exec playwright test e2e/save-recovery.spec.ts e2e/save-safety.spec.ts
```

NOT RUN localmente: intera suite E2E del repository; Safari/Firefox/device fisici/HTTP LAN reale; save reali/produzione; identità universale legacy o frequenza naturale del controesempio. I test browser sono Chromium headless su build locale, non desktop automation.

**Consegna per Dallak: protezione corretta da riesaminare, limite legacy OPEN, nessuna promessa demo pronta, nessun punto 2, nessun merge/deploy autorizzato da questa relazione.**


Aggiornamento documentale punto2: Dallak ha comunicato PASS finale protezione nel perimetro verificato e nessun blocker residuo per avvio2. CI head2840aba conclusa10SUCCESS;184browserPASS+5skip condizionali preesistenti. Il limite legacy89081 rimane OPEN e non solo visivo. Nessuna modifica al runtime155.
