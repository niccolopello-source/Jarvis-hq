# G3 — Red team: integrità dati, save/load, idempotenza, replay

**Branch:** `grokbot/g3-redteam` · **Base:** `main` @ `f7ca03d8` · **Data:** 12 ottobre 2026 · **Owner:** Grok Bot

## Regola sul checksum (vale per ogni decisione commerciale)

Il campo `c` del save è uno SHA-256 troncato del payload, calcolato e verificato **nel browser**.
Serve solo a riconoscere una corruzione accidentale (scrittura troncata, byte cambiati).
Chiunque può modificare il save e ricalcolarlo: il test `M11` lo dimostra (titoli portati a 11, save aperto).
Nessun dato locale, checksum compreso, è una prova valida per NFT, premi, classifiche o benefici commerciali.
Per quelli servono un replay lato server (seed + scelte) e una firma del server. Il fingerprint della Career Card ha lo stesso limite.

## Matrice avversaria (test in `src/lib/pivot/g3-redteam.test.ts`, salvo dove indicato)

| # | Caso | Comportamento atteso | Esito |
|---|------|----------------------|-------|
| M01 | JSON malformato | Rifiuto (`corrupt`), originale lasciato e copiato in backup | PASS |
| M02 | Campo obbligatorio mancante | Rifiuto, originale tenuto | PASS |
| M03 | Tipo errato / fuori intervallo | Tipo errato: rifiuto. Fuori intervallo con checksum ricalcolato: **accettato** (limite G3-F04) | PASS (limite documentato) |
| M04 | Array enormi / annidamento profondo | 50.000 scelte: caricato e ridotto a 80 senza blocchi. 100.000 livelli di annidamento: nessuna eccezione, save rifiutato e tenuto | PASS |
| M05 | Id duplicati in archivio | Una sola voce per id, vince la prima memorizzata | PASS |
| M06 | Save live che dichiara una schermata finale | Rifiuto, tenuto | PASS |
| M07 | Carriera conclusa con età della carta incoerente | La carta segue l'ultima stagione registrata | PASS |
| M08 | Versione save più vecchia senza migrazione | `incompatible`, tenuto e copiato in backup | PASS |
| M09 | Versione save più recente | `future`, mai cancellato né riscritto | PASS |
| M10 | Archivio con `archiveSchema` futuro | **Bug G3-B02, corretto:** nascosto, mai marcato come corrente, conservato byte per byte a ogni scrittura | PASS dopo il fix |
| M11 | Checksum mancante/errato/ricalcolato | Mancante o errato: rifiuto. Ricalcolato: accettato (limite) | PASS (limite documentato) |
| M12 | Storage assente o in sola lettura | Nessun crash, salvataggio dichiarato fallito, copia in memoria per la scheda | PASS |
| M13 | Quota esaurita durante la scrittura | Ultimo save buono intatto, nuovo tentativo riuscito una volta sola | PASS |
| M14 | Scrittura interrotta (locale troncato) | Apre la copia di sessione, il troncato resta in backup | PASS |
| M15 | Archivio con una voce corrotta su cinque | Le altre si aprono, l'originale finisce in backup prima della scrittura | PASS |
| M16 | Reload durante una decisione | Storia: E2E `g3-idempotency.spec.ts`. Playoff e mercato: già coperti dalla #72 (Lucille) | PASS (storia) / vedi #72 |
| M17 | Stessa operazione ripetuta dopo un errore | Archivio ×3: una voce. Save dopo quota: una scrittura | PASS |
| M18 | Save legacy senza campi opzionali | Si apre con valori di default (`careerId`, `rngState`, `logSeq`, `tab`) | PASS |

## Bug

| ID | Sev | Riproduzione | Causa | Fix | Test |
|----|-----|--------------|-------|-----|------|
| G3-B01 | P1 | Scelta di storia con Invio, poi Invio/Spazio dopo 750 ms: la scelta viene applicata due volte (scelta duplicata nel choice log, overall +3 poi +1) | Durante la pausa i bottoni sono solo `pointer-events:none`; la tastiera li attiva ancora e `takeGesture` blocca solo 600 ms | `takeGesture` rifiuta ogni decisione finché è attiva una pausa (`holdTimer`) | E2E `keyboard on a held … story choice` (fallisce prima, passa dopo) |
| G3-B02 | P1 | Archivio con `archiveSchema: 3`: `loadArchive` lo restituisce marcato `2`; il `saveArchive` successivo lo riscrive come `2` | `normalizeArchiveEntry` imponeva `ARCHIVE_SCHEMA` senza leggere quello ricevuto | `archiveEntrySchema()` distingue current/legacy/future/invalid; le voci future non vengono mostrate, sono riportate invariate in ogni scrittura e copiate una volta in `pivot-v2-archive-backup` | `M10` ×4 (falliscono prima, passano dopo) |
| G3-F03 | P3 | Replay con reload a ogni stagione: `championLog` 16 contro 19 | `compactPlayer` tiene gli ultimi 16 campioni di lega | Nessuno (cambierebbe il formato). Esiti sportivi identici | Replay (confronta la coda) |
| G3-F04 | P2 | Save modificato con checksum ricalcolato si apre | Checksum locale, per costruzione | Nessuno: è un limite, documentato sopra | `M03`, `M11` |

## Verificato senza difetti

- Scambio forzato pre-stagione: squadra e contratto aggiornati, una sola riga nel choice log, nessun duplicato dopo 3 reload, presente nell'archivio. Il caso storico «scambio forzato assente dal choice log» **non si riproduce** su `f7ca03d8`.
- Doppio/triplo click su ogni round del draft (E2E, stessa carriera salvata): un round per click, stato finale identico al percorso a click singoli.
- Replay attraverso la catena reale (`saveLive` → storage → `loadLive`) a ogni stagione, 8 seed: stagioni, premi, playoff, scelte, eventi, contratto identici.
- Invarianti su 40 carriere: nessuna stagione doppia, età monotona, contratto = squadra, titoli = stagioni vinte, età finale della carta = ultima stagione.
- `Math.random` assente dal gameplay (test esistente `rng-determinism`); il seed nasce da `crypto.getRandomValues`.

## Misure sintetiche (Node, non dispositivo)

Stampate dal test `synthetic benchmark`: carriera completa ~140.000 caratteri, scrittura ~5 ms, parse+validazione ~5 ms, archivio da 8 carriere ~230.000 caratteri caricato in ~5 ms. Non sono misure su telefono.

## Limiti per la Demo e per il futuro commerciale

- Per una Demo gratuita e locale G3-F03/F04 sono accettabili.
- Per qualsiasi monetizzazione sono bloccanti: serve validazione lato server, non il checksum.
- I valori numerici non hanno controlli di intervallo al caricamento: un save corrotto in modo coerente (checksum ricalcolato) passa.
