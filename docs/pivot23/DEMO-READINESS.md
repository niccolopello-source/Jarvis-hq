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
