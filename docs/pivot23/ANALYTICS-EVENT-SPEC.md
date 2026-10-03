# Specifica eventi

Stato: specifica locale, 2026-10-03. Nessun evento esce dal dispositivo. Nessun SDK. Nessun invio.

Questa lista non è un permesso di raccolta. È il minimo da discutere prima di un consenso. La base giuridica la scrive un legale. Qui si dice solo dove un consenso è probabilmente necessario e dove il gioco deve funzionare anche senza.

## Classi

| Classe | Esempio | Parte senza un sì extra | Può identificare |
|---|---|---|---|
| Tecnica, per non perdere la partita | salvataggio nel browser | sì. Va spiegata, non spuntata di nascosto | il payload è personale di gioco, ma resta sul dispositivo |
| Diagnostica di un guasto | errore di scrittura, errore di schermata | no, finché esce dal dispositivo | può diventarlo se si allega il payload |
| Prodotto | una stagione conclusa, una schermata aperta | no | sì, se si unisce a un id stabile |
| Pubblicità | identificatore pubblicitario | no, e non è prevista | sì |

Niente fingerprint, niente session replay, niente profilo pubblicitario, niente nome reale, email, data di nascita, posizione precisa, contatti, cronologia fuori dal gioco.

## Eventi proposti, non trasmessi

Frequenza: una volta per gesto, non a ogni frame. Conservazione: non fissata. Un numero di mesi senza un legale sarebbe inventato. Accesso: solo chi tiene il gioco, e solo dopo che un luogo di raccolta esiste. Oggi quel luogo non c'è.

| Evento | Scopo | Campi | Personale | Consenso prima di un invio | Spegnimento |
|---|---|---|---|---|---|
| `app_started` | Sapere se l'avvio arriva alla home | versione dell'app, lingua del selettore | no, se non c'è un id | sì per l'analytics di prodotto. L'avvio stesso non è un evento da spedire | il gioco parte lo stesso |
| `career_started` | Contare le carriere nuove | `careerId` solo se serve a non contare due volte la stessa. Meglio un conteggio senza id | l'id è un identificatore locale | sì | nessuna carriera si blocca |
| `career_season_completed` | Vedere dove le persone smettono | indice stagione, età di gioco, lega già nota al motore (`NBA` o `Euro`) | no, se non si lega al nome | sì | no |
| `career_saved` | Distinguere un salvataggio riuscito da uno perso | esito sì/no, versione schema | no | la scrittura locale è tecnica. Il conteggio remoto no | il salvataggio locale non dipende dall'evento |
| `career_resumed` | Vedere se la partita riprende | versione schema | no | sì se esce dal dispositivo | no |
| `career_retired` | Contare le chiusure | età di chiusura, senza il testo della carta | no | sì | no |
| `screen_opened` | Solo per una schermata che stiamo ridisegnando | nome schermata interno (`intro`, `setup`, `career`, `result`) | no | sì. Toglierlo se non guida una modifica | no |
| `app_error` | Correggere un blocco | codice interno, senza stack che contenga il nome del giocatore | può diventarlo | diagnostica remota: sì. Il log in console di sviluppo resta locale | la schermata di errore già ricarica |
| `save_error` | Sapere se il browser rifiuta la scrittura | `quota` oppure `corrupt`, niente payload | no | come `app_error` | il testo già dice che l'ultimo salvataggio riuscito resta |
| `performance_sample` | Vedere se l'avvio è lento | millisecondi fino al primo contenuto, classe grezza `phone` o `desktop` | la classe non è un'impronta | sì | niente campione se il consenso manca |

`careerId` non si mette negli eventi di prodotto finché non serve a togliere un doppio conteggio, e anche allora resta locale. Il nome scritto dall'utente, la squadra, il testo degli eventi e il seed non sono campi di analytics.

## Cosa non si emette

- identificatore pubblicitario
- email
- indirizzo IP come campo dell'evento. Un server, se un giorno esiste, lo vede comunque: va detto al legale, non va salvato nel magazzino analytics
- contenuto di `PlayerState`
- elenco delle scelte

## Disattivazione

Analytics di prodotto e diagnostica remota nascono spente. Accettare e rifiutare hanno lo stesso peso. Si cambia idea dalla stessa schermata. Il rifiuto non chiude la carriera.

In questa fase il prototipo non ha nemmeno un buffer locale di eventi. Non c'è niente da trasmettere e niente da cancellare fuori dal telefono.
