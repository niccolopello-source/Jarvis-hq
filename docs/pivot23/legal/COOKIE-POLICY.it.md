> ⚠️ **BOZZA — NON PUBBLICARE.** Deve essere verificata da un legale prima della pubblicazione. Le voci **DA VERIFICARE** non sono confermate.

# Cookie Policy — PIVOT 23 (www.pivot23.com)
Ultimo aggiornamento / in vigore dal: 21 ottobre 2026 · Titolare: Niccoló Pelizzon, via della Cava 2, 31049 Valdobbiadene (TV), Italia, niccolo.pello@gmail.com (indirizzo provvisorio, sarà sostituito da un indirizzo dedicato)

Riferimenti: art. 122 D.Lgs. 196/2003; Linee guida cookie e altri strumenti di tracciamento del Garante, 10/06/2021 (https://www.garanteprivacy.it/home/docweb/-/docweb-display/docweb/9677876); GDPR.

## 1. Strumenti tecnici (sempre attivi, nessun consenso richiesto)
PIVOT 23 non imposta cookie propri. Usa la memoria del browser (localStorage/sessionStorage) solo per far funzionare il gioco. I dati restano sul dispositivo e non vengono inviati.

| Chiave | Tipo | Scopo | Durata |
|---|---|---|---|
| `pivot-v2-save`, `pivot-v2-save-backup`, `pivot-v2-save-backup-prev`, `pivot-v2-save-crashed` | localStorage (+ copia in sessionStorage) | Carriera in corso e copie di sicurezza | Fino a cancellazione |
| `pivot-v2-archive`, `pivot-v2-archive-backup` | localStorage | Archivio carriere concluse | Fino a cancellazione |
| `pivot-v2-swipe`, `pivot-v2-hint` | localStorage | Suggerimenti già mostrati | Fino a cancellazione |
| `pivot-v2-card-theme` | localStorage | Tema della Career Card | Fino a cancellazione |
| `pivot-lang` | localStorage | Lingua | Fino a cancellazione |
| `pivot23.introSeen`, `pivot23.introSound` | localStorage | Intro vista, preferenza suono | Fino a cancellazione |
| `pivot-v2-flush-hold` | sessionStorage | Gestione tecnica del salvataggio | Chiusura scheda |

Fonte: codice su main `db64c10` (`src/lib/pivot/save.ts`, `engine.ts`, `i18n.ts`, `cosmetics.ts`, `src/intro.ts`, `src/intro-sound/`). Il gioco usa anche una chiave di prova temporanea per verificare se il browser può salvare. Oggi il sito non carica script di terze parti (CSP `script-src 'self'`, `connect-src 'self'`).

## 2. Cookie di terze parti per la pubblicità (solo desktop, solo con consenso)
Solo su computer desktop, e solo se la pubblicità è attiva, il sito carica Google AdSense / H5 Games Ads e la CMP di Google (IAB TCF v2.3).
- Gli annunci sono **solo non personalizzati**, ma Google usa comunque cookie o identificatori per **limitare la frequenza**, report aggregati e **prevenire frodi/traffico non valido** (https://support.google.com/adsense/answer/9007336). Per questo chiediamo il consenso prima di caricarli.
- Fornitori: elenco completo nella CMP ("Gestisci opzioni" → fornitori).

**Cookie di Google AdSense / H5 Games Ads** (fonte: https://business.safety.google/adscookies/)

| Cookie | Dominio | Scopo | Durata |
|---|---|---|---|
| `__gads` | dominio del sito (pivot23.com) | Pubblicità, sicurezza | 13 mesi |
| `__gpi` | dominio del sito (pivot23.com) | Pubblicità, sicurezza | 13 mesi |
| `__gpi_optout` | dominio del sito (pivot23.com) | Pubblicità | 13 mesi |
| `__eoi` | dominio del sito (pivot23.com) | Sicurezza | 6 mesi |
| `TESTCOOKIESENABLED` | dominio del sito (pivot23.com) | Funzionalità | 60 secondi |
| `GED_PLAYLIST_ACTIVITY` | dominio del sito (pivot23.com) | Pubblicità | Sessione |
| `id` | doubleclick.net | Funzionalità, pubblicità, sicurezza | 13 mesi |
| `DSID` | doubleclick.net | **DA VERIFICARE** | 2 settimane |
| `test_cookie` | doubleclick.net | **DA VERIFICARE** | 15 minuti |
| `IDE` | doubleclick.net | Pubblicità (possibile: Google non lo attribuisce esplicitamente ad AdSense) | 13 mesi |

**Cookie della CMP di Google**

| Cookie | Scopo | Durata |
|---|---|---|
| `FCCDCF` | Memorizza la tua scelta di consenso e la stringa TCF | 13 mesi |
| `FCNEC` | Analisi | 365 giorni |

Note:
- Google non pubblica un elenco separato per H5 Games Ads; poiché funziona sull'infrastruttura AdSense, assumiamo che usi gli stessi cookie (deduzione — **DA VERIFICARE**).
- Le chiavi localStorage/sessionStorage usate da Google saranno inventariate quando gli annunci saranno attivi.
- L'elenco sarà verificato sul campo (DevTools, con annunci attivi) e aggiornato di conseguenza.
- Informazioni generali di Google sui cookie: https://policies.google.com/technologies/cookies

**Su smartphone e tablet** non carichiamo pubblicità né script di terze parti e non mostriamo banner (ci sono solo strumenti tecnici) — **DA VERIFICARE** con il legale.

## 3. Le tue scelte
- Banner al primo accesso (desktop): "Accetta", "Rifiuta" con pari evidenza, chiusura con X = rifiuto, "Gestisci opzioni" per scelte granulari. Lo scroll non vale come consenso. Nessun cookie wall: il gioco funziona anche se rifiuti.
- Dopo un rifiuto il banner non viene riproposto per almeno 6 mesi, salvo cambi rilevanti.
- Puoi cambiare idea in ogni momento con il link "Preferenze cookie" presente in modo permanente nel footer/menu della home page; il banner di consenso compare alla prima visita e di nuovo dopo aggiornamenti sostanziali di questa informativa.
- Puoi cancellare i dati dalle impostazioni del browser (questo cancella anche le carriere salvate).

## 4. Contatti
niccolo.pello@gmail.com. Vedi anche l'Informativa privacy.
