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

## Playoff nel browser — 2026-10-04, notte

Il paragrafo sopra resta. Non è stato riscritto.

Commit e deploy di questa sessione: `f00808941e1cfe601c237679f79a2b354128d6d0`, produzione `dpl_67Cpnh8oVW4BELiMvEuqzbgMK7AZ`, READY, stesso SHA. URL `https://www.pivot23.com`. Asset serviti: `index-D7ntqA-P.js`, `rolldown-runtime-hePW80VL.js`, `react-vendor-CyDUuctK.js`, `narrative-D8IjwUY_.js`. Nessun transfer vuoto tra le risorse della pagina.

Ambiente: Chromium del banco di prova, `www.pivot23.com`, italiano. Console CDP non abilitata in questo runner: nessun boundary di errore, nessun testo di crash, navigazioni 200.

Differenza rispetto al resoconto atteso. In questo profilo `localStorage` aveva solo `pivot23.introSeen`. Nessuna carriera Chicago, nessuna semifinale contro Boston. Il save è locale: non viaggia tra sessioni. Non è stata ripristinata né cancellata una carriera assente. Il motore non è stato modificato.

Carriera nuova, non il save Chicago: nome «Serie», playmaker, Italia, Esordio, NCAA, 13ª scelta Philadelphia 76ers, overall 64, motore `2.12.0-beta`.

| Stagione | Squadra | Record | Playoff |
|---|---|---|---|
| 2026-27 | Philadelphia 76ers | 24-58 | Fuori. 7,9 / 1,8 / 3,6, 79 GP |
| 2027-28 | Philadelphia 76ers | 31-51 | Fuori. 8,5 / 1,8 / 4,2, 77 GP |
| 2028-29 | Philadelphia 76ers | 30-52 | Fuori. 10,0 / 2,0 / 4,6, 77 GP. Poi scambio accettato verso Denver |
| 2029-30 | Denver Nuggets | 59-23, 1° Ovest | Primo turno vinto 4-1 vs Memphis. Semifinale vinta 4-3 vs San Antonio. Finali di conference perse 2-4 vs LA Clippers |

Scelte di serie, non alterate a tavolino: fisico contro Memphis, uno contro uno contro San Antonio, controllo della serie contro i Clippers. Ogni serie si chiude con un click: i risultati gara per gara compaiono insieme. Non è un bug riprodotto, è il comportamento dell'interfaccia.

Refresh con la semifinale aperta: Denver, 2029-30, 4-1 Memphis con le cinque gare e la scelta, avversario San Antonio, le tre scelte ancora da fare. Secondo refresh con le finali di conference aperte: 4-3 San Antonio tenuto, Clippers in attesa, stesse tre scelte. Refresh dopo l'eliminazione: esito `Elim. Finali Est/Ovest 2-4`, offerte Portland, Orlando, Clippers, Memphis ancora sul tavolo. Refresh dopo la firma: Portland, 2030-31, 4 anni a 27,6 milioni, diario del 2-4 ancora visibile.

Premi individuali e di squadra: assenti, e coerenti. `mvpCount` 0, `allStarCount` 0, `titleCount` 0, `roy` false, `awards` della stagione vuoto. 11,6 punti non bastano a un premio. L'assenza non è segnata come bug. La lega assegna premi ad altri nomi (MVP Enzo Marais nel 2026-27 e 2027-28).

Chiusura playoff: corretta, eliminazione in finale di conference, niente finale NBA. Quella finale non è stata percorsa. Free agency: sì, firma Portland. Ritiro: non raggiunto.

Gate playoff browser: PASS sul ramo Ovest di questa carriera, fino all'eliminazione. Non PASS su Boston, non PASS sulla finale NBA. Premi: NOT EARNED, non un fallimento del pannello. Free agency: PASS sulla firma. Ritiro: NOT RUN. Demo: NOT READY.

Prossimo gate: una finale NBA giocata nell'interfaccia, oppure un premio individuale effettivamente vinto e riletto dopo refresh. Safari e telefono restano bloccati. Nessuna modifica al motore in questa sessione.
