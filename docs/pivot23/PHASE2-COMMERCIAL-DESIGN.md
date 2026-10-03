# PIVOT 23 — Proposta commerciale, account e privacy

Stato: proposta, 2026-10-02. Non è implementata. Non è su `main` come funzione. Non autorizza deploy, tracker, pagamenti o raccolta di dati reali.

Il 2026-10-03 il dettaglio è stato spezzato, senza cambiare questo disegno, in [MONETIZATION-STRATEGY.md](MONETIZATION-STRATEGY.md), [ACCOUNT-AND-SAVE-ARCHITECTURE.md](ACCOUNT-AND-SAVE-ARCHITECTURE.md), [ANALYTICS-EVENT-SPEC.md](ANALYTICS-EVENT-SPEC.md), [PRIVACY-DATA-INVENTORY.md](PRIVACY-DATA-INVENTORY.md), [MONETIZATION-TECHNICAL-ROADMAP.md](MONETIZATION-TECHNICAL-ROADMAP.md) e [MONETIZATION-DECISIONS.md](MONETIZATION-DECISIONS.md).

Fonte di gioco verificata: `apps/pivot23`. Oggi il gioco è ospite, locale, con `FLAGS.account`, `tokens` e `nft` a `false`. Il checksum del salvataggio è un'impronta locale. Non è un controllo anti-cheat e non lo diventa in questa proposta.

## 1. Architettura

Il motore resta il modulo che decide draft, stagioni, playoff, overall e premi. Nessun servizio commerciale lo chiama per cambiare un numero sportivo.

Moduli, tutti spenti finché un flag esplicito non li accende:

| Modulo | Oggi | Acceso solo dopo |
|---|---|---|
| Motore | acceso, locale | mai da un acquisto |
| Salvataggio ospite | acceso, `pivot-v2-save` v2 | resta il fallback |
| Account | spento | approvazione e revisione legale |
| Save cloud | spento | account e prova di non perdita |
| Archivio cloud | spento | stesso vincolo del save |
| Consenso | non presente | testo legale approvato |
| Analytics | non presente | consenso, se richiesto |
| Monetizzazione | spenta | listino e divieto pay-to-win |
| Collezionabili / NFT | spenti | firma server del seed e delle scelte. Non in questa fase |

Se account o analytics non rispondono, la partita ospite continua. Nessuna schermata di login è obbligatoria per iniziare.

## 2. Schema dati, proposto

Non è uno schema da migrare ora. Il salvataggio v2 non cambia in questo documento.

Account, quando esisterà:

- id interno, email, password solo come hash, data di creazione, data di cancellazione
- niente data di nascita, niente genere, niente posizione precisa
- sessione: id opaco, scadenza, revoca
- collegamento facoltativo a una o più carriere locali, con id carriera già esistente e checksum locale come controllo di integrità, non come prova

Carriera cloud, copia del payload di gioco più:

- id carriera, id account, versione schema, data di scrittura
- niente prezzo, niente rarità, niente modifica di overall

Consenso, registro separato dall'account di gioco:

- categorie, scelta, momento, versione del testo
- il rifiuto è uno stato valido, non un campo vuoto

Analytics, se attivata: eventi aggregati senza nome, senza email, senza testo della carriera. Esempi di eventi, non una lista da spedire: carriera iniziata, carriera conclusa, fase abbandonata, salvataggio riuscito, errore tecnico, lingua. Il dispositivo entra solo come classe grossolana (telefono o desktop), non come impronta.

## 3. Flussi

1. Ospite. Si gioca subito. Il salvataggio resta sul dispositivo.
2. Registrazione facoltativa. Email e password. Verifica email solo se il recupero account la richiede. Il gioco non si ferma durante l'attesa.
3. Collegamento. Si mostra l'elenco delle carriere locali. L'utente sceglie quali copiare. Se sul cloud esiste già una carriera con lo stesso id, non si sovrascrive in silenzio: si chiede quale tenere, e si conserva l'altra finché l'utente non la scarta.
4. Logout. Il salvataggio locale resta. Il cloud smette di aggiornarsi.
5. Nuovo dispositivo. Il login scarica le copie cloud. Non cancella un salvataggio locale diverso senza chiedere.
6. Export. Un file letto dall'utente, con i dati dell'account e delle carriere collegate.
7. Cancellazione. Cancella account, sessioni, copie cloud e consensi. Il file locale sul telefono resta finché l'utente non lo toglie dal browser: va detto in chiaro.
8. Collezionabili futuri. La carta è un ritratto della carriera già conclusa. Un acquisto, se mai ci sarà, compra una cornice o una copia firmata dal server. Non compra punti, draft, minuti o titoli. Blockchain e wallet non fanno parte di questo disegno.

## 4. Monetizzazione

La base resta gratuita, senza login e senza acquisto obbligatorio. Nessun pay-to-win: un pagamento non cambia overall, draft, infortuni, premi o risultati.

| Modello | Cosa pagherebbe | Compatibilità | Rischio |
|---|---|---|---|
| Free-to-play puro | niente | è lo stato attuale | nessun ricavo. È un fatto, non una stima |
| Freemium | una copia o un extra dopo la carriera gratuita | compatibile se l'extra non entra nel motore | va definito cosa è extra |
| Cosmetici | cornice della carta, tema, nulla di sportivo | il più vicino al vincolo | basso impatto sul gioco, ricavo non misurato |
| Contenuti | una lega o un archivio di testi in più | compatibile se la carriera base resta intera | non tagliare la demo per creare l'extra |
| Abbonamento | archivio cloud o più slot | compatibile se l'ospite resta | costo ricorrente da spiegare | 
| Pubblicità non invasiva | uno spazio fuori dalla decisione | compatibile solo fuori dal momento della scelta | consenso, e un fornitore terzo |
| Video premio facoltativo | un cosmetico, mai un bonus sportivo | compatibile solo a quel patto | stesso consenso, più pressione |

Nessuno di questi è acceso. Non assegno un vincitore: mancano prezzi, costi di acquisizione e un pubblico misurato. La scelta è del proprietario, dopo i numeri veri.

## 5. Analytics

Minimizzazione. Niente fingerprint. Niente profilo pubblicitario nascosto. Le statistiche di gioco non si legano al nome se basta il conteggio.

| Dato | Classe | Perché | Necessario per giocare | Terzi |
|---|---|---|---|---|
| Salvataggio locale | funzionamento | riprendere la carriera | sì, sul dispositivo | no |
| Lingua scelta | preferenza | testo giusto | no, c'è un default | no |
| Email e hash password | account | solo se l'utente apre un account | no | il fornitore di posta, se c'è verifica |
| Evento «carriera iniziata» senza identità | analytics | contare, non riconoscere | no | solo se il fornitore è scelto e il consenso c'è |
| Crash senza carriera | diagnostica | correggere un blocco | no | stesso vincolo |
| Identificativo pubblicitario | marketing | non previsto nella base | no | vietato finché non c'è un consenso separato |

Base giuridica: da far scrivere a un legale. Non la invento. Per il salvataggio locale la finalità è eseguire il gioco chiesto dall'utente. Per analytics e marketing serve un consenso, se la regola europea si applica, e il gioco non si blocca se manca.

Durata: il salvataggio locale vive finché il browser lo tiene. I log tecnici, se nasceranno, vanno datati e cancellati a una scadenza scritta prima dell'accensione. Non fisso un numero di mesi senza un legale.

Cancellazione: l'utente la chiede dall'account. Un export precede la cancellazione. I backup hanno la stessa scadenza, non una copia eterna.

## 6. Consenso

Categorie: necessari, preferenze, analytics, marketing.

I necessari sono il salvataggio della partita e la scelta della lingua. Non chiedono un sì per esistere: senza quelli la partita non riparte. Vanno spiegati, non spuntati di nascosto.

Analytics e marketing nascono spenti. Niente casella già segnata. Accettare e rifiutare sono entrambi un tap, stessa evidenza. Si può cambiare idea dopo, dalla stessa schermata. Il rifiuto non chiude la carriera gratuita.

Local storage e session storage del salvataggio sono tecnologie di tracciamento ai fini della spiegazione, anche se non sono cookie. Oggi servono al gioco. Un pixel, un SDK o una pubblicità non sono necessari e restano spenti.

Servono, prima dell'accensione, una informativa privacy e una pagina sui cookie e sullo storage, in italiano e in inglese, scritte in lingua normale. Il testo legale non è questo documento.

## 7. Minacce

Superfici nuove, se i servizi si accendono:

- furto della sessione
- password indovinata o riusata
- sovrascrittura di una carriera cloud
- export usato per leggere la carriera di un altro
- chiave segreta finita nel JavaScript
- analytics che riceve il nome del giocatore per errore
- un prezzo che entra nel calcolo dell'overall

Contromisure previste, non costruite: password solo come hash, TLS, token a scadenza, rate limit sul login, controllo che l'id carriera appartenga all'account, nessun segreto nel client, log di accesso senza il contenuto della carriera, cifratura a riposo del database quando ci sarà un database. Il checksum locale non entra in questo elenco come difesa.

Violazione: un responsabile avvisa il proprietario, si revocano le sessioni, si scrive cosa è uscito. La procedura legale di notifica non la redigo io.

## 8. Costi

Verificato: oggi non c'è un server di gioco, non c'è un conto pagamenti, non c'è un SDK. Il costo di esercizio della demo pubblica è quello dell'hosting già usato. Non ho la fattura.

Ipotesi, non numeri di mercato: un database, la posta di verifica, un gestore pagamenti e un revisore legale costano. Non invento un break-even. Non ho utenti, conversione, né costo di acquisizione misurati. Quelle caselle restano vuote finché non esistono.

## 9. Roadmap

1. Demo. Chiudere i bug di presentazione già aperti. Nessun account.
2. Testo legale. Informativa, storage, cancellazione, minori se il gioco li riguarda. Senza questo non si accende nulla.
3. Account spento dietro flag, con ospite intatto e prova di non perdita del salvataggio.
4. Copia cloud, stesso flag, con il conflitto esplicito.
5. Analytics aggregata, consenso spento di default.
6. Un solo prodotto pagato, cosmetico, senza toccare il motore. Listino approvato a parte.
7. Carta firmata dal server. NFT e wallet solo con un'altra approvazione.

## 10. Criteri, quando si implementerà

- Si gioca senza account.
- Un acquisto non cambia una statistica.
- Un servizio spento non blocca la partita.
- Un salvataggio locale sopravvive a registrazione, logout e cancellazione account.
- Due carriere con lo stesso id non si fondono in silenzio.
- Analytics e marketing restano off senza un sì.
- Rifiutare è facile quanto accettare.
- Nessun segreto nel client.
- Il checksum non viene descritto come anti-cheat.

## 11. Revisione legale, obbligatoria prima del codice

GDPR, ePrivacy, età minima, trasferimento fuori dallo Spazio economico europeo, testi di consenso, conservazione, notifica di violazione, marchi delle franchigie già presenti nel client, e il fatto che un cosmetico o una carta non sia un prodotto finanziario. Questi punti non sono risolti qui.
