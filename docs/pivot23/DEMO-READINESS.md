# DEMO READINESS — 2026-10-24 (Phase Zero)

Analyzed commit: `800a2402af81f747b15f92a371f14f441875c31e` (prod `dpl_6S1VZgG845g7YhBqoDWfTRgsNNsj`, READY, same SHA). Decision: **NEAR READY — not declared ready** until R2 (#123) is merged and a real-device pass exists.

Gates use the Master Prompt's official G1–G20 (§16). The earlier table in this PR used its own numbering, and this version replaces it. Evidence is from 2026-10-24 (Europe/Rome) on 800a240 unless a row says otherwise.

| Gate | Name | Status | Evidence |
|---|---|---|---|
| G1 | Baseline | PASS | main = 800a240; prod `dpl_6S1VZgG845g7YhBqoDWfTRgsNNsj` READY on the same SHA (CURRENT-STATE-REPORT.md) |
| G2 | Build | PASS | `pnpm build` exit 0 |
| G3 | Static quality | PASS | lint and typecheck exit 0 |
| G4 | Engine tests | PASS | unit 387/387, stats 24/24 |
| G5 | Determinism | PASS | determinism, rng and version-gate tests; 1200-career full-state fingerprint identical before and after explicit event tags (`grokbot/explicit-event-tags`) |
| G6 | Saves | PASS | save-safety, g1-persistence and lifecycle-flush e2e (preview, Chromium and WebKit) |
| G7 | Full career e2e | PASS | e2e preview Chromium 131 passed / 4 skipped, WebKit 131 / 4 (readiness, paths, demo-gate) |
| G8 | Career Card valid/malformed | PASS | re-checked 25 Oct on main a640e54 (#123 merged): e2e/career-card.spec.ts 17/17 PASS (Chromium, local lab); unit 399/399 PASS |
| G9 | OVR / awards | PASS | re-checked 25 Oct on main a640e54 (#127 merged): peak-display + legacy-report tests 15/15 PASS; unit 399/399 PASS |
| G10 | Mobile UX | PASS (emulation) | viewport e2e 320–1440 plus landscape. Real devices: only Pello's acceptance on an older build (15 Oct); agents have not tested this SHA |
| G11 | Accessibility | PASS (automated only) | Lighthouse 12.8.2 accessibility 100 on mobile and desktop (www, 13:19 CEST); no manual screen-reader pass |
| G12 | Performance | PASS (lab) | Lighthouse performance 90 mobile / 100 desktop; perf probe at 4× CPU: boot→Inizia 405 ms, one season 1805 ms with 0 long tasks (METRICS-800a240.md on `grokbot/metrics-800a240`). No real-device or field data |
| G13 | Languages | PASS (tests) | i18n, narrative and copy-review tests. The 'mestiere/nudo' copy fix is pushed on `grokbot/mestiere-copy` (not merged) |
| G14 | Domain | PASS | re-checked 25 Oct (#119 + #129 deployed, prod deploy a640e54 success): curl no-cache — www.pivot23.com 200; pivot23.vercel.app/, jarvis-hq-pgoc.vercel.app/, pivot23.com/ → 308 to https://www.pivot23.com/ |
| G15 | Security | PASS | prod headers on 24 Oct: enforcing CSP `script-src 'self'`, HSTS, X-Frame-Options DENY, nosniff, Referrer-Policy |
| G16 | Analytics | NOT APPLICABLE | Vercel page views only; no persistent analytics implemented (R7) |
| G17 | Admin | NOT APPLICABLE | no admin panel in the repo |
| G18 | Deployment | PASS | prod SHA = main 800a240 at the time of measurement. Other PRs were being merged on 24 Oct, so re-check after the deploy |
| G19 | Privacy / monetization | PASS (ads off) | no ads, pixel or third-party script in prod; #102 privacy text claims Pro/DPA wrongly (R4), unmerged |
| G20 | Documentation | PASS | CURRENT-STATE-REPORT, OPEN-RISKS, PR-TRIAGE and this file (#128) |

## Demo limits (to declare to anyone who plays the demo)
- **Beta engine.** It is 2.22.0-beta, and balance can still change. Saves are kept locally across versions, but new careers follow the new rules.
- **Local saves only.** Saves live in this browser's storage. There are no accounts and no cloud sync, so clearing site data or changing device or browser loses careers.
- **Known issues on 800a240:**
  - Career Card can fail on a damaged team colour (R2, fix in #123).
  - Peak OVR shown can differ from the best season (R6, fix in #127).
  - Duplicate vercel.app hosts (R5, fix in #119).
  - Each stays open until the fix is merged and deployed.
- **Copy.** About 13 Italian lines use the unclear 'mestiere / nudo' wording until `grokbot/mestiere-copy` lands. English has the same rough edges in a few renders.
- **Fictional game.**
  - Players, events and outcomes are simulated.
  - Real NBA team names appear: this is a trademark risk, not cleared.
  - It is not affiliated with the NBA or any club.
- **Tested environment.**
  - Automated: Chromium and WebKit on Linux, emulated phones 320–1440 px, Lighthouse lab runs, CPU-throttled perf.
  - Real iPhone, Android and Mac: only accepted by Pello on an older build, not re-tested on this SHA.
- **Offline / slow network.**
  - After the first load, play is client-side.
  - The English catalog loads lazily, so the first language switch needs the network.
- **Balance facts a tester may notice** (seeds 910000–910999 and 920000–920999, METRICS-800a240.md):
  - Peak is at age 27 on all difficulties.
  - About 30% of Pro, All-Star and Leggenda careers end at 29–32 with random choices.
  - Always choosing "Percorso prudente" cuts those early endings to 5–13%, but more careers sink to the 48 OVR floor.
- **Not in the demo:** ads, accounts, payments, analytics beyond page views, admin.

---

# DEMO READINESS — 2026-10-04

Stato: NOT READY. Data obiettivo 18 ottobre 2026. Non è un gate raggiunto.

Commit verificato: `84d92a1cf4245bb46762da14bf5d53368c794bcf`. Deploy di produzione: `dpl_4JbVxNibqrgEV93gJvnH8buCode9`, READY, stesso SHA. CI del push: run `37212129082`, verde. `main` non ha branch protection.

## Gate

| Gate | Stato | Evidenza |
|---|---|---|
| URL pubblica | PASS | `https://www.pivot23.com` 200 sul deploy sopra |
| Creazione e draft | PASS | Browser, nome «Stagione», playmaker, NCAA, 10ª scelta Philadelphia 76ers |
| Save e refresh | PASS | Refresh sulla scelta del Rookie of the Year: stesso nome, squadra e scelta. Reload a stagione 3: tre righe nel save |
| Stagione regolare | PASS | 2026-27: 78 GP, 21,7 min, 7,7 PPG, 26-56. 2027-28: 72 GP, 8,7 PPG |
| Playoff nel browser | NOT RUN | Quel percorso ha chiuso «Fuori». Nessuna serie cliccata |
| Playoff nel laboratorio | PASS sul ramo | Seed 23000, Pro, draft random: Milwaukee, «Elim. Primo turno 1-4», premi vuoti. Non è il percorso browser |
| Premi | NOT RUN | Le due stagioni browser e il seed 23000 non hanno premi |
| Free agency e ritiro | NOT RUN | Non raggiunti |
| Checksum falso | PASS | Entrambi gli store corrotti: avviso visibile, file tenuto, backup `corrupt`, niente schermo nero |
| Italiano e inglese | PASS | Scambio sulla home |
| Safari e telefono | BLOCKED | Nessun dispositivo disponibile |
| Intro a due palleggi | NOT RUN | Salta e Suoni presenti. Audio approvato non misurato |
| Prestazioni | NOT RUN | TTI, long task e bundle non misurati in questa sessione |
| Account, ads, cloud, n8n, AI SDK | SPENTI | Nessun caso d'uso autorizzato. Non aggiunti |

## Bug aperti

Nessun P0 riprodotto su questo commit. P1 aperti come misure, non come crash: bust 0/125 nel campione da 1.000, picco per ruolo quasi uguale. Marchi NBA: rischio di prodotto, non rimosso.

## CI

Un solo workflow, `.github/workflows/pivot23.yml`. Su push e PR di `apps/pivot23` esegue lint, typecheck, unit, build, header e e2e sul preview. I controlli statistici sono un job separato. Non usa chiavi a pagamento. Una modifica solo in `docs/` non lo avvia. Required checks non impostati: attivarli con i nomi `lint, types, unit, build, e2e (production build)` e `statistical engine checks (~4 min)` solo dopo un altro verde, per non bloccare `main` con un contesto sbagliato.

## Rollback

Questo documento non cambia il gioco. Per tornare al deploy precedente, il candidato è `dpl_87uvdHTJfiCs31F4RtiaThRnbyH3` sul commit `7d41d10`.


## Playoff nel browser — 2026-10-04, sera

Deploy servito durante il test: `ee352e3`, `dpl_HLAgmnbo6b5Hdx5JZqYkCxtLyzjo`. Non è più `84d92a1`: la PR #47 era già unita. Il motore non è cambiato.

Ambiente: Chromium headless, viewport 800×600. Carriera «Playoff», playmaker, Esordio, NCAA, 1ª scelta Utah Jazz, overall 64.

| Stagione | Record | Playoff |
|---|---|---|
| 2026-27 | 20-62 | Fuori |
| 2027-28 | 21-61 | Fuori |
| 2028-29 | 28-54 | Fuori |

È comparsa un'offerta Chicago Bulls e il click l'ha accettata. Non è una free agency completata. Nessuna serie è stata aperta, quindi il refresh durante la serie non è stato eseguito. Errori JavaScript catturati: nessuno.

Il seed di laboratorio 23000 resta un PASS del motore, non dell'interfaccia. Gate playoff browser: NOT RUN. Demo: NOT READY.

---

## Demo gate — rilevazione 11 ott 2026 (Lucille, `lucille/demo-gate-stabilization`)

Base misurata: `main` @ `f52ae5b` (merge #62–#65). Ambiente: box Linux condivisa, Node + pnpm 10, Chromium headless Playwright, build di produzione servita da `vite preview` (`E2E_PREVIEW=1`). **Nessun dispositivo fisico né Safari reale**: vedi `DEVICE-MANUAL-QA.md`.

| Gate | Stato | Evidenza |
|---|---|---|
| lint / typecheck / build / check:headers | PASS | `pnpm run lint`, `typecheck`, `build`, `check:headers` exit 0 su `f52ae5b` |
| Unit (`pnpm test`) | PASS | 188/188 |
| Statistici (`pnpm test:stats`) | PASS | 3/3 |
| E2E su build di produzione | PASS | 77/77 in 2,9 min su `f52ae5b` |
| Carriera completa nel browser (draft → ritiro → archivio → riapertura, reload a metà) | PASS | `readiness.spec.ts` «a full career…» |
| Reload con carta playoff/mercato in sospeso: stessa decisione, nessuna decisione persa o duplicata | PASS (Chromium) | nuovo `demo-gate.spec.ts`, 6/6 carriere casuali; playoff raggiunti in 2/6, mercato in 5/6 |
| Viewport 320/360/375/390/393/430/768 + desktop + landscape: nessun overflow, target ≥24px | PASS (emulazione) | `readiness.spec.ts`, aggiunto 430×932 |
| Salvataggi corrotti / versione futura / storage assente / archivio non scrivibile / archivio pieno | PASS | `save-safety.spec.ts` |
| Bundle iniziale ≤ 350 kB gzip | PASS | JS caricato all'avvio (index+react-vendor+runtime) ≈ 155 kB gzip; chart/narrative/catalog-en caricati dopo |
| Nessun analytics/ads/pagamenti/wallet/token nel bundle | PASS | scansione `dist/`: nessun dominio terzo, nessuna chiave |
| Performance avvio (lab, 4× CPU, cache calda, localhost) | PASS lab / NOT VERIFIED reale | «Inizia» pronto P75 123 ms, P95 163 ms; tap→setup P75 117 ms (prima 155), long task max P75 0 ms (prima 78) |
| Tap su «Inizia» (profilo CPU, 6 ripetizioni) | PASS lab | causa: `intro-sound` costruiva riverbero e rumore (`makeRoom`/`makeNoise`) dentro il click. Ora solo l'AudioContext nel gesto; i buffer solo quando una cue suona davvero. Long task del tap 125–145 → 85–116 ms; residuo ≈24 ms = `new AudioContext` (necessario nel gesto). Scelta storia: long task 69–82 → 0 ms |
| Simulazione di una stagione ≤ 1,2 s | PASS | Node 20 (`scripts/season-timing.ts`, 935 stagioni, 60 seed): stagione regolare P95 1,6 ms, stagione completa con playoff e offseason P95 7 ms, max 14,5 ms. Browser (build prod, 4× CPU): nessun long task >50 ms nelle transizioni storia→stagione; `simulateRegularSeasonInner` ≈4 ms self-time nel profilo. Il tempo percepito (≈0,8–1,5 s) è fatto di pause volute (`HOLD_*`) |
| Percorsi deterministici: infortunio, premi+playoff, run playoff completa, free agency (+ ritiro già coperto) | PASS (Chromium) | `e2e/paths.spec.ts` + `fixtures/make-path-saves.ts` (seed 4200/4201, stati reali del motore, SAVE_VERSION invariata), 12/12 con `--repeat-each=3`; reload a metà e doppio tap = una sola decisione |
| iPhone/Safari iOS, Android fisico | BLOCKED | nessun dispositivo; protocollo in `DEVICE-MANUAL-QA.md` |

Verdetti: demo tecnicamente giocabile **sì (Chromium)**; demo pubblica accettabile **NOT READY** finché il protocollo su dispositivo reale non è eseguito; rilascio commerciale **NOT READY**.

### Riverifica 12 ott 2026 — testa PR #72 dopo il merge di main (engine `2.13.0-beta`, #66, #70)

Base: `7c0022c` + questo commit. Box Linux, Node 20, Chromium headless, build di produzione (`vite preview`).

| Gate | Stato | Evidenza |
|---|---|---|
| lint / typecheck / build / check:headers | PASS | exit 0 |
| Unit | PASS | 201/201 |
| Statistici | PASS | 5/5 |
| E2E build di produzione | PASS | 99 passati, 2 saltati (sonde perf, solo `PERF=1`) |
| Fixture deterministiche con motore 2.13 | PASS | infortunio s4200/st.8, FA s4200/st.12, premi+playoff s4201/st.5 invariati; run playoff ora s4201/st.**16** (prima st.7: il motore 2.13 cambia la carriera). `careerId` fissato: file identico tra due generazioni |
| `paths.spec.ts` ×10 (con 7c0022c di Jarvis) | PASS | 40/40 |
| Primo tap residuo | Documentato, non modificato | i ~25–34 ms (CPU 4×) rimasti nel task sono `new AudioContext`, che va creato dentro il gesto (iOS Safari); il render del setup pesa pochi ms. Nessun guadagno sicuro lato UI senza provare su Safari reale |
| iPhone/Safari, Android reali | BLOCKED | `DEVICE-MANUAL-QA.md` |

### G6 — prima impressione (12 ott 2026, `lucille/g6-intro-onboarding`)

| Gate | Stato | Evidenza |
|---|---|---|
| Inizia visibile senza scroll su telefono orizzontale (844×390, 667×375, 640×360) | PASS (Chromium) | prima: bordo inferiore di Inizia a 525 px su 390; ora home a due colonne in landscape. `e2e/g6-onboarding.spec.ts` |
| Inizia → creazione carriera: pagina in cima, focus sul titolo | PASS (Chromium) | prima: il setup si apriva a scrollY 300 (landscape) e il focus cadeva su `<body>` |
| Doppio tap su Inizia, audio non disponibile, fine della premiere senza animazioni attive | PASS (Chromium) | stesso file |
| Budget | PASS lab | JS+CSS iniziali gzip 260,4 kB (prima 260,2); avvio/tap invariati entro il rumore (2 misure alternate, CPU 4×) |
| iPhone/Safari, Android reali | BLOCKED | `DEVICE-MANUAL-QA.md` |

---

## G5 — release candidate, 12 ott 2026 (Grok Bot, `grokbot/g5-release-candidate-audit`)

SHA verificato: `main` @ `3bb757bab75a18726bfc6b08756651238ed8fd68` (merge #74, #75, #76). Ambiente locale: box Linux, Node v20.19.2, pnpm 10.33.4, Playwright 1.63 Chromium headless, build di produzione via `vite preview`. La CI usa Node 24 / pnpm 11.19: stessi esiti.

| Gate | Stato | Evidenza |
|---|---|---|
| CI su `3bb757b` | PASS | run [38224123937](https://github.com/niccolopello-source/Jarvis-hq/actions/runs/38224123937): `verify` success (e2e 102 passati, 2 saltati), `engine-stats` success |
| lint / typecheck / build / check:headers (locale) | PASS | exit 0 |
| Unit `pnpm run test` | PASS | 235/235 |
| Statistici `pnpm run test:stats` | PASS | 6/6 |
| E2E build di produzione `CI=true pnpm run test:e2e:preview` | PASS | 102 passati, 0 falliti, 2 saltati (sonde perf), nessun flaky |
| Provenienza deploy | PASS | GitHub Deployment «Production – pivot23» su `3bb757b` = `success`; asset di www.pivot23.com byte-identici (sha256) a `dist/` locale; `index.html` uguale su www e pivot23.vercel.app; pivot23.com → 308 www |
| Vercel API (MCP) | BLOCKED | 403 sullo scope `jarvis-hq-vercel` (G5-F03) |
| Header in produzione | PASS | CSP, HSTS, X-Frame-Options DENY, Referrer-Policy presenti |
| Smoke completo nel browser (`e2e/g5-smoke.spec.ts`, giocato, nessuna fixture) | PASS ×3 | nome lungo, draft, percorso, doppio click, refresh+riprendi, ritiro, report, Career Card, archivio, riapertura; 0 errori console. Playoff/mercato non raggiunti in quei 3 run: coperti da `paths.spec.ts`/`demo-gate.spec.ts` (fixture deterministiche) |
| Smoke produzione (`scripts/prod-smoke.mjs`) | PASS | www e vercel.app: 200, «Inizia» ~1,6 s, setup raggiunto, 0 errori, 0 richieste fallite |
| Bundle iniziale gzip ≤ 350 kB | PASS | ≈249 kB JS + 14 kB CSS + 2,4 kB HTML (`narrative` è in modulepreload, G5-F01) |
| Avvio (lab, CPU 4×, 390×844, 12 run) | PASS lab / NOT VERIFIED reale | «Inizia» pronto P75 136 ms, P95 167; tap→setup P75 134 ms; long task max P75 0, P95 103 ms |
| Stagione simulata ≤ 1,2 s | PASS | `season-timing.ts`, Node 20, 941 stagioni: completa P95 8,2 ms, max 17,1 |
| Resilienza save/load | PASS | suite G3 (M01–M18) + `save-safety`, `g3-idempotency`, `input-lock`, `lifecycle-flush` dentro i conteggi sopra |
| Dispositivi reali | BLOCKED | handoff in `DEVICE-MANUAL-QA.md` |
| Branch protection su `main` | Assente | `gh api …/branches/main/protection` → 404 |

Verdetto: **NOT READY** (dispositivi reali BLOCKED). Nessun bug riprodotto nel perimetro release; nessun fix al codice di gioco.

### Aggiornamento dispositivi reali — 12 ott 2026, 09:54 UTC
| Gate | Stato | Evidenza |
|---|---|---|
| iPhone Safari / Mac Safari / Android Chrome | PASS (riferito da Pello, verifica manuale non osservata dagli agenti) | Messaggio di Pello: «iPhone funziona, Mac funziona, Android funziona». Modelli, OS, SHA e passi: NON VERIFICATO |

Con questo, nessun gate della tabella G5 resta FAIL o BLOCKED, salvo l'API Vercel via MCP (provenienza comunque verificata via GitHub Deployments e hash). Il gate dispositivi poggia solo su quanto riferito: decisione di rilascio a Pello.


## Rilevazione 2026-10-13 — audit indipendente (Grok Bot (Jarvis) — audit indipendente)

Commit: `39129c959ce05b60f2ea8d8f88f26b99681f00de` (main = produzione, sha256 10/10 asset). ENGINE 2.19.0-beta, SAVE_VERSION 11. Ambiente: box Linux, Playwright Chromium + WebKit Linux, produzione www.pivot23.com. Le rilevazioni sopra restano storiche.

Stato: **CONDITIONALLY READY** per demo tecnica. Dettaglio, criteri, owner: `INDEPENDENT-DEMO-GATE-REPORT.md`.

| Gate | Stato | Evidenza (39129c9) | Prossima azione |
|---|---|---|---|
| Build/lint/types/unit/stats/E2E | PASS | unit 290/290, stats 7/7, E2E build prod 120/0 (2 skip), WebKit 39/39, CI run 38388305189 | — |
| Percorsi carriera in produzione | PASS (automatico) | 68/69 spec in prod; il fallito è artefatto del test (host ≠ localhost) | prova manuale Pello |
| Decisioni una volta / save / archivio | PASS (Chromium, WebKit Linux) | g1-story-reload, save-safety, lifecycle in prod e locale | Safari reale |
| Mobile emulato 320–1440 + landscape | PASS | readiness viewport in prod | — |
| Dispositivi fisici | BLOCKED (agenti) | solo riferito da Pello, build precedente | Pello |
| Ritiri 2.19 (29–32 anni) | FAIL vs 300–340‰ | 184‰ (IC 161–209) vs 323‰ su 2.18, 1000 carriere stessi seed | Lucille/Pello |

### Aggiornamento dispositivi — 15 ott 2026
| iPhone / Mac / Android | ACCETTATO da Pello | «Dispositivi accettati: iPhone, Mac, Android». Modelli, OS, browser, SHA: non comunicati. Dettagli in `DEVICE-MANUAL-QA.md` |

## Freeze proposto — 18 ott 2026 (NON APPROVATO)

Come deciso da Pello il 16 ott 2026: niente freeze su `ab10364`; Pello ha unito #109 (16 ott, 20:28 UTC, `f97bf41`) e poi #108 (18 ott, 07:42 UTC). Il commit risultante è il **candidato al freeze**. L'approvazione del freeze spetta a Pello.

Commit candidato: `5940ee581d90aad3417c119e54ec9971ce6b3c4d` (main). ENGINE 2.19.0-beta, SAVE_VERSION 11 (invariati).

| Verifica | Stato | Evidenza (rilevata 18 ott 2026, ~08:40 UTC) |
|---|---|---|
| CI su main `5940ee5` | PASS | run 39108673629 «PIVOT 23 beta»: «lint, types, unit, build, e2e (production build)» success; «statistical engine checks» success |
| Deploy Vercel produzione | PASS | GitHub Deployment 7151614967 «Production – pivot23» su `5940ee5`, stato success (07:43 UTC); status commit Vercel pivot23 / jarvis-hq / jarvis-hq-pgoc success |
| www.pivot23.com serve il nuovo codice | PASS | HTTP 200; il chunk `catalog-en-BTdcmUVE.js` contiene la correzione di #108 (`{0}. October knows it…`, senza «Out») |
| CSP enforcing | PASS (invariata) | `script-src 'self'`, `connect-src 'self'`; Report-Only con domini Google presente (da #104), non blocca nulla |
| Ads | OFF | nessuna stringa `adsbygoogle` / `googlesyndication` nei chunk JS di produzione |
| Web Analytics (#106) | presente | codice Vercel Analytics nel chunk `chart-vendor`; registrazione visite non riverificata in questa rilevazione |
| Dispositivi fisici | ACCETTATO da Pello (15 ott, su build precedente) | nessuna nuova prova su `5940ee5`: NON TESTATO dagli agenti |
| Motore / RNG / salvataggi | invariati | `git diff bc1e84a 5940ee5 -- apps/pivot23/src`: 9 file, solo testi/i18n (`i18n.ts`, `voice.ts`, `narrative/extract.ts`, `en/SwipePager.ts`, `en/story-late.ts`) e test; nessun file engine/world/save/config. Ritiri 2.19 quindi come nella rilevazione del 13 ott (non rimisurati) |

Non eseguito in questa rilevazione: test locali, E2E contro produzione, prova manuale su dispositivi. Stato del freeze: **PROPOSTO, in attesa di approvazione di Pello**.
