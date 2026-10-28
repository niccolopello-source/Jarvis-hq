# PIANO DI UPGRADE — recharts 3 e TypeScript 7 (solo piano)

Data: 2026-10-27 · Base: `main` 58f9071 (engine 2.23.0-beta) · Autore: Jarvis (Grok Bot).
Solo documentazione. Le prove sono state fatte in copie usa-e-getta sul box (`/workspace/upg`, `/workspace/upg-ts`): niente push, niente PR di codice.
Etichette: PASS / FAIL / NOT RUN / VERIFIED / HYPOTHESIS.

## 0. Raccomandazione
1. **Prima PR: recharts 2.15.4 → 3.x.** La prova non trova errori (vedi §1). Rischio basso: c'è un solo componente.
2. **TypeScript 7: aspettare.** Aspettiamo che escano TS 7.1 stabile (previsto per il 24/11/2026) e il supporto ufficiale di typescript-eslint. Si può già fare un pezzo preparatorio sicuro, con TS 5.9 ancora in uso: togliere `baseUrl` da `tsconfig.json` (§2, PR-0).
3. PR separate, in quest'ordine: PR-0 (tsconfig) → PR-1 (recharts 3) → PR-2 (TS 7, dopo il 7.1 stabile).

## 1. recharts 3

### Uso nel nostro codice
| File | Uso |
|---|---|
| `src/components/pivot/CareerChart.tsx` | unico import: `ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Line` (`isAnimationActive={false}`, `connectNulls`, `labelFormatter`, `contentStyle`) |
| `vite.config.ts` | `manualChunks` → `chart-vendor` (recharts e le sue dipendenze) |
| `e2e/chunk-failure.spec.ts:76` | selettore `.recharts-wrapper, .h-44 svg` |
| `src/components/pivot/ui/foundation.test.tsx:60` | controlla che l'HTML non contenga `recharts` o `<svg` |

Cambiamenti di recharts 3 che potrebbero toccarci (fonte: guida ufficiale alla migrazione 3.x, wiki recharts): lo stato interno passa a redux, cambiano le prop di Tooltip e dei formatter, e l'accessibilità è attiva di default. Non usiamo ref, `Customized`, `activeIndex` né lo stato interno, quindi l'impatto atteso sul codice è nullo.

### Breakage misurato (recharts 3.10.1, copia usa-e-getta)
| Controllo | Risultato |
|---|---|
| typecheck (TS 5.9) | PASS, 0 errori |
| lint | PASS |
| unit | PASS, 425/425 |
| build | PASS; `chart-vendor` passa da 381.5 kB / 101.4 kB gz a 353.7 kB / 103.0 kB gz |
| e2e Chromium | PASS, 153 passati, 4 saltati |
| test:stats | NOT RUN: il motore non dipende da recharts |
| WebKit / confronto visivo del grafico e del tooltip | NOT RUN |

### Rischi per salvataggi e determinismo
recharts è solo grafica e viene caricato in modo lazy, fuori dal motore. Le impronte e i test di determinismo fanno parte dei 425 test unitari, che passano. HYPOTHESIS: rischio nullo per salvataggi e motore.

### Stima, accettazione, rollback
- Stima: 0,5–1 giorno, controllo visivo incluso.
- Criteri di accettazione:
  - lint, typecheck, unit, test:stats, build ed e2e (Chromium e WebKit) tutti verdi;
  - le impronte 2.22 e precedenti e quelle 2.23 invariate;
  - screenshot del grafico a fine carriera a 390px e a 1440px, approvati da Lucille o Pello;
  - CSP invariata e nessuna nuova richiesta esterna;
  - aumento del gzip di `chart-vendor` ≤ 5%.
- Rollback: revert della PR (tocca solo `package.json` e lockfile) e redeploy del commit precedente.

## 2. TypeScript 7

### Stato (fonti ufficiali, lette il 2026-10-27)
- TS 7.0 (nativo, in Go) è uscito l'8/7/2026 ma **non ha un'API programmatica**. Microsoft consiglia di affiancarlo a `@typescript/typescript6` per gli strumenti che usano l'API ("Announcing TypeScript 7.0", devblogs).
- **typescript-eslint non supporta TS 7.0.** Il supporto per 7.1 è in sviluppo (PR #12803, ancora aperta e sperimentale).
- Piano di TS 7.1: RC il 10/11/2026, stabile il 24/11/2026 (issue microsoft/TypeScript#63703).
- Toolchain: vite usa la sua trasformazione e non tsc, quindi non è bloccante. **Non usiamo vitest**: i test girano con `node --test` più `tsx`, che non usa tsc per eseguire. Il collo di bottiglia è eslint.

### Cosa ci tocca nel codice
| File | Problema |
|---|---|
| `tsconfig.json` | `baseUrl` è stato rimosso in TS 7 (TS5102), e `paths` deve essere relativo (TS5090). Correzione: togliere `baseUrl` e scrivere `"@/*": ["./src/*"]`. Con TS 5.9 la build passa anche così (VERIFIED). |
| `src/lib/pivot/narrative/extract.ts` | importa l'**API del compilatore** (`import ts from "typescript"`) per l'estrazione statica dei testi IT/EN. TS 7 non ha questa API, quindi si hanno 38 errori di tipo e 2 test falliti. È usato da `narrative.test.ts` e `scripts/i18n-worklist.ts`. |

### Breakage misurato
| Scenario | Risultato |
|---|---|
| TS 7.0.2 in affiancamento (`@typescript/native`), `tsc --noEmit`, tsconfig attuale | FAIL: 2 errori (TS5102, TS5090) |
| Lo stesso, con la correzione al tsconfig | PASS: 0 errori |
| Correzione al tsconfig + TS 5.9: lint, unit, build | PASS (lint 0, unit 425/425, build 0) |
| `typescript` sostituito direttamente con 7.0.2: lint | FAIL: "typescript-eslint does not support TS 7.0" |
| Lo stesso: build (`tsc --noEmit && vite build`) | FAIL: 38 errori, tutti in `narrative/extract.ts` |
| Lo stesso: unit | FAIL: 423/425 (i 2 test di copertura statica della narrativa) |
| e2e, test:stats con TS 7 | NOT RUN |

### Rischi per salvataggi e determinismo
TS non entra nel bundle (i tipi vengono rimossi). HYPOTHESIS: nessun effetto sul motore né sui salvataggi. C'è però un rischio reale per la copertura i18n: se `extract.ts` perde l'API, i controlli sui testi non vanno indeboliti. Bisogna tenere TS 6 come libreria per `extract.ts`, tramite l'alias `@typescript/typescript6`, oppure aspettare l'API di 7.1.

### Piano (quando TS 7.1 è stabile e typescript-eslint lo supporta)
- **PR-0 (si può fare già ora):** togliere `baseUrl` e rendere `paths` relativo. Stima: 1 ora.
- **PR-2:**
  - `typescript` → `npm:@typescript/typescript6` (lo usano eslint ed `extract.ts`);
  - `@typescript/native` → TS 7 per `typecheck` e `build`;
  - più avanti, passare `extract.ts` alla nuova API di 7.1.
  - Stima: 1–2 giorni.
- Criteri di accettazione:
  - 0 errori di tipo;
  - lint con `--max-warnings=0`;
  - unit 425/425, compresi i 2 test di copertura narrativa;
  - test:stats ed e2e verdi;
  - impronte 2.22 e precedenti e 2.23 invariate;
  - bundle identico per contenuto (HYPOTHESIS da verificare).
- Rollback: revert della PR, che tocca solo `package.json`, lockfile e tsconfig.

## 3. Decisioni per Pello
1. Ok a PR-0 (solo tsconfig) e PR-1 (recharts 3) adesso?
2. Ok ad aspettare TS 7.1 stabile e typescript-eslint (fine novembre 2026 o dopo) per PR-2?
