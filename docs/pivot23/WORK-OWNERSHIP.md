# PIVOT 23 — Registro di chi lavora su cosa

**Ultimo aggiornamento:** 11 ottobre 2026  
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
| Accessibilità e UI (CSS a11y, layout stretto, focus, contrasto, e2e readiness) | **Grok Bot** | `grokbot/a11y-ui-recovery` | [#62](https://github.com/niccolopello-source/Jarvis-hq/pull/62) | Bozza, CI verde | 11 ott 2026 |
| QA indipendente della #61 (solo test: fingerprint, seed 29930, golden) | **Grok Bot** | `grokbot/pr61-qa` | [#63](https://github.com/niccolopello-source/Jarvis-hq/pull/63) | Bozza | 11 ott 2026 |
| Copy / i18n (correzioni a render-time: accordo squadre EN, slot traduzione, grammatica) | **Grok Bot** | `grokbot/copy-review` | [#64](https://github.com/niccolopello-source/Jarvis-hq/pull/64) | Bozza | 11 ott 2026 |
| Career Legacy Report / Career Card (Bible §5, Blocco D) | **Grok** (assegnato dalla Bible) | *non pubblicato* | — | **NON VERIFICATO** — ultimo lavoro noto: `fix/roy-isolated` (#61, unita 11 ott); prima: `grok/demo-gate/*` (#58–#60, persistenza) | 11 ott 2026 |
| Intro / visual (Bible Blocco E — Frontend/Art) | **Da assegnare** (Frontend / Art per Bible) | — | — | Libero / da assegnare. Nota: l'intro con pallone è stata sostituita dal logo (#56); i suoni vanno riallineati alla versione finale. | 11 ott 2026 |
| Motore / bilanciamento (oltre le PR già unite) | — | — | — | Libero. Non avviare lavoro parallelo senza aggiornare questa tabella. | 11 ott 2026 |
| Demo gate: stabilità app, percorso carriera, persistenza, UI responsive, QA browser, release gate (solo test/doc finché non emerge un bug riproducibile; non tocca motore né Career Card/Legacy Report/temi di Jarvis) | **Lucille** (Grok Bot, worker demo-gate) | `lucille/demo-gate-stabilization` | (questa PR) | Bozza | 11 ott 2026 |

---

## Note sui fatti noti

- **Produzione (www.pivot23.com):** HEAD include la #61 (`fix/roy-isolated`), unita l'11 ottobre 2026.
- **Grok Bot** (autore commit `Grok Bot`) è owner verificabile di #62, #63, #64.
- **Grok** (altro agente): ultimo lavoro pubblicato = #61. Eventuale lavoro corrente sulla Career Card **non è su GitHub** → stato **NON VERIFICATO**. Chiedere branch e push frequenti.
- Branch `grokbot/*` usati da Grok il 4–5 ottobre (#45–#57): non confondere il prefisso con l'agente. Usare sempre l'autore del commit.

---

## Aggiornamento di questo file

Chi modifica la tabella apre (o aggiorna) una PR dedicata, oppure include l'aggiornamento nella propria PR di lavoro se tocca solo la propria riga. Merge e «Ready for review» restano decisioni del proprietario del repository.
