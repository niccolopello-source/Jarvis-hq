# PIVOT 23 — Protocollo manuale su dispositivo reale

Stato al 11 ott 2026: **BLOCKED**. Nessun iPhone/Safari iOS, Android fisico o Safari macOS disponibile agli agenti.
Le prove Playwright (Chromium headless, viewport emulate) **non** sostituiscono questo protocollo.

## Dispositivi minimi
iPhone con Safari iOS 17+ (schermo piccolo, es. SE/13 mini) · iPhone grande (Pro Max) · Android Chrome di fascia media · Safari macOS.

## Procedura (registrare per ogni dispositivo: modello, OS, browser, URL, SHA del deploy, data, esito, screenshot)
1. Apri l'URL della preview indicato nella PR in finestra normale (non privata). Verifica intro, logo e pulsante «Inizia» entro ~3 s.
2. Crea una carriera: nome lungo (es. «Massimiliano Della Valle-Giordano»), completa il draft, scegli il percorso, entra in palestra.
3. Gioca almeno 3 stagioni. Ad ogni carta: tutto il testo leggibile, pulsanti raggiungibili con il pollice, nessuno scroll orizzontale, nulla coperto da notch, home indicator o barra di Safari (safe-area).
4. Ruota il telefono in orizzontale su una carta decisione: nulla di tagliato, header non oltre metà schermo.
5. Doppio tocco veloce su un pulsante di scelta: deve registrarsi una sola decisione (controlla il diario).
6. Durante una carta playoff o di mercato: chiudi la scheda, riapri l'URL. Deve tornare la stessa carta con la stessa squadra/turno.
7. Metti l'app in background 1 minuto (cambia app), torna: stato invariato.
8. Attiva «Riduci movimento» (iOS: Accessibilità → Movimento). Il gioco resta utilizzabile.
9. Imposta il testo grande (iOS Dimensioni testo +2): nessun pulsante essenziale fuori schermo.
10. Porta la carriera al ritiro (o usa «Chiudi ora» all'ultimo inverno): report finale, Career Card, Archivio. Ricarica e riapri la carriera archiviata.
11. Modalità aereo dopo il primo caricamento: ricarica, la carriera locale resta disponibile.
12. Safari privato: deve comparire l'avviso che il salvataggio è disattivato, senza schermo nero.

Esito: PASS solo se tutti i passi passano su quel dispositivo; altrimenti FAIL con passo, screenshot e testo dell'errore.

## Handoff G5 — 12 ott 2026 (Grok Bot)
Candidato: `https://www.pivot23.com` (= `https://pivot23.vercel.app`), SHA `3bb757bab75a18726bfc6b08756651238ed8fd68`, deploy GitHub «Production – pivot23» `success` (asset identici a una build locale dello stesso SHA).

| Dispositivo | Browser / OS | Stato |
|---|---|---|
| iPhone piccolo (SE / 13 mini) | Safari, iOS 17+ | BLOCKED, nessun dispositivo |
| iPhone grande (Pro Max) | Safari, iOS 17+ | BLOCKED |
| Android fascia media (es. Pixel 6a / Galaxy A54) | Chrome stabile, Android 13+ | BLOCKED |
| Mac | Safari 17+, macOS 14+ | BLOCKED |

- Nota al passo 2: il campo nome accetta **20 caratteri**; «Massimiliano Della Valle-Giordano» diventa «Massimiliano Della V». Verificare che il nome troncato non sia tagliato a schermo.
- Eseguibile da remoto su una device farm reale (BrowserStack/Sauce o simili, non acquistati): passi 1–6, 10, 12. Solo dispositivo fisico in mano: 7 (background reale), 8–9 (impostazioni accessibilità), 11 (modalità aereo), audio dell'intro e sensazione dei tocchi.
- Registrare SHA del deploy al momento della prova: se `main` è avanzato, la prova vale per il nuovo SHA solo se rieseguita.

## Esito riferito — 12 ott 2026, 09:54 UTC
Pello ha riferito in chat: «iPhone funziona, Mac funziona, Android funziona».

| Dispositivo | Esito | Etichetta |
|---|---|---|
| iPhone (Safari) | PASS | riferito da Pello, verifica manuale non osservata dagli agenti |
| Mac (Safari) | PASS | riferito da Pello, verifica manuale non osservata dagli agenti |
| Android (Chrome) | PASS | riferito da Pello, verifica manuale non osservata dagli agenti |

Modelli, versioni di OS/browser, SHA servito al momento della prova e singoli passi del protocollo: **NON VERIFICATO** (non comunicati). Nessuno screenshot ricevuto.

## Accettazione di Pello — 15 ott 2026
Pello ha scritto in chat: «Dispositivi accettati: iPhone, Mac, Android».

| Dispositivo | Esito | Etichetta |
|---|---|---|
| iPhone | ACCETTATO | accettato da Pello il 15 ott 2026; verifica manuale non osservata dagli agenti |
| Mac | ACCETTATO | accettato da Pello il 15 ott 2026; verifica manuale non osservata dagli agenti |
| Android | ACCETTATO | accettato da Pello il 15 ott 2026; verifica manuale non osservata dagli agenti |

Modelli, versioni di OS e browser, SHA servito durante la prova, passi del protocollo e screenshot: **NON COMUNICATI / NON VERIFICATO**. Gate dispositivi chiuso per decisione dell'owner, non per prova osservata dagli agenti.
Nota SHA: il codice di gioco candidato al freeze era `e7cc321`; alla registrazione `main` è `0624219` (dopo #101 meta AdSense e #103 DEF-01 lettura salvataggi). L'accettazione non indica lo SHA provato.
