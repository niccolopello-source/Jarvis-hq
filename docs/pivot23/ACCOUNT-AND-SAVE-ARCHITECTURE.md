# Account e salvataggi

Stato: proposta, 2026-10-03. Nessun account reale. Nessun database. Il salvataggio attuale non cambia.

Fonte verificata: [save.ts](../../apps/pivot23/src/lib/pivot/save.ts), [flags.ts](../../apps/pivot23/src/lib/pivot/flags.ts), [PHASE2-COMMERCIAL-DESIGN.md](PHASE2-COMMERCIAL-DESIGN.md).

## Cosa c'è oggi

| Pezzo | Fatto |
|---|---|
| Chiave viva | `pivot-v2-save` |
| Archivio | `pivot-v2-archive` |
| Cortesia | `pivot-v2-swipe`, `pivot-v2-hint` |
| Versione viva | `LIVE_SAVE_VERSION` 2. Una versione diversa si scarta. Non c'è migrazione a metà carriera |
| Versione motore | `SAVE_VERSION` 11 in `config.ts`. Non è la versione della chiave cloud |
| Identità | `careerId` è un UUID, oppure un ripiego con l'orario. Non è il seed di simulazione |
| Integrità | checksum SHA-256 troncato sul payload. È un controllo locale. Non è anti-cheat e non prova che la carriera sia vera |
| Rete | non serve per salvare |
| Account | `FLAGS.account` è `false` |

Ipotesi, non verificata in questo passaggio: il contenuto del payload include lo stato del giocatore, la carta in attesa, il giornale e la schermata. Non va copiato su un server finché un account non esiste e l'utente non lo chiede.

## Principio

L'ospite resta il percorso normale. Registrarsi è un gesto dopo, non una porta. Se il modulo account è assente, spento, offline o in errore, `saveLive` continua a scrivere nel browser.

## Modello proposto, non migrato

Non è uno schema da scrivere nel salvataggio v2.

Account, solo dopo un'azione esplicita:

- id interno opaco
- email
- password solo come hash, mai in chiaro e mai nel client oltre il momento dell'invio
- creazione e cancellazione
- niente data di nascita, niente genere, niente posizione

Sessione:

- id opaco, scadenza, revoca
- il logout non cancella `pivot-v2-save`

Carriera cloud, copia del payload più:

- `careerId` già presente
- id account
- `LIVE_SAVE_VERSION` e `SAVE_VERSION` letti, non ricalcolati dal server per cambiare il gioco
- istante di scrittura
- checksum locale, solo per accorgersi che i byte sono cambiati

Il server non ricalcola overall. Non applica `TOKEN_COSTS`. Non tiene prezzo, rarità o diritto sportivo dentro `PlayerState`.

Consenso, tabella separata. Un rifiuto è un valore, non un campo mancante.

## Migrazione

Le carriere ospite già sul telefono restano dove sono. Non si spostano da sole.

1. Si gioca e si salva come oggi.
2. Se l'utente crea un account, si mostra l'elenco delle carriere locali, con nome e stagione, non con l'intero JSON in chiaro nella lista.
3. L'utente segna quali copiare. Senza quel segno non parte nessuna copia.
4. Se il cloud ha già lo stesso `careerId`, non si sovrascrive. Si chiede quale tenere. L'altra resta finché non viene scartata.
5. Il logout ferma le copie nuove. Il file locale resta.
6. Un secondo dispositivo scarica solo le copie già scelte. Un salvataggio locale diverso non si cancella senza una domanda.
7. La cancellazione account toglie sessioni, copie cloud e consensi. Il file nel browser resta finché l'utente non cancella i dati del sito. La schermata deve dirlo.
8. L'export è un file che l'utente può leggere prima della cancellazione.

Reversibile per quanto riguarda il telefono: la copia cloud è aggiuntiva. Non è reversibile una cancellazione account già eseguita. Quella va detta prima del pulsante.

`LIVE_SAVE_VERSION` diversa da 2 non si manda al cloud e non si converte in silenzio. Si mostra che quella carriera non è leggibile, come già fa il caricamento locale.

## Conflitti

| Caso | Comportamento proposto |
|---|---|
| Solo locale | si gioca. Nessun account |
| Locale più nuovo, stesso id, cloud fermo | si chiede. Non si fonde |
| Cloud più nuovo, locale assente | si può scaricare, dopo il login |
| Due carriere diverse, due id | restano due righe d'archivio |
| Checksum diverso, stesso id | è un conflitto, non una prova di frode |
| Scrittura cloud fallita | il salvataggio locale, se riuscito, resta quello vero. Si dice che la copia non è partita |

## Moduli, solo contratti

Nomi adatti a React, senza pacchetti nuovi.

- `AccountProvider`: sessione o assente. Il gioco legge «c'è un account?» e niente altro.
- `SaveSyncProvider`: copia su richiesta. Se manca, `saveLive` non lo chiama.
- Nessuno dei due importa il motore per cambiare un tiro, un draft o un premio.

## Cosa non si fa in questa fase

Niente login vero, niente database utenti, niente invio del payload, niente cambio di `SAVE_VERSION` o `LIVE_SAVE_VERSION`.
