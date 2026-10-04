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


## Serie playoff nel browser — 2026-10-04, sera

Stesso deploy `ee352e3`, `dpl_HLAgmnbo6b5Hdx5JZqYkCxtLyzjo`. Chromium headless, 800×600. La carriera «Playoff» è arrivata al 2029-30: Chicago Bulls 55-27, 4° Est, 14.0/2.5/5.6, 82 GP, overall 77.

Primo turno contro New York Knicks. Scelta «Alza il muro, ogni uscita». Risultato 4-3, gare 116-103, 108-109, 112-116, 98-109, 114-113, 112-109, 102-89. Il refresh a serie aperta ha ripristinato Chicago, turno 0, avversario NYK e le tre scelte. Dopo la serie il pending è round 1, Boston Celtics. Errori catturati: nessuno.

Gate serie browser: PASS su questo percorso. Semifinale non completata. Premi ancora vuoti. Ritiro non raggiunto. Demo: NOT READY.
