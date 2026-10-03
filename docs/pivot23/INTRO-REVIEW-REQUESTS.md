# Richieste di revisione — intro granata

Branch: `grok/intro-granata`
Commit: da indicare nella pull request
Stato: richieste preparate, report non ricevuti.

Nessuna di queste revisioni è stata eseguita. Non segnare un parere come ricevuto finché non arriva il testo del revisore.

## Claude — revisione del diff

Leggi solo il diff della pull request. Non modificare i file.

Controlla:

- che `index.html` disegni la geometria già usata da `CourtMark` e non un marchio nuovo;
- che `bootArc` duri una volta, non blocchi il mount e rispetti `prefers-reduced-motion`;
- che il fallback resti se `main.tsx` non arriva;
- che `main.tsx` tocchi solo il `theme-color`;
- che non ci siano cambiamenti a motore, salvataggi, probabilità o navigazione.

Rispondi con: problemi confermati nel diff, riga e file, gravità, e cosa non hai potuto verificare.

## Gemini — prestazioni e adattamento

Non modificare i file. Usa i numeri già misurati e, se puoi, ripetili.

Numeri raccolti il 2026-10-03, Linux, Chromium headless, 2 core, Vite locale, non un telefono:

- marchio 281 px a 390×844, 420 px a 768 e a 1440, dentro lo schermo;
- 60 fotogrammi a riposo: media 16 ms, picco 17 ms;
- con la suite unitaria in parallelo, un intervallo ha toccato 83 ms;
- «Inizia» cliccabile in prova a 487 ms;
- first contentful paint 60 ms;
- nessuna dipendenza aggiunta. L'animazione è CSS su uno SVG inline.

Rispondi con: se il picco da 83 ms è un problema, se il dispositivo a 1–2 core perde l'identità dell'intro, e quale misura manca.

## James — stabilità e regressioni

Non modificare i file. La suite già eseguita su questo albero:

- ESLint pass, `tsc --noEmit` pass, unitari 53/53, `vite build` pass;
- Playwright `demo-readiness.spec.ts` 10/10, inclusa la carriera da «Inizia» (49 passi, prima scelta), l'età 36, il movimento ridotto e lo script di avvio interrotto.

Rispondi con: quali criteri di accettazione sono ancora aperti, in particolare telefono fisico, anteprima Vercel non aperta, e se i 10 test coprono davvero fallback, movimento ridotto e avvio.

## Anteprima

L'URL previsto è `https://pivot23-git-grok-intro-granata-jarvis-hq-vercel.vercel.app`. Il 2026-10-03 rispondeva, ma l'autenticazione Vercel ha impedito di vederla. Per un revisore: aprire il link da un account del team Vercel, oppure condividere un bypass di Deployment Protection. Non è stato cambiato nulla nelle impostazioni del progetto.
