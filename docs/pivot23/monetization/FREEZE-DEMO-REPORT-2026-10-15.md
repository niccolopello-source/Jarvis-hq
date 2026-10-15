# Rapporto demo, freeze e monetizzazione / Demo, freeze and monetization report — 2026-10-15
> **BOZZA / DRAFT** — Grok Bot. Nessun merge, deploy o attivazione eseguiti da Grok Bot. No merge, deploy or activation performed by Grok Bot.

## Candidato / Candidate: `e7cc321` (main)
Sequenza main del 2026-10-15 (merged_by `niccolopello-source`; Pello ha confermato in chat di aver unito #97 e #98, Lucille #96):
- 09:06:34Z #97 ads desktop → `9dfe365` (approvato da Pello)
- 09:07:08Z #98 bozze privacy/cookie → `3355a8d` (approvato da Pello)
- 09:09:14Z #96 demo polish → `e7cc321`

## Evidenze / Evidence (separate per ambiente)
| Ambiente | SHA | Comando | Esito |
|---|---|---|---|
| Locale (Linux box, Node 20.19.2) | e7cc321 | `pnpm lint && pnpm typecheck && pnpm test && pnpm test:stats` | **PASS** unit 323/323, stats 12/12 |
| Locale, build prod + `vite preview`, Chromium | e7cc321 | `E2E_PREVIEW=1 E2E_PORT=8311 pnpm exec playwright test --workers=1` | **PASS** 130 passed, 4 skipped (2 ads flag-ON, 2 perf-probe opt-in), 0 failed, 15.8 min. Include DEF-01 `g1-story-reload`, `save-recovery`, `save-safety`, `g3-idempotency`, `intro-sound` (nuovo test #96) |
| Locale, build flag ON con ID segnaposto, host ads bloccati | e7cc321 | `VITE_ADS_ENABLED=true VITE_ADSENSE_CLIENT=ca-pub-0000000000000000 E2E_PREVIEW=1 E2E_PORT=8312 pnpm exec playwright test e2e/ads-desktop.spec.ts --workers=1` | **PASS** 5/5 (phone, tablet 1366, iPad-as-Mac: 0 richieste ads; desktop: solo CMP prima del consenso). Build locale, cancellata dopo il test; nulla in Vercel |
| CI GitHub | 4f5d6ac (#96) | run 38709439148 / 38709433685 | **PASS** |
| CI GitHub | 9dfe365 (main dopo #97) | run 38710513296 | **PASS** |
| CI GitHub | e7cc321 (main) | run 38710846106 | in corso al momento della verifica (09:2x UTC) → vedi PR |
| Produzione www.pivot23.com | e7cc321 | sha256 di ogni file di `dist/` (esclusi .map) vs build locale | **PASS** 18/18 identici; pivot23.vercel.app index identico. (Solo integrità/provenienza tecnica, non autenticità) |
| Produzione, annunci | e7cc321 | grep bundle `googlesyndication|adsbygoogle|doubleclick|fundingchoices|ca-pub-|adBreak` | **PASS** 0 occorrenze; nessun chunk `loader`/`AdRail` |
| Produzione, rete (Playwright) | e7cc321 | Chromium desktop 1440, Pixel 7, tablet 1366 touch; WebKit iPhone 13, desktop 1440 | **PASS** unico host `www.pivot23.com`, 0 richieste ads, unico script `index-dAeexC5A.js` |
| Produzione, file | e7cc321 | `curl` `/ads.txt`, `/privacy`, `/cookie-policy`, `/docs/pivot23/legal/*` | 404 (atteso: nessun ads.txt, bozze legali non pubblicate) |
| Dispositivi reali | — | dichiarazione di Pello in chat 2026-10-14: "funziona su iPhone, Mac e Android" | **NOT VERIFIED** (dichiarato, senza modelli/versioni/SHA; precedente a e7cc321) |
| Preview Vercel | — | — | NOT RUN |

## Revisione #96
Contrasto `.ad-rail` → `var(--color-muted)` (solo CSS); og:image 1200×630 + meta Twitter (`/og-image.png` 200 in prod); source-map-js 1.2.1→1.2.2 solo lockfile; intro-sound: `elapsedMs()` usa `performance.now() - anim.startTime` con fallback, nuovo test sotto carico, asserzioni esistenti invariate. Nessun file in `src/lib/pivot`. Regressioni: nessuna trovata nei test sopra.

## Revisione #97 (ora in main)
Flag OFF di default: `@/ads` risolto su `off.tsx` (solo segnaposto, `adBreakAtSeasonEnd` sincrono). Nessun file motore/salvataggio modificato. CSP di produzione invariata (`script-src 'self'`). Nota: con flag ON la CMP si carica prima del consenso (necessario), `adsbygoogle.js` solo dopo Purpose 1.

## DEF-01 e salvataggi incoerenti
DEF-01 (decisione applicata una volta dopo reload): e2e `g1-story-reload` PASS su e7cc321 (Chromium locale). Salvataggi: unit `save-recovery.test.ts` (SR-C1…C12, SR-01…03: corrotti copiati byte per byte, mai sovrascritti, backup precedente spostato) PASS; e2e `save-recovery`/`save-safety` PASS. Diff 21764f3→e7cc321 su questi test: solo rinomina etichetta "Riprendi la vita"→"Riprendi la carriera" (copy #93), nessuna asserzione indebolita. Safari reale: NOT VERIFIED.

## Limiti noti
- G7 dispositivi reali: solo dichiarazione di Pello (NOT VERIFIED).
- P3 WebKit: il grafico non si ricarica con "Riprova" dopo errore chunk; ricaricare la pagina risolve (da report prod-e2e precedente).
- Percorso errore quota su Safari: NOT VERIFIED.
- CI di main e7cc321: in corso al momento del rapporto.

## Decisione proposta
**CONDITIONALLY READY.** Proposta di freeze su `e7cc321` il 17/10 quando: (1) CI main e7cc321 verde; (2) Pello ripete la checklist `QA-EXECUTION-PLAN.md` su e7cc321 annotando modello/OS/browser. Niente altro in main fino al 18/10 salvo fix bloccanti approvati.
