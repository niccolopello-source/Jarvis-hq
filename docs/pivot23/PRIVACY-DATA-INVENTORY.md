# Inventario dati

Stato: inventario di progetto, 2026-10-03. Non è un parere legale. Non è un'informativa. Un banner non chiude gli obblighi.

Pubblico considerato: Unione Europea, e un pubblico che può includere minori. L'età di chi gioca non è stata misurata. Non si assume che siano tutti adulti.

## Flussi reali, oggi

| Flusso | Dati | Perché | Dove | Per quanto | Chi | Fornitori | Cancellazione | Aperto |
|---|---|---|---|---|---|---|---|---|
| Partita ospite | stato carriera, nome scelto nel gioco, squadre, giornale | riprendere la partita chiesta | `localStorage`, ripiego `sessionStorage` | finché il browser li tiene | solo quel browser | l'hosting della pagina statica può vedere la richiesta del file JS, non il salvataggio | cancellare i dati del sito | se l'hosting scrive log delle richieste. NOT VERIFIED in questo repo |
| Archivio locale | carriere concluse | rileggerle | `pivot-v2-archive` | come sopra | solo quel browser | nessuno sul contenuto | come sopra | no |
| Preferenza lingua e gesto | lingua, scheda, hint | non rifare la stessa domanda | chiavi locali | come sopra | solo quel browser | no | come sopra | no |
| Hosting della demo | IP e user agent, se il fornitore li registra | consegnare i file | fuori dal repo | politica del fornitore | il fornitore | l'host già usato. Il nome del piano non è in questo file | chiedere al fornitore | la fattura e i log. NOT VERIFIED |

Il checksum e il seed stanno nel salvataggio. Non escono.

## Flussi proposti, spenti

| Flusso | Dati | Perché | Dove | Durata | Accesso | Fornitori | Uscita | Prima del codice |
|---|---|---|---|---|---|---|---|---|
| Account | email, hash password, id | recupero, non per giocare | database futuro, non creato | finché l'account vive, poi i backup alla loro scadenza | chi opera il servizio | posta, solo se serve la verifica | export, poi cancellazione | testo legale, luogo dei dati |
| Copia cloud | payload di gioco più id | secondo dispositivo | stesso database | come l'account | lo stesso, senza il testo nei log | hosting del database | si cancella con l'account. Il file sul telefono no | prova di non perdita |
| Analytics di prodotto | eventi della specifica | contare, non riconoscere | da decidere. Non un terzo di default | da scrivere prima dell'accensione | ruolo interno | nessuno, finché non si sceglie | si smette e si cancella il magazzino | consenso, minimizzazione |
| Diagnostica remota | codice errore | sbloccare un guasto | separata dal profilo | più corta del magazzino di prodotto | chi corregge | nessuno all'inizio | niente stack con il nome | stesso consenso se esce dal dispositivo |
| Pagamento | ricevuta, non la carriera | vendere una cornice | il gestore pagamenti | regola del gestore e fiscale | il gestore e chi rimborsa | store o checkout. Non scelto | il gestore, non il motore | listino, età, IVA |
| Pubblicità | non prevista nella base | — | — | — | — | — | — | consenso marketing separato, e niente sulla carta decisionale |
| Carta firmata | seed, scelte, firma | una copia non riscrivibile dal telefono | server di verifica | la carriera conclusa, finché l'utente la tiene | il servizio di firma | hosting | si cancella con la richiesta | P-006 e un legale. NFT non incluso |
| Condivisione della carta | immagine o file che l'utente invia | far vedere una carriera | il canale scelto dall'utente | fuori dal gioco | chi la riceve | il canale dell'utente | non è una pubblicazione automatica | non costruirla ora |

## Minori, pagamenti, marchi

Da portare a un legale, non risolti qui:

- GDPR e ePrivacy, compreso lo storage locale che non è un cookie ma va spiegato
- età e capacità di prestare un consenso
- se un account è perfino ammissibile senza un controllo dell'età
- pubblicità verso un pubblico misto
- pagamenti, rimborsi, e se una carta firmata o un NFT possa essere letto come prodotto finanziario
- trasferimenti fuori dallo Spazio economico europeo, se il database o l'hosting non sono lì
- notifica di una violazione
- marchi NBA e nomi di franchigia già nel client. D-015 non autorizza la distribuzione commerciale senza revisione
- diritti sui dati sportivi, se un giorno si importano statistiche reali. Oggi il motore usa un mondo di gioco. NOT VERIFIED una licenza dati, perché questo inventario non ne ha trovata una nel repo

## Minacce se i flussi spenti si accendono

Sessione rubata, password riusata, carriera cloud sovrascritta, export di un'altra persona, segreto nel JavaScript, nome del giocatore finito in analytics, prezzo letto dal motore.

Contromisure previste e non costruite: hash, TLS, sessione che scade, limite sui tentativi, la carriera appartiene all'account, nessun segreto nel client, log senza il payload, cifratura a riposo quando ci sarà un database. Il checksum locale non è in questo elenco.
