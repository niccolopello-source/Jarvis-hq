# Career Legacy Report e Career Card (Missione 2)

Owner: Grok Bot · branch `grokbot/career-card-figurine` · base: `b265a68` (main dopo #69).

## Fonte dei dati
- **Unica fonte:** la voce d'archivio `ArchiveCareer` (`pivot-v2-archive`) scritta a fine carriera da `toArchive()` (engine.ts, non modificato) + il campo opzionale `legacy` (`LegacyFacts`, v1) copiato dal `PlayerState` finito in `PivotApp` con `withLegacyFacts()`.
- `legacy` contiene solo fatti già registrati dal motore: maglia, nazionalità, ruolo, scelta e squadra del draft, percorso, totali del motore (`careerPoints` …), contatori premi. Nessun calcolo nuovo.
- Medie = quelle della carta già calcolate dal motore (`card.ppg/rpg/apg`). Età finale = età dell'ultima stagione registrata (TASKS.md), non `PlayerState.age` dopo l'offseason.
- Dati mancanti (archivi vecchi, fixture senza stagioni) → campo omesso, mai inventato.
- Il campo `legacy` è additivo e facoltativo: `normalizeArchiveEntry` lo conserva (spread), `sanitizeLegacyFacts` lo rilegge in modo difensivo. Non entra nel fingerprint della carta. Nessuna migrazione: gli archivi precedenti restano leggibili (test e2e «legacy archive entry»).
- Unica modifica al flusso di gioco: il log della chiamata al draft nel percorso giocato salva anche la squadra (`"14ª · Utah Jazz"`), come già faceva la simulazione rapida.

## Componenti
- `src/lib/pivot/legacy-report.ts`: `LegacyFacts`, `buildLegacyReport(entry)`, `cardFaceOf(report)`. Puro, non importa motore/RNG.
- `src/lib/pivot/legacy-i18n.ts`: testi IT/EN e narrativa finale (solo fatti registrati).
- `src/lib/pivot/cosmetics.ts`: catalogo temi, flag spenti, `checkout()` che risponde sempre «not-configured».
- `src/components/pivot/legacy/LegacyExperience.tsx` (chunk lazy, ~7,6 kB gzip + 1,8 kB CSS): carta + tema + export + report. Sostituisce `CareerCardPanel` e l'elenco stagioni in `ResultView`/`ArchiveView`.
- `src/components/pivot/legacy/exportPng.ts`: export PNG 1080×1350 con Canvas 2D, nessuna dipendenza, nessun server.

## Temi cosmetici
- Chiave separata `pivot-v2-card-theme` (solo id tema). Mai nel salvataggio, mai nell'archivio, mai nel motore.
- Gratis: «Grafite» (standard), «Ossidiana». Prototipi (non visibili in produzione, flag `previewCatalog` spento): «Cornice bronzo», «Parquet notturno» — etichettati «Prototipo · non in vendita», non salvabili.
- Nessun prezzo, provider, ricevuta o acquisto simulato.

## Export PNG
Canvas 2D, font atteso con `document.fonts.ready`, testo adattato/ellissato per non uscire dai bordi. Fallback: messaggio «fai uno screenshot» se canvas/toBlob non esistono o falliscono. Verificato su Chromium desktop e 390 px (download reale, PNG valido 1080×1350, chunk IEND). Non verificato: Safari/iOS, Firefox, telefoni reali.

## Per il Demo Gate Bot
- **Interfacce:** `ArchiveCareer.legacy?: LegacyFacts` (types.ts), `withLegacyFacts(entry, player)`, `buildLegacyReport(entry)`, `CARD_THEME_KEY`.
- **File toccati condivisi:** `PivotApp.tsx` (scrittura archivio 2 punti, log draft, ResultView/ArchiveView), `types.ts` (un campo opzionale), `i18n.ts` (una chiave), `narrative.test.ts` (esclusione dizionari bilingui), `demo-readiness.spec.ts` (selettore età 36 reso univoco: ora l'età compare anche nelle tappe).
- **Selettori e2e stabili:** `region "Career Card"`, `[data-career-card]`, `[data-career-id]`, `[data-legacy-report]`, `[data-theme-option]`, `[data-export-png]`.
- **Limiti:** nessuna «ragione del ritiro» nell'archivio (non registrata) → non mostrata. Etichetta bust D-08: valutata a fine carriera via `careerBust()` (#71 su main; wiring Legacy Report in `grokbot/bust-label-legacy`).
