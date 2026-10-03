# Audit dell'animazione iniziale

REPORTED: Pello non vede correttamente l'animazione iniziale. CONFIRMED una causa nel codice pubblicato. Non è stata confermata una schermata nera.

## Cosa c'è nel codice

| Animazione | Dove | Durata | Quando parte |
|---|---|---|---|
| `bootSweep` | `index.html`, arco sul 23 di avvio | 2,2 s, una volta | Finché React non sostituisce `#app` |
| `bootIn` | la parola «PIVOT 23» nello stesso avvio | 0,7 s | Come sopra |
| `markSweep` | archi del marchio in Home, classe `is-sweep` | 2,8 s, poi ogni 16 s se visibile | Dopo il mount, se il movimento non è ridotto |
| `markLean` | lo stesso marchio, se `html.pivot-lean` | 0,45 s, solo opacità | Al posto di `markSweep` |
| `markArc` | icona di salvataggio | rotazione continua | Non è l'intro |

`prefers-reduced-motion` nell'HTML ferma `bootSweep` e `bootIn`. Nel componente, il marchio non riceve `is-sweep`. Da questo branch anche il CSS ferma gli archi e l'icona di salvataggio, anche se la classe `pivot-lean` è presente.

Non c'è un'animazione JavaScript a parte l'aggiunta della classe. Nessun asset esterno. Nessuna dipendenza oltre al CSS.

## Perché si vede male

CONFIRMED nel bundle di produzione `index-WJd9g_7Y.js`: la classe `pivot-lean` si accende se `hardwareConcurrency` è tra 1 e 4. Con quella classe il marchio non ruota. Fa un fade di 0,45 s. Un telefono o un portatile che dichiara 4 core non mostra il giro.

CONFIRMED nel sorgente: `bootSweep` vive solo nell'HTML statico. Appena il modulo è pronto, React sostituisce la pagina. Su un caricamento già in cache il giro da 2,2 s non fa in tempo a finire. Non è un buco nero: sotto c'è il 23 e la frase «Avvio dell'applicazione…». Non è stata aggiunta un'attesa artificiale, perché l'avvio deve restare immediato.

Il test browser vede `bootSweep` solo se ritarda il modulo di 1,5 s. Senza quel ritardo la Home arriva prima.

POTENTIAL RISK: una cache del browser può tenere il bundle vecchio, quello con la soglia a 4. NOT VERIFIED sul dispositivo di Pello.

## Correzione

`pivot-lean` ora si accende solo con 1 o 2 core. Il movimento ridotto non usa più quella classe: ha una regola CSS propria, `animation: none`.

Un dispositivo a 4 core, simulato in Playwright, mostra `markSweep` e non ha `pivot-lean`. «Inizia» resta subito cliccabile. Non c'è uno schermo nero di attesa.

## Intro granata, 2026-10-03

Il marchio di avvio non è più un anello da 72 px con `bootSweep`. È lo stesso segno di `CourtMark`: cerchio, due archi, stanghette laterali e il 23. Vive nell'HTML, senza un file esterno.

Lo sfondo è `#0c0b0d`. Il granata è il token già presente: `#6C1320` come `--color-granata` e `#A31D2E` come inchiostro del segno, perché il granata più scuro non si legge sul nero. Il movimento unico è `bootArc`: un riflesso percorre gli archi una volta, in 2,2 s, poi sparisce. Il segno resta intero anche prima. React sostituisce la pagina appena il modulo è pronto. Non c'è un timer che trattiene la Home.

`prefers-reduced-motion` spegne `bootArc` e lascia il segno fermo. Se `main.tsx` non arriva, restano il segno, la frase di avvio e il link «Ricarica PIVOT 23».

Misure, headless Chromium, Linux, 2 core, Vite locale, non un telefono. Marchio largo 281 px a 390, 420 px a 768 e a 1440, dentro lo schermo. Sessanta fotogrammi a riposo: media 16 ms, picco 17 ms. Durante la suite, con la CPU occupata, un picco è arrivato a 83 ms. «Inizia» ha accettato il click di prova in 487 ms. First contentful paint 60 ms. Nessun errore JavaScript in quel giro.

Non verificato: un telefono, e l'anteprima Vercel di questo branch.
