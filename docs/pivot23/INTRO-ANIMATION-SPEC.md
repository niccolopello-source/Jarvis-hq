# INTRO ANIMATION SPEC — 2026-10-04

Direzione approvata nel mandato, non ancora implementata. Questa scheda non dichiara l'approvazione visiva del risultato.

## Codice attuale

- Boot statico in `apps/pivot23/index.html`: campo scuro `#0c0b0d`, marchio SVG, gleam sul tratto. Il testo di caricamento arriva dopo 1,6 s.
- `src/intro.ts`: al mount sposta `#boot` e lo fa uscire. Modalità `full` / `brief` / `still`. Skip su pointer, tasto o Escape. `prefers-reduced-motion` riduce a fade.
- Audio: `src/intro-sound/synth.ts` e `timeline.ts`. Non è un file audio misurato. I timestamp non vanno inventati su un wav assente.
- Durata curtain: massimo 1,5 s, fallback di sicurezza a 8 s.

## Sequenza richiesta, non costruita

1. Campo pieno coerente col tema di sistema. Oggi il boot è sempre scuro.
2. Primo palleggio: il marchio si forma.
3. Secondo palleggio: il marchio si completa.
4. Assestamento sul suono del canestro.
5. Hold breve.
6. Transizione alla home.

Il pallone che palleggia resta asset futuro, non il centro dell'intro.

## Blocco

Manca l'asset audio approvato nel repo da cui misurare i transienti. Finché non c'è, la sincronizzazione non si implementa. Il synth attuale va preservato come identità finché l'utente non consegna il file.

## Non fatto

Nessuna nuova animazione è stata mergiata. Nessun test dispositivo. Riduzione motion e skip esistono già nel curtain.
