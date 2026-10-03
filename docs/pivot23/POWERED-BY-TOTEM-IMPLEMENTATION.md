# Powered by Totem

Stato: implementato su `feature/web-totem`. Non è un link. Non è un annuncio. Non porta a un sito esterno, perché non è stato indicato un indirizzo.

## Dove sta

| Larghezza | Dove | Perché |
|---|---|---|
| Sotto i 1180 px | Una riga in fondo alla Home, classe `totem-home` | Fa parte dell'intro. Non è una barra fissa |
| Da 1180 px | La stessa frase nel piede `.ad-foot`, già alto 72 px | Resta visibile mentre si naviga, senza una seconda barra |
| Carriera sotto i 1180 px | Non c'è | La Home è smontata e il piede resta `display: none` |

Il testo è «Powered by Totem», 11 px, maiuscolo, colore già usato per le didascalie. Non riceve clic. Non copre i pulsanti: è sotto «Come si gioca», nel flusso della pagina.

La riga della Home è nascosta da 1180 px in su, così non compare due volte.

## Cosa non è stato fatto

Nessun logo Totem, perché non c'è un file nel repository. Nessuna barra fissa sul telefono. I binari «Riservato» non sono stati riempiti.
