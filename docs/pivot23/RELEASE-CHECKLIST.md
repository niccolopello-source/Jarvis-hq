# PIVOT 23 — Release checklist (Demo)

Owner: Grok Bot (release engineering, G5). Ogni riga va compilata sullo **SHA esatto** del candidato. Un PASS senza SHA, comando ed evidenza non vale. Pending / in_progress non è PASS.

## 1. Provenienza
- [ ] SHA di `main` (`git rev-parse origin/main`).
- [ ] Run GitHub Actions «PIVOT 23 beta» su quello SHA: `completed / success`, entrambi i job (`verify`, `engine-stats`).
- [ ] GitHub Deployment «Production – pivot23» su quello SHA: stato `success` (`gh api repos/<repo>/deployments?sha=<SHA>` + `/statuses`).
- [ ] `index.html` di www.pivot23.com e pivot23.vercel.app identici; asset `/assets/*` byte-identici (sha256) a `dist/` di una build locale dello stesso SHA.
- [ ] Header di sicurezza in produzione (CSP, HSTS, X-Frame-Options DENY, Referrer-Policy) = `vercel.json`.

## 2. Gate automatici (in `apps/pivot23`, stessi script della CI)
`pnpm install --frozen-lockfile` → `pnpm run lint` → `pnpm run typecheck` → `pnpm run test` → `pnpm run build` → `pnpm run check:headers` → `CI=true E2E_PORT=<libera> pnpm run test:e2e:preview` → `pnpm run test:stats`.
Registrare exit code e conteggi (pass/fail/skip). I 2 skip attesi sono le sonde `perf-probe` (solo `PERF=1`). Nessun test disattivato o indebolito.

## 3. Smoke nel browser (build di produzione, Chromium headless)
`G5_SHOTS=<dir> E2E_PREVIEW=1 E2E_PORT=<n> npx playwright test e2e/g5-smoke.spec.ts --repeat-each=3`
Percorso giocato davvero, senza save pre-generato: home → setup con nome lungo (troncato a 20 dal campo) → draft completo → percorso NCAA → palestra → doppio click sulla prima scelta (≤1 voce di diario) → stagioni → refresh + «Riprendi la vita» (stessa stagione, stesso nome) → ritiro → Legacy Report + Career Card → Archivio → reload → riapertura. Zero errori console / pageerror.
Playoff, mercato, infortunio, premi, free agency: coperti in modo deterministico da `e2e/paths.spec.ts` (fixture `make-path-saves.ts`, seed 4200/4201) e `demo-gate.spec.ts`; lo smoke casuale li raggiunge solo a volte.

## 4. Smoke di produzione (solo lettura)
`node scripts/prod-smoke.mjs https://www.pivot23.com <dir>` e lo stesso su `https://pivot23.vercel.app`: 200, «Inizia» visibile, setup raggiunto, nessun errore console, nessuna richiesta fallita.

## 5. Prestazioni (lab, non dispositivo reale)
- Bundle iniziale gzip (index.html + modulepreload + CSS) ≤ 350 kB, dal log di `pnpm build`.
- `PERF=1 E2E_PREVIEW=1 npx playwright test e2e/perf-probe.spec.ts` (CPU 4×, 390×844).
- `node --import=tsx scripts/season-timing.ts` (stagione ≤ 1,2 s).

## 6. Resilienza (già nella suite)
JSON malformato, campi mancanti, versione futura, archivio a schema futuro, storage assente/sola lettura, quota piena: `g3-redteam.test.ts` (M01–M18), `save-safety.spec.ts`. Reload a metà decisione, doppia attivazione: `g3-idempotency.spec.ts`, `input-lock.spec.ts`, `demo-gate.spec.ts`. Flush su pagehide: `lifecycle-flush.spec.ts`.

## 7. Dispositivi reali — gate separato
`DEVICE-MANUAL-QA.md`. Senza un'esecuzione fisica il gate resta **BLOCKED**; i viewport emulati non lo sostituiscono.

## 8. Decisione
Merge, «Ready for review» e deploy sono decisioni di Pello. Demo pubblica: **NOT READY** finché un punto obbligatorio è FAIL, BLOCKED o NOT VERIFIED. Il checksum locale rileva corruzioni accidentali, non prova l'autenticità: nessuna classifica, premio o transazione su dati locali.
