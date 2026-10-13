# PIVOT-23 — G1 cross-audit dopo PR #89 (QA indipendente)

Data: 2026-10-13 · Autore: Grok Bot (QA, sola verifica) · Esito complessivo: **DEF-01/02/03 PASS con evidenza ripetibile; nessun difetto nuovo; nessuna correzione aperta.**

## Commit e ambienti
| Ambiente | Cosa | Evidenza |
|---|---|---|
| main | `6ab885ee327af1828050c1e91456a7bda0afb5aa` (merge #89; include anche #81 e #83) | `git rev-parse origin/main` = commit di riferimento |
| Locale | worktree `/workspace/g1-cross` su 6ab885e, build di produzione servita da `vite preview` (E2E_PREVIEW=1), Chromium Playwright 1.62, Linux | log in `/workspace/reports/g1x/` |
| Pre-fix (controllo) | `8c4dacd` (= genitore di 8a3b554, main dopo #88, prima di #89) | `prefix-run.log` |
| Produzione | https://www.pivot23.com (= pivot23.vercel.app), contesti browser nuovi, solo localStorage del contesto di test | `prod-def01.log`, `archive-ui-prod.log` |
| Preview Vercel | **NOT RUN** (nessuna preview dedicata da verificare; API Vercel non usata/403) | — |

**Produzione = main 6ab885e: PASS.** I 10 asset (`index-BO0l3wkf.js`, `index-PE9pBNvO.css`, `narrative-…`, `react-vendor-…`, `rolldown-runtime-…`, `CareerChart-…`, `LegacyExperience-…` js/css, `catalog-en-…`, `chart-vendor-…`) hanno sha256 identico tra build locale di 6ab885e e www.pivot23.com; stesso index.html su pivot23.vercel.app. Il bundle servito contiene `card-unverified` (codice #89). L'ID di deployment Vercel non è verificato (API Vercel 403).

## Evidenze dichiarate dalla PR #89
| Dichiarazione | Stato | Evidenza |
|---|---|---|
| CI su 8a3b554 (commit della PR) | **PASS** | run 38366441078 (pull_request) e 38366407821 (push): success |
| 120 e2e passati, 2 saltati | **PASS** | log job 115192580174: `2 skipped / 120 passed (8.2m)` |
| lint, typecheck, test, 7 stats | **PASS** (step verdi) | stesso run; job stats 115192579963 success |
| 263 unit test | **NOT VERIFIED** (conteggio non letto dal log) | in locale su main 6ab885e: 282/282 (main include #83/#81 dopo la PR) |
| 0/25 ripetizioni, 0/6 background/chiusura | **NOT VERIFIED** come numeri della PR (prove locali di Lucille, non allegate) | sostituite dalle prove indipendenti sotto |
| CI su main 6ab885e | **PASS** | run 38374125081 (push main): success |

Locale su 6ab885e: lint PASS, typecheck PASS, unit 282/282 PASS. Stats non rieseguiti in locale (NOT RUN; verdi in CI).

## Analisi del codice (PivotApp.tsx su 6ab885e)
- `onStory` applica l'opzione su un clone, aggiunge una voce a `choiceLog`, imposta `resolvedPendingRef.current = pending` **prima** di `setPlayer`, scrive il log `decision`, poi `holdThen(HOLD_TITLE_MS=1400, runSeason)`.
- `savedPendingOf(p, resolved)`: se la carta pendente è quella appena risolta (stesso oggetto) salva `pending: null`; al caricamento parte la carta di ripresa esistente ("Si rientra in palestra" / "Entra in campo"), che non riapplica la scelta.
- Effetto di salvataggio: `decided` è vero anche quando `pending === resolvedPendingRef.current`, quindi la scrittura è **immediata** (osservato: storage aggiornato ~60 ms dopo il click, `pending` null, choiceLog +1, form 0→1.3).
- `flushLive` (chiamato da `visibilitychange` hidden e `pagehide`) usa lo stesso `savedPendingOf`; non scrive se lo storage contiene un'altra carriera.
- Fino a quando `runSeason` non sostituisce `pending`, ogni salvataggio (differito, immediato, pagehide, visibilitychange) scrive il player con la scelta e nessuna carta: non esiste finestra in cui si salvi "scelta applicata + stessa carta". Coerente con la causa radice dichiarata.
- Nota di metodo (non difetto): `flushLive` sovrascrive su `pagehide` uno storage modificato dall'esterno se il `careerId` coincide. Ha contaminato la prima versione del mio harness (re-iniezione nella stessa pagina); risolto usando un contesto nuovo per ogni ripetizione. Nessun impatto per l'utente individuato.

## DEF-01 — scelta narrativa applicata una volta
Stato fisso: per ogni cella il salvataggio sulla prima carta narrativa ("Rookie of the Year") viene catturato una volta e re-iniettato a ogni ripetizione (stesso seed, stato RNG, carta). Ogni ripetizione: contesto nuovo, click sulla prima opzione, attesa X ms, poi:
- reload: `page.reload()`;
- close: `page.close({runBeforeUnload:true})` → nuova pagina nello stesso contesto;
- kill: copia dello storage senza alcun evento → contesto nuovo;
- background: `visibilitychange` hidden → copia → contesto nuovo; poi la pagina originale torna visibile e prosegue.
Controlli per ogni ripetizione: seed invariato; id log unici; se la carta è offerta di nuovo allora 0 voci in choiceLog e attributi/forma = prima; altrimenti esattamente 1 voce choiceLog, 1 voce log `decision`, e (se la stagione non è ancora girata) attributi e forma = riferimento di una sola applicazione; poi un passo in più: la scelta resta contata 1 volta.

| Ambiente | Ritardi | Modi | Ripetizioni | Doppie applicazioni | Esito |
|---|---|---|---|---|---|
| Locale 6ab885e (build prod) | 0, 150, 400, 800, 1500 | reload, close, kill, background | 20 celle × 5 = **100** | **0/100** | **PASS** (20/20 test, 4.6 min) |
| Produzione www.pivot23.com | 0, 400, 1500 | reload, kill, background | 9 celle × 2 = **18** | **0/18** | **PASS** (9/9 test) |
| Pre-fix 8c4dacd (controllo) | 0, 400, 800 | reload, close, kill | 9 celle × 5 | **riprodotto** in 8/9 celle: "offered again ⇒ not applied: expected 0, received 1" | FAIL atteso (kill@0 passa: lo storage precede il click) |

Dettaglio locale: a 0–800 ms la carta non è mai riofferta, la scelta è salvata una volta, attributi e forma uguali al riferimento; a 1500 ms (> hold 1400) la stagione è già girata in 20/20 casi e la scelta resta 1. Background: anche la pagina originale, tornata visibile, ha la scelta 1 volta. Nessun `pageerror`.
Il controllo pre-fix dimostra che l'harness è sensibile al difetto: **DEF-01 PASS su main e in produzione.**

## DEF-02 — fingerprint carta (engine, node; UI su produzione)
| Caso | Locale (engine) | Produzione (UI) |
|---|---|---|
| fingerprint valido (30 seed) | PASS, 30/30 nessun problema | PASS, nessun "da verificare" |
| fingerprint errato (carta intatta) | PASS, `card-mismatch`, carta conservata | PASS, "da verificare" + `data-archive-issue="card-mismatch"` |
| carta alterata, fingerprint vecchio | PASS, `card-mismatch`, carta conservata | — |
| fingerprint assente (+ carta alterata) | PASS, `card-unverified`; dopo una scrittura dell'archivio il fingerprint resta assente (non ri-firmato) | PASS, "da verificare" + `card-unverified`; archivio grezzo non modificato dal caricamento |
Il fingerprint SHA-256 senza chiave rileva corruzione, **non** autenticità: non vale come prova per NFT o premi.

## DEF-03 — archivio illeggibile
| Caso | Locale (engine) | Produzione (UI) |
|---|---|---|
| JSON non parsabile | PASS: `unreadable`, raw intatto al caricamento, copiato in `pivot-v2-archive-backup` prima della scrittura | PASS: avviso `data-archive-load="unreadable"` per 2 reload, raw intatto |
| non-array (oggetto, numero) | PASS (entrambi) | PASS (oggetto) |
| singola voce corrotta | PASS: 2 voci caricate, `dropped: 1`, raw nel backup | PASS: avviso `dropped`, 2 voci in archivio, raw intatto |

## Riepilogo
| # | Voce | Esito |
|---|---|---|
| 1 | main = commit di riferimento; produzione = build di main | PASS (sha256 asset); ID deployment NOT VERIFIED |
| 2 | Analisi onStory / resolvedPendingRef / savedPendingOf / flushLive / visibilitychange / pagehide / effetto | PASS (nessun percorso doppio trovato) |
| 3 | DEF-01 a 0/150/400/800/1500 ms | PASS locale 0/100; PASS prod 0/18 (0/400/1500); 150/800 prod NOT RUN |
| 4 | reload, background, chiusura, ripresa | PASS (locale tutti; prod reload/kill/background; close prod NOT RUN) |
| 5 | choiceLog, attributi, forma, log, pending coerenti, applicata 1 volta | PASS |
| 6 | DEF-02 | PASS locale e prod |
| 7 | DEF-03 | PASS locale e prod (non-array numero solo locale) |
| — | Preview Vercel | NOT RUN |
| — | Dispositivi reali (iOS Safari/Android bfcache, kill reale) | NOT VERIFIED (solo Chromium desktop emulato) |

**G1 (DEF-01/02/03): chiudibile sulla base di evidenza ripetibile in Chromium**, con i limiti sopra (no WebKit/dispositivi reali). Decisione di chiusura a Pello.

Regressioni: nessuna osservata. Causa radice DEF-01 (confermata dalla riproduzione pre-fix): durante l'hold la carta risolta restava `pending` e i salvataggi la scrivevano insieme agli effetti già applicati.

## File modificati
Nessun file di prodotto. Solo documentazione: `docs/pivot23/G1-CROSS-AUDIT.md` (questo report), `docs/pivot23/ISSUE-REGISTER.md` (righe DEF-01/02/03), `docs/pivot23/g1-cross-audit/` (harness usati, non eseguiti dalla CI). Nessun cambio a gameplay, bilanciamento, RNG, difficoltà, ENGINE_VERSION, SAVE_VERSION o formato salvataggi.

## Riproduzione
```
cd apps/pivot23 && cp ../../docs/pivot23/g1-cross-audit/*.spec.ts e2e/ && cp ../../docs/pivot23/g1-cross-audit/g1x-archive.json e2e/
G1X_REPS=5 E2E_PREVIEW=1 E2E_PORT=4391 pnpm exec playwright test e2e/g1-cross-audit.spec.ts --workers=4
cp ../../docs/pivot23/g1-cross-audit/playwright.g1x-prod.config.ts . && pnpm exec playwright test -c playwright.g1x-prod.config.ts e2e/g1x-archive-ui.spec.ts
node --import=tsx ../../docs/pivot23/g1-cross-audit/def0203.mts   # percorsi assoluti nel file: adattare
```
(Lo spec scrive JSON in `/workspace/reports/g1x/`.)
