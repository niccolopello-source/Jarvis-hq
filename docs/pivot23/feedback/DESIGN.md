# PIVOT 23 — Sezione Feedback (fase 1)

Data: 25 novembre 2026 (Europe/Rome).  
Autore: progettazione tecnica, non visiva. La grafica e l’interfaccia visiva restano a Lucille.  
Stato: prototipo su ramo `grokbot/feedback-section`, bozza, niente merge e niente pubblicazione.  
Raccolta sul server: spenta. Nessuna nuova variabile Vercel, nessuna modifica alla CSP di produzione, nessun servizio a pagamento in questa fase.

Questo testo non è un parere legale e non sostituisce un’informativa. Non inventa dati del titolare né clausole contrattuali.

---

## 1. Cosa ha chiesto Pello

Sulla pagina iniziale deve comparire una sezione Feedback. Prima della prima carriera conclusa la sezione è assente: non è visibile, non è solo disattivata. Dopo la prima carriera compare in basso, sopra la riga «Powered by Totem» e i social. Dentro, chi gioca può:

- lasciare da 1 a 5 stelle, e cambiarle una volta ogni 30 giorni;
- scrivere una recensione.

Le recensioni vanno raccolte per capire come sta andando il gioco. In questa fase il prototipo funziona interamente sul dispositivo. L’invio a un server è pronto come adattatore, ma resta spento finché Pello non sceglie il servizio, i costi, il testo privacy e dà l’ok esplicito.

---

## 2. Come si riconosce «la prima carriera conclusa»

Il gioco non ha account. Tutto è per dispositivo, nel browser.

### Segnali già presenti (non si tocca il formato dei salvataggi)

| Segnale | Chiave / API | Significato |
|---|---|---|
| Archivio carriere concluse | `pivot-v2-archive`, `loadArchive()` | Una voce in archivio è una carriera finita (ritiro confermato o simulazione completa). |
| Identità della carriera | `careerId` sulla scheda e sul live save | `archiveStateOf(careerId)` dice se quella vita è finita e se la copia è persistente. |
| Save in corso | `pivot-v2-save` | Vale solo per draft/career. La schermata `result` non viene scritta nel live save. Quando l’archivio è persistito, il live save viene cancellato. |
| Limite archivio | `ARCHIVE_LIMIT = 8` | Restano le 8 carriere più recenti. Quelle evase spariscono dalla lista, ma sul dispositivo è comunque rimasta almeno una carriera finita se l’utente continua a giocare. |

Una carriera **non** è conclusa quando compare solo la carta «Vuoi giocare un altro anno?». In quel momento `pending.kind === "retire"` è una scelta, non un fine corsa.

### Sblocco usato dal prototipo

La sezione si apre se vale almeno uno di questi punti:

1. `loadArchive().length > 0` (c’è almeno una carriera in archivio, anche solo in memoria in quella sessione);
2. in questa sessione la carriera corrente è già stata archiviata (`playerDone`);
3. esiste il flag locale `pivot-v2-feedback-unlocked = "1"`.

Quando uno dei primi due è vero, il flag viene scritto. Così, se più tardi l’archivio diventa illeggibile o una scheda viene evasa, la sezione resta aperta su quel dispositivo.

Il flag e lo stato del parere stanno in chiavi **nuove**, separate dal live save e dall’archivio. Motore, checksum e carriere vecchie non cambiano.

### Limiti (per dispositivo)

- Chi completa la prima carriera su un telefono e apre il sito da un computer non vede la sezione, finché non conclude una carriera anche lì (non c’è account).
- Cancellare i dati del sito toglie archivio, flag e parere.
- Se l’archivio non si riesce a scrivere (quota piena) e anche il flag piccolo fallisce, lo sblocco dura solo quella sessione. Caso raro, documentato, non silenziato.
- Le carriere già concluse prima di questo aggiornamento sbloccano subito la sezione, perché l’archivio esiste già.

---

## 3. Cosa si memorizza (minimo)

Sul dispositivo, in `pivot-v2-feedback`:

- stelle (1–5);
- testo della recensione (massimo 2.000 caratteri, facoltativa);
- lingua dell’interfaccia;
- versione del motore (`engineVersion`);
- riassunto aggregato dell’ultima carriera in archivio: stagioni, titoli, picco, difficoltà, ruolo, se è una simulazione, versione motore della scheda;
- data dell’ultimo salvataggio e data dell’ultimo cambio stelle;
- un identificativo anonimo di dispositivo (UUID casuale, solo locale finché la raccolta è spenta).

**Non** si memorizzano e non si invierebbero: nome del giocatore, `careerId`, seed, testo narrativo, log, scelte, indirizzo email, o altri dati anagrafici. Un campo honeypot nasconde le scritte automatiche dei bot: se è pieno, l’interfaccia mostra un successo finto e non salva niente.

Finché `FLAGS.feedbackSubmit` è `false` (default), non parte nessuna richiesta di rete. Il flag non è una variabile Vercel e in questa fase non va accesa.

Regola delle stelle: il primo voto è libero; un voto diverso è accettato solo dopo 30 giorni (2.592.000.000 ms) dall’ultimo cambio. La recensione si può aggiornare anche prima, a parità di stelle. Il controllo sta nel client; quando esisterà un server dovrà ripetere la stessa regola, perché il client si può svuotare o modificare.

---

## 4. Opzioni per raccogliere le recensioni

Vincoli di progetto: sito su Vercel Hobby, CSP di produzione con `script-src 'self'` e `connect-src 'self'` e `form-action 'self'`. Cambiare la CSP o aggiungere variabili d’ambiente richiede l’ok esplicito di Pello. Le pubblicità restano spente. Non si chiedono e non si mettono nel repository dati fiscali, bancari o personali.

I prezzi sotto sono quelli pubblici letti il 25 novembre 2026. Possono cambiare. Non sono un preventivo.

### A. Funzione Vercel sullo stesso dominio + Neon Postgres (Marketplace, piano Free)

- Il browser chiama `POST /api/feedback` sullo stesso origine: **nessuna modifica alla CSP**.
- Neon Free: 0 €/mese, senza carta di credito; circa 1 GB di storage per progetto, 100 CU-ore e 5 GB di traffico al mese; il compute si spegne dopo 5 minuti di inattività (primo invio più lento dopo una pausa).
- Pro: analisi e export SQL/CSV semplici (media stelle, testi per lingua, versione motore, difficoltà). Adatto a «capire come sta andando il gioco».
- Contro: serve una variabile `DATABASE_URL` (ok di Pello). Il piano Hobby di Vercel ha limiti di durata e volume delle funzioni. Il titolare del trattamento diventa responsabile anche di questi dati sul database, spesso ospitato fuori dallo SEE (da verificare con un legale, trasferimento extra-SEE).
- Anti-spam lato server: limite per identificativo e per IP, honeypot già previsto, lunghezza del testo, rifiuto di payload con nome o campi extra.
- Moderazione: coda semplice (flag `hidden`) e export; niente revisione automatica in questa proposta.
- Costo previsto all’inizio: 0 €, se si resta nei tetti free. Un superamento può sospendere il compute fino al mese successivo, non fatturare in automatico sul Free (secondo Neon, novembre 2026).

### B. Funzione Vercel + Upstash Redis (Marketplace, piano Free)

- Stesso origine, stessa CSP.
- Free: 0 €/mese, 250 MB, 500.000 comandi/mese, 10 GB di banda, un database. Senza carta, finché non si passa a un piano a pagamento.
- Pro: più semplice da accendere, adatto a un record per dispositivo (`HSET deviceId → json`) e a un rate limit con TTL.
- Contro: l’analisi è meno comoda (serve una piccola funzione di export). Stesse questioni privacy e variabili (`UPSTASH_REDIS_REST_URL` / `TOKEN`). Un account Upstash con metodo di pagamento, secondo la documentazione 2026, non tiene database free.
- Costo previsto all’inizio: 0 € nei tetti free.

### C. Vercel Blob

- Hobby include 1 GB, 10.000 operazioni semplici e 2.000 avanzate, 10 GB di trasferimento al mese. Oltre il tetto il servizio si ferma fino al rinnovo del periodo, senza addebito extra (documentazione Vercel Blob).
- Pro: file JSON append-only, backup semplice.
- Contro: poco adatto a «modifica una volta al mese» e alle query. Le operazioni avanzate (scritture, elenchi) sono poche (2.000/mese). Serve comunque una funzione e un token (variabile Vercel). Meno indicato come magazzino principale.

### D. Servizio moduli esterno (Formspree, Tally, Google Forms, e simili)

- Contro dirimenti: servono `connect-src` e spesso `form-action` verso un terzo, quindi **una modifica alla CSP di produzione**. Terzo titolare o responsabile da regolare. Costi e tetti diversi, alcuni a pagamento. Non consigliato, finché si può restare same-origin.

### E. Issue GitHub

- Contro: le issue di un repository pubblico espongono i testi. Serve un token (credenziale, da non mettere nei log né nel repo). Moderazione e analisi scomode. Non adatto a un parere degli utenti.

### F. Solo locale (questa fase)

- Pro: zero rischi nuovi, zero costi, zero CSP, zero variabili, privacy invariata sul piano della trasmissione.
- Contro: Pello **non riceve** le recensioni. Serve solo a dimostrare sblocco, form, i18n e regole. Non soddisfa da solo «dobbiamo raccogliere quelle recensioni».

### Raccomandazione tecnica

Per la fase 2, dopo l’ok di Pello: **funzione Vercel sullo stesso dominio + Neon Postgres sul piano Free**, perché l’obiettivo dichiarato è analizzare i pareri. Upstash è l’alternativa più leggera se si vuole solo accumulare e esportare a mano. Blob, form esterni e GitHub non sono la prima scelta.

La fase 2 non parte da sola: servono l’ok di Pello sul servizio, sulle eventuali variabili, sulla spesa (anche se il piano scelto è free), e un aggiornamento dell’informativa verificato da un legale.

---

## 5. Privacy e GDPR (solo segnalazioni, niente testo legale inventato)

Pello è titolare del trattamento. Il progetto è un hobby. Non risulta nominato un DPO; se sia obbligatorio non è una decisione di questo documento.

Oggi le bozze in `docs/pivot23/legal/PRIVACY-POLICY.it.md` e `.en.md` dicono, tra le altre cose, che le carriere e le preferenze restano **solo nel browser** e che il titolare non le riceve. L’inventario in `docs/pivot23/PRIVACY-DATA-INVENTORY.md` elenca i salvataggi locali e non contempla un flusso «recensione inviata».

Se la raccolta si accende, **prima** vanno aggiornati, da chi ha titolo e con verifica legale, almeno:

- l’informativa (sezioni su dati trattati, finalità, base giuridica, tempi, fornitori, trasferimenti, diritti, esercizio dei diritti);
- l’inventario dati (nuovo flusso: stelle, testo, lingua, versione motore, riassunto aggregato, identificativo dispositivo, data; più, sul server, dati tecnici di connessione già eventualmente trattati da Vercel);
- la cookie policy, solo se il meccanismo introducesse storage non strettamente necessario o tracker (il prototipo attuale usa `localStorage` di prima parte; un legale deve comunque rivedere la qualificazione);
- il testo in interfaccia che oggi dice che il parere non viene inviato a nessun server.

Non si pubblica e non si redige qui un’informativa definitiva. Non si inventano indirizzo, email, base giuridica scelta, tempi di conservazione o clausole. La recensione è un dato personale se il testo può identificare qualcuno: va detto di non inserire dati anagrafici, e va prevista moderazione e cancellazione su richiesta.

Minori: l’inventario già nota che l’età di chi gioca non è misurata. È un punto da portare al legale prima della raccolta.

---

## 6. Prototipo consegnato (fase 1)

- Ramo: `grokbot/feedback-section`, partita da `main` dopo la #165 e allineata con un merge commit a `main` dopo anche la #166.
- Sblocco come al punto 2; pulsante in basso sulla home, assente dal DOM prima dello sblocco.
- Pagina con stelle, recensione, testi IT/EN/ES/ZH (303 chiavi chrome, prima 287). Stile minimo, con le classi già usate dal gioco. Lucille resterà la grafica.
- Archivio locale + adattatore di invio spento (`FLAGS.feedbackSubmit: false`).
- Test unitari in `feedback.test.ts` e test e2e in `e2e/feedback.spec.ts`.
- Motore, salvataggi esistenti, pubblicità, CSP e variabili Vercel: non toccati.

File principali:

- `apps/pivot23/src/lib/pivot/feedback.ts`
- `apps/pivot23/src/lib/pivot/feedback.test.ts`
- `apps/pivot23/src/components/pivot/FeedbackView.tsx`
- `apps/pivot23/src/components/pivot/PivotApp.tsx` (solo innesto UI)
- chiavi in `i18n.ts`, `i18n-es.ts`, `i18n-zh.ts`
- `apps/pivot23/e2e/feedback.spec.ts`

---

## 7. Decisioni che spettano a Pello

Senza un ok esplicito non si unisce, non si pubblica, non si accende la raccolta, non si aggiungono variabili, non si modifica la CSP, non si spende.

1. Va bene questo prototipo in bozza, in attesa della grafica di Lucille?
2. Quale backend scegliere per la fase 2 (raccomandato: funzione Vercel + Neon Free; alternativa: Upstash Free)?
3. Conferma che, anche su piano free, l’apertura di un servizio Marketplace e delle relative variabili è autorizzata?
4. Chi verifica e aggiorna informativa, inventario e (se serve) cookie policy prima dell’accensione?
5. Tempi di conservazione, canale per chiedere la cancellazione, e se i pareri restano interni o possono essere citati in pubblico (solo dopo base legale e testo chiaro).
6. Moderazione: chi legge i testi, e cosa si fa con contenuti offensivi o con dati personali scritti per sbaglio?

---

## 8. Esito dei controlli

I risultati concreti (SHA, PR, CI, screenshot) sono nel rapporto di consegna, etichettati solo se eseguiti: PASS, FAIL, NOT RUN o HYPOTHESIS. Qui non si anticipano esiti non ancora visti.
