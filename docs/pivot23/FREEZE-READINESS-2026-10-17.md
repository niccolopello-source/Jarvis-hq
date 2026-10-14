# PIVOT-23 — Freeze readiness, 17 ottobre 2026 (demo 18 ottobre)

Autore: Grok Bot (Jarvis), 2026-10-14. Solo documentazione: nessun codice, nessun merge, nessun deploy. La decisione finale spetta a Pello.
Fonte di ogni riga: **[O]** osservato oggi da Jarvis · **[T]** test automatico eseguito oggi · **[A]** dichiarazione di un altro agente · **[S]** storico (commit precedente) · **[P]** riferito da Pello.

## 1. Candidato
| Voce | Valore | Fonte |
|---|---|---|
| SHA candidato | `21764f3c6de01c447191f98c3f45a211aad008fc` (main HEAD, merge #94) | [O] `git fetch` 2026-10-14 |
| Motore / salvataggi | `ENGINE_VERSION 2.19.0-beta`, `SAVE_VERSION 11` (`config.ts`) | [O] |
| Produzione | www.pivot23.com e pivot23.vercel.app: `index.html` + 10 asset con sha256 identico alla build locale di 21764f3 (22/22) | [O] `reports/jarvis-prod-e2e/prov/sha256.txt` |
| Deployment Vercel | ID non verificato (API 403); `last-modified` 2026-10-14 08:11 UTC | [O] |
| CI su 21764f3 | run 38512203898 (push) success | [O] GitHub Actions |

Se main avanza prima del 17, questo candidato decade: ripetere §1 e il prod e2e (§4, riga G-E2E).

## 2. Unito dal 13 ottobre
| PR | Contenuto | Commit merge |
|---|---|---|
| #89 | G1: decisione narrativa applicata una volta dopo reload (DEF-01..03) | `6ab885e` |
| #87 | Infortuni legati al carico, gate 2.19 | `39129c9` |
| #90 | Recupero salvataggi SR-01..03 | `a980be1` |
| #91 | Soglie di ritiro 2.19 per difficoltà (Esordio ≤20, altre 300-340/1000) | `ae9f1d0` |
| #94 | Localizzazione EN follow-up (league, award notes) | `21764f3` |

## 3. PR aperte e freeze
| PR | Stato | Deve entrare prima del freeze? |
|---|---|---|
| #93 Lucille, copy IT/EN (`i18n.ts`, `narrative/en/*`, 3 righe `legacy.ts`) | bozza, base `ae9f1d0` | **Facoltativa.** Solo testo, ma cambia la build: se entra, va unita entro il 16 con CI verde e prod e2e ripetuto. Altrimenti dopo la demo. Decide Pello. |
| #92 Jarvis, docs audit su 39129c9 | bozza, docs | No. Superata da #95 e da questo documento (commit vecchio). |
| #95 Bot C, QA execution su ae9f1d0 | bozza, docs | No (solo docs, non cambia la build). Riferimento: [QA-EXECUTION-PLAN](https://github.com/niccolopello-source/Jarvis-hq/blob/grokbot/qa-execution-ae9f1d0/docs/pivot23/QA-EXECUTION-PLAN.md), [DEMO-GATE-RESULTS](https://github.com/niccolopello-source/Jarvis-hq/blob/grokbot/qa-execution-ae9f1d0/docs/pivot23/DEMO-GATE-RESULTS.md), [QA-EVIDENCE](https://github.com/niccolopello-source/Jarvis-hq/blob/grokbot/qa-execution-ae9f1d0/docs/pivot23/QA-EVIDENCE.md), [QA-ISSUE-REGISTER](https://github.com/niccolopello-source/Jarvis-hq/blob/grokbot/qa-execution-ae9f1d0/docs/pivot23/QA-ISSUE-REGISTER.md) |
| questa PR | bozza, docs | No. |

Nota: le PR solo docs non avviano il workflow obbligatorio (path filter su `apps/pivot23/**`): nessun check verde atteso, non è un errore.

## 4. Matrice dei gate
Percorsi su box agenti (`/workspace/reports/...`) non sono visibili da GitHub; sono gli artefatti grezzi.
| Gate | Stato al 14/10 | Evidenza | Commit | Prossima azione / owner |
|---|---|---|---|---|
| Provenienza build | PASS | [O] §1 | 21764f3 | ripetere dopo ogni merge — Jarvis |
| CI (lint, typecheck, unit, stats, e2e preview) | PASS | [O] run 38512203898 | 21764f3 | — |
| Prod e2e Playwright (Chromium, WebKit Linux, mobile emulato) | PASS con riserve: run 1 (6 worker) 538/562, run 2 (2 worker) 551/562; i fallimenti residui sono artefatti dell'harness o 1 timeout di rete, tranne R3 (WebKit, P3) | [T] `reports/jarvis-prod-e2e/REPORT.md` | 21764f3 | vedi §8 rischi R3/R4 — Jarvis/Lucille |
| Percorsi carriera (draft, stagione, decisioni, playoff, premi, FA, trade, ritiro, Career Card, archivio) | PASS (automatico) | [T] prod e2e; [A] `reports/bot2/INDEPENDENT-DEMO-GATE-REPORT.md` | 21764f3 / [S] 39129c9 | partita a mano completa: Pello |
| Infortuni #87 + ritiri #91 | PASS (dati motore) | [A] `reports/check91/REPORT-d13c05d.md`, PR #91 | d13c05d → ae9f1d0 | — |
| Motore (ROY, All-Star/All-NBA, OVR, salvataggi) | PASS, 1 P2 noto (A-PEAK) | [A] `reports/engine-a/REPORT.md` | ae9f1d0 | A-PEAK in 2.20 dopo demo |
| Readiness storico | riferimento | [S] `reports/demo-readiness-gate.md` (6ab885e) | 6ab885e | — |
| Layout mobile (emulato) | PASS emulato | [T] prod e2e `readiness` overflow 320–1024 + landscape; probe home/setup 0 px overflow | 21764f3 | — |
| Dispositivi fisici | **BLOCKED** per agenti | protocollo `docs/pivot23/DEVICE-MANUAL-QA.md` | — | Pello, su 21764f3 (o SHA finale) |
| Registro problemi / readiness | in corso | #95 QA-ISSUE-REGISTER; questo documento | ae9f1d0 / 21764f3 | Pello decide quale doc PR unire |

## 5. Decisioni di Pello (registrate)
1. A-PEAK (picco OVR +1..+4): correzione dopo la demo, gate 2.20, revisione Lucille.
2. Pulse neutro +0.05 sulle scelte senza effetti: resta.
3. Terzo quintetto All-NBA senza All-Star: accettato.
4. Ritiri Leggenda ~285-320/1000: accettato.
5. Carriere 2.19 già iniziate passano alle soglie #91: accettato (#91 unita senza nuova versione).

## 6. Regole del freeze (dal 17/10 00:00 fino a fine demo)
- Nessun merge su main, salvo P0 con ok esplicito di Pello per quel merge.
- Ogni merge di emergenza: CI verde, prod e2e ripetuto, sha256 prod = build locale prima della demo.
- Limite di deploy Vercel: un deploy fallito o in coda può lasciare in produzione la build precedente. Non contare su correzioni dell'ultimo minuto; non toccare impostazioni di progetto/dominio.
- Docs PR possono restare aperte; unirle non cambia la build, ma un push su main può avviare un deploy Vercel (non verificato, API 403): evitare durante il freeze.

## 7. Checklist pre-freeze (entro 16/10)
| # | Voce | Owner |
|---|---|---|
| 1 | Decidere #93 dentro (merge entro 16, CI verde) o fuori | Pello (Lucille prepara) |
| 2 | Se main cambia: ripetere §1 sha256 + prod e2e | Jarvis |
| 3 | Dispositivi fisici su SHA finale (iPhone Safari, Android Chrome, Safari macOS) secondo DEVICE-MANUAL-QA | Pello |
| 4 | Una carriera giocata a mano fino al ritiro, scegliere quella da mostrare | Pello |
| 5 | Decidere quale doc PR unire (#95 e/o questa) prima del 17 o dopo la demo | Pello |
| 6 | Correzioni harness e2e (§8 R5) solo dopo la demo | Lucille / Jarvis |

## 8. Rischi residui
- R1 Dispositivi fisici non verificati dagli agenti; esito "funziona" [P] su commit precedenti.
- R2 A-PEAK P2 visibile su Career Card (picco > ogni stagione), rinviato.
- R3 **WebKit (motore Safari, Linux, emulato):** il pulsante "Riprova" del grafico (chunk lazy fallito) non ricarica il grafico: nessuna nuova richiesta parte, perché l'errore di WebKit non contiene l'URL del modulo e `moduleUrlOf` restituisce null. Chromium recupera. Impatto: solo il grafico della scheda Vita dopo un errore di rete; la carriera resta giocabile; un reload risolve. P3, non verificato su Safari reale. Dopo la demo.
- R4 Su WebKit il test di scrittura fallita (quota) non è valido: `localStorage.setItem = …` in WebKit crea una chiave e non sostituisce il metodo, quindi il percorso quota non è testato su WebKit/Safari. NOT VERIFIED.
- R5 Artefatti harness contro host non locali: `career-card` "guest" accetta solo 127.0.0.1/localhost (falso FAIL su prod); fixture `retire-save.json` rigenerata in `beforeAll` da ogni worker (race con più progetti/worker in parallelo).
- R6 Non bloccanti per la demo, bloccanti per uso commerciale: nomi franchigie NBA, titoli OKC, squilibrio premi per ruolo (storico).
