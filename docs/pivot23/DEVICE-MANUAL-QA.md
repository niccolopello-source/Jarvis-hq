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
