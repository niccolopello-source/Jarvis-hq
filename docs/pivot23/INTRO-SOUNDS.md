# PIVOT 23 — Suoni dell'intro (palleggi e canestro)

Richiesta di Pello (2026-10-03, aggiornata 2026-10-04): sulla premiere della home, i palleggi e poi il pallone che entra nel
canestro con lo "ciuffo" (swish) devono andare **insieme** all'immagine, più a lungo, più fluidi e più incisivi.

## Diagnosi del taglio da 6,3 s

- L'immagine era solo uno zoom del marchio (`scale 1.16 → 1`) con un bagliore sugli archi nei primi 3 s.
- I suoni (due palleggi a 700 e 1260 ms, swish a 2400 ms) finivano circa 3 secondi prima della premiere.
- Non c'era un pallone, quindi i suoni non erano montati su un'azione. Il cubic-bezier scaricava quasi tutto il
  movimento all'inizio e lasciava il marchio fermo.

## Taglio attuale (9,2 s)

Il pallone, l'ombra, la retina e il bagliore degli archi sono keyframe **lineari** della stessa premiere.
I tempi dei suoni sono le custom property CSS `--beat-*`: se si sposta un beat, si spostano picture e audio.

| Cue | ms | Battuta visiva |
| --- | --- | --- |
| Palleggio 1 | **1150** | il pallone schiaccia sul parquet (ombra larga) |
| Palleggio 2 | **2050** | secondo rimbalzo, più leggero e più alto |
| Palleggio 3 | **2800** | gather, l'ultimo palleggio prima del tiro |
| Swish | **4850** | il pallone attraversa il marchio; la retina e gli archi si aprono (il ciuffo) |

900 ms e 750 ms tra i palleggi, circa 2 s di volo, coda dello swish finita prima dei 6 s. La premiere resta fino a
9,2 s per far rientrare il 23 e consegnare il marchio allo sweep. Premiere corta da 1,6 s (visita di ritorno /
dispositivo lento): solo lo swish a 610 ms, niente pallone. `prefers-reduced-motion`: niente premiere e niente pallone.

## Come sono fatti i suoni e licenza

- **Sintesi procedurale con la Web Audio API**, al momento della riproduzione (`apps/pivot23/src/intro-sound/synth.ts`).
  Nessun campione, nessun file audio, nessuna richiesta di rete: oscillatori + rumore bianco con seed fisso.
- Sono quindi **originali di questo repository** e coperti dalla stessa licenza del codice. Nessun asset di terzi,
  nessuna attribuzione richiesta. Peso degli asset audio: **0 byte**.
- Palleggio (parquet): tonfo del corpo, "pang" della camera d'aria, schiocco gomma-su-vernice, tonfo del legno,
  riverbero corto da palestra. Il secondo è più leggero e più acuto. Il terzo (gather) è più grave, più forte e più corto.
- Swish senza ferro: sweep di rumore, tremolo da maglie della retina, strato d'aria, spinta morbida e **due**
  fruscii (la retina che prende il pallone e quella che si richiude: il ciuffo). Nessuna componente tonale.
- Catena master: compressore leggero, un po' più di room rispetto al taglio precedente, così palleggi e ciuffo
  stanno nella stessa palestra. Volume 0,78.

## Tempi (sincronizzati con la premiere)

I millisecondi della tabella sopra sono `--beat-b1`, `--beat-b2`, `--beat-b3` e `--beat-swish` su
`.court-mark-live.is-premiere` in `src/styles.css`. Il controller li legge a `animationstart` di `cineReveal`.
La riproduzione usa l'orologio dell'animazione (`Animation.currentTime`) e compensa la latenza d'uscita.

## Autoplay: cosa succede davvero

I browser non lasciano partire l'audio senza un gesto dell'utente. Quindi:

1. **Prima visita senza interazione: l'intro è muta.** Al caricamento non viene creato nessun AudioContext,
   nessun nodo, niente. Non parte nulla più tardi da solo.
2. Al **primo click / tap / tasto** (con suoni attivi) viene creato e ripreso l'AudioContext. Se la premiere è
   ancora in corso, i cue **ancora davanti** suonano in sync (es. un gesto a 1,5 s → palleggio 2, palleggio 3 e swish);
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
