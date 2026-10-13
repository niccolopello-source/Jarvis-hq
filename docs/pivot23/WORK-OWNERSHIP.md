# PIVOT 23 — Registro di chi lavora su cosa

**Ultimo aggiornamento:** 12 ottobre 2026  
**Riferimento:** Project Bible §11.1 — *Un solo owner modifica un determinato file o area per volta.*  
Fonte: `/workspace/reports/chatgpt-doc-2026-10-11.txt` (Project Bible & Master Execution Plan v1.0).

---

## Scopo

Questo registro evita che due agenti (o persone) modifichino la stessa area contemporaneamente. Ogni area ha **un solo responsabile attivo**. Chi vuole lavorare su un'area già presa deve attendere che la relativa PR sia unita o che l'owner liberi la riga.

Serve soprattutto perché sul repository operano più agenti IA (Grok Bot, Grok e altri) con accesso allo stesso account GitHub, e i nomi dei branch da soli non bastano a capire chi ha scritto cosa.

---

## Come usarlo

1. **Prima di iniziare** un lavoro su un'area: aggiungi o aggiorna una riga in questa tabella (owner, branch, PR se già aperta, stato, data) e pubblica il branch su GitHub.
2. **Durante il lavoro:** pubblica spesso (`git push`). Un branch non pubblicato è invisibile agli altri e non conta come prenotazione verificabile.
3. **Quando la PR è unita** (o il lavoro è abbandonato): rimuovi la riga oppure impostala a «libero / chiuso», così l'area torna disponibile.
4. **Segnale affidabile dell'autore:** l'autore del commit (`git log --format='%an <%ae>'`).  
   - **Grok Bot** (questo agente) firma come `Grok Bot <grokbot@users.noreply.github.com>`.  
   - **Grok** (altro agente) e il lavoro umano risultano spesso come `niccolopello-source`.  
   I branch `grokbot/*` sono stati usati anche da Grok il 4–5 ottobre (PR #45–#57): il prefisso del branch **non** è una prova di ownership; conta l'autore del commit.

---

## Tabella aree

| Area | Owner | Branch | PR | Stato | Data |
|------|-------|--------|----|-------|------|
| Accessibilità e UI (CSS a11y, layout stretto, focus, contrasto, e2e readiness) | **Grok Bot** | `grokbot/a11y-ui-recovery` | [#62](https://github.com/niccolopello-source/Jarvis-hq/pull/62) | Unita | 11 ott 2026 |
| QA indipendente della #61 (solo test: fingerprint, seed 29930, golden) | **Grok Bot** | `grokbot/pr61-qa` | [#63](https://github.com/niccolopello-source/Jarvis-hq/pull/63) | Unita | 11 ott 2026 |
| Copy / i18n (correzioni a render-time: accordo squadre EN, slot traduzione, grammatica) | **Grok Bot** | `grokbot/copy-review` | [#64](https://github.com/niccolopello-source/Jarvis-hq/pull/64) | Unita | 11 ott 2026 |
| Career Legacy Report / Career Card / temi cosmetici (Missione 2) | **Grok Bot** | `grokbot/bust-label-legacy` | [#76](https://github.com/niccolopello-source/Jarvis-hq/pull/76) | Unita. Etichetta D-08 nel Legacy Report | 12 ott 2026 |
| Intro / visual / onboarding (G6) | **Lucille** | `lucille/g6-intro-onboarding` | [#79](https://github.com/niccolopello-source/Jarvis-hq/pull/79) | Unita | 12 ott 2026 |
| Suoni dell'intro (`src/intro-sound/*`, e2e `intro-sound.spec.ts`) | **Grok Bot** | `grokbot/intro-sound-sync` | [#77](https://github.com/niccolopello-source/Jarvis-hq/pull/77) | Unita | 12 ott 2026 |
| Decisioni motore 2.14 (A2, 36 giocato, premi per difficoltà, bust B spento). Autorizzato dal proprietario il 12 ott. File di Lucille toccati solo per queste decisioni | **Grok Bot** | `grokbot/engine-decisions` | questa PR | In corso | 12 ott 2026 |
| Motore 2.13, D-09 (titoli e dinastie), misure D-11/D-23, documento D-08 | **Lucille** | `lucille/*` (`lucille/engine-2.13-d09`, `lucille/d11-d23-evidence`, `lucille/d08-bust-design`) | [#66](https://github.com/niccolopello-source/Jarvis-hq/pull/66), [#67](https://github.com/niccolopello-source/Jarvis-hq/pull/67), [#68](https://github.com/niccolopello-source/Jarvis-hq/pull/68) | In corso. File: `engine.ts`, `config.ts`, `tuning.ts`, `world.ts` e relativi test | 11 ott 2026 |
| Premi (awards v2, gate 2.15.0): MVP, ROY, DPOY, All-NBA/All-Star, MIP, 6MOY | **Grok Bot** (eccezione approvata da Pello il 12 ott 2026 sull'area motore di Lucille) | `grokbot/awards-v2` | bozza | In corso. File: `awards-v2.ts` (nuovo), `awards-helpers.ts` (solo `settleRoy`/`settleDpoy`), `league.ts` (solo classe ROY e `buildAwards`/`grantAllStarAwards`), `tuning.ts` (`RULES_215_SINCE`/`AWARDS_SINCE`), `config.ts` (`ENGINE_VERSION` 2.15.0-beta, come #83), `types.ts` (campi opzionali `RoyCandidate`), test e fixture. Non tocca formule fuori dai premi | 12 ott 2026 |
| G3 red team: robustezza save/load, idempotenza decisioni, choice log, test di replay/determinismo e invarianti | **Grok Bot** | `grokbot/g3-redteam` | [#74](https://github.com/niccolopello-source/Jarvis-hq/pull/74) | Unita | 12 ott 2026 |
| G5 release engineering: CI, verifica deploy/provenienza, smoke e integrazione, documenti di readiness (solo test/doc/script; non tocca motore, Career Card, intro) | **Grok Bot** | `grokbot/g5-release-candidate-audit` | [#80](https://github.com/niccolopello-source/Jarvis-hq/pull/80) | Unita. File: `e2e/g5-smoke.spec.ts`, `scripts/prod-smoke.mjs`, `docs/pivot23/RELEASE-CHECKLIST.md`, `DEMO-READINESS.md`, `ISSUE-REGISTER.md` (righe G5), `DEVICE-MANUAL-QA.md` (handoff), questa riga | 12 ott 2026 |
| Lunghezza nome carriera (20 → 32): `CAREER_NAME_MAX`/`careerName` in `presentation.ts`, input setup in `PivotApp.tsx`, `e2e/name-length.spec.ts` | **Grok Bot** | `grokbot/name-length` | [#82](https://github.com/niccolopello-source/Jarvis-hq/pull/82) | In corso. Non tocca motore né formato save | 12 ott 2026 |
| Demo gate: stabilità app, percorso carriera, persistenza, UI responsive, QA browser, release gate | **Lucille** | `lucille/demo-gate-stabilization` | [#75](https://github.com/niccolopello-source/Jarvis-hq/pull/75) | Unita. Il motore resta di Lucille | 12 ott 2026 |
| Persistenza e recovery dei salvataggi (SR-01..03): `save-recovery.test.ts`, `e2e/save-recovery.spec.ts`, funzioni di persistenza in `engine.ts` (nessun gameplay), utility backup/archivio | **Lucille** | `lucille/save-recovery-audit` | [#90](https://github.com/niccolopello-source/Jarvis-hq/pull/90) | In corso (bozza). Non tocca motore, RNG, schema save | 13 ott 2026 |
| Revisione testi IT/EN e glossario (`i18n.ts` IT/EN, valori EN in `narrative/en/*.ts`, test di copy). Nessun testo IT narrativo salvato; voci EN di `legacy.ts` (area Jarvis) segnalate per review | **Lucille** | `lucille/copy-review-it-en` | bozza | In corso | 13 ott 2026 |

---

## Note sui fatti noti

- **Produzione (www.pivot23.com):** HEAD include la #61 (`fix/roy-isolated`), unita l'11 ottobre 2026.
- **Grok Bot** (autore commit `Grok Bot`) è owner verificabile di #62, #63, #64.
- **Grok** (altro agente): ultimo lavoro pubblicato = #61. Eventuale lavoro corrente sulla Career Card **non è su GitHub** → stato **NON VERIFICATO**. Chiedere branch e push frequenti.
- Branch `grokbot/*` usati da Grok il 4–5 ottobre (#45–#57): non confondere il prefisso con l'agente. Usare sempre l'autore del commit.

---

## Aggiornamento di questo file

Chi modifica la tabella apre (o aggiorna) una PR dedicata, oppure include l'aggiornamento nella propria PR di lavoro se tocca solo la propria riga. Merge e «Ready for review» restano decisioni del proprietario del repository.
