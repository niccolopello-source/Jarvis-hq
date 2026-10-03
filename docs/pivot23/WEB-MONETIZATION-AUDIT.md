# Audit delle bande laterali

Stato: 2026-10-03. Nessun annuncio è stato acceso. Nessun SDK è stato aggiunto.

Etichette: CONFIRMED è stato letto nel sorgente o osservato in un browser. REPORTED è ciò che Pello ha descritto. POTENTIAL RISK non è stato riprodotto. NOT VERIFIED non è stato misurato.

## Cosa sono

CONFIRMED nel sorgente di `main` `5d00647`. In `PivotApp.tsx` ci sono due `<aside class="ad-rail">` e un `<div class="ad-foot">`. Il commento nel CSS dice che sono riservati, vuoti e non interattivi.

Non sono componenti AdSense. Non hanno uno slot, uno script o un `iframe`. Contengono la parola «Riservato». `aria-hidden="true"` e `pointer-events: none`. Sotto i 1180 px il CSS li mette a `display: none`.

## Misure

CONFIRMED dal CSS, viewport da 1180 px in su:

| Pezzo | Regola |
|---|---|
| Griglia | tre colonne: `minmax(72px, 1fr)`, centro fino a `min(880px, 76vw)`, `minmax(72px, 1fr)` |
| Righe | il gioco prende lo spazio rimanente, il piede è alto 72 px |
| Binario | flex, testo in basso, padding 24 px 16 px 28 px, bordo laterale, 10 px, maiuscolo |
| Piede | bordo superiore, tutta la larghezza, prima di questo lavoro era vuoto |

Il centro non scende sotto il 76% della finestra, con un tetto di 880 px. I binari prendono ciò che resta e non scendono sotto i 72 px. Non coprono il gioco: sono colonne sorelle, non overlay.

Sotto i 1180 px i binari non occupano spazio. CONFIRMED dalla media query.

Un controllo Playwright a 1440×900, dopo la modifica di questo branch, ha letto due binari, ciascuno largo almeno 72 px, con il testo «Riservato». Il numero esatto di pixel dipende dalla finestra e non è stato fissato come soglia.

## Produzione

CONFIRMED il 2026-10-03: `https://pivot23.vercel.app` risponde 200. L'HTML pubblicato contiene `bootSweep`. Il bundle `index-WJd9g_7Y.js` contiene ancora `hardwareConcurrency<=4`. Quel sito non include le modifiche di questo branch. NOT VERIFIED un giro visivo a mano sulla produzione dopo questa correzione, perché non c'è stato un deploy.

## Raccomandazione

Non attivare un provider. Lo spazio c'è solo da desktop largo, ed è esterno al gioco. Se un giorno si accende, l'unità sta dentro il binario, dopo un consenso, e sparisce sotto i 1180 px. Niente formato che copra la carta, il grafico o un pulsante.
