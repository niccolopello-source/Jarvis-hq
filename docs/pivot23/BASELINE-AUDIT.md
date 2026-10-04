# BASELINE AUDIT — 2026-10-04

Sessione di verifica sullo stato reale. Non è un verdetto di lancio.

## Commit e branch

- Repository: `niccolopello-source/Jarvis-hq` (pubblico). Unico repo dell'account.
- Branch di produzione: `main`.
- Commit analizzato: `fde5b74a4f905b93bbe0600d3c1c38aeebfc5626` (2026-10-04 15:24 +0200).
- Messaggio: Merge pull request #44 `feat(ui): il marchio PIVOT 23 al posto del globo`.
- Deployment produzione Vercel: `dpl_6R6u2V5s34kyMoxt4v9NYQ4B1WxM`, stato READY, stesso SHA.
- URL: `https://www.pivot23.com` (canonico), `https://pivot23.com` redirect 308, `https://pivot23.vercel.app` alias tecnico.
- I file HTML in `/workspace/artifacts` (`pivot.html`, `2.html`) sono prototipi del 19 settembre. Non sono il codice attivo.

## Stack effettivo

- App: `apps/pivot23`. React 19, Vite 8, TypeScript, Tailwind 4.
- Engine: `src/lib/pivot/engine.ts` (~3.300 righe) più `league.ts`, `tuning.ts`, `save.ts`, `rng.ts`, `peak.ts`.
- Persistenza: `localStorage` chiave `pivot-v2-save`, checksum SHA-256 troncato, `LIVE_SAVE_VERSION` 2. Nessun IndexedDB, nessun worker, nessun backend.
- CI: `.github/workflows/pivot23.yml` — lint, typecheck, unit, build, e2e su preview, job statistico notturno.
- Account, ads, analytics di prodotto: spenti. Vedi `SERVICES-EVAL-2026-10-04.md`.

## Presente, incompleto, assente

| Sistema | Stato sul commit |
|---|---|
| Creazione giocatore, draft, stagione, playoff, mercato, premi, nazionale, ritiro | Presenti in `engine.ts` |
| Salvataggio locale e archivio | Presenti, con test |
| Determinismo seed | Presente (`determinism.test.ts`) |
| Lab headless riusabile | Assente prima di questa sessione. `scripts/balance-sim.ts` esiste ma non è in CI |
| Intro cinematografica a due palleggi sincronizzata sull'audio | Assente. C'è un curtain di boot (`src/intro.ts`) e un synth (`src/intro-sound`) |
| `robots.txt` / sitemap / canonical | Assenti in produzione al momento della verifica |
| Account obbligatorio e cloud save | Non implementati. Architettura solo documentata |
| Pay-to-win, NFT, token | Flag spenti |

## Test

- Eseguiti in questa sessione: lab deterministico a 3 seed e tabella ruoli a 5 carriere, dopo l'aggiunta del runner. Vedi `ENGINE-VALIDATION.md`.
- Non eseguiti qui: suite unitaria completa, `test:stats`, Playwright, Lighthouse, dispositivi reali. Un test non eseguito non è un test superato.
- CI sull'ultimo merge non è stata ri-letta come run verde in questa sessione. Il deployment è READY, non è una prova dei test.

## Rischi

- P0: nessuno riprodotto in questa sessione. Lo schermo nero storico resta non riprodotto (`DEMO-READINESS-REPORT.md`).
- P1: marchi NBA nel mondo simulato, non verificati per uso commerciale.
- P1: P1-BUST, P1-WORLD, P1-ROLE aperti in `docs/memory/TASKS.md`. Non ritarati.
- P2: intro non allineata alla direzione visiva approvata nel mandato del 4 ottobre.
- P2: `robots.txt` 404 in produzione finché la PR non viene mergiata e deployata.
- P3: prototipi HTML nel workspace di progetto, facili da confondere col prodotto.

## Rollback

La PR di questa sessione è additiva: lab, test, `robots.txt`, `sitemap.xml`, canonical/Open Graph, documenti. Nessuna costante di `TUNING` è stata toccata. Rollback = chiudere la PR senza merge.
