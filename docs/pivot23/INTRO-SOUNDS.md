# PIVOT 23 — Suoni dell'intro (palleggi e canestro)

Richiesta di Pello (2026-10-03): sulla premiere della home, due palleggi e poi il pallone che entra nel
canestro con lo "ciuffo" (swish), sincronizzati con l'animazione.

## Come sono fatti i suoni e licenza

- **Sintesi procedurale con la Web Audio API**, al momento della riproduzione (`apps/pivot23/src/intro-sound/synth.ts`).
  Nessun campione, nessun file audio, nessuna richiesta di rete: oscillatori + rumore bianco con seed fisso.
- Sono quindi **originali di questo repository** e coperti dalla stessa licenza del codice. Nessun asset di terzi,
  nessuna attribuzione richiesta. Peso degli asset audio: **0 byte** (solo codice: ~24 kB di sorgente commentato, pochi kB minificati nel bundle).
- Palleggio (parquet): tonfo del corpo con caduta di pitch 165→62 Hz (la palla che si schiaccia), "pang" della
  camera d'aria (392 Hz + 960 Hz, decadimento rapido), schiocco gomma-su-vernice (rumore passa-banda 1,75 kHz, 35 ms),
  tonfo del legno (rumore passa-basso 320 Hz) e un riverbero corto da palestra (convolver con IR sintetica di 0,45 s).
  Il **secondo palleggio è diverso**: −2 dB, pitch +7 %, coda −12 %, schiocco più brillante (2,15 kHz).
- Swish senza ferro: sweep di rumore passa-banda 1,3→4,3→2,3 kHz con tremolo da "maglie della retina" (34→22 Hz),
  strato d'aria passa-alto 5,2 kHz, spinta morbida passa-basso (la palla che riempie la retina) e un fruscio più
  piccolo quando la retina torna giù. Nessuna componente tonale (niente "clang" del ferro): verificato da test.
- Catena master: compressore leggero, volume 0,7. Loudness misurata: palleggi ≈ −22/−24 LUFS, swish ≈ −19 LUFS, picco −2,2 dBFS.

## Tempi (sincronizzati con la premiere)

Tempi in ms dall'inizio dell'animazione `cineReveal` del marchio in home (`src/styles.css`), calcolati dal CSS
reale al momento dell'evento `animationstart` (se la premiere cambia durata, i suoni si spostano con lei):

| Cue | ms | Battuta visiva |
| --- | --- | --- |
| Palleggio 1 | **700** | ritardo di `cineArc`: il bagliore si accende sui due archi; il sipario (PR #28) è appena uscito (~670 ms) |
| Palleggio 2 | **1260** | keyframe 20 % di `cineReveal`: il marchio è pieno e parte l'assestamento (zoom 1,16→1) |
| Swish | **2400** | l'assestamento (cubic-bezier(0.16, 1, 0.3, 1)) ha percorso ≈80 %: il marchio "atterra" |

560 ms tra i palleggi (ritmo naturale), ~1,1 s di "tiro" prima dello swish, coda finita a ~3,0 s, ben prima
della fine della premiere (6,3 s). Premiere corta da 1,6 s (visita di ritorno / dispositivo lento): troppo
veloce per un palleggio credibile, quindi solo lo swish sullo stesso punto di atterraggio (610 ms).
La riproduzione usa l'orologio dell'animazione (`Animation.currentTime`) e compensa la latenza d'uscita.

## Autoplay: cosa succede davvero

I browser non lasciano partire l'audio senza un gesto dell'utente. Quindi:

1. **Prima visita senza interazione: l'intro è muta.** Al caricamento non viene creato nessun AudioContext,
   nessun nodo, niente. Non parte nulla più tardi da solo.
2. Al **primo click / tap / tasto** (con suoni attivi) viene creato e ripreso l'AudioContext. Se la premiere è
   ancora in corso, i cue **ancora davanti** suonano in sync (es. click a 900 ms → palleggio 2 a 1260 e swish a 2400);
   quelli già passati vengono saltati (tolleranza 90 ms). Il gesto più comune per sentire tutto è toccare lo
   schermo o il chip "Suoni" nei primi istanti.
3. Se il primo gesto è **Salta** o **Inizia**, non suona nulla (il controllo avviene dopo il click).
4. **Salta, Inizia, fine premiere, disattivazione suoni, scheda nascosta** fermano subito i suoni (rampa di 25 ms,
   stop delle sorgenti, disconnessione dei nodi, AudioContext sospeso a fine coda).
5. La sequenza in sync suona **al massimo una volta per caricamento**: tornando alla home non si ripete.
6. **prefers-reduced-motion**: niente premiere e suoni spenti di default. Solo un'attivazione esplicita del chip
   li riproduce (una volta, come conferma).
7. Ogni punto di ingresso è protetto da try/catch: niente eccezioni, niente blocchi dell'interfaccia; senza Web Audio
   (browser molto vecchi) semplicemente non suona.

## Interruttore Suoni

Chip in alto a sinistra della home (specchio di "Salta"), visibile anche dopo la premiere. `aria-pressed`,
nome accessibile "Suoni dell'intro" / "Sounds of the intro", title con lo stato (IT/EN). Preferenza salvata in
`localStorage["pivot23.introSound"]` (`on` / `off`). Attivandolo fuori dalla premiere si sente la sequenza una volta.
Stringhe in `src/intro-sound/SoundToggle.tsx` (non in `i18n.ts`, per non sovrapporsi alla PR #32).

## CSP

Nessuna modifica a `vercel.json`. La Web Audio sintetizza in memoria (`createBuffer`, oscillatori): nessun `fetch`,
nessun elemento `<audio>`, nessun URL `data:`/`blob:`, quindi `default-src 'self'` (che copre `media-src`) e
`script-src 'self'` vanno bene così. Verificato in e2e sulla build di produzione con gli header di `vercel.json`:
zero violazioni CSP, zero errori in console, anche con Web Audio reale.

## Anteprime e rigenerazione

- `node scripts/render-intro-sounds.mjs out.wav [--short]` rende offline (OfflineAudioContext di Chromium) lo
  **stesso codice** che suona nel browser; t = 0 del WAV = inizio premiere.
- Il video con audio è una registrazione Playwright della premiere (senza audio, i browser headless non lo
  catturano) a cui è stato affiancato il WAV allineato all'inizio della premiere (offset misurato 153 ms, ±40 ms).
