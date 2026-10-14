# LOC AUDIT B — IT/EN — 2026-10-13

Sorgente: main `ae9f1d0` (ENGINE_VERSION 2.19.0-beta). PR ispezionate: #93 (draft, head `8d7de04`, copy review), #92 (draft, docs Bot 2, nessun file di testo).
Ramo follow-up: `lucille/loc-followup` (da `ae9f1d0`), solo valori EN in file NON toccati da #93 + test.

## 1. Architettura
- Chrome UI: `src/lib/pivot/i18n.ts` (it/en/es; `DEMO_LANGS = ["it","en"]`, ES non selezionabile). Descrizioni difficoltà in UI: `difficultyFace` in i18n.ts (non `narrative/en/difficulty.ts`).
- Narrativa: sorgente italiana nei moduli engine (`story-*.ts`, `feel.ts`, `summer.ts`, `league.ts`, …); EN in `narrative/en/*.ts` con **chiave = testo IT normalizzato** (`narrative/key.ts`), testo IT salvato nei save → `legacy-it.ts`. Cambiare l'IT narrativo = cambiare chiavi + migrazione: **escalation owner**.
- Componenti: nessun aria-label/title/placeholder letterale (tutto via `t()`; `i18n-coverage.test.ts`).

## 2. Verifica PR #93 (diff reale, non descrizione)
| Voce | Verifica sul codice | Esito |
|---|---|---|
| raceMvpCap 65 (58 pre-2.15) + All-Star | `league.ts` mvpPlayer: `All-Star && gp >= (v2?AWARD_MIN_GAMES:58)` | CORRETTO |
| raceNbaCap 3 quintetti | awards v2 First/Second/Third | CORRETTO |
| raceMipCap "già stella non può vincerlo" | `alreadyStar` = All-NBA 1st, MVP o OVR≥88 | CORRETTO; omette che conta anche il salto di PER (P3) |
| dpoyCap DWS | `awards-helpers.ts` dws | CORRETTO; ma la nota premio IT resta "vittorie difensive" (L-07) |
| guide1Body 10 round, 1 su 3 | DRAFT_ROUNDS 8 + CHARACTER 2 = 10; 4 carte, mano 3 (`draftHand`) | CORRETTO |
| guide4Body "riparti esatto dalla stessa carta" | `startNewLife` → setup, seed nuovo; il salvataggio live riprende dal punto | **ANCORA FUORVIANTE** (L-01, P1) |
| retireSub/play36 | `retirement: "play36"` | CORRETTO |
| 131 EN narrativa (campione ~70) | senso coerente; nessun placeholder rotto (3994 voci, 1 eccezione voluta) | OK con P2 residui (L-05, L-06) |
| legacy.ts 3 righe | "craft"→"game/career", {0} preservato | OK (area Jarvis) |
| S02 "porte dei playoff" | `playoff-doors.ts`/`doorLine`: scelte playoff per turno | RISOLTO: = scelte dei playoff |
| S07 "possessi della difesa" | pr11 fx: defense+0.7, iq+0.5, workEthic; "a volume basso" | RISOLTO: video difensivo → EN "You ask for the defensive film" |
| S08 "Una resta fuori" | 4 carte per round, mano 3 | RISOLTO: la 4ª carta non viene servita |
| Spagnolo | #93 corregge IT/EN, ES resta con "58 partite", "oficio" ecc. | rischio residuo solo se ES torna attivo (fuori scope) |

## 3. Finding
| ID | Sev | Categoria | Location | Original | Proposed IT | Proposed EN | Evidence | Test | #93 overlap |
|---|---|---|---|---|---|---|---|---|---|
| L-01 | P1 | COPY/GAMEPLAY MISMATCH | i18n.ts guide4Body | "Una vita alla volta. Se chiudi, riparti esatto dalla stessa carta." / "...start again from the same card." | "Una carriera alla volta. Se chiudi la pagina, riprendi esattamente da dove eri." | "One career at a time. Close the page and you pick up exactly where you left off." | startNewLife = seed nuovo; resume dal live save | i18n.test regressione | SÌ → patch plan, owner |
| L-02 | P2 | TERMINOLOGY | i18n.ts difficultyFace esordio/leggenda desc (EN) | "a more open playoff. For learning the job." / "Injuries, and a playoff that is a fight. Only the rare ones stay standing." | invariato | "Generous growth, rare injuries, more open playoffs. Made for learning the game." / "Injuries pile up and the playoffs are a war. Only the special ones survive." | testo mostrato in setup | i18n.test | SÌ (i18n.ts) |
| L-03 | P2 | TRANSLATION | narrative/en/league.ts ×2 | "with the wrong possessions in your head" | invariato (chiave) | "replaying the bad possessions in your head" | eliminazione playoff | narrative.test | NO → **applicato** |
| L-04 | P2 | TERMINOLOGY | narrative/en/awards-helpers.ts MIP/ROY note | "the jump on last year" / "games, first year" | invariato | "the jump from last season" / "games, rookie season" | note premi | narrative.test | NO → **applicato** |
| L-05 | P2 | TERMINOLOGY (US EN) | en/summer.ts, story-late.ts, story-feel.ts (≈12 righe) | "Fewer kilos", "A summer of degrees, not kilos" | invariato | "pounds"/"weight", "A summer of mobility, not weight" (feel.ts usa già "pounds") | incoerenza interna | narrative.test | SÌ |
| L-06 | P2 | TRANSLATION | en/story-extra.ts:43,175 (S07) | "You ask for the defensive possessions" / "the bad possessions" | invariato | "You ask for the defensive film" / "You ask for the bad clips, nothing else" | pr11 fx defense+iq, sala video | narrative.test | SÌ |
| L-07 | P2 | TERMINOLOGY | awards-helpers.ts IT nota DPOY | "{2} vittorie difensive" | "{2} defensive win shares" (o "DWS") | già OK | contraddice dpoyCap di #93 | test chiave+legacy-it | NO, ma IT narrativo salvato → **owner + migrazione** |
| L-08 | P3 | PLACEHOLDER | en/PivotApp.ts contratto rookie | IT {2} {3}; EN {2} {2\|year\|years} | — | — | voluto (plurale); ora documentato in test | test aggiunto | NO |
| L-09 | P3 | PLACEHOLDER | en/PivotApp.ts "{1} years" | "Resti a {0}: {1} anni" | ok | "{1} {1\|year\|years}" | contratti engine 2–5 anni → oggi mai 1 | — | NO |
| L-10 | P3 | NARRATIVE | en/league.ts | "{SCORE} in seven, or fewer." | — | "{SCORE}, however many games it took." | stile | — | NO (non applicato, gusto) |
| L-11 | DESIGN DECISION REQUIRED | COPY/GAMEPLAY | data.ts an6 "Chiudi tutto e dormi / Recupero prima della luce." | fx: iq+0.35, shooting+0.2, consistency, form | — | — | dormire dà tiro; testo non lo promette ma sorprende | — | NO, owner |
| L-12 | P3 | GRAMMAR | en/league.ts | "{OPP} was more ready tonight" | — | "was readier tonight" | — | — | NO → applicato |

Verifica copy/gameplay sistematica: 262 scelte (STORY_POOL + OFFSEASON_FOCUSES) e 12 scelte playoff confrontate con `fx`: **nessun caso "difesa promessa ma cambia velocità/resistenza"**; tutte le scelte difensive alzano `defense`. Unico caso dubbio L-11.

Conteggi: P0 0 · P1 1 · P2 6 · P3 4 · DESIGN DECISION 1.

## 4. Test
Eseguiti su `lucille/loc-followup`: `pnpm typecheck` OK · `pnpm lint` OK · `pnpm test` 308/308 (+2 nuovi) · `pnpm test:stats` 12/12 · `E2E_PORT=8193 npx playwright test e2e/a11y-i18n.spec.ts e2e/g5-smoke.spec.ts --workers=1` 5/5 · fingerprint 400 carriere (4 diff × seed 91000+13i) main vs ramo: identici (`3313f58d…`).
Non eseguiti: WebKit/Firefox, dispositivi reali, layout mobile per stringhe lunghe, suite e2e completa.

## 5. File non toccati per overlap con #93
i18n.ts, en/{feel,story-feel,story-late,story-extra,summer,legacy,playoff-doors,engine,data,teams,voice,world}.ts, e2e/*. `en/difficulty.ts` volutamente non modificato (non è la fonte UI; duplicato di difficultyFace).
