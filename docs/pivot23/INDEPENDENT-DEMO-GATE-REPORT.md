# PIVOT-23 — INDEPENDENT DEMO GATE REPORT (Grok Bot 2)

> **Snapshot storico.** Questo report si riferisce al commit `39129c9` (13/10/2026). Lo stato successivo di main e produzione è `21764f3` (14/10/2026, dopo #90, #91 e #94): i numeri qui sotto non descrivono quello SHA.

Autore: Grok Bot (Jarvis) — audit indipendente · Data: 2026-10-13, 11:26–12:15 UTC · Demo target: 18/10/2026 (demo tecnica, non rilascio commerciale).
Nessun merge, nessun deploy, nessuna modifica a codice di gioco/persistenza. Prove grezze: `/workspace/reports/bot2/` (box).
Tag di provenienza: **[OSS]** osservazione diretta · **[AUTO]** test automatico eseguito ora · **[AGENTE]** dichiarazione di un agente · **[STORICO]** report precedente / altro commit.

## 1. Executive summary
- main = produzione = **`39129c959ce05b60f2ea8d8f88f26b99681f00de`** (merge #87, 13/10 11:09 UTC). ENGINE_VERSION **2.19.0-beta**, SAVE_VERSION **11**, LIVE_SAVE_VERSION 2. [OSS]
- **#87 è stata unita SENZA la ricalibrazione dei ritiri** decisa da Pello: `git diff 7cb99f9 39129c9` è vuoto. Le uscite 29–32 anni sulle carriere nuove sono **184/1000** (IC95 161–209) contro 323/1000 su 2.18 e l'obiettivo 300–340. [AUTO]
- Gate tecnici verdi sul commit esatto: lint, typecheck, build, unit 290/290, stats 7/7, E2E build prod 120 passati/2 saltati/0 falliti, WebKit 39/39, produzione 68/69 (l'unico fallimento è un artefatto del test, vedi §9). [AUTO]
- Nessun P0 riprodotto. Nessun difetto di duplicazione decisioni, perdita carriera o stallo riprodotto.
- **Verdetto: CONDITIONALLY READY** (non PASS): restano dispositivi fisici non verificati dagli agenti, decisione aperta sui ritiri 2.19 (P1 di bilanciamento, non di integrità), docs da unire.

## 2. SHA
| Elemento | Valore | Fonte |
|---|---|---|
| origin/main | `39129c9` (ultimi: #87, #89, #81, #83, #88) | `git fetch` 11:26 UTC [OSS] |
| CI push main su 39129c9 | run 38388305189 **success** (10m19s) | `gh run list` [OSS] |
| Produzione | contenuti = build locale di `39129c9` | §3 [OSS] |
| ID deployment Vercel | **BLOCKED** (API Vercel 403 per il nostro scope) | — |
| PR aperte | solo #90 (Lucille, draft, save recovery) head `7d05710`, **CONFLICTING** con main | `gh pr view` [OSS] |
| Issue aperte | 0 | `gh issue list` [OSS] |

## 3. Provenienza build [OSS]
- `curl -I https://www.pivot23.com/` → HTTP/2 200, CSP/COOP presenti.
- `index.html` di www.pivot23.com e di pivot23.vercel.app **identico byte per byte** a `dist/index.html` buildato localmente da `39129c9`.
- **10/10 asset** in `dist/assets` con **sha256 identico** a quelli serviti (es. `index-BLB0qFhR.js`, `narrative-CJ8eyuXl.js` 4ac40c3a…, `react-vendor-CyDUuctK.js` 3772976d…). Elenco: `prov/assets.txt`.
- READY/200 non è considerato prova funzionale: le prove funzionali sono in §4/§7.

## 4. Percorsi funzionali in produzione
Ambiente: https://www.pivot23.com (commit 39129c9), Playwright Chromium headless (Desktop Chrome, build chromium-1248), contesti nuovi per test, nessun dato utente reale. Suite del repo puntata sulla produzione (`playwright.prod.bot2.config.ts`, non committato). Log: `prod-e2e.log`, screenshot `prod-results/`.

| Percorso | Esito | Come |
|---|---|---|
| Home / avvio | PASS [AUTO] | prod-smoke: 200, "Inizia" in 1,755 s, 0 errori console, 0 richieste fallite |
| Creazione carriera (nome, ruolo, percorso) e draft | PASS [AUTO] | g5-smoke (nome lungo), readiness full career |
| Stagioni, decisioni narrative | PASS [AUTO] | readiness full career 29 passi, reload a stagione 6 |
| Infortunio scriptato con reload | PASS [AUTO] | paths.spec (fixture) |
| Premi + playoff con reload, playoff fino alla fine | PASS [AUTO] | paths.spec |
| Free agency con reload e firma | PASS [AUTO] | paths.spec |
| Ritiro, 36 anni giocato una volta | PASS [AUTO] | demo-readiness.spec |
| Career Card, archivio, riapertura dopo reload | PASS [AUTO] | career-card.spec, readiness |
| DEF-01 story reload, DEF-03 archivio illeggibile | PASS [AUTO] | g1-story-reload.spec in prod |
| Save safety (danneggiato, versione più nuova, storage assente, archivio pieno/non scrivibile) | PASS [AUTO] | save-safety.spec in prod |
| Cambio lingua IT/EN, narrativa intera | PASS [AUTO] | narrative-lang, a11y-i18n |
| Viewport 320×568 … 1440×900 + landscape 667×375 | PASS [AUTO] | readiness overflow/target (10 viewport) |
| Export PNG locale, nessun login/acquisto | PASS [AUTO] (vedi §9 BUG-B2-01) |
| Trade/contratti | PASS solo in locale [AUTO] (input-lock "trade acknowledgements") — non eseguito in prod |
| Partita completa a mano | **NOT VERIFIED** | solo percorsi automatici |
| Audio non disponibile | PASS locale [AUTO] (intro-sound.spec nella suite locale) — non in prod |

## 5. Audit PR #87 (infortuni)
Metodo: `inj/measure.mts` (copia dello script di `/workspace/reports/injuries/`), engine headless, **stessi seed 900000–900249 × 4 difficoltà = 1000 carriere** per lato, ruoli/percorsi ruotati, draft random. Baseline = `6ab885e` (2.18.0-beta), corrente = `39129c9` (2.19.0-beta). Grezzi `inj/base.json`, `inj/cur.json`. [AUTO]

| Indicatore | Base 2.18 | Corrente 2.19 | Note |
|---|---|---|---|
| Carriere con 0 infortuni gravi | 0/1000 (IC 0–0,4%) | **300/1000 = 30,0%** (IC 27,2–32,9) | Esordio 24,4%, Pro 23,6%, All-Star 32,4%, Leggenda 39,6% |
| 1 / 2+ infortuni gravi | 1000 / 0 | 453 / 247 | |
| Stagione dell'evento | solo 7–9 (finestra fissa) | 2–18 | Finestra fissa eliminata |
| Fascia d'età | 24–29 | 18–38 (picco 30–32) | |
| Carico precedente → rischio per stagione | — | 4,9% (8–16 min) · 5,6% (16–24) · 8,4% (24–32) · 10,3% (32–40) | Monotono crescente: dipendenza dal carico osservata |
| Distanza minima fra due gravi | n/a | 3 stagioni (247 coppie) | |
| Stesso tipo ripetuto consecutivo | n/a | 0/247 | 7 tipi (caviglia 186 … spalla 77) |
| GP medi nella stagione dell'infortunio | 46,8 | 49,1 | ≈33 partite perse |
| Stagioni medie / età media fine | 15,48 / 34,15 | 16,09 / 34,76 | Carriere più lunghe |
| **Fine carriera 29–32 anni** | **323/1000** (IC 29,5–35,3%) | **184/1000** (IC 16,1–20,9%) | Obiettivo approvato 300–340: **NON raggiunto** |
| Determinismo stesso seed | — | 1000/1000 fingerprint identici su due run | |
| Compatibilità 2.12/2.14/2.16/2.18 (forzando engineVersion) | — | **1120/1120 fingerprint identici** a 6ab885e | carriere esistenti invariate |

Confronto con numeri storici: PR #87 "335→171/1000, ~30% senza infortunio grave" [AGENTE]; Lucille "336→191" [AGENTE]. I nostri 323→184 e 30,0% sono **compatibili** (gli intervalli di confidenza contengono 335/336 e 171/191): la differenza viene dai seed diversi (variazione di campionamento), non da una regressione né da un'incoerenza dei test.
Conclusione: il cambio infortuni funziona come dichiarato; l'effetto collaterale sui ritiri è **atteso e noto** ma la ricalibrazione decisa da Pello **non è nel merge**. Nessuna modifica fatta qui (vincolo).

## 6. LIFE / BUST / WORLD / ROLE
| Indicatore | Definizione / metodo | Campione | Baseline | Corrente | Soglia | Decisione |
|---|---|---|---|---|---|---|
| LIFE fine 29–32 | età fine ∈[29,32] | 1000/lato | 323‰ (2.18) | 184‰ (2.19) | 300–340‰ (approvata 13/10) | **FAIL vs soglia** — ricalibrazione Lucille |
| LIFE per difficoltà (29–32) | idem | 250/diff | Esordio 4 · Pro 332 · All-Star 492 · Leggenda 464 ‰ | 20 · 256 · 208 · 252 ‰ | MEASURED — NO APPROVED THRESHOLD per difficoltà | Pello |
| BUST flag | `TUNING.bust` | config | "current" | "current" (choices-b SPENTO) | sperimentali OFF | PASS [OSS] |
| BUST / WORLD / ROLE / premi | da MEASUREMENT-GATE | 12.000 carriere su **6ab885e** | — | **non ri-misurati su 2.19** | MEASURED — NO APPROVED THRESHOLD | [STORICO]: OKC 11,4% titoli, ROY SG ~15% vs PG/C ~2,5%, bust "potenziale mancato" ~1%. #87 tocca solo infortuni/ritiri, ma bust da infortunio e lunghezza carriera cambiano: **rimisurare su 39129c9** |
| Determinismo seed | fingerprint doppio run | 1000 | 400/400 [STORICO] | 1000/1000 | identico | PASS |

## 7. Test, CI, prestazioni (tutti su 39129c9, box locale, Node + Playwright)
| Suite | Esito | Log |
|---|---|---|
| lint | 0 errori | lint.log |
| typecheck | 0 | tc.log |
| build | OK | build.log |
| unit | **290/290** | unit.log |
| stats | **7/7** | stats.log |
| E2E su build prod (vite preview, CSP prod) Chromium | **120 passati, 2 saltati (sonde PERF), 0 falliti**, 5,3 min | e2e.log |
| WebKit (engine Linux, non Safari reale): readiness, g1-story-reload, save-safety, lifecycle-flush, a11y-i18n | **39/39** | webkit.log |
| E2E contro produzione Chromium | 68/69 (1 artefatto, §9) | prod-e2e.log |
| Avvio prod | "Inizia" visibile 1,755 s, 0 errori | smoke/prod-smoke.json |
| CI GitHub main | success run 38388305189 | — |
Prestazioni su hardware reale / Lighthouse: NOT VERIFIED.

## 8. Dispositivi
- iPhone / Mac / Android "funzionano": **riferito da Pello** [AGENTE/utente], su commit precedente a #83/#81/#89/#87; non osservato dagli agenti.
- Agenti: nessun dispositivo fisico → **BLOCKED**. Emulazione viewport e WebKit Linux non sono prova fisica.
- Protocollo: `docs/pivot23/DEVICE-MANUAL-QA.md` (esistente) da ripetere da Pello sulla build 39129c9.

## 9. Bug riprodotti
| ID | Sev | Descrizione | Riproduzione | Stato |
|---|---|---|---|---|
| BAL-RET-219 | P1 (bilanciamento, non integrità) | Ritiri 29–32 a 184‰ vs obiettivo 300–340‰ approvato; ricalibrazione non inclusa nel merge #87 | §5, seed 900000–900249 | Aperto, owner Lucille (motore) — nessuna correzione proposta qui (vincolo) |
| BUG-B2-01 | P3 (solo test) | `career-card.spec` "guest: no network" fallisce contro produzione perché considera "esterno" ogni host ≠ localhost; le 14 richieste erano tutte same-origin `www.pivot23.com`, **0 terze parti** | eseguire la spec con baseURL di produzione | Artefatto dell'harness, non difetto del prodotto. Nessuna issue aperta |
| PR90-CONFLICT | P2 (processo) | #90 in conflitto con main 39129c9 | `gh pr view 90` | Owner Lucille |
| CI-DOCS | P3 (processo) | Una PR solo `docs/` non avvia il workflow (path filter): questa PR documentale non avrà CI | — | Noto |

## 10. Matrice dei gate (commit verificato 39129c9, 13/10/2026)
| # | Gate | Stato | Criterio | Evidenza | Blocco residuo | Prossima azione |
|---|---|---|---|---|---|---|
| 1 | Build/lint/types/unit/stats/E2E | **PASS** | tutto verde sullo SHA | §7 [AUTO] | — | — |
| 2 | Creazione carriera e draft | **PASS** | prod + locale | §4 [AUTO] | manuale non fatta | Pello (prova generale 17/10) |
| 3 | Decisioni applicate una volta | **PASS** (Chromium+WebKit Linux) | DEF-01 0 duplicazioni | g1-story-reload/g3-idempotency/input-lock locale, prod, WebKit [AUTO]; g1-cross-audit 0/100 locale, 0/18 prod su 6ab885e [STORICO] | Safari reale | Pello (device) |
| 4 | Save/load, reload, archivio, backup, migrazioni | **PASS** (automatico) | nessuna perdita | save-safety, lifecycle, version-gate, compat 1120/1120 [AUTO] | report di Grok Bot 1 non ricevuto in questo audit; #90 draft in conflitto | Bot 1 / Lucille |
| 5 | Carriera completa (premi, playoff, mercato, ritiro) | **PASS** (automatico) | percorsi E2E | §4 [AUTO] | trade solo locale; partita a mano NOT VERIFIED | Pello |
| 6 | Coerenza storia/stats/Card/archivio | **PASS** (automatico) | dati identici dopo reload | career-card, career-coherence [AUTO] | invarianti 12.000 su 2.18 [STORICO] | — |
| 7 | No schermo nero/stallo/errori | **PASS** (percorsi testati) | 0 errori console | smoke, init/chunk-failure [AUTO] | P0-BLACK storico causa non chiusa | — |
| 8 | Mobile e a11y essenziale | **PASS** (emulazione) | no overflow, AA, focus | 10 viewport incl. 320 e landscape in prod; a11y-i18n Chromium+WebKit [AUTO] | non fisico | — |
| 9 | Lifecycle e storage limitato | **PASS** (Chromium/WebKit Linux) | flush, quota | lifecycle-flush, save-safety [AUTO] | iOS reale | Pello |
| 10 | Provenienza e prestazioni | **PASS** (provenienza) / perf reale NOT VERIFIED | sha256 = build | §3 [OSS] | ID deployment Vercel BLOCKED (403) | — |
| 11 | Dispositivi reali | **BLOCKED** (agenti) / riferito da Pello su build vecchia | protocollo DEVICE-MANUAL-QA | — | nessun device | **Pello** entro 16/10 |
| 12 | Registro e readiness | **NOT VERIFIED → PASS al merge** di questa PR doc | doc datati, stato attuale | PR doc (bozza) | merge da Pello | Pello |
| — | Bilanciamento ritiri 2.19 | **FAIL vs soglia approvata** | 300–340‰ | §5 [AUTO] | ricalibrazione | Lucille + Pello |

## 11. Rischi e decisioni per Pello
1. **Ritiri 2.19** (184‰): (a) demo così, rischio accettato — non è difetto di integrità; (b) Lucille ricalibra entro 15/10, merge, rerun completo gate + provenienza. Raccomando (b) solo se pronta entro il 15/10, altrimenti (a).
2. **Dispositivi fisici**: ripetere DEVICE-MANUAL-QA su 39129c9 o accettare esplicitamente il limite.
3. Freeze di main dal 17/10 (limite deploy Vercel).
4. P1 di prodotto per rilascio commerciale (non demo): nomi franchigie NBA, OKC, ROY per ruolo — da rimisurare su 2.19.

## 12. Prossime azioni
1. Pello: decisione ritiri (a/b) e device QA. 2. Lucille: ricalibrazione 2.19 (se b) e rebase #90. 3. Bot 2: rimisurare BUST/WORLD/ROLE su 39129c9 (o sullo SHA finale). 4. Rerun completo gate su qualsiasi nuovo SHA + sha256. 5. Prova generale 17/10 con seed fisso.

## 13. Confronto con report precedenti
- `demo-readiness-gate.md` (6ab885e): **superato**. Discrepanze: candidato ora 39129c9 (2.19); P1-INJ "100% infortunio grave" **risolto** (0% → 30% senza); nuovo P1 ritiri; unit 282→290; gate 12 era FAIL, ora in PR.
- `g1-cross-audit.md` (6ab885e): conclusioni confermate su 39129c9 dai test automatici (non ripetuta la matrice manuale 0/150/400/800/1500 ms).

## 14. PR documentale
Branch `grokbot/bot2-independent-gate`, PR in bozza (link nel messaggio finale). Solo `docs/pivot23/`.
