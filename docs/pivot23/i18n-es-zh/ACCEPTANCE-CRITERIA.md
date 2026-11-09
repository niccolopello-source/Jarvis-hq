# Criteri di accettazione — lingue ES e ZH (2026-11-09)

Scritti prima dell'implementazione. Ogni criterio ha un test o una prova nominata.

## Funzionali
- **C1** Il selettore in home offre Italiano, English, Español, 中文 (zh-CN). La scelta si salva in `localStorage["pivot-lang"]` con valori `it|en|es|zh`; un valore sconosciuto torna a `it` come oggi. `<html lang>` diventa `es` / `zh-CN`.
- **C2** Chrome (i18n.ts, legacy-i18n.ts, labels, difficoltà, ads, suoni): 100% delle chiavi presenti in es e zh **oppure** elencate esplicitamente come fallback. Ogni chiave mancante usa l'**inglese** (mai l'italiano) per es/zh. IT/EN invariati.
- **C3** Narrativa: per es/zh `nx()` usa il catalogo della lingua; un frammento mancante cade sull'inglese; un testo sconosciuto resta come salvato (stessa regola di EN). La copertura è misurata in voci e in percentuale di righe lette in carriere a seed fissi, e documentata.
- **C4** Premi, ruoli, campionati con terminologia da glossario (`GLOSSARY-ES-ZH.md`). Nessun nome o licenza ufficiale inventati: nomi NBA/EuroLeague restano quelli già usati dal gioco; in zh si usano termini descrittivi comuni (es. 最佳新秀) affiancati dalla sigla dove serve.
- **C5** Le traduzioni sono marcate come **non riviste da madrelingua** (doc + commento nei file).
- **C6** Numeri: `es-ES` e `zh-CN` per i formati con `toLocaleString`; ordinali es `1.ª`, zh `第1`.
- **C7** Font CJK solo di sistema, nessun CDN, nessuna modifica a CSP o `vercel.json`.

## Invarianti (bloccanti)
- **I1** La lingua non cambia simulazione, RNG o envelope: stesse carriere su seed fissi in it/en/es/zh → fingerprint, `rngState` e salvataggio (senza `lang`, `careerId`, `c`) identici; cambio lingua a metà carriera → stesso risultato.
- **I2** `ENGINE_VERSION` resta 2.24, età massima 36, nessun file del motore cambia comportamento; il catalogo EN e le chiavi italiane restano byte-identici.
- **I3** Nessun test eliminato, nessuna soglia abbassata; tutti i test esistenti verdi.
- **I4** Ads OFF di default, `VITE_ADS_ENABLED` non toccata, nessun dominio in CSP.

## Verifiche
- Unit: parità chiavi 4 lingue (o elenco fallback), nessuna chiave mancante a runtime nei flussi principali (chrome + narrativa harness), invariante I1.
- E2E/screenshot headless (Playwright, Chromium): home, setup, draft, carriera (Storia/Anno/Lega/Vita), finale/Legacy in es e zh a 390×844 e 1280×800; nessun overflow orizzontale del documento.
- typecheck, lint, unit, build, e2e locali; CI della PR draft seguita fino alla fine.
